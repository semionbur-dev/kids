'use strict';
/* Генераторы задач. Каждый генератор: (сложность 1..5) -> вопрос
   вопрос = {type:'choice'|'num', text, visual?, choices?:[{h,v}], answer, hint, explain, big?}      */
(() => {
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[rnd(0, a.length - 1)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const frac = (n, d) => `<span class="fr"><i>${n}</i><i>${d}</i></span>`;
const BL = '<span class="blank">?</span>';

const GENS = [];
const gen = (topic, id, minD, make) => GENS.push({ topic, id, minD, make });
const mkChoice = (q, choices) => Object.assign(q, { type: 'choice', choices });
const mkNum = q => Object.assign(q, { type: 'num' });
const byD = (d, q, opts) => (d <= 2 ? mkChoice(q, opts) : mkNum(q));

function numOpts(ans, extra = []) {
  const s = new Set([ans]);
  const step = Math.max(3, Math.round(ans * 0.1));
  const cands = [ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, ans + step, ans - step, ...extra];
  for (const c of shuffle(cands)) { if (s.size >= 4) break; if (c >= 0 && Number.isInteger(c)) s.add(c); }
  for (let k = 1; s.size < 4; k++) s.add(ans + k * 3);
  return shuffle([...s]).map(n => ({ h: String(n), v: n }));
}
const txtOpts = (ok, bad) => shuffle([ok, ...bad]).map(t => ({ h: esc(t), v: t }));

/* ======================== АРИФМЕТИКА ======================== */
gen('arith', 'add', 1, d => {
  let a, b;
  if (d === 1) { a = rnd(3, 12); b = rnd(3, 9); }
  else if (d === 2) { a = rnd(12, 68); b = rnd(11, 29); }
  else if (d === 3) { a = rnd(120, 560); b = rnd(35, 390); }
  else { a = rnd(340, 2400); b = rnd(180, 2400); }
  const ans = a + b;
  return byD(d, { text: `${a} + ${b} = ?`, answer: ans,
    hint: 'Складывай по разрядам: сначала единицы, потом десятки, потом сотни.', explain: `${a} + ${b} = ${ans}` }, numOpts(ans));
});

gen('arith', 'sub', 1, d => {
  let a, b;
  if (d === 1) { a = rnd(8, 20); b = rnd(2, a - 3); }
  else if (d === 2) { a = rnd(30, 99); b = rnd(11, a - 8); }
  else if (d === 3) { a = rnd(200, 999); b = rnd(40, a - 30); }
  else { a = rnd(1000, 5000); b = rnd(200, a - 100); }
  const ans = a - b;
  return byD(d, { text: `${a} − ${b} = ?`, answer: ans,
    hint: 'Вычитай по разрядам. Можно сначала вычесть десятки, потом единицы.', explain: `${a} − ${b} = ${ans}` }, numOpts(ans));
});

gen('arith', 'mul', 1, d => {
  let a, b;
  if (d === 1) { a = rnd(2, 5); b = rnd(2, 9); }
  else if (d === 2) { a = rnd(2, 9); b = rnd(2, 9); }
  else if (d === 3) { a = rnd(11, 25); b = rnd(2, 5); }
  else if (d === 4) { a = rnd(12, 49); b = rnd(3, 9); }
  else { a = rnd(25, 99); b = rnd(3, 9); }
  if (Math.random() < 0.5) [a, b] = [b, a];
  const ans = a * b;
  return byD(d, { text: `${a} × ${b} = ?`, answer: ans,
    hint: d <= 2 ? 'Вспомни таблицу умножения. Умножение — это сложение одинаковых чисел.' : 'Разбей большое число на десятки и единицы: 14 × 3 = 10 × 3 + 4 × 3.',
    explain: `${a} × ${b} = ${ans}` }, numOpts(ans, [ans + a, ans - b]));
});

gen('arith', 'div', 1, d => {
  let a, b, c;
  if (d === 4) {
    b = rnd(3, 9); c = rnd(4, 12); const r = rnd(1, b - 1); a = b * c + r;
    return mkNum({ text: `Сколько целых раз ${b} помещается в ${a}?`, answer: c,
      hint: `Найди самое большое число, которое при умножении на ${b} не больше ${a}.`, explain: `${b} × ${c} = ${b * c}, а ${b} × ${c + 1} = ${b * (c + 1)} — это уже больше ${a}.` });
  }
  if (d === 1) { b = rnd(2, 5); c = rnd(2, 9); }
  else if (d === 2) { b = rnd(2, 9); c = rnd(2, 9); }
  else if (d === 3) { b = rnd(2, 6); c = rnd(11, 30); }
  else { b = rnd(3, 9); c = rnd(40, 150); }
  a = b * c;
  return byD(d, { text: `${a} ÷ ${b} = ?`, answer: c,
    hint: `Подумай: на какое число нужно умножить ${b}, чтобы получить ${a}?`, explain: `${b} × ${c} = ${a}, значит ${a} ÷ ${b} = ${c}` }, numOpts(c));
});

gen('arith', 'missing', 1, d => {
  const k = d <= 2 ? 20 : d === 3 ? 100 : 500;
  const t = rnd(0, d === 1 ? 2 : 3);
  let text, x, hint;
  if (t === 0) { const a = rnd(2, k >> 1); x = rnd(2, k >> 1); text = `${a} + ${BL} = ${a + x}`; hint = `Вычти: ${a + x} − ${a}.`; }
  else if (t === 1) { const a = rnd(2, k >> 1); x = rnd(a + 2, k); text = `${BL} − ${a} = ${x - a}`; hint = `Прибавь ${a} к ${x - a}.`; }
  else if (t === 2) { x = rnd(2, k >> 1); const a = rnd(x + 2, k); text = `${a} − ${BL} = ${a - x}`; hint = `Вычти ${a - x} из ${a}.`; }
  else { const a = rnd(2, 9); x = rnd(2, 9); text = `${a} × ${BL} = ${a * x}`; hint = `Раздели ${a * x} на ${a}.`; }
  return byD(d, { text, answer: x, hint, explain: `Пропущено число ${x}` }, numOpts(x));
});

gen('arith', 'word', 1, d => {
  const T = [
    () => { const a = rnd(8, 20) * (d > 2 ? rnd(2, 4) : 1), b = rnd(2, a - 3);
      return [`У девочки было ${a} конфет. Она отдала подруге ${b}. Сколько конфет осталось?`, a - b, `${a} − ${b}`]; },
    () => { const k = d <= 2 ? rnd(2, 5) : rnd(4, 9), m = d <= 2 ? rnd(2, 6) : rnd(6, 15);
      return [`В ${k} коробках лежит по ${m} карандашей. Сколько всего карандашей?`, k * m, `${k} × ${m}`]; },
    () => { const k = rnd(2, 6), m = d <= 2 ? rnd(2, 6) : rnd(5, 14);
      return [`${k * m} яблок разложили поровну на ${k} тарелок. Сколько яблок на одной тарелке?`, m, `${k * m} ÷ ${k}`]; },
    () => { const a = rnd(10, 18) * (d > 2 ? 2 : 1), b = rnd(8, 16) * (d > 2 ? 2 : 1), c = rnd(3, 9);
      return [`В классе ${a} девочек и ${b} мальчиков. ${c} ребят ушли домой. Сколько ребят осталось?`, a + b - c, `${a} + ${b} − ${c}`]; },
    () => { const p = rnd(30, 90) * (d > 2 ? 2 : 1), x = rnd(5, 25);
      return [`Книга стоит ${p} рублей, а тетрадь на ${x} рублей дешевле. Сколько стоят книга и тетрадь вместе?`, p + (p - x), `${p} + (${p} − ${x})`]; },
    () => { const v = rnd(4, 9) * 10, t = rnd(2, d > 2 ? 9 : 4);
      return [`Поезд едет со скоростью ${v} км/ч. Сколько километров он проедет за ${t} ч?`, v * t, `${v} × ${t}`]; },
    () => { const a = rnd(5, 12), x = rnd(2, 6);
      return [`Кате ${a} лет, а её брат старше на ${x}. Сколько лет им вместе?`, a + (a + x), `${a} + ${a + x}`]; },
  ];
  const [text, ans, how] = pick(T)();
  return byD(d, { text, answer: ans, hint: 'Прочитай внимательно и реши: какое действие нужно — сложение, вычитание, умножение или деление?',
    explain: `${how} = ${ans}` }, numOpts(ans));
});

/* ======================== ДРОБИ И СРАВНЕНИЕ ======================== */
function pieSVG(n, k) {
  const r = 60, cx = 70, cy = 70; let s = '<svg viewBox="0 0 140 140" width="150" height="150">';
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + i * 2 * Math.PI / n, a1 = -Math.PI / 2 + (i + 1) * 2 * Math.PI / n;
    const f = x => x.toFixed(2);
    s += `<path d="M${cx},${cy} L${f(cx + r * Math.cos(a0))},${f(cy + r * Math.sin(a0))} A${r},${r} 0 0 1 ${f(cx + r * Math.cos(a1))},${f(cy + r * Math.sin(a1))} Z" fill="${i < k ? '#ff9f1c' : '#fff'}" stroke="#2b2d42" stroke-width="3" stroke-linejoin="round"/>`;
  }
  return s + '</svg>';
}
function barSVG(n, k) {
  const w = 260, h = 56, cw = w / n; let s = `<svg viewBox="0 0 ${w + 6} ${h + 6}" width="280">`;
  for (let i = 0; i < n; i++) s += `<rect x="${3 + i * cw}" y="3" width="${cw}" height="${h}" fill="${i < k ? '#ff9f1c' : '#fff'}" stroke="#2b2d42" stroke-width="3"/>`;
  return s + '</svg>';
}
function fracOpts(k, n) {
  const seen = new Set([`${k}/${n}`]), out = [{ h: frac(k, n), v: `${k}/${n}` }];
  const c = shuffle([[n - k, n], [k, n + 1], [k + 1, n], [k, n - 1], [1, n], [k, k + n], [n, k + n]]);
  for (const [a, b] of c) {
    if (out.length >= 4) break;
    const key = `${a}/${b}`;
    if (a < 1 || b < 2 || a >= b || a * n === k * b || seen.has(key)) continue;
    seen.add(key); out.push({ h: frac(a, b), v: key });
  }
  for (let b = n + 2; out.length < 4; b++) { const key = `1/${b}`; if (!seen.has(key) && k * b !== n) { seen.add(key); out.push({ h: frac(1, b), v: key }); } }
  return shuffle(out);
}
gen('frac', 'fshade', 1, d => {
  const n = d === 1 ? pick([2, 3, 4]) : d === 2 ? pick([3, 4, 5, 6, 8]) : pick([4, 5, 6, 8, 10, 12]);
  const k = rnd(1, n - 1);
  return mkChoice({ text: 'Какая часть фигуры закрашена?', visual: (Math.random() < 0.5 || n > 8) ? barSVG(n, k) : pieSVG(n, k),
    answer: `${k}/${n}`, hint: 'Сосчитай, на сколько частей поделена фигура — это знаменатель. Сколько частей закрашено — это числитель.',
    explain: `Всего ${n} частей, закрашено ${k}. Это ${k}/${n}.` }, fracOpts(k, n));
});

gen('frac', 'fof', 1, d => {
  let a, b, m;
  if (d === 1) { b = pick([2, 3, 4]); a = 1; m = b * rnd(2, 6); }
  else if (d === 2) { b = pick([2, 3, 4, 5]); a = rnd(1, b - 1); m = b * rnd(2, 6); }
  else if (d === 3) { b = rnd(3, 8); a = rnd(1, b - 1); m = b * rnd(3, 9); }
  else { b = rnd(4, 10); a = rnd(1, b - 1); m = b * rnd(5, 12); }
  const ans = m / b * a;
  return byD(d, { text: `${frac(a, b)} от ${m} = ?`, answer: ans,
    hint: `Раздели ${m} на ${b} равных частей — в одной части ${m / b}. Возьми ${a} таких части.`,
    explain: `${m} ÷ ${b} = ${m / b}, а ${m / b} × ${a} = ${ans}` }, numOpts(ans, [m / b]));
});

gen('frac', 'fcmp', 1, d => {
  let a, b, c, e, hint;
  const mode = d <= 2 ? pick([0, 1]) : pick([0, 1, 2, 3]);
  if (mode === 0) { b = e = rnd(3, d <= 2 ? 8 : 12); do { a = rnd(1, b - 1); c = rnd(1, b - 1); } while (d <= 2 && a === c);
    hint = 'Знаменатели одинаковые — больше та дробь, у которой больше числитель.'; }
  else if (mode === 1) { a = c = rnd(1, 3); b = rnd(a + 1, 10); do { e = rnd(a + 1, 10); } while (e === b);
    hint = 'Числители одинаковые. Чем на большее число частей разрезан торт, тем меньше каждый кусочек!'; }
  else if (mode === 2) { b = rnd(3, 12); a = rnd(1, b - 1); c = 1; e = 2; hint = 'Сравни каждую дробь с половинкой (1/2).'; }
  else { const n = rnd(1, 4), m = rnd(n + 1, 6), k = rnd(2, 4); a = n; b = m; c = n * k + pick([-1, 0, 0, 1]); e = m * k;
    if (c < 1 || c >= e) c = n * k; hint = 'Приведи дроби к одинаковому знаменателю.'; }
  if (Math.random() < 0.5) { [a, c] = [c, a]; [b, e] = [e, b]; }
  const s = Math.sign(a * e - c * b), ans = s < 0 ? '<' : s > 0 ? '>' : '=';
  return mkChoice({ text: `Сравни: ${frac(a, b)} ${BL} ${frac(c, e)}`, answer: ans, hint, explain: `${a}/${b} ${ans} ${c}/${e}`, wide: true },
    ['<', '=', '>'].map(x => ({ h: x, v: x })));
});

function exprOf(v, d) {
  const o = [];
  if (v >= 6) { const a = rnd(2, v - 2); o.push(`${a} + ${v - a}`); }
  if (v <= 60) { const a = rnd(v + 2, v + 25); o.push(`${a} − ${a - v}`); }
  if (d >= 2) {
    const fs = []; for (let a = 2; a <= 12; a++) if (v % a === 0 && v / a >= 2 && v / a <= 12) fs.push([a, v / a]);
    if (fs.length) { const [a, b] = pick(fs); o.push(`${a} × ${b}`, `${a} × ${b}`); }
  }
  return o.length ? pick(o) : String(v);
}
gen('frac', 'ncmp', 1, d => {
  const v1 = d === 1 ? rnd(10, 40) : rnd(12, 100), delta = pick([-4, -3, -2, -1, 0, 0, 1, 2, 3, 4]), v2 = v1 + delta;
  const e1 = exprOf(v1, d), e2 = d === 1 ? String(v2) : exprOf(v2, d);
  const s = Math.sign(v1 - v2), ans = s < 0 ? '<' : s > 0 ? '>' : '=';
  return mkChoice({ text: `Сравни: ${e1} ${BL} ${e2}`, answer: ans, hint: 'Сначала вычисли значения обоих выражений, потом сравнивай.',
    explain: `${e1} = ${v1}, а ${e2} = ${v2}. ${v1} ${ans} ${v2}`, wide: true }, ['<', '=', '>'].map(x => ({ h: x, v: x })));
});

gen('frac', 'ops', 2, d => {
  let s, v, wrong, hint;
  if (d <= 2) { const a = rnd(2, 20), b = rnd(2, 9), c = rnd(2, 9); s = `${a} + ${b} × ${c}`; v = a + b * c; wrong = (a + b) * c; hint = 'Умножение выполняется раньше сложения!'; }
  else if (d === 3) { const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9); s = `(${a} + ${b}) × ${c}`; v = (a + b) * c; wrong = a + b * c; hint = 'Сначала считай то, что в скобках.'; }
  else if (d === 4) { const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9), e = rnd(2, 9); s = `${a} × ${b} + ${c} × ${e}`; v = a * b + c * e; wrong = (a * b + c) * e; hint = 'Сначала оба умножения, потом сложение.'; }
  else { const a = rnd(10, 30), b = rnd(2, 9), c = rnd(2, 6), f = rnd(2, 6), g = rnd(2, 9), e = f * g; s = `(${a} − ${b}) × ${c} + ${e} ÷ ${f}`; v = (a - b) * c + g; wrong = (a - b) * c + e; hint = 'Скобки → умножение и деление → сложение.'; }
  const q = { text: `${s} = ?`, answer: v, hint, explain: `${s} = ${v}` };
  return d <= 3 ? mkChoice(q, numOpts(v, [wrong])) : mkNum(q);
});

gen('frac', 'equiv', 2, d => {
  const m = rnd(2, 6), n = rnd(1, m - 1), k = rnd(2, d <= 3 ? 4 : 6);
  if (d <= 3 || Math.random() < 0.5)
    return byD(d, { text: `${frac(n, m)} = ${frac(BL, m * k)}`, answer: n * k, hint: `Знаменатель умножили на ${k}. Умножь на ${k} и числитель.`, explain: `${n} × ${k} = ${n * k}` }, numOpts(n * k));
  return mkNum({ text: `${frac(n * k, m * k)} = ${frac(BL, m)}`, answer: n, hint: `Раздели числитель и знаменатель на одно и то же число (${k}).`, explain: `${n * k} ÷ ${k} = ${n}` });
});

/* ======================== ЛОГИКА ======================== */
const SEQS = [
  { d: 1, f: () => { const s = pick([2, 3, 4, 5, 10]), a = rnd(1, 15); return { t: [0, 1, 2, 3, 4, 5].map(i => a + s * i), h: `Каждое число больше предыдущего на ${s}.` }; } },
  { d: 2, f: () => { const s = rnd(2, 7), a = rnd(35, 60); return { t: [0, 1, 2, 3, 4, 5].map(i => a - s * i), h: `Числа уменьшаются на ${s}.` }; } },
  { d: 2, f: () => { const a = rnd(1, 4); return { t: [0, 1, 2, 3, 4, 5].map(i => a * 2 ** i), h: 'Каждое число вдвое больше предыдущего.' }; } },
  { d: 3, f: () => { const x = rnd(1, 3); let y; do { y = rnd(2, 5); } while (y === x); const t = [rnd(1, 10)]; for (let i = 1; i < 6; i++) t.push(t[i - 1] + (i % 2 ? x : y)); return { t, h: `Прибавляют по очереди ${x} и ${y}.` }; } },
  { d: 3, f: () => { const o = rnd(0, 3); return { t: [1, 2, 3, 4, 5, 6].map(i => (i + o) ** 2), h: 'Это квадраты чисел: 1×1, 2×2, 3×3…' }; } },
  { d: 3, f: () => { const a = rnd(1, 4); return { t: [0, 1, 2, 3, 4, 5].map(i => a * 3 ** i), h: 'Каждое число втрое больше предыдущего.' }; } },
  { d: 4, f: () => { const t = [rnd(1, 5), rnd(2, 6)]; for (let i = 2; i < 6; i++) t.push(t[i - 1] + t[i - 2]); return { t, h: 'Каждое число — сумма двух предыдущих.' }; } },
  { d: 4, f: () => { const t = [rnd(1, 10)]; for (let i = 1; i < 6; i++) t.push(t[i - 1] + i); return { t, h: 'Прибавляют 1, потом 2, потом 3, потом 4…' }; } },
  { d: 5, f: () => { const a = rnd(1, 9), s = rnd(2, 5), c = rnd(20, 40), u = rnd(2, 6); return { t: [a, c, a + s, c + u, a + 2 * s, c + 2 * u], h: 'Здесь два ряда вперемешку: числа на нечётных и на чётных местах.' }; } },
  { d: 5, f: () => { const t = [rnd(1, 3)]; for (let i = 1; i < 6; i++) t.push(t[i - 1] * 2 + 1); return { t, h: 'Умножь число на 2 и прибавь 1.' }; } },
];
gen('logic', 'seq', 1, d => {
  const s = pick(SEQS.filter(x => x.d <= d && x.d >= Math.max(1, d - 1))), { t, h } = s.f();
  const hide = (d >= 2 && Math.random() < 0.3) ? 4 : 5;
  const vis = t.map((x, i) => `<span class="chip${i === hide ? ' q' : ''}">${i === hide ? '?' : x}</span>`).join('');
  return byD(d, { text: 'Какое число пропущено?', visual: vis, answer: t[hide], hint: h, explain: `Пропущено число ${t[hide]}.` }, numOpts(t[hide]));
});

gen('logic', 'machine', 2, d => {
  const k = d <= 2 ? 1 : rnd(2, 3), c = d <= 2 ? rnd(2, 9) : rnd(0, 4), f = x => k * x + c;
  const xs = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4), ex = xs.slice(0, 3), x = xs[3];
  const vis = ex.map(e => `<span class="chip">${e} → ${f(e)}</span>`).join('');
  return byD(d, { text: `Волшебная машина меняет числа по одному правилу. Какое число получится из ${x}?`, visual: vis, answer: f(x),
    hint: k === 1 ? `К числу прибавляют ${c}.` : `Число умножают на ${k}${c ? ` и прибавляют ${c}` : ''}.`, explain: `Правило: ${k === 1 ? '' : `×${k} `}${c ? `+${c}` : ''}. ${x} → ${f(x)}` }, numOpts(f(x)));
});

const CATS = [
  ['животные', ['🐶', '🐱', '🐰', '🐻', '🦁', '🐸', '🐵', '🐷']],
  ['фрукты', ['🍎', '🍌', '🍇', '🍓', '🍒', '🍉', '🍊', '🍍']],
  ['транспорт', ['🚗', '🚌', '🚲', '✈️', '🚂', '🚢', '🚀', '🚁']],
  ['сладости', ['🍩', '🍪', '🍦', '🍫', '🍬', '🧁', '🍭']],
  ['овощи', ['🥕', '🌽', '🥦', '🍆', '🥒', '🥔']],
  ['одежда', ['👕', '👖', '🧦', '🧤', '🧢', '👗']],
];
gen('logic', 'odd', 1, d => {
  if (d >= 2 && Math.random() < 0.5) {
    const k = d === 2 ? 2 : d === 3 ? pick([3, 5]) : pick([4, 6, 7, 8]);
    const mult = []; while (mult.length < 3) { const m = k * rnd(Math.ceil(10 / k), Math.floor(99 / k)); if (!mult.includes(m)) mult.push(m); }
    let odd, text, explain; const flip = d === 2 && Math.random() < 0.5;
    if (d === 2) {
      const grp = flip ? mult.map(m => m + 1) : mult;   // чётные или нечётные
      do { odd = flip ? rnd(5, 49) * 2 : rnd(5, 49) * 2 + 1; } while (grp.includes(odd));
      mult.splice(0, 3, ...grp);
      explain = flip ? 'Остальные числа нечётные, а ' + odd + ' — чётное.' : `Остальные числа чётные, а ${odd} — нечётное.`;
    } else {
      do { odd = pick(mult) + pick([-2, -1, 1, 2]); } while (odd % k === 0 || odd < 10);
      explain = `Остальные числа делятся на ${k}, а ${odd} — нет.`;
    }
    const items = shuffle([...mult, odd]);
    text = d === 2 ? 'Какое число лишнее?' : `Какое число лишнее? (Подсказка: ищи, что общего у трёх чисел)`;
    return mkChoice({ text, key: 'n' + items.join(), answer: odd, hint: d === 2 ? 'Посмотри на последнюю цифру: чётные числа оканчиваются на 0, 2, 4, 6, 8.' : `Проверь, какие числа делятся на ${k}.`,
      explain, big: false }, items.map(x => ({ h: String(x), v: x })));
  }
  const [ca, cb] = shuffle(CATS).slice(0, 2), items = shuffle(ca[1]).slice(0, 3), odd = shuffle(cb[1])[0];
  return mkChoice({ text: 'Какой предмет лишний?', key: 'e' + [...items, odd].sort().join(), answer: odd, big: true, hint: 'Подумай, что общего у трёх предметов из четырёх.',
    explain: `Остальные — ${ca[0]}.` }, shuffle([...items, odd]).map(x => ({ h: x, v: x })));
});

const DOTS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⭐', '❤️'];
gen('logic', 'pattern', 1, d => {
  const L = d <= 1 ? 2 : d === 2 ? pick([2, 3]) : pick([3, 4]), pal = shuffle(DOTS).slice(0, Math.min(L, d <= 1 ? 2 : 3));
  let unit; do { unit = Array.from({ length: L }, (_, i) => (i < pal.length ? pal[i] : pick(pal))); unit = shuffle(unit); } while (new Set(unit).size < 2);
  const r = rnd(1, L - 1), seq = []; for (let i = 0; i < L * 2 + r; i++) seq.push(unit[i % L]);
  const ans = unit[r % L];
  const ch = new Set(unit); for (const x of shuffle(DOTS)) { if (ch.size >= 4) break; ch.add(x); }
  const vis = seq.map(x => `<span class="chip">${x}</span>`).join('') + '<span class="chip q">?</span>';
  return mkChoice({ text: 'Что должно стоять следующим?', visual: vis, answer: ans, big: true, hint: 'Найди, какая группа повторяется снова и снова.',
    explain: `Повторяется группа ${unit.join(' ')}.` }, shuffle([...ch]).map(x => ({ h: x, v: x })));
});

const ANALOGY = [
  ['Птица', 'летать', 'Рыба', 'плавать', ['бегать', 'ползать', 'петь']],
  ['Рука', 'перчатка', 'Нога', 'ботинок', ['шапка', 'шарф', 'очки']],
  ['Глаза', 'видеть', 'Уши', 'слышать', ['дышать', 'говорить', 'нюхать']],
  ['День', 'ночь', 'Лето', 'зима', ['весна', 'тепло', 'солнце']],
  ['Кошка', 'котёнок', 'Собака', 'щенок', ['пёс', 'лай', 'кость']],
  ['Врач', 'больница', 'Учитель', 'школа', ['книга', 'урок', 'доска']],
  ['Карандаш', 'рисовать', 'Ножницы', 'резать', ['клеить', 'писать', 'шить']],
  ['Книга', 'читать', 'Музыка', 'слушать', ['смотреть', 'писать', 'рисовать']],
  ['Шапка', 'голова', 'Сапог', 'нога', ['рука', 'шея', 'ухо']],
  ['Холодный', 'горячий', 'Большой', 'маленький', ['огромный', 'высокий', 'толстый']],
  ['Лодка', 'вода', 'Самолёт', 'воздух', ['аэродром', 'крыло', 'земля']],
  ['Часы', 'время', 'Градусник', 'температура', ['тепло', 'болезнь', 'стекло']],
  ['Корова', 'молоко', 'Курица', 'яйцо', ['перо', 'цыплёнок', 'курятник']],
  ['Повар', 'кухня', 'Художник', 'мастерская', ['краски', 'картина', 'холст']],
  ['Мороз', 'зима', 'Жара', 'лето', ['солнце', 'пляж', 'осень']],
  ['Рыба', 'аквариум', 'Птица', 'клетка', ['гнездо', 'небо', 'перья']],
  ['Яблоко', 'фрукт', 'Морковь', 'овощ', ['сладкая', 'огород', 'оранжевая']],
  ['Утро', 'завтрак', 'Вечер', 'ужин', ['ночь', 'обед', 'сон']],
  ['Минута', '60 секунд', 'Час', '60 минут', ['24 часа', '100 минут', '30 минут']],
  ['Зубы', 'зубная щётка', 'Волосы', 'расчёска', ['шампунь', 'голова', 'ножницы']],
  ['Нога', 'ходить', 'Рука', 'хватать', ['бежать', 'прыгать', 'слушать']],
];
gen('logic', 'analogy', 2, d => {
  const [a, b, c, ans, bad] = pick(ANALOGY);
  return mkChoice({ text: `${a} : ${b} = ${c} : ${BL}`, answer: ans, hint: `Подумай, как связаны «${a}» и «${b}». Так же должны быть связаны «${c}» и ответ.`,
    explain: `${a} → ${b}, так же ${c} → ${ans}.` }, txtOpts(ans, bad));
});

const RIDDLES = [
  { d: 1, t: 'Что нельзя съесть на завтрак?', a: 'Обед и ужин', bad: ['Кашу', 'Яичницу', 'Бутерброд'], e: 'Обед и ужин — это другие приёмы пищи!' },
  { d: 1, t: 'Что тяжелее: килограмм ваты или килограмм железа?', a: 'Одинаково', bad: ['Вата', 'Железо', 'Невозможно узнать'], e: 'И там и там по одному килограмму.' },
  { d: 1, t: 'Сколько яиц можно съесть натощак?', a: 'Одно', bad: ['Два', 'Три', 'Ни одного'], e: 'После первого яйца ты уже не натощак.' },
  { d: 1, t: 'У каждой из двух сестёр есть один брат. Сколько всего детей в семье?', a: 3, e: 'Брат у них общий: 2 сестры + 1 брат = 3.' },
  { d: 1, t: 'У палки 2 конца. Сколько концов у трёх палок?', a: 6, e: '3 × 2 = 6.' },
  { d: 2, t: 'Если позавчера была суббота, то какой день недели будет завтра?', a: 'Вторник', bad: ['Понедельник', 'Среда', 'Воскресенье'], e: 'Позавчера — суббота, вчера — воскресенье, сегодня — понедельник, завтра — вторник.' },
  { d: 2, t: 'Сколько месяцев в году имеют 28 дней?', a: 'Все 12', bad: ['Только февраль', 'Ни одного', 'Два'], e: 'В каждом месяце есть 28 дней (и ещё, возможно, несколько).' },
  { d: 2, t: 'У Пети 3 брата и 1 сестра. Сколько всего детей в семье?', a: 5, e: 'Сам Петя + 3 брата + 1 сестра = 5.' },
  { d: 2, t: 'Сколько раз нужно разрезать верёвку, чтобы получилось 5 кусков?', a: 4, e: 'Один разрез — 2 куска, два разреза — 3 куска… четыре разреза — 5 кусков.' },
  { d: 3, t: 'Три кошки ловят трёх мышей за 3 минуты. За сколько минут 100 кошек поймают 100 мышей?', a: 3, e: 'Каждая кошка ловит свою мышь за 3 минуты.' },
  { d: 3, t: 'Маша стоит в ряду третьей с начала и третьей с конца. Сколько детей в ряду?', a: 5, e: 'Перед ней 2 ребёнка, после неё 2 и сама Маша: 2 + 1 + 2 = 5.' },
  { d: 3, t: 'У прямоугольного стола 4 угла. Один угол отпилили. Сколько углов стало у стола?', a: 5, e: 'Отпиленный угол заменяется двумя новыми, поэтому 4 − 1 + 2 = 5.' },
  { d: 4, t: 'Улитка ползёт вверх по столбу высотой 5 м. Днём поднимается на 2 м, а ночью сползает на 1 м. За сколько суток она доберётся до вершины?', a: 4, e: 'К утру 4-го дня она уже на высоте 3 м, и днём поднимется на 5 м.' },
  { d: 4, t: 'У меня две монеты на сумму 15 рублей. Одна из них — не 5-рублёвая. Какие это монеты?', a: '10 и 5', bad: ['5 и 5', '10 и 2', '10 и 10'], e: 'Не 5-рублёвая только одна — 10-рублёвая. Вторая как раз пятёрка!' },
  { d: 4, t: 'Лене вдвое больше лет, чем Маше. Маше 6. Сколько лет будет Лене, когда Маше исполнится 12?', a: 18, e: 'Лене сейчас 12, и пройдёт 6 лет: 12 + 6 = 18.' },
  { d: 1, t: 'Сколько ушей у трёх мышей?', a: 6, e: '3 × 2 = 6.' },
  { d: 1, t: 'Что можно увидеть с закрытыми глазами?', a: 'Сон', bad: ['Книгу', 'Радугу', 'Луну'], e: 'Сны мы видим как раз с закрытыми глазами.' },
  { d: 2, t: 'Петя родился в 2015 году, а Вася — в 2013. Кто из них старше?', a: 'Вася', bad: ['Петя', 'Они близнецы', 'Нельзя узнать'], e: 'Вася родился раньше, значит он старше.' },
  { d: 2, t: 'Если 3 карандаша стоят 12 рублей, сколько стоят 5 таких карандашей?', a: 20, e: 'Один карандаш — 4 рубля, а 5 × 4 = 20.' },
  { d: 2, t: 'Сколько цифр в числе 1000?', a: 4, e: '1, 0, 0, 0 — четыре цифры.' },
  { d: 3, t: 'На столе горели 5 свечей. Две свечи погасили. Сколько свечей останется?', a: 2, e: 'Остальные догорят, а погашенные останутся.' },
  { d: 3, t: 'Врач дал 3 таблетки и велел принимать каждые полчаса. На сколько хватит таблеток?', a: '1 час', bad: ['1,5 часа', '2 часа', '30 минут'], e: 'Первая сразу, вторая через 30 минут, третья через час.' },
  { d: 3, t: 'Двое играли в шахматы 4 часа. Сколько часов играл каждый из них?', a: 4, e: 'Они играли одновременно, значит каждый — 4 часа.' },
  { d: 3, t: 'Одно яйцо варится 5 минут. Сколько минут нужно, чтобы сварить 2 яйца в одной кастрюле?', a: 5, e: 'Оба яйца варятся одновременно.' },
  { d: 3, t: 'Чему равна сумма всех цифр 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9?', a: 45, e: 'Складывай парами: 1+9, 2+8, 3+7, 4+6 — это четыре десятка и ещё 5.' },
  { d: 4, t: 'Сколько получится, если 10 разделить пополам, то есть на 1/2?', a: 20, e: 'В десятке помещается 20 половинок.' },
  { d: 4, t: 'Два отца и два сына съели 3 яйца, каждому по одному. Как так?', a: 'Это были дед, отец и сын', bad: ['Это были братья', 'Они поделили яйца', 'Так не бывает'], e: 'Отец и сын — это 2 отца и 2 сына сразу, если их трое: дед, отец и сын.' },
];
gen('logic', 'riddle', 1, d => {
  const r = pick(RIDDLES.filter(x => x.d <= d && x.d >= Math.max(1, d - 2)));
  const q = { text: r.t, hint: 'Не спеши. Подумай, нет ли тут хитрости.', explain: r.e, answer: r.a };
  return typeof r.a === 'number' ? mkChoice(q, numOpts(r.a)) : mkChoice(q, txtOpts(r.a, r.bad));
});

const NAMES = ['Аня', 'Боря', 'Вика', 'Гоша', 'Даша', 'Егор', 'Лиза', 'Миша', 'Соня', 'Тимур', 'Катя', 'Рома'];
const CMP = [['выше', 'ниже'], ['старше', 'младше'], ['быстрее', 'медленнее'], ['сильнее', 'слабее'], ['тяжелее', 'легче']];
gen('logic', 'order', 1, d => {
  const n = d <= 2 ? 3 : 4, cmp = pick(CMP), names = shuffle(NAMES).slice(0, n), st = [];
  for (let i = 0; i < n - 1; i++) st.push(Math.random() < 0.5 ? `${names[i]} ${cmp[0]}, чем ${names[i + 1]}` : `${names[i + 1]} ${cmp[1]}, чем ${names[i]}`);
  const kind = d <= 2 ? pick(['top', 'bot']) : pick(['top', 'bot', 'cnt']);
  const lead = shuffle(st).join('. ') + '. ';
  const ex = `Порядок: ${names.join(' → ')} (слева самый «${cmp[0]}»).`;
  if (kind === 'cnt') {
    const i = rnd(1, n - 1);
    return mkChoice({ text: `${lead}Сколько ребят ${cmp[0]}, чем ${names[i]}?`, answer: i, hint: 'Расставь ребят по порядку на листочке.', explain: ex },
      shuffle(Array.from({ length: n }, (_, k) => k)).map(x => ({ h: String(x), v: x })));
  }
  const ans = kind === 'top' ? names[0] : names[n - 1];
  return mkChoice({ text: `${lead}Кто ${kind === 'top' ? cmp[0] : cmp[1]} всех?`, answer: ans, hint: 'Расставь ребят по порядку на листочке.', explain: ex },
    shuffle(names).map(x => ({ h: x, v: x })));
});

const LEG = [['🐰', 4], ['🐦', 2], ['🐄', 4], ['🐔', 2], ['🕷️', 8], ['🐝', 6]];
gen('logic', 'legs', 2, d => {
  const kinds = shuffle(LEG).slice(0, d <= 2 ? 2 : 3), cnt = kinds.map(() => rnd(1, d <= 2 ? 4 : 5));
  const vis = kinds.map((k, i) => `<div class="eq">${k[0].repeat(cnt[i])}</div>`).join('');
  const ans = kinds.reduce((s, k, i) => s + k[1] * cnt[i], 0);
  return byD(d, { text: 'Сколько всего ног у этих зверей?', visual: `<div style="width:100%">${vis}</div>`, answer: ans,
    hint: kinds.map(k => `${k[0]} — ${k[1]} ног`).join(', ') + '.', explain: kinds.map((k, i) => `${cnt[i]}×${k[1]}`).join(' + ') + ` = ${ans}` }, numOpts(ans));
});

/* ======================== ГЕОМЕТРИЯ И ГОЛОВОЛОМКИ ======================== */
function rectSVG(a, b, la, lb) {
  const m = Math.max(a, b), sc = 190 / m, w = Math.max(60, a * sc), h = Math.max(50, Math.min(130, b * sc));
  const W = w + 80, H = h + 50;
  return `<svg viewBox="0 0 ${W} ${H}" width="${Math.min(W * 1.3, 300)}"><rect x="10" y="30" width="${w}" height="${h}" rx="4" fill="#ffe9a8" stroke="#2b2d42" stroke-width="3"/>` +
    `<text x="${10 + w / 2}" y="20" text-anchor="middle" font-size="17" font-weight="800" fill="#2b2d42">${la}</text>` +
    `<text x="${w + 18}" y="${30 + h / 2 + 6}" font-size="17" font-weight="800" fill="#2b2d42">${lb}</text></svg>`;
}
function gridSVG(a, b) {
  const c = 30, W = a * c + 6, H = b * c + 6; let s = `<svg viewBox="0 0 ${W} ${H}" width="${Math.min(W, 300)}">`;
  for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) s += `<rect x="${3 + i * c}" y="${3 + j * c}" width="${c}" height="${c}" fill="#ffe9a8" stroke="#2b2d42" stroke-width="2"/>`;
  return s + '</svg>';
}
gen('geom', 'perim', 1, d => {
  const R = d === 1 ? [2, 8] : [5, 25];
  if (d >= 4 || (d === 3 && Math.random() < 0.4)) {
    if (d === 5 && Math.random() < 0.5) { const a = rnd(3, 15); return mkNum({ text: `Периметр квадрата ${4 * a} см. Чему равна его сторона (в см)?`, answer: a, hint: 'У квадрата 4 одинаковые стороны.', explain: `${4 * a} ÷ 4 = ${a}` }); }
    if (d >= 4) { const a = rnd(4, 20), b = rnd(3, 20), P = 2 * (a + b);
      return mkNum({ text: `Периметр прямоугольника ${P} см, а одна сторона — ${a} см. Найди другую сторону (в см).`, visual: rectSVG(a, b, `${a} см`, '?'), answer: b,
        hint: `Половина периметра — это сумма двух соседних сторон: ${P / 2}.`, explain: `${P} ÷ 2 − ${a} = ${b}` }); }
    const a = rnd(3, 15); return mkNum({ text: `Сторона квадрата ${a} см. Чему равен периметр (в см)?`, answer: 4 * a, hint: 'У квадрата 4 одинаковые стороны.', explain: `${a} × 4 = ${4 * a}` });
  }
  const a = rnd(R[0], R[1]), b = rnd(R[0], R[1]), P = 2 * (a + b);
  return byD(d, { text: 'Чему равен периметр прямоугольника (в см)?', visual: rectSVG(a, b, `${a} см`, `${b} см`), answer: P,
    hint: `Периметр — это сумма длин всех четырёх сторон: ${a} + ${b} + ${a} + ${b}.`, explain: `2 × (${a} + ${b}) = ${P}` }, numOpts(P, [a + b, a * b]));
});

gen('geom', 'area', 2, d => {
  if (d <= 2) { const a = rnd(2, 6), b = rnd(2, 5); return mkChoice({ text: 'Сколько клеточек в этом прямоугольнике?', visual: gridSVG(a, b), answer: a * b,
    hint: 'Умножь число клеточек в длину на число клеточек в ширину.', explain: `${a} × ${b} = ${a * b}` }, numOpts(a * b, [2 * (a + b)])); }
  if (d === 3) { const a = rnd(3, 12), b = rnd(2, 9); return mkNum({ text: 'Чему равна площадь прямоугольника (в см²)?', visual: rectSVG(a, b, `${a} см`, `${b} см`), answer: a * b,
    hint: 'Площадь = длина × ширина.', explain: `${a} × ${b} = ${a * b}` }); }
  if (d === 4) { const a = rnd(3, 12), b = rnd(3, 12); return mkNum({ text: `Площадь прямоугольника ${a * b} см², одна сторона — ${a} см. Найди другую сторону (в см).`, answer: b,
    hint: 'Раздели площадь на известную сторону.', explain: `${a * b} ÷ ${a} = ${b}` }); }
  const a = 2 * rnd(2, 6), b = 2 * rnd(2, 5);
  return mkNum({ text: `Пол комнаты ${a} м × ${b} м хотят покрыть квадратными плитками 2 м × 2 м. Сколько плиток нужно?`, answer: (a / 2) * (b / 2),
    hint: `Сколько плиток поместится вдоль каждой стены? ${a} ÷ 2 и ${b} ÷ 2.`, explain: `(${a} ÷ 2) × (${b} ÷ 2) = ${(a / 2) * (b / 2)}` });
});

const SHAPES = [
  { d: 1, t: 'Сколько сторон у треугольника?', a: 3 }, { d: 1, t: 'Сколько углов у четырёхугольника?', a: 4 },
  { d: 1, t: 'Сколько прямых углов у прямоугольника?', a: 4 }, { d: 1, t: 'Сколько сторон у пятиугольника?', a: 5 },
  { d: 2, t: 'Сколько сторон у шестиугольника?', a: 6 }, { d: 2, t: 'Сколько граней у куба?', a: 6 },
  { d: 2, t: 'Сколько осей симметрии у квадрата?', a: 4 }, { d: 3, t: 'Сколько вершин у куба?', a: 8 },
  { d: 3, t: 'Сколько сторон у восьмиугольника?', a: 8 }, { d: 3, t: 'Сколько осей симметрии у равностороннего треугольника?', a: 3 },
  { d: 3, t: 'Сколько осей симметрии у прямоугольника (не квадрата)?', a: 2 }, { d: 4, t: 'Сколько рёбер у куба?', a: 12 },
  { d: 4, t: 'Сколько вершин у четырёхугольной пирамиды?', a: 5 },
  { d: 1, t: 'Сколько сторон у квадрата?', a: 4 }, { d: 1, t: 'Сколько углов у треугольника?', a: 3 },
  { d: 1, t: 'Сколько углов у круга?', a: 0 }, { d: 2, t: 'Сколько сторон у семиугольника?', a: 7 },
  { d: 2, t: 'Что получится, если разрезать квадрат по диагонали?', a: 'Два треугольника', bad: ['Два квадрата', 'Два круга', 'Пятиугольник'] },
  { d: 4, t: 'Сколько рёбер у треугольной пирамиды?', a: 6 }, { d: 4, t: 'Сколько граней у четырёхугольной пирамиды?', a: 5 },
  { d: 4, t: 'Сколько вершин у треугольной призмы?', a: 6 },
  { d: 4, t: 'Сколько осей симметрии у круга?', a: 'Бесконечно много', bad: ['Одна', 'Две', 'Четыре'] },
  { d: 2, t: 'У какой фигуры все стороны равны и все углы прямые?', a: 'Квадрат', bad: ['Ромб', 'Прямоугольник', 'Трапеция'] },
  { d: 3, t: 'У какой фигуры нет ни одного угла?', a: 'Круг', bad: ['Квадрат', 'Треугольник', 'Ромб'] },
];
gen('geom', 'shapes', 1, d => {
  const s = pick(SHAPES.filter(x => x.d <= d && x.d >= Math.max(1, d - 2)));
  const q = { text: s.t, answer: s.a, hint: 'Представь фигуру или нарисуй её на листочке.', explain: `Правильный ответ: ${s.a}.` };
  return typeof s.a === 'number' ? mkChoice(q, numOpts(s.a)) : mkChoice(q, txtOpts(s.a, s.bad));
});

gen('geom', 'balance', 2, d => {
  const [E1, E2, E3] = shuffle(['🍎', '🍌', '🍓', '🍇', '🍒', '🍊']).slice(0, 3);
  const A = rnd(2, 9), B = rnd(2, 9), C = rnd(2, 9); let lines, ask, ans;
  if (d === 2) { lines = [`${E1} + ${E1} = ${2 * A}`, `${E1} + ${E2} = ${A + B}`]; ask = E2; ans = B; }
  else if (d === 3) { lines = [`${E1} + ${E1} = ${2 * A}`, `${E1} + ${E2} = ${A + B}`]; ask = `${E2} + ${E2} + ${E1}`; ans = 2 * B + A; }
  else if (d === 4) { lines = [`${E1} + ${E1} + ${E1} = ${3 * A}`, `${E1} + ${E2} = ${A + B}`, `${E2} + ${E3} = ${B + C}`]; ask = `${E3} + ${E3} + ${E1}`; ans = 2 * C + A; }
  else { lines = [`${E1} + ${E1} = ${2 * A}`, `${E1} × ${E2} = ${A * B}`, `${E2} + ${E3} = ${B + C}`]; ask = `${E3} × ${E1}`; ans = C * A; }
  const vis = `<div style="width:100%">${lines.map(l => `<div class="eq">${l}</div>`).join('')}<div class="eq">${ask} = ${BL}</div></div>`;
  return byD(d, { text: 'Каждый фрукт — это своё число. Найди значение:', visual: vis, answer: ans,
    hint: 'Начни со строки, где только один вид фрукта. Потом подставляй найденное число в следующие строки.', explain: `Ответ: ${ans}` }, numOpts(ans));
});

function sudokuGrid() {
  const perm = shuffle([1, 2, 3, 4]);
  let g = [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]].map(r => r.map(x => perm[x - 1]));
  if (Math.random() < 0.5) [g[0], g[1]] = [g[1], g[0]];
  if (Math.random() < 0.5) [g[2], g[3]] = [g[3], g[2]];
  if (Math.random() < 0.5) g = [g[2], g[3], g[0], g[1]];
  if (Math.random() < 0.5) g = g[0].map((_, c) => g.map(r => r[c]));
  return g;
}
gen('geom', 'sudoku', 1, d => {
  const g = sudokuGrid(), nb = [0, 0, 3, 5, 7, 9][d];
  let tr, tc, hidden;
  for (let tries = 0; tries < 80; tries++) {
    tr = rnd(0, 3); tc = rnd(0, 3);
    const cells = shuffle([...Array(16).keys()].filter(i => i !== tr * 4 + tc)).slice(0, nb - (tries > 40 ? 3 : 0));
    hidden = new Set(cells); hidden.add(tr * 4 + tc);
    const used = new Set();
    for (let i = 0; i < 4; i++) { const r = tr * 4 + i, c = i * 4 + tc; if (!hidden.has(r)) used.add(g[tr][i]); if (!hidden.has(c)) used.add(g[i][tc]); }
    const br = tr >> 1 << 1, bc = tc >> 1 << 1;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) if (!hidden.has((br + i) * 4 + bc + j)) used.add(g[br + i][bc + j]);
    if (4 - used.size === 1) break;
    if (tries === 79) { hidden = new Set([tr * 4 + tc]); }
  }
  let cells = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const i = r * 4 + c, t = i === tr * 4 + tc, cls = (t ? 't ' : '') + (c === 1 ? 'br ' : '') + (r === 1 ? 'bb' : '');
    cells += `<div class="${cls}">${t ? '?' : hidden.has(i) ? '' : g[r][c]}</div>`;
  }
  return mkChoice({ text: 'Судоку: цифры 1–4 не повторяются в строке, столбце и квадрате 2×2. Какая цифра на месте «?»', visual: `<div class="sg">${cells}</div>`,
    answer: g[tr][tc], hint: 'Посмотри, какие цифры уже есть в этой строке, столбце и квадрате 2×2.', explain: `На месте «?» должна быть цифра ${g[tr][tc]}.` },
    [1, 2, 3, 4].map(x => ({ h: String(x), v: x })));
});

gen('geom', 'magic', 3, d => {
  let m = [[2, 7, 6], [9, 5, 1], [4, 3, 8]];
  const rot = a => a[0].map((_, c) => a.map(r => r[c]).reverse());
  for (let i = rnd(0, 3); i > 0; i--) m = rot(m);
  if (Math.random() < 0.5) m = m.map(r => r.slice().reverse());
  const k = d <= 3 ? 1 : d === 4 ? pick([2, 3]) : pick([2, 3, 4]), c = d === 5 ? rnd(1, 6) : 0;
  m = m.map(r => r.map(x => x * k + c));
  const tr = rnd(0, 2), tc = rnd(0, 2), cells = m.map((r, i) => r.map((x, j) => `<div class="${i === tr && j === tc ? 't' : ''}">${i === tr && j === tc ? '?' : x}</div>`).join('')).join('');
  return mkNum({ text: 'Магический квадрат: суммы в каждой строке, столбце и диагонали одинаковы. Найди «?»', visual: `<div class="mg">${cells}</div>`,
    answer: m[tr][tc], hint: 'Найди строку без «?» и сложи её числа — это нужная сумма. Потом вычти остальные числа.', explain: `Сумма в каждой линии ${3 * (5 * k + c)}.` });
});

/* ======================== ЕДИНИЦЫ И ВРЕМЯ ======================== */
gen('arith', 'units', 2, d => {
  const T = [];
  if (d <= 2) {
    const a = rnd(2, 9); T.push([`Сколько сантиметров в ${a} м?`, a * 100, '1 м = 100 см'], [`${a} кг = ${BL} г`, a * 1000, '1 кг = 1000 г'],
      [`Сколько минут в ${a} ч?`, a * 60, '1 ч = 60 минут'], [`${a} км = ${BL} м`, a * 1000, '1 км = 1000 м']);
  } else if (d === 3) {
    const a = rnd(1, 9), b = rnd(1, 9) * 10, c = rnd(1, 9), e = rnd(1, 9) * 100, f = rnd(1, 5), h = rnd(1, 11) * 5;
    T.push([`${a} м ${b} см = ${BL} см`, a * 100 + b, '1 м = 100 см'], [`${c} кг ${e} г = ${BL} г`, c * 1000 + e, '1 кг = 1000 г'],
      [`${f} ч ${h} мин = ${BL} мин`, f * 60 + h, '1 ч = 60 минут']);
  } else {
    const a = rnd(2, 9), b = rnd(10, 59), c = rnd(2, 9), e = rnd(11, 99);
    T.push([`${a} мин ${b} с = ${BL} с`, a * 60 + b, '1 минута = 60 секунд'], [`${c} км ${e} м = ${BL} м`, c * 1000 + e, '1 км = 1000 м'],
      [`${a} кг ${e * 5 % 1000} г = ${BL} г`, a * 1000 + e * 5 % 1000, '1 кг = 1000 г']);
  }
  const [text, ans, how] = pick(T);
  return byD(d, { text, answer: ans, hint: `Вспомни: ${how}.`, explain: how + `. Ответ: ${ans}.` }, numOpts(ans));
});

const fmtT = t => { t = ((t % 720) + 720) % 720; return `${Math.floor(t / 60) || 12}:${String(t % 60).padStart(2, '0')}`; };
function clockSVG(h, m) {
  const c = 70, ha = ((h % 12) + m / 60) * 30, ma = m * 6, P = (a, r) => [c + r * Math.sin(a * Math.PI / 180), c - r * Math.cos(a * Math.PI / 180)];
  let s = '<svg viewBox="0 0 140 140" width="170"><circle cx="70" cy="70" r="64" fill="#fff" stroke="#2b2d42" stroke-width="4"/>';
  for (let i = 1; i <= 12; i++) { const [x, y] = P(i * 30, 51); s += `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15" font-weight="800" fill="#2b2d42">${i}</text>`; }
  for (let i = 0; i < 60; i++) { if (i % 5) { const [x1, y1] = P(i * 6, 60), [x2, y2] = P(i * 6, 56); s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8d8fa8" stroke-width="1"/>`; } }
  const [hx, hy] = P(ha, 32), [mx, my] = P(ma, 46);
  return s + `<line x1="70" y1="70" x2="${hx}" y2="${hy}" stroke="#ff5d73" stroke-width="6" stroke-linecap="round"/><line x1="70" y1="70" x2="${mx}" y2="${my}" stroke="#7b6cff" stroke-width="4" stroke-linecap="round"/><circle cx="70" cy="70" r="5" fill="#2b2d42"/></svg>`;
}
function timeOpts(t) {
  const ok = fmtT(t), s = new Set([ok]);
  for (const dlt of shuffle([5, -5, 10, -10, 15, -15, 30, -30, 60, -60])) { if (s.size >= 4) break; s.add(fmtT(t + dlt)); }
  return shuffle([...s]).map(x => ({ h: x, v: x }));
}
gen('arith', 'time', 1, d => {
  const mode = d === 1 ? 0 : pick([0, 0, 1, 2]);
  if (mode === 0) {
    const h = rnd(1, 12), m = d === 1 ? pick([0, 30]) : d === 2 ? pick([0, 15, 30, 45]) : rnd(0, 11) * 5, t = (h % 12) * 60 + m;
    return mkChoice({ text: 'Сколько времени показывают часы?', visual: clockSVG(h, m), answer: fmtT(t),
      hint: 'Короткая красная стрелка — часы, длинная фиолетовая — минуты.', explain: `Часы показывают ${fmtT(t)}.` }, timeOpts(t));
  }
  if (mode === 1) {
    const t = rnd(1, 12) * 60 + rnd(0, 11) * 5, dm = d <= 2 ? pick([10, 15, 20, 30, 45, 60]) : d === 3 ? rnd(2, 12) * 5 : rnd(8, 30) * 5;
    return mkChoice({ text: `Сейчас ${fmtT(t)}. Сколько времени будет через ${dm} мин?`, answer: fmtT(t + dm),
      hint: 'Сначала доведи до круглого часа, а остаток минут прибавь после.', explain: `${fmtT(t)} + ${dm} мин = ${fmtT(t + dm)}.` }, timeOpts(t + dm));
  }
  const t1 = rnd(1, 11) * 60 + rnd(0, 11) * 5, dm = rnd(2, 20) * 5, t2 = t1 + dm;
  return byD(d, { text: `Урок начался в ${fmtT(t1)}, а закончился в ${fmtT(t2)}. Сколько минут длился урок?`, answer: dm,
    hint: 'Сначала посчитай минуты до ближайшего круглого часа.', explain: `От ${fmtT(t1)} до ${fmtT(t2)} — ${dm} мин.` }, numOpts(dm));
});

window.Gens = { GENS, rnd, pick, shuffle, esc };
})();
