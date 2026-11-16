'use strict';
/* Анимированные 3D-персонажи (three.js, строятся из простых форм, без внешних моделей).
   Avatar.hydrate(root) заменяет эмодзи-заглушки .avatar[data-av] на картинки (статичные, из кэша) или на один «живой» холст [data-live].
   Если WebGL недоступен, остаются эмодзи. Состояния: idle | happy | sad | wave. */
(function (root) {
const INK = 0x2a2562, SCRIPT = 'vendor/three.min.js';
let T = null, loading = null, failed = false, snapR = null, liveR = null, grad = null;
const cache = new Map(), builders = {}, live = { cur: null, raf: 0 };
const reduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

const loadScript = src => new Promise((res, rej) => { const el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(el); });
function ready() {
  if (!failed && navigator.webdriver && !localStorage.getItem('umniki.av3d')) failed = true;   // автотесты идут с эмодзи (быстрее); 3D включается ключом umniki.av3d
  if (failed) return Promise.reject(new Error('no webgl'));
  if (T) return Promise.resolve();
  return (loading = loading || loadScript(SCRIPT).then(() => {
    T = root.THREE; const c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) throw new Error('no webgl');
    grad = new T.DataTexture(Uint8Array.from([185, 225, 255]), 3, 1, T.RedFormat); grad.minFilter = grad.magFilter = T.NearestFilter; grad.needsUpdate = true;
  }).catch(e => { failed = true; throw e; }));
}

/* ---------- детали ---------- */
const mat = (c, o = {}) => new T.MeshToonMaterial(Object.assign({ color: c, gradientMap: grad }, o));
const inkMat = () => new T.MeshBasicMaterial({ color: INK, side: T.BackSide });
function part(parent, geo, color, p = [0, 0, 0], s = [1, 1, 1], o = {}) {
  const m = new T.Mesh(geo, mat(color, o.m)); m.position.set(...p); m.scale.set(...s); if (o.r) m.rotation.set(...o.r);
  if (o.outline !== false) { const h = new T.Mesh(geo, inkMat()); h.scale.setScalar(o.hull || 1.07); m.add(h); }
  parent.add(m); return m;
}
const sph = (par, r, c, p, s, o) => part(par, new T.SphereGeometry(r, 24, 18), c, p, s, o);
const cone = (par, r, h, c, p, o) => part(par, new T.ConeGeometry(r, h, 16), c, p, [1, 1, 1], o);
const caps = (par, r, len, c, p, o) => part(par, new T.CapsuleGeometry(r, len, 6, 14), c, p, [1, 1, 1], o);
const box = (par, w, h, d, c, p, o) => part(par, new T.BoxGeometry(w, h, d, 2, 2, 2), c, p, [1, 1, 1], o);
const cyl = (par, rt, rb, h, c, p, o) => part(par, new T.CylinderGeometry(rt, rb, h, 20), c, p, [1, 1, 1], o);
const tor = (par, R, r, arc, c, p, o) => part(par, new T.TorusGeometry(R, r, 10, 28, arc), c, p, [1, 1, 1], o);

/* ---------- базовая «фасолька»: тело, лицо, ручки и ножки ---------- */
function base(cfg) {
  const g = new T.Group(), body = new T.Group(); g.add(body); const parts = { g, body, ears: [], arms: [], tail: null, mouth: null, eyes: [] };
  const col = cfg.color, shape = cfg.shape || [1, .94, .96];
  sph(body, 1, col, [0, 1.05, 0], shape);
  if (cfg.belly) sph(body, .72, cfg.belly, [0, .85, .52], [1, 1, .55], { outline: false });
  for (const sx of [-1, 1]) { sph(g, .26, cfg.feet || col, [sx * .5, .12, .38], [1, .7, 1.25]); const a = sph(body, .24, cfg.arms || col, [sx * 1.0, .85, .12], [.8, 1.15, .8], { r: [0, 0, sx * -.35] }); a.userData.side = sx; a.userData.base = [sx * 1.0, .85, .12]; parts.arms.push(a); }
  if (!cfg.noFace) {
    const eyeC = cfg.eyeC || 0xffffff, ex = cfg.eyeX || .36, ey = cfg.eyeY || 1.16, ez = cfg.eyeZ || .86, er = cfg.eyeR || .17;
    for (const sx of [-1, 1]) {
      if (cfg.patch) sph(body, .3, cfg.patch, [sx * ex * 1.05, ey - .02, ez - .08], [1, 1.25, .45], { outline: false });
      const eye = new T.Group(); eye.position.set(sx * ex, ey, ez); body.add(eye);
      sph(eye, er, eyeC, [0, 0, 0], [1, 1.15, .6], { outline: false }); sph(eye, er * .62, 0x231f4f, [0, -.01, er * .45], [1, 1.1, .5], { outline: false }); sph(eye, er * .2, 0xffffff, [er * .22, er * .28, er * .78], [1, 1, .5], { outline: false });
      parts.eyes.push(eye);
    }
    for (const sx of [-1, 1]) sph(body, .13, 0xff8fb1, [sx * .62, .86, .78], [1.2, .75, .4], { outline: false, m: { transparent: true, opacity: .85 } });
    parts.mouth = tor(body, .15, .035, Math.PI, 0x4a2a45, [0, .82, .95], { outline: false, r: [0, 0, Math.PI] });
  }
  return parts;
}
const earPair = (p, mk) => { for (const sx of [-1, 1]) { const e = mk(sx); p.ears.push(e); } };

builders['🐱'] = () => { const p = base({ color: 0xffa45c, belly: 0xfff0dc }); const b = p.body;
  earPair(p, sx => { const e = cone(b, .36, .62, 0xffa45c, [sx * .62, 1.95, 0], { r: [0, 0, sx * -.3] }); cone(e, .2, .36, 0xff9bb4, [0, -.04, .12], { outline: false }); return e; });
  sph(b, .09, 0xff7d9b, [0, 1.02, .98], [1.3, .9, .8], { outline: false });
  for (const sx of [-1, 1]) for (const k of [-1, 0, 1]) cyl(b, .012, .012, .55, 0x2a2562, [sx * .92, .95 + k * .1, .78], { outline: false, r: [0, 0, Math.PI / 2 + k * .18 * sx] });
  p.tail = caps(p.g, .13, .8, 0xffa45c, [0, .55, -.95], { r: [.9, 0, 0] }); return p; };
builders['🐶'] = () => { const p = base({ color: 0xd9a066, belly: 0xfff0dc }); const b = p.body;
  earPair(p, sx => sph(b, .3, 0x9a5f34, [sx * .95, 1.55, 0], [.55, 1.15, .7], { r: [0, 0, sx * .25] }));
  sph(b, .34, 0xfff0dc, [0, .92, .78], [1.15, .8, .8], { outline: false }); sph(b, .12, 0x2a2562, [0, 1.02, 1.08], [1.2, .85, .8], { outline: false });
  sph(b, .1, 0xff7d9b, [0, .62, .92], [1, .6, .5], { outline: false }); p.tail = cone(p.g, .16, .5, 0x9a5f34, [0, .8, -.98], { r: [-.9, 0, 0] }); return p; };
builders['🐰'] = () => { const p = base({ color: 0xf6f1ff, belly: 0xffffff }); const b = p.body;
  earPair(p, sx => { const e = caps(b, .22, .8, 0xf6f1ff, [sx * .38, 2.35, -.05], { r: [0, 0, sx * -.12] }); caps(e, .12, .55, 0xffb3cc, [0, 0, .1], { outline: false }); return e; });
  sph(b, .09, 0xff8fb1, [0, 1.0, .98], [1.2, .9, .8], { outline: false }); p.tail = sph(p.g, .25, 0xffffff, [0, .6, -.98]); return p; };
builders['🦊'] = () => { const p = base({ color: 0xff7a3d, patch: null }); const b = p.body;
  earPair(p, sx => { const e = cone(b, .4, .85, 0xff7a3d, [sx * .62, 2.0, 0], { r: [0, 0, sx * -.28] }); cone(e, .22, .4, 0x2a2562, [0, .12, .1], { outline: false }); return e; });
  sph(b, .62, 0xffffff, [0, .86, .55], [1.35, .7, .6], { outline: false }); sph(b, .11, 0x2a2562, [0, 1.02, 1.0], [1.2, .85, .8], { outline: false });
  const t = new T.Group(); t.position.set(0, .7, -1.0); p.g.add(t); sph(t, .38, 0xff7a3d, [0, .25, -.35], [.9, .9, 1.9], { r: [.5, 0, 0] }); sph(t, .22, 0xffffff, [0, .7, -.95], [1, 1, 1.2]); p.tail = t; return p; };
builders['🐼'] = () => { const p = base({ color: 0xffffff, patch: 0x2a2562, feet: 0x2a2562, arms: 0x2a2562 }); const b = p.body;
  earPair(p, sx => sph(b, .3, 0x2a2562, [sx * .72, 1.85, 0])); sph(b, .1, 0x2a2562, [0, 1.0, .99], [1.3, .9, .8], { outline: false }); return p; };
builders['🐸'] = () => { const p = base({ color: 0x5fd068, belly: 0xd7f7b9, noFace: true, shape: [1.1, .85, .95] }); const b = p.body;
  for (const sx of [-1, 1]) { const e = new T.Group(); e.position.set(sx * .48, 1.8, .38); b.add(e); sph(e, .34, 0x5fd068, [0, 0, 0]); sph(e, .24, 0xffffff, [0, .02, .16], [1, 1.1, .7], { outline: false }); sph(e, .13, 0x231f4f, [0, 0, .31], [1, 1.1, .5], { outline: false }); sph(e, .04, 0xffffff, [.05, .06, .38], [1, 1, .5], { outline: false }); p.eyes.push(e); }
  for (const sx of [-1, 1]) sph(b, .13, 0xff8fb1, [sx * .7, .8, .8], [1.2, .75, .4], { outline: false, m: { transparent: true, opacity: .85 } });
  p.mouth = tor(b, .38, .04, Math.PI, 0x2f6b3a, [0, .95, .88], { outline: false, r: [0, 0, Math.PI] }); return p; };
builders['🦉'] = () => { const p = base({ color: 0xa97c5d, belly: 0xf1dcc0, noFace: true }); const b = p.body;
  earPair(p, sx => cone(b, .26, .5, 0x8a5e44, [sx * .6, 2.0, 0], { r: [0, 0, sx * -.35] }));
  for (const sx of [-1, 1]) { const e = new T.Group(); e.position.set(sx * .42, 1.2, .8); b.add(e); sph(e, .36, 0xfff6e6, [0, 0, 0], [1, 1, .55]); sph(e, .2, 0xffb21a, [0, 0, .1], [1, 1, .6], { outline: false }); sph(e, .1, 0x231f4f, [0, 0, .2], [1, 1, .5], { outline: false }); sph(e, .035, 0xffffff, [.04, .05, .27], [1, 1, .5], { outline: false }); p.eyes.push(e); }
  cone(b, .13, .3, 0xffb21a, [0, .88, 1.0], { r: [Math.PI / 2, 0, Math.PI] }); return p; };
builders['🐧'] = () => { const p = base({ color: 0x353a6e, belly: 0xffffff, feet: 0xffa31a, arms: 0x353a6e, shape: [.95, 1.0, .9] }); const b = p.body;
  cone(b, .13, .3, 0xffa31a, [0, .98, 1.0], { r: [Math.PI / 2, 0, Math.PI] }); p.tail = null; return p; };
builders['🐙'] = () => { const p = base({ color: 0xff7eb6, feet: 0xff7eb6, shape: [1.05, 1.0, 1.0] }); const b = p.body; p.tent = [];
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, t = caps(p.g, .15, .6, 0xff7eb6, [Math.cos(a) * .65, .22, Math.sin(a) * .6 + .1], { r: [Math.sin(a) * .5, 0, -Math.cos(a) * .5] }); p.tent.push(t); }
  sph(b, .11, 0xffffff, [.55, 1.75, .45], [1, 1, 1], { outline: false, m: { transparent: true, opacity: .5 } }); return p; };
builders['🦁'] = () => { const p = base({ color: 0xffc24a, belly: 0xfff0c8 }); const b = p.body;
  sph(b, 1.42, 0xd9832b, [0, 1.05, -.35], [1, 1, .6], { hull: 1.04 });
  earPair(p, sx => sph(b, .22, 0xffc24a, [sx * .72, 1.88, .12])); sph(b, .3, 0xfff0c8, [0, .9, .86], [1.2, .8, .6], { outline: false }); sph(b, .1, 0x2a2562, [0, 1.0, 1.04], [1.3, .85, .8], { outline: false });
  p.tail = caps(p.g, .08, .8, 0xffc24a, [0, .5, -1.05], { r: [.9, 0, 0] }); return p; };
builders['🦄'] = () => { const p = base({ color: 0xffffff, belly: 0xffffff }); const b = p.body;
  earPair(p, sx => cone(b, .2, .4, 0xffffff, [sx * .55, 1.95, -.05], { r: [0, 0, sx * -.3] }));
  cone(b, .16, .8, 0xffd23f, [0, 2.15, .3], { r: [.35, 0, 0] });
  [0xff5d8f, 0xffb21a, 0x5fd0ff, 0xa66bff].forEach((c, i) => sph(b, .24, c, [-.78 - (i % 2) * .08, 1.75 - i * .27, -.1], [.8, 1, 1]));
  p.tail = sph(p.g, .3, 0xa66bff, [0, .7, -1.0], [.8, 1.2, .8]); return p; };
builders['🐲'] = () => { const p = base({ color: 0x3fc6a8, belly: 0xf4f0b0 }); const b = p.body;
  earPair(p, sx => cone(b, .16, .55, 0xfff2c8, [sx * .5, 2.0, 0], { r: [0, 0, sx * -.4] }));
  for (let i = 0; i < 3; i++) cone(b, .14, .3, 0xff8a3d, [0, 2.0 - i * .02 - (i === 0 ? 0 : 0), -.15 - i * .3], { r: [-.5 - i * .3, 0, 0] });
  for (const sx of [-1, 1]) { const w = cone(p.g, .5, .9, 0x7be0c8, [sx * 1.0, 1.3, -.55], { r: [.2, 0, sx * -1.0] }); p.arms.push(Object.assign(w, {})); w.userData.wing = sx; }
  p.tail = cone(p.g, .2, .9, 0x3fc6a8, [0, .6, -1.2], { r: [-1.3, 0, 0] }); return p; };
builders['🤖'] = () => { const p = base({ color: 0x86b8ff, noFace: true, shape: [1, .9, .9], feet: 0x5b6cff, arms: 0x5b6cff }); const b = p.body;
  box(b, 1.35, .8, .1, 0x1d1b45, [0, 1.15, .86], { outline: false }); for (const sx of [-1, 1]) { const e = sph(b, .17, 0x55f0ff, [sx * .35, 1.17, .95], [1, 1.1, .4], { outline: false }); p.eyes.push(e); }
  p.mouth = tor(b, .14, .03, Math.PI, 0x55f0ff, [0, .96, .94], { outline: false, r: [0, 0, Math.PI] });
  cyl(b, .04, .04, .45, 0x2a2562, [0, 2.1, 0]); p.tail = sph(b, .13, 0xff5d8f, [0, 2.38, 0]); return p; };

/* ---------- шляпы ---------- */
const hats = {
  '🧢': g => { const h = new T.Group(); sph(h, .85, 0xff5d5d, [0, 0, 0], [1, .7, 1]); box(h, 1.0, .08, .7, 0xff5d5d, [0, -.14, .85]); g.add(h); return h; },
  '🎀': g => { const h = new T.Group(); for (const sx of [-1, 1]) cone(h, .3, .6, 0xff5d9a, [sx * .35, 0, 0], { r: [0, 0, sx * Math.PI / 2 * -1] }); sph(h, .17, 0xff3d7f, [0, 0, 0]); g.add(h); return h; },
  '🎓': g => { const h = new T.Group(); cyl(h, .6, .6, .3, 0x2a2562, [0, 0, 0]); box(h, 1.7, .08, 1.7, 0x2a2562, [0, .2, 0]); cyl(h, .02, .02, .6, 0xffc21a, [.7, .0, .7], { outline: false }); g.add(h); return h; },
  '🎧': g => { const h = new T.Group(); tor(h, 1.0, .07, Math.PI, 0x2a2562, [0, -.5, 0]); for (const sx of [-1, 1]) cyl(h, .3, .3, .22, 0xff5d8f, [sx * 1.02, -.5, 0], { r: [0, 0, Math.PI / 2] }); g.add(h); return h; },
  '🎩': g => { const h = new T.Group(); cyl(h, .62, .62, .9, 0x2a2562, [0, .3, 0]); cyl(h, 1.0, 1.0, .1, 0x2a2562, [0, -.15, 0]); cyl(h, .63, .63, .16, 0xff5d8f, [0, .0, 0], { outline: false }); g.add(h); return h; },
  '👑': g => { const h = new T.Group(); cyl(h, .6, .6, .35, 0xffc21a, [0, 0, 0]); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; cone(h, .14, .38, 0xffc21a, [Math.cos(a) * .52, .35, Math.sin(a) * .52]); sph(h, .07, 0xff5d8f, [Math.cos(a) * .52, .58, Math.sin(a) * .52], [1, 1, 1], { outline: false }); } g.add(h); return h; },
};

function build(pet, hat) {
  const mk = builders[pet] || builders['🐱'], p = mk(); const top = pet === '🐰' ? 2.55 : pet === '🦄' ? 2.3 : 1.92;
  if (hat && hats[hat]) { const h = hats[hat](p.g); h.position.set(0, pet === '🐰' ? 2.1 : top - .05, .05); if (pet === '🐰') h.scale.setScalar(.9); p.hat = h; p.hatBase = h.position.y; if (pet !== '🦁') p.ears.forEach(e => { if (pet === '🐰' || pet === '🦄') e.visible = true; }); }
  p.pet = pet; p.t0 = Math.random() * 10; p.pose = 'idle'; p.poseAt = 0; p.blinkAt = 1.5 + Math.random() * 2; p.blink = 0;
  return p;
}
function setPose(p, pose, now) { p.pose = pose; p.poseAt = now; }
function animate(p, t) {
  const g = p.g, body = p.body, dt = t - p.poseAt, idle = Math.sin((t + p.t0) * 2.2);
  let y = idle * .04, rz = Math.sin((t + p.t0) * 1.1) * .035, rx = 0, ry = 0, sy = 1 + idle * .012, mouthFlip = false, squint = 0, armUp = 0;
  if (p.pose === 'happy') { const k = Math.max(0, 1 - dt / 2.4); y += Math.abs(Math.sin(dt * 9)) * .55 * k; ry = dt < .9 ? dt / .9 * Math.PI * 2 : 0; squint = .6 * k; armUp = 1.2 * k; if (dt > 2.4) { p.pose = 'idle'; } }
  else if (p.pose === 'sad') { const k = Math.min(1, dt / .3) * (dt < 2.4 ? 1 : Math.max(0, 1 - (dt - 2.4) / .5)); rx = .22 * k; sy -= .07 * k; mouthFlip = k > .3; y -= .04 * k; if (dt > 2.9) p.pose = 'idle'; }
  else if (p.pose === 'wave') { armUp = 1.0; rz += Math.sin(dt * 9) * .08; if (dt > 2.2) p.pose = 'idle'; }
  g.position.y = y; g.rotation.set(rx, ry, rz); body.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
  if (t > p.blinkAt) { p.blink = .14; p.blinkAt = t + 2 + Math.random() * 3; }
  p.blink = Math.max(0, p.blink - .016); const close = Math.max(squint, p.blink > 0 ? 1 : 0);
  p.eyes.forEach(e => { e.scale.y = Math.max(.12, 1 - close * .9); });
  if (p.mouth) p.mouth.rotation.z = mouthFlip ? 0 : Math.PI;
  p.arms.forEach(a => { const sd = a.userData.side || a.userData.wing || 1;
    if (a.userData.wing) a.rotation.z = sd * -1.0 + Math.sin(t * (armUp ? 14 : 3)) * (armUp ? .35 : .08);
    else { a.position.y = a.userData.base[1] + armUp * .5 + (p.pose === 'wave' && sd === 1 ? Math.sin(t * 12) * .1 : 0); a.rotation.z = sd * (-.35 - armUp * .55); } });
  if (p.tail) p.tail.rotation.z = Math.sin((t + p.t0) * 4.5) * .3;
  if (p.ears[0]) p.ears.forEach((e, i) => { e.rotation.x = Math.sin((t + p.t0) * 1.6 + i) * .04; });
  if (p.tent) p.tent.forEach((tt, i) => { tt.rotation.z = Math.sin((t + p.t0) * 3 + i) * .18; });
  if (p.hat) p.hat.position.y = p.hatBase + y * .0;
}

/* ---------- сцена и рендеры ---------- */
function scene() {
  const s = new T.Scene(); s.add(new T.AmbientLight(0xffffff, 1.0)); const d = new T.DirectionalLight(0xffffff, 1.15); d.position.set(2.5, 4, 5); s.add(d);
  const cam = new T.PerspectiveCamera(26, 1, .1, 50); cam.position.set(0, 1.5, 8.4); cam.lookAt(0, 1.45, 0); return { s, cam };
}
function mkRenderer(preserve) { const r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!preserve, powerPreference: 'low-power' }); r.setClearColor(0x000000, 0); return r; }

function snapshot(pet, hat, size, pose) {
  const key = `${pet}|${hat}|${size}|${pose || ''}`; if (cache.has(key)) return cache.get(key);
  if (!snapR) { snapR = mkRenderer(true); }
  const dpr = Math.min(2, root.devicePixelRatio || 1), px = Math.round(size * dpr); snapR.setPixelRatio(1); snapR.setSize(px, px, false);
  const { s, cam } = scene(), p = build(pet, hat); s.add(p.g); if (pose === 'happy') { setPose(p, 'happy', 0); animate(p, 0); } else if (pose === 'sad') { setPose(p, 'sad', 0); animate(p, .6); } else animate(p, 0);
  p.eyes.forEach(e => { e.scale.y = 1; });
  snapR.render(s, cam); const url = snapR.domElement.toDataURL('image/png'); cache.set(key, url); disposeScene(s); return url;
}
function disposeScene(s) { s.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }

function stopLive() { if (live.raf) cancelAnimationFrame(live.raf); live.raf = 0; if (live.cur) { live.cur.scene && disposeScene(live.cur.scene); live.cur = null; } }
function startLive(el, pet, hat, pose) {
  stopLive(); if (!liveR) liveR = mkRenderer(false);
  const size = Math.max(40, Math.round(el.clientWidth || 120)), dpr = Math.min(2, root.devicePixelRatio || 1);
  liveR.setPixelRatio(dpr); liveR.setSize(size, size, false); const cv = liveR.domElement; cv.className = 'av3d'; cv.style.width = '100%'; cv.style.height = '100%';
  el.querySelectorAll('.av3d,.avimg').forEach(n => n.remove()); el.appendChild(cv); el.classList.add('on3d');
  const { s, cam } = scene(), p = build(pet, hat); s.add(p.g); setPose(p, pose || 'idle', 0); const start = performance.now(), still = reduce(); live.cur = { scene: s, p, el };
  let last = 0; const loop = now => {
    if (!el.isConnected || !live.cur || live.cur.p !== p) { if (live.cur && live.cur.p === p) stopLive(); return; }
    live.raf = requestAnimationFrame(loop); if (document.hidden || now - last < 30) return; last = now;
    const t = (now - start) / 1000; animate(p, still ? 0 : t); liveR.render(s, cam);
  };
  if (still) { animate(p, 0); liveR.render(s, cam); live.cur.p = p; } else live.raf = requestAnimationFrame(loop);
  el.__avatar = p; el.__t0 = start;
}
const react = pose => { const c = live.cur; if (c && c.el.isConnected) setPose(c.p, pose, (performance.now() - c.el.__t0) / 1000); };

function hydrate(rootEl) {
  if (!failed && navigator.webdriver && !localStorage.getItem('umniki.av3d')) failed = true;
  const els = (rootEl || document).querySelectorAll('.avatar[data-av]'); if (!els.length) { return; }
  if (failed) return;
  if (!T) { ready().then(() => hydrate(rootEl)).catch(() => {}); return; }
  let liveDone = false;
  els.forEach(el => {
    const pet = el.dataset.av, hat = el.dataset.hat || '', size = Math.round(el.clientWidth || 64);
    try {
      if (el.dataset.live && !liveDone && !el.classList.contains('on3d')) { startLive(el, pet, hat, el.dataset.pose); liveDone = true; }
      else if (!el.dataset.live) { if (el.querySelector('.avimg') && el.dataset.k === `${pet}|${hat}|${size}`) return; const img = el.querySelector('.avimg') || document.createElement('img'); img.className = 'avimg'; img.alt = ''; img.src = snapshot(pet, hat, size, el.dataset.pose); el.dataset.k = `${pet}|${hat}|${size}`; if (!img.parentNode) el.appendChild(img); el.classList.add('on3d'); }
    } catch (e) { failed = true; }
  });
}
const api = { ready, hydrate, react, stop: stopLive, supported: () => !failed, PETS: Object.keys(builders), HATS: Object.keys(hats) };
root.Avatar = api;
})(window);
