/* 🌉 Silben-Brücke: Silben lesen und zur Brücke zusammensetzen – das Tier läuft rüber, das Wort wird vorgelesen */
M.register('bridge', {
  name: 'Silben-Brücke', icon: '🌉',
  howto: r => 'Lies die Silben-Steine und bau die Brücke zum Bild! Tipp auf einen Stein, dann hörst du ihn. Leg die Silben in der richtigen Reihenfolge.',
  start(stage, { round, done }) {
    const goal = 4;
    // Wörter, deren Silben man gut lesen kann (erste Runde: nur 2 Silben)
    const pool = M.WORDS.filter(w => { const n = w[2].split('-').length; return (round === 1 ? n === 2 : n >= 2 && n <= 3) && !/sch|ei|au|eu|ä|ö|ü/i.test(w[0]); });
    const fresh = M.shuffle(pool.filter(w => M.NEWEST.includes(w[0][0]))).slice(0, 2);
    const words = M.shuffle(fresh.concat(M.shuffle(pool.filter(w => !fresh.includes(w))).slice(0, goal - fresh.length)));
    let idx = 0, alive = true;
    stage.innerHTML = `<div class="br-scene">
        <div class="br-bank left"><div class="br-pet" id="brPet"></div></div>
        <div class="br-water"><div class="br-gap" id="brGap"></div></div>
        <div class="br-bank right"><div class="br-goal" id="brGoal"></div></div>
      </div>
      <div class="br-hint" id="brHint"></div>
      <div class="syll-cards" id="brStones"></div>`;
    const $s = q => stage.querySelector(q);
    const pet = $s('#brPet'), gap = $s('#brGap'), stonesEl = $s('#brStones');
    pet.innerHTML = M.petHTML(48);
    const hud = () => M.setHud(`🌉 ${idx}/${goal}`);
    // ähnliche Silbe als Ablenkung: anderer Vokal oder anderer Mitlaut
    function decoy(p) {
      const V = 'aeiou', low = p.toLowerCase();
      const vi = [...low].findIndex(c => V.includes(c));
      if (vi >= 0 && Math.random() < .7) { const nv = M.pick([...V].filter(c => c !== low[vi])); return p.slice(0, vi) + nv + p.slice(vi + 1); }
      const c = M.pick(M.SYLL_CONS.filter(x => x !== p[0].toUpperCase()));
      return (p[0] === p[0].toUpperCase() ? c : c.toLowerCase()) + p.slice(1);
    }
    function load() {
      hud();
      const [w, e, s] = words[idx];
      const parts = s.split('-').map((x, i) => i === 0 ? x[0].toUpperCase() + x.slice(1) : x.toLowerCase());
      let next = 0, busy = false;
      $s('#brGoal').textContent = e;
      pet.style.transition = 'none'; pet.style.transform = 'translateX(0)';
      gap.innerHTML = parts.map(() => '<div class="br-slot"></div>').join('');
      const slots = gap.querySelectorAll('.br-slot');
      $s('#brHint').textContent = parts.length + ' Silben';
      const extra = round === 1 ? 1 : 2, dec = new Set();
      let guard = 0;
      while (dec.size < extra && guard++ < 30) { const d = decoy(M.pick(parts)); if (!parts.includes(d)) dec.add(d); }
      stonesEl.innerHTML = '';
      M.shuffle(parts.map((p, i) => ({ p, ok: true, i })).concat([...dec].map(p => ({ p, ok: false })))).forEach(o => {
        const b = document.createElement('button'); b.className = 'syll stone-syll'; b.textContent = o.p;
        b.onclick = () => {
          if (!alive || busy || b.classList.contains('used')) return;
          M.say(o.p.toLowerCase(), .85);
          if (o.p === parts[next]) {
            slots[next].textContent = o.p; slots[next].classList.add('full');
            b.classList.add('used'); M.plop(); next++;
            if (next === parts.length) {
              busy = true; M.ding(); M.addRiddle(); M.sparkle(gap, 12, ['⭐', '✨', e]);
              setTimeout(() => {
                M.say(`${parts.join(' ... ')}. ${w}! ${M.pick(M.PRAISE)}`, .85);
                const dist = stage.querySelector('.br-scene').clientWidth - 70;
                pet.style.transition = 'transform 2s ease-in-out'; pet.style.transform = `translateX(${dist}px)`;
              }, 600);
              setTimeout(() => { if (!alive) return; idx++; if (idx >= goal) { hud(); alive = false; done(); } else load(); }, 3600);
            }
          } else { M.wiggle(b); M.boop(); setTimeout(() => M.say(next === 0 ? `Schau aufs Bild: ${w}. Welche Silbe kommt zuerst?` : 'Welche Silbe kommt jetzt?'), 700); }
        };
        stonesEl.appendChild(b);
      });
      setTimeout(() => alive && M.say('Bau die Brücke! Lies die Silben.'), 300);
    }
    load();
    return () => { alive = false; };
  }
});
