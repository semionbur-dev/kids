'use strict';
/* Озвучка в браузере с подменой speechSynthesis.  Запуск: node tests/speech.js */
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { fails++; process.exitCode = 1; } };
const MOCK = () => { window.__said = []; const voices = [{ lang: 'ru-RU', name: 'Milena', localService: true, default: true }, { lang: 'cs-CZ', name: 'Zuzana', localService: true }, { lang: 'en-US', name: 'Samantha', localService: true }];
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: function (t) { this.text = t; }, configurable: true }); Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { getVoices: () => voices, cancel() { window.__said.push({ cancel: 1 }); }, speak(u) { window.__said.push({ text: u.text, lang: u.lang, rate: u.rate, vol: u.volume }); setTimeout(() => u.onstart && u.onstart(), 0); setTimeout(() => u.onend && u.onend(), 30); } } }); };
const spoken = p => p.evaluate(() => window.__said.filter(x => x.text && x.text.trim()));
const clear = p => p.evaluate(() => { window.__said.length = 0; });

(async () => {
  const b = await chromium.launch();
  const mk = async (kid, extra) => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'ru-RU' }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    await p.addInitScript(MOCK); await p.addInitScript(k => localStorage.setItem('umniki.v2', JSON.stringify({ v: 2, active: 'a', consent: { seen: 'x', cloud: '' }, kids: [k], parent: {} })), kid); if (extra) await p.addInitScript(extra); await p.goto(URL); return p; };
  const start = (p, skill, q) => p.evaluate(({ skill, q }) => { const u = window.__umniki; u.A.skill({ dataset: { s: skill } }); window.__said.length = 0; if (q) { const g = u.GENS.find(x => x.id === q), x = g.make(2); x.skill = skill; x.gid = q; x.d = 2; x.seed = 7; const L = u.L(); L.queue[0] = x; L.bq = null; L.said = null; u.render(); } }, { skill, q });

  /* 1. малыш 6 лет: по умолчанию «сама читает» */
  let p = await mk({ id: 'a', name: 'Миша', age: 6, pet: '🐼', pets: ['🐼'] });
  ok(await p.evaluate(() => window.__umniki.S().speak === 'auto'), 'возраст 6: по умолчанию «Сама читает»');
  await start(p, 'numbers', 'yadd'); await p.waitForTimeout(150);
  let say = await spoken(p); ok(say.length === 1 && /^(Сколько всего|Было \d+, убрали)/.test(say[0].text) && say[0].lang === 'ru-RU', 'новый вопрос читается сам на языке задания: «' + (say[0] || {}).text + '»');
  ok(say[0].rate < .9, 'для малышей темп медленнее ' + say[0].rate);
  ok(await p.evaluate(() => !!document.querySelector('.qrow .spk')), 'рядом с вопросом есть кнопка 🔊');
  await p.evaluate(() => window.__said.length = 0); await p.tap('.spk'); await p.waitForTimeout(100); say = await spoken(p); ok(say.length === 1, 'кнопка 🔊 повторяет вопрос');
  await p.evaluate(() => window.__said.length = 0);
  await p.evaluate(() => { const u = window.__umniki, q = u.L().queue[0]; u.A.pick({ dataset: { i: 0 } }); }); await p.waitForTimeout(100); say = await spoken(p); ok(say.length === 1 && /\d/.test(say[0].text), 'выбранный вариант озвучивается: «' + (say[0] || {}).text + '»');
  await p.evaluate(() => window.__said.length = 0);
  await p.evaluate(() => { const u = window.__umniki, q = u.L().queue[0], i = q.choices.findIndex(c => c.v === q.answer); u.A.pick({ dataset: { i } }); window.__said.length = 0; u.A.check(); }); await p.waitForTimeout(100); say = await spoken(p);
  ok(say.length === 1 && say[0].text === 'Верно!', 'правильный ответ: «Верно!»');
  await p.evaluate(() => window.__said.length = 0); await p.evaluate(() => window.__umniki.A.next()); await p.waitForTimeout(100); say = await spoken(p); ok(say.length === 1, 'следующий вопрос читается сам');
  await p.evaluate(() => { window.__umniki.A.quit(); }); await p.evaluate(() => window.__said.length = 0);

  /* 2. «запомни»: читается подпись к экрану запоминания, не ответ */
  await p.evaluate(() => window.__umniki.A.home()); await start(p, 'memory', 'memseq'); await p.waitForTimeout(150); say = await spoken(p); ok(say.length >= 1 && /Запомни/.test(say[0].text), 'экран «запомни»: читается «' + (say[0] || {}).text + '»');

  /* 3. числа и знаки превращаются в слова */
  await p.evaluate(() => window.__umniki.A.home()); await start(p, 'numbers', 'mul'); await p.waitForTimeout(150); say = await spoken(p); ok(say.length >= 1 && !/[×=?]/.test(say[0].text.replace(/\?$/, '')) && /умножить|на/.test(say[0].text), 'знак × читается словами: «' + (say[0] || {}).text + '»');
  await p.context().close();

  /* 4. девять лет: по кнопке, само молчит */
  p = await mk({ id: 'a', name: 'Маша', age: 9, pet: '🦊', pets: ['🦊'] });
  ok(await p.evaluate(() => window.__umniki.S().speak === 'tap'), 'возраст 9: по умолчанию «По кнопке»');
  await start(p, 'numbers', 'mul'); await p.waitForTimeout(150); ok((await spoken(p)).length === 0, 'сама не читает'); await p.tap('.spk'); await p.waitForTimeout(100); ok((await spoken(p)).length === 1, 'по нажатию на 🔊 читает');
  await p.context().close();

  /* 5. выключено: ни кнопки, ни звука; настройка в родительской зоне */
  p = await mk({ id: 'a', name: 'Маша', age: 6, pet: '🦊', pets: ['🦊'], speak: 'off', speakSet: true });
  await start(p, 'numbers', 'yadd'); await p.waitForTimeout(150); ok((await spoken(p)).length === 0 && await p.evaluate(() => !document.querySelector('.spk')), 'режим «Выкл»: тишина и нет кнопки');
  await p.evaluate(() => { const u = window.__umniki; u.A.home(); u.unlockParent(); u.setR('parent'); u.render(); });
  ok(await p.evaluate(() => /Белорусская? ✗|Беларуская ✗/.test(document.body.innerText) && /Русский ✓/.test(document.body.innerText) && !!document.querySelector('[data-a=speakmode][data-m=auto]')), 'родительская зона: режимы и какие языки озвучены (белорусский ✗)');
  await p.tap('[data-a=speakmode][data-m=auto]'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => window.__umniki.S().speak === 'auto' && window.__umniki.S().speakSet === true) && (await spoken(p)).some(x => /читать задания/.test(x.text)), 'выбор режима сохраняется и сразу проверяется голосом');
  await p.context().close();

  /* 6. белорусский: голоса нет — молчим и кнопки нет; русский второй язык в билингве читается */
  p = await mk({ id: 'a', name: 'Маша', age: 6, pet: '🦊', pets: ['🦊'], lang: 'be' });
  await start(p, 'numbers', 'yadd'); await p.waitForTimeout(150);
  const be = await p.evaluate(() => ({ lang: window.__umniki.S().lang, btn: !!document.querySelector('.spk') }));
  say = await spoken(p); ok(be.lang === 'be' && say.length === 0 && !be.btn, 'белорусский язык: без голоса — ни звука, ни кнопки');
  await p.evaluate(() => { const u = window.__umniki, x = u.L().queue[0]; x.lang = 'be'; x.seed = 3; u.S().bil = { second: 'ru', mode: 'mix', share: 50, adapt: false, carry: 0, adaptedAt: '' }; u.L().said = null; u.L().alt = true; u.render(); }); await p.waitForTimeout(100); say = await spoken(p); ok(say.length >= 1 && say[say.length - 1].lang === 'ru-RU', 'задание показано на втором языке (русский): читается русским голосом');
  ok(p.errs.length === 0, 'нет ошибок в консоли ' + p.errs.join('|'));
  await b.close(); console.log(fails ? `\n${fails} проверок НЕ прошло` : '\nвсе проверки пройдены');
})();
