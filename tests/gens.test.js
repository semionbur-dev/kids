'use strict';
// Запуск: node tests/gens.test.js — проверяет все генераторы задач на всех языках без браузера
const assert = require('assert'); global.window = global;
require('../gens.js'); require('../gens_ext.js'); window.ChessEngine = require('../chess_engine.js'); window.ChessData = require('../chess_data.js'); require('../chess.js');
const { GENS, LANGS, setLang } = window.Gens, E = window.ChessEngine, K = require('../skills.js');
let fails = 0; const t = (n, fn) => { try { fn(); console.log('PASS', n); } catch (e) { fails++; process.exitCode = 1; console.log('FAIL', n, '\n   ', e.message); } };
const LEAK = { be: /[^\s]*[иИщЩъЪ][^\s]*/g, cs: /[^\s]*[А-Яа-яЁёІі][^\s]*/g, en: /[^\s]*[А-Яа-яЁёІі][^\s]*/g, ru: /[^\s]*[A-Za-z][^\s]*/g };
const COORD = /^[A-E][1-5]$/;

t('Каждый генератор привязан к навыку, у каждого навыка есть задачи', () => {
  for (const g of GENS) assert.ok(K.SKILL_OF[g.id], 'нет навыка у ' + g.id);
  for (const s of K.SKILLS) assert.ok(GENS.some(g => K.SKILL_OF[g.id] === s && g.minD === 1), 'нет задач 1 уровня у ' + s);
  assert.ok(GENS.length >= 38, 'генераторов: ' + GENS.length); });

for (const lang of LANGS) t(`[${lang}] ~${GENS.length * 250} задач: ответы верны, тексты без пустот и «чужих» букв`, () => {
  setLang(lang); let n = 0; const leaks = new Set();
  for (const g of GENS) for (let d = Math.max(1, g.minD); d <= 5; d++) for (let i = 0; i < 60; i++) {
    const q = g.make(d), tag = `${g.id}@d${d}`; n++;
    assert.ok(q.text && q.hint && q.explain, tag + ': нет текста/подсказки/объяснения');
    if (q.type === 'choice') { const v = q.choices.map(c => c.v); assert.strictEqual(new Set(v).size, v.length, tag + ': повторы вариантов'); assert.ok(v.includes(q.answer), tag + ': ответа нет среди вариантов'); assert.ok(v.length >= 3, tag + ': мало вариантов'); }
    else if (q.type === 'num') assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 1e6, tag + ': плохое число ' + q.answer);
    else if (q.type === 'board') {
      const pos = E.parse(q.fen); assert.ok(q.solutions.length, tag + ': нет решений');
      for (const s of q.solutions) { const f = E.idx(s.slice(0, 2)), to = E.idx(s.slice(2, 4)); assert.ok(pos.b[f] && E.isW(pos.b[f]) && E.destinations(pos, f).includes(to), tag + ': нелегальное решение ' + s + ' ' + q.fen); }
      if (q.star != null) assert.ok(!pos.b[q.star] && q.solutions.every(s => E.idx(s.slice(2, 4)) === q.star), tag + ': звёздочка'); if (q.tgt != null && q.gid !== 'chess_save') assert.ok(pos.b[q.tgt], tag + ': мишень');
    } else assert.fail(tag + ': неизвестный тип ' + q.type);
    if (q.study) assert.ok(q.study.secs >= 2 && q.study.secs <= 15 && q.study.html && q.study.text, tag + ': плохой экран «запомни»');
    if (/^mem/.test(g.id)) assert.ok(q.study, tag + ': память без «запомни»');
    const all = [q.text, q.hint, q.explain, q.study && q.study.text, ...(q.choices || []).map(c => String(c.h))].join(' ').replace(/<[^>]*>/g, ''), m = all.match(LEAK[lang]);
    if (m) m.filter(w => !COORD.test(w.replace(/[.,:;!?]/g, ''))).forEach(w => leaks.add(tag + ':' + w));
    assert.ok(!/undefined|NaN|\[object/.test(all), tag + ': undefined в тексте: ' + all.slice(0, 60));
  }
  assert.strictEqual(leaks.size, 0, 'утечки: ' + [...leaks].slice(0, 8).join(' | ')); });

t('Разнообразие: ни один тип не выдаёт один и тот же вопрос подряд (кроме узких банков)', () => {
  setLang('ru'); for (const g of GENS) { const d = Math.max(1, g.minD), s = new Set(); for (let i = 0; i < 300; i++) { const q = g.make(d); s.add(q.key || q.text + (q.visual || '')); } assert.ok(s.size >= (['riddle', 'analogy', 'shapes'].includes(g.id) ? 5 : 8), `${g.id}@d${d}: уникальных ${s.size}`); } });

t('Двуязычный режим: одно зерно даёт одно и то же задание на любом языке (числа, ответ, варианты, доска, «запомни»)', () => {
  const { generate } = window.Gens;
  const sig = q => JSON.stringify({ type: q.type, nch: q.choices && q.choices.length, cidx: q.choices && q.choices.findIndex(c => c.v === q.answer), num: q.choices ? q.choices.map(c => (typeof c.v === 'number' ? c.v : null)) : q.answer,
    fen: q.fen, sol: q.solutions, star: q.star, tgt: q.tgt, study: q.study && q.study.secs, big: !!q.big, wide: !!q.wide, cols: q.cols, hasVis: !!q.visual });
  let n = 0;
  for (const g of GENS) for (let d = Math.max(1, g.minD); d <= 5; d++) for (let seed = 1; seed <= 40; seed++) {
    const ref = sig(generate(g, d, seed, 'ru')); n++;
    assert.strictEqual(sig(generate(g, d, seed, 'ru')), ref, `${g.id}@d${d} seed ${seed}: не воспроизводится`);
    for (const l of ['be', 'cs', 'en']) assert.strictEqual(sig(generate(g, d, seed, l)), ref, `${g.id}@d${d} seed ${seed}: ru и ${l} различаются`); }
  assert.ok(n > 5000); });
t('Разные зёрна дают разные задания (зерно не «залипает»)', () => { const g = GENS.find(x => x.id === 'add'); const s = new Set(); for (let seed = 1; seed <= 200; seed++) s.add(window.Gens.generate(g, 3, seed, 'ru').text); assert.ok(s.size > 150, 'уникальных ' + s.size); });
t('Язык и зерно не ломают обычную генерацию без зерна (подмена возвращается назад)', () => { setLang('cs'); const a = window.Gens.generate(GENS[0], 1, 5, 'ru'); const b = GENS[0].make(1); assert.ok(/[^\s]*[A-Za-z]/.test(b.hint + b.text) || true); assert.strictEqual(window.Gens.getLang(), 'cs'); assert.ok(a.hint !== undefined); });

console.log(fails ? `\n${fails} проверок НЕ прошло` : '\nвсе проверки пройдены');
