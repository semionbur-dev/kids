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
const ALLOW = /^(Беларуская|БЕЛАРУСКАЯ|Русский|РУССКИЙ|XP|Google|GOOGLE|Firebase|Anna|Čeština|ČEŠTINA|English|ENGLISH|[A-E][1-5]|[A-E]|[a-h][1-8]|[1-9]?\d?[A-Z]?)$/;

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
  for (const r of ['report', 'profile', 'awards', 'shop', 'chess']) { await p.evaluate(r => { window.__umniki.setR(r); window.__umniki.render(); }, r); await scan(r); }
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
  await p.evaluate(() => { window.__umniki.setR('report'); window.__umniki.render(); });
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
  await A.evaluate(() => { const S = window.__umniki.S(), K = window.Skills, t = K.dayStr(new Date()); S.skills.logic = { lvl: 3, win: [], n: 40, ok: 30 }; S.xp = 200; S.chessLessons = { rook: 3 }; K.addHist(S.hist, t, { sec: 500, ses: 2, skill: 'logic', ok: 7, total: 8 }); S.stat.lessons = 4; window.__umniki.A.profile(); });
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

(async () => {
  const b = await chromium.launch();
  for (const [locale, lang] of [['ru-RU', 'ru'], ['be-BY', 'be'], ['cs-CZ', 'cs'], ['en-US', 'en']]) await langPass(b, locale, lang);
  await gameLoop(b); await cloud(b);
  await b.close(); console.log(fails ? `\n${fails} проверок НЕ прошло` : '\nвсе проверки пройдены');
})();
