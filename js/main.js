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

  // ---- Share ----
  on('shareBtn', 'click', function () {
    var text = (cfg.shareText && cfg.shareText[lang()]) || 'Padri Kalan';
    var url = location.href.split('#')[0];
    if (navigator.share) { navigator.share({ title: document.title, text: text, url: url }).catch(function () {}); return; }
    window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
  });

  // ---- Contribute links ----
  var repoUrl = 'https://github.com/' + (cfg.githubUser || '') + '/' + (cfg.githubRepo || '');
  var configured = cfg.githubUser && cfg.githubUser.indexOf('YOUR-') !== 0;
  var issueUrl = configured ? repoUrl + '/issues/new/choose' : 'https://github.com/';
  if ($('issueLink')) $('issueLink').href = issueUrl;
  if ($('contribLink')) $('contribLink').href = cfg.contributeFormUrl || issueUrl;

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
