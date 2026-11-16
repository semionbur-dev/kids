'use strict';
/* Согласие на облако, экспорт и удаление данных (GDPR), глоссарий F13/B4.  Запуск: node tests/privacy.js */
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { fails++; process.exitCode = 1; } };
const U = (p, f, a) => p.evaluate(f, a);
const MOCK = `window.firebase=(function(){let cb=null,user=null;const auth={onAuthStateChanged(f){cb=f;setTimeout(()=>f(user),0)},async signInWithPopup(){user={uid:'u1',email:'t@example.com',async delete(){await window.__dbDel('users/u1');user=null;cb&&cb(null)}};cb&&cb(user)},async signOut(){user=null;cb&&cb(null)}};
const fs={collection(c){return{doc(id){const p=c+'/'+id;return{async get(){const d=await window.__dbGet(p);return{exists:!!d,data:()=>d}},async set(v){await window.__dbSet(p,JSON.parse(JSON.stringify(v)))},async delete(){if(window.__failDel&&await window.__failDel())throw new Error('offline');await window.__dbDel(p)}}}}}};
const f={initializeApp(){},auth:()=>auth,firestore:()=>fs};f.auth.GoogleAuthProvider=function(){};f.firestore.FieldValue={serverTimestamp:()=>'TS'};return f})();`;

(async () => {
  const b = await chromium.launch(), store = new Map(); let fbReq = 0, failDel = false;
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'ru-RU', acceptDownloads: true });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.addInitScript(() => { try { Object.defineProperty(navigator, 'canShare', { value: undefined }); } catch (e) {} });
  await p.exposeFunction('__dbGet', k => store.get(k) || null); await p.exposeFunction('__dbSet', (k, v) => { store.set(k, v); }); await p.exposeFunction('__dbDel', k => { store.delete(k); }); await p.exposeFunction('__failDel', () => failDel);
  await p.route('**/firebasejs/**', r => { fbReq++; r.fulfill({ contentType: 'application/javascript', body: r.request().url().includes('app-compat') ? MOCK : '/* */' }); });
  await p.goto(URL);

  /* 1. баннер и запрет внешних запросов до согласия */
  ok(await U(p, () => !!document.querySelector('#cb') && /без рекламы/.test(document.querySelector('#cb').innerText)), 'первый запуск: баннер о приватности');
  await p.tap('[data-a=obage][data-n="7"]'); await p.fill('#nm', 'Маша'); await p.tap('[data-a=obstart]');
  ok(await U(p, () => !!document.querySelector('#cb')), 'баннер остаётся, пока его не закрыли');
  await p.tap('#cb [data-a=privacy]'); ok(await U(p, () => document.querySelectorAll('.pv').length === 6 && !document.querySelector('#cb')), 'политика: 6 разделов, баннер на этом экране скрыт');
  await p.tap('[data-a=privback]'); await p.tap('#cb [data-a=cbok]'); ok(await U(p, () => !document.querySelector('#cb')), '«Понятно» закрывает баннер');
  await p.reload(); await p.waitForTimeout(200); ok(await U(p, () => !document.querySelector('#cb')), 'после перезапуска баннер не возвращается');
  await p.evaluate(() => { window.__umniki.A.profile(); }); await p.waitForTimeout(300);
  ok(fbReq === 0 && await U(p, () => !window.firebase), 'без согласия SDK Google не загружается (ни на онбординге, ни в профиле)');

  /* 2. согласие при входе */
  await U(p, () => { const u = window.__umniki; u.unlockParent(); u.setR('parent'); u.render(); });
  await p.tap('[data-a=login]'); ok(await U(p, () => /Включить облако/.test(document.querySelector('#modal').innerText)), 'вход через Google: сначала вопрос о согласии');
  await p.tap('[data-mi="1"]'); await p.waitForTimeout(200); ok(fbReq === 0 && await U(p, () => !window.__umniki.FAM().consent.cloud), '«Не сейчас»: ничего не загружено, согласия нет');
  await p.tap('[data-a=login]'); await p.tap('[data-mi="0"]'); await p.waitForTimeout(1200);
  const doc = store.get('users/u1');
  ok(fbReq > 0 && doc && doc.fam && doc.fam.kids.length === 1 && !('consent' in doc.fam), 'после согласия вход работает; в облако уходят только данные семьи, без записи о согласии');
  ok(await U(p, () => /^\d{4}-\d\d-\d\d/.test(window.__umniki.FAM().consent.cloud)), 'дата согласия сохранена');

  /* 3. экспорт */
  await U(p, () => { const u = window.__umniki; u.unlockParent(); u.setR('parent'); u.render(); });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.tap('[data-a=exportdata]')]);
  const fp = await dl.path(), data = JSON.parse(require('fs').readFileSync(fp, 'utf8'));
  ok(/^umniki-data-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()), 'файл экспорта: ' + dl.suggestedFilename());
  ok(data.app === 'umniki' && data.children.length === 1 && data.children[0].name === 'Маша' && data.children[0].age === 7 && data.consent.cloud && !JSON.stringify(data).includes('"salt"') && !('pin' in data.family) && typeof data.family.parentPinSet === 'boolean', 'экспорт: дети, возраст, согласие; хэш PIN не выгружается');

  /* 4. отзыв согласия: данные из облака удалены, локальные остались */
  failDel = true; await p.tap('[data-a=withdraw]'); await p.tap('[data-mi="1"]'); await p.waitForTimeout(500);
  ok(store.has('users/u1') && await U(p, () => !!window.__umniki.FAM().consent.cloud), 'облако недоступно: согласие не отзывается, данные не теряются');
  failDel = false; await p.tap('[data-a=withdraw]'); await p.tap('[data-mi="1"]'); await p.waitForTimeout(600);
  ok(!store.has('users/u1') && await U(p, () => !window.__umniki.FAM().consent.cloud && window.__umniki.FAM().kids.length === 1), 'отзыв: документ в облаке удалён, согласие снято, ребёнок на устройстве остался');

  /* 5. удаление всех данных */
  await p.tap('[data-a=login]'); await p.tap('[data-mi="0"]'); await p.waitForTimeout(1200); ok(store.has('users/u1'), 'повторное согласие и вход');
  await U(p, () => { const u = window.__umniki; u.unlockParent(); u.setR('parent'); u.render(); });
  failDel = true; await p.tap('[data-a=eraseall]'); await p.tap('[data-mi="1"]'); await p.waitForTimeout(500);
  ok(store.has('users/u1') && await U(p, () => Object.keys(localStorage).some(k => k.startsWith('umniki'))), 'облако недоступно: ничего не удалено (нет «ложного» удаления)');
  failDel = false; await p.tap('[data-a=eraseall]');
  await Promise.all([p.waitForNavigation({ timeout: 8000 }).catch(() => {}), p.tap('[data-mi="1"]')]); await p.waitForTimeout(600);
  ok(!store.has('users/u1'), 'удаление: документ в облаке удалён');
  ok(await U(p, () => !Object.keys(localStorage).some(k => k.startsWith('umniki') && k !== 'umniki.cloud') && !!document.querySelector('.onb') && window.__umniki.FAM().kids.length === 0), 'удаление: на устройстве пусто, приложение вернулось к началу');
  ok(await U(p, () => !localStorage.getItem('umniki.cloud')), 'флаг облака снят');

  /* 6. глоссарий: тап по слову в задании и словарик */
  await p.tap('[data-a=obage][data-n="9"]'); await p.fill('#nm', 'Маша'); await p.tap('[data-a=obstart]');
  await p.evaluate(() => { const u = window.__umniki; u.A.skill({ dataset: { s: 'space' } }); const g = u.GENS.find(x => x.id === 'perim'); const q = g.make(2); q.skill = 'space'; q.gid = 'perim'; q.d = 2; q.seed = 1; const L = u.L(); L.queue[0] = q; L.bq = null; L.answered = false; L.intro = false; u.render(); });
  ok(await U(p, () => document.querySelectorAll('.qtext .gw').length >= 1), 'в тексте задания подсвечены слова из глоссария');
  const before = await U(p, () => ({ pend: window.__umniki.L().queue.length, st: JSON.stringify(window.__umniki.S().stat) }));
  await p.tap('.qtext .gw'); const md = await U(p, () => document.querySelector('#modal').innerText);
  ok(/Čeština|Čeština|English|Беларуская/i.test(md) && /obvod|perimeter|перыметр/i.test(md), 'тап по слову: перевод на других языках ' + md.replace(/\n/g, ' / ').slice(0, 90));
  await p.tap('[data-mi="0"]'); const after = await U(p, () => ({ pend: window.__umniki.L().queue.length, st: JSON.stringify(window.__umniki.S().stat), w: window.__umniki.S().words }));
  ok(after.pend === before.pend && after.st === before.st && Object.values(after.w).reduce((a, x) => a + x, 0) === 1, 'тап не меняет прогресс и не считается ошибкой; слово записано в «вопросы»');
  await p.evaluate(() => { const u = window.__umniki; u.A.home(); u.unlockParent(); u.setR('report'); u.render(); });
  ok(await U(p, () => /Слова, о которых спрашивал/i.test(document.body.innerText)), 'в отчёте родителя — слова, о которых спрашивал');
  await p.evaluate(() => { window.__umniki.A.home(); window.__umniki.A.profile(); }); await p.tap('[data-a=glossary]');
  ok(await U(p, () => document.querySelectorAll('.gl').length >= 100), 'словарик: ' + await U(p, () => document.querySelectorAll('.gl').length) + ' терминов');
  await p.fill('#gq', 'střelec'); ok(await U(p, () => document.querySelectorAll('.gl').length === 1 && /слон/.test(document.querySelector('.gl').innerText)), 'поиск находит слово на любом языке (střelec → слон)');
  await p.fill('#gq', 'zzzz'); ok(await U(p, () => /Такого слова нет/.test(document.querySelector('#gl').innerText)), 'пустой поиск: понятное сообщение');
  ok(p.errs.length === 0, 'нет ошибок в консоли ' + p.errs.join('|'));
  await b.close(); console.log(fails ? `\n${fails} проверок НЕ прошло` : '\nвсе проверки пройдены');
})();
