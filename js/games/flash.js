/* ⚡ Würfel-Blitz: Punkte blitzen kurz auf – wie viele waren es? (auf einen Blick sehen, nicht zählen) */
M.register('flash', {
  name: 'Würfel-Blitz', icon: '⚡',
  howto: r => r === 1 ? 'Ein Würfel blitzt ganz kurz auf. Schau genau hin – wie viele Punkte waren es? Nicht zählen, auf einen Blick sehen!' : 'Würfel und Zehnerfelder blitzen ganz kurz auf. Wie viele Punkte waren es? Auf einen Blick sehen!',
  start(stage, { round, done }) {
    const goal = 8;
    const showMs = round === 1 ? 1500 : round === 2 ? 1200 : 1000;
    let n = 0, alive = true, busy = true, tries = 0, ans = 0, lastAns = 0, html = '';
    stage.innerHTML = `<div class="fl-box" id="flBox"><div class="fl-cover">⚡</div></div>
      <button class="btn pink" id="flGo" style="font-size:1.3rem;padding:12px 26px">⚡ Blitz!</button>
      <div class="fl-nums" id="flNums"></div>`;
    const $s = q => stage.querySelector(q), box = $s('#flBox'), nums = $s('#flNums');
    const max = round === 1 ? 6 : 10;
    const hud = () => M.setHud(`⚡ ${n}/${goal}`);
    for (let i = 1; i <= max; i++) {
      const b = document.createElement('button'); b.className = 'fl-n'; b.textContent = i;
      b.onclick = () => choose(i, b); nums.appendChild(b);
    }
    function make() {
      do {
        const kind = round === 1 ? 'dice' : M.pick(round === 2 ? ['dice', 'two', 'field'] : ['two', 'field', 'field']);
        if (kind === 'dice') { ans = M.rnd(6) + 1; html = M.dice(ans); }
        else if (kind === 'two') { const a = M.rnd(5) + 1, b = M.rnd(Math.min(6, 10 - a)) + 1; ans = a + b; html = `<div style="display:flex;gap:14px">${M.dice(a)}${M.dice(b)}</div>`; }
        else { ans = M.rnd(10) + 1; html = M.field(ans); }
      } while (ans === lastAns);
      lastAns = ans;
    }
    function flash(again) {
      busy = true; if (!again) make();
      box.innerHTML = html; box.classList.add('lit'); M.tone(1200, 0, .08, 'sine', .08);
      setTimeout(() => { if (!alive) return; box.classList.remove('lit'); box.innerHTML = '<div class="fl-cover">❔</div>'; busy = false; M.say('Wie viele waren es?'); }, showMs);
    }
    function next() { hud(); tries = 0; $s('#flGo').textContent = '⚡ Blitz!'; $s('#flGo').disabled = false; busy = true; box.innerHTML = '<div class="fl-cover">⚡</div>'; }
    $s('#flGo').onclick = () => { if (!alive) return; const again = $s('#flGo').textContent.includes('Nochmal'); $s('#flGo').disabled = true; flash(again); };
    function choose(v, b) {
      if (!alive || busy) return;
      if (v === ans) {
        busy = true; b.classList.add('right'); M.ding(); M.addRiddle(); M.sparkle(b, 10);
        box.innerHTML = html;
        M.say(`${ans}! ${M.pick(M.PRAISE)}`); n++;
        setTimeout(() => { b.classList.remove('right'); if (!alive) return; if (n >= goal) { hud(); alive = false; done(); } else next(); }, 1600);
      } else {
        tries++; M.wiggle(b); M.boop();
        if (tries >= 2) { box.innerHTML = html; M.say(`Schau, jetzt bleibt es stehen. Wie viele sind es?`); }
        else { M.say('Fast! Schau nochmal hin.'); $s('#flGo').textContent = '⚡ Nochmal blitzen'; $s('#flGo').disabled = false; busy = true; }
      }
    }
    next();
    setTimeout(() => alive && M.say('Drück auf Blitz, wenn du bereit bist!'), 300);
    return () => { alive = false; };
  }
});
