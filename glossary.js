'use strict';
/* Глоссарий математических терминов RU / BE / CS / EN (F13) и поиск терминов в тексте задания (B4).
   ВАЖНО: переводы подготовлены без носителей языка — перед выпуском их должны проверить редакторы-носители (B5).
   [категория, ru, be, cs, en]; категории: num — числа и действия, frac — дроби, geo — геометрия, unit — меры и время, log — логика и память, chess — шахматы. */
(function (root) {
const CATS = { num: ['Числа и действия', 'Лікі і дзеянні', 'Čísla a počty', 'Numbers and operations'], frac: ['Дроби', 'Дробы', 'Zlomky', 'Fractions'], geo: ['Геометрия', 'Геаметрыя', 'Geometrie', 'Geometry'],
  unit: ['Меры и время', 'Меры і час', 'Míry a čas', 'Units and time'], log: ['Логика и внимание', 'Логіка і ўвага', 'Logika a pozornost', 'Logic and attention'], chess: ['Шахматы', 'Шахматы', 'Šachy', 'Chess'] };
const RAW = [
  ['num', 'сложение', 'складанне', 'sčítání', 'addition'], ['num', 'вычитание', 'адніманне', 'odčítání', 'subtraction'], ['num', 'умножение', 'множанне', 'násobení', 'multiplication'], ['num', 'деление', 'дзяленне', 'dělení', 'division'],
  ['num', 'сумма', 'сума', 'součet', 'sum'], ['num', 'разность', 'рознасць', 'rozdíl', 'difference'], ['num', 'произведение', 'здабытак', 'součin', 'product'], ['num', 'частное', 'дзель', 'podíl', 'quotient'],
  ['num', 'слагаемое', 'складнік', 'sčítanec', 'addend'], ['num', 'множитель', 'множнік', 'činitel', 'factor'], ['num', 'делимое', 'дзельнае', 'dělenec', 'dividend'], ['num', 'делитель', 'дзельнік', 'dělitel', 'divisor'],
  ['num', 'остаток', 'астатак', 'zbytek', 'remainder'], ['num', 'число|чисел', 'лік|лікаў', 'číslo', 'number'], ['num', 'цифра', 'лічба|лічбаў', 'číslice', 'digit'], ['num', 'чётное число', 'цотны лік', 'sudé číslo', 'even number'],
  ['num', 'нечётное число', 'няцотны лік', 'liché číslo', 'odd number'], ['num', 'больше', 'больш', 'větší', 'greater than'], ['num', 'меньше', 'менш', 'menší', 'less than'], ['num', 'равно', 'роўна', 'rovná se', 'equals'],
  ['num', 'уравнение', 'ураўненне', 'rovnice', 'equation'], ['num', 'таблица умножения', 'табліца множання', 'malá násobilka', 'times table'], ['num', 'десяток', 'дзесятак', 'desítka', 'ten'], ['num', 'сотня', 'сотня', 'stovka', 'hundred'],
  ['num', 'тысяча', 'тысяча', 'tisíc', 'thousand'], ['num', 'нуль', 'нуль', 'nula', 'zero'], ['num', 'плюс', 'плюс', 'plus', 'plus'], ['num', 'минус', 'мінус', 'mínus', 'minus'],
  ['num', 'пропущенное число', 'прапушчаны лік', 'chybějící číslo', 'missing number'], ['num', 'выражение', 'выраз', 'výraz', 'expression'],
  ['frac', 'дробь', 'дроб', 'zlomek', 'fraction'], ['frac', 'числитель', 'лічнік', 'čitatel', 'numerator'], ['frac', 'знаменатель', 'назоўнік', 'jmenovatel', 'denominator'], ['frac', 'целое', 'цэлае', 'celek', 'whole'],
  ['frac', 'часть', 'частка', 'část', 'part'], ['frac', 'половина', 'палова', 'polovina', 'half|halves'], ['frac', 'четверть', 'чвэрць', 'čtvrtina', 'quarter'], ['frac', 'треть', 'траціна', 'třetina', 'third'],
  ['frac', 'сравнить', 'параўнаць', 'porovnat', 'compare'], ['frac', 'равные доли', 'роўныя долі', 'stejné díly', 'equal parts'],
  ['geo', 'фигура', 'фігура', 'tvar', 'shape'], ['geo', 'треугольник', 'трохкутнік', 'trojúhelník', 'triangle'], ['geo', 'квадрат', 'квадрат', 'čtverec', 'square'], ['geo', 'прямоугольник', 'прамавугольнік', 'obdélník', 'rectangle'],
  ['geo', 'круг', 'круг', 'kruh', 'circle'], ['geo', 'овал', 'авал', 'ovál', 'oval'], ['geo', 'ромб', 'ромб', 'kosočtverec', 'rhombus'], ['geo', 'пятиугольник', 'пяцікутнік', 'pětiúhelník', 'pentagon'],
  ['geo', 'шестиугольник', 'шасцікутнік', 'šestiúhelník', 'hexagon'], ['geo', 'многоугольник', 'шматкутнік', 'mnohoúhelník', 'polygon'], ['geo', 'угол', 'вугал', 'úhel', 'angle'], ['geo', 'прямой угол', 'прамы вугал', 'pravý úhel', 'right angle'],
  ['geo', 'сторона', 'старана', 'strana', 'side'], ['geo', 'вершина', 'вяршыня', 'vrchol', 'vertex|vertices'], ['geo', 'периметр', 'перыметр', 'obvod', 'perimeter'], ['geo', 'площадь', 'плошча', 'obsah', 'area'],
  ['geo', 'длина', 'даўжыня', 'délka', 'length'], ['geo', 'ширина', 'шырыня', 'šířka', 'width'], ['geo', 'высота', 'вышыня', 'výška', 'height'], ['geo', 'отрезок', 'адрэзак', 'úsečka', 'line segment'],
  ['geo', 'прямая', 'прамая', 'přímka', 'straight line'], ['geo', 'точка', 'кропка', 'bod', 'point'], ['geo', 'куб', 'куб', 'krychle', 'cube'], ['geo', 'шар', 'шар', 'koule', 'sphere'],
  ['geo', 'цилиндр', 'цыліндр', 'válec', 'cylinder'], ['geo', 'конус', 'конус', 'kužel', 'cone'], ['geo', 'пирамида', 'піраміда', 'jehlan', 'pyramid'], ['geo', 'симметрия', 'сіметрыя', 'souměrnost', 'symmetry'],
  ['geo', 'ось симметрии', 'вось сіметрыі', 'osa souměrnosti', 'axis of symmetry'], ['geo', 'зеркало', 'люстэрка', 'zrcadlo', 'mirror'], ['geo', 'поворот', 'паварот', 'otočení', 'rotation'],
  ['geo', 'по часовой стрелке', 'па гадзіннікавай стрэлцы', 'po směru hodinových ručiček', 'clockwise'], ['geo', 'против часовой стрелки', 'супраць гадзіннікавай стрэлкі', 'proti směru hodinových ručiček', 'counterclockwise'],
  ['geo', 'клетка', 'клетка', 'políčko', 'cell'], ['geo', 'сетка', 'сетка', 'mřížka', 'grid'], ['geo', 'строка', 'радок', 'řádek', 'row'], ['geo', 'столбец', 'слупок', 'sloupec', 'column'],
  ['geo', 'слева', 'злева', 'vlevo', 'on the left'], ['geo', 'справа', 'справа', 'vpravo', 'on the right'], ['geo', 'сверху', 'зверху', 'nahoře', 'above'], ['geo', 'снизу', 'знізу', 'dole', 'below'], ['geo', 'между', 'паміж', 'mezi', 'between'],
  ['unit', 'миллиметр', 'міліметр', 'milimetr', 'millimetre'], ['unit', 'сантиметр', 'сантыметр', 'centimetr', 'centimetre'], ['unit', 'метр', 'метр', 'metr', 'metre'], ['unit', 'километр', 'кіламетр', 'kilometr', 'kilometre'],
  ['unit', 'грамм', 'грам', 'gram', 'gram'], ['unit', 'килограмм', 'кілаграм', 'kilogram', 'kilogram'], ['unit', 'литр', 'літр', 'litr', 'litre'], ['unit', 'секунда', 'секунда', 'sekunda', '!second'],
  ['unit', 'минута', 'хвіліна', 'minuta', 'minute'], ['unit', 'час', 'гадзіна', 'hodina', 'hour'], ['unit', 'полчаса', 'паўгадзіны', 'půl hodiny', 'half an hour'], ['unit', 'день', 'дзень', 'den', 'day'],
  ['unit', 'неделя', 'тыдзень', 'týden', 'week'], ['unit', 'месяц', 'месяц', 'měsíc', 'month'], ['unit', 'год', 'год', 'rok', 'year'], ['unit', 'стрелка часов', 'стрэлка гадзінніка', 'ručička', 'clock hand'],
  ['log', 'закономерность', 'заканамернасць', 'pravidelnost', 'pattern'], ['log', 'последовательность', 'паслядоўнасць', 'posloupnost', 'sequence'], ['log', 'лишний', 'лішні', 'navíc', 'odd one out'],
  ['log', 'загадка', 'загадка', 'hádanka', 'riddle'], ['log', 'подсказка', 'падказка', 'nápověda', 'hint'], ['log', 'ответ', 'адказ', 'odpověď', 'answer'], ['log', 'вопрос', 'пытанне', 'otázka', 'question'],
  ['log', 'задача', 'задача', 'úloha', 'problem'], ['log', 'ошибка', 'памылка', 'chyba', 'mistake'], ['log', 'судоку', 'судоку', 'sudoku', 'sudoku'], ['log', 'магический квадрат', 'магічны квадрат', 'magický čtverec', 'magic square'],
  ['log', 'весы', 'вагі', 'váhy', 'scales'], ['log', 'пара', 'пара', 'dvojice', 'pair'], ['log', 'одинаковый', 'аднолькавы', 'stejný', 'the same'], ['log', 'разный', 'розны', 'různý', 'different'],
  ['log', 'память', 'памяць', 'paměť', 'memory'], ['log', 'внимание', 'увага', 'pozornost', 'attention'], ['log', 'робот', 'робат', 'robot', 'robot'],
  ['chess', 'шахматы', 'шахматы', 'šachy', 'chess'], ['chess', 'король', 'кароль', 'král', 'king'], ['chess', 'ферзь', 'ферзь', 'dáma', 'queen'], ['chess', 'ладья', 'ладдзя', 'věž', 'rook'],
  ['chess', 'слон', 'слон', 'střelec', 'bishop'], ['chess', 'конь', 'конь', 'jezdec', 'knight'], ['chess', 'пешка', 'пешка', 'pěšec', 'pawn'], ['chess', 'шах', 'шах', 'šach', 'check'],
  ['chess', 'мат', 'мат', 'mat', 'checkmate'], ['chess', 'шахматная доска', 'шахматная дошка', 'šachovnice', 'chessboard'], ['chess', 'ход', 'ход', 'tah', 'move'], ['chess', 'взять фигуру', 'узяць фігуру', 'vzít figuru', 'capture a piece'],
  ['chess', 'защитить', 'абараніць', 'ochránit', 'protect'],
];
const LANGS = ['ru', 'be', 'cs', 'en'];
const slug = s => s.toLowerCase().replace(/^!/, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const first = s => s.split('|')[0].replace(/^!/, '');
const TERMS = RAW.map(r => ({ id: slug(r[4].split('|')[0]), cat: r[0], ru: first(r[1]), be: first(r[2]), cs: first(r[3]), en: first(r[4]), _f: { ru: r[1], be: r[2], cs: r[3], en: r[4] } }));
/* поиск: в ru/be/cs терпим окончания (склонения), в en — только -s/-es; формы через «|» — дополнительные написания, «!» — не искать в тексте */
const words = s => (s.toLowerCase().match(/[\p{L}]+/gu) || []);
const stemOf = (w, lang) => (lang === 'en' ? { w } : w.length <= 4 ? { w, s: w, extra: 1 } : { w, s: w.slice(0, w.length - (w.length <= 6 ? 1 : 2)), extra: w.length <= 6 ? 2 : 4 });
const EXCL = { cs: ['chybí', 'chybět', 'chybějí'] };
const INDEX = Object.fromEntries(LANGS.map(l => [l, TERMS.flatMap(t => t._f[l].split('|').filter(f => !f.startsWith('!')).map(f => ({ id: t.id, ws: words(f).map(w => stemOf(w, l)) }))).filter(x => x.ws.length)
  .sort((a, b) => b.ws.length - a.ws.length || b.ws[0].w.length - a.ws[0].w.length)]));
const wordHit = (tok, st, lang) => (EXCL[lang] || []).includes(tok) ? false : lang === 'en' ? (tok === st.w || tok === st.w + 's' || tok === st.w + 'es') : (tok.startsWith(st.s) && tok.length <= st.s.length + st.extra);
/* находит термины в строке: [{from, to, id}] по позициям в исходном тексте */
function find(text, lang) {
  const idx = INDEX[lang] || INDEX.ru, toks = []; const re = /[\p{L}]+/gu; let m;
  while ((m = re.exec(text))) toks.push({ w: m[0].toLowerCase(), from: m.index, to: m.index + m[0].length });
  const out = []; let i = 0;
  while (i < toks.length) {
    let hit = null;
    for (const t of idx) { const n = t.ws.length; if (i + n > toks.length) continue; let ok = true; for (let k = 0; k < n; k++) if (!wordHit(toks[i + k].w, t.ws[k], lang)) { ok = false; break; } if (ok) { hit = { n, id: t.id }; break; } }
    if (hit) { out.push({ from: toks[i].from, to: toks[i + hit.n - 1].to, id: hit.id }); i += hit.n; } else i++;
  }
  return out;
}
const byId = Object.fromEntries(TERMS.map(t => [t.id, t]));
TERMS.forEach(t => delete t._f);
const api = { TERMS, CATS, LANGS, byId, find };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Glossary = api;
})(typeof window !== 'undefined' ? window : globalThis);
