'use strict';
// Запуск: node tests/skills.test.js  (без зависимостей)
const assert = require('assert');
const K = require('../skills.js');
let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('PASS', name); } catch (e) { console.log('FAIL', name, '\n   ', e.message); process.exitCode = 1; } };
// воспроизводимый ГСЧ
const rng = seed => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

t('F6: 10 ответов подряд верно → уровень выше', () => { const s = K.newSkills().numbers; let ch; for (let i = 0; i < 10; i++) ch = K.recordResult(s, true); assert.strictEqual(ch, 'up'); assert.strictEqual(s.lvl, 2); });
t('F6: ровно 80% (8 из 10) → уровень выше', () => { const s = K.newSkills().logic; let ch; for (const r of [1,1,1,1,0,1,1,1,0,1]) ch = K.recordResult(s, !!r); assert.strictEqual(ch, 'up'); assert.strictEqual(s.lvl, 2); });
t('F6: 70% (7 из 10) → уровень не меняется', () => { const s = K.newSkills().logic; for (const r of [1,1,1,0,1,1,0,1,0,1]) K.recordResult(s, !!r); assert.strictEqual(s.lvl, 1); });
t('F6: до 10 ответов уровень не меняется', () => { const s = K.newSkills().space; for (let i = 0; i < 9; i++) assert.strictEqual(K.recordResult(s, true), null); assert.strictEqual(s.lvl, 1); });
t('F6: максимум 5, минимум 1', () => { const s = K.newSkills().numbers; for (let i = 0; i < 200; i++) K.recordResult(s, true); assert.strictEqual(s.lvl, 5);
  for (let i = 0; i < 400; i++) K.recordResult(s, false); assert.strictEqual(s.lvl, 1); });
t('F6: после оценки блока окно начинается заново (и при смене уровня, и без неё)', () => { const s = K.newSkills().numbers; for (let i = 0; i < 10; i++) K.recordResult(s, true); assert.deepStrictEqual(s.win, []);
  const q = K.newSkills().numbers; for (const r of [1,1,0,1,0,1,1,0,1,0]) K.recordResult(q, !!r); assert.strictEqual(q.lvl, 1); assert.deepStrictEqual(q.win, []); });
t('F6: уровень меняется не чаще раза в 10 ответов', () => { const s = K.newSkills().numbers; let last = -1, gap = 99; for (let i = 0; i < 300; i++) { const ch = K.recordResult(s, i % 7 !== 0 || i < 100); if (ch) { if (last >= 0) gap = Math.min(gap, i - last); last = i; } } assert.ok(gap >= 10, `gap ${gap}`); });
t('F6: слабый результат (3 из 10) на уровне выше первого — мягко ниже', () => { const s = K.newSkills().numbers; s.lvl = 3; for (const r of [1,0,0,1,0,0,1,0,0,0]) K.recordResult(s, !!r); assert.strictEqual(s.lvl, 2); });

// Симуляции: ребёнок с «способностью» a; вероятность верного ответа на уровне L = clamp(0.95 − 0.17·(L − a))
function simulate(ability, answers, seed) {
  const r = rng(seed), s = K.newSkills().numbers, trace = [];
  for (let i = 0; i < answers; i++) { const p = Math.min(0.98, Math.max(0.05, 0.95 - 0.17 * (s.lvl - ability))); K.recordResult(s, r() < p); trace.push(s.lvl); }
  return { lvl: s.lvl, trace };
}
t('Симуляция: сильный ребёнок (способность 5) быстро доходит до верха и там остаётся', () => {
  for (let seed = 1; seed <= 20; seed++) { const { lvl, trace } = simulate(5, 600, seed); assert.ok(lvl >= 4, `seed ${seed}: уровень ${lvl}`); assert.ok(trace.every(x => x >= 1 && x <= 5)); } });
t('Симуляция: средний уровень монотонно растёт со способностью ребёнка', () => {
  // Модель: на уровне L вероятность верного ответа = 0.95 − 0.17·(L − способность). Равновесие лежит выше «способности»,
  // потому что порог повышения (80%) достигается и при вероятности около 0.6–0.7 за счёт случайности блоков.
  const mean = a => { let s = 0; for (let seed = 1; seed <= 40; seed++) s += simulate(a, 600, seed).lvl; return s / 40; };
  const m = [-1, 1, 3, 5].map(mean);
  assert.ok(m[0] <= 2, `очень слабый: ${m[0]}`); assert.ok(m[3] >= 4.8, `сильный: ${m[3]}`);
  for (let i = 1; i < m.length; i++) assert.ok(m[i] > m[i - 1], `не растёт: ${m}`); });
t('Симуляция: уровень примерно следует за способностью (средний уровень растёт с ней)', () => {
  const avg = a => { let s = 0; for (let seed = 1; seed <= 40; seed++) s += simulate(a, 500, seed).lvl; return s / 40; };
  const r = [1, 2, 3, 4, 5].map(avg); for (let i = 1; i < r.length; i++) assert.ok(r[i] > r[i - 1] - 0.05, `не растёт: ${r}`); assert.ok(r[4] - r[0] > 1.5, `слабый разброс: ${r}`); });
t('Симуляция: уровень не «скачет» каждые несколько ответов (устойчивость)', () => {
  let maxChanges = 0; for (let seed = 1; seed <= 30; seed++) { const { trace } = simulate(3, 400, seed); let c = 0; for (let i = 1; i < trace.length; i++) if (trace[i] !== trace[i - 1]) c++; maxChanges = Math.max(maxChanges, c); }
  assert.ok(maxChanges <= 30, `слишком много смен: ${maxChanges}`); });

t('Звёзды по доле верных с первой попытки', () => { assert.strictEqual(K.starsFor(8, 8), 3); assert.strictEqual(K.starsFor(7, 8), 3); assert.strictEqual(K.starsFor(6, 8), 2); assert.strictEqual(K.starsFor(5, 8), 2); assert.strictEqual(K.starsFor(4, 8), 1); assert.strictEqual(K.starsFor(0, 0), 3); assert.strictEqual(K.starsFor(4, 4), 3); assert.strictEqual(K.starsFor(3, 4), 2); });

t('Даты: addDays через границы месяца и года', () => { assert.strictEqual(K.addDays('2026-12-31', 1), '2027-01-01'); assert.strictEqual(K.addDays('2026-03-01', -1), '2026-02-28'); });

t('История: накопление, обрезка и дни занятий (пропуск дня ничего не обнуляет)', () => {
  const h = {}; K.addHist(h, '2026-11-10', { sec: 300, ses: 1, skill: 'numbers', ok: 3, total: 4 }); K.addHist(h, '2026-11-10', { sec: 60, skill: 'numbers', ok: 1, total: 1 });
  K.addHist(h, '2026-11-14', { sec: 100, ses: 1, skill: 'logic', ok: 2, total: 4 });
  assert.deepStrictEqual(h['2026-11-10'].sk.numbers, [4, 5]); assert.strictEqual(h['2026-11-10'].sec, 360);
  assert.strictEqual(K.daysPlayedTotal(h), 2); assert.strictEqual(K.daysPlayedIn(h, '2026-11-16', 7), 2); assert.strictEqual(K.daysPlayedIn(h, '2026-11-16', 3), 1); assert.strictEqual(K.daysPlayedIn(h, '2026-11-16', 2), 0);
  K.addHist(h, '2025-01-01', { ses: 1 }); K.pruneHist(h, '2026-11-16'); assert.ok(!h['2025-01-01']); });

t('Недельная статистика: 7 дней и предыдущие 7', () => {
  const h = {}; K.addHist(h, '2026-11-16', { sec: 600, ses: 2, skill: 'memory', ok: 6, total: 8 }); K.addHist(h, '2026-11-09', { sec: 300, ses: 1, skill: 'memory', ok: 2, total: 4 });
  const w = K.weekStats(h, '2026-11-16'); assert.strictEqual(w.days.length, 7); assert.strictEqual(w.days[6].date, '2026-11-16'); assert.strictEqual(w.cur.sec, 600); assert.strictEqual(w.prev.sec, 300);
  assert.deepStrictEqual(w.cur.sk.memory, [6, 8]); assert.strictEqual(w.cur.played, 1); });

t('Слияние истории: по дню берём больше данных, ничего не теряем', () => {
  const a = {}, b = {}; K.addHist(a, '2026-11-10', { sec: 100, ses: 1, skill: 'numbers', ok: 2, total: 3 }); K.addHist(b, '2026-11-10', { sec: 200, ses: 1, skill: 'numbers', ok: 5, total: 6 }); K.addHist(b, '2026-11-11', { sec: 50, ses: 1 });
  const m = K.mergeHist(a, b); assert.strictEqual(m['2026-11-10'].sec, 200); assert.deepStrictEqual(m['2026-11-10'].sk.numbers, [5, 6]); assert.ok(m['2026-11-11']); });
t('Слияние навыков: берётся копия с большим числом ответов', () => {
  const a = K.newSkills(), b = K.newSkills(); a.logic.n = 5; a.logic.lvl = 2; b.logic.n = 30; b.logic.lvl = 4; const m = K.mergeSkills(a, b); assert.strictEqual(m.logic.lvl, 4); assert.strictEqual(m.numbers.lvl, 1); });
t('fixSkills чинит повреждённые данные', () => { const s = K.fixSkills({ numbers: { lvl: 99, win: 'x' } }); assert.strictEqual(s.numbers.lvl, 5); assert.deepStrictEqual(s.numbers.win, []); assert.strictEqual(s.chess.lvl, 1); });

const hist = {}; K.addHist(hist, '2026-11-14', { skill: 'numbers', ok: 1, total: 1, ses: 1 }); K.addHist(hist, '2026-11-15', { skill: 'logic', ok: 1, total: 1, ses: 1 }); K.addHist(hist, '2026-11-12', { skill: 'attention', ok: 1, total: 1, ses: 1 });
t('Маршрут: 4 разных навыка, сначала давно не игранные', () => {
  const r = K.pickRoute(hist, K.SKILLS, rng(7)); assert.strictEqual(r.length, 4); assert.strictEqual(new Set(r).size, 4);
  assert.ok(['space', 'memory', 'chess'].includes(r[0]), `первым должен быть непройденный, а не ${r[0]}`); assert.ok(!r.includes('logic') || !r.includes('numbers') || r.length === 4); });
t('Маршрут: учитывает только доступные навыки', () => { const r = K.pickRoute({}, ['numbers', 'logic', 'space'], rng(1)); assert.strictEqual(r.length, 3); });
t('Маршрут: один и тот же на весь день, новый на следующий', () => {
  const S = { hist: {}, route: null }; const r1 = K.ensureRoute(S, '2026-11-16', K.SKILLS, rng(3)).skills.slice(); const r2 = K.ensureRoute(S, '2026-11-16', K.SKILLS, rng(99)).skills;
  assert.deepStrictEqual(r1, r2); const r3 = K.ensureRoute(S, '2026-11-17', K.SKILLS, rng(5)); assert.strictEqual(r3.date, '2026-11-17'); assert.deepStrictEqual(r3.done, []); });
t('Маршрут: за неделю каждый навык встречается (никто не «забыт»)', () => {
  const S = { hist: {}, route: null }, seen = {}; for (let d = 0; d < 7; d++) { const day = K.addDays('2026-11-01', d), r = K.ensureRoute(S, day, K.SKILLS, rng(d + 11));
    for (const s of r.skills) { seen[s] = (seen[s] || 0) + 1; K.addHist(S.hist, day, { skill: s, ok: 1, total: 1, ses: 1 }); } }
  for (const s of K.SKILLS) assert.ok(seen[s] >= 3, `${s}: ${seen[s]}`); });
t('Все генераторы привязаны к навыкам', () => { assert.ok(Object.values(K.SKILL_OF).every(s => K.SKILLS.includes(s))); });

t('PIN: хэш одинаков для одного PIN и соли, разный для других; открытый текст не хранится', () => { const a = K.pinHash('1234', 'x'), b = K.pinHash('1234', 'x'); assert.strictEqual(a, b); assert.notStrictEqual(a, K.pinHash('1235', 'x')); assert.notStrictEqual(a, K.pinHash('1234', 'y')); assert.ok(!a.includes('1234')); });
t('PIN: проверка верного и неверного кода; без PIN проверка всегда неуспешна', () => { const p = K.newParent(); assert.ok(!K.hasPin(p)); assert.ok(!K.checkPin(p, '0000')); K.setPin(p, '4821', 'salt1'); assert.ok(K.hasPin(p)); assert.ok(K.checkPin(p, '4821')); assert.ok(!K.checkPin(p, '4822')); assert.ok(!K.checkPin(p, '')); assert.ok(!JSON.stringify(p).includes('4821')); });
t('Лимит: «без лимита» = бесконечность', () => assert.strictEqual(K.limitLeft(K.newParent(), {}, '2026-11-16'), Infinity));
t('Лимит: вычитается время за сегодня и время текущего занятия', () => { const p = K.newParent(); p.limit = 20; const h = {}; K.addHist(h, '2026-11-16', { sec: 600 }); K.addHist(h, '2026-11-15', { sec: 5000 }); assert.strictEqual(K.limitLeft(p, h, '2026-11-16'), 600); assert.strictEqual(K.limitLeft(p, h, '2026-11-16', 150), 450); assert.ok(K.limitLeft(p, h, '2026-11-16', 700) < 0); });
t('Лимит: добавленное родителем время действует только в тот же день', () => { const p = K.newParent(); p.limit = 10; p.extra = { date: '2026-11-16', min: 15 }; assert.strictEqual(K.limitLeft(p, {}, '2026-11-16'), 25 * 60); assert.strictEqual(K.limitLeft(p, {}, '2026-11-17'), 10 * 60); });
t('Лимит: на следующий день счёт начинается заново', () => { const p = K.newParent(); p.limit = 10; const h = {}; K.addHist(h, '2026-11-16', { sec: 600 }); assert.ok(K.limitLeft(p, h, '2026-11-16') <= 0); assert.strictEqual(K.limitLeft(p, h, '2026-11-17'), 600); });
t('Слияние родительских настроек: побеждает копия, где задан PIN', () => { const a = K.newParent(), b = K.newParent(); K.setPin(b, '1111', 's'); b.limit = 30; assert.strictEqual(K.mergeParent(a, b).limit, 30); assert.ok(K.hasPin(K.mergeParent(a, b))); const c = K.newParent(); K.setPin(c, '2222', 't'); assert.ok(K.checkPin(K.mergeParent(c, b), '2222')); });
t('fixParent чинит повреждённые данные', () => { const p = K.fixParent({ limit: 9999, extra: null, pin: 5 }); assert.strictEqual(p.limit, 180); assert.deepStrictEqual(p.extra, { date: '', min: 0 }); assert.deepStrictEqual(K.fixParent(null), K.newParent()); });

/* ---- двуязычный режим ---- */
const bilOf = o => K.fixBil(Object.assign({ second: 'cs' }, o));
t('Доля второго языка: в среднем точная для 20/30/50/80% (±1 п.п. за 1000 занятий по 8 заданий)', () => {
  for (const share of [20, 30, 50, 80]) { const bil = bilOf({ share }); let on = 0, tot = 0; const r = rng(share);
    for (let i = 0; i < 1000; i++) { const p = K.planLangs(8, bil, r); bil.carry = p.carry; on += p.flags.filter(Boolean).length; tot += 8; }
    assert.ok(Math.abs(100 * on / tot - share) <= 1, `${share}%: получилось ${(100 * on / tot).toFixed(2)}%`); } });
t('Доля в одном занятии отличается от заданной не больше чем на одно задание', () => {
  for (const share of [20, 30, 50, 80]) { const bil = bilOf({ share }), r = rng(7 + share); for (let i = 0; i < 500; i++) { const p = K.planLangs(8, bil, r); bil.carry = p.carry; const k = p.flags.filter(Boolean).length; assert.ok(Math.abs(k - 8 * share / 100) <= 1, `${share}%: ${k} из 8`); } } });
t('Маршрут из 4 заданий тоже даёт точную долю в среднем', () => { const bil = bilOf({ share: 30 }), r = rng(5); let on = 0; for (let i = 0; i < 2000; i++) { const p = K.planLangs(4, bil, r); bil.carry = p.carry; on += p.flags.filter(Boolean).length; } assert.ok(Math.abs(100 * on / 8000 - 30) <= 1); });
t('Погружение: все задания на втором языке', () => assert.ok(K.planLangs(8, bilOf({ mode: 'immersion' })).flags.every(Boolean)));
t('Позиции заданий на втором языке перемешаны (не всегда первые)', () => { const bil = bilOf({ share: 50 }); const seen = new Set(); const r = rng(11); for (let i = 0; i < 60; i++) { const p = K.planLangs(8, bil, r); bil.carry = 0; seen.add(p.flags.join('')); } assert.ok(seen.size > 5); });
t('Адаптация: много «не понял» → доля ниже на одну ступень', () => assert.deepStrictEqual(K.adaptShare(bilOf({ share: 50 }), { n: 20, tap: 10 }, '2026-11-16'), { share: 30, adaptedAt: '2026-11-16', changed: 'down' }));
t('Адаптация: мало «не понял» → доля выше на одну ступень', () => { const r = K.adaptShare(bilOf({ share: 30 }), { n: 30, tap: 1 }, '2026-11-16'); assert.strictEqual(r.share, 50); assert.strictEqual(r.changed, 'up'); });
t('Адаптация: не чаще одного раза в неделю', () => { const b = bilOf({ share: 50, adaptedAt: '2026-11-12' }); assert.strictEqual(K.adaptShare(b, { n: 30, tap: 20 }, '2026-11-16').changed, null); assert.strictEqual(K.adaptShare(b, { n: 30, tap: 20 }, '2026-11-19').changed, 'down'); });
t('Адаптация: мало данных, выключена, погружение, нет второго языка — ничего не меняется', () => { assert.strictEqual(K.adaptShare(bilOf({ share: 50 }), { n: 5, tap: 5 }, '2026-11-16').changed, null); assert.strictEqual(K.adaptShare(bilOf({ share: 50, adapt: false }), { n: 50, tap: 40 }, '2026-11-16').changed, null);
  assert.strictEqual(K.adaptShare(bilOf({ mode: 'immersion' }), { n: 50, tap: 40 }, '2026-11-16').changed, null); assert.strictEqual(K.adaptShare(K.newBil(), { n: 50, tap: 40 }, '2026-11-16').changed, null); });
t('Адаптация: границы 10% и 80% не нарушаются', () => { assert.strictEqual(K.adaptShare(bilOf({ share: 10 }), { n: 30, tap: 30 }, '2026-11-16').changed, null); assert.strictEqual(K.adaptShare(bilOf({ share: 80 }), { n: 50, tap: 0 }, '2026-11-16').changed, null); });
t('fixBil чинит повреждённые данные; bilActive: второй язык должен отличаться от основного', () => { const b = K.fixBil({ share: 77, mode: 'x', carry: 'abc', adapt: 0 }); assert.strictEqual(b.share, 30); assert.strictEqual(b.mode, 'mix'); assert.strictEqual(b.carry, 0);
  assert.ok(K.bilActive({ second: 'cs' }, 'ru')); assert.ok(!K.bilActive({ second: 'ru' }, 'ru')); assert.ok(!K.bilActive({ second: '' }, 'ru')); });
t('История: задания на втором языке, нажатия «не понял», трудные навыки — копятся, сливаются и попадают в неделю', () => {
  const h = {}; K.addHist(h, '2026-11-16', { l2n: 1, l2ok: 1 }); K.addHist(h, '2026-11-16', { l2n: 1, l2ok: 0, tap: 1, hard: 'memory' }); K.addHist(h, '2026-11-15', { tap: 1, hard: 'memory' });
  assert.deepStrictEqual(h['2026-11-16'].l2, { n: 2, ok: 1, tap: 1 }); const w = K.weekStats(h, '2026-11-16'); assert.deepStrictEqual(w.cur.l2, { n: 2, ok: 1, tap: 2 }); assert.strictEqual(w.cur.hard.memory, 2);
  const o = {}; K.addHist(o, '2026-11-16', { l2n: 5, l2ok: 4, tap: 0 }); const m = K.mergeHist(h, o); assert.strictEqual(m['2026-11-16'].l2.n, 5); assert.strictEqual(m['2026-11-16'].l2.tap, 1); });
t('Слияние настроек двуязычного режима: побеждает копия, где задан второй язык', () => { const a = K.newBil(), b = bilOf({ second: 'ru', share: 50 }); assert.strictEqual(K.mergeBil(a, b).second, 'ru'); assert.strictEqual(K.mergeBil(bilOf({ second: 'cs' }), b).second, 'cs'); });

console.log(`\n${passed} проверок пройдено`);
