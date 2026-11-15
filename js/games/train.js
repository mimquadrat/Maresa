/* 🚂 Silben-Zug: Silben in der richtigen Reihenfolge in die Waggons laden */
M.register('train', {
  name: 'Silben-Zug', icon: '🚂',
  howto: r => 'Hör genau hin und lade die Silben der Reihe nach in den Zug. Dann fährt er los!',
  start(stage, { round, done }) {
    const goal = 4;
    const pool = M.WORDS.filter(w => { const n = w[2].split('-').length; return round === 1 ? n === 2 : n >= 2; });
    const words = M.shuffle(pool.slice()).slice(0, goal);
    let idx = 0, alive = true;
    stage.innerHTML = `<div class="big-emoji" style="margin-top:6px" id="tEmoji"></div>
      <div class="track"><div class="rails"></div><div class="train" id="train"></div></div>
      <div class="syll-cards" id="sylls"></div>
      <button class="speak" id="tSpeak" style="margin-top:14px">🔊</button>`;
    const trainEl = stage.querySelector('#train'), syllsEl = stage.querySelector('#sylls');
    const hud = () => M.setHud(`🚂 ${idx}/${goal}`);
    function load() {
      hud();
      const [w, e, s] = words[idx], parts = s.split('-').map(x => x.toUpperCase());
      let next = 0;
      stage.querySelector('#tEmoji').textContent = e;
      trainEl.style.transition = 'none'; trainEl.style.transform = 'translateX(0)';
      trainEl.innerHTML = '<div class="loco">🚂</div>' + parts.map(() => '<div class="wagon empty"></div>').join('');
      const wagons = trainEl.querySelectorAll('.wagon');
      syllsEl.innerHTML = '';
      const hear = () => M.say(`${w}. ${s.split('-').join(' ... ')}`, 0.8);
      stage.querySelector('#tSpeak').onclick = hear;
      setTimeout(hear, 300);
      M.shuffle(parts.map((p, i) => ({ p, i }))).forEach(({ p, i }) => {
        const b = document.createElement('button'); b.className = 'syll'; b.textContent = p;
        b.onclick = () => {
          if (!alive || b.classList.contains('used')) return;
          if (parts[next] === p) {
            wagons[next].textContent = p; wagons[next].classList.remove('empty');
            b.classList.add('used'); M.say(p.toLowerCase(), 0.9); M.plop();
            next++;
            if (next === parts.length) {
              M.ding(); M.addRiddle(); M.sparkle(trainEl, 10);
              setTimeout(() => {
                M.say(`${w}! Tschu tschu!`); M.tone(392, 0, .3, 'square', .08); M.tone(330, .35, .4, 'square', .08);
                trainEl.style.transition = 'transform 2.2s ease-in';
                trainEl.style.transform = `translateX(${stage.clientWidth + 50}px)`;
              }, 500);
              setTimeout(() => { if (!alive) return; idx++; if (idx >= goal) { hud(); alive = false; done(); } else load(); }, 3000);
            }
          } else { M.wiggle(b); M.boop(); M.say('Hör nochmal: ' + s.split('-').join(' ... '), 0.8); }
        };
        syllsEl.appendChild(b);
      });
    }
    load();
    return () => { alive = false; };
  }
});
