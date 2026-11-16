'use strict';
(() => {
const { GENS, LANGS, rnd, pick, shuffle, esc, t: tt, setLang, getLang, generate } = window.Gens;
const BUILD = 'v20';
const P = pair => pair[LANGS.indexOf(getLang())];
const LANG_NAMES = { be: 'Беларуская', ru: 'Русский', cs: 'Čeština', en: 'English' };
const langOk = l => (LANGS.includes(l) ? l : 'ru');
const plural = (n, f) => { const a = n % 100, b = n % 10; return a > 10 && a < 20 ? f[2] : b === 1 ? f[0] : b > 1 && b < 5 ? f[1] : f[2]; };
const Skills = window.Skills, Chess = window.Chess;
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
  { id: 'sk3', i: '📈', t: ['Растём', 'Расцём', 'Rosteme', 'Growing'], d: ['Подними любой навык до 3 уровня', 'Дабіся 3 узроўню ў любым навыку', 'Zvedni jakoukoli dovednost na úroveň 3', 'Raise any skill to level 3'], ok: s => SKILLS.some(k => s.skills[k].lvl >= 3) },
  { id: 'allsk3', i: '🎖️', t: ['Все навыки', 'Усе навыкі', 'Všechny dovednosti', 'All-rounder'], d: ['Все доступные навыки не ниже 3 уровня', 'Усе даступныя навыкі не ніжэй за 3 узровень', 'Všechny dostupné dovednosti alespoň na úrovni 3', 'All available skills at level 3 or higher'], ok: s => availSkills().every(k => s.skills[k].lvl >= 3) },
  { id: 'chess1', i: '♟️', t: ['Первые ходы', 'Першыя хады', 'První tahy', 'First moves'], d: ['Пройди первый шахматный урок', 'Прайдзі першы шахматны ўрок', 'Dokonči první šachovou lekci', 'Finish your first chess lesson'], ok: s => Object.keys(s.chessLessons || {}).length >= 1 },
  { id: 'chessall', i: '🏰', t: ['Юный шахматист', 'Юны шахматыст', 'Mladý šachista', 'Young chess player'], d: ['Пройди все 9 шахматных уроков', 'Прайдзі ўсе 9 шахматных урокаў', 'Dokonči všech 9 šachových lekcí', 'Finish all 9 chess lessons'], ok: s => Object.keys(s.chessLessons || {}).length >= 9 },
  { id: 'route1', i: '🗺️', t: ['Первый маршрут', 'Першы маршрут', 'První trasa', 'First route'], d: ['Пройди дневной маршрут', 'Прайдзі дзённы маршрут', 'Dokonči denní trasu', 'Finish a daily route'], ok: s => s.stat.routes >= 1 },
  { id: 'route7', i: '🧭', t: ['Путешественник', 'Падарожнік', 'Cestovatel', 'Explorer'], d: ['Пройди 7 дневных маршрутов', 'Прайдзі 7 дзённых маршрутаў', 'Dokonči 7 denních tras', 'Finish 7 daily routes'], ok: s => s.stat.routes >= 7 },
];

/* ======================== Состояние ======================== */
const KEY = 'umniki.v1';
const defState = () => ({ id: '', age: 0, name: '', pet: '', pets: [], hat: '', hats: [], coins: 0, xp: 0, ach: {},
  stat: { lessons: 0, correct: 0, perfect: 0, bestCombo: 0, routes: 0 }, starsTotal: 0, chessLessons: {}, words: {}, speak: 'tap', speakSet: false, parent: Skills.newParent(), bil: Skills.newBil(), skills: Skills.newSkills(), hist: {}, route: null,
  sound: true, recent: [], ts: 0, lang: (/^(be|cs|en|ru)/i.exec(navigator.language || '') || ['ru'])[0].toLowerCase() });
let S;
const OLD_KEYS = ['hearts', 'heartAt', 'streak', 'bestStreak', 'lastDay', 'todayDate', 'todayXp', 'goalPaid'];
const speakDefault = age => (Skills.isYoungAge(age) ? 'auto' : 'tap');   // малыши 5–7: задания читаются сами
const KEY2 = 'umniki.v2', MAX_KIDS = 3;
let FAM = { kids: [], parent: null, consent: { seen: '', cloud: '' } };   // семья: до 3 детских профилей и общий родительский PIN/лимит
const newId = () => 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
function norm(raw) {   // приводит сохранённое состояние ребёнка к актуальному виду
  const s = Object.assign(defState(), raw || {});
  s.stat = Object.assign(defState().stat, s.stat);
  if (s.starsTotal === undefined || (raw && raw.done && !raw.starsTotal)) {   // перенос звёзд из старых «уроков»
    s.starsTotal = Math.max(s.starsTotal || 0, Object.values((raw && raw.done) || {}).reduce((a, arr) => a + (arr || []).reduce((x, y) => x + (y || 0), 0), 0)); }
  if (!s.chessLessons || typeof s.chessLessons !== 'object') s.chessLessons = {};
  if (!s.words || typeof s.words !== 'object') s.words = {};
  s.bil = Skills.fixBil(s.bil); s.skills = Skills.fixSkills(s.skills); if (!s.hist || typeof s.hist !== 'object') s.hist = {};
  for (const k of [...OLD_KEYS, 'done', 'parent']) delete s[k];
  s.lang = langOk(s.lang); s.age = Skills.AGES.includes(s.age | 0) ? s.age | 0 : 0;
  if (!['off', 'tap', 'auto'].includes(s.speak)) s.speak = 'tap'; if (!s.speakSet) s.speak = speakDefault(s.age);
  return s;
}
const applyLang = () => { setLang(S.lang); document.documentElement.lang = S.lang; document.title = tt('Умники', 'Разумнікі', `Chytráci`, `Smart Kids`); };
function useKid(id) {
  S = FAM.kids.find(k => k.id === id) || FAM.kids[0] || Object.assign(defState(), { skills: Skills.newSkills() });
  S.parent = FAM.parent; applyLang();
}
function setFam(raw) {
  FAM = { kids: [], parent: Skills.fixParent(raw && raw.parent), consent: Object.assign({ seen: '', cloud: '' }, (raw && raw.consent) || {}) };
  const ids = new Set();
  for (const k of (raw && raw.kids) || []) { const x = norm(k); if (!x.id || ids.has(x.id)) x.id = newId(); ids.add(x.id); FAM.kids.push(x); }
  useKid(raw && raw.active);
}
const famJSON = (cloud) => ({ v: 2, active: S.id, parent: clone(FAM.parent), ...(cloud ? {} : { consent: clone(FAM.consent) }), kids: FAM.kids.map(k => { const c = Object.assign({}, k); delete c.parent; return c; }) });
function load() {
  let v2 = null, v1 = null;
  try { v2 = JSON.parse(localStorage.getItem(KEY2)); } catch (e) {}
  if (!v2 || !Array.isArray(v2.kids)) {   // первый запуск версии с профилями: переносим прежнего единственного ребёнка
    try { v1 = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    v2 = v1 && v1.name ? { kids: [Object.assign({}, v1, { id: 'k1' })], parent: v1.parent, active: 'k1' } : null;
  }
  setFam(v2);
}
function save(o) { S.ts = Date.now(); try { localStorage.setItem(KEY2, JSON.stringify(famJSON())); } catch (e) {} if (!(o && o.nopush)) pushSoon(); }

const today = () => Skills.dayStr(new Date());
const lvl = xp => Math.floor(Math.sqrt(xp / 30)) + 1;
const lvlStart = n => 30 * (n - 1) ** 2;
const totalStars = s => s.starsTotal || 0;
const daysTotal = s => Skills.daysPlayedTotal(s.hist);
const availSkills = () => SKILLS.filter(k => GENS.some(g => Skills.SKILL_OF[g.id] === k));
const weekCount = () => Skills.daysPlayedIn(S.hist, today(), 7);
const pad = n => String(n).padStart(2, '0');
/* родительская зона и лимит времени (F10) */
let PN = null, parentOK = false, pinFails = 0, pinLockUntil = 0, pinResetPending = false;
const bilOn = () => Skills.bilActive(S.bil, S.lang);
const otherLang = q => (q.lang === S.lang ? S.bil.second : S.lang);
const limitLeft = () => Skills.limitLeft(S.parent, S.hist, today(), L && R === 'lesson' ? L.sec : 0);
const limitHit = () => limitLeft() <= 0;
const minsLeft = () => Math.max(1, Math.ceil(limitLeft() / 60));

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
/* Каждое задание создаётся с «зерном» и языком: с тем же зерном его можно воспроизвести на другом языке (кнопка «не понял») */
function makeQ(g, d, lang) {
  const seed = (Math.random() * 4294967296) >>> 0, lg = lang || S.lang, q = generate(g, d, seed, lg);
  q.topic = g.topic; q.skill = Skills.SKILL_OF[g.id]; q.gid = g.id; q.d = d; q.seed = seed; q.lang = lg; return q;
}
const sigOf = q => q.gid + '|' + (q.key || q.text + (q.visual || ''));
/* Новая задача из генератора g, которой ещё не было в этом занятии и (по возможности) в недавней истории.
   Если свежей не нашлось — возвращает ту, что видели давнее всего. */
function freshQ(g, d, seen, lang) {
  const recent = S.recent || []; let best = null;
  for (let t = 0; t < 25; t++) {
    const q = makeQ(g, d, lang), s = sigOf(q);
    if (seen.has(s)) continue;
    const age = recent.lastIndexOf(s);          // -1 = не встречалась; меньше индекс = давнее
    if (age < 0) return { q, fresh: true };
    if (!best || age < best.age) best = { q, age, fresh: false };
  }
  return best;
}
function buildSet(pool, d, n, langs) {
  const out = [], seen = new Set(); let bag = [], last = null;
  for (let i = 0; i < n; i++) {
    if (!bag.length) bag = shuffle(pool);
    let k = bag.findIndex(x => x !== last); if (k < 0) k = 0;
    const primary = bag.splice(k, 1)[0];
    // сначала пробуем «очередной» тип задач, затем остальные — пока не найдётся свежий вопрос
    const cands = [primary, ...shuffle(pool.filter(x => x !== primary && x !== last))];
    let chosen = null, stale = null;
    for (const g of cands) {
      const r = freshQ(g, Math.max((i < 2 && d > 1 && n >= 6) ? d - 1 : d, g.minD), seen, langs ? langs[i] : undefined);
      if (!r) continue;
      if (r.fresh) { chosen = r.q; break; }
      if (!stale || r.age < stale.age) stale = r;
    }
    const q = chosen || (stale ? stale.q : makeQ(primary, d, langs ? langs[i] : undefined));
    last = GENS.find(x => x.id === q.gid); seen.add(sigOf(q)); out.push(q);
  }
  return out;
}
const skillPool = (skill, lv) => { const all = GENS.filter(g => Skills.SKILL_OF[g.id] === skill && g.minD <= lv), keep = new Set(Skills.forAge(all.map(g => g.id), S.age)); return all.filter(g => keep.has(g.id)); };

/* ======================== Маршрутизация и отрисовка ======================== */
let R = 'home', L = null, RES = null;
const root = $('#app');
/* персонаж: эмодзи-заглушка, которую avatar.js заменяет на 3D-картинку (o.live — оживший, o.pose — idle/happy/sad/wave) */
const mascot = (cls = '', bounce = false, k = S, o = {}) => `<div class="mascot avatar ${cls}${bounce ? ' bounce' : ''}" data-av="${k.pet}" data-hat="${k.hat || ''}"${o.live ? ' data-live="1"' : ''}${o.pose ? ` data-pose="${o.pose}"` : ''}><span class="hat">${k.hat || ''}</span><span class="pet">${k.pet}</span></div>`;
const petBtn = e => `<span class="avatar" data-av="${e}"><span class="pet">${e}</span></span>`;

function topBar() {
  const multi = FAM.kids.length > 1;
  return `<div class="top">
    <button class="who-btn" data-a="whoami" aria-label="${multi ? tt('Сменить профиль', 'Змяніць профіль', `Změnit profil`, `Switch profile`) : tt('Профиль', 'Профіль', `Profil`, `Profile`)}">${mascot('sm', false, S)}</button>
    <button class="pill fire" data-a="weekinfo">🔥 <b>${weekCount()}</b><small>/7</small></button>
    <button class="pill lv" data-a="goto" data-t="awards">⭐ <b>${lvl(S.xp)}</b></button>
    <button class="pill coin" data-a="goto" data-t="shop">🪙 <b id="coins">${S.coins}</b></button>
    ${multi ? '' : `<button class="who-btn lock" data-a="parentlock" data-back="home" aria-label="${tt('Родительская зона', 'Бацькоўская зона', `Rodičovská zóna`, `Parents’ zone`)}">🔒</button>`}
  </div>`;
}
const tabs = on => `<nav class="tabs">${[['home', '🏠', tt('Учёба', 'Навучанне', `Učení`, `Learn`)], ['shop', '🎁', tt('Магазин', 'Крама', `Obchod`, `Shop`)], ['awards', '🏆', tt('Награды', 'Узнагароды', `Odměny`, `Awards`)]]
  .map(([id, ic, n]) => `<button class="tab${on === id ? ' on' : ''}" data-a="goto" data-t="${id}"><span>${ic}</span>${n}</button>`).join('')}</nav>`;

/* вход нового экрана / нового вопроса: короткий выезд снизу (при «уменьшить движение» CSS отключает анимацию) */
const enter = el => { if (!el) return; el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); };
let prevR = null;
function render() {
  if (!S.name) R = 'onboard';
  if (!['parent', 'report', 'kid', 'gloss', 'privacy'].includes(R)) parentOK = false;
  if ((R === 'parent' || R === 'report') && !parentOK) { PN = { mode: Skills.hasPin(S.parent) ? 'enter' : 'set', buf: '', first: '', next: R, back: 'profile', err: '' }; R = 'pin'; }
  if (R !== 'lesson' && window.Speech) Speech.stop();
  if (R === 'kid' && !parentOK) R = 'profile';
  if (R === 'profile' || R === 'onboard') prefetchFb();
  ({ onboard: rOnboard, home: rHome, shop: rShop, awards: rAwards, profile: rProfile, report: rReport, chess: rChess, pin: rPin, parent: rParent, who: rWho, kid: rKid, gloss: rGloss, privacy: rPrivacy, timeup: rTimeup, lesson: rLesson, result: rResult })[R]();
  window.scrollTo(0, 0); renderBanner();
  if (R !== prevR) enter(root.querySelector('.page,.lesson,.result,.onb,.pinpage')); prevR = R;
}

/* ---------- онбординг ---------- */
let ob = { pet: '🐱', age: 0 };
const ageTxt = n => `${n} ${tt('лет', 'гадоў', `let`, `y.o.`)}`;
const ageChips = (cur, act) => `<div class="chips" style="justify-content:center">${Skills.AGES.map(n => `<button class="chip2${cur === n ? ' on' : ''}" data-a="${act}" data-n="${n}">${n}</button>`).join('')}</div>`;
function rOnboard() {
  root.innerHTML = `<div class="onb">${mascot('big', false, { pet: ob.pet, hat: '🎓' }, { live: 1, pose: 'wave' })}<h1>${tt('Умники', 'Разумнікі', `Chytráci`, `Smart Kids`)}</h1>
    <div class="pets lang">${Object.entries(LANG_NAMES).map(([c, n]) => `<button class="${S.lang === c ? 'on' : ''}" data-a="lang" data-l="${c}">${n}</button>`).join('')}</div>
    <p>${tt('Математика и логика в игре! Как тебя зовут?', 'Матэматыка і логіка ў гульні! Як цябе клічуць?', `Matematika a logika hrou! Jak se jmenuješ?`, `Maths and logic as a game! What is your name?`)}</p>
    <input id="nm" aria-label="${tt('Твоё имя', 'Тваё імя', `Tvoje jméno`, `Your name`)}" maxlength="14" placeholder="${tt('Твоё имя', 'Тваё імя', `Tvoje jméno`, `Your name`)}" autocomplete="off" value="${esc(S.name)}">
    <p>${tt('Сколько тебе лет?', 'Колькі табе гадоў?', `Kolik ti je let?`, `How old are you?`)}</p>${ageChips(ob.age, 'obage')}
    <p>${tt('Выбери себе друга:', 'Абяры сабе сябра:', `Vyber si kamaráda:`, `Choose a friend:`)}</p>
    <div class="pets">${['🐱', '🐶', '🐰'].map(e => `<button class="${ob.pet === e ? 'on' : ''}" data-a="obpet" data-e="${e}" aria-label="${e}">${petBtn(e)}</button>`).join('')}</div>
    <button class="btn ghost sm" data-a="login">🔑 ${tt('У меня уже есть профиль — войти через Google', 'У мяне ўжо ёсць профіль — увайсці праз Google', `Už mám profil – přihlásit se přes Google`, `I already have a profile – sign in with Google`)}</button>
    <div class="rs" style="text-align:center">${tt('Родителям: PIN и лимит времени — в профиле, «Родительская зона».', 'Бацькам: PIN і ліміт часу — у профілі, «Бацькоўская зона».', `Rodičům: PIN a limit času najdete v profilu, „Rodičovská zóna“.`, `For parents: PIN and time limit are in the profile, “Parents’ zone”.`)}</div>
    <div style="margin-top:auto"><button class="btn grn" data-a="obstart">${tt('Поехали!', 'Паехалі!', `Jdeme na to!`, `Let's go!`)}</button></div></div>`;
}

/* ---------- словарик терминов (F13) ---------- */
let GB = 'profile';
const glossList = q => {
  const lq = q.trim().toLowerCase(), terms = Glossary.TERMS.filter(t => !lq || Glossary.LANGS.some(l => t[l].toLowerCase().includes(lq)));
  if (!terms.length) return `<div class="rs" style="text-align:center;margin:20px">${tt('Такого слова нет', 'Такога слова няма', `Takové slovo tu není`, `No such word`)}</div>`;
  return Object.keys(Glossary.CATS).map(c => { const ts = terms.filter(t => t.cat === c); if (!ts.length) return '';
    return `<div class="sect">${P(Glossary.CATS[c])}</div>` + ts.map(t => `<div class="gl"><b>${esc(t[S.lang])}</b>${Glossary.LANGS.filter(l => l !== S.lang).map(l => `<span><i>${l.toUpperCase()}</i>${esc(t[l])}</span>`).join('')}</div>`).join(''); }).join('');
};
function rGloss() {
  root.innerHTML = topBar() + `<div class="page"><button class="back" data-a="glossback">← ${tt('Назад', 'Назад', `Zpět`, `Back`)}</button>
    <div class="h1">📖 ${tt('Словарик', 'Слоўнік', `Slovníček`, `Glossary`)}</div>
    <div class="rs" style="margin:0 2px 8px">${tt('Математические слова на четырёх языках. В задании нажми на слово с точками под ним — увидишь перевод.', 'Матэматычныя словы на чатырох мовах. У задачы націсні на слова з кропкамі пад ім — убачыш пераклад.', `Matematická slova ve čtyřech jazycích. V úloze klepni na slovo s tečkami pod ním – uvidíš překlad.`, `Maths words in four languages. In a task, tap a word with dots under it to see the translation.`)} <b>${Glossary.TERMS.length}</b> ${tt('слов', 'слоў', `slov`, `words`)}.</div>
    <input id="gq" class="kin" aria-label="${tt('Найти слово', 'Знайсці слова', `Najít slovo`, `Find a word`)}" placeholder="🔍 ${tt('Найти слово', 'Знайсці слова', `Najít slovo`, `Find a word`)}" autocomplete="off">
    <div id="gl">${glossList('')}</div></div>` + tabs('');
}

/* ---------- приватность и cookie ---------- */
let PB = 'profile';
const PRIVACY = {
  ru: [['Что мы храним', 'Имя или псевдоним ребёнка, возраст, результаты заданий, награды и настройки. Фамилия, фото, адрес и точная дата рождения не нужны и не запрашиваются.'],
    ['Где', 'По умолчанию — только в памяти браузера на этом устройстве. Облачное сохранение родитель включает по желанию: тогда те же данные хранятся в сервисе Google Firebase (Firestore) в вашем аккаунте Google, доступ к ним только у вас.'],
    ['Реклама и трекеры', 'Нет рекламы, нет аналитики и сторонних трекеров. Единственный внешний сервис — Google Firebase, он подключается только после вашего согласия на вход через Google.'],
    ['Cookie и память браузера', 'Используется только необходимая память браузера (localStorage) для работы игры и кэш для работы без интернета. Рекламных и аналитических cookie нет, поэтому отдельное согласие на них не требуется.'],
    ['Ваши права', 'В «Родительской зоне» → «Данные и приватность»: скачать все данные (файл JSON), удалить их навсегда (на устройстве и в облаке) и отозвать согласие на облако.'],
    ['Дети', 'Профили, облако и удаление данных защищены родительским PIN. Это краткое описание, а не юридический документ.']],
  be: [['Што мы захоўваем', 'Імя або псеўданім дзіцяці, узрост, вынікі заданняў, узнагароды і налады. Прозвішча, фота, адрас і дакладная дата нараджэння не патрэбныя і не запытваюцца.'],
    ['Дзе', 'Па змаўчанні — толькі ў памяці браўзера на гэтай прыладзе. Воблачнае захаванне бацька ўключае па жаданні: тады тыя ж даныя захоўваюцца ў сэрвісе Google Firebase (Firestore) у вашым акаўнце Google, доступ толькі ў вас.'],
    ['Рэклама і трэкеры', 'Няма рэкламы, аналітыкі і староніх трэкераў. Адзіны знешні сэрвіс — Google Firebase, ён падключаецца толькі пасля вашай згоды на ўваход праз Google.'],
    ['Cookie і памяць браўзера', 'Выкарыстоўваецца толькі неабходная памяць браўзера (localStorage) для працы гульні і кэш для працы без інтэрнэту. Рэкламных і аналітычных cookie няма, таму асобная згода на іх не патрэбная.'],
    ['Вашы правы', 'У «Бацькоўскай зоне» → «Даныя і прыватнасць»: спампаваць усе даныя (файл JSON), выдаліць іх назаўжды (на прыладзе і ў воблаку) і адклікаць згоду на воблака.'],
    ['Дзеці', 'Профілі, воблака і выдаленне даных абаронены бацькоўскім PIN. Гэта кароткае апісанне, а не юрыдычны дакумент.']],
  cs: [['Co ukládáme', 'Jméno či přezdívku dítěte, věk, výsledky úloh, odměny a nastavení. Příjmení, fotku, adresu ani přesné datum narození nepotřebujeme a nežádáme.'],
    ['Kde', 'Ve výchozím stavu jen v paměti prohlížeče v tomto zařízení. Ukládání do cloudu zapíná rodič dobrovolně: tytéž údaje se pak ukládají ve službě Google Firebase (Firestore) ve vašem účtu Google a máte k nim přístup jen vy.'],
    ['Reklamy a sledování', 'Žádné reklamy, analytika ani sledovače třetích stran. Jedinou externí službou je Google Firebase, která se připojí až po vašem souhlasu s přihlášením přes Google.'],
    ['Cookies a paměť prohlížeče', 'Používáme jen nezbytnou paměť prohlížeče (localStorage) pro chod hry a mezipaměť pro práci bez internetu. Reklamní ani analytické cookies nepoužíváme, proto se na ně souhlas nevyžaduje.'],
    ['Vaše práva', 'V „Rodičovské zóně“ → „Data a soukromí“: stáhnout všechna data (soubor JSON), trvale je smazat (v zařízení i v cloudu) a odvolat souhlas s cloudem.'],
    ['Děti', 'Profily, cloud a mazání dat chrání rodičovský PIN. Je to stručný popis, nikoli právní dokument.']],
  en: [['What we store', 'The child’s name or nickname, age, task results, rewards and settings. We do not need or ask for a surname, photo, address or exact date of birth.'],
    ['Where', 'By default only in the browser storage on this device. A parent can optionally turn on cloud saving: the same data is then kept in Google Firebase (Firestore) under your Google account, and only you can access it.'],
    ['Ads and trackers', 'No ads, no analytics and no third-party trackers. The only external service is Google Firebase, connected only after you agree to sign in with Google.'],
    ['Cookies and browser storage', 'Only the browser storage necessary to run the game (localStorage) and a cache for offline use are used. There are no advertising or analytics cookies, so no separate consent is needed for them.'],
    ['Your rights', 'In the Parents’ zone → “Data and privacy”: download all data (a JSON file), delete it permanently (on the device and in the cloud) and withdraw consent to the cloud.'],
    ['Children', 'Profiles, the cloud and data deletion are protected by the parent PIN. This is a short summary, not a legal document.']],
};
function rPrivacy() {
  root.innerHTML = topBar() + `<div class="page"><button class="back" data-a="privback">← ${tt('Назад', 'Назад', `Zpět`, `Back`)}</button>
    <div class="h1">🛡 ${tt('Приватность и cookie', 'Прыватнасць і cookie', `Soukromí a cookies`, `Privacy and cookies`)}</div>
    ${PRIVACY[getLang()].map(([h, t]) => `<div class="pv"><b>${h}</b><p>${t}</p></div>`).join('')}</div>` + tabs('');
}
function renderBanner() {
  const old = $('#cb'), show = !FAM.consent.seen && !['lesson', 'result', 'privacy', 'who'].includes(R);
  if (!show) { if (old) old.remove(); return; }
  if (old) old.remove();
  const el = document.createElement('div'); el.id = 'cb'; el.className = 'cb'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', tt('Приватность', 'Прыватнасць', `Soukromí`, `Privacy`));
  el.innerHTML = `<p>🍪 ${tt('Прогресс хранится только на этом устройстве, без рекламы и трекеров. Облако Google включается только с согласия родителя.', 'Прагрэс захоўваецца толькі на гэтай прыладзе, без рэкламы і трэкераў. Воблака Google ўключаецца толькі са згоды бацькоў.', `Postup se ukládá jen v tomto zařízení, bez reklam a sledování. Cloud Google se zapíná jen se souhlasem rodiče.`, `Progress is stored only on this device, with no ads or trackers. Google cloud is turned on only with a parent’s consent.`)}</p>
    <div class="cbb"><button class="btn sm" data-a="cbok">${tt('Понятно', 'Зразумела', `Rozumím`, `Got it`)}</button><button class="btn ghost sm" data-a="privacy">${tt('Подробнее', 'Падрабязней', `Více`, `Details`)}</button></div>`;
  document.body.insertBefore(el, root);
}

/* ---------- кто занимается: вход по картинке (F3) ---------- */
function rWho() {
  const lim = FAM.parent.limit, t0 = today();
  const card = (k, i) => {
    const left = Skills.limitLeft(FAM.parent, k.hist, t0, 0), done = k.route && k.route.date === t0 ? k.route.done.length : 0, tot = k.route && k.route.date === t0 ? k.route.skills.length : Skills.ROUTE_LEN, fin = k.route && k.route.date === t0 && k.route.finished;
    const time = !isFinite(left) ? '' : left <= 0 ? `🌙 ${tt('на сегодня всё', 'на сёння ўсё', `pro dnešek hotovo`, `done for today`)}` : `⏳ ${tt(`ещё ${Math.ceil(left / 60)} мин`, `яшчэ ${Math.ceil(left / 60)} хв`, `ještě ${Math.ceil(left / 60)} min`, `${Math.ceil(left / 60)} min left`)}`;
    const route = fin ? `✅ ${tt('маршрут пройден', 'маршрут пройдзены', `trasa hotová`, `route done`)}` : `🧭 ${tt('маршрут', 'маршрут', `trasa`, `route`)} ${done}/${tot}`;
    return `<button class="whoc c${i % 3}" data-a="who" data-id="${k.id}">${mascot('', false, k)}<b>${esc(k.name)}</b><small>${route}</small>${time ? `<small>${time}</small>` : ''}</button>`;
  };
  root.innerHTML = `<div class="onb whopage"><div class="whotop"><span class="rs">${cloudState === 'ok' ? '☁️ ' + tt('сохранено', 'захавана', `uloženo`, `saved`) : ''}</span>
      <button class="btn sm ghost parentbtn" data-a="parentzone" data-back="who">🔒 ${tt('Для родителей', 'Для бацькоў', `Pro rodiče`, `For parents`)}</button></div>
    <h1>${tt('Кто занимается?', 'Хто займаецца?', `Kdo cvičí?`, `Who is playing?`)}</h1>
    ${lim ? `<div class="rs limline">⏳ ${tt(`Лимит на сегодня: ${lim} мин для каждого`, `Ліміт на сёння: ${lim} хв для кожнага`, `Limit na dnes: ${lim} min pro každého`, `Today's limit: ${lim} min each`)}</div>` : ''}
    <div class="who">${FAM.kids.map(card).join('')}${FAM.kids.length < MAX_KIDS ? `<button class="whoc add" data-a="parentadd" data-back="who"><span class="plus">+</span><b>${tt('Добавить', 'Дадаць', `Přidat`, `Add`)}</b><small>${tt('через PIN родителя', 'праз PIN бацькоў', `přes PIN rodiče`, `with the parent PIN`)}</small></button>` : ''}</div></div>`;
}

/* ---------- родитель: добавить / изменить ребёнка (F2) ---------- */
let KF = null;
function rKid() {
  const isNew = !KF.id, taken = new Set(FAM.kids.map(k => k.pet));
  root.innerHTML = topBar() + `<div class="page"><button class="back" data-a="kback">← ${tt('Назад', 'Назад', `Zpět`, `Back`)}</button>
    <div class="h1">${isNew ? tt('Новый профиль', 'Новы профіль', `Nový profil`, `New profile`) : tt('Профиль ребёнка', 'Профіль дзіцяці', `Profil dítěte`, `Child profile`)}</div>
    <div class="rs" style="margin:0 2px 8px">${tt('Только имя или псевдоним — без фамилии и фото.', 'Толькі імя або псеўданім — без прозвішча і фота.', `Jen jméno nebo přezdívka – bez příjmení a fotky.`, `Just a first name or nickname – no surname or photo.`)}</div>
    <input id="kn" class="kin" aria-label="${tt('Имя', 'Імя', `Jméno`, `Name`)}" maxlength="14" placeholder="${tt('Имя или псевдоним', 'Імя або псеўданім', `Jméno nebo přezdívka`, `Name or nickname`)}" autocomplete="off" value="${esc(KF.name)}">
    <div class="sect">${tt('Возраст', 'Узрост', `Věk`, `Age`)}</div>${ageChips(KF.age, 'kage')}
    <div class="rs" style="margin:6px 2px 0">${tt('От возраста зависят стартовый уровень и набор заданий: до 8 лет — задания почти без чтения.', 'Ад узросту залежаць стартавы ўзровень і набор заданняў: да 8 гадоў — заданні амаль без чытання.', `Od věku se odvíjí startovní úroveň a výběr úloh: do 8 let jsou úlohy téměř bez čtení.`, `Age sets the starting level and the task mix: under 8, tasks need almost no reading.`)}</div>
    ${isNew ? `<div class="sect">${tt('Картинка-аватар', 'Карцінка-аватар', `Obrázek-avatar`, `Picture avatar`)}</div><div class="pets">${['🐱', '🐶', '🐰', '🦊', '🐼', '🐸'].map(e => `<button class="${KF.pet === e ? 'on' : ''}" data-a="kpet" data-e="${e}" aria-label="${e}"${taken.has(e) ? ' style="opacity:.5"' : ''}>${petBtn(e)}</button>`).join('')}</div>
      <div class="rs" style="margin:6px 2px 0">${tt('По этой картинке ребёнок находит свой профиль. Выберите разные картинки.', 'Па гэтай карцінцы дзіця знаходзіць свой профіль. Абярыце розныя карцінкі.', `Podle obrázku dítě najde svůj profil. Vyberte každému jiný.`, `The child finds their profile by this picture. Pick a different one for each child.`)}</div>` : ''}
    <div style="height:14px"></div><button class="btn grn" data-a="ksave">${tt('Сохранить', 'Захаваць', `Uložit`, `Save`)}</button>
    ${!isNew && FAM.kids.length > 1 ? `<div style="height:10px"></div><button class="btn ghost sm" data-a="kdel" style="color:#a82828">🗑 ${tt('Удалить профиль', 'Выдаліць профіль', `Smazat profil`, `Delete profile`)}</button>` : ''}</div>` + tabs('');
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
  const nx = r.skills.findIndex(k => !r.done.includes(k)), left = limitLeft(), hit = left <= 0;
  const chips = r.skills.map((k, i) => { const dn = r.done.includes(k); return `<span class="rchip${dn ? ' done' : ''}${i === nx ? ' cur' : ''}" style="--c:${SK[k].color}">${SK[k].icon}${dn ? '<i>✓</i>' : ''}</span>`; }).join('<span class="rline"></span>');
  const routeCard = hit && !r.finished
    ? `<div class="route fin"><div class="rt">🌙 ${tt('На сегодня время вышло', 'На сёння час скончыўся', `Čas pro dnešek vypršel`, `Time is up for today`)}</div><div class="rs">${tt('Отдых тоже помогает учиться. Приходи завтра!', 'Адпачынак таксама дапамагае вучыцца. Прыходзь заўтра!', `Odpočinek taky pomáhá při učení. Přijď zítra!`, `Rest helps learning too. Come back tomorrow!`)}</div></div>`
    : r.finished
    ? `<div class="route fin"><div class="rt">${tt('✅ На сегодня всё!', '✅ На сёння ўсё!', `✅ Pro dnešek hotovo!`, `✅ That's all for today!`)}</div><div class="rchips">${chips}</div>
        <div class="rs">${tt('Приходи завтра — будет новый маршрут 🌙', 'Прыходзь заўтра — будзе новы маршрут 🌙', `Přijď zítra – čeká tě nová trasa 🌙`, `Come back tomorrow for a new route 🌙`)}</div></div>`
    : `<div class="route"><div class="rt">🌟 ${tt('Маршрут на сегодня', 'Маршрут на сёння', `Dnešní trasa`, `Today's route`)}</div>
        <div class="rs">${tt('Четыре мини-игры, около 10–15 минут', 'Чатыры міні-гульні, каля 10–15 хвілін', `Čtyři minihry, asi 10–15 minut`, `Four mini-games, about 10–15 minutes`)}</div>
        ${isFinite(left) ? `<div class="rs">⏳ ${tt(`Осталось ${minsLeft()} мин на сегодня`, `Засталося ${minsLeft()} хв на сёння`, `Zbývá ${minsLeft()} min na dnes`, `${minsLeft()} min left today`)}</div>` : ''}
        <div class="rchips">${chips}</div>
        <button class="btn grn" data-a="route">${r.done.length ? `${tt('Дальше', 'Далей', `Dál`, `Next`)}: ${SK[r.skills[nx]].icon} ${P(SK[r.skills[nx]].name)}` : tt('Начать', 'Пачаць', `Začít`, `Start`)}</button></div>`;
  const cards = availSkills().map(k => { const sk = S.skills[k];
    return `<button class="skc" style="--c:${SK[k].color}" data-a="skill" data-s="${k}"><div class="ico">${SK[k].icon}</div><b>${P(SK[k].name)}</b><small>${P(SK[k].sub)}</small>
      <div class="pips" aria-label="${tt('Уровень', 'Узровень', `Úroveň`, `Level`)} ${sk.lvl}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= sk.lvl ? 'on' : ''}"></i>`).join('')}</div></button>`; }).join('');
  root.innerHTML = topBar() + `<div class="page">
    <div class="hero tap" data-a="profile" role="button">${mascot('', false, S, { live: 1, pose: 'wave' })}<div class="bubble">${tt('Привет', 'Прывітанне', `Ahoj`, `Hello`)}, <b>${esc(S.name)}</b>!<br><span style="font-weight:700;font-size:14px">${phrase}</span>
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
    return `<div class="card${on ? ' on' : ''}${own ? '' : ' lock'}"><div class="em avatar" data-av="${kind === 'pet' ? it.e : S.pet}" data-hat="${kind === 'hat' ? it.e : ''}"><span class="pet">${it.e}</span></div><div class="ttl">${P(it.n)}</div>` +
      (own ? `<button class="btn ${on ? 'ghost' : 'grn'}" data-a="equip" data-k="${kind}" data-e="${it.e}">${on ? (kind === 'hat' ? tt('Снять', 'Зняць', `Sundat`, `Take off`) : tt('Выбран', 'Абраны', `Vybráno`, `Selected`)) : tt('Выбрать', 'Абраць', `Vybrat`, `Select`)}</button>`
        : `<button class="btn yel" data-a="buy" data-k="${kind}" data-e="${it.e}">🪙 ${it.p}</button>`) + '</div>';
  };
  root.innerHTML = topBar() + `<div class="page"><div class="h1">${tt('Магазин', 'Крама', `Obchod`, `Shop`)}</div>
    <div class="hero">${mascot('', false, S, { pose: 'wave' })}<div class="bubble">${tt('Зарабатывай монеты на занятиях и открывай новых друзей и наряды!', 'Зарабляй манеты на занятках і адкрывай новых сяброў і ўборы!', `Získávej mince při cvičení a odemykej nové kamarády a oblečení!`, `Earn coins while practising and unlock new friends and outfits!`)}</div></div>
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

/* ---------- профиль (детская часть) ---------- */
function rProfile() {
  const L0 = lvl(S.xp), a = lvlStart(L0), b = lvlStart(L0 + 1), pr = Math.min(100, Math.round((S.xp - a) / (b - a) * 100));
  root.innerHTML = topBar() + `<div class="page">
    <button class="back" data-a="goto" data-t="home">← ${tt('Назад', 'Назад', `Zpět`, `Back`)}</button>
    <div class="prof big">${mascot('', false, S, { live: 1 })}<div class="pinfo"><div class="nm">${esc(S.name)}</div><div class="lv">${tt('Уровень', 'Узровень', `Úroveň`, `Level`)} ${L0} · ${S.xp} XP</div>
      <div class="bar xp"><i style="width:${pr}%"></i></div></div></div>
    <div class="row2"><button class="btn ghost sm" data-a="goto" data-t="shop">🎁 ${tt('Сменить друга и шляпу', 'Змяніць сябра і галаўны ўбор', `Změnit kamaráda a klobouk`, `Change friend and hat`)}</button></div>
    <div class="row2"><button class="btn ghost sm" data-a="sound">${S.sound ? tt('🔊 Звук включён', '🔊 Гук уключаны', `🔊 Zvuk zapnutý`, `🔊 Sound on`) : tt('🔇 Звук выключен', '🔇 Гук выключаны', `🔇 Zvuk vypnutý`, `🔇 Sound off`)}</button></div>
    <div class="row2"><button class="btn ghost sm" data-a="glossary">📖 ${tt('Словарик', 'Слоўнік', `Slovníček`, `Glossary`)}</button></div>
    ${FAM.kids.length > 1 ? `<div class="row2"><button class="btn ghost sm" data-a="switchkid">👥 ${tt('Сменить профиль', 'Змяніць профіль', `Změnit profil`, `Switch profile`)}</button></div>` : ''}
    <div class="sect">🔒</div>
    <div class="row2"><button class="btn blu sm" data-a="parentzone">🔒 ${tt('Родительская зона', 'Бацькоўская зона', `Rodičovská zóna`, `Parents’ zone`)}</button></div>
    <div class="rs" style="margin:0 2px">${tt('Отчёт, язык, аккаунт, лимит времени и сброс — только с PIN родителя.', 'Справаздача, мова, акаўнт, ліміт часу і скід — толькі з PIN бацькоў.', `Přehled, jazyk, účet, limit času a smazání – jen s PIN rodiče.`, `Report, language, account, time limit and reset – only with the parent PIN.`)}</div></div>` + tabs('');
}

/* ---------- PIN, родительская зона, «время вышло» ---------- */
function rPin() {
  const m = PN.mode, locked = Date.now() < pinLockUntil;
  const title = m === 'set' ? tt('Придумайте PIN из 4 цифр', 'Прыдумайце PIN з 4 лічбаў', `Vymyslete PIN ze 4 číslic`, `Choose a 4-digit PIN`) : m === 'confirm' ? tt('Повторите PIN', 'Паўтарыце PIN', `Zopakujte PIN`, `Repeat the PIN`) : tt('Введите PIN родителя', 'Увядзіце PIN бацькоў', `Zadejte PIN rodiče`, `Enter the parent PIN`);
  const err = locked ? tt(`Подождите ${Math.ceil((pinLockUntil - Date.now()) / 1000)} с`, `Пачакайце ${Math.ceil((pinLockUntil - Date.now()) / 1000)} с`, `Počkejte ${Math.ceil((pinLockUntil - Date.now()) / 1000)} s`, `Wait ${Math.ceil((pinLockUntil - Date.now()) / 1000)} s`) : (PN.err || '');
  root.innerHTML = `<div class="pinpage"><button class="back" data-a="pinback">← ${tt('Назад', 'Назад', `Zpět`, `Back`)}</button><div style="font-size:54px;margin-top:6px">🔒</div><h2>${title}</h2>
    <div class="dots">${[0, 1, 2, 3].map(i => `<i class="${i < PN.buf.length ? 'on' : ''}"></i>`).join('')}</div><div class="rs perr">${err}&nbsp;</div>
    <div class="pad pinpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => `<button data-a="pinkey" data-k="${n}">${n}</button>`).join('')}</div>
    <div class="row2" style="justify-content:center"><button class="bk" data-a="pinkey" data-k="b" style="width:90px;height:48px">⌫</button></div>
    ${m === 'enter' ? `<button class="btn ghost sm" data-a="pinforgot" style="width:auto;margin:6px auto">${tt('Забыли PIN?', 'Забыліся на PIN?', `Zapomněli jste PIN?`, `Forgot the PIN?`)}</button>` : ''}</div>`;
}
const LIMITS = [0, 10, 15, 20, 30, 45, 60];
function rParent() {
  const used = Math.round(((S.hist[today()] || {}).sec || 0) / 60), lim = S.parent.limit, ex = S.parent.extra.date === today() ? S.parent.extra.min : 0;
  root.innerHTML = topBar() + `<div class="page"><button class="back" data-a="lockparent">🔒 ${tt('Закрыть', 'Закрыць', `Zavřít`, `Lock`)}</button>
    <div class="h1">🔐 ${tt('Родительская зона', 'Бацькоўская зона', `Rodičovská zóna`, `Parents’ zone`)}</div>
    <div class="sect">👨‍👩‍👧 ${tt('Дети', 'Дзеці', `Děti`, `Children`)}</div>
    ${FAM.kids.map(k => `<div class="kidrow${k.id === S.id ? ' on' : ''}"><button class="kmain" data-a="pkid" data-id="${k.id}">${mascot('sm', false, k)}<span><b>${esc(k.name)}</b><small>${k.age ? ageTxt(k.age) + ' · ' : ''}${tt('уровень', 'узровень', `úroveň`, `level`)} ${lvl(k.xp)}</small></span></button><button class="btn ghost sm kedit" data-a="kedit" data-id="${k.id}" aria-label="${tt('Изменить', 'Змяніць', `Upravit`, `Edit`)}">✏️</button></div>`).join('')}
    ${FAM.kids.length < MAX_KIDS ? `<div class="row2"><button class="btn blu sm" data-a="kadd">➕ ${tt('Добавить ребёнка', 'Дадаць дзіця', `Přidat dítě`, `Add a child`)}</button></div>` : ''}
    <div class="rs" style="margin:6px 2px 4px">${tt('Ниже — отчёт и настройки для', 'Ніжэй — справаздача і налады для', `Níže – přehled a nastavení pro`, `Below – report and settings for`)}: <b>${esc(S.name)}</b></div>
    <div class="row2"><button class="btn blu sm" data-a="goto" data-t="report">📊 ${tt('Отчёт для родителя', 'Справаздача для бацькоў', `Přehled pro rodiče`, `Parent report`)}</button></div>
    <div class="sect">⏱ ${tt('Время занятий в день (для каждого ребёнка)', 'Час заняткаў у дзень (для кожнага дзіцяці)', `Čas cvičení za den (pro každé dítě)`, `Daily practice time (per child)`)}</div>
    <div class="chips">${LIMITS.map(m => `<button class="chip2${lim === m ? ' on' : ''}" data-a="limit" data-m="${m}">${m ? `${m} ${tt('мин', 'хв', `min`, `min`)}` : tt('Без лимита', 'Без ліміту', `Bez limitu`, `No limit`)}</button>`).join('')}</div>
    <div class="rs" style="margin:4px 2px 8px">${tt(`Сегодня: ${used} мин`, `Сёння: ${used} хв`, `Dnes: ${used} min`, `Today: ${used} min`)}${lim ? ` ${tt('из', 'з', `z`, `of`)} ${lim + ex}` : ''}. ${tt('Когда время выйдет, занятие мягко завершится, и ребёнок увидит экран отдыха.', 'Калі час скончыцца, занятак мякка завяршыцца, і дзіця ўбачыць экран адпачынку.', `Až čas vyprší, trénink se jemně ukončí a dítě uvidí obrazovku odpočinku.`, `When time runs out the session ends gently and the child sees a rest screen.`)}</div>
    <div class="sect">🔊 ${tt('Озвучка заданий', 'Агучванне заданняў', `Hlasité čtení úloh`, `Reading tasks aloud`)}</div>
    <div class="chips">${[['off', tt('Выкл', 'Выкл.', `Vypnuto`, `Off`)], ['tap', tt('По кнопке', 'Па кнопцы', `Tlačítkem`, `On tap`)], ['auto', tt('Сама читает', 'Сама чытае', `Čte samo`, `Automatic`)]].map(([m, n]) => `<button class="chip2${S.speak === m ? ' on' : ''}" data-a="speakmode" data-m="${m}">${n}</button>`).join('')}</div>
    <div class="rs" style="margin:6px 2px 8px">${tt('Читает голос самого телефона, без интернета. Для 5–7 лет по умолчанию «Сама читает».', 'Чытае голас самога тэлефона, без інтэрнэту. Для 5–7 гадоў па змаўчанні «Сама чытае».', `Čte hlas samotného telefonu, bez internetu. Pro 5–7 let je výchozí „Čte samo“.`, `Uses the phone's own voice, no internet needed. For ages 5–7 the default is “Automatic”.`)}
      <br>${window.Speech && Speech.supported() ? LANGS.map(l => `${LANG_NAMES[l]} ${Speech.canSpeak(l) ? '✓' : '✗'}`).join(' · ') : tt('Этот браузер не умеет читать вслух.', 'Гэты браўзер не ўмее чытаць услых.', `Tento prohlížeč neumí číst nahlas.`, `This browser cannot read aloud.`)}
      ${window.Speech && Speech.supported() && !Speech.canSpeak('be') ? `<br>${tt('Для белорусского на телефоне обычно нет голоса, поэтому на этом языке озвучка выключена.', 'Для беларускай на тэлефоне звычайна няма голасу, таму на гэтай мове агучванне выключана.', `Pro běloruštinu telefon obvykle hlas nemá, proto je na tomto jazyce hlasité čtení vypnuto.`, `Phones usually have no Belarusian voice, so reading aloud is off for that language.`)}` : ''}</div>
    <div class="sect">🌍 ${tt('Двуязычный режим', 'Двумоўны рэжым', `Dvojjazyčný režim`, `Bilingual mode`)}</div>
    <div class="rs" style="margin:0 2px 6px">${tt('Основной язык', 'Асноўная мова', `Hlavní jazyk`, `Main language`)}: <b>${LANG_NAMES[S.lang]}</b>. ${tt('Второй язык', 'Другая мова', `Druhý jazyk`, `Second language`)}:</div>
    <div class="chips"><button class="chip2${!S.bil.second ? ' on' : ''}" data-a="bilsecond" data-l="">${tt('Выкл', 'Выкл.', `Vypnuto`, `Off`)}</button>${LANGS.filter(l => l !== S.lang).map(l => `<button class="chip2${S.bil.second === l ? ' on' : ''}" data-a="bilsecond" data-l="${l}">${LANG_NAMES[l]}</button>`).join('')}</div>
    ${S.bil.second ? `<div class="chips" style="margin-top:8px"><button class="chip2${S.bil.mode === 'mix' ? ' on' : ''}" data-a="bilmode" data-m="mix">${tt('Микс', 'Мікс', `Mix`, `Mix`)}</button><button class="chip2${S.bil.mode === 'immersion' ? ' on' : ''}" data-a="bilmode" data-m="immersion">${tt('Погружение', 'Пагружэнне', `Ponoření`, `Immersion`)}</button></div>
      ${S.bil.mode === 'mix' ? `<div class="rs" style="margin:8px 2px 4px">${tt('Доля заданий на втором языке', 'Доля заданняў на другой мове', `Podíl úloh ve druhém jazyce`, `Share of tasks in the second language`)}:</div>
        <div class="chips">${Skills.SHARES.map(m => `<button class="chip2${S.bil.share === m ? ' on' : ''}" data-a="bilshare" data-m="${m}">${m}%</button>`).join('')}</div>
        <div class="chips" style="margin-top:8px"><button class="chip2${S.bil.adapt ? ' on' : ''}" data-a="biladapt">${S.bil.adapt ? '✓ ' : ''}${tt('Подстраивать долю автоматически', 'Падладжваць долю аўтаматычна', `Upravovat podíl automaticky`, `Adjust the share automatically`)}</button></div>`
        : `<div class="rs" style="margin:8px 2px 0">${tt('Погружение: все задания на втором языке. Лучше открывать с 7 лет — младшие ещё плохо читают.', 'Пагружэнне: усе заданні на другой мове. Лепш адкрываць з 7 гадоў — меншыя яшчэ дрэнна чытаюць.', `Ponoření: všechny úlohy ve druhém jazyce. Doporučujeme od 7 let – mladší děti ještě špatně čtou.`, `Immersion: all tasks in the second language. Best from age 7 – younger children do not read well yet.`)}</div>`}
      <div class="rs" style="margin:8px 2px 0">${tt('Язык каждого задания выбирается целиком. Кнопка 🌐 показывает то же задание на другом языке — без штрафа.', 'Мова кожнага задання выбіраецца цалкам. Кнопка 🌐 паказвае тое ж заданне на іншай мове — без штрафу.', `Jazyk každé úlohy se volí celý. Tlačítko 🌐 ukáže stejnou úlohu v druhém jazyce – bez trestu.`, `Each task is shown fully in one language. The 🌐 button shows the same task in the other language – no penalty.`)}</div>` : ''}
    <div class="sect">${tt('Аккаунт', 'Акаўнт', `Účet`, `Account`)}</div>
    ${fbUser ? `<div class="row2"><div class="cloud">☁️ ${esc(fbUser.email || '')}<small>${cloudText()}</small></div><button class="btn ghost sm" data-a="logout" style="width:auto">${tt('Выйти', 'Выйсці', `Odhlásit`, `Sign out`)}</button></div>`
      : `<div class="row2"><button class="btn blu sm" data-a="login">🔑 ${tt('Войти через Google и сохранить прогресс', 'Увайсці праз Google і захаваць прагрэс', `Přihlásit se přes Google a uložit postup`, `Sign in with Google and save progress`)}</button></div>`}
    <div class="sect">🌐 ${tt('Язык', 'Мова', 'Jazyk', 'Language')}</div>
    <div class="pets lang">${Object.entries(LANG_NAMES).map(([c, n]) => `<button class="${S.lang === c ? 'on' : ''}" data-a="lang" data-l="${c}">${n}</button>`).join('')}</div>
    <div class="sect">🛡 ${tt('Данные и приватность', 'Даныя і прыватнасць', `Data a soukromí`, `Data and privacy`)}</div>
    <div class="rs" style="margin:0 2px 6px">☁️ ${FAM.consent.cloud ? tt('Облако разрешено', 'Воблака дазволена', `Cloud povolen`, `Cloud allowed`) + ' · ' + FAM.consent.cloud.slice(0, 10) : tt('Облако не включено: данные только на этом устройстве.', 'Воблака не ўключана: даныя толькі на гэтай прыладзе.', `Cloud není zapnutý: data jsou jen v tomto zařízení.`, `Cloud is off: data stays on this device only.`)}</div>
    <div class="row2"><button class="btn ghost sm" data-a="privacy">📄 ${tt('Политика', 'Палітыка', `Zásady`, `Policy`)}</button><button class="btn ghost sm" data-a="exportdata">⬇️ ${tt('Скачать данные', 'Спампаваць даныя', `Stáhnout data`, `Download data`)}</button></div>
    <div class="row2">${FAM.consent.cloud ? `<button class="btn ghost sm" data-a="withdraw">↩️ ${tt('Отозвать облако', 'Адклікаць воблака', `Odvolat cloud`, `Withdraw cloud`)}</button>` : ''}<button class="btn ghost sm" data-a="eraseall" style="color:#a82828">🗑 ${tt('Удалить все данные', 'Выдаліць усе даныя', `Smazat všechna data`, `Delete all data`)}</button></div>
    <div class="row2"><button class="btn ghost sm" data-a="glossary">📖 ${tt('Словарик', 'Слоўнік', `Slovníček`, `Glossary`)}</button></div>
    <div class="sect">${tt('Настройки', 'Налады', `Nastavení`, `Settings`)}</div>
    <div class="row2"><button class="btn ghost sm" data-a="rename">✏️ ${tt('Сменить имя', 'Змяніць імя', `Změnit jméno`, `Change name`)}</button><button class="btn ghost sm" data-a="changepin">🔢 ${tt('Сменить PIN', 'Змяніць PIN', `Změnit PIN`, `Change PIN`)}</button></div>
    <div class="row2"><button class="btn ghost sm" data-a="reset">🗑 ${tt('Начать заново', 'Пачаць зноў', `Začít znovu`, `Start over`)}</button></div><div class="rs" style="text-align:center;margin-top:10px">${tt('Версия', 'Версія', `Verze`, `Version`)} ${BUILD}</div></div>` + tabs('');
}
function rTimeup() {
  root.innerHTML = `<div class="result"><div style="font-size:70px">🌙</div><h1>${tt('На сегодня время вышло', 'На сёння час скончыўся', `Čas pro dnešek vypršel`, `Time is up for today`)}</h1>
    <div class="sub">${tt('Отдых тоже помогает учиться. Приходи завтра!', 'Адпачынак таксама дапамагае вучыцца. Прыходзь заўтра!', `Odpočinek taky pomáhá při učení. Přijď zítra!`, `Rest helps learning too. Come back tomorrow!`)}</div>
    <div class="mascot big" style="margin:18px auto"><span class="hat">${S.hat}</span><span class="pet">${S.pet}</span></div>
    <div class="acts"><button class="btn grn" data-a="home">${tt('На главный экран', 'На галоўны экран', `Na hlavní obrazovku`, `Home`)}</button>
      <button class="btn ghost" data-a="timeupparent">🔒 ${tt('Родителю: добавить время', 'Бацькам: дадаць час', `Rodiči: přidat čas`, `Parent: add time`)}</button></div></div>`;
}
function pinEnter(key) {
  if (Date.now() < pinLockUntil) { rPin(); return; }
  if (key === 'b') PN.buf = PN.buf.slice(0, -1); else if (PN.buf.length < 4) PN.buf += key;
  PN.err = ''; if (PN.buf.length < 4) { sfx.tap(); rPin(); return; }
  const buf = PN.buf; PN.buf = '';
  if (PN.mode === 'enter') {
    if (Skills.checkPin(S.parent, buf)) { pinFails = 0; parentOK = true; sfx.ok(); if (PN.next === 'extra') { parentOK = false; extraTimeModal(); } else { R = PN.next || 'parent'; render(); } return; }
    pinFails++; sfx.no(); PN.err = tt('Неверный PIN', 'Няправільны PIN', `Špatný PIN`, `Wrong PIN`);
    if (pinFails >= 3) { pinFails = 0; pinLockUntil = Date.now() + 30000; } rPin(); return;
  }
  if (PN.mode === 'set') { PN.first = buf; PN.mode = 'confirm'; sfx.tap(); rPin(); return; }
  if (buf === PN.first) { Skills.setPin(S.parent, buf, Math.random().toString(36).slice(2, 10)); save(); parentOK = true; sfx.ok(); toast(tt('PIN сохранён ✓', 'PIN захаваны ✓', `PIN uložen ✓`, `PIN saved ✓`)); R = PN.next === 'extra' ? 'parent' : (PN.next || 'parent'); render(); return; }
  PN.mode = 'set'; PN.first = ''; PN.err = tt('PIN не совпал. Попробуйте ещё раз.', 'PIN не супаў. Паспрабуйце яшчэ раз.', `PIN se neshoduje. Zkuste to znovu.`, `The PINs did not match. Try again.`); sfx.no(); rPin();
}
function extraTimeModal() {
  const add = m => () => { const e = S.parent.extra; S.parent.extra = { date: today(), min: (e.date === today() ? e.min : 0) + m }; save(); toast(tt('Время добавлено ✓', 'Час дададзены ✓', `Čas přidán ✓`, `Time added ✓`)); R = 'home'; render(); };
  modal({ icon: '⏱', title: tt('Добавить время на сегодня', 'Дадаць час на сёння', `Přidat čas na dnes`, `Add time for today`), text: '',
    btns: [10, 20, 30].map(m => ({ t: `+${m} ${tt('мин', 'хв', `min`, `min`)}`, c: 'grn', f: add(m) })).concat([{ t: tt('Отмена', 'Адмена', `Zrušit`, `Cancel`), c: 'ghost', f: () => { R = 'timeup'; render(); } }]) });
}
/* занятие, прерванное лимитом: мягко завершаем, сохранив всё, что уже решено */
function endByLimit() {
  clearTimeout(L.timer); tickTime();
  if (L.counted > 0) { L.early = true; return finish(); }
  Skills.addHist(S.hist, today(), { sec: L.sec }); save(); R = 'timeup'; render();
}

/* ---------- отчёт для родителя (F9): неделя, паспорт навыков, совет ---------- */
const TIPS = {
  numbers: ['Считайте вместе в быту: сдача в магазине, доли пиццы, сколько минут до выхода. Просите рассказать, как считали, — объяснение закрепляет навык.',
    'Лічыце разам у побыце: рэшта ў краме, долі піцы, колькі хвілін да выхаду. Прасіце расказаць, як лічылі, — тлумачэнне замацоўвае навык.',
    'Počítejte spolu v běžném životě: drobné v obchodě, díly pizzy, kolik minut zbývá do odchodu. Nechte dítě vysvětlit, jak počítalo – vysvětlení upevňuje dovednost.',
    'Count together in everyday life: change in a shop, slices of pizza, minutes until you leave. Ask your child to explain how they worked it out – explaining strengthens the skill.'],
  logic: ['Играйте в «найди закономерность»: ряды предметов за столом, загадки в дороге. Не подсказывайте сразу — подождите 10 секунд и задайте наводящий вопрос.',
    'Гуляйце ў «знайдзі заканамернасць»: радкі прадметаў за сталом, загадкі ў дарозе. Не падказвайце адразу — пачакайце 10 секунд і задайце навадное пытанне.',
    'Hrajte „najdi pravidlo“: řady předmětů na stole, hádanky cestou. Nenapovídejte hned – počkejte 10 sekund a pak položte pomocnou otázku.',
    'Play “find the pattern”: rows of objects on the table, riddles on the road. Don’t give hints right away – wait 10 seconds, then ask a guiding question.'],
  space: ['Дайте поиграть с конструктором, оригами или рисованием по клеточкам. Попросите описать дорогу до дома словами: «налево, потом прямо».',
    'Дайце пагуляць з канструктарам, арыгамі або маляваннем па клетках. Папрасіце апісаць дарогу дадому словамі: «налева, потым прама».',
    'Nechte dítě hrát si se stavebnicí, skládat origami nebo kreslit do čtverečkovaného papíru. Požádejte, ať slovy popíše cestu domů: „doleva, pak rovně“.',
    'Let your child play with building blocks, origami or drawing on squared paper. Ask them to describe the way home in words: “left, then straight”.'],
  attention: ['Играйте в «найди отличия» и «что изменилось в комнате». Короткие игры по 2–3 минуты лучше долгих; уберите отвлекающие звуки на время занятия.',
    'Гуляйце ў «знайдзі адрозненні» і «што змянілася ў пакоі». Кароткія гульні па 2–3 хвіліны лепшыя за доўгія; прыбярыце адцягваючыя гукі на час заняткаў.',
    'Hrajte „najdi rozdíly“ a „co se změnilo v pokoji“. Krátké hry po 2–3 minutách jsou lepší než dlouhé; na dobu cvičení vypněte rušivé zvuky.',
    'Play “spot the difference” and “what changed in the room”. Short 2–3 minute games work better than long ones; switch off distracting sounds during practice.'],
  memory: ['Попробуйте запоминать список покупок, номера этажей, стишки. Просите пересказать прочитанное своими словами. Хороший сон тоже тренирует память.',
    'Паспрабуйце запамінаць спіс пакупак, нумары паверхаў, вершыкі. Прасіце пераказаць прачытанае сваімі словамі. Добры сон таксама трэніруе памяць.',
    'Zkuste si pamatovat nákupní seznam, čísla pater nebo básničky. Nechte dítě převyprávět přečtené vlastními slovy. Paměť trénuje i dostatek spánku.',
    'Try remembering a shopping list, floor numbers or rhymes. Ask your child to retell what they read in their own words. Good sleep trains memory too.'],
  chess: ['Сыграйте несколько партий «только королём и ладьёй» или решайте мат в один ход на настоящей доске. Называйте фигуры вслух — так легче запомнить ходы.',
    'Згуляйце некалькі партый «толькі каралём і ладдзёй» або вырашайце мат у адзін ход на сапраўднай дошцы. Называйце фігуры ўголас — так лягчэй запомніць хады.',
    'Zahrajte si pár partií jen s králem a věží nebo řešte mat v jednom tahu na skutečné šachovnici. Pojmenovávejte figury nahlas – tahy se snáz pamatují.',
    'Play a few games with just a king and a rook, or solve mate-in-one on a real board. Name the pieces aloud – the moves are easier to remember.'],
};
const fmtMin = sec => (sec > 0 && sec < 60 ? '<1' : String(Math.round(sec / 60)));
const pct = (o, t) => (t > 0 ? Math.min(100, Math.max(0, Math.round(100 * o / t))) : null);
function dayLabel(dateStr, opt) { try { return new Intl.DateTimeFormat(getLang(), opt).format(Skills.parseDay(dateStr)); } catch (e) { return dateStr; } }
function trend(cur, prev, unit = '') {   // стрелка динамики к прошлой неделе
  if (cur == null || prev == null || (cur === 0 && prev === 0)) return '';
  const d = cur - prev; if (d === 0) return '<span class="tr eq">＝</span>';
  return `<span class="tr ${d > 0 ? 'up' : 'dn'}">${d > 0 ? '▲' : '▼'} ${Math.abs(Math.round(d))}${unit}</span>`;
}
function radarSVG(items) {
  const n = items.length, cx = 120, cy = 118, Rr = 78, pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const poly = r => items.map((_, i) => pt(i, r).map(v => v.toFixed(1)).join(',')).join(' ');
  let g = '';
  for (let k = 1; k <= 5; k++) g += `<polygon points="${poly(Rr * k / 5)}" fill="${k % 2 ? '#faf9ff' : '#fff'}" stroke="#d9d4ff" stroke-width="1"/>`;
  items.forEach((_, i) => { const [x, y] = pt(i, Rr); g += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#d9d4ff"/>`; });
  const data = items.map((it, i) => pt(i, Rr * it.v / 5).map(v => v.toFixed(1)).join(',')).join(' ');
  g += `<polygon points="${data}" fill="rgba(123,108,255,.28)" stroke="#7b6cff" stroke-width="3" stroke-linejoin="round"/>`;
  items.forEach((it, i) => { const [x, y] = pt(i, Rr * it.v / 5); g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${it.color}"/>`;
    const [lx, ly] = pt(i, Rr + 22); g += `<text x="${lx.toFixed(1)}" y="${(ly + 8).toFixed(1)}" text-anchor="middle" font-size="22">${it.icon}</text>`; });
  return `<svg viewBox="0 0 240 236" width="260" role="img" aria-label="${tt('Паспорт навыков', 'Пашпарт навыкаў', `Pas dovedností`, `Skills passport`)}">${g}</svg>`;
}
function rReport() {
  const t0 = today(), w = Skills.weekStats(S.hist, t0), c = w.cur, p = w.prev, av = availSkills(), accC = pct(c.ok, c.total), accP = pct(p.ok, p.total);
  const maxSec = Math.max(60, ...w.days.map(d => d.sec));
  const bars = w.days.map(d => `<div class="bcol${d.date === t0 ? ' now' : ''}"><div class="bv">${d.sec ? fmtMin(d.sec) : ''}</div><div class="bt"><i style="height:${d.sec ? Math.max(8, Math.round(d.sec / maxSec * 100)) : 0}%"></i></div><div class="bl">${dayLabel(d.date, { weekday: 'short' })}</div></div>`).join('');
  const radarItems = av.filter(k => k !== 'chess').map(k => ({ icon: SK[k].icon, color: SK[k].color, v: S.skills[k].lvl }));
  const rows = av.map(k => { const sk = S.skills[k], cw = c.sk[k] || [0, 0], pw = p.sk[k] || [0, 0], a = pct(cw[0], cw[1]), b = pct(pw[0], pw[1]);
    return `<div class="skrow" style="--c:${SK[k].color}"><div class="ico">${SK[k].icon}</div><div class="nm"><b>${P(SK[k].name)}${k === 'chess' ? ` <small>· ${Object.keys(S.chessLessons || {}).length}/${Chess.LESSONS.length} ${tt('уроков', 'урокаў', `lekcí`, `lessons`)}</small>` : ''}</b><div class="pips">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= sk.lvl ? 'on' : ''}"></i>`).join('')}</div></div>
      <div class="num">${cw[1] ? `<b>${a}%</b> <small>${cw[0]}/${cw[1]}</small> ${trend(a, b, '%')}` : '<small>—</small>'}</div></div>`; }).join('');
  const cand = av.filter(k => S.skills[k].n >= 10).sort((x, y) => (S.skills[x].lvl - S.skills[y].lvl) || (S.skills[x].ok / S.skills[x].n - S.skills[y].ok / S.skills[y].n));
  const weak = cand[0], enough = c.ses > 0 || S.stat.lessons >= 3;
  root.innerHTML = topBar() + `<div class="page report">
    <button class="back" data-a="goto" data-t="parent">← ${tt('Назад', 'Назад', `Zpět`, `Back`)}</button>
    <div class="h1">📊 ${tt('Отчёт для родителя', 'Справаздача для бацькоў', `Přehled pro rodiče`, `Parent report`)}</div>
    <div class="rs" style="margin:-6px 2px 10px">${esc(S.name)} · ${dayLabel(w.days[0].date, { day: 'numeric', month: 'short' })} – ${dayLabel(t0, { day: 'numeric', month: 'short' })}</div>
    <div class="rp-cards">
      <div class="rp-card"><small>${tt('Время', 'Час', `Čas`, `Time`)}</small><b>${fmtMin(c.sec)} <u>${tt('мин', 'хв', `min`, `min`)}</u></b>${trend(Math.round(c.sec / 60), Math.round(p.sec / 60), ` ${tt('мин', 'хв', `min`, `min`)}`)}</div>
      <div class="rp-card"><small>${tt('Дней занятий', 'Дзён заняткаў', `Dnů cvičení`, `Days practised`)}</small><b>${c.played}<u>/7</u></b>${trend(c.played, p.played)}</div>
      <div class="rp-card"><small>${tt('Занятий', 'Заняткаў', `Tréninků`, `Sessions`)}</small><b>${c.ses}</b>${trend(c.ses, p.ses)}</div>
      <div class="rp-card"><small>${tt('Точность', 'Дакладнасць', `Přesnost`, `Accuracy`)}</small><b>${accC == null ? '—' : accC + '%'}</b>${trend(accC, accP, '%')}</div>
    </div>
    <div class="rs" style="margin:2px 2px 10px">${tt('Стрелки — изменение к прошлой неделе. Точность считается по ответам с первой попытки.', 'Стрэлкі — змена да мінулага тыдня. Дакладнасць лічыцца па адказах з першай спробы.', `Šipky ukazují změnu oproti minulému týdnu. Přesnost se počítá z odpovědí na první pokus.`, `Arrows show the change since last week. Accuracy counts first-try answers.`)}</div>
    <div class="sect">${tt('Минуты по дням', 'Хвіліны па днях', `Minuty po dnech`, `Minutes per day`)}</div><div class="bars">${bars}</div>
    <div class="sect">${tt('Паспорт навыков', 'Пашпарт навыкаў', `Pas dovedností`, `Skills passport`)}</div>
    <div class="radar">${radarItems.length >= 3 ? radarSVG(radarItems) : ''}</div>
    <div class="rs" style="text-align:center;margin-bottom:8px">${tt('Уровень навыка от 1 до 5 (растёт, когда ≥ 80% ответов верные)', 'Узровень навыку ад 1 да 5 (расце, калі ≥ 80% адказаў правільныя)', `Úroveň dovednosti od 1 do 5 (roste, když je správně ≥ 80 % odpovědí)`, `Skill level from 1 to 5 (rises when ≥ 80% of answers are correct)`)}</div>
    ${rows}
${S.bil.second ? (() => {
      const l2 = c.l2, a2 = pct(l2.ok, l2.n), a1 = pct(c.ok - l2.ok, c.total - l2.n), rate = l2.n ? Math.round(100 * l2.tap / l2.n) : 0;
      const hard = Object.entries(c.hard).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, n]) => `${SK[k] ? SK[k].icon + ' ' + P(SK[k].name) : k} ×${n}`).join(', ');
      return `<div class="sect">🌍 ${tt('Второй язык', 'Другая мова', `Druhý jazyk`, `Second language`)}: ${LANG_NAMES[S.bil.second]}</div>
      <div class="rp-cards">
        <div class="rp-card"><small>${tt('Заданий на втором языке', 'Заданняў на другой мове', `Úloh ve druhém jazyce`, `Tasks in the second language`)}</small><b>${l2.n}</b></div>
        <div class="rp-card"><small>${tt('Точность на втором языке', 'Дакладнасць на другой мове', `Přesnost ve druhém jazyce`, `Accuracy in the second language`)}</small><b>${a2 == null ? '—' : a2 + '%'}</b><small>${tt('на основном', 'на асноўнай', `v hlavním`, `main`)}: ${a1 == null ? '—' : a1 + '%'}</small></div>
        <div class="rp-card"><small>${tt('«Не понял»', '«Не зразумеў»', `„Nerozumím“`, `"Don't understand"`)}</small><b>${l2.tap}</b><small>${rate}% ${tt('от заданий', 'ад заданняў', `z úloh`, `of tasks`)}</small></div>
        <div class="rp-card"><small>${tt('Режим', 'Рэжым', `Režim`, `Mode`)}</small><b style="font-size:20px">${S.bil.mode === 'mix' ? `${tt('Микс', 'Мікс', `Mix`, `Mix`)} ${S.bil.share}%` : tt('Погружение', 'Пагружэнне', `Ponoření`, `Immersion`)}</b></div>
      </div>
      ${hard ? `<div class="rs" style="margin:2px 2px 6px">${tt('Чаще всего непонятны задания', 'Часцей за ўсё незразумелыя заданні', `Nejčastěji nerozumí úlohám`, `Most often unclear`)}: ${hard}</div>` : ''}
      ${S.bil.adaptedAt && Skills.addDays(S.bil.adaptedAt, 7) >= t0 ? `<div class="rs" style="margin:2px 2px 6px">⚙️ ${tt('Доля второго языка подстроена автоматически', 'Доля другой мовы падладжана аўтаматычна', `Podíl druhého jazyka byl upraven automaticky`, `The second-language share was adjusted automatically`)}.</div>` : ''}`;
    })() : ''}
    ${(() => { const ws = Object.entries(S.words || {}).filter(([id]) => Glossary.byId[id]).sort((a, b) => b[1] - a[1]).slice(0, 6); if (!ws.length) return '';
      return `<div class="sect">📖 ${tt('Слова, о которых спрашивал', 'Словы, пра якія пытаўся', `Slova, na která se ptal(a)`, `Words looked up`)}</div><div class="chips">${ws.map(([id, n]) => `<span class="chip2">${esc(Glossary.byId[id][S.lang])} · ${n}</span>`).join('')}</div>
        <div class="rs" style="margin:4px 2px 8px">${tt('Термины, на которые ребёнок нажимал в заданиях.', 'Тэрміны, на якія дзіця націскала ў заданнях.', `Pojmy, na které dítě v úlohách klepalo.`, `Terms the child tapped in tasks.`)}</div>`; })()}
    <div class="sect">${tt('Чем помочь дома', 'Чым дапамагчы дома', `Jak pomoci doma`, `How to help at home`)}</div>
    <div class="tip">${enough && weak ? `<b>${tt('Сейчас стоит поддержать', 'Зараз варта падтрымаць', `Teď stojí za to podpořit`, `Worth supporting now`)}: ${SK[weak].icon} ${P(SK[weak].name)}</b><br>${P(TIPS[weak])}`
      : tt('Пока мало данных. После нескольких занятий здесь появится картина и совет.', 'Пакуль мала даных. Пасля некалькіх заняткаў тут з’явіцца карціна і парада.', `Zatím málo dat. Po několika trénincích tu uvidíte přehled i radu.`, `Not much data yet. After a few sessions the picture and a tip will appear here.`)}</div>
    <div class="row2" style="margin-top:12px"><button class="btn ghost sm" data-a="print">🖨 ${tt('Печать', 'Друк', `Tisk`, `Print`)}</button></div></div>` + tabs('');
}

/* ---------- шахматы: уроки и тренировка ---------- */
function rChess() {
  const sk = S.skills.chess, done = S.chessLessons || {}, ico = { capture: '⚔️', check: '⚡', mate: '🏁' };
  root.innerHTML = topBar() + `<div class="page"><button class="back" data-a="goto" data-t="home">← ${tt('Назад', 'Назад', `Zpět`, `Back`)}</button>
    <div class="h1">♟️ ${P(SK.chess.name)}</div>
    <div class="pieces">${['K', 'Q', 'R', 'B', 'N', 'P'].map(p => `<div><b>${Chess.glyph(p)}</b>${esc(Chess.pieceName(p))}</div>`).join('')}</div>
    <button class="btn grn" data-a="cpractice">♟️ ${tt('Задачи на моём уровне', 'Задачы на маім узроўні', `Úlohy na mé úrovni`, `Puzzles at my level`)} · ${sk.lvl}</button>
    <div class="sect">${tt('Уроки', 'Урокі', `Lekce`, `Lessons`)} · ${Object.keys(done).length}/${Chess.LESSONS.length}</div>
    <div class="lessons">${Chess.LESSONS.map(X => `<button class="lcard" data-a="clesson" data-id="${X.id}"><div class="gl">${X.piece ? Chess.glyph(X.piece) : ico[X.id]}</div><b>${esc(Chess.lessonName(X))}</b><div class="st">${done[X.id] ? '⭐'.repeat(done[X.id]) : ''}</div></button>`).join('')}</div></div>` + tabs('home');
}

/* ---------- занятие ---------- */
function startSession(skill, opts = {}) {
  if (limitHit()) { R = 'timeup'; render(); return; }
  document.querySelectorAll('.confetti').forEach(e => e.remove());
  if (L) clearTimeout(L.timer);
  const lv = S.skills[skill].lvl, n = opts.n || QPL;
  let langs = null;
  if (!opts.lesson && bilOn()) {
    const ad = Skills.adaptShare(S.bil, Skills.weekStats(S.hist, today()).cur.l2, today());
    if (ad.changed) { S.bil.share = ad.share; S.bil.adaptedAt = ad.adaptedAt; }
    const plan = Skills.planLangs(n, S.bil); S.bil.carry = plan.carry; langs = plan.flags.map(f => (f ? S.bil.second : S.lang));
  }
  const qs = opts.lesson ? Chess.lessonTasks(opts.lesson, 5).map(q => Object.assign(q, { skill: 'chess' })) : buildSet(skillPool(skill, lv), lv, n, langs);
  L = { skill, lesson: opts.lesson || null, intro: !!opts.lesson, route: !!opts.route, queue: qs.slice(), total: qs.length, resolved: 0, added: 0, firstOK: 0, counted: 0, mistakes: 0, combo: 0, bestCombo: 0,
    answered: false, ok: false, sel: null, input: '', hint: false, studied: false, sec: 0, lastT: Date.now(), timer: null };
  R = 'lesson'; render();
}
function tickTime() { if (!L) return; const now = Date.now(); L.sec += Math.min(45, (now - L.lastT) / 1000); L.lastT = now; }   // время без простоя (> 45 с не считаем)

const plain = h => String(h).replace(/<[^>]*>/g, '');
const qTag = q => { const k = SK[q.skill]; return `<span class="tag" style="--c:${k.color}">${k.icon} ${P(k.name)}</span>`; };
/* Двуязычный режим: v — «вид» задания (на показанном сейчас языке); с тем же зерном числа и варианты те же, меняются только слова */
function altOf(q) { if (!q.alt) q.alt = generate(GENS.find(x => x.id === q.gid), q.d, q.seed, otherLang(q)); return q.alt; }
const view = q => (L && L.alt && q.seed != null && bilOn() ? altOf(q) : q);
const viewLang = q => (L && L.alt && q.seed != null && bilOn() ? otherLang(q) : (q.lang || S.lang));
const langChip = q => (bilOn() && q.seed != null ? `<span class="tag lg">🌍 ${LANG_NAMES[viewLang(q)]}</span>` : '');
const globeBtn = q => (bilOn() && q.seed != null ? `<button class="btn ghost glb${L.alt ? ' on' : ''}" data-a="alt" aria-label="${tt('Не понял: показать на другом языке', 'Не зразумеў: паказаць на іншай мове', `Nerozumím: ukázat v druhém jazyce`, `Don't understand: show in the other language`)}">🌐</button>` : '');
/* B4: слова из глоссария в тексте задания — по касанию показываем перевод (без штрафа) */
function glossify(html, lang) {
  return String(html).split(/(<[^>]+>)/).map(seg => {
    if (seg.startsWith('<') || !seg.trim()) return seg;
    const f = Glossary.find(seg, lang); if (!f.length) return seg;
    let out = '', pos = 0; for (const h of f) { out += seg.slice(pos, h.from) + `<span class="gw" data-a="gloss" data-g="${h.id}" data-l="${lang}" role="button" tabindex="0">${seg.slice(h.from, h.to)}</span>`; pos = h.to; }
    return out + seg.slice(pos);
  }).join('');
}
/* ---------- озвучка (F7) ---------- */
const speakOn = lang => S.speak !== 'off' && window.Speech && Speech.canSpeak(lang);
const spkBtn = q => (speakOn(viewLang(q)) ? `<button class="spk" data-a="speak" aria-label="${tt('Прочитать вслух', 'Прачытаць услых', `Přečíst nahlas`, `Read aloud`)}">🔊</button>` : '');
const qText = q => { const v = view(q); return L && q.study && !L.studied && !L.answered ? v.study.text : v.text; };
function say(html, lang, o) { if (window.Speech) Speech.say(html, lang, Object.assign({ rate: Skills.isYoungAge(S.age) ? 0.8 : 0.9 }, o)); }
function autoSpeak(q) {   // при появлении вопроса (и при смене языка кнопкой «не понял»), если у ребёнка включено «читать самой»
  if (!L || S.speak !== 'auto' || L.answered) return; const key = (q.study && !L.studied ? 's' : 'q') + (L.alt ? 'a' : 'm');
  if (L.said === q && L.saidKey === key) return; L.said = q; L.saidKey = key; const lang = viewLang(q); if (speakOn(lang)) say(qText(q), lang);
}
const FB_OK = { ru: 'Верно!', be: 'Правільна!', cs: 'Správně!', en: 'Correct!' }, FB_NO = { ru: 'Ничего, бывает!', be: 'Нічога, бывае!', cs: 'Nic se neděje!', en: 'It happens!' };
const qHTML = (q, v) => `${qTag(q)}${langChip(q)}<div class="qrow"><div class="qtext">${glossify(v.text, viewLang(q))}</div>${spkBtn(q)}</div>${v.visual ? `<div class="visual">${v.visual}</div>` : ''}`;
function lHead() {
  const prog = Math.round(L.resolved / (L.total + L.added) * 100), r = S.route;
  const right = L.route && r ? `${Math.min(r.done.length + 1, r.skills.length)}/${r.skills.length}` : SK[L.skill].icon;
  return `<div class="lhead"><button class="x" data-a="quit">✕</button><div class="bar"><i style="width:${prog}%"></i></div><div class="hp">${right}</div>${mascot('lh', false, S, { live: 1 })}</div>`;
}
/* экран «запомни»: показываем материал на несколько секунд, потом прячем (память) */
function rStudy(q) {
  clearTimeout(L.timer);
  const secs = q.study.secs, v = view(q);
  root.innerHTML = `<div class="lesson">${lHead()}<div class="qwrap">${qTag(q)}${langChip(q)}<div class="qrow"><div class="qtext">${v.study.text}</div>${spkBtn(q)}</div>
    <div class="visual studyv">${v.study.html}</div><div class="cd"><i style="animation-duration:${secs}s"></i></div></div>
    <div class="lfoot">${globeBtn(q)}<button class="btn grn" data-a="ready">${tt('Готов', 'Гатова', `Hotovo`, `Ready`)}</button></div></div>`;
  autoSpeak(q);
  L.timer = setTimeout(() => { if (L && L.queue[0] === q && !L.studied && !L.answered) { L.studied = true; rLesson(); } }, secs * 1000);
}
/* объяснение урока по шахматам: фигура, её ходы на доске и короткое правило */
function rIntro() {
  const X = Chess.LESSONS.find(x => x.id === L.lesson), ico = { capture: '⚔️', check: '⚡', mate: '🏁' };
  root.innerHTML = `<div class="lesson">${lHead()}<div class="qwrap chessintro">${qTag({ skill: 'chess' })}<div class="bi">${X.piece ? `<span class="pc b">${Chess.glyph(X.piece)}</span>` : ico[X.id]} ${esc(Chess.lessonName(X))}</div>
    ${Chess.introBoard(X.id)}<p>${esc(Chess.lessonIntro(X))}</p></div><div class="lfoot"><button class="btn grn" data-a="begin">${tt('Понятно, поехали!', 'Зразумела, паехалі!', `Jasné, jdeme na to!`, `Got it, let's go!`)}</button></div></div>`;
}
/* шахматное задание: касание фигуры → подсветка ходов → касание клетки */
function rBoard(q) {
  const E = Chess.E, v = view(q);
  if (L.bq !== q) { L.bq = q; L.bpos = E.parse(q.fen); L.bsel = null; L.bdests = []; L.tries = 0; }
  const rev = L.answered && !L.ok ? q.solutions[0] : null, hl = rev ? [E.idx(rev.slice(0, 2)), E.idx(rev.slice(2, 4))] : [];
  const board = Chess.boardHTML(L.bpos, { sel: L.bsel, dests: L.bdests, star: L.answered && L.ok ? null : q.star, tgt: q.tgt, hl, static: L.answered });
  let foot;
  if (L.answered) {
    foot = L.ok
      ? `<div class="fb ok"><div class="msg">${mascot('sm', true, S, { pose: 'happy' })}<div><b>${pick(tt(['Верно!', 'Отлично!', 'Супер!', 'Блестяще!'], ['Правільна!', 'Выдатна!', 'Суперпа!', 'Бліскуча!'], ['Správně!', 'Výborně!', 'Super!', 'Skvělé!'], ['Correct!', 'Great job!', 'Super!', 'Brilliant!']))}</b>${esc(v.explain || '')}</div></div><button class="btn grn" data-a="next">${tt('Дальше', 'Далей', `Dál`, `Next`)}</button></div>`
      : `<div class="fb no"><div class="msg">${mascot('sm', false, S, { pose: 'sad' })}<div><b>${tt('Ничего, бывает!', 'Нічога, бывае!', `Nic se neděje!`, `It happens!`)}</b>${tt('Правильный ход показан на доске.', 'Правільны ход паказаны на дошцы.', `Správný tah je ukázán na šachovnici.`, `The correct move is shown on the board.`)}<br>${esc(v.explain || '')}</div></div><button class="btn red" data-a="next">${tt('Понятно', 'Зразумела', `Jasné`, `Got it`)}</button></div>`;
  } else foot = `<div class="lfoot"><button class="btn ghost" data-a="hint" style="flex:1">💡 ${HINT_PRICE}🪙</button>${globeBtn(q)}</div>`;
  root.innerHTML = `<div class="lesson">${lHead()}<div class="qwrap">${qTag(q)}${langChip(q)}<div class="qrow"><div class="qtext">${v.text}</div>${spkBtn(q)}</div>${L.hint ? `<div class="hintbox">💡 ${esc(v.hint)}</div>` : ''}${board}</div>${foot}</div>`;
  autoSpeak(q);
}
function answerBoard(ok) {
  const q = L.queue[0]; tickTime(); L.answered = true; L.ok = ok;
  (S.recent = S.recent || []).push(sigOf(q)); if (S.recent.length > 150) S.recent.shift();
  gradeQ(q, ok && L.tries === 0, ok);   // повтор без штрафа: если решил со второй попытки, звёзды не страдают, а адаптивность видит первую попытку
  L.resolved++;
  if (ok) { L.combo++; L.bestCombo = Math.max(L.bestCombo, L.combo); S.stat.correct++; sfx.ok(); } else { L.combo = 0; sfx.no(); }
  save(); rLesson();
}
function rLesson() {
  const q = L.queue[0];
  if (L.intro) return rIntro();
  if (q.type === 'board') return rBoard(q);
  if (q.study && !L.studied && !L.answered) return rStudy(q);
  const v = view(q);
  let ans = '';
  if (q.type === 'choice') {
    const cls = q.cols === 1 ? 'c1' : q.wide || q.choices.length === 3 && q.choices.every(c => plain(c.h).length <= 2) ? 'c3' : (q.choices.some(c => plain(c.h).length > 22) ? 'c1' : '');
    ans = `<div class="opts ${cls}">` + q.choices.map((c, i) => {
      let st = ''; if (L.answered) { if (c.v === q.answer) st = ' ok'; else if (L.sel === i) st = ' no'; } else if (L.sel === i) st = ' sel';
      const k = q.big ? ' emo' : (plain(c.h).length > 12 && !/</.test(c.h) ? ' txt' : '');
      return `<button class="opt${k}${st}" data-a="pick" data-i="${i}">${v.choices[i].h}</button>`;
    }).join('') + '</div>';
  } else {
    ans = `<div class="numrow"><div class="numdisp${L.answered ? (L.ok ? ' ok' : ' no') : ''}">${L.input || '&nbsp;'}</div>` + (L.answered ? '' : '<button class="bk" data-a="key" data-k="b">⌫</button>') + '</div>' + (L.answered ? '' :
      `<div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => `<button data-a="key" data-k="${n}">${n}</button>`).join('')}</div>`);
  }
  let foot;
  if (L.answered) {
    const shown = q.type === 'choice' ? v.choices[q.choices.findIndex(c => c.v === q.answer)].h : q.answer;
    foot = L.ok
      ? `<div class="fb ok"><div class="msg">${mascot('sm', true, S, { pose: 'happy' })}<div><b>${pick(tt(['Верно!', 'Отлично!', 'Супер!', 'Так держать!', 'Блестяще!', 'Молодец!'], ['Правільна!', 'Выдатна!', 'Суперпа!', 'Так трымаць!', 'Бліскуча!', 'Малайчына!'], ['Správně!', 'Výborně!', 'Super!', 'Jen tak dál!', 'Skvělé!', 'Šikovně!'], ['Correct!', 'Great job!', 'Super!', 'Keep it up!', 'Brilliant!', 'Well done!']))}${L.combo >= 3 ? `<span class="combo">🔥 ${L.combo} ${tt('подряд', 'запар', `v řadě`, `in a row`)}</span>` : ''}</b>${esc(v.explain || '')}</div></div><button class="btn grn" data-a="next">${tt('Дальше', 'Далей', `Dál`, `Next`)}</button></div>`
      : `<div class="fb no"><div class="msg">${mascot('sm', false, S, { pose: 'sad' })}<div><b>${pick(tt(['Почти!', 'Не страшно!', 'Ничего, бывает!', 'В следующий раз получится!'], ['Амаль!', 'Не страшна!', 'Нічога, бывае!', 'У наступны раз атрымаецца!'], ['Skoro!', 'To nevadí!', 'Nic se neděje!', 'Příště to vyjde!'], ['Almost!', "Don't worry!", 'It happens!', 'You will get it next time!']))}</b>${tt('Правильный ответ', 'Правільны адказ', `Správná odpověď`, `Correct answer`)}: <b style="display:inline">${shown}</b><br>${esc(v.explain || '')}</div></div><button class="btn red" data-a="next">${tt('Понятно', 'Зразумела', `Jasné`, `Got it`)}</button></div>`;
  } else {
    const can = q.type === 'choice' ? L.sel !== null : L.input !== '';
    foot = `<div class="lfoot"><button class="btn ghost" data-a="hint">💡 ${HINT_PRICE}🪙</button>${globeBtn(q)}<button class="btn grn" data-a="check" ${can ? '' : 'disabled'}>${tt('Проверить', 'Праверыць', `Zkontrolovat`, `Check`)}</button></div>`;
  }
  root.innerHTML = `<div class="lesson">${lHead()}<div class="qwrap">${qHTML(q, v)}${L.hint ? `<div class="hintbox">💡 ${esc(v.hint)}</div>` : ''}${ans}</div>${foot}</div>`;
  autoSpeak(q);
}
/* Учёт результата вопроса: для адаптивности и отчёта — только первая попытка (firstTry); для звёзд и XP — засчитан ли (credited) */
function gradeQ(q, firstTry, credited) {
  if (q.retry) return;
  L.counted++; if (credited) L.firstOK++; else L.mistakes++;
  const ch = Skills.recordResult(S.skills[L.skill], firstTry);
  Skills.addHist(S.hist, today(), { skill: L.skill, ok: firstTry ? 1 : 0, total: 1 });
  if (q.seed != null && q.lang && q.lang !== S.lang) Skills.addHist(S.hist, today(), { l2n: 1, l2ok: firstTry ? 1 : 0 });
  if (ch === 'up') toast(tt(`🚀 Навык «${P(SK[L.skill].name)}»: уровень ${S.skills[L.skill].lvl}!`, `🚀 Навык «${P(SK[L.skill].name)}»: узровень ${S.skills[L.skill].lvl}!`, `🚀 Dovednost „${P(SK[L.skill].name)}“: úroveň ${S.skills[L.skill].lvl}!`, `🚀 Skill "${P(SK[L.skill].name)}": level ${S.skills[L.skill].lvl}!`));
}
function check() {
  const q = L.queue[0]; if (L.answered) return;
  tickTime();
  let ok;
  if (q.type === 'choice') ok = q.choices[L.sel].v === q.answer; else ok = parseInt(L.input, 10) === q.answer;
  L.answered = true; L.ok = ok;
  (S.recent = S.recent || []).push(sigOf(q)); if (S.recent.length > 150) S.recent.shift();
  gradeQ(q, ok, ok);   // для адаптивной сложности и отчёта учитывается только первая попытка
  if (ok) { L.combo++; L.bestCombo = Math.max(L.bestCombo, L.combo); L.resolved++; S.stat.correct++; sfx.ok(); }
  else {
    L.combo = 0; sfx.no();   // ошибка ничего не отнимает: ни сердечек, ни звёзд за прошлое
    if (!q.retry) { const g = GENS.find(x => x.id === q.gid), nq = (freshQ(g, q.d, new Set([sigOf(q)]), q.lang) || { q: makeQ(g, q.d, q.lang) }).q; nq.retry = true; L.queue.push(nq); L.added++; }
    else L.resolved++;   // повторный промах — засчитываем как пройденный, чтобы не зациклиться
  }
  save(); rLesson();
  if (S.speak === 'auto') { const lg = viewLang(q); if (speakOn(lg)) say(ok ? FB_OK[lg] : FB_NO[lg], lg); }
  if (window.Avatar) Avatar.react(ok ? 'happy' : 'sad');
  if (!ok) { const el = $('.fb') || root; el.classList.add('shake'); }
}
function next() {
  clearTimeout(L.timer); tickTime();
  L.queue.shift(); L.answered = false; L.sel = null; L.input = ''; L.hint = false; L.studied = false; L.alt = false;
  if (!L.queue.length) return finish();
  if (limitHit()) return endByLimit();
  rLesson(); enter($('.qwrap') || $('.lesson'));
}

/* ---------- завершение занятия ---------- */
function finish() {
  clearTimeout(L.timer); tickTime();
  const events = [], lvBefore = lvl(S.xp), total = L.counted, ok = L.firstOK, stars = Skills.starsFor(ok, total), perfect = L.mistakes === 0;
  let xp = 5 * ok + 5 + (perfect ? 10 : 0), coins = ok + stars * 2, routeDone = false;
  if (L.lesson) S.chessLessons[L.lesson] = Math.max(S.chessLessons[L.lesson] || 0, stars);
  S.starsTotal += stars; S.stat.lessons++; if (perfect) S.stat.perfect++; S.stat.bestCombo = Math.max(S.stat.bestCombo, L.bestCombo);
  Skills.addHist(S.hist, today(), { sec: L.sec, ses: 1 }); Skills.pruneHist(S.hist, today());
  if (L.route && S.route && !L.early) {
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
  const nx = S.route && L.route && !L.early ? S.route.skills.find(k => !S.route.done.includes(k)) : null;
  const li = L.lesson ? Chess.LESSONS.findIndex(x => x.id === L.lesson) : -1;
  RES = { early: !!L.early, skill: L.skill, lesson: L.lesson, nextLesson: li >= 0 && li < Chess.LESSONS.length - 1 ? Chess.LESSONS[li + 1].id : null, stars, xp, coins, events, right: ok, total, route: L.route, routeDone, next: nx, tot: S.route && S.route.tot };
  R = 'result'; render();
}
function rResult() {
  const r = RES, k = SK[r.skill];
  if (r.routeDone) {
    const t = r.tot;
    root.innerHTML = `<div class="result"><div style="font-size:70px">🌙</div><h1>${tt('На сегодня всё!', 'На сёння ўсё!', `Pro dnešek hotovo!`, `That's all for today!`)}</h1>
      <div class="sub">${tt('Отличная работа! Завтра — новый маршрут.', 'Выдатная праца! Заўтра — новы маршрут.', `Skvělá práce! Zítra tě čeká nová trasa.`, `Great work! A new route is waiting tomorrow.`)}</div>
      ${mascot('big', false, S, { live: 1, pose: 'happy' })}
      <div class="rew"><div><b>+${t.xp}</b>XP</div><div><b>+${t.coins}</b>${tt('монет', 'манет', `mincí`, `coins`)} 🪙</div><div><b>${t.ok}/${t.total}</b>${tt('верно', 'правільна', `správně`, `correct`)} ✓</div></div>
      ${r.events.map(e => `<div class="evt">${e.i} ${e.t}</div>`).join('')}
      <div class="acts"><button class="btn grn" data-a="home">${tt('На главный экран', 'На галоўны экран', `Na hlavní obrazovku`, `Home`)}</button></div></div>`;
    return;
  }
  const title = r.stars === 3 ? tt('Идеально!', 'Ідэальна!', `Perfektní!`, `Perfect!`) : r.route ? tt('Мини-игра пройдена!', 'Міні-гульня пройдзена!', `Minihra splněna!`, `Mini-game complete!`) : tt('Занятие завершено!', 'Занятак завершаны!', `Trénink dokončen!`, `Session complete!`);
  root.innerHTML = `<div class="result">${mascot('big', false, S, { live: 1, pose: 'happy' })}<h1>${title}</h1>
    <div class="sub">${tt(`Верно с первого раза: ${r.right} из ${r.total}`, `Правільна з першага разу: ${r.right} з ${r.total}`, `Správně na první pokus: ${r.right} z ${r.total}`, `Right first time: ${r.right} of ${r.total}`)}</div>
    <div class="stars">${[1, 2, 3].map(i => `<span class="${i <= r.stars ? 'on' : ''}">⭐</span>`).join('')}</div>
    <div class="rew"><div><b>+${r.xp}</b>XP</div><div><b>+${r.coins}</b>${tt('монет', 'манет', `mincí`, `coins`)} 🪙</div><div><b>${k.icon} ${S.skills[r.skill].lvl}</b>${tt('уровень навыка', 'узровень навыку', `úroveň dovednosti`, `skill level`)}</div></div>
    ${r.early ? `<div class="evt">🌙 ${tt('Время на сегодня вышло — отдохни. Всё, что решено, сохранено.', 'Час на сёння скончыўся — адпачні. Усё, што вырашана, захавана.', `Čas pro dnešek vypršel – odpočiň si. Vše vyřešené je uloženo.`, `Time is up for today – have a rest. Everything you solved is saved.`)}</div>` : ''}
    ${r.events.map(e => `<div class="evt">${e.i} ${e.t}</div>`).join('')}
    <div class="acts">${r.route && r.next ? `<button class="btn grn" data-a="route">${tt('Дальше', 'Далей', `Dál`, `Next`)}: ${SK[r.next].icon} ${P(SK[r.next].name)} ▶</button>` : ''}
      ${r.nextLesson ? `<button class="btn grn" data-a="clesson" data-id="${r.nextLesson}">${tt('Следующий урок ▶', 'Наступны ўрок ▶', `Další lekce ▶`, `Next lesson ▶`)}</button>` : ''}
      <button class="btn ${(r.route && r.next) || r.nextLesson ? 'ghost' : 'grn'}" data-a="${r.lesson ? 'chess' : 'home'}">${r.lesson ? tt('К урокам и задачам', 'Да ўрокаў і задач', `K lekcím a úlohám`, `Back to lessons`) : tt('На главный экран', 'На галоўны экран', `Na hlavní obrazovku`, `Home`)}</button>
      ${r.route || r.early ? '' : `<button class="btn ghost" data-a="again">${tt('Ещё раз', 'Яшчэ раз', `Ještě jednou`, `Again`)}</button>`}</div></div>`;
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
const prefetchFb = () => { if (!fbP && FAM.consent.cloud) fbInit().catch(() => {}); };
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
  m.name = nw.name || ol.name; m.age = nw.age || ol.age || 0; m.xp = Math.max(a.xp, b.xp);
  m.pets = union(a.pets, b.pets); m.hats = union(a.hats, b.hats);
  m.pet = m.pets.includes(nw.pet) ? nw.pet : (m.pets[0] || ''); m.hat = (!nw.hat || m.hats.includes(nw.hat)) ? nw.hat : '';
  m.ach = Object.assign({}, ol.ach, nw.ach);
  m.stat = {}; for (const k of new Set([...Object.keys(a.stat), ...Object.keys(b.stat)])) m.stat[k] = Math.max(a.stat[k] || 0, b.stat[k] || 0);
  m.starsTotal = Math.max(a.starsTotal || 0, b.starsTotal || 0);
  m.chessLessons = {}; for (const k of new Set([...Object.keys(a.chessLessons || {}), ...Object.keys(b.chessLessons || {})])) m.chessLessons[k] = Math.max((a.chessLessons || {})[k] || 0, (b.chessLessons || {})[k] || 0);
  m.words = {}; for (const k of new Set([...Object.keys(a.words || {}), ...Object.keys(b.words || {})])) m.words[k] = Math.max((a.words || {})[k] || 0, (b.words || {})[k] || 0);
  m.skills = Skills.mergeSkills(a.skills, b.skills); m.hist = Skills.mergeHist(a.hist, b.hist);
  m.route = (a.route && b.route && a.route.date === b.route.date) ? (a.route.done.length >= b.route.done.length ? a.route : b.route) : nw.route;
    m.bil = Skills.mergeBil(Skills.fixBil(nw.bil), Skills.fixBil(ol.bil));
  m.recent = union(ol.recent, nw.recent).slice(-150);
  for (const k of [...OLD_KEYS, 'done', 'parent']) delete m[k];
  m.lang = a.lang; m.sound = a.sound; m.ts = Math.max(a.ts || 0, b.ts || 0);
  return clone(m);
}
/* Объединение семьи: дети сопоставляются по id; пустой «новый» профиль на этом устройстве не плодит дубликатов */
function mergeFam(a, b) {
  const out = { kids: [], parent: Skills.mergeParent(Skills.fixParent(a.parent), Skills.fixParent(b.parent)), active: a.active };
  const bm = new Map(b.kids.map(k => [k.id, k])), seen = new Set();
  for (const ka of a.kids) {
    const kb = bm.get(ka.id); seen.add(ka.id);
    if (!kb && b.kids.length && isFresh(ka)) continue;
    const m = kb ? mergeStates(ka, kb) : clone(ka); m.id = ka.id; delete m.parent; out.kids.push(m);
  }
  for (const kb of b.kids) if (!seen.has(kb.id)) out.kids.push(clone(kb));
  return out;
}
const famFromCloud = d => d && d.fam && Array.isArray(d.fam.kids) ? d.fam
  : d && d.s ? { kids: [Object.assign({}, d.s, { id: d.s.id || 'k1' })], parent: d.s.parent, active: d.s.id || 'k1' } : null;
let noPush = false;
async function pushNow() {
  if (!fbUser || !fbDb || noPush) return;
  await fbDb.collection('users').doc(fbUser.uid).set({ fam: famJSON(true), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
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
    const snap = await fbDb.collection('users').doc(user.uid).get(), remote = snap.exists ? famFromCloud(snap.data() || {}) : null;
    if (remote) {
      const keep = S.id, rk = remote.kids.map(k => Object.assign(norm(k), { id: k.id || 'k1' }));
      setFam(mergeFam({ kids: FAM.kids, parent: FAM.parent, active: S.id }, { kids: rk, parent: remote.parent }));
      if (keep && FAM.kids.some(k => k.id === keep)) useKid(keep);
    }
    if (pinResetPending) { pinResetPending = false; S.parent.pin = ''; S.parent.salt = ''; PN = { mode: 'set', buf: '', first: '', next: 'parent', back: 'profile', err: '' }; R = 'pin'; }
    save({ nopush: true }); await pushNow(); setCloud('ok');
    if (S.name && R === 'onboard') R = FAM.kids.length > 1 ? 'who' : 'home';
    if (R !== 'lesson' && R !== 'result') render();
  } catch (e) { console.warn('cloud', e); setCloud('error'); }
}
const cloudText = () => ({ syncing: tt('Сохраняю…', 'Захоўваю…', `Ukládám…`, `Saving…`), ok: tt('Прогресс сохранён в облаке', 'Прагрэс захаваны ў воблаку', `Postup je uložen v cloudu`, `Progress saved in the cloud`),
  error: tt('Не удалось сохранить — проверь интернет', 'Не атрымалася захаваць — праверы інтэрнэт', `Uložení se nepovedlo – zkontroluj připojení`, `Could not save – check your internet`), off: '' })[cloudState];
function askCloudConsent(then) {
  modal({ icon: '☁️', title: tt('Включить облако Google?', 'Уключыць воблака Google?', `Zapnout cloud Google?`, `Turn on Google cloud?`),
    text: tt('Согласие даёт родитель. Чтобы сохранять прогресс в облаке, приложение подключит сервис Google Firebase (вход и хранилище): Google получит e-mail родителя и данные профилей детей — имя или псевдоним, возраст и результаты. Это необязательно: без облака всё работает на устройстве. Согласие можно отозвать в «Родительской зоне».',
      'Згоду дае бацька. Каб захоўваць прагрэс у воблаку, праграма падключыць сэрвіс Google Firebase (уваход і сховішча): Google атрымае e-mail бацькоў і даныя профіляў дзяцей — імя або псеўданім, узрост і вынікі. Гэта неабавязкова: без воблака ўсё працуе на прыладзе. Згоду можна адклікаць у «Бацькоўскай зоне».',
      `Souhlas uděluje rodič. Pro ukládání postupu do cloudu aplikace připojí službu Google Firebase (přihlášení a úložiště): Google získá e-mail rodiče a údaje o profilech dětí – jméno či přezdívku, věk a výsledky. Je to dobrovolné: bez cloudu vše funguje v zařízení. Souhlas lze odvolat v „Rodičovské zóně“.`,
      `A parent gives this consent. To save progress in the cloud the app connects Google Firebase (sign-in and storage): Google receives the parent’s e-mail and the children’s profile data – name or nickname, age and results. It is optional: without the cloud everything works on the device. You can withdraw consent in the Parents’ zone.`),
    btns: [{ t: tt('Согласен, войти', 'Згодны, увайсці', `Souhlasím, přihlásit`, `I agree, sign in`), c: 'grn', f: () => { FAM.consent.cloud = new Date().toISOString(); save({ nopush: true }); fbInit().then(then).catch(() => toast(tt('Нет интернета или Google недоступен', 'Няма інтэрнэту або Google недаступны', `Žádné připojení, nebo je Google nedostupný`, `No internet or Google is unavailable`))); } },
      { t: tt('Не сейчас', 'Не цяпер', `Teď ne`, `Not now`), c: 'ghost', f: () => { pinResetPending = false; } }] });
}
function login() {
  if (!FAM.consent.cloud) { askCloudConsent(() => login()); return; }
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
/* ---------- экспорт и удаление данных (GDPR) ---------- */
const exportData = () => ({ app: 'umniki', format: 1, exportedAt: new Date().toISOString(),
  family: { dailyLimitMin: FAM.parent.limit, parentPinSet: Skills.hasPin(FAM.parent) }, consent: clone(FAM.consent),
  children: FAM.kids.map(k => { const c = clone(k); delete c.parent; return c; }) });
function downloadJSON(name, obj) {
  const text = JSON.stringify(obj, null, 2), blob = new Blob([text], { type: 'application/json' });
  try { const f = new File([blob], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: name }).catch(() => {}); return; } } catch (e) {}
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
async function cloudErase() {   // удаляет документ семьи и аккаунт Firebase; false — если не вышло
  if (!fbUser || !fbDb) return true;
  try { clearTimeout(pushTimer); pushTimer = null; await fbDb.collection('users').doc(fbUser.uid).delete(); } catch (e) { return false; }
  try { await fbUser.delete(); } catch (e) { /* нужен свежий вход — просто выходим, данных в облаке уже нет */ }
  return true;
}
const A = {
  lang(el) { const v = ($('#nm') || {}).value; if (v !== undefined && !S.name) S.name = v; S.lang = el.dataset.l; if (S.bil.second === S.lang) S.bil.second = ''; setLang(S.lang); document.documentElement.lang = S.lang; document.title = tt('Умники', 'Разумнікі', `Chytráci`, `Smart Kids`); phrase = newPhrase(); save(); if (R === 'onboard' || !S.name) { rOnboard(); const i = $('#nm'); if (i) i.value = S.name; } else render(); },
  profile() { sfx.tap(); R = 'profile'; render(); },
  login() { login(); },
  logout() { logout(); },
  gloss(el) {
    const t = Glossary.byId[el.dataset.g]; if (!t) return;
    const lg = el.dataset.l, others = Glossary.LANGS.filter(l => l !== lg), sec = S.bil.second;
    S.words[t.id] = (S.words[t.id] || 0) + 1; save(); sfx.tap();
    modal({ icon: '📖', title: esc(t[lg]), text: others.map(l => `<div style="margin:4px 0;${l === sec ? 'font-size:1.15em' : ''}"><small style="opacity:.7">${LANG_NAMES[l]}</small><br><b>${esc(t[l])}</b></div>`).join(''), btns: [{ t: tt('Понятно', 'Зразумела', `Jasné`, `Got it`), c: 'grn', f: () => {} }] });
  },
  glossary() { GB = R; sfx.tap(); R = 'gloss'; render(); },
  glossback() { R = GB === 'parent' ? 'parent' : 'profile'; render(); },
  privacy() { if (R !== 'privacy') PB = R; sfx.tap(); R = 'privacy'; render(); },
  privback() { R = PB || 'profile'; render(); },
  cbok() { FAM.consent.seen = new Date().toISOString(); save({ nopush: true }); renderBanner(); },
  exportdata() { downloadJSON('umniki-data-' + today() + '.json', exportData()); toast(tt('Файл с данными готов ✓', 'Файл з данымі гатовы ✓', `Soubor s daty je připraven ✓`, `Data file is ready ✓`)); },
  withdraw() {
    modal({ icon: '↩️', title: tt('Отозвать согласие на облако?', 'Адклікаць згоду на воблака?', `Odvolat souhlas s cloudem?`, `Withdraw cloud consent?`), text: tt('Вход через Google выключится, а данные в облаке будут удалены. На этом устройстве всё останется.', 'Уваход праз Google выключыцца, а даныя ў воблаку будуць выдалены. На гэтай прыладзе ўсё застанецца.', `Přihlášení přes Google se vypne a data v cloudu se smažou. V tomto zařízení vše zůstane.`, `Google sign-in will be turned off and the data in the cloud deleted. Everything stays on this device.`),
      btns: [{ t: tt('Оставить', 'Пакінуць', `Nechat`, `Keep`), c: 'grn', f: () => {} }, { t: tt('Отозвать и удалить из облака', 'Адклікаць і выдаліць з воблака', `Odvolat a smazat z cloudu`, `Withdraw and delete from cloud`), c: 'red', f: async () => {
        if (!(await cloudErase())) { toast(tt('Не удалось связаться с облаком — проверьте интернет', 'Не атрымалася звязацца з воблакам — праверце інтэрнэт', `Nepodařilo se spojit s cloudem – zkontrolujte připojení`, `Could not reach the cloud – check your internet`)); return; }
        if (fbAuth) { try { await fbAuth.signOut(); } catch (e) {} } setCloudFlag(false); FAM.consent.cloud = ''; save({ nopush: true }); toast(tt('Согласие отозвано, данные в облаке удалены ✓', 'Згода адкліканая, даныя ў воблаку выдалены ✓', `Souhlas odvolán, data v cloudu smazána ✓`, `Consent withdrawn, cloud data deleted ✓`)); render(); } }] });
  },
  eraseall() {
    const cloudLeft = !fbUser && FAM.consent.cloud;
    modal({ icon: '🗑', title: tt('Удалить все данные?', 'Выдаліць усе даныя?', `Smazat všechna data?`, `Delete all data?`), text: tt('Будут навсегда удалены профили всех детей, прогресс, PIN и настройки' + (fbUser ? ', в том числе из облака.' : '.'), 'Будуць назаўсёды выдалены профілі ўсіх дзяцей, прагрэс, PIN і налады' + (fbUser ? ', у тым ліку з воблака.' : '.'), 'Navždy se smažou profily všech dětí, postup, PIN a nastavení' + (fbUser ? ', včetně cloudu.' : '.'), 'The profiles of all children, progress, PIN and settings will be deleted forever' + (fbUser ? ', including the cloud.' : '.'))
        + (cloudLeft ? tt(' Вы не вошли в Google, поэтому копия в облаке останется: сначала войдите и повторите удаление.', ' Вы не ўвайшлі ў Google, таму копія ў воблаку застанецца: спачатку ўвайдзіце і паўтарыце выдаленне.', ` Nejste přihlášeni ke Googlu, takže kopie v cloudu zůstane: nejdřív se přihlaste a smazání zopakujte.`, ` You are not signed in to Google, so the cloud copy would stay: sign in first and repeat the deletion.`) : ''),
      btns: [{ t: tt('Оставить', 'Пакінуць', `Nechat`, `Keep`), c: 'grn', f: () => {} }, { t: tt('Да, удалить всё', 'Так, выдаліць усё', `Ano, smazat vše`, `Yes, delete everything`), c: 'red', f: async () => {
        if (!(await cloudErase())) { toast(tt('Не удалось удалить из облака — проверьте интернет и повторите', 'Не атрымалася выдаліць з воблака — праверце інтэрнэт і паўтарыце', `Smazání z cloudu se nepovedlo – zkontrolujte připojení a zopakujte`, `Could not delete from the cloud – check your internet and try again`)); return; }
        noPush = true; clearTimeout(pushTimer); try { Object.keys(localStorage).filter(k => k.startsWith('umniki')).forEach(k => localStorage.removeItem(k)); } catch (e) {} location.reload(); } }] });
  },
  who(el) { useKid(el.dataset.id); parentOK = false; R = 'home'; phrase = newPhrase(); save({ nopush: true }); render(); },
  switchkid() { sfx.tap(); R = 'who'; render(); },
  pkid(el) { useKid(el.dataset.id); phrase = newPhrase(); save({ nopush: true }); sfx.tap(); render(); },
  kadd() { if (FAM.kids.length >= MAX_KIDS) return; KF = { id: '', name: '', age: 0, pet: ['🐱', '🐶', '🐰', '🦊', '🐼', '🐸'].find(e => !FAM.kids.some(k => k.pet === e)) || '🐱' }; sfx.tap(); R = 'kid'; render(); },
  kedit(el) { const k = FAM.kids.find(x => x.id === el.dataset.id); if (!k) return; KF = { id: k.id, name: k.name, age: k.age, pet: k.pet }; sfx.tap(); R = 'kid'; render(); },
  kage(el) { KF.age = +el.dataset.n; KF.name = ($('#kn') || {}).value || ''; rKid(); const i = $('#kn'); if (i) i.value = KF.name; },
  kpet(el) { KF.pet = el.dataset.e; KF.name = ($('#kn') || {}).value || ''; rKid(); const i = $('#kn'); if (i) i.value = KF.name; },
  kback() { R = 'parent'; render(); },
  ksave() {
    const name = (($('#kn') || {}).value || '').trim().slice(0, 14);
    if (!name) { toast(tt('Напишите имя', 'Напішыце імя', `Napište jméno`, `Type a name`)); return; }
    if (!KF.age) { toast(tt('Выберите возраст', 'Абярыце ўзрост', `Vyberte věk`, `Pick an age`)); return; }
    if (!KF.id) {
      const k = Object.assign(defState(), { id: newId(), name, age: KF.age, pet: KF.pet, pets: [KF.pet], skills: Skills.newSkills(KF.age), lang: S.lang, speak: speakDefault(KF.age) }); delete k.parent; FAM.kids.push(k);
    } else {
      const k = FAM.kids.find(x => x.id === KF.id); if (!k) return;
      k.name = name; if (k.age !== KF.age) { k.age = KF.age; Skills.applyAge(k.skills, k.age); if (!k.speakSet) k.speak = speakDefault(k.age); }
    }
    save(); sfx.ok(); R = 'parent'; render();
  },
  kdel() {
    const k = FAM.kids.find(x => x.id === KF.id); if (!k || FAM.kids.length < 2) return;
    modal({ icon: '🗑', title: tt(`Удалить профиль «${k.name}»?`, `Выдаліць профіль «${k.name}»?`, `Smazat profil „${k.name}“?`, `Delete the profile “${k.name}”?`), text: tt('Весь прогресс этого ребёнка будет удалён' + (fbUser ? ' (и в облаке тоже).' : '.'), 'Увесь прагрэс гэтага дзіцяці будзе выдалены' + (fbUser ? ' (і ў воблаку таксама).' : '.'), 'Veškerý postup tohoto dítěte bude smazán' + (fbUser ? ' (i v cloudu).' : '.'), 'All of this child’s progress will be deleted' + (fbUser ? ' (in the cloud too).' : '.')),
      btns: [{ t: tt('Оставить', 'Пакінуць', `Nechat`, `Keep`), c: 'grn', f: () => {} }, { t: tt('Да, удалить', 'Так, выдаліць', `Ano, smazat`, `Yes, delete`), c: 'red', f: () => { FAM.kids = FAM.kids.filter(x => x.id !== k.id); if (S.id === k.id) useKid(FAM.kids[0].id); save(); R = 'parent'; render(); } }] });
  },
  obage(el) { ob.age = +el.dataset.n; const v = ($('#nm') || {}).value; if (v !== undefined) S.name = v; rOnboard(); const i = $('#nm'); if (i) i.value = S.name; },
  obpet(el) { ob.pet = el.dataset.e; const v = ($('#nm') || {}).value; if (v !== undefined) S.name = v; rOnboard(); const i = $('#nm'); if (i) i.value = S.name; },
  obstart() {
    const v = ($('#nm').value || '').trim();
    if (!v) { toast(tt('Напиши своё имя 🙂', 'Напішы сваё імя 🙂', `Napiš své jméno 🙂`, `Type your name 🙂`)); return; }
    if (!ob.age) { toast(tt('Выбери свой возраст 🙂', 'Абяры свой ўзрост 🙂', `Vyber svůj věk 🙂`, `Pick your age 🙂`)); return; }
    S.id = S.id || newId(); S.name = v; S.age = ob.age; S.speak = speakDefault(ob.age); S.skills = Skills.newSkills(ob.age); S.pet = ob.pet; S.pets = [ob.pet];
    if (!FAM.kids.includes(S)) FAM.kids.push(S);
    save(); R = 'home'; render();
  },
  goto(el) { R = el.dataset.t; phrase = newPhrase(); render(); },
  home() { R = 'home'; phrase = newPhrase(); render(); },
  route() {
    sfx.tap(); const r = Skills.ensureRoute(S, today(), availSkills()), nx = r.skills.find(k => !r.done.includes(k));
    if (nx) startSession(nx, { n: ROUTE_QPL, route: true });
  },
  skill(el) { sfx.tap(); if (el.dataset.s === 'chess') { R = 'chess'; render(); } else startSession(el.dataset.s); },
  chess() { R = 'chess'; render(); },
  cpractice() { sfx.tap(); startSession('chess'); },
  clesson(el) { sfx.tap(); startSession('chess', { lesson: el.dataset.id }); },
  begin() { if (L && L.intro) { L.intro = false; L.lastT = Date.now(); rLesson(); } },
  sq(el) {
    if (!L || L.answered || L.intro) return; const q = L.queue[0]; if (q.type !== 'board') return;
    const E = Chess.E, i = +el.dataset.i, b = L.bpos.b;
    if (L.bsel != null && L.bdests.includes(i)) {
      const mv = E.name(L.bsel) + E.name(i);
      if (q.solutions.includes(mv)) { L.bpos = E.applyMove(L.bpos, L.bsel, i); L.bpos.turn = 'w'; L.bsel = null; L.bdests = []; answerBoard(true); return; }
      L.tries++; L.bsel = null; L.bdests = [];
      if (L.tries >= 2) { answerBoard(false); return; }
      toast(tt('Попробуй ещё — это не считается ошибкой 🙂', 'Паспрабуй яшчэ — гэта не лічыцца памылкай 🙂', `Zkus to znovu – není to chyba 🙂`, `Try again – it doesn't count as a mistake 🙂`)); sfx.no(); rLesson(); return;
    }
    if (b[i] && E.isW(b[i])) { if (L.bsel === i) { L.bsel = null; L.bdests = []; } else { L.bsel = i; L.bdests = E.destinations(L.bpos, i); } sfx.tap(); }
    else { L.bsel = null; L.bdests = []; }
    rLesson();
  },
  again() { startSession(RES.skill, RES.lesson ? { lesson: RES.lesson } : {}); },
  pick(el) {
    if (L.answered) return; L.sel = +el.dataset.i; sfx.tap(); rLesson();
    if (S.speak === 'auto') { const q = L.queue[0], c = q.choices && q.choices[L.sel], lg = viewLang(q); if (c && speakOn(lg) && plain(c.h).length <= 40) say(c.h, lg); }   // выбранный вариант тоже называем
  },
  speak() {
    const q = L && L.queue[0]; if (!q) return; const lg = viewLang(q);
    if (window.Speech && Speech.speaking()) { Speech.stop(); return; } if (speakOn(lg)) say(qText(q), lg);
  },
  speakmode(el) { S.speak = el.dataset.m; S.speakSet = true; save(); sfx.tap(); render(); if (window.Speech) { Speech.unlock(); if (S.speak !== 'off' && Speech.canSpeak(S.lang)) say(tt('Привет! Я буду читать задания вслух.', 'Прывітанне! Я буду чытаць заданні ўслых.', `Ahoj! Budu ti číst úlohy nahlas.`, `Hi! I will read the tasks aloud.`), S.lang); } },
  key(el) { press(el.dataset.k); },
  check() { const b = $('[data-a=check]'); if (b && !b.disabled) check(); },
  next() { next(); },
  alt() {
    if (!L) return; const q = L.queue[0]; if (!q || q.seed == null || !bilOn()) return;
    L.alt = !L.alt; sfx.tap();
    if (!q.tapped) { q.tapped = true; Skills.addHist(S.hist, today(), { tap: 1, hard: L.skill }); save(); }   // «не понял» не стоит ни звёзд, ни ошибки
    rLesson();
  },
  bilsecond(el) { S.bil.second = el.dataset.l || ''; S.bil.carry = 0; save(); sfx.tap(); render(); },
  bilmode(el) { S.bil.mode = el.dataset.m; S.bil.carry = 0; save(); sfx.tap(); render(); },
  bilshare(el) { S.bil.share = +el.dataset.m; S.bil.carry = 0; S.bil.adaptedAt = ''; save(); sfx.tap(); render(); },
  biladapt() { S.bil.adapt = !S.bil.adapt; save(); sfx.tap(); render(); },
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
  print() { window.print(); },
  parentzone(el) { sfx.tap(); PN = { mode: Skills.hasPin(S.parent) ? 'enter' : 'set', buf: '', first: '', next: 'parent', back: (el && el.dataset && el.dataset.back) || 'profile', err: '' }; R = 'pin'; render(); },
  parentlock(el) { A.parentzone(el); },
  parentadd(el) { A.parentzone(el); },
  whoami() { sfx.tap(); if (FAM.kids.length > 1) { R = 'who'; } else { R = 'profile'; } render(); },
  timeupparent() { sfx.tap(); PN = { mode: Skills.hasPin(S.parent) ? 'enter' : 'set', buf: '', first: '', next: 'extra', back: 'timeup', err: '' }; R = 'pin'; render(); },
  changepin() { PN = { mode: 'set', buf: '', first: '', next: 'parent', back: 'parent', err: '' }; parentOK = true; R = 'pin'; render(); },
  pinkey(el) { if (PN) pinEnter(el.dataset.k); },
  pinback() { const b = (PN && PN.back) || 'profile'; if (b === 'parent') parentOK = true; R = b; render(); },
  pinforgot() {
    modal({ icon: '🔑', title: tt('Забыли PIN?', 'Забыліся на PIN?', `Zapomněli jste PIN?`, `Forgot the PIN?`), text: tt('Сбросить PIN можно, войдя через Google в аккаунт родителя. Прогресс сохранится.', 'Скінуць PIN можна, увайшоўшы праз Google у акаўнт бацькоў. Прагрэс захаваецца.', `PIN lze obnovit přihlášením přes Google do účtu rodiče. Postup zůstane zachován.`, `You can reset the PIN by signing in with the parent's Google account. Progress is kept.`),
      btns: [{ t: tt('Войти через Google', 'Увайсці праз Google', `Přihlásit se přes Google`, `Sign in with Google`), c: 'blu', f: () => { pinResetPending = true; login(); } }, { t: tt('Отмена', 'Адмена', `Zrušit`, `Cancel`), c: 'ghost', f: () => {} }] });
  },
  lockparent() { parentOK = false; R = 'profile'; render(); },
  limit(el) { S.parent.limit = +el.dataset.m; save(); sfx.tap(); render(); },
  sound() { S.sound = !S.sound; save(); sfx.tap(); render(); },
  rename() { const n = (prompt(tt('Как тебя зовут?', 'Як цябе клічуць?', `Jak se jmenuješ?`, `What is your name?`), S.name) || '').trim(); if (n) { S.name = n.slice(0, 14); save(); render(); } },
  reset() { modal({ icon: '🗑', title: tt(`Начать заново для «${S.name}»?`, `Пачаць зноў для «${S.name}»?`, `Začít znovu pro „${S.name}“?`, `Start over for “${S.name}”?`), text: tt('Весь прогресс, монеты и питомцы этого ребёнка будут удалены' + (fbUser ? ' (и в облаке тоже).' : '.'), 'Увесь прагрэс, манеты і гадаванцы гэтага дзіцяці будуць выдалены' + (fbUser ? ' (і ў воблаку таксама).' : '.'),
    'Veškerý postup, mince a kamarádi tohoto dítěte budou smazáni' + (fbUser ? ' (i v cloudu).' : '.'), 'All progress, coins and pets of this child will be deleted' + (fbUser ? ' (in the cloud too).' : '.')),
    btns: [{ t: tt('Оставить как есть', 'Пакінуць як ёсць', 'Nechat jak je', 'Keep it'), c: 'grn', f: () => {} }, { t: tt('Да, удалить', 'Так, выдаліць', 'Ano, smazat', 'Yes, delete'), c: 'red', f: () => {
      const pet = S.pets[0] || S.pet || '🐱', k = Object.assign(defState(), { id: S.id, name: S.name, age: S.age, lang: S.lang, pet, pets: [pet], skills: Skills.newSkills(S.age) }); delete k.parent;
      FAM.kids[FAM.kids.indexOf(S)] = k; useKid(k.id); parentOK = false; save(); R = 'home'; render(); } }] }); },
};
document.addEventListener('click', e => {
  const mi = e.target.closest('[data-mi]');
  if (mi) { const m = $('#modal'), b = m._btns && m._btns[+mi.dataset.mi]; closeModal(); if (b) b.f(); return; }
  const el = e.target.closest('[data-a]'); if (!el) return;
  if (window.Speech) Speech.unlock();
  if (!ac && S.sound) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (er) {} }
  const f = A[el.dataset.a]; if (f) f(el);
});
document.addEventListener('input', e => { if (e.target && e.target.id === 'gq') { const g = $('#gl'); if (g) g.innerHTML = glossList(e.target.value); } });
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('gw')) { e.preventDefault(); A.gloss(e.target); return; }
  if (R !== 'lesson' || !L || $('#modal').innerHTML) return;
  const q = L.queue[0];
  if (L.intro) { if (e.key === 'Enter') A.begin(); return; }
  if (q.type === 'board') return;
  if (q.study && !L.studied) { if (e.key === 'Enter') A.ready(); return; }
  if (e.key === 'Enter') { if (L.answered) next(); else A.check(); }
  else if (!L.answered && q.type === 'num') { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('b'); }
  else if (!L.answered && q.type === 'choice' && /^[1-4]$/.test(e.key) && q.choices[+e.key - 1]) { L.sel = +e.key - 1; rLesson(); }
});

/* ======================== Запуск ======================== */
if (window.Avatar) { let hq = 0; new MutationObserver(() => { cancelAnimationFrame(hq); hq = requestAnimationFrame(() => Avatar.hydrate(document)); }).observe(root, { childList: true }); }
load(); phrase = newPhrase(); if (FAM.kids.length > 1) R = 'who'; render();
if (cloudFlag() && FAM.consent.cloud) fbInit().catch(() => {});
try { if (window.top !== window.self) document.documentElement.classList.add('embed'); } catch (e) { document.documentElement.classList.add('embed'); }
const up = $('#totop');
up.setAttribute('aria-label', tt('Наверх', 'Угару', `Nahoru`, `Up`));
up.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
window.addEventListener('scroll', () => { up.hidden = !(window.scrollY > 400 && ['home', 'shop', 'awards'].includes(R)); }, { passive: true });
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  const had = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !reloaded && R !== 'lesson') { reloaded = true; location.reload(); } });   // вышла новая версия — подхватываем сразу
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => r.update().catch(() => {})).catch(() => {});
}
window.__umniki = { speakOn, BUILD, load, exportData, Avatar: window.Avatar, cloudErase, glossify, FAM: () => FAM, useKid, mergeFam, norm, setFam, famJSON, GENS, S: () => S, L: () => L, A, buildSet, skillPool, sigOf, Chess, mergeStates, defState, clone, SK, availSkills, render, save, setR: v => { R = v; }, unlockParent: () => { parentOK = true; }, clearPinLock: () => { pinLockUntil = 0; pinFails = 0; }, limitLeft };
})();
