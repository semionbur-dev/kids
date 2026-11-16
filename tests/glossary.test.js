'use strict';
const assert = require('assert'); const G = require('../glossary.js');
let fails = 0; const t = (n, f) => { try { f(); console.log('PASS ' + n); } catch (e) { fails++; process.exitCode = 1; console.log('FAIL ' + n + '\n    ' + e.message); } };
t('F13: не меньше 100 терминов, id уникальны, все 4 языка заполнены', () => {
  assert.ok(G.TERMS.length >= 100, 'терминов: ' + G.TERMS.length); assert.strictEqual(new Set(G.TERMS.map(x => x.id)).size, G.TERMS.length);
  for (const x of G.TERMS) { assert.ok(G.CATS[x.cat], 'категория ' + x.id); for (const l of G.LANGS) assert.ok(x[l] && x[l].length > 1, x.id + ' ' + l); } });
t('белорусская колонка без русских букв «и», «щ», «ъ»; чешская без кириллицы', () => {
  for (const x of G.TERMS) { assert.ok(!/[иъщ]/i.test(x.be), 'be: ' + x.be); assert.ok(!/[а-яё]/i.test(x.cs + x.en), x.id); } });
t('поиск: слова в склонениях находятся, чужие слова — нет', () => {
  const ids = (s, l) => G.find(s, l).map(h => h.id);
  assert.deepStrictEqual(ids('Найди периметр прямоугольника', 'ru'), ['perimeter', 'rectangle']);
  assert.deepStrictEqual(ids('Это сумка и город, что-то точно', 'ru'), []);
  assert.deepStrictEqual(ids('Найдi obvod obdélníku', 'cs'), ['perimeter', 'rectangle']);
  assert.deepStrictEqual(ids('Which row is the same? Count the squares', 'en'), ['row', 'the_same', 'square']);
  assert.deepStrictEqual(ids('the second row', 'en'), ['row']);
  assert.deepStrictEqual(ids('Мат в один ход', 'ru'), ['checkmate', 'move']);
  assert.deepStrictEqual(ids('поверни по часовой стрелке', 'ru'), ['clockwise']); });
t('позиции совпадений указывают на исходные слова', () => { const s = 'Найди периметр фигуры', f = G.find(s, 'ru'); assert.strictEqual(s.slice(f[0].from, f[0].to), 'периметр'); });
console.log(fails ? `\n${fails} проверок НЕ прошло` : '\nвсе проверки пройдены');
