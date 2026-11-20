/* Нэко-кана · 猫かな — практика начертания хираганы и катаканы.
   Данные черт: KanjiVG (Ulrich Apel, CC BY-SA 3.0). */
(function () {
'use strict';

/* ===================== ДАННЫЕ ===================== */
const ROWS = [
  { id: 'a', label: 'あ行', con: '—', cells: ['あ','い','う','え','お'], rom: ['a','i','u','e','o'] },
  { id: 'k', label: 'か行', con: 'K', cells: ['か','き','く','け','こ'], rom: ['ka','ki','ku','ke','ko'] },
  { id: 's', label: 'さ行', con: 'S', cells: ['さ','し','す','せ','そ'], rom: ['sa','shi','su','se','so'] },
  { id: 't', label: 'た行', con: 'T', cells: ['た','ち','つ','て','と'], rom: ['ta','chi','tsu','te','to'] },
  { id: 'n', label: 'な行', con: 'N', cells: ['な','に','ぬ','ね','の'], rom: ['na','ni','nu','ne','no'] },
  { id: 'h', label: 'は行', con: 'H', cells: ['は','ひ','ふ','へ','ほ'], rom: ['ha','hi','fu','he','ho'] },
  { id: 'm', label: 'ま行', con: 'M', cells: ['ま','み','む','め','も'], rom: ['ma','mi','mu','me','mo'] },
  { id: 'y', label: 'や行', con: 'Y', cells: ['や',null,'ゆ',null,'よ'], rom: ['ya',null,'yu',null,'yo'] },
  { id: 'r', label: 'ら行', con: 'R', cells: ['ら','り','る','れ','ろ'], rom: ['ra','ri','ru','re','ro'] },
  { id: 'w', label: 'わ行 + ん', con: 'W', cells: ['わ',null,null,null,'を'], rom: ['wa',null,null,null,'wo'], extra: [['ん','n']] },
];
const DROWS = [
  { id: 'g', label: 'が行', con: 'G', cells: ['が','ぎ','ぐ','げ','ご'], rom: ['ga','gi','gu','ge','go'] },
  { id: 'z', label: 'ざ行', con: 'Z', cells: ['ざ','じ','ず','ぜ','ぞ'], rom: ['za','ji','zu','ze','zo'] },
  { id: 'd', label: 'だ行', con: 'D', cells: ['だ','ぢ','づ','で','ど'], rom: ['da','ji','zu','de','do'] },
  { id: 'b', label: 'ば行', con: 'B', cells: ['ば','び','ぶ','べ','ぼ'], rom: ['ba','bi','bu','be','bo'] },
  { id: 'p', label: 'ぱ行', con: 'P', cells: ['ぱ','ぴ','ぷ','ぺ','ぽ'], rom: ['pa','pi','pu','pe','po'] },
];
const YOON = [['き','k'],['し','sh'],['ち','ch'],['に','n'],['ひ','h'],['み','m'],['り','r'],['ぎ','g'],['じ','j'],['び','b'],['ぴ','p']];
const YROWS = YOON.map(([c, con]) => {
  const j = con === 'sh' || con === 'ch' || con === 'j';
  return { id: 'y' + con, label: c + 'ゃ', con: con.toUpperCase(),
    cells: [c + 'ゃ', c + 'ゅ', c + 'ょ'],
    rom: j ? [con + 'a', con + 'u', con + 'o'] : [con + 'ya', con + 'yu', con + 'yo'] };
});
const ROMAJI = {};
const HINT = { 'じ': 'от shi', 'ぢ': 'от chi', 'ず': 'от su', 'づ': 'от tsu', 'を': 'читается «о»' };
const toKata = s => [...s].map(c => { const k = c.charCodeAt(0); return (k >= 0x3041 && k <= 0x3096) ? String.fromCharCode(k + 0x60) : c; }).join('');
const toHira = s => [...s].map(c => { const k = c.charCodeAt(0); return (k >= 0x30A1 && k <= 0x30F6) ? String.fromCharCode(k - 0x60) : c; }).join('');
function rowChars(row) {
  const out = [];
  row.cells.forEach((c, i) => { if (c) out.push([c, row.rom[i]]); });
  (row.extra || []).forEach(e => out.push(e));
  return out;
}
[...ROWS, ...DROWS, ...YROWS].forEach(r => rowChars(r).forEach(([c, ro]) => { ROMAJI[c] = ro; ROMAJI[toKata(c)] = ro; }));
const romOf = c => ROMAJI[c] || '?';
const hintOf = c => HINT[toHira(c)] || '';

const SETS = {
  hira:    { title: 'Хирагана', jp: 'ひらがな', rows: ROWS,  script: 'h' },
  kata:    { title: 'Катакана', jp: 'カタカナ', rows: ROWS,  script: 'k' },
  dakuten: { title: 'Дакутэн',  jp: '濁点',     rows: DROWS, script: 'h', switchable: true },
  mirror:  { title: 'Зеркало',  jp: 'あ ⇄ ア',  rows: [...ROWS, ...DROWS], mirror: true },
};
const LEVELS = {
  1: { name: 'Обвести', short: '①', mode: 'trace' },
  2: { name: 'Срисовать', short: '②', mode: 'copy' },
  3: { name: 'Вспышка', short: '③', mode: 'flash' },
  4: { name: 'По памяти', short: '④', mode: 'recall' },
};

let KANA = {};      // char -> {s:[d], n:[[x,y]]}
const REF = {};     // char -> [{pts, len}]

/* ===================== ХРАНИЛИЩЕ ===================== */
const KEY = 'nekokana.v1';
const mem = {};
const store = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return mem[KEY] || null; } },
  set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { mem[KEY] = v; } },
};
let S = Object.assign({ chars: {}, rows: {}, days: {}, settings: {} }, store.get() || {});
S.settings = Object.assign({ strict: 'normal', flash: 2500, sound: true }, S.settings);
const save = () => store.set(S);
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function streak() {
  let n = 0; const d = new Date();
  if (!S.days[today()]) d.setDate(d.getDate() - 1);
  for (;;) {
    const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    if (!S.days[k]) break; n++; d.setDate(d.getDate() - 1);
  }
  return n;
}
const ck = (c) => S.chars[c] || (S.chars[c] = { best: 0, seen: 0, fails: 0, mirror: 0 });

/* ===================== ГЕОМЕТРИЯ ===================== */
const SVGNS = 'http://www.w3.org/2000/svg';
let measureSvg;
function refOf(ch) {
  if (REF[ch]) return REF[ch];
  if (!measureSvg) {
    measureSvg = document.createElementNS(SVGNS, 'svg');
    measureSvg.setAttribute('viewBox', '0 0 109 109');
    measureSvg.style.cssText = 'position:absolute;width:109px;height:109px;left:-999px;top:-999px;visibility:hidden';
    document.body.appendChild(measureSvg);
  }
  const k = KANA[ch]; if (!k) return null;
  REF[ch] = k.s.map(d => {
    const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', d); measureSvg.appendChild(p);
    const len = p.getTotalLength(); const pts = [];
    const steps = Math.max(8, Math.ceil(len));
    for (let i = 0; i <= steps; i++) { const q = p.getPointAtLength(len * i / steps); pts.push([q.x, q.y]); }
    p.remove();
    return { pts, len };
  });
  return REF[ch];
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function plen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]); return L; }
function resample(pts, n) {
  if (pts.length === 1) return Array.from({ length: n }, () => pts[0].slice());
  const L = plen(pts); if (L === 0) return Array.from({ length: n }, () => pts[0].slice());
  const step = L / (n - 1), out = [pts[0].slice()]; let acc = 0, i = 1, prev = pts[0];
  while (i < pts.length && out.length < n) {
    const cur = pts[i], d = dist(prev, cur);
    if (acc + d >= step && d > 0) {
      const t = (step - acc) / d, q = [prev[0] + t * (cur[0] - prev[0]), prev[1] + t * (cur[1] - prev[1])];
      out.push(q); prev = q; acc = 0;
    } else { acc += d; prev = cur; i++; }
  }
  while (out.length < n) out.push(pts[pts.length - 1].slice());
  return out;
}
const N = 32;
function devs(a, b) {
  const A = resample(a, N), B = resample(b, N), d = [];
  for (let i = 0; i < N; i++) d.push(dist(A[i], B[i]));
  let mean = 0; d.forEach(v => mean += v); mean /= N;
  let peak = 0; for (let i = 0; i < N; i++) { let s = 0, c = 0; for (let j = Math.max(0, i - 2); j <= Math.min(N - 1, i + 2); j++) { s += d[j]; c++; } peak = Math.max(peak, s / c); }
  const ends = Math.max((d[0] + d[1]) / 2, (d[N - 1] + d[N - 2]) / 2);
  return { mean, peak, ends };
}
const ENDS = 1.6;  // начало и конец черты — там прячутся отличия (わ/れ, ね/ぬ)
const PEAK = 1.75; // насколько сильно может «уехать» отдельный кусок черты относительно среднего допуска
const TOL = {
  lenient: { trace: 16, copy: 20, global: 16.5 },
  normal:  { trace: 13, copy: 16, global: 13.5 },
  strict:  { trace: 10, copy: 12.5, global: 11 },
};
const tol = (kind) => TOL[S.settings.strict][kind];
function strokeMatch(user, ref, t) {
  const uL = plen(user), rL = ref.len;
  const f = devs(user, ref.pts), r = devs(user, ref.pts.slice().reverse());
  const sizeOk = rL < 14 ? uL < rL * 3 + 14 : (uL > rL * 0.38 && uL < rL * 2.4);
  const ok = sizeOk && f.mean < t && f.peak < t * PEAK && f.ends < t * ENDS;
  const rev = !ok && sizeOk && rL > 10 && r.mean < t * 1.25 && r.mean < f.mean * 0.6;
  return { ok, rev, d: f.mean };
}
// Пошаговая проверка (уровни 1–2)
function checkLive(user, refs, idx, t) {
  const m = strokeMatch(user, refs[idx], t);
  if (m.ok) return { kind: 'ok' };
  if (m.rev) return { kind: 'dir' };
  for (let j = idx + 1; j < refs.length; j++) { if (strokeMatch(user, refs[j], t).ok) return { kind: 'order', j }; }
  return { kind: 'miss' };
}
function bbox(strokes) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  strokes.forEach(s => s.forEach(([x, y]) => { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }));
  return { x0, y0, x1, y1, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0), cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
// Целиковая проверка (уровни 3–4, зеркало): нормализация положения и масштаба
function normalize(user, refs) {
  const ub = bbox(user), rb = bbox(refs.map(r => r.pts));
  let s = Math.max(rb.w, rb.h) / Math.max(ub.w, ub.h); s = Math.min(3, Math.max(0.33, s));
  return user.map(st => st.map(([x, y]) => [(x - ub.cx) * s + rb.cx, (y - ub.cy) * s + rb.cy]));
}
function checkWhole(user, refs, t) {
  const norm = user.length ? normalize(user, refs) : [];
  const res = { ok: false, norm, count: user.length === refs.length ? 'ok' : (user.length < refs.length ? 'few' : 'many'), per: [] };
  const n = Math.min(norm.length, refs.length);
  for (let i = 0; i < n; i++) {
    const m = strokeMatch(norm[i], refs[i], t); let swap = -1;
    if (!m.ok) for (let j = 0; j < refs.length; j++) if (j !== i && strokeMatch(norm[i], refs[j], t).ok) { swap = j; break; }
    res.per.push({ ok: m.ok, dir: m.rev, swap });
  }
  res.ok = res.count === 'ok' && res.per.every(p => p.ok);
  return res;
}

/* ===================== УТИЛИТЫ UI ===================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = () => $('#app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rand = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ICON = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M4 9.5h4l5-4v13l-5-4H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>',
  flip: '<svg viewBox="0 0 24 24"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
};
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }

let voice = null;
function pickVoice() { try { const v = speechSynthesis.getVoices(); voice = v.find(x => /^ja/i.test(x.lang)) || null; } catch (e) {} }
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text) {
  if (!S.settings.sound || !('speechSynthesis' in window)) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; if (voice) u.voice = voice; u.rate = 0.75; speechSynthesis.speak(u); } catch (e) {}
}

// SVG глифа по данным KanjiVG
function glyphSVG(ch, { numbers = false, width = 4.2, color = 'var(--text)', cls = '' } = {}) {
  const k = KANA[ch];
  if (!k) return `<svg viewBox="0 0 109 109" class="${cls}"><text x="54.5" y="80" text-anchor="middle" font-size="80" fill="${color}" font-family="var(--jp)">${esc(ch)}</text></svg>`;
  const paths = k.s.map(d => `<path d="${d}"/>`).join('');
  const nums = numbers ? k.n.map(([x, y], i) => `<text x="${x}" y="${y}">${i + 1}</text>`).join('') : '';
  return `<svg viewBox="0 0 109 109" class="${cls}"><g fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>` +
    (numbers ? `<g font-size="9" fill="var(--pink)" font-family="Georgia,serif" font-weight="700">${nums}</g>` : '') + `</svg>`;
}
// Анимация порядка черт внутри svg
function animateStrokes(svg, { speed = 11, gap = 120 } = {}) {
  const paths = $$('g path', svg); let t = 0; const anims = [];
  paths.forEach(p => {
    const L = p.getTotalLength(); p.style.strokeDasharray = L + ' ' + L; p.style.strokeDashoffset = L;
    const dur = Math.max(260, L * speed);
    anims.push(p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: dur, delay: t, fill: 'forwards', easing: 'ease-in-out' }));
    t += dur + gap;
  });
  return anims;
}

/* ===================== КОТ ===================== */
let CAT_SVG = '';
const PHRASES = [
  ['がんばれ！', 'Давай, у тебя получится!'],
  ['習うより慣れろ', 'Привычка сильнее зубрёжки'],
  ['字は人なり', 'Каков почерк — таков человек'],
  ['一歩ずつ', 'Шаг за шагом'],
  ['七転び八起き', 'Упала семь раз — встань восемь'],
  ['猫の手も借りたい', 'Так занята, что рада и кошачьей лапе'],
  ['にゃ', 'Это значит «пиши ещё»'],
];

/* ===================== РОУТЕР ===================== */
let current = null;
function go(screen, arg) {
  if (current && current.leave) current.leave();
  current = null; closeModal();
  window.scrollTo(0, 0);
  ({ home: renderHome, section: renderSection, table: renderTable, settings: renderSettings, practice: renderPractice, result: renderResult })[screen](arg);
}

/* ===================== ГЛАВНАЯ ===================== */
function setProgress(set, script) {
  const chars = []; SETS[set].rows.forEach(r => rowChars(r).forEach(([c]) => chars.push(script === 'k' ? toKata(c) : c)));
  const done = chars.filter(c => (S.chars[c] || {}).best >= 4).length;
  return { done, total: chars.length };
}
function weakList() {
  return Object.entries(S.chars).filter(([c, v]) => v.fails > 0 && KANA[c])
    .map(([c, v]) => [c, v.fails / Math.max(1, v.seen) + v.fails * 0.05]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => x[0]);
}
function renderHome() {
  const ph = setProgress('hira', 'h'), pk = setProgress('kata', 'k');
  const pdh = setProgress('dakuten', 'h'), pdk = setProgress('dakuten', 'k');
  const mastered = ph.done + pk.done + pdh.done + pdk.done, total = ph.total + pk.total + pdh.total + pdk.total;
  const mirrorDone = Object.values(S.chars).filter(v => v.mirror).length;
  const weak = weakList();
  const p0 = PHRASES[0];
  app().innerHTML = `
  <header class="top">
    <div class="brand"><span class="jp">猫かな</span><span>Нэко-кана</span></div>
    <button class="icon-btn" data-go="settings" aria-label="Настройки">${ICON.gear}</button>
  </header>
  <section class="hero">
    <div class="proverb"><div class="jp">継続は力なり</div><div>Постоянство — залог силы.</div></div>
    <div class="cat-stage">
      <div class="enso"></div>
      <div class="cat" id="cat" aria-label="Кот">${CAT_SVG}</div>
      <div class="bubble" id="bubble"><span class="jp">${p0[0]}</span>${p0[1]}</div>
    </div>
  </section>
  <section class="card stats">
    <div class="stat"><b>${streak()}</b><span>дней подряд</span></div>
    <div class="stat"><b>${mastered}</b><span>из ${total} по памяти</span></div>
    <div class="stat"><b>${(S.days[today()] || 0)}</b><span>знаков сегодня</span></div>
  </section>
  <div class="section-title">Начертание</div>
  <section class="tiles">
    ${tile('hira', 'あ', 'Хирагана', `${ph.done} / ${ph.total} по памяти`, ph.done / ph.total)}
    ${tile('kata', 'ア', 'Катакана', `${pk.done} / ${pk.total} по памяти`, pk.done / pk.total)}
    ${tile('dakuten', 'が', 'Дакутэн', 'Суровый раздел', (pdh.done + pdk.done) / (pdh.total + pdk.total), 'fire')}
    ${tile('mirror', 'あ<small style="font-size:.5em;color:var(--muted)">⇄</small>ア', 'Зеркало', mirrorDone ? `Видишь одно — пишешь пару · ${mirrorDone} готово` : 'Видишь одно — пишешь пару', null)}
    <button class="card tile" data-go="table"><span class="glyph">表</span><img class="stk" src="img/reading.webp" alt=""><h3>Таблица</h3><p>Карточки, ряды, пары</p></button>
    ${weak.length ? `<button class="card tile" data-act="weak"><span class="glyph">弱</span><img class="stk" src="img/slime-green.webp" alt="" style="width:70px;top:4px;right:6px"><h3>Слабые знаки</h3><p class="jp" style="font-size:20px;color:var(--text)">${weak.join('')}</p></button>` : ''}
  </section>
  <div class="section-title">Скоро</div>
  <section class="tiles">
    <div class="card tile locked"><span class="glyph">速</span><span class="lock">скоро</span><h3>Арена</h3><p>На время: писать и узнавать</p></div>
    <div class="card tile locked"><span class="glyph">違</span><span class="lock">скоро</span><h3>Найди отличие</h3><p>Три знака, одна закорючка</p></div>
    <div class="card tile wide locked" style="opacity:.75"><span class="glyph">漢</span><img class="stk" src="img/bed.webp" alt=""><h3>Кандзи</h3><p>Кот спит здесь до весны. Не будить.</p></div>
  </section>`;
  bindNav();
  const cat = $('#cat'), bubble = $('#bubble'); let pi = 0;
  cat.addEventListener('click', () => {
    cat.classList.remove('hop'); void cat.offsetWidth; cat.classList.add('hop');
    pi = (pi + 1 + Math.floor(Math.random() * (PHRASES.length - 1))) % PHRASES.length;
    bubble.classList.add('pop');
    setTimeout(() => { bubble.innerHTML = `<span class="jp">${PHRASES[pi][0]}</span>${PHRASES[pi][1]}`; bubble.classList.remove('pop'); }, 180);
    speak(PHRASES[pi][0]);
  });
  const w = $('[data-act="weak"]');
  if (w) w.addEventListener('click', () => {
    const items = weak.map(c => ({ ch: c, mode: 'recall', script: /[゠-ヿ]/.test(c) ? 'k' : 'h' }));
    go('practice', { set: 'weak', row: 'weak', level: 4, items, title: 'Слабые знаки' });
  });
}
function tile(set, glyph, title, sub, frac, stk) {
  return `<button class="card tile" data-go="section" data-arg="${set}"><span class="glyph">${glyph}</span>${stk ? `<img class="stk" src="img/${stk}.webp" alt="">` : ''}
    <h3>${title}</h3><p>${sub}</p>${frac != null ? `<div class="bar"><i style="width:${Math.round(frac * 100)}%"></i></div>` : ''}</button>`;
}
function bindNav(root = app()) {
  $$('[data-go]', root).forEach(b => b.addEventListener('click', () => go(b.dataset.go, b.dataset.arg)));
}

/* ===================== РАЗДЕЛ ===================== */
const view = { dakScript: 'h', mirrorDir: 'hk' };
function rowKey(set, script, row, level) { return `${set}:${script}:${row}:${level}`; }
function renderSection(set) {
  const cfg = SETS[set];
  const script = set === 'kata' ? 'k' : set === 'dakuten' ? view.dakScript : 'h';
  const isMirror = !!cfg.mirror;
  const dir = view.mirrorDir;
  let head = '';
  if (cfg.switchable) head = `<div class="seg" style="margin-bottom:12px"><button data-s="h" class="${script === 'h' ? 'on' : ''}">ひらがな</button><button data-s="k" class="${script === 'k' ? 'on' : ''}">カタカナ</button></div>`;
  if (isMirror) head = `<div class="seg" style="margin-bottom:12px"><button data-d="hk" class="${dir === 'hk' ? 'on' : ''}">あ → пишу ア</button><button data-d="kh" class="${dir === 'kh' ? 'on' : ''}">ア → пишу あ</button></div>`;
  const legend = isMirror
    ? `<div class="legend"><span>Показываю знак — ты пишешь его пару из другой азбуки. Без подсказок.</span></div>`
    : `<div class="legend"><span><b>①</b> обвести</span><span><b>②</b> срисовать</span><span><b>③</b> вспышка</span><span><b>④</b> по памяти</span></div>`;
  const rows = cfg.rows.map(r => {
    const chars = rowChars(r).map(([c]) => isMirror ? (dir === 'hk' ? c : toKata(c)) : (script === 'k' ? toKata(c) : c)).join('');
    let pips;
    if (isMirror) {
      const st = S.rows[rowKey('mirror', dir, r.id, 'm')] || {};
      pips = `<button class="pip wide ${st.perfect ? 'perfect' : st.done ? 'done' : ''}" data-row="${r.id}" data-lv="m">${st.done ? 'ещё' : 'начать'}</button>`;
    } else {
      pips = [1, 2, 3, 4].map(lv => { const st = S.rows[rowKey(set, script, r.id, lv)] || {};
        return `<button class="pip ${st.perfect ? 'perfect' : st.done ? 'done' : ''}" data-row="${r.id}" data-lv="${lv}">${lv}</button>`; }).join('');
    }
    return `<div class="card row"><div class="rname"><b>${r.label}</b><span class="jp">${chars}</span></div><div class="pips">${pips}</div></div>`;
  }).join('');
  app().innerHTML = `
  <header class="top"><button class="icon-btn" data-go="home">${ICON.back}</button><h1>${cfg.title}<small class="jp">${cfg.jp}</small></h1></header>
  ${head}${legend}
  <div class="rows">${rows}</div>
  <div class="section-title">Микс по всем рядам</div>
  <div class="card mixbar"><div class="grow"><b>10 случайных</b><span class="muted">${isMirror ? 'знаки вперемешку' : 'для тех, кто уже уверен'}</span></div>
    ${isMirror ? `<button class="btn primary" data-mix="m">Поехали</button>` : `<button class="btn" data-mix="3">③ Вспышка</button><button class="btn primary" data-mix="4">④ По памяти</button>`}
  </div>`;
  bindNav();
  $$('[data-s]').forEach(b => b.addEventListener('click', () => { view.dakScript = b.dataset.s; renderSection(set); }));
  $$('[data-d]').forEach(b => b.addEventListener('click', () => { view.mirrorDir = b.dataset.d; renderSection(set); }));
  $$('[data-row]').forEach(b => b.addEventListener('click', () => startRow(set, script, b.dataset.row, b.dataset.lv)));
  $$('[data-mix]').forEach(b => b.addEventListener('click', () => startRow(set, script, 'mix', b.dataset.mix)));
}
function startRow(set, script, rowId, lv) {
  const cfg = SETS[set];
  let base = [];
  if (rowId === 'mix') { cfg.rows.forEach(r => base.push(...rowChars(r))); base = shuffle(base).slice(0, 10); }
  else base = rowChars(cfg.rows.find(r => r.id === rowId));
  let items;
  if (lv === 'm') {
    const dir = view.mirrorDir;
    items = base.map(([c]) => dir === 'hk' ? { ch: toKata(c), from: c, mode: 'mirror', script: 'k' } : { ch: c, from: toKata(c), mode: 'mirror', script: 'h' });
    if (rowId !== 'mix') items = shuffle(items);
    return go('practice', { set, script: dir, row: rowId, level: 'm', items, title: 'Зеркало' });
  }
  lv = +lv;
  items = base.map(([c]) => ({ ch: script === 'k' ? toKata(c) : c, mode: LEVELS[lv].mode, script }));
  if (lv > 1 && rowId !== 'mix') items = shuffle(items);
  go('practice', { set, script, row: rowId, level: lv, items, title: LEVELS[lv].name });
}

/* ===================== ПЛАНШЕТ ДЛЯ ПИСЬМА ===================== */
function Board(el) {
  el.innerHTML = `
    <svg class="layer-grid" viewBox="0 0 109 109"><g stroke="rgba(201,162,122,.16)" stroke-width=".5" stroke-dasharray="2 2"><path d="M54.5 6V103M6 54.5H103"/><path d="M6 6L103 103M103 6L6 103" opacity=".45"/></g></svg>
    <svg class="layer-guide" viewBox="0 0 109 109"></svg>
    <svg class="layer-done" viewBox="0 0 109 109"></svg>
    <canvas></canvas>
    <svg class="layer-overlay" viewBox="0 0 109 109"></svg>`;
  const canvas = $('canvas', el), ctx = canvas.getContext('2d');
  const B = { el, guide: $('.layer-guide', el), done: $('.layer-done', el), overlay: $('.layer-overlay', el), strokes: [], enabled: true, onStroke: null, onStart: null };
  let cur = null, penSeen = false, size = 0, dpr = 1, ink = '#ece2d0';
  function fit() {
    const r = el.getBoundingClientRect(); size = r.width; dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr); redraw();
  }
  const toPx = v => v / 109 * size;
  function seg(a, b, color) {
    ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = toPx(3.6) * (0.55 + (b[2] ?? 0.5) * 0.9);
    ctx.beginPath(); ctx.moveTo(toPx(a[0]), toPx(a[1])); ctx.lineTo(toPx(b[0]), toPx(b[1])); ctx.stroke();
  }
  function drawStroke(s, color) {
    if (s.length === 1) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(toPx(s[0][0]), toPx(s[0][1]), toPx(1.8), 0, 7); ctx.fill(); return; }
    for (let i = 1; i < s.length; i++) seg(s[i - 1], s[i], color);
  }
  function redraw(extra) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size);
    B.strokes.forEach(s => drawStroke(s, ink));
    if (extra) drawStroke(extra.s, extra.color);
  }
  function pt(e) {
    const r = canvas.getBoundingClientRect();
    const p = e.pointerType === 'pen' ? (e.pressure || 0.5) : 0.5;
    return [(e.clientX - r.left) / r.width * 109, (e.clientY - r.top) / r.height * 109, p];
  }
  canvas.addEventListener('pointerdown', e => {
    if (!B.enabled) return;
    if (e.pointerType === 'pen') penSeen = true;
    else if (e.pointerType === 'touch' && penSeen) return; // ладонь не пишет, если есть Pencil
    e.preventDefault(); canvas.setPointerCapture(e.pointerId);
    cur = { id: e.pointerId, s: [pt(e)] }; B.onStart && B.onStart();
    redraw(); drawStroke(cur.s, ink);
  });
  canvas.addEventListener('pointermove', e => {
    if (!cur || e.pointerId !== cur.id) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    (evs.length ? evs : [e]).forEach(ev => {
      const p = pt(ev), last = cur.s[cur.s.length - 1];
      if (dist(p, last) < 0.35) return; cur.s.push(p); seg(last, p, ink);
    });
  });
  const end = e => {
    if (!cur || e.pointerId !== cur.id) return;
    const s = cur.s; cur = null;
    if (plen(s) < 1.2 && s.length < 3) { redraw(); return; } // случайное касание
    B.strokes.push(s); B.onStroke && B.onStroke(s);
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  B.fit = fit; B.redraw = redraw;
  B.clear = () => { B.strokes = []; redraw(); };
  B.popLast = () => { B.strokes.pop(); redraw(); };
  B.flashBad = (s) => { B.strokes.pop(); redraw({ s, color: '#ff6a4d' }); setTimeout(() => redraw(), 380); };
  B.dropLast = () => { B.strokes.pop(); redraw(); };
  B.setInk = c => { ink = c; redraw(); };
  window.addEventListener('resize', fit);
  B.destroy = () => window.removeEventListener('resize', fit);
  requestAnimationFrame(fit);
  return B;
}
const pathEl = (d, attrs) => { const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', d); for (const k in attrs) p.setAttribute(k, attrs[k]); return p; };
const STROKE = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };

/* ===================== ПРАКТИКА ===================== */
function renderPractice(cfg) {
  const ses = { cfg, queue: cfg.items.slice(), idx: 0, results: [], requeued: new Set(), timers: [] };
  const total = () => ses.queue.length;
  app().innerHTML = `
  <div class="practice">
    <header class="ptop"><button class="icon-btn" id="quit" aria-label="Выйти">${ICON.close}</button><div class="pdots" id="dots"></div><div class="plevel">${esc(cfg.title)}</div></header>
    <div class="prompt" id="prompt"></div>
    <div class="board-wrap"><div class="board" id="board"></div><div class="flashbar" id="fbar"><i></i></div></div>
    <div class="feedback" id="fb"></div>
    <div class="pbtns" id="btns"></div>
  </div>`;
  const board = Board($('#board'));
  const fb = $('#fb'), btns = $('#btns'), promptEl = $('#prompt'), fbar = $('#fbar');
  let st = null;
  const T = (f, ms) => { const t = setTimeout(f, ms); ses.timers.push(t); return t; };
  current = { leave() { ses.timers.forEach(clearTimeout); board.destroy(); try { speechSynthesis.cancel(); } catch (e) {} } };
  $('#quit').addEventListener('click', () => cfg.set === 'weak' ? go('home') : go('section', cfg.set));

  function dots() {
    $('#dots').innerHTML = ses.queue.map((it, i) => {
      const r = ses.results[i]; return `<i class="${i === ses.idx ? 'cur' : r ? (r.clean ? 'ok' : 'bad') : ''}"></i>`; }).join('');
  }
  function setFb(html) { fb.innerHTML = html; }

  function start() {
    ses.timers.forEach(clearTimeout); ses.timers = [];
    const it = ses.queue[ses.idx];
    const refs = refOf(it.ch);
    st = { it, refs, live: it.mode === 'trace' || it.mode === 'copy', cur: 0, misses: 0, strokeMiss: 0, checking: false, autoT: null, failed: false };
    board.clear(); board.guide.innerHTML = ''; board.done.innerHTML = ''; board.overlay.innerHTML = '';
    board.el.classList.remove('win', 'lose'); board.enabled = true; board.setInk('#ece2d0');
    dots(); setFb('');
    // подсказка над доской
    const rom = romOf(it.ch), hint = hintOf(it.ch);
    const scriptTag = `<span class="tag">${it.script === 'k' ? 'カタカナ' : 'ひらがな'}</span>`;
    let sample = '';
    if (it.mode === 'copy') sample = `<div class="sample card">${glyphSVG(it.ch, { numbers: true, width: 4 })}</div>`;
    if (it.mode === 'mirror') sample = `<div class="sample card">${glyphSVG(it.from, { width: 4.4 })}</div>`;
    promptEl.innerHTML = `${sample}<div class="ptext"><div class="romaji">${rom}</div><div class="phint">${scriptTag}${hint ? ' · ' + hint : ''}${it.mode === 'mirror' ? ' · напиши пару' : ''}</div></div>
      <button class="icon-btn" id="say" aria-label="Озвучить">${ICON.sound}</button>`;
    $('#say').addEventListener('click', () => speak(it.ch));
    // кнопки
    if (st.live) btns.innerHTML = `<button class="btn ghost" id="b-hint">💡 Подсказка</button><button class="btn ghost" id="b-restart">Заново</button>`;
    else btns.innerHTML = `<button class="btn ghost" id="b-undo">↶ Черта</button><button class="btn ghost" id="b-clear">Стереть</button>${it.mode === 'flash' ? '<button class="btn ghost" id="b-reflash">👁 Ещё раз</button>' : ''}<button class="btn primary" id="b-done">Готово</button>`;
    bindButtons();
    if (it.mode === 'trace') drawTraceGuide();
    if (it.mode === 'flash') doFlash();
    T(() => speak(it.ch), 250);
  }

  function bindButtons() {
    const on = (id, f) => { const b = $('#' + id); if (b) b.addEventListener('click', f); };
    on('b-hint', () => { st.misses++; hintStroke(st.cur); });
    on('b-restart', () => start());
    on('b-undo', () => { if (st.checking) return; clearTimeout(st.autoT); board.popLast(); board.overlay.innerHTML = ''; setFb(''); });
    on('b-clear', () => { if (st.checking) return; clearTimeout(st.autoT); board.clear(); board.overlay.innerHTML = ''; setFb(''); });
    on('b-reflash', () => { st.misses++; st.peeked = true; board.clear(); doFlash(); });
    on('b-done', () => { if (!st.checking) checkAll(); });
  }

  // уровень 1: пунктир + бегущая подсказка направления
  function drawTraceGuide() {
    const g = board.guide; g.innerHTML = '';
    KANA[st.it.ch].s.forEach((d, i) => {
      g.appendChild(pathEl(d, Object.assign({ stroke: 'rgba(236,226,208,.42)', 'stroke-width': 2.2, 'stroke-dasharray': '2.4 2.6' }, STROKE)));
    });
    markNext();
  }
  function markNext() {
    $$('.nextmark', board.guide).forEach(n => n.remove());
    if (st.cur >= st.refs.length) return;
    const d = KANA[st.it.ch].s[st.cur], ref = st.refs[st.cur];
    const hl = pathEl(d, Object.assign({ stroke: 'rgba(226,72,127,.42)', 'stroke-width': 5.2, class: 'nextmark' }, STROKE));
    board.guide.appendChild(hl);
    const comet = pathEl(d, Object.assign({ stroke: '#ff8fb5', 'stroke-width': 3.2, class: 'nextmark', 'stroke-dasharray': `7 ${ref.len + 20}` }, STROKE));
    board.guide.appendChild(comet);
    comet.animate([{ strokeDashoffset: 7 }, { strokeDashoffset: -ref.len }], { duration: Math.max(700, ref.len * 22), iterations: Infinity, easing: 'ease-in-out' });
    const [sx, sy] = ref.pts[0];
    const dot = document.createElementNS(SVGNS, 'circle'); dot.setAttribute('cx', sx); dot.setAttribute('cy', sy); dot.setAttribute('r', 2.6); dot.setAttribute('fill', '#ff8fb5'); dot.setAttribute('class', 'nextmark');
    board.guide.appendChild(dot);
    const [nx, ny] = KANA[st.it.ch].n[st.cur];
    const t = document.createElementNS(SVGNS, 'text'); t.setAttribute('x', nx); t.setAttribute('y', ny); t.setAttribute('class', 'nextmark');
    t.setAttribute('font-size', '8'); t.setAttribute('fill', '#ff8fb5'); t.setAttribute('font-weight', '700'); t.setAttribute('font-family', 'Georgia,serif'); t.textContent = st.cur + 1;
    board.guide.appendChild(t);
  }
  function hintStroke(i) {
    if (i >= st.refs.length) return;
    const d = KANA[st.it.ch].s[i], L = st.refs[i].len;
    const p = pathEl(d, Object.assign({ stroke: '#ff8fb5', 'stroke-width': 4.4, 'stroke-dasharray': `${L} ${L}`, 'stroke-dashoffset': L }, STROKE));
    board.overlay.appendChild(p);
    const a = p.animate([{ strokeDashoffset: L, opacity: 1 }, { strokeDashoffset: 0, opacity: 1, offset: .7 }, { strokeDashoffset: 0, opacity: 0 }], { duration: Math.max(900, L * 26), easing: 'ease-in-out' });
    a.onfinish = () => p.remove();
  }
  function snap(i) {
    const d = KANA[st.it.ch].s[i], L = st.refs[i].len;
    const p = pathEl(d, Object.assign({ stroke: '#ece2d0', 'stroke-width': 4.2 }, STROKE));
    board.done.appendChild(p);
    p.animate([{ strokeDasharray: `${L} ${L}`, strokeDashoffset: L * .6 }, { strokeDasharray: `${L} ${L}`, strokeDashoffset: 0 }], { duration: 160 });
  }

  // уровень 3: вспышка
  function doFlash() {
    board.enabled = false;
    board.guide.innerHTML = glyphSVG(st.it.ch, { width: 4.2 }).replace(/^<svg[^>]*>|<\/svg>$/g, '');
    board.guide.style.opacity = 1; board.guide.style.transition = '';
    const ms = S.settings.flash;
    fbar.classList.add('on'); const bar = $('i', fbar);
    bar.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: ms, fill: 'forwards' });
    setFb('<span class="muted">Запоминай…</span>');
    T(() => {
      board.guide.style.transition = 'opacity .35s'; board.guide.style.opacity = 0;
      fbar.classList.remove('on'); board.enabled = true; setFb('<span class="muted">А теперь сама ✍️</span>');
      T(() => { board.guide.innerHTML = ''; board.guide.style.opacity = 1; board.guide.style.transition = ''; }, 380);
    }, ms);
  }

  board.onStart = () => { if (st && st.autoT) { clearTimeout(st.autoT); st.autoT = null; } if (st && !st.live && board.overlay.innerHTML) { board.overlay.innerHTML = ''; } };
  board.onStroke = (s) => {
    if (!st || st.checking) { board.dropLast(); return; }
    if (st.live) return liveStroke(s);
    setFb('');
    if (board.strokes.length >= st.refs.length) st.autoT = T(() => checkAll(), 650);
  };

  function liveStroke(s) {
    const t = tol(st.it.mode === 'trace' ? 'trace' : 'copy');
    const r = checkLive(s, st.refs, st.cur, t);
    if (r.kind === 'ok') {
      board.dropLast(); snap(st.cur); st.cur++; st.strokeMiss = 0; setFb('');
      if (st.it.mode === 'trace') markNext();
      if (st.cur >= st.refs.length) finishItem(st.misses === 0);
      return;
    }
    st.misses++; st.strokeMiss++; board.flashBad(s);
    const n = st.cur + 1;
    const msg = r.kind === 'dir' ? `Черта №${n} идёт с другого конца ↩︎`
      : r.kind === 'order' ? `Это черта №${r.j + 1}, а сейчас нужна №${n}`
      : `Не похоже на черту №${n}. Ещё раз`;
    setFb(`<span class="warn">${msg}</span>`);
    if (st.strokeMiss >= 2) T(() => hintStroke(st.cur), 300);
  }

  function checkAll() {
    clearTimeout(st.autoT); st.autoT = null;
    if (!board.strokes.length) return;
    const res = checkWhole(board.strokes, st.refs, tol('global'));
    if (res.ok) { board.setInk('#a3cf45'); return finishItem(!st.misses && !st.failed); }
    st.failed = true; st.checking = true; board.enabled = false;
    board.el.classList.add('lose');
    // разбор: образец бледно + твои черты в цвете
    const ov = board.overlay; ov.innerHTML = '';
    KANA[st.it.ch].s.forEach(d => ov.appendChild(pathEl(d, Object.assign({ stroke: 'rgba(236,226,208,.22)', 'stroke-width': 5 }, STROKE))));
    res.norm.forEach((s, i) => {
      const ok = res.per[i] ? res.per[i].ok : false;
      const d = 'M' + s.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
      ov.appendChild(pathEl(d, Object.assign({ stroke: ok ? '#a3cf45' : '#ff6a4d', 'stroke-width': 3.2 }, STROKE)));
      const t = document.createElementNS(SVGNS, 'text'); t.setAttribute('x', s[0][0] - 3); t.setAttribute('y', s[0][1] - 2.5);
      t.setAttribute('font-size', '7'); t.setAttribute('font-weight', '700'); t.setAttribute('font-family', 'Georgia,serif'); t.setAttribute('fill', ok ? '#a3cf45' : '#ff6a4d'); t.textContent = i + 1; ov.appendChild(t);
    });
    board.clear();
    const n = st.refs.length; let msg;
    if (res.count === 'few') msg = `Черт: ${res.norm.length} из ${n}. Не хватает`;
    else if (res.count === 'many') msg = `Черт: ${res.norm.length}, а нужно ${n}`;
    else {
      const bad = res.per.map((p, i) => [p, i]).filter(([p]) => !p.ok);
      const sw = bad.find(([p]) => p.swap >= 0), dr = bad.find(([p]) => p.dir);
      if (dr) msg = `Черта №${dr[1] + 1} нарисована задом наперёд`;
      else if (sw) msg = `Перепутан порядок: черта №${sw[1] + 1} должна быть №${sw[0].swap + 1}`;
      else msg = `Не похожи черты: ${bad.map(([, i]) => '№' + (i + 1)).join(', ')}`;
    }
    setFb(`<span class="warn">${msg}</span><div class="row-btns"><button class="btn ghost" id="f-anim">${ICON.play.replace('<svg', '<svg width="14" height="14" style="fill:currentColor;stroke:none"')} Показать</button><button class="btn" id="f-retry">Ещё раз</button><button class="btn primary" id="f-next">Дальше</button></div>`);
    $('#f-anim').addEventListener('click', () => { ov.innerHTML = glyphSVG(st.it.ch, { width: 4.4, color: '#ff8fb5' }).replace(/^<svg[^>]*>|<\/svg>$/g, ''); animateStrokes(ov); });
    $('#f-retry').addEventListener('click', () => { st.checking = false; board.enabled = true; board.overlay.innerHTML = ''; board.el.classList.remove('lose'); setFb(''); if (st.it.mode === 'flash') doFlash(); });
    $('#f-next').addEventListener('click', () => finishItem(false, true));
  }

  function finishItem(clean, skipped) {
    const it = st.it;
    if (!ses.results[ses.idx]) ses.results[ses.idx] = { ch: it.ch, clean: clean && !st.failed, misses: st.misses };
    // прогресс знака
    const c = ck(it.ch); c.seen++;
    const passedClean = clean && !st.failed;
    if (!passedClean) c.fails++;
    if (passedClean) { if (it.mode === 'mirror') c.mirror = 1; else { const lv = { trace: 1, copy: 2, flash: 3, recall: 4 }[it.mode]; c.best = Math.max(c.best, lv); } }
    S.days[today()] = (S.days[today()] || 0) + 1; save();
    if (!passedClean && !ses.requeued.has(it.ch) && cfg.level !== 1) { ses.requeued.add(it.ch); ses.queue.push(Object.assign({}, it)); }
    const next = () => { ses.idx++; if (ses.idx >= ses.queue.length) return endSession(); start(); };
    if (skipped) return next();
    board.enabled = false; board.el.classList.add('win'); st.checking = true;
    const yay = passedClean ? rand(['よし！', 'いいね！', 'すごい！', '完璧！']) : 'できた！';
    setFb(`<span class="good"><span class="jp">${yay}</span>${passedClean ? '' : ' Засчитано, но знак вернётся'}</span>`);
    if (passedClean) { const img = document.createElement('img'); img.className = 'popper'; img.src = 'img/' + rand(['slime-pink', 'slime-green', 'slime-pink2', 'sakura']) + '.webp'; $('.board-wrap').appendChild(img); T(() => img.remove(), 1000); }
    T(next, passedClean ? 850 : 1200);
  }

  function endSession() {
    // итог по ряду
    const firstPass = cfg.items.map(it => ses.results.find(r => r && r.ch === it.ch));
    const perfect = firstPass.every(r => r && r.clean);
    if (cfg.set !== 'weak') {
      const key = rowKey(cfg.set, cfg.script, cfg.row, cfg.level);
      const prev = S.rows[key] || {};
      S.rows[key] = { done: true, perfect: !!(prev.perfect || perfect), at: Date.now() };
      save();
    }
    const missed = [...new Set(firstPass.filter(r => r && !r.clean).map(r => r.ch))];
    go('result', { cfg, perfect, missed, total: cfg.items.length });
  }

  start();
}

/* ===================== ИТОГ ===================== */
function renderResult({ cfg, perfect, missed, total }) {
  const clean = total - missed.length;
  const canNext = typeof cfg.level === 'number' && cfg.level < 4 && cfg.row !== 'weak';
  app().innerHTML = `
  <div class="result">
    <img src="img/${perfect ? 'goukaku' : missed.length <= 1 ? 'ramen' : 'ganbare'}.webp" alt="">
    <h2>${perfect ? 'Чисто! 合格' : missed.length <= 1 ? 'Почти идеально' : 'Есть над чем поработать'}</h2>
    <div class="score">${clean} из ${total} без единой ошибки</div>
    ${missed.length ? `<div class="redo">${missed.map(c => `<span>${c}</span>`).join('')}</div><div class="muted">Эти знаки попадут в «Слабые»</div>` : ''}
    <div class="actions">
      ${canNext ? `<button class="btn primary" id="r-next">Следующий уровень · ${LEVELS[cfg.level + 1].name}</button>` : ''}
      <button class="btn ${canNext ? '' : 'primary'}" id="r-again">Ещё раз</button>
      <button class="btn ghost" id="r-back">${cfg.set === 'weak' ? 'На главную' : 'К рядам'}</button>
    </div>
  </div>`;
  const again = () => {
    if (cfg.set === 'weak') { const items = weakList().map(c => ({ ch: c, mode: 'recall', script: /[゠-ヿ]/.test(c) ? 'k' : 'h' })); return items.length ? go('practice', Object.assign({}, cfg, { items })) : go('home'); }
    if (cfg.level === 'm') return startRow(cfg.set, cfg.script, cfg.row, 'm');
    startRow(cfg.set, cfg.script, cfg.row, cfg.level);
  };
  $('#r-again').addEventListener('click', again);
  $('#r-back').addEventListener('click', () => cfg.set === 'weak' ? go('home') : go('section', cfg.set));
  if (canNext) $('#r-next').addEventListener('click', () => startRow(cfg.set, cfg.script, cfg.row, cfg.level + 1));
  speak(perfect ? 'ごうかく' : 'がんばれ');
}

/* ===================== ТАБЛИЦА ===================== */
const tview = { tab: 'base', mode: 'pairs' };
function renderTable() {
  const rows = tview.tab === 'base' ? [...ROWS, { id: 'nn', label: 'ん', con: 'N', cells: ['ん', null, null, null, null], rom: ['n', null, null, null, null] }] : tview.tab === 'dak' ? DROWS : YROWS;
  const glyph = c => tview.mode === 'k' ? toKata(c) : c;
  const grid = rows.map(r => `<div class="krow ${r.cells.length === 3 ? 'y3' : ''}">
      <button class="khead" data-row="${r.id}"><b>${r.con}</b>${r.label.replace(' + ん', '')}</button>
      ${r.cells.map((c, i) => c ? `<button class="kcell" data-c="${c}"><span class="g">${glyph(c)}</span><span class="r">${tview.mode === 'pairs' ? `<span class="jp">${toKata(c)}</span>` : ''}${r.rom[i]}</span>${(S.chars[glyph(c)] || {}).best >= 4 ? '<i class="lv"></i>' : ''}</button>` : '<div class="kcell empty"></div>').join('')}
    </div>`).join('');
  app().innerHTML = `
  <header class="top"><button class="icon-btn" data-go="home">${ICON.back}</button><h1>Таблица<small class="jp">五十音</small></h1></header>
  <div class="seg tabs"><button data-t="base" class="${tview.tab === 'base' ? 'on' : ''}">Годзюон</button><button data-t="dak" class="${tview.tab === 'dak' ? 'on' : ''}">Дакутэн</button><button data-t="yoon" class="${tview.tab === 'yoon' ? 'on' : ''}">Ёон</button></div>
  <div class="seg" style="margin-bottom:14px"><button data-m="h" class="${tview.mode === 'h' ? 'on' : ''}">ひらがな</button><button data-m="k" class="${tview.mode === 'k' ? 'on' : ''}">カタカナ</button><button data-m="pairs" class="${tview.mode === 'pairs' ? 'on' : ''}">Пары</button></div>
  <div class="ktable">${grid}</div>
  <p class="muted" style="text-align:center;font-size:15px;margin-top:16px">Нажми на знак — карточка с порядком черт и парой. На букву ряда — весь ряд целиком.</p>`;
  bindNav();
  $$('[data-t]').forEach(b => b.addEventListener('click', () => { tview.tab = b.dataset.t; renderTable(); }));
  $$('[data-m]').forEach(b => b.addEventListener('click', () => { tview.mode = b.dataset.m; renderTable(); }));
  $$('.kcell[data-c]').forEach(b => b.addEventListener('click', () => openCard(b.dataset.c, tview.mode === 'k')));
  $$('.khead').forEach(b => b.addEventListener('click', () => openRow(rows.find(r => r.id === b.dataset.row))));
}
function faceHTML(ch, script, other, cls) {
  const isKana = !!KANA[ch];
  return `<div class="face ${cls}">
    <div class="script">${script}</div>
    <div class="big">${isKana ? glyphSVG(ch, { numbers: true, width: 4.4 }) : `<div class="fontglyph">${ch}</div>`}</div>
    <div class="rom">${romOf(ch)}</div>
    <div class="pair">пара: <span class="jp">${other}</span>${KANA[ch] ? ` · черт: ${KANA[ch].s.length}` : ''}</div>
  </div>`;
}
function openCard(hira, startKata) {
  const kata = toKata(hira);
  modal(`<div class="flip ${startKata ? 'on' : ''}" id="flip"><div class="flip-inner">
      ${faceHTML(hira, 'ひらがな', kata, 'front')}${faceHTML(kata, 'カタカナ', hira, 'back')}
    </div></div>
    <div class="tools"><button class="btn" id="c-play">${ICON.play.replace('<svg', '<svg width="16" height="16" style="fill:currentColor;stroke:none"')} Порядок черт</button><button class="btn" id="c-say">${ICON.sound.replace('<svg', '<svg width="18" height="18" style="fill:none;stroke:currentColor;stroke-width:2"')}</button><button class="btn primary" id="c-flip">${ICON.flip.replace('<svg', '<svg width="18" height="18" style="fill:none;stroke:currentColor;stroke-width:2"')} Перевернуть</button></div>`);
  const flip = $('#flip');
  const visible = () => flip.classList.contains('on') ? $('.face.back', flip) : $('.face.front', flip);
  const play = () => { const svg = $('.big svg', visible()); if (svg) animateStrokes(svg); };
  $('#c-play').addEventListener('click', play);
  $('#c-say').addEventListener('click', () => speak(hira));
  $('#c-flip').addEventListener('click', () => { flip.classList.toggle('on'); setTimeout(play, 300); });
  setTimeout(play, 250); speak(hira);
}
function openRow(row) {
  const list = rowChars(row);
  modal(`<h2 style="margin:0 0 2px;font-size:28px">${row.label}</h2><div class="muted">хирагана · катакана · ромадзи</div>
    <div class="rowlist">${list.map(([c, r]) => `<div><span class="jp">${c}</span><span class="jp">${toKata(c)}</span><span style="font-size:22px">${r}</span></div>`).join('')}</div>
    ${KANA[list[0][0]] && (ROWS.includes(row) || DROWS.includes(row)) ? `<div class="tools"><button class="btn" id="r-h">Писать хирагану</button><button class="btn" id="r-k">Писать катакану</button></div>` : ''}`);
  const set = ROWS.includes(row) ? ['hira', 'kata'] : ['dakuten', 'dakuten'];
  const bh = $('#r-h'), bk = $('#r-k');
  if (bh) bh.addEventListener('click', () => { closeModal(); if (set[0] === 'dakuten') view.dakScript = 'h'; startRow(set[0], 'h', row.id, 1); });
  if (bk) bk.addEventListener('click', () => { closeModal(); if (set[1] === 'dakuten') view.dakScript = 'k'; startRow(set[1], 'k', row.id, 1); });
}
function modal(inner) {
  const root = $('#modal-root');
  root.innerHTML = `<div class="modal" id="modal"><div class="card sheet"><button class="icon-btn close" id="m-close">${ICON.close}</button>${inner}</div></div>`;
  $('#m-close').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
}
function closeModal() { const r = $('#modal-root'); if (r) r.innerHTML = ''; }

/* ===================== НАСТРОЙКИ ===================== */
function renderSettings() {
  const s = S.settings;
  const seg = (name, opts, val) => `<div class="seg">${opts.map(([v, l]) => `<button data-k="${name}" data-v="${v}" class="${String(val) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  app().innerHTML = `
  <header class="top"><button class="icon-btn" data-go="home">${ICON.back}</button><h1>Настройки</h1></header>
  <div class="card set-item"><h3>Строгость проверки</h3><p>Насколько точно черта должна совпасть с образцом. Порядок и направление проверяются всегда.</p>${seg('strict', [['lenient', 'Мягко'], ['normal', 'Обычно'], ['strict', 'Строго']], s.strict)}</div>
  <div class="card set-item"><h3>Вспышка</h3><p>Сколько секунд образец виден на уровне ③.</p>${seg('flash', [[1500, '1,5 с'], [2500, '2,5 с'], [3500, '3,5 с']], s.flash)}</div>
  <div class="card set-item"><h3>Озвучка</h3><p>Японский голос iOS произносит знак. Если молчит — добавь голос в Настройки → Универсальный доступ → Устный контент.</p>${seg('sound', [[true, 'Включена'], [false, 'Выключена']], s.sound)}</div>
  <div class="card set-item"><h3>Резервная копия</h3><p>Прогресс живёт в памяти браузера на этом устройстве. Сохрани файл, чтобы перенести на второй iPad или не потерять.</p>
    <div class="btns"><button class="btn" id="exp">Сохранить файл</button><label class="btn">Загрузить<input type="file" id="imp" accept="application/json,.json" hidden></label><button class="btn ghost" id="reset">Сбросить всё</button></div></div>
  <div class="credits">Данные о чертах: <a href="https://kanjivg.tagaini.net" target="_blank" rel="noopener">KanjiVG</a> © Ulrich Apel, лицензия CC BY-SA 3.0. Ромадзи — система Хэпбёрна.</div>`;
  bindNav();
  $$('[data-k]').forEach(b => b.addEventListener('click', () => {
    let v = b.dataset.v; if (b.dataset.k === 'flash') v = +v; if (b.dataset.k === 'sound') v = v === 'true';
    S.settings[b.dataset.k] = v; save(); renderSettings(); if (b.dataset.k === 'sound' && v) speak('ねこ');
  }));
  $('#exp').addEventListener('click', async () => {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const name = `nekokana-${today()}.json`;
    try {
      const file = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Нэко-кана: прогресс' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $('#imp').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const d = JSON.parse(await f.text()); if (!d.chars) throw 0; S = Object.assign({ chars: {}, rows: {}, days: {}, settings: {} }, d); save(); toast('Прогресс загружен'); renderSettings(); }
    catch (err) { toast('Это не похоже на файл Нэко-каны'); }
  });
  const rb = $('#reset'); let armed = false;
  rb.addEventListener('click', () => {
    if (!armed) { armed = true; rb.textContent = 'Точно? Нажми ещё раз'; rb.style.borderColor = 'var(--bad)'; setTimeout(() => { armed = false; rb.textContent = 'Сбросить всё'; rb.style.borderColor = ''; }, 3500); return; }
    S = { chars: {}, rows: {}, days: {}, settings: S.settings }; save(); toast('Начинаем с чистого листа. Кот не одобряет'); renderSettings();
  });
}

/* ===================== СТАРТ ===================== */
async function boot() {
  const [kana, cat] = await Promise.all([fetch('data/kana.json').then(r => r.json()), fetch('img/cat.svg').then(r => r.text())]);
  KANA = kana; CAT_SVG = cat;
  go('home');
  if ('serviceWorker' in navigator && location.protocol === 'https:') { try { navigator.serviceWorker.register('sw.js'); } catch (e) {} }
}
// для тестов
window.NK = { refOf, checkLive, checkWhole, strokeMatch, normalize, TOL, get KANA() { return KANA; }, S: () => S, go, toKata, ROWS, DROWS };
boot().catch(err => { app().innerHTML = `<div class="boot" style="font-size:20px;font-family:var(--serif)">Не удалось загрузить данные: ${esc(err.message || err)}</div>`; });
})();
