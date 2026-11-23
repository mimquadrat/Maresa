/* 📮 Briefkasten: Das Bild auf dem Brief in den Briefkasten mit dem richtigen Anfangsbuchstaben stecken */
M.register('mailbox', {
  name: 'Briefkasten', icon: '📮',
  howto: r => 'Die Post ist da! Schau dir das Bild auf dem Brief an. Mit welchem Buchstaben fängt es an? Steck den Brief in den richtigen Briefkasten!',
  start(stage, { round, done }) {
    const goal = 8, nBox = round === 1 ? 3 : 4;
    // klarer Anlaut: keine Au-/Ei-/Sch-/Sp-Wörter
    const ok = w => !/^(Au|Ei|Eu|Sch|Sp|St)/.test(w[0]);
    const letters = M.LEARNED.filter(L => M.wordsWith(L).filter(ok).length);
    let n = 0, alive = true, busy = false, tries = 0, cur = null, lastL = null;
    stage.innerHTML = `<div class="mb-letter" id="mbLetter"><div class="mb-stamp">📮</div><div class="mb-pic" id="mbPic"></div></div>
      <button class="speak" id="mbSpeak">🔊</button>
      <div class="mb-boxes" id="mbBoxes"></div>`;
    const $s = q => stage.querySelector(q);
    const hud = () => M.setHud(`📮 ${n}/${goal}`);
    function next() {
      hud(); tries = 0; busy = false;
      let L; do { L = M.pickLetter(letters); } while (L === lastL && letters.length > 1); lastL = L;
      const [w, e] = M.pick(M.wordsWith(L).filter(ok));
      const others = M.shuffle(letters.filter(x => x !== L)).slice(0, nBox - 1);
      cur = { L, w, e };
      const letter = $s('#mbLetter'); letter.classList.remove('fly'); letter.style.transform = ''; void letter.offsetWidth; letter.classList.add('arrive');
      $s('#mbPic').textContent = e;
      const boxes = $s('#mbBoxes'); boxes.innerHTML = '';
      M.shuffle([L, ...others]).forEach(x => {
        const b = document.createElement('button'); b.className = 'mbox';
        b.innerHTML = `<div class="slot"></div><div class="lab">${x}<small>${x.toLowerCase()}</small></div><div class="post"></div>`;
        b.onclick = () => choose(x, b);
        boxes.appendChild(b);
      });
      const say = () => M.say(`${w}. Mit welchem Buchstaben fängt ${w} an?`);
      $s('#mbSpeak').onclick = say; setTimeout(() => alive && say(), 300);
    }
    function choose(x, b) {
      if (!alive || busy) return;
      if (x === cur.L) {
        busy = true; M.addRiddle(); M.ding();
        const letter = $s('#mbLetter'), lr = letter.getBoundingClientRect(), br = b.getBoundingClientRect();
        letter.classList.remove('arrive'); letter.classList.add('fly');
        letter.style.transform = `translate(${br.left + br.width / 2 - (lr.left + lr.width / 2)}px, ${br.top + 10 - (lr.top + lr.height / 2)}px) scale(.2) rotate(20deg)`;
        b.classList.add('right'); M.sparkle(b, 10, ['✉️', '⭐', '✨']);
        M.say(`${cur.w} fängt mit ${cur.L} an! ${M.pick(M.PRAISE)}`);
        n++;
        setTimeout(() => { b.classList.remove('right'); if (!alive) return; if (n >= goal) { hud(); alive = false; done(); } else next(); }, 1900);
      } else {
        tries++; M.wiggle(b); M.boop();
        if (tries >= 2) {
          M.say(`Hör genau: ${cur.L.toLowerCase()} ... ${cur.w}. Der leuchtende Briefkasten!`);
          [...$s('#mbBoxes').children].forEach(c => { if (c.textContent.startsWith(cur.L)) c.classList.add('hint'); });
        } else M.say(`${cur.w} fängt nicht mit ${x} an. Hör nochmal: ${cur.w}.`);
      }
    }
    next();
    return () => { alive = false; };
  }
});
