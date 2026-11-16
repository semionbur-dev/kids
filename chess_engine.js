'use strict';
/* Компактный шахматный движок для детского приложения: правила ходов, шах, мат.
   Без рокировки, взятия на проходе и выбора превращения (пешка автоматически становится ферзём).
   Нужен для подсветки ходов, обучалки и проверки задач; собственная реализация, без внешних лицензий.
   Доска: массив из 64 символов, индекс = ряд*8 + колонка; ряд 0 — восьмая горизонталь (сверху). Белые — заглавные. */
(function (root) {
const FILES = 'abcdefgh';
const name = i => FILES[i & 7] + (8 - (i >> 3));
const idx = s => (8 - +s[1]) * 8 + FILES.indexOf(s[0]);
const isW = p => !!p && p === p.toUpperCase();
const VAL = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 };
const val = p => VAL[p.toUpperCase()];
const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]], ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function parse(fen) {
  const [pl, tr] = fen.split(' '), b = [];
  for (const ch of pl) { if (ch === '/') continue; if (/\d/.test(ch)) for (let k = 0; k < +ch; k++) b.push(''); else b.push(ch); }
  if (b.length !== 64) throw new Error('bad fen: ' + fen);
  return { b, turn: tr || 'w' };
}
function toFen(pos) {
  let s = '';
  for (let r = 0; r < 8; r++) { let e = 0; for (let c = 0; c < 8; c++) { const p = pos.b[r * 8 + c]; if (!p) e++; else { if (e) { s += e; e = 0; } s += p; } } if (e) s += e; if (r < 7) s += '/'; }
  return s + ' ' + (pos.turn || 'w');
}

/* клетки, которые фигура на i «бьёт» (включая клетки со своими фигурами — так определяется защита) */
function attacks(b, i) {
  const p = b[i]; if (!p) return []; const w = isW(p), t = p.toUpperCase(), r = i >> 3, c = i & 7, out = [];
  const inb = (rr, cc) => rr >= 0 && rr < 8 && cc >= 0 && cc < 8;
  if (t === 'N') { for (const [dr, dc] of KN) if (inb(r + dr, c + dc)) out.push((r + dr) * 8 + c + dc); }
  else if (t === 'K') { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && inb(r + dr, c + dc)) out.push((r + dr) * 8 + c + dc); }
  else if (t === 'P') { const dr = w ? -1 : 1; for (const dc of [-1, 1]) if (inb(r + dr, c + dc)) out.push((r + dr) * 8 + c + dc); }
  else { const dirs = t === 'B' ? DIAG : t === 'R' ? ORTH : DIAG.concat(ORTH);
    for (const [dr, dc] of dirs) { let rr = r + dr, cc = c + dc; while (inb(rr, cc)) { const j = rr * 8 + cc; out.push(j); if (b[j]) break; rr += dr; cc += dc; } } }
  return out;
}
/* ходы без учёта шаха своему королю */
function pseudo(b, i) {
  const p = b[i]; if (!p) return []; const w = isW(p), t = p.toUpperCase();
  if (t !== 'P') return attacks(b, i).filter(j => !b[j] || isW(b[j]) !== w);
  const r = i >> 3, c = i & 7, dr = w ? -1 : 1, start = w ? 6 : 1, out = [], r1 = r + dr;
  if (r1 < 0 || r1 > 7) return out;
  if (!b[r1 * 8 + c]) { out.push(r1 * 8 + c); if (r === start && !b[(r + 2 * dr) * 8 + c]) out.push((r + 2 * dr) * 8 + c); }
  for (const dc of [-1, 1]) { const c2 = c + dc; if (c2 >= 0 && c2 < 8) { const q = b[r1 * 8 + c2]; if (q && isW(q) !== w) out.push(r1 * 8 + c2); } }
  return out;
}
const kingSq = (b, white) => b.indexOf(white ? 'K' : 'k');
function isAttacked(b, sq, byWhite) { for (let i = 0; i < 64; i++) { const p = b[i]; if (p && isW(p) === byWhite && attacks(b, i).includes(sq)) return true; } return false; }
function inCheck(b, white) { const k = kingSq(b, white); return k >= 0 && isAttacked(b, k, !white); }
function applyMove(pos, from, to) {
  const b = pos.b.slice(); let p = b[from]; b[to] = p; b[from] = '';
  if (p === 'P' && (to >> 3) === 0) b[to] = 'Q'; if (p === 'p' && (to >> 3) === 7) b[to] = 'q';
  return { b, turn: pos.turn === 'w' ? 'b' : 'w' };
}
/* полностью легальные ходы стороны (король не остаётся под шахом) */
function legalMoves(pos, white) {
  const out = [];
  for (let i = 0; i < 64; i++) { const p = pos.b[i]; if (!p || isW(p) !== white) continue;
    for (const j of pseudo(pos.b, i)) { const n = applyMove(pos, i, j); if (kingSq(n.b, white) < 0 || !inCheck(n.b, white)) out.push({ from: i, to: j, str: name(i) + name(j) }); } }
  return out;
}
const isMate = (pos, white) => inCheck(pos.b, white) && legalMoves(pos, white).length === 0;
/* клетки, куда можно пойти фигурой на i: полные правила, если на доске есть оба короля, иначе просто ходы фигуры (для уроков) */
function destinations(pos, i) {
  const p = pos.b[i]; if (!p) return []; const w = isW(p);
  if (pos.b.includes('K') && pos.b.includes('k')) return legalMoves(pos, w).filter(m => m.from === i).map(m => m.to);
  return pseudo(pos.b, i);
}
/* фигура на sq «висит»: её бьют и она не защищена, либо её бьёт более дешёвая фигура */
function hanging(b, sq) {
  const p = b[sq]; if (!p || p.toUpperCase() === 'K') return false; const w = isW(p);
  const attackers = []; for (let i = 0; i < 64; i++) { const q = b[i]; if (q && isW(q) !== w && attacks(b, i).includes(sq)) attackers.push(q); }
  if (!attackers.length) return false;
  let defended = false; for (let i = 0; i < 64; i++) { const q = b[i]; if (i !== sq && q && isW(q) === w && attacks(b, i).includes(sq)) { defended = true; break; } }
  return !defended || Math.min(...attackers.map(val)) < val(p);
}
const hangingList = (b, white) => b.map((p, i) => (p && isW(p) === white && hanging(b, i) ? i : -1)).filter(i => i >= 0);

const api = { FILES, name, idx, isW, val, VAL, parse, toFen, attacks, pseudo, kingSq, isAttacked, inCheck, applyMove, legalMoves, isMate, destinations, hanging, hangingList };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ChessEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
