/* 🫧 Buchstaben-Blasen: nur die gesuchten Buchstaben platzen lassen */
M.register('bubbles', {
  name: 'Buchstaben-Blasen', icon: '🫧',
  howto: r => r === 1 ? 'Blasen steigen auf! Tipp nur die Blasen mit dem gesuchten Buchstaben an.' : 'Tipp alle Blasen mit dem gesuchten Buchstaben an – egal ob groß oder klein!',
  start(stage, { round, done }) {
    const T = M.pick(M.LEARNED);
    const goal = round === 1 ? 8 : 10;
    const mixed = round >= 2;
    let hits = 0, alive = true;
    stage.innerHTML = '<div class="sky"></div>';
    const sky = stage.querySelector('.sky');
    const hud = () => M.setHud(`🫧 ${T}${mixed ? ' ' + T.toLowerCase() : ''} · ${hits}/${goal}`);
    hud();
    const announce = () => M.say(`Platz alle Blasen mit ${T}! ${T} wie ${M.wordsWith(T)[0][0]}.`);
    announce();
    const bubbles = [];
    function spawn() {
      if (!alive) return;
      const good = Math.random() < 0.42;
      let ch = good ? T : M.pick(M.LETTERS.filter(x => x !== T));
      if (mixed && Math.random() < 0.5) ch = ch.toLowerCase();
      const b = document.createElement('div');
      b.className = 'bubble'; b.textContent = ch;
      const W = sky.clientWidth, size = 76;
      const x = 8 + Math.random() * (W - size - 16);
      const o = { el: b, x, y: sky.clientHeight + 10, v: 0.7 + Math.random() * 0.5 + round * 0.15, good: ch.toUpperCase() === T, phase: Math.random() * 6, dead: false };
      b.style.left = x + 'px'; b.style.top = o.y + 'px';
      b.addEventListener('pointerdown', e => {
        e.preventDefault(); if (o.dead) return;
        if (o.good) {
          o.dead = true; b.classList.add('popped'); M.plop(); M.sparkle(b, 6);
          hits++; hud(); M.addRiddle();
          if (hits % 3 === 0) M.say(M.pick(M.PRAISE));
          setTimeout(() => b.remove(), 360);
          if (hits >= goal) { alive = false; setTimeout(done, 600); }
        } else { M.wiggle(b); M.boop(); M.say(`Das ist ${ch.toUpperCase()}. Wir suchen ${T}!`); }
      });
      sky.appendChild(b); bubbles.push(o);
    }
    let last = 0, spawnT = 0, raf;
    function frame(t) {
      if (!alive) return;
      const dt = last ? Math.min(50, t - last) / 16 : 1; last = t;
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = 55 - round * 5; }
      for (const o of bubbles) {
        if (o.dead) continue;
        o.y -= o.v * dt; o.phase += 0.03 * dt;
        o.el.style.transform = `translate(${Math.sin(o.phase) * 14}px, ${o.y - parseFloat(o.el.style.top)}px)`;
        if (o.y < -90) { o.dead = true; o.el.remove(); }
      }
      for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].dead) bubbles.splice(i, 1);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    M.onResume(() => { if (alive) { last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } });
    return () => { alive = false; cancelAnimationFrame(raf); };
  }
});
