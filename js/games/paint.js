/* 🎨 Ausmal-Rätsel: Farbe wählen, passende Felder antippen – bis das Bild fertig ist */
M.register('paint', {
  name: 'Ausmal-Rätsel', icon: '🎨',
  howto: r => r === 1 ? 'Wähl unten eine Farbe. Dann tipp alle Felder an, die genauso viele Punkte haben wie die Zahl auf der Farbe!' : 'Wähl unten eine Farbe. Dann tipp alle Felder an, deren Aufgabe die Zahl auf der Farbe ergibt!',
  start(stage, { round, station, done }) {
    const PICS = [
      { name: 'Herz', rows: ['.aa.aa.', 'abaaaaa', 'aaaaaaa', '.aaaaa.', '..aaa..', '...a...'], col: { a: ['#ff4f7b', 'Rot'], b: ['#ffd1dc', 'Rosa'] } },
      { name: 'Blume', rows: ['..aaa..', '.aabaa.', '..aaa..', '...c...', '.ccccc.', '...c...'], col: { a: ['#ff7ac8', 'Pink'], b: ['#ffd23f', 'Gelb'], c: ['#3fbf6a', 'Grün'] } },
      { name: 'Fisch', rows: ['..aaa..c', '.abaaacc', 'aaaaaacc', '.aaaaacc', '..aaa..c'], col: { a: ['#ff9a3c', 'Orange'], b: ['#3a2350', 'Schwarz'], c: ['#ffd23f', 'Gelb'] } },
      { name: 'Pilz', rows: ['..aaa..', '.abaab.', 'aaaaaaa', '..ccc..', '..ccc..', '..ccc..'], col: { a: ['#e8413c', 'Rot'], b: ['#ffffff', 'Weiß'], c: ['#e9d3b0', 'Beige'] } },
      { name: 'Haus', rows: ['...a...', '..aaa..', '.aaaaa.', '.bbbbb.', '.bcbcb.', '.bbcbb.'], col: { a: ['#e8413c', 'Rot'], b: ['#ffd23f', 'Gelb'], c: ['#4fa3ff', 'Blau'] } }
    ];
    const pic = PICS[Math.floor(station / 8) % PICS.length];
    const keys = Object.keys(pic.col);
    // Jede Farbe bekommt eine Zahl
    const nums = M.shuffle(round === 1 ? [1, 2, 3, 4, 5, 6] : [2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, keys.length);
    const val = {}; keys.forEach((k, i) => val[k] = nums[i]);
    function label(v) {
      if (round === 1) return M.dice(v, 'small');
      if (round >= 3 && Math.random() < 0.4 && v < 10) { const b = 1 + M.rnd(10 - v); return `${v + b}−${b}`; }
      const a = M.rnd(v + 1); return `${a}+${v - a}`;
    }
    const W = pic.rows[0].length, H = pic.rows.length;
    stage.innerHTML = `<div style="font-weight:800;font-size:1.1rem;margin:4px 0">Mal das Bild aus: ${pic.name} ✨</div><div class="paint-grid" style="grid-template-columns:repeat(${W},1fr)"></div><div class="palette"></div>`;
    const grid = stage.querySelector('.paint-grid'), pal = stage.querySelector('.palette');
    let sel = null, total = 0, filled = 0, alive = true;
    const hud = () => M.setHud(`🎨 ${filled}/${total}`);
    pic.rows.forEach(row => [...row].forEach(ch => {
      const c = document.createElement('div');
      if (ch === '.') { c.className = 'pcell bg'; grid.appendChild(c); return; }
      total++;
      c.className = 'pcell'; c.innerHTML = label(val[ch]);
      c.onclick = () => {
        if (!alive || c.classList.contains('filled')) return;
        if (!sel) { M.say('Wähl zuerst unten eine Farbe!'); M.wiggle(pal); return; }
        if (sel === ch) {
          c.classList.add('filled'); c.style.background = pic.col[ch][0]; c.innerHTML = '';
          M.plop(); filled++; hud(); M.addRiddle();
          if (filled % 6 === 0) M.say(M.pick(M.PRAISE));
          if (filled === total) { alive = false; M.sparkle(grid, 20); M.say(`Fertig! Ein wunderschön${pic.name === 'Blume' ? 'e' : 'es'} ${pic.name}!`); setTimeout(done, 1800); }
        } else { M.wiggle(c); M.boop(); M.say(`Das ist nicht die ${val[sel]}. Schau nochmal genau!`); }
      };
      grid.appendChild(c);
    }));
    hud();
    keys.forEach(k => {
      const b = document.createElement('button'); b.className = 'swatch'; b.style.background = pic.col[k][0]; b.textContent = val[k];
      if (pic.col[k][0] === '#ffffff') { b.style.color = '#3a2350'; b.style.textShadow = 'none'; b.style.border = '5px solid #ddd'; }
      b.onclick = () => { sel = k; pal.querySelectorAll('.swatch').forEach(x => x.classList.toggle('sel', x === b)); M.say(`${pic.col[k][1]} ist die ${val[k]}`); M.blip(); };
      pal.appendChild(b);
    });
    function fit() {
      const availH = stage.clientHeight - pal.offsetHeight - 50, availW = stage.clientWidth;
      const cell = Math.floor(Math.min(availW / W, availH / H, 64)) - 3;
      grid.style.gridTemplateColumns = `repeat(${W}, ${cell}px)`; grid.style.gridAutoRows = cell + 'px';
      grid.querySelectorAll('.pcell').forEach(c => c.style.fontSize = Math.max(11, cell * .28) + 'px');
    }
    requestAnimationFrame(fit); window.addEventListener('resize', fit); M.onResume(() => setTimeout(fit, 30));
    return () => { alive = false; window.removeEventListener('resize', fit); };
  }
});
