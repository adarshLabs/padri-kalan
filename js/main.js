(function () {
  'use strict';
  var root = document.documentElement;
  var cfg = window.SITE_CONFIG || {};

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lang() { return root.dataset.lang === 'en' ? 'en' : 'hi'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function pick(obj, key) { // bilingual field: {hi:"..", en:".."} or plain string
    var v = obj[key];
    if (v && typeof v === 'object') return v[lang()] || v.hi || v.en || '';
    return v || '';
  }

  // ---- Language ----
  function $(id) { return document.getElementById(id); }
  function on(id, ev, fn) { var el = $(id); if (el) el.addEventListener(ev, fn); }
  var langBtn = $('langBtn');
  if (langBtn) langBtn.addEventListener('click', function () {
    var next = lang() === 'hi' ? 'en' : 'hi';
    root.dataset.lang = next; root.lang = next; store('pk-lang', next);
    renderAll();
  });

  // ---- Theme ----
  on('themeBtn', 'click', function () {
    var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    var next = dark ? 'light' : 'dark';
    root.dataset.theme = next; store('pk-theme', next);
  });

  // ---- Mobile menu ----
  var menuBtn = $('menuBtn'), nav = $('nav');
  if (menuBtn && nav) menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  if (nav) nav.addEventListener('click', function (e) { if (e.target.closest('a')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });

  // ---- Contribute links ----

  // ---- Suggestion form (no account needed; filed as a private GitHub issue via the relay) ----
  // Attachment limits (common practice for community forms):
  //   up to 5 files per message; photos up to 10 MB each, sent as the original file (no compression);
  //   at most 1 video, up to 20 MB and 1 minute.
  var FILE_LIMITS = { maxFiles: 5, photoMB: 10, videoMB: 20, videoSeconds: 60, maxVideos: 1 };
  var form = $('suggestForm');
  if (form) {
    var status = $('f-status'), sendBtn = $('f-send'), fileInput = $('f-files'), fileList = $('f-filelist');
    var picked = []; // { file, kind, seconds }
    var M = {
      noMsg: { hi: 'कृपया अपना संदेश लिखें।', en: 'Please write your message.' },
      noConsent: { hi: 'कृपया सहमति वाले बॉक्स पर निशान लगाएँ।', en: 'Please tick the consent box.' },
      sending: { hi: 'संदेश भेजा जा रहा है…', en: 'Sending your message…' },
      ok: { hi: '✅ धन्यवाद! आपका संदेश वेबसाइट टीम तक पहुँच गया है।', en: '✅ Thank you! Your message has reached the website team.' },
      okFiles: { hi: '✅ धन्यवाद! आपका संदेश और सभी फ़ाइलें पहुँच गई हैं।', en: '✅ Thank you! Your message and all files have arrived.' },
      partFiles: { hi: '⚠️ संदेश पहुँच गया, पर कुछ फ़ाइलें नहीं जा सकीं। अच्छे नेटवर्क में दोबारा भेजें।', en: '⚠️ Your message arrived, but some files could not be sent. Try again on a better network.' },
      fail: { hi: '❌ संदेश नहीं जा सका। इंटरनेट जाँचकर दोबारा कोशिश करें।', en: '❌ The message could not be sent. Check your internet and try again.' },
      notSetup: { hi: 'फ़ॉर्म अभी चालू नहीं हुआ है। कृपया कुछ दिन बाद कोशिश करें।', en: 'The form is not switched on yet. Please try again in a few days.' },
      tooMany: { hi: 'एक बार में अधिकतम 5 फ़ाइलें।', en: 'At most 5 files per message.' },
      oneVideo: { hi: 'एक संदेश में सिर्फ़ 1 वीडियो।', en: 'Only 1 video per message.' },
      bigPhoto: { hi: 'फ़ोटो 10 MB से बड़ी है।', en: 'Photo is larger than 10 MB.' },
      bigVideo: { hi: 'वीडियो 20 MB से बड़ा है। छोटा वीडियो भेजें।', en: 'Video is larger than 20 MB. Please send a shorter one.' },
      longVideo: { hi: 'वीडियो 1 मिनट से लंबा है।', en: 'Video is longer than 1 minute.' },
      badType: { hi: 'सिर्फ़ फ़ोटो या वीडियो भेजें।', en: 'Only photos or videos, please.' },
      noFilesHere: { hi: 'फ़ाइलें भेजने की सुविधा अभी चालू नहीं है; सिर्फ़ संदेश भेजा जाएगा।', en: 'File sending is not switched on yet; only the message will be sent.' },
      remove: { hi: 'हटाएँ', en: 'Remove' }
    };
    var tt = function (k) { return M[k][lang()]; };
    var say = function (text, cls) { status.textContent = text; status.className = 'form-status ' + (cls || ''); };
    if (cfg.contactEmail) { var pe = $('photoEmail'); if (pe) { pe.hidden = false; var a = pe.querySelector('a'); a.href = 'mailto:' + cfg.contactEmail; a.textContent = cfg.contactEmail; } }

    var relayUrl = function () {
      var u = String(cfg.suggestionsUrl || '').trim();
      if (!u) return '';
      if (!/^https?:\/\//i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
      return u.replace(/\/+$/, '');
    };
    var mb = function (n) { return (n / 1048576).toFixed(n < 1048576 ? 2 : 1) + ' MB'; };
    var kindOf = function (f) {
      var ext = (f.name.split('.').pop() || '').toLowerCase();
      if (/^image\//.test(f.type) || /^(jpe?g|png|webp|heic|heif)$/.test(ext)) return 'photo';
      if (/^video\//.test(f.type) || /^(mp4|mov|m4v|3gp|webm)$/.test(ext)) return 'video';
      return null;
    };
    var videoSeconds = function (f) {
      return new Promise(function (res) {
        var v = document.createElement('video'), url = URL.createObjectURL(f), done = false;
        var finish = function (s) { if (done) return; done = true; URL.revokeObjectURL(url); res(s); };
        v.preload = 'metadata'; v.muted = true;
        v.onloadedmetadata = function () { finish(isFinite(v.duration) ? v.duration : 0); };
        v.onerror = function () { finish(0); }; // unknown length: the size limit still applies
        setTimeout(function () { finish(0); }, 8000);
        v.src = url;
      });
    };
    var renderFiles = function () {
      fileList.innerHTML = picked.map(function (p, i) {
        return '<li><span>' + (p.kind === 'photo' ? '📷 ' : '🎬 ') + esc(p.file.name) + ' <small>(' + mb(p.file.size) +
          (p.seconds ? ', ' + Math.round(p.seconds) + 's' : '') + ')</small></span>' +
          '<button type="button" class="linkbtn" data-i="' + i + '">' + tt('remove') + '</button></li>';
      }).join('');
    };
    fileList && fileList.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-i]'); if (!b) return;
      picked.splice(+b.getAttribute('data-i'), 1); renderFiles();
    });
    fileInput && fileInput.addEventListener('change', function () {
      var files = Array.prototype.slice.call(fileInput.files || []); fileInput.value = '';
      var errs = [];
      var next = function () {
        if (!files.length) { renderFiles(); say(errs.join(' '), errs.length ? 'err' : ''); return; }
        var f = files.shift(), kind = kindOf(f);
        if (picked.length >= FILE_LIMITS.maxFiles) { errs.push(tt('tooMany')); files = []; return next(); }
        if (!kind) { errs.push(tt('badType') + ' (' + f.name + ')'); return next(); }
        if (kind === 'photo') {
          if (f.size > FILE_LIMITS.photoMB * 1048576) { errs.push(tt('bigPhoto') + ' (' + f.name + ')'); return next(); }
          picked.push({ file: f, kind: kind }); return next();
        }
        if (picked.filter(function (p) { return p.kind === 'video'; }).length >= FILE_LIMITS.maxVideos) { errs.push(tt('oneVideo')); return next(); }
        if (f.size > FILE_LIMITS.videoMB * 1048576) { errs.push(tt('bigVideo') + ' (' + mb(f.size) + ')'); return next(); }
        videoSeconds(f).then(function (s) {
          if (s > FILE_LIMITS.videoSeconds + 3) errs.push(tt('longVideo') + ' (' + Math.round(s) + 's)');
          else picked.push({ file: f, kind: kind, seconds: s });
          next();
        });
      };
      next();
    });

    var toBase64 = function (blob) {
      return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1] || ''); }; r.onerror = rej; r.readAsDataURL(blob); });
    };
    var progressText = function (i, n) { return lang() === 'hi' ? ('फ़ाइल ' + i + '/' + n + ' भेजी जा रही है… कृपया पेज बंद न करें।') : ('Sending file ' + i + ' of ' + n + '… please keep this page open.'); };
    var postJSON = function (url, body) {
      return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().catch(function () { return { success: false, error: 'HTTP ' + r.status }; }); });
    };
    var uploadAll = function (base, issue, key) {
      var ok = 0, i = 0;
      var step = function () {
        if (i >= picked.length) return Promise.resolve(ok);
        var p = picked[i++]; say(progressText(i, picked.length));
        return Promise.resolve({ blob: p.file, name: p.file.name }) // original file, untouched: no quality loss
          .then(function (x) { return toBase64(x.blob).then(function (b64) { return { b64: b64, name: x.name }; }); })
          .then(function (x) {
            var q = '?issue=' + issue + '&n=' + i + '&size=' + x.b64.length + '&name=' + encodeURIComponent(x.name) + '&key=' + encodeURIComponent(key);
            return fetch(base + '/upload' + q, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: x.b64 });
          })
          .then(function (r) { return r.json().catch(function () { return {}; }); })
          .then(function (d) { if (d && d.success) ok++; }, function () {})
          .then(step);
      };
      return step();
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.message.value.trim();
      if (!msg) { say(tt('noMsg'), 'err'); form.message.focus(); return; }
      if (!form.consent.checked) { say(tt('noConsent'), 'err'); return; }
      if (form.botcheck.checked) return;
      var payload = { type: form.type.value, message: msg, name: form.name.value.trim(), contact: form.contact.value.trim(), consent: 'yes', lang: lang(), files: picked.length };
      var relay = relayUrl(), req;
      if (relay) req = postJSON(relay, payload);
      else if (cfg.web3formsKey) {
        if (picked.length) say(tt('noFilesHere'));
        req = postJSON('https://api.web3forms.com/submit', { access_key: cfg.web3formsKey, subject: 'Padri Kalan website: ' + payload.type, from_name: 'Padri Kalan website',
          type: payload.type, message: msg, name: payload.name || '(not given)', contact: payload.contact || '(not given)', consent: 'yes', page_language: payload.lang });
      } else if (cfg.contributeFormUrl) { window.open(cfg.contributeFormUrl, '_blank', 'noopener'); return; }
      else { say(tt('notSetup'), 'err'); return; }

      sendBtn.disabled = true; if (fileInput) fileInput.disabled = true; say(tt('sending'));
      req.then(function (d) {
        if (!d || !d.success) { say(tt('fail'), 'err'); if (window.console) console.warn('Suggestion form:', d && d.error); return; }
        if (!relay || !picked.length || !d.uploadKey) { form.reset(); picked = []; renderFiles(); say(tt('ok'), 'good'); return; }
        var total = picked.length;
        return uploadAll(relay, d.issue, d.uploadKey).then(function (ok) {
          form.reset(); picked = []; renderFiles();
          say(ok === total ? tt('okFiles') : tt('partFiles'), ok === total ? 'good' : 'err');
        });
      }).catch(function () { say(tt('fail'), 'err'); })
        .then(function () { sendBtn.disabled = false; if (fileInput) fileInput.disabled = false; });
    });
  }

  // ---- Bars animate on view ----
  var fills = document.querySelectorAll('.fill[data-w]');
  function fillAll() { fills.forEach(function (f) { f.style.width = f.dataset.w + '%'; }); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.style.width = e.target.dataset.w + '%'; io.unobserve(e.target); } }); });
    fills.forEach(function (f) { io.observe(f); });
  } else fillAll();

  // ---- Back to top ----
  var toTop = $('toTop');
  if (toTop) addEventListener('scroll', function () { toTop.classList.toggle('show', scrollY > 800); }, { passive: true });

  // ---- Data: notices & pride wall ----
  var notices = null, pride = null, gallery = null, stories = null, temple = null;
  function renderAll() { renderNotices(); renderPride(); renderGallery(); renderStories(); renderTemple(); }
  var T = {
    noNotices: { hi: 'अभी कोई सूचना नहीं है। नई सूचना <code>data/notices.json</code> में जोड़ें।', en: 'No notices yet. Add one in <code>data/notices.json</code>.' },
    noPride: { hi: 'अभी कोई नाम नहीं जोड़ा गया है। अनुमति के साथ नाम सुझाने के लिए <a href="contribute.html">योगदान</a> देखें।', en: 'No names added yet. To suggest someone (with their consent), see <a href="contribute.html">Contribute</a>.' },
    offline: { hi: 'यह हिस्सा तभी दिखेगा जब वेबसाइट इंटरनेट पर (GitHub Pages पर) खुलेगी।', en: 'This part appears once the site is opened from the web (e.g. GitHub Pages).' },
    past: { hi: 'बीत चुका', en: 'Past' },
    noPhotos: { hi: 'अभी कोई फ़ोटो नहीं जोड़ी गई है। इंटरनेट पर पडरी कलाँ की कोई मुक्त-लाइसेंस वाली फ़ोटो नहीं मिली, इसलिए गाँव के लोगों की अपनी फ़ोटो का इंतज़ार है। नीचे इच्छा-सूची देखें।', en: 'No photos yet. No freely licensed photos of Padri Kalan were found online, so this gallery waits for photos taken by villagers. See the wishlist below.' },
    noStories: { hi: 'पहली कहानी आपकी हो सकती है। <a href="contribute.html">कहानी भेजें</a>।', en: 'The first story could be yours. <a href="contribute.html">Send a story</a>.' },
    toldBy: { hi: 'कहने वाले: ', en: 'Told by: ' },
    photo: { hi: 'फ़ोटो: ', en: 'Photo: ' }
  };
  function t(k) { return T[k][lang()]; }

  function fmtDate(iso) {
    try { return new Date(iso + 'T00:00:00').toLocaleDateString(lang() === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return iso; }
  }

  function renderNotices() {
    var box = $('noticeList'); if (!box) return;
    if (notices === 'error') { box.innerHTML = '<div class="empty">' + t('offline') + '</div>'; return; }
    if (!notices) return;
    if (!notices.length) { box.innerHTML = '<div class="empty">' + t('noNotices') + '</div>'; return; }
    var today = new Date().toISOString().slice(0, 10);
    var list = notices.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    var limit = parseInt(box.getAttribute('data-limit'), 10); if (limit > 0) list = list.slice(0, limit);
    box.innerHTML = list.map(function (n) {
      var past = n.date && n.date < today;
      return '<article class="card notice">' +
        '<time datetime="' + esc(n.date) + '">' + esc(fmtDate(n.date)) + (past ? ' · ' + t('past') : '') + '</time>' +
        '<h3>' + esc(pick(n, 'title')) + '</h3>' +
        '<p>' + esc(pick(n, 'body')) + '</p>' +
        (n.source ? '<cite class="src">' + (lang() === 'hi' ? 'स्रोत: ' : 'Source: ') + (/^https?:\/\//.test(n.source) ? '<a href="' + esc(n.source) + '" target="_blank" rel="noopener noreferrer">' + esc(n.source.replace(/^https?:\/\//, '').split('/')[0]) + '</a>' : esc(n.source)) + '</cite>' : '') +
        '</article>';
    }).join('');
  }

  function renderPride() {
    var box = $('prideList'); if (!box) return;
    if (pride === 'error') { box.innerHTML = '<div class="empty">' + t('offline') + '</div>'; return; }
    if (!pride) return;
    var list = pride.filter(function (p) { return p.consent === true; }); // only consented entries are ever shown
    if (!list.length) { box.innerHTML = '<div class="empty">' + t('noPride') + '</div>'; return; }
    box.innerHTML = list.map(function (p) {
      return '<article class="card">' +
        (p.field ? '<span class="tag">' + esc(pick(p, 'field')) + '</span>' : '') +
        '<h3>' + esc(pick(p, 'name')) + '</h3>' +
        '<p>' + esc(pick(p, 'achievement')) + '</p>' +
        (p.year ? '<p class="small muted">' + esc(p.year) + '</p>' : '') +
        '</article>';
    }).join('');
  }

  function renderGallery() {
    var box = $('galleryList'); if (!box) return;
    if (gallery === 'error') { box.innerHTML = '<div class="empty">' + t('offline') + '</div>'; return; }
    if (!gallery) return;
    // Only show photos with a licence and permission recorded
    var list = gallery.filter(function (g) { return g.src && g.license && g.permission === true; });
    if (!list.length) { box.innerHTML = '<div class="empty">' + t('noPhotos') + '</div>'; return; }
    box.innerHTML = list.map(function (g) {
      var lic = g.licenseUrl ? '<a href="' + esc(g.licenseUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(g.license) + '</a>' : esc(g.license);
      var by = g.sourceUrl ? '<a href="' + esc(g.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(g.credit || '') + '</a>' : esc(g.credit || '');
      return '<figure><img src="' + esc(g.src) + '" alt="' + esc(pick(g, 'caption')) + '" loading="lazy" decoding="async">' +
        '<figcaption>' + esc(pick(g, 'caption')) + '<span class="credit">' + t('photo') + by + ' · ' + lic + '</span></figcaption></figure>';
    }).join('');
  }

  function renderStories() {
    var box = $('storyList'); if (!box) return;
    if (stories === 'error') { box.innerHTML = '<div class="empty">' + t('offline') + '</div>'; return; }
    if (!stories) return;
    var list = stories.filter(function (s) { return s.permission === true; });
    if (!list.length) { box.innerHTML = '<div class="empty">' + t('noStories') + '</div>'; return; }
    box.innerHTML = list.map(function (s) {
      var paras = String(pick(s, 'body')).split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
      return '<article class="card">' + (s.topic ? '<span class="tag">' + esc(pick(s, 'topic')) + '</span>' : '') +
        '<h3>' + esc(pick(s, 'title')) + '</h3>' + paras +
        (s.teller ? '<p class="small muted">' + t('toldBy') + esc(pick(s, 'teller')) + (s.date ? ' · ' + esc(s.date) : '') + '</p>' : '') +
        '</article>';
    }).join('');
  }

  function renderTemple() {
    var box = $('templeInfo');
    if (!box || !temple || temple === 'error') return;
    var list = temple.filter(function (f) { return f.confirmed === true; });
    box.innerHTML = list.length ? '<ul class="facts-list">' + list.map(function (f) {
      return '<li><strong>' + esc(pick(f, 'label')) + ':</strong> ' + esc(pick(f, 'value')) + (f.source ? ' <cite class="src">(' + esc(f.source) + ')</cite>' : '') + '</li>';
    }).join('') + '</ul>' : '';
  }

  function load(url, cb) {
    fetch(url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { cb(Array.isArray(d) ? d : (d.items || [])); })
      .catch(function () { cb('error'); });
  }
  if ($('noticeList')) load('data/notices.json', function (d) { notices = d; renderNotices(); });
  if ($('prideList')) load('data/pride.json', function (d) { pride = d; renderPride(); });
  if ($('galleryList')) load('data/gallery.json', function (d) { gallery = d; renderGallery(); });
  if ($('storyList')) load('data/stories.json', function (d) { stories = d; renderStories(); });
  if ($('templeInfo')) load('data/temple.json', function (d) { temple = d; renderTemple(); });

  // ---- Offline support (service worker) ----
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
