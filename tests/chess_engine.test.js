'use strict';
// Запуск: node tests/chess_engine.test.js
const assert = require('assert'); const E = require('../chess_engine.js');
let passed = 0; const t = (name, fn) => { try { fn(); passed++; console.log('PASS', name); } catch (e) { console.log('FAIL', name, '\n   ', e.message); process.exitCode = 1; } };
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w';
function perft(pos, depth) { if (depth === 0) return 1; const w = pos.turn === 'w'; let n = 0; for (const m of E.legalMoves(pos, w)) n += perft(E.applyMove(pos, m.from, m.to), depth - 1); return n; }

t('Названия клеток: a8=0, h1=63, туда и обратно', () => { assert.strictEqual(E.name(0), 'a8'); assert.strictEqual(E.name(63), 'h1'); assert.strictEqual(E.idx('e4'), 36); for (let i = 0; i < 64; i++) assert.strictEqual(E.idx(E.name(i)), i); });
t('FEN туда и обратно', () => { assert.strictEqual(E.toFen(E.parse(START)), START); });
t('Эталон perft: начальная позиция, глубина 1 = 20', () => assert.strictEqual(perft(E.parse(START), 1), 20));
t('Эталон perft: глубина 2 = 400', () => assert.strictEqual(perft(E.parse(START), 2), 400));
t('Эталон perft: глубина 3 = 8902', () => assert.strictEqual(perft(E.parse(START), 3), 8902));
t('Эталон perft: глубина 4 = 197281', () => assert.strictEqual(perft(E.parse(START), 4), 197281));
t('Конь в углу ходит на 2 клетки, в центре на 8', () => { assert.strictEqual(E.pseudo(E.parse('8/8/8/8/8/8/8/N7 w').b, E.idx('a1')).length, 2); assert.strictEqual(E.pseudo(E.parse('8/8/8/8/3N4/8/8/8 w').b, E.idx('d4')).length, 8); });
t('Ладья на пустой доске: 14 ходов; слон на пустой доске в центре: 13', () => { assert.strictEqual(E.pseudo(E.parse('8/8/8/8/3R4/8/8/8 w').b, E.idx('d4')).length, 14); assert.strictEqual(E.pseudo(E.parse('8/8/8/8/3B4/8/8/8 w').b, E.idx('d4')).length, 13); });
t('Ферзь = ладья + слон (27 ходов с d4)', () => assert.strictEqual(E.pseudo(E.parse('8/8/8/8/3Q4/8/8/8 w').b, E.idx('d4')).length, 27));
t('Короля не пускает под шах: ладья a2 закрывает вторую горизонталь', () => { const p = E.parse('4k3/8/8/8/8/8/r7/4K3 w'); const m = E.legalMoves(p, true).map(x => x.str).sort(); assert.deepStrictEqual(m, ['e1d1', 'e1f1']); });
t('Король может взять незащищённую фигуру, но не защищённую', () => { const a = E.parse('4k3/8/8/8/8/8/4r3/4K3 w'); assert.ok(E.legalMoves(a, true).some(x => x.str === 'e1e2'));
  const b = E.parse('4k3/8/8/8/8/8/4r3/3RK3 w'); /* свой ладья d1 — тут ладья чёрная не защищена, но проверим защиту: чёрный король рядом */ const c = E.parse('8/8/8/8/8/3k4/4r3/4K3 w'); assert.ok(!E.legalMoves(c, true).some(x => x.str === 'e1e2')); });
t('Связанная фигура не может уйти с линии удара', () => { const p = E.parse('4r3/8/8/8/8/8/4B3/4K2k w'); const m = E.legalMoves(p, true).filter(x => x.from === E.idx('e2')); assert.strictEqual(m.length, 0); });
t('Пешка: вперёд на 1 и на 2 с начальной, не бьёт вперёд, бьёт по диагонали', () => {
  const p = E.parse('8/8/8/8/8/3p4/4P3/8 w'); const m = E.pseudo(p.b, E.idx('e2')).map(E.name).sort(); assert.deepStrictEqual(m, ['d3', 'e3', 'e4']);
  const q = E.parse('8/8/8/8/4p3/8/4P3/8 w'); assert.deepStrictEqual(E.pseudo(q.b, E.idx('e2')).map(E.name), ['e3']); });
t('Превращение: пешка на последней горизонтали становится ферзём', () => { const p = E.parse('8/P7/8/8/8/8/8/8 w'); const n = E.applyMove(p, E.idx('a7'), E.idx('a8')); assert.strictEqual(n.b[0], 'Q'); });
t('Мат: Ладья h8 ставит мат (король a8, король b6)', () => { const p = E.parse('k7/8/1K6/8/8/8/8/7R w'); const mates = E.legalMoves(p, true).filter(m => E.isMate(E.applyMove(p, m.from, m.to), false)).map(m => m.str); assert.ok(mates.includes('h1h8'), mates.join()); });
t('Шах без мата: король может уйти', () => { const p = E.parse('4k3/8/8/8/8/8/8/R3K3 w'); const n = E.applyMove(p, E.idx('a1'), E.idx('a8')); assert.ok(E.inCheck(n.b, false)); assert.ok(!E.isMate(n, false)); assert.ok(E.legalMoves(n, false).length > 0); });
t('Пат: нет ходов и нет шаха — это не мат', () => { const p = E.parse('7k/5Q2/6K1/8/8/8/8/8 b'); assert.ok(!E.inCheck(p.b, false)); assert.strictEqual(E.legalMoves(p, false).length, 0); assert.ok(!E.isMate(p, false)); });
t('Защита: фигура, защищённая своей, не «висит»; незащищённая — висит', () => {
  const a = E.parse('4k3/8/8/3r4/8/8/3N4/4K3 w'); /* ладья d5 бьёт коня d2 (по линии d), защитник — король e1 */ assert.ok(!E.hanging(a.b, E.idx('d2')));
  const b = E.parse('4k3/8/8/3r4/8/8/3N4/7K w'); assert.ok(E.hanging(b.b, E.idx('d2'))); });
t('Дешёвая фигура бьёт дорогую: ферзь под боем пешки «висит» даже при защите', () => { const p = E.parse('4k3/8/8/3p4/4Q3/8/8/4K3 w'); assert.ok(E.hanging(p.b, E.idx('e4'))); assert.deepStrictEqual(E.hangingList(p.b, true), [E.idx('e4')]); });
t('destinations: без королей — просто ходы фигуры; с королями — легальные', () => { assert.strictEqual(E.destinations(E.parse('8/8/8/8/3R4/8/8/8 w'), E.idx('d4')).length, 14); assert.strictEqual(E.destinations(E.parse('4r3/8/8/8/8/8/4B3/4K2k w'), E.idx('e2')).length, 0); });

console.log(`\n${passed} проверок пройдено`);
