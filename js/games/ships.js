/* ⛵ Schiffe beladen: So viele Kisten aufs Boot, wie das Segel zeigt – zu viele, und es kippt! */
M.register('ships', {
  name: 'Schiffe beladen', icon: '⛵',
  howto: r => r === 1 ? 'Auf dem Segel steht, wie viele Kisten das Boot tragen kann. Pack genau so viele drauf und drück auf Ablegen! Aber Vorsicht – zu viele, und es kippt!'
    : 'Auf dem Segel steht, wie viele Kisten das Boot tragen kann – mal als Zahl, mal als Würfel oder Aufgabe. Pack genau so viele drauf und leg ab!',
  start(stage, { round, done }) {
    const goal = 5;
    const CARGO = ['📦', '🍎', '🧸', '🍌', '💎', '🥥', '🎁'];
    let n = 0, alive = true, busy = false, want = 0, have = 0, cargo = '📦', last = 0;
    stage.innerHTML = `<div class="sh-sea"><div class="sh-boat" id="shBoat"><div class="sh-sail" id="shSail"></div><div class="sh-load" id="shLoad"></div><div class="sh-hull">⛵</div></div><div class="sh-waves">🌊🌊🌊🌊🌊🌊</div></div>
      <div class="sh-pile" id="shPile"></div>
      <div class="shop-btns"><button class="btn" id="shOff">− Kiste</button><button class="btn green" id="shGo">⚓ Ablegen!</button></div>`;
    const $s = q => stage.querySelector(q), boat = $s('#shBoat');
    const hud = () => M.setHud(`⛵ ${n}/${goal}`);
    function next() {
      hud(); busy = false; have = 0;
      do { want = round === 1 ? M.rnd(6) + 1 : round === 2 ? M.rnd(8) + 2 : M.rnd(9) + 2; } while (want === last); last = want;
      cargo = M.pick(CARGO);
      const kind = round === 1 ? 'num' : M.pick(round === 2 ? ['num', 'dice'] : ['num', 'dice', 'sum']);
      let sail, speak;
      if (kind === 'dice' && want <= 6) { sail = `<div style="width:62px;height:62px">${M.dice(want, 'small')}</div>`; speak = 'Schau auf den Würfel!'; }
      else if (kind === 'sum') { const a = M.rnd(want - 1) + 1; sail = `<b style="font-size:1.6rem">${a}+${want - a}</b>`; speak = `Rechne: ${a} plus ${want - a}.`; }
      else { sail = `<b>${want}</b>`; speak = `Das Boot trägt ${want} Kisten.`; }
      $s('#shSail').innerHTML = sail;
      boat.className = 'sh-boat'; boat.style.transform = '';
      render();
      const pile = $s('#shPile'); pile.innerHTML = '';
      for (let i = 0; i < 12; i++) { const c = document.createElement('button'); c.className = 'sh-crate'; c.textContent = cargo; c.onclick = () => add(c); pile.appendChild(c); }
      M.say(speak + ' Pack die Kisten drauf!');
    }
    function render() {
      $s('#shLoad').innerHTML = Array.from({ length: have }, () => `<span>${cargo}</span>`).join('');
      boat.style.setProperty('--sink', Math.min(have, 12) * 1.2 + 'px');
    }
    function add(c) {
      if (!alive || busy || c.classList.contains('used')) return;
      c.classList.add('used'); have++; M.plop(); render(); M.say(String(have), 1.1);
      if (have > want) boat.classList.add('wobble');
    }
    $s('#shOff').onclick = () => {
      if (!alive || busy || !have) return;
      have--; M.blip(); render(); M.say(String(have), 1.1);
      const used = [...stage.querySelectorAll('.sh-crate.used')]; if (used.length) used[used.length - 1].classList.remove('used');
      if (have <= want) boat.classList.remove('wobble');
    };
    $s('#shGo').onclick = () => {
      if (!alive || busy) return;
      if (have === want) {
        busy = true; M.ding(); M.addRiddle(); M.sparkle(boat, 12, ['⭐', '✨', cargo]);
        M.say(`${want} Kisten! Leinen los! ${M.pick(M.PRAISE)}`);
        boat.classList.add('sail'); n++;
        setTimeout(() => { if (!alive) return; if (n >= goal) { hud(); alive = false; done(); } else next(); }, 2600);
      } else if (have > want) {
        busy = true; M.boop(); boat.classList.remove('wobble'); boat.classList.add('tip');
        M.tone(200, 0, .5, 'sawtooth', .08); M.say(`Platsch! ${have} sind zu viele. Das Boot trägt nur ${want}!`);
        setTimeout(() => { if (!alive) return; boat.classList.remove('tip'); have = 0; stage.querySelectorAll('.sh-crate.used').forEach(c => c.classList.remove('used')); render(); busy = false; }, 2200);
      } else { M.boop(); M.wiggle(boat); M.say(`Das sind erst ${have}. Da passt noch mehr drauf!`); }
    };
    next();
    return () => { alive = false; };
  }
});
