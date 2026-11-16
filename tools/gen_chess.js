'use strict';
/* Генератор банка шахматных задач (запускается разработчиком, не в приложении):  node tools/gen_chess.js > chess_data.js
   Задачи создаются случайными позициями и проверяются движком; в файл попадают позиция и готовые решения.
   Детерминированно (фиксированное зерно), поэтому повторный запуск даёт тот же файл. */
const E = require('../chess_engine.js');
let seed = 20261116;
const rnd = n => { seed = (seed * 1664525 + 1013904223) % 4294967296; return Math.floor(seed / 4294967296 * n); };
const pick = a => a[rnd(a.length)];

function place(wExtra, bExtra) {
  const b = Array(64).fill(''), used = new Set();
  const put = p => { for (let k = 0; k < 60; k++) { const i = rnd(64), r = i >> 3; if (used.has(i)) continue; if ((p === 'P' || p === 'p') && (r === 0 || r === 7)) continue; used.add(i); b[i] = p; return i; } return -1; };
  const wk = put('K'), bk = put('k'); if (wk < 0 || bk < 0) return null;
  if (Math.max(Math.abs((wk >> 3) - (bk >> 3)), Math.abs((wk & 7) - (bk & 7))) < 2) return null;
  for (const p of wExtra) if (put(p) < 0) return null; for (const p of bExtra) if (put(p.toLowerCase()) < 0) return null;
  const pos = { b, turn: 'w' };
  if (E.inCheck(b, true) || E.inCheck(b, false)) return null;
  return pos;
}
const mates = pos => E.legalMoves(pos, true).filter(m => E.isMate(E.applyMove(pos, m.from, m.to), false));

/* ---------- мат в 1 ход ---------- */
const MATE_SPEC = {
  1: [['Q', '']], 2: [['R', ''], ['RR', '']], 3: [['QN', ''], ['RB', ''], ['QB', '']],
  4: [['QP', 'pp'], ['RN', 'p'], ['RP', 'pp']], 5: [['QR', 'ppn'], ['RBN', 'pr'], ['QNP', 'pbp']],
};
function genMate(perD) {
  const out = [], seen = new Set();
  for (let d = 1; d <= 5; d++) {
    let got = 0, tries = 0;
    while (got < perD && tries++ < 400000) {
      const [w, bl] = pick(MATE_SPEC[d]), pos = place([...w], [...bl]); if (!pos) continue;
      const ms = mates(pos); if (!ms.length) continue;
      if (d <= 3 ? ms.length > 2 : ms.length !== 1) continue;
      if (d >= 4 && E.legalMoves(pos, true).length < 10) continue;
      const fen = E.toFen(pos); if (seen.has(fen)) continue; seen.add(fen);
      out.push({ f: fen, s: ms.map(m => m.str), d }); got++;
    }
  }
  return out;
}

/* ---------- возьми незащищённую фигуру ---------- */
function genWin(perD) {
  const out = [], seen = new Set(), got = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (let tries = 0; tries < 800000 && Object.values(got).some(v => v < perD); tries++) {
    const nw = 2 + rnd(3), nb = 2 + rnd(3), w = [], bl = [];
    for (let i = 0; i < nw; i++) w.push(pick(['R', 'B', 'N', 'Q', 'P', 'P', 'N', 'B'])); for (let i = 0; i < nb; i++) bl.push(pick(['R', 'B', 'N', 'P', 'P', 'N', 'B', 'Q']));
    const pos = place(w, bl); if (!pos) continue;
    const ms = E.legalMoves(pos, true), caps = ms.filter(m => pos.b[m.to] && pos.b[m.to].toUpperCase() !== 'K');
    if (!caps.length) continue;
    const free = caps.filter(m => { const n = E.applyMove(pos, m.from, m.to); return !E.isAttacked(n.b, m.to, false); });
    if (free.length !== 1) continue;
    if (mates(pos).length) continue;                         // чтобы не путать с матом
    const d = Math.min(5, caps.length + (nw + nb >= 7 ? 1 : 0)); if (got[d] >= perD) continue;
    const fen = E.toFen(pos); if (seen.has(fen)) continue; seen.add(fen); got[d]++;
    out.push({ f: fen, s: [free[0].str], d });
  }
  return out;
}

/* ---------- защити фигуру ---------- */
function genSave(perD) {
  const out = [], seen = new Set(), got = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (let tries = 0; tries < 1500000 && Object.values(got).some(v => v < perD); tries++) {
    const nw = 2 + rnd(3), nb = 2 + rnd(3), w = [], bl = [];
    for (let i = 0; i < nw; i++) w.push(pick(['R', 'B', 'N', 'Q', 'P', 'N', 'B', 'R'])); for (let i = 0; i < nb; i++) bl.push(pick(['R', 'B', 'N', 'P', 'P', 'N', 'B', 'Q']));
    const pos = place(w, bl); if (!pos) continue;
    const hang = E.hangingList(pos.b, true); if (hang.length !== 1 || E.val(pos.b[hang[0]]) < 3) continue;
    const sols = E.legalMoves(pos, true).filter(m => { const n = E.applyMove(pos, m.from, m.to); return E.hangingList(n.b, true).length === 0; });
    if (sols.length < 1 || sols.length > 8) continue;
    const d = sols.length >= 7 ? 1 : sols.length >= 5 ? 2 : sols.length >= 3 ? 3 : sols.length === 2 ? 4 : 5; if (got[d] >= perD) continue;
    const fen = E.toFen(pos); if (seen.has(fen)) continue; seen.add(fen); got[d]++;
    out.push({ f: fen, s: sols.map(m => m.str), d });
  }
  return out;
}

const data = { mate: genMate(12), win: genWin(10), save: genSave(8) };
const total = data.mate.length + data.win.length + data.save.length;
process.stderr.write(`мат: ${data.mate.length}, возьми: ${data.win.length}, защити: ${data.save.length}, всего ${total}\n`);
console.log('/* Банк шахматных задач. Создан tools/gen_chess.js — не редактируйте вручную.\n   f — позиция (белые снизу, ход белых), s — допустимые ходы-решения, d — сложность 1..5. */');
console.log('(function (r) { var D = ' + JSON.stringify(data) + ';\n if (typeof module !== "undefined" && module.exports) module.exports = D; else r.ChessData = D; })(typeof window !== "undefined" ? window : globalThis);');
