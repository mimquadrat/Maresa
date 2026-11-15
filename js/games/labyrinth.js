/* 🏰 Labyrinth: Schlüssel sammeln (je ein Rätsel), dann zum Schatz */
M.register('labyrinth', {
  name: 'Labyrinth', icon: '🏰',
  howto: r => 'Sammle alle Schlüssel 🔑 – hinter jedem steckt ein Rätsel. Dann schnell zum Schatz 💰!',
  start(stage, { round, done }) {
    const L = round;
    const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
    stage.innerHTML = `<div class="lab-wrap"><canvas></canvas></div>
      <div class="pad"><button class="up" data-d="0">▲</button><button class="left" data-d="3">◀</button><button class="down" data-d="2">▼</button><button class="right" data-d="1">▶</button></div>`;
    const wrap = stage.querySelector('.lab-wrap'), canvas = stage.querySelector('canvas'), ctx = canvas.getContext('2d');
    let cols, rows, walls, player, goal, trail, cell, keys = [], keysTotal = 0, busy = false, alive = true;

    function generate() {
      cols = Math.min(5 + L, 11); rows = Math.min(7 + L, 15);
      walls = [];
      for (let y = 0; y < rows; y++) { walls.push([]); for (let x = 0; x < cols; x++) walls[y].push([true, true, true, true]); }
      const seen = walls.map(r => r.map(() => false)), stack = [[0, 0]]; seen[0][0] = true;
      while (stack.length) {
        const [x, y] = stack[stack.length - 1], opts = [];
        for (let d = 0; d < 4; d++) { const nx = x + DX[d], ny = y + DY[d]; if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen[ny][nx]) opts.push(d); }
        if (!opts.length) { stack.pop(); continue; }
        const d = M.pick(opts), nx = x + DX[d], ny = y + DY[d];
        walls[y][x][d] = false; walls[ny][nx][(d + 2) % 4] = false; seen[ny][nx] = true; stack.push([nx, ny]);
      }
      player = { x: 0, y: 0 }; goal = { x: cols - 1, y: rows - 1 }; trail = [{ x: 0, y: 0 }];
      placeKeys(L === 1 ? 3 : L === 2 ? 5 : Math.min(6 + Math.floor((L - 3) / 2), 8));
      resize();
    }
    function placeKeys(n) {
      keys = [];
      const cand = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        if ((x === goal.x && y === goal.y) || x + y < 3) continue;
        cand.push({ x, y, dead: walls[y][x].filter(w => !w).length === 1 });
      }
      const ordered = M.shuffle(cand.filter(c => c.dead)).concat(M.shuffle(cand.filter(c => !c.dead)));
      for (const md of [4, 3, 2, 1]) {
        for (const c of ordered) {
          if (keys.length >= n) break;
          if (keys.some(k => k.x === c.x && k.y === c.y)) continue;
          if (keys.every(k => Math.abs(k.x - c.x) + Math.abs(k.y - c.y) >= md)) keys.push({ x: c.x, y: c.y });
        }
        if (keys.length >= n) break;
      }
      keysTotal = keys.length; hud();
    }
    const hud = () => M.setHud(`🔑 ${keysTotal - keys.length}/${keysTotal}`);

    function resize() {
      cell = Math.floor(Math.min(wrap.clientWidth / cols, wrap.clientHeight / rows));
      if (cell < 5) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = cell * cols + 'px'; canvas.style.height = cell * rows + 'px';
      canvas.width = cell * cols * dpr; canvas.height = cell * rows * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    const t0 = performance.now();
    function draw() {
      if (!walls || !cell) return;
      ctx.clearRect(0, 0, cols * cell, rows * cell);
      ctx.fillStyle = 'rgba(255, 79, 163, 0.35)';
      trail.forEach(p => { ctx.beginPath(); ctx.arc(p.x * cell + cell / 2, p.y * cell + cell / 2, cell * 0.18, 0, Math.PI * 2); ctx.fill(); });
      ctx.strokeStyle = '#5b3a8a'; ctx.lineWidth = Math.max(2, cell * 0.09); ctx.lineCap = 'round';
      ctx.beginPath();
      const inset = ctx.lineWidth / 2;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const px = x * cell, py = y * cell, w = walls[y][x];
        const x0 = Math.max(px, inset), y0 = Math.max(py, inset), x1 = Math.min(px + cell, cols * cell - inset), y1 = Math.min(py + cell, rows * cell - inset);
        if (w[0]) { ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); }
        if (w[1]) { ctx.moveTo(x1, y0); ctx.lineTo(x1, y1); }
        if (w[2]) { ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); }
        if (w[3]) { ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); }
      }
      ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
      const bob = Math.sin((performance.now() - t0) / 250) * cell * 0.06;
      ctx.font = Math.floor(cell * 0.62) + 'px sans-serif';
      keys.forEach(k => ctx.fillText('🔑', k.x * cell + cell / 2, k.y * cell + cell / 2 + bob));
      ctx.font = Math.floor(cell * 0.7) + 'px sans-serif';
      const gx = goal.x * cell + cell / 2, gy = goal.y * cell + cell / 2;
      ctx.fillText('💰', gx, gy + cell * 0.04);
      if (keys.length) { ctx.font = Math.floor(cell * 0.38) + 'px sans-serif'; ctx.fillText('🔒', gx + cell * 0.28, gy - cell * 0.26); }
      M.drawPet(ctx, player.x * cell + cell / 2, player.y * cell + cell / 2, cell * 0.78);
    }
    let timer = setInterval(() => { if (keys.length) draw(); }, 70);

    function move(d) {
      if (busy || !alive) return;
      if (walls[player.y][player.x][d]) { M.vibrate(15); return; }
      player.x += DX[d]; player.y += DY[d];
      if (!trail.some(p => p.x === player.x && p.y === player.y)) trail.push({ x: player.x, y: player.y });
      M.blip(); draw();
      const k = keys.findIndex(k => k.x === player.x && k.y === player.y);
      if (k >= 0) {
        busy = true;
        M.quiz(L).then(() => {
          if (!alive) return;
          keys.splice(k, 1); hud(); draw(); busy = false;
          if (!keys.length) { M.toast('Alle Schlüssel! 🔑 Jetzt schnell zum Schatz! 💰'); M.say('Alle Schlüssel! Jetzt schnell zum Schatz!'); }
        });
        return;
      }
      if (player.x === goal.x && player.y === goal.y) {
        if (keys.length) {
          const m = 'Die Truhe ist zu! Such noch ' + (keys.length === 1 ? '1 Schlüssel!' : keys.length + ' Schlüssel!');
          M.toast('🔒 ' + m); M.say(m); M.boop();
        } else { busy = true; setTimeout(done, 200); }
      }
    }
    stage.querySelectorAll('.pad button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); move(+b.dataset.d); }));
    const onKey = e => {
      const map = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 };
      if (e.key in map && document.getElementById('game').classList.contains('active')) { e.preventDefault(); move(map[e.key]); }
    };
    window.addEventListener('keydown', onKey);
    let sx = null, sy = null;
    wrap.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    wrap.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = sy = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : 3); else move(dy > 0 ? 2 : 0);
    });
    window.addEventListener('resize', resize);
    M.onResume(() => setTimeout(resize, 30));
    requestAnimationFrame(generate);
    return () => { alive = false; clearInterval(timer); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', resize); };
  }
});
