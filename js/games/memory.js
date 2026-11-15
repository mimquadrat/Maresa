/* 🃏 Memory: Paare finden – Würfel↔Zahl, groß↔klein, Bild↔Anfangsbuchstabe */
M.register('memory', {
  name: 'Memory', icon: '🃏',
  howto: r => 'Dreh immer zwei Karten um und finde die Paare, die zusammengehören!',
  start(stage, { round, done }) {
    const nPairs = round === 1 ? 4 : round === 2 ? 6 : 8;
    let kinds = M.mode === 'math' ? ['dice'] : M.mode === 'read' ? ['case', 'anlaut'] : ['dice', 'case', 'anlaut'];
    const kind = M.pick(kinds);
    let pairs = [];
    if (kind === 'dice') {
      M.shuffle([1, 2, 3, 4, 5, 6]).slice(0, Math.min(nPairs, 6)).forEach(n => pairs.push([{ html: M.dice(n), say: '' }, { html: String(n), say: String(n) }]));
    } else if (kind === 'case') {
      M.shuffle(M.LEARNED.concat(['E', 'L', 'T', 'N', 'H'])).slice(0, nPairs).forEach(L => pairs.push([{ html: L, say: L }, { html: L.toLowerCase(), say: L }]));
    } else {
      const letters = M.shuffle([...new Set(M.WORDS.map(w => w[0][0]))].filter(L => !['Ö', 'Ü', 'Ä'].includes(L))).slice(0, nPairs);
      letters.forEach(L => { const w = M.pick(M.wordsWith(L)); if (w) pairs.push([{ html: `<span style="font-size:2.8rem">${w[1]}</span>`, say: w[0] }, { html: L, say: L }]); });
    }
    const cards = M.shuffle(pairs.flatMap((p, i) => p.map(c => ({ ...c, pair: i }))));
    const colsN = cards.length <= 8 ? 4 : 4;
    stage.innerHTML = `<div class="mem" style="grid-template-columns:repeat(${colsN},1fr)"></div>`;
    const grid = stage.querySelector('.mem');
    // Größe so wählen, dass alles reinpasst
    function fit() {
      const rowsN = Math.ceil(cards.length / colsN);
      const maxW = Math.min(stage.clientWidth, (stage.clientHeight - 10) / rowsN * 0.75 * colsN + 8 * (colsN - 1));
      grid.style.maxWidth = maxW + 'px';
    }
    let open = [], found = 0, lock = false;
    const hud = () => M.setHud(`🃏 ${found}/${pairs.length}`);
    hud();
    cards.forEach(c => {
      const el = document.createElement('div');
      el.className = 'card';
      el.innerHTML = `<div class="b">❓</div><div class="f">${c.html}</div>`;
      el.onclick = () => {
        if (lock || el.classList.contains('up') || el.classList.contains('done')) return;
        el.classList.add('up'); M.blip(); if (c.say) M.say(c.say);
        open.push({ el, c });
        if (open.length === 2) {
          lock = true;
          const [a, b] = open;
          if (a.c.pair === b.c.pair) {
            setTimeout(() => {
              a.el.classList.add('done'); b.el.classList.add('done'); M.ding(); M.sparkle(b.el, 8);
              found++; hud(); M.addRiddle(); M.say(M.pick(M.PRAISE));
              open = []; lock = false;
              if (found === pairs.length) setTimeout(done, 900);
            }, 450);
          } else {
            setTimeout(() => { a.el.classList.remove('up'); b.el.classList.remove('up'); open = []; lock = false; }, 1100);
          }
        }
      };
      grid.appendChild(el);
    });
    fit(); window.addEventListener('resize', fit);
    M.onResume(fit);
    return () => window.removeEventListener('resize', fit);
  }
});
