'use strict';
const assert = require('assert'); const S = require('../speech.js');
let fails = 0; const t = (n, f) => { try { f(); console.log('PASS ' + n); } catch (e) { fails++; process.exitCode = 1; console.log('FAIL ' + n + '\n    ' + e.message); } };
t('знаки, дроби и пропуски произносятся словами на 4 языках', () => {
  assert.strictEqual(S.normalize('9 + 7 × 3 = ?', 'ru'), '9 плюс 7 умножить на 3 равно?');
  assert.strictEqual(S.normalize('12 : 3 − 1', 'cs'), '12 děleno 3 mínus 1');
  assert.strictEqual(S.normalize('6 ÷ 2', 'en'), '6 divided by 2');
  assert.strictEqual(S.normalize('Чему равна <span class="fr"><i>1</i><i>3</i></span> от 12?', 'ru'), 'Чему равна 1 на 3 от 12?');
  assert.strictEqual(S.normalize('3 + <span class="blank">?</span> = 5', 'be'), '3 плюс прапушчаны лік роўна 5'); });
t('эмодзи называются, единицы читаются словами, разметка и стрелки убираются', () => {
  assert.strictEqual(S.normalize('Сколько 🍎 на картинке?', 'ru'), 'Сколько яблоко на картинке?');
  assert.strictEqual(S.normalize('Kolik je to 🐶?', 'cs'), 'Kolik je to pes?');
  assert.strictEqual(S.normalize('Периметр 12 см. Чему равна сторона (в см)?', 'ru'), 'Периметр 12 сантиметров. Чему равна сторона в сантиметрах?');
  assert.strictEqual(S.normalize('<b>Turn</b> it ↻ now', 'en'), 'Turn it now'); });
t('в 4 языках после обработки нет ни разметки, ни неназванных эмодзи, ни слов undefined', () => {
  global.window = global; require('../gens.js'); require('../gens_ext.js'); require('../gens_more.js'); window.ChessEngine = require('../chess_engine.js'); window.ChessData = require('../chess_data.js'); require('../chess.js');
  const { GENS, setLang } = window.Gens, bad = new Set(); let n = 0;
  for (const lang of S.LANGS) { setLang(lang); for (const g of GENS) for (let d = Math.max(1, g.minD); d <= 5; d++) for (let i = 0; i < 30; i++) {
    const q = g.make(d), parts = [q.text]; if (q.study) parts.push(q.study.text); if (q.choices) q.choices.forEach(c => { if (/^[\p{L}\d\s.,:−+×÷-]+$/u.test(String(c.h).replace(/<[^>]*>/g, ''))) parts.push(c.h); });
    for (const p of parts) { const o = S.normalize(p, lang); n++; if (/[<>]|undefined|NaN/.test(o) || /\p{Extended_Pictographic}/u.test(o)) bad.add(`${lang}:${g.id}: ${o.slice(0, 60)}`); } } }
  assert.strictEqual(bad.size, 0, [...bad].slice(0, 6).join(' | ')); });
console.log(fails ? `\n${fails} проверок НЕ прошло` : '\nвсе проверки пройдены');
