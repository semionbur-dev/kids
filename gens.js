'use strict';
/* Генераторы задач на 4 языках: ru, be, cs, en.
   Каждый генератор: (сложность 1..5) -> вопрос
   вопрос = {type:'choice'|'num', text, visual?, choices?:[{h,v}], answer, hint, explain, big?, key?}      */
(() => {
const LANGS = ['ru', 'be', 'cs', 'en'];
let LANG = 'ru';
const t = (ru, be, cs, en) => ({ ru, be, cs, en })[LANG];
/* Источник случайности подменяемый: с одним «зерном» генератор выдаёт одно и то же задание на любом языке
   (нужно для кнопки «не понял» в двуязычном режиме). Без зерна — обычный Math.random. */
let RNG = Math.random;
const rand = () => RNG();
const mulberry32 = a => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const withSeed = (seed, fn) => { const prev = RNG; RNG = mulberry32(seed); try { return fn(); } finally { RNG = prev; } };
const withLang = (lang, fn) => { const prev = LANG; LANG = LANGS.includes(lang) ? lang : 'ru'; try { return fn(); } finally { LANG = prev; } };
const generate = (g, d, seed, lang) => withSeed(seed, () => withLang(lang, () => g.make(d)));
const rnd = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = a => a[rnd(0, a.length - 1)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const frac = (n, d) => `<span class="fr"><i>${n}</i><i>${d}</i></span>`;
const BL = '<span class="blank">?</span>';
const CM = () => t('см', 'см', 'cm', 'cm');
const csN = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);   // чешское склонение после числительных

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
const txtOpts = (ok, bad) => shuffle([ok, ...bad]).map(x => ({ h: esc(x), v: x }));

/* ======================== АРИФМЕТИКА ======================== */
gen('arith', 'add', 1, d => {
  let a, b;
  if (d === 1) { a = rnd(3, 12); b = rnd(3, 9); }
  else if (d === 2) { a = rnd(12, 68); b = rnd(11, 29); }
  else if (d === 3) { a = rnd(120, 560); b = rnd(35, 390); }
  else { a = rnd(340, 2400); b = rnd(180, 2400); }
  const ans = a + b;
  return byD(d, { text: `${a} + ${b} = ?`, answer: ans,
    hint: t('Складывай по разрядам: сначала единицы, потом десятки, потом сотни.', 'Складай па разрадах: спачатку адзінкі, потым дзясяткі, потым сотні.',
      'Sčítej po řádech: nejdřív jednotky, pak desítky, pak stovky.', 'Add by place value: ones first, then tens, then hundreds.'), explain: `${a} + ${b} = ${ans}` }, numOpts(ans));
});

gen('arith', 'sub', 1, d => {
  let a, b;
  if (d === 1) { a = rnd(8, 20); b = rnd(2, a - 3); }
  else if (d === 2) { a = rnd(30, 99); b = rnd(11, a - 8); }
  else if (d === 3) { a = rnd(200, 999); b = rnd(40, a - 30); }
  else { a = rnd(1000, 5000); b = rnd(200, a - 100); }
  const ans = a - b;
  return byD(d, { text: `${a} − ${b} = ?`, answer: ans,
    hint: t('Вычитай по разрядам. Можно сначала вычесть десятки, потом единицы.', 'Адымай па разрадах. Можна спачатку адняць дзясяткі, потым адзінкі.',
      'Odčítej po řádech. Můžeš nejdřív odečíst desítky a potom jednotky.', 'Subtract by place value. You can take away the tens first, then the ones.'), explain: `${a} − ${b} = ${ans}` }, numOpts(ans));
});

gen('arith', 'mul', 1, d => {
  let a, b;
  if (d === 1) { a = rnd(2, 5); b = rnd(2, 9); }
  else if (d === 2) { a = rnd(2, 9); b = rnd(2, 9); }
  else if (d === 3) { a = rnd(11, 25); b = rnd(2, 5); }
  else if (d === 4) { a = rnd(12, 49); b = rnd(3, 9); }
  else { a = rnd(25, 99); b = rnd(3, 9); }
  if (rand() < 0.5) [a, b] = [b, a];
  const ans = a * b;
  return byD(d, { text: `${a} × ${b} = ?`, answer: ans,
    hint: d <= 2 ? t('Вспомни таблицу умножения. Умножение — это сложение одинаковых чисел.', 'Успомні табліцу множання. Множанне — гэта складанне аднолькавых лікаў.',
      'Vzpomeň si na násobilku. Násobení je opakované sčítání stejných čísel.', 'Remember the times table. Multiplying is adding the same number again and again.')
      : t('Разбей большое число на десятки и единицы: 14 × 3 = 10 × 3 + 4 × 3.', 'Падзялі вялікі лік на дзясяткі і адзінкі: 14 × 3 = 10 × 3 + 4 × 3.',
        'Rozlož velké číslo na desítky a jednotky: 14 × 3 = 10 × 3 + 4 × 3.', 'Split the big number into tens and ones: 14 × 3 = 10 × 3 + 4 × 3.'),
    explain: `${a} × ${b} = ${ans}` }, numOpts(ans, [ans + a, ans - b]));
});

gen('arith', 'div', 1, d => {
  let a, b, c;
  if (d === 4) {
    b = rnd(3, 9); c = rnd(4, 12); const r = rnd(1, b - 1); a = b * c + r;
    return mkNum({ text: t(`Сколько целых раз ${b} помещается в ${a}?`, `Колькі поўных разоў ${b} змяшчаецца ў ${a}?`, `Kolikrát se ${b} celé vejde do ${a}?`, `How many whole times does ${b} fit into ${a}?`), answer: c,
      hint: t(`Найди самое большое число, которое при умножении на ${b} не больше ${a}.`, `Знайдзі найбольшы лік, які пры множанні на ${b} не большы за ${a}.`,
        `Najdi největší číslo, které po vynásobení ${b} není větší než ${a}.`, `Find the biggest number that, multiplied by ${b}, is not more than ${a}.`),
      explain: t(`${b} × ${c} = ${b * c}, а ${b} × ${c + 1} = ${b * (c + 1)} — это уже больше ${a}.`, `${b} × ${c} = ${b * c}, а ${b} × ${c + 1} = ${b * (c + 1)} — гэта ўжо больш за ${a}.`,
        `${b} × ${c} = ${b * c}, ale ${b} × ${c + 1} = ${b * (c + 1)} je už víc než ${a}.`, `${b} × ${c} = ${b * c}, but ${b} × ${c + 1} = ${b * (c + 1)} is already more than ${a}.`) });
  }
  if (d === 1) { b = rnd(2, 5); c = rnd(2, 9); }
  else if (d === 2) { b = rnd(2, 9); c = rnd(2, 9); }
  else if (d === 3) { b = rnd(2, 6); c = rnd(11, 30); }
  else { b = rnd(3, 9); c = rnd(40, 150); }
  a = b * c;
  return byD(d, { text: `${a} ÷ ${b} = ?`, answer: c,
    hint: t(`Подумай: на какое число нужно умножить ${b}, чтобы получить ${a}?`, `Падумай: на які лік трэба памножыць ${b}, каб атрымаць ${a}?`,
      `Čím je potřeba vynásobit ${b}, aby vyšlo ${a}?`, `What do you multiply ${b} by to get ${a}?`),
    explain: t(`${b} × ${c} = ${a}, значит ${a} ÷ ${b} = ${c}`, `${b} × ${c} = ${a}, значыць ${a} ÷ ${b} = ${c}`, `${b} × ${c} = ${a}, takže ${a} ÷ ${b} = ${c}`, `${b} × ${c} = ${a}, so ${a} ÷ ${b} = ${c}`) }, numOpts(c));
});

gen('arith', 'missing', 1, d => {
  const k = d <= 2 ? 20 : d === 3 ? 100 : 500;
  const tp = rnd(0, d === 1 ? 2 : 3);
  let text, x, hint;
  if (tp === 0) { const a = rnd(2, k >> 1); x = rnd(2, k >> 1); text = `${a} + ${BL} = ${a + x}`; hint = t(`Вычти: ${a + x} − ${a}.`, `Аднімі: ${a + x} − ${a}.`, `Odečti: ${a + x} − ${a}.`, `Subtract: ${a + x} − ${a}.`); }
  else if (tp === 1) { const a = rnd(2, k >> 1); x = rnd(a + 2, k); text = `${BL} − ${a} = ${x - a}`; hint = t(`Прибавь ${a} к ${x - a}.`, `Дадай ${a} да ${x - a}.`, `Přičti ${a} k ${x - a}.`, `Add ${a} to ${x - a}.`); }
  else if (tp === 2) { x = rnd(2, k >> 1); const a = rnd(x + 2, k); text = `${a} − ${BL} = ${a - x}`; hint = t(`Вычти ${a - x} из ${a}.`, `Аднімі ${a - x} ад ${a}.`, `Odečti ${a - x} od ${a}.`, `Subtract ${a - x} from ${a}.`); }
  else { const a = rnd(2, 9); x = rnd(2, 9); text = `${a} × ${BL} = ${a * x}`; hint = t(`Раздели ${a * x} на ${a}.`, `Падзялі ${a * x} на ${a}.`, `Vyděl ${a * x} číslem ${a}.`, `Divide ${a * x} by ${a}.`); }
  return byD(d, { text, answer: x, hint, explain: t(`Пропущено число ${x}`, `Прапушчаны лік ${x}`, `Chybí číslo ${x}`, `The missing number is ${x}`) }, numOpts(x));
});

gen('arith', 'word', 1, d => {
  const T = [
    () => { const a = rnd(8, 20) * (d > 2 ? rnd(2, 4) : 1), b = rnd(2, a - 3);
      return [t(`У девочки было ${a} конфет. Она отдала подруге ${b}. Сколько конфет осталось?`, `У дзяўчынкі было ${a} цукерак. Яна аддала сяброўцы ${b}. Колькі цукерак засталося?`,
        `Holčička měla ${a} bonbónů. Kamarádce jich dala ${b}. Kolik bonbónů jí zbylo?`, `A girl had ${a} sweets. She gave ${b} to a friend. How many sweets are left?`), a - b, `${a} − ${b}`]; },
    () => { const k = d <= 2 ? rnd(2, 5) : rnd(4, 9), m = d <= 2 ? rnd(2, 6) : rnd(6, 15);
      return [t(`В ${k} коробках лежит по ${m} карандашей. Сколько всего карандашей?`, `У ${k} каробках ляжыць па ${m} алоўкаў. Колькі ўсяго алоўкаў?`,
        `Každá krabice obsahuje ${m} ${csN(m, 'tužku', 'tužky', 'tužek')}. Krabic je ${k}. Kolik tužek je celkem?`, `There are ${k} boxes with ${m} pencils in each box. How many pencils are there in total?`), k * m, `${k} × ${m}`]; },
    () => { const k = rnd(2, 6), m = d <= 2 ? rnd(2, 6) : rnd(5, 14), n = k * m;
      return [t(`${n} яблок разложили поровну на ${k} тарелок. Сколько яблок на одной тарелке?`, `${n} яблыкаў раскладзена пароўну на ${k} талерак. Колькі яблыкаў на адной талерцы?`,
        `Máme ${n} ${csN(n, 'jablko', 'jablka', 'jablek')}. Rozdělíme je rovným dílem na ${k} ${csN(k, 'talíř', 'talíře', 'talířů')}. Kolik jablek bude na jednom talíři?`,
        `${n} apples are shared equally between ${k} plates. How many apples are on one plate?`), m, `${n} ÷ ${k}`]; },
    () => { const a = rnd(10, 18) * (d > 2 ? 2 : 1), b = rnd(8, 16) * (d > 2 ? 2 : 1), c = rnd(3, 9);
      return [t(`В классе ${a} девочек и ${b} мальчиков. ${c} ребят ушли домой. Сколько ребят осталось?`, `У класе ${a} дзяўчынак і ${b} хлопчыкаў. ${c} дзяцей пайшлі дадому. Колькі дзяцей засталося?`,
        `Ve třídě je ${a} dívek a ${b} chlapců. Počet dětí, které odešly domů: ${c}. Kolik dětí ve třídě zůstalo?`, `A class has ${a} girls and ${b} boys. ${c} children go home. How many children are left?`), a + b - c, `${a} + ${b} − ${c}`]; },
    () => { const p = rnd(30, 90) * (d > 2 ? 2 : 1), x = rnd(5, 25);
      return [t(`Книга стоит ${p} рублей, а тетрадь на ${x} рублей дешевле. Сколько стоят книга и тетрадь вместе?`, `Кніга каштуе ${p} рублёў, а сшытак на ${x} рублёў танней. Колькі каштуюць кніга і сшытак разам?`,
        `Kniha stojí ${p} korun a sešit je o ${x} korun levnější. Kolik stojí kniha a sešit dohromady?`, `A book costs ${p} dollars and a notebook is ${x} dollars cheaper. How much do the book and the notebook cost together?`), p + (p - x), `${p} + (${p} − ${x})`]; },
    () => { const v = rnd(4, 9) * 10, tm = rnd(2, d > 2 ? 9 : 4);
      return [t(`Поезд едет со скоростью ${v} км/ч. Сколько километров он проедет за ${tm} ч?`, `Цягнік едзе са хуткасцю ${v} км/гадз. Колькі кіламетраў ён праедзе за ${tm} гадз?`,
        `Vlak jede rychlostí ${v} km/h. Kolik kilometrů ujede za ${tm} ${csN(tm, 'hodinu', 'hodiny', 'hodin')}?`, `A train travels at ${v} km/h. How many kilometres does it cover in ${tm} hours?`), v * tm, `${v} × ${tm}`]; },
    () => { const a = rnd(5, 12), x = rnd(2, 6);
      return [t(`Кате ${a} лет, а её брат старше на ${x}. Сколько лет им вместе?`, `Каці ${a} гадоў, а яе брат старэйшы на ${x}. Колькі гадоў ім разам?`,
        `Kateřině je ${a} let a její bratr je o ${x} ${csN(x, 'rok', 'roky', 'let')} starší. Kolik let je jim dohromady?`, `Kate is ${a} years old and her brother is ${x} years older. How old are they added together?`), a + (a + x), `${a} + ${a + x}`]; },
  ];
  const [text, ans, how] = pick(T)();
  return byD(d, { text, answer: ans, hint: t('Прочитай внимательно и реши: какое действие нужно — сложение, вычитание, умножение или деление?',
    'Прачытай уважліва і вырашы: якое дзеянне патрэбна — складанне, адніманне, множанне ці дзяленне?',
    'Přečti si zadání pozorně a rozhodni, jakou operaci potřebuješ: sčítání, odčítání, násobení, nebo dělení?',
    'Read carefully and decide which operation you need: addition, subtraction, multiplication or division?'), explain: `${how} = ${ans}` }, numOpts(ans));
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
  return mkChoice({ text: t('Какая часть фигуры закрашена?', 'Якая частка фігуры зафарбавана?', 'Jaká část obrazce je vybarvená?', 'What part of the shape is shaded?'),
    visual: (rand() < 0.5 || n > 8) ? barSVG(n, k) : pieSVG(n, k), answer: `${k}/${n}`,
    hint: t('Сосчитай, на сколько частей поделена фигура — это знаменатель. Сколько частей закрашено — это числитель.',
      'Падлічы, на колькі частак падзелена фігура — гэта назоўнік. Колькі частак зафарбавана — гэта лічнік.',
      'Spočítej, na kolik dílů je obrazec rozdělený – to je jmenovatel. Kolik dílů je vybarvených – to je čitatel.',
      'Count how many parts the shape is split into – that is the denominator. How many are shaded – that is the numerator.'),
    explain: t(`Всего ${n} частей, закрашено ${k}. Это ${k}/${n}.`, `Усяго ${n} частак, зафарбавана ${k}. Гэта ${k}/${n}.`,
      `Celkem ${n} dílů, vybarveno ${k}. To je ${k}/${n}.`, `There are ${n} parts in total and ${k} are shaded. That is ${k}/${n}.`) }, fracOpts(k, n));
});

gen('frac', 'fof', 1, d => {
  let a, b, m;
  if (d === 1) { b = pick([2, 3, 4]); a = 1; m = b * rnd(2, 6); }
  else if (d === 2) { b = pick([2, 3, 4, 5]); a = rnd(1, b - 1); m = b * rnd(2, 6); }
  else if (d === 3) { b = rnd(3, 8); a = rnd(1, b - 1); m = b * rnd(3, 9); }
  else { b = rnd(4, 10); a = rnd(1, b - 1); m = b * rnd(5, 12); }
  const ans = m / b * a;
  return byD(d, { text: t(`${frac(a, b)} от ${m} = ?`, `${frac(a, b)} ад ${m} = ?`, `${frac(a, b)} z ${m} = ?`, `${frac(a, b)} of ${m} = ?`), answer: ans,
    hint: t(`Раздели ${m} на ${b} равных частей — в одной части ${m / b}. Возьми ${a} таких части.`, `Падзялі ${m} на ${b} роўных частак — у адной частцы ${m / b}. Вазьмі ${a} такіх частак.`,
      `Rozděl ${m} na ${b} stejných dílů – v jednom dílu je ${m / b}. Vezmi ${a} takových dílů.`, `Split ${m} into ${b} equal parts – one part is ${m / b}. Take ${a} of those parts.`),
    explain: `${m} ÷ ${b} = ${m / b}, ${m / b} × ${a} = ${ans}` }, numOpts(ans, [m / b]));
});

gen('frac', 'fcmp', 1, d => {
  let a, b, c, e, hint;
  const mode = d <= 2 ? pick([0, 1]) : pick([0, 1, 2, 3]);
  if (mode === 0) { b = e = rnd(3, d <= 2 ? 8 : 12); do { a = rnd(1, b - 1); c = rnd(1, b - 1); } while (d <= 2 && a === c);
    hint = t('Знаменатели одинаковые — больше та дробь, у которой больше числитель.', 'Назоўнікі аднолькавыя — большая тая дроб, у якой большы лічнік.',
      'Jmenovatelé jsou stejní – větší je zlomek s větším čitatelem.', 'The denominators are the same – the fraction with the bigger numerator is bigger.'); }
  else if (mode === 1) { a = c = rnd(1, 3); b = rnd(a + 1, 10); do { e = rnd(a + 1, 10); } while (e === b);
    hint = t('Числители одинаковые. Чем на большее число частей разрезан торт, тем меньше каждый кусочек!', 'Лічнікі аднолькавыя. Чым на больш частак разрэзаны торт, тым меншы кожны кавалачак!',
      'Čitatelé jsou stejní. Čím na víc dílů je dort rozřezaný, tím menší je každý kousek!', 'The numerators are the same. The more pieces a cake is cut into, the smaller each piece is!'); }
  else if (mode === 2) { b = rnd(3, 12); a = rnd(1, b - 1); c = 1; e = 2;
    hint = t('Сравни каждую дробь с половинкой (1/2).', 'Параўнай кожны дроб з паловай (1/2).', 'Porovnej každý zlomek s polovinou (1/2).', 'Compare each fraction with one half (1/2).'); }
  else { const n = rnd(1, 4), m = rnd(n + 1, 6), k = rnd(2, 4); a = n; b = m; c = n * k + pick([-1, 0, 0, 1]); e = m * k;
    if (c < 1 || c >= e) c = n * k;
    hint = t('Приведи дроби к одинаковому знаменателю.', 'Прывядзі дробы да адзінага назоўніка.', 'Převeď zlomky na společného jmenovatele.', 'Convert the fractions to a common denominator.'); }
  if (rand() < 0.5) { [a, c] = [c, a]; [b, e] = [e, b]; }
  const s = Math.sign(a * e - c * b), ans = s < 0 ? '<' : s > 0 ? '>' : '=';
  return mkChoice({ text: `${t('Сравни', 'Параўнай', 'Porovnej', 'Compare')}: ${frac(a, b)} ${BL} ${frac(c, e)}`, answer: ans, hint, explain: `${a}/${b} ${ans} ${c}/${e}`, wide: true },
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
  return mkChoice({ text: `${t('Сравни', 'Параўнай', 'Porovnej', 'Compare')}: ${e1} ${BL} ${e2}`, answer: ans,
    hint: t('Сначала вычисли значения обоих выражений, потом сравнивай.', 'Спачатку вылічы значэнні абодвух выразаў, потым параўноўвай.',
      'Nejdřív spočítej hodnoty obou výrazů, potom porovnávej.', 'First work out both expressions, then compare.'),
    explain: `${e1} = ${v1}, ${e2} = ${v2}. ${v1} ${ans} ${v2}`, wide: true }, ['<', '=', '>'].map(x => ({ h: x, v: x })));
});

gen('frac', 'ops', 2, d => {
  let s, v, wrong, hint;
  if (d <= 2) { const a = rnd(2, 20), b = rnd(2, 9), c = rnd(2, 9); s = `${a} + ${b} × ${c}`; v = a + b * c; wrong = (a + b) * c;
    hint = t('Умножение выполняется раньше сложения!', 'Множанне выконваецца раней за складанне!', 'Násobení se počítá dřív než sčítání!', 'Multiplication comes before addition!'); }
  else if (d === 3) { const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9); s = `(${a} + ${b}) × ${c}`; v = (a + b) * c; wrong = a + b * c;
    hint = t('Сначала считай то, что в скобках.', 'Спачатку лічы тое, што ў дужках.', 'Nejdřív počítej to, co je v závorce.', 'Work out the brackets first.'); }
  else if (d === 4) { const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9), e = rnd(2, 9); s = `${a} × ${b} + ${c} × ${e}`; v = a * b + c * e; wrong = (a * b + c) * e;
    hint = t('Сначала оба умножения, потом сложение.', 'Спачатку абодва множанні, потым складанне.', 'Nejdřív obě násobení, potom sčítání.', 'Both multiplications first, then the addition.'); }
  else { const a = rnd(10, 30), b = rnd(2, 9), c = rnd(2, 6), f = rnd(2, 6), g = rnd(2, 9), e = f * g; s = `(${a} − ${b}) × ${c} + ${e} ÷ ${f}`; v = (a - b) * c + g; wrong = (a - b) * c + e;
    hint = t('Скобки → умножение и деление → сложение.', 'Дужкі → множанне і дзяленне → складанне.', 'Závorky → násobení a dělení → sčítání.', 'Brackets → multiplication and division → addition.'); }
  const q = { text: `${s} = ?`, answer: v, hint, explain: `${s} = ${v}` };
  return d <= 3 ? mkChoice(q, numOpts(v, [wrong])) : mkNum(q);
});

gen('frac', 'equiv', 2, d => {
  const m = rnd(2, 6), n = rnd(1, m - 1), k = rnd(2, d <= 3 ? 4 : 6);
  if (d <= 3 || rand() < 0.5)
    return byD(d, { text: `${frac(n, m)} = ${frac(BL, m * k)}`, answer: n * k,
      hint: t(`Знаменатель умножили на ${k}. Умножь на ${k} и числитель.`, `Назоўнік памножылі на ${k}. Памнож на ${k} і лічнік.`,
        `Jmenovatele jsme vynásobili ${k}. Vynásob ${k} i čitatele.`, `The denominator was multiplied by ${k}. Multiply the numerator by ${k} too.`), explain: `${n} × ${k} = ${n * k}` }, numOpts(n * k));
  return mkNum({ text: `${frac(n * k, m * k)} = ${frac(BL, m)}`, answer: n,
    hint: t(`Раздели числитель и знаменатель на одно и то же число (${k}).`, `Падзялі лічнік і назоўнік на адзін і той жа лік (${k}).`,
      `Vyděl čitatele i jmenovatele stejným číslem (${k}).`, `Divide the numerator and the denominator by the same number (${k}).`), explain: `${n * k} ÷ ${k} = ${n}` });
});

/* ======================== ЛОГИКА ======================== */
const SEQS = [];
SEQS.push(
  { d: 1, f: () => { const s = pick([2, 3, 4, 5, 10]), a = rnd(1, 15); return { t: [0, 1, 2, 3, 4, 5].map(i => a + s * i),
    h: t(`Каждое число больше предыдущего на ${s}.`, `Кожны лік большы за папярэдні на ${s}.`, `Každé číslo je o ${s} větší než předchozí.`, `Each number is ${s} more than the one before.`) }; } },
  { d: 2, f: () => { const s = rnd(2, 7), a = rnd(35, 60); return { t: [0, 1, 2, 3, 4, 5].map(i => a - s * i),
    h: t(`Числа уменьшаются на ${s}.`, `Лікі змяншаюцца на ${s}.`, `Čísla klesají o ${s}.`, `The numbers go down by ${s}.`) }; } },
  { d: 2, f: () => { const a = rnd(1, 4); return { t: [0, 1, 2, 3, 4, 5].map(i => a * 2 ** i),
    h: t('Каждое число вдвое больше предыдущего.', 'Кожны лік удвая большы за папярэдні.', 'Každé číslo je dvakrát větší než předchozí.', 'Each number is double the one before.') }; } },
  { d: 3, f: () => { const x = rnd(1, 3); let y; do { y = rnd(2, 5); } while (y === x); const tt = [rnd(1, 10)]; for (let i = 1; i < 6; i++) tt.push(tt[i - 1] + (i % 2 ? x : y));
    return { t: tt, h: t(`Прибавляют по очереди ${x} и ${y}.`, `Дадаюць па чарзе ${x} і ${y}.`, `Střídavě se přičítá ${x} a ${y}.`, `Add ${x} and ${y} in turn.`) }; } },
  { d: 3, f: () => { const o = rnd(0, 3); return { t: [1, 2, 3, 4, 5, 6].map(i => (i + o) ** 2),
    h: t('Это квадраты чисел: 1×1, 2×2, 3×3…', 'Гэта квадраты лікаў: 1×1, 2×2, 3×3…', 'Jsou to druhé mocniny: 1×1, 2×2, 3×3…', 'These are square numbers: 1×1, 2×2, 3×3…') }; } },
  { d: 3, f: () => { const a = rnd(1, 4); return { t: [0, 1, 2, 3, 4, 5].map(i => a * 3 ** i),
    h: t('Каждое число втрое больше предыдущего.', 'Кожны лік утрая большы за папярэдні.', 'Každé číslo je třikrát větší než předchozí.', 'Each number is three times the one before.') }; } },
  { d: 4, f: () => { const tt = [rnd(1, 5), rnd(2, 6)]; for (let i = 2; i < 6; i++) tt.push(tt[i - 1] + tt[i - 2]);
    return { t: tt, h: t('Каждое число — сумма двух предыдущих.', 'Кожны лік — сума двух папярэдніх.', 'Každé číslo je součet dvou předchozích.', 'Each number is the sum of the two before it.') }; } },
  { d: 4, f: () => { const tt = [rnd(1, 10)]; for (let i = 1; i < 6; i++) tt.push(tt[i - 1] + i);
    return { t: tt, h: t('Прибавляют 1, потом 2, потом 3, потом 4…', 'Дадаюць 1, потым 2, потым 3, потым 4…', 'Přičítá se 1, potom 2, potom 3, potom 4…', 'Add 1, then 2, then 3, then 4…') }; } },
  { d: 5, f: () => { const a = rnd(1, 9), s = rnd(2, 5), c = rnd(20, 40), u = rnd(2, 6); return { t: [a, c, a + s, c + u, a + 2 * s, c + 2 * u],
    h: t('Здесь два ряда вперемешку: числа на нечётных и на чётных местах.', 'Тут два рады ўперамешку: лікі на няцотных і на цотных месцах.',
      'Jsou tu dvě řady promíchané: čísla na lichých a na sudých místech.', 'Two sequences are mixed together: the numbers in odd places and in even places.') }; } },
  { d: 5, f: () => { const tt = [rnd(1, 3)]; for (let i = 1; i < 6; i++) tt.push(tt[i - 1] * 2 + 1);
    return { t: tt, h: t('Умножь число на 2 и прибавь 1.', 'Памнож лік на 2 і дадай 1.', 'Vynásob číslo dvěma a přičti 1.', 'Multiply the number by 2 and add 1.') }; } },
);
gen('logic', 'seq', 1, d => {
  const s = pick(SEQS.filter(x => x.d <= d && x.d >= Math.max(1, d - 1))), { t: tt, h } = s.f();
  const hide = (d >= 2 && rand() < 0.3) ? 4 : 5;
  const vis = tt.map((x, i) => `<span class="chip${i === hide ? ' q' : ''}">${i === hide ? '?' : x}</span>`).join('');
  return byD(d, { text: t('Какое число пропущено?', 'Які лік прапушчаны?', 'Které číslo chybí?', 'Which number is missing?'), visual: vis, answer: tt[hide], hint: h,
    explain: t(`Пропущено число ${tt[hide]}.`, `Прапушчаны лік ${tt[hide]}.`, `Chybí číslo ${tt[hide]}.`, `The missing number is ${tt[hide]}.`) }, numOpts(tt[hide]));
});

gen('logic', 'machine', 2, d => {
  const k = d <= 2 ? 1 : rnd(2, 3), c = d <= 2 ? rnd(2, 9) : rnd(0, 4), f = x => k * x + c;
  const xs = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4), ex = xs.slice(0, 3), x = xs[3];
  const vis = ex.map(e => `<span class="chip">${e} → ${f(e)}</span>`).join('');
  const rule = `${k === 1 ? '' : `×${k} `}${c ? `+${c}` : ''}`;
  return byD(d, { text: t(`Волшебная машина меняет числа по одному правилу. Какое число получится из ${x}?`, `Чароўная машына мяняе лікі па адным правіле. Які лік атрымаецца з ${x}?`,
    `Kouzelný stroj mění čísla podle jednoho pravidla. Které číslo vyjde z ${x}?`, `A magic machine changes numbers by one rule. Which number comes out of ${x}?`), visual: vis, answer: f(x),
    hint: k === 1 ? t(`К числу прибавляют ${c}.`, `Да ліку дадаюць ${c}.`, `K číslu se přičítá ${c}.`, `${c} is added to the number.`)
      : t(`Число умножают на ${k}${c ? ` и прибавляют ${c}` : ''}.`, `Лік памнажаюць на ${k}${c ? ` і дадаюць ${c}` : ''}.`, `Číslo se násobí ${k}${c ? ` a přičítá se ${c}` : ''}.`, `The number is multiplied by ${k}${c ? ` and ${c} is added` : ''}.`),
    explain: `${t('Правило', 'Правіла', 'Pravidlo', 'Rule')}: ${rule}. ${x} → ${f(x)}` }, numOpts(f(x)));
});

const CATS = [
  [['животные', 'жывёлы', 'zvířata', 'animals'], ['🐶', '🐱', '🐰', '🐻', '🦁', '🐸', '🐵', '🐷']],
  [['фрукты', 'садавіна', 'ovoce', 'fruits'], ['🍎', '🍌', '🍇', '🍓', '🍒', '🍉', '🍊', '🍍']],
  [['транспорт', 'транспарт', 'dopravní prostředky', 'vehicles'], ['🚗', '🚌', '🚲', '✈️', '🚂', '🚢', '🚀', '🚁']],
  [['сладости', 'прысмакі', 'sladkosti', 'sweets'], ['🍩', '🍪', '🍦', '🍫', '🍬', '🧁', '🍭']],
  [['овощи', 'гародніна', 'zelenina', 'vegetables'], ['🥕', '🌽', '🥦', '🍆', '🥒', '🥔']],
  [['одежда', 'адзенне', 'oblečení', 'clothes'], ['👕', '👖', '🧦', '🧤', '🧢', '👗']],
];
gen('logic', 'odd', 1, d => {
  if (d >= 2 && rand() < 0.5) {
    const k = d === 2 ? 2 : d === 3 ? pick([3, 5]) : pick([4, 6, 7, 8]);
    const mult = []; while (mult.length < 3) { const m = k * rnd(Math.ceil(10 / k), Math.floor(99 / k)); if (!mult.includes(m)) mult.push(m); }
    let odd, explain; const flip = d === 2 && rand() < 0.5;
    if (d === 2) {
      const grp = flip ? mult.map(m => m + 1) : mult;
      do { odd = flip ? rnd(5, 49) * 2 : rnd(5, 49) * 2 + 1; } while (grp.includes(odd));
      mult.splice(0, 3, ...grp);
      explain = flip ? t(`Остальные числа нечётные, а ${odd} — чётное.`, `Астатнія лікі няцотныя, а ${odd} — цотны.`, `Ostatní čísla jsou lichá, ${odd} je sudé.`, `The other numbers are odd; ${odd} is even.`)
        : t(`Остальные числа чётные, а ${odd} — нечётное.`, `Астатнія лікі цотныя, а ${odd} — няцотны.`, `Ostatní čísla jsou sudá, ${odd} je liché.`, `The other numbers are even; ${odd} is odd.`);
    } else {
      do { odd = pick(mult) + pick([-2, -1, 1, 2]); } while (odd % k === 0 || odd < 10);
      explain = t(`Остальные числа делятся на ${k}, а ${odd} — нет.`, `Астатнія лікі дзеляцца на ${k}, а ${odd} — не.`, `Ostatní čísla jsou dělitelná ${k}, ${odd} ne.`, `The other numbers are divisible by ${k}; ${odd} is not.`);
    }
    const items = shuffle([...mult, odd]);
    const text = d === 2 ? t('Какое число лишнее?', 'Які лік лішні?', 'Které číslo je navíc?', 'Which number does not belong?')
      : t('Какое число лишнее? (Подсказка: ищи, что общего у трёх чисел)', 'Які лік лішні? (Падказка: шукай, што агульнага ў трох лікаў)',
        'Které číslo je navíc? (Nápověda: hledej, co mají společného tři čísla)', 'Which number does not belong? (Hint: find what three of the numbers have in common)');
    return mkChoice({ text, key: 'n' + items.join(), answer: odd, hint: d === 2 ? t('Посмотри на последнюю цифру: чётные числа оканчиваются на 0, 2, 4, 6, 8.', 'Паглядзі на апошнюю лічбу: цотныя лікі канчаюцца на 0, 2, 4, 6, 8.',
      'Podívej se na poslední číslici: sudá čísla končí na 0, 2, 4, 6, 8.', 'Look at the last digit: even numbers end in 0, 2, 4, 6 or 8.')
      : t(`Проверь, какие числа делятся на ${k}.`, `Правярай, якія лікі дзеляцца на ${k}.`, `Zkontroluj, která čísla jsou dělitelná ${k}.`, `Check which numbers are divisible by ${k}.`), explain, big: false },
    items.map(x => ({ h: String(x), v: x })));
  }
  const [ca, cb] = shuffle(CATS).slice(0, 2), items = shuffle(ca[1]).slice(0, 3), odd = shuffle(cb[1])[0], cn = LANGS.indexOf(LANG);
  return mkChoice({ text: t('Какой предмет лишний?', 'Які прадмет лішні?', 'Který předmět je navíc?', 'Which item does not belong?'), key: 'e' + [...items, odd].sort().join(), answer: odd, big: true,
    hint: t('Подумай, что общего у трёх предметов из четырёх.', 'Падумай, што агульнага ў трох прадметаў з чатырох.', 'Zamysli se, co mají společného tři ze čtyř předmětů.', 'Think about what three of the four items have in common.'),
    explain: t(`Остальные — ${ca[0][cn]}.`, `Астатнія — ${ca[0][cn]}.`, `Ostatní jsou ${ca[0][cn]}.`, `The others are ${ca[0][cn]}.`) },
  shuffle([...items, odd]).map(x => ({ h: x, v: x })));
});

const DOTS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⭐', '❤️'];
gen('logic', 'pattern', 1, d => {
  const L = d <= 1 ? 2 : d === 2 ? pick([2, 3]) : pick([3, 4]), pal = shuffle(DOTS).slice(0, Math.min(L, d <= 1 ? 2 : 3));
  let unit; do { unit = Array.from({ length: L }, (_, i) => (i < pal.length ? pal[i] : pick(pal))); unit = shuffle(unit); } while (new Set(unit).size < 2);
  const r = rnd(1, L - 1), seq = []; for (let i = 0; i < L * 2 + r; i++) seq.push(unit[i % L]);
  const ans = unit[r % L];
  const ch = new Set(unit); for (const x of shuffle(DOTS)) { if (ch.size >= 4) break; ch.add(x); }
  const vis = seq.map(x => `<span class="chip">${x}</span>`).join('') + '<span class="chip q">?</span>';
  return mkChoice({ text: t('Что должно стоять следующим?', 'Што павінна стаяць наступным?', 'Co má být na řadě?', 'What comes next?'), visual: vis, answer: ans, big: true,
    hint: t('Найди, какая группа повторяется снова и снова.', 'Знайдзі, якая група паўтараецца зноў і зноў.', 'Najdi skupinu, která se pořád opakuje.', 'Find the group that keeps repeating.'),
    explain: t(`Повторяется группа ${unit.join(' ')}.`, `Паўтараецца група ${unit.join(' ')}.`, `Opakuje se skupina ${unit.join(' ')}.`, `The group ${unit.join(' ')} repeats.`) }, shuffle([...ch]).map(x => ({ h: x, v: x })));
});

const ANALOGY = {
  ru: [
    ['Птица', 'летать', 'Рыба', 'плавать', ['бегать', 'ползать', 'петь']], ['Рука', 'перчатка', 'Нога', 'ботинок', ['шапка', 'шарф', 'очки']],
    ['Глаза', 'видеть', 'Уши', 'слышать', ['дышать', 'говорить', 'нюхать']], ['День', 'ночь', 'Лето', 'зима', ['весна', 'тепло', 'солнце']],
    ['Кошка', 'котёнок', 'Собака', 'щенок', ['пёс', 'лай', 'кость']], ['Врач', 'больница', 'Учитель', 'школа', ['книга', 'урок', 'доска']],
    ['Карандаш', 'рисовать', 'Ножницы', 'резать', ['клеить', 'писать', 'шить']], ['Книга', 'читать', 'Музыка', 'слушать', ['смотреть', 'писать', 'рисовать']],
    ['Шапка', 'голова', 'Сапог', 'нога', ['рука', 'шея', 'ухо']], ['Холодный', 'горячий', 'Большой', 'маленький', ['огромный', 'высокий', 'толстый']],
    ['Лодка', 'вода', 'Самолёт', 'воздух', ['аэродром', 'крыло', 'земля']], ['Часы', 'время', 'Градусник', 'температура', ['тепло', 'болезнь', 'стекло']],
    ['Корова', 'молоко', 'Курица', 'яйцо', ['перо', 'цыплёнок', 'курятник']], ['Повар', 'кухня', 'Художник', 'мастерская', ['краски', 'картина', 'холст']],
    ['Мороз', 'зима', 'Жара', 'лето', ['солнце', 'пляж', 'осень']], ['Рыба', 'аквариум', 'Птица', 'клетка', ['гнездо', 'небо', 'перья']],
    ['Яблоко', 'фрукт', 'Морковь', 'овощ', ['сладкая', 'огород', 'оранжевая']], ['Утро', 'завтрак', 'Вечер', 'ужин', ['ночь', 'обед', 'сон']],
    ['Минута', '60 секунд', 'Час', '60 минут', ['24 часа', '100 минут', '30 минут']], ['Зубы', 'зубная щётка', 'Волосы', 'расчёска', ['шампунь', 'голова', 'ножницы']],
    ['Нога', 'ходить', 'Рука', 'хватать', ['бежать', 'прыгать', 'слушать']],
  ],
  be: [
    ['Птушка', 'лётаць', 'Рыба', 'плаваць', ['бегаць', 'поўзаць', 'спяваць']], ['Рука', 'пальчатка', 'Нага', 'чаравік', ['шапка', 'шалік', 'акуляры']],
    ['Вочы', 'бачыць', 'Вушы', 'чуць', ['дыхаць', 'гаварыць', 'нюхаць']], ['Дзень', 'ноч', 'Лета', 'зіма', ['вясна', 'цёпла', 'сонца']],
    ['Кошка', 'кацяня', 'Сабака', 'шчаня', ['пёс', 'брэх', 'костка']], ['Урач', 'бальніца', 'Настаўнік', 'школа', ['кніга', 'урок', 'дошка']],
    ['Аловак', 'маляваць', 'Нажніцы', 'рэзаць', ['клеіць', 'пісаць', 'шыць']], ['Кніга', 'чытаць', 'Музыка', 'слухаць', ['глядзець', 'пісаць', 'маляваць']],
    ['Шапка', 'галава', 'Бот', 'нага', ['рука', 'шыя', 'вуха']], ['Халодны', 'гарачы', 'Вялікі', 'маленькі', ['вялізны', 'высокі', 'тоўсты']],
    ['Лодка', 'вада', 'Самалёт', 'паветра', ['аэрадром', 'крыло', 'зямля']], ['Гадзіннік', 'час', 'Градуснік', 'тэмпература', ['цяпло', 'хвароба', 'шкло']],
    ['Карова', 'малако', 'Курыца', 'яйка', ['пяро', 'кураня', 'курнік']], ['Кухар', 'кухня', 'Мастак', 'майстэрня', ['фарбы', 'карціна', 'палатно']],
    ['Мароз', 'зіма', 'Спёка', 'лета', ['сонца', 'пляж', 'восень']], ['Рыба', 'акварыум', 'Птушка', 'клетка', ['гняздо', 'неба', 'пёры']],
    ['Яблык', 'садавіна', 'Морква', 'гародніна', ['салодкая', 'агарод', 'аранжавая']], ['Раніца', 'сняданак', 'Вечар', 'вячэра', ['ноч', 'абед', 'сон']],
    ['Хвіліна', '60 секунд', 'Гадзіна', '60 хвілін', ['24 гадзіны', '100 хвілін', '30 хвілін']], ['Зубы', 'зубная шчотка', 'Валасы', 'расчоска', ['шампунь', 'галава', 'нажніцы']],
    ['Нага', 'хадзіць', 'Рука', 'хапаць', ['бегчы', 'скакаць', 'слухаць']],
  ],
  cs: [
    ['Pták', 'létat', 'Ryba', 'plavat', ['běhat', 'lézt', 'zpívat']], ['Ruka', 'rukavice', 'Noha', 'bota', ['čepice', 'šála', 'brýle']],
    ['Oči', 'vidět', 'Uši', 'slyšet', ['dýchat', 'mluvit', 'čichat']], ['Den', 'noc', 'Léto', 'zima', ['jaro', 'teplo', 'slunce']],
    ['Kočka', 'kotě', 'Pes', 'štěně', ['psisko', 'štěkání', 'kost']], ['Lékař', 'nemocnice', 'Učitel', 'škola', ['kniha', 'hodina', 'tabule']],
    ['Tužka', 'kreslit', 'Nůžky', 'stříhat', ['lepit', 'psát', 'šít']], ['Kniha', 'číst', 'Hudba', 'poslouchat', ['dívat se', 'psát', 'kreslit']],
    ['Čepice', 'hlava', 'Bota', 'noha', ['ruka', 'krk', 'ucho']], ['Studený', 'horký', 'Velký', 'malý', ['obrovský', 'vysoký', 'tlustý']],
    ['Loď', 'voda', 'Letadlo', 'vzduch', ['letiště', 'křídlo', 'země']], ['Hodiny', 'čas', 'Teploměr', 'teplota', ['teplo', 'nemoc', 'sklo']],
    ['Kráva', 'mléko', 'Slepice', 'vejce', ['pírko', 'kuře', 'kurník']], ['Kuchař', 'kuchyně', 'Malíř', 'ateliér', ['barvy', 'obraz', 'plátno']],
    ['Mráz', 'zima', 'Vedro', 'léto', ['slunce', 'pláž', 'podzim']], ['Ryba', 'akvárium', 'Pták', 'klec', ['hnízdo', 'nebe', 'peří']],
    ['Jablko', 'ovoce', 'Mrkev', 'zelenina', ['sladká', 'zahrada', 'oranžová']], ['Ráno', 'snídaně', 'Večer', 'večeře', ['noc', 'oběd', 'spánek']],
    ['Minuta', '60 sekund', 'Hodina', '60 minut', ['24 hodin', '100 minut', '30 minut']], ['Zuby', 'kartáček', 'Vlasy', 'hřeben', ['šampon', 'hlava', 'nůžky']],
    ['Noha', 'chodit', 'Ruka', 'chytat', ['běžet', 'skákat', 'poslouchat']],
  ],
  en: [
    ['Bird', 'fly', 'Fish', 'swim', ['run', 'crawl', 'sing']], ['Hand', 'glove', 'Foot', 'shoe', ['hat', 'scarf', 'glasses']],
    ['Eyes', 'see', 'Ears', 'hear', ['breathe', 'talk', 'smell']], ['Day', 'night', 'Summer', 'winter', ['spring', 'warm', 'sun']],
    ['Cat', 'kitten', 'Dog', 'puppy', ['bark', 'bone', 'wolf']], ['Doctor', 'hospital', 'Teacher', 'school', ['book', 'lesson', 'board']],
    ['Pencil', 'draw', 'Scissors', 'cut', ['glue', 'write', 'sew']], ['Book', 'read', 'Music', 'listen to', ['watch', 'write', 'draw']],
    ['Hat', 'head', 'Boot', 'foot', ['hand', 'neck', 'ear']], ['Cold', 'hot', 'Big', 'small', ['huge', 'tall', 'fat']],
    ['Boat', 'water', 'Plane', 'air', ['airport', 'wing', 'ground']], ['Clock', 'time', 'Thermometer', 'temperature', ['warmth', 'illness', 'glass']],
    ['Cow', 'milk', 'Hen', 'egg', ['feather', 'chick', 'coop']], ['Cook', 'kitchen', 'Painter', 'studio', ['paints', 'picture', 'canvas']],
    ['Frost', 'winter', 'Heat', 'summer', ['sun', 'beach', 'autumn']], ['Fish', 'aquarium', 'Bird', 'cage', ['nest', 'sky', 'feathers']],
    ['Apple', 'fruit', 'Carrot', 'vegetable', ['sweet', 'garden', 'orange']], ['Morning', 'breakfast', 'Evening', 'dinner', ['night', 'lunch', 'sleep']],
    ['Minute', '60 seconds', 'Hour', '60 minutes', ['24 hours', '100 minutes', '30 minutes']], ['Teeth', 'toothbrush', 'Hair', 'comb', ['shampoo', 'head', 'scissors']],
    ['Foot', 'walk', 'Hand', 'grab', ['run', 'jump', 'listen']],
  ],
};
gen('logic', 'analogy', 2, d => {
  const [a, b, c, ans, bad] = pick(ANALOGY[LANG]);
  return mkChoice({ text: `${a} : ${b} = ${c} : ${BL}`, answer: ans,
    hint: t(`Подумай, как связаны «${a}» и «${b}». Так же должны быть связаны «${c}» и ответ.`, `Падумай, як звязаныя «${a}» і «${b}». Гэтак жа павінны быць звязаныя «${c}» і адказ.`,
      `Zamysli se, jak spolu souvisí „${a}“ a „${b}“. Stejně mají souviset „${c}“ a odpověď.`, `Think about how "${a}" and "${b}" are connected. "${c}" and the answer must be connected in the same way.`),
    explain: t(`${a} → ${b}, так же ${c} → ${ans}.`, `${a} → ${b}, гэтак жа ${c} → ${ans}.`, `${a} → ${b}, stejně ${c} → ${ans}.`, `${a} → ${b}, in the same way ${c} → ${ans}.`) }, txtOpts(ans, bad));
});

const RIDDLES = {
  ru: [
    { d: 1, t: 'Что нельзя съесть на завтрак?', a: 'Обед и ужин', bad: ['Кашу', 'Яичницу', 'Бутерброд'], e: 'Обед и ужин — это другие приёмы пищи!' },
    { d: 1, t: 'Что тяжелее: килограмм ваты или килограмм железа?', a: 'Одинаково', bad: ['Вата', 'Железо', 'Невозможно узнать'], e: 'И там и там по одному килограмму.' },
    { d: 1, t: 'Сколько яиц можно съесть натощак?', a: 'Одно', bad: ['Два', 'Три', 'Ни одного'], e: 'После первого яйца ты уже не натощак.' },
    { d: 1, t: 'У каждой из двух сестёр есть один брат. Сколько всего детей в семье?', a: 3, e: 'Брат у них общий: 2 сестры + 1 брат = 3.' },
    { d: 1, t: 'У палки 2 конца. Сколько концов у трёх палок?', a: 6, e: '3 × 2 = 6.' },
    { d: 1, t: 'Сколько ушей у трёх мышей?', a: 6, e: '3 × 2 = 6.' },
    { d: 1, t: 'Что можно увидеть с закрытыми глазами?', a: 'Сон', bad: ['Книгу', 'Радугу', 'Луну'], e: 'Сны мы видим как раз с закрытыми глазами.' },
    { d: 2, t: 'Если позавчера была суббота, то какой день недели будет завтра?', a: 'Вторник', bad: ['Понедельник', 'Среда', 'Воскресенье'], e: 'Позавчера — суббота, вчера — воскресенье, сегодня — понедельник, завтра — вторник.' },
    { d: 2, t: 'Сколько месяцев в году имеют 28 дней?', a: 'Все 12', bad: ['Только февраль', 'Ни одного', 'Два'], e: 'В каждом месяце есть 28 дней (и ещё, возможно, несколько).' },
    { d: 2, t: 'У Пети 3 брата и 1 сестра. Сколько всего детей в семье?', a: 5, e: 'Сам Петя + 3 брата + 1 сестра = 5.' },
    { d: 2, t: 'Сколько раз нужно разрезать верёвку, чтобы получилось 5 кусков?', a: 4, e: 'Один разрез — 2 куска, два разреза — 3 куска… четыре разреза — 5 кусков.' },
    { d: 2, t: 'Петя родился в 2015 году, а Вася — в 2013. Кто из них старше?', a: 'Вася', bad: ['Петя', 'Они близнецы', 'Нельзя узнать'], e: 'Вася родился раньше, значит он старше.' },
    { d: 2, t: 'Если 3 карандаша стоят 12 рублей, сколько стоят 5 таких карандашей?', a: 20, e: 'Один карандаш — 4 рубля, а 5 × 4 = 20.' },
    { d: 2, t: 'Сколько цифр в числе 1000?', a: 4, e: '1, 0, 0, 0 — четыре цифры.' },
    { d: 3, t: 'Три кошки ловят трёх мышей за 3 минуты. За сколько минут 100 кошек поймают 100 мышей?', a: 3, e: 'Каждая кошка ловит свою мышь за 3 минуты.' },
    { d: 3, t: 'Маша стоит в ряду третьей с начала и третьей с конца. Сколько детей в ряду?', a: 5, e: 'Перед ней 2 ребёнка, после неё 2 и сама Маша: 2 + 1 + 2 = 5.' },
    { d: 3, t: 'У прямоугольного стола 4 угла. Один угол отпилили. Сколько углов стало у стола?', a: 5, e: 'Отпиленный угол заменяется двумя новыми, поэтому 4 − 1 + 2 = 5.' },
    { d: 3, t: 'На столе горели 5 свечей. Две свечи погасили. Сколько свечей останется?', a: 2, e: 'Остальные догорят, а погашенные останутся.' },
    { d: 3, t: 'Врач дал 3 таблетки и велел принимать каждые полчаса. На сколько хватит таблеток?', a: '1 час', bad: ['1,5 часа', '2 часа', '30 минут'], e: 'Первая сразу, вторая через 30 минут, третья через час.' },
    { d: 3, t: 'Двое играли в шахматы 4 часа. Сколько часов играл каждый из них?', a: 4, e: 'Они играли одновременно, значит каждый — 4 часа.' },
    { d: 3, t: 'Одно яйцо варится 5 минут. Сколько минут нужно, чтобы сварить 2 яйца в одной кастрюле?', a: 5, e: 'Оба яйца варятся одновременно.' },
    { d: 3, t: 'Чему равна сумма всех цифр 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9?', a: 45, e: 'Складывай парами: 1+9, 2+8, 3+7, 4+6 — это четыре десятка и ещё 5.' },
    { d: 4, t: 'Сколько получится, если 10 разделить пополам, то есть на 1/2?', a: 20, e: 'В десятке помещается 20 половинок.' },
    { d: 4, t: 'Улитка ползёт вверх по столбу высотой 5 м. Днём поднимается на 2 м, а ночью сползает на 1 м. За сколько суток она доберётся до вершины?', a: 4, e: 'К утру 4-го дня она уже на высоте 3 м, и днём поднимется на 5 м.' },
    { d: 4, t: 'У меня две монеты на сумму 15 рублей. Одна из них — не 5-рублёвая. Какие это монеты?', a: '10 и 5', bad: ['5 и 5', '10 и 2', '10 и 10'], e: 'Не 5-рублёвая только одна — 10-рублёвая. Вторая как раз пятёрка!' },
    { d: 4, t: 'Лене вдвое больше лет, чем Маше. Маше 6. Сколько лет будет Лене, когда Маше исполнится 12?', a: 18, e: 'Лене сейчас 12, и пройдёт 6 лет: 12 + 6 = 18.' },
    { d: 4, t: 'Два отца и два сына съели 3 яйца, каждому по одному. Как так?', a: 'Это были дед, отец и сын', bad: ['Это были братья', 'Они поделили яйца', 'Так не бывает'], e: 'Отец и сын — это 2 отца и 2 сына сразу, если их трое: дед, отец и сын.' },
  ],
  be: [
    { d: 1, t: 'Што нельга з’есці на сняданак?', a: 'Абед і вячэру', bad: ['Кашу', 'Яечню', 'Бутэрброд'], e: 'Абед і вячэра — гэта іншыя прыёмы ежы!' },
    { d: 1, t: 'Што цяжэй: кілаграм ваты ці кілаграм жалеза?', a: 'Аднолькава', bad: ['Вата', 'Жалеза', 'Немагчыма даведацца'], e: 'І там і там па адным кілаграме.' },
    { d: 1, t: 'Колькі яек можна з’есці натошчак?', a: 'Адно', bad: ['Два', 'Тры', 'Ніводнага'], e: 'Пасля першага яйка ты ўжо не натошчак.' },
    { d: 1, t: 'У кожнай з дзвюх сясцёр ёсць адзін брат. Колькі ўсяго дзяцей у сям’і?', a: 3, e: 'Брат у іх агульны: 2 сястры + 1 брат = 3.' },
    { d: 1, t: 'У палкі 2 канцы. Колькі канцоў у трох палак?', a: 6, e: '3 × 2 = 6.' },
    { d: 1, t: 'Колькі вушэй у трох мышэй?', a: 6, e: '3 × 2 = 6.' },
    { d: 1, t: 'Што можна ўбачыць з закрытымі вачыма?', a: 'Сон', bad: ['Кнігу', 'Вясёлку', 'Месяц'], e: 'Сны мы бачым якраз з закрытымі вачыма.' },
    { d: 2, t: 'Калі пазаўчора была субота, то які дзень тыдня будзе заўтра?', a: 'Аўторак', bad: ['Панядзелак', 'Серада', 'Нядзеля'], e: 'Пазаўчора — субота, учора — нядзеля, сёння — панядзелак, заўтра — аўторак.' },
    { d: 2, t: 'Колькі месяцаў у годзе маюць 28 дзён?', a: 'Усе 12', bad: ['Толькі люты', 'Ніводнага', 'Два'], e: 'У кожным месяцы ёсць 28 дзён (і яшчэ, магчыма, некалькі).' },
    { d: 2, t: 'У Пеці 3 браты і 1 сястра. Колькі ўсяго дзяцей у сям’і?', a: 5, e: 'Сам Пеця + 3 браты + 1 сястра = 5.' },
    { d: 2, t: 'Колькі разоў трэба перарэзаць вяровачку, каб атрымалася 5 кавалкаў?', a: 4, e: 'Адзін разрэз — 2 кавалкі, два разрэзы — 3 кавалкі… чатыры разрэзы — 5 кавалкаў.' },
    { d: 2, t: 'Пеця нарадзіўся ў 2015 годзе, а Вася — у 2013. Хто з іх старэйшы?', a: 'Вася', bad: ['Пеця', 'Яны блізняты', 'Немагчыма даведацца'], e: 'Вася нарадзіўся раней, значыць ён старэйшы.' },
    { d: 2, t: 'Калі 3 аловкі каштуюць 12 рублёў, колькі каштуюць 5 такіх алоўкаў?', a: 20, e: 'Адзін аловак — 4 рублі, а 5 × 4 = 20.' },
    { d: 2, t: 'Колькі лічбаў у ліку 1000?', a: 4, e: '1, 0, 0, 0 — чатыры лічбы.' },
    { d: 3, t: 'Тры кошкі лавяць трох мышэй за 3 хвіліны. За колькі хвілін 100 кошак зловяць 100 мышэй?', a: 3, e: 'Кожная кошка лавіць сваю мыш за 3 хвіліны.' },
    { d: 3, t: 'Маша стаіць у шэрагу трэцяй з пачатку і трэцяй з канца. Колькі дзяцей у шэрагу?', a: 5, e: 'Перад ёй 2 дзіцяці, пасля яе 2 і сама Маша: 2 + 1 + 2 = 5.' },
    { d: 3, t: 'У прамавугольнага стала 4 вуглы. Адзін вугал адпілавалі. Колькі вуглоў стала ў стала?', a: 5, e: 'Адпілаваны вугал замяняецца двума новымі, таму 4 − 1 + 2 = 5.' },
    { d: 3, t: 'На стале гарэлі 5 свечак. Дзве свечкі патушылі. Колькі свечак застанецца?', a: 2, e: 'Астатнія дагараць, а патушаныя застануцца.' },
    { d: 3, t: 'Урач даў 3 таблеткі і загадаў прымаць кожныя паўгадзіны. На колькі хопіць таблетак?', a: 'На 1 гадзіну', bad: ['На 1,5 гадзіны', 'На 2 гадзіны', 'На 30 хвілін'], e: 'Першая адразу, другая праз 30 хвілін, трэцяя праз гадзіну.' },
    { d: 3, t: 'Двое гулялі ў шахматы 4 гадзіны. Колькі гадзін гуляў кожны з іх?', a: 4, e: 'Яны гулялі адначасова, значыць кожны — 4 гадзіны.' },
    { d: 3, t: 'Адно яйка варыцца 5 хвілін. Колькі хвілін трэба, каб зварыць 2 яйкі ў адной каструлі?', a: 5, e: 'Абодва яйкі варацца адначасова.' },
    { d: 3, t: 'Чаму роўная сума ўсіх лічбаў 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9?', a: 45, e: 'Складай парамі: 1+9, 2+8, 3+7, 4+6 — гэта чатыры дзясяткі і яшчэ 5.' },
    { d: 4, t: 'Колькі атрымаецца, калі 10 падзяліць напалову, гэта значыць на 1/2?', a: 20, e: 'У дзясятку змяшчаецца 20 палоўкаў.' },
    { d: 4, t: 'Слімак паўзе ўверх па слупе вышынёй 5 м. Удзень падымаецца на 2 м, а ноччу спаўзае на 1 м. За колькі сутак ён дабярэцца да вяршыні?', a: 4, e: 'Да раніцы 4-га дня ён ужо на вышыні 3 м, і ўдзень падымецца на 5 м.' },
    { d: 4, t: 'У мяне дзве манеты на суму 15 рублёў. Адна з іх — не 5-рублёвая. Якія гэта манеты?', a: '10 і 5', bad: ['5 і 5', '10 і 2', '10 і 10'], e: 'Не 5-рублёвая толькі адна — 10-рублёвая. Другая якраз пяцёрка!' },
    { d: 4, t: 'Лене ўдвая больш гадоў, чым Маше. Маше 6. Колькі гадоў будзе Лене, калі Маше споўніцца 12?', a: 18, e: 'Лене цяпер 12, і прайдзе 6 гадоў: 12 + 6 = 18.' },
    { d: 4, t: 'Два бацькі і два сыны з’елі 3 яйкі, кожны па адным. Як так?', a: 'Гэта былі дзед, бацька і сын', bad: ['Гэта былі браты', 'Яны падзялілі яйкі', 'Так не бывае'], e: 'Бацька і сын — гэта 2 бацькі і 2 сыны адразу, калі іх трое: дзед, бацька і сын.' },
  ],
  cs: [
    { d: 1, t: 'Co se nedá sníst k snídani?', a: 'Oběd a večeři', bad: ['Kaši', 'Míchaná vejce', 'Sendvič'], e: 'Oběd a večeře jsou jiná jídla dne!' },
    { d: 1, t: 'Co je těžší: kilogram peří, nebo kilogram železa?', a: 'Stejně', bad: ['Peří', 'Železo', 'Nedá se zjistit'], e: 'Obojí váží jeden kilogram.' },
    { d: 1, t: 'Kolik vajec můžeš sníst nalačno?', a: 'Jedno', bad: ['Dvě', 'Tři', 'Žádné'], e: 'Po prvním vejci už nejsi nalačno.' },
    { d: 1, t: 'Každá ze dvou sester má jednoho bratra. Kolik dětí je v rodině?', a: 3, e: 'Bratr je společný: 2 sestry + 1 bratr = 3.' },
    { d: 1, t: 'Tyč má 2 konce. Kolik konců mají tři tyče?', a: 6, e: '3 × 2 = 6.' },
    { d: 1, t: 'Kolik uší mají tři myši?', a: 6, e: '3 × 2 = 6.' },
    { d: 1, t: 'Co můžeš vidět se zavřenýma očima?', a: 'Sen', bad: ['Knihu', 'Duhu', 'Měsíc'], e: 'Sny vidíme právě se zavřenýma očima.' },
    { d: 2, t: 'Když předevčírem byla sobota, jaký den bude zítra?', a: 'Úterý', bad: ['Pondělí', 'Středa', 'Neděle'], e: 'Předevčírem sobota, včera neděle, dnes pondělí, zítra úterý.' },
    { d: 2, t: 'Kolik měsíců v roce má 28 dní?', a: 'Všech 12', bad: ['Jen únor', 'Žádný', 'Dva'], e: 'Každý měsíc má 28 dní (a některé ještě pár navíc).' },
    { d: 2, t: 'Petr má 3 bratry a 1 sestru. Kolik dětí je v rodině?', a: 5, e: 'Petr sám + 3 bratři + 1 sestra = 5.' },
    { d: 2, t: 'Kolikrát je potřeba přeřezat provázek, aby vzniklo 5 kousků?', a: 4, e: 'Jeden řez – 2 kousky, dva řezy – 3 kousky … čtyři řezy – 5 kousků.' },
    { d: 2, t: 'Petr se narodil v roce 2015 a Honza v roce 2013. Kdo je starší?', a: 'Honza', bad: ['Petr', 'Jsou dvojčata', 'Nedá se zjistit'], e: 'Honza se narodil dřív, takže je starší.' },
    { d: 2, t: 'Když 3 tužky stojí 12 korun, kolik stojí 5 takových tužek?', a: 20, e: 'Jedna tužka stojí 4 koruny a 5 × 4 = 20.' },
    { d: 2, t: 'Kolik číslic má číslo 1000?', a: 4, e: '1, 0, 0, 0 – čtyři číslice.' },
    { d: 3, t: 'Tři kočky chytí tři myši za 3 minuty. Za kolik minut chytí 100 koček 100 myší?', a: 3, e: 'Každá kočka chytí svou myš za 3 minuty.' },
    { d: 3, t: 'Máša stojí v řadě třetí od začátku i třetí od konce. Kolik dětí je v řadě?', a: 5, e: 'Před ní jsou 2 děti, za ní 2 a Máša sama: 2 + 1 + 2 = 5.' },
    { d: 3, t: 'Obdélníkový stůl má 4 rohy. Jeden roh uřízli. Kolik rohů má stůl teď?', a: 5, e: 'Uříznutý roh nahradí dva nové, takže 4 − 1 + 2 = 5.' },
    { d: 3, t: 'Na stole hořelo 5 svíček. Dvě sfoukli. Kolik svíček zůstane?', a: 2, e: 'Ostatní dohoří, ale sfouknuté zůstanou.' },
    { d: 3, t: 'Lékař dal 3 tabletky a řekl, ať se berou každou půlhodinu. Na jak dlouho tabletky vydrží?', a: 'Na 1 hodinu', bad: ['Na 1,5 hodiny', 'Na 2 hodiny', 'Na 30 minut'], e: 'První hned, druhá za 30 minut, třetí za hodinu.' },
    { d: 3, t: 'Dva lidé hráli šachy 4 hodiny. Kolik hodin hrál každý z nich?', a: 4, e: 'Hráli současně, takže každý 4 hodiny.' },
    { d: 3, t: 'Jedno vejce se vaří 5 minut. Za kolik minut se uvaří 2 vejce v jednom hrnci?', a: 5, e: 'Obě se vaří současně.' },
    { d: 3, t: 'Čemu se rovná součet všech číslic 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9?', a: 45, e: 'Sčítej ve dvojicích: 1+9, 2+8, 3+7, 4+6 – to jsou čtyři desítky a ještě 5.' },
    { d: 4, t: 'Kolik vyjde, když 10 vydělíme polovinou, tedy číslem 1/2?', a: 20, e: 'Do desítky se vejde 20 půlek.' },
    { d: 4, t: 'Šnek leze nahoru po sloupu vysokém 5 m. Přes den vyleze o 2 m a v noci sklouzne o 1 m. Za kolik dní se dostane na vrchol?', a: 4, e: 'Ráno čtvrtého dne je ve výšce 3 m a přes den vyleze na 5 m.' },
    { d: 4, t: 'Mám dvě mince v součtu 15 korun. Jedna z nich není pětikoruna. Které mince to jsou?', a: '10 a 5', bad: ['5 a 5', '10 a 2', '10 a 10'], e: 'Pětikoruna není jen jedna – desetikoruna. Ta druhá je právě pětikoruna!' },
    { d: 4, t: 'Lence je dvakrát víc let než Máše. Máše je 6. Kolik let bude Lence, až bude Máše 12?', a: 18, e: 'Lence je teď 12 a uplyne 6 let: 12 + 6 = 18.' },
    { d: 4, t: 'Dva otcové a dva synové snědli 3 vejce, každý jedno. Jak je to možné?', a: 'Byli to děd, otec a syn', bad: ['Byli to bratři', 'Vejce si rozdělili', 'To nejde'], e: 'Otec a syn jsou současně 2 otcové a 2 synové, pokud jsou tři: děd, otec a syn.' },
  ],
  en: [
    { d: 1, t: 'What can’t you eat for breakfast?', a: 'Lunch and dinner', bad: ['Porridge', 'Scrambled eggs', 'A sandwich'], e: 'Lunch and dinner are other meals of the day!' },
    { d: 1, t: 'Which is heavier: a kilogram of feathers or a kilogram of iron?', a: 'The same', bad: ['Feathers', 'Iron', 'Impossible to say'], e: 'Both weigh one kilogram.' },
    { d: 1, t: 'How many eggs can you eat on an empty stomach?', a: 'One', bad: ['Two', 'Three', 'None'], e: 'After the first egg your stomach is no longer empty.' },
    { d: 1, t: 'Each of two sisters has one brother. How many children are in the family?', a: 3, e: 'They share the brother: 2 sisters + 1 brother = 3.' },
    { d: 1, t: 'A stick has 2 ends. How many ends do three sticks have?', a: 6, e: '3 × 2 = 6.' },
    { d: 1, t: 'How many ears do three mice have?', a: 6, e: '3 × 2 = 6.' },
    { d: 1, t: 'What can you see with your eyes closed?', a: 'A dream', bad: ['A book', 'A rainbow', 'The moon'], e: 'We see dreams exactly when our eyes are closed.' },
    { d: 2, t: 'If the day before yesterday was Saturday, what day will it be tomorrow?', a: 'Tuesday', bad: ['Monday', 'Wednesday', 'Sunday'], e: 'Saturday was two days ago, yesterday was Sunday, today is Monday, tomorrow is Tuesday.' },
    { d: 2, t: 'How many months of the year have 28 days?', a: 'All 12', bad: ['Only February', 'None', 'Two'], e: 'Every month has 28 days (and some have a few more).' },
    { d: 2, t: 'Peter has 3 brothers and 1 sister. How many children are in the family?', a: 5, e: 'Peter himself + 3 brothers + 1 sister = 5.' },
    { d: 2, t: 'How many cuts do you need to cut a rope into 5 pieces?', a: 4, e: 'One cut makes 2 pieces, two cuts make 3 pieces … four cuts make 5 pieces.' },
    { d: 2, t: 'Peter was born in 2015 and John in 2013. Who is older?', a: 'John', bad: ['Peter', 'They are twins', 'Impossible to say'], e: 'John was born earlier, so he is older.' },
    { d: 2, t: 'If 3 pencils cost 12 dollars, how much do 5 of the same pencils cost?', a: 20, e: 'One pencil costs 4 dollars and 5 × 4 = 20.' },
    { d: 2, t: 'How many digits are in the number 1000?', a: 4, e: '1, 0, 0, 0 – four digits.' },
    { d: 3, t: 'Three cats catch three mice in 3 minutes. How many minutes do 100 cats need to catch 100 mice?', a: 3, e: 'Each cat catches its own mouse in 3 minutes.' },
    { d: 3, t: 'Mary is third from the start of a line and third from the end. How many children are in the line?', a: 5, e: 'There are 2 children before her, 2 after her and Mary herself: 2 + 1 + 2 = 5.' },
    { d: 3, t: 'A rectangular table has 4 corners. One corner is sawn off. How many corners does the table have now?', a: 5, e: 'The cut-off corner is replaced by two new ones, so 4 − 1 + 2 = 5.' },
    { d: 3, t: '5 candles were burning on a table. 2 were blown out. How many candles will be left?', a: 2, e: 'The others will burn down, but the blown-out ones will stay.' },
    { d: 3, t: 'A doctor gave 3 pills and said to take one every half hour. How long will the pills last?', a: 'For 1 hour', bad: ['For 1.5 hours', 'For 2 hours', 'For 30 minutes'], e: 'The first right away, the second after 30 minutes, the third after an hour.' },
    { d: 3, t: 'Two people played chess for 4 hours. How many hours did each of them play?', a: 4, e: 'They played at the same time, so each played 4 hours.' },
    { d: 3, t: 'One egg takes 5 minutes to boil. How many minutes does it take to boil 2 eggs in one pot?', a: 5, e: 'Both eggs boil at the same time.' },
    { d: 3, t: 'What is the sum of all the digits 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9?', a: 45, e: 'Add in pairs: 1+9, 2+8, 3+7, 4+6 – that is four tens and 5 more.' },
    { d: 4, t: 'What do you get if you divide 10 by a half, that is by 1/2?', a: 20, e: 'There are 20 halves in ten.' },
    { d: 4, t: 'A snail climbs a 5 m pole. By day it climbs 2 m and at night it slides back 1 m. In how many days will it reach the top?', a: 4, e: 'By the morning of day 4 it is at 3 m, and during the day it climbs to 5 m.' },
    { d: 4, t: 'I have two coins worth 15 cents in total. One of them is not a 5-cent coin. Which coins are they?', a: '10 and 5', bad: ['5 and 5', '10 and 2', '10 and 10'], e: 'Only one of them is not a 5 – the 10. The other one is exactly the 5!' },
    { d: 4, t: 'Lena is twice as old as Mary. Mary is 6. How old will Lena be when Mary turns 12?', a: 18, e: 'Lena is 12 now and 6 years will pass: 12 + 6 = 18.' },
    { d: 4, t: 'Two fathers and two sons ate 3 eggs, one each. How is that possible?', a: 'They were a grandfather, a father and a son', bad: ['They were brothers', 'They shared the eggs', 'It is impossible'], e: 'The father and the son count as 2 fathers and 2 sons at once if there are three people: grandfather, father and son.' },
  ],
};
gen('logic', 'riddle', 1, d => {
  const r = pick(RIDDLES[LANG].filter(x => x.d <= d && x.d >= Math.max(1, d - 2)));
  const q = { text: r.t, hint: t('Не спеши. Подумай, нет ли тут хитрости.', 'Не спяшайся. Падумай, ці няма тут хітрасці.', 'Nespěchej. Zamysli se, jestli v tom není nějaký trik.', 'Don’t rush. Think whether there is a trick in it.'), explain: r.e, answer: r.a };
  return typeof r.a === 'number' ? mkChoice(q, numOpts(r.a)) : mkChoice(q, txtOpts(r.a, r.bad));
});

const NAMES = { ru: ['Аня', 'Боря', 'Вика', 'Гоша', 'Даша', 'Егор', 'Лиза', 'Миша', 'Соня', 'Тимур', 'Катя', 'Рома'],
  be: ['Ганна', 'Барыс', 'Вольга', 'Грыша', 'Даша', 'Цімох', 'Ліза', 'Міхась', 'Соня', 'Кася', 'Раман', 'Алесь'],
  cs: ['Anna', 'Boris', 'Viola', 'Honza', 'Dana', 'Egon', 'Lída', 'Míša', 'Soňa', 'Tomáš', 'Káťa', 'Roman'],
  en: ['Anna', 'Ben', 'Vicky', 'Jack', 'Daisy', 'Eric', 'Lily', 'Max', 'Sophie', 'Tim', 'Kate', 'Ron'] };
/* для каждого языка: [A выше, B ниже, самый A (для «кто … всех?»), самый B, мн. число A (для «сколько … чем X?»)] */
const CMP = {
  ru: [['выше', 'ниже'], ['старше', 'младше'], ['быстрее', 'медленнее'], ['сильнее', 'слабее'], ['тяжелее', 'легче']],
  be: [['вышэй', 'ніжэй'], ['старэй', 'маладзей'], ['хутчэй', 'павольней'], ['мацней', 'слабей'], ['цяжэй', 'лягчэй']],
  cs: [['vyšší', 'nižší', 'nejvyšší', 'nejnižší', 'vyšších'], ['starší', 'mladší', 'nejstarší', 'nejmladší', 'starších'], ['rychlejší', 'pomalejší', 'nejrychlejší', 'nejpomalejší', 'rychlejších'],
    ['silnější', 'slabší', 'nejsilnější', 'nejslabší', 'silnějších'], ['těžší', 'lehčí', 'nejtěžší', 'nejlehčí', 'těžších']],
  en: [['taller', 'shorter', 'the tallest', 'the shortest'], ['older', 'younger', 'the oldest', 'the youngest'], ['faster', 'slower', 'the fastest', 'the slowest'],
    ['stronger', 'weaker', 'the strongest', 'the weakest'], ['heavier', 'lighter', 'the heaviest', 'the lightest']],
};
gen('logic', 'order', 1, d => {
  const n = d <= 2 ? 3 : 4, cmp = pick(CMP[LANG]), names = shuffle(NAMES[LANG]).slice(0, n), st = [];
  const stmt = (A, B, up) => t(up ? `${A} ${cmp[0]}, чем ${B}` : `${B} ${cmp[1]}, чем ${A}`, up ? `${A} ${cmp[0]}, чым ${B}` : `${B} ${cmp[1]}, чым ${A}`,
    up ? `${A} je ${cmp[0]} než ${B}` : `${B} je ${cmp[1]} než ${A}`, up ? `${A} is ${cmp[0]} than ${B}` : `${B} is ${cmp[1]} than ${A}`);
  for (let i = 0; i < n - 1; i++) st.push(stmt(names[i], names[i + 1], rand() < 0.5));
  const kind = d <= 2 ? pick(['top', 'bot']) : pick(['top', 'bot', 'cnt']);
  const lead = shuffle(st).join('. ') + '. ';
  const topW = kind === 'top';
  const ex = t(`Порядок: ${names.join(' → ')} (слева самый «${cmp[0]}»).`, `Парадак: ${names.join(' → ')} (злева той, хто ${cmp[0]} за ўсіх).`,
    `Pořadí: ${names.join(' → ')} (vlevo ten, kdo je ${cmp[2]}).`, `Order: ${names.join(' → ')} (on the left is ${cmp[2]}).`);
  const hint = t('Расставь ребят по порядку на листочке.', 'Расстаў дзяцей па парадку на лісточку.', 'Seřaď děti podle pořadí na papír.', 'Put the children in order on a piece of paper.');
  if (kind === 'cnt') {
    const i = rnd(1, n - 1);
    return mkChoice({ text: lead + t(`Сколько ребят ${cmp[0]}, чем ${names[i]}?`, `Колькі дзяцей ${cmp[0]}, чым ${names[i]}?`, `Kolik dětí je ${cmp[4]} než ${names[i]}?`, `How many children are ${cmp[0]} than ${names[i]}?`), answer: i, hint, explain: ex },
      shuffle(Array.from({ length: n }, (_, k) => k)).map(x => ({ h: String(x), v: x })));
  }
  const ans = topW ? names[0] : names[n - 1], w = topW ? cmp[0] : cmp[1], sup = topW ? cmp[2] : cmp[3];
  return mkChoice({ text: lead + t(`Кто ${w} всех?`, `Хто ${w} за ўсіх?`, `Kdo je ${sup}?`, `Who is ${sup}?`), answer: ans, hint, explain: ex }, shuffle(names).map(x => ({ h: x, v: x })));
});

const LEG = [['🐰', 4], ['🐦', 2], ['🐄', 4], ['🐔', 2], ['🕷️', 8], ['🐝', 6]];
gen('logic', 'legs', 2, d => {
  const kinds = shuffle(LEG).slice(0, d <= 2 ? 2 : 3), cnt = kinds.map(() => rnd(1, d <= 2 ? 4 : 5));
  const vis = kinds.map((k, i) => `<div class="eq">${k[0].repeat(cnt[i])}</div>`).join('');
  const ans = kinds.reduce((s, k, i) => s + k[1] * cnt[i], 0);
  const list = kinds.map(k => `${k[0]} — ${k[1]}`).join(', ');
  return byD(d, { text: t('Сколько всего ног у этих зверей?', 'Колькі ўсяго ног у гэтых жывёл?', 'Kolik nohou mají všechna tato zvířata dohromady?', 'How many legs do all these animals have in total?'),
    visual: `<div style="width:100%">${vis}</div>`, answer: ans,
    hint: t(`Ног у каждого: ${list}.`, `Колькі ног у кожнага: ${list}.`, `Nohy každého: ${list}.`, `Legs of each one: ${list}.`), explain: kinds.map((k, i) => `${cnt[i]}×${k[1]}`).join(' + ') + ` = ${ans}` }, numOpts(ans));
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
  const sq = t('У квадрата 4 одинаковые стороны.', 'У квадрата 4 аднолькавыя староны.', 'Čtverec má 4 stejné strany.', 'A square has 4 equal sides.');
  if (d >= 4 || (d === 3 && rand() < 0.4)) {
    if (d === 5 && rand() < 0.5) { const a = rnd(3, 15);
      return mkNum({ text: t(`Периметр квадрата ${4 * a} см. Чему равна его сторона (в см)?`, `Перыметр квадрата ${4 * a} см. Чаму роўная яго старана (у см)?`,
        `Obvod čtverce je ${4 * a} cm. Jak dlouhá je jeho strana (v cm)?`, `The perimeter of a square is ${4 * a} cm. How long is its side (in cm)?`), answer: a, hint: sq, explain: `${4 * a} ÷ 4 = ${a}` }); }
    if (d >= 4) { const a = rnd(4, 20), b = rnd(3, 20), P = 2 * (a + b);
      return mkNum({ text: t(`Периметр прямоугольника ${P} см, а одна сторона — ${a} см. Найди другую сторону (в см).`, `Перыметр прамавугольніка ${P} см, а адна старана — ${a} см. Знайдзі другую старану (у см).`,
        `Obvod obdélníku je ${P} cm a jedna strana má ${a} cm. Najdi druhou stranu (v cm).`, `The perimeter of a rectangle is ${P} cm and one side is ${a} cm. Find the other side (in cm).`),
        visual: rectSVG(a, b, `${a} ${CM()}`, '?'), answer: b,
        hint: t(`Половина периметра — это сумма двух соседних сторон: ${P / 2}.`, `Палова перыметра — гэта сума двух суседніх старон: ${P / 2}.`,
          `Polovina obvodu je součet dvou sousedních stran: ${P / 2}.`, `Half of the perimeter is the sum of two neighbouring sides: ${P / 2}.`), explain: `${P} ÷ 2 − ${a} = ${b}` }); }
    const a = rnd(3, 15);
    return mkNum({ text: t(`Сторона квадрата ${a} см. Чему равен периметр (в см)?`, `Старана квадрата ${a} см. Чаму роўны перыметр (у см)?`, `Strana čtverce má ${a} cm. Jaký je obvod (v cm)?`, `The side of a square is ${a} cm. What is the perimeter (in cm)?`),
      answer: 4 * a, hint: sq, explain: `${a} × 4 = ${4 * a}` });
  }
  const a = rnd(R[0], R[1]), b = rnd(R[0], R[1]), P = 2 * (a + b);
  return byD(d, { text: t('Чему равен периметр прямоугольника (в см)?', 'Чаму роўны перыметр прамавугольніка (у см)?', 'Jaký je obvod obdélníku (v cm)?', 'What is the perimeter of the rectangle (in cm)?'),
    visual: rectSVG(a, b, `${a} ${CM()}`, `${b} ${CM()}`), answer: P,
    hint: t(`Периметр — это сумма длин всех четырёх сторон: ${a} + ${b} + ${a} + ${b}.`, `Перыметр — гэта сума даўжынь усіх чатырох старон: ${a} + ${b} + ${a} + ${b}.`,
      `Obvod je součet délek všech čtyř stran: ${a} + ${b} + ${a} + ${b}.`, `The perimeter is the sum of all four sides: ${a} + ${b} + ${a} + ${b}.`), explain: `2 × (${a} + ${b}) = ${P}` }, numOpts(P, [a + b, a * b]));
});

gen('geom', 'area', 2, d => {
  if (d <= 2) { const a = rnd(2, 6), b = rnd(2, 5);
    return mkChoice({ text: t('Сколько клеточек в этом прямоугольнике?', 'Колькі клетак у гэтым прамавугольніку?', 'Kolik čtverečků je v tomto obdélníku?', 'How many squares are in this rectangle?'), visual: gridSVG(a, b), answer: a * b,
      hint: t('Умножь число клеточек в длину на число клеточек в ширину.', 'Памнож колькасць клетак у даўжыню на колькасць клетак у шырыню.',
        'Vynásob počet čtverečků na délku počtem čtverečků na šířku.', 'Multiply the number of squares along the length by the number along the width.'), explain: `${a} × ${b} = ${a * b}` }, numOpts(a * b, [2 * (a + b)])); }
  if (d === 3) { const a = rnd(3, 12), b = rnd(2, 9);
    return mkNum({ text: t('Чему равна площадь прямоугольника (в см²)?', 'Чаму роўная плошча прамавугольніка (у см²)?', 'Jaký je obsah obdélníku (v cm²)?', 'What is the area of the rectangle (in cm²)?'),
      visual: rectSVG(a, b, `${a} ${CM()}`, `${b} ${CM()}`), answer: a * b, hint: t('Площадь = длина × ширина.', 'Плошча = даўжыня × шырыня.', 'Obsah = délka × šířka.', 'Area = length × width.'), explain: `${a} × ${b} = ${a * b}` }); }
  if (d === 4) { const a = rnd(3, 12), b = rnd(3, 12);
    return mkNum({ text: t(`Площадь прямоугольника ${a * b} см², одна сторона — ${a} см. Найди другую сторону (в см).`, `Плошча прамавугольніка ${a * b} см², адна старана — ${a} см. Знайдзі другую старану (у см).`,
      `Obsah obdélníku je ${a * b} cm² a jedna strana má ${a} cm. Najdi druhou stranu (v cm).`, `The area of a rectangle is ${a * b} cm² and one side is ${a} cm. Find the other side (in cm).`), answer: b,
      hint: t('Раздели площадь на известную сторону.', 'Падзялі плошчу на вядомую старану.', 'Vyděl obsah známou stranou.', 'Divide the area by the known side.'), explain: `${a * b} ÷ ${a} = ${b}` }); }
  const a = 2 * rnd(2, 6), b = 2 * rnd(2, 5);
  return mkNum({ text: t(`Пол комнаты ${a} м × ${b} м хотят покрыть квадратными плитками 2 м × 2 м. Сколько плиток нужно?`, `Падлогу пакоя ${a} м × ${b} м хочуць пакрыць квадратнымі пліткамі 2 м × 2 м. Колькі плітак трэба?`,
    `Podlaha pokoje ${a} m × ${b} m se má pokrýt čtvercovými dlaždicemi 2 m × 2 m. Kolik dlaždic je potřeba?`, `A room floor of ${a} m × ${b} m is to be covered with square tiles of 2 m × 2 m. How many tiles are needed?`), answer: (a / 2) * (b / 2),
    hint: t(`Сколько плиток поместится вдоль каждой стены? ${a} ÷ 2 и ${b} ÷ 2.`, `Колькі плітак змесціцца ўздоўж кожнай сцяны? ${a} ÷ 2 і ${b} ÷ 2.`,
      `Kolik dlaždic se vejde podél každé stěny? ${a} ÷ 2 a ${b} ÷ 2.`, `How many tiles fit along each wall? ${a} ÷ 2 and ${b} ÷ 2.`), explain: `(${a} ÷ 2) × (${b} ÷ 2) = ${(a / 2) * (b / 2)}` });
});

const SHAPES = {
  ru: [
    { d: 1, t: 'Сколько сторон у треугольника?', a: 3 }, { d: 1, t: 'Сколько углов у четырёхугольника?', a: 4 }, { d: 1, t: 'Сколько прямых углов у прямоугольника?', a: 4 },
    { d: 1, t: 'Сколько сторон у пятиугольника?', a: 5 }, { d: 1, t: 'Сколько сторон у квадрата?', a: 4 }, { d: 1, t: 'Сколько углов у треугольника?', a: 3 }, { d: 1, t: 'Сколько углов у круга?', a: 0 },
    { d: 2, t: 'Сколько сторон у шестиугольника?', a: 6 }, { d: 2, t: 'Сколько граней у куба?', a: 6 }, { d: 2, t: 'Сколько осей симметрии у квадрата?', a: 4 }, { d: 2, t: 'Сколько сторон у семиугольника?', a: 7 },
    { d: 2, t: 'Что получится, если разрезать квадрат по диагонали?', a: 'Два треугольника', bad: ['Два квадрата', 'Два круга', 'Пятиугольник'] },
    { d: 2, t: 'У какой фигуры все стороны равны и все углы прямые?', a: 'Квадрат', bad: ['Ромб', 'Прямоугольник', 'Трапеция'] },
    { d: 3, t: 'Сколько вершин у куба?', a: 8 }, { d: 3, t: 'Сколько сторон у восьмиугольника?', a: 8 }, { d: 3, t: 'Сколько осей симметрии у равностороннего треугольника?', a: 3 },
    { d: 3, t: 'Сколько осей симметрии у прямоугольника (не квадрата)?', a: 2 }, { d: 3, t: 'У какой фигуры нет ни одного угла?', a: 'Круг', bad: ['Квадрат', 'Треугольник', 'Ромб'] },
    { d: 4, t: 'Сколько рёбер у куба?', a: 12 }, { d: 4, t: 'Сколько вершин у четырёхугольной пирамиды?', a: 5 }, { d: 4, t: 'Сколько рёбер у треугольной пирамиды?', a: 6 },
    { d: 4, t: 'Сколько граней у четырёхугольной пирамиды?', a: 5 }, { d: 4, t: 'Сколько вершин у треугольной призмы?', a: 6 },
    { d: 4, t: 'Сколько осей симметрии у круга?', a: 'Бесконечно много', bad: ['Одна', 'Две', 'Четыре'] },
  ],
  be: [
    { d: 1, t: 'Колькі старон у трохвугольніка?', a: 3 }, { d: 1, t: 'Колькі вуглоў у чатырохвугольніка?', a: 4 }, { d: 1, t: 'Колькі прамых вуглоў у прамавугольніка?', a: 4 },
    { d: 1, t: 'Колькі старон у пяцівугольніка?', a: 5 }, { d: 1, t: 'Колькі старон у квадрата?', a: 4 }, { d: 1, t: 'Колькі вуглоў у трохвугольніка?', a: 3 }, { d: 1, t: 'Колькі вуглоў у круга?', a: 0 },
    { d: 2, t: 'Колькі старон у шасцівугольніка?', a: 6 }, { d: 2, t: 'Колькі граней у куба?', a: 6 }, { d: 2, t: 'Колькі восей сіметрыі ў квадрата?', a: 4 }, { d: 2, t: 'Колькі старон у сямівугольніка?', a: 7 },
    { d: 2, t: 'Што атрымаецца, калі разрэзаць квадрат па дыяганалі?', a: 'Два трохвугольнікі', bad: ['Два квадраты', 'Два кругі', 'Пяцівугольнік'] },
    { d: 2, t: 'У якой фігуры ўсе староны роўныя і ўсе вуглы прамыя?', a: 'Квадрат', bad: ['Ромб', 'Прамавугольнік', 'Трапецыя'] },
    { d: 3, t: 'Колькі вяршынь у куба?', a: 8 }, { d: 3, t: 'Колькі старон у васьмівугольніка?', a: 8 }, { d: 3, t: 'Колькі восей сіметрыі ў роўнастаронняга трохвугольніка?', a: 3 },
    { d: 3, t: 'Колькі восей сіметрыі ў прамавугольніка (не квадрата)?', a: 2 }, { d: 3, t: 'У якой фігуры няма ніводнага вугла?', a: 'Круг', bad: ['Квадрат', 'Трохвугольнік', 'Ромб'] },
    { d: 4, t: 'Колькі рэбраў у куба?', a: 12 }, { d: 4, t: 'Колькі вяршынь у чатырохвугольнай пірамідзе?', a: 5 }, { d: 4, t: 'Колькі рэбраў у трохвугольнай пірамідзе?', a: 6 },
    { d: 4, t: 'Колькі граней у чатырохвугольнай пірамідзе?', a: 5 }, { d: 4, t: 'Колькі вяршынь у трохвугольнай прызмы?', a: 6 },
    { d: 4, t: 'Колькі восей сіметрыі ў круга?', a: 'Бясконца многа', bad: ['Адна', 'Дзве', 'Чатыры'] },
  ],
  cs: [
    { d: 1, t: 'Kolik stran má trojúhelník?', a: 3 }, { d: 1, t: 'Kolik úhlů má čtyřúhelník?', a: 4 }, { d: 1, t: 'Kolik pravých úhlů má obdélník?', a: 4 },
    { d: 1, t: 'Kolik stran má pětiúhelník?', a: 5 }, { d: 1, t: 'Kolik stran má čtverec?', a: 4 }, { d: 1, t: 'Kolik úhlů má trojúhelník?', a: 3 }, { d: 1, t: 'Kolik úhlů má kruh?', a: 0 },
    { d: 2, t: 'Kolik stran má šestiúhelník?', a: 6 }, { d: 2, t: 'Kolik stěn má krychle?', a: 6 }, { d: 2, t: 'Kolik os souměrnosti má čtverec?', a: 4 }, { d: 2, t: 'Kolik stran má sedmiúhelník?', a: 7 },
    { d: 2, t: 'Co vznikne, když čtverec rozřízneme podél úhlopříčky?', a: 'Dva trojúhelníky', bad: ['Dva čtverce', 'Dva kruhy', 'Pětiúhelník'] },
    { d: 2, t: 'Který útvar má všechny strany stejné a všechny úhly pravé?', a: 'Čtverec', bad: ['Kosočtverec', 'Obdélník', 'Lichoběžník'] },
    { d: 3, t: 'Kolik vrcholů má krychle?', a: 8 }, { d: 3, t: 'Kolik stran má osmiúhelník?', a: 8 }, { d: 3, t: 'Kolik os souměrnosti má rovnostranný trojúhelník?', a: 3 },
    { d: 3, t: 'Kolik os souměrnosti má obdélník (který není čtverec)?', a: 2 }, { d: 3, t: 'Který útvar nemá žádný roh?', a: 'Kruh', bad: ['Čtverec', 'Trojúhelník', 'Kosočtverec'] },
    { d: 4, t: 'Kolik hran má krychle?', a: 12 }, { d: 4, t: 'Kolik vrcholů má čtyřboký jehlan?', a: 5 }, { d: 4, t: 'Kolik hran má čtyřstěn (trojboký jehlan)?', a: 6 },
    { d: 4, t: 'Kolik stěn má čtyřboký jehlan?', a: 5 }, { d: 4, t: 'Kolik vrcholů má trojboký hranol?', a: 6 },
    { d: 4, t: 'Kolik os souměrnosti má kruh?', a: 'Nekonečně mnoho', bad: ['Jednu', 'Dvě', 'Čtyři'] },
  ],
  en: [
    { d: 1, t: 'How many sides does a triangle have?', a: 3 }, { d: 1, t: 'How many angles does a quadrilateral have?', a: 4 }, { d: 1, t: 'How many right angles does a rectangle have?', a: 4 },
    { d: 1, t: 'How many sides does a pentagon have?', a: 5 }, { d: 1, t: 'How many sides does a square have?', a: 4 }, { d: 1, t: 'How many angles does a triangle have?', a: 3 }, { d: 1, t: 'How many angles does a circle have?', a: 0 },
    { d: 2, t: 'How many sides does a hexagon have?', a: 6 }, { d: 2, t: 'How many faces does a cube have?', a: 6 }, { d: 2, t: 'How many lines of symmetry does a square have?', a: 4 }, { d: 2, t: 'How many sides does a heptagon have?', a: 7 },
    { d: 2, t: 'What do you get if you cut a square along its diagonal?', a: 'Two triangles', bad: ['Two squares', 'Two circles', 'A pentagon'] },
    { d: 2, t: 'Which shape has all sides equal and all angles right angles?', a: 'Square', bad: ['Rhombus', 'Rectangle', 'Trapezium'] },
    { d: 3, t: 'How many vertices does a cube have?', a: 8 }, { d: 3, t: 'How many sides does an octagon have?', a: 8 }, { d: 3, t: 'How many lines of symmetry does an equilateral triangle have?', a: 3 },
    { d: 3, t: 'How many lines of symmetry does a rectangle (not a square) have?', a: 2 }, { d: 3, t: 'Which shape has no corners at all?', a: 'Circle', bad: ['Square', 'Triangle', 'Rhombus'] },
    { d: 4, t: 'How many edges does a cube have?', a: 12 }, { d: 4, t: 'How many vertices does a square-based pyramid have?', a: 5 }, { d: 4, t: 'How many edges does a triangular pyramid have?', a: 6 },
    { d: 4, t: 'How many faces does a square-based pyramid have?', a: 5 }, { d: 4, t: 'How many vertices does a triangular prism have?', a: 6 },
    { d: 4, t: 'How many lines of symmetry does a circle have?', a: 'Infinitely many', bad: ['One', 'Two', 'Four'] },
  ],
};
gen('geom', 'shapes', 1, d => {
  const s = pick(SHAPES[LANG].filter(x => x.d <= d && x.d >= Math.max(1, d - 2)));
  const q = { text: s.t, answer: s.a, hint: t('Представь фигуру или нарисуй её на листочке.', 'Уяві фігуру або намалюй яе на лісточку.', 'Představ si útvar nebo si ho nakresli na papír.', 'Imagine the shape or draw it on paper.'),
    explain: t(`Правильный ответ: ${s.a}.`, `Правільны адказ: ${s.a}.`, `Správná odpověď: ${s.a}.`, `The correct answer is ${s.a}.`) };
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
  return byD(d, { text: t('Каждый фрукт — это своё число. Найди значение:', 'Кожны фрукт — гэта свой лік. Знайдзі значэнне:', 'Každé ovoce je nějaké číslo. Najdi hodnotu:', 'Each fruit is a number. Find the value:'),
    visual: vis, answer: ans,
    hint: t('Начни со строки, где только один вид фрукта. Потом подставляй найденное число в следующие строки.', 'Пачні з радка, дзе толькі адзін від садавіны. Потым падстаўляй знойдзены лік у наступныя радкі.',
      'Začni řádkem, kde je jen jeden druh ovoce. Potom dosazuj nalezené číslo do dalších řádků.', 'Start with the line that has only one kind of fruit. Then put the number you found into the next lines.'),
    explain: t(`Ответ: ${ans}`, `Адказ: ${ans}`, `Odpověď: ${ans}`, `Answer: ${ans}`) }, numOpts(ans));
});

function sudokuGrid() {
  const perm = shuffle([1, 2, 3, 4]);
  let g = [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]].map(r => r.map(x => perm[x - 1]));
  if (rand() < 0.5) [g[0], g[1]] = [g[1], g[0]];
  if (rand() < 0.5) [g[2], g[3]] = [g[3], g[2]];
  if (rand() < 0.5) g = [g[2], g[3], g[0], g[1]];
  if (rand() < 0.5) g = g[0].map((_, c) => g.map(r => r[c]));
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
    const i = r * 4 + c, tg = i === tr * 4 + tc, cls = (tg ? 't ' : '') + (c === 1 ? 'br ' : '') + (r === 1 ? 'bb' : '');
    cells += `<div class="${cls}">${tg ? '?' : hidden.has(i) ? '' : g[r][c]}</div>`;
  }
  return mkChoice({ text: t('Судоку: цифры 1–4 не повторяются в строке, столбце и квадрате 2×2. Какая цифра на месте «?»', 'Судоку: лічбы 1–4 не паўтараюцца ў радку, слупку і квадраце 2×2. Якая лічба на месцы «?»',
    'Sudoku: číslice 1–4 se neopakují v řádku, sloupci ani ve čtverci 2×2. Která číslice patří na místo „?“', 'Sudoku: the digits 1–4 must not repeat in a row, a column or a 2×2 square. Which digit goes in place of the "?"'),
    visual: `<div class="sg">${cells}</div>`, answer: g[tr][tc],
    hint: t('Посмотри, какие цифры уже есть в этой строке, столбце и квадрате 2×2.', 'Паглядзі, якія лічбы ўжо ёсць у гэтым радку, слупку і квадраце 2×2.',
      'Podívej se, které číslice už v tomto řádku, sloupci a čtverci 2×2 jsou.', 'Look at which digits are already in this row, column and 2×2 square.'),
    explain: t(`На месте «?» должна быть цифра ${g[tr][tc]}.`, `На месцы «?» павінна быць лічба ${g[tr][tc]}.`, `Na místě „?“ musí být číslice ${g[tr][tc]}.`, `The digit ${g[tr][tc]} goes in place of the "?".`) },
    [1, 2, 3, 4].map(x => ({ h: String(x), v: x })));
});

gen('geom', 'magic', 3, d => {
  let m = [[2, 7, 6], [9, 5, 1], [4, 3, 8]];
  const rot = a => a[0].map((_, c) => a.map(r => r[c]).reverse());
  for (let i = rnd(0, 3); i > 0; i--) m = rot(m);
  if (rand() < 0.5) m = m.map(r => r.slice().reverse());
  const k = d <= 3 ? 1 : d === 4 ? pick([2, 3]) : pick([2, 3, 4]), c = d === 5 ? rnd(1, 6) : 0;
  m = m.map(r => r.map(x => x * k + c));
  const tr = rnd(0, 2), tc = rnd(0, 2), cells = m.map((r, i) => r.map((x, j) => `<div class="${i === tr && j === tc ? 't' : ''}">${i === tr && j === tc ? '?' : x}</div>`).join('')).join('');
  const S = 3 * (5 * k + c);
  return mkNum({ text: t('Магический квадрат: суммы в каждой строке, столбце и диагонали одинаковы. Найди «?»', 'Магічны квадрат: сумы ў кожным радку, слупку і дыяганалі аднолькавыя. Знайдзі «?»',
    'Magický čtverec: součty v každém řádku, sloupci i úhlopříčce jsou stejné. Najdi „?“', 'Magic square: the sums in every row, column and diagonal are the same. Find the "?"'),
    visual: `<div class="mg">${cells}</div>`, answer: m[tr][tc],
    hint: t('Найди строку без «?» и сложи её числа — это нужная сумма. Потом вычти остальные числа.', 'Знайдзі радок без «?» і складзі яго лікі — гэта патрэбная сума. Потым адымі астатнія лікі.',
      'Najdi řádek bez „?“ a sečti jeho čísla – to je potřebný součet. Potom odečti ostatní čísla.', 'Find a row without the "?" and add its numbers – that is the sum. Then subtract the other numbers.'),
    explain: t(`Сумма в каждой линии ${S}.`, `Сума ў кожнай лініі ${S}.`, `Součet v každé řadě je ${S}.`, `The sum in every line is ${S}.`) });
});

/* ======================== ЕДИНИЦЫ И ВРЕМЯ ======================== */
gen('arith', 'units', 2, d => {
  const m1 = '1 m = 100 cm', kg = '1 kg = 1000 g', km = '1 km = 1000 m';
  const hr = t('1 ч = 60 минут', '1 гадз = 60 хвілін', '1 hodina = 60 minut', '1 hour = 60 minutes');
  const mn = t('1 минута = 60 секунд', '1 хвіліна = 60 секунд', '1 minuta = 60 sekund', '1 minute = 60 seconds');
  const H = t('ч', 'гадз', 'h', 'h'), M = t('мин', 'хв', 'min', 'min'), S = t('с', 'с', 's', 's'), T = [];
  const ru = x => x.replace(/ m\b/g, ' м').replace(/\bcm\b/g, 'см').replace(/\bkg\b/g, 'кг').replace(/\bg\b/g, 'г').replace(/\bkm\b/g, 'км');
  const U = x => (LANG === 'ru' || LANG === 'be') ? ru(x) : x;   // единицы длины/массы на кириллице для ru/be
  if (d <= 2) {
    const a = rnd(2, 9); T.push([t(`Сколько сантиметров в ${a} м?`, `Колькі сантыметраў у ${a} м?`, `Kolik centimetrů je ${a} m?`, `How many centimetres are in ${a} m?`), a * 100, m1],
      [U(`${a} kg = ${BL} g`), a * 1000, kg], [t(`Сколько минут в ${a} ч?`, `Колькі хвілін у ${a} гадз?`, `Kolik minut je ${a} h?`, `How many minutes are in ${a} h?`), a * 60, hr], [U(`${a} km = ${BL} m`), a * 1000, km]);
  } else if (d === 3) {
    const a = rnd(1, 9), b = rnd(1, 9) * 10, c = rnd(1, 9), e = rnd(1, 9) * 100, f = rnd(1, 5), h = rnd(1, 11) * 5;
    T.push([U(`${a} m ${b} cm = ${BL} cm`), a * 100 + b, m1], [U(`${c} kg ${e} g = ${BL} g`), c * 1000 + e, kg], [`${f} ${H} ${h} ${M} = ${BL} ${M}`, f * 60 + h, hr]);
  } else {
    const a = rnd(2, 9), b = rnd(10, 59), c = rnd(2, 9), e = rnd(11, 99);
    T.push([`${a} ${M} ${b} ${S} = ${BL} ${S}`, a * 60 + b, mn], [U(`${c} km ${e} m = ${BL} m`), c * 1000 + e, km], [U(`${a} kg ${e * 5 % 1000} g = ${BL} g`), a * 1000 + e * 5 % 1000, kg]);
  }
  const [text, ans, how0] = pick(T), how = (how0 === m1 || how0 === kg || how0 === km) ? U(how0) : how0;
  return byD(d, { text, answer: ans, hint: t(`Вспомни: ${how}.`, `Узгадай: ${how}.`, `Vzpomeň si: ${how}.`, `Remember: ${how}.`),
    explain: t(`${how}. Ответ: ${ans}.`, `${how}. Адказ: ${ans}.`, `${how}. Odpověď: ${ans}.`, `${how}. Answer: ${ans}.`) }, numOpts(ans));
});

const fmtT = x => { x = ((x % 720) + 720) % 720; return `${Math.floor(x / 60) || 12}:${String(x % 60).padStart(2, '0')}`; };
function clockSVG(h, m) {
  const c = 70, ha = ((h % 12) + m / 60) * 30, ma = m * 6, P = (a, r) => [c + r * Math.sin(a * Math.PI / 180), c - r * Math.cos(a * Math.PI / 180)];
  let s = '<svg viewBox="0 0 140 140" width="170"><circle cx="70" cy="70" r="64" fill="#fff" stroke="#2b2d42" stroke-width="4"/>';
  for (let i = 1; i <= 12; i++) { const [x, y] = P(i * 30, 51); s += `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15" font-weight="800" fill="#2b2d42">${i}</text>`; }
  for (let i = 0; i < 60; i++) { if (i % 5) { const [x1, y1] = P(i * 6, 60), [x2, y2] = P(i * 6, 56); s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8d8fa8" stroke-width="1"/>`; } }
  const [hx, hy] = P(ha, 32), [mx, my] = P(ma, 46);
  return s + `<line x1="70" y1="70" x2="${hx}" y2="${hy}" stroke="#ff5d73" stroke-width="6" stroke-linecap="round"/><line x1="70" y1="70" x2="${mx}" y2="${my}" stroke="#7b6cff" stroke-width="4" stroke-linecap="round"/><circle cx="70" cy="70" r="5" fill="#2b2d42"/></svg>`;
}
function timeOpts(x) {
  const ok = fmtT(x), s = new Set([ok]);
  for (const dlt of shuffle([5, -5, 10, -10, 15, -15, 30, -30, 60, -60])) { if (s.size >= 4) break; s.add(fmtT(x + dlt)); }
  return shuffle([...s]).map(v => ({ h: v, v }));
}
gen('arith', 'time', 1, d => {
  const mode = d === 1 ? 0 : pick([0, 0, 1, 2]), M = t('мин', 'хв', 'min', 'min');
  if (mode === 0) {
    const h = rnd(1, 12), m = d === 1 ? pick([0, 30]) : d === 2 ? pick([0, 15, 30, 45]) : rnd(0, 11) * 5, x = (h % 12) * 60 + m;
    return mkChoice({ text: t('Сколько времени показывают часы?', 'Колькі часу паказвае гадзіннік?', 'Kolik hodin ukazují hodiny?', 'What time does the clock show?'), visual: clockSVG(h, m), answer: fmtT(x),
      hint: t('Короткая красная стрелка — часы, длинная фиолетовая — минуты.', 'Кароткая чырвоная стрэлка — гадзіны, доўгая фіялетавая — хвіліны.',
        'Krátká červená ručička ukazuje hodiny, dlouhá fialová minuty.', 'The short red hand shows the hours, the long purple hand shows the minutes.'),
      explain: t(`Часы показывают ${fmtT(x)}.`, `Гадзіннік паказвае ${fmtT(x)}.`, `Hodiny ukazují ${fmtT(x)}.`, `The clock shows ${fmtT(x)}.`) }, timeOpts(x));
  }
  if (mode === 1) {
    const x = rnd(1, 12) * 60 + rnd(0, 11) * 5, dm = d <= 2 ? pick([10, 15, 20, 30, 45, 60]) : d === 3 ? rnd(2, 12) * 5 : rnd(8, 30) * 5;
    return mkChoice({ text: t(`Сейчас ${fmtT(x)}. Сколько времени будет через ${dm} мин?`, `Цяпер ${fmtT(x)}. Колькі часу будзе праз ${dm} хв?`,
      `Teď je ${fmtT(x)}. Kolik bude za ${dm} min?`, `It is ${fmtT(x)} now. What time will it be in ${dm} min?`), answer: fmtT(x + dm),
      hint: t('Сначала доведи до круглого часа, а остаток минут прибавь после.', 'Спачатку дабяры да круглай гадзіны, а астатак хвілін дадай пасля.',
        'Nejdřív dojdi k celé hodině a zbytek minut přičti potom.', 'First get to the full hour, then add the remaining minutes.'), explain: `${fmtT(x)} + ${dm} ${M} = ${fmtT(x + dm)}.` }, timeOpts(x + dm));
  }
  const t1 = rnd(1, 11) * 60 + rnd(0, 11) * 5, dm = rnd(2, 20) * 5, t2 = t1 + dm;
  return byD(d, { text: t(`Урок начался в ${fmtT(t1)}, а закончился в ${fmtT(t2)}. Сколько минут длился урок?`, `Урок пачаўся ў ${fmtT(t1)}, а скончыўся ў ${fmtT(t2)}. Колькі хвілін доўжыўся ўрок?`,
    `Hodina začala v ${fmtT(t1)} a skončila v ${fmtT(t2)}. Kolik minut trvala?`, `The lesson started at ${fmtT(t1)} and ended at ${fmtT(t2)}. How many minutes did it last?`), answer: dm,
    hint: t('Сначала посчитай минуты до ближайшего круглого часа.', 'Спачатку падлічы хвіліны да бліжэйшай круглай гадзіны.', 'Nejdřív spočítej minuty do nejbližší celé hodiny.', 'First count the minutes to the nearest full hour.'),
    explain: t(`От ${fmtT(t1)} до ${fmtT(t2)} — ${dm} мин.`, `Ад ${fmtT(t1)} да ${fmtT(t2)} — ${dm} хв.`, `Od ${fmtT(t1)} do ${fmtT(t2)} je ${dm} min.`, `From ${fmtT(t1)} to ${fmtT(t2)} is ${dm} min.`) }, numOpts(dm));
});

window.Gens = { GENS, LANGS, rand, withSeed, withLang, generate, gen, mkChoice, mkNum, numOpts, txtOpts, byD, BL, rnd, pick, shuffle, esc, t, setLang: l => { LANG = LANGS.includes(l) ? l : 'ru'; }, getLang: () => LANG };
})();
