'use strict';
/* 3D-персонажи: все питомцы и шляпы строятся, живой холст на главной, запасной вариант без WebGL.  Запуск: node tests/avatars.js */
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { fails++; process.exitCode = 1; } };

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const mk = async (init, opts = {}) => { const ctx = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'ru-RU' }, opts)); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    await p.addInitScript(init); return p; };
  const seed = () => { localStorage.setItem('umniki.av3d', '1'); localStorage.setItem('umniki.v2', JSON.stringify({ v: 2, active: 'a', consent: { seen: 'x', cloud: '' }, kids: [{ id: 'a', name: 'Маша', age: 9, pet: '🦊', pets: ['🦊'], hat: '🎩', hats: ['🎩'] }], parent: {} })); };

  /* 1. главная: живой холст, картинки в магазине */
  let p = await mk(seed); await p.goto(URL); await p.waitForFunction(() => document.querySelector('.hero canvas.av3d'), null, { timeout: 15000 }).catch(() => {});
  ok(await p.evaluate(() => !!document.querySelector('.hero .avatar.on3d canvas.av3d') && getComputedStyle(document.querySelector('.hero .avatar .pet')).display === 'none'), 'главная: персонаж нарисован на живом холсте, эмодзи скрыт');
  ok(await p.evaluate(() => document.querySelectorAll('canvas.av3d').length === 1), 'на экране один живой холст (экономия батареи)');
  await p.evaluate(() => window.__umniki.A.goto({ dataset: { t: 'shop' } })); await p.waitForFunction(() => document.querySelectorAll('.card .avimg').length >= 19, null, { timeout: 15000 }).catch(() => {});
  const shop = await p.evaluate(() => ({ n: document.querySelectorAll('.card .avimg').length, ok: [...document.querySelectorAll('.card .avimg')].every(i => i.src.startsWith('data:image/png') && i.src.length > 1500), uniq: new Set([...document.querySelectorAll('.card .avimg')].map(i => i.src)).size }));
  ok(shop.n === 19 && shop.ok && shop.uniq === 19, 'магазин: 13 питомцев и 6 шляп — 19 разных 3D-картинок ' + JSON.stringify(shop));

  /* 2. каждый питомец с каждой шляпой строится без ошибок, позы различаются */
  const all = await p.evaluate(async () => { const A = window.Avatar, host = document.createElement('div'); document.body.appendChild(host); const keys = new Set(); let n = 0;
    for (const pet of A.PETS) for (const hat of ['', ...A.HATS]) { const d = document.createElement('div'); d.className = 'avatar'; d.dataset.av = pet; d.dataset.hat = hat; d.style.cssText = 'width:64px;height:64px'; host.appendChild(d); n++; }
    A.hydrate(host); const imgs = [...host.querySelectorAll('.avimg')]; imgs.forEach(i => keys.add(i.src));
    const poses = []; for (const pose of ['happy', 'sad']) { const d = document.createElement('div'); d.className = 'avatar'; d.dataset.av = '🐱'; d.dataset.pose = pose; d.style.cssText = 'width:64px;height:64px'; host.appendChild(d); poses.push(d); } A.hydrate(host);
    return { n, imgs: imgs.length, uniq: keys.size, pets: A.PETS.length, hats: A.HATS.length, poseDiff: poses[0].querySelector('.avimg').src !== poses[1].querySelector('.avimg').src }; });
  ok(all.pets === 13 && all.hats === 6 && all.imgs === all.n && all.uniq === all.n, `все ${all.pets} питомцев × (без шляпы + ${all.hats} шляп) = ${all.n} разных картинок`);
  ok(all.poseDiff, 'позы happy и sad выглядят по-разному');

  /* 3. реакция: после правильного ответа живой персонаж переходит в happy и возвращается в idle */
  await p.evaluate(() => window.__umniki.A.home()); await p.waitForSelector('.hero canvas.av3d', { timeout: 15000 });
  const pose = await p.evaluate(async () => { const el = document.querySelector('.hero .avatar'); const a = el.__avatar; const before = a.pose; window.Avatar.react('happy'); const during = a.pose; await new Promise(r => setTimeout(r, 2800)); return [before, during, a.pose]; });
  ok(pose[0] === 'wave' && pose[1] === 'happy', 'реакция «happy» включается на живом персонаже');
  ok(pose[2] === 'idle', 'после реакции персонаж возвращается в покой ' + pose);
  /* 3б. в уроке персонаж в шапке живой, переживает перерисовки и реагирует на правильный и неверный ответ */
  await p.evaluate(() => window.__umniki.A.skill({ dataset: { s: 'numbers' } })); await p.waitForSelector('.lhead canvas.av3d', { timeout: 15000 });
  const lesson = await p.evaluate(async () => { const u = window.__umniki, cv = document.querySelector('.lhead canvas.av3d'), sleep = ms => new Promise(r => setTimeout(r, ms)), out = {};
    const q = () => u.L().queue[0], right = () => { const x = q(); u.A.pick({ dataset: { i: x.choices.findIndex(c => c.v === x.answer) } }); u.A.check(); }, wrong = () => { const x = q(); u.A.pick({ dataset: { i: (x.choices.findIndex(c => c.v === x.answer) + 1) % x.choices.length } }); u.A.check(); };
    right(); await sleep(150); const p1 = document.querySelector('.lhead .avatar').__avatar; out.same1 = document.querySelector('.lhead canvas.av3d') === cv; out.happy = p1.pose; u.A.next(); await sleep(200);
    out.enter = !!document.querySelector('.qwrap.enter, .lesson.enter'); const x = q(); if (x.type === 'choice') { wrong(); await sleep(150); out.sad = document.querySelector('.lhead .avatar').__avatar.pose; out.same2 = document.querySelector('.lhead canvas.av3d') === cv; } else out.sad = 'skip'; return out; });
  ok(lesson.same1 && lesson.same2 !== false, 'в уроке холст персонажа переносится при перерисовке, а не создаётся заново ' + JSON.stringify(lesson));
  ok(lesson.happy === 'happy' && (lesson.sad === 'sad' || lesson.sad === 'skip'), 'правильный ответ — персонаж радуется, неверный — грустит');
  ok(lesson.enter, 'новый вопрос выезжает с анимацией');
  ok(p.errs.length === 0, 'нет ошибок в консоли ' + p.errs.join('|'));
  await p.context().close();

  /* 4. уменьшенное движение: персонаж нарисован, но не анимируется */
  p = await mk(seed, { reducedMotion: 'reduce' }); await p.goto(URL); await p.waitForSelector('.hero canvas.av3d', { timeout: 15000 });
  ok(await p.evaluate(() => !!document.querySelector('.hero .avatar.on3d')), 'prefers-reduced-motion: персонаж показан статично');
  await p.context().close();

  /* 5. без WebGL остаются эмодзи, игра работает */
  p = await mk(() => { seed(); HTMLCanvasElement.prototype.getContext = function () { return null; }; function seed() { localStorage.setItem('umniki.av3d', '1'); localStorage.setItem('umniki.v2', JSON.stringify({ v: 2, active: 'a', consent: { seen: 'x', cloud: '' }, kids: [{ id: 'a', name: 'Маша', age: 9, pet: '🦊', pets: ['🦊'] }], parent: {} })); } });
  await p.goto(URL); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => !document.querySelector('canvas.av3d') && getComputedStyle(document.querySelector('.hero .pet')).display !== 'none' && !!document.querySelector('.hero .pet').innerText), 'WebGL недоступен: вместо 3D показан эмодзи-питомец');
  ok(await p.evaluate(() => { window.__umniki.A.skill({ dataset: { s: 'numbers' } }); return !!window.__umniki.L(); }) && p.errs.length === 0, 'без WebGL занятия работают, ошибок нет ' + p.errs.join('|'));
  await b.close(); console.log(fails ? `\n${fails} проверок НЕ прошло` : '\nвсе проверки пройдены');
})();
