'use strict';
/* Сквозная проверка в браузере (нужен Playwright: npm i playwright).  Запуск:  node tests/e2e.js
   1) на каждом из 4 языков проходит все экраны и ищет «чужие» буквы (утечки непереведённого текста);
   2) проверяет игровой цикл: маршрут дня, адаптивность, отсутствие штрафов, отчёт;
   3) проверяет облачную синхронизацию новых данных (на имитации Firebase). */
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { fails++; process.exitCode = 1; } };

const LEAK = { be: /[^\s]*[иИщЩъЪ][^\s]*/g, cs: /[^\s]*[А-Яа-яЁёІі][^\s]*/g, en: /[^\s]*[А-Яа-яЁёІі][^\s]*/g, ru: /[^\s]*[A-Za-z][^\s]*/g };
const ALLOW = /^(PIN|Беларуская|БЕЛАРУСКАЯ|Русский|РУССКИЙ|XP|Google|GOOGLE|Firebase|Anna|Čeština|ČEŠTINA|English|ENGLISH|[A-E][1-5]|[A-E]|[a-h][1-8]|[1-9]?\d?[A-Z]?)$/;

async function newPage(b, locale) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => m.type() === 'error' && p.errs.push(m.text()));
  await p.goto(URL); return p;
}
const answerNow = async (p, right = true) => {
  const q = await p.evaluate(() => { const q = window.__umniki.L().queue[0]; return { type: q.type, ans: q.answer, ch: q.choices && q.choices.map(c => c.v), study: !!q.study, sol: q.solutions }; });
  if (q.type === 'board') { const f = (8 - +q.sol[0][1]) * 8 + 'abcdefgh'.indexOf(q.sol[0][0]), to = (8 - +q.sol[0][3]) * 8 + 'abcdefgh'.indexOf(q.sol[0][2]); await p.tap(`.sq[data-i="${f}"]`); await p.tap(`.sq[data-i="${to}"]`); return; }
  if (q.study) await p.tap('[data-a=ready]');
  const q2 = await p.evaluate(() => { const q = window.__umniki.L().queue[0]; return { type: q.type, ans: q.answer, ch: q.choices && q.choices.map(c => c.v) }; });
  if (q2.type === 'choice') { let i = q2.ch.indexOf(q2.ans); if (!right) i = (i + 1) % q2.ch.length; await p.tap(`[data-a=pick][data-i="${i}"]`); } else for (const c of String(right ? q2.ans : q2.ans + 1)) await p.tap(`[data-a=key][data-k="${c}"]`);
  await p.tap('[data-a=check]');
};
const playAll = async (p, wrongAt = -1) => { for (let g = 0; g < 40; g++) { if (await p.evaluate(() => !!document.querySelector('.result'))) return; await answerNow(p, g !== wrongAt); await p.tap('[data-a=next]'); } };

/* ---------- 1. языки: утечки на всех экранах ---------- */
async function langPass(b, locale, lang) {
  const p = await newPage(b, locale), leaks = [];
  const scan = async tag => { const t = await p.evaluate(() => document.body.innerText), m = (t.match(LEAK[lang]) || []).map(w => w.replace(/[.,:;!?«»„“"()\/‑–—]/g, '')).filter(w => w && !ALLOW.test(w)); if (m.length) leaks.push(`${tag}: ${[...new Set(m)].join(', ')}`); };
  await scan('onboard'); await p.fill('#nm', 'Anna'); await p.tap('[data-a=obstart]'); await scan('home');
  for (const s of ['numbers', 'logic', 'space', 'attention', 'memory']) {
    await p.evaluate(s => window.__umniki.A.skill({ dataset: { s } }), s);
    const first = await p.evaluate(() => !!window.__umniki.L().queue[0].study); await scan('q:' + s);
    // каждый второй тип вопроса: просматриваем несколько заданий (включая экран «запомни»)
    for (let g = 0; g < 8; g++) { if (await p.evaluate(() => !!document.querySelector('.result'))) break; await scan(`q:${s}#${g}`); await answerNow(p, g !== 2); await scan(`fb:${s}#${g}`); await p.tap('[data-a=next]'); }
    await scan('result:' + s); await p.evaluate(() => window.__umniki.A.home());
  }
  await p.evaluate(() => window.__umniki.A.chess()); await scan('chess-hub');
  await p.evaluate(() => window.__umniki.A.clesson({ dataset: { id: 'knight' } })); await scan('chess-intro'); await p.tap('[data-a=begin]'); await scan('chess-task');
  for (let g = 0; g < 5; g++) { if (await p.evaluate(() => !!document.querySelector('.result'))) break; if (g === 1) { for (let k = 0; k < 2; k++) { const sq = await p.evaluate(() => { const q = window.__umniki.L().queue[0], f = (8 - +q.solutions[0][1]) * 8 + 'abcdefgh'.indexOf(q.solutions[0][0]), t = (8 - +q.solutions[0][3]) * 8 + 'abcdefgh'.indexOf(q.solutions[0][2]); return { f, t }; });
      await p.tap(`.sq[data-i="${sq.f}"]`); const bad = await p.evaluate(t => [...document.querySelectorAll('.sq.dest')].map(e => +e.dataset.i).find(x => x !== t), sq.t); if (bad != null) await p.tap(`.sq[data-i="${bad}"]`); if (k === 0) await scan('chess-retry'); }
      await scan('chess-reveal'); } else await answerNow(p); await p.tap('[data-a=next]'); }
  await scan('chess-result');
  for (const kind of ['chess_mate', 'chess_win', 'chess_save', 'chess_check', 'chess_capture']) { await p.evaluate(() => window.__umniki.A.cpractice());
    await p.evaluate(k => { const u = window.__umniki, g = u.GENS.find(x => x.id === k), q = g.make(4); q.skill = 'chess'; q.gid = k; q.d = 4; const L = u.L(); L.queue[0] = q; L.bq = null; L.answered = false; u.render(); }, kind); await scan('chess:' + kind);
    await p.evaluate(() => window.__umniki.A.quit()); await p.tap('[data-mi="1"]'); }
  await p.evaluate(() => { const u = window.__umniki, S = u.S(), K = window.Skills, t = K.dayStr(new Date()); K.addHist(S.hist, t, { sec: 700, ses: 2, skill: 'numbers', ok: 6, total: 8 }); K.addHist(S.hist, K.addDays(t, -9), { sec: 100, ses: 1, skill: 'logic', ok: 2, total: 4 });
    for (const k of Object.keys(S.skills)) { S.skills[k].n = 20; S.skills[k].ok = 10 + (k.length % 3) * 3; } S.stat.lessons = 5; S.chessLessons = { rook: 3 }; });
  for (const r of ['report', 'parent', 'profile', 'awards', 'shop', 'chess']) { await p.evaluate(r => { window.__umniki.unlockParent(); window.__umniki.setR(r); window.__umniki.render(); }, r); await scan(r); }
  await p.evaluate(s => { window.__umniki.S().bil.second = s; window.__umniki.S().bil.mode = 'mix'; }, lang === 'cs' ? 'ru' : 'cs');
  for (const r of ['parent', 'report']) { await p.evaluate(r => { window.__umniki.unlockParent(); window.__umniki.setR(r); window.__umniki.render(); }, r); await scan(r + '+bil'); }
  await p.evaluate(() => { window.__umniki.S().bil.mode = 'immersion'; window.__umniki.unlockParent(); window.__umniki.setR('parent'); window.__umniki.render(); }); await scan('parent+immersion'); await p.evaluate(() => { window.__umniki.S().bil.second = ''; });
  await p.evaluate(() => { window.__umniki.A.parentzone(); }); await scan('pin-enter');
  await p.evaluate(() => { const S = window.__umniki.S(); S.parent.pin = ''; window.__umniki.A.parentzone(); }); await scan('pin-set');
  await p.evaluate(() => { const K = window.Skills, S = window.__umniki.S(); S.parent.limit = 10; K.addHist(S.hist, K.dayStr(new Date()), { sec: 700 }); window.__umniki.setR('timeup'); window.__umniki.render(); }); await scan('timeup');
  await p.evaluate(() => { window.__umniki.setR('home'); window.__umniki.render(); }); await scan('home-limit');
  await p.evaluate(() => window.__umniki.A.goto({ dataset: { t: 'home' } })); await p.evaluate(() => window.__umniki.A.weekinfo()); await scan('weekinfo'); await p.tap('[data-mi="0"]');
  await p.evaluate(() => window.__umniki.A.reset()); await scan('reset'); await p.tap('[data-mi="0"]');
  ok(leaks.length === 0, `[${lang}] нет «чужих» букв на всех экранах${leaks.length ? ': ' + JSON.stringify(leaks.slice(0, 6)) : ''}`);
  ok(p.errs.length === 0, `[${lang}] нет ошибок в консоли${p.errs.length ? ': ' + p.errs.slice(0, 3) : ''}`);
  await p.context().close();
}

/* ---------- 2. игровой цикл ---------- */
async function gameLoop(b) {
  const p = await newPage(b, 'ru-RU'); await p.fill('#nm', 'Маша'); await p.tap('[data-a=obstart]');
  ok(await p.evaluate(() => !document.body.innerText.includes('❤') && !!document.querySelector('.route') && document.querySelectorAll('.skc').length === 6), 'главная: маршрут и 6 навыков, никаких сердечек');
  const nSk = await p.evaluate(() => window.__umniki.S().route.skills.length); ok(nSk === 4, 'маршрут из 4 мини-игр');
  await p.tap('[data-a=route]'); await playAll(p, 1);
  for (let i = 1; i < nSk; i++) { await p.tap('[data-a=route]'); await playAll(p); }
  ok(await p.evaluate(() => /На сегодня всё/.test(document.body.innerText) && !document.querySelector('[data-a=route]')), 'финал маршрута: «На сегодня всё», без автопродолжения');
  const st = await p.evaluate(() => { const s = window.__umniki.S(); return { fin: s.route.finished, routes: s.stat.routes, ach: Object.keys(s.ach), hist: Object.values(s.hist)[0] }; });
  ok(st.fin && st.routes === 1 && st.ach.includes('route1') && st.hist.ses === 4 && st.hist.sec > 0, 'история: 4 занятия, время и ответы записаны ' + JSON.stringify({ ses: st.hist.ses, sec: st.hist.sec }));
  const before = await p.evaluate(() => ({ xp: window.__umniki.S().xp, coins: window.__umniki.S().coins }));
  await p.tap('[data-a=home]'); await p.tap('[data-a=skill][data-s=numbers]');
  for (let g = 0; g < 3; g++) { await answerNow(p, false); await p.tap('[data-a=next]'); }
  const after = await p.evaluate(() => ({ xp: window.__umniki.S().xp, coins: window.__umniki.S().coins, still: !!document.querySelector('.lesson') }));
  ok(after.xp === before.xp && after.coins === before.coins && after.still, 'три ошибки подряд: ничего не отнимается, занятие продолжается');
  await p.tap('[data-a=quit]'); await p.tap('[data-mi="1"]');
  const lv0 = await p.evaluate(() => window.__umniki.S().skills.logic.lvl); await p.tap('[data-a=skill][data-s=logic]'); await playAll(p); await p.tap('[data-a=again]'); await playAll(p);
  ok(await p.evaluate(l => window.__umniki.S().skills.logic.lvl > l, lv0), 'адаптивность: верные ответы поднимают уровень навыка');
  await p.evaluate(() => { window.__umniki.unlockParent(); window.__umniki.setR('report'); window.__umniki.render(); });
  ok(await p.evaluate(() => document.querySelectorAll('.skrow').length === 6 && !!document.querySelector('.radar svg') && document.querySelectorAll('.bcol').length === 7), 'отчёт: 6 навыков (включая шахматы), радар, 7 дней');
  ok(p.errs.length === 0, 'нет ошибок в консоли ' + (p.errs[0] || ''));
  await p.context().close();
}

/* ---------- 3. облако: слияние новых данных на двух «устройствах» (имитация Firebase) ---------- */
const MOCK = `window.firebase=(function(){let cb=null,user=null;const auth={onAuthStateChanged(f){cb=f;setTimeout(()=>f(user),0)},async signInWithPopup(){user={uid:'u1',email:'t@example.com'};cb&&cb(user)},async signOut(){user=null;cb&&cb(null)}};
const fs={collection(c){return{doc(id){const p=c+'/'+id;return{async get(){const d=await window.__dbGet(p);return{exists:!!d,data:()=>d}},async set(v){await window.__dbSet(p,JSON.parse(JSON.stringify(v)))}}}}}};
const f={initializeApp(){},auth:()=>auth,firestore:()=>fs};f.auth.GoogleAuthProvider=function(){};f.firestore.FieldValue={serverTimestamp:()=>'TS'};return f})();`;
async function cloud(b) {
  const store = new Map();
  const dev = async () => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'ru-RU' }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    await p.exposeFunction('__dbGet', k => store.get(k) || null); await p.exposeFunction('__dbSet', (k, v) => { store.set(k, v); });
    await p.route('**/firebasejs/**', r => r.fulfill({ contentType: 'application/javascript', body: r.request().url().includes('app-compat') ? MOCK : '/* */' })); await p.goto(URL); return p; };
  const A = await dev(); await A.fill('#nm', 'Маша'); await A.tap('[data-a=obstart]');
  await A.evaluate(() => { const S = window.__umniki.S(), K = window.Skills, t = K.dayStr(new Date()); S.skills.logic = { lvl: 3, win: [], n: 40, ok: 30 }; S.xp = 200; S.chessLessons = { rook: 3 }; K.addHist(S.hist, t, { sec: 500, ses: 2, skill: 'logic', ok: 7, total: 8 }); S.stat.lessons = 4; window.__umniki.unlockParent(); window.__umniki.setR('parent'); window.__umniki.render(); });
  await A.waitForTimeout(300); await A.tap('[data-a=login]'); await A.waitForTimeout(800);
  const doc = store.get('users/u1');
  ok(doc && doc.s.skills.logic.lvl === 3 && doc.s.chessLessons.rook === 3 && Object.keys(doc.s.hist).length === 1 && !('hearts' in doc.s) && !('streak' in doc.s), 'A: навыки, история, шахматные уроки ушли в облако (без устаревших полей)');
  const B = await dev(); await B.tap('.onb [data-a=login]'); await B.waitForTimeout(900);
  const sb = await B.evaluate(() => { const s = window.__umniki.S(); return { name: s.name, lvl: s.skills.logic.lvl, ch: s.chessLessons, days: Object.keys(s.hist).length, xp: s.xp }; });
  ok(sb.name === 'Маша' && sb.lvl === 3 && sb.ch.rook === 3 && sb.days === 1 && sb.xp === 200, 'B: на новом устройстве подтянулись уровень навыка, история и уроки шахмат ' + JSON.stringify(sb));
  // слияние: у B свои данные в другой день и другой навык
  await B.evaluate(() => { const S = window.__umniki.S(), K = window.Skills, t = K.addDays(K.dayStr(new Date()), -1); S.skills.memory = { lvl: 2, win: [], n: 25, ok: 18 }; S.chessLessons.knight = 2; K.addHist(S.hist, t, { sec: 300, ses: 1, skill: 'memory', ok: 5, total: 6 }); window.__umniki.save(); });
  await B.evaluate(() => window.__umniki.A.profile()); await B.waitForTimeout(2200);
  const d2 = store.get('users/u1').s; ok(d2.skills.memory.lvl === 2 && d2.skills.logic.lvl === 3 && d2.chessLessons.knight === 2 && d2.chessLessons.rook === 3 && Object.keys(d2.hist).length === 2, 'слияние: оба навыка, оба дня и оба шахматных урока сохранены');
  ok(A.errs.length === 0 && B.errs.length === 0, 'нет ошибок в консоли (облако)');
  await A.context().close(); await B.context().close();
}

/* ---------- 4. родительская зона: PIN и лимит времени ---------- */
async function parentZone(b) {
  const p = await newPage(b, 'ru-RU'); await p.fill('#nm', 'Маша'); await p.tap('[data-a=obstart]');
  const pin = async d => { for (const c of d) await p.tap(`[data-a=pinkey][data-k="${c}"]`); };
  const txt = () => p.evaluate(() => document.body.innerText);
  // дети без PIN не попадают в отчёт и настройки
  await p.evaluate(() => window.__umniki.A.goto({ dataset: { t: 'report' } })); ok(await p.evaluate(() => !!document.querySelector('.pinpage')), 'отчёт без PIN недоступен: показывается ввод PIN');
  await p.tap('[data-a=pinback]');
  await p.tap('[data-a=parentzone]'); ok(/Придумайте PIN/.test(await txt()), 'первый вход: предлагается придумать PIN');
  await pin('1234'); ok(/Повторите PIN/.test(await txt()), 'после ввода PIN просят повторить');
  await pin('1235'); ok(/не совпал/.test(await txt()) && /Придумайте PIN/.test(await txt()), 'PIN не совпал: понятное сообщение, начинаем заново');
  await pin('4821'); await pin('4821'); ok(await p.evaluate(() => !!document.querySelector('.chips') && /Родительская зона/.test(document.body.innerText)), 'PIN задан, открылась родительская зона');
  ok(await p.evaluate(() => !JSON.stringify(window.__umniki.S()).includes('4821') && !!window.__umniki.S().parent.pin), 'PIN хранится только в виде хэша');
  // родительская зона содержит всё, что убрано из детского профиля
  ok(await p.evaluate(() => ['[data-t=report]', '[data-a=login]', '[data-a=lang]', '[data-a=rename]', '[data-a=reset]', '[data-a=limit]', '[data-a=changepin]'].every(sel => document.querySelector(sel))), 'в зоне: отчёт, аккаунт, язык, имя, сброс, лимит, смена PIN');
  await p.tap('[data-a=lockparent]');
  ok(await p.evaluate(() => !document.querySelector('[data-a=reset]') && !document.querySelector('[data-a=rename]') && !document.querySelector('[data-a=lang]') && !document.querySelector('[data-a=report]')), 'детский профиль: нет сброса, смены имени, языка и отчёта');
  // вход: неверный PIN, блокировка после трёх попыток
  await p.tap('[data-a=parentzone]'); await pin('0000'); ok(/Неверный PIN/.test(await txt()), 'неверный PIN: сообщение');
  await pin('1111'); await pin('2222'); ok(/Подождите/.test(await txt()), 'три неверные попытки: короткая блокировка');
  await pin('4821'); ok(await p.evaluate(() => !!document.querySelector('.pinpage') && !document.querySelector('.chips')), 'во время блокировки даже верный PIN не принимается');
  await p.evaluate(() => { window.__umniki.unlockParent(); }); await p.tap('[data-a=pinback]');
  // лимит времени
  await p.evaluate(() => { window.__umniki.unlockParent(); window.__umniki.setR('parent'); window.__umniki.render(); });
  await p.tap('[data-a=limit][data-m="10"]'); ok(await p.evaluate(() => window.__umniki.S().parent.limit === 10), 'лимит 10 минут задан');
  await p.evaluate(() => { window.__umniki.setR('home'); window.__umniki.render(); }); ok(/Осталось \d+ мин/.test(await txt()), 'на главной видно, сколько осталось');
  // мягкое завершение занятия по лимиту: маршрут, один ответ, затем время вышло
  await p.tap('[data-a=route]'); await answerNow(p); await p.tap('[data-a=next]');
  const sec0 = await p.evaluate(() => { const S = window.__umniki.S(), K = window.Skills; K.addHist(S.hist, K.dayStr(new Date()), { sec: 595 }); return window.__umniki.limitLeft(); });
  await answerNow(p); await p.evaluate(() => { window.__umniki.L().sec += 30; }); await p.tap('[data-a=next]');
  ok(await p.evaluate(() => !!document.querySelector('.result') && /Время на сегодня вышло/.test(document.body.innerText) && !document.querySelector('[data-a=route]') && !document.querySelector('[data-a=again]')), 'время вышло посреди занятия: мягкое завершение, без «дальше» и «ещё раз»');
  const st = await p.evaluate(() => { const S = window.__umniki.S(); return { done: S.route.done.length, ses: Object.values(S.hist)[0].ses, xp: S.xp, n: S.skills[Object.keys(S.skills).find(k => S.skills[k].n > 0)].n }; });
  ok(st.done === 0 && st.ses === 1 && st.xp > 0 && st.n >= 2, 'решённое сохранено (XP, ответы), но этап маршрута не засчитан ' + JSON.stringify(st));
  await p.tap('[data-a=home]'); ok(/Время на сегодня вышло|время вышло/i.test(await txt()) && !(await p.evaluate(() => !!document.querySelector('[data-a=route]'))), 'главная: кнопки маршрута нет, показан отдых');
  await p.tap('[data-a=skill][data-s=numbers]'); ok(await p.evaluate(() => /Родителю: добавить время/.test(document.body.innerText) || /Родителю/i.test(document.body.innerText)), 'попытка начать занятие ведёт на экран «время вышло»');
  // родитель добавляет время
  await p.evaluate(() => window.__umniki.clearPinLock());
  await p.tap('[data-a=timeupparent]'); await pin('9999'); ok(/Неверный PIN/.test(await txt()), 'добавить время можно только с PIN');
  await p.evaluate(() => { window.__umniki.A.timeupparent(); }); await pin('4821'); ok(await p.evaluate(() => !!document.querySelector('.dlg') && /Добавить время/.test(document.querySelector('.dlg').innerText)), 'верный PIN: предлагается добавить 10 / 20 / 30 минут');
  await p.tap('[data-mi="0"]'); ok(await p.evaluate(() => window.__umniki.limitLeft() > 8 * 60 && window.__umniki.S().parent.extra.min === 10), 'добавлено 10 минут: лимит снова не исчерпан');
  await p.tap('[data-a=skill][data-s=numbers]'); ok(await p.evaluate(() => !!document.querySelector('.lesson')), 'после добавления времени занятие начинается');
  // смена PIN
  await p.tap('[data-a=quit]'); await p.tap('[data-mi="1"]'); await p.evaluate(() => { window.__umniki.unlockParent(); window.__umniki.setR('parent'); window.__umniki.render(); });
  await p.tap('[data-a=changepin]'); await pin('7777'); await pin('7777'); await p.tap('[data-a=lockparent]'); await p.tap('[data-a=parentzone]'); await pin('4821'); ok(/Неверный PIN/.test(await txt()), 'после смены старый PIN не подходит');
  await pin('7777'); ok(await p.evaluate(() => !!document.querySelector('.chips')), 'новый PIN открывает зону');
  ok(p.errs.length === 0, 'нет ошибок в консоли (родительская зона) ' + (p.errs[0] || ''));
  await p.context().close();
}
/* забыли PIN: сброс через вход Google (имитация Firebase) */
async function pinForgot(b) {
  const store = new Map(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'ru-RU' }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.exposeFunction('__dbGet', k => store.get(k) || null); await p.exposeFunction('__dbSet', (k, v) => { store.set(k, v); });
  await p.route('**/firebasejs/**', r => r.fulfill({ contentType: 'application/javascript', body: r.request().url().includes('app-compat') ? MOCK : '/* */' })); await p.goto(URL);
  await p.fill('#nm', 'Маша'); await p.tap('[data-a=obstart]'); await p.tap('.hero'); await p.waitForTimeout(600);
  await p.tap('[data-a=parentzone]'); for (const c of '1234') await p.tap(`[data-a=pinkey][data-k="${c}"]`); for (const c of '1234') await p.tap(`[data-a=pinkey][data-k="${c}"]`); await p.tap('[data-a=lockparent]'); await p.waitForTimeout(300);
  await p.tap('[data-a=parentzone]'); await p.tap('[data-a=pinforgot]'); ok(await p.evaluate(() => /Забыли PIN/.test(document.querySelector('.dlg').innerText)), 'забыли PIN: предлагается сброс через Google');
  await p.tap('[data-mi="0"]'); await p.waitForTimeout(900);
  ok(await p.evaluate(() => /Придумайте PIN/.test(document.body.innerText) && !window.__umniki.S().parent.pin), 'после входа Google старый PIN сброшен, предлагается создать новый');
  ok(p.errs.length === 0, 'нет ошибок в консоли (сброс PIN)'); await ctx.close();
}

/* ---------- 5. двуязычный режим ---------- */
async function bilingual(b) {
  const p = await newPage(b, 'cs-CZ'); await p.fill('#nm', 'Anna'); await p.tap('[data-a=obstart]');
  const U = (fn, arg) => p.evaluate(fn, arg);
  await U(() => { window.__umniki.unlockParent(); window.__umniki.setR('parent'); window.__umniki.render(); });
  ok(await U(() => /dvojjazyčný režim/i.test(document.body.innerText) && document.querySelectorAll('[data-a=bilsecond]').length === 4), 'родительская зона (чешский интерфейс): выбор второго языка — «выкл» и три других языка (основной не предлагается)');
  await p.tap('[data-a=bilsecond][data-l=ru]'); ok(await U(() => window.__umniki.S().bil.second === 'ru' && !!document.querySelector('[data-a=bilshare]')), 'второй язык — русский; появились режим и доли');
  const sessionLangs = async (skill = 'numbers') => { const r = await U(s => { const u = window.__umniki; u.A.skill({ dataset: { s } }); const L = u.L(); const langs = L.queue.map(q => q.lang), first = L.queue[0]; u.A.home(); return langs; }, skill); return r; };
  // точная доля в среднем: 30% × 8 заданий × 25 занятий = 60
  await p.tap('[data-a=bilshare][data-m="30"]'); let on = 0, tot = 0; for (let i = 0; i < 25; i++) { const l = await sessionLangs(i % 2 ? 'logic' : 'numbers'); on += l.filter(x => x === 'ru').length; tot += l.length; await U(() => { window.__umniki.unlockParent(); }); }
  ok(Math.abs(on - 60) <= 1 && tot === 200, `доля 30%: на втором языке ${on} из ${tot} (ожидается 60 ±1)`);
  await U(() => { window.__umniki.S().bil.share = 50; window.__umniki.S().bil.carry = 0; }); const l50 = await sessionLangs(); ok(l50.filter(x => x === 'ru').length === 4, 'доля 50%: ровно 4 из 8 заданий на втором языке');
  await U(() => { window.__umniki.S().bil.mode = 'immersion'; }); const lim = await sessionLangs(); ok(lim.every(x => x === 'ru'), 'погружение: все задания на втором языке');
  await U(() => { window.__umniki.S().bil.mode = 'mix'; window.__umniki.S().bil.share = 80; window.__umniki.S().bil.carry = 0; });
  // кнопка «не понял»: то же задание на другом языке, без штрафа
  await p.tap('[data-a=skill][data-s=numbers]');
  let found = false; for (let g = 0; g < 8 && !found; g++) { found = await U(() => { const q = window.__umniki.L().queue[0]; return q.lang === 'ru'; }); if (!found) { await answerNow(p); await p.tap('[data-a=next]'); } }
  ok(found, 'в миксе 80% встретилось задание на втором языке');
  const before = await U(() => { const q = window.__umniki.L().queue[0], c = q.choices ? q.choices.map(x => x.v) : null; return { text: document.querySelector('.qtext').innerText, tag: document.querySelector('.tag.lg').innerText, c, ans: q.answer, type: q.type }; });
  ok(/Русский/.test(before.tag) && (!/[A-Za-zА-Яа-я]/.test(before.text) || /[А-Яа-я]/.test(before.text)), 'задание на русском, метка «🌍 Русский»: ' + before.text.slice(0, 40));
  if (before.type === 'choice') await p.tap('[data-a=pick][data-i="1"]');
  await p.tap('[data-a=alt]');
  const after = await U(() => { const L = window.__umniki.L(), q = L.queue[0]; return { text: document.querySelector('.qtext').innerText, tag: document.querySelector('.tag.lg').innerText, c: q.choices ? [...document.querySelectorAll('.opt')].length : null, sel: L.sel, tap: Object.values(window.__umniki.S().hist).reduce((a, d) => a + ((d.l2 || {}).tap || 0), 0) }; });
  ok(!/[А-Яа-я]/.test(after.text) && /Čeština/.test(after.tag), '«не понял»: то же задание на чешском, метка «🌍 Čeština»: ' + after.text.slice(0, 40));
  ok(before.type !== 'choice' || (after.c === before.c.length && after.sel === 1), 'варианты ответа на месте, выбор сохранён');
  ok(after.tap === 1, 'нажатие «не понял» записано в историю');
  await p.tap('[data-a=alt]'); await p.tap('[data-a=alt]'); ok(await U(() => Object.values(window.__umniki.S().hist).reduce((a, d) => a + ((d.l2 || {}).tap || 0), 0) === 1), 'повторные нажатия на то же задание не раздувают счётчик');
  const mist0 = await U(() => window.__umniki.L().mistakes); await answerNow(p); const st = await U(() => { const L = window.__umniki.L(); return { mistakes: L.mistakes, ok: L.ok, firstOK: L.firstOK }; });
  ok(st.ok && st.mistakes === mist0, '«не понял» ничего не стоит: ответ засчитывается как обычно');
  await p.tap('[data-a=next]');
  // повтор после ошибки остаётся на том же языке
  let langRetry = null; for (let g = 0; g < 6; g++) { const q = await U(() => { const q = window.__umniki.L().queue[0]; return { lang: q.lang, seed: q.seed != null }; }); if (q.lang === 'ru' && q.seed) { await answerNow(p, false); await p.tap('[data-a=next]'); langRetry = await U(() => window.__umniki.L().queue.filter(x => x.retry).map(x => x.lang)); break; } await answerNow(p); await p.tap('[data-a=next]'); }
  ok(langRetry && langRetry.every(l => l === 'ru'), 'повтор после ошибки приходит на том же (втором) языке');
  await p.tap('[data-a=quit]'); await p.tap('[data-mi="1"]');
  // шахматы и память тоже переключаются
  for (const sk of ['memory', 'chess', 'attention']) { await U(s => { window.__umniki.S().bil.mode = 'immersion'; if (s === 'chess') window.__umniki.A.cpractice(); else window.__umniki.A.skill({ dataset: { s } }); }, sk); const info = await U(() => { const L = window.__umniki.L(), q = L.queue[0]; return { gid: q.gid, lang: q.lang, hasGlobe: !!document.querySelector('[data-a=alt]') }; });
    ok(info.lang === 'ru' && info.hasGlobe, `${sk}: задание на втором языке, кнопка 🌐 есть (${info.gid})`); await U(() => { window.__umniki.A.alt(); }); ok(await U(() => !!document.querySelector('.lesson')), `${sk}: переключение языка не ломает экран`); await U(() => { const L = window.__umniki.L(); L.alt = false; window.__umniki.A.home(); }); }
  // уроки шахмат — только на основном языке (без глобуса)
  await U(() => window.__umniki.A.clesson({ dataset: { id: 'rook' } })); await p.tap('[data-a=begin]'); ok(await U(() => !document.querySelector('[data-a=alt]')), 'уроки шахмат: кнопки 🌐 нет (только основной язык)'); await U(() => window.__umniki.A.home());
  // адаптация доли: много «не понял» за неделю → доля ниже
  await U(() => { const S = window.__umniki.S(), K = window.Skills; S.bil.mode = 'mix'; S.bil.share = 50; S.bil.adaptedAt = ''; S.bil.adapt = true; S.hist = {}; K.addHist(S.hist, K.dayStr(new Date()), { l2n: 20, l2ok: 12, tap: 10 }); });
  await U(() => window.__umniki.A.skill({ dataset: { s: 'logic' } })); ok(await U(() => window.__umniki.S().bil.share === 30 && !!window.__umniki.S().bil.adaptedAt), 'адаптация: 50% «не понял» за неделю → доля снижена до 30%'); await U(() => window.__umniki.A.home());
  // отчёт: блок про второй язык
  await U(() => { const S = window.__umniki.S(), K = window.Skills; K.addHist(S.hist, K.dayStr(new Date()), { sec: 600, ses: 2, skill: 'numbers', ok: 5, total: 8, hard: 'numbers' }); window.__umniki.unlockParent(); window.__umniki.setR('report'); window.__umniki.render(); });
  const rep = await U(() => document.body.innerText); ok(/druhý jazyk: Русский/i.test(rep) && /úloh ve druhém jazyce/i.test(rep) && /nerozumím/i.test(rep) && /upraven automaticky/i.test(rep), 'отчёт: блок «Druhý jazyk»: задания, точность, «не понял», режим, автоподстройка');
  ok(p.errs.length === 0, 'нет ошибок в консоли (двуязычный режим) ' + (p.errs[0] || '')); await p.context().close();
}

(async () => {
  const b = await chromium.launch();
  const only = process.argv[2];
  if (!only || only === 'lang') for (const [locale, lang] of [['ru-RU', 'ru'], ['be-BY', 'be'], ['cs-CZ', 'cs'], ['en-US', 'en']]) await langPass(b, locale, lang);
  if (!only || only === 'game') { await gameLoop(b); await cloud(b); }
  if (!only || only === 'parent') { await parentZone(b); await pinForgot(b); }
  if (!only || only === 'bil') await bilingual(b);
  await b.close(); console.log(fails ? `\n${fails} проверок НЕ прошло` : '\nвсе проверки пройдены');
})();
