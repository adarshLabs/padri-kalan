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
  var langBtn = document.getElementById('langBtn');
  langBtn.addEventListener('click', function () {
    var next = lang() === 'hi' ? 'en' : 'hi';
    root.dataset.lang = next; root.lang = next; store('pk-lang', next);
    renderNotices(); renderPride();
  });

  // ---- Theme ----
  document.getElementById('themeBtn').addEventListener('click', function () {
    var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    var next = dark ? 'light' : 'dark';
    root.dataset.theme = next; store('pk-theme', next);
  });

  // ---- Mobile menu ----
  var menuBtn = document.getElementById('menuBtn'), nav = document.getElementById('nav');
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });

  // ---- Share ----
  document.getElementById('shareBtn').addEventListener('click', function () {
    var text = (cfg.shareText && cfg.shareText[lang()]) || 'Padri Kalan';
    var url = location.href.split('#')[0];
    if (navigator.share) { navigator.share({ title: document.title, text: text, url: url }).catch(function () {}); return; }
    window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
  });

  // ---- Contribute links ----
  var repoUrl = 'https://github.com/' + (cfg.githubUser || '') + '/' + (cfg.githubRepo || '');
  var configured = cfg.githubUser && cfg.githubUser.indexOf('YOUR-') !== 0;
  var issueUrl = configured ? repoUrl + '/issues/new/choose' : 'https://github.com/';
  document.getElementById('issueLink').href = issueUrl;
  document.getElementById('contribLink').href = cfg.contributeFormUrl || issueUrl;

  // ---- Bars animate on view ----
  var fills = document.querySelectorAll('.fill[data-w]');
  function fillAll() { fills.forEach(function (f) { f.style.width = f.dataset.w + '%'; }); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.style.width = e.target.dataset.w + '%'; io.unobserve(e.target); } }); });
    fills.forEach(function (f) { io.observe(f); });
  } else fillAll();

  // ---- Back to top ----
  var toTop = document.getElementById('toTop');
  addEventListener('scroll', function () { toTop.classList.toggle('show', scrollY > 800); }, { passive: true });

  // ---- Data: notices & pride wall ----
  var notices = null, pride = null;
  var T = {
    noNotices: { hi: 'अभी कोई सूचना नहीं है। नई सूचना <code>data/notices.json</code> में जोड़ें।', en: 'No notices yet. Add one in <code>data/notices.json</code>.' },
    noPride: { hi: 'अभी कोई नाम नहीं जोड़ा गया है। अनुमति के साथ नाम सुझाने के लिए <a href="#contribute">योगदान</a> देखें।', en: 'No names added yet. To suggest someone (with their consent), see <a href="#contribute">Contribute</a>.' },
    offline: { hi: 'यह हिस्सा तभी दिखेगा जब वेबसाइट इंटरनेट पर (GitHub Pages पर) खुलेगी।', en: 'This part appears once the site is opened from the web (e.g. GitHub Pages).' },
    past: { hi: 'बीत चुका', en: 'Past' }
  };
  function t(k) { return T[k][lang()]; }

  function fmtDate(iso) {
    try { return new Date(iso + 'T00:00:00').toLocaleDateString(lang() === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return iso; }
  }

  function renderNotices() {
    var box = document.getElementById('noticeList');
    if (notices === 'error') { box.innerHTML = '<div class="empty">' + t('offline') + '</div>'; return; }
    if (!notices) return;
    if (!notices.length) { box.innerHTML = '<div class="empty">' + t('noNotices') + '</div>'; return; }
    var today = new Date().toISOString().slice(0, 10);
    var list = notices.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    box.innerHTML = list.map(function (n) {
      var past = n.date && n.date < today;
      return '<article class="card notice">' +
        '<time datetime="' + esc(n.date) + '">' + esc(fmtDate(n.date)) + (past ? ' · ' + t('past') : '') + '</time>' +
        '<h3>' + esc(pick(n, 'title')) + '</h3>' +
        '<p>' + esc(pick(n, 'body')) + '</p>' +
        (n.source ? '<cite class="src">' + (lang() === 'hi' ? 'स्रोत: ' : 'Source: ') + (/^https?:\/\//.test(n.source) ? '<a href="' + esc(n.source) + '" rel="noopener">' + esc(n.source.replace(/^https?:\/\//, '').split('/')[0]) + '</a>' : esc(n.source)) + '</cite>' : '') +
        '</article>';
    }).join('');
  }

  function renderPride() {
    var box = document.getElementById('prideList');
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

  function load(url, cb) {
    fetch(url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { cb(Array.isArray(d) ? d : (d.items || [])); })
      .catch(function () { cb('error'); });
  }
  load('data/notices.json', function (d) { notices = d; renderNotices(); });
  load('data/pride.json', function (d) { pride = d; renderPride(); });

  // ---- Offline support (service worker) ----
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
