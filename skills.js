'use strict';
/* Навыки, адаптивная сложность (F6), дневной маршрут (F4), история занятий (для отчёта родителя, F9).
   Чистая логика без DOM: работает и в браузере (window.Skills), и в Node (для автотестов). */
(function (root) {
const SKILLS = ['numbers', 'logic', 'space', 'attention', 'memory', 'chess'];
const MAX_LVL = 5, WIN = 10, UP_AT = 0.8, DOWN_AT = 0.4, ROUTE_LEN = 4, HIST_DAYS = 120;

/* какой генератор к какому навыку относится */
const SKILL_OF = {
  add: 'numbers', sub: 'numbers', mul: 'numbers', div: 'numbers', missing: 'numbers', word: 'numbers', units: 'numbers', time: 'numbers',
  fshade: 'numbers', fof: 'numbers', fcmp: 'numbers', ncmp: 'numbers', ops: 'numbers', equiv: 'numbers',
  seq: 'logic', machine: 'logic', odd: 'logic', pattern: 'logic', analogy: 'logic', riddle: 'logic', order: 'logic', legs: 'logic', balance: 'logic', sudoku: 'logic', magic: 'logic',
  perim: 'space', area: 'space', shapes: 'space', robot: 'space', mirror: 'space', rotate: 'space', symm: 'space', where: 'space',
  ycount: 'numbers', yadd: 'numbers', ymore: 'numbers',
  count: 'attention', diff: 'attention', vanish: 'attention', same: 'attention', most: 'attention', unpair: 'attention',
  memseq: 'memory', mempos: 'memory', memnum: 'memory', memcount: 'memory', mempair: 'memory', memcolor: 'memory',
  chess_move: 'chess', chess_capture: 'chess', chess_check: 'chess', chess_mate: 'chess', chess_win: 'chess', chess_save: 'chess',
};

/* Задания, которые подходят в 5–7 лет: почти без чтения, мелкие числа, картинки */
const YOUNG = new Set(['add', 'sub', 'ycount', 'yadd', 'ymore', 'seq', 'odd', 'pattern', 'robot', 'mirror', 'where', 'count', 'diff', 'vanish', 'same', 'most', 'unpair',
  'memseq', 'mempos', 'memnum', 'memcount', 'mempair', 'memcolor', 'chess_move', 'chess_capture', 'chess_check', 'chess_mate', 'chess_win', 'chess_save']);
const YOUNG_MAX_AGE = 7, AGES = [5, 6, 7, 8, 9, 10];
const isYoungAge = age => age >= 5 && age <= YOUNG_MAX_AGE;
/* для малышей оставляем только «лёгкие» типы, если их в навыке хотя бы 2; иначе — всё */
const forAge = (ids, age) => { if (!isYoungAge(age)) return ids; const y = ids.filter(id => YOUNG.has(id)); return y.length >= 2 ? y : ids; };

/* ---------- даты ---------- */
const pad = n => String(n).padStart(2, '0');
const dayStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseDay(s); d.setDate(d.getDate() + n); return dayStr(d); };

/* ---------- навыки и адаптивный уровень ---------- */
const newSkill = () => ({ lvl: 1, win: [], n: 0, ok: 0 });
const startLvl = (k, age) => k === 'chess' || !age ? 1 : (k === 'attention' || k === 'memory') ? (age >= 9 ? 2 : 1) : age >= 10 ? 3 : age >= 8 ? 2 : 1;
const newSkills = age => Object.fromEntries(SKILLS.map(k => [k, Object.assign(newSkill(), { lvl: startLvl(k, age) })]));
/* смена возраста: стартовый уровень меняем только у навыков, в которых ещё не было ответов */
const applyAge = (sk, age) => { for (const k of SKILLS) if (sk[k] && !sk[k].n) { sk[k].lvl = startLvl(k, age); sk[k].win = []; } return sk; };
const fixSkills = sk => { sk = sk || {}; for (const k of SKILLS) { const x = sk[k] = Object.assign(newSkill(), sk[k]); x.lvl = Math.min(MAX_LVL, Math.max(1, x.lvl | 0)); if (!Array.isArray(x.win)) x.win = []; } return sk; };

/* Результат ответа с первой попытки. Уровень оценивается блоками по 10 ответов на текущем уровне:
   точность ≥ 80% → уровень выше; < 40% → мягко ниже; иначе остаёмся. После оценки блок начинается заново.
   Возвращает 'up' | 'down' | null. */
function recordResult(sk, firstOk) {
  sk.n++; if (firstOk) sk.ok++;
  sk.win.push(firstOk ? 1 : 0);
  if (sk.win.length < WIN) return null;
  const acc = sk.win.reduce((a, b) => a + b, 0) / WIN;
  let ch = null;
  if (acc >= UP_AT && sk.lvl < MAX_LVL) { sk.lvl++; ch = 'up'; }
  else if (acc < DOWN_AT && sk.lvl > 1) { sk.lvl--; ch = 'down'; }
  sk.win = [];
  return ch;
}
/* звёзды за занятие по доле верных ответов с первой попытки */
const starsFor = (ok, total) => (total <= 0 ? 3 : ok / total >= 0.85 ? 3 : ok / total >= 0.6 ? 2 : 1);

/* ---------- история занятий ---------- */
const emptyDay = () => ({ sec: 0, ses: 0, sk: {} });
function addHist(hist, date, { sec = 0, ses = 0, skill, ok = 0, total = 0, l2n = 0, l2ok = 0, tap = 0, hard } = {}) {
  const d = hist[date] || (hist[date] = emptyDay());
  d.sec += Math.round(sec); d.ses += ses;
  if (l2n || tap) { const l = d.l2 || (d.l2 = { n: 0, ok: 0, tap: 0 }); l.n += l2n; l.ok += l2ok; l.tap += tap; }
  if (hard) { const h = d.hard || (d.hard = {}); h[hard] = (h[hard] || 0) + 1; }
  if (skill && total) { const a = d.sk[skill] || (d.sk[skill] = [0, 0]); a[0] += ok; a[1] += total; }
  return d;
}
function pruneHist(hist, today) {
  const min = addDays(today, -HIST_DAYS);
  for (const k of Object.keys(hist)) if (k < min) delete hist[k];
  return hist;
}
const daysPlayedIn = (hist, endDate, n) => { let c = 0; for (let i = 0; i < n; i++) { const d = hist[addDays(endDate, -i)]; if (d && d.ses > 0) c++; } return c; };
const daysPlayedTotal = hist => Object.values(hist).filter(d => d.ses > 0).length;
const lastPlayed = (hist, skill) => { let best = ''; for (const [k, d] of Object.entries(hist)) if (d.sk && d.sk[skill] && d.sk[skill][1] > 0 && k > best) best = k; return best; };
function mergeHist(a, b) {
  const out = {};
  for (const k of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) {
    const x = (a || {})[k] || emptyDay(), y = (b || {})[k] || emptyDay(), m = emptyDay();
    m.sec = Math.max(x.sec, y.sec); m.ses = Math.max(x.ses, y.ses);
    if (x.l2 || y.l2) { const p = x.l2 || { n: 0, ok: 0, tap: 0 }, q = y.l2 || { n: 0, ok: 0, tap: 0 }; m.l2 = { n: Math.max(p.n, q.n), ok: Math.max(p.ok, q.ok), tap: Math.max(p.tap, q.tap) }; }
    if (x.hard || y.hard) { m.hard = {}; for (const k of new Set([...Object.keys(x.hard || {}), ...Object.keys(y.hard || {})])) m.hard[k] = Math.max((x.hard || {})[k] || 0, (y.hard || {})[k] || 0); }
    for (const s of new Set([...Object.keys(x.sk || {}), ...Object.keys(y.sk || {})])) {
      const p = (x.sk || {})[s] || [0, 0], q = (y.sk || {})[s] || [0, 0]; m.sk[s] = q[1] > p[1] ? q.slice() : p.slice(); }
    out[k] = m;
  }
  return out;
}
function mergeSkills(a, b) {
  a = fixSkills(a); b = fixSkills(b); const out = {};
  for (const k of SKILLS) out[k] = JSON.parse(JSON.stringify(b[k].n > a[k].n ? b[k] : a[k]));   // берём копию с большим числом ответов
  return out;
}

/* Недельная статистика для отчёта: 7 дней, оканчивающихся endDate, и 7 предыдущих. */
function weekStats(hist, endDate) {
  const range = off => Array.from({ length: 7 }, (_, i) => addDays(endDate, -(6 + off) + i));
  const cur = range(0), prev = range(7);
  const sum = days => {
    const r = { sec: 0, ses: 0, played: 0, sk: {}, ok: 0, total: 0, l2: { n: 0, ok: 0, tap: 0 }, hard: {} };
    for (const d of days) { const h = hist[d]; if (!h) continue; r.sec += h.sec; r.ses += h.ses; if (h.ses > 0) r.played++;
      if (h.l2) { r.l2.n += h.l2.n; r.l2.ok += h.l2.ok; r.l2.tap += h.l2.tap; } for (const [k, v] of Object.entries(h.hard || {})) r.hard[k] = (r.hard[k] || 0) + v;
      for (const [s, [o, t]] of Object.entries(h.sk || {})) { const a = r.sk[s] || (r.sk[s] = [0, 0]); a[0] += o; a[1] += t; r.ok += o; r.total += t; } }
    return r;
  };
  return { days: cur.map(d => ({ date: d, sec: (hist[d] || {}).sec || 0, ses: (hist[d] || {}).ses || 0 })), cur: sum(cur), prev: sum(prev) };
}

/* ---------- дневной маршрут ---------- */
/* 4 мини-игры по разным навыкам: сначала те, которые дольше всего не тренировались. avail — навыки, для которых есть задачи. */
function pickRoute(hist, avail, rnd = Math.random) {
  const pool = SKILLS.filter(s => avail.includes(s));
  const key = s => (lastPlayed(hist, s) || '0000-00-00') + '|' + (0.5 + rnd() * 0.5).toFixed(3);   // «ни разу» = самая давняя дата
  const picked = pool.map(s => [s, key(s)]).sort((a, b) => (a[1] < b[1] ? -1 : 1)).slice(0, Math.min(ROUTE_LEN, pool.length)).map(x => x[0]);
  // чтобы маршрут не был «по порядку лестницы», слегка перемешиваем, но первым оставляем самый давний навык
  const [first, ...rest] = picked; for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  return [first, ...rest].filter(Boolean);
}
function ensureRoute(S, today, avail, rnd) {
  if (!S.route || S.route.date !== today) S.route = { date: today, skills: pickRoute(S.hist, avail, rnd), done: [], finished: false };
  return S.route;
}


/* ---------- двуязычный режим (B1–B7) ---------- */
const SHARES = [10, 20, 30, 50, 80];
const newBil = () => ({ second: '', mode: 'mix', share: 30, adapt: true, carry: 0, adaptedAt: '' });
const fixBil = b => { b = Object.assign(newBil(), b || {}); if (b.mode !== 'immersion') b.mode = 'mix'; if (!SHARES.includes(b.share)) b.share = 30; b.carry = Number.isFinite(+b.carry) ? Math.max(0, Math.min(1, +b.carry)) : 0; b.second = typeof b.second === 'string' ? b.second : ''; b.adapt = b.adapt !== false; return b; };
const bilActive = (bil, primary) => !!bil.second && bil.second !== primary;
/* Какие из n заданий занятия будут на втором языке. Доля копится дробными остатками (carry), поэтому в среднем точна
   (20/30/50/80%), а в одном занятии отклонение не больше одного задания. «Погружение» — все задания на втором языке. */
function planLangs(n, bil, rnd = Math.random) {
  if (bil.mode === 'immersion') return { flags: Array(n).fill(true), carry: 0 };
  const want = n * bil.share / 100 + (bil.carry || 0), k = Math.max(0, Math.min(n, Math.floor(want + 1e-9))), flags = Array(n).fill(false);
  const idx = [...Array(n).keys()]; for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  idx.slice(0, k).forEach(i => (flags[i] = true));
  return { flags, carry: Math.max(0, want - k) };
}
/* Адаптация доли (B6): часто нажимают «не понял» — доля второго языка ниже, редко — выше. Не чаще раза в 7 дней, нужны данные за неделю. */
function adaptShare(bil, week, today) {
  const out = { share: bil.share, adaptedAt: bil.adaptedAt, changed: null };
  if (!bil.adapt || bil.mode !== 'mix' || !bil.second) return out;
  if (bil.adaptedAt && (parseDay(today) - parseDay(bil.adaptedAt)) / 864e5 < 7) return out;
  const n = week.n, rate = n ? week.tap / n : 0, i = SHARES.indexOf(bil.share);
  if (n >= 10 && rate > 0.35 && i > 0) { out.share = SHARES[i - 1]; out.changed = 'down'; }
  else if (n >= 20 && rate < 0.1 && i < SHARES.length - 1) { out.share = SHARES[i + 1]; out.changed = 'up'; }
  if (out.changed) out.adaptedAt = today;
  return out;
}
const mergeBil = (nw, ol) => JSON.parse(JSON.stringify(nw.second || !ol.second ? nw : ol));

/* ---------- родительская зона: PIN и дневной лимит времени (F10) ---------- */
const newParent = () => ({ pin: '', salt: '', limit: 0, extra: { date: '', min: 0 } });
const fixParent = p => { p = Object.assign(newParent(), p || {}); p.limit = Math.max(0, Math.min(180, p.limit | 0)); p.extra = Object.assign({ date: '', min: 0 }, p.extra || {}); return p; };
/* Простой солёный хэш (cyrb53): нужен, чтобы не хранить PIN открытым текстом. Это защита «от ребёнка», а не от взломщика: 4 цифры подбираются мгновенно. */
function pinHash(pin, salt) {
  const str = salt + '|' + pin + '|' + salt; let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
const hasPin = p => !!p.pin;
const checkPin = (p, pin) => !!p.pin && pinHash(String(pin), p.salt) === p.pin;
const setPin = (p, pin, salt) => { p.salt = salt; p.pin = pinHash(String(pin), salt); return p; };
/* Сколько секунд осталось на сегодня (Infinity — лимита нет). live — время текущего, ещё не записанного занятия. */
function limitLeft(parent, hist, today, live = 0) {
  if (!parent.limit) return Infinity;
  const extra = parent.extra && parent.extra.date === today ? parent.extra.min : 0, used = ((hist[today] || {}).sec || 0) + live;
  return (parent.limit + extra) * 60 - used;
}
const mergeParent = (nw, ol) => JSON.parse(JSON.stringify(nw.pin || !ol.pin ? nw : ol));   // побеждает копия, где PIN уже задан

const api = { YOUNG, AGES, isYoungAge, forAge, startLvl, applyAge, SHARES, newBil, fixBil, bilActive, planLangs, adaptShare, mergeBil, newParent, fixParent, pinHash, hasPin, checkPin, setPin, limitLeft, mergeParent, SKILLS, SKILL_OF, MAX_LVL, WIN, UP_AT, DOWN_AT, ROUTE_LEN, HIST_DAYS, dayStr, parseDay, addDays, newSkills, fixSkills, recordResult, starsFor,
  addHist, pruneHist, daysPlayedIn, daysPlayedTotal, lastPlayed, mergeHist, mergeSkills, weekStats, pickRoute, ensureRoute };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Skills = api;
})(typeof window !== 'undefined' ? window : globalThis);
