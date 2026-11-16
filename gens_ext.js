'use strict';
/* Новые игры: внимание (5 типов), память (6 типов, с экраном «запомни»), пространство (робот, зеркало).
   Задачи без текста в картинке: условия — эмодзи, цифры и сетки; слова только в формулировке (4 языка). */
(() => {
const { GENS, gen, mkChoice, mkNum, numOpts, byD, BL, rnd, pick, shuffle, t } = window.Gens;

const EMO = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🐔', '🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '⚽', '🚗', '🎈', '⭐', '🌸', '🔔', '🎁', '🧸'];
const DOTS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];
const ASSOC = [['🐶', '🦴'], ['🐱', '🐟'], ['🐰', '🥕'], ['🐵', '🍌'], ['🐝', '🌻'], ['🐔', '🥚'], ['🐮', '🌾'], ['🐭', '🧀'], ['🐘', '🥜'], ['🚗', '⛽'], ['☂️', '🌧️'], ['🔑', '🚪'], ['⚽', '🥅'], ['🎨', '🖌️'], ['🦷', '🪥'], ['✏️', '📓']];

const row = (items, cls = '') => `<div class="erow ${cls}">${items.map(e => `<span>${e}</span>`).join('')}</div>`;
const idxRow = n => `<div class="erow idx">${Array.from({ length: n }, (_, i) => `<span>${i + 1}</span>`).join('')}</div>`;
const rowOpt = items => ({ h: `<span class="rowopt">${items.join('')}</span>`, v: items.join('') });
const uniq4 = (correct, distract, fill) => {   // correct + до 3 разных отвлекающих, перемешано
  const seen = new Set([correct.v]), out = [correct];
  for (const d of distract) { if (out.length >= 4) break; if (!seen.has(d.v)) { seen.add(d.v); out.push(d); } }
  for (const d of fill()) { if (out.length >= 4) break; if (!seen.has(d.v)) { seen.add(d.v); out.push(d); } }
  return shuffle(out);
};
// похожий ряд: меняем один элемент или переставляем соседей
function variant(seq, palette) {
  const s = seq.slice();
  if (Math.random() < 0.5 && s.length > 1) { const i = rnd(0, s.length - 2); if (s[i] !== s[i + 1]) { [s[i], s[i + 1]] = [s[i + 1], s[i]]; return s; } }
  const i = rnd(0, s.length - 1); let x; do { x = pick(palette); } while (x === s[i]); s[i] = x; return s;
}

/* ======================== ВНИМАНИЕ ======================== */
gen('attention', 'count', 1, d => {
  const k = [2, 3, 3, 4, 5][d - 1], n = [8, 12, 16, 20, 24][d - 1], kinds = shuffle(EMO).slice(0, k), target = kinds[0];
  const c = rnd(2, [5, 7, 8, 9, 10][d - 1]), items = [target, ...[]].slice(0, 0);
  for (let i = 0; i < c; i++) items.push(target);
  while (items.length < n) items.push(pick(kinds.slice(1)));
  const fs = n <= 12 ? 38 : n <= 20 ? 32 : 28;
  return byD(d, { text: t(`Сколько ${target} на картинке?`, `Колькі ${target} на малюнку?`, `Kolik ${target} je na obrázku?`, `How many ${target} are in the picture?`),
    visual: `<div class="emogrid" style="font-size:${fs}px">${shuffle(items).map(e => `<span>${e}</span>`).join('')}</div>`, answer: c,
    hint: t('Считай по рядам и трогай каждый предмет пальцем.', 'Лічы па радах і дакранайся да кожнага прадмета пальцам.', 'Počítej po řádcích a ukazuj na každý předmět prstem.', 'Count row by row and touch each item with your finger.'),
    key: 'a' + target + items.slice().sort().join('') + Math.random().toString(36).slice(2, 6),
    explain: t(`Всего ${target}: ${c}.`, `Усяго ${target}: ${c}.`, `Celkem ${target}: ${c}.`, `${target} in total: ${c}.`) }, numOpts(c));
});

gen('attention', 'diff', 1, d => {
  const n = [4, 5, 6, 7, 8][d - 1], base = d <= 3 ? shuffle(EMO).slice(0, n) : Array.from({ length: n }, () => pick(EMO.slice(0, 6)));
  const k = rnd(0, n - 1); let o; do { o = pick(EMO); } while (o === base[k]);
  const b = base.slice(); b[k] = o;
  const pos = new Set([k + 1]); while (pos.size < 4) pos.add(rnd(1, n));
  return mkChoice({ text: t('Два ряда почти одинаковые. На каком месте они отличаются?', 'Два рады амаль аднолькавыя. На якім месцы яны адрозніваюцца?', 'Dvě řady jsou skoro stejné. Na kterém místě se liší?', 'The two rows are almost the same. At which position do they differ?'),
    visual: `<div style="width:100%">${row(base)}${idxRow(n)}<div style="height:8px"></div>${row(b)}</div>`, answer: k + 1,
    key: 'd' + base.join('') + b.join(''),
    hint: t('Сравнивай предметы по очереди: первый с первым, второй со вторым…', 'Параўноўвай прадметы па чарзе: першы з першым, другі з другім…', 'Porovnávej předměty postupně: první s prvním, druhý s druhým…', 'Compare the items one by one: first with first, second with second…'),
    explain: t(`Отличается место №${k + 1}.`, `Адрозніваецца месца №${k + 1}.`, `Liší se místo č. ${k + 1}.`, `Position ${k + 1} is different.`) },
  shuffle([...pos]).map(x => ({ h: String(x), v: x })));
});

gen('attention', 'vanish', 1, d => {
  const n = [4, 5, 6, 7, 8][d - 1], items = shuffle(EMO).slice(0, n), miss = pick(items), rest = shuffle(items.filter(x => x !== miss));
  const opts = uniq4({ h: miss, v: miss }, shuffle(items.filter(x => x !== miss)).map(x => ({ h: x, v: x })), () => shuffle(EMO).map(x => ({ h: x, v: x })));
  return mkChoice({ text: t('Во втором ряду чего-то не хватает. Что пропало?', 'У другім радзе чагосьці не хапае. Што знікла?', 'Ve druhé řadě něco chybí. Co zmizelo?', 'Something is missing in the second row. What disappeared?'),
    visual: `<div style="width:100%">${row(items)}<div style="height:10px"></div>${row(rest)}</div>`, answer: miss, big: true, key: 'v' + items.join('') + rest.join(''),
    hint: t('Находи каждый предмет верхнего ряда в нижнем.', 'Знаходзь кожны прадмет верхняга рада ў ніжнім.', 'Hledej každý předmět horní řady v dolní řadě.', 'Find each item of the top row in the bottom row.'),
    explain: t(`Пропал ${miss}.`, `Знік ${miss}.`, `Zmizel ${miss}.`, `${miss} disappeared.`) }, opts);
});

gen('attention', 'same', 2, d => {
  const n = [4, 4, 5, 6, 7][d - 1], pal = DOTS.slice(0, d <= 2 ? 4 : 6), sample = Array.from({ length: n }, () => pick(pal));
  const correct = rowOpt(sample), dis = [];
  for (let i = 0; i < 10; i++) dis.push(rowOpt(variant(sample, pal)));
  return mkChoice({ text: t('Какой ряд точно такой же, как образец?', 'Які рад дакладна такі ж, як узор?', 'Která řada je úplně stejná jako vzor?', 'Which row is exactly the same as the sample?'),
    visual: row(sample), answer: correct.v, cols: 1, key: 's' + sample.join(''), hint: t('Проверяй ряды слева направо, по одному предмету.', 'Правярай рады злева направа, па адным прадмеце.', 'Kontroluj řady zleva doprava, jeden předmět po druhém.', 'Check the rows from left to right, one item at a time.'),
    explain: t('Правильный ряд совпадает с образцом в каждом месте.', 'Правільны рад супадае з узорам у кожным месцы.', 'Správná řada se se vzorem shoduje na každém místě.', 'The correct row matches the sample at every position.') },
  uniq4(correct, dis, () => []));
});

gen('attention', 'most', 1, d => {
  const k = [3, 3, 4, 4, 5][d - 1], kinds = shuffle(EMO).slice(0, k), top = rnd(5, 7) + (d >= 3 ? 1 : 0), gap = [3, 2, 2, 1, 1][d - 1];
  const items = []; for (let i = 0; i < top; i++) items.push(kinds[0]);
  const counts = [top]; for (let i = 1; i < k; i++) { const c = rnd(1, Math.max(1, top - gap)); counts.push(c); for (let j = 0; j < c; j++) items.push(kinds[i]); }
  const opts = shuffle([kinds[0], ...shuffle(kinds.slice(1)).slice(0, 3)]).map(x => ({ h: x, v: x }));
  return mkChoice({ text: t('Каких предметов здесь больше всего?', 'Якіх прадметаў тут больш за ўсё?', 'Kterých předmětů je tu nejvíc?', 'Which item appears the most?'),
    visual: `<div class="emogrid" style="font-size:34px">${shuffle(items).map(e => `<span>${e}</span>`).join('')}</div>`, answer: kinds[0], big: true, key: 'm' + items.slice().sort().join(''),
    hint: t('Считай каждый вид отдельно.', 'Лічы кожны від асобна.', 'Počítej každý druh zvlášť.', 'Count each kind separately.'),
    explain: t(`Больше всего ${kinds[0]}: ${top}.`, `Больш за ўсё ${kinds[0]}: ${top}.`, `Nejvíc je ${kinds[0]}: ${top}.`, `The most common is ${kinds[0]}: ${top}.`) }, opts);
});

/* ======================== ПАМЯТЬ ======================== */
gen('memory', 'memseq', 1, d => {
  const n = [3, 4, 5, 6, 7][d - 1], items = shuffle(EMO).slice(0, n), k = rnd(1, n), ans = items[k - 1];
  const opts = uniq4({ h: ans, v: ans }, shuffle(items.filter(x => x !== ans)).map(x => ({ h: x, v: x })), () => shuffle(EMO).map(x => ({ h: x, v: x })));
  return mkChoice({ study: { secs: Math.round(2 + n * 1.1), text: t('Запомни ряд и номера!', 'Запомні рад і нумары!', 'Zapamatuj si řadu a čísla!', 'Remember the row and the numbers!'), html: `<div style="width:100%">${row(items)}${idxRow(n)}</div>` },
    text: t(`Что стояло под номером ${k}?`, `Што стаяла пад нумарам ${k}?`, `Co bylo pod číslem ${k}?`, `What was at number ${k}?`), answer: ans, big: true, key: 'q' + items.join('') + k,
    hint: t('Представь ряд ещё раз в голове — слева направо.', 'Уяві рад яшчэ раз у галаве — злева направа.', 'Představ si řadu znovu v hlavě – zleva doprava.', 'Picture the row in your head again – from left to right.'),
    explain: t(`Под номером ${k} был ${ans}.`, `Пад нумарам ${k} быў ${ans}.`, `Pod číslem ${k} bylo ${ans}.`, `At number ${k} there was ${ans}.`) }, opts);
});

gen('memory', 'mempos', 1, d => {
  const [w, h] = [[2, 2], [3, 3], [3, 3], [4, 3], [4, 4]][d - 1], cnt = [2, 3, 4, 5, 6][d - 1], cells = shuffle([...Array(w * h).keys()]).slice(0, cnt), items = shuffle(EMO).slice(0, cnt);
  const grid = (fn) => `<div class="mgrid" style="--w:${w}">${Array.from({ length: w * h }, (_, i) => `<div class="${fn(i).c || ''}">${fn(i).h}</div>`).join('')}</div>`;
  const ti = rnd(0, cnt - 1), target = cells[ti], ans = items[ti];
  const studyHtml = grid(i => ({ h: cells.includes(i) ? items[cells.indexOf(i)] : '' }));
  const askHtml = grid(i => (i === target ? { h: '?', c: 't' } : { h: '' }));
  const opts = uniq4({ h: ans, v: ans }, shuffle(items.filter(x => x !== ans)).map(x => ({ h: x, v: x })), () => shuffle(EMO).map(x => ({ h: x, v: x })));
  return mkChoice({ study: { secs: Math.round(3 + cnt * 0.9), text: t('Запомни, где что лежит!', 'Запомні, дзе што ляжыць!', 'Zapamatuj si, co kde leží!', 'Remember where everything is!'), html: studyHtml },
    text: t('Что было в клетке со знаком «?»', 'Што было ў клетцы са знакам «?»', 'Co bylo v políčku se znaménkem „?“', 'What was in the square with the "?"'), visual: askHtml, answer: ans, big: true, key: 'p' + cells.join('') + items.join(''),
    hint: t('Вспомни картинку: где находилась клетка относительно других предметов?', 'Успомні карцінку: дзе знаходзілася клетка адносна іншых прадметаў?', 'Vzpomeň si na obrázek: kde bylo políčko vzhledem k ostatním předmětům?', 'Recall the picture: where was this square compared with the other items?'),
    explain: t(`В этой клетке был ${ans}.`, `У гэтай клетцы быў ${ans}.`, `V tomto políčku bylo ${ans}.`, `This square held ${ans}.`) }, opts);
});

gen('memory', 'memnum', 1, d => {
  const n = [3, 4, 5, 6, 6][d - 1]; let s = String(rnd(1, 9)); while (s.length < n) s += rnd(0, 9); const num = +s;
  const vars = new Set(); for (let i = 0; i < 12 && vars.size < 3; i++) { const a = s.split(''), j = rnd(0, n - 1); a[j] = String((+a[j] + rnd(1, 8)) % 10); if (j === 0 && a[0] === '0') continue; const v = +a.join(''); if (v !== num) vars.add(v); }
  const opts = shuffle([num, ...vars]).map(x => ({ h: String(x), v: x }));
  const q = { study: { secs: Math.round(2 + n * 0.9), text: t('Запомни число!', 'Запомні лік!', 'Zapamatuj si číslo!', 'Remember the number!'), html: `<div class="bignum">${s}</div>` },
    text: t('Какое число было на экране? Набери его.', 'Які лік быў на экране? Набяры яго.', 'Které číslo bylo na obrazovce? Napiš ho.', 'Which number was on the screen? Type it.'), answer: num, key: 'n' + s,
    hint: t('Разбей число на части по две-три цифры — так проще держать в памяти.', 'Падзялі лік на часткі па дзве-тры лічбы — так прасцей трымаць у памяці.', 'Rozděl číslo na části po dvou až třech číslicích – lépe se pamatuje.', 'Split the number into parts of two or three digits – it is easier to remember.'),
    explain: t(`Было число ${s}.`, `Быў лік ${s}.`, `Bylo číslo ${s}.`, `The number was ${s}.`) };
  return d <= 2 && opts.length === 4 ? mkChoice(q, opts) : mkNum(q);
});

gen('memory', 'memcount', 2, d => {
  const n = [8, 10, 12, 15, 18][d - 1], kinds = shuffle(EMO).slice(0, 3), target = kinds[0], c = rnd(2, [4, 5, 6, 7, 8][d - 1]), items = [];
  for (let i = 0; i < c; i++) items.push(target); while (items.length < n) items.push(pick(kinds.slice(1)));
  return byD(d, { study: { secs: Math.round(3 + n * 0.3), text: t(`Запомни и сосчитай: ${target}`, `Запомні і падлічы: ${target}`, `Zapamatuj si a spočítej: ${target}`, `Remember and count: ${target}`), html: `<div class="emogrid" style="font-size:34px">${shuffle(items).map(e => `<span>${e}</span>`).join('')}</div>` },
    text: t(`Сколько ${target} было на картинке?`, `Колькі ${target} было на малюнку?`, `Kolik ${target} bylo na obrázku?`, `How many ${target} were in the picture?`), answer: c, key: 'c' + target + items.join(''),
    hint: t('Считай про себя, пока картинка на экране.', 'Лічы пра сябе, пакуль карцінка на экране.', 'Počítej v duchu, dokud je obrázek na obrazovce.', 'Count silently while the picture is on the screen.'),
    explain: t(`Было ${c}.`, `Было ${c}.`, `Bylo jich ${c}.`, `There were ${c}.`) }, numOpts(c));
});

gen('memory', 'mempair', 2, d => {
  const p = [3, 3, 4, 4, 5][d - 1], pairs = shuffle(ASSOC).slice(0, p), [a, b] = pick(pairs), others = shuffle(ASSOC.filter(x => !pairs.includes(x))).map(x => x[1]);
  const partners = pairs.map(x => x[1]);
  const opts = uniq4({ h: b, v: b }, shuffle(partners.filter(x => x !== b)).map(x => ({ h: x, v: x })), () => others.map(x => ({ h: x, v: x })));
  return mkChoice({ study: { secs: Math.round(3 + p * 1.5), text: t('Запомни пары!', 'Запомні пары!', 'Zapamatuj si dvojice!', 'Remember the pairs!'), html: `<div class="pairs">${pairs.map(x => `<div>${x[0]} <i>–</i> ${x[1]}</div>`).join('')}</div>` },
    text: t(`Что было в паре с ${a}?`, `Што было ў пары з ${a}?`, `Co bylo ve dvojici s ${a}?`, `What was paired with ${a}?`), answer: b, big: true, key: 'r' + pairs.map(x => x.join('')).join('') + a,
    hint: t('Придумай маленькую историю про каждую пару.', 'Прыдумай маленькую гісторыю пра кожную пару.', 'Vymysli si krátký příběh o každé dvojici.', 'Make up a tiny story for each pair.'),
    explain: `${a} – ${b}` }, opts);
});

gen('memory', 'memcolor', 2, d => {
  const n = [3, 4, 5, 6, 7][d - 1], pal = DOTS.slice(0, d === 1 ? 3 : d <= 3 ? 4 : 6), seq = Array.from({ length: n }, () => pick(pal));
  const correct = rowOpt(seq), dis = []; for (let i = 0; i < 12; i++) dis.push(rowOpt(variant(seq, pal)));
  return mkChoice({ study: { secs: Math.round(2 + n * 1.0), text: t('Запомни порядок цветов!', 'Запомні парадак колераў!', 'Zapamatuj si pořadí barev!', 'Remember the order of colours!'), html: row(seq) },
    text: t('Какой ряд был на экране?', 'Які рад быў на экране?', 'Která řada byla na obrazovce?', 'Which row was on the screen?'), answer: correct.v, cols: 1, key: 'k' + seq.join(''),
    hint: t('Запомни первый и последний цвет, а потом то, что между ними.', 'Запомні першы і апошні колер, а потым тое, што паміж імі.', 'Zapamatuj si první a poslední barvu a pak to, co je mezi nimi.', 'Remember the first and last colour, then what is between them.'),
    explain: t('Это был правильный порядок цветов.', 'Гэта быў правільны парадак колераў.', 'Tohle bylo správné pořadí barev.', 'That was the correct order of colours.') },
  uniq4(correct, dis, () => []));
});

/* ======================== ПРОСТРАНСТВО: робот и зеркало ======================== */
const ARROW = { U: '↑', D: '↓', L: '←', R: '→' }, DIR = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }, COLS = 'ABCDE';
gen('space', 'robot', 1, d => {
  const n = [3, 4, 4, 5, 5][d - 1], steps = d + 1 + rnd(0, 1);
  for (let guard = 0; guard < 200; guard++) {
    let x = rnd(0, n - 1), y = rnd(0, n - 1); const sx = x, sy = y, path = [];
    for (let i = 0; i < steps; i++) { const ok = Object.keys(DIR).filter(k => { const nx = x + DIR[k][0], ny = y + DIR[k][1]; return nx >= 0 && ny >= 0 && nx < n && ny < n && !(path.length && path[path.length - 1] === { U: 'D', D: 'U', L: 'R', R: 'L' }[k]); }); if (!ok.length) break; const k = pick(ok); path.push(k); x += DIR[k][0]; y += DIR[k][1]; }
    if (path.length < steps || (x === sx && y === sy)) continue;
    const cell = (cx, cy) => COLS[cx] + (cy + 1), end = cell(x, y), wrong = new Set();
    for (let i = 0; i < 40 && wrong.size < 3; i++) { let px = sx, py = sy; const alt = path.slice(); alt[rnd(0, alt.length - 1)] = pick(Object.keys(DIR));
      let okk = true; for (const k of alt) { px += DIR[k][0]; py += DIR[k][1]; if (px < 0 || py < 0 || px >= n || py >= n) { okk = false; break; } } if (okk && cell(px, py) !== end) wrong.add(cell(px, py)); }
    for (let cx = 0; cx < n && wrong.size < 3; cx++) for (let cy = 0; cy < n && wrong.size < 3; cy++) if (cell(cx, cy) !== end) wrong.add(cell(cx, cy));
    const head = `<div></div>${Array.from({ length: n }, (_, i) => `<div class="hd">${COLS[i]}</div>`).join('')}`;
    const body = Array.from({ length: n }, (_, r) => `<div class="hd">${r + 1}</div>` + Array.from({ length: n }, (_, c) => `<div>${c === sx && r === sy ? '🤖' : ''}</div>`).join('')).join('');
    return mkChoice({ text: t('Куда придёт робот? Выбери клетку.', 'Куды прыйдзе робат? Абяры клетку.', 'Kam dojde robot? Vyber políčko.', 'Where will the robot end up? Pick the square.'),
      visual: `<div style="width:100%"><div class="rg" style="--n:${n + 1}">${head}${body}</div><div class="erow arrows">${path.map(k => `<span>${ARROW[k]}</span>`).join('')}</div></div>`, answer: end,
      key: 'o' + n + sx + sy + path.join(''),
      hint: t('Двигай робота пальцем по клеткам: ↑ вверх, ↓ вниз, ← влево, → вправо.', 'Рухай робата пальцам па клетках: ↑ уверх, ↓ уніз, ← улева, → управа.', 'Posouvej robota prstem po políčkách: ↑ nahoru, ↓ dolů, ← doleva, → doprava.', 'Move the robot with your finger: ↑ up, ↓ down, ← left, → right.'),
      explain: t(`Робот придёт в клетку ${end}.`, `Робат прыйдзе ў клетку ${end}.`, `Robot dojde na políčko ${end}.`, `The robot ends up on square ${end}.`) },
    shuffle([end, ...wrong]).map(x => ({ h: x, v: x })));
  }
});

const mini = (cells, n) => `<span class="mini" style="--n:${n}">${cells.map(c => `<i class="${c ? 'on' : ''}"></i>`).join('')}</span>`;
gen('space', 'mirror', 2, d => {
  const n = d <= 3 ? 3 : 4, fillN = Math.min(n * n - 2, d + 3);
  for (let guard = 0; guard < 300; guard++) {
    const cells = Array(n * n).fill(0); shuffle([...Array(n * n).keys()]).slice(0, fillN).forEach(i => (cells[i] = 1));
    const flipH = a => a.map((_, i) => a[Math.floor(i / n) * n + (n - 1 - (i % n))]), flipV = a => a.map((_, i) => a[(n - 1 - Math.floor(i / n)) * n + (i % n)]), rot = a => flipV(flipH(a));
    const key = a => a.join(''), ans = flipH(cells);
    if (key(ans) === key(cells)) continue;
    const dis = [cells, flipV(cells), rot(cells)].filter(a => key(a) !== key(ans)), extra = []; for (let i = 0; i < 12; i++) { const a = ans.slice(), j = rnd(0, a.length - 1); a[j] = a[j] ? 0 : 1; if (key(a) !== key(ans)) extra.push(a); }
    const opts = uniq4({ h: mini(ans, n), v: key(ans) }, [...dis, ...extra].map(a => ({ h: mini(a, n), v: key(a) })), () => []);
    if (opts.length < 4) continue;
    return mkChoice({ text: t('Какая картинка получится в зеркале справа? (отражение слева направо)', 'Якая карцінка атрымаецца ў люстэрку справа? (адбітак злева направа)', 'Jaký obrázek se objeví v zrcadle vpravo? (odraz zleva doprava)', 'Which picture appears in the mirror on the right? (left-to-right reflection)'),
      visual: `<div class="mirrorv">${mini(cells, n)}<b>🪞</b></div>`, answer: key(ans), big: true, key: 'x' + key(cells),
      hint: t('Левый край картинки в зеркале становится правым.', 'Левы край карцінкі ў люстэрку становіцца правым.', 'Levý okraj obrázku se v zrcadle stane pravým.', 'The left edge of the picture becomes the right edge in the mirror.'),
      explain: t('Каждый ряд переворачивается слева направо.', 'Кожны радок пераварочваецца злева направа.', 'Každý řádek se obrátí zleva doprava.', 'Each row is flipped from left to right.') }, opts);
  }
});
})();
