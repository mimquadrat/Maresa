/* 🦇 Echo-Höhle: Die Höhle ruft Silben vom Silbenteppich – in der gleichen Reihenfolge antippen */
M.register('echo', {
  name: 'Echo-Höhle', icon: '🦇',
  howto: r => 'In der Höhle ruft ein Echo Silben! Hör gut zu und tipp die Silben auf dem Silbenteppich in der gleichen Reihenfolge an.',
  start(stage, { round, done }) {
    const lens = round === 1 ? [1, 2, 2, 3, 3] : [2, 2, 3, 3, 4];
    const goal = lens.length;
    // Silbenteppich: 3 Mitlaute × 3 Selbstlaute, die neuen Buchstaben sind immer dabei
    const cons = M.NEWEST.filter(c => M.SYLL_CONS.includes(c)).concat(M.shuffle(M.SYLL_CONS.filter(c => !M.NEWEST.includes(c)))).slice(0, 3);
    const vows = M.shuffle(M.SYLL_VOW.slice()).slice(0, 3);
    const grid = M.shuffle(cons.flatMap(c => vows.map(v => c + v)));
    let n = 0, alive = true, seq = [], pos = 0, listening = false, fails = 0;
    stage.innerHTML = `<div class="ec-cave"><div class="ec-bat" id="ecBat">🦇</div><div class="ec-say" id="ecSay">…</div></div>
      <div class="ec-carpet" id="ecGrid"></div>
      <button class="btn pink" id="ecAgain" style="margin-top:12px;font-size:1.15rem">🔊 Nochmal hören</button>`;
    const $s = q => stage.querySelector(q);
    const hud = () => M.setHud(`🦇 ${n}/${goal}`);
    const btns = grid.map(s => {
      const b = document.createElement('button'); b.className = 'ec-syl'; b.textContent = s;
      b.onclick = () => tap(s, b); $s('#ecGrid').appendChild(b); return b;
    });
    const wait = ms => new Promise(r => setTimeout(r, ms));
    async function call() {
      listening = false; pos = 0;
      const bat = $s('#ecBat'); bat.classList.add('call');
      $s('#ecSay').textContent = seq.map(() => '🔊').join(' ');
      for (const s of seq) { if (!alive) return; M.say(s.toLowerCase(), .75); await wait(1150); }
      bat.classList.remove('call');
      $s('#ecSay').textContent = seq.map(() => '❔').join(' ');
      listening = true;
    }
    function next() {
      hud(); fails = 0;
      seq = []; while (seq.length < lens[n]) { const s = M.pick(grid); if (seq[seq.length - 1] !== s) seq.push(s); }
      setTimeout(() => alive && call(), 500);
    }
    function tap(s, b) {
      if (!alive) return;
      M.say(s.toLowerCase(), .9);
      if (!listening) return;
      if (s === seq[pos]) {
        b.classList.remove('flashok'); void b.offsetWidth; b.classList.add('flashok'); M.plop();
        pos++;
        $s('#ecSay').textContent = seq.map((x, i) => i < pos ? x : '❔').join(' ');
        if (pos === seq.length) {
          listening = false; M.ding(); M.addRiddle(); M.sparkle($s('#ecBat'), 10);
          setTimeout(() => M.say(M.pick(M.PRAISE)), 600);
          n++;
          setTimeout(() => { if (!alive) return; if (n >= goal) { hud(); alive = false; done(); } else next(); }, 1800);
        }
      } else {
        listening = false; fails++; M.wiggle(b); M.boop();
        if (fails >= 2) { const t = btns[grid.indexOf(seq[pos])]; t.classList.add('hint'); setTimeout(() => t.classList.remove('hint'), 2500); }
        setTimeout(() => { if (!alive) return; M.say('Hör nochmal genau hin!'); setTimeout(() => alive && call(), 1300); }, 500);
      }
    }
    $s('#ecAgain').onclick = () => { if (listening || pos === 0) call(); };
    next();
    return () => { alive = false; };
  }
});
