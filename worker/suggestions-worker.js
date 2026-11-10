// Padri Kalan suggestion relay — a free Cloudflare Worker.
// The website's form sends messages (and optional photos/videos) here. This Worker files each
// message as a GitHub issue in a PRIVATE repository, saves attachments in that repo under
// uploads/, and links them on the issue. The GitHub token lives only in Cloudflare (as a
// secret), never in the website's code. Villagers need no account.
//
// Settings (Cloudflare → your Worker → Settings → Variables and Secrets):
//   GITHUB_TOKEN    (Secret) fine-grained token on ONE private repo with
//                            "Issues: Read and write" and "Contents: Read and write"
//   GITHUB_REPO     (Text)   e.g. adarshLabs/padri-kalan-suggestions
//   ALLOWED_ORIGINS (Text)   e.g. https://adarshlabs.github.io   (comma-separate if more than one)
//
// See worker/SETUP.md for step-by-step instructions.

const LIMITS = { message: 4000, type: 80, name: 80, contact: 120 };
const MAX_FILES = 5;                       // per message
const MAX_PHOTO_B64 = 14 * 1024 * 1024;    // ≈ 10 MB photo after base64 encoding
const MAX_VIDEO_B64 = 27 * 1024 * 1024;    // ≈ 20 MB video after base64 encoding
const PHOTO_EXT = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
const VIDEO_EXT = ['mp4', 'mov', 'm4v', '3gp', 'webm'];
const UPLOAD_WINDOW_MS = 30 * 60 * 1000;   // attachments must follow the message within 30 min
const PER_IP_PER_HOUR = 10;                // best-effort spam brake on messages
const recent = new Map();
const enc = new TextEncoder();

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}
// Stop accidental @mentions / #links in villagers' text from pinging GitHub users.
function defang(s) {
  return s.replace(/@/g, '@​').replace(/#(\d)/g, '#​$1');
}
function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}
function rateLimited(ip) {
  const now = Date.now(), hour = 3600e3;
  const list = (recent.get(ip) || []).filter(t => now - t < hour);
  list.push(now); recent.set(ip, list);
  return list.length > PER_IP_PER_HOUR;
}
function gh(env, path, init) {
  return fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'padri-kalan-suggestion-relay',
      'Content-Type': 'application/json',
      ...(init && init.headers)
    }
  });
}
// Signed, short-lived upload key so only the browser that sent a message can attach files to it.
async function sign(env, text) {
  const key = await crypto.subtle.importKey('raw', enc.encode(env.GITHUB_TOKEN), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(text));
  return [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function makeUploadKey(env, issue) {
  const exp = Date.now() + UPLOAD_WINDOW_MS;
  return exp + '.' + await sign(env, issue + '.' + exp);
}
async function checkUploadKey(env, issue, key) {
  const [exp, sig] = String(key || '').split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = await sign(env, issue + '.' + exp);
  if (good.length !== sig.length) return false;
  let diff = 0; for (let i = 0; i < good.length; i++) diff |= good.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

async function handleMessage(request, env, cors) {
  let d;
  try { d = await request.json(); } catch (e) { return json({ success: false, error: 'Bad JSON' }, 400, cors); }
  if (d.botcheck) return json({ success: true }, 200, cors); // honeypot: pretend success, drop it

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (rateLimited(ip)) return json({ success: false, error: 'Too many messages, try later' }, 429, cors);

  const message = clean(d.message, LIMITS.message);
  if (!message) return json({ success: false, error: 'Empty message' }, 400, cors);
  if (d.consent !== 'yes') return json({ success: false, error: 'Consent required' }, 400, cors);

  const type = clean(d.type, LIMITS.type) || 'Other';
  const name = clean(d.name, LIMITS.name) || '(not given)';
  const contact = clean(d.contact, LIMITS.contact) || '(not given)';
  const lang = d.lang === 'en' ? 'English' : 'Hindi';
  const files = Math.max(0, Math.min(MAX_FILES, parseInt(d.files, 10) || 0));

  const firstLine = message.replace(/\s+/g, ' ').slice(0, 60);
  const title = `[${type}] ${defang(firstLine)}${message.length > 60 ? '…' : ''}`;
  const body = [
    `**Type:** ${defang(type)}`,
    `**Name:** ${defang(name)}`,
    `**Contact (private, never publish):** ${defang(contact)}`,
    `**Site language:** ${lang}`,
    `**Consent to use on website:** yes`,
    files ? `**Attachments:** ${files} (each appears below as a comment)` : '',
    '',
    '**Message:**',
    '',
    defang(message).split('\n').map(l => '> ' + l).join('\n'),
    '',
    '---',
    '_Sent from the Padri Kalan website suggestion form._'
  ].filter(l => l !== null).join('\n');

  const r = await gh(env, '/issues', { method: 'POST', body: JSON.stringify({ title, body }) });
  if (!r.ok) return json({ success: false, error: 'GitHub refused (' + r.status + ')' }, 502, cors);
  const issue = (await r.json()).number;
  const out = { success: true, issue };
  if (files) out.uploadKey = await makeUploadKey(env, issue);
  return json(out, 200, cors);
}

// Body = the file as base64 text. It is streamed straight to GitHub without being read here,
// which keeps the Worker within the free plan's CPU limit even for videos.
async function handleUpload(request, env, cors, url) {
  const issue = parseInt(url.searchParams.get('issue'), 10);
  const n = parseInt(url.searchParams.get('n'), 10);
  if (!issue || !(n >= 1 && n <= MAX_FILES)) return json({ success: false, error: 'Bad upload' }, 400, cors);
  if (!(await checkUploadKey(env, issue, url.searchParams.get('key')))) return json({ success: false, error: 'Upload key expired' }, 403, cors);

  const rawName = clean(url.searchParams.get('name'), 120) || 'file';
  const ext = (rawName.split('.').pop() || '').toLowerCase();
  const kind = PHOTO_EXT.includes(ext) ? 'photo' : VIDEO_EXT.includes(ext) ? 'video' : null;
  if (!kind) return json({ success: false, error: 'File type not allowed' }, 415, cors);

  const len = Number(request.headers.get('content-length')) || Number(url.searchParams.get('size')) || 0;
  if (!len || !request.body) return json({ success: false, error: 'Empty file' }, 400, cors);
  if (len > (kind === 'photo' ? MAX_PHOTO_B64 : MAX_VIDEO_B64)) return json({ success: false, error: 'File too large' }, 413, cors);

  const safe = rawName.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || kind;
  const path = `uploads/issue-${issue}/${n}-${safe}.${ext}`;

  const prefix = enc.encode(`{"message":"Attachment ${n} for suggestion #${issue}","content":"`);
  const suffix = enc.encode('"}');
  const { readable, writable } = new FixedLengthStream(prefix.length + len + suffix.length);
  const pump = (async () => {
    let w = writable.getWriter(); await w.write(prefix); w.releaseLock();
    await request.body.pipeTo(writable, { preventClose: true });
    w = writable.getWriter(); await w.write(suffix); await w.close();
  })();
  const put = gh(env, '/contents/' + path.split('/').map(encodeURIComponent).join('/'), { method: 'PUT', body: readable });
  const [, r] = await Promise.all([pump.catch(e => e), put]);
  if (!r.ok) return json({ success: false, error: 'GitHub refused file (' + r.status + ')' }, 502, cors);

  const link = `https://github.com/${env.GITHUB_REPO}/blob/main/${path}`;
  const label = kind === 'photo' ? `📷 Photo ${n}` : `🎬 Video ${n}`;
  const comment = kind === 'photo'
    ? `${label}: [${safe}.${ext}](${link})\n\n<img src="${link}?raw=true" width="420">`
    : `${label}: [${safe}.${ext}](${link}) — open the link to watch or download.`;
  await gh(env, `/issues/${issue}/comments`, { method: 'POST', body: JSON.stringify({ body: comment }) });
  return json({ success: true }, 200, cors);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
    const originOk = allowed.length === 0 || allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': originOk && origin ? origin : (allowed[0] || '*'),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ success: false, error: 'Use POST' }, 405, cors);
    if (!originOk) return json({ success: false, error: 'Origin not allowed' }, 403, cors);
    if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return json({ success: false, error: 'Relay not configured' }, 500, cors);

    if (url.pathname.replace(/\/+$/, '') === '/upload') return handleUpload(request, env, cors, url);
    return handleMessage(request, env, cors);
  }
};
