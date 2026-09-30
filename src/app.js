/* Library: a searchable, offline reading app for reference guides and playbooks. */
import { $, $$, esc, ICON, createStore, applyTheme, act, onInput, setNavItems, setNav, setBar, view, openSheet, closeSheet, toast, startRouter, go, settingsHtml, bindSettings, registerSW, debounce } from './ui.js';

const store = createStore('lib.');
applyTheme(store);
const NAV = [['guides', 'Library', ICON.book], ['search', 'Search', ICON.search], ['saved', 'Saved', ICON.bookmark], ['settings', 'Settings', ICON.gear]];
setNavItems(NAV);

let M = null;
const docCache = new Map();
let saved = store.get('saved', []);
let progress = store.get('progress', {});
let recent = store.get('recent', []);
let textSize = store.get('size', 1);
let currentDoc = null;
let lastQuery = '';
const FS = [15, 16, 17.5, 19];
const chev = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
const applySize = () => document.documentElement.style.setProperty('--doc-fs', FS[textSize] + 'px');
applySize();

async function loadManifest() {
  if (!M) { const r = await fetch('content/manifest.json'); if (!r.ok) throw new Error('manifest'); M = await r.json(); }
  return M;
}
async function loadDoc(id) {
  if (!docCache.has(id)) { const r = await fetch(`content/${id}.html`); if (!r.ok) throw new Error(String(r.status)); docCache.set(id, await r.text()); }
  return docCache.get(id);
}
const guide = id => M.guides.find(g => g.id === id);
const catName = id => (M.categories.find(c => c.id === id) || {}).name || '';
const pct = id => Math.round(((progress[id] || {}).p || 0) * 100);

function offline(what) {
  view(`<div class="empty"><b>Can't load ${esc(what)}</b>You're offline and this hasn't been opened yet. Open it once with a connection and it will be available offline after that.<div style="margin-top:14px"><a class="btn" href="#/guides">Back to Library</a></div></div>`);
}

function guideRow(g) {
  const p = pct(g.id);
  return `<a class="list-row" href="#/read/${g.id}"><span class="nm">${esc(g.title)}<span class="sub">${esc(g.blurb)}</span>${p > 2 ? `<span class="rprog" aria-label="${p}% read"><i style="width:${p}%"></i></span>` : ''}</span><span class="tiny muted nowrap">${g.min} min</span>${chev}</a>`;
}

/* ---------- Library (home) ---------- */
async function viewGuides() {
  currentDoc = null; setBar({ title: 'Library', doc: 'Library' }); setNav('guides');
  try { await loadManifest(); } catch (e) { return offline('the library'); }
  const last = recent.map(guide).filter(Boolean).find(g => pct(g.id) > 2 && pct(g.id) < 97) || null;
  const cont = last ? `<div class="sec">Continue reading</div><div class="card flush">${guideRow(last)}</div>` : '';
  const groups = M.categories.map(c => {
    const list = M.guides.filter(g => g.cat === c.id);
    return `<div class="sec">${esc(c.name)}</div><div class="card flush">${list.map(guideRow).join('')}</div>`;
  }).join('');
  const vis = `<div class="sec">Visual guides</div><div class="card flush">${M.visuals.map(v => `<a class="list-row" href="#/visual/${v.id}"><span class="nm">${esc(v.title)}<span class="sub">${esc(v.blurb)}</span></span><span class="pill gray">Interactive</span>${chev}</a>`).join('')}</div>`;
  view(`<a class="searchbox" href="#/search">${ICON.search}<span>Search all ${M.guides.length} guides</span></a>${cont}${groups}${vis}`);
}

/* ---------- Search ---------- */
let idx = null;
async function buildIndex() {
  if (idx) return idx;
  await loadManifest();
  idx = await Promise.all(M.guides.map(async g => {
    const html = await loadDoc(g.id).catch(() => '');
    const t = document.createElement('template'); t.innerHTML = html.replace(/<\/(td|th|p|li|h[1-6]|tr|div)>/gi, '$& ');
    const heads = [...t.content.querySelectorAll('h1,h2,h3')].map(h => h.textContent.trim());
    return { g, heads, text: t.content.textContent.replace(/\s+/g, ' ') };
  }));
  return idx;
}
const rx = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRx = (t, flags = 'i') => new RegExp('\\b' + rx(t), flags);
function runSearch(q, index) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const res = terms.map(t => wordRx(t)), resG = terms.map(t => wordRx(t, 'gi'));
  const out = [];
  for (const d of index) {
    if (!res.every(r => r.test(d.text) || r.test(d.g.title))) continue;
    let score = 0;
    terms.forEach((t, i) => { score += (res[i].test(d.g.title) ? 20 : 0) + (d.heads.some(h => res[i].test(h)) ? 8 : 0) + Math.min(10, (d.text.match(resG[i]) || []).length); });
    const at = d.text.search(res[0]);
    let snip = '';
    if (at >= 0) { const s = Math.max(0, at - 50), e = Math.min(d.text.length, at + 120); snip = (s > 0 ? '…' : '') + d.text.slice(s, e).trim() + (e < d.text.length ? '…' : ''); }
    out.push({ g: d.g, score, snip, head: d.heads.find(h => res.some(r => r.test(h))) });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 40);
}
const termSplit = q => { const t = q.split(/\s+/).filter(Boolean).map(rx); return t.length ? new RegExp('(\\b(?:' + t.join('|') + '))', 'i') : null; };
function markTerms(text, q) {
  const re = termSplit(q); if (!re) return esc(text);
  return text.split(re).map((p, i) => i % 2 ? `<mark>${esc(p)}</mark>` : esc(p)).join('');
}
async function renderResults(q) {
  const box = $('#results'); if (!box) return;
  q = q.trim(); lastQuery = q;
  if (q.length < 2) { box.innerHTML = '<div class="empty">Search guide titles, section headings, and full text.</div>'; return; }
  box.innerHTML = '<div class="empty">Searching…</div>';
  const index = await buildIndex();
  if ($('#q') && $('#q').value.trim() !== q) return;
  const res = runSearch(q, index);
  box.innerHTML = res.length ? `<div class="card flush">${res.map(r => `<a class="list-row result" href="#/read/${r.g.id}/${encodeURIComponent(q)}"><span class="nm"><span class="where">${esc(catName(r.g.cat))}</span>${markTerms(r.g.title, q)}${r.head && r.head !== r.g.title ? `<span class="sub">Section: ${markTerms(r.head, q)}</span>` : ''}${r.snip ? `<span class="sub snip">${markTerms(r.snip, q)}</span>` : ''}</span>${chev}</a>`).join('')}</div>` : `<div class="empty"><b>No matches for "${esc(q)}"</b>Try fewer or different words.</div>`;
}
function viewSearch() {
  currentDoc = null; setBar({ title: 'Search', doc: 'Search · Library' }); setNav('search');
  view(`<input id="q" type="search" class="big" placeholder="Search the library" aria-label="Search the library" autocomplete="off" autocapitalize="off" value="${esc(lastQuery)}" data-i="q"><div id="results" style="margin-top:12px"></div>`);
  renderResults(lastQuery);
}
onInput('q', debounce(el => renderResults(el.value), 180));

/* ---------- Reader ---------- */
function markIn(root, q) {
  const terms = q.split(/\s+/).filter(Boolean).map(rx); if (!terms.length) return null;
  const test = new RegExp('\\b(?:' + terms.join('|') + ')', 'i'), split = new RegExp('(\\b(?:' + terms.join('|') + '))', 'gi');
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  let first = null;
  for (const n of nodes) {
    if (!test.test(n.nodeValue)) continue;
    const frag = document.createDocumentFragment();
    n.nodeValue.split(split).forEach((p, i) => { if (!p) return; if (i % 2) { const m = document.createElement('mark'); m.textContent = p; frag.appendChild(m); first = first || m; } else frag.appendChild(document.createTextNode(p)); });
    n.replaceWith(frag);
  }
  return first;
}
function saveBtn(id) { return `<button class="icon-btn fillable" data-a="save" data-id="${id}" aria-pressed="${saved.includes(id)}" aria-label="Save for later">${ICON.bookmark}</button>`; }

async function viewRead(id, q = '') {
  await loadManifest().catch(() => null); const g = M && guide(id);
  if (!g) return go('#/guides');
  currentDoc = null; setNav(null);
  setBar({ title: g.title, back: '#/guides', doc: g.title + ' · Library', right: saveBtn(id) + `<button class="icon-btn" data-a="textsize" aria-label="Text size"><b>Aa</b></button>` });
  $('#rp').hidden = false; $('#rp i').style.width = '0%';
  view('<div class="empty">Loading…</div>');
  let html; try { html = await loadDoc(id); } catch (e) { return offline(g.title); }
  if (location.hash.split('/')[2] !== id) return;
  const list = M.guides.filter(x => x.cat === g.cat), at = list.indexOf(g);
  const prev = list[at - 1], next = list[at + 1];
  view(`<div class="dochead"><span class="where">${esc(catName(g.cat))}</span><h2 class="title">${esc(g.title)}</h2><p class="muted small">${esc(g.blurb)} · ${g.min} min read</p></div>
    <div class="toc" id="toc"></div><article class="doc" id="doc">${html}</article>
    <nav class="pager no-print" aria-label="More in ${esc(catName(g.cat))}">${prev ? `<a class="btn" href="#/read/${prev.id}">${ICON.back}<span>${esc(prev.title)}</span></a>` : '<span></span>'}${next ? `<a class="btn" href="#/read/${next.id}"><span>${esc(next.title)}</span>${ICON.next}</a>` : '<span></span>'}</nav>`);
  const doc = $('#doc');
  $$('table', doc).forEach(t => { const w = document.createElement('div'); w.className = 'tw'; t.replaceWith(w); w.appendChild(t); });
  let heads = $$('h1,h2', doc); if (heads.length < 6) heads = $$('h1,h2,h3', doc);
  heads.forEach((h, i) => { h.id = 'h' + i; });
  if (heads.length >= 3) $('#toc').innerHTML = `<details><summary>On this page <span class="muted tiny">${heads.length} sections</span></summary><ol>${heads.map((h, i) => `<li class="l${h.tagName === 'H3' ? 3 : h.tagName === 'H2' ? 2 : 1}"><a href="#" data-a="toc" data-n="${i}">${esc(h.textContent.trim())}</a></li>`).join('')}</ol></details>`;
  recent = [id, ...recent.filter(x => x !== id)].slice(0, 12); store.set('recent', recent);
  const hit = q ? markIn(doc, q) : null;
  const p = (progress[id] || {}).p || 0;
  requestAnimationFrame(() => {
    if (hit) hit.scrollIntoView({ block: 'center' });
    else if (p > 0.02 && p < 0.97) window.scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight));
    currentDoc = id; trackScroll();
  });
}
act('toc', (el, e) => { e.preventDefault(); const h = $('#h' + el.dataset.n); if (h) h.scrollIntoView({ behavior: 'smooth' }); const d = el.closest('details'); if (d) d.open = false; });
act('save', el => {
  const id = el.dataset.id, on = !saved.includes(id);
  saved = on ? [id, ...saved] : saved.filter(x => x !== id); store.set('saved', saved);
  el.setAttribute('aria-pressed', on); toast(on ? 'Saved for later' : 'Removed from Saved');
});
act('textsize', () => {
  openSheet(`<h2>Text size</h2><div class="seg" style="margin-top:12px" role="group" aria-label="Text size">${['Small', 'Medium', 'Large', 'Larger'].map((l, i) => `<button data-a="size" data-v="${i}" aria-pressed="${textSize === i}">${l}</button>`).join('')}</div><button class="btn block" style="margin-top:14px" data-a="close-sheet">Done</button>`);
});
act('size', el => { textSize = +el.dataset.v; store.set('size', textSize); applySize(); $$('#sheet .seg button').forEach(b => b.setAttribute('aria-pressed', b === el)); });

let ticking = false;
function trackScroll() {
  if (window.__libScroll) return; window.__libScroll = true;
  let t = null;
  addEventListener('scroll', () => {
    if (!currentDoc || ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 1;
      const rp = $('#rp i'); if (rp) rp.style.width = (p * 100).toFixed(1) + '%';
      clearTimeout(t); const id = currentDoc; t = setTimeout(() => { if (id !== currentDoc) return; progress[id] = { p: Math.round(p * 1000) / 1000, t: Date.now() }; store.set('progress', progress); }, 400);
    });
  }, { passive: true });
}

/* ---------- Visual guides ---------- */
async function viewVisual(id) {
  currentDoc = null; setNav(null);
  await loadManifest().catch(() => null); const v = M && M.visuals.find(x => x.id === id);
  if (!v) return go('#/guides');
  setBar({ title: v.title, back: '#/guides', doc: v.title + ' · Library', right: `<a class="icon-btn" href="visuals/${v.id}.html" target="_blank" rel="noopener" aria-label="Open full page">${ICON.share}</a>` });
  view(`<iframe class="vframe ${store.get('theme') === 'dark' ? 'inv' : ''}" src="visuals/${v.id}.html" title="${esc(v.title)}"></iframe>`);
}

/* ---------- Saved ---------- */
async function viewSaved() {
  currentDoc = null; setBar({ title: 'Saved', doc: 'Saved · Library' }); setNav('saved');
  try { await loadManifest(); } catch (e) { return offline('saved guides'); }
  const list = saved.map(guide).filter(Boolean);
  view(list.length ? `<div class="card flush">${list.map(guideRow).join('')}</div>` : `<div class="empty"><b>Nothing saved yet</b>Tap the bookmark in any guide to keep it here.</div>`);
}

/* ---------- Settings ---------- */
function viewSettings() {
  currentDoc = null; setBar({ title: 'Settings', doc: 'Settings · Library' }); setNav('settings');
  view(`${settingsHtml(store)}
    <div class="sec">Reading</div><div class="card"><div class="seg" role="group" aria-label="Text size">${['Small', 'Medium', 'Large', 'Larger'].map((l, i) => `<button data-a="size" data-v="${i}" aria-pressed="${textSize === i}">${l}</button>`).join('')}</div>
    <p class="small muted" style="margin-top:10px">Your place in each guide is remembered on this device.</p></div>
    <div class="sec">About</div><div class="card"><p class="small muted">Reference guides and playbooks, readable offline. Guides are general reference, not personal financial, legal, or medical advice. Reading progress, saved guides, and text size never leave this device.</p></div>`);
}
bindSettings({ store, app: 'library', rerender: full => { if (full) { saved = store.get('saved', []); progress = store.get('progress', {}); recent = store.get('recent', []); textSize = store.get('size', 1); applySize(); } viewSettings(); } });

const routes = { guides: viewGuides, search: viewSearch, saved: viewSaved, settings: viewSettings, read: viewRead, visual: viewVisual };
const hideRp = () => { const r = $('#rp'); if (r) r.hidden = true; };
const wrap = fn => (...a) => { hideRp(); return fn(...a); };
const wrapped = Object.fromEntries(Object.entries(routes).map(([k, f]) => [k, k === 'read' ? f : wrap(f)]));
startRouter(wrapped, 'guides');
registerSW();
