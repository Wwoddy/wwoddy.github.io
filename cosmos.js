/* Космос: фон из звёзд + чёрная дыра с аккреционным диском (техника из шаблона Avangard KG).
   Чисто декоративный слой. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ================= ЗВЁЗДЫ (фон на весь экран) ================= */
  const sc = document.getElementById('stars');
  const sx = sc.getContext('2d');
  let SW = 0, SH = 0, sdpr = 1, stars = [];

  function layoutStars() {
    // На телефоне адресная строка меняет высоту при прокрутке: пересоздаём звёзды только при реальной смене размера.
    if (SW && Math.abs(innerWidth - SW) < 2 && Math.abs(innerHeight - SH) < 140) return;
    SW = innerWidth; SH = innerHeight;
    sdpr = Math.min(devicePixelRatio || 1, 1.5);
    sc.width = Math.round(SW * sdpr); sc.height = Math.round(SH * sdpr);
    sx.setTransform(sdpr, 0, 0, sdpr, 0, 0);
    const n = SW < 700 ? 120 : 240;
    stars = Array.from({ length: n }, () => ({
      x: rand(0, SW), y: rand(0, SH), z: rand(.15, 1), r: rand(.3, 1.4),
      tw: rand(.4, 1.8), ph: rand(0, TAU), c: Math.random() < .25 ? '150,236,255' : Math.random() < .15 ? '170,140,255' : '235,245,255'
    }));
  }

  /* Ввод: палец/мышь притягивают звёзды и оставляют светящийся след, курсор и гироскоп дают параллакс.
     quality: 0 — всё включено, 1 — без следа и метеоров, 2 — ещё и вдвое меньше звёзд (включается само на слабых устройствах). */
  let quality = ((navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)) ? 1 : 0;
  const ptr = { x: -999, y: -999, on: false };
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  const trail = [];
  let lastY = scrollY, sv = 0;
  function setPtr(x, y) {
    ptr.x = x; ptr.y = y; ptr.on = true;
    par.tx = (x / innerWidth - .5) * 2; par.ty = (y / innerHeight - .5) * 2;
    if (quality < 1 && !reduced) { trail.push({ x, y, t: 0 }); if (trail.length > 26) trail.shift(); }
  }
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') setPtr(e.clientX, e.clientY); }, { passive: true });
  const touchMove = e => { const t = e.touches[0]; if (t) setPtr(t.clientX, t.clientY); };
  addEventListener('touchstart', touchMove, { passive: true });
  addEventListener('touchmove', touchMove, { passive: true });
  const touchEnd = () => { ptr.on = false; par.tx = 0; par.ty = 0; };
  addEventListener('touchend', touchEnd, { passive: true });
  addEventListener('touchcancel', touchEnd, { passive: true });

  const shoots = [];
  function drawShoots(dt) {
    if (!reduced && shoots.length < 2 && Math.random() < .004) {
      const a = rand(.4, .65), sp = rand(520, 820);
      shoots.push({ x: rand(SW * .25, SW), y: rand(0, SH * .45), vx: -Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, max: rand(.55, .95) });
    }
    for (let i = shoots.length - 1; i >= 0; i--) {
      const s = shoots[i];
      s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
      const k = 1 - s.t / s.max;
      if (k <= 0) { shoots.splice(i, 1); continue; }
      const sp = Math.hypot(s.vx, s.vy), tx = s.x - s.vx / sp * 110, ty = s.y - s.vy / sp * 110;
      const g = sx.createLinearGradient(s.x, s.y, tx, ty);
      g.addColorStop(0, `rgba(210,250,255,${k.toFixed(3)})`); g.addColorStop(1, 'rgba(150,236,255,0)');
      sx.strokeStyle = g; sx.lineWidth = 1.6; sx.lineCap = 'round';
      sx.beginPath(); sx.moveTo(s.x, s.y); sx.lineTo(tx, ty); sx.stroke();
    }
  }

  function drawStars(now, dt) {
    sx.clearRect(0, 0, SW, SH);
    if (quality < 1) drawShoots(dt);
    const sy = scrollY;
    // Скорость прокрутки: при быстром скролле звёзды вытягиваются в полосы («варп»).
    sv += (clamp((sy - lastY) / Math.max(dt, .001), -5000, 5000) - sv) * .16; lastY = sy;
    par.x += (par.tx - par.x) * .05; par.y += (par.ty - par.y) * .05;
    const warp = reduced ? 0 : clamp(Math.abs(sv) / 2400, 0, 1), dir = sv > 0 ? 1 : -1;
    const stride = quality >= 2 ? 2 : 1;
    for (let i = 0; i < stars.length; i += stride) {
      const s = stars[i];
      // Звёзды ближе (z больше) уходят вверх быстрее: параллакс при прокрутке и от движения пальца.
      let x = s.x - par.x * 14 * s.z, y = (s.y - sy * s.z * .18 - par.y * 10 * s.z) % SH; if (y < 0) y += SH;
      if (ptr.on && !reduced) {
        const dx = ptr.x - x, dy = ptr.y - y, d2 = dx * dx + dy * dy;
        if (d2 < 28900) { const d = Math.sqrt(d2) || 1, pull = (1 - d / 170) * 26 * s.z; x += dx / d * pull; y += dy / d * pull; }
      }
      const a = reduced ? .6 : (.35 + .65 * (0.5 + 0.5 * Math.sin(now * .001 * s.tw + s.ph))) * (.35 + s.z * .65);
      if (warp > .06) {
        sx.strokeStyle = `rgba(${s.c},${Math.min(1, a + warp * .3).toFixed(3)})`;
        sx.lineWidth = s.r * 1.1 + .3;
        sx.beginPath(); sx.moveTo(x, y); sx.lineTo(x, y + dir * warp * 95 * s.z); sx.stroke();
      } else {
        sx.fillStyle = `rgba(${s.c},${a.toFixed(3)})`;
        sx.beginPath(); sx.arc(x, y, s.r, 0, TAU); sx.fill();
      }
    }
    if (trail.length) {
      sx.save(); sx.globalCompositeOperation = 'lighter';
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i]; p.t += dt;
        const k = 1 - p.t / .7;
        if (k <= 0) { trail.splice(i, 1); continue; }
        const r = 3 + 9 * k, g = sx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(150,236,255,${(k * .55).toFixed(3)})`); g.addColorStop(1, 'rgba(138,92,255,0)');
        sx.fillStyle = g; sx.beginPath(); sx.arc(p.x, p.y, r, 0, TAU); sx.fill();
      }
      sx.restore();
    }
  }

  /* ================= ЧЁРНАЯ ДЫРА ================= */
  const hc = document.getElementById('hole');
  const stage = document.getElementById('stage');
  const ring = document.getElementById('ring');
  const layer = document.getElementById('holeLayer');
  if (!hc || !stage || !layer || !ring) { sc && layoutStars(); return; }
  const ctx = hc.getContext('2d');

  let W = 1, H = 1, dpr = 1, R = 50, cx = 0, cy = 0, mobile = false;
  const disk = [];
  let holeBg = null, holeCore = null, holeRing = null, ringSize = 0;
  const view = { tilt: .26, rot: -0.2, tTilt: .26, tRot: -0.2 };

  function spawn(p, far) {
    p.r = R * (far ? rand(1.4, 3.8) : rand(3.2, 4.2));
    p.a = rand(0, TAU);
    p.s = rand(.5, 1.6);
    p.h = Math.random();
    p.f = rand(.015, .07);                     // скорость падения к дыре (в радиусах в секунду)
  }

  function layoutHole() {
    // Холст — весь экран (фиксированный слой); размер дыры берётся из её места в первом экране.
    W = layer.clientWidth || innerWidth; H = layer.clientHeight || innerHeight;
    const sw = stage.clientWidth || 300, sh = stage.clientHeight || 300;
    mobile = W < 700;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    hc.width = Math.round(W * dpr); hc.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.min(sw, sh * 1.05) * (mobile ? 0.165 : 0.16);
    // Кольцо с надписью повторяет размер из шаблона: диаметр SVG = 5R.
    ring.style.width = ring.style.height = (R * 5) + 'px';
    disk.length = 0;
    const n = Math.round((mobile ? 240 : 320) * (quality >= 1 ? .72 : 1));
    for (let i = 0; i < n; i++) { const p = {}; spawn(p, true); disk.push(p); }
    holeBg = null;
  }

  /* Свечение, горизонт событий и фотонное кольцо рисуются один раз в маленькие картинки. */
  function sprite(size) {
    const c = document.createElement('canvas');
    c.width = c.height = Math.ceil(size * dpr);
    const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [c, x];
  }
  function buildSprites() {
    const boost = mobile ? 1.7 : 1.25;
    let [c, x] = sprite(R * 10), m = R * 5, g;
    g = x.createRadialGradient(m, m, R * .8, m, m, R * 5);
    g.addColorStop(0, `rgba(60,190,230,${(.18 * boost).toFixed(3)})`); g.addColorStop(.35, `rgba(25,110,160,${(.07 * boost).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.arc(m, m, R * 5, 0, TAU); x.fill();
    g = x.createRadialGradient(m, m, R * .95, m, m, R * 2.6);
    g.addColorStop(0, `rgba(118,78,226,${(.32 * boost).toFixed(3)})`); g.addColorStop(.45, `rgba(70,52,170,${(.12 * boost).toFixed(3)})`); g.addColorStop(1, 'rgba(30,20,80,0)');
    x.fillStyle = g; x.beginPath(); x.arc(m, m, R * 2.6, 0, TAU); x.fill();
    holeBg = c;

    [c, x] = sprite(R * 2.4); m = R * 1.2;
    g = x.createRadialGradient(m - R * .12, m - R * .1, 0, m, m, R * 1.12);
    g.addColorStop(0, '#000'); g.addColorStop(.5, '#020108'); g.addColorStop(.72, '#080418');
    g.addColorStop(.86, '#170c38'); g.addColorStop(.94, 'rgba(52,30,112,.95)'); g.addColorStop(1, 'rgba(20,10,50,0)');
    x.fillStyle = g; x.beginPath(); x.arc(m, m, R * 1.12, 0, TAU); x.fill();
    g = x.createLinearGradient(m - R, m - R, m + R, m + R);
    g.addColorStop(0, 'rgba(120,140,200,.07)'); g.addColorStop(.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(110,70,200,.06)');
    x.fillStyle = g; x.beginPath(); x.arc(m, m, R * .98, 0, TAU); x.fill();
    holeCore = c;

    ringSize = R * 2.1 + 80; [c, x] = sprite(ringSize); m = ringSize / 2;
    x.globalCompositeOperation = 'lighter';
    x.beginPath(); x.arc(m, m, R * 1.03, 0, TAU);
    x.strokeStyle = `rgba(150,110,255,${Math.min(.9, .4 * boost)})`; x.lineWidth = mobile ? 5 : 4;
    x.shadowColor = 'rgba(130,90,255,.9)'; x.shadowBlur = 22; x.stroke();
    x.beginPath(); x.arc(m, m, R * 1.02, 0, TAU);
    x.strokeStyle = 'rgba(200,248,255,.75)'; x.lineWidth = mobile ? 1.8 : 1.3;
    x.shadowColor = 'rgba(94,228,245,.9)'; x.shadowBlur = 12; x.stroke();
    holeRing = c;
  }

  /* Диск: частицы по эллипсам, сгруппированы по цвету и яркости (≈16 вызовов stroke на весь диск). */
  const DISK_COL = ['235,252,255', '140,236,250', '120,110,235', '70,170,220'];
  const DISK_W = [1.62, 1.26, .84, .84];
  const buckets = Array.from({ length: 16 }, () => []);

  /* Нажатие на дыру: волна расходится от точки касания, диск на секунду разгоняется */
  const pulses = [];
  let energy = 0;
  stage.addEventListener('pointerdown', e => {
    pulses.push({ x: e.clientX, y: e.clientY, t: 0 });
    if (pulses.length > 4) pulses.shift();
    energy = 1;
    const hint = document.getElementById('tapHint'); if (hint) hint.classList.add('used');
    if (e.isTrusted && navigator.vibrate) { try { navigator.vibrate(12); } catch (err) {} }
  });
  function drawPulses(dt, hk) {
    if (!pulses.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += dt;
      const k = p.t / 1.3;
      if (k >= 1) { pulses.splice(i, 1); continue; }
      const rad = R * hk * (.4 + k * 5), a = (1 - k) * (1 - k);
      ctx.lineWidth = 2.2 * (1 - k) + .6;
      ctx.strokeStyle = `rgba(150,236,255,${(a * .85).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(150,110,255,${(a * .6).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, rad * .72, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  function stepDisk(dt) {
    energy = Math.max(0, energy - dt * 1.1);
    dt *= 1 + energy * 3.2;
    for (const p of disk) {
      const k = p.r / R;
      p.a += (1.4 / Math.pow(k, 1.5)) * p.s * dt * 1.6;
      p.r -= p.f * R * dt;
      if (p.r < R * 1.32) spawn(p, false);
    }
  }
  function drawDisk(front) {
    const tilt = view.tilt, rot = view.rot, cr = Math.cos(rot), sr = Math.sin(rot);
    for (const p of disk) {
      if ((Math.sin(p.a) > 0) !== front) continue;
      const ca = Math.cos(p.a) * p.r, sa = Math.sin(p.a) * p.r * tilt;
      const pa = p.a - .12 * p.s;
      const cb = Math.cos(pa) * p.r, sb = Math.sin(pa) * p.r * tilt;
      const heat = clamp(1 - (p.r / R - 1.35) / 2.4, 0, 1);
      const doppler = .55 + .45 * -Math.cos(p.a);
      const alpha = clamp((.18 + heat * .55) * doppler, .05, .9);
      const cls = heat > .7 ? 0 : heat > .4 ? 1 : p.h > .5 ? 2 : 3;
      const a = cls > 1 ? alpha * .9 : alpha;
      const lvl = Math.min(3, (a / .9 * 4) | 0);
      buckets[cls * 4 + lvl].push(
        cx + cb * cr - sb * sr, cy + cb * sr + sb * cr,
        cx + ca * cr - sa * sr, cy + ca * sr + sa * cr);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 16; k++) {
      const seg = buckets[k];
      if (!seg.length) continue;
      ctx.strokeStyle = `rgba(${DISK_COL[k >> 2]},${((k & 3) + .6) / 4 * .95})`;
      ctx.lineWidth = DISK_W[k >> 2] * (mobile ? 1.4 : 1.1);
      ctx.beginPath();
      for (let i = 0; i < seg.length; i += 4) { ctx.moveTo(seg[i], seg[i + 1]); ctx.lineTo(seg[i + 2], seg[i + 3]); }
      ctx.stroke();
      seg.length = 0;
    }
    ctx.restore();
  }

  // hx, hy — где сейчас центр дыры на экране, hk — масштаб, ha — прозрачность (дыра «оседает» за контентом слабее, но живая).
  function drawHole(now, dt, hx, hy, hk, ha) {
    ctx.clearRect(0, 0, W, H);
    if (!holeBg) buildSprites();
    ctx.save();
    ctx.translate(hx, hy); ctx.scale(hk, hk); ctx.globalAlpha = ha;
    ctx.drawImage(holeBg, cx - R * 5, cy - R * 5, R * 10, R * 10);
    drawDisk(false);
    // Задняя часть диска «перегибается» над тенью (гравитационная линза).
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(cx, cy); ctx.rotate(view.rot);
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.ellipse(0, -R * .06, R * (1.28 + k * .1), R * (1.18 + k * .1), 0, Math.PI * 1.04, Math.PI * 1.96);
      ctx.strokeStyle = `rgba(${k === 0 ? '230,252,255' : k === 1 ? '120,225,250' : '150,110,250'},${((.46 - k * .12) * (.85 + .15 * Math.sin(now * .002 + k))).toFixed(3)})`;
      ctx.lineWidth = k ? 3 : 1.8; ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(0, R * .1, R * 1.18, R * .9, 0, Math.PI * .12, Math.PI * .88);
    ctx.strokeStyle = 'rgba(120,225,250,.24)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
    ctx.drawImage(holeCore, cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha *= .85 + .15 * Math.sin(now * .0025);
    ctx.drawImage(holeRing, cx - ringSize / 2, cy - ringSize / 2, ringSize, ringSize);
    ctx.restore();
    drawDisk(true);
    ctx.restore();
    drawPulses(dt || 0, hk);
  }

  /* Наклон диска следует за пальцем или мышью относительно того места, где дыра сейчас */
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  addEventListener('pointermove', e => {
    view.tTilt = .26 + clamp((e.clientY - pos.y) / innerHeight, -1, 1) * .14;
    view.tRot = -.2 + clamp((e.clientX - pos.x) / innerWidth, -1, 1) * .25;
  }, { passive: true });

  /* Спутники «ПК» и «ТЕЛЕФОН» летают вокруг дыры по наклонной орбите */
  const sats = [...layer.querySelectorAll('.sat')];
  function placeSats(now, hx, hy, hk, ha) {
    const rho = R * 2.45 * hk, cr = Math.cos(view.rot), sr = Math.sin(view.rot);
    sats.forEach((el, i) => {
      const a = now * .00055 * (i ? -1 : 1) + i * 2.4;
      const ex = Math.cos(a) * rho, ey = Math.sin(a) * rho * view.tilt * 1.9, front = Math.sin(a) > 0;
      el.style.transform = `translate(${(hx + ex * cr - ey * sr).toFixed(1)}px,${(hy + ex * sr + ey * cr).toFixed(1)}px) translate(-50%,-50%) scale(${((front ? 1.05 : .8) * Math.max(.7, hk)).toFixed(3)})`;
      el.style.opacity = ((front ? 1 : .55) * ha).toFixed(3);
    });
  }

  /* Гироскоп: на телефоне наклон устройства наклоняет диск и двигает звёзды (на iPhone включается первым касанием дыры) */
  let gyroOn = false;
  function onTilt(e) {
    if (e.gamma == null || e.beta == null) return;
    const gx = clamp(e.gamma / 28, -1, 1), gy = clamp((e.beta - 55) / 30, -1, 1);
    view.tTilt = .26 + gy * .13; view.tRot = -.2 + gx * .3;
    par.tx = gx; par.ty = gy;
  }
  function enableGyro() {
    if (gyroOn || typeof DeviceOrientationEvent === 'undefined') return;
    const DO = DeviceOrientationEvent;
    if (typeof DO.requestPermission === 'function') {
      DO.requestPermission().then(s => { if (s === 'granted') { gyroOn = true; addEventListener('deviceorientation', onTilt, { passive: true }); } }).catch(() => {});
    } else { gyroOn = true; addEventListener('deviceorientation', onTilt, { passive: true }); }
  }
  if (matchMedia('(pointer:coarse)').matches && !reduced && typeof DeviceOrientationEvent !== 'undefined') {
    if (typeof DeviceOrientationEvent.requestPermission !== 'function') enableGyro();
    else stage.addEventListener('click', enableGyro, { once: true });
  }

  /* Автокачество: если кадры идут медленнее ~38 fps, эффекты упрощаются сами */
  function applyQuality() {
    if (quality >= 1) { trail.length = 0; shoots.length = 0; }
    disk.length = Math.max(90, Math.floor(disk.length * .72));
  }
  let ema = 16, qFrames = 0;

  /* ================= Цикл ================= */
  let last = performance.now();
  const smooth = p => p * p * (3 - 2 * p);

  function frame(now) {
    const raw = now - last;
    const dt = Math.min(.05, raw / 1000); last = now;
    if (raw < 250 && !document.hidden && !reduced) {
      ema += (raw - ema) * .05;
      if (++qFrames % 90 === 0 && ema > 26 && quality < 2) { quality++; applyQuality(); ema = 16; }
    }
    drawStars(now, dt);
    // Положение дыры: на первом экране она на своём месте. При прокрутке она не остаётся позади,
    // а плавно едет за вами и «оседает» за контентом: слабее, чуть меньше, но светится и живёт.
    const sr = stage.getBoundingClientRect(), sy = scrollY;
    const e = smooth(clamp(sy / Math.max(sr.height * .75, 240), 0, 1));
    const dockX = W * (mobile ? .5 : .76), dockY = H * (mobile ? .52 : .5);
    const hx = (sr.left + sr.width / 2) * (1 - e) + dockX * e;
    const hy = (sr.top + sr.height / 2) * (1 - e) + dockY * e;
    const hk = 1 - e * (mobile ? .22 : .12), ha = 1 - e * .56;
    pos.x = hx; pos.y = hy;
    const rs = R * 5;
    ring.style.transform = `translate(${(hx - rs / 2).toFixed(1)}px,${(hy - rs / 2).toFixed(1)}px) rotate(${(sy * .09).toFixed(2)}deg) scale(${hk.toFixed(3)})`;
    ring.style.opacity = ha.toFixed(3);

    view.tilt += (view.tTilt - view.tilt) * .06;
    view.rot += (view.tRot - view.rot) * .06;
    if (!reduced) stepDisk(dt);
    drawHole(now, dt, hx, hy, hk, ha);
    if (sats.length && !reduced) placeSats(now, hx, hy, hk, ha);
    if (!reduced) requestAnimationFrame(frame);
  }

  let rz, lw = 0, lh = 0;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      layoutStars();
      // На телефоне адресная строка двигает высоту: дыру пересчитываем только при реальной смене размера.
      if (Math.abs(innerWidth - lw) >= 2 || Math.abs(innerHeight - lh) >= 140) { layoutHole(); lw = innerWidth; lh = innerHeight; }
      if (reduced) frame(performance.now());
    }, 120);
  });
  if (reduced) addEventListener('scroll', () => requestAnimationFrame(() => frame(performance.now())), { passive: true });

  layoutStars(); layoutHole(); lw = innerWidth; lh = innerHeight;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutHole);
  requestAnimationFrame(frame);
})();
