/* 👻 Mampf-Jagd (Pacman): alles mampfen, was mit dem gesuchten Buchstaben anfängt.
   Wer von einem Geist erwischt wird, rettet sich mit einer Rechenaufgabe. 3 Runden. */
M.register('pacman', {
  name: 'Mampf-Jagd', icon: '👻',
  howto: r => 'Mampf alle Sachen, die mit dem gesuchten Buchstaben anfangen! Pass auf die Geister 👻 auf – wenn sie dich erwischen, musst du eine Rechenaufgabe lösen. Schaffst du 3 Runden?',
  start(stage, { round, done }) {
    const L = round, RUNDEN = 3;
    const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
    stage.innerHTML = `<div class="pac-top"><div class="pac-letter"></div><div class="pac-slots"></div></div>
      <div class="lab-wrap pac-wrap"><canvas></canvas></div>
      <div class="pad"><button class="up" data-d="0">▲</button><button class="left" data-d="3">◀</button><button class="down" data-d="2">▼</button><button class="right" data-d="1">▶</button></div>`;
    const wrap = stage.querySelector('.pac-wrap'), canvas = stage.querySelector('canvas'), ctx = canvas.getContext('2d');
    const letterEl = stage.querySelector('.pac-letter'), slotsEl = stage.querySelector('.pac-slots');

    // Buchstaben mit genug passenden Bildern (zuerst die aus dem Heft)
    const ok = l => M.wordsWith(l).length >= 2;
    // erste Runde mit einem ganz neuen Buchstaben (T oder N), dann gemischt
    const fresh = M.shuffle(M.NEWEST.filter(ok)).slice(0, 1);
    const letters = [...new Set(fresh.concat(M.shuffle(M.LEARNED.filter(ok)), M.shuffle(['B', 'H', 'K', 'E'].filter(ok))))];

    let runde = 0, grid, GW, GH, tile = 0, player, ghosts = [], items = [], dots, T, need, got = [];
    let busy = true, alive = true, invul = 0, raf, last = 0, t0 = performance.now(), dotSound = 0;

    // ---------- Labyrinth mit Schleifen (keine Sackgassen) ----------
    function makeMaze(cw, ch) {
      GW = cw * 2 + 1; GH = ch * 2 + 1;
      grid = Array.from({ length: GH }, () => Array(GW).fill(1));
      const seen = Array.from({ length: ch }, () => Array(cw).fill(false)), stack = [[0, 0]];
      seen[0][0] = true; grid[1][1] = 0;
      while (stack.length) {
        const [x, y] = stack[stack.length - 1], opts = [];
        for (let d = 0; d < 4; d++) { const nx = x + DX[d], ny = y + DY[d]; if (nx >= 0 && ny >= 0 && nx < cw && ny < ch && !seen[ny][nx]) opts.push(d); }
        if (!opts.length) { stack.pop(); continue; }
        const d = M.pick(opts), nx = x + DX[d], ny = y + DY[d];
        grid[y * 2 + 1 + DY[d]][x * 2 + 1 + DX[d]] = 0; grid[ny * 2 + 1][nx * 2 + 1] = 0;
        seen[ny][nx] = true; stack.push([nx, ny]);
      }
      // Sackgassen aufbrechen → Rundwege wie bei Pacman
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const tx = x * 2 + 1, ty = y * 2 + 1;
        const open = [0, 1, 2, 3].filter(d => !grid[ty + DY[d]][tx + DX[d]]);
        if (open.length > 1) continue;
        const closed = M.shuffle([0, 1, 2, 3].filter(d => grid[ty + DY[d]][tx + DX[d]] && x + DX[d] >= 0 && x + DX[d] < cw && y + DY[d] >= 0 && y + DY[d] < ch));
        if (closed.length) grid[ty + DY[closed[0]]][tx + DX[closed[0]]] = 0;
      }
      // ein paar Extra-Durchgänge
      for (let i = 0; i < cw; i++) {
        const x = M.rnd(cw), y = M.rnd(ch), d = M.rnd(4), nx = x + DX[d], ny = y + DY[d];
        if (nx >= 0 && ny >= 0 && nx < cw && ny < ch) grid[y * 2 + 1 + DY[d]][x * 2 + 1 + DX[d]] = 0;
      }
    }
    const open = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH && !grid[y][x];

    // ---------- Runde aufbauen ----------
    function setupRound() {
      runde++;
      T = letters[(runde - 1) % letters.length];
      // so viele Reihen, wie auf den Bildschirm passen (5 Spalten breit)
      const rowsFit = Math.floor(wrap.clientHeight / (wrap.clientWidth / 11));
      makeMaze(5, Math.max(5, Math.min(8, Math.floor((rowsFit - 1) / 2))));
      player = { x: 1, y: GH - 2, dir: -1, want: -1, prog: 0, speed: 4.2 };
      // Geister starten oben, weit weg vom Spieler
      const homes = [{ x: GW - 2, y: 1 }, { x: 1, y: 1 }, { x: GW - 2, y: GH - 2 }];
      const nG = Math.min(3, (runde === 1 ? 1 : 2) + (L >= 3 && runde === 3 ? 1 : 0));
      const gSpeed = Math.min(3.3, 1.7 + (runde - 1) * 0.3 + (L - 1) * 0.15);
      ghosts = homes.slice(0, nG).map((h, i) => ({ hx: h.x, hy: h.y, x: h.x, y: h.y, dir: -1, prog: 0, speed: gSpeed, wait: 1.5 + i * 1.8, look: ['👻', '🐙', '🦀'][i] }));
      // Objekte verteilen
      need = runde + 2;
      const good = M.wordsWith(T), bad = M.WORDS.filter(w => w[0][0].toUpperCase() !== T && !(T === 'S' && w[0].startsWith('Sch')));
      const goodPick = M.shuffle(good.slice()), list = [];
      for (let i = 0; i < need; i++) list.push({ w: goodPick[i % goodPick.length], good: true });
      M.shuffle(bad.slice()).slice(0, need).forEach(w => list.push({ w, good: false }));
      const cand = [];
      for (let y = 1; y < GH - 1; y++) for (let x = 1; x < GW - 1; x++) {
        if (!open(x, y) || Math.abs(x - player.x) + Math.abs(y - player.y) < 4) continue;
        if (homes.some(h => h.x === x && h.y === y)) continue;
        cand.push({ x, y });
      }
      M.shuffle(cand);
      items = [];
      for (const it of list) {
        const c = cand.find(c => items.every(o => Math.abs(o.x - c.x) + Math.abs(o.y - c.y) >= 3)) || cand[0];
        cand.splice(cand.indexOf(c), 1);
        items.push({ x: c.x, y: c.y, w: it.w, good: it.good });
      }
      // Goldmünzen auf allen freien Wegen
      dots = new Set();
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++)
        if (open(x, y) && !items.some(i => i.x === x && i.y === y) && !(x === player.x && y === player.y)) dots.add(x + ',' + y);
      got = [];
      letterEl.innerHTML = `<b>${T}</b><b class="sm">${T.toLowerCase()}</b>`;
      slots(); hud();
      resize();
      busy = true; invul = 0;
      M.toast(`Runde ${runde}: Mampf alles mit ${T}! 😋`, 2400);
      M.say(`Runde ${runde}! Mampf alles, was mit ${T} anfängt!`);
      setTimeout(() => { if (alive) { busy = false; last = 0; } }, 1600);
    }
    function slots() {
      slotsEl.innerHTML = Array.from({ length: need }, (_, i) => got[i] ? `<span class="got">${got[i]}</span>` : '<span>❔</span>').join('');
    }
    const hud = () => M.setHud(`🏁 ${runde}/${RUNDEN}`);

    // ---------- Größe ----------
    function resize() {
      if (!grid) return;
      tile = Math.floor(Math.min(wrap.clientWidth / GW, wrap.clientHeight / GH));
      if (tile < 5) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = tile * GW + 'px'; canvas.style.height = tile * GH + 'px';
      canvas.width = tile * GW * dpr; canvas.height = tile * GH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ---------- Bewegung ----------
    const pos = e => ({ x: e.x + (e.dir >= 0 ? DX[e.dir] * e.prog : 0), y: e.y + (e.dir >= 0 ? DY[e.dir] * e.prog : 0) });
    function stepPlayer(dt) {
      const p = player;
      if (p.dir < 0) {
        if (p.want >= 0 && open(p.x + DX[p.want], p.y + DY[p.want])) { p.dir = p.want; p.prog = 0; }
        else return;
      }
      // sofort umdrehen ist immer erlaubt
      if (p.want >= 0 && p.want === (p.dir + 2) % 4 && p.prog > 0) {
        p.x += DX[p.dir]; p.y += DY[p.dir]; p.prog = 1 - p.prog; p.dir = p.want;
      }
      // Kurven-Toleranz für Kinderfinger: knapp verpasste Abzweigung zählt noch
      else if (p.want >= 0 && p.want !== p.dir && p.prog > 0 && p.prog < 0.35 && open(p.x + DX[p.want], p.y + DY[p.want])) {
        p.dir = p.want; p.prog = 0;
      }
      p.prog += p.speed * dt;
      while (p.prog >= 1) {
        p.prog -= 1; p.x += DX[p.dir]; p.y += DY[p.dir];
        arrive();
        if (busy) { p.prog = 0; return; }
        if (p.want >= 0 && open(p.x + DX[p.want], p.y + DY[p.want])) p.dir = p.want;
        else if (!open(p.x + DX[p.dir], p.y + DY[p.dir])) { p.dir = -1; p.prog = 0; return; }
      }
    }
    function arrive() {
      const k = player.x + ',' + player.y;
      if (dots.delete(k)) { if (++dotSound % 2) M.tone(880 + (dotSound % 4) * 60, 0, .05, 'sine', .04); }
      const i = items.findIndex(it => it.x === player.x && it.y === player.y);
      if (i < 0) return;
      const it = items[i]; items.splice(i, 1);
      if (it.good) {
        got.push(it.w[1]); slots();
        M.ding(); M.say(it.w[0] + '! Mjam!'); M.vibrate(30); M.addRiddle();
        const s = slotsEl.children[got.length - 1]; if (s) M.sparkle(s, 8);
        if (got.length >= need) roundWon();
      } else {
        M.boop(); M.say(`Bäh! ${it.w[0]} fängt mit ${it.w[0][0].toUpperCase()} an.`);
        M.toast(`${it.w[1]} ${it.w[0]} – das ist ein ${it.w[0][0].toUpperCase()}!`, 1800);
      }
    }
    function stepGhost(g, dt) {
      if (g.wait > 0) { g.wait -= dt; return; }
      if (g.dir < 0) g.dir = chooseDir(g);
      if (g.dir < 0) return;
      g.prog += g.speed * dt;
      while (g.prog >= 1) {
        g.prog -= 1; g.x += DX[g.dir]; g.y += DY[g.dir];
        g.dir = chooseDir(g);
        if (g.dir < 0) { g.prog = 0; return; }
      }
    }
    function chooseDir(g) {
      let opts = [0, 1, 2, 3].filter(d => open(g.x + DX[d], g.y + DY[d]));
      if (opts.length > 1 && g.dir >= 0) opts = opts.filter(d => d !== (g.dir + 2) % 4);
      if (!opts.length) return -1;
      const chase = 0.3 + runde * 0.1 + (L - 1) * 0.05;
      if (Math.random() < chase) {
        opts.sort((a, b) => (Math.abs(g.x + DX[a] - player.x) + Math.abs(g.y + DY[a] - player.y)) - (Math.abs(g.x + DX[b] - player.x) + Math.abs(g.y + DY[b] - player.y)));
        return opts[0];
      }
      return M.pick(opts);
    }

    // ---------- Erwischt → Rechenaufgabe ----------
    function caught() {
      busy = true;
      M.vibrate([80, 40, 160]);
      M.tone(500, 0, .15, 'square', .1); M.tone(380, .15, .15, 'square', .1); M.tone(260, .3, .3, 'square', .1);
      M.toast('Erwischt! 👻 Rechne dich frei!', 1300);
      setTimeout(() => {
        if (!alive) return;
        M.quiz(L, '🧮 Rechne dich frei!', 'calc').then(() => {
          if (!alive) return;
          player.x = 1; player.y = GH - 2; player.dir = -1; player.want = -1; player.prog = 0;
          ghosts.forEach((g, i) => { g.x = g.hx; g.y = g.hy; g.dir = -1; g.prog = 0; g.wait = 1 + i; });
          invul = 2.5; busy = false; last = 0;
          M.say('Weiter geht\'s!');
        });
      }, 1400);
    }
    function roundWon() {
      busy = true;
      M.sparkle(canvas, 20, ['⭐', '✨', '🪙', '🌟']);
      if (runde >= RUNDEN) {
        M.say('Alle drei Runden geschafft!');
        setTimeout(() => { if (alive) { alive = false; done(); } }, 1200);
      } else {
        M.ding(); M.toast(`Runde ${runde} geschafft! 🎉`, 1600); M.say(`Runde ${runde} geschafft! Super!`);
        setTimeout(() => { if (alive) setupRound(); }, 1900);
      }
    }

    // ---------- Zeichnen ----------
    function draw() {
      if (!tile) return;
      const W = GW * tile, H = GH * tile, now = performance.now();
      ctx.fillStyle = '#16194a'; ctx.fillRect(0, 0, W, H);
      // Mauern als dicke, runde Linien
      ctx.fillStyle = '#4f6bff';
      const r = tile * 0.22, ins = tile * 0.2;
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        if (!grid[y][x]) continue;
        const px = x * tile, py = y * tile;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(px + ins, py + ins, tile - 2 * ins, tile - 2 * ins, r) : ctx.rect(px + ins, py + ins, tile - 2 * ins, tile - 2 * ins); ctx.fill();
        if (x + 1 < GW && grid[y][x + 1]) ctx.fillRect(px + tile / 2, py + ins, tile, tile - 2 * ins);
        if (y + 1 < GH && grid[y + 1][x]) ctx.fillRect(px + ins, py + tile / 2, tile - 2 * ins, tile);
      }
      // Münzen
      ctx.fillStyle = '#ffd34f';
      dots.forEach(k => { const [x, y] = k.split(',').map(Number); ctx.beginPath(); ctx.arc(x * tile + tile / 2, y * tile + tile / 2, tile * 0.09, 0, Math.PI * 2); ctx.fill(); });
      // Objekte
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
      ctx.font = Math.floor(tile * 0.72) + 'px sans-serif';
      items.forEach((it, i) => {
        const bob = Math.sin((now - t0) / 300 + i) * tile * 0.06;
        ctx.fillText(it.w[1], it.x * tile + tile / 2, it.y * tile + tile / 2 + bob);
      });
      // Geister
      ctx.font = Math.floor(tile * 0.82) + 'px sans-serif';
      ghosts.forEach(g => {
        const p = pos(g), wob = Math.sin((now - t0) / 140 + g.hx) * tile * 0.05;
        ctx.globalAlpha = g.wait > 0 ? 0.55 : 1;
        ctx.fillText(g.look, p.x * tile + tile / 2, p.y * tile + tile / 2 + wob);
      });
      ctx.globalAlpha = 1;
      // Spieler (blinkt nach dem Freirechnen)
      if (!(invul > 0 && Math.floor(now / 120) % 2)) {
        const p = pos(player);
        M.drawPet(ctx, p.x * tile + tile / 2, p.y * tile + tile / 2, tile * 0.92);
      }
    }

    function frame(t) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      const active = document.getElementById('game').classList.contains('active');
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      if (!active) { last = 0; return; }
      if (!busy && dt) {
        if (invul > 0) invul -= dt;
        stepPlayer(dt);
        if (!busy) ghosts.forEach(g => stepGhost(g, dt));
        if (!busy && invul <= 0) {
          const pp = pos(player);
          if (ghosts.some(g => { const gp = pos(g); return g.wait <= 0 && Math.abs(gp.x - pp.x) + Math.abs(gp.y - pp.y) < 0.65; })) caught();
        }
      }
      draw();
    }

    // ---------- Steuerung ----------
    const steer = d => { if (!alive) return; player.want = d; };
    stage.querySelectorAll('.pad button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); M.audio(); steer(+b.dataset.d); }));
    const onKey = e => {
      const map = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 };
      if (e.key in map && document.getElementById('game').classList.contains('active')) { e.preventDefault(); steer(map[e.key]); }
    };
    window.addEventListener('keydown', onKey);
    // Wischen: jede Wischbewegung lenkt sofort um
    let sx = null, sy = null;
    wrap.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
    wrap.addEventListener('pointermove', e => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
      sx = e.clientX; sy = e.clientY;
    });
    const up = () => { sx = sy = null; };
    wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);

    window.addEventListener('resize', resize);
    M.onResume(() => setTimeout(() => { resize(); last = 0; }, 30));
    requestAnimationFrame(() => { setupRound(); raf = requestAnimationFrame(frame); });
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', resize); };
  }
});
