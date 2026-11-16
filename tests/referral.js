'use strict';
/* Приглашения друзей: ссылка, каналы, приветствие, подсчёт и награды (на подмене Firestore).  Запуск: node tests/referral.js */
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { fails++; process.exitCode = 1; } };
const U = (p, f, a) => p.evaluate(f, a);
const MOCK = `window.firebase=(function(){let cb=null,user=null;
const auth={onAuthStateChanged(f){cb=f;setTimeout(()=>f(user),0)},async signInWithPopup(){user={uid:window.__uid,email:'t@example.com',async delete(){user=null;cb&&cb(null)}};cb&&cb(user)},async signOut(){user=null;cb&&cb(null)}};
const docs=(path)=>({path,async get(){const d=await window.__dbGet(path);return{exists:!!d,data:()=>d,id:path.split('/').pop()}},async set(v){await window.__dbSet(path,JSON.parse(JSON.stringify(v)))},async delete(){await window.__dbDel(path)},collection(n){return colls(path+'/'+n)}});
const colls=(path)=>({doc(id){return docs(path+'/'+id)},async get(){const arr=await window.__dbList(path);return{size:arr.length,docs:arr.map(x=>({id:x,exists:true}))}}});
const fs={collection(c){return colls(c)},batch(){const ops=[];return{set(d,v){ops.push([d,v]);return this},async commit(){const wanted=await window.__dbBatchCheck(ops.map(o=>o[0].path));if(!wanted)throw new Error('denied');for(const [d,v] of ops)await d.set(v)}}}};
const f={initializeApp(){},auth:()=>auth,firestore:()=>fs};f.auth.GoogleAuthProvider=function(){};f.firestore.FieldValue={serverTimestamp:()=>'TS'};return f})();`;

(async () => {
  const b = await chromium.launch(), store = new Map();
  const mkdev = async (uid, ref) => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'ru-RU' }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    await p.exposeFunction('__dbGet', k => store.get(k) || null); await p.exposeFunction('__dbSet', (k, v) => { store.set(k, v); }); await p.exposeFunction('__dbDel', k => { store.delete(k); });
    await p.exposeFunction('__dbList', pre => [...store.keys()].filter(k => k.startsWith(pre + '/') && !k.slice(pre.length + 1).includes('/')).map(k => k.slice(pre.length + 1)));
    await p.exposeFunction('__dbBatchCheck', paths => { const inv = paths.find(x => /^invites\//.test(x)); if (!inv) return true; const code = inv.split('/')[1]; return store.has('invites/' + code); });   // как в правилах: код должен существовать
    await p.addInitScript(u => { window.__uid = u; }, uid);
    await p.route('**/firebasejs/**', r => r.fulfill({ contentType: 'application/javascript', body: r.request().url().includes('app-compat') ? MOCK : '/* */' }));
    await p.goto(URL + (ref ? '?ref=' + ref : '')); return p; };
  const onboard = async (p, name, age = 8) => { await p.tap('[data-a=obage][data-n="' + age + '"]'); await p.fill('#nm', name); await p.tap('[data-a=obstart]'); };
  const consent = p => p.evaluate(() => { const u = window.__umniki; u.FAM().consent.cloud = '2026-01-01'; u.FAM().consent.seen = '2026-01-01'; u.save({ nopush: true }); u.render(); });
  const signIn = async p => { await p.evaluate(() => { window.__umniki.unlockParent(); window.__umniki.setR('parent'); window.__umniki.render(); }); await p.tap('[data-a=login]'); await p.waitForTimeout(900); };

  /* 1. приглашающий: ссылка и каналы */
  const A = await mkdev('uA'); await consent(A); await onboard(A, 'Маша');
  await A.evaluate(() => { window.__umniki.unlockParent(); window.__umniki.setR('parent'); window.__umniki.render(); });
  const sh = await A.evaluate(() => ({ info: window.__umniki.shareInfo(), hrefs: [...document.querySelectorAll('.share a')].map(a => a.href), txt: document.querySelector('.share').innerText }));
  const code = sh.info.url.split('ref=')[1];
  ok(/^[a-z0-9]{8}$/.test(code) && sh.info.url.startsWith('https://semionbur-dev.github.io/kids/?ref='), 'ссылка с личным кодом на опубликованный адрес: ' + sh.info.url);
  ok(sh.hrefs.some(h => h.startsWith('https://wa.me/?text=') && decodeURIComponent(h).includes(sh.info.url)) && sh.hrefs.some(h => h.startsWith('https://t.me/share/url?url=')) && sh.hrefs.some(h => h.startsWith('mailto:?subject=') && decodeURIComponent(h).includes(sh.info.url)), 'кнопки WhatsApp, Telegram и почты ведут на нужные адреса с текстом и ссылкой');
  ok(!/Маша/.test(decodeURIComponent(sh.hrefs.join(' '))), 'в ссылках нет имени ребёнка');
  ok(await A.evaluate(() => !!document.querySelector('[data-a=copyref]') && /войдите через Google/.test(document.querySelector('.share').parentElement.innerText)), 'есть «Копировать»; без входа через Google подсказка про подсчёт');
  await A.tap('[data-a=login]'); await A.waitForTimeout(900);
  ok(store.get('invites/' + code) && store.get('invites/' + code).owner === 'uA', 'после входа код зарегистрирован на владельца в облаке');
  ok(await A.evaluate(() => { const j = window.__umniki.FAM().ref; return j.code && j.claimed === 0; }), 'пока друзей нет, наград нет');

  /* 2. друг переходит по ссылке: приветствие и бонус, ссылка очищается */
  const B = await mkdev('uB', code);
  ok(await B.evaluate(() => !location.search.includes('ref=') && /Тебя позвал друг/.test(document.body.innerText)), 'друг видит приветствие, ?ref убран из адреса');
  await onboard(B, 'Миша', 6);
  ok(await B.evaluate(() => window.__umniki.S().coins === 30 && window.__umniki.FAM().ref.by && window.__umniki.FAM().ref.by !== window.__umniki.FAM().ref.code), 'приветственный бонус +30 🪙 и код пригласившего запомнен');
  await B.evaluate(() => { const u = window.__umniki; u.FAM().consent.cloud = '2026-01-01'; u.save({ nopush: true }); u.A.profile(); }); await B.waitForTimeout(500);
  await signIn(B); await B.evaluate(() => window.__umniki.registerReferral()); await B.waitForTimeout(300);
  ok(!store.has('referredBy/uB'), 'пока не пройдено занятие, друг не засчитывается');
  await B.evaluate(() => { const u = window.__umniki; u.S().stat.lessons = 1; return u.registerReferral(); }); await B.waitForTimeout(400);
  ok(store.has('referredBy/uB') && store.has('invites/' + code + '/joins/uB'), 'после первого занятия и входа друг записывается один раз');
  ok(await B.evaluate(() => window.__umniki.FAM().ref.sent === true), 'отметка «отправлено» сохранена');

  /* 3. приглашающий видит друга и получает награды */
  await A.evaluate(() => { window.__umniki.unlockParent(); return window.__umniki.refreshInvites(); }); await A.waitForTimeout(500);
  const ra = await A.evaluate(() => { const u = window.__umniki, S = u.S(); return { n: u.FAM().ref.count, claimed: u.FAM().ref.claimed, coins: S.coins, hat: S.hats.includes('🎉'), pet: S.pets.includes('🦖'), ach: !!S.ach.friends1 }; });
  ok(ra.n === 1 && ra.claimed === 1 && ra.coins === 30 && ra.hat && !ra.pet && ra.ach, '1 друг: +30 🪙, праздничный колпак и достижение ' + JSON.stringify(ra));
  await A.evaluate(() => window.__umniki.refreshInvites()); await A.waitForTimeout(300); ok(await A.evaluate(() => window.__umniki.S().coins) === 30, 'повторное обновление не выдаёт награду второй раз');
  for (const u of ['uC', 'uD']) store.set('invites/' + code + '/joins/' + u, { at: 1 });
  await A.evaluate(() => window.__umniki.refreshInvites()); await A.waitForTimeout(300);
  ok(await A.evaluate(() => { const S = window.__umniki.S(); return S.pets.includes('🦖') && S.coins === 30 + 60; }), '3 друга: динозаврик и ещё +60 🪙');
  for (const u of ['uE', 'uF']) store.set('invites/' + code + '/joins/' + u, { at: 1 });
  await A.evaluate(() => window.__umniki.refreshInvites()); await A.waitForTimeout(300);
  ok(await A.evaluate(() => { const S = window.__umniki.S(); return S.coins === 30 + 60 + 60 + 100 && !!S.ach.friends5; }), '5 друзей: бонус +100 🪙 и достижение «Душа компании»');

  /* 4. магазин показывает награды, а покупка закрыта */
  await A.evaluate(() => window.__umniki.A.goto({ dataset: { t: 'shop' } }));
  ok(await A.evaluate(() => /Динозаврик/.test(document.body.innerText) && !document.querySelector('[data-a=buy][data-e="🦖"]') && !!document.querySelector('[data-a=equip][data-e="🦖"]')), 'в магазине динозаврик получен, купить его нельзя');
  await A.evaluate(() => { window.__umniki.A.equip({ dataset: { k: 'pet', e: '🦖' } }); }); ok(await A.evaluate(() => window.__umniki.S().pet === '🦖'), 'награду можно надеть');

  /* 5. защита от злоупотреблений */
  const C = await mkdev('uA2', code); await consent(C); await onboard(C, 'Тест');
  await C.evaluate(() => { const u = window.__umniki; u.FAM().ref.by = 'zzzzzzzz'; u.S().stat.lessons = 1; u.save({ nopush: true }); u.A.profile(); }); await C.waitForTimeout(500); await signIn(C);
  await C.evaluate(() => window.__umniki.registerReferral()); await C.waitForTimeout(300);
  ok(!store.has('referredBy/uA2'), 'несуществующий код не засчитывается');
  const D = await mkdev('uD1', 'aaaaaaaa'); ok(await D.evaluate(() => /Тебя позвал друг/.test(document.body.innerText)), 'неизвестный код показывает приветствие, но ничего не ломает');
  /* свой код нельзя использовать как приглашение */
  await A.evaluate(() => { const u = window.__umniki; u.FAM().ref.by = u.FAM().ref.code; u.FAM().ref.sent = false; }); await A.evaluate(() => window.__umniki.registerReferral()); await A.waitForTimeout(200);
  ok(!store.has('referredBy/uA'), 'нельзя позвать самого себя');

  /* 6. приватность и удаление */
  const priv = await A.evaluate(() => { window.__umniki.A.privacy(); return document.querySelectorAll('.pv').length; }); ok(priv === 7, 'политика приватности дополнена разделом о приглашениях');
  await A.evaluate(() => { const u = window.__umniki; u.unlockParent(); u.setR('parent'); u.render(); });
  await A.tap('[data-a=eraseall]'); await Promise.all([A.waitForNavigation({ timeout: 8000 }).catch(() => {}), A.tap('[data-mi="1"]')]); await A.waitForTimeout(600);
  ok(!store.has('invites/' + code) && !store.has('users/uA'), 'удаление данных стирает и код приглашений');
  const errs = [A, B, C, D].flatMap(x => x.errs); ok(errs.length === 0, 'нет ошибок в консоли ' + errs.join('|'));
  await b.close(); console.log(fails ? `\n${fails} проверок НЕ прошло` : '\nвсе проверки пройдены');
})();
