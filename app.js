'use strict';
(() => {
const { GENS, LANGS, rnd, pick, shuffle, esc, t: tt, setLang, getLang } = window.Gens;
const P = pair => pair[LANGS.indexOf(getLang())];
const LANG_NAMES = { be: 'Беларуская', ru: 'Русский', cs: 'Čeština', en: 'English' };
const langOk = l => (LANGS.includes(l) ? l : 'ru');
const plural = (n, f) => { const a = n % 100, b = n % 10; return a > 10 && a < 20 ? f[2] : b === 1 ? f[0] : b > 1 && b < 5 ? f[1] : f[2]; };
const $ = (s, r = document) => r.querySelector(s);

/* ======================== Данные ======================== */
const TOPICS = [
  { id: 'arith', icon: '🔢', name: ['Арифметика', 'Арыфметыка', 'Aritmetika', 'Arithmetic'], color: '#ff5d73',
    sub: ['Сложение, вычитание, умножение, деление', 'Складанне, адніманне, множанне, дзяленне', 'Sčítání, odčítání, násobení, dělení', 'Addition, subtraction, multiplication, division'] },
  { id: 'frac', icon: '🍕', name: ['Дроби и сравнение', 'Дробы і параўнанне', 'Zlomky a porovnávání', 'Fractions and comparing'], color: '#ff9f1c',
    sub: ['Дроби, сравнение, порядок действий', 'Дробы, параўнанне, парадак дзеянняў', 'Zlomky, porovnávání, pořadí operací', 'Fractions, comparing, order of operations'] },
  { id: 'logic', icon: '🧠', name: ['Логика', 'Логіка', 'Logika', 'Logic'], color: '#7b6cff',
    sub: ['Закономерности, загадки, рассуждения', 'Заканамернасці, загадкі, развагі', 'Pravidelnosti, hádanky, uvažování', 'Patterns, riddles, reasoning'] },
  { id: 'geom', icon: '📐', name: ['Геометрия и головоломки', 'Геаметрыя і галаваломкі', 'Geometrie a hlavolamy', 'Geometry and puzzles'], color: '#17b8a6',
    sub: ['Периметр, площадь, судоку, ребусы', 'Перыметр, плошча, судоку, рэбусы', 'Obvod, obsah, sudoku, rébusy', 'Perimeter, area, sudoku, puzzles'] },
];
const LESSONS = 10, QPL = 8, GOAL = 50, REGEN = 10 * 60 * 1000, HEART_PRICE = 15, HINT_PRICE = 3;

const PETS = [
  { e: '🐱', n: ['Кот', 'Кот', 'Kocour', 'Cat'], p: 0 }, { e: '🐶', n: ['Пёс', 'Сабака', 'Pes', 'Dog'], p: 0 }, { e: '🐰', n: ['Зайка', 'Зайчык', 'Zajíček', 'Bunny'], p: 0 },
  { e: '🦊', n: ['Лис', 'Ліс', 'Liška', 'Fox'], p: 30 }, { e: '🐼', n: ['Панда', 'Панда', 'Panda', 'Panda'], p: 40 }, { e: '🐸', n: ['Лягушонок', 'Жабянё', 'Žabka', 'Froggy'], p: 40 },
  { e: '🦉', n: ['Сова', 'Сава', 'Sova', 'Owl'], p: 50 }, { e: '🐧', n: ['Пингвин', 'Пінгвін', 'Tučňák', 'Penguin'], p: 50 }, { e: '🐙', n: ['Осьминог', 'Васьміног', 'Chobotnice', 'Octopus'], p: 60 },
  { e: '🦁', n: ['Лев', 'Леў', 'Lev', 'Lion'], p: 70 }, { e: '🦄', n: ['Единорог', 'Аднарог', 'Jednorožec', 'Unicorn'], p: 80 }, { e: '🐲', n: ['Дракон', 'Цмок', 'Drak', 'Dragon'], p: 100 },
  { e: '🤖', n: ['Робот', 'Робат', 'Robot', 'Robot'], p: 100 },
];
const HATS = [
  { e: '🧢', n: ['Кепка', 'Кепка', 'Kšiltovka', 'Cap'], p: 20 }, { e: '🎀', n: ['Бантик', 'Бант', 'Mašle', 'Bow'], p: 20 },
  { e: '🎓', n: ['Шапочка выпускника', 'Шапачка выпускніка', 'Absolventská čepice', 'Graduation cap'], p: 30 },
  { e: '🎧', n: ['Наушники', 'Навушнікі', 'Sluchátka', 'Headphones'], p: 40 }, { e: '🎩', n: ['Цилиндр', 'Цыліндр', 'Cylindr', 'Top hat'], p: 50 },
  { e: '👑', n: ['Корона', 'Карона', 'Koruna', 'Crown'], p: 80 },
];

const ACH = [
  { id: 'first', i: '🌱', t: ['Первый шаг', 'Першы крок', 'První krok', 'First step'], d: ['Пройди первый урок', 'Прайдзі першы ўрок', 'Dokonči první lekci', 'Complete your first lesson'], ok: s => s.stat.lessons >= 1 },
  { id: 'l10', i: '📚', t: ['Ученик', 'Вучань', 'Žák', 'Pupil'], d: ['Пройди 10 уроков', 'Прайдзі 10 урокаў', 'Dokonči 10 lekcí', 'Complete 10 lessons'], ok: s => s.stat.lessons >= 10 },
  { id: 'l30', i: '🎒', t: ['Отличник', 'Выдатнік', 'Premiant', 'Top student'], d: ['Пройди 30 уроков', 'Прайдзі 30 урокаў', 'Dokonči 30 lekcí', 'Complete 30 lessons'], ok: s => s.stat.lessons >= 30 },
  { id: 'perf1', i: '💯', t: ['Без ошибок', 'Без памылак', 'Bez chyby', 'Flawless'], d: ['Пройди урок без единой ошибки', 'Прайдзі ўрок без адной памылкі', 'Dokonči lekci bez jediné chyby', 'Finish a lesson without a single mistake'], ok: s => s.stat.perfect >= 1 },
  { id: 'perf5', i: '🏅', t: ['Мастер точности', 'Майстар дакладнасці', 'Mistr přesnosti', 'Master of accuracy'], d: ['5 уроков без ошибок', '5 урокаў без памылак', '5 lekcí bez chyby', '5 lessons without mistakes'], ok: s => s.stat.perfect >= 5 },
  { id: 'combo10', i: '⚡', t: ['Молния', 'Маланка', 'Blesk', 'Lightning'], d: ['10 правильных ответов подряд', '10 правільных адказаў запар', '10 správných odpovědí v řadě', '10 correct answers in a row'], ok: s => s.stat.bestCombo >= 10 },
  { id: 'st3', i: '🔥', t: ['Огонёк', 'Агеньчык', 'Plamínek', 'Little flame'], d: ['Серия 3 дня подряд', 'Серыя 3 дні запар', 'Série 3 dny v řadě', 'A 3-day streak'], ok: s => s.bestStreak >= 3 },
  { id: 'st7', i: '🌋', t: ['Неделя силы', 'Тыдзень сілы', 'Týden síly', 'Week of power'], d: ['Серия 7 дней подряд', 'Серыя 7 дзён запар', 'Série 7 dní v řadě', 'A 7-day streak'], ok: s => s.bestStreak >= 7 },
  { id: 'c100', i: '🎯', t: ['Сотня', 'Сотня', 'Stovka', 'One hundred'], d: ['100 правильных ответов', '100 правільных адказаў', '100 správných odpovědí', '100 correct answers'], ok: s => s.stat.correct >= 100 },
  { id: 'c500', i: '🚀', t: ['Полёт нормальный', 'Палёт нармальны', 'Let se daří', 'Smooth flight'], d: ['500 правильных ответов', '500 правільных адказаў', '500 správných odpovědí', '500 correct answers'], ok: s => s.stat.correct >= 500 },
  { id: 'lv5', i: '⭐', t: ['Уровень 5', 'Узровень 5', 'Úroveň 5', 'Level 5'], d: ['Достигни 5 уровня', 'Дасягні 5 узроўню', 'Dosáhni 5. úrovně', 'Reach level 5'], ok: s => lvl(s.xp) >= 5 },
  { id: 'lv10', i: '🌟', t: ['Уровень 10', 'Узровень 10', 'Úroveň 10', 'Level 10'], d: ['Достигни 10 уровня', 'Дасягні 10 узроўню', 'Dosáhni 10. úrovně', 'Reach level 10'], ok: s => lvl(s.xp) >= 10 },
  { id: 'pets3', i: '🐾', t: ['Зверинец', 'Звярынец', 'Malá zoo', 'Little zoo'], d: ['Собери 3 питомцев', 'Збяры 3 гадаванцаў', 'Získej 3 kamarády', 'Collect 3 pets'], ok: s => s.pets.length >= 3 },
  { id: 'pets8', i: '🦄', t: ['Коллекционер', 'Калекцыянер', 'Sběratel', 'Collector'], d: ['Собери 8 питомцев', 'Збяры 8 гадаванцаў', 'Získej 8 kamarádů', 'Collect 8 pets'], ok: s => s.pets.length >= 8 },
  { id: 'hat', i: '🎩', t: ['Модник', 'Франт', 'Elegán', 'Dapper'], d: ['Купи первую шляпу', 'Купі першы галаўны ўбор', 'Kup si první klobouk', 'Buy your first hat'], ok: s => s.hats.length >= 1 },
  { id: 'star15', i: '✨', t: ['Звёздная пыль', 'Зорны пыл', 'Hvězdný prach', 'Stardust'], d: ['Собери 15 звёзд', 'Збяры 15 зорак', 'Získej 15 hvězd', 'Collect 15 stars'], ok: s => totalStars(s) >= 15 },
  { id: 'star60', i: '🌠', t: ['Звёздное небо', 'Зорнае неба', 'Hvězdná obloha', 'Starry sky'], d: ['Собери 60 звёзд', 'Збяры 60 зорак', 'Získej 60 hvězd', 'Collect 60 stars'], ok: s => totalStars(s) >= 60 },
  { id: 'topic', i: '🏆', t: ['Знаток темы', 'Знаўца тэмы', 'Znalec tématu', 'Topic expert'], d: ['Пройди все 10 уроков одной темы', 'Прайдзі ўсе 10 урокаў адной тэмы', 'Dokonči všech 10 lekcí jednoho tématu', 'Complete all 10 lessons of one topic'], ok: s => TOPICS.some(t => doneCount(s, t.id) >= LESSONS) },
  { id: 'all', i: '👑', t: ['Чемпион', 'Чэмпіён', 'Šampion', 'Champion'], d: ['Пройди все уроки всех тем', 'Прайдзі ўсе ўрокі ўсіх тэм', 'Dokonči všechny lekce všech témat', 'Complete all lessons of all topics'], ok: s => TOPICS.every(t => doneCount(s, t.id) >= LESSONS) },
];

/* ======================== Состояние ======================== */
const KEY = 'umniki.v1';
const defState = () => ({ name: '', pet: '', pets: [], hat: '', hats: [], coins: 0, xp: 0, streak: 0, bestStreak: 0, lastDay: '',
  hearts: 5, heartAt: Date.now(), done: { arith: [], frac: [], logic: [], geom: [] }, ach: {},
  stat: { lessons: 0, correct: 0, perfect: 0, bestCombo: 0 }, todayDate: '', todayXp: 0, goalPaid: '', sound: true, recent: [], ts: 0, lang: (/^(be|cs|en|ru)/i.exec(navigator.language || '') || ['ru'])[0].toLowerCase() });
let S;
function load() {
  let raw = null; try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  S = Object.assign(defState(), raw || {});
  S.stat = Object.assign(defState().stat, S.stat); S.done = Object.assign(defState().done, S.done);
  S.lang = langOk(S.lang);
  setLang(S.lang); document.documentElement.lang = S.lang; document.title = tt('Умники', 'Разумнікі', `Chytráci`, `Smart Kids`);
}
function save(o) { S.ts = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} if (!(o && o.nopush)) pushSoon(); }

const pad = n => String(n).padStart(2, '0');
const dayStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dayStr(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); };
const lvl = xp => Math.floor(Math.sqrt(xp / 30)) + 1;
const lvlStart = n => 30 * (n - 1) ** 2;
const totalStars = s => Object.values(s.done).reduce((a, arr) => a + arr.reduce((x, y) => x + (y || 0), 0), 0);
const doneCount = (s, t) => s.done[t].filter(x => x > 0).length;
const curStreak = () => (S.lastDay === today() || S.lastDay === yesterday() ? S.streak : 0);
function touchDay() { if (S.todayDate !== today()) { S.todayDate = today(); S.todayXp = 0; } }
function touchStreak() {
  if (S.lastDay === today()) return;
  S.streak = S.lastDay === yesterday() ? S.streak + 1 : 1; S.lastDay = today(); S.bestStreak = Math.max(S.bestStreak, S.streak);
}
function syncHearts() {
  if (S.hearts >= 5) { S.hearts = 5; S.heartAt = Date.now(); return; }
  const n = Math.floor((Date.now() - S.heartAt) / REGEN);
  if (n > 0) { S.hearts = Math.min(5, S.hearts + n); S.heartAt += n * REGEN; if (S.hearts >= 5) S.heartAt = Date.now(); }
}
function loseHeart() { if (S.hearts >= 5) S.heartAt = Date.now(); S.hearts = Math.max(0, S.hearts - 1); }
const heartTimer = () => { const ms = Math.max(0, S.heartAt + REGEN - Date.now()), s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };

/* ======================== Звук и эффекты ======================== */
let ac = null;
function tone(f, t, d, type = 'sine', v = 0.15) {
  if (!S.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain(), st = ac.currentTime + t;
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, st); g.gain.exponentialRampToValueAtTime(0.001, st + d);
    o.connect(g); g.connect(ac.destination); o.start(st); o.stop(st + d + 0.02);
  } catch (e) {}
}
const sfx = {
  ok() { tone(660, 0, 0.12); tone(880, 0.1, 0.2); },
  no() { tone(200, 0, 0.28, 'sawtooth', 0.09); try { navigator.vibrate && navigator.vibrate(60); } catch (e) {} },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.3)); },
  lose() { [392, 330, 262].forEach((f, i) => tone(f, i * 0.18, 0.3, 'triangle')); },
  coin() { tone(988, 0, 0.08, 'square', 0.07); tone(1319, 0.08, 0.2, 'square', 0.07); },
  tap() { tone(520, 0, 0.04, 'sine', 0.06); },
};
function confetti(n = 44) {
  const box = document.createElement('div'); box.className = 'confetti';
  const em = ['⭐', '🎉', '✨', '💛', '💜', '🎈', '🌟'];
  for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.textContent = pick(em); s.style.left = rnd(0, 100) + '%';
    s.style.animationDelay = (Math.random() * 0.7) + 's'; s.style.fontSize = rnd(18, 34) + 'px'; box.appendChild(s); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 3000);
}
function toast(html) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3200);
}
function modal({ icon = '', title = '', text = '', btns = [] }) {
  const m = $('#modal');
  m.innerHTML = `<div class="ov"><div class="dlg">${icon ? `<div class="ic">${icon}</div>` : ''}<h3>${title}</h3><p>${text}</p>` +
    btns.map((b, i) => `<button class="btn ${b.c || ''}" data-mi="${i}">${b.t}</button>`).join('') + '</div></div>';
  m._btns = btns;
}
const closeModal = () => { const m = $('#modal'); m.innerHTML = ''; m._btns = null; };

/* ======================== Построение уроков ======================== */
function makeQ(g, d) { const q = g.make(d); q.topic = g.topic; q.gid = g.id; q.d = d; return q; }
const sigOf = q => q.gid + '|' + (q.key || q.text + (q.visual || ''));
/* Новая задача из генератора g, которой ещё не было в этом уроке и (по возможности) в недавней истории.
   Если свежей не нашлось — возвращает ту, что видели давнее всего. */
function freshQ(g, d, seen) {
  const recent = S.recent || []; let best = null;
  for (let t = 0; t < 25; t++) {
    const q = makeQ(g, d), s = sigOf(q);
    if (seen.has(s)) continue;
    const age = recent.lastIndexOf(s);          // -1 = не встречалась; меньше индекс = давнее
    if (age < 0) return { q, fresh: true };
    if (!best || age < best.age) best = { q, age, fresh: false };
  }
  return best;
}
function buildSet(pool, d) {
  const out = [], seen = new Set(); let bag = [], last = null;
  for (let i = 0; i < QPL; i++) {
    if (!bag.length) bag = shuffle(pool);
    let k = bag.findIndex(x => x !== last); if (k < 0) k = 0;
    const primary = bag.splice(k, 1)[0];
    // сначала пробуем «очередной» тип задач, затем остальные — пока не найдётся свежий вопрос
    const cands = [primary, ...shuffle(pool.filter(x => x !== primary && x !== last))];
    let chosen = null, stale = null;
    for (const g of cands) {
      const r = freshQ(g, Math.max((i < 2 && d > 1) ? d - 1 : d, g.minD), seen);
      if (!r) continue;
      if (r.fresh) { chosen = r.q; break; }
      if (!stale || r.age < stale.age) stale = r;
    }
    const q = chosen || (stale ? stale.q : makeQ(primary, d));
    last = GENS.find(x => x.id === q.gid); seen.add(sigOf(q)); out.push(q);
  }
  return out;
}
const lessonD = idx => Math.min(5, 1 + Math.floor(idx / 2));
const buildLesson = (topic, idx) => buildSet(GENS.filter(g => g.topic === topic && g.minD <= lessonD(idx)), lessonD(idx));
function buildMixed() {
  const n = TOPICS.reduce((a, t) => a + doneCount(S, t.id), 0), d = Math.min(5, 1 + Math.floor(n / 6));
  return buildSet(GENS.filter(g => g.minD <= d), d);
}

/* ======================== Маршрутизация и отрисовка ======================== */
let R = 'home', L = null, RES = null;
const root = $('#app');
const mascot = (cls = '', bounce = false) => `<div class="mascot ${cls}${bounce ? ' bounce' : ''}"><span class="hat">${S.hat}</span><span class="pet">${S.pet}</span></div>`;

function topBar() {
  return `<div class="top">
    <button class="pill fire" data-a="streakinfo">🔥 <b>${curStreak()}</b></button>
    <button class="pill lv" data-a="goto" data-t="awards">⭐ <b>${lvl(S.xp)}</b></button>
    <button class="pill coin" data-a="goto" data-t="shop">🪙 <b id="coins">${S.coins}</b></button>
    <button class="pill hp" data-a="heartinfo">❤️ <b id="hearts">${S.hearts}</b>${S.hearts < 5 ? `<small id="htimer">${heartTimer()}</small>` : ''}</button>
  </div>`;
}
const tabs = on => `<nav class="tabs">${[['home', '🏠', tt('Учёба', 'Навучанне', `Učení`, `Learn`)], ['shop', '🎁', tt('Магазин', 'Крама', `Obchod`, `Shop`)], ['awards', '🏆', tt('Награды', 'Узнагароды', `Odměny`, `Awards`)]]
  .map(([id, ic, n]) => `<button class="tab${on === id ? ' on' : ''}" data-a="goto" data-t="${id}"><span>${ic}</span>${n}</button>`).join('')}</nav>`;

function render() {
  syncHearts(); touchDay();
  if (!S.name) R = 'onboard';
  if (R === 'profile' || R === 'onboard') prefetchFb();
  ({ onboard: rOnboard, home: rHome, shop: rShop, awards: rAwards, profile: rProfile, lesson: rLesson, result: rResult })[R]();
  window.scrollTo(0, 0);
}

/* ---------- онбординг ---------- */
let ob = { pet: '🐱' };
function rOnboard() {
  root.innerHTML = `<div class="onb"><div style="font-size:70px">🎓</div><h1>${tt('Умники', 'Разумнікі', `Chytráci`, `Smart Kids`)}</h1>
    <div class="pets lang">${Object.entries(LANG_NAMES).map(([c, n]) => `<button class="${S.lang === c ? 'on' : ''}" data-a="lang" data-l="${c}">${n}</button>`).join('')}</div>
    <p>${tt('Математика и логика в игре! Как тебя зовут?', 'Матэматыка і логіка ў гульні! Як цябе клічуць?', `Matematika a logika hrou! Jak se jmenuješ?`, `Maths and logic as a game! What is your name?`)}</p>
    <input id="nm" maxlength="14" placeholder="${tt('Твоё имя', 'Тваё імя', `Tvoje jméno`, `Your name`)}" autocomplete="off" value="${esc(S.name)}">
    <p>${tt('Выбери себе друга:', 'Абяры сабе сябра:', `Vyber si kamaráda:`, `Choose a friend:`)}</p>
    <div class="pets">${['🐱', '🐶', '🐰'].map(e => `<button class="${ob.pet === e ? 'on' : ''}" data-a="obpet" data-e="${e}">${e}</button>`).join('')}</div>
    <button class="btn ghost sm" data-a="login">🔑 ${tt('У меня уже есть профиль — войти через Google', 'У мяне ўжо ёсць профіль — увайсці праз Google', `Už mám profil – přihlásit se přes Google`, `I already have a profile – sign in with Google`)}</button>
    <div style="margin-top:auto"><button class="btn grn" data-a="obstart">${tt('Поехали!', 'Паехалі!', `Jdeme na to!`, `Let's go!`)}</button></div></div>`;
}

/* ---------- главная ---------- */
const PHRASES = {
  ru: ['Давай решим пару задач! Поехали! 🚀', 'Каждая решённая задача делает тебя умнее! 🧠', 'Сегодня отличный день для логики! ☀️',
    'Ошибки — это ступеньки к успеху! 🪜', 'Давай заработаем ещё звёздочек! ⭐', 'Попробуй задачу посложнее — у тебя получится! 💪'],
  be: ['Давай рашым пару задач! Паехалі! 🚀', 'Кожная вырашаная задача робіць цябе разумнейшым! 🧠', 'Сёння выдатны дзень для логікі! ☀️',
    'Памылкі — гэта прыступкі да поспеху! 🪜', 'Давай зарабім яшчэ зорачак! ⭐', 'Паспрабуй задачу складанейшую — у цябе атрымаецца! 💪'],
  cs: ['Pojďme vyřešit pár úloh! Jdeme na to! 🚀', 'Každá vyřešená úloha tě dělá chytřejším! 🧠', 'Dnes je skvělý den na logiku! ☀️',
    'Chyby jsou schody k úspěchu! 🪜', 'Pojďme získat další hvězdičky! ⭐', 'Zkus těžší úlohu – určitě to zvládneš! 💪'],
  en: ['Let’s solve a few problems! Off we go! 🚀', 'Every problem you solve makes you smarter! 🧠', 'Today is a great day for logic! ☀️',
    'Mistakes are steps to success! 🪜', 'Let’s earn some more stars! ⭐', 'Try a harder problem – you can do it! 💪'],
};
const newPhrase = () => pick(PHRASES[getLang()]);
let phrase = newPhrase();
function rHome() {
  const L0 = lvl(S.xp), a = lvlStart(L0), b = lvlStart(L0 + 1), pr = Math.min(100, Math.round((S.xp - a) / (b - a) * 100));
  const gp = Math.min(100, Math.round(S.todayXp / GOAL * 100));
  root.innerHTML = topBar() + `<div class="page">
    <div class="hero tap" data-a="profile" role="button">${mascot()}<div class="bubble">${tt('Привет', 'Прывітанне', `Ahoj`, `Hello`)}, <b>${esc(S.name)}</b>!<br><span style="font-weight:700;font-size:14px">${phrase}</span>
      <div class="bar xp xpbar"><i style="width:${pr}%"></i></div><div class="small"><span>${tt('Уровень', 'Узровень', `Úroveň`, `Level`)} ${L0}</span><span>${S.xp - a} / ${b - a} XP</span></div></div><span class="chev">›</span></div>
    <div class="goal"><div class="row"><span>🎯 ${tt('Цель на сегодня', 'Мэта на сёння', `Dnešní cíl`, `Today's goal`)}</span><span>${Math.min(S.todayXp, GOAL)} / ${GOAL} XP ${S.todayXp >= GOAL ? '✅' : ''}</span></div>
      <div class="bar"><i style="width:${gp}%"></i></div></div>
    <button class="btn yel" data-a="mixed">🎲 ${tt('Быстрая тренировка', 'Хуткая трэніроўка', `Rychlý trénink`, `Quick practice`)}</button>
    ${TOPICS.map(t => {
      const arr = S.done[t.id], dc = doneCount(S, t.id);
      return `<section class="topic" style="--c:${t.color}"><h2>${t.icon} ${P(t.name)}</h2><div class="sub">${P(t.sub)} · ${tt('пройдено', 'пройдзена', `splněno`, `completed`)} ${dc}/${LESSONS}</div><div class="path">` +
        Array.from({ length: LESSONS }, (_, i) => {
          const st = arr[i] || 0, open = i === 0 || arr[i - 1] > 0, cur = open && !st;
          const stars = st ? '⭐'.repeat(st) : '';
          return `<button class="node${open ? '' : ' lock'}${cur ? ' cur' : ''}${i % 2 && i === LESSONS - 1 ? '' : ''}" data-a="${open ? 'lesson' : 'locked'}" data-t="${t.id}" data-i="${i}">${open ? (st ? '✓' : i + 1) : '🔒'}<span class="st">${stars}</span></button>`;
        }).join('') + '</div></section>';
    }).join('')}</div>` + tabs('home');
}

/* ---------- магазин ---------- */
function rShop() {
  const card = (it, kind) => {
    const own = kind === 'pet' ? S.pets.includes(it.e) : S.hats.includes(it.e), on = kind === 'pet' ? S.pet === it.e : S.hat === it.e;
    return `<div class="card${on ? ' on' : ''}${own ? '' : ' lock'}"><div class="em">${it.e}</div><div class="ttl">${P(it.n)}</div>` +
      (own ? `<button class="btn ${on ? 'ghost' : 'grn'}" data-a="equip" data-k="${kind}" data-e="${it.e}">${on ? (kind === 'hat' ? tt('Снять', 'Зняць', `Sundat`, `Take off`) : tt('Выбран', 'Абраны', `Vybráno`, `Selected`)) : tt('Выбрать', 'Абраць', `Vybrat`, `Select`)}</button>`
        : `<button class="btn yel" data-a="buy" data-k="${kind}" data-e="${it.e}">🪙 ${it.p}</button>`) + '</div>';
  };
  root.innerHTML = topBar() + `<div class="page"><div class="h1">${tt('Магазин', 'Крама', `Obchod`, `Shop`)}</div>
    <div class="hero">${mascot()}<div class="bubble">${tt('Зарабатывай монеты на уроках и открывай новых друзей и наряды!', 'Зарабляй манеты на ўроках і адкрывай новых сяброў і ўборы!', `Získávej mince v lekcích a odemykej nové kamarády a oblečení!`, `Earn coins in lessons and unlock new friends and outfits!`)}</div></div>
    <div class="sect">${tt('Друзья', 'Сябры', `Kamarádi`, `Friends`)}</div><div class="grid">${PETS.map(p => card(p, 'pet')).join('')}</div>
    <div class="sect">${tt('Шляпы', 'Галаўныя ўборы', `Klobouky`, `Hats`)}</div><div class="grid">${HATS.map(h => card(h, 'hat')).join('')}</div>
    <div class="sect">${tt('Прочее', 'Іншае', `Ostatní`, `Other`)}</div>
    <div class="card" style="flex-direction:row;justify-content:space-between;padding:12px 14px"><div style="text-align:left"><div class="ttl" style="font-size:16px">❤️ ${tt('Сердечко', 'Сэрцайка', `Srdíčko`, `Heart`)}</div><small>${tt('Восстанови одну жизнь', 'Аднаві адно жыццё', `Obnov jeden život`, `Restore one life`)}</small></div>
      <button class="btn yel" style="width:auto;padding:9px 14px" data-a="buyheart">🪙 ${HEART_PRICE}</button></div></div>` + tabs('shop');
}

/* ---------- награды ---------- */
function rAwards() {
  const got = ACH.filter(a => S.ach[a.id]).length, L0 = lvl(S.xp);
  root.innerHTML = topBar() + `<div class="page"><div class="h1">${tt('Награды', 'Узнагароды', `Odměny`, `Awards`)}</div>
    <div class="prof tap" data-a="profile" role="button">${mascot('')}<div><div class="nm">${esc(S.name)}</div><div class="lv">${tt('Уровень', 'Узровень', `Úroveň`, `Level`)} ${L0} · ${S.xp} XP</div></div><span class="chev">›</span></div>
    <div class="stats"><div><b>${totalStars(S)} ⭐</b>${tt('звёзд собрано', 'зорак сабрана', `získaných hvězd`, `stars collected`)}</div><div><b>${S.stat.correct}</b>${tt('верных ответов', 'правільных адказаў', `správných odpovědí`, `correct answers`)}</div>
      <div><b>${S.stat.lessons}</b>${tt('уроков пройдено', 'урокаў пройдзена', `dokončených lekcí`, `lessons completed`)}</div><div><b>${S.bestStreak} 🔥</b>${tt('лучшая серия', 'лепшая серыя', `nejdelší série`, `best streak`)}</div></div>
    <div class="sect">${tt('Достижения', 'Дасягненні', `Úspěchy`, `Achievements`)} · ${got}/${ACH.length}</div>
    <div class="grid">${ACH.map(a => `<div class="card${S.ach[a.id] ? ' on' : ' lock'}"><div class="em">${a.i}</div><div class="ttl">${P(a.t)}</div><small>${P(a.d)}</small></div>`).join('')}</div></div>` + tabs('awards');
}

/* ---------- профиль ---------- */
function rProfile() {
  const L0 = lvl(S.xp), a = lvlStart(L0), b = lvlStart(L0 + 1), pr = Math.min(100, Math.round((S.xp - a) / (b - a) * 100));
  root.innerHTML = topBar() + `<div class="page">
    <button class="back" data-a="goto" data-t="home">← ${tt('Назад', 'Назад', `Zpět`, `Back`)}</button>
    <div class="prof big">${mascot('')}<div class="pinfo"><div class="nm">${esc(S.name)}</div><div class="lv">${tt('Уровень', 'Узровень', `Úroveň`, `Level`)} ${L0} · ${S.xp} XP</div>
      <div class="bar xp"><i style="width:${pr}%"></i></div></div></div>
    <div class="row2"><button class="btn ghost sm" data-a="goto" data-t="shop">🎁 ${tt('Сменить друга и шляпу', 'Змяніць сябра і галаўны ўбор', `Změnit kamaráda a klobouk`, `Change friend and hat`)}</button></div>
    <div class="sect">${tt('Аккаунт', 'Акаўнт', `Účet`, `Account`)}</div>
    ${fbUser ? `<div class="row2"><div class="cloud">☁️ ${esc(fbUser.email || '')}<small>${cloudText()}</small></div><button class="btn ghost sm" data-a="logout" style="width:auto">${tt('Выйти', 'Выйсці', `Odhlásit`, `Sign out`)}</button></div>`
      : `<div class="row2"><button class="btn blu sm" data-a="login">🔑 ${tt('Войти через Google и сохранить прогресс', 'Увайсці праз Google і захаваць прагрэс', `Přihlásit se přes Google a uložit postup`, `Sign in with Google and save progress`)}</button></div>`}
    <div class="sect">${tt('Настройки', 'Налады', `Nastavení`, `Settings`)}</div>
    <div class="row2"><button class="btn ghost sm" data-a="sound">${S.sound ? tt('🔊 Звук включён', '🔊 Гук уключаны', `🔊 Zvuk zapnutý`, `🔊 Sound on`) : tt('🔇 Звук выключен', '🔇 Гук выключаны', `🔇 Zvuk vypnutý`, `🔇 Sound off`)}</button></div>
    <div class="sect">🌐 ${tt('Язык', 'Мова', 'Jazyk', 'Language')}</div>
    <div class="pets lang">${Object.entries(LANG_NAMES).map(([c, n]) => `<button class="${S.lang === c ? 'on' : ''}" data-a="lang" data-l="${c}">${n}</button>`).join('')}</div>
    <div class="row2"><button class="btn ghost sm" data-a="rename">✏️ ${tt('Сменить имя', 'Змяніць імя', `Změnit jméno`, `Change name`)}</button><button class="btn ghost sm" data-a="reset">🗑 ${tt('Начать заново', 'Пачаць зноў', `Začít znovu`, `Start over`)}</button></div></div>` + tabs('');
}

/* ---------- урок ---------- */
function startLesson(topic, idx, opts = {}) {
  document.querySelectorAll('.confetti').forEach(e => e.remove());
  syncHearts();
  if (!opts.practice && S.hearts <= 0) return noHearts(() => startLesson(topic, idx, opts), topic, idx);
  const qs = opts.mixed ? buildMixed() : buildLesson(topic, idx);
  L = { topic, idx, mixed: !!opts.mixed, practice: !!opts.practice, queue: qs.slice(), total: qs.length, resolved: 0, added: 0,
    firstOK: 0, mistakes: 0, combo: 0, bestCombo: 0, answered: false, ok: false, sel: null, input: '', hint: false, startHearts: S.hearts };
  R = 'lesson'; render();
}
function noHearts(again, topic, idx) {
  modal({ icon: '💔', title: tt('Сердечки закончились', 'Сэрцайкі скончыліся', `Došla srdíčka`, `Out of hearts`), text: tt(`Новое сердечко появится через <b>${heartTimer()}</b>. Можно купить сердечко за ${HEART_PRICE} 🪙 или потренироваться без сердечек (меньше XP).`, `Новае сэрцайка з’явіцца праз <b>${heartTimer()}</b>. Можна купіць сэрцайка за ${HEART_PRICE} 🪙 або папрактыкавацца без сэрцайкаў (менш XP).`, `Nové srdíčko přibude za <b>${heartTimer()}</b>. Můžeš si srdíčko koupit za ${HEART_PRICE} 🪙 nebo trénovat bez srdíček (méně XP).`, `A new heart appears in <b>${heartTimer()}</b>. You can buy a heart for ${HEART_PRICE} 🪙 or practise without hearts (less XP).`),
    btns: [{ t: tt(`Купить ❤️ за ${HEART_PRICE}`, `Купіць ❤️ за ${HEART_PRICE}`, `Koupit ❤️ za ${HEART_PRICE}`, `Buy ❤️ for ${HEART_PRICE}`), c: 'yel', f: () => { if (buyHeart()) again(); } },
      { t: tt('Тренировка без сердечек', 'Трэніроўка без сэрцайкаў', `Trénink bez srdíček`, `Practice without hearts`), c: 'blu', f: () => startLesson(topic, idx, { practice: true, mixed: topic === undefined }) },
      { t: tt('Подожду', 'Пачакаю', `Počkám`, `I'll wait`), c: 'ghost', f: () => {} }] });
}
function buyHeart() {
  if (S.hearts >= 5) { toast(tt('Сердечки уже полные! ❤️', 'Сэрцайкі ўжо поўныя! ❤️', `Srdíčka jsou už plná! ❤️`, `Hearts are already full! ❤️`)); return false; }
  if (S.coins < HEART_PRICE) { toast(tt(`Не хватает монет: нужно ${HEART_PRICE} 🪙`, `Не хапае манет: трэба ${HEART_PRICE} 🪙`, `Nemáš dost mincí: potřebuješ ${HEART_PRICE} 🪙`, `Not enough coins: you need ${HEART_PRICE} 🪙`)); return false; }
  S.coins -= HEART_PRICE; S.hearts++; if (S.hearts >= 5) S.heartAt = Date.now(); save(); sfx.coin(); toast(tt('❤️ Сердечко куплено!', '❤️ Сэрцайка куплена!', `❤️ Srdíčko koupeno!`, `❤️ Heart bought!`)); if (R !== 'lesson') render(); return true;
}

const plain = h => String(h).replace(/<[^>]*>/g, '');
const qHTML = q => {
  const T = TOPICS.find(t => t.id === q.topic);
  return `<span class="tag" style="--c:${T.color}">${T.icon} ${P(T.name)}</span><div class="qtext">${q.text}</div>${q.visual ? `<div class="visual">${q.visual}</div>` : ''}`;
};
function rLesson() {
  const q = L.queue[0], prog = Math.round(L.resolved / (L.total + L.added) * 100);
  let ans = '';
  if (q.type === 'choice') {
    const cls = q.wide || q.choices.length === 3 && q.choices.every(c => plain(c.h).length <= 2) ? 'c3' : (q.choices.some(c => plain(c.h).length > 22) ? 'c1' : '');
    ans = `<div class="opts ${cls}">` + q.choices.map((c, i) => {
      let st = ''; if (L.answered) { if (c.v === q.answer) st = ' ok'; else if (L.sel === i) st = ' no'; } else if (L.sel === i) st = ' sel';
      const k = q.big ? ' emo' : (plain(c.h).length > 12 && !/</.test(c.h) ? ' txt' : '');
      return `<button class="opt${k}${st}" data-a="pick" data-i="${i}">${c.h}</button>`;
    }).join('') + '</div>';
  } else {
    ans = `<div class="numrow"><div class="numdisp${L.answered ? (L.ok ? ' ok' : ' no') : ''}">${L.input || '&nbsp;'}</div>` + (L.answered ? '' : '<button class="bk" data-a="key" data-k="b">⌫</button>') + '</div>' + (L.answered ? '' :
      `<div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => `<button data-a="key" data-k="${n}">${n}</button>`).join('')}</div>`);
  }
  let foot;
  if (L.answered) {
    const shown = q.type === 'choice' ? q.choices.find(c => c.v === q.answer).h : q.answer;
    foot = L.ok
      ? `<div class="fb ok"><div class="msg">${mascot('sm', true)}<div><b>${pick(tt(['Верно!', 'Отлично!', 'Супер!', 'Так держать!', 'Блестяще!', 'Молодец!'], ['Правільна!', 'Выдатна!', 'Суперпа!', 'Так трымаць!', 'Бліскуча!', 'Малайчына!'], ['Správně!', 'Výborně!', 'Super!', 'Jen tak dál!', 'Skvělé!', 'Šikovně!'], ['Correct!', 'Great job!', 'Super!', 'Keep it up!', 'Brilliant!', 'Well done!']))}${L.combo >= 3 ? `<span class="combo">🔥 ${L.combo} ${tt('подряд', 'запар', `v řadě`, `in a row`)}</span>` : ''}</b>${esc(q.explain || '')}</div></div><button class="btn grn" data-a="next">${tt('Дальше', 'Далей', `Dál`, `Next`)}</button></div>`
      : `<div class="fb no"><div class="msg">${mascot('sm')}<div><b>${pick(tt(['Почти!', 'Не страшно!', 'Ничего, бывает!', 'В следующий раз получится!'], ['Амаль!', 'Не страшна!', 'Нічога, бывае!', 'У наступны раз атрымаецца!'], ['Skoro!', 'To nevadí!', 'Nic se neděje!', 'Příště to vyjde!'], ['Almost!', "Don't worry!", 'It happens!', 'You will get it next time!']))}</b>${tt('Правильный ответ', 'Правільны адказ', `Správná odpověď`, `Correct answer`)}: <b style="display:inline">${shown}</b><br>${esc(q.explain || '')}</div></div><button class="btn red" data-a="next">${tt('Понятно', 'Зразумела', `Jasné`, `Got it`)}</button></div>`;
  } else {
    const can = q.type === 'choice' ? L.sel !== null : L.input !== '';
    foot = `<div class="lfoot"><button class="btn ghost" data-a="hint">💡 ${HINT_PRICE}🪙</button><button class="btn grn" data-a="check" ${can ? '' : 'disabled'}>${tt('Проверить', 'Праверыць', `Zkontrolovat`, `Check`)}</button></div>`;
  }
  root.innerHTML = `<div class="lesson"><div class="lhead"><button class="x" data-a="quit">✕</button><div class="bar"><i style="width:${prog}%"></i></div>
    <div class="hp">${L.practice ? '∞' : '❤️ ' + S.hearts}</div></div>
    <div class="qwrap">${qHTML(q)}${L.hint ? `<div class="hintbox">💡 ${esc(q.hint)}</div>` : ''}${ans}</div>${foot}</div>`;
}
function check() {
  const q = L.queue[0]; if (L.answered) return;
  let ok;
  if (q.type === 'choice') ok = q.choices[L.sel].v === q.answer; else ok = parseInt(L.input, 10) === q.answer;
  L.answered = true; L.ok = ok;
  (S.recent = S.recent || []).push(sigOf(q)); if (S.recent.length > 150) S.recent.shift();
  if (ok) {
    if (!q.retry) L.firstOK++;
    L.combo++; L.bestCombo = Math.max(L.bestCombo, L.combo); L.resolved++; S.stat.correct++; sfx.ok();
  } else {
    L.combo = 0; if (!q.retry) { L.mistakes++; } if (!L.practice) loseHeart(); sfx.no();
    if (!q.retry) { const g = GENS.find(x => x.id === q.gid), nq = (freshQ(g, q.d, new Set([sigOf(q)])) || { q: makeQ(g, q.d) }).q; nq.retry = true; L.queue.push(nq); L.added++; }
    else L.resolved++;   // второй промах по той же теме — засчитываем как пройденный, чтобы не зациклиться
  }
  save(); rLesson();
  if (!ok) { const el = $('.fb') || root; el.classList.add('shake'); }
}
function next() {
  L.queue.shift(); L.answered = false; L.sel = null; L.input = ''; L.hint = false;
  if (!L.practice && S.hearts <= 0) return finish(true);
  if (!L.queue.length) return finish(false);
  rLesson();
}

/* ---------- завершение урока ---------- */
function finish(failed) {
  const events = [], lvBefore = lvl(S.xp), mist = L.mistakes;
  let xp = 0, coins = 0, stars = 0;
  if (failed) { sfx.lose(); xp = L.firstOK * 2; }
  else {
    stars = mist === 0 ? 3 : mist <= 2 ? 2 : 1;
    if (L.practice) xp = 2 * L.firstOK;
    else { xp = 5 * L.firstOK + (mist === 0 ? 10 : 0) + 5; coins = L.firstOK + stars * 2; }
    if (!L.mixed && !L.practice) { const arr = S.done[L.topic]; arr[L.idx] = Math.max(arr[L.idx] || 0, stars); for (let i = 0; i < arr.length; i++) arr[i] = arr[i] || 0; }
    S.stat.lessons++; if (mist === 0) S.stat.perfect++;
    touchStreak(); sfx.win(); confetti();
  }
  S.stat.bestCombo = Math.max(S.stat.bestCombo, L.bestCombo);
  S.xp += xp; S.coins += coins; touchDay(); S.todayXp += xp;
  if (S.todayXp >= GOAL && S.goalPaid !== today()) { S.goalPaid = today(); S.coins += 10; events.push({ i: '🎯', t: tt('Цель дня выполнена! +10 🪙', 'Мэта дня выканана! +10 🪙', `Denní cíl splněn! +10 🪙`, `Daily goal reached! +10 🪙`) }); }
  const lvAfter = lvl(S.xp);
  if (lvAfter > lvBefore) { S.coins += 10 * (lvAfter - lvBefore); events.push({ i: '⬆️', t: tt(`Новый уровень: ${lvAfter}! +${10 * (lvAfter - lvBefore)} 🪙`, `Новы ўзровень: ${lvAfter}! +${10 * (lvAfter - lvBefore)} 🪙`, `Nová úroveň: ${lvAfter}! +${10 * (lvAfter - lvBefore)} 🪙`, `New level: ${lvAfter}! +${10 * (lvAfter - lvBefore)} 🪙`) }); }
  ACH.forEach(a => { if (!S.ach[a.id] && a.ok(S)) { S.ach[a.id] = today(); S.coins += 10; events.push({ i: a.i, t: tt(`Достижение «${P(a.t)}»! +10 🪙`, `Дасягненне «${P(a.t)}»! +10 🪙`, `Úspěch „${P(a.t)}“! +10 🪙`, `Achievement "${P(a.t)}"! +10 🪙`) }); } });
  save();
  const unlocked = !failed && !L.mixed && !L.practice && L.idx < LESSONS - 1;
  RES = { failed, stars, xp, coins, events, topic: L.topic, idx: L.idx, mixed: L.mixed, practice: L.practice, mist, right: L.firstOK, total: L.total, nextOk: unlocked };
  R = 'result'; render();
}
function rResult() {
  const r = RES;
  root.innerHTML = `<div class="result">
    <div style="font-size:70px">${r.failed ? '💔' : r.stars === 3 ? '🏆' : '🎉'}</div>
    <h1>${r.failed ? tt('Сердечки закончились', 'Сэрцайкі скончыліся', `Došla srdíčka`, `Out of hearts`) : r.stars === 3 ? tt('Идеально!', 'Ідэальна!', `Perfektní!`, `Perfect!`) : tt('Урок пройден!', 'Урок пройдзены!', `Lekce splněna!`, `Lesson complete!`)}</h1>
    <div class="sub">${r.failed ? tt('Не расстраивайся — отдохни и попробуй снова!', 'Не засмучайся — адпачні і паспрабуй зноў!', `Nezoufej – odpočiň si a zkus to znovu!`, `Don't be sad – take a rest and try again!`) : tt(`Верно с первого раза: ${r.right} из ${r.total}`, `Правільна з першага разу: ${r.right} з ${r.total}`, `Správně na první pokus: ${r.right} z ${r.total}`, `Right first time: ${r.right} of ${r.total}`)}</div>
    ${r.failed ? '' : `<div class="stars">${[1, 2, 3].map(i => `<span class="${i <= r.stars ? 'on' : ''}">⭐</span>`).join('')}</div>`}
    <div class="rew"><div><b>+${r.xp}</b>XP</div><div><b>+${r.coins}</b>${tt('монет', 'манет', `mincí`, `coins`)} 🪙</div><div><b>${curStreak()}</b>${tt('серия', 'серыя', `série`, `streak`)} 🔥</div></div>
    ${r.events.map(e => `<div class="evt">${e.i} ${e.t}</div>`).join('')}
    <div class="acts">${r.nextOk ? `<button class="btn grn" data-a="nextlesson">${tt('Следующий урок ▶', 'Наступны ўрок ▶', `Další lekce ▶`, `Next lesson ▶`)}</button>` : ''}
      <button class="btn ${r.nextOk ? 'ghost' : 'grn'}" data-a="home">${tt('Продолжить', 'Працягнуць', `Pokračovat`, `Continue`)}</button>
      ${r.failed ? '' : `<button class="btn ghost" data-a="again">${tt('Ещё раз', 'Яшчэ раз', `Ještě jednou`, `Again`)}</button>`}</div></div>`;
}

/* ======================== Облако (Firebase): вход через Google и сохранение прогресса ======================== */
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCaXeNtARtJgzHUA-6tfzlXKY95ZFj3shE', authDomain: 'kido-134cf.firebaseapp.com', projectId: 'kido-134cf',
  storageBucket: 'kido-134cf.firebasestorage.app', messagingSenderId: '1072588511567', appId: '1:1072588511567:web:1016379d0445d34abbcd3a',
};
const FB_VER = '10.12.2', CLOUD_KEY = 'umniki.cloud';
let fbP = null, fbAuth = null, fbDb = null, fbUser = null, fbLoaded = false, cloudState = 'off', pushTimer = null;
const cloudFlag = () => { try { return localStorage.getItem(CLOUD_KEY) === '1'; } catch (e) { return false; } };
const setCloudFlag = v => { try { v ? localStorage.setItem(CLOUD_KEY, '1') : localStorage.removeItem(CLOUD_KEY); } catch (e) {} };
const loadScript = src => new Promise((res, rej) => { const el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(el); });
/* SDK грузится только когда нужен вход, поэтому без интернета и без входа игра работает как раньше */
function fbInit() {
  if (fbP) return fbP;
  fbP = (async () => {
    const base = `https://www.gstatic.com/firebasejs/${FB_VER}/`;
    await loadScript(base + 'firebase-app-compat.js');
    await Promise.all([loadScript(base + 'firebase-auth-compat.js'), loadScript(base + 'firebase-firestore-compat.js')]);
    if (!window.firebase) throw new Error('sdk');
    firebase.initializeApp(FIREBASE_CONFIG); fbAuth = firebase.auth(); fbDb = firebase.firestore(); fbLoaded = true;
    fbAuth.onAuthStateChanged(onAuth);
  })().catch(e => { fbP = null; throw e; });
  return fbP;
}
const prefetchFb = () => { if (!fbP) fbInit().catch(() => {}); };
function setCloud(st) { cloudState = st; if (R === 'profile') rProfile(); }

const clone = o => JSON.parse(JSON.stringify(o));
const isFresh = s => !s.xp && !(s.stat && s.stat.lessons) && !s.coins;
/* Объединение локального (a) и облачного (b) прогресса. Ничего «накопленного» не теряем:
   XP, звёзды, достижения, питомцы — по максимуму/объединению; монеты, сердечки, серия — от более свежей копии. */
function mergeStates(a, b) {
  a = Object.assign(defState(), a); b = Object.assign(defState(), b);
  if (isFresh(b)) return a;
  if (isFresh(a)) return Object.assign(clone(b), { lang: a.lang, sound: a.sound });
  const nw = (a.ts || 0) >= (b.ts || 0) ? a : b, ol = nw === a ? b : a, m = clone(nw);
  const union = (x, y) => [...new Set([...(x || []), ...(y || [])])];
  m.name = nw.name || ol.name; m.xp = Math.max(a.xp, b.xp);
  m.pets = union(a.pets, b.pets); m.hats = union(a.hats, b.hats);
  m.pet = m.pets.includes(nw.pet) ? nw.pet : (m.pets[0] || ''); m.hat = (!nw.hat || m.hats.includes(nw.hat)) ? nw.hat : '';
  m.done = {}; for (const t of new Set([...Object.keys(a.done), ...Object.keys(b.done)])) {
    const x = a.done[t] || [], y = b.done[t] || [], n = Math.max(x.length, y.length); m.done[t] = Array.from({ length: n }, (_, i) => Math.max(x[i] || 0, y[i] || 0)); }
  m.ach = Object.assign({}, ol.ach, nw.ach);
  m.stat = {}; for (const k of new Set([...Object.keys(a.stat), ...Object.keys(b.stat)])) m.stat[k] = Math.max(a.stat[k] || 0, b.stat[k] || 0);
  m.bestStreak = Math.max(a.bestStreak, b.bestStreak);
  const sd = (a.lastDay || '') >= (b.lastDay || '') ? a : b;
  m.streak = sd.streak; m.lastDay = sd.lastDay;
  const td = (a.todayDate || '') >= (b.todayDate || '') ? a : b; m.todayDate = td.todayDate; m.todayXp = td.todayXp; m.goalPaid = (a.goalPaid || '') >= (b.goalPaid || '') ? a.goalPaid : b.goalPaid;
  m.recent = union(ol.recent, nw.recent).slice(-150);
  m.lang = a.lang; m.sound = a.sound; m.ts = Math.max(a.ts || 0, b.ts || 0);
  return m;
}
async function pushNow() {
  if (!fbUser || !fbDb) return;
  await fbDb.collection('users').doc(fbUser.uid).set({ s: clone(S), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
}
function pushSoon() {
  if (!fbUser) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { pushTimer = null; pushNow().then(() => setCloud('ok')).catch(() => setCloud('error')); }, 1500);
}
async function onAuth(user) {
  fbUser = user;
  if (!user) { setCloud('off'); return; }
  setCloudFlag(true); setCloud('syncing');
  try {
    const snap = await fbDb.collection('users').doc(user.uid).get(), remote = snap.exists ? (snap.data() || {}).s : null;
    if (remote) { S = mergeStates(S, remote); S.lang = langOk(S.lang); setLang(S.lang); document.documentElement.lang = S.lang; document.title = tt('Умники', 'Разумнікі', `Chytráci`, `Smart Kids`); }
    save({ nopush: true }); await pushNow(); setCloud('ok');
    if (S.name && R === 'onboard') R = 'home';
    if (R !== 'lesson' && R !== 'result') render();
  } catch (e) { console.warn('cloud', e); setCloud('error'); }
}
const cloudText = () => ({ syncing: tt('Сохраняю…', 'Захоўваю…', `Ukládám…`, `Saving…`), ok: tt('Прогресс сохранён в облаке', 'Прагрэс захаваны ў воблаку', `Postup je uložen v cloudu`, `Progress saved in the cloud`),
  error: tt('Не удалось сохранить — проверь интернет', 'Не атрымалася захаваць — праверы інтэрнэт', `Uložení se nepovedlo – zkontroluj připojení`, `Could not save – check your internet`), off: '' })[cloudState];
function login() {
  if (!fbLoaded) {
    toast(tt('Загружаю вход… нажми ещё раз через секунду', 'Загружаю ўваход… націсні яшчэ раз праз секунду', `Načítám přihlášení… zkus to za vteřinu znovu`, `Loading sign-in… press again in a second`));
    fbInit().catch(() => toast(tt('Нет интернета или Google недоступен', 'Няма інтэрнэту або Google недаступны', `Žádné připojení, nebo je Google nedostupný`, `No internet or Google is unavailable`))); return;
  }
  const pr = new firebase.auth.GoogleAuthProvider();
  fbAuth.signInWithPopup(pr).catch(e => {
    const c = (e && e.code) || '';
    if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return;
    if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment') return fbAuth.signInWithRedirect(pr);
    if (c === 'auth/unauthorized-domain') return toast(tt('Этот адрес не разрешён в Firebase (Authorized domains)', 'Гэты адрас не дазволены ў Firebase (Authorized domains)', `Tato adresa není ve Firebase povolena (Authorized domains)`, `This address is not allowed in Firebase (Authorized domains)`));
    toast(tt('Не удалось войти: ', 'Не атрымалася ўвайсці: ', `Přihlášení se nepovedlo: `, `Could not sign in: `) + c);
  });
}
function logout() { if (fbAuth) fbAuth.signOut(); setCloudFlag(false); toast(tt('Вы вышли. Прогресс остался на этом устройстве.', 'Вы выйшлі. Прагрэс застаўся на гэтай прыладзе.', `Odhlášeno. Postup zůstal v tomto zařízení.`, `Signed out. Progress stays on this device.`)); }
document.addEventListener('visibilitychange', () => { if (document.hidden && pushTimer) { clearTimeout(pushTimer); pushTimer = null; pushNow().catch(() => {}); } });

/* ======================== События ======================== */
function press(k) {
  if (!L || L.answered) return;
  if (k === 'b') L.input = L.input.slice(0, -1); else if (k === 'c') L.input = ''; else if (L.input.length < 6) L.input = (L.input + k).replace(/^0+(?=\d)/, '');
  sfx.tap(); rLesson();
}
const A = {
  lang(el) { const v = ($('#nm') || {}).value; if (v !== undefined && !S.name) S.name = v; S.lang = el.dataset.l; setLang(S.lang); document.documentElement.lang = S.lang; document.title = tt('Умники', 'Разумнікі', `Chytráci`, `Smart Kids`); phrase = newPhrase(); save(); if (R === 'onboard' || !S.name) { rOnboard(); const i = $('#nm'); if (i) i.value = S.name; } else render(); },
  profile() { sfx.tap(); R = 'profile'; render(); },
  login() { login(); },
  logout() { logout(); },
  obpet(el) { ob.pet = el.dataset.e; const v = ($('#nm') || {}).value; if (v !== undefined) S.name = v; rOnboard(); const i = $('#nm'); if (i) i.value = S.name; },
  obstart() {
    const v = ($('#nm').value || '').trim();
    if (!v) { toast(tt('Напиши своё имя 🙂', 'Напішы сваё імя 🙂', `Napiš své jméno 🙂`, `Type your name 🙂`)); return; }
    S.name = v; S.pet = ob.pet; S.pets = [ob.pet]; S.heartAt = Date.now(); save(); R = 'home'; render();
  },
  goto(el) { R = el.dataset.t; phrase = newPhrase(); render(); },
  home() { R = 'home'; phrase = newPhrase(); render(); },
  lesson(el) { sfx.tap(); startLesson(el.dataset.t, +el.dataset.i); },
  locked() { toast(tt('Сначала пройди предыдущий урок 🔒', 'Спачатку прайдзі папярэдні ўрок 🔒', `Nejdřív dokonči předchozí lekci 🔒`, `Finish the previous lesson first 🔒`)); },
  mixed() { startLesson(undefined, 0, { mixed: true }); },
  pick(el) { if (L.answered) return; L.sel = +el.dataset.i; sfx.tap(); rLesson(); },
  key(el) { press(el.dataset.k); },
  check() { if (!$('[data-a=check]').disabled) check(); },
  next() { next(); },
  hint() {
    if (L.hint) return;
    if (S.coins < HINT_PRICE) { toast(tt(`Нужно ${HINT_PRICE} 🪙 для подсказки`, `Трэба ${HINT_PRICE} 🪙 для падказкі`, `Na nápovědu potřebuješ ${HINT_PRICE} 🪙`, `You need ${HINT_PRICE} 🪙 for a hint`)); return; }
    S.coins -= HINT_PRICE; L.hint = true; save(); sfx.coin(); rLesson();
  },
  quit() { modal({ icon: '🤔', title: tt('Выйти из урока?', 'Выйсці з урока?', `Ukončit lekci?`, `Leave the lesson?`), text: tt('Прогресс этого урока не сохранится.', 'Прагрэс гэтага ўрока не захаваецца.', `Postup této lekce se neuloží.`, `Progress in this lesson will not be saved.`), btns: [{ t: tt('Продолжить', 'Працягнуць', `Pokračovat`, `Continue`), c: 'grn', f: () => {} }, { t: tt('Выйти', 'Выйсці', `Odhlásit`, `Sign out`), c: 'ghost', f: () => { R = 'home'; render(); } }] }); },
  again() { startLesson(RES.topic, RES.idx, { mixed: RES.mixed, practice: RES.practice }); },
  nextlesson() { startLesson(RES.topic, RES.idx + 1); },
  buy(el) {
    const kind = el.dataset.k, it = (kind === 'pet' ? PETS : HATS).find(x => x.e === el.dataset.e);
    if (S.coins < it.p) { toast(tt(`Не хватает монет: нужно ${it.p} 🪙`, `Не хапае манет: трэба ${it.p} 🪙`, `Nemáš dost mincí: potřebuješ ${it.p} 🪙`, `Not enough coins: you need ${it.p} 🪙`)); return; }
    S.coins -= it.p; if (kind === 'pet') { S.pets.push(it.e); S.pet = it.e; } else { S.hats.push(it.e); S.hat = it.e; }
    save(); sfx.coin(); confetti(24);
    const ev = []; ACH.forEach(a => { if (!S.ach[a.id] && a.ok(S)) { S.ach[a.id] = today(); S.coins += 10; ev.push(a); } });
    save(); render(); toast(tt(`${it.e} ${P(it.n)} теперь твой!`, `${it.e} ${P(it.n)} — у тваёй калекцыі!`, `${it.e} ${P(it.n)} – máš to ve sbírce!`, `${it.e} ${P(it.n)} is now in your collection!`)); ev.forEach(a => toast(tt(`${a.i} Достижение «${P(a.t)}»! +10 🪙`, `${a.i} Дасягненне «${P(a.t)}»! +10 🪙`, `${a.i} Úspěch „${P(a.t)}“! +10 🪙`, `${a.i} Achievement "${P(a.t)}"! +10 🪙`)));
  },
  equip(el) {
    if (el.dataset.k === 'pet') S.pet = el.dataset.e; else S.hat = S.hat === el.dataset.e ? '' : el.dataset.e;
    save(); sfx.tap(); render();
  },
  buyheart() { buyHeart(); },
  heartinfo() {
    syncHearts();
    modal({ icon: '❤️', title: tt(`Сердечки: ${S.hearts} из 5`, `Сэрцайкі: ${S.hearts} з 5`, `Srdíčka: ${S.hearts} z 5`, `Hearts: ${S.hearts} of 5`), text: S.hearts < 5 ? tt(`За каждую ошибку в уроке уходит одно сердечко. Следующее вернётся через <b>${heartTimer()}</b>.`, `За кожную памылку ва ўроку знікае адно сэрцайка. Наступнае вернецца праз <b>${heartTimer()}</b>.`, `Za každou chybu v lekci ubyde jedno srdíčko. Další se vrátí za <b>${heartTimer()}</b>.`, `Each mistake in a lesson costs one heart. The next one comes back in <b>${heartTimer()}</b>.`) : tt('Сердечки полные! За ошибки в уроке они тратятся, а со временем восстанавливаются.', 'Сэрцайкі поўныя! За памылкі ва ўроку яны траціцца, а з часам аднаўляюцца.', `Srdíčka jsou plná! Za chyby v lekci ubývají, ale časem se obnovují.`, `Hearts are full! Mistakes in a lesson use them up, but they come back over time.`),
      btns: [...(S.hearts < 5 ? [{ t: tt(`Купить ❤️ за ${HEART_PRICE} 🪙`, `Купіць ❤️ за ${HEART_PRICE} 🪙`, `Koupit ❤️ za ${HEART_PRICE} 🪙`, `Buy ❤️ for ${HEART_PRICE} 🪙`), c: 'yel', f: () => { buyHeart(); } }] : []), { t: tt('Понятно', 'Зразумела', `Jasné`, `Got it`), c: 'ghost', f: () => {} }] });
  },
  streakinfo() {
    const s = curStreak();
    modal({ icon: '🔥', title: s ? tt(`Серия: ${s} ${plural(s, ['день', 'дня', 'дней'])}`, `Серыя: ${s} ${plural(s, ['дзень', 'дні', 'дзён'])}`, `Série: ${s} ${s === 1 ? 'den' : s < 5 ? 'dny' : 'dní'}`, `Streak: ${s} ${s === 1 ? 'day' : 'days'}`) : tt('Серии пока нет', 'Серыі пакуль няма', `Zatím žádná série`, `No streak yet`), text: S.lastDay === today() ? tt('Сегодня уже были уроки — так держать! Заходи завтра, чтобы серия росла.', 'Сёння ўжо былі ўрокі — так трымаць! Заходзь заўтра, каб серыя расла.', `Dnes už proběhly lekce – jen tak dál! Přijď zítra, ať série roste.`, `You have already had lessons today – keep it up! Come back tomorrow to grow your streak.`) : tt('Пройди хотя бы один урок сегодня, чтобы продолжить серию!', 'Прайдзі хаця б адзін урок сёння, каб працягнуць серыю!', `Dokonči dnes aspoň jednu lekci, ať série pokračuje!`, `Complete at least one lesson today to keep your streak going!`), btns: [{ t: tt('Понятно', 'Зразумела', `Jasné`, `Got it`), c: 'ghost', f: () => {} }] });
  },
  sound() { S.sound = !S.sound; save(); sfx.tap(); render(); },
  rename() { const n = (prompt(tt('Как тебя зовут?', 'Як цябе клічуць?', `Jak se jmenuješ?`, `What is your name?`), S.name) || '').trim(); if (n) { S.name = n.slice(0, 14); save(); render(); } },
  reset() { modal({ icon: '🗑', title: tt('Начать заново?', 'Пачаць зноў?', 'Začít znovu?', 'Start over?'), text: tt('Весь прогресс, монеты и питомцы будут удалены' + (fbUser ? ' (и в облаке тоже).' : '.'), 'Увесь прагрэс, манеты і гадаванцы будуць выдалены' + (fbUser ? ' (і ў воблаку таксама).' : '.'),
    'Veškerý postup, mince a kamarádi budou smazáni' + (fbUser ? ' (i v cloudu).' : '.'), 'All progress, coins and pets will be deleted' + (fbUser ? ' (in the cloud too).' : '.')), btns: [{ t: tt('Оставить как есть', 'Пакінуць як ёсць', 'Nechat jak je', 'Keep it'), c: 'grn', f: () => {} }, { t: tt('Да, удалить', 'Так, выдаліць', 'Ano, smazat', 'Yes, delete'), c: 'red', f: () => { try { localStorage.removeItem(KEY); } catch (e) {} load(); save(); R = 'home'; render(); } }] }); },
};
document.addEventListener('click', e => {
  const mi = e.target.closest('[data-mi]');
  if (mi) { const m = $('#modal'), b = m._btns && m._btns[+mi.dataset.mi]; closeModal(); if (b) b.f(); return; }
  const el = e.target.closest('[data-a]'); if (!el) return;
  if (!ac && S.sound) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (er) {} }
  const f = A[el.dataset.a]; if (f) f(el);
});
document.addEventListener('keydown', e => {
  if (R !== 'lesson' || !L || $('#modal').innerHTML) return;
  const q = L.queue[0];
  if (e.key === 'Enter') { if (L.answered) next(); else if (!$('[data-a=check]').disabled) check(); }
  else if (!L.answered && q.type === 'num') { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('b'); }
  else if (!L.answered && q.type === 'choice' && /^[1-4]$/.test(e.key) && q.choices[+e.key - 1]) { L.sel = +e.key - 1; rLesson(); }
});

/* таймер сердечек */
setInterval(() => {
  const h = $('#hearts'); if (!h || R === 'lesson') return;
  const before = S.hearts; syncHearts();
  if (S.hearts !== before) { save(); render(); return; }
  const t = $('#htimer'); if (t) t.textContent = heartTimer();
}, 1000);

/* ======================== Запуск ======================== */
load(); phrase = newPhrase(); render();
if (cloudFlag()) fbInit().catch(() => {});
try { if (window.top !== window.self) document.documentElement.classList.add('embed'); } catch (e) { document.documentElement.classList.add('embed'); }
const up = $('#totop');
up.setAttribute('aria-label', tt('Наверх', 'Угару', `Nahoru`, `Up`));
up.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
window.addEventListener('scroll', () => { up.hidden = !(window.scrollY > 400 && ['home', 'shop', 'awards'].includes(R)); }, { passive: true });
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
window.__umniki = { GENS, S: () => S, L: () => L, A, buildLesson, sigOf, mergeStates, defState, clone };
})();
