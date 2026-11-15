/* 🐸 Hüpf-Weg: auf dem Zahlenstrahl weiter- (und später zurück-)hüpfen */
M.register('hop', {
  name: 'Hüpf-Weg', icon: '🐸',
  howto: r => r === 1 ? 'Hüpf über die Steine im Fluss! Tipp auf den Stein, wo du landest.' : 'Hüpf vorwärts und rückwärts! Tipp auf den Stein, wo du landest.',
  start(stage, { round, done }) {
    const goal = 5, MAX = 10;
    let solved = 0, pos = 0, busy = false, alive = true, tries = 0, task = null;
    stage.innerHTML = `<div class="river"><div class="stones"></div><div class="frog"></div></div><div class="hop-task"></div>`;
    const stonesEl = stage.querySelector('.stones'), frog = stage.querySelector('.frog'), taskEl = stage.querySelector('.hop-task'), river = stage.querySelector('.river');
    stonesEl.style.gridTemplateColumns = `repeat(${MAX + 1}, 1fr)`;
    const stones = [];
    for (let i = 0; i <= MAX; i++) {
      const s = document.createElement('div'); s.className = 'stone'; s.textContent = i;
      s.onclick = () => choose(i, s);
      stonesEl.appendChild(s); stones.push(s);
    }
    frog.innerHTML = M.petHTML(40);
    const hud = () => M.setHud(`🐸 ${solved}/${goal}`);
    hud();
    function place(i) {
      const r = stones[i].getBoundingClientRect(), rr = river.getBoundingClientRect();
      frog.style.left = (r.left - rr.left + r.width / 2) + 'px';
      frog.style.top = (r.top - rr.top + 4) + 'px';
    }
    function newTask() {
      tries = 0;
      const minus = round >= 2 && Math.random() < 0.45;
      let start, k;
      if (minus) { start = 2 + M.rnd(MAX - 1); k = 1 + M.rnd(Math.min(start, round >= 3 ? 6 : 4)); }
      else { start = M.rnd(MAX - 1); k = 1 + M.rnd(Math.min(MAX - start, round >= 3 ? 6 : 4)); }
      task = { start, k, minus, target: minus ? start - k : start + k };
      pos = start; place(pos);
      stones.forEach((s, i) => { s.classList.toggle('start', i === start); s.classList.remove('target', 'right', 'wrong'); });
      taskEl.innerHTML = `Du bist auf <b>${start}</b>. Spring <b>${k}</b> ${minus ? 'zurück ⬅️' : 'weiter ➡️'}<br><span style="font-size:1rem;opacity:.7">${start} ${minus ? '−' : '+'} ${k} = ?</span>`;
      M.say(`Du bist auf ${start}. Spring ${k} ${minus ? 'zurück' : 'weiter'}! Wo landest du?`);
    }
    function hopTo(to, cb) {
      const dir = to > pos ? 1 : -1; let n = 0;
      const step = () => {
        if (!alive) return;
        if (pos === to) { cb && cb(); return; }
        pos += dir; n++; place(pos); M.tone(500 + n * 60, 0, .1, 'sine', .12); M.say(String(n), 1.1);
        setTimeout(step, 520);
      };
      step();
    }
    function choose(i, el) {
      if (busy || !task || !alive) return;
      if (i === task.target) {
        busy = true; el.classList.add('target');
        hopTo(i, () => {
          el.classList.add('right'); M.ding(); M.sparkle(el, 10); M.say(M.pick(M.PRAISE)); M.addRiddle();
          solved++; hud();
          setTimeout(() => { busy = false; if (solved >= goal) { alive = false; done(); } else newTask(); }, 1300);
        });
      } else {
        tries++; M.wiggle(el); M.boop();
        if (tries === 1) M.say('Fast! Zähl die Sprünge mit.');
        else { // vormachen
          busy = true; M.say('Ich zeig\'s dir. Zähl mit!');
          setTimeout(() => hopTo(task.target, () => { stones[task.target].classList.add('target'); setTimeout(() => { pos = task.start; place(pos); busy = false; M.say('Jetzt du! Tipp auf den leuchtenden Stein.'); }, 900); }), 900);
        }
      }
    }
    const onResize = () => place(pos);
    window.addEventListener('resize', onResize);
    M.onResume(() => setTimeout(onResize, 30));
    requestAnimationFrame(() => newTask());
    return () => { alive = false; window.removeEventListener('resize', onResize); };
  }
});
