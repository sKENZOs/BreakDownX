/* Candy Cove site: renders the page from the JSON in #site-data and includes the owner's editor.
   Two modes:
   - Standalone file (GitHub Pages etc.): open the page with #edit at the end of the address, edit, then download index.html.
   - Published as a Claude artifact: editors see the edit button and publish straight from the panel. */
(function () {
  'use strict';

  var FONT_URL = 'https://fonts.googleapis.com/css2?family=Lilita+One&amp;family=Mali:wght@600;700&amp;family=Nunito:wght@400;700;800&amp;family=Prompt:wght@400;600&amp;display=swap';
  var DRAFT_KEY = 'candy-cove-draft';
  var previewMap = {}; // pictures uploaded in this session, shown at once in the editor

  /* Fonts the editor can pick. w = weights to request from Google Fonts (a font must only ask for weights it has). */
  var FONTS = {
    'Lilita One': { w: '' }, 'Fredoka': { w: ':wght@400;600;700' }, 'Bangers': { w: '' }, 'Anton': { w: '' },
    'Pacifico': { w: '' }, 'Press Start 2P': { w: '' }, 'Poppins': { w: ':wght@400;700' }, 'Nunito': { w: ':wght@400;700;800' },
    'Playfair Display': { w: ':wght@400;700' },
    'Prompt': { w: ':wght@400;600;700', th: 1 }, 'Kanit': { w: ':wght@400;600;700', th: 1 }, 'Mitr': { w: ':wght@400;600', th: 1 },
    'Sarabun': { w: ':wght@400;700', th: 1 }, 'Mali': { w: ':wght@400;600;700', th: 1 }, 'Itim': { w: '', th: 1 },
    'Pattaya': { w: '', th: 1 }, 'Chonburi': { w: '', th: 1 }, 'Pridi': { w: ':wght@400;600', th: 1 },
    'Bai Jamjuree': { w: ':wght@400;700', th: 1 }, 'Noto Sans Thai': { w: ':wght@400;700', th: 1 }
  };
  var TYPES = {
    products: 'สินค้า (การ์ดรูป + ราคา)',
    cards: 'การ์ดสี (เช่น DLC)',
    posts: 'บทความ / ข่าว',
    faq: 'คำถามที่พบบ่อย',
    about: 'เนื้อหา + รูป (เช่น เกม)'
  };
  var RESERVED = ['top', 'edit', 'site', 'admin', 'q', 'sbtn', 'burger', 'hrefs', 'drawer', 'settings', 'sidebar', 'customize', 'upgrade', 'downloads'];

  var DEFAULTS = {
    admin: { salt: '', hash: '' },
    site: {
      name: 'Candy Cove',
      logo: '',
      shopUrl: '',
      limit: 6,
      accountUrl: '',
      backHref: '#top',
      detailBackHref: '',
      ui: { back: '← Back to home', backDetail: '← Back to home', empty: 'Nothing here yet.', more: 'Read more', search: 'Search merch', noresult: 'No matching items' },
      helpHref: '#help',
      fonts: { display: '', body: '' },
      colors: { primary: '#0a63b0', secondary: '#17b6e6', accent: '#f6d90f' }
    },
    nav: [
      { label: 'Game', href: '#game' },
      { label: 'Merch', href: '#merch' },
      { label: 'DLC', href: '#dlc' },
      { label: 'Blog', href: '#blog' }
    ],
    hero: { logo: '', line1: 'Candy', line2: 'Cove', tagline: 'Plush · Figures · More', cta: 'Play now', ctaHref: '#game' },
    sections: [
      {
        id: 'merch', type: 'products', show: true, title: 'Featured Merch', allText: 'View all', allHref: '', buyText: 'Shop now', limit: '',
        items: [
          { name: 'Jelly Fox Plush', price: '$19.99', color: '#7a4fd6', tag: 'New', link: '', image: '' },
          { name: 'Moon Pup Plush', price: '$19.99', color: '#e6d5bb', tag: '', link: '', image: '' },
          { name: 'Sunny Bun Plush', price: '$17.99', color: '#f6d34a', tag: 'Best seller', link: '', image: '' },
          { name: 'Tide Turtle Plush', price: '$19.99', color: '#1fb3a8', tag: '', link: '', image: '' },
          { name: 'Berry Bat Plush', price: '$17.99', color: '#d6335c', tag: '', link: '', image: '' },
          { name: 'Mini Figure Pack', price: '$12.99', color: '#4aa3ff', tag: '', link: '', image: '' }
        ]
      },
      {
        id: 'game', type: 'about', show: true, title: 'The Game',
        body: 'Sail between candy-coated islands, collect fruit powers and team up with friends. New islands and events arrive every month.',
        bullets: 'Co-op for up to 4 players\nOver 40 collectible powers\nNew events every month',
        cta: 'Play now', ctaHref: '#', image: ''
      },
      {
        id: 'dlc', type: 'cards', show: true, title: 'DLC', allText: 'View all', allHref: '', limit: '',
        items: [
          { title: 'Frost Harbor', desc: 'A frozen island chain with new bosses and a winter fashion set.', status: 'Coming soon', color: '#3a7bd5' },
          { title: 'Sky Market', desc: 'Trade in the clouds: new shops, gliders and a night market.', status: '$4.99', color: '#e8801c' },
          { title: 'Ember Reef', desc: 'Dive a glowing reef full of lava eels and hidden caves.', status: '$4.99', color: '#c72f58' }
        ]
      },
      {
        id: 'blog', type: 'posts', show: true, title: 'Blog', allText: 'View all', allHref: '', limit: '',
        items: [
          { title: 'Patch 1.8: Sky Market opens', date: 'Nov 18, 2026', excerpt: 'Gliders, a night market and twelve new powers are live today. Here is everything that changed.', link: '' },
          { title: 'Meet the team behind Candy Cove', date: 'Nov 4, 2026', excerpt: 'Six people, one very loud office. A look at how the islands get built.', link: '' },
          { title: 'Holiday plush restock', date: 'Oct 27, 2026', excerpt: 'Every plush is back in stock, plus two new colors for the winter drop.', link: '' }
        ]
      },
      {
        id: 'help', type: 'faq', show: true, title: 'Help', allText: 'View all', allHref: '', limit: '',
        items: [
          { q: 'How do I redeem a code?', a: 'Open the in-game menu, choose Codes and type your code. Codes are not case sensitive.' },
          { q: 'When will my order ship?', a: 'Most orders ship within 3 business days. You will get an email with tracking.' },
          { q: 'How do I contact support?', a: 'Use the Contact link at the bottom of this page and we will reply within two days.' }
        ]
      }
    ],
    footer: {
      text: '© 2026 Candy Cove Studio. All rights reserved.',
      links: [{ label: 'Terms', href: '#' }, { label: 'Privacy', href: '#' }, { label: 'Contact', href: '#' }]
    }
  };

  var NEW_ITEM = {
    products: function () { return { name: 'New item', price: '$0.00', color: '#7a4fd6', tag: '', link: '', image: '' }; },
    cards: function () { return { title: 'New card', desc: '', status: '', color: '#3a7bd5' }; },
    posts: function () { return { title: 'New post', date: '', excerpt: '', link: '' }; },
    faq: function () { return { q: 'New question', a: '' }; }
  };
  var NEW_BASE = { products: 'shop', cards: 'extras', posts: 'news', faq: 'faq', about: 'about' };
  function newSection(type) {
    var s = { id: NEW_BASE[type], type: type, show: true, title: 'New Section' };
    if (type === 'about') { s.body = ''; s.bullets = ''; s.cta = ''; s.ctaHref = '#'; s.image = ''; }
    else {
      s.allText = 'View all'; s.allHref = ''; s.limit = ''; s.items = [NEW_ITEM[type]()];
      if (type === 'products') s.buyText = 'Shop now';
    }
    return s;
  }

  /* ---------- helpers ---------- */
  var siteEl = document.getElementById('site');
  var adminEl = document.getElementById('admin');

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function merge(def, src) {
    if (Array.isArray(def)) return Array.isArray(src) ? src : def;
    if (def && typeof def === 'object') {
      var o = {};
      for (var k in def) o[k] = merge(def[k], src && typeof src === 'object' ? src[k] : undefined);
      if (src && typeof src === 'object' && src._s) o._s = src._s;
      if (src && typeof src === 'object' && src._t && typeof src._t === 'object') o._t = src._t;
      return o;
    }
    return src === undefined || src === null ? def : src;
  }
  var RAINBOW = 'linear-gradient(90deg,#ff8c80,#ffb180,#ffd680,#d4f580,#8aff9a,#80ffdb,#80d9ff,#8b9aff,#bc82ff,#ff80d4,#ff808a)';
  var RB_CSS = 'background:' + RAINBOW + ';-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;';
  function okHex(c) { return /^#[0-9a-f]{6}$/i.test(c || ''); }
  function okId(v) { return /^[0-9a-f]{32}$/.test(v || ''); }
  function rgb(h) {
    h = h.replace('#', '');
    return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); });
  }
  function toHex(a) {
    return '#' + a.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); }).join('');
  }
  function shade(h, p) {
    return toHex(rgb(h).map(function (v) { return p < 0 ? v * (1 + p) : v + (255 - v) * p; }));
  }
  function lum(h) {
    var a = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function onColor(h) { return lum(h) > 0.4 ? '#0c2340' : '#ffffff'; }
  function href(h) {
    h = String(h || '').trim();
    if (!h) return '#';
    if (/^(#[\w%-]*|https?:\/\/|mailto:|tel:)/i.test(h)) return h;
    if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(h)) return 'https://' + h;
    return '#';
  }
  function lnk(h) {
    var u = href(h);
    return /^https?:/i.test(u) ? 'href="' + esc(u) + '" target="_blank" rel="noopener noreferrer"' : 'href="' + esc(u) + '"';
  }
  function imgSrc(v) {
    v = String(v || '').trim();
    if (previewMap[v]) return previewMap[v];
    if (okId(v)) return '/_blob/' + v;
    if (/^(https?:\/\/[^\s"'<>]+|[\w][\w.\/%-]*)$/i.test(v)) return v;
    return '';
  }
  function slug(v) {
    return String(v || '').toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
  }
  function cleanId(v) {
    var id = slug(v) || 'section';
    if (RESERVED.indexOf(id) > -1 || id.indexOf('all-') === 0 || id.indexOf('comment-') === 0 || /-details$/.test(id)) id += '-1';
    return id;
  }

  /* ---------- product detail pages: free-form canvas, 1000 units wide ---------- */
  var DW = 1000;
  function num(v, d, lo, hi) { v = parseFloat(v); if (!isFinite(v)) v = d; return Math.max(lo, Math.min(hi, v)); }
  function itemIdBase(v) {
    return String(v == null ? '' : v).toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-details$/, '').slice(0, 40);
  }
  function cleanEl(e) {
    if (!e || typeof e !== 'object') return null;
    var t = e.t === 'img' || e.t === 'btn' ? e.t : 'text';
    var o = { t: t, x: Math.round(num(e.x, 0, -2000, 4000)), y: Math.round(num(e.y, 0, -2000, 6000)), w: Math.round(num(e.w, t === 'text' ? 300 : 200, 10, 4000)) };
    if (t === 'img') {
      o.h = Math.round(num(e.h, o.w, 10, 4000)); o.src = String(e.src || '').slice(0, 600);
      o.bind = e.bind === 'main' ? 'main' : ''; o.fit = e.fit === 'cover' ? 'cover' : 'contain'; o.radius = Math.round(num(e.radius, 0, 0, 500));
    } else {
      o.text = String(e.text == null ? '' : e.text).slice(0, 5000);
      o.color = (okHex(e.color) || e.color === 'rainbow') ? e.color : ''; o.size = Math.round(num(e.size, t === 'btn' ? 22 : 20, 6, 300));
      o.font = FONTS[e.font] ? e.font : ''; o.align = { left: 1, center: 1, right: 1 }[e.align] ? e.align : (t === 'btn' ? 'center' : 'left'); o.bold = !!e.bold;
      if (t === 'text') o.bind = ['name', 'price', 'tag'].indexOf(e.bind) > -1 ? e.bind : '';
      else { o.href = String(e.href || '').slice(0, 500); o.bg = okHex(e.bg) ? e.bg : ''; }
      if (e._t && typeof e._t.text === 'string' && e._t.text) o._t = { text: e._t.text.slice(0, 5000) };
    }
    return o;
  }
  var DMIN = 600, DMAX = 12000; // page depth: can never go below the default, can go much deeper
  function cleanDetail(d) {
    if (!d || typeof d !== 'object') return null;
    return { h: Math.round(num(d.h, DMIN, DMIN, DMAX)), els: (Array.isArray(d.els) ? d.els : []).slice(0, 100).map(cleanEl).filter(Boolean) };
  }
  // pictures placed inside a category (sec.media) or inside one item (item.media)
  function cleanMedia(a) {
    return (Array.isArray(a) ? a : []).slice(0, 30).map(function (m) {
      if (!m || typeof m !== 'object') return null;
      return { src: String(m.src || '').slice(0, 600), w: Math.round(num(m.w, 360, 40, 1600)),
        align: { left: 1, right: 1, center: 1 }[m.align] ? m.align : 'center', pos: m.pos === 'bottom' ? 'bottom' : 'top', r: Math.round(num(m.r, 12, 0, 200)) };
    }).filter(Boolean);
  }
  function defaultDetail() {
    return cleanDetail({ h: 600, els: [
      { t: 'img', bind: 'main', x: 60, y: 60, w: 440, h: 440, fit: 'contain', radius: 24 },
      { t: 'text', bind: 'tag', x: 540, y: 70, w: 400, size: 18, bold: true },
      { t: 'text', bind: 'name', x: 540, y: 105, w: 400, size: 44, bold: true },
      { t: 'text', bind: 'price', x: 540, y: 215, w: 400, size: 32, bold: true },
      { t: 'text', text: 'Write about this item here. Drag any block anywhere.', x: 540, y: 290, w: 400, size: 20 },
      { t: 'btn', text: 'Buy now', x: 540, y: 420, w: 240, size: 24 }
    ] });
  }
  // every product gets a unique, URL-safe id (the page is #<id>-details)
  function fixItemIds(o, clean) {
    var seen = {}, n = 0, todo = [];
    o.sections.forEach(function (s) {
      if (s.type !== 'products') return;
      s.items.forEach(function (it) {
        if (!it || typeof it !== 'object') return;
        var id = itemIdBase(it.id);
        if (id && !seen[id]) { seen[id] = 1; it.id = id; } else todo.push(it);
        if (clean && it.detail) it.detail = cleanDetail(it.detail);
      });
    });
    todo.forEach(function (it) { do { n++; } while (seen[String(n)]); it.id = String(n); seen[it.id] = 1; });
  }

  /* ---------- state ---------- */
  // Older saved files kept merch / game / dlc / blog / help as fixed keys. Turn them into the sections list.
  function migrate(raw) {
    if (!raw || typeof raw !== 'object') return {};
    if (raw.sections) return raw;
    var old = ['merch', 'game', 'dlc', 'blog', 'help'];
    if (!old.some(function (k) { return raw[k]; })) return raw;
    var o = clone(raw), show = (raw.site && raw.site.show) || {};
    o.sections = old.map(function (k) {
      var def = DEFAULTS.sections.filter(function (s) { return s.id === k; })[0];
      var base = clone(def), src = raw[k] || {};
      for (var f in src) base[f] = src[f];
      base.show = show[k] !== false;
      delete o[k];
      return base;
    });
    return o;
  }
  function normalize(o) {
    var seen = {};
    o.sections = o.sections.filter(function (s) { return s && typeof s === 'object'; });
    o.sections.forEach(function (s) {
      if (!TYPES[s.type]) s.type = 'posts';
      var base = cleanId(s.id || s.type), id = base, n = 2;
      while (seen[id]) id = base + '-' + (n++);
      seen[id] = 1; s.id = id;
      if (s.type !== 'about' && !Array.isArray(s.items)) s.items = [];
      if (s.show === undefined) s.show = true;
      if (typeof s.title !== 'string') s.title = '';
      if (s.media) s.media = cleanMedia(s.media);
      if (s.type !== 'products' && Array.isArray(s.items)) s.items.forEach(function (it) { if (it && typeof it === 'object' && it.media) it.media = cleanMedia(it.media); });
      if (s.type === 'products') {
        if (['first', 'only', 'natural'].indexOf(s.frontMode) < 0) s.frontMode = 'first';
        if (typeof s.sortLevels !== 'boolean') s.sortLevels = true;
        s.front = (Array.isArray(s.front) ? s.front : []).map(String);
        s.levels = (Array.isArray(s.levels) ? s.levels : []).map(function (x) { return String(x).trim().toLowerCase(); });
      }
    });
    fixItemIds(o, true);
    return o;
  }
  function load(raw) { return normalize(clone(merge(DEFAULTS, migrate(raw)))); }

  var saved;
  try {
    var rawTxt = document.getElementById('site-data').textContent;
    saved = load(rawTxt && rawTxt.trim() ? JSON.parse(rawTxt) : {});
  } catch (e) { saved = load({}); }
  var state = clone(saved);
  var mode = 'none';
  var artifact = null, assets = null;
  var query = '';
  var styleMode = false, selPath = '';
  var baseTitle = document.title;
  var lastFontUrl = '';
  /* Language: every text keeps its English value in obj[key] and the owner's own Thai in obj._t[key]. */
  var lang = 'en';
  try { if (localStorage.getItem('candy-cove-lang') === 'th') lang = 'th'; } catch (e) {}
  document.documentElement.lang = lang;
  function L(obj, key) {
    if (!obj) return '';
    if (lang === 'th' && obj._t && typeof obj._t[key] === 'string' && obj._t[key].trim()) return obj._t[key];
    return obj[key] == null ? '' : obj[key];
  }
  function setT(obj, key, val) {
    if (lang === 'th') {
      obj._t = obj._t || {};
      if (String(val).trim()) obj._t[key] = val; else delete obj._t[key];
      if (!Object.keys(obj._t).length) delete obj._t;
    } else obj[key] = val;
  }
  var NOLANG = /^(id|link|href|ctaHref|allHref|helpHref|backHref|detailBackHref|shopUrl|accountUrl|logo|image|src|bg|color|levels|front|limit)$/;
  function langKey(path, o) {
    if (o && (o.type || o.list || o.noLang)) return null;
    var ks = path.split('.'), key = ks.pop();
    if (NOLANG.test(key) || !ks.length) return null;
    return { pp: ks.join('.'), key: key };
  }
  function ui(k) { return L(state.site.ui || {}, k) || (DEFAULTS.site.ui[k]); }

  function dirty() { return JSON.stringify(state) !== JSON.stringify(saved); }
  function secIndex(id) {
    for (var i = 0; i < state.sections.length; i++) if (state.sections[i].id === id) return i;
    return -1;
  }
  function findItem(id) {
    for (var si = 0; si < state.sections.length; si++) {
      var s = state.sections[si];
      if (s.type !== 'products') continue;
      for (var i = 0; i < s.items.length; i++) if (s.items[i] && s.items[i].id === id) return { si: si, i: i, it: s.items[i], sec: s };
    }
    return null;
  }
  function viewFromHash() {
    var hh = location.hash, m = /^#(.+)-details$/.exec(hh);
    if (m) {
      var iid;
      try { iid = decodeURIComponent(m[1]); } catch (e) { iid = ''; }
      if (findItem(iid)) return 'item-' + iid;
    }
    if (hh.indexOf('#all-') !== 0) return 'home';
    var id;
    try { id = decodeURIComponent(hh.slice(5)); } catch (e) { return 'home'; }
    var i = secIndex(id);
    return i > -1 && state.sections[i].type !== 'about' ? 'all-' + id : 'home';
  }
  var view = viewFromHash();

  /* ---------- site rendering ---------- */
  var ICON = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4-6 8-6s7 1.5 8 6"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };
  var MARK = '<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" style="fill:var(--accent);stroke:#0b1f3a;stroke-width:3"/><path d="M20 20a3 3 0 0 1 6 0a7 7 0 0 1-14 0a11 11 0 0 1 22 0" style="fill:none;stroke:var(--primary);stroke-width:3.2;stroke-linecap:round"/></svg>';

  /* Per-text style (color, size %, font) lives next to the text in obj._s[key]. */
  function sk(obj, key, path, isWm) {
    var st = obj && obj._s && obj._s[key], css = '';
    if (st) {
      if (st.color === 'rainbow') css += isWm ? '--wm-fill:' + RAINBOW + ';' : RB_CSS;
      else if (okHex(st.color)) css += isWm ? '--wm-fill:' + st.color + ';' : 'color:' + st.color + ';';
      var sz = parseInt(st.size, 10);
      if (sz && sz !== 100) { sz = Math.max(40, Math.min(400, sz)); css += isWm ? '--fs:' + (sz / 100) + ';' : 'font-size:' + sz + '%;'; }
      if (st.font && FONTS[st.font]) css += "font-family:'" + st.font + "',var(--body);";
    }
    return ' data-k="' + esc(path) + '"' + (css ? ' style="' + css + '"' : '');
  }
  /* Partial styling inside one text: {#rrggbb|text}  {#rrggbb;150|text}  {;150|text} (size in %) */
  var RICH_RE = /\{(#[0-9a-fA-F]{6}|~)?(?:;(\d{2,3}))?(?:@([^|{}]+))?\|([^{}]*)\}/g;
  function rich(s) {
    return esc(s).replace(RICH_RE, function (m, c, z, u, t) {
      var css = '';
      if (c === '~') css += RB_CSS; else if (c) css += 'color:' + c + ';';
      var n = parseInt(z, 10);
      if (n && n !== 100) css += 'font-size:' + Math.max(40, Math.min(300, n)) + '%;';
      if (u) {
        var raw = u.trim().replace(/&amp;/g, '&').replace(/&#39;/g, "'");
        return '<a class="rl" ' + lnk(raw) + (css ? ' style="' + css + '"' : '') + '>' + t + '</a>';
      }
      return css ? '<span style="' + css + '">' + t + '</span>' : t;
    });
  }
  function plain(s) { return String(s == null ? '' : s).replace(RICH_RE, '$4'); }
  function tx(obj, key, path) { return '<span class="tx"' + sk(obj, key, path) + '>' + rich(L(obj, key)) + '</span>'; }
  function wm(text, cls, attrs) {
    return '<span class="wm ' + cls + (attrs ? ' tx' : '') + '"' + (attrs || '') + ' data-text="' + esc(text) + '"><span class="wm-fill">' + esc(text) + '</span></span>';
  }

  function plush(color) {
    var c = okHex(color) ? color : '#7a4fd6';
    var d = shade(c, -0.22), l = shade(c, 0.35);
    return '<svg viewBox="0 0 200 180" role="img" aria-hidden="true">' +
      '<ellipse cx="100" cy="166" rx="64" ry="9" fill="rgba(0,0,0,.14)"/>' +
      '<path d="M52 66 36 28l40 14z" fill="' + d + '"/><path d="M148 66l16-38-40 14z" fill="' + d + '"/>' +
      '<path d="M42 122c-6-46 17-80 58-80s64 34 58 80c-3 23-27 38-58 38s-55-15-58-38z" fill="' + c + '"/>' +
      '<ellipse cx="76" cy="76" rx="22" ry="11" fill="' + l + '" opacity=".55" transform="rotate(-25 76 76)"/>' +
      '<circle cx="78" cy="108" r="10" fill="#fff"/><circle cx="122" cy="108" r="10" fill="#fff"/>' +
      '<circle cx="80" cy="109" r="5.5" fill="#12233b"/><circle cx="120" cy="109" r="5.5" fill="#12233b"/>' +
      '<circle cx="62" cy="128" r="7" fill="#fff" opacity=".28"/><circle cx="138" cy="128" r="7" fill="#fff" opacity=".28"/>' +
      '<path d="M89 127q11 10 22 0" stroke="#12233b" stroke-width="4" fill="none" stroke-linecap="round"/></svg>';
  }

  var SHOT = '<svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--secondary)"/><stop offset="1" style="stop-color:#bdeeff"/></linearGradient></defs>' +
    '<rect width="160" height="100" fill="url(#sk)"/><circle cx="120" cy="26" r="13" style="fill:var(--accent)"/>' +
    '<path d="M0 66c20-10 40 8 60-2s40-10 60 0 30 4 40-2v38H0z" style="fill:var(--primary)"/>' +
    '<path d="M0 80c25-8 45 6 70-2s55-6 90 2v20H0z" style="fill:var(--primary-dark)"/>' +
    '<path d="M30 70l10-22 10 22z" fill="#fff" opacity=".9"/><path d="M40 48v22" stroke="#0b1f3a" stroke-width="1.5"/></svg>';

  function fontStack(name) { return "'" + name + "', 'Mali', system-ui, sans-serif"; }
  function applyBrand() {
    var c = state.site.colors, r = document.documentElement.style, f = state.site.fonts || {};
    var p = okHex(c.primary) ? c.primary : DEFAULTS.site.colors.primary;
    var s = okHex(c.secondary) ? c.secondary : DEFAULTS.site.colors.secondary;
    var a = okHex(c.accent) ? c.accent : DEFAULTS.site.colors.accent;
    r.setProperty('--primary', p); r.setProperty('--secondary', s); r.setProperty('--accent', a);
    r.setProperty('--primary-dark', shade(p, -0.3));
    r.setProperty('--on-primary', onColor(p)); r.setProperty('--on-accent', onColor(a));
    if (FONTS[f.display]) r.setProperty('--display', fontStack(f.display)); else r.removeProperty('--display');
    if (FONTS[f.body]) r.setProperty('--body', "'" + f.body + "', 'Prompt', system-ui, sans-serif"); else r.removeProperty('--body');
  }
  function collectFonts(o, set) {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) { o.forEach(function (x) { collectFonts(x, set); }); return; }
    if (typeof o.font === 'string' && FONTS[o.font]) set[o.font] = 1;
    for (var k in o) {
      if (k === '_s') { for (var f in o._s) { var ft = o._s[f] && o._s[f].font; if (FONTS[ft]) set[ft] = 1; } }
      else collectFonts(o[k], set);
    }
  }
  function ensureFonts() {
    var set = {};
    collectFonts(state, set);
    var f = state.site.fonts || {};
    if (FONTS[f.display]) set[f.display] = 1;
    if (FONTS[f.body]) set[f.body] = 1;
    var names = Object.keys(set), link = document.getElementById('gf-dyn');
    if (!names.length) { if (link) link.remove(); lastFontUrl = ''; return; }
    var url = 'https://fonts.googleapis.com/css2?' + names.map(function (n) { return 'family=' + n.replace(/ /g, '+') + FONTS[n].w; }).join('&') + '&display=swap';
    if (url === lastFontUrl) return;
    lastFontUrl = url;
    if (!link) { link = document.createElement('link'); link.id = 'gf-dyn'; link.rel = 'stylesheet'; document.head.appendChild(link); }
    link.href = url;
  }

  function limOf(sec) {
    var g = parseInt(state.site.limit, 10) || 6;
    return Math.max(1, Math.min(50, parseInt(sec.limit, 10) || g));
  }

  function mediaEdit() { return !!(adminBuilt && mediaMode); }
  function figHtml(m, path) {
    var edit = mediaEdit(), src = imgSrc(m.src);
    if (!src && !edit) return '';
    var sel = edit && selMed === path;
    return '<figure class="med med-' + m.align + (sel ? ' sel' : '') + '" data-med="' + path + '" style="width:' + m.w + 'px;--r:' + m.r + 'px">' +
      (src ? '<img src="' + esc(src) + '" alt="" draggable="false">' : '<div class="med-ph">รูป</div>') + (sel ? '<i class="rh"></i>' : '') + '</figure>';
  }
  function mediaHtml(list, ref, pos) {
    var out = '';
    (Array.isArray(list) ? list : []).forEach(function (m, k) { if (m && m.pos === pos) out += figHtml(m, ref + ':' + k); });
    return out;
  }
  function cardHtml(si, i, it, shop) {
    var sec = state.sections[si], P = 'sections.' + si + '.items.' + i + '.', k = sec.type;
    if (k === 'products') {
      var src = imgSrc(it.image);
      var art = src ? '<img src="' + esc(src) + '" alt="' + esc(plain(L(it, 'name'))) + '">' : plush(it.color);
      var dl = 'href="#' + esc(it.id) + '-details" data-detail';
      return '<article class="card" data-name="' + esc(plain(it.name).toLowerCase()) + '">' +
        '<a class="card-img" ' + dl + ' aria-label="' + esc(plain(L(it, 'name'))) + '">' + art + (L(it, 'tag') ? '<span class="tag">' + tx(it, 'tag', P + 'tag') + '</span>' : '') + '</a>' +
        '<h3>' + tx(it, 'name', P + 'name') + '</h3><p class="price">' + tx(it, 'price', P + 'price') + '</p>' +
        (L(sec, 'buyText') ? '<a class="btn" ' + dl + '>' + tx(sec, 'buyText', 'sections.' + si + '.buyText') + '</a>' : '') + '</article>';
    }
    if (k === 'cards') {
      var c = okHex(it.color) ? it.color : '#3a7bd5';
      var rf = 'i:' + si + ':' + i;
      return '<article class="dlc" data-mc="' + rf + '"><div class="dlc-top" style="background:linear-gradient(135deg,' + c + ',' + shade(c, -0.35) + ');color:' + onColor(shade(c, -0.12)) + '"><h3>' + tx(it, 'title', P + 'title') + '</h3></div>' +
        '<div class="dlc-body">' + mediaHtml(it.media, rf, 'top') + '<p>' + tx(it, 'desc', P + 'desc') + '</p>' + (L(it, 'status') ? '<span class="badge">' + tx(it, 'status', P + 'status') + '</span>' : '') + mediaHtml(it.media, rf, 'bottom') + '</div></article>';
    }
    if (k === 'posts') {
      var rp = 'i:' + si + ':' + i;
      return '<article class="post" data-mc="' + rp + '">' + mediaHtml(it.media, rp, 'top') + '<time>' + tx(it, 'date', P + 'date') + '</time><h3>' + (it.link ? '<a ' + lnk(it.link) + '>' + tx(it, 'title', P + 'title') + '</a>' : tx(it, 'title', P + 'title')) + '</h3><p>' + tx(it, 'excerpt', P + 'excerpt') + '</p>' +
        (it.link ? '<a class="more" ' + lnk(it.link) + '>' + esc(ui('more')) + '</a>' : '') + mediaHtml(it.media, rp, 'bottom') + '</article>';
    }
    var rq = 'i:' + si + ':' + i;
    return '<details class="faq"' + (styleMode || mediaEdit() ? ' open' : '') + ' data-mc="' + rq + '"><summary>' + tx(it, 'q', P + 'q') + '</summary>' + mediaHtml(it.media, rq, 'top') + '<p>' + tx(it, 'a', P + 'a') + '</p>' + mediaHtml(it.media, rq, 'bottom') + '</details>';
  }
  /* which products show on the front page / the View all page, and in what order */
  function hasTag(it) { return !!plain(it.tag).trim(); }
  function entries(sec) {
    var a = [];
    sec.items.forEach(function (it, i) { if (it && typeof it === 'object') a.push({ i: i, it: it }); });
    return a;
  }
  function orderedTagged(sec) {
    var front = Array.isArray(sec.front) ? sec.front : [];
    return entries(sec).filter(function (e) { return hasTag(e.it); })
      .map(function (e, n) { var r = front.indexOf(e.it.id); return { e: e, k: r < 0 ? 1e6 + n : r }; })
      .sort(function (a, b) { return a.k - b.k; }).map(function (x) { return x.e; });
  }
  function homeEntries(sec) {
    var all = entries(sec);
    if (sec.type !== 'products') return all;
    var mode = sec.frontMode || 'first';
    if (mode === 'natural') return all;
    var tg = orderedTagged(sec);
    return mode === 'only' ? tg : tg.concat(all.filter(function (e) { return !hasTag(e.it); }));
  }
  function lvl(it) { return plain(it.price).trim().toLowerCase(); }
  function levelOrder(sec) {
    var counts = {}, labels = {}, first = [], seen = {}, out = [];
    entries(sec).forEach(function (e) {
      var k = lvl(e.it); if (!k) return;
      if (!counts[k]) { counts[k] = 0; labels[k] = plain(e.it.price).trim(); first.push(k); }
      counts[k]++;
    });
    (Array.isArray(sec.levels) ? sec.levels : []).concat(first).forEach(function (k) {
      k = String(k).trim().toLowerCase();
      if (counts[k] && !seen[k]) { seen[k] = 1; out.push({ key: k, label: labels[k], count: counts[k] }); }
    });
    return out;
  }
  function allEntries(sec) {
    var all = entries(sec);
    if (sec.type !== 'products' || sec.sortLevels === false) return all;
    var order = levelOrder(sec).map(function (x) { return x.key; });
    return all.map(function (e, n) { var r = order.indexOf(lvl(e.it)); return { e: e, k: r < 0 ? 1e6 : r, n: n }; })
      .sort(function (a, b) { return a.k - b.k || a.n - b.n; }).map(function (x) { return x.e; });
  }
  function listHtml(si, count, shop, all) {
    var sec = state.sections[si], body = '';
    (all ? allEntries(sec) : homeEntries(sec)).slice(0, count).forEach(function (e) { body += cardHtml(si, e.i, e.it, shop); });
    if (sec.type === 'faq') return '<div class="faqs">' + body + '</div>';
    var cls = sec.type === 'products' ? 'products' : sec.type === 'cards' ? 'dlcs' : 'posts';
    return '<div class="grid ' + cls + '">' + body + '</div>';
  }
  function viewAllLink(si) {
    var sec = state.sections[si];
    if (!L(sec, 'allText')) return '';
    var inner = tx(sec, 'allText', 'sections.' + si + '.allText');
    var custom = String(sec.allHref || '').trim();
    if (custom) return '<a class="bar-link" ' + lnk(custom) + '>' + inner + '</a>';
    return '<a class="bar-link" href="#all-' + esc(sec.id) + '">' + inner + '</a>';
  }
  function barHtml(si, withLink) {
    var sec = state.sections[si];
    return '<div class="bar"><h2>' + tx(sec, 'title', 'sections.' + si + '.title') + '</h2>' + (withLink ? viewAllLink(si) : '') + '</div>';
  }
  function catSection(si, shop) {
    var sec = state.sections[si];
    var rs = 's:' + si;
    return '<section class="sec" id="' + esc(sec.id) + '"><div class="wrap" data-mc="' + rs + '">' + barHtml(si, true) +
      '<div class="smedia">' + mediaHtml(sec.media, rs, 'top') + '</div>' + listHtml(si, limOf(sec), shop) +
      '<div class="smedia">' + mediaHtml(sec.media, rs, 'bottom') + '</div></div></section>';
  }
  function aboutSection(si) {
    var g = state.sections[si], P = 'sections.' + si + '.', gs = imgSrc(g.image);
    var bl = String(L(g, 'bullets') || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    return '<section class="sec" id="' + esc(g.id) + '"><div class="wrap">' + barHtml(si, false) +
      '<div class="game"><div class="game-copy"><p>' + tx(g, 'body', P + 'body') + '</p>' +
      (bl.length ? '<ul class="chips">' + bl.map(function (b) { return '<li><span class="tx"' + sk(g, 'bullets', P + 'bullets') + '>' + esc(b) + '</span></li>'; }).join('') + '</ul>' : '') +
      (L(g, 'cta') ? '<a class="btn big" ' + lnk(g.ctaHref) + '>' + tx(g, 'cta', P + 'cta') + '</a>' : '') + '</div>' +
      '<div class="shot">' + (gs ? '<img src="' + esc(gs) + '" alt="">' : SHOT) + '</div></div></div></section>';
  }
  function allPage(si, shop) {
    var sec = state.sections[si];
    return '<main class="sec"><div class="wrap"><a class="back" ' + lnk(state.site.backHref || '#top') + '>' + esc(ui('back')) + '</a>' + barHtml(si, false) +
      (sec.items.length ? listHtml(si, sec.items.length, shop, true) : '<p class="empty">' + esc(ui('empty')) + '</p>') + '</div></main>';
  }

  function wrapRb(html, on) { return on ? '<span style="' + RB_CSS + '">' + html + '</span>' : html; }
  function deHtml(it, el, i, shop, edit, sel) {
    var st = 'left:' + el.x + 'px;top:' + el.y + 'px;width:' + el.w + 'px;' + (el.t === 'img' ? 'height:' + el.h + 'px;' : '') + 'z-index:' + (i + 1) + ';';
    var inner;
    if (el.t === 'img') {
      var src = el.bind === 'main' ? imgSrc(it.image) : imgSrc(el.src);
      var body = el.bind === 'main' && !src ? plush(it.color) : src ? '<img src="' + esc(src) + '" alt="" draggable="false">' : (edit ? '<div class="de-ph">รูป</div>' : '');
      inner = '<div class="de-in" style="border-radius:' + el.radius + 'px;--fit:' + el.fit + ';">' + body + '</div>';
    } else {
      var css = '';
      var rbw = el.color === 'rainbow';
      if (el.color && !rbw) css += 'color:' + el.color + ';';
      css += 'font-size:' + el.size + 'px;text-align:' + el.align + ';' + (el.bold ? 'font-weight:700;' : '');
      if (el.font) css += "font-family:'" + el.font + "',var(--body);";
      if (el.t === 'btn') {
        if (el.bg) css += 'background:' + el.bg + ';' + (el.color ? '' : 'color:' + onColor(el.bg) + ';');
        inner = '<a class="btn de-btn" ' + lnk(el.href || it.link || shop) + ' style="' + css + '">' + wrapRb(rich(L(el, 'text')) || '&nbsp;', rbw) + '</a>';
      } else {
        var txt = el.bind ? L(it, el.bind) : L(el, 'text');
        inner = '<div class="de-in" style="' + css + '">' + (rich(txt) ? wrapRb(rich(txt), rbw) : (edit ? '<span class="de-empty">(ว่าง)</span>' : '')) + '</div>';
      }
    }
    return '<div class="de de-' + el.t + (sel ? ' sel' : '') + '" data-i="' + i + '" style="' + st + '">' + inner + (sel ? '<i class="rh"></i>' : '') + '</div>';
  }
  /* Back on an item page: the owner's own target if set, otherwise the View all page of the item's category. */
  function detailBack(f) {
    var h0 = String(state.site.detailBackHref || '').trim();
    if (h0 && h0 !== '#top' && h0 !== '#') return h0;
    return f.sec && f.sec.id ? '#all-' + f.sec.id : '#top';
  }
  function detailPage(f, shop) {
    var it = f.it, d = it.detail ? cleanDetail(it.detail) : defaultDetail(), edit = canvasEdit(), body = '';
    d.els.forEach(function (el, i) { body += deHtml(it, el, i, shop, edit, edit && i === selEl); });
    return '<main class="dpage"><div class="wrap"><a class="back" ' + lnk(detailBack(f)) + '>' + esc(ui('backDetail')) + '</a>' +
      '<div class="dwrap" data-h="' + d.h + '"><div class="dstage' + (edit ? ' editing' : '') + '" style="width:' + DW + 'px;height:' + d.h + 'px">' + body + '</div></div></div></main>';
  }
  function fitStage() {
    var w = siteEl.querySelector('.dwrap'); if (!w) return;
    var p = w.parentElement, cs = getComputedStyle(p);
    var avail = p.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    var sc = Math.max(0.1, Math.min(1, avail / DW)), H = +w.dataset.h;
    w.firstElementChild.style.transform = 'scale(' + sc + ')';
    w.style.width = (DW * sc) + 'px'; w.style.height = (H * sc) + 'px';
  }
  function viewOk() {
    if (view === 'home') return true;
    if (view.indexOf('item-') === 0) return !!findItem(view.slice(5));
    return secIndex(view.slice(4)) > -1;
  }

  function renderSite(keep) {
    var y = window.scrollY;
    applyBrand();
    ensureFonts();
    if (!viewOk()) view = 'home';
    var d = state, s = d.site;
    var shop = s.shopUrl || '#merch';

    var nav = '';
    d.nav.forEach(function (n, i) {
      if (L(n, 'label')) nav += '<a class="nl" ' + lnk(n.href) + '>' + tx(n, 'label', 'nav.' + i + '.label') + '</a>';
    });

    var h = '<div id="top"></div>';
    h += '<header class="hdr"><div class="wrap hdr-in">' +
      '<a class="brand" href="#top" aria-label="' + esc(L(s, 'name')) + '">' + (imgSrc(s.logo) ? '<img class="brand-img" src="' + esc(imgSrc(s.logo)) + '" alt="' + esc(L(s, 'name')) + '">' : MARK + wm(L(s, 'name') || ' ', 'brand', sk(s, 'name', 'site.name', true))) + '</a>' +
      '<nav class="nav" aria-label="Main">' + nav + '<a class="qbtn" ' + lnk(s.helpHref || '#help') + ' aria-label="Help">?</a></nav>' +
      '<div class="tools">' +
      '<button class="lang" id="lsw" type="button" role="switch" aria-checked="' + (lang === 'th') + '" aria-label="Language EN / TH"><span>EN</span><span>TH</span><i class="knob"></i></button>' +
      '<button class="ic" id="sbtn" type="button" aria-label="' + esc(ui('search')) + '" aria-expanded="false">' + ICON.search + '</button>' +
      '<button class="ic" id="burger" type="button" aria-label="Menu" aria-expanded="false">' + ICON.menu + '</button>' +
      '</div></div></header>';
    h += '<div class="searchbar" hidden><div class="wrap"><input id="q" type="search" autocomplete="off" placeholder="' + esc(ui('search')) + '" aria-label="' + esc(ui('search')) + '"><ul class="sugg" id="sugg" role="listbox" hidden></ul></div></div>';

    if (view === 'home') {
      var hero = d.hero;
      h += '<section class="hero" aria-label="Banner">' +
        '<svg class="hero-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
        '<defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent)"/><stop offset=".55" style="stop-color:var(--orange)"/></linearGradient></defs>' +
        '<rect width="100" height="100" fill="url(#hg)"/>' +
        '<polygon points="0,16 50,40 100,16 100,82 50,62 0,82" style="fill:var(--primary)"/>' +
        '<polygon points="0,82 50,62 100,82 100,100 0,100" style="fill:var(--secondary)"/>' +
        '<path d="M0 90C15 84 30 96 50 90S85 84 100 90" style="fill:none;stroke:rgba(255,255,255,.24);stroke-width:2;vector-effect:non-scaling-stroke"/>' +
        '<path d="M0 96C18 91 32 100 52 95S86 91 100 96" style="fill:none;stroke:rgba(255,255,255,.18);stroke-width:2;vector-effect:non-scaling-stroke"/>' +
        '</svg><div class="hero-glow"></div>' +
        '<div class="wrap hero-in">' + (imgSrc(hero.logo)
          ? '<h1 class="hero-logo"><img src="' + esc(imgSrc(hero.logo)) + '" alt="' + esc(L(s, 'name')) + '"></h1>'
          : '<h1 class="hero-mark" aria-label="' + esc((L(hero, 'line1') + ' ' + L(hero, 'line2')).trim() || L(s, 'name')) + '">' +
            (L(hero, 'line1') ? wm(L(hero, 'line1'), 'blue', sk(hero, 'line1', 'hero.line1', true)) : '') +
            (L(hero, 'line2') ? '<span class="l2">' + wm(L(hero, 'line2'), 'sun', sk(hero, 'line2', 'hero.line2', true)) + '</span>' : '') + '</h1>') +
        (L(hero, 'tagline') ? '<p class="wm white hero-tag tx"' + sk(hero, 'tagline', 'hero.tagline', true) + ' data-text="' + esc(L(hero, 'tagline')) + '"><span class="wm-fill">' + esc(L(hero, 'tagline')) + '</span></p>' : '') +
        (L(hero, 'cta') ? '<a class="btn big" ' + lnk(hero.ctaHref) + '>' + tx(hero, 'cta', 'hero.cta') + '</a>' : '') +
        '</div></section>';

      d.sections.forEach(function (sec, si) {
        if (!sec.show) return;
        if (sec.type === 'about') h += aboutSection(si);
        else if (sec.items.length) h += catSection(si, shop);
      });
    } else if (view.indexOf('item-') === 0) {
      h += detailPage(findItem(view.slice(5)), shop);
    } else {
      h += allPage(secIndex(view.slice(4)), shop);
    }

    h += '<footer class="ftr"><div class="wrap ftr-in"><p>' + tx(d.footer, 'text', 'footer.text') + '</p><ul>';
    d.footer.links.forEach(function (l, i) {
      if (L(l, 'label')) h += '<li><a ' + lnk(l.href) + '>' + tx(l, 'label', 'footer.links.' + i + '.label') + '</a></li>';
    });
    h += '</ul></div></footer>';

    siteEl.innerHTML = h;
    wireSite();
    if (selPath) {
      var el = siteEl.querySelector('[data-k="' + selPath + '"]');
      if (el) el.classList.add('sel');
    }
    fitStage();
    if (view === 'home') document.title = baseTitle;
    else if (view.indexOf('item-') === 0) document.title = plain(L(findItem(view.slice(5)).it, 'name')) || baseTitle;
    else document.title = plain(L(d.sections[secIndex(view.slice(4))], 'title')) + ' | ' + (L(s, 'name') || baseTitle);
    if (keep !== false) window.scrollTo({ top: y, behavior: 'instant' });
  }

  function wireSite() {
    var hdr = siteEl.querySelector('.hdr'), burger = siteEl.querySelector('#burger');
    burger.addEventListener('click', function () {
      var o = hdr.classList.toggle('open');
      burger.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
    siteEl.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () { hdr.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });
    });
    var ls = siteEl.querySelector('#lsw');
    if (ls) ls.addEventListener('click', function () { setLang(lang === 'th' ? 'en' : 'th'); });
    var sb = siteEl.querySelector('#sbtn'), bar = siteEl.querySelector('.searchbar'), q = siteEl.querySelector('#q'), sg = siteEl.querySelector('#sugg');
    var act = -1;
    function words(t) { return plain(t).toLowerCase().split(/[\s\-_·.,()\/]+/).filter(Boolean); }
    function find(qs) {
      var Q = qs.toLowerCase(), out = [], n = 0;
      state.sections.forEach(function (sec) {
        if (sec.type !== 'products' || !sec.show) return;
        entries(sec).forEach(function (e) {
          var names = [plain(e.it.name), plain(e.it._t && e.it._t.name)].filter(Boolean), best = 9;
          names.forEach(function (nm) {
            var lo = nm.toLowerCase();
            if (lo.indexOf(Q) === 0) best = Math.min(best, 0);
            else if (words(nm).some(function (w) { return w.indexOf(Q) === 0; })) best = Math.min(best, 1);
          });
          if (best < 9) out.push({ it: e.it, k: best, n: n++ });
        });
      });
      return out.sort(function (a, b) { return a.k - b.k || a.n - b.n; }).slice(0, 8);
    }
    function paint() {
      act = -1;
      if (!query) { sg.hidden = true; sg.innerHTML = ''; return; }
      var r = find(query), out = '';
      r.forEach(function (x, i) {
        var it = x.it, src = imgSrc(it.image);
        out += '<li role="option"><a href="#' + esc(it.id) + '-details" data-i="' + i + '"><span class="st">' + (src ? '<img src="' + esc(src) + '" alt="">' : plush(it.color)) + '</span>' +
          '<span class="sn">' + esc(plain(L(it, 'name'))) + '</span><span class="sp">' + esc(plain(L(it, 'price'))) + '</span></a></li>';
      });
      if (!r.length) out = '<li class="none">' + esc(ui('noresult')) + '</li>';
      sg.innerHTML = out; sg.hidden = false;
    }
    function closeSearch() { query = ''; q.value = ''; paint(); bar.hidden = true; sb.setAttribute('aria-expanded', 'false'); }
    function mark(n) {
      var a = sg.querySelectorAll('a');
      if (!a.length) return;
      act = (n + a.length) % a.length;
      a.forEach(function (x, i) { x.classList.toggle('on', i === act); });
      a[act].scrollIntoView({ block: 'nearest' });
    }
    sb.addEventListener('click', function () {
      bar.hidden = !bar.hidden;
      sb.setAttribute('aria-expanded', bar.hidden ? 'false' : 'true');
      if (!bar.hidden) q.focus(); else closeSearch();
    });
    q.addEventListener('input', function () { query = q.value.trim(); paint(); });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); mark(act + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); mark(act < 0 ? -1 : act - 1); }
      else if (e.key === 'Enter') {
        var a = sg.querySelectorAll('a'), t = a[act < 0 ? 0 : act];
        if (t) { e.preventDefault(); t.click(); }
      } else if (e.key === 'Escape') closeSearch();
    });
    sg.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (a) { query = ''; if (location.hash === a.getAttribute('href')) closeSearch(); }
    });
    if (query) { bar.hidden = false; q.value = query; sb.setAttribute('aria-expanded', 'true'); paint(); }
  }

  /* ---------- editor ---------- */
  var drawer, fab, bodyEl, statusEl, goBtn, dlBtn, revertBtn, bannerEl, tabsEl, hrefList, drawSel;
  var curTab = 'general', adminBuilt = false, busy = false, draftData = null, raf = 0;

  function h(tag, attrs) {
    var e = document.createElement(tag), k, v;
    attrs = attrs || {};
    for (k in attrs) {
      v = attrs[k];
      if (k === 'class') e.className = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (var i = 2; i < arguments.length; i++) {
      [].concat(arguments[i]).forEach(function (c) {
        if (c == null || c === false) return;
        e.append(c.nodeType ? c : document.createTextNode(String(c)));
      });
    }
    return e;
  }
  function getP(path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, state); }
  function setP(path, val) {
    var ks = path.split('.'), last = ks.pop();
    ks.reduce(function (o, k) { return o[k]; }, state)[last] = val;
    changed();
  }
  function fid(path) { return 'f_' + path.replace(/\./g, '_'); }

  function refreshHrefs() {
    if (!hrefList) return;
    hrefList.replaceChildren();
    ['#top'].concat(state.sections.map(function (s) { return '#' + s.id; })).forEach(function (v) { hrefList.append(h('option', { value: v })); });
  }
  function changed() {
    fixItemIds(state, false);
    if (!raf) raf = requestAnimationFrame(function () { raf = 0; renderSite(); });
    refreshStatus();
    refreshHrefs();
    saveDraft();
  }
  function saveDraft() {
    try {
      if (dirty()) localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
      else localStorage.removeItem(DRAFT_KEY);
    } catch (e) { /* storage unavailable */ }
  }
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ } }

  function setMsg(text, cls) {
    statusEl.textContent = text;
    statusEl.className = 'status' + (cls ? ' ' + cls : '');
  }
  function refreshStatus() {
    if (!statusEl) return;
    var dt = dirty();
    goBtn.disabled = busy || (mode === 'artifact' && !dt);
    if (mode === 'local') { goBtn.textContent = ghReady() ? 'นำไปใช้กับเว็บเลย (อัปขึ้น GitHub)' : 'ดาวน์โหลด index.html ที่แก้แล้ว'; dlBtn.hidden = !ghReady(); }
    revertBtn.disabled = !dt;
    if (!busy) setMsg(dt ? 'มีการแก้ไขที่ยังไม่ได้บันทึกลงเว็บจริง' : 'ตรงกับเวอร์ชันล่าสุดแล้ว', dt ? 'warn' : '');
  }

  /* field builders */
  function fText(path, label, o) {
    o = o || {};
    var inp = o.area ? h('textarea', { id: fid(path), rows: o.rows || 3 }) : h('input', { id: fid(path), type: o.type || 'text' });
    var lk = langKey(path, o), th = !!lk && lang === 'th';
    if (th) {
      var par = getP(lk.pp);
      inp.value = par && par._t && typeof par._t[lk.key] === 'string' ? par._t[lk.key] : '';
      inp.placeholder = 'ไทย — ว่างไว้ = ใช้ข้อความอังกฤษ: ' + plain(par && par[lk.key]).slice(0, 40);
      inp.addEventListener('input', function () { var p = getP(lk.pp); setT(p, lk.key, inp.value); changed(); });
    } else {
      inp.value = getP(path) == null ? '' : getP(path);
      if (o.ph) inp.placeholder = o.ph;
      if (o.list) inp.setAttribute('list', o.list);
      inp.addEventListener('input', function () { setP(path, inp.value); });
    }
    return h('label', { class: 'f' }, h('span', {}, label, lk ? h('em', { class: 'lgtag' }, th ? 'TH' : 'EN') : null), inp, o.hint ? h('small', {}, o.hint) : null);
  }
  function fColor(path, label) {
    var cur = getP(path), inp = h('input', { id: fid(path), type: 'color' });
    inp.value = okHex(cur) ? cur : '#000000';
    var code = h('code', {}, inp.value);
    inp.addEventListener('input', function () { code.textContent = inp.value; setP(path, inp.value); });
    return h('label', { class: 'f' }, h('span', {}, label), h('div', { class: 'row' }, inp, code));
  }
  function fCheck(path, label) {
    var inp = h('input', { id: fid(path), type: 'checkbox' });
    inp.checked = !!getP(path);
    inp.addEventListener('change', function () { setP(path, inp.checked); });
    return h('label', { class: 'f chk' }, inp, h('span', {}, label));
  }
  function fontSelect(id, value, onChange) {
    var sel = h('select', { id: id });
    sel.append(h('option', { value: '' }, 'ฟอนต์เดิม'));
    Object.keys(FONTS).forEach(function (n) { sel.append(h('option', { value: n }, n + (FONTS[n].th ? ' (ไทย)' : ''))); });
    sel.value = FONTS[value] ? value : '';
    sel.addEventListener('change', function () { onChange(sel.value); });
    return sel;
  }
  function fFont(path, label) {
    return h('label', { class: 'f' }, h('span', {}, label), fontSelect(fid(path), getP(path), function (v) { setP(path, v); }));
  }
  var UPTYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };
  function upErr(e) {
    var c = e && e.code;
    if (c === 'too_large') return 'ไฟล์ใหญ่เกินไป (รูปทั่วไปไม่เกิน 20 MB, SVG ไม่เกิน 2 MB)';
    if (c === 'unsupported_type') return 'รองรับเฉพาะ PNG, JPG, WebP, GIF และ SVG';
    if (c === 'quota_or_state') return 'พื้นที่เก็บรูปเต็มแล้ว';
    if (c === 'rate_limited') return 'อัปโหลดถี่เกินไป รอสักครู่แล้วลองใหม่';
    return 'อัปโหลดไม่สำเร็จ ลองอีกครั้ง';
  }
  function fImage(path, label) {
    if (!assets && mode === 'local') return fImageLocal(path, label);
    if (!assets) {
      return fText(path, label, { ph: 'images/ชื่อไฟล์.png', hint: 'วางไฟล์รูปไว้ข้าง index.html แล้วพิมพ์ที่อยู่ไฟล์ เช่น images/fox.png (เว้นว่างเพื่อใช้ภาพวาดเริ่มต้น)' });
    }
    var thumb = h('div', { class: 'thumb' }), note = h('small', {});
    function draw() {
      thumb.replaceChildren();
      var v = getP(path);
      if (okId(v)) thumb.append(h('img', { src: '/_blob/' + v, alt: '' }));
      else thumb.append(h('span', { class: 'noimg' }, 'ใช้ภาพวาดเริ่มต้น'));
    }
    var file = h('input', { type: 'file', id: fid(path) + '_file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml', hidden: true });
    file.addEventListener('change', async function () {
      var f = file.files[0]; if (!f) return;
      var type = f.type;
      if (Object.keys(UPTYPES).map(function (k) { return UPTYPES[k]; }).indexOf(type) === -1) type = UPTYPES[(f.name.split('.').pop() || '').toLowerCase()];
      if (!type) { note.textContent = 'รองรับเฉพาะ PNG, JPG, WebP, GIF และ SVG'; return; }
      note.textContent = 'กำลังอัปโหลด…';
      try { var r = await assets.upload(f, { type: type }); setP(path, r.id); draw(); note.textContent = 'อัปโหลดแล้ว'; }
      catch (e) { note.textContent = upErr(e); }
      file.value = '';
    });
    draw();
    return h('div', { class: 'f' }, h('span', {}, label), thumb,
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'ab', onclick: function () { file.click(); } }, 'อัปโหลดรูป'),
        h('button', { type: 'button', class: 'ab', onclick: function () { setP(path, ''); draw(); } }, 'ลบรูป')),
      file, note);
  }

  function fImageLocal(path, label) {
    var thumb = h('div', { class: 'thumb' });
    var inp = h('input', { id: fid(path), type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: 'วางลิงก์รูป หรือกดปุ่มเลือก/อัปโหลดรูป' });
    function draw() {
      thumb.replaceChildren(); var v = getP(path), src = imgSrc(v);
      if (src) thumb.append(h('img', { src: src, alt: '' })); else thumb.append(h('span', { class: 'noimg' }, 'ใช้ภาพวาดเริ่มต้น'));
    }
    inp.value = getP(path) || '';
    inp.addEventListener('input', function () { setP(path, inp.value.trim()); draw(); });
    draw();
    return h('div', { class: 'f' }, h('span', {}, label), thumb,
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'ab go', onclick: function () { openPicker(function (v) { setP(path, v); inp.value = v; draw(); }); } }, 'เลือก / อัปโหลดรูป'),
        h('button', { type: 'button', class: 'ab', onclick: function () { setP(path, ''); inp.value = ''; draw(); } }, 'ลบรูป')),
      inp, h('small', {}, 'กดปุ่มเลือกเพื่อเปิดคลังรูป (เหมือนโฟลเดอร์ใน GitHub) หรือวางลิงก์รูป https://… ตรงช่องนี้'));
  }

  /* ---------- picture library: browse the repo's folders, upload from the computer, pick a picture ---------- */
  var IMG_EXT = /\.(png|jpe?g|webp|gif|svg)$/i;
  var EXT_OF = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };
  var DIR_KEY = 'candy-cove-imgdir';
  function baseDir() { var p = ghCfg().path.trim().replace(/^\/+/, ''), i = p.lastIndexOf('/'); return i > -1 ? p.slice(0, i) : ''; }
  function relPath(full) { var b = baseDir(); return b && full.indexOf(b + '/') === 0 ? full.slice(b.length + 1) : full; }
  function safeName(n, type) {
    n = String(n || '').replace(/\s+/g, '-').replace(/[^A-Za-z0-9._-]/g, '').replace(/^\.+/, '');
    var m = /^(.*?)(\.[A-Za-z0-9]+)?$/.exec(n), stem = (m && m[1]) || '', ext = ((m && m[2]) || '').toLowerCase();
    if (!stem) stem = 'image-' + Date.now().toString(36);
    if (!IMG_EXT.test(stem + ext)) ext = '.' + (EXT_OF[type] || 'png');
    return stem + ext;
  }
  async function prepBytes(f, type, shrink) {
    if (shrink && /^image\/(png|jpeg|webp)$/.test(type) && window.createImageBitmap) {
      try {
        var bmp = await createImageBitmap(f);
        if (bmp.width > 1600) {
          var cv = document.createElement('canvas'); cv.width = 1600; cv.height = Math.round(bmp.height * 1600 / bmp.width);
          cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
          var blob = await new Promise(function (res) { cv.toBlob(res, type, 0.9); });
          if (blob) return blob.arrayBuffer();
        }
      } catch (e) { /* use the original */ }
    }
    return f.arrayBuffer();
  }
  var FOLDER_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
  function openPicker(onPick) {
    var cfg = ghCfg(), ready = ghReady(), dir = '', items = [], msg = '', working = false;
    try { dir = localStorage.getItem(DIR_KEY) || ''; } catch (e) { /* ignore */ }
    if (!dir) dir = baseDir() ? baseDir() + '/images' : 'images';
    var back = h('div', { class: 'ipk-back' }), box = h('div', { class: 'ipk', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'คลังรูปภาพ' });
    var crumbs = h('div', { class: 'ipk-crumbs' }), grid = h('div', { class: 'ipk-grid' }), note = h('small', { class: 'ipk-note' }, '');
    function close() { document.removeEventListener('keydown', esc2); back.remove(); }
    function esc2(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', esc2);
    back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });
    function pick(v) { if (onPick) { onPick(v); close(); } else { note.textContent = 'ที่อยู่รูป: ' + v; } }
    function go(d) { dir = d; try { localStorage.setItem(DIR_KEY, dir); } catch (e) { /* ignore */ } load(); }
    async function load() {
      if (!ready) { items = []; paint(); return; }
      grid.replaceChildren(h('p', { class: 'hint' }, 'กำลังโหลด…')); crumbs.replaceChildren();
      try {
        var r = await ghRequest(cfg, 'GET', null, dir);
        if (r.status === 404) { items = []; msg = 'โฟลเดอร์นี้ยังไม่มีบน GitHub (จะถูกสร้างตอนอัปโหลดรูปแรก)'; }
        else if (!r.ok) throw { status: r.status };
        else { var j = await r.json(); items = Array.isArray(j) ? j : []; msg = ''; }
      } catch (e) { items = []; msg = ghErr(e); }
      paint();
    }
    function paint() {
      crumbs.replaceChildren();
      var parts = dir.split('/').filter(Boolean), acc = '';
      crumbs.append(h('button', { type: 'button', class: 'ab', onclick: function () { go(''); } }, 'หน้าแรกของ repo'));
      parts.forEach(function (p) { acc += (acc ? '/' : '') + p; var t = acc; crumbs.append(h('span', {}, '›'), h('button', { type: 'button', class: 'ab', onclick: function () { go(t); } }, p)); });
      grid.replaceChildren();
      if (!ready) { grid.append(h('p', { class: 'hint' }, 'ยังไม่ได้ตั้งค่า GitHub (แท็บ "ทั่วไป") จึงดูโฟลเดอร์และอัปโหลดไม่ได้ ตอนนี้วางลิงก์รูปด้านล่างได้')); return; }
      if (msg) grid.append(h('p', { class: 'hint' }, msg));
      items.filter(function (x) { return x.type === 'dir'; }).forEach(function (d) {
        var ic = h('span', { class: 'fi' }); ic.innerHTML = FOLDER_SVG;
        grid.append(h('button', { type: 'button', class: 'ipk-dir', onclick: function () { go(d.path); } }, ic, h('span', {}, d.name)));
      });
      items.filter(function (x) { return x.type === 'file' && IMG_EXT.test(x.name); }).forEach(function (f) {
        var rel = relPath(f.path), src = previewMap[rel] || f.download_url || '';
        var del = armBtn(h('button', { type: 'button', class: 'ipk-del', 'aria-label': 'ลบรูป' }), '×', 'ลบ?', async function () {
          try {
            var r = await ghRequest(cfg, 'DELETE', { message: 'Delete image ' + f.name, sha: f.sha, branch: cfg.branch.trim() }, f.path);
            if (!r.ok) throw { status: r.status };
            delete previewMap[rel]; load();
          } catch (e) { note.textContent = ghErr(e); }
        });
        grid.append(h('div', { class: 'ipk-img' },
          h('button', { type: 'button', class: 'ipk-pic', title: rel, onclick: function () { pick(rel); } }, h('img', { src: src, alt: '', loading: 'lazy' }), h('span', {}, f.name)), del));
      });
      if (!msg && !items.some(function (x) { return x.type === 'dir' || IMG_EXT.test(x.name); })) grid.append(h('p', { class: 'hint' }, 'ยังไม่มีรูปหรือโฟลเดอร์ในที่นี้'));
    }
    var fileIn = h('input', { type: 'file', id: 'ipk_file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml', multiple: true });
    var nameIn = h('input', { type: 'text', id: 'ipk_name', placeholder: 'ตั้งชื่อรูป เช่น fox-plush.png (ภาษาอังกฤษ/ตัวเลข)', spellcheck: 'false' });
    var shrink = h('input', { type: 'checkbox', id: 'ipk_shrink' }); shrink.checked = true;
    fileIn.addEventListener('change', function () {
      var f = fileIn.files[0]; nameIn.disabled = fileIn.files.length !== 1; nameIn.value = fileIn.files.length === 1 ? safeName(f.name, f.type) : '';
    });
    var upBtn = h('button', { type: 'button', class: 'ab go', id: 'ipk_up' }, 'อัปโหลดเข้าโฟลเดอร์นี้');
    upBtn.addEventListener('click', async function () {
      if (working) return;
      if (!ready) { note.textContent = 'ตั้งค่า GitHub ที่แท็บ "ทั่วไป" ก่อน'; return; }
      var files = Array.prototype.slice.call(fileIn.files);
      if (!files.length) { note.textContent = 'เลือกไฟล์รูปจากเครื่องก่อน'; return; }
      working = true; upBtn.disabled = true; var last = '';
      try {
        for (var i = 0; i < files.length; i++) {
          var f = files[i], type = f.type || UPTYPES[(f.name.split('.').pop() || '').toLowerCase()];
          if (!type || !EXT_OF[type]) { note.textContent = 'รองรับเฉพาะ PNG, JPG, WebP, GIF, SVG'; continue; }
          note.textContent = 'กำลังอัปโหลด ' + (i + 1) + '/' + files.length + '…';
          var buf = await prepBytes(f, type, shrink.checked);
          var name = safeName(files.length === 1 && nameIn.value.trim() ? nameIn.value : f.name, type), stem = name.replace(/(\.[^.]+)$/, ''), ext = (/(\.[^.]+)$/.exec(name) || [''])[0], n = 1;
          var taken = function (nm) { return items.some(function (x) { return x.name === nm; }); };
          while (taken(name)) { n++; name = stem + '-' + n + ext; }
          var path = (dir ? dir + '/' : '') + name;
          var r = await ghRequest(cfg, 'PUT', { message: 'Add image ' + name, content: b64(buf), branch: cfg.branch.trim() }, path);
          if (!r.ok) throw { status: r.status };
          previewMap[relPath(path)] = 'data:' + type + ';base64,' + b64(buf); last = relPath(path);
          items.push({ name: name, type: 'file', path: path });
        }
        fileIn.value = ''; nameIn.value = '';
        await load();
        if (last) { note.textContent = 'อัปโหลดแล้ว: ' + last + ' (เว็บจริงจะเห็นรูปใน 1-2 นาที)'; if (onPick && files.length === 1) pick(last); }
      } catch (e) { note.textContent = ghErr(e); }
      working = false; upBtn.disabled = false;
    });
    var folderIn = h('input', { type: 'text', id: 'ipk_folder', placeholder: 'ชื่อโฟลเดอร์ใหม่ เช่น plush', spellcheck: 'false' });
    var folderBtn = h('button', { type: 'button', class: 'ab', onclick: function () {
      var n = folderIn.value.trim().replace(/[^A-Za-z0-9_-]/g, '');
      if (!n) { note.textContent = 'ตั้งชื่อโฟลเดอร์เป็นภาษาอังกฤษ/ตัวเลข'; return; }
      dir = (dir ? dir + '/' : '') + n; folderIn.value = ''; items = []; msg = 'โฟลเดอร์ใหม่ — จะถูกสร้างบน GitHub ตอนอัปโหลดรูปแรกเข้าที่นี่'; paint();
    } }, 'สร้างโฟลเดอร์ / เข้าโฟลเดอร์ใหม่');
    var linkIn = h('input', { type: 'text', id: 'ipk_link', placeholder: 'https://…/รูป.png', spellcheck: 'false' });
    var linkRow = onPick ? h('div', { class: 'f' }, h('span', {}, 'หรือใช้ลิงก์รูปแทน'), h('div', { class: 'row' }, linkIn,
      h('button', { type: 'button', class: 'ab', onclick: function () { var v = linkIn.value.trim(); if (!imgSrc(v)) { note.textContent = 'ลิงก์ไม่ถูกต้อง'; return; } pick(v); } }, 'ใช้ลิงก์นี้'))) : null;
    box.append(
      h('div', { class: 'ipk-head' }, h('h3', {}, onPick ? 'เลือก / อัปโหลดรูป' : 'คลังรูปภาพ'), h('button', { type: 'button', class: 'ab', onclick: close }, 'ปิด')),
      crumbs, grid,
      h('div', { class: 'f' }, h('span', {}, 'อัปโหลดรูปจากเครื่องเข้าโฟลเดอร์ที่เปิดอยู่'), fileIn, nameIn,
        h('label', { class: 'chk' }, shrink, h('span', {}, 'ย่อรูปที่กว้างเกิน 1600px ให้อัตโนมัติ (เว็บโหลดเร็วขึ้น)')), upBtn),
      h('div', { class: 'f' }, h('span', {}, 'โฟลเดอร์ใหม่'), h('div', { class: 'row' }, folderIn, folderBtn)),
      note);
    if (linkRow) box.insertBefore(linkRow, note);
    document.body.append(back); back.append(box);
    load();
  }

  function armBtn(btn, label, armedLabel, action) {
    var armed = 0;
    btn.textContent = label;
    btn.addEventListener('click', function () {
      if (!armed) { armed = 1; btn.textContent = armedLabel; setTimeout(function () { armed = 0; btn.textContent = label; }, 3000); return; }
      action();
    });
    return btn;
  }
  function listEd(path, fields, mk, titleOf) {
    var wrap = h('div', { class: 'list' });
    function draw(openIdx) {
      wrap.replaceChildren();
      var arr = getP(path);
      arr.forEach(function (it, i) {
        var t = h('span', { class: 't' }, titleOf(it, i));
        var det = h('details', { class: 'item' }, h('summary', {}, t));
        det.addEventListener('input', function () { t.textContent = titleOf(arr[i], i); });
        var delBtn = armBtn(h('button', { type: 'button', class: 'ab danger' }), 'ลบ', 'กดอีกครั้งเพื่อยืนยัน', function () { arr.splice(i, 1); changed(); draw(-1); });
        function move(dir) {
          var j = i + dir; if (j < 0 || j >= arr.length) return;
          var x = arr[i]; arr[i] = arr[j]; arr[j] = x; changed(); draw(j);
        }
        det.append(h('div', { class: 'ibody' },
          fields.map(function (f) { return f(path + '.' + i); }),
          h('div', { class: 'row' },
            h('button', { type: 'button', class: 'ab', disabled: i === 0, onclick: function () { move(-1); } }, 'ขึ้น'),
            h('button', { type: 'button', class: 'ab', disabled: i === arr.length - 1, onclick: function () { move(1); } }, 'ลง'),
            delBtn)));
        if (i === openIdx) det.open = true;
        wrap.append(det);
      });
      wrap.append(h('div', { class: 'row' }, h('button', { type: 'button', class: 'ab', onclick: function () { arr.push(mk()); changed(); draw(arr.length - 1); } }, '+ เพิ่มรายการ')));
    }
    draw(-1);
    return wrap;
  }
  function T(f, label, o) { return function (b) { return fText(b + '.' + f, label, o); }; }
  function C(f, label) { return function (b) { return fColor(b + '.' + f, label); }; }
  function I(f, label) { return function (b) { return fImage(b + '.' + f, label); }; }

  var ITEM_FIELDS = {
    products: [T('name', 'ชื่อสินค้า'), T('price', 'ราคา / ระดับ', { hint: 'เช่น $19.99 หรือระดับ Common, Epic ใช้เรียงลำดับในหน้า View all ได้' }), T('tag', 'ป้ายมุมรูป', { hint: 'เช่น New หรือ Sale เว้นว่างถ้าไม่ใช้' }),
      C('color', 'สีตุ๊กตา (ภาพวาดเริ่มต้น)'), I('image', 'รูปสินค้า'), T('link', 'ลิงก์ซื้อ (ใช้กับปุ่มซื้อในหน้ารายละเอียด)', { type: 'url', ph: 'https://…' }),
      function (b) { return fItemId(b); }, function (b) { return detailBtn(b); }],
    cards: [T('title', 'ชื่อ'), T('desc', 'คำอธิบาย', { area: true }), T('status', 'ราคา / สถานะ', { hint: 'เช่น $4.99 หรือ Coming soon' }), C('color', 'สีการ์ด')],
    posts: [T('title', 'หัวข้อโพสต์'), T('date', 'วันที่'), T('excerpt', 'เนื้อหาย่อ', { area: true }), T('link', 'ลิงก์อ่านต่อ', { type: 'url', ph: 'https://…' })],
    faq: [T('q', 'คำถาม'), T('a', 'คำตอบ', { area: true, rows: 4 })]
  };
  var ITEM_TITLE = {
    products: function (it) { return it.name || '(ไม่มีชื่อ)'; },
    cards: function (it) { return it.title || '(ไม่มีชื่อ)'; },
    posts: function (it) { return it.title || '(ไม่มีชื่อ)'; },
    faq: function (it) { return it.q || '(ไม่มีคำถาม)'; }
  };

  /* renaming a section's anchor also updates every link that pointed at the old one */
  function renameAnchor(i, v) {
    var sec = state.sections[i], old = sec.id;
    var base = cleanId(v), id = base, n = 2;
    function taken(x) { return state.sections.some(function (s, j) { return j !== i && s.id === x; }); }
    while (taken(id)) id = base + '-' + (n++);
    if (id === old) return;
    sec.id = id;
    function fix(o, k) { if (o && o[k] === '#' + old) o[k] = '#' + id; }
    state.nav.forEach(function (x) { fix(x, 'href'); });
    state.footer.links.forEach(function (x) { fix(x, 'href'); });
    fix(state.site, 'helpHref'); fix(state.hero, 'ctaHref');
    state.sections.forEach(function (s) { fix(s, 'allHref'); fix(s, 'ctaHref'); });
    changed();
  }
  function fAnchor(i) {
    var inp = h('input', { id: fid('sections.' + i + '.id'), type: 'text' });
    inp.value = state.sections[i].id;
    inp.addEventListener('change', function () { renameAnchor(i, inp.value); inp.value = state.sections[i].id; });
    return h('label', { class: 'f' }, h('span', {}, 'ลิงก์ย่อยของหมวด (anchor)'),
      h('div', { class: 'row anchor' }, h('code', {}, '#'), inp),
      h('small', {}, 'เมนูที่ใส่ #ชื่อนี้ จะเลื่อนมาที่หมวดนี้ ใช้ตัวอักษรอังกฤษพิมพ์เล็ก ตัวเลข - และ _ เท่านั้น ถ้าเปลี่ยน เมนูที่ลิงก์มาหาชื่อเก่าจะถูกอัปเดตตามให้'));
  }

  /* a small list whose rows can be moved up / down */
  function orderList(rows, commit, emptyMsg) {
    var list = h('div', { class: 'olist' });
    function draw() {
      list.replaceChildren();
      var r = rows();
      if (!r.length) list.append(h('p', { class: 'hint' }, emptyMsg));
      r.forEach(function (x, k) {
        function mv(d) { var j = k + d; if (j < 0 || j >= r.length) return; var t = r[k]; r[k] = r[j]; r[j] = t; commit(r); draw(); }
        list.append(h('div', { class: 'orow' }, h('span', { class: 'ol' }, (k + 1) + '. ' + x.label),
          h('button', { type: 'button', class: 'ab', 'aria-label': 'เลื่อนขึ้น', disabled: k === 0, onclick: function () { mv(-1); } }, '▲'),
          h('button', { type: 'button', class: 'ab', 'aria-label': 'เลื่อนลง', disabled: k === r.length - 1, onclick: function () { mv(1); } }, '▼')));
      });
    }
    draw();
    list.refresh = draw;
    return list;
  }
  function frontBox(i) {
    var sec = state.sections[i];
    var mode = selectField('สินค้าที่โชว์หน้าแรก', 'f_front_' + i, [
      ['first', 'ป้ายมุมรูปขึ้นก่อน ที่เหลือเรียงตามปกติ'], ['only', 'โชว์เฉพาะสินค้าที่มีป้ายมุมรูป'], ['natural', 'เรียงตามลำดับรายการ (ไม่สนใจป้าย)']],
      sec.frontMode || 'first', function (v) { sec.frontMode = v; changed(); });
    var list = orderList(function () {
      return orderedTagged(sec).map(function (e) { return { id: e.it.id, label: plain(e.it.name) + ' [' + plain(e.it.tag) + ']' }; });
    }, function (r) { sec.front = r.map(function (x) { return x.id; }); changed(); }, 'ยังไม่มีสินค้าที่ใส่ป้ายมุมรูป ใส่ได้ที่ช่อง "ป้ายมุมรูป" ของแต่ละสินค้า');
    var box = h('div', { class: 'part' }, h('h4', {}, 'หน้าแรก: สินค้าที่มีป้ายมุมรูป'), mode,
      h('p', { class: 'hint' }, 'ลำดับสินค้าที่มีป้าย บนสุดคืออยู่หน้าสุด ใช้กับหน้าแรกเท่านั้น หน้า View all ไม่ได้รับผลกระทบ'), list);
    box.refresh = list.refresh;
    return box;
  }
  function levelBox(i) {
    var sec = state.sections[i];
    var on = h('input', { type: 'checkbox', id: 'f_sortlv_' + i }); on.checked = sec.sortLevels !== false;
    on.addEventListener('change', function () { sec.sortLevels = on.checked; changed(); });
    var list = orderList(function () {
      return levelOrder(sec).map(function (l) { return { key: l.key, label: l.label + ' (' + l.count + ' ชิ้น)' }; });
    }, function (r) { sec.levels = r.map(function (x) { return x.key; }); changed(); }, 'ยังไม่มีสินค้าที่ใส่ราคา / ระดับ');
    var box = h('div', { class: 'part' }, h('h4', {}, 'หน้า View all: เรียงตามระดับ'),
      h('label', { class: 'f chk' }, on, h('span', {}, 'เรียงสินค้าตามระดับด้านล่าง')),
      h('p', { class: 'hint' }, 'ระดับดึงมาจากช่อง "ราคา / ระดับ" ของสินค้า (เช่น Common, Epic) บนสุดคือแสดงก่อน ระดับเดียวกันเรียงตามลำดับรายการ'), list);
    box.refresh = list.refresh;
    return box;
  }

  function sectionsTab() {
    var wrap = h('div', { class: 'list' });
    function secLabel(sec) { return (sec.title || '(ไม่มีชื่อ)') + ' · #' + sec.id + (sec.show ? '' : ' (ซ่อน)'); }
    function draw(openIdx) {
      wrap.replaceChildren();
      state.sections.forEach(function (sec, i) {
        var P = 'sections.' + i, t = h('span', { class: 't' }, secLabel(sec));
        var det = h('details', { class: 'item' }, h('summary', {}, t));
        det.addEventListener('input', function () { t.textContent = secLabel(sec); });
        det.addEventListener('change', function () { t.textContent = secLabel(sec); });
        var f = [h('small', {}, 'ชนิด: ' + TYPES[sec.type]), fText(P + '.title', 'ชื่อหมวดหมู่ (หัวข้อที่แสดงบนเว็บ)'), fAnchor(i), fCheck(P + '.show', 'แสดงหมวดนี้ในหน้าเว็บ')];
        if (sec.type === 'about') {
          f.push(fText(P + '.body', 'เนื้อหา', { area: true, rows: 5 }),
            fText(P + '.bullets', 'จุดเด่น (บรรทัดละข้อ)', { area: true, rows: 4 }),
            fText(P + '.cta', 'ข้อความปุ่ม', { hint: 'เว้นว่างเพื่อซ่อนปุ่ม' }),
            fText(P + '.ctaHref', 'ลิงก์ปุ่ม', { list: 'hrefs' }),
            fImage(P + '.image', 'รูปภาพ'));
        } else {
          f.push(fText(P + '.allText', 'ข้อความปุ่ม View all', { hint: 'เว้นว่างเพื่อซ่อนปุ่ม' }),
            fText(P + '.allHref', 'ลิงก์ของ View all', { list: 'hrefs', hint: 'เว้นว่างเพื่อเปิดหน้ารวมของหมวดนี้ในแท็บใหม่' }),
            fText(P + '.limit', 'จำนวนที่โชว์หน้าแรก', { type: 'number', hint: 'เว้นว่างเพื่อใช้ค่ากลางในแท็บทั่วไป' }));
          if (sec.type === 'products') {
            var fbx = frontBox(i), lbx = levelBox(i);
            f.push(fText(P + '.buyText', 'ข้อความปุ่มสินค้า', { hint: 'เว้นว่างเพื่อซ่อนปุ่ม' }), fbx, lbx);
            var rf = function () { fbx.refresh(); lbx.refresh(); };
            det.addEventListener('input', rf); det.addEventListener('change', rf);
          }
          f.push(h('h3', {}, 'รายการในหมวดนี้'), listEd(P + '.items', ITEM_FIELDS[sec.type], NEW_ITEM[sec.type], ITEM_TITLE[sec.type]));
        }
        function move(dir) {
          var j = i + dir; if (j < 0 || j >= state.sections.length) return;
          var x = state.sections[i]; state.sections[i] = state.sections[j]; state.sections[j] = x;
          changed(); draw(j);
        }
        var delBtn = armBtn(h('button', { type: 'button', class: 'ab danger' }), 'ลบหมวดนี้', 'กดอีกครั้งเพื่อยืนยัน (รายการข้างในหายทั้งหมด)', function () { state.sections.splice(i, 1); changed(); draw(-1); });
        f.push(h('div', { class: 'row' },
          h('button', { type: 'button', class: 'ab', disabled: i === 0, onclick: function () { move(-1); } }, 'ย้ายขึ้น'),
          h('button', { type: 'button', class: 'ab', disabled: i === state.sections.length - 1, onclick: function () { move(1); } }, 'ย้ายลง'),
          delBtn));
        det.append(h('div', { class: 'ibody' }, f));
        if (i === openIdx) det.open = true;
        wrap.append(det);
      });
      var sel = h('select', { id: 'f_newsection_type' });
      Object.keys(TYPES).forEach(function (k) { sel.append(h('option', { value: k }, TYPES[k])); });
      wrap.append(h('div', { class: 'f' }, h('span', {}, 'เพิ่มหมวดหมู่ใหม่'),
        h('div', { class: 'row' }, sel, h('button', { type: 'button', class: 'ab', onclick: function () {
          var s = newSection(sel.value), base = cleanId(s.id), id = base, n = 2;
          while (state.sections.some(function (x) { return x.id === id; })) id = base + '-' + (n++);
          s.id = id;
          state.sections.push(s);
          state.nav.push({ label: s.title, href: '#' + id });
          changed(); draw(state.sections.length - 1);
          setTimeout(function () { var el = document.getElementById(id); if (el) el.scrollIntoView(); }, 80);
        } }, '+ เพิ่ม')),
        h('small', {}, 'หมวดใหม่จะถูกเพิ่มลงในเมนูด้านบนให้ด้วย ลบหรือเปลี่ยนชื่อได้ในแท็บเมนู')));
    }
    draw(-1);
    return [h('p', { class: 'hint' }, 'แต่ละหมวดคือหนึ่งส่วนในหน้าเว็บ เปลี่ยนชื่อ เปลี่ยนลิงก์ย่อย # ซ่อน ย้ายลำดับ หรือสร้างหมวดใหม่ได้ที่นี่'), wrap];
  }

  /* ---------- per-text style (color / size / font) ---------- */
  function locate(path) {
    var ks = path.split('.'), key = ks.pop();
    var obj = ks.reduce(function (o, k) { return o == null ? o : o[k]; }, state);
    return obj && typeof obj === 'object' ? { obj: obj, key: key } : null;
  }
  function rgbToHex(c) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || '');
    return m ? toHex([+m[1], +m[2], +m[3]]) : '#0c2340';
  }
  function updStyle(patch) {
    var loc = locate(selPath); if (!loc) return;
    var o = loc.obj; o._s = o._s || {};
    var st = o._s[loc.key] || {};
    for (var k in patch) { if (patch[k] === null) delete st[k]; else st[k] = patch[k]; }
    if (Object.keys(st).length) o._s[loc.key] = st; else delete o._s[loc.key];
    if (!Object.keys(o._s).length) delete o._s;
    changed();
  }
  function highlight() {
    siteEl.querySelectorAll('.tx.sel').forEach(function (e) { e.classList.remove('sel'); });
    if (selPath) { var el = siteEl.querySelector('[data-k="' + selPath + '"]'); if (el) el.classList.add('sel'); }
  }
  function selectText(path) {
    selPath = path; highlight();
    if (curTab !== 'style') showTab('style'); else if (drawSel) drawSel();
  }
  function setStyleMode(on) {
    if (on && cpMode !== 'off') { cpMode = 'off'; document.body.classList.remove('cp-copy', 'cp-paste'); }
    if (on && mediaMode) { mediaMode = false; selMed = ''; document.body.classList.remove('media-mode'); }
    styleMode = on;
    syncAll();
    document.body.classList.toggle('style-mode', on);
    if (!on) selPath = '';
    renderSite();
    if (drawSel) drawSel();
  }
  /* colour / size for only a part of one text */
  function partBox(loc, el) {
    if (el && el.classList.contains('wm')) {
      return h('p', { class: 'hint' }, 'ตัวอักษรใหญ่แบบมีขอบ ใส่สีเฉพาะบางตัวไม่ได้ ใช้สีของทั้งข้อความด้านบนแทน');
    }
    var ta = h('textarea', { id: 'f_st_text', rows: 3, spellcheck: 'false' });
    ta.value = String(L(loc.obj, loc.key));
    var prev = h('div', { class: 'picked' });
    var note = h('small', {}, '');
    function showPrev() { prev.innerHTML = rich(ta.value) || '(ว่าง)'; }
    function commit() { setT(loc.obj, loc.key, ta.value); showPrev(); changed(); }
    ta.addEventListener('input', function () { note.textContent = ''; commit(); });
    showPrev();
    var colorIn = h('input', { type: 'color', id: 'f_pt_color' }); colorIn.value = '#e11d48';
    var useColor = h('input', { type: 'checkbox', id: 'f_pt_usecolor' }); useColor.checked = true;
    var rng = h('input', { type: 'range', id: 'f_pt_size', min: 40, max: 300, step: 5 }); rng.value = 100;
    var rbIn = h('input', { type: 'checkbox', id: 'f_pt_rainbow' });
    var linkIn = h('input', { type: 'text', id: 'f_pt_link', placeholder: '#code หรือ https://…', list: 'hrefs' });
    var out = h('code', {}, '100%');
    rng.addEventListener('input', function () { out.textContent = rng.value + '%'; });
    function apply() {
      var a = ta.selectionStart, b = ta.selectionEnd;
      if (a === b) { note.textContent = 'ลากคลุมตัวอักษรในช่องข้อความด้านบนก่อน แล้วค่อยกดปุ่ม'; return; }
      var n = +rng.value;
      var lk = linkIn.value.trim().replace(/[|{}]/g, '');
      if (!useColor.checked && !rbIn.checked && n === 100 && !lk) { note.textContent = 'ติ๊ก "ใส่สี" เลื่อนขนาด หรือใส่ลิงก์ก่อน'; return; }
      var sel = plain(ta.value.slice(a, b));
      var tag = '{' + (rbIn.checked ? '~' : useColor.checked ? colorIn.value.toLowerCase() : '') + (n !== 100 ? ';' + n : '') + (lk ? '@' + lk : '') + '|' + sel + '}';
      var res = ta.value.slice(0, a) + tag + ta.value.slice(b);
      if (/[{}]/.test(res.replace(RICH_RE, ''))) {
        note.textContent = 'เลือกคร่อมส่วนที่ใส่สีไว้แล้วไม่ได้ ให้เลือกคลุมทั้งก้อน {…} หรือกด "ล้างสีย่อย" ก่อน';
        return;
      }
      ta.value = res; note.textContent = 'ใส่แล้ว'; commit();
    }
    return h('div', { class: 'part' },
      h('h4', {}, 'เปลี่ยนเฉพาะบางส่วนของข้อความ'),
      h('p', { class: 'hint' }, 'ลากคลุมตัวอักษรในช่องด้านล่าง (บนมือถือให้กดค้างแล้วลาก) เลือกสี/ขนาด/ลิงก์ แล้วกด "ใส่ให้ส่วนที่เลือก" ตัวอักษรจะมีเครื่องหมาย {#สี|…} ล้อมไว้ อย่าลบเครื่องหมายนั้นถ้ายังอยากให้มีสี'),
      h('label', { class: 'f' }, h('span', {}, 'ข้อความ (แก้ได้ตรงนี้)'), ta),
      h('div', { class: 'f' }, h('span', {}, 'ตัวอย่าง'), prev),
      h('div', { class: 'f' }, h('span', {}, 'สีของส่วนที่เลือก'), h('div', { class: 'row' },
        h('label', { class: 'chk' }, useColor, h('span', {}, 'ใส่สี')), colorIn,
        h('label', { class: 'chk rbw-chk' }, rbIn, h('span', { class: 'rbw-txt' }, 'สีรุ้ง (ใช้แทนสีด้านซ้าย)')))),
      h('div', { class: 'f' }, h('span', {}, 'ขนาดของส่วนที่เลือก (100% = ไม่เปลี่ยน)'), h('div', { class: 'row' }, rng, out)),
      h('label', { class: 'f' }, h('span', {}, 'ให้ส่วนที่เลือกกดได้ (ลิงก์ หรือ # ของหมวด เว้นว่าง = ไม่เป็นลิงก์)'), linkIn,
        h('small', {}, 'ใช้กับข้อความที่ไม่ใช่ปุ่ม/ลิงก์อยู่แล้ว ถ้าข้อความนั้นอยู่ในปุ่มหรือเมนู ลิงก์ย่อยจะใช้ไม่ได้')),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'ab go', onclick: apply }, 'ใส่ให้ส่วนที่เลือก'),
        h('button', { type: 'button', class: 'ab', onclick: function () { ta.value = plain(ta.value); note.textContent = 'ล้างสีย่อยแล้ว'; commit(); } }, 'ล้างสีย่อย')),
      note);
  }
  function styleTab() {
    var box = h('div', { class: 'stylebox' });
    var cb = h('input', { type: 'checkbox', id: 'f_stylemode' });
    cb.checked = styleMode;
    cb.addEventListener('change', function () { setStyleMode(cb.checked); });
    syncers.push(function () { cb.checked = styleMode; });
    drawSel = function () {
      box.replaceChildren();
      var loc = selPath && locate(selPath);
      if (!loc) { box.append(h('p', { class: 'hint' }, styleMode ? 'คลิกข้อความในหน้าเว็บที่ต้องการแก้ แล้วตัวเลือกจะขึ้นตรงนี้' : 'เปิดโหมดด้านบนก่อน แล้วคลิกข้อความในหน้าเว็บ')); return; }
      var st = (loc.obj._s && loc.obj._s[loc.key]) || {};
      var el = siteEl.querySelector('[data-k="' + selPath + '"]');
      var snippet = (el ? el.textContent : String(L(loc.obj, loc.key) || '')).trim().slice(0, 60);
      var cur = okHex(st.color) ? st.color : (el ? rgbToHex(getComputedStyle(el).color) : '#0c2340');
      var colorIn = h('input', { type: 'color', id: 'f_st_color' }); colorIn.value = cur;
      var colorCode = h('code', {}, st.color === 'rainbow' ? 'สีรุ้ง' : okHex(st.color) ? st.color : 'สีเดิม');
      colorIn.addEventListener('input', function () { colorCode.textContent = colorIn.value; updStyle({ color: colorIn.value }); });
      var size = parseInt(st.size, 10) || 100;
      var rng = h('input', { type: 'range', id: 'f_st_size', min: 40, max: 300, step: 5 }); rng.value = size;
      var out = h('code', {}, size + '%');
      rng.addEventListener('input', function () { out.textContent = rng.value + '%'; updStyle({ size: +rng.value === 100 ? null : +rng.value }); });
      box.append(
        h('div', { class: 'f' }, h('span', {}, 'ข้อความที่เลือก'), h('div', { class: 'picked' }, snippet || '(ว่าง)')),
        h('div', { class: 'f' }, h('span', {}, 'สีตัวอักษร'), h('div', { class: 'row' }, colorIn, colorCode,
          h('button', { type: 'button', class: 'ab rbw-btn', id: 'f_st_rainbow', onclick: function () { updStyle({ color: 'rainbow' }); drawSel(); } }, 'สีรุ้ง'),
          h('button', { type: 'button', class: 'ab', onclick: function () { updStyle({ color: null }); drawSel(); } }, 'ใช้สีเดิม'))),
        h('div', { class: 'f' }, h('span', {}, 'ขนาดตัวอักษร'), h('div', { class: 'row' }, rng, out)),
        h('label', { class: 'f' }, h('span', {}, 'ฟอนต์'), fontSelect('f_st_font', st.font, function (v) { updStyle({ font: v || null }); })),
        partBox(loc, el),
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'ab danger', onclick: function () { updStyle({ color: null, size: null, font: null }); drawSel(); } }, 'ล้างสไตล์ของข้อความนี้')));
    };
    drawSel();
    return [
      h('p', { class: 'hint' }, 'เปิดโหมดนี้ แล้วคลิกข้อความไหนก็ได้ในหน้าเว็บ (ชื่อเมนู หัวข้อ ชื่อสินค้า ราคา ปุ่ม ข้อความท้ายเว็บ ฯลฯ) เพื่อเปลี่ยนสี ขนาด และฟอนต์ของข้อความนั้น ระหว่างเปิดโหมดนี้ การคลิกลิงก์จะไม่พาไปหน้าอื่น'),
      h('label', { class: 'f chk' }, cb, h('span', {}, 'เปิดโหมดคลิกเลือกข้อความในหน้าเว็บ')),
      box, cpBox()
    ];
  }

  /* ---------- pictures inside categories / cards: drag them in, they grow the card, text wraps around ---------- */
  var mediaMode = false, selMed = '', mdrag = null;
  function medParse(path) { var p = path.split(':'); return p[0] === 's' ? { cont: 's:' + p[1], k: +p[2] } : { cont: 'i:' + p[1] + ':' + p[2], k: +p[3] }; }
  function medHolder(cont) {
    var p = cont.split(':'), sec = state.sections[+p[1]]; if (!sec) return null;
    return p[0] === 's' ? sec : (sec.items[+p[2]] || null);
  }
  function medArr(cont, create) {
    var o = medHolder(cont); if (!o) return null;
    if (create && !Array.isArray(o.media)) o.media = [];
    return Array.isArray(o.media) ? o.media : null;
  }
  function medGet(path) { var r = medParse(path), a = medArr(r.cont); return (a && a[r.k]) || null; }
  function medStatePath(path) {
    var p = path.split(':');
    return p[0] === 's' ? 'sections.' + p[1] + '.media.' + p[2] : 'sections.' + p[1] + '.items.' + p[2] + '.media.' + p[3];
  }
  function medWhere(cont) {
    var p = cont.split(':'), sec = state.sections[+p[1]]; if (!sec) return '?';
    return p[0] === 's' ? (sec.title || sec.id) + ' (ทั้งหมวด)' : (sec.title || sec.id) + ' › ' + plain((sec.items[+p[2]] || {})[sec.type === 'faq' ? 'q' : 'title'] || '');
  }
  function setMediaMode(on) {
    if (on) { if (cpMode !== 'off') setCpMode('off'); if (styleMode) setStyleMode(false); }
    mediaMode = on; selMed = '';
    document.body.classList.toggle('media-mode', on);
    renderSite(); syncAll();
  }
  function stopMedia() {
    if (!mediaMode) return;
    mediaMode = false; selMed = ''; document.body.classList.remove('media-mode'); renderSite();
  }
  function medZone(c, x, y) {
    var r = c.getBoundingClientRect(), fx = (x - r.left) / (r.width || 1), fy = (y - r.top) / (r.height || 1);
    return { align: fx < 0.33 ? 'left' : fx > 0.67 ? 'right' : 'center', pos: fy > 0.5 ? 'bottom' : 'top' };
  }
  var ZL = { left: 'ซ้าย', center: 'กลาง', right: 'ขวา', top: 'บน', bottom: 'ล่าง' };
  function medClearDrop() {
    siteEl.querySelectorAll('.drop-on').forEach(function (n) { n.classList.remove('drop-on'); n.removeAttribute('data-zone'); });
  }
  function onMedDown(e) {
    if (!mediaEdit() || (e.button && e.button > 0)) return;
    var fig = e.target.closest && e.target.closest('.med'); if (!fig) return;
    e.preventDefault();
    var path = fig.dataset.med, handle = !!e.target.closest('.rh');
    if (!medGet(path)) return;
    if (selMed !== path) { selMed = path; renderSite(); showTab('media'); fig = siteEl.querySelector('[data-med="' + path + '"]') || fig; }
    mdrag = { path: path, mode: handle ? 'size' : 'move', sx: e.clientX, sy: e.clientY, ow: fig.getBoundingClientRect().width, moved: false, ghost: null, target: null, zone: null };
    window.addEventListener('pointermove', onMedMove);
    window.addEventListener('pointerup', onMedUp);
    window.addEventListener('pointercancel', onMedUp);
  }
  function onMedMove(e) {
    if (!mdrag) return;
    var m = medGet(mdrag.path); if (!m) return;
    var dx = e.clientX - mdrag.sx, dy = e.clientY - mdrag.sy;
    if (!mdrag.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
    mdrag.moved = true;
    var fig = siteEl.querySelector('[data-med="' + mdrag.path + '"]');
    if (mdrag.mode === 'size') {
      m.w = Math.max(40, Math.min(1600, Math.round(mdrag.ow + dx)));
      if (fig) fig.style.width = m.w + 'px';
      var inp = document.getElementById('f_md_w'); if (inp && document.activeElement !== inp) inp.value = m.w;
      return;
    }
    if (!mdrag.ghost) {
      var g = document.createElement('div'); g.className = 'med-ghost';
      g.innerHTML = fig ? fig.innerHTML.replace(/<i class="rh"><\/i>/, '') : '';
      document.body.appendChild(g); mdrag.ghost = g;
      if (fig) fig.classList.add('dragging');
    }
    mdrag.px = e.clientX; mdrag.py = e.clientY;
    medHover();
    if (!mdrag.timer) mdrag.timer = setInterval(medAuto, 30);
  }
  function medHover() {
    if (!mdrag || !mdrag.ghost) return;
    mdrag.ghost.style.left = mdrag.px + 'px'; mdrag.ghost.style.top = mdrag.py + 'px';
    var under = document.elementFromPoint(mdrag.px, mdrag.py), c = under && under.closest ? under.closest('[data-mc]') : null;
    medClearDrop();
    mdrag.target = c ? c.dataset.mc : null; mdrag.zone = null;
    if (c) { mdrag.zone = medZone(c, mdrag.px, mdrag.py); c.classList.add('drop-on'); c.dataset.zone = ZL[mdrag.zone.align] + ' · ' + ZL[mdrag.zone.pos]; }
  }
  // scroll the page while a picture is held near the top / bottom edge of the window
  function medAuto() {
    if (!mdrag || !mdrag.ghost) return;
    var H = window.innerHeight, edge = 70, v = mdrag.py < edge ? -Math.ceil((edge - mdrag.py) / 5) : mdrag.py > H - edge ? Math.ceil((mdrag.py - (H - edge)) / 5) : 0;
    if (v) { window.scrollBy(0, v); medHover(); }
  }
  function onMedUp() {
    window.removeEventListener('pointermove', onMedMove);
    window.removeEventListener('pointerup', onMedUp);
    window.removeEventListener('pointercancel', onMedUp);
    var d = mdrag; mdrag = null; if (!d) return;
    if (d.timer) clearInterval(d.timer);
    if (d.ghost) d.ghost.remove();
    medClearDrop();
    if (!d.moved) return;
    if (d.mode === 'size') { changed(); return; }
    var siteFig = siteEl.querySelector('[data-med="' + d.path + '"]'); if (siteFig) siteFig.classList.remove('dragging');
    if (!d.target || !d.zone) return;
    var r = medParse(d.path), from = medArr(r.cont), to = medArr(d.target, true); if (!from || !to) return;
    var m = from.splice(r.k, 1)[0]; if (!m) return;
    m.align = d.zone.align; m.pos = d.zone.pos;
    to.push(m);
    selMed = d.target + ':' + (to.length - 1);
    changed(); showTab('media');
  }

  function mediaTab() {
    var box = h('div', { class: 'dbox' });
    var cb = h('input', { type: 'checkbox', id: 'f_mediamode' }); cb.checked = mediaMode;
    cb.addEventListener('change', function () { setMediaMode(cb.checked); showTab('media'); });
    syncers.push(function () { cb.checked = mediaMode; });
    var secs = state.sections.map(function (s, i) { return [String(i), (s.title || s.id) + ' · #' + s.id]; }).filter(function (o) { return state.sections[+o[0]].type !== 'about'; });
    var target = h('select', { id: 'f_md_target' }); secs.forEach(function (o) { target.append(h('option', { value: o[0] }, o[1])); });
    function addImg() {
      if (!secs.length) return;
      var si = +target.value, sec = state.sections[si];
      if (!Array.isArray(sec.media)) sec.media = [];
      sec.media.push(cleanMedia([{ src: '', w: 360, align: 'center', pos: 'top', r: 12 }])[0]);
      selMed = 's:' + si + ':' + (sec.media.length - 1);
      if (!mediaMode) { setMediaMode(true); selMed = 's:' + si + ':' + (sec.media.length - 1); }
      changed(); showTab('media');
      if (view !== 'home') location.hash = '#' + sec.id;
      else setTimeout(function () { var f = siteEl.querySelector('[data-med="' + selMed + '"]') || document.getElementById(sec.id); if (f) f.scrollIntoView({ block: 'center' }); }, 150);
    }
    var list = h('div', { class: 'elist' }), n = 0;
    function eachMedia(fn) {
      state.sections.forEach(function (sec, si) {
        (sec.media || []).forEach(function (m, k) { fn(m, 's:' + si + ':' + k, 's:' + si); });
        if (sec.type !== 'products' && Array.isArray(sec.items)) sec.items.forEach(function (it, ii) { if (it) (it.media || []).forEach(function (m, k) { fn(m, 'i:' + si + ':' + ii + ':' + k, 'i:' + si + ':' + ii); }); });
      });
    }
    eachMedia(function (m, path, cont) {
      n++;
      list.append(h('button', { type: 'button', class: 'erow' + (path === selMed ? ' on' : ''), onclick: function () {
        if (!mediaMode) setMediaMode(true);
        selMed = path; renderSite(); showTab('media');
        var f = siteEl.querySelector('[data-med="' + path + '"]'); if (f) f.scrollIntoView({ block: 'center' });
      } }, n + '. ' + (m.src ? m.src.slice(-16) : '(ยังไม่มีรูป)') + ' → ' + medWhere(cont)));
    });
    if (!n) list.append(h('p', { class: 'hint' }, 'ยังไม่มีรูป เลือกหมวดด้านบนแล้วกด "+ เพิ่มรูป"'));
    box.append(
      h('p', { class: 'hint' }, 'เพิ่มรูปในหมวดที่เลือก แล้วลากรูปไปวางบนแถบข้อความ (การ์ดโพสต์, แถบคำถาม, การ์ดสี) แถบนั้นจะขยายให้พอดีกับรูป วางด้านซ้าย/ขวาข้อความจะไหลล้อมรูป วางตรงกลางรูปจะอยู่เหนือหรือใต้ข้อความ จึงไม่บังข้อความ'),
      h('label', { class: 'f chk' }, cb, h('span', {}, 'เปิดโหมดจัดรูป (คลิก/ลากรูปในหน้าเว็บ)')),
      h('label', { class: 'f' }, h('span', {}, 'เพิ่มรูปในหมวด'), target),
      h('div', { class: 'row' }, h('button', { type: 'button', class: 'ab go', onclick: addImg }, '+ เพิ่มรูป')),
      list);
    var m = selMed && medGet(selMed);
    if (m) {
      var r = medParse(selMed), arr = medArr(r.cont), MP = medStatePath(selMed);
      box.append(h('div', { class: 'part' }, h('h4', {}, 'รูปที่เลือก'),
        h('small', {}, 'อยู่ที่: ' + medWhere(r.cont)),
        fImage(MP + '.src', 'ไฟล์รูป'),
        numField('f_md_w', 'ความกว้าง (px) หรือลากจุดเหลืองที่มุมรูป', m.w, 40, 1600, function (v) { m.w = v; changed(); }),
        selectField('ชิดข้าง', 'f_md_align', [['left', 'ซ้าย (ข้อความไหลล้อมทางขวา)'], ['center', 'กึ่งกลาง (รูปอยู่คนละบรรทัดกับข้อความ)'], ['right', 'ขวา (ข้อความไหลล้อมทางซ้าย)']], m.align, function (v) { m.align = v; changed(); }),
        selectField('ตำแหน่งในแถบ', 'f_md_pos', [['top', 'ก่อนข้อความ'], ['bottom', 'หลังข้อความ']], m.pos, function (v) { m.pos = v; changed(); }),
        numField('f_md_r', 'ความมนของมุมรูป', m.r, 0, 200, function (v) { m.r = v; changed(); }),
        h('div', { class: 'row' }, armBtn(h('button', { type: 'button', class: 'ab danger' }), 'ลบรูปนี้', 'กดอีกครั้งเพื่อยืนยัน', function () { arr.splice(r.k, 1); selMed = ''; changed(); showTab('media'); }))));
    }
    return [box];
  }

  /* ---------- copy / paste text (with font, colour, size) ---------- */
  var cpMode = 'off', textClip = null, cpMsg = '', syncers = [];
  function syncAll() { syncers.forEach(function (f) { f(); }); }
  function setCpMode(m) {
    cpMode = m; cpMsg = '';
    if (m !== 'off') stopMedia();
    document.body.classList.toggle('cp-copy', m === 'copy');
    document.body.classList.toggle('cp-paste', m === 'paste');
    if (m !== 'off' && styleMode) setStyleMode(false);
    syncAll();
  }
  function clipLabel() {
    var base = textClip ? 'ที่คัดลอกไว้: “' + (plain(textClip.text).replace(/\s+/g, ' ').slice(0, 28) || '(ว่าง)') + '” · ' + (textClip.color || 'สีเดิม') + ' · ' + textClip.size + 'px · ' + (textClip.font || 'ฟอนต์เดิม') : 'ยังไม่ได้คัดลอกข้อความ';
    return (cpMsg ? cpMsg + ' — ' : '') + base;
  }
  function cpBox() {
    var note = h('small', {}), row = h('div', { class: 'seg' });
    var btns = [['off', 'ปิด'], ['copy', 'คัดลอกข้อความ'], ['paste', 'วางข้อความ']].map(function (o) {
      var b = h('button', { type: 'button', class: 'segb', 'data-m': o[0], onclick: function () { setCpMode(o[0]); } }, o[1]);
      row.append(b); return b;
    });
    function sync() { btns.forEach(function (b) { b.classList.toggle('on', b.dataset.m === cpMode); b.setAttribute('aria-pressed', b.dataset.m === cpMode ? 'true' : 'false'); }); note.textContent = clipLabel(); }
    syncers.push(sync); sync();
    return h('div', { class: 'part' }, h('h4', {}, 'คัดลอก / วางข้อความ'),
      h('p', { class: 'hint' }, '1) กด "คัดลอกข้อความ" แล้วคลิกข้อความที่ต้องการ (เก็บทั้งข้อความ ฟอนต์ สี และขนาด)  2) กด "วางข้อความ" แล้วคลิกที่ว่างในหน้ารายละเอียดสินค้า จะได้ข้อความใหม่ที่ลากย้ายได้อิสระ หรือคลิกทับข้อความเดิมเพื่อแทนที่ข้อความนั้น (ทั้งตัวอักษรและสไตล์)  3) เสร็จแล้วกด "ปิด"'),
      row, note);
  }
  function cpFlash(msg) { cpMsg = msg; syncAll(); }
  function doCopy(de, tx) {
    var c = null;
    if (de) {
      var f = curItemF(), d = f.it.detail || defaultDetail(), el = d.els[+de.dataset.i];
      if (!el || el.t === 'img') { cpFlash('คัดลอกได้เฉพาะข้อความและปุ่ม'); return; }
      var txt = el.t === 'text' && el.bind ? L(f.it, el.bind) : L(el, 'text');
      c = { text: String(txt == null ? '' : txt), color: el.color || '', size: el.size, font: el.font || '', align: el.align, bold: !!el.bold, w: el.w };
    } else {
      var loc = locate(tx.dataset.k); if (!loc) return;
      var st = (loc.obj._s && loc.obj._s[loc.key]) || {}, cs = getComputedStyle(tx);
      c = { text: String(L(loc.obj, loc.key)), color: (okHex(st.color) || st.color === 'rainbow') ? st.color : '', size: Math.round(parseFloat(cs.fontSize) || 20),
        font: FONTS[st.font] ? st.font : '', align: 'left', bold: parseInt(cs.fontWeight, 10) >= 700, w: Math.max(80, Math.min(700, Math.round(tx.getBoundingClientRect().width) + 24)) };
    }
    textClip = c; cpFlash('คัดลอกแล้ว');
  }
  function doPaste(de, stage, tx, e) {
    var c = textClip;
    if (!c) { cpFlash('ยังไม่ได้คัดลอกข้อความ'); return; }
    if (de || stage) {
      var f = curItemF(), d = ensureDetail(f.it);
      if (de) {
        var i = +de.dataset.i, el = d.els[i];
        if (!el || el.t === 'img') { cpFlash('วางทับรูปไม่ได้'); return; }
        setT(el, 'text', c.text); el.color = c.color; el.size = c.size; el.font = c.font; el.bold = c.bold;
        if (el.t === 'text') { el.bind = ''; el.align = c.align; }
        selEl = i;
      } else {
        var r = stage.getBoundingClientRect(), sc = r.width / DW || 1;
        d.els.push(cleanEl({ t: 'text', text: c.text, x: (e.clientX - r.left) / sc, y: (e.clientY - r.top) / sc, w: c.w || 320, color: c.color, size: c.size, font: c.font, align: c.align, bold: c.bold }));
        if (lang === 'th') d.els[d.els.length - 1]._t = { text: c.text };
        selEl = d.els.length - 1;
      }
      changed(); showTab('detail'); cpFlash('วางแล้ว');
      return;
    }
    var loc = locate(tx.dataset.k); if (!loc) return;
    var o = loc.obj, old = (o._s && o._s[loc.key]) || {}, cs = getComputedStyle(tx);
    var base = (parseFloat(cs.fontSize) || 16) / ((parseInt(old.size, 10) || 100) / 100);
    var pct = Math.max(40, Math.min(300, Math.round(c.size / base * 100 / 5) * 5)), st = {};
    if (c.color) st.color = c.color;
    if (c.font) st.font = c.font;
    if (Math.abs(pct - 100) >= 5) st.size = pct;
    setT(o, loc.key, c.text); o._s = o._s || {};
    if (Object.keys(st).length) o._s[loc.key] = st; else delete o._s[loc.key];
    if (!Object.keys(o._s).length) delete o._s;
    changed(); cpFlash('วางแล้ว');
  }

  /* ---------- product id + detail page editor ---------- */
  var selEl = -1, lockRatio = true, lastCE = false, drag = null, layoutClip = null;
  var CLIP_KEY = 'candy-cove-layout';

  function fItemId(b) {
    var it = getP(b), inp = h('input', { id: fid(b + '.id'), type: 'text' });
    inp.value = it.id || '';
    inp.addEventListener('change', function () {
      var old = it.id; it.id = itemIdBase(inp.value);
      fixItemIds(state, false);
      inp.value = it.id;
      if (old && old !== it.id) {
        var a = '#' + old + '-details', z = '#' + it.id + '-details';
        function fix(o, k) { if (o && o[k] === a) o[k] = z; }
        state.nav.forEach(function (x) { fix(x, 'href'); });
        state.footer.links.forEach(function (x) { fix(x, 'href'); });
        fix(state.site, 'helpHref'); fix(state.hero, 'ctaHref');
        state.sections.forEach(function (s) { fix(s, 'allHref'); fix(s, 'ctaHref'); });
        state.sections.forEach(function (s) { if (Array.isArray(s.front)) s.front = s.front.map(function (x) { return x === old ? it.id : x; }); });
      }
      changed();
    });
    return h('label', { class: 'f' }, h('span', {}, 'ชื่อลิงก์หน้ารายละเอียด'),
      h('div', { class: 'row anchor' }, h('code', {}, '#'), inp, h('code', {}, '-details')),
      h('small', {}, 'ตัวอักษรอังกฤษพิมพ์เล็ก ตัวเลข และ - เท่านั้น ไม่ซ้ำกับชิ้นอื่น เว้นว่างเพื่อให้ระบบตั้งเป็นเลขให้'));
  }
  function detailBtn(b) {
    var it = getP(b);
    return h('div', { class: 'row' }, h('button', { type: 'button', class: 'ab go', onclick: function () {
      location.hash = '#' + it.id + '-details';
    } }, 'แก้หน้ารายละเอียดของชิ้นนี้'));
  }

  function curItemF() { return view.indexOf('item-') === 0 ? findItem(view.slice(5)) : null; }
  function canvasEdit() { return !!(adminBuilt && drawer && !drawer.hidden && curTab === 'detail' && view.indexOf('item-') === 0); }
  function syncCE() {
    var c = canvasEdit();
    if (c !== lastCE) { lastCE = c; if (view.indexOf('item-') === 0) renderSite(); }
  }
  function ensureDetail(it) { if (!it.detail) it.detail = defaultDetail(); return it.detail; }
  function afterView() {
    if (!adminBuilt) return;
    selEl = -1;
    if (!drawer.hidden && (view.indexOf('item-') === 0 || curTab === 'detail')) showTab('detail');
    syncCE();
  }
  function paintEl(i, el) {
    var n = siteEl.querySelector('.de[data-i="' + i + '"]'); if (!n) return;
    n.style.left = el.x + 'px'; n.style.top = el.y + 'px'; n.style.width = el.w + 'px';
    if (el.t === 'img') n.style.height = el.h + 'px';
  }
  function syncFields(el) {
    ['x', 'y', 'w', 'h'].forEach(function (k) {
      var inp = document.getElementById('f_de_' + k);
      if (inp && el[k] != null && document.activeElement !== inp) inp.value = el[k];
    });
  }

  /* drag to move, corner handle to resize (all in design units, so it works at any screen width) */
  function onDown(e) {
    if (!canvasEdit() || cpMode !== 'off' || (e.button && e.button > 0)) return;
    var st = e.target.closest && e.target.closest('.dstage'); if (!st) return;
    var f = curItemF(); if (!f) return;
    var de = e.target.closest('.de');
    if (!de) { if (selEl !== -1) { selEl = -1; renderSite(); showTab('detail'); } return; }
    e.preventDefault();
    ensureDetail(f.it);
    var i = +de.dataset.i, el = f.it.detail.els[i]; if (!el) return;
    var handle = !!e.target.closest('.rh');
    if (selEl !== i) { selEl = i; renderSite(); showTab('detail'); }
    drag = { i: i, f: f, mode: handle ? 'size' : 'move', sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y, ow: el.w, oh: el.h || 0, moved: false };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }
  function onMove(e) {
    if (!drag) return;
    var el = drag.f.it.detail.els[drag.i]; if (!el) return;
    var stg = siteEl.querySelector('.dstage'), sc = stg ? stg.getBoundingClientRect().width / DW : 1;
    var dx = (e.clientX - drag.sx) / (sc || 1), dy = (e.clientY - drag.sy) / (sc || 1);
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 2) return;
    drag.moved = true;
    var snap = e.shiftKey ? 10 : 1;
    function q(v) { return Math.round(v / snap) * snap; }
    if (drag.mode === 'move') { el.x = q(drag.ox + dx); el.y = q(drag.oy + dy); }
    else {
      el.w = Math.max(20, q(drag.ow + dx));
      if (el.t === 'img') el.h = lockRatio && drag.ow ? Math.max(20, Math.round(el.w * drag.oh / drag.ow)) : Math.max(20, q(drag.oh + dy));
    }
    paintEl(drag.i, el); syncFields(el);
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    var moved = drag && drag.moved; drag = null;
    if (moved) changed();
  }
  document.addEventListener('keydown', function (e) {
    if (!canvasEdit() || selEl < 0) return;
    var t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!d) return;
    var f = curItemF(); if (!f || !f.it.detail) return;
    var el = f.it.detail.els[selEl]; if (!el) return;
    e.preventDefault();
    var s = e.shiftKey ? 10 : 1; el.x += d[0] * s; el.y += d[1] * s;
    syncFields(el); changed();
  });

  function numField(id, label, val, lo, hi, fn) {
    var inp = h('input', { id: id, type: 'number', step: 1, min: lo, max: hi }); inp.value = val;
    inp.addEventListener('change', function () { var v = parseFloat(inp.value); inp.value = isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : lo; });
    inp.addEventListener('input', function () {
      var v = parseFloat(inp.value); if (!isFinite(v)) return;
      fn(Math.max(lo, Math.min(hi, Math.round(v))));
    });
    return h('label', { class: 'f' }, h('span', {}, label), inp);
  }
  function colorRow(label, cur, setFn, rainbow) {
    var inp = h('input', { type: 'color' }); inp.value = okHex(cur) ? cur : '#000000';
    var code = h('code', {}, cur === 'rainbow' ? 'สีรุ้ง' : okHex(cur) ? cur : 'สีเดิม');
    inp.addEventListener('input', function () { code.textContent = inp.value; setFn(inp.value); });
    return h('div', { class: 'f' }, h('span', {}, label), h('div', { class: 'row' }, inp, code,
      rainbow ? h('button', { type: 'button', class: 'ab rbw-btn', onclick: function () { code.textContent = 'สีรุ้ง'; setFn('rainbow'); } }, 'สีรุ้ง') : null,
      h('button', { type: 'button', class: 'ab', onclick: function () { code.textContent = 'สีเดิม'; setFn(''); } }, 'ใช้สีเดิม')));
  }
  function selectField(label, id, opts, cur, fn) {
    var sel = h('select', { id: id });
    opts.forEach(function (o) { sel.append(h('option', { value: o[0] }, o[1])); });
    sel.value = cur;
    sel.addEventListener('change', function () { fn(sel.value); });
    return h('label', { class: 'f' }, h('span', {}, label), sel);
  }

  function readClip() {
    if (layoutClip) return layoutClip;
    try { var r = localStorage.getItem(CLIP_KEY); if (r) { var o = JSON.parse(r), d = cleanDetail(o); if (d && o.part) d.part = true; return d; } } catch (e) { /* none */ }
    return null;
  }
  function clipJson(d) { return JSON.stringify({ candyCoveLayout: 1, part: d.part ? 1 : 0, h: d.h, els: d.els }); }
  /* partial paste: add the copied pieces to a page, keep what is already there */
  function addPieces(it, c) {
    var d = ensureDetail(it), add = clone(c.els).slice(0, Math.max(0, 100 - d.els.length)), first = d.els.length, low = d.h;
    add.forEach(function (e) { d.els.push(e); low = Math.max(low, (e.y || 0) + (e.t === 'img' ? e.h || 0 : 80) + 40); });
    d.h = Math.min(DMAX, Math.max(DMIN, low));
    return add.length ? first : -1;
  }
  function writeClip(d) {
    layoutClip = d;
    try { localStorage.setItem(CLIP_KEY, clipJson(d)); } catch (e) { /* storage unavailable */ }
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(clipJson(d)).catch(function () {}); } catch (e) { /* ignore */ }
  }
  function applyLayout(it, d) {
    it.detail = cleanDetail(clone(d)); selEl = -1; changed(); showTab('detail');
  }

  function detailPicker() {
    var out = [h('p', { class: 'hint' }, 'หน้ารายละเอียดคือหน้าที่เปิดเมื่อกดปุ่มใต้สินค้า เลือกสินค้าด้านล่างเพื่อเข้าไปจัดหน้า (หรือกดปุ่มใต้สินค้าในหน้าเว็บได้เลย) ในหน้านั้นลากข้อความ รูป และปุ่มวางตรงไหนก็ได้')];
    var any = false;
    state.sections.forEach(function (s) {
      if (s.type !== 'products' || !s.items.length) return;
      any = true;
      out.push(h('h3', {}, s.title || s.id));
      s.items.forEach(function (it) {
        out.push(h('div', { class: 'row' }, h('button', { type: 'button', class: 'ab', onclick: function () { location.hash = '#' + it.id + '-details'; } },
          plain(it.name) || '(ไม่มีชื่อ)', ' → #' + it.id + '-details')));
      });
    });
    if (!any) out.push(h('p', { class: 'hint' }, 'ยังไม่มีหมวดสินค้า สร้างได้ที่แท็บหมวดหมู่'));
    return out;
  }

  function detailTab() {
    var f = curItemF();
    if (!f) return detailPicker();
    var it = f.it, P = 'sections.' + f.si + '.items.' + f.i + '.detail';
    var box = h('div', { class: 'dbox' });
    function elLabel(el) {
      if (el.t === 'img') return 'รูป' + (el.bind === 'main' ? ' (รูปสินค้า)' : el.src ? ' ' + el.src.slice(-18) : ' (ยังไม่มีรูป)');
      var t = el.t === 'btn' ? 'ปุ่ม: ' : 'ข้อความ: ';
      var v = el.t === 'text' && el.bind ? { name: '{ชื่อสินค้า}', price: '{ราคา}', tag: '{ป้าย}' }[el.bind] : plain(el.text);
      return t + (String(v).replace(/\s+/g, ' ').slice(0, 26) || '(ว่าง)');
    }
    function select(i) { ensureDetail(it); selEl = i; renderSite(); showTab('detail'); }
    function add(t) {
      var d = ensureDetail(it), n = d.els.length, o = 60 + (n % 8) * 18;
      var e = t === 'text' ? { t: 'text', text: 'New text', x: o, y: o, w: 320, size: 26 }
        : t === 'img' ? { t: 'img', x: o, y: o, w: 300, h: 300 }
        : { t: 'btn', text: 'Buy now', x: o, y: o, w: 240, size: 24 };
      d.els.push(cleanEl(e)); selEl = d.els.length - 1; changed(); showTab('detail');
    }
    function elForm(el) {
      var EP = P + '.els.' + selEl, k = [];
      k.push(h('div', { class: 'two' },
        numField('f_de_x', 'ตำแหน่ง X', el.x, -2000, 4000, function (v) { el.x = v; paintEl(selEl, el); changed(); }),
        numField('f_de_y', 'ตำแหน่ง Y', el.y, -2000, 6000, function (v) { el.y = v; paintEl(selEl, el); changed(); })));
      if (el.t === 'img') {
        k.push(h('div', { class: 'two' },
          numField('f_de_w', 'กว้าง', el.w, 10, 4000, function (v) {
            if (lockRatio && el.w) el.h = Math.max(10, Math.round(v * el.h / el.w));
            el.w = v; paintEl(selEl, el); syncFields(el); changed();
          }),
          numField('f_de_h', 'สูง', el.h, 10, 4000, function (v) {
            if (lockRatio && el.h) el.w = Math.max(10, Math.round(v * el.w / el.h));
            el.h = v; paintEl(selEl, el); syncFields(el); changed();
          })));
        var lk = h('input', { type: 'checkbox', id: 'f_de_lock' }); lk.checked = lockRatio;
        lk.addEventListener('change', function () { lockRatio = lk.checked; });
        k.push(h('label', { class: 'f chk' }, lk, h('span', {}, 'ล็อกสัดส่วนรูปตอนปรับขนาด')));
        var useMain = h('input', { type: 'checkbox', id: 'f_de_main' }); useMain.checked = el.bind === 'main';
        useMain.addEventListener('change', function () { el.bind = useMain.checked ? 'main' : ''; changed(); showTab('detail'); });
        k.push(h('label', { class: 'f chk' }, useMain, h('span', {}, 'ใช้รูปของสินค้าชิ้นนี้ (เปลี่ยนตามสินค้าแต่ละชิ้น)')));
        if (el.bind !== 'main') k.push(fImage(EP + '.src', 'รูปที่ใส่ในตำแหน่งนี้'));
        k.push(selectField('การแสดงรูป', 'f_de_fit', [['contain', 'เห็นครบทั้งรูป'], ['cover', 'เต็มกรอบ (ตัดขอบ)']], el.fit, function (v) { el.fit = v; changed(); }));
        k.push(numField('f_de_radius', 'ความมนของมุม', el.radius, 0, 500, function (v) { el.radius = v; changed(); }));
      } else {
        k.push(numField('f_de_w', 'กว้าง', el.w, 10, 4000, function (v) { el.w = v; paintEl(selEl, el); changed(); }));
        if (el.t === 'text') {
          k.push(selectField('ข้อความ', 'f_de_bind', [['', 'พิมพ์เองตรงนี้'], ['name', 'ชื่อสินค้า (เปลี่ยนตามสินค้าแต่ละชิ้น)'], ['price', 'ราคา (เปลี่ยนตามสินค้า)'], ['tag', 'ป้ายมุมรูป (เปลี่ยนตามสินค้า)']], el.bind,
            function (v) { el.bind = v; changed(); showTab('detail'); }));
          if (el.bind) k.push(h('p', { class: 'hint' }, 'ข้อความนี้ดึงจากข้อมูลสินค้า แก้ได้ที่แท็บหมวดหมู่ เมื่อคัดลอกแบบไปวางกับสินค้าอื่น จะเปลี่ยนเป็นของสินค้าชิ้นนั้นเอง'));
          else k.push(partBox({ obj: el, key: 'text' }, null));
        } else {
          k.push(fText(EP + '.text', 'ข้อความบนปุ่ม'));
          k.push(fText(EP + '.href', 'ลิงก์ปุ่ม', { type: 'url', ph: 'เว้นว่าง = ใช้ลิงก์ซื้อของสินค้านี้' }));
          k.push(colorRow('สีพื้นปุ่ม', el.bg, function (v) { el.bg = v; changed(); }));
        }
        k.push(numField('f_de_size', 'ขนาดตัวอักษร (px)', el.size, 6, 300, function (v) { el.size = v; changed(); }));
        k.push(colorRow('สีตัวอักษร (ระดับ/ชื่อ/ข้อความ/ปุ่ม)', el.color, function (v) { el.color = v; changed(); }, true));
        k.push(h('label', { class: 'f' }, h('span', {}, 'ฟอนต์'), fontSelect('f_de_font', el.font, function (v) { el.font = v; changed(); })));
        if (el.t === 'text') k.push(selectField('จัดข้อความ', 'f_de_align', [['left', 'ชิดซ้าย'], ['center', 'กึ่งกลาง'], ['right', 'ชิดขวา']], el.align, function (v) { el.align = v; changed(); }));
        k.push(fCheck(EP + '.bold', 'ตัวหนา'));
      }
      var els = it.detail.els, i = selEl;
      function mv(dir) {
        var j = i + dir; if (j < 0 || j >= els.length) return;
        var x = els[i]; els[i] = els[j]; els[j] = x; selEl = j; changed(); showTab('detail');
      }
      k.push(h('div', { class: 'row' },
        h('button', { type: 'button', class: 'ab', disabled: i === els.length - 1, onclick: function () { mv(1); } }, 'ดึงมาด้านหน้า'),
        h('button', { type: 'button', class: 'ab', disabled: i === 0, onclick: function () { mv(-1); } }, 'ส่งไปด้านหลัง')));
      k.push(h('div', { class: 'row' },
        h('button', { type: 'button', class: 'ab', onclick: function () {
          var c = clone(el); c.x += 24; c.y += 24; els.push(c); selEl = els.length - 1; changed(); showTab('detail');
        } }, 'ทำสำเนา'),
        armBtn(h('button', { type: 'button', class: 'ab danger' }), 'ลบชิ้นนี้', 'กดอีกครั้งเพื่อยืนยัน', function () { els.splice(i, 1); selEl = -1; changed(); showTab('detail'); })));
      return h('div', { class: 'part' }, h('h4', {}, 'ชิ้นที่เลือก: ' + elLabel(el)), k);
    }
    function layoutBox() {
      var code = h('textarea', { id: 'f_de_code', rows: 3, spellcheck: 'false', placeholder: 'โค้ดแบบจะขึ้นตรงนี้หลังกดคัดลอก หรือวางโค้ดที่คัดลอกไว้จากที่อื่นลงตรงนี้' });
      var note = h('small', {}, '');
      var clip = readClip();
      function flash(t) { note.textContent = t; }
      var sameSection = h('div', { class: 'row' });
      var pick = {}, cur = it.detail || defaultDetail();
      if (selEl >= 0 && selEl < cur.els.length) pick[selEl] = true;
      var checks = h('div', { class: 'pickl' });
      cur.els.forEach(function (el, i) {
        var cb = h('input', { type: 'checkbox', id: 'f_pick_' + i }); cb.checked = !!pick[i];
        cb.addEventListener('change', function () { pick[i] = cb.checked; });
        checks.append(h('label', { class: 'chk' }, cb, h('span', {}, (i + 1) + '. ' + elLabel(el))));
      });
      function pasteLabel() { var c = readClip(); return c && c.part ? 'วางชิ้นที่คัดลอกไว้ เพิ่มลงหน้านี้' : 'วางแบบที่คัดลอกไว้ลงหน้านี้'; }
      var pasteBtn = h('button', { type: 'button', class: 'ab go', disabled: !clip }, pasteLabel());
      pasteBtn.addEventListener('click', function () {
        var c = readClip(); if (!c) return;
        if (c.part) { var at = addPieces(it, c); selEl = at; changed(); showTab('detail'); return; }
        if (it.detail && it.detail.els.length && !pasteBtn.dataset.armed) {
          pasteBtn.dataset.armed = '1'; pasteBtn.textContent = 'กดอีกครั้งเพื่อทับแบบเดิมของหน้านี้';
          setTimeout(function () { delete pasteBtn.dataset.armed; pasteBtn.textContent = pasteLabel(); }, 3000); return;
        }
        applyLayout(it, c);
      });
      var allBtn = armBtn(h('button', { type: 'button', class: 'ab', disabled: !clip }), 'วางกับสินค้าทุกชิ้นในหมวดนี้', 'กดอีกครั้ง (ชิ้นที่คัดลอกจะถูกเพิ่ม / ถ้าคัดลอกทั้งหน้า แบบเดิมของทุกชิ้นในหมวดจะถูกทับ)', function () {
        var c = readClip(); if (!c) return;
        f.sec.items.forEach(function (x) { if (x && typeof x === 'object') { if (c.part) addPieces(x, c); else x.detail = cleanDetail(clone(c)); } });
        selEl = -1; changed(); showTab('detail'); flash('วางกับสินค้าทุกชิ้นในหมวดนี้แล้ว');
      });
      sameSection.append(allBtn);
      return h('div', { class: 'part' },
        h('h4', {}, 'คัดลอก / วางแบบหน้า'),
        h('p', { class: 'hint' }, 'คัดลอกตำแหน่ง ขนาด สี และฟอนต์ ไปวางกับสินค้าอื่น ข้อความที่เลือก "ดึงจากข้อมูลสินค้า" และรูปที่ใช้ "รูปของสินค้า" จะเปลี่ยนเป็นของสินค้าชิ้นนั้นเอง'),
        h('h4', {}, 'คัดลอกเฉพาะบางชิ้น'),
        h('p', { class: 'hint' }, 'ติ๊กชิ้นที่ต้องการ (หรือคลิกชิ้นนั้นในหน้าเว็บก่อน จะถูกติ๊กให้) แล้วกดคัดลอก เวลาวางจะเพิ่มเข้าไปในหน้าอื่นโดยไม่ลบของเดิม'),
        checks,
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'ab', onclick: function () { cur.els.forEach(function (_, i) { pick[i] = true; var c = document.getElementById('f_pick_' + i); if (c) c.checked = true; }); } }, 'ติ๊กทั้งหมด'),
          h('button', { type: 'button', class: 'ab', onclick: function () { cur.els.forEach(function (_, i) { pick[i] = false; var c = document.getElementById('f_pick_' + i); if (c) c.checked = false; }); } }, 'ล้างที่ติ๊ก'),
          h('button', { type: 'button', class: 'ab go', onclick: function () {
            var els = cur.els.filter(function (_, i) { return pick[i]; });
            if (!els.length) { flash('ติ๊กอย่างน้อย 1 ชิ้นก่อน'); return; }
            var d = cleanDetail({ h: cur.h, els: clone(els) }); d.part = true; writeClip(d); code.value = clipJson(d);
            pasteBtn.disabled = false; allBtn.disabled = false; pasteBtn.textContent = pasteLabel();
            flash('คัดลอก ' + d.els.length + ' ชิ้นแล้ว ไปที่หน้าสินค้าอื่นแล้วกดวางเพิ่ม');
          } }, 'คัดลอกเฉพาะชิ้นที่ติ๊ก')),
        h('h4', {}, 'คัดลอกทั้งหน้า'),
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'ab go', onclick: function () {
            var d = cleanDetail(clone(it.detail || defaultDetail())); writeClip(d); code.value = clipJson(d);
            pasteBtn.disabled = false; allBtn.disabled = false; pasteBtn.textContent = pasteLabel();
            flash('คัดลอกแบบแล้ว (' + d.els.length + ' ชิ้น) ไปที่หน้าสินค้าอื่นแล้วกดวาง');
          } }, 'คัดลอกแบบหน้านี้'), pasteBtn),
        sameSection,
        h('label', { class: 'f' }, h('span', {}, 'โค้ดแบบ (ใช้ข้ามเครื่องหรือข้ามแท็บได้)'), code),
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'ab', onclick: function () {
          try {
            var o = JSON.parse(code.value);
            if (!o || !Array.isArray(o.els)) throw new Error('bad');
            var d = cleanDetail(o); if (o.part) d.part = true; writeClip(d);
            if (d.part) { selEl = addPieces(it, d); changed(); showTab('detail'); } else applyLayout(it, d);
          } catch (e) { flash('โค้ดไม่ถูกต้อง ต้องเป็นโค้ดที่ได้จากปุ่มคัดลอกแบบ'); }
        } }, 'วางจากโค้ดนี้')),
        note);
    }
    function draw() {
      box.replaceChildren();
      var d = it.detail || defaultDetail();
      var addRow = h('div', { class: 'row' },
        h('button', { type: 'button', class: 'ab go', onclick: function () { add('text'); } }, '+ ข้อความ'),
        h('button', { type: 'button', class: 'ab go', onclick: function () { add('img'); } }, '+ รูป'),
        h('button', { type: 'button', class: 'ab go', onclick: function () { add('btn'); } }, '+ ปุ่ม'));
      var list = h('div', { class: 'elist' });
      d.els.forEach(function (el, i) {
        list.append(h('button', { type: 'button', class: 'erow' + (i === selEl ? ' on' : ''), onclick: function () { select(i); } }, (i + 1) + '. ' + elLabel(el)));
      });
      if (!d.els.length) list.append(h('p', { class: 'hint' }, 'ยังไม่มีชิ้นใดในหน้านี้ กด + เพื่อเพิ่ม'));
      box.append(
        h('div', { class: 'f' }, h('span', {}, 'กำลังแก้หน้ารายละเอียดของ'), h('div', { class: 'picked' }, plain(it.name) || '(ไม่มีชื่อ)'),
          h('small', {}, 'ที่อยู่หน้านี้ #' + it.id + '-details · ชื่อแท็บของเบราว์เซอร์ใช้ชื่อสินค้านี้')),
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'ab', onclick: function () { location.hash = '#top'; } }, '← เลือกสินค้าอื่น')),
        h('p', { class: 'hint' }, 'คลิกที่ชิ้นในหน้าเว็บเพื่อเลือก ลากเพื่อย้าย ลากจุดเหลืองมุมขวาล่างเพื่อปรับขนาด ปุ่มลูกศรบนคีย์บอร์ดขยับทีละ 1 (กด Shift ค้าง = ทีละ 10 และตอนลากจะจับเป็นช่อง 10)'),
        numField('f_de_H', 'ความลึกของหน้า = ความสูงพื้นที่วาง (ต่ำสุด 600 ปรับลดกว่านี้ไม่ได้ เพิ่มได้ถึง 12000, กว้างคงที่ 1000)', d.h, DMIN, DMAX, function (v) { ensureDetail(it).h = v; changed(); }),
        addRow, list, cpBox());
      if (selEl >= 0 && it.detail && it.detail.els[selEl]) box.append(elForm(it.detail.els[selEl]));
      box.append(layoutBox());
      box.append(h('div', { class: 'row' }, armBtn(h('button', { type: 'button', class: 'ab danger' }), 'ล้างกลับเป็นแบบเริ่มต้น', 'กดอีกครั้งเพื่อยืนยัน', function () {
        delete it.detail; selEl = -1; changed(); showTab('detail');
      })));
    }
    draw();
    return [box];
  }

  function setLang(l) {
    if (l !== 'th') l = 'en';
    lang = l;
    try { localStorage.setItem('candy-cove-lang', l); } catch (e) { /* ignore */ }
    document.documentElement.lang = l;
    renderSite();
    if (adminBuilt) {
      if (drawerLang) drawerLang.setAttribute('aria-checked', l === 'th' ? 'true' : 'false');
      if (!drawer.hidden) { var y = bodyEl.scrollTop; showTab(curTab); bodyEl.scrollTop = y; }
    }
  }
  var drawerLang = null;
  function langBtn() {
    var b = h('button', { class: 'lang', type: 'button', role: 'switch', 'aria-label': 'Language EN / TH' }, h('span', {}, 'EN'), h('span', {}, 'TH'), h('i', { class: 'knob' }));
    b.setAttribute('aria-checked', lang === 'th' ? 'true' : 'false');
    b.addEventListener('click', function () { setLang(lang === 'th' ? 'en' : 'th'); });
    syncers.push(function () { b.setAttribute('aria-checked', lang === 'th' ? 'true' : 'false'); });
    return b;
  }
  function langSwitch() { return h('div', { class: 'f langrow' }, langBtn(), h('small', {}, lang === 'th' ? 'ตอนนี้: กำลังแก้ข้อความไทย' : 'ตอนนี้: กำลังแก้ข้อความอังกฤษ')); }

  function ghBox() {
    if (mode !== 'local') return null;
    var c = ghCfg(), note = h('small', {}, '');
    function inp(id, key, label, o) {
      var i = h('input', { id: id, type: o && o.pw ? 'password' : 'text', autocomplete: 'off', spellcheck: 'false', placeholder: (o && o.ph) || '' }); i.value = c[key];
      i.addEventListener('input', function () { c[key] = i.value; ghSave(c); refreshStatus(); });
      return h('label', { class: 'f' }, h('span', {}, label), i, o && o.hint ? h('small', {}, o.hint) : null);
    }
    return h('details', { class: 'part', open: !ghReady() },
      h('summary', {}, 'ส่งขึ้นเว็บเลยโดยไม่ต้องอัปโหลดเอง (GitHub)'),
      h('p', { class: 'hint' }, 'ตั้งค่าครั้งเดียว แล้วปุ่ม "นำไปใช้กับเว็บเลย" จะส่งการแก้ไขขึ้น GitHub ให้ เว็บจริงอัปเดตเองใน 1-2 นาที ไม่ต้องโหลดไฟล์ไปวางทับ'),
      inp('f_gh_repo', 'repo', 'Repo (ชื่อผู้ใช้/ชื่อrepo)', { ph: 'ชื่อผู้ใช้/ชื่อrepo' }),
      inp('f_gh_branch', 'branch', 'Branch', { ph: 'main' }),
      inp('f_gh_path', 'path', 'ไฟล์ที่จะอัปเดต', { ph: 'index.html' }),
      inp('f_gh_token', 'token', 'โทเคน GitHub (Fine-grained token)', { pw: true, ph: 'github_pat_…',
        hint: 'สร้างที่ GitHub › Settings › Developer settings › Fine-grained tokens เลือกเฉพาะ repo นี้ และ Permissions › Contents = Read and write โทเคนเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ถูกใส่ในไฟล์เว็บ ใช้เฉพาะเครื่องที่ไว้ใจได้ และถ้าหลุดให้ลบโทเคนที่ GitHub ทันที' }),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'ab go', onclick: async function () {
          if (!ghReady()) { note.textContent = 'กรอก repo, branch, ไฟล์ และโทเคนให้ครบก่อน'; return; }
          note.textContent = 'กำลังทดสอบ…';
          try { var st = await ghTest(c); note.textContent = st === 200 ? 'เชื่อมต่อได้ และพบไฟล์ ✓' : 'เชื่อมต่อได้ ✓ (ยังไม่มีไฟล์นี้ จะสร้างให้ตอนนำไปใช้)'; } catch (e) { note.textContent = ghErr(e); }
        } }, 'ทดสอบการเชื่อมต่อ'),
        h('button', { type: 'button', class: 'ab', onclick: function () { c.token = ''; ghSave(c); showTab('general'); } }, 'ลบโทเคนออกจากเครื่องนี้')),
      note);
  }

  var TABS = {
    general: ['ทั่วไป', function () {
      return [
        ghBox(),
        h('h3', {}, 'ภาษา EN / TH'),
        h('p', { class: 'hint' }, 'สวิตช์ EN/TH ด้านบนเว็บสลับทั้งหน้า ข้อความที่คุณเขียนเอง 2 ภาษา ไม่มีการแปลอัตโนมัติ: เมื่อสวิตช์อยู่ที่ EN ช่องที่ติดป้าย EN จะเป็นข้อความอังกฤษ เมื่ออยู่ที่ TH ช่องจะเป็นข้อความไทย (เว้นว่างไว้ = หน้าไทยจะโชว์ข้อความอังกฤษแทน) ลิงก์ รูป และสีใช้ร่วมกันทั้งสองภาษา'),
        langSwitch(),
        h('h3', {}, 'ชื่อและลิงก์'),
        fText('site.name', 'ชื่อเว็บ / แบรนด์'),
        fImage('site.logo', 'รูปโลโก้บนแถบเมนู (เว้นว่างเพื่อใช้โลโก้เริ่มต้น)'),
        fText('site.shopUrl', 'ลิงก์ร้านค้า', { type: 'url', ph: 'https://…', hint: 'ใช้กับปุ่มสินค้าที่ไม่ได้ใส่ลิงก์เอง' }),
        h('h3', {}, 'ข้อความประจำเว็บ (ปุ่ม/คำแจ้ง)'),
        fText('site.ui.search', 'ช่องค้นหา (ข้อความจาง)'),
        fText('site.ui.noresult', 'ไม่พบสินค้าที่ค้นหา'),
        fText('site.ui.back', 'หน้า View all: ปุ่มกลับ (ข้อความ)'),
        fText('site.backHref', 'หน้า View all: ปุ่มกลับไปที่ไหน', { list: 'hrefs', ph: '#top', hint: 'ใส่ # ของหมวด เช่น #merch หรือลิงก์เว็บ เว้นว่าง = กลับบนสุด' }),
        fText('site.ui.backDetail', 'หน้ารายละเอียดสินค้า: ปุ่มกลับ (ข้อความ)'),
        fText('site.detailBackHref', 'หน้ารายละเอียดสินค้า: ปุ่มกลับไปที่ไหน', { list: 'hrefs', ph: 'เว้นว่าง = กลับไป View all ของหมวดนั้น', hint: 'เว้นว่าง = กดแล้วกลับไปหน้า View all ของหมวดหมู่ที่สินค้านั้นอยู่ (แนะนำ) หรือใส่ # / ลิงก์ของคุณเองให้ทุกสินค้าไปที่เดียวกัน' }),
        fText('site.ui.more', 'ปุ่ม Read more ของบทความ'),
        fText('site.ui.empty', 'หมวดที่ยังไม่มีรายการ'),
        fText('site.limit', 'จำนวนรายการที่โชว์หน้าแรกต่อหมวด', { type: 'number', hint: 'ค่าเริ่มต้น 6 ส่วนที่เหลืออยู่ในหน้า View all ของหมวดนั้น' }),
        h('h3', {}, 'สีของเว็บ'),
        fColor('site.colors.primary', 'สีหลัก (แถบหัวข้อ, ท้ายเว็บ)'),
        fColor('site.colors.secondary', 'สีรอง (ส่วนล่างของแบนเนอร์)'),
        fColor('site.colors.accent', 'สีเน้น (ปุ่ม, ส่วนบนของแบนเนอร์)'),
        h('h3', {}, 'ฟอนต์หลักของทั้งเว็บ'),
        fFont('site.fonts.display', 'ฟอนต์หัวข้อ / ปุ่ม / เมนู'),
        fFont('site.fonts.body', 'ฟอนต์ข้อความทั่วไป'),
        h('p', { class: 'hint' }, 'อยากเปลี่ยนเฉพาะข้อความบางจุด ใช้แท็บ "ข้อความ"'),
        h('h3', {}, 'ท้ายเว็บ'),
        fText('footer.text', 'ข้อความท้ายเว็บ'),
        listEd('footer.links', [T('label', 'ชื่อลิงก์'), T('href', 'ลิงก์', { list: 'hrefs' })], function () { return { label: 'ลิงก์ใหม่', href: '#' }; }, function (it) { return it.label || '(ไม่มีชื่อ)'; }),
        mode === 'local' ? pwSection() : null,
        h('h3', {}, 'ล้างข้อมูล'),
        resetBtn()
      ];
    }],
    menu: ['เมนู', function () {
      return [
        h('p', { class: 'hint' }, 'เมนูด้านบนของเว็บ ใส่ #ลิงก์ย่อยของหมวด (ดูหรือเปลี่ยนได้ในแท็บหมวดหมู่) เพื่อเลื่อนไปยังหมวดนั้น หรือใส่ลิงก์เว็บเต็ม เช่น https://example.com'),
        listEd('nav', [T('label', 'ชื่อเมนู'), T('href', 'ลิงก์', { list: 'hrefs' })], function () { return { label: 'เมนูใหม่', href: '#' }; }, function (it) { return it.label || '(ไม่มีชื่อ)'; }),
        fText('site.helpHref', 'ลิงก์ของปุ่ม ?', { list: 'hrefs', ph: '#help' })
      ];
    }],
    hero: ['แบนเนอร์', function () {
      return [
        fImage('hero.logo', 'รูปโลโก้ใหญ่กลางแบนเนอร์ (ถ้าใส่ จะใช้แทนตัวอักษร 2 บรรทัดด้านล่าง)'),
        h('p', { class: 'hint' }, 'ตัวอักษรใหญ่กลางแบนเนอร์ แบ่งเป็น 2 บรรทัด'),
        fText('hero.line1', 'บรรทัดบน (สีน้ำเงิน)'), fText('hero.line2', 'บรรทัดล่าง (สีเหลือง)'),
        fText('hero.tagline', 'ข้อความใต้โลโก้'),
        fText('hero.cta', 'ข้อความปุ่ม', { hint: 'เว้นว่างเพื่อซ่อนปุ่ม' }), fText('hero.ctaHref', 'ลิงก์ปุ่ม', { list: 'hrefs' })
      ];
    }],
    sections: ['หมวดหมู่', sectionsTab],
    detail: ['หน้ารายละเอียด', detailTab],
    media: ['รูปภาพ', mediaTab],
    library: ['คลังรูป', function () {
      return [h('h3', {}, 'คลังรูป (โฟลเดอร์ใน GitHub)'),
        h('p', { class: 'hint' }, 'ดูโฟลเดอร์รูปในเว็บ อัปโหลดรูปจากเครื่อง ตั้งชื่อรูป สร้างโฟลเดอร์ และลบรูป ได้ที่นี่เลย ตอนใส่รูปในช่องรูปต่างๆ ก็กด "เลือก / อัปโหลดรูป" ได้เหมือนกัน (ต้องตั้งค่า GitHub ที่แท็บ "ทั่วไป" ก่อน)'),
        h('button', { type: 'button', class: 'ab go', id: 'open_library', onclick: function () { openPicker(null); } }, 'เปิดคลังรูป')];
    }],
    style: ['ข้อความ', styleTab]
  };

  function pwSection() {
    var a = h('input', { type: 'password', id: 'f_newpw', autocomplete: 'new-password' });
    var b = h('input', { type: 'password', id: 'f_newpw2', autocomplete: 'new-password' });
    var note = h('small', {}, '');
    var btn = h('button', { type: 'button', class: 'ab' }, 'เปลี่ยนรหัสผ่าน');
    btn.addEventListener('click', async function () {
      if (!canCrypto()) { note.textContent = 'เบราว์เซอร์นี้ใช้ระบบรหัสผ่านไม่ได้'; return; }
      if (a.value.length < 10) { note.textContent = 'รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร'; return; }
      if (a.value !== b.value) { note.textContent = 'รหัสผ่านสองช่องไม่ตรงกัน'; return; }
      state.admin = await makeLock(a.value); a.value = b.value = '';
      changed(); note.textContent = 'เปลี่ยนแล้ว ต้องดาวน์โหลด index.html แล้วอัปโหลดทับ รหัสใหม่จึงมีผลกับเว็บจริง';
    });
    return h('div', {},
      h('h3', {}, 'รหัสผ่านแก้ไขเว็บ'),
      h('p', { class: 'hint' }, 'ใช้กันคนทั่วไปเปิดแผงแก้ไข (เติม #edit ท้ายที่อยู่) ตอนนี้: ' + (hasLock() ? 'ตั้งรหัสผ่านแล้ว' : 'ยังไม่ได้ตั้ง')),
      h('label', { class: 'f' }, h('span', {}, 'รหัสผ่านใหม่ (อย่างน้อย 10 ตัวอักษร)'), a),
      h('label', { class: 'f' }, h('span', {}, 'ยืนยันรหัสผ่านใหม่'), b),
      h('div', { class: 'row' }, btn), note);
  }
  function resetBtn() {
    var b = armBtn(h('button', { type: 'button', class: 'ab danger' }), 'ใช้ค่าเริ่มต้นทั้งหมด', 'กดอีกครั้งเพื่อยืนยัน (เนื้อหาที่แก้จะหายทั้งหมด)', function () {
      var keepLock = state.admin;
      state = load({}); state.admin = keepLock; selPath = ''; changed(); showTab(curTab);
    });
    return h('div', {}, b);
  }

  function showTab(id) {
    curTab = id; syncers = [];
    if (id !== 'style') drawSel = null;
    tabsEl.querySelectorAll('.tab').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false'); });
    var keepTop = bodyEl.scrollTop;
    bodyEl.replaceChildren.apply(bodyEl, TABS[id][1]().filter(Boolean));
    bodyEl.scrollTop = id === 'detail' && keepTop && bodyEl.dataset.tab === id ? keepTop : 0;
    bodyEl.dataset.tab = id;
    syncCE();
  }
  function toggle(open) {
    drawer.hidden = !open; fab.hidden = open;
    document.body.classList.toggle('panel-open', open);
    if (open) showTab(curTab);
    else {
      if (cpMode !== 'off') setCpMode('off');
      if (styleMode) setStyleMode(false);
      stopMedia();
    }
    syncCE();
  }

  function shell(json) {
    return '<title>Candy Cove</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n' +
      '<link rel="stylesheet" href="' + FONT_URL + '">\n<link rel="stylesheet" href="app.css">\n' +
      '<script type="application/json" id="site-data">' + json + '<\/script>\n<div id="site"></div>\n<div id="admin"></div>\n<script src="app.js"><\/script>';
  }
  function jsonOut() {
    return JSON.stringify(state, null, 1).replace(/</g, '\\u003c')
      .split(String.fromCharCode(8232)).join('\\u2028').split(String.fromCharCode(8233)).join('\\u2029');
  }
  function reset() {
    var fallback = ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}';
    var styles = document.head ? document.head.querySelectorAll('style') : [];
    for (var i = 0; i < styles.length; i++) {
      if (styles[i].textContent.indexOf('[hidden]') > -1 && styles[i].textContent.indexOf('safe-area-inset') > -1) return styles[i].textContent;
    }
    return fallback;
  }
  function artifactDoc() {
    return '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>' +
      reset() + '</style></head><body>' + shell(jsonOut()) + '</body></html>';
  }
  function standaloneDoc() {
    return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
      '<title>' + esc(baseTitle || 'Candy Cove') + '</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="stylesheet" href="' + FONT_URL + '">\n<link rel="stylesheet" href="app.css">\n</head>\n<body>\n' +
      '<script type="application/json" id="site-data">' + jsonOut() + '<\/script>\n<div id="site"></div>\n<div id="admin"></div>\n<script src="app.js"><\/script>\n</body>\n</html>\n';
  }

  /* Publish straight to GitHub (the repo that serves the site) with the owner's own token. The token stays in this browser only. */
  var GH_KEY = 'candy-cove-gh';
  function ghGuess() {
    var o = { repo: '', branch: 'main', path: 'index.html', token: '' };
    try {
      if (/\.github\.io$/i.test(location.hostname)) {
        var u = location.hostname.split('.')[0], r = location.pathname.split('/')[1];
        o.repo = u + '/' + (r && !/\.html?$/i.test(r) ? r : u + '.github.io');
      }
    } catch (e) { /* ignore */ }
    return o;
  }
  function ghCfg() {
    var o = ghGuess();
    try { var r = JSON.parse(localStorage.getItem(GH_KEY) || 'null'); if (r && typeof r === 'object') for (var k in o) if (typeof r[k] === 'string') o[k] = r[k]; } catch (e) { /* none */ }
    return o;
  }
  function ghSave(o) { try { localStorage.setItem(GH_KEY, JSON.stringify(o)); } catch (e) { /* ignore */ } }
  function ghReady() { var c = ghCfg(); return /^[\w.-]+\/[\w.-]+$/.test(c.repo.trim()) && !!c.token.trim() && !!c.branch.trim() && !!c.path.trim(); }
  function utf8b64(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    return btoa(bin);
  }
  function ghErr(e) {
    var c = e && e.status;
    if (c === 401) return 'โทเคนไม่ถูกต้องหรือหมดอายุ สร้างโทเคนใหม่แล้วใส่ที่แท็บ "ทั่วไป"';
    if (c === 403) return 'โทเคนไม่มีสิทธิ์เขียน (ต้องเลือก Contents: Read and write) หรือโดนจำกัดการเรียกถี่เกินไป';
    if (c === 404) return 'ไม่พบ repo / branch นี้ หรือโทเคนไม่ได้รับสิทธิ์ใน repo นี้ ตรวจชื่อ repo และ branch';
    if (c === 409 || c === 422) return 'มีการเปลี่ยนไฟล์บน GitHub ระหว่างนี้ กดนำไปใช้อีกครั้ง';
    return 'เชื่อมต่อ GitHub ไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่';
  }
  async function ghRequest(cfg, method, body, where) {
    var url = 'https://api.github.com/repos/' + cfg.repo.trim() + '/contents/' + String(where != null ? where : cfg.path).trim().replace(/^\/+/, '').split('/').filter(Boolean).map(encodeURIComponent).join('/');
    var hd = { Authorization: 'Bearer ' + cfg.token.trim(), Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (body) hd['Content-Type'] = 'application/json';
    return fetch(method === 'GET' ? url + '?ref=' + encodeURIComponent(cfg.branch.trim()) : url, { method: method, headers: hd, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  }
  async function ghPush(cfg) {
    var r = await ghRequest(cfg, 'GET'), sha;
    if (r.status === 200) sha = (await r.json()).sha; else if (r.status !== 404) throw { status: r.status };
    var body = { message: 'Update site content (editor)', content: utf8b64(standaloneDoc()), branch: cfg.branch.trim() };
    if (sha) body.sha = sha;
    var w = await ghRequest(cfg, 'PUT', body);
    if (!w.ok) throw { status: w.status };
  }
  async function ghTest(cfg) {
    var r = await ghRequest(cfg, 'GET');
    if (r.status !== 200 && r.status !== 404) throw { status: r.status };
    return r.status;
  }
  function downloadDoc() {
    var blob = new Blob([standaloneDoc()], { type: 'text/html' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'index.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  async function publishNow() {
    if (busy) return;
    busy = true; goBtn.disabled = true;
    if (mode === 'local') {
      if (ghReady()) {
        setMsg('กำลังอัปโหลดขึ้น GitHub…', '');
        try {
          await ghPush(ghCfg());
          saved = clone(state); clearDraft(); busy = false; refreshStatus();
          setMsg('ส่งขึ้น GitHub แล้ว เว็บจริงจะอัปเดตภายใน 1-2 นาที (รีเฟรชหน้าเว็บจริงดู)', '');
        } catch (e) { busy = false; refreshStatus(); setMsg(ghErr(e), 'bad'); }
        return;
      }
      try {
        downloadDoc();
        saved = clone(state); clearDraft(); busy = false; refreshStatus();
        setMsg('ดาวน์โหลด index.html แล้ว นำไปวางทับไฟล์เดิมแล้วอัปโหลดขึ้นเว็บ', '');
      } catch (e) { busy = false; refreshStatus(); setMsg('ดาวน์โหลดไม่สำเร็จ ลองอีกครั้ง', 'bad'); }
      return;
    }
    setMsg('กำลังเผยแพร่…', '');
    try {
      await artifact.publish(artifactDoc());
      clearDraft(); setMsg('เผยแพร่แล้ว กำลังโหลดหน้าใหม่…', '');
    } catch (e) {
      var c = e && e.code;
      if (c === 'conflict') setMsg('มีคนเผยแพร่เวอร์ชันใหม่ก่อน หน้าจะโหลดใหม่ และฉบับร่างของคุณยังเก็บไว้ให้กู้คืนได้', 'bad');
      else if (c === 'not_writer' || c === 'not_granted' || c === 'consent_required') setMsg('บัญชีนี้ไม่มีสิทธิ์เผยแพร่การแก้ไข', 'bad');
      else if (c === 'too_large') setMsg('ข้อมูลใหญ่เกินไป ลองลดรูปหรือเนื้อหาลง', 'bad');
      else if (c === 'rate_limited') setMsg('เผยแพร่ถี่เกินไป รอสักครู่แล้วลองใหม่', 'bad');
      else setMsg('เผยแพร่ไม่สำเร็จ ลองอีกครั้ง', 'bad');
      busy = false; goBtn.disabled = !dirty();
    }
  }

  function revert() {
    state = clone(saved); selPath = ''; clearDraft(); renderSite(); showTab(curTab); refreshStatus(); refreshHrefs();
  }

  function buildAdmin() {
    adminBuilt = true;
    var pen = h('span', {}); pen.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/></svg>';
    fab = h('button', { type: 'button', class: 'fab', onclick: function () { toggle(true); } }, pen, h('span', {}, 'แก้ไขเว็บ'));
    tabsEl = h('div', { class: 'tabs', role: 'tablist' });
    Object.keys(TABS).forEach(function (id) {
      tabsEl.append(h('button', { type: 'button', class: 'tab', role: 'tab', 'data-id': id, onclick: function () { showTab(id); } }, TABS[id][0]));
    });
    bannerEl = h('div', { class: 'banner', hidden: true });
    bodyEl = h('div', { class: 'dbody' });
    statusEl = h('div', { class: 'status', role: 'status' });
    goBtn = h('button', { type: 'button', class: 'ab go', onclick: publishNow }, mode === 'local' ? 'ดาวน์โหลด index.html ที่แก้แล้ว' : 'เผยแพร่การแก้ไข');
    dlBtn = h('button', { type: 'button', class: 'ab', hidden: true, onclick: function () { try { downloadDoc(); setMsg('ดาวน์โหลด index.html แล้ว (ยังไม่ได้ส่งขึ้นเว็บ)', ''); } catch (e) { setMsg('ดาวน์โหลดไม่สำเร็จ', 'bad'); } } }, 'ดาวน์โหลดไฟล์ไว้เฉยๆ');
    revertBtn = h('button', { type: 'button', class: 'ab', onclick: revert }, 'ยกเลิกสิ่งที่แก้');
    hrefList = h('datalist', { id: 'hrefs' });
    refreshHrefs();
    drawer = h('aside', { class: 'drawer', 'aria-label': 'แก้ไขเว็บ', hidden: true },
      h('div', { class: 'dhead' }, h('h2', {}, 'แก้ไขเว็บ'), (drawerLang = langBtn()), h('button', { type: 'button', class: 'ab', onclick: function () { toggle(false); } }, 'ปิด')),
      tabsEl, bannerEl, bodyEl,
      h('div', { class: 'dfoot' }, statusEl, h('div', { class: 'row' }, goBtn, dlBtn, revertBtn)), hrefList);
    adminEl.replaceChildren(fab, drawer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawer.hidden) toggle(false); });
    // picture mode: links and FAQ rows do nothing while arranging pictures
    siteEl.addEventListener('click', function (e) {
      if (!mediaEdit() || !e.target.closest) return;
      if (e.target.closest('a') || e.target.closest('summary') || e.target.closest('.med')) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    // copy / paste text mode: runs before every other click handler
    siteEl.addEventListener('click', function (e) {
      if (cpMode === 'off' || !e.target.closest) return;
      var ce = canvasEdit(), de = ce ? e.target.closest('.de') : null, stage = ce ? e.target.closest('.dstage') : null;
      var t = e.target.closest('.tx'), tx = t && t.dataset.k && !t.classList.contains('wm') ? t : null;
      if (de || stage || tx) {
        e.preventDefault(); e.stopPropagation();
        if (cpMode === 'copy') { if (de || tx) doCopy(de, de ? null : tx); } else doPaste(de, stage, de ? null : tx, e);
      } else if (e.target.closest('a')) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    // while editing a detail page, clicks on its blocks never follow links
    siteEl.addEventListener('click', function (e) {
      if (canvasEdit() && e.target.closest && e.target.closest('.de')) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    // product buttons open the detail page in a new tab for visitors, but in the same tab for the editor so the panel stays open
    siteEl.addEventListener('click', function (e) {
      if (styleMode) return;
      var a = e.target.closest && e.target.closest('a[data-detail]');
      if (!a || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault(); location.hash = a.getAttribute('href');
    }, true);
    // in text-style mode a click on any text selects it instead of following the link
    siteEl.addEventListener('click', function (e) {
      if (!styleMode) return;
      var t = e.target.closest ? e.target.closest('.tx') : null;
      if (!t || !t.dataset.k) return;
      e.preventDefault(); e.stopPropagation();
      selectText(t.dataset.k);
    }, true);

    try {
      var rawDraft = localStorage.getItem(DRAFT_KEY);
      if (rawDraft) {
        var dr = load(JSON.parse(rawDraft));
        if (JSON.stringify(dr) !== JSON.stringify(saved)) draftData = dr;
      }
    } catch (e) { draftData = null; }
    if (draftData) {
      bannerEl.hidden = false;
      bannerEl.append(h('span', {}, 'พบฉบับร่างที่ยังไม่ได้บันทึกลงเว็บจริง'),
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'ab', onclick: function () { state = clone(draftData); bannerEl.hidden = true; renderSite(); showTab(curTab); refreshStatus(); refreshHrefs(); } }, 'กู้คืนฉบับร่าง'),
          h('button', { type: 'button', class: 'ab', onclick: function () { clearDraft(); bannerEl.hidden = true; } }, 'ทิ้งฉบับร่าง')));
    }
    refreshStatus();
  }

  /* ---------- start ---------- */
  function use(name) {
    try { return Promise.resolve(window.claude.use(name)).catch(function () { return null; }); }
    catch (e) { return Promise.resolve(null); }
  }
  /* ---------- password lock (local mode) ----------
     The password is stored only as a salted PBKDF2 hash in the page data. This keeps casual visitors out of the editor.
     It is not server-side security: the live site can only really be changed by whoever can upload files to the host. */
  var unlocked = false, fails = 0, lockedUntil = 0;
  function b64(buf) { var s = ''; new Uint8Array(buf).forEach(function (b) { s += String.fromCharCode(b); }); return btoa(s); }
  function unb64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function canCrypto() { return !!(window.crypto && crypto.subtle && window.TextEncoder); }
  async function pwHash(pw, salt) {
    var key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
    return b64(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unb64(salt), iterations: 200000, hash: 'SHA-256' }, key, 256));
  }
  async function makeLock(pw) {
    var salt = b64(crypto.getRandomValues(new Uint8Array(16)));
    return { salt: salt, hash: await pwHash(pw, salt) };
  }
  function hasLock() { return !!(state.admin && state.admin.hash && state.admin.salt); }

  function gate(onOk) {
    var setup = !hasLock();
    var msg = h('div', { class: 'status' });
    var pw = h('input', { type: 'password', id: 'gate_pw', autocomplete: setup ? 'new-password' : 'current-password', 'aria-label': 'รหัสผ่าน' });
    var pw2 = setup ? h('input', { type: 'password', id: 'gate_pw2', autocomplete: 'new-password', 'aria-label': 'ยืนยันรหัสผ่าน' }) : null;
    var go = h('button', { type: 'submit', class: 'ab go' }, setup ? 'ตั้งรหัสผ่านและเข้าสู่การแก้ไข' : 'เข้าสู่การแก้ไข');
    var cancel = h('button', { type: 'button', class: 'ab' }, 'ยกเลิก');
    var box = h('form', { class: 'gate-box', autocomplete: 'off' },
      h('h2', {}, setup ? 'ตั้งรหัสผ่านสำหรับแก้ไขเว็บ' : 'ใส่รหัสผ่านเพื่อแก้ไขเว็บ'),
      setup ? h('p', { class: 'hint' }, 'ยังไม่เคยตั้งรหัสผ่าน ตั้งรหัสผ่านที่เดายาก (อย่างน้อย 10 ตัวอักษร) หลังแก้เสร็จต้องดาวน์โหลด index.html แล้วอัปโหลดทับ รหัสผ่านจึงมีผลกับเว็บจริง') : null,
      h('label', { class: 'f' }, h('span', {}, 'รหัสผ่าน'), pw),
      setup ? h('label', { class: 'f' }, h('span', {}, 'ยืนยันรหัสผ่านอีกครั้ง'), pw2) : null,
      msg, h('div', { class: 'row' }, go, cancel));
    var wrap = h('div', { class: 'gate', role: 'dialog', 'aria-modal': 'true' }, box);
    function close() { wrap.remove(); if (location.hash === '#edit') history.replaceState(null, '', location.pathname + location.search); }
    cancel.addEventListener('click', close);
    wrap.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    if (!canCrypto()) {
      msg.className = 'status bad';
      msg.textContent = 'เบราว์เซอร์นี้ใช้ระบบรหัสผ่านไม่ได้ (ต้องเปิดผ่าน https:// หรือเปิดไฟล์ในเครื่อง)';
      go.disabled = true;
    }
    box.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (go.disabled) return;
      var wait = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (wait > 0) { msg.className = 'status bad'; msg.textContent = 'ลองผิดหลายครั้ง รออีก ' + wait + ' วินาที'; return; }
      go.disabled = true;
      try {
        if (setup) {
          if (pw.value.length < 10) throw new Error('short');
          if (pw.value !== pw2.value) throw new Error('mismatch');
          state.admin = await makeLock(pw.value);
        } else {
          var hh = await pwHash(pw.value, state.admin.salt);
          if (hh !== state.admin.hash) throw new Error('bad');
        }
        unlocked = true; fails = 0; wrap.remove(); onOk();
      } catch (err) {
        go.disabled = false; msg.className = 'status bad';
        if (err.message === 'short') msg.textContent = 'รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 10 ตัวอักษร';
        else if (err.message === 'mismatch') msg.textContent = 'รหัสผ่านสองช่องไม่ตรงกัน';
        else {
          fails++; if (fails >= 5) { lockedUntil = Date.now() + 30000; fails = 0; }
          msg.textContent = 'รหัสผ่านไม่ถูกต้อง'; pw.value = '';
        }
      }
    });
    adminEl.append(wrap);
    pw.focus();
  }

  function openIfEdit() {
    if (location.hash !== '#edit') return;
    if (adminBuilt && unlocked) { toggle(true); return; }
    if (adminEl.querySelector('.gate')) return;
    gate(function () { if (!adminBuilt) buildAdmin(); toggle(true); });
  }

  async function init() {
    renderSite();
    if (window.claude && window.claude.use) {
      var u = await use('user'), art = await use('artifact');
      var can = u ? await u.canEdit() : false;
      if (can && art) {
        artifact = art; assets = await use('assets'); mode = 'artifact';
        buildAdmin();
      }
    } else {
      mode = 'local';
      openIfEdit();
      window.addEventListener('hashchange', openIfEdit);
    }
  }
  window.addEventListener('hashchange', function () {
    var nv = viewFromHash();
    if (nv === view) return;
    view = nv;
    renderSite(false);
    var id = view === 'home' ? decodeURIComponent(location.hash.slice(1)) : '', el = id && document.getElementById(id);
    if (el) el.scrollIntoView(); else window.scrollTo(0, 0);
    afterView();
  });
  siteEl.addEventListener('pointerdown', onDown);
  siteEl.addEventListener('pointerdown', onMedDown);
  window.addEventListener('resize', fitStage);
  // Alt+Shift+E opens the editor from any page (also detail pages, where #edit can't be added to the address)
  document.addEventListener('keydown', function (e) {
    if (mode !== 'local' || !e.altKey || !e.shiftKey || e.code !== 'KeyE') return;
    e.preventDefault();
    if (adminBuilt && unlocked) { toggle(true); return; }
    if (adminEl.querySelector('.gate')) return;
    gate(function () { if (!adminBuilt) buildAdmin(); toggle(true); });
  });
  init();
})();
