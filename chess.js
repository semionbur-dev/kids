'use strict';
/* Шахматы в детской игре (C1–C6): доска, 9 уроков-обучалка, генераторы заданий и банк задач.
   Задания без длинных текстов: фигуры, звёздочки и мишени; слова — только в короткой формулировке (4 языка). */
(() => {
const E = window.ChessEngine, D = window.ChessData, { gen, rnd, pick, shuffle, t, getLang, LANGS } = window.Gens;

/* ---------- названия фигур (C4: не дословный перевод — у чехов střelec, у белорусов ладдзя) ---------- */
const NAMES = {
  K: ['король', 'кароль', 'král', 'king'], Q: ['ферзь', 'ферзь', 'dáma', 'queen'], R: ['ладья', 'ладдзя', 'věž', 'rook'],
  B: ['слон', 'слон', 'střelec', 'bishop'], N: ['конь', 'конь', 'jezdec', 'knight'], P: ['пешка', 'пешка', 'pěšec', 'pawn'],
};
const ACC = {   // винительный падеж («передвинь ладью»)
  K: ['короля', 'караля', 'krále', 'king'], Q: ['ферзя', 'ферзя', 'dámu', 'queen'], R: ['ладью', 'ладдзю', 'věž', 'rook'],
  B: ['слона', 'слана', 'střelce', 'bishop'], N: ['коня', 'каня', 'jezdce', 'knight'], P: ['пешку', 'пешку', 'pěšce', 'pawn'],
};
const li = () => LANGS.indexOf(getLang());
const pieceName = p => NAMES[p.toUpperCase()][li()];
const GLYPH = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };   // закрашенные для обеих сторон; цвет задаётся стилем
const glyph = p => GLYPH[p.toUpperCase()] + '︎';

/* ---------- доска ---------- */
function boardHTML(pos, o = {}) {
  const dests = o.dests || [], hl = o.hl || [];
  let h = `<div class="board${o.static ? ' static' : ''}" role="grid">`;
  for (let i = 0; i < 64; i++) {
    const p = pos.b[i], r = i >> 3, c = i & 7, cls = ['sq', (r + c) % 2 ? 'd' : 'l'];
    if (o.sel === i) cls.push('sel'); if (dests.includes(i)) cls.push('dest', p ? 'cap' : ''); if (o.star === i) cls.push('star'); if (o.tgt === i) cls.push('tgt'); if (hl.includes(i)) cls.push('hl');
    const inner = p ? `<span class="pc ${E.isW(p) ? 'w' : 'b'}">${glyph(p)}</span>` : '';
    h += o.static ? `<div class="${cls.join(' ')}">${inner}</div>` : `<button class="${cls.join(' ')}" data-a="sq" data-i="${i}" aria-label="${E.name(i)}${p ? ' ' + pieceName(p) : ''}">${inner}</button>`;
  }
  return h + '</div>';
}

/* ---------- построение позиций ---------- */
const emptyB = () => Array(64).fill('');
const randSq = (used, rows) => { for (let k = 0; k < 100; k++) { const i = rnd(0, 63); if (!used.has(i) && (!rows || rows.includes(i >> 3))) return i; } return -1; };
const mkPos = b => ({ b, turn: 'w' });
const mkQ = (o, d) => Object.assign({ type: 'board', d, tries: 0 }, o);
const HINT_MOVE = () => t('Нажми на фигуру — подсветятся клетки, куда она может пойти. Потом нажми на звёздочку.', 'Націсні на фігуру — падсвеціцца клеткі, куды яна можа пайсці. Потым націсні на зорку.', 'Klepni na figuru – zvýrazní se pole, kam může jít. Pak klepni na hvězdičku.', 'Tap a piece – the squares it can go to light up. Then tap the star.');
const RULE = {
  R: () => t('Ладья ходит по прямой: вверх, вниз, вправо, влево.', 'Ладдзя ходзіць па прамой: уверх, уніз, управа, улева.', 'Věž chodí po přímce: nahoru, dolů, doprava, doleva.', 'The rook moves straight: up, down, right, left.'),
  B: () => t('Слон ходит по диагонали.', 'Слон ходзіць па дыяганалі.', 'Střelec chodí po úhlopříčce.', 'The bishop moves diagonally.'),
  Q: () => t('Ферзь ходит и как ладья, и как слон.', 'Ферзь ходзіць і як ладдзя, і як слон.', 'Dáma chodí jako věž i jako střelec.', 'The queen moves like a rook and a bishop.'),
  N: () => t('Конь ходит буквой «Г» и перепрыгивает фигуры.', 'Конь ходзіць літарай «Г» і пераскоквае фігуры.', 'Jezdec chodí jako „L“ a přeskakuje figury.', 'The knight moves in an “L” and jumps over pieces.'),
  P: () => t('Пешка ходит вперёд на 1 клетку (с начала — на 2).', 'Пешка ходзіць наперад на 1 клетку (з пачатку — на 2).', 'Pěšec chodí dopředu o 1 pole (ze začátku o 2).', 'The pawn moves forward 1 square (2 from the start).'),
  K: () => t('Король ходит на одну клетку в любую сторону.', 'Кароль ходзіць на адну клетку ў любы бок.', 'Král chodí o jedno pole všemi směry.', 'The king moves one square in any direction.'),
};

/* задание «дойди до звёздочки» */
function moveTask(types, d, nObs) {
  for (let guard = 0; guard < 300; guard++) {
    const b = emptyB(), used = new Set(), mains = [];
    for (const tp of types) { const i = randSq(used, tp === 'P' ? [5, 6] : null); if (i < 0) break; used.add(i); b[i] = tp; mains.push(i); }
    for (let k = 0; k < nObs; k++) { const i = randSq(used, [1, 2, 3, 4, 5, 6]); if (i >= 0) { used.add(i); b[i] = d >= 3 && k % 2 ? 'p' : 'P'; } }
    const pos = mkPos(b), reach = new Map();
    for (const i of mains) for (const j of E.destinations(pos, i)) if (!b[j]) { (reach.get(j) || reach.set(j, []).get(j)).push(i); }
    const targets = [...reach.keys()]; if (!targets.length) continue;
    const star = pick(targets), sols = reach.get(star).map(i => E.name(i) + E.name(star));
    const single = types.length === 1, tp = types[0];
    return mkQ({ fen: E.toFen(pos), solutions: sols, star, key: 'mv' + E.toFen(pos) + star, skill: 'chess', gid: 'chess_move',
      text: single ? t(`Передвинь ${ACC[tp][0]} на звёздочку ⭐`, `Перасунь ${ACC[tp][1]} на зорку ⭐`, `Přesuň ${ACC[tp][2]} na hvězdičku ⭐`, `Move the ${NAMES[tp][3]} to the star ⭐`)
        : t('Дойди до звёздочки ⭐ любой фигурой', 'Дайдзі да зоркі ⭐ любой фігурай', 'Dojdi na hvězdičku ⭐ libovolnou figurou', 'Reach the star ⭐ with any piece'),
      hint: HINT_MOVE(), explain: single ? RULE[tp]() : t('Подойдёт любая фигура, которая может туда пойти.', 'Падыдзе любая фігура, якая можа туды пайсці.', 'Poslouží každá figura, která tam může jít.', 'Any piece that can go there will do.') }, d);
  }
}
/* задание «возьми отмеченную фигуру» */
function captureTask(d, type) {
  for (let guard = 0; guard < 300; guard++) {
    const tp = type || pick(['R', 'B', 'N', 'Q']), b = emptyB(), used = new Set(), i = randSq(used); used.add(i); b[i] = tp;
    const reach = E.pseudo(b, i); if (!reach.length) continue;
    const v = pick(reach); used.add(v); b[v] = pick(['p', 'n', 'b', 'r']);
    for (let k = 0, n = d >= 2 ? rnd(1, 3) : 0; k < n; k++) { const j = randSq(used, [1, 2, 3, 4, 5, 6]); if (j >= 0) { used.add(j); b[j] = pick(['p', 'P']); } }
    const pos = mkPos(b); if (!E.pseudo(b, i).includes(v)) continue;
    const sols = []; for (let j = 0; j < 64; j++) if (b[j] && E.isW(b[j]) && E.pseudo(b, j).includes(v) && b[j] !== 'P') sols.push(E.name(j) + E.name(v));
    if (!sols.length) continue;
    for (let j = 0; j < 64; j++) if (b[j] === 'P' && E.pseudo(b, j).includes(v)) sols.push(E.name(j) + E.name(v));
    return mkQ({ fen: E.toFen(pos), solutions: sols, tgt: v, key: 'cp' + E.toFen(pos), skill: 'chess', gid: 'chess_capture',
      text: t('Возьми отмеченную фигуру 🎯', 'Вазьмі адзначаную фігуру 🎯', 'Vem označenou figuru 🎯', 'Capture the marked piece 🎯'), hint: t('Нажми на фигуру — подсветятся клетки. Потом нажми на мишень.', 'Націсні на фігуру — падсвеціцца клеткі. Потым націсні на мішэнь.', 'Klepni na figuru – zvýrazní se pole. Pak klepni na terč.', 'Tap a piece – squares light up. Then tap the target.'),
      explain: t('Чтобы взять фигуру, поставь свою на её клетку.', 'Каб узяць фігуру, пастаў сваю на яе клетку.', 'Chceš-li vzít figuru, postav svou na její pole.', 'To capture a piece, move yours onto its square.') }, d);
  }
}
/* задание «объяви шах» */
function checkTask(d) {
  for (let guard = 0; guard < 600; guard++) {
    const b = emptyB(), used = new Set(), place = p => { const i = randSq(used); used.add(i); b[i] = p; return i; };
    const wk = place('K'), bk = place('k'); if (Math.max(Math.abs((wk >> 3) - (bk >> 3)), Math.abs((wk & 7) - (bk & 7))) < 2) continue;
    const extra = d <= 1 ? [pick(['Q', 'R'])] : d === 2 ? [pick(['Q', 'R', 'B', 'N'])] : [pick(['Q', 'R']), pick(['B', 'N'])];
    extra.forEach(place); if (d >= 3) place('p');
    const pos = mkPos(b); if (E.inCheck(b, true) || E.inCheck(b, false)) continue;
    const sols = E.legalMoves(pos, true).filter(m => E.inCheck(E.applyMove(pos, m.from, m.to).b, false)).map(m => m.str);
    if (sols.length < 1 || sols.length > 6) continue;
    return mkQ({ fen: E.toFen(pos), solutions: sols, key: 'ck' + E.toFen(pos), skill: 'chess', gid: 'chess_check',
      text: t('Объяви шах чёрному королю!', 'Аб’яві шах чорнаму каралю!', 'Dej černému králi šach!', 'Give check to the black king!'),
      hint: t('Ищи ход, после которого твоя фигура «смотрит» на чёрного короля.', 'Шукай ход, пасля якога твая фігура «глядзіць» на чорнага караля.', 'Hledej tah, po kterém tvá figura „míří“ na černého krále.', 'Look for a move after which your piece “looks at” the black king.'),
      explain: t('Шах — это когда твоя фигура угрожает королю.', 'Шах — гэта калі твая фігура пагражае каралю.', 'Šach je, když tvá figura ohrožuje krále.', 'Check means your piece threatens the king.') }, d);
  }
}
/* задачи из банка */
function puzzle(kind, minD, maxD) {
  const list = D[kind].filter(p => p.d >= minD && p.d <= maxD), p = pick(list.length ? list : D[kind]);
  const pos = E.parse(p.f);
  const texts = {
    mate: [t('Мат в один ход! Найди его.', 'Мат у адзін ход! Знайдзі яго.', 'Mat v jednom tahu! Najdi ho.', 'Mate in one move! Find it.'),
      t('Ищи шах, после которого королю некуда уйти и нечем защититься.', 'Шукай шах, пасля якога каралю няма куды сысці і няма чым абараніцца.', 'Hledej šach, po kterém se král nemá kam hnout ani čím bránit.', 'Look for a check after which the king has nowhere to go and nothing can help.'),
      t('Это мат: король под шахом, и спастись ему нечем.', 'Гэта мат: кароль пад шахам, і ўратавацца яму няма чым.', 'Je to mat: král je v šachu a nemá záchranu.', 'That is checkmate: the king is in check and cannot escape.')],
    win: [t('Забери фигуру, которую нечем защитить.', 'Вазьмі фігуру без абароны.', 'Vem nechráněnou figuru.', 'Capture the undefended piece.'),
      t('Какая фигура соперника осталась без защиты? Возьми её — и тебя не побьют в ответ.', 'Якая фігура суперніка засталася без абароны? Вазьмі яе — і цябе не уб’юць у адказ.', 'Která soupeřova figura zůstala bez ochrany? Vezmi ji – a nikdo tě nevezme zpátky.', 'Which opposing piece has no protection? Take it – nothing can take back.'),
      t('Эту фигуру ничто не защищало — её можно было взять бесплатно.', 'Гэтую фігуру нішто не абараняла — яе можна было ўзяць бясплатна.', 'Tuto figuru nic nechránilo – šlo ji vzít zadarmo.', 'Nothing protected this piece – it could be taken for free.')],
    save: [t('Твоя фигура под угрозой! Защити её.', 'Тваёй фігуры пагражае небяспека! Абарані яе.', 'Tvoje figura je ohrožena! Ochraň ji.', 'Your piece is in danger! Save it.'),
      t('Найди фигуру под ударом: уведи её, прикрой или возьми нападающего.', 'Знайдзі фігуру пад ударам: адвядзі яе, прыкрый або вазьмі нападніка.', 'Najdi figuru pod útokem: odveď ji, kryj ji nebo vezmi útočníka.', 'Find the attacked piece: move it away, protect it or capture the attacker.'),
      t('Теперь все твои фигуры в безопасности.', 'Цяпер усе твае фігуры ў бяспецы.', 'Teď jsou všechny tvé figury v bezpečí.', 'Now all your pieces are safe.')],
  }[kind];
  const marks = {}; if (kind === 'save') { const h = E.hangingList(pos.b, true); marks.tgt = h[0]; }
  return mkQ(Object.assign({ fen: p.f, solutions: p.s.slice(), key: 'pz' + p.f, skill: 'chess', gid: 'chess_' + kind, text: texts[0], hint: texts[1], explain: texts[2] }, marks), p.d);
}

/* ---------- генераторы в общем списке (адаптивные занятия) ---------- */
gen('chess', 'chess_move', 1, d => d <= 1 ? moveTask([pick(['R', 'B', 'Q', 'K'])], 1, 0) : d === 2 ? moveTask([pick(['R', 'B', 'Q', 'N', 'P', 'K'])], 2, rnd(1, 2)) : moveTask(shuffle(['R', 'B', 'Q', 'N', 'K']).slice(0, d >= 4 ? 3 : 2), d, rnd(2, 3)));
gen('chess', 'chess_capture', 2, d => captureTask(d));
gen('chess', 'chess_check', 3, d => checkTask(d - 2));
gen('chess', 'chess_mate', 3, d => puzzle('mate', Math.max(1, d - 3), Math.max(1, d - 1)));
gen('chess', 'chess_win', 4, d => puzzle('win', Math.max(1, d - 3), d - 1));
gen('chess', 'chess_save', 4, d => puzzle('save', Math.max(1, d - 3), d - 1));

/* ---------- уроки-обучалка (C1): 9 уроков, в каждом — объяснение и 5 заданий ---------- */
const LESSONS = [
  { id: 'rook', piece: 'R', name: ['Ладья', 'Ладдзя', 'Věž', 'Rook'], intro: ['Ладья ходит по прямым: вверх, вниз, вправо, влево — на сколько угодно клеток. Через другие фигуры она не прыгает.', 'Ладдзя ходзіць па прамых: уверх, уніз, управа, улева — на колькі заўгодна клетак. Праз іншыя фігуры яна не скача.', 'Věž chodí po přímkách: nahoru, dolů, doprava, doleva – o kolik polí chceš. Přes jiné figury neskáče.', 'The rook moves in straight lines: up, down, right, left – as many squares as you like. It cannot jump over other pieces.'] },
  { id: 'bishop', piece: 'B', name: ['Слон', 'Слон', 'Střelec', 'Bishop'], intro: ['Слон ходит по диагоналям на сколько угодно клеток. Он всегда остаётся на клетках одного цвета.', 'Слон ходзіць па дыяганалях на колькі заўгодна клетак. Ён заўсёды застаецца на клетках аднаго колеру.', 'Střelec chodí po úhlopříčkách o kolik polí chceš. Vždy zůstává na polích jedné barvy.', 'The bishop moves along diagonals, as many squares as you like. It always stays on squares of one colour.'] },
  { id: 'queen', piece: 'Q', name: ['Ферзь', 'Ферзь', 'Dáma', 'Queen'], intro: ['Ферзь — самая сильная фигура: ходит и как ладья, и как слон.', 'Ферзь — самая моцная фігура: ходзіць і як ладдзя, і як слон.', 'Dáma je nejsilnější figura: chodí jako věž i jako střelec.', 'The queen is the strongest piece: she moves like a rook and like a bishop.'] },
  { id: 'knight', piece: 'N', name: ['Конь', 'Конь', 'Jezdec', 'Knight'], intro: ['Конь ходит буквой «Г»: две клетки в одну сторону и одна в сторону. Только он умеет перепрыгивать через фигуры.', 'Конь ходзіць літарай «Г»: дзве клеткі ў адзін бок і адна ўбок. Толькі ён умее пераскокваць праз фігуры.', 'Jezdec chodí jako písmeno „L“: dvě pole jedním směrem a jedno do strany. Jako jediný umí přeskakovat figury.', 'The knight moves in an “L”: two squares one way and one to the side. Only the knight can jump over pieces.'] },
  { id: 'pawn', piece: 'P', name: ['Пешка', 'Пешка', 'Pěšec', 'Pawn'], intro: ['Пешка ходит вперёд на одну клетку, а с начальной позиции может пойти на две. Бьёт она по диагонали вперёд.', 'Пешка ходзіць наперад на адну клетку, а з пачатковай пазіцыі можа пайсці на дзве. Б’е яна па дыяганалі наперад.', 'Pěšec chodí dopředu o jedno pole, ze základního postavení může o dvě. Bere šikmo dopředu.', 'The pawn moves forward one square, or two from its starting square. It captures diagonally forward.'] },
  { id: 'king', piece: 'K', name: ['Король', 'Кароль', 'Král', 'King'], intro: ['Король ходит на одну клетку в любую сторону. Его нельзя оставлять под боем: это шах.', 'Кароль ходзіць на адну клетку ў любы бок. Яго нельга пакідаць пад ударам: гэта шах.', 'Král chodí o jedno pole všemi směry. Nesmí stát pod útokem: to je šach.', 'The king moves one square in any direction. He must not stand under attack: that is check.'] },
  { id: 'capture', piece: null, name: ['Взятие', 'Узяцце', 'Braní', 'Capturing'], intro: ['Чтобы взять фигуру, поставь свою на её клетку. Тогда чужая фигура уходит с доски.', 'Каб узяць фігуру, пастаў сваю на яе клетку. Тады чужая фігура сыходзіць з дошкі.', 'Chceš-li vzít figuru, postav svou na její pole. Cizí figura pak zmizí z šachovnice.', 'To capture a piece, move yours onto its square. The captured piece leaves the board.'] },
  { id: 'check', piece: null, name: ['Шах', 'Шах', 'Šach', 'Check'], intro: ['Шах — это когда твоя фигура угрожает королю соперника. Объяви шах!', 'Шах — гэта калі твая фігура пагражае каралю суперніка. Аб’яві шах!', 'Šach je, když tvá figura ohrožuje soupeřova krále. Dej šach!', 'Check means your piece attacks the opponent’s king. Give check!'] },
  { id: 'mate', piece: null, name: ['Мат', 'Мат', 'Mat', 'Checkmate'], intro: ['Мат — это шах, от которого король не может спастись. Игра выиграна! Найди мат в один ход.', 'Мат — гэта шах, ад якога кароль не можа ўцячы. Гульня выйграна! Знайдзі мат у адзін ход.', 'Mat je šach, před kterým se král nemůže zachránit. Hra je vyhraná! Najdi mat v jednom tahu.', 'Checkmate is a check the king cannot escape. The game is won! Find mate in one move.'] },
];
const lessonName = L => L.name[li()], lessonIntro = L => L.intro[li()];

function lessonTasks(id, n = 5) {
  const L = LESSONS.find(x => x.id === id), out = [], seen = new Set();
  const add = q => { if (q && !seen.has(q.key)) { seen.add(q.key); out.push(q); return true; } return false; };
  for (let guard = 0; out.length < n && guard < 100; guard++) {
    const i = out.length;
    if (L.piece) add(moveTask([L.piece], i < 3 ? 1 : 2, i < 3 ? 0 : rnd(1, 2)));
    else if (id === 'capture') add(captureTask(i < 3 ? 1 : 2));
    else if (id === 'check') add(checkTask(i < 3 ? 1 : 2));
    else add(puzzle('mate', 1, 2));
  }
  return out;
}
/* демонстрационная доска для объяснения: фигура и её ходы */
function introBoard(id) {
  const L = LESSONS.find(x => x.id === id), b = emptyB();
  if (L.piece) { const sq = L.piece === 'P' ? E.idx('e2') : E.idx(L.piece === 'N' ? 'd4' : L.piece === 'K' ? 'e4' : 'd4'); b[sq] = L.piece; if (L.piece === 'P') b[E.idx('d3')] = 'p'; const pos = mkPos(b);
    return boardHTML(pos, { static: true, dests: E.pseudo(b, sq), sel: sq }); }
  if (id === 'capture') { b[E.idx('b2')] = 'R'; b[E.idx('b6')] = 'n'; const pos = mkPos(b); return boardHTML(pos, { static: true, dests: [E.idx('b6')], sel: E.idx('b2'), tgt: E.idx('b6') }); }
  if (id === 'check') { b[E.idx('a1')] = 'R'; b[E.idx('e8')] = 'k'; b[E.idx('g1')] = 'K'; return boardHTML(mkPos(b), { static: true, hl: [E.idx('a8')], dests: [E.idx('a8')] }); }
  const p = D.mate.find(x => x.d === 1), pos = E.parse(p.f); return boardHTML(pos, { static: true, hl: [E.idx(p.s[0].slice(0, 2)), E.idx(p.s[0].slice(2, 4))] });
}

window.Chess = { E, LESSONS, lessonName, lessonIntro, lessonTasks, introBoard, boardHTML, pieceName, glyph, NAMES, puzzle, moveTask, captureTask, checkTask };
})();
