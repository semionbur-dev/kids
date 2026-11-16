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
})();
