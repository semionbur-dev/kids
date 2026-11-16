'use strict';
/* Профили детей (F2/F3), возраст и подбор заданий (F5/F6).  Запуск: node tests/profiles.js */
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { fails++; process.exitCode = 1; } };
const U = (p, f, a) => p.evaluate(f, a);

(async () => {
  const b = await chromium.launch();
  const mk = async (init) => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'ru-RU' }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    if (init) await p.addInitScript(init); await p.goto(URL); return p; };

  /* 1. миграция: старое сохранение umniki.v1 превращается в одного ребёнка, ничего не теряется */
  let p = await mk(() => { if (!localStorage.getItem('umniki.v2')) localStorage.setItem('umniki.v1', JSON.stringify({ name: 'Маша', pet: '🐶', pets: ['🐶'], xp: 120, coins: 7, stat: { lessons: 3, correct: 10, perfect: 1, bestCombo: 2, routes: 1 }, parent: { pin: 'x', salt: 'y', limit: 20, extra: { date: '', min: 0 } }, skills: { logic: { lvl: 3, win: [], n: 30, ok: 20 } } })); });
  let st = await U(p, () => { const u = window.__umniki, S = u.S(); return { n: u.FAM().kids.length, id: S.id, name: S.name, xp: S.xp, lg: S.skills.logic.lvl, pin: S.parent.pin, lim: S.parent.limit, age: S.age }; });
  ok(st.n === 1 && st.id === 'k1' && st.name === 'Маша' && st.xp === 120 && st.lg === 3 && st.pin === 'x' && st.lim === 20 && st.age === 0, 'миграция v1 → v2: ребёнок, прогресс, PIN и лимит сохранены ' + JSON.stringify(st));
  ok(await U(p, () => !document.querySelector('.who') && !!document.querySelector('.hero')), 'один ребёнок: сразу главный экран, без выбора профиля');

  /* 2. родитель добавляет ребёнка 6 лет */
  await U(p, () => { const u = window.__umniki; u.unlockParent(); u.setR('parent'); u.render(); });
  ok(await U(p, () => document.querySelectorAll('.kidrow').length === 1 && !!document.querySelector('[data-a=kadd]')), 'родительская зона: список детей и кнопка «добавить»');
  await p.tap('[data-a=kadd]'); ok(await U(p, () => !!document.querySelector('#kn')), 'экран нового профиля');
  await p.tap('[data-a=ksave]'); ok(await U(p, () => window.__umniki.FAM().kids.length === 1), 'без имени и возраста не сохраняется');
  await p.fill('#kn', 'Миша'); await p.tap('[data-a=kage][data-n="6"]'); ok(await U(p, () => document.querySelector('#kn').value === 'Миша'), 'имя не теряется при выборе возраста');
  await p.tap('[data-a=kpet][data-e="🦊"]'); await p.tap('[data-a=ksave]');
  st = await U(p, () => { const u = window.__umniki, k = u.FAM().kids[1]; return { n: u.FAM().kids.length, name: k.name, age: k.age, pet: k.pet, lg: k.skills.logic.lvl, nu: k.skills.numbers.lvl, act: u.S().name, par: !!document.querySelector('.kidrow') }; });
  ok(st.n === 2 && st.name === 'Миша' && st.age === 6 && st.pet === '🦊' && st.lg === 1 && st.nu === 1 && st.act === 'Маша', 'добавлен Миша, 6 лет, уровень 1; активным остаётся прежний ребёнок ' + JSON.stringify(st));

  /* 3. возраст влияет на старт и набор заданий */
  await U(p, () => window.__umniki.FAM().kids.push(Object.assign(window.__umniki.defState(), { id: 'kz', name: 'Зоя', age: 10, pet: '🐼', pets: ['🐼'], skills: window.Skills.newSkills(10) })));
  st = await U(p, () => { const u = window.__umniki, z = u.FAM().kids[2], K = window.Skills; u.useKid(z.id); const ids = k => u.skillPool(k, 5).map(g => g.id);
    const r = { zl: z.skills.logic.lvl, zn: z.skills.numbers.lvl, zm: z.skills.memory.lvl, zc: z.skills.chess.lvl, zNum: ids('numbers').length };
    u.useKid(u.FAM().kids[1].id); r.mNum = ids('numbers'); r.mSp = ids('space'); r.mLg = ids('logic'); r.mAt = ids('attention'); r.mMem = ids('memory'); u.useKid('k1'); r.aNum = ids('numbers').length; r.aSp = ids('space').length;
    const sk = K.newSkills(8); r.a8 = [sk.numbers.lvl, sk.logic.lvl, sk.attention.lvl, sk.chess.lvl]; const x = K.newSkills(0); x.numbers.n = 5; x.numbers.lvl = 4; K.applyAge(x, 10); r.ap = [x.numbers.lvl, x.logic.lvl]; return r; });
  ok(st.zl === 3 && st.zn === 3 && st.zm === 2 && st.zc === 1, 'возраст 10: старт — числа/логика/пространство 3, память 2, шахматы 1');
  ok(JSON.stringify(st.a8) === '[2,2,1,1]', 'возраст 8: уровень 2 в числах и логике, внимание 1, шахматы 1');
  ok(JSON.stringify(st.ap) === '[4,3]', 'смена возраста меняет старт только у навыков без ответов (числа с ответами остались на 4)');
  ok(st.mNum.every(id => ['add', 'sub', 'ycount', 'yadd', 'ymore'].includes(id)) && st.mNum.length >= 4, 'возраст 6: в числах только простые задания на картинках ' + st.mNum.join(','));
  ok(st.mLg.every(id => ['seq', 'odd', 'pattern'].includes(id)) && st.mSp.every(id => ['robot', 'mirror', 'where'].includes(id)) && st.mAt.length === 6 && st.mMem.length === 6, 'возраст 6: логика/пространство без «чтения», внимание и память целиком');
  ok(st.aNum > 10 && st.aSp >= 8, 'ребёнок без «детского» возраста: полный набор заданий (' + st.aNum + ' чисел, ' + st.aSp + ' пространство)');

  /* 4. выбор профиля картинкой, переключение, общий PIN */
  await U(p, () => { const u = window.__umniki; u.FAM().kids.pop(); u.useKid('k1'); u.save(); });
  console.log('v2 before reload:', await U(p, () => (localStorage.getItem('umniki.v2') || '').length + ' ' + window.__umniki.FAM().kids.map(k => k.id)));
  await p.reload(); await p.waitForTimeout(300);
  ok(await U(p, () => document.querySelectorAll('.whoc').length === 2), 'после перезапуска с двумя детьми — экран «Кто занимается?» ' + await U(p, () => document.querySelectorAll('.whoc').length + ' ' + window.__umniki.FAM().kids.map(k => k.id) + ' ' + document.body.innerText.slice(0, 60).replace(/\n/g, '/')));
  await p.tap('.whoc:nth-child(2)'); st = await U(p, () => { const S = window.__umniki.S(); return { n: S.name, hero: !!document.querySelector('.hero'), pin: S.parent.pin }; });
  ok(st.n === 'Миша' && st.hero && st.pin === 'x', 'тап по картинке открывает профиль Миши; PIN общий');
  await p.evaluate(() => { const S = window.__umniki.S(); S.xp = 50; S.coins = 9; window.__umniki.save(); });
  await p.evaluate(() => window.__umniki.A.profile()); ok(await U(p, () => !!document.querySelector('[data-a=switchkid]')), 'в профиле есть «Сменить профиль»');
  await p.tap('[data-a=switchkid]'); await p.tap('.whoc:nth-child(1)');
  st = await U(p, () => { const u = window.__umniki; return { a: u.S().name, axp: u.S().xp, m: u.FAM().kids[1].xp }; }); ok(st.a === 'Маша' && st.axp === 120 && st.m === 50, 'прогресс детей раздельный');

  /* 5. правка и удаление */
  await U(p, () => { const u = window.__umniki; u.unlockParent(); u.setR('parent'); u.render(); });
  await p.tap('[data-a=kedit][data-id="' + await U(p, () => window.__umniki.FAM().kids[1].id) + '"]'); await p.fill('#kn', 'Миша-2'); await p.tap('[data-a=kage][data-n="8"]'); await p.tap('[data-a=ksave]');
  st = await U(p, () => { const k = window.__umniki.FAM().kids[1]; return [k.name, k.age, k.skills.numbers.lvl]; }); ok(st[0] === 'Миша-2' && st[1] === 8 && st[2] === 2, 'правка имени и возраста: старт пересчитан ' + st);
  await p.tap('[data-a=kedit][data-id="' + await U(p, () => window.__umniki.FAM().kids[1].id) + '"]'); await p.tap('[data-a=kdel]'); await p.tap('[data-mi="1"]');
  ok(await U(p, () => window.__umniki.FAM().kids.length === 1 && window.__umniki.S().name === 'Маша'), 'удаление профиля с подтверждением');
  ok(await U(p, () => !document.querySelector('[data-a=kdel]')) , 'единственного ребёнка удалить нельзя');

  /* 6. слияние с облаком по id: дети не дублируются, новый пустой профиль не плодится */
  st = await U(p, () => { const u = window.__umniki, mk = (id, name, xp) => Object.assign(u.defState(), { id, name, xp, age: 7, skills: window.Skills.newSkills(7) });
    const loc = { kids: [mk('k1', 'Маша', 100), mk('knew', 'Пустой', 0)], parent: window.Skills.newParent(), active: 'k1' }, rem = { kids: [mk('k1', 'Маша', 300), mk('k2', 'Миша', 40)], parent: window.Skills.newParent() };
    const m = u.mergeFam(loc, rem); const rev = u.mergeFam(rem, { kids: [mk('k1', 'Маша', 100)], parent: window.Skills.newParent() });
    return { ids: m.kids.map(k => k.id).join(), xp: m.kids[0].xp, rid: rev.kids.map(k => k.id).join() }; });
  ok(st.ids === 'k1,k2' && st.xp === 300 && st.rid === 'k1,k2', 'слияние семьи: по id, максимум прогресса, без дублей ' + JSON.stringify(st));

  /* 7. новые задания рисуются */
  await p.evaluate(() => { const u = window.__umniki; u.useKid('k1'); u.setR('home'); u.render(); });
  for (const id of ['rotate', 'symm', 'where', 'unpair', 'ycount', 'yadd', 'ymore']) {
    const r = await p.evaluate(id => { const u = window.__umniki, g = u.GENS.find(x => x.id === id); const q = g.make(3); q.skill = window.Skills.SKILL_OF[id]; q.gid = id; q.d = 3; const L = u.L(); return !!g && !!q.text; }, id); ok(r, 'генератор ' + id + ' выдаёт задание'); }
  ok(p.errs.length === 0, 'нет ошибок в консоли ' + p.errs.join('|'));
  await b.close(); console.log(fails ? `\n${fails} проверок НЕ прошло` : '\nвсе проверки пройдены');
})();
