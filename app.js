'use strict';
(() => {
const { GENS, LANGS, rnd, pick, shuffle, esc, t: tt, setLang, getLang } = window.Gens;
const P = pair => pair[LANGS.indexOf(getLang())];
const LANG_NAMES = { be: 'Беларуская', ru: 'Русский', cs: 'Čeština', en: 'English' };
const langOk = l => (LANGS.includes(l) ? l : 'ru');
const plural = (n, f) => { const a = n % 100, b = n % 10; return a > 10 && a < 20 ? f[2] : b === 1 ? f[0] : b > 1 && b < 5 ? f[1] : f[2]; };
const Skills = window.Skills;
const $ = (s, r = document) => r.querySelector(s);

/* ======================== Данные ======================== */
const SK = {
  numbers: { icon: '🔢', color: '#ff5d73', name: ['Числа', 'Лікі', 'Čísla', 'Numbers'], sub: ['Счёт, дроби, время', 'Лічэнне, дробы, час', 'Počty, zlomky, čas', 'Counting, fractions, time'] },
  logic: { icon: '🧠', color: '#7b6cff', name: ['Логика', 'Логіка', 'Logika', 'Logic'], sub: ['Закономерности, загадки, судоку', 'Заканамернасці, загадкі, судоку', 'Pravidelnosti, hádanky, sudoku', 'Patterns, riddles, sudoku'] },
  space: { icon: '📐', color: '#17b8a6', name: ['Пространство', 'Прастора', 'Prostor', 'Space'], sub: ['Фигуры, площадь, схемы', 'Фігуры, плошча, схемы', 'Tvary, obsah, schémata', 'Shapes, area, maps'] },
  attention: { icon: '👀', color: '#ff9f1c', name: ['Внимание', 'Увага', 'Pozornost', 'Attention'], sub: ['Найди, сравни, сосчитай', 'Знайдзі, параўнай, падлічы', 'Najdi, porovnej, spočítej', 'Spot, compare, count'] },
  memory: { icon: '🧩', color: '#3d9be9', name: ['Память', 'Памяць', 'Paměť', 'Memory'], sub: ['Запомни и вспомни', 'Запомні і ўспомні', 'Zapamatuj si a vzpomeň si', 'Remember and recall'] },
  chess: { icon: '♟️', color: '#5c6b73', name: ['Шахматы', 'Шахматы', 'Šachy', 'Chess'], sub: ['Ходы, шах и мат', 'Хады, шах і мат', 'Tahy, šach a mat', 'Moves, check and mate'] },
};
const SKILLS = Skills.SKILLS;
const QPL = 8, ROUTE_QPL = 4, HINT_PRICE = 3;

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
  { id: 'st3', i: '🔥', t: ['Огонёк', 'Агеньчык', 'Plamínek', 'Little flame'], d: ['Занимайся 3 дня (не обязательно подряд)', 'Займайся 3 дні (не абавязкова запар)', 'Cvič 3 dny (ne nutně po sobě)', 'Practise on 3 days (not necessarily in a row)'], ok: s => daysTotal(s) >= 3 },
  { id: 'st7', i: '🌋', t: ['Неделя силы', 'Тыдзень сілы', 'Týden síly', 'Week of power'], d: ['Занимайся 7 дней (не обязательно подряд)', 'Займайся 7 дзён (не абавязкова запар)', 'Cvič 7 dní (ne nutně po sobě)', 'Practise on 7 days (not necessarily in a row)'], ok: s => daysTotal(s) >= 7 },
  { id: 'c100', i: '🎯', t: ['Сотня', 'Сотня', 'Stovka', 'One hundred'], d: ['100 правильных ответов', '100 правільных адказаў', '100 správných odpovědí', '100 correct answers'], ok: s => s.stat.correct >= 100 },
  { id: 'c500', i: '🚀', t: ['Полёт нормальный', 'Палёт нармальны', 'Let se daří', 'Smooth flight'], d: ['500 правильных ответов', '500 правільных адказаў', '500 správných odpovědí', '500 correct answers'], ok: s => s.stat.correct >= 500 },
  { id: 'lv5', i: '⭐', t: ['Уровень 5', 'Узровень 5', 'Úroveň 5', 'Level 5'], d: ['Достигни 5 уровня', 'Дасягні 5 узроўню', 'Dosáhni 5. úrovně', 'Reach level 5'], ok: s => lvl(s.xp) >= 5 },
  { id: 'lv10', i: '🌟', t: ['Уровень 10', 'Узровень 10', 'Úroveň 10', 'Level 10'], d: ['Достигни 10 уровня', 'Дасягні 10 узроўню', 'Dosáhni 10. úrovně', 'Reach level 10'], ok: s => lvl(s.xp) >= 10 },
  { id: 'pets3', i: '🐾', t: ['Зверинец', 'Звярынец', 'Malá zoo', 'Little zoo'], d: ['Собери 3 питомцев', 'Збяры 3 гадаванцаў', 'Získej 3 kamarády', 'Collect 3 pets'], ok: s => s.pets.length >= 3 },
  { id: 'pets8', i: '🦄', t: ['Коллекционер', 'Калекцыянер', 'Sběratel', 'Collector'], d: ['Собери 8 питомцев', 'Збяры 8 гадаванцаў', 'Získej 8 kamarádů', 'Collect 8 pets'], ok: s => s.pets.length >= 8 },
  { id: 'hat', i: '🎩', t: ['Модник', 'Франт', 'Elegán', 'Dapper'], d: ['Купи первую шляпу', 'Купі першы галаўны ўбор', 'Kup si první klobouk', 'Buy your first hat'], ok: s => s.hats.length >= 1 },
  { id: 'star15', i: '✨', t: ['Звёздная пыль', 'Зорны пыл', 'Hvězdný prach', 'Stardust'], d: ['Собери 15 звёзд', 'Збяры 15 зорак', 'Získej 15 hvězd', 'Collect 15 stars'], ok: s => totalStars(s) >= 15 },
  { id: 'star60', i: '🌠', t: ['Звёздное небо', 'Зорнае неба', 'Hvězdná obloha', 'Starry sky'], d: ['Собери 60 звёзд', 'Збяры 60 зорак', 'Získej 60 hvězd', 'Collect 60 stars'], ok: s => totalStars(s) >= 60 },
  { id: 'sk3', i: '📈', t: ['Растём', 'Расцём', 'Rosteme', 'Growing'], d: ['Подними любой навык до 3 уровня', 'Падніми любы навык да 3 узроўню', 'Zvedni jakoukoli dovednost na úroveň 3', 'Raise any skill to level 3'], ok: s => SKILLS.some(k => s.skills[k].lvl >= 3) },
  { id: 'allsk3', i: '🎖️', t: ['Все навыки', 'Усе навыкі', 'Všechny dovednosti', 'All-rounder'], d: ['Все доступные навыки не ниже 3 уровня', 'Усе даступныя навыкі не ніжэй за 3 узровень', 'Všechny dostupné dovednosti alespoň na úrovni 3', 'All available skills at level 3 or higher'], ok: s => availSkills().every(k => s.skills[k].lvl >= 3) },
  { id: 'route1', i: '🗺️', t: ['Первый маршрут', 'Першы маршрут', 'První trasa', 'First route'], d: ['Пройди дневной маршрут', 'Прайдзі дзённы маршрут', 'Dokonči denní trasu', 'Finish a daily route'], ok: s => s.stat.routes >= 1 },
  { id: 'route7', i: '🧭', t: ['Путешественник', 'Падарожнік', 'Cestovatel', 'Explorer'], d: ['Пройди 7 дневных маршрутов', 'Прайдзі 7 дзённых маршрутаў', 'Dokonči 7 denních tras', 'Finish 7 daily routes'], ok: s => s.stat.routes >= 7 },
];

/* ======================== Состояние ======================== */
const KEY = 'umniki.v1';
const defState = () => ({ name: '', pet: '', pets: [], hat: '', hats: [], coins: 0, xp: 0, ach: {},
  stat: { lessons: 0, correct: 0, perfect: 0, bestCombo: 0, routes: 0 }, starsTotal: 0, skills: Skills.newSkills(), hist: {}, route: null,
  sound: true, recent: [], ts: 0, lang: (/^(be|cs|en|ru)/i.exec(navigator.language || '') || ['ru'])[0].toLowerCase() });
let S;
const OLD_KEYS = ['hearts', 'heartAt', 'streak', 'bestStreak', 'lastDay', 'todayDate', 'todayXp', 'goalPaid'];
function load() {
  let raw = null; try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  S = Object.assign(defState(), raw || {});
  S.stat = Object.assign(defState().stat, S.stat);
  if (S.starsTotal === undefined || (raw && raw.done && !raw.starsTotal)) {   // перенос звёзд из старых «уроков»
    S.starsTotal = Math.max(S.starsTotal || 0, Object.values((raw && raw.done) || {}).reduce((a, arr) => a + (arr || []).reduce((x, y) => x + (y || 0), 0), 0)); }
  S.skills = Skills.fixSkills(S.skills); if (!S.hist || typeof S.hist !== 'object') S.hist = {};
  for (const k of [...OLD_KEYS, 'done']) delete S[k];
  S.lang = langOk(S.lang);
  setLang(S.lang); document.documentElement.lang = S.lang; document.title = tt('Умники', 'Разумнікі', `Chytráci`, `Smart Kids`);
}
function save(o) { S.ts = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} if (!(o && o.nopush)) pushSoon(); }

const today = () => Skills.dayStr(new Date());
const lvl = xp => Math.floor(Math.sqrt(xp / 30)) + 1;
const lvlStart = n => 30 * (n - 1) ** 2;
const totalStars = s => s.starsTotal || 0;
const daysTotal = s => Skills.daysPlayedTotal(s.hist);
const availSkills = () => SKILLS.filter(k => GENS.some(g => Skills.SKILL_OF[g.id] === k));
const weekCount = () => Skills.daysPlayedIn(S.hist, today(), 7);
const pad = n => String(n).padStart(2, '0');

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

/* ======================== Построение занятий ======================== */
function makeQ(g, d) { const q = g.make(d); q.topic = g.topic; q.skill = Skills.SKILL_OF[g.id]; q.gid = g.id; q.d = d; return q; }
const sigOf = q => q.gid + '|' + (q.key || q.text + (q.visual || ''));
/* Новая задача из генератора g, которой ещё не было в этом занятии и (по возможности) в недавней истории.
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
function buildSet(pool, d, n) {
  const out = [], seen = new Set(); let bag = [], last = null;
  for (let i = 0; i < n; i++) {
    if (!bag.length) bag = shuffle(pool);
    let k = bag.findIndex(x => x !== last); if (k < 0) k = 0;
    const primary = bag.splice(k, 1)[0];
    // сначала пробуем «очередной» тип задач, затем остальные — пока не найдётся свежий вопрос
    const cands = [primary, ...shuffle(pool.filter(x => x !== primary && x !== last))];
    let chosen = null, stale = null;
    for (const g of cands) {
      const r = freshQ(g, Math.max((i < 2 && d > 1 && n >= 6) ? d - 1 : d, g.minD), seen);
      if (!r) continue;
      if (r.fresh) { chosen = r.q; break; }
      if (!stale || r.age < stale.age) stale = r;
    }
    const q = chosen || (stale ? stale.q : makeQ(primary, d));
    last = GENS.find(x => x.id === q.gid); seen.add(sigOf(q)); out.push(q);
  }
  return out;
}
const skillPool = (skill, lv) => GENS.filter(g => Skills.SKILL_OF[g.id] === skill && g.minD <= lv);

/* ======================== Маршрутизация и отрисовка ======================== */
let R = 'home', L = null, RES = null;
const root = $('#app');
const mascot = (cls = '', bounce = false) => `<div class="mascot ${cls}${bounce ? ' bounce' : ''}"><span class="hat">${S.hat}</span><span class="pet">${S.pet}</span></div>`;

function topBar() {
  return `<div class="top">
    <button class="pill fire" data-a="weekinfo">🔥 <b>${weekCount()}</b><small>/7</small></button>
    <button class="pill lv" data-a="goto" data-t="awards">⭐ <b>${lvl(S.xp)}</b></button>
    <button class="pill coin" data-a="goto" data-t="shop">🪙 <b id="coins">${S.coins}</b></button>
  </div>`;
}
const tabs = on => `<nav class="tabs">${[['home', '🏠', tt('Учёба', 'Навучанне', `Učení`, `Learn`)], ['shop', '🎁', tt('Магазин', 'Крама', `Obchod`, `Shop`)], ['awards', '🏆', tt('Награды', 'Узнагароды', `Odměny`, `Awards`)]]
  .map(([id, ic, n]) => `<button class="tab${on === id ? ' on' : ''}" data-a="goto" data-t="${id}"><span>${ic}</span>${n}</button>`).join('')}</nav>`;

function render() {
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

/* ---------- главная: маршрут дня и карта навыков ---------- */
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
  const had = S.route && S.route.date === today(), r = Skills.ensureRoute(S, today(), availSkills());
  if (!had) save({ nopush: true });
  const nx = r.skills.findIndex(k => !r.done.includes(k));
  const chips = r.skills.map((k, i) => { const dn = r.done.includes(k); return `<span class="rchip${dn ? ' done' : ''}${i === nx ? ' cur' : ''}" style="--c:${SK[k].color}">${SK[k].icon}${dn ? '<i>✓</i>' : ''}</span>`; }).join('<span class="rline"></span>');
  const routeCard = r.finished
    ? `<div class="route fin"><div class="rt">${tt('✅ На сегодня всё!', '✅ На сёння ўсё!', `✅ Pro dnešek hotovo!`, `✅ That's all for today!`)}</div><div class="rchips">${chips}</div>
        <div class="rs">${tt('Приходи завтра — будет новый маршрут 🌙', 'Прыходзь заўтра — будзе новы маршрут 🌙', `Přijď zítra – čeká tě nová trasa 🌙`, `Come back tomorrow for a new route 🌙`)}</div></div>`
    : `<div class="route"><div class="rt">🌟 ${tt('Маршрут на сегодня', 'Маршрут на сёння', `Dnešní trasa`, `Today's route`)}</div>
        <div class="rs">${tt('Четыре мини-игры, около 10–15 минут', 'Чатыры міні-гульні, каля 10–15 хвілін', `Čtyři minihry, asi 10–15 minut`, `Four mini-games, about 10–15 minutes`)}</div>
        <div class="rchips">${chips}</div>
        <button class="btn grn" data-a="route">${r.done.length ? `${tt('Дальше', 'Далей', `Dál`, `Next`)}: ${SK[r.skills[nx]].icon} ${P(SK[r.skills[nx]].name)}` : tt('Начать', 'Пачаць', `Začít`, `Start`)}</button></div>`;
  const cards = availSkills().map(k => { const sk = S.skills[k];
    return `<button class="skc" style="--c:${SK[k].color}" data-a="skill" data-s="${k}"><div class="ico">${SK[k].icon}</div><b>${P(SK[k].name)}</b><small>${P(SK[k].sub)}</small>
      <div class="pips" aria-label="${tt('Уровень', 'Узровень', `Úroveň`, `Level`)} ${sk.lvl}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= sk.lvl ? 'on' : ''}"></i>`).join('')}</div></button>`; }).join('');
  root.innerHTML = topBar() + `<div class="page">
    <div class="hero tap" data-a="profile" role="button">${mascot()}<div class="bubble">${tt('Привет', 'Прывітанне', `Ahoj`, `Hello`)}, <b>${esc(S.name)}</b>!<br><span style="font-weight:700;font-size:14px">${phrase}</span>
      <div class="bar xp xpbar"><i style="width:${pr}%"></i></div><div class="small"><span>${tt('Уровень', 'Узровень', `Úroveň`, `Level`)} ${L0}</span><span>${S.xp - a} / ${b - a} XP</span></div></div><span class="chev">›</span></div>
    ${routeCard}
    <div class="sect">${tt('Карта навыков', 'Карта навыкаў', `Mapa dovedností`, `Skills map`)}</div>
    ${r.finished ? `<div class="rs" style="margin:-4px 2px 8px">${tt('Хочется ещё? Выбери навык.', 'Хочацца яшчэ? Абяры навык.', `Chceš ještě? Vyber si dovednost.`, `Want more? Pick a skill.`)}</div>` : ''}
    <div class="skgrid">${cards}</div></div>` + tabs('home');
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
    <div class="hero">${mascot()}<div class="bubble">${tt('Зарабатывай монеты на занятиях и открывай новых друзей и наряды!', 'Зарабляй манеты на занятках і адкрывай новых сяброў і ўборы!', `Získávej mince při cvičení a odemykej nové kamarády a oblečení!`, `Earn coins while practising and unlock new friends and outfits!`)}</div></div>
    <div class="sect">${tt('Друзья', 'Сябры', `Kamarádi`, `Friends`)}</div><div class="grid">${PETS.map(p => card(p, 'pet')).join('')}</div>
    <div class="sect">${tt('Шляпы', 'Галаўныя ўборы', `Klobouky`, `Hats`)}</div><div class="grid">${HATS.map(h => card(h, 'hat')).join('')}</div></div>` + tabs('shop');
}

/* ---------- награды ---------- */
function rAwards() {
  const got = ACH.filter(a => S.ach[a.id]).length, L0 = lvl(S.xp);
  root.innerHTML = topBar() + `<div class="page"><div class="h1">${tt('Награды', 'Узнагароды', `Odměny`, `Awards`)}</div>
    <div class="prof tap" data-a="profile" role="button">${mascot('')}<div><div class="nm">${esc(S.name)}</div><div class="lv">${tt('Уровень', 'Узровень', `Úroveň`, `Level`)} ${L0} · ${S.xp} XP</div></div><span class="chev">›</span></div>
    <div class="stats"><div><b>${totalStars(S)} ⭐</b>${tt('звёзд собрано', 'зорак сабрана', `získaných hvězd`, `stars collected`)}</div><div><b>${S.stat.correct}</b>${tt('верных ответов', 'правільных адказаў', `správných odpovědí`, `correct answers`)}</div>
      <div><b>${S.stat.lessons}</b>${tt('занятий пройдено', 'заняткаў пройдзена', `dokončených tréninků`, `sessions completed`)}</div><div><b>${daysTotal(S)} 🔥</b>${tt('дней занятий', 'дзён заняткаў', `dnů cvičení`, `days practised`)}</div></div>
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

/* ---------- занятие ---------- */
function startSession(skill, opts = {}) {
  document.querySelectorAll('.confetti').forEach(e => e.remove());
  if (L) clearTimeout(L.timer);
  const lv = S.skills[skill].lvl, n = opts.n || QPL;
  const qs = buildSet(skillPool(skill, lv), lv, n);
  L = { skill, route: !!opts.route, queue: qs.slice(), total: qs.length, resolved: 0, added: 0, firstOK: 0, counted: 0, mistakes: 0, combo: 0, bestCombo: 0,
    answered: false, ok: false, sel: null, input: '', hint: false, studied: false, sec: 0, lastT: Date.now(), timer: null };
  R = 'lesson'; render();
}
function tickTime() { if (!L) return; const now = Date.now(); L.sec += Math.min(45, (now - L.lastT) / 1000); L.lastT = now; }   // время без простоя (> 45 с не считаем)

const plain = h => String(h).replace(/<[^>]*>/g, '');
const qTag = q => { const k = SK[q.skill]; return `<span class="tag" style="--c:${k.color}">${k.icon} ${P(k.name)}</span>`; };
const qHTML = q => `${qTag(q)}<div class="qtext">${q.text}</div>${q.visual ? `<div class="visual">${q.visual}</div>` : ''}`;
function lHead() {
  const prog = Math.round(L.resolved / (L.total + L.added) * 100), r = S.route;
  const right = L.route && r ? `${Math.min(r.done.length + 1, r.skills.length)}/${r.skills.length}` : SK[L.skill].icon;
  return `<div class="lhead"><button class="x" data-a="quit">✕</button><div class="bar"><i style="width:${prog}%"></i></div><div class="hp">${right}</div></div>`;
}
/* экран «запомни»: показываем материал на несколько секунд, потом прячем (память) */
function rStudy(q) {
  clearTimeout(L.timer);
  const secs = q.study.secs;
  root.innerHTML = `<div class="lesson">${lHead()}<div class="qwrap">${qTag(q)}<div class="qtext">${q.study.text}</div>
    <div class="visual studyv">${q.study.html}</div><div class="cd"><i style="animation-duration:${secs}s"></i></div></div>
    <div class="lfoot"><button class="btn grn" data-a="ready">${tt('Готов', 'Гатова', `Hotovo`, `Ready`)}</button></div></div>`;
  L.timer = setTimeout(() => { if (L && L.queue[0] === q && !L.studied && !L.answered) { L.studied = true; rLesson(); } }, secs * 1000);
}
function rLesson() {
  const q = L.queue[0];
  if (q.study && !L.studied && !L.answered) return rStudy(q);
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
  root.innerHTML = `<div class="lesson">${lHead()}<div class="qwrap">${qHTML(q)}${L.hint ? `<div class="hintbox">💡 ${esc(q.hint)}</div>` : ''}${ans}</div>${foot}</div>`;
}
function check() {
  const q = L.queue[0]; if (L.answered) return;
  tickTime();
  let ok;
  if (q.type === 'choice') ok = q.choices[L.sel].v === q.answer; else ok = parseInt(L.input, 10) === q.answer;
  L.answered = true; L.ok = ok;
  (S.recent = S.recent || []).push(sigOf(q)); if (S.recent.length > 150) S.recent.shift();
  if (!q.retry) {   // для адаптивной сложности и отчёта учитывается только первая попытка
    L.counted++; if (ok) L.firstOK++; else L.mistakes++;
    const ch = Skills.recordResult(S.skills[L.skill], ok);
    Skills.addHist(S.hist, today(), { skill: L.skill, ok: ok ? 1 : 0, total: 1 });
    if (ch === 'up') toast(tt(`🚀 Навык «${P(SK[L.skill].name)}»: уровень ${S.skills[L.skill].lvl}!`, `🚀 Навык «${P(SK[L.skill].name)}»: узровень ${S.skills[L.skill].lvl}!`, `🚀 Dovednost „${P(SK[L.skill].name)}“: úroveň ${S.skills[L.skill].lvl}!`, `🚀 Skill "${P(SK[L.skill].name)}": level ${S.skills[L.skill].lvl}!`));
  }
  if (ok) { L.combo++; L.bestCombo = Math.max(L.bestCombo, L.combo); L.resolved++; S.stat.correct++; sfx.ok(); }
  else {
    L.combo = 0; sfx.no();   // ошибка ничего не отнимает: ни сердечек, ни звёзд за прошлое
    if (!q.retry) { const g = GENS.find(x => x.id === q.gid), nq = (freshQ(g, q.d, new Set([sigOf(q)])) || { q: makeQ(g, q.d) }).q; nq.retry = true; L.queue.push(nq); L.added++; }
    else L.resolved++;   // повторный промах — засчитываем как пройденный, чтобы не зациклиться
  }
  save(); rLesson();
  if (!ok) { const el = $('.fb') || root; el.classList.add('shake'); }
}
function next() {
  clearTimeout(L.timer); tickTime();
  L.queue.shift(); L.answered = false; L.sel = null; L.input = ''; L.hint = false; L.studied = false;
  if (!L.queue.length) return finish();
  rLesson();
}

/* ---------- завершение занятия ---------- */
function finish() {
  clearTimeout(L.timer); tickTime();
  const events = [], lvBefore = lvl(S.xp), total = L.counted, ok = L.firstOK, stars = Skills.starsFor(ok, total), perfect = L.mistakes === 0;
  let xp = 5 * ok + 5 + (perfect ? 10 : 0), coins = ok + stars * 2, routeDone = false;
  S.starsTotal += stars; S.stat.lessons++; if (perfect) S.stat.perfect++; S.stat.bestCombo = Math.max(S.stat.bestCombo, L.bestCombo);
  Skills.addHist(S.hist, today(), { sec: L.sec, ses: 1 }); Skills.pruneHist(S.hist, today());
  if (L.route && S.route) {
    const r = S.route; if (!r.done.includes(L.skill)) r.done.push(L.skill);
    r.tot = r.tot || { xp: 0, coins: 0, ok: 0, total: 0, stars: 0 };
    if (r.done.length >= r.skills.length && !r.finished) {
      r.finished = true; routeDone = true; S.stat.routes++; xp += 20; coins += 10;
      events.push({ i: '🗺️', t: tt('Маршрут пройден! +20 XP, +10 🪙', 'Маршрут пройдзены! +20 XP, +10 🪙', `Trasa splněna! +20 XP, +10 🪙`, `Route complete! +20 XP, +10 🪙`) });
    }
    r.tot.xp += xp; r.tot.coins += coins; r.tot.ok += ok; r.tot.total += total; r.tot.stars += stars;
  }
  S.xp += xp; S.coins += coins;
  const lvAfter = lvl(S.xp);
  if (lvAfter > lvBefore) { S.coins += 10 * (lvAfter - lvBefore); events.push({ i: '⬆️', t: tt(`Новый уровень: ${lvAfter}! +${10 * (lvAfter - lvBefore)} 🪙`, `Новы ўзровень: ${lvAfter}! +${10 * (lvAfter - lvBefore)} 🪙`, `Nová úroveň: ${lvAfter}! +${10 * (lvAfter - lvBefore)} 🪙`, `New level: ${lvAfter}! +${10 * (lvAfter - lvBefore)} 🪙`) }); }
  ACH.forEach(a => { if (!S.ach[a.id] && a.ok(S)) { S.ach[a.id] = today(); S.coins += 10; events.push({ i: a.i, t: tt(`Достижение «${P(a.t)}»! +10 🪙`, `Дасягненне «${P(a.t)}»! +10 🪙`, `Úspěch „${P(a.t)}“! +10 🪙`, `Achievement "${P(a.t)}"! +10 🪙`) }); } });
  save(); sfx.win(); confetti(routeDone ? 70 : 44);
  const nx = S.route && L.route ? S.route.skills.find(k => !S.route.done.includes(k)) : null;
  RES = { skill: L.skill, stars, xp, coins, events, right: ok, total, route: L.route, routeDone, next: nx, tot: S.route && S.route.tot };
  R = 'result'; render();
}
function rResult() {
  const r = RES, k = SK[r.skill];
  if (r.routeDone) {
    const t = r.tot;
    root.innerHTML = `<div class="result"><div style="font-size:70px">🌙</div><h1>${tt('На сегодня всё!', 'На сёння ўсё!', `Pro dnešek hotovo!`, `That's all for today!`)}</h1>
      <div class="sub">${tt('Отличная работа! Завтра — новый маршрут.', 'Выдатная праца! Заўтра — новы маршрут.', `Skvělá práce! Zítra tě čeká nová trasa.`, `Great work! A new route is waiting tomorrow.`)}</div>
      <div class="mascot big" style="margin:14px auto"><span class="hat">${S.hat}</span><span class="pet">${S.pet}</span></div>
      <div class="rew"><div><b>+${t.xp}</b>XP</div><div><b>+${t.coins}</b>${tt('монет', 'манет', `mincí`, `coins`)} 🪙</div><div><b>${t.ok}/${t.total}</b>${tt('верно', 'правільна', `správně`, `correct`)} ✓</div></div>
      ${r.events.map(e => `<div class="evt">${e.i} ${e.t}</div>`).join('')}
      <div class="acts"><button class="btn grn" data-a="home">${tt('На главный экран', 'На галоўны экран', `Na hlavní obrazovku`, `Home`)}</button></div></div>`;
    return;
  }
  const title = r.stars === 3 ? tt('Идеально!', 'Ідэальна!', `Perfektní!`, `Perfect!`) : r.route ? tt('Мини-игра пройдена!', 'Міні-гульня пройдзена!', `Minihra splněna!`, `Mini-game complete!`) : tt('Занятие завершено!', 'Занятак завершаны!', `Trénink dokončen!`, `Session complete!`);
  root.innerHTML = `<div class="result"><div style="font-size:70px">${r.stars === 3 ? '🏆' : '🎉'}</div><h1>${title}</h1>
    <div class="sub">${tt(`Верно с первого раза: ${r.right} из ${r.total}`, `Правільна з першага разу: ${r.right} з ${r.total}`, `Správně na první pokus: ${r.right} z ${r.total}`, `Right first time: ${r.right} of ${r.total}`)}</div>
    <div class="stars">${[1, 2, 3].map(i => `<span class="${i <= r.stars ? 'on' : ''}">⭐</span>`).join('')}</div>
    <div class="rew"><div><b>+${r.xp}</b>XP</div><div><b>+${r.coins}</b>${tt('монет', 'манет', `mincí`, `coins`)} 🪙</div><div><b>${k.icon} ${S.skills[r.skill].lvl}</b>${tt('уровень навыка', 'узровень навыку', `úroveň dovednosti`, `skill level`)}</div></div>
    ${r.events.map(e => `<div class="evt">${e.i} ${e.t}</div>`).join('')}
    <div class="acts">${r.route && r.next ? `<button class="btn grn" data-a="route">${tt('Дальше', 'Далей', `Dál`, `Next`)}: ${SK[r.next].icon} ${P(SK[r.next].name)} ▶</button>` : ''}
      <button class="btn ${r.route && r.next ? 'ghost' : 'grn'}" data-a="home">${tt('На главный экран', 'На галоўны экран', `Na hlavní obrazovku`, `Home`)}</button>
      ${r.route ? '' : `<button class="btn ghost" data-a="again">${tt('Ещё раз', 'Яшчэ раз', `Ještě jednou`, `Again`)}</button>`}</div></div>`;
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
   XP, звёзды, достижения, питомцы, история занятий — по максимуму/объединению; монеты и маршрут дня — от более свежей копии. */
function mergeStates(a, b) {
  a = Object.assign(defState(), a); b = Object.assign(defState(), b);
  if (isFresh(b)) return a;
  if (isFresh(a)) return Object.assign(clone(b), { lang: a.lang, sound: a.sound });
  const nw = (a.ts || 0) >= (b.ts || 0) ? a : b, ol = nw === a ? b : a, m = clone(nw);
  const union = (x, y) => [...new Set([...(x || []), ...(y || [])])];
  m.name = nw.name || ol.name; m.xp = Math.max(a.xp, b.xp);
  m.pets = union(a.pets, b.pets); m.hats = union(a.hats, b.hats);
  m.pet = m.pets.includes(nw.pet) ? nw.pet : (m.pets[0] || ''); m.hat = (!nw.hat || m.hats.includes(nw.hat)) ? nw.hat : '';
  m.ach = Object.assign({}, ol.ach, nw.ach);
  m.stat = {}; for (const k of new Set([...Object.keys(a.stat), ...Object.keys(b.stat)])) m.stat[k] = Math.max(a.stat[k] || 0, b.stat[k] || 0);
  m.starsTotal = Math.max(a.starsTotal || 0, b.starsTotal || 0);
  m.skills = Skills.mergeSkills(a.skills, b.skills); m.hist = Skills.mergeHist(a.hist, b.hist);
  m.route = (a.route && b.route && a.route.date === b.route.date) ? (a.route.done.length >= b.route.done.length ? a.route : b.route) : nw.route;
  m.recent = union(ol.recent, nw.recent).slice(-150);
  for (const k of [...OLD_KEYS, 'done']) delete m[k];
  m.lang = a.lang; m.sound = a.sound; m.ts = Math.max(a.ts || 0, b.ts || 0);
  return clone(m);
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
    S.name = v; S.pet = ob.pet; S.pets = [ob.pet]; save(); R = 'home'; render();
  },
  goto(el) { R = el.dataset.t; phrase = newPhrase(); render(); },
  home() { R = 'home'; phrase = newPhrase(); render(); },
  route() {
    sfx.tap(); const r = Skills.ensureRoute(S, today(), availSkills()), nx = r.skills.find(k => !r.done.includes(k));
    if (nx) startSession(nx, { n: ROUTE_QPL, route: true });
  },
  skill(el) { sfx.tap(); startSession(el.dataset.s); },
  again() { startSession(RES.skill); },
  pick(el) { if (L.answered) return; L.sel = +el.dataset.i; sfx.tap(); rLesson(); },
  key(el) { press(el.dataset.k); },
  check() { const b = $('[data-a=check]'); if (b && !b.disabled) check(); },
  next() { next(); },
  ready() { if (L && !L.studied) { clearTimeout(L.timer); L.studied = true; rLesson(); } },
  hint() {
    if (L.hint) return;
    if (S.coins < HINT_PRICE) { toast(tt(`Нужно ${HINT_PRICE} 🪙 для подсказки`, `Трэба ${HINT_PRICE} 🪙 для падказкі`, `Na nápovědu potřebuješ ${HINT_PRICE} 🪙`, `You need ${HINT_PRICE} 🪙 for a hint`)); return; }
    S.coins -= HINT_PRICE; L.hint = true; save(); sfx.coin(); rLesson();
  },
  quit() {
    modal({ icon: '🤔', title: tt('Выйти из занятия?', 'Выйсці з занятку?', `Ukončit trénink?`, `Leave the session?`), text: tt('Ответы уже сохранены, а это занятие можно начать заново.', 'Адказы ўжо захаваны, а гэты занятак можна пачаць зноў.', `Odpovědi jsou už uložené, trénink můžeš začít znovu.`, `Your answers are already saved – you can start this session again.`),
      btns: [{ t: tt('Продолжить', 'Працягнуць', `Pokračovat`, `Continue`), c: 'grn', f: () => {} },
        { t: tt('Выйти', 'Выйсці', `Odejít`, `Leave`), c: 'ghost', f: () => { clearTimeout(L.timer); tickTime(); Skills.addHist(S.hist, today(), { sec: L.sec }); save(); R = 'home'; render(); } }] });
  },
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
  weekinfo() {
    const n = weekCount(), t0 = today(), names = Array.from({ length: 7 }, (_, i) => { const d = Skills.parseDay(Skills.addDays(t0, i - 6)); let w = ''; try { w = new Intl.DateTimeFormat(getLang(), { weekday: 'short' }).format(d); } catch (e) { w = String(d.getDate()); } return [w, (S.hist[Skills.addDays(t0, i - 6)] || {}).ses > 0]; });
    modal({ icon: '🔥', title: tt(`Дней занятий за неделю: ${n} из 7`, `Дзён заняткаў за тыдзень: ${n} з 7`, `Dnů cvičení za týden: ${n} ze 7`, `Days practised this week: ${n} of 7`),
      text: `<div class="wk">${names.map(([w, on]) => `<span class="${on ? 'on' : ''}"><i>${on ? '🔥' : '·'}</i>${w}</span>`).join('')}</div>` + tt('Пропущенный день ничего не сбрасывает — просто возвращайся, когда захочется.', 'Прапушчаны дзень нічога не скідае — проста вяртайся, калі захочацца.', `Vynechaný den nic nenuluje – prostě se vrať, až budeš chtít.`, `A missed day resets nothing – just come back whenever you like.`),
      btns: [{ t: tt('Понятно', 'Зразумела', `Jasné`, `Got it`), c: 'ghost', f: () => {} }] });
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
  if (q.study && !L.studied) { if (e.key === 'Enter') A.ready(); return; }
  if (e.key === 'Enter') { if (L.answered) next(); else A.check(); }
  else if (!L.answered && q.type === 'num') { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('b'); }
  else if (!L.answered && q.type === 'choice' && /^[1-4]$/.test(e.key) && q.choices[+e.key - 1]) { L.sel = +e.key - 1; rLesson(); }
});

/* ======================== Запуск ======================== */
load(); phrase = newPhrase(); render();
if (cloudFlag()) fbInit().catch(() => {});
try { if (window.top !== window.self) document.documentElement.classList.add('embed'); } catch (e) { document.documentElement.classList.add('embed'); }
const up = $('#totop');
up.setAttribute('aria-label', tt('Наверх', 'Угару', `Nahoru`, `Up`));
up.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
window.addEventListener('scroll', () => { up.hidden = !(window.scrollY > 400 && ['home', 'shop', 'awards'].includes(R)); }, { passive: true });
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
window.__umniki = { GENS, S: () => S, L: () => L, A, buildSet, skillPool, sigOf, mergeStates, defState, clone, SK, availSkills };
})();
