/* 🏠 Zahlenhaus: Im ganzen Haus wohnen auf jeder Etage gleich viele – fehlende Bewohner finden */
M.register('numhouse', {
  name: 'Zahlenhaus', icon: '🏠',
  howto: r => 'Auf jeder Etage im Zahlenhaus wohnen zusammen genau so viele, wie auf dem Dach steht. Wie viele fehlen noch? Tipp die Zahl an!',
  start(stage, { round, done }) {
    const houses = round === 1 ? 2 : 3;
    const PETS = ['🐱', '🐶', '🐰', '🐻', '🐭', '🐸', '🐥', '🦊'];
    let h = 0, alive = true, T = 5, floors = [], cur = 0, tries = 0, busy = false;
    stage.innerHTML = `<div class="nh-house" id="nhHouse"></div><div class="fl-nums" id="nhNums"></div>`;
    const $s = q => stage.querySelector(q);
    const hud = () => M.setHud(`🏠 ${h}/${houses}`);
    const pets = (k, e) => `<span class="nh-pets">${e.repeat(k) || '·'}</span>`;
    function build() {
      hud();
      T = round === 1 ? (h === 0 ? 4 : 5) : round === 2 ? 5 + M.rnd(3) : 6 + M.rnd(5);
      const nF = Math.min(T + 1, round === 1 ? 3 : 4);
      const as = M.shuffle([...Array(T + 1).keys()]).slice(0, nF).sort((a, b) => b - a);
      const pa = M.pick(PETS), pb = M.pick(PETS.filter(p => p !== pa));
      floors = as.map(a => ({ a, left: Math.random() < .5, pa, pb }));
      cur = 0; tries = 0; busy = false;
      render();
      const nums = $s('#nhNums'); nums.innerHTML = '';
      for (let i = 0; i <= T; i++) { const b = document.createElement('button'); b.className = 'fl-n'; b.textContent = i; b.onclick = () => choose(i, b); nums.appendChild(b); }
      say();
    }
    function say() {
      const f = floors[cur]; if (!f) return;
      M.say(`Im Haus wohnen immer ${T}. Hier sind schon ${f.a}. Wie viele fehlen noch?`);
    }
    function render() {
      let html = `<div class="roof nh-roof">${T}</div><div class="nh-body">`;
      floors.forEach((f, i) => {
        const known = `<span>${f.a}${pets(f.a, f.pa)}</span>`;
        const missing = i < cur ? `<span class="ok">${T - f.a}${pets(T - f.a, f.pb)}</span>` : `<span class="q${i === cur ? ' now' : ''}">?</span>`;
        html += `<div class="nh-floor${i === cur ? ' cur' : ''}">${f.left ? known + missing : missing + known}</div>`;
      });
      $s('#nhHouse').innerHTML = html + '</div>';
      const c = $s('.nh-floor.cur'); if (c) c.onclick = say;
    }
    function choose(v, b) {
      if (!alive || busy) return;
      const f = floors[cur];
      if (v === T - f.a) {
        M.plop(); M.addRiddle(); b.classList.add('right'); setTimeout(() => b.classList.remove('right'), 500);
        M.say(`${f.a} und ${v} sind ${T}!`); cur++; tries = 0; render();
        if (cur >= floors.length) {
          busy = true; M.ding(); M.sparkle($s('#nhHouse'), 16, ['🏠', '⭐', '✨', f.pb]);
          setTimeout(() => M.say(`Das ganze Haus ist voll! ${M.pick(M.PRAISE)}`), 1400);
          h++; setTimeout(() => { if (!alive) return; if (h >= houses) { hud(); alive = false; done(); } else build(); }, 3400);
        } else setTimeout(() => alive && say(), 1500);
      } else {
        tries++; M.wiggle(b); M.boop();
        M.say(tries >= 2 ? `Zähl von ${f.a} weiter bis ${T}. Wie viele Finger brauchst du?` : `${f.a} und ${v} sind ${f.a + v}. Wir brauchen ${T}!`);
      }
    }
    build();
    return () => { alive = false; };
  }
});
