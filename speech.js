'use strict';
/* Озвучка заданий (F7) голосом самого устройства (Web Speech API): бесплатно, без загрузки файлов, текст никуда не уходит.
   normalize() превращает текст задания в то, что можно произнести: убирает разметку, называет эмодзи, читает знаки и дроби.
   Названия предметов — в единственном числе, именительном падеже (так проще всего и без грамматических ошибок в 4 языках). */
(function (root) {
const LANGS = ['ru', 'be', 'cs', 'en'];
const NAMES = {  // эмодзи: ru, be, cs, en
  '🚗': ['машина', 'машына', 'auto', 'car'], '⭐': ['звезда', 'зорка', 'hvězda', 'star'], '🍓': ['клубника', 'трускаўка', 'jahoda', 'strawberry'], '🍎': ['яблоко', 'яблык', 'jablko', 'apple'],
  '🦊': ['лиса', 'ліса', 'liška', 'fox'], '🎁': ['подарок', 'падарунак', 'dárek', 'present'], '🍌': ['банан', 'банан', 'banán', 'banana'], '🍉': ['арбуз', 'кавун', 'meloun', 'watermelon'],
  '🐻': ['медведь', 'мядзведзь', 'medvěd', 'bear'], '🐶': ['собака', 'сабака', 'pes', 'dog'], '🧸': ['мишка', 'мішка', 'medvídek', 'teddy bear'], '🐰': ['зайчик', 'зайчык', 'králíček', 'bunny'],
  '🍊': ['апельсин', 'апельсін', 'pomeranč', 'orange'], '🔔': ['колокольчик', 'званок', 'zvonek', 'bell'], '🎈': ['шарик', 'шарык', 'balónek', 'balloon'], '🐭': ['мышка', 'мышка', 'myška', 'mouse'],
  '🐱': ['кошка', 'кошка', 'kočka', 'cat'], '🐸': ['лягушка', 'жаба', 'žába', 'frog'], '🐼': ['панда', 'панда', 'panda', 'panda'], '⚽': ['мяч', 'мяч', 'míč', 'ball'],
  '🐵': ['обезьянка', 'малпа', 'opice', 'monkey'], '🍇': ['виноград', 'вінаград', 'hrozny', 'grapes'], '🐔': ['курица', 'курыца', 'kuře', 'chicken'], '🌸': ['цветок', 'кветка', 'květina', 'flower'],
  '🔑': ['ключ', 'ключ', 'klíč', 'key'], '🐝': ['пчела', 'пчала', 'včela', 'bee'], '🦷': ['зуб', 'зуб', 'zub', 'tooth'], '✏': ['карандаш', 'аловак', 'tužka', 'pencil'], '☂': ['зонтик', 'парасон', 'deštník', 'umbrella'],
  '🐘': ['слон', 'слон', 'slon', 'elephant'], '🐮': ['корова', 'карова', 'kráva', 'cow'], '🎨': ['краски', 'фарбы', 'barvy', 'paints'], '🎯': ['мишень', 'мішэнь', 'terč', 'target'],
  '🦴': ['косточка', 'костка', 'kost', 'bone'], '🐟': ['рыба', 'рыба', 'ryba', 'fish'], '🥕': ['морковь', 'морква', 'mrkev', 'carrot'], '🌻': ['подсолнух', 'сланечнік', 'slunečnice', 'sunflower'],
  '🥚': ['яйцо', 'яйка', 'vejce', 'egg'], '🌾': ['колосья', 'каласы', 'klasy', 'wheat'], '🧀': ['сыр', 'сыр', 'sýr', 'cheese'], '🥜': ['орех', 'арэх', 'ořech', 'nut'], '⛽': ['бензин', 'бензін', 'benzín', 'fuel'],
  '🚌': ['автобус', 'аўтобус', 'autobus', 'bus'], '✈': ['самолёт', 'самалёт', 'letadlo', 'airplane'], '🚲': ['велосипед', 'ровар', 'kolo', 'bike'], '🚂': ['поезд', 'цягнік', 'vlak', 'train'],
  '🌧': ['дождь', 'дождж', 'déšť', 'rain'], '🚪': ['дверь', 'дзверы', 'dveře', 'door'], '🥅': ['ворота', 'вароты', 'branka', 'goal'], '🖌': ['кисть', 'пэндзаль', 'štětec', 'brush'],
  '🪥': ['щётка', 'шчотка', 'kartáček', 'toothbrush'], '📓': ['тетрадь', 'сшытак', 'sešit', 'notebook'],
  '🔴': ['красный', 'чырвоны', 'červený', 'red'], '🔵': ['синий', 'сіні', 'modrý', 'blue'], '🟢': ['зелёный', 'зялёны', 'zelený', 'green'], '🟡': ['жёлтый', 'жоўты', 'žlutý', 'yellow'],
  '🟣': ['фиолетовый', 'фіялетавы', 'fialový', 'purple'], '🟠': ['оранжевый', 'аранжавы', 'oranžový', 'orange'],
  '🍩': ['пончик', 'пончык', 'kobliha', 'doughnut'], '🍪': ['печенье', 'печыва', 'sušenka', 'cookie'], '🍦': ['мороженое', 'марожанае', 'zmrzlina', 'ice cream'], '🍫': ['шоколад', 'шакалад', 'čokoláda', 'chocolate'],
  '🍬': ['конфета', 'цукерка', 'bonbon', 'sweet'], '🧁': ['кекс', 'кекс', 'muffin', 'cupcake'], '🍭': ['леденец', 'ледзяш', 'lízátko', 'lollipop'],
};
const SYM = {   // слова для знаков: ru, be, cs, en
  times: ['умножить на', 'памножыць на', 'krát', 'times'], div: ['разделить на', 'падзяліць на', 'děleno', 'divided by'], plus: ['плюс', 'плюс', 'plus', 'plus'], minus: ['минус', 'мінус', 'mínus', 'minus'],
  eq: ['равно', 'роўна', 'rovná se', 'equals'], over: ['на', 'на', 'lomeno', 'over'], blank: ['пропущенное число', 'прапушчаны лік', 'chybějící číslo', 'the missing number'],
};
const UNITS = { 'см': ['сантиметров', 'сантыметраў', 'centimetrů', 'centimetres'], 'мм': ['миллиметров', 'міліметраў', 'milimetrů', 'millimetres'], 'км': ['километров', 'кіламетраў', 'kilometrů', 'kilometres'],
  'м': ['метров', 'метраў', 'metrů', 'metres'], 'кг': ['килограммов', 'кілаграмаў', 'kilogramů', 'kilograms'], 'г': ['граммов', 'грамаў', 'gramů', 'grams'], 'мл': ['миллилитров', 'мілілітраў', 'mililitrů', 'millilitres'], 'л': ['литров', 'літраў', 'litrů', 'litres'],
  'cm': 4, 'mm': 4, 'km': 4, 'm': 4, 'kg': 4, 'g': 4, 'ml': 4, 'l': 4 };
const LATIN_UNITS = { cm: 'см', mm: 'мм', km: 'км', m: 'м', kg: 'кг', g: 'г', ml: 'мл', l: 'л' };
const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&nbsp;': ' ', '&#39;': "'" };

function normalize(html, lang) {
  const i = Math.max(0, LANGS.indexOf(lang)), w = k => ' ' + SYM[k][i] + ' ';
  let s = String(html == null ? '' : html);
  s = s.replace(/<span class="fr"><i>([^<]*)<\/i><i>([^<]*)<\/i><\/span>/g, (m, a, b) => ' ' + a + w('over') + b + ' ');
  s = s.replace(/<span class="blank">[^<]*<\/span>/g, w('blank'));
  s = s.replace(/<[^>]*>/g, ' ').replace(/&(amp|lt|gt|quot|nbsp|#39);/g, m => ENT[m]);
  s = s.replace(/️/g, '');
  for (const [e, n] of Object.entries(NAMES)) if (s.includes(e)) s = s.split(e).join(' ' + n[i] + ' ');
  s = s.replace(/[←-⇿■-◿☀-➿\u{1F000}-\u{1FAFF}]/gu, ' ');       // остальные стрелки и значки
  s = s.replace(/\((?:в|у|v|in)\s+(?:cm|см)\)/g, ' ' + ['в сантиметрах', 'у сантыметрах', 'v centimetrech', 'in centimetres'][i] + ' ');
  s = s.replace(/(\d)\s*(cm|mm|km|kg|ml|m|g|l|см|мм|км|кг|мл|м|г|л)(?![\p{L}])/gu, (m, d, u) => d + ' ' + UNITS[LATIN_UNITS[u] || u][i] + ' ');
  s = s.replace(/×/g, w('times')).replace(/÷/g, w('div')).replace(/\+/g, w('plus')).replace(/−/g, w('minus')).replace(/\s*=\s*/g, ', ' + SYM.eq[i] + ' ');   // запятая перед «равно» даёт паузу
  s = s.replace(/(\d)\s*[-–]\s*(\d)/g, (m, a, b) => a + w('minus') + b);
  s = s.replace(/(\d)\s*:\s*(\d)/g, (m, a, b) => a + w('div') + b).replace(/(\d)\s*\/\s*(\d)/g, (m, a, b) => a + w('over') + b);
  s = s.replace(/[«»„“”"]/g, ' ').replace(/\s*([?!.,;:])/g, '$1').replace(/\s+/g, ' ').trim();
  return s;
}

/* ---------- голоса и произнесение (только в браузере) ---------- */
let listeners = [], speakingNow = false;
const synth = () => (root.speechSynthesis && root.SpeechSynthesisUtterance ? root.speechSynthesis : null);
const supported = () => !!synth();
function voices() { try { return (synth() && synth().getVoices()) || []; } catch (e) { return []; } }
const PREF = 'umniki.voice';   // выбранные голоса — у устройства свои, в облако не уходят
const prefs = () => { try { return JSON.parse(localStorage.getItem(PREF)) || {}; } catch (e) { return {}; } };
const setPref = (lang, name) => { try { const p = prefs(); if (name) p[lang] = name; else delete p[lang]; localStorage.setItem(PREF, JSON.stringify(p)); } catch (e) {} };
const score = v => (/enhanced|premium|siri|neural|natural|улучшен/i.test(v.name) ? 4 : 0) + (v.localService ? 2 : 0) + (v.default ? 1 : 0);
function voicesFor(lang) { return voices().filter(v => String(v.lang).toLowerCase().replace('_', '-').split('-')[0] === lang).sort((a, b) => score(b) - score(a)); }
function pickVoice(lang) {
  const vs = voicesFor(lang); if (!vs.length) return null;
  const want = prefs()[lang]; return (want && vs.find(v => v.name === want)) || vs[0];
}
const canSpeak = lang => supported() && !!pickVoice(lang);
const emit = () => listeners.forEach(f => { try { f(speakingNow); } catch (e) {} });
function stop() { if (synth()) { try { synth().cancel(); } catch (e) {} } if (speakingNow) { speakingNow = false; emit(); } }
/* речь по предложениям: вопрос — с интонацией вверх, восклицание — бодрее, повествование — ровно; между предложениями естественная пауза */
const chunks = text => (text.match(/[^.?!]+[.?!]*/g) || [text]).map(x => x.trim()).filter(Boolean);
function say(html, lang, o = {}) {
  const text = normalize(html, lang), v = pickVoice(lang); if (!text || !v || !synth()) return false;
  try { synth().cancel(); } catch (e) {}
  const parts = chunks(text), rate = o.rate || 0.9;
  parts.forEach((part, k) => {
    const u = new root.SpeechSynthesisUtterance(part), end = part.slice(-1); u.voice = v; u.lang = v.lang;
    u.rate = end === '!' ? Math.min(1.3, rate + 0.05) : rate; u.pitch = end === '?' ? 1.18 : end === '!' ? 1.12 : 1.0; if (o.volume != null) u.volume = o.volume;
    if (k === 0) u.onstart = () => { speakingNow = true; emit(); };
    u.onend = u.onerror = () => { if (k === parts.length - 1) { speakingNow = false; emit(); } };
    synth().speak(u);
  });
  return true;
}
let unlocked = false;
function unlock() { if (unlocked || !synth()) return; unlocked = true; try { const u = new root.SpeechSynthesisUtterance(' '); u.volume = 0; synth().speak(u); } catch (e) {} }
const api = { LANGS, NAMES, chunks, voicesFor, setPref, prefs, normalize, supported, canSpeak, pickVoice, say, stop, unlock, onState: f => listeners.push(f), speaking: () => speakingNow };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Speech = api;
})(typeof window !== 'undefined' ? window : globalThis);
