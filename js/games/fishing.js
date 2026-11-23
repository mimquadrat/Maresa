/* 🎣 Wort-Angeln: Fische tragen Wörter – den Fisch angeln, dessen Wort zum Bild passt */
M.register('fishing', {
  name: 'Wort-Angeln', icon: '🎣',
  howto: r => 'Die Fische tragen Wörter! Lies sie und angle den Fisch mit dem Wort, das zum Bild passt.',
  start(stage, { round, done }) {
    const goal = 6, nFish = round === 1 ? 3 : 4;
    const FISH = ['🐟', '🐠', '🐡'];
    // Wörter, die ähnlich aussehen, sind die besten Ablenker (MAUS / MAIS / MOOS)
    const sim = (a, b) => { let s = 0; for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) s++; return s + (a.length === b.length ? 1 : 0); };
    let n = 0, alive = true, busy = false, tries = 0, cur = null, last = null;
    stage.innerHTML = `<div class="fi-top"><div class="fi-pic" id="fiPic"></div><button class="speak" id="fiSpeak">🔊</button></div><div class="fi-sea" id="fiSea"></div>`;
    const $s = q => stage.querySelector(q), sea = $s('#fiSea');
    const hud = () => M.setHud(`🎣 ${n}/${goal}`);
    function next() {
      hud(); tries = 0; busy = false;
      let t; do { t = M.pick(M.READ); } while (t === last); last = t;
      const others = M.READ.filter(r => r[0] !== t[0] && r[1] !== t[1]).map(r => [r, sim(r[0], t[0]) + Math.random() * 1.5]).sort((a, b) => b[1] - a[1]).slice(0, nFish - 1).map(x => x[0]);
      cur = t;
      $s('#fiPic').textContent = t[1];
      sea.innerHTML = '';
      const lanes = M.shuffle([...Array(nFish).keys()]);
      M.shuffle([t, ...others]).forEach((r, i) => {
        const f = document.createElement('button'); f.className = 'fish';
        const dir = i % 2 ? -1 : 1, dur = (round === 1 ? 9 : 7) + Math.random() * 3;
        f.style.top = (8 + lanes[i] * (84 / nFish)) + '%';
        f.style.animation = `${dir > 0 ? 'swimR' : 'swimL'} ${dur}s linear ${-Math.random() * dur}s infinite`;
        f.innerHTML = `<span class="fb" style="${dir > 0 ? 'transform:scaleX(-1)' : ''}">${M.pick(FISH)}</span><span class="fw">${r[0]}</span>`;
        f.onclick = () => choose(r, f);
        sea.appendChild(f);
      });
      const say = () => M.say('Welcher Fisch passt zum Bild?');
      $s('#fiSpeak').onclick = () => M.say(tries >= 2 ? 'Das Wort heißt ' + cur[0] : 'Lies die Wörter auf den Fischen. Welches passt zum Bild?');
      setTimeout(() => alive && say(), 300);
    }
    function choose(r, f) {
      if (!alive || busy) return;
      if (r === cur) {
        busy = true; f.classList.add('caught'); M.ding(); M.addRiddle(); M.sparkle(f, 12, ['💧', '⭐', '✨', '🐟']);
        M.say(`${r[0]}! ${M.pick(M.PRAISE)}`);
        n++;
        setTimeout(() => { if (!alive) return; if (n >= goal) { hud(); alive = false; done(); } else next(); }, 1800);
      } else {
        tries++; M.wiggle(f); M.boop();
        f.classList.add('away'); setTimeout(() => f.classList.remove('away'), 1200);
        M.say(`Da steht ${r[0]}. Such weiter!`);
        if (tries >= 2) [...sea.children].forEach(c => { if (c.querySelector('.fw').textContent === cur[0]) c.classList.add('hint'); });
      }
    }
    next();
    return () => { alive = false; };
  }
});
