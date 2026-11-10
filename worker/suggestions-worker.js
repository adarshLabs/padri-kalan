// Padri Kalan suggestion relay — a free Cloudflare Worker.
// The website's form sends messages here; this Worker files each one as a GitHub issue
// in a PRIVATE repository. The GitHub token lives only in Cloudflare (as a secret),
// never in the website's code. Villagers need no account.
//
// Settings (Cloudflare → your Worker → Settings → Variables and Secrets):
//   GITHUB_TOKEN    (Secret) fine-grained token with "Issues: Read and write" on ONE private repo
//   GITHUB_REPO     (Text)   e.g. adarshLabs/padri-kalan-suggestions
//   ALLOWED_ORIGINS (Text)   e.g. https://adarshlabs.github.io   (comma-separate if more than one)
//
// See worker/SETUP.md for step-by-step instructions.

const LIMITS = { message: 4000, type: 80, name: 80, contact: 120 };
const PER_IP_PER_HOUR = 10; // best-effort spam brake
const recent = new Map();

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

export default {
  async fetch(request, env) {
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

    const firstLine = message.replace(/\s+/g, ' ').slice(0, 60);
    const title = `[${type}] ${defang(firstLine)}${message.length > 60 ? '…' : ''}`;
    const body = [
      `**Type:** ${defang(type)}`,
      `**Name:** ${defang(name)}`,
      `**Contact (private, never publish):** ${defang(contact)}`,
      `**Site language:** ${lang}`,
      `**Consent to use on website:** yes`,
      '',
      '**Message:**',
      '',
      defang(message).split('\n').map(l => '> ' + l).join('\n'),
      '',
      '---',
      '_Sent from the Padri Kalan website suggestion form._'
    ].join('\n');

    const gh = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'padri-kalan-suggestion-relay',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, body })
    });

    if (!gh.ok) return json({ success: false, error: 'GitHub refused (' + gh.status + ')' }, 502, cors);
    return json({ success: true }, 200, cors);
  }
};
