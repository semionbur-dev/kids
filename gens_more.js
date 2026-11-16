'use strict';
/* Ещё игры (F5): пространство (поворот, симметрия, «где стоит»), внимание («без пары»)
   и задания для 5–7 лет почти без чтения (счёт предметов, сложение на картинках, «чего больше»). */
(() => {
const { gen, mkChoice, numOpts, rand, rnd, pick, shuffle, t } = window.Gens;
const EMO = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🐔', '🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '⚽', '🚗', '🎈', '⭐', '🌸', '🔔', '🎁', '🧸'];
const uniq4 = (correct, distract, fill) => {
  const seen = new Set([correct.v]), out = [correct];
  for (const d of [...distract, ...fill()]) { if (out.length >= 4) break; if (!seen.has(d.v)) { seen.add(d.v); out.push(d); } }
  return shuffle(out);
};
const mini = (cells, n) => `<span class="mini" style="--n:${n}">${cells.map(c => `<i class="${c ? 'on' : ''}"></i>`).join('')}</span>`;
const eg = (items, fs) => `<div class="emogrid" style="font-size:${fs}px">${items.map(e => `<span>${e}</span>`).join('')}</div>`;

/* ---------- числа для самых маленьких ---------- */
gen('arith', 'ycount', 1, d => {
  const max = [4, 6, 8, 10, 12][d - 1], c = rnd(1, max), e = pick(EMO), items = Array(c).fill(e);
  return mkChoice({ text: t('Сколько здесь предметов?', 'Колькі тут прадметаў?', 'Kolik je tu předmětů?', 'How many items are there?'),
    visual: eg(items, c > 8 ? 34 : 42), answer: c, key: 'yc' + e + c,
    hint: t('Дотрагивайся до каждого пальцем и считай вслух.', 'Дакранайся да кожнага пальцам і лічы ўголас.', 'Ukazuj na každý prstem a počítej nahlas.', 'Touch each one with your finger and count aloud.'),
    explain: t(`Всего: ${c}.`, `Усяго: ${c}.`, `Celkem: ${c}.`, `Total: ${c}.`) }, numOpts(c));
});

gen('arith', 'yadd', 1, d => {
  const sum = [5, 7, 10, 10, 12][d - 1], e = pick(EMO);
  if (d >= 3 && rand() < 0.5) {
    const a = rnd(4, sum), b = rnd(1, a - 1), c = a - b;
    return mkChoice({ text: t(`Было ${a}, убрали ${b}. Сколько осталось?`, `Было ${a}, прыбралі ${b}. Колькі засталося?`, `Bylo ${a}, odebrali ${b}. Kolik zbylo?`, `There were ${a}, ${b} were taken away. How many are left?`),
      visual: eg(Array(a).fill(e), 34), answer: c, key: 'ys' + e + a + '-' + b,
      hint: t('Закрой пальцем лишние предметы и посчитай оставшиеся.', 'Закрый пальцам лішнія прадметы і падлічы тыя, што засталіся.', 'Zakryj prstem odebrané předměty a spočítej ostatní.', 'Cover the removed items with a finger and count the rest.'),
      explain: t(`${a} − ${b} = ${c}.`, `${a} − ${b} = ${c}.`, `${a} − ${b} = ${c}.`, `${a} − ${b} = ${c}.`) }, numOpts(c));
  }
  const a = rnd(1, sum - 1), b = rnd(1, sum - a), c = a + b;
  return mkChoice({ text: t('Сколько всего?', 'Колькі ўсяго?', 'Kolik je to dohromady?', 'How many in total?'),
    visual: `<div class="erow" style="flex-wrap:wrap;align-items:center;gap:10px"><span style="width:auto">${Array(a).fill(e).join('')}</span><b style="font-size:30px">+</b><span style="width:auto">${Array(b).fill(e).join('')}</span></div>`,
    answer: c, key: 'ya' + e + a + '+' + b,
    hint: t('Посчитай сначала первую группу, потом продолжай считать вторую.', 'Падлічы спачатку першую групу, потым працягвай лічыць другую.', 'Spočítej první skupinu a pak počítej dál druhou.', 'Count the first group, then keep counting the second.'),
    explain: t(`${a} + ${b} = ${c}.`, `${a} + ${b} = ${c}.`, `${a} + ${b} = ${c}.`, `${a} + ${b} = ${c}.`) }, numOpts(c));
});

gen('arith', 'ymore', 1, d => {
  const [x, y, z] = shuffle(EMO).slice(0, 3), gap = [3, 2, 2, 1, 1][d - 1], top = rnd(4, [6, 7, 8, 9, 10][d - 1]);
  const ny = Math.max(1, top - rnd(gap, gap + 1)), nz = Math.max(1, top - rnd(gap, gap + 2)), all = shuffle([...Array(top).fill(x), ...Array(ny).fill(y), ...Array(nz).fill(z)]);
  return mkChoice({ text: t('Чего здесь больше всего?', 'Чаго тут больш за ўсё?', 'Čeho je tu nejvíc?', 'Which is there the most of?'), visual: eg(all, all.length > 14 ? 30 : 36),
    answer: x, big: true, key: 'ym' + all.join(''),
    hint: t('Сосчитай каждый вид отдельно и сравни числа.', 'Падлічы кожны від асобна і параўнай лікі.', 'Spočítej každý druh zvlášť a porovnej čísla.', 'Count each kind separately and compare the numbers.'),
    explain: t(`${x} — ${top}, ${y} — ${ny}, ${z} — ${nz}. Больше всего: ${x}.`, `${x} — ${top}, ${y} — ${ny}, ${z} — ${nz}. Больш за ўсё: ${x}.`, `${x} – ${top}, ${y} – ${ny}, ${z} – ${nz}. Nejvíc je: ${x}.`, `${x}: ${top}, ${y}: ${ny}, ${z}: ${nz}. The most: ${x}.`) },
  shuffle([x, y, z]).map(v => ({ h: v, v })));
});

/* ---------- пространство ---------- */
const flipH = (a, n) => a.map((_, i) => a[Math.floor(i / n) * n + (n - 1 - (i % n))]);
const rotCW = (a, n) => a.map((_, i) => { const r = Math.floor(i / n), c = i % n; return a[(n - 1 - c) * n + r]; });
const rotCCW = (a, n) => rotCW(rotCW(rotCW(a, n), n), n);
gen('geom', 'rotate', 2, d => {
  const n = d <= 3 ? 3 : 4, fill = Math.min(n * n - 3, d + 2);
  for (let g = 0; g < 400; g++) {
    const cells = Array(n * n).fill(0); shuffle([...Array(n * n).keys()]).slice(0, fill).forEach(i => (cells[i] = 1));
    const key = a => a.join(''), ans = rotCW(cells, n), r2 = rotCW(ans, n);
    if ([ans, r2, rotCCW(cells, n), flipH(cells, n)].some(a => key(a) === key(cells)) || key(ans) === key(rotCCW(cells, n)) || key(ans) === key(flipH(cells, n))) continue;
    const dis = [rotCCW(cells, n), flipH(cells, n), r2, cells], extra = [];
    for (let i = 0; i < 12; i++) { const a = ans.slice(), j = rnd(0, a.length - 1); a[j] = a[j] ? 0 : 1; if (key(a) !== key(ans)) extra.push(a); }
    const opts = uniq4({ h: mini(ans, n), v: key(ans) }, [...dis, ...extra].filter(a => key(a) !== key(ans)).map(a => ({ h: mini(a, n), v: key(a) })), () => []);
    if (opts.length < 4) continue;
    return mkChoice({ text: t('Картинку повернули на четверть оборота по часовой стрелке (↻). Что получилось?', 'Карцінку павярнулі на чвэрць абароту па гадзіннікавай стрэлцы (↻). Што атрымалася?', 'Obrázek otočili o čtvrt otáčky po směru hodinových ručiček (↻). Co vzniklo?', 'The picture was turned a quarter turn clockwise (↻). What does it look like now?'),
      visual: `<div class="mirrorv">${mini(cells, n)}<b>↻</b></div>`, answer: key(ans), big: true, key: 'ro' + key(cells),
      hint: t('Верхняя строка картинки становится правым столбцом.', 'Верхні радок карцінкі становіцца правым слупком.', 'Horní řádek obrázku se stane pravým sloupcem.', 'The top row of the picture becomes the right-hand column.'),
      explain: t('Верхний ряд стал правым столбцом, левый столбец — верхним рядом.', 'Верхні радок стаў правым слупком, левы слупок — верхнім радком.', 'Horní řádek se stal pravým sloupcem, levý sloupec horním řádkem.', 'The top row became the right column and the left column became the top row.') }, opts);
  }
});

gen('geom', 'symm', 2, d => {
  const rows = 4, half = 2, fill = [2, 3, 3, 4, 5][d - 1];
  for (let g = 0; g < 400; g++) {
    const left = Array(rows * half).fill(0); shuffle([...Array(rows * half).keys()]).slice(0, fill).forEach(i => (left[i] = 1));
    const build = (l, mirror) => { const out = []; for (let r = 0; r < rows; r++) { const row = l.slice(r * half, r * half + half); out.push(...row, ...(mirror ? row.slice().reverse() : row)); } return out; };
    const key = a => a.join(''), ans = build(left, true), same = build(left, false);
    if (key(ans) === key(same)) continue;
    const upside = ans.map((_, i) => ans[(rows - 1 - Math.floor(i / 4)) * 4 + (i % 4)]), extra = [];
    for (let i = 0; i < 12; i++) { const a = ans.slice(), j = rnd(0, a.length - 1); a[j] = a[j] ? 0 : 1; if (key(a) !== key(ans)) extra.push(a); }
    const opts = uniq4({ h: mini(ans, 4), v: key(ans) }, [same, upside, ...extra].filter(a => key(a) !== key(ans)).map(a => ({ h: mini(a, 4), v: key(a) })), () => []);
    if (opts.length < 4) continue;
    return mkChoice({ text: t('Справа от рисунка поставили зеркало. Какая картинка получится целиком?', 'Справа ад малюнка паставілі люстэрка. Якая карцінка атрымаецца цалкам?', 'Vpravo od obrázku postavili zrcadlo. Jaký obrázek vznikne celý?', 'A mirror stands on the right of the drawing. What will the whole picture look like?'),
      visual: `<div class="mirrorv">${mini(left, half)}<b>🪞</b></div>`, answer: key(ans), big: true, key: 'sy' + key(left),
      hint: t('Каждая строка отражается: клетка у зеркала повторяется первой.', 'Кожны радок адлюстроўваецца: клетка каля люстэрка паўтараецца першай.', 'Každý řádek se odráží: políčko u zrcadla se zopakuje první.', 'Each row is reflected: the square next to the mirror is repeated first.'),
      explain: t('В зеркале каждая строка повторяется в обратном порядке.', 'У люстэрку кожны радок паўтараецца ў адваротным парадку.', 'V zrcadle se každý řádek zopakuje v opačném pořadí.', 'In the mirror every row repeats in reverse order.') }, opts);
  }
});

const DIRS = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };
gen('geom', 'where', 1, d => {
  const fill = [4, 5, 6, 6, 7][d - 1];
  for (let g = 0; g < 200; g++) {
    const cells = shuffle([...Array(9).keys()]).slice(0, fill), items = shuffle(EMO).slice(0, fill), at = new Map(cells.map((c, i) => [c, items[i]]));
    const pairs = [];
    for (const [c, e] of at) for (const dir of Object.keys(DIRS)) { const x = (c % 3) + DIRS[dir][0], y = Math.floor(c / 3) + DIRS[dir][1]; if (x >= 0 && x < 3 && y >= 0 && y < 3 && at.has(y * 3 + x)) pairs.push([e, dir, at.get(y * 3 + x)]); }
    if (!pairs.length) continue;
    const [r, dir, ans] = pick(pairs), word = {
      right: t(`Что стоит справа от ${r}?`, `Што стаіць справа ад ${r}?`, `Co stojí vpravo od ${r}?`, `What is to the right of ${r}?`),
      left: t(`Что стоит слева от ${r}?`, `Што стаіць злева ад ${r}?`, `Co stojí vlevo od ${r}?`, `What is to the left of ${r}?`),
      up: t(`Что находится над ${r}?`, `Што знаходзіцца над ${r}?`, `Co je nad ${r}?`, `What is above ${r}?`),
      down: t(`Что находится под ${r}?`, `Што знаходзіцца пад ${r}?`, `Co je pod ${r}?`, `What is below ${r}?`) }[dir];
    const grid = `<div class="mgrid" style="--w:3">${Array.from({ length: 9 }, (_, i) => `<div>${at.get(i) || ''}</div>`).join('')}</div>`;
    const opts = uniq4({ h: ans, v: ans }, items.filter(x => x !== ans && x !== r).map(x => ({ h: x, v: x })), () => shuffle(EMO).map(x => ({ h: x, v: x })));
    return mkChoice({ text: word, visual: grid, answer: ans, big: true, key: 'wh' + [...at].map(([c, e]) => c + e).join('') + dir + r,
      hint: t('Найди ' + r + ' на сетке и сдвинься на одну клетку в нужную сторону.', 'Знайдзі ' + r + ' на сетцы і зрушся на адну клетку ў патрэбны бок.', 'Najdi ' + r + ' v mřížce a posuň se o jedno políčko správným směrem.', 'Find ' + r + ' on the grid and move one square in that direction.'),
      explain: t(`Рядом с ${r} в этой стороне стоит ${ans}.`, `Побач з ${r} у гэтым баку стаіць ${ans}.`, `Vedle ${r} tímto směrem je ${ans}.`, `Next to ${r} in that direction is ${ans}.`) }, opts);
  }
});

/* ---------- внимание ---------- */
gen('attention', 'unpair', 1, d => {
  const p = [3, 4, 5, 6, 7][d - 1], kinds = shuffle(EMO).slice(0, p + 1), single = kinds[0], items = [single];
  for (const k of kinds.slice(1)) items.push(k, k);
  const opts = shuffle([single, ...shuffle(kinds.slice(1)).slice(0, 3)]).map(x => ({ h: x, v: x }));
  return mkChoice({ text: t('У всех предметов есть пара, кроме одного. Какой предмет без пары?', 'У ўсіх прадметаў ёсць пара, акрамя аднаго. Які прадмет без пары?', 'Všechny předměty mají dvojici, kromě jednoho. Který je bez dvojice?', 'Every item has a partner except one. Which one has no partner?'),
    visual: eg(shuffle(items), items.length > 11 ? 30 : 36), answer: single, big: true, key: 'up' + items.slice().sort().join(''),
    hint: t('Находи двойняшек и мысленно убирай их по парам.', 'Знаходзь двайнят і подумкі прыбірай іх парамі.', 'Hledej dvojčata a v duchu je odškrtávej po dvojicích.', 'Find the twins and cross them off in pairs.'),
    explain: t(`${single} встречается только один раз.`, `${single} сустракаецца толькі адзін раз.`, `${single} je tu jen jednou.`, `${single} appears only once.`) }, opts);
});

/* ======================== ещё задания для 5–7 лет (почти без чтения) ======================== */
const FRUIT = ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉'], ANIM = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🐔', '🐮', '🐘'], TRANS = ['🚗', '🚌', '✈️', '🚲', '🚂'], SWEET = ['🍩', '🍪', '🍦', '🍫', '🍬', '🧁', '🍭'], PLAY = ['⚽', '🎈', '🧸', '🎁'];
const mk4 = (correct, bad, fill) => uniq4({ h: correct, v: correct }, bad.map(x => ({ h: x, v: x })), () => fill.map(x => ({ h: x, v: x })));

gen('logic', 'ysize', 1, d => {
  const n = [3, 3, 4, 4, 4][d - 1], pool = [26, 34, 44, 56, 70], gapOk = sizes => sizes.every((x, i) => i === 0 || x - sizes[i - 1] >= (d >= 4 ? 8 : 12));
  let sizes; do { sizes = shuffle(pool).slice(0, n).sort((a, b) => a - b); } while (!gapOk(sizes));
  const e = pick(EMO), big = rand() < 0.5, ans = big ? sizes[n - 1] : sizes[0], order = shuffle(sizes);
  return mkChoice({ text: big ? t('Нажми на самого большого!', 'Націсні на самага вялікага!', 'Klepni na toho největšího!', 'Tap the biggest one!') : t('Нажми на самого маленького!', 'Націсні на самага маленькага!', 'Klepni na toho nejmenšího!', 'Tap the smallest one!'),
    answer: ans, big: true, key: 'zs' + e + order.join('-') + big, cols: n === 3 ? 3 : 2,
    hint: t('Сравни, кто занимает больше места.', 'Параўнай, хто займае больш месца.', 'Porovnej, kdo zabírá víc místa.', 'Compare who takes up more room.'),
    explain: big ? t('Самый большой — тот, что крупнее всех.', 'Самы вялікі — той, што буйнейшы за ўсіх.', 'Největší je ten, který je ze všech nejvyšší.', 'The biggest is the one larger than all the others.') : t('Самый маленький — тот, что мельче всех.', 'Самы маленькі — той, што драбнейшы за ўсіх.', 'Nejmenší je ten, který je ze všech nejmenší.', 'The smallest is the one tinier than all the others.') },
    order.map(sz => ({ h: `<span style="font-size:${sz}px;line-height:1">${e}</span>`, v: sz })));
});

gen('logic', 'ybelong', 1, d => {
  const cats = [FRUIT, ANIM, TRANS, SWEET], near = new Map([[FRUIT, SWEET], [SWEET, FRUIT], [ANIM, PLAY], [TRANS, PLAY]]);
  const cat = pick(cats), ex = shuffle(cat).slice(0, 3), ans = pick(cat.filter(x => !ex.includes(x)));
  const others = cats.filter(c => c !== cat), bad = [];
  if (d >= 3 && near.get(cat)) bad.push(pick(near.get(cat)));
  for (const c of shuffle(others)) { if (bad.length >= 3) break; const x = pick(c); if (!bad.includes(x)) bad.push(x); }
  while (bad.length < 3) { const x = pick(PLAY); if (!bad.includes(x)) bad.push(x); }
  return mkChoice({ text: t('Что подходит к этим?', 'Што падыходзіць да гэтых?', 'Co patří k těmto?', 'What goes with these?'), visual: eg(ex, 44), answer: ans, big: true, key: 'yb' + ex.join('') + ans,
    hint: t('Подумай, чем похожи эти три картинки.', 'Падумай, чым падобныя гэтыя тры карцінкі.', 'Přemýšlej, v čem jsou ty tři obrázky podobné.', 'Think about how these three pictures are alike.'),
    explain: t('Все эти картинки из одной группы.', 'Усе гэтыя карцінкі з адной групы.', 'Všechny tyto obrázky jsou z jedné skupiny.', 'All of these pictures belong to one group.') }, mk4(ans, bad, shuffle(EMO)));
});

const WEIGHT = ['🎈', '🔑', '🐭', '🐸', '🍎', '⚽', '🐔', '🐱', '🐶', '🐼', '🚗', '🐘'].map((e, i) => [e, i]);   // по возрастанию веса
gen('logic', 'yheavy', 1, d => {
  const gap = [3, 2, 2, 1, 1][d - 1], heavy = rand() < 0.5;
  let items = null;
  for (let g = 0; g < 400 && !items; g++) { const c = shuffle(WEIGHT).slice(0, 4).sort((a, b) => a[1] - b[1]); if (!c.some((x, i) => i && x[1] - c[i - 1][1] < gap)) items = c; }
  if (!items) items = [WEIGHT[0], WEIGHT[4], WEIGHT[8], WEIGHT[11]];
  {
    const ans = heavy ? items[3][0] : items[0][0];
    return mkChoice({ text: heavy ? t('Кто самый тяжёлый?', 'Хто самы цяжкі?', 'Kdo je nejtěžší?', 'Which is the heaviest?') : t('Кто самый лёгкий?', 'Хто самы лёгкі?', 'Kdo je nejlehčí?', 'Which is the lightest?'), answer: ans, big: true, key: 'yh' + items.map(x => x[0]).join('') + heavy,
      hint: t('Представь, что берёшь каждого в руки.', 'Уяві, што бярэш кожнага ў рукі.', 'Představ si, že každého bereš do rukou.', 'Imagine picking each one up.'),
      explain: heavy ? t('Он тяжелее всех остальных.', 'Ён цяжэйшы за ўсіх астатніх.', 'Je těžší než všichni ostatní.', 'It is heavier than all the others.') : t('Он легче всех остальных.', 'Ён лягчэйшы за ўсіх астатніх.', 'Je lehčí než všichni ostatní.', 'It is lighter than all the others.') }, shuffle(items.map(x => ({ h: x[0], v: x[0] }))));
  }
});

/* ---------- числа: найди, что дальше, поровну, сколько добавить ---------- */
gen('arith', 'yfind', 1, d => {
  const max = [9, 10, 12, 15, 20][d - 1], n = rnd(1, max), set = new Set([n]);
  const rev = n > 9 ? +String(n).split('').reverse().join('') : (n === 6 ? 9 : n === 9 ? 6 : 0); if (d >= 3 && rev && rev !== n && rev <= max) set.add(rev);
  while (set.size < 4) set.add(rnd(1, max));
  return mkChoice({ text: t(`Найди число ${n}`, `Знайдзі лік ${n}`, `Najdi číslo ${n}`, `Find the number ${n}`), answer: n, big: false, key: 'yf' + n + [...set].join('-'),
    hint: t('Посмотри на каждое число по очереди.', 'Паглядзі на кожны лік па чарзе.', 'Podívej se na každé číslo po řadě.', 'Look at each number in turn.'),
    explain: t(`Это число ${n}.`, `Гэта лік ${n}.`, `Tohle je číslo ${n}.`, `This is the number ${n}.`) }, shuffle([...set]).map(x => ({ h: String(x), v: x })));
});

gen('arith', 'ynext', 1, d => {
  let a, st, len = 3;
  if (d <= 1) { st = 1; a = rnd(1, 12); } else if (d === 2) { st = -1; a = rnd(5, 15); } else if (d === 3) { st = 2; a = rnd(1, 10); } else if (d === 4) { st = pick([5, 10]); a = st * rnd(0, 4); } else { st = pick([-2, -5, -10]); a = -st * rnd(3, 5); }
  const seq = Array.from({ length: len }, (_, i) => a + i * st), ans = a + len * st;
  const vis = seq.map(x => `<span class="chip">${x}</span>`).join('') + '<span class="chip q">?</span>';
  return mkChoice({ text: t('Какое число дальше?', 'Які лік далей?', 'Které číslo je další?', 'Which number comes next?'), visual: vis, answer: ans, key: 'yn' + seq.join(','),
    hint: t('Посмотри, на сколько меняется каждое число.', 'Паглядзі, на колькі змяняецца кожны лік.', 'Podívej se, o kolik se každé číslo mění.', 'See how much each number changes.'),
    explain: t(`Дальше будет ${ans}.`, `Далей будзе ${ans}.`, `Další bude ${ans}.`, `Next comes ${ans}.`) }, numOpts(ans));
});

gen('arith', 'yshare', 1, d => {
  const k = d <= 2 ? 2 : pick([2, 3, 4]), m = [rnd(1, 3), rnd(2, 4), rnd(2, 4), rnd(2, 5), rnd(3, 5)][d - 1], a = k * m, e = pick(EMO);
  return mkChoice({ text: t(`Раздели поровну на ${k} кучки. Сколько в каждой кучке?`, `Раздзялі пароўну на ${k} кучкі. Колькі ў кожнай кучцы?`, `Rozděl rovným dílem na ${k} hromádky. Kolik je v každé hromádce?`, `Share equally into ${k} piles. How many are in each pile?`),
    visual: eg(Array(a).fill(e), 36), answer: m, key: 'ysh' + e + a + '/' + k,
    hint: t('Раскладывай по одной штуке в каждую кучку по очереди.', 'Раскладвай па адной штуцы ў кожную кучку па чарзе.', 'Rozdávej po jednom kusu do každé hromádky postupně.', 'Deal one item at a time into each pile.'),
    explain: t(`${a} : ${k} = ${m}.`, `${a} : ${k} = ${m}.`, `${a} : ${k} = ${m}.`, `${a} ÷ ${k} = ${m}.`) }, numOpts(m));
});

gen('arith', 'ymiss', 1, d => {
  const T = [5, 7, 10, 10, 12][d - 1], a = rnd(1, T - 1), c = T - a, e = pick(EMO);
  return mkChoice({ text: t(`Сколько добавить, чтобы стало ${T}?`, `Колькі дадаць, каб стала ${T}?`, `Kolik přidat, aby jich bylo ${T}?`, `How many more to make ${T}?`),
    visual: eg(Array(a).fill(e), 36), answer: c, key: 'ym2' + e + a + '>' + T,
    hint: t('Досчитай от числа, которое уже есть, до нужного.', 'Дасчытай ад ліку, які ўжо ёсць, да патрэбнага.', 'Dopočítej od čísla, které už máš, k tomu potřebnému.', 'Count on from the number you already have to the one you need.'),
    explain: t(`${a} + ${c} = ${T}.`, `${a} + ${c} = ${T}.`, `${a} + ${c} = ${T}.`, `${a} + ${c} = ${T}.`) }, numOpts(c));
});

/* ---------- пространство: фигуры ---------- */
const SHAPES = {
  circle: c => `<svg viewBox="0 0 48 48" width="56" height="56"><circle cx="24" cy="24" r="19" fill="${c}" stroke="#2a2562" stroke-width="3"/></svg>`,
  square: c => `<svg viewBox="0 0 48 48" width="56" height="56"><rect x="6" y="6" width="36" height="36" rx="2" fill="${c}" stroke="#2a2562" stroke-width="3"/></svg>`,
  triangle: c => `<svg viewBox="0 0 48 48" width="56" height="56"><polygon points="24,5 44,42 4,42" fill="${c}" stroke="#2a2562" stroke-width="3" stroke-linejoin="round"/></svg>`,
  rectangle: c => `<svg viewBox="0 0 48 48" width="56" height="56"><rect x="3" y="12" width="42" height="24" rx="2" fill="${c}" stroke="#2a2562" stroke-width="3"/></svg>`,
};
const SHAPE_WORD = { circle: ['круг', 'круг', 'kruh', 'circle'], square: ['квадрат', 'квадрат', 'čtverec', 'square'], triangle: ['треугольник', 'трохкутнік', 'trojúhelník', 'triangle'], rectangle: ['прямоугольник', 'прамавугольнік', 'obdélník', 'rectangle'] };
gen('geom', 'yshape', 1, d => {
  const kinds = shuffle(Object.keys(SHAPES)), target = pick(kinds), cols = ['#ff8a8a', '#ffd166', '#7be0b4', '#7db8ff', '#c9a6ff'], same = d >= 3, one = pick(cols);
  const w = SHAPE_WORD[target], word = t(w[0], w[1], w[2], w[3]);
  return mkChoice({ text: t(`Найди ${target === 'circle' ? 'круг' : target === 'square' ? 'квадрат' : target === 'triangle' ? 'треугольник' : 'прямоугольник'}`, `Знайдзі ${w[1]}`, `Najdi ${w[2]}`, `Find the ${w[3]}`),
    answer: target, big: true, key: 'ysh' + target + kinds.join(),
    hint: t('Посчитай углы и посмотри, какие у фигуры стороны.', 'Падлічы вуглы і паглядзі, якія ў фігуры бакі.', 'Spočítej rohy a podívej se, jaké má tvar strany.', 'Count the corners and look at the sides.'),
    explain: t(`Это ${word}.`, `Гэта ${word}.`, `Tohle je ${word}.`, `This is the ${word}.`) }, kinds.map((k, i) => ({ h: SHAPES[k](same ? one : cols[(i + rnd(0, 4)) % 5]), v: k })));
});

/* ---------- внимание: найди такую же ---------- */
gen('attention', 'ymatch', 1, d => {
  const fam = d >= 3 ? pick([ANIM, FRUIT, SWEET]) : EMO, ans = pick(fam), bad = shuffle(fam.filter(x => x !== ans)).slice(0, 3);
  return mkChoice({ text: t('Найди такую же картинку', 'Знайдзі такую ж карцінку', 'Najdi stejný obrázek', 'Find the same picture'), visual: eg([ans], 70), answer: ans, big: true, key: 'ym3' + ans + bad.join(''),
    hint: t('Сравни мелкие детали: уши, глаза, цвет.', 'Параўнай дробныя дэталі: вушы, вочы, колер.', 'Porovnej drobné detaily: uši, oči, barvu.', 'Compare small details: ears, eyes, colour.'),
    explain: t('Эта картинка точно такая же.', 'Гэта карцінка дакладна такая ж.', 'Tenhle obrázek je úplně stejný.', 'This picture is exactly the same.') }, shuffle([ans, ...bad]).map(x => ({ h: x, v: x })));
});
})();
