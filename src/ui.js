/* Shared shell helpers: storage, theme, router, sheet, toast, backup. No dependencies, no build step. */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const pad = n => String(n).padStart(2, '0');
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
export const today = () => ymd(new Date());
export const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
export const ICON = {
  back: svg('<path d="M15 18l-6-6 6-6"/>'), next: svg('<path d="M9 18l6-6-6-6"/>'), up: svg('<path d="M6 15l6-6 6 6"/>'), down: svg('<path d="M6 9l6 6 6-6"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'), x: svg('<path d="M6 6l12 12M18 6L6 18"/>'), plus: svg('<path d="M12 5v14M5 12h14"/>'), minus: svg('<path d="M5 12h14"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.500"/>'), trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3"/>'),
  edit: svg('<path d="M12 20h9M16.500 3.500a2.100 2.100 0 0 1 3 3L7 19l-4 1 1-4z"/>'), copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  share: svg('<path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>'), link: svg('<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>'),
  bookmark: svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.400 15a1.700 1.700 0 0 0 .3 1.800l.1.1a2 2 0 1 1-2.800 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.1a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.1a1.700 1.700 0 0 0 1.800.3h0a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500h0a1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.1a1.700 1.700 0 0 0-.3 1.800v0a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z"/>'),
  play: svg('<path d="M7 4.500v15l12-7.500z"/>'), pause: svg('<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'), skip: svg('<path d="M5 5l10 7-10 7zM19 5v14"/>'), rewind: svg('<path d="M19 5L9 12l10 7zM5 5v14"/>'),
  calendar: svg('<rect x="3" y="4.500" width="17" height="17" rx="3"/><path d="M8 2.500v4M16 2.500v4M3 10h17"/>'), star: svg('<path d="M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9z"/>'),
  book: svg('<path d="M12 6c-2.500-1.800-5.500-2-8-1.500v14c2.500-.5 5.500-.3 8 1.500 2.500-1.800 5.500-2 8-1.500v-14C17.500 4 14.500 4.200 12 6zM12 6v14"/>'),
  chart: svg('<path d="M4 20V4M4 20h16M8 16v-5M12 16V7M16 16v-8"/>'),
  list: svg('<path d="M9 6h11M9 12h11M9 18h11M4.500 6h.01M4.500 12h.01M4.500 18h.01"/>'),
  home: svg('<path d="M3 11l9-7.500 9 7.500M5.500 9.500V20h13V9.500M10 20v-6h4v6"/>'),
};

/* ---------- storage (one prefix per app; all apps share the github.io origin) ---------- */
export function createStore(prefix) {
  const s = {
    prefix,
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(prefix + k)); return v ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(prefix + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(prefix + k); } catch (e) {} },
    keys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(prefix)) out.push(k.slice(prefix.length)); } } catch (e) {} return out; },
    dump() { const o = {}; s.keys().forEach(k => { o[k] = s.get(k); }); return o; },
    load(o) { Object.entries(o || {}).forEach(([k, v]) => s.set(k, v)); },
    clear() { s.keys().forEach(k => s.del(k)); }
  };
  return s;
}

/* ---------- theme: Light / Dark, chosen by the user, never automatic ---------- */
export function applyTheme(store) {
  const dark = store.get('theme') === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#0e131b' : '#f3f5f9';
}

/* ---------- delegated events: data-a (click), data-c (change), data-i (input) ---------- */
const H = { a: {}, c: {}, i: {} };
export const act = (name, fn) => { H.a[name] = fn; };
export const onChange = (name, fn) => { H.c[name] = fn; };
export const onInput = (name, fn) => { H.i[name] = fn; };
const dispatch = (kind, attr) => e => { const el = e.target.closest('[data-' + attr + ']'); if (!el) return; const f = H[kind][el.dataset[attr]]; if (f) f(el, e); };
document.addEventListener('click', dispatch('a', 'a'));
document.addEventListener('change', dispatch('c', 'c'));
document.addEventListener('input', dispatch('i', 'i'));

/* ---------- chrome: bar, nav, sheet, toast ---------- */
let navItems = [];
export function setNavItems(items) { navItems = items; $('#nav').style.setProperty('--cols', items.length); }
export function setNav(root) {
  const nav = $('#nav'); nav.hidden = !root;
  $('#view').classList.toggle('no-nav', !root);
  if (root) $('#navin').innerHTML = navItems.map(([k, l, ic]) => `<a href="#/${k}" ${k === root ? 'aria-current="page"' : ''}>${ic}<span>${esc(l)}</span></a>`).join('');
}
export function setBar({ title, back, right = '', doc }) {
  $('#barin').className = 'in' + (back ? ' has-back' : '');
  $('#barin').innerHTML = (back ? `<a class="icon-btn" href="${back}" aria-label="Back">${ICON.back}</a>` : '') + `<h1>${esc(title)}</h1>${right}`;
  document.title = doc || title;
}
export const view = html => { const v = $('#view'); v.innerHTML = html; return v; };

let sheetReturn = null;
export function openSheet(html) {
  sheetReturn = document.activeElement; $('#sheet').innerHTML = html; $('#sheet-bg').classList.add('open');
  const f = $('#sheet').querySelector('input:not([type=checkbox]),select,textarea,button'); if (f) f.focus();
}
export function closeSheet() { $('#sheet-bg').classList.remove('open'); $('#sheet').innerHTML = ''; if (sheetReturn && sheetReturn.focus) sheetReturn.focus(); }
document.addEventListener('click', e => { if (e.target.id === 'sheet-bg') closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#sheet-bg').classList.contains('open')) closeSheet(); });
act('close-sheet', closeSheet);

let toastTimer = null;
export function toast(msg, undo) {
  const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span>` + (undo ? '<button type="button" id="undo">Undo</button>' : ''); t.classList.add('open');
  if (undo) $('#undo').onclick = () => { undo(); t.classList.remove('open'); };
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('open'), 5000);
}
export function confirmSheet({ title, body, yes = 'Delete', danger = true }, onYes) {
  openSheet(`<h2>${esc(title)}</h2><p class="muted" style="margin:6px 0 16px">${esc(body)}</p><div class="row"><button class="btn block" data-a="close-sheet">Cancel</button><button class="btn block ${danger ? 'danger' : 'primary'}" id="confirm-yes">${esc(yes)}</button></div>`);
  $('#confirm-yes').onclick = () => { closeSheet(); onYes(); };
}

/* ---------- router: #/name/arg/arg ---------- */
export function startRouter(routes, fallback) {
  const run = () => {
    const [name, ...args] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    const fn = routes[name] || routes[fallback];
    window.scrollTo(0, 0); fn(...args);
    const v = $('#view'); if (v) v.focus({ preventScroll: true });
  };
  window.addEventListener('hashchange', run); run();
}
export const go = h => { location.hash = h; };

/* ---------- files: backup / restore / download ---------- */
export function download(name, text, type = 'application/json') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
export function pickFile(accept = 'application/json,.json') { return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => { const f = i.files[0]; if (!f) return res(null); const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsText(f); }; i.click(); }); }

/* Appearance + backup + erase, shared by every app's Settings screen. */
export function settingsHtml(store) {
  const dark = store.get('theme') === 'dark';
  return `<div class="sec">Appearance</div>
    <div class="card"><div class="seg" role="group" aria-label="Appearance"><button data-a="theme" data-v="light" aria-pressed="${!dark}">Light</button><button data-a="theme" data-v="dark" aria-pressed="${dark}">Dark</button></div></div>
    <div class="sec">Your data</div>
    <div class="card"><p class="small muted">Everything you enter stays in this browser on this device. Nothing is uploaded. Download a backup before clearing Safari data or switching phones.</p>
      <div class="row wrap" style="margin-top:12px"><button class="btn" data-a="backup">Download Backup</button><button class="btn" data-a="restore">Restore Backup</button><button class="btn danger" data-a="erase">Erase Data</button></div></div>`;
}
export function bindSettings({ store, app, rerender }) {
  act('theme', el => { store.set('theme', el.dataset.v); applyTheme(store); rerender(); });
  act('backup', () => { download(`${app}-backup-${today()}.json`, JSON.stringify({ app, exported: new Date().toISOString(), data: store.dump() }, null, 1)); toast('Backup downloaded'); });
  act('restore', async () => {
    const text = await pickFile(); if (!text) return;
    try {
      const o = JSON.parse(text); if (o.app !== app || !o.data || typeof o.data !== 'object') throw 0;
      confirmSheet({ title: 'Restore this backup?', body: 'This replaces the data in this app with the backup file.', yes: 'Restore', danger: false }, () => { store.clear(); store.load(o.data); applyTheme(store); toast('Backup restored'); rerender(true); });
    } catch (e) { toast('That file is not a ' + app + ' backup'); }
  });
  act('erase', () => confirmSheet({ title: 'Erase all data?', body: 'This removes everything you entered in this app from this device. Download a backup first if you might want it back.', yes: 'Erase' }, () => { store.clear(); applyTheme(store); toast('Data erased'); rerender(true); }));
}

export function registerSW() {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
