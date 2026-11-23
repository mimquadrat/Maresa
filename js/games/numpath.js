/* 🐾 Zahlen-Weg: Steine in der richtigen Reihenfolge antippen – der Weg malt ein Bild */
(() => {
  // Bilder als Punktfolgen (0..1); der Weg verbindet sie der Reihe nach
  const ring = (n, f) => Array.from({ length: n }, (_, i) => f(i / n * Math.PI * 2 - Math.PI / 2, i));
  const SHAPES = [
    { name: 'ein Stern', e: '⭐', col: '#ffc531', pts: n => ring(n, (a, i) => { const r = i % 2 ? .2 : .42; return [.5 + r * Math.cos(a), .52 + r * Math.sin(a)]; }) },
    { name: 'ein Herz', e: '💖', col: '#ff4fa3', pts: n => ring(n, a => { const t = a + Math.PI / 2; return [.5 + .026 * 16 * Math.pow(Math.sin(t), 3), .47 - .026 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]; }) },
    { name: 'eine Sonne', e: '☀️', col: '#ff9f1c', pts: n => ring(n, a => [.5 + .38 * Math.cos(a), .52 + .38 * Math.sin(a)]) },
    { name: 'ein Diamant', e: '💎', col: '#4fb6ff', pts: n => ring(n, (a, i) => { const k = i / n; const p = [[.5, .1], [.85, .38], [.5, .92], [.15, .38]]; const s = k * 4, j = Math.floor(s), f = s - j, A = p[j], B = p[(j + 1) % 4]; return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f]; }) }
  ];
  M.register('numpath', {
    name: 'Zahlen-Weg', icon: '🐾',
    howto: r => r === 1 ? 'Tipp die Steine der Reihe nach an: 1, 2, 3 … Dein Weg malt ein Bild!' : 'Tipp die Steine der Reihe nach an – manchmal vorwärts, manchmal rückwärts! Dein Weg malt ein Bild.',
    start(stage, { round, done }) {
      const goal = 3;
      let k = 0, alive = true, order = [], pos = 0, shape = null, pts = [], tries = 0, shapes = M.shuffle(SHAPES.slice());
      stage.innerHTML = `<div class="np-task" id="npTask"></div><div class="np-wrap" id="npWrap"><svg id="npSvg"></svg><div class="np-pet" id="npPet"></div></div>`;
      const $s = q => stage.querySelector(q), wrap = $s('#npWrap'), svg = $s('#npSvg'), pet = $s('#npPet');
      pet.innerHTML = M.petHTML(36);
      const hud = () => M.setHud(`🐾 ${k}/${goal}`);
      let W = 300, H = 300;
      const xy = p => [p[0] * W, p[1] * H];
      function next() {
        hud(); pos = 0; tries = 0;
        const n = round === 1 ? (k === 0 ? 6 : 8) : 10;
        const back = round >= 2 && k === goal - 1;   // letzte Runde rückwärts
        shape = shapes[k % shapes.length];
        pts = shape.pts(n);
        order = Array.from({ length: n }, (_, i) => back ? n - i : i + 1);
        $s('#npTask').innerHTML = back ? `Rückwärts: <b>${n}</b> → <b>1</b>` : `Vorwärts: <b>1</b> → <b>${n}</b>`;
        wrap.querySelectorAll('.np-stone').forEach(s => s.remove());
        pts.forEach((p, i) => {
          const b = document.createElement('button'); b.className = 'np-stone'; b.textContent = order[i]; b.dataset.i = i;
          b.onclick = () => tap(i, b); wrap.appendChild(b);
        });
        pet.style.opacity = 0; layout();
        M.say(back ? `Jetzt rückwärts! Fang bei ${n} an.` : 'Fang bei 1 an!');
      }
      function layout() {
        W = wrap.clientWidth; H = wrap.clientHeight;
        svg.setAttribute('width', W); svg.setAttribute('height', H);
        wrap.querySelectorAll('.np-stone').forEach(b => { const [x, y] = xy(pts[+b.dataset.i]); b.style.left = x + 'px'; b.style.top = y + 'px'; });
        drawPath();
        if (pos) { const [x, y] = xy(pts[pos - 1]); pet.style.left = x + 'px'; pet.style.top = y + 'px'; }
      }
      function drawPath(closed) {
        if (pos < 2) { svg.innerHTML = ''; return; }
        const d = pts.slice(0, pos).map((p, i) => (i ? 'L' : 'M') + xy(p).map(v => v.toFixed(1)).join(' ')).join(' ') + (closed ? ' Z' : '');
        svg.innerHTML = `<path d="${d}" fill="${closed ? shape.col + '55' : 'none'}" stroke="${shape.col}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      function tap(i, b) {
        if (!alive || pos >= pts.length) return;
        if (i === pos) {
          b.classList.add('on'); pos++; M.tone(400 + pos * 50, 0, .12, 'triangle', .12); M.say(String(order[i]), 1.1);
          const [x, y] = xy(pts[i]); pet.style.opacity = 1; pet.style.left = x + 'px'; pet.style.top = y + 'px';
          tries = 0; drawPath();
          if (pos === pts.length) {
            drawPath(true); M.ding(); M.addRiddle(); M.sparkle(wrap, 16, [shape.e, '⭐', '✨']);
            wrap.insertAdjacentHTML('beforeend', `<div class="np-reveal">${shape.e}</div>`);
            setTimeout(() => M.say(`Das ist ${shape.name}! ${M.pick(M.PRAISE)}`), 700);
            k++;
            setTimeout(() => { if (!alive) return; wrap.querySelector('.np-reveal')?.remove(); if (k >= goal) { hud(); alive = false; done(); } else next(); }, 3000);
          }
        } else {
          tries++; M.wiggle(b); M.boop();
          M.say(tries >= 2 ? `Such die ${order[pos]}!` : `Das ist die ${order[i]}. Welche Zahl kommt jetzt?`);
          if (tries >= 2) { const t = wrap.querySelector(`.np-stone[data-i="${pos}"]`); t.classList.add('hint'); setTimeout(() => t.classList.remove('hint'), 2500); }
        }
      }
      window.addEventListener('resize', layout); M.onResume(layout);
      next();
      return () => { alive = false; window.removeEventListener('resize', layout); };
    }
  });
})();
