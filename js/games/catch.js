/* 🧺 Fang-Spiel: nur Sachen fangen, die mit dem gesuchten Buchstaben anfangen */
M.register('catch', {
  name: 'Fang-Spiel', icon: '🧺',
  howto: r => 'Zieh dein Tier nach links und rechts und fang nur die Sachen, die mit dem gesuchten Buchstaben anfangen!',
  start(stage, { round, done }) {
    // Buchstaben mit genug passenden Bildern
    const letters = M.LEARNED.filter(L => M.wordsWith(L).length >= 2);
    const T = M.pick(letters);
    const good = M.wordsWith(T), bad = M.WORDS.filter(w => w[0][0].toUpperCase() !== T);
    const goal = round === 1 ? 6 : 8;
    let caught = 0, alive = true;
    stage.innerHTML = '<canvas class="catch-canvas"></canvas>';
    const cv = stage.querySelector('canvas'), ctx = cv.getContext('2d');
    let W = 0, H = 0, px = 0;
    function size() {
      const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      const dpr = window.devicePixelRatio || 1; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!px) px = W / 2;
    }
    size();
    const hud = () => M.setHud(`🧺 ${T} · ${caught}/${goal}`);
    hud();
    M.say(`Fang alles, was mit ${T} anfängt! Zum Beispiel ${good[0][0]}.`);
    const items = [], pops = [];
    let spawnT = 30, last = 0, raf;
    function spawn() {
      const isGood = Math.random() < 0.45;
      const w = M.pick(isGood ? good : bad);
      items.push({ x: 30 + Math.random() * (W - 60), y: -40, v: 1.3 + Math.random() * 0.8 + round * 0.25, w, good: isGood, rot: Math.random() * 6 });
    }
    function frame(t) {
      if (!alive) return;
      const dt = last ? Math.min(50, t - last) / 16 : 1; last = t;
      if (H < 50) { size(); raf = requestAnimationFrame(frame); return; }
      spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = 70 - round * 6; }
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
      // Zielbuchstabe groß im Hintergrund
      ctx.globalAlpha = .12; ctx.font = `900 ${Math.min(W, H) * .5}px sans-serif`; ctx.fillStyle = '#b05cff'; ctx.fillText(T, W / 2, H * .38); ctx.globalAlpha = 1; ctx.fillStyle = '#000';
      const py = H - 70, petSize = 64;
      for (const it of items) {
        it.y += it.v * dt; it.rot += 0.02 * dt;
        ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(Math.sin(it.rot) * .3);
        ctx.font = '46px sans-serif'; ctx.fillText(it.w[1], 0, 0); ctx.restore();
        if (!it.hit && it.y > py - 40 && it.y < py + 20 && Math.abs(it.x - px) < 52) {
          it.hit = true;
          if (it.good) {
            caught++; hud(); M.ding(); M.say(it.w[0] + '!'); M.addRiddle(); M.vibrate(30);
            pops.push({ x: it.x, y: py - 40, t: 30, txt: '⭐' });
            if (caught >= goal) { alive = false; setTimeout(done, 700); }
          } else { M.boop(); M.say(`${it.w[0]} fängt mit ${it.w[0][0].toUpperCase()} an.`); pops.push({ x: it.x, y: py - 40, t: 30, txt: '💨' }); }
        }
      }
      for (let i = items.length - 1; i >= 0; i--) if (items[i].hit || items[i].y > H + 40) items.splice(i, 1);
      for (const p of pops) { p.t -= dt; p.y -= 1.5 * dt; ctx.globalAlpha = Math.max(0, p.t / 30); ctx.font = '34px sans-serif'; ctx.fillText(p.txt, p.x, p.y); }
      ctx.globalAlpha = 1;
      for (let i = pops.length - 1; i >= 0; i--) if (pops[i].t <= 0) pops.splice(i, 1);
      // Korb + Tier
      ctx.font = '54px sans-serif'; ctx.fillText('🧺', px, py + 22);
      M.drawPet(ctx, px, py - 20, petSize * .8);
      raf = requestAnimationFrame(frame);
    }
    const moveTo = e => { const r = cv.getBoundingClientRect(); px = Math.max(30, Math.min(W - 30, e.clientX - r.left)); };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); moveTo(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') moveTo(e); });
    const onKey = e => { if (e.key === 'ArrowLeft') px = Math.max(30, px - 30); if (e.key === 'ArrowRight') px = Math.min(W - 30, px + 30); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', size);
    M.onResume(() => { size(); if (alive) { last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } });
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', size); };
  }
});
