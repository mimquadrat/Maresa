/* ✏️ Buchstaben-Spur: Buchstaben mit dem Finger in der richtigen Schreibrichtung nachfahren */
(() => {
  // Striche in Koordinaten 0..1 (x nach rechts, y nach unten), in der Reihenfolge, wie man sie schreibt
  const arc = (cx, cy, rx, ry, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
  const SHAPES = {
    I: [[[.5, .12], [.5, .88]]],
    T: [[[.5, .12], [.5, .88]], [[.22, .12], [.78, .12]]],
    M: [[[.2, .12], [.2, .88]], [[.2, .12], [.5, .62], [.8, .12], [.8, .88]]],
    N: [[[.25, .12], [.25, .88]], [[.25, .12], [.75, .88], [.75, .12]]],
    A: [[[.5, .12], [.2, .88]], [[.5, .12], [.8, .88]], [[.32, .6], [.68, .6]]],
    O: [arc(.5, .5, .3, .38, -90, -450, 28)],
    U: [[[.25, .12], [.25, .6]].concat(arc(.5, .6, .25, .28, 180, 0, 12).slice(1), [[.75, .12]])],
    S: [arc(.5, .31, .24, .19, -20, -270, 12).concat(arc(.5, .69, .25, .19, -90, 160, 12).slice(1))],
    R: [[[.28, .12], [.28, .88]], [[.28, .12], [.5, .12]].concat(arc(.5, .31, .22, .19, -90, 90, 10).slice(1), [[.28, .5], [.75, .88]])],
    E: [[[.28, .12], [.28, .88]], [[.28, .12], [.72, .12]], [[.28, .5], [.65, .5]], [[.28, .88], [.72, .88]]],
    L: [[[.3, .12], [.3, .88], [.72, .88]]]
  };
  // Strich in gleichmäßige Prüfpunkte zerlegen
  function sample(stroke, step = .07) {
    const out = [stroke[0]];
    for (let i = 1; i < stroke.length; i++) {
      const [x0, y0] = stroke[i - 1], [x1, y1] = stroke[i], d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(d / step));
      for (let k = 1; k <= n; k++) out.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
    }
    return out;
  }

  M.register('trace', {
    name: 'Buchstaben-Spur', icon: '✏️',
    howto: r => 'Fahr den Buchstaben mit dem Finger nach! Fang immer beim grünen Punkt an und folge dem Pfeil.',
    start(stage, { round, done }) {
      const goal = 4;
      const avail = M.LEARNED.filter(l => SHAPES[l]);
      const letters = [];
      M.NEWEST.filter(l => SHAPES[l]).forEach(l => letters.push(l));
      while (letters.length < goal) { const l = M.pick(avail); if (letters[letters.length - 1] !== l && letters.filter(x => x === l).length < 2) letters.push(l); }
      M.shuffle(letters);
      let idx = 0, alive = true, stroke = 0, cp = 0, strokes = [], trail = [], drawing = false, busy = false;
      stage.innerHTML = `<div class="tr-top"><span id="trLetter"></span><button class="speak" id="trSpeak">🔊</button></div><div class="tr-wrap"><canvas></canvas></div>`;
      const cv = stage.querySelector('canvas'), ctx = cv.getContext('2d'), wrap = stage.querySelector('.tr-wrap');
      let S = 300, ox = 0, oy = 0;
      const hud = () => M.setHud(`✏️ ${idx}/${goal}`);
      const P = ([x, y]) => [ox + x * S, oy + y * S];
      function fit() {
        const dpr = window.devicePixelRatio || 1, w = wrap.clientWidth, h = wrap.clientHeight;
        cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        S = Math.min(w, h) * .94; ox = (w - S) / 2; oy = (h - S) / 2; draw();
      }
      function line(pts, color, width, dash) {
        ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; if (dash) ctx.setLineDash(dash);
        ctx.beginPath(); pts.forEach((p, i) => { const [x, y] = P(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.restore();
      }
      function draw() {
        const w = cv.width, h = cv.height; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h); ctx.restore();
        // Hilfslinien wie im Schreibheft
        ctx.save(); ctx.strokeStyle = 'rgba(176,92,255,.18)'; ctx.lineWidth = 2;
        [.12, .5, .88].forEach(y => { ctx.beginPath(); ctx.moveTo(ox, oy + y * S); ctx.lineTo(ox + S, oy + y * S); ctx.stroke(); }); ctx.restore();
        strokes.forEach((st, i) => {
          line(st.raw, '#efe4ff', S * .13);
          if (i < stroke) line(st.raw, '#ff4fa3', S * .09);
        });
        if (stroke < strokes.length) {
          const st = strokes[stroke];
          line(st.raw, 'rgba(176,92,255,.5)', 4, [10, 10]);
          if (cp > 0) line(st.pts.slice(0, cp), '#ff4fa3', S * .09);
          // Startpunkt, Nummer und Pfeil
          const [sx, sy] = P(st.pts[cp]); const tgt = st.pts[Math.min(cp + 2, st.pts.length - 1)], [tx, ty] = P(tgt);
          ctx.save(); ctx.fillStyle = '#2fbf71'; ctx.beginPath(); ctx.arc(sx, sy, S * .055, 0, 7); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(S * .06)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(cp ? '▶' : String(stroke + 1), sx, sy + 1);
          const a = Math.atan2(ty - sy, tx - sx), L = S * .1, ax = sx + Math.cos(a) * S * .1, ay = sy + Math.sin(a) * S * .1;
          ctx.strokeStyle = '#2fbf71'; ctx.lineWidth = 5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + Math.cos(a) * L, ay + Math.sin(a) * L);
          ctx.lineTo(ax + Math.cos(a) * L - Math.cos(a - .5) * 14, ay + Math.sin(a) * L - Math.sin(a - .5) * 14);
          ctx.moveTo(ax + Math.cos(a) * L, ay + Math.sin(a) * L); ctx.lineTo(ax + Math.cos(a) * L - Math.cos(a + .5) * 14, ay + Math.sin(a) * L - Math.sin(a + .5) * 14); ctx.stroke(); ctx.restore();
        }
        if (trail.length > 1) { ctx.save(); ctx.strokeStyle = 'rgba(58,35,80,.35)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); trail.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore(); }
      }
      function load() {
        hud(); stroke = 0; cp = 0; trail = []; busy = false;
        const L = letters[idx];
        strokes = SHAPES[L].map(raw => ({ raw, pts: sample(raw) }));
        stage.querySelector('#trLetter').innerHTML = `${L}<small>${L.toLowerCase()}</small>`;
        const say = () => M.say(`Das ist das ${L}. Fahr es nach! Fang beim grünen Punkt an.`);
        stage.querySelector('#trSpeak').onclick = say; say();
        draw();
      }
      const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      function move(e) {
        if (!drawing || busy || !alive) return;
        const [x, y] = pos(e); trail.push([x, y]); if (trail.length > 60) trail.shift();
        const st = strokes[stroke], tol = S * .1;
        // mehrere Punkte auf einmal schaffen, wenn der Finger schnell ist
        let moved = false;
        while (cp < st.pts.length) { const [px, py] = P(st.pts[cp]); if (Math.hypot(px - x, py - y) < tol) { cp++; moved = true; } else break; }
        if (moved && cp % 3 === 0) M.tone(500 + cp * 30, 0, .05, 'sine', .05);
        if (cp >= st.pts.length) {
          stroke++; cp = 0; trail = []; drawing = false; M.plop();
          if (stroke >= strokes.length) {
            busy = true; draw(); M.ding(); M.addRiddle(); M.sparkle(cv, 16, ['⭐', '✨', '✏️', '💖']);
            M.say(`${M.pick(M.PRAISE)} Das ${letters[idx]} ist schön geworden!`);
            setTimeout(() => { if (!alive) return; idx++; if (idx >= goal) { hud(); alive = false; done(); } else load(); }, 2200);
            return;
          }
          M.say('Jetzt Strich ' + (stroke + 1) + '!');
        }
        draw();
      }
      cv.addEventListener('pointerdown', e => {
        if (busy) return; drawing = true; trail = [pos(e)];
        const st = strokes[stroke], [px, py] = P(st.pts[cp]), [x, y] = pos(e);
        if (Math.hypot(px - x, py - y) > S * .16) { M.boop(); M.say('Fang beim grünen Punkt an!'); drawing = false; trail = []; draw(); return; }
        try { cv.setPointerCapture(e.pointerId); } catch (_) {}
        move(e);
      });
      cv.addEventListener('pointermove', move);
      const up = () => { drawing = false; trail = []; draw(); };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      window.addEventListener('resize', fit); M.onResume(fit);
      fit(); load();
      return () => { alive = false; window.removeEventListener('resize', fit); };
    }
  });
})();
