'use strict';
// Запуск: node tests/chess_data.test.js — заново проверяет каждую задачу банка движком (C2, C3)
const assert = require('assert'); const E = require('../chess_engine.js'); const D = require('../chess_data.js');
let passed = 0; const t = (name, fn) => { try { fn(); passed++; console.log('PASS', name); } catch (e) { console.log('FAIL', name, '\n   ', e.message); process.exitCode = 1; } };
const all = [...D.mate, ...D.win, ...D.save];
t('C2: минимум 150 задач трёх типов', () => { assert.ok(all.length >= 150, String(all.length)); assert.ok(D.mate.length >= 50 && D.win.length >= 40 && D.save.length >= 30); });
t('Сложность 1..5 есть в каждом типе', () => { for (const k of ['mate', 'win', 'save']) for (let d = 1; d <= 5; d++) assert.ok(D[k].some(p => p.d === d), `${k} d${d}`); });
t('Нет повторяющихся позиций', () => { const s = new Set(all.map(p => p.f)); assert.strictEqual(s.size, all.length); });
t('Общее для всех: ход белых, оба короля, никто не под шахом, решения легальны', () => {
  for (const p of all) { const pos = E.parse(p.f); assert.strictEqual(pos.turn, 'w', p.f); assert.ok(pos.b.includes('K') && pos.b.includes('k'), p.f);
    assert.ok(!E.inCheck(pos.b, true) && !E.inCheck(pos.b, false), 'шах в начале: ' + p.f); const legal = E.legalMoves(pos, true).map(m => m.str);
    assert.ok(p.s.length >= 1 && p.s.every(s => legal.includes(s)), 'решение нелегально: ' + p.f); assert.ok(p.d >= 1 && p.d <= 5); } });
t('Мат в 1: каждое решение — мат, и других матов в позиции нет', () => {
  for (const p of D.mate) { const pos = E.parse(p.f), all = E.legalMoves(pos, true), mates = all.filter(m => E.isMate(E.applyMove(pos, m.from, m.to), false)).map(m => m.str).sort();
    assert.deepStrictEqual(mates, p.s.slice().sort(), p.f); } });
t('Возьми незащищённую: решение — взятие небитой фигуры; такое взятие ровно одно; мата в 1 нет', () => {
  for (const p of D.win) { const pos = E.parse(p.f); assert.strictEqual(p.s.length, 1); const m = E.legalMoves(pos, true).find(x => x.str === p.s[0]);
    assert.ok(pos.b[m.to] && pos.b[m.to].toUpperCase() !== 'K', 'не взятие: ' + p.f); assert.ok(!E.isAttacked(E.applyMove(pos, m.from, m.to).b, m.to, false), 'взятие под боем: ' + p.f);
    const free = E.legalMoves(pos, true).filter(x => pos.b[x.to] && pos.b[x.to].toUpperCase() !== 'K' && !E.isAttacked(E.applyMove(pos, x.from, x.to).b, x.to, false));
    assert.strictEqual(free.length, 1, p.f); assert.ok(!E.legalMoves(pos, true).some(x => E.isMate(E.applyMove(pos, x.from, x.to), false)), 'есть мат: ' + p.f); } });
t('Защити фигуру: ровно одна фигура под угрозой; решения — все ходы, после которых ничего не висит', () => {
  for (const p of D.save) { const pos = E.parse(p.f), h = E.hangingList(pos.b, true); assert.strictEqual(h.length, 1, p.f); assert.ok(E.val(pos.b[h[0]]) >= 3);
    const safe = E.legalMoves(pos, true).filter(m => E.hangingList(E.applyMove(pos, m.from, m.to).b, true).length === 0).map(m => m.str).sort();
    assert.deepStrictEqual(safe, p.s.slice().sort(), p.f); assert.ok(p.s.length <= 8); } });
t('Сложность «защити» согласована с числом решений (меньше решений — сложнее)', () => { for (const p of D.save) { const e = p.s.length >= 7 ? 1 : p.s.length >= 5 ? 2 : p.s.length >= 3 ? 3 : p.s.length === 2 ? 4 : 5; assert.strictEqual(p.d, e); } });
console.log(`\n${passed} проверок пройдено`);
