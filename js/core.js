/* Maresas Spielewelt – gemeinsamer Kern: Speicher, Stimme, Sound, Rätsel, Party, Karte */
(() => {
  const M = window.M = {};
  const $ = M.$ = id => document.getElementById(id);
  const rnd = M.rnd = n => Math.floor(Math.random() * n);
  const pick = M.pick = a => a[rnd(a.length)];
  const shuffle = M.shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  M.face = 'img/maresa.jpg';

  // ---------- Speicher ----------
  const store = M.store = {
    // Spielstand-Schlüssel „maresa…“ gehören zum aktiven Spieler; Maresa behält ihre alten Schlüssel
    key(k) { return (k.startsWith('maresa') && M.player && M.player.id !== 'maresa') ? 'sp_' + M.player.id + '_' + k.slice(6) : k; },
    get(k, d) { try { const v = localStorage.getItem(this.key(k)); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(this.key(k), v); } catch (e) {} },
    num(k, d = 0) { return parseInt(this.get(k, String(d)), 10) || d; }
  };
  M.animal = store.get('maresaTier', '🦄');
  M.mode = store.get('maresaModus', 'both');
  M.progress = store.num('maresaStation', 0);

  // ---------- Stimme ----------
  const NAME_SPOKEN = 'Mareesa';   // so klingt „Maresa“ richtig (Ma-REE-sa)
  let voice = null;
  function pickVoice() {
    try {
      const vs = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith('de'));
      voice = vs.find(v => /anna|petra|helena|marlene|female/i.test(v.name)) || vs[0] || null;
    } catch (e) {}
  }
  try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}
  M.say = (text, rate = 0.9) => {
    try {
      speechSynthesis.cancel();
      if (!text) return;
      const u = new SpeechSynthesisUtterance(String(text).replace(/Maresas/g, NAME_SPOKEN + 's').replace(/Maresa/g, NAME_SPOKEN));
      u.lang = 'de-DE'; u.rate = rate; u.pitch = 1.1;
      if (voice) u.voice = voice;
      speechSynthesis.speak(u);
    } catch (e) {}
  };

  // ---------- Sound ----------
  let ac = null;
  M.audio = () => { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) {} return ac; };
  const tone = M.tone = (freq, start, dur, type = 'triangle', vol = 0.18) => {
    const a = M.audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, a.currentTime + start);
    g.gain.linearRampToValueAtTime(vol, a.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + start + dur);
    o.connect(g).connect(a.destination);
    o.start(a.currentTime + start); o.stop(a.currentTime + start + dur + 0.05);
  };
  M.blip = () => tone(660 + Math.random() * 200, 0, 0.08, 'sine', 0.06);
  M.ding = () => [784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle', 0.14));
  M.boop = () => { tone(300, 0, 0.18, 'sine', 0.12); tone(240, 0.12, 0.22, 'sine', 0.1); };
  M.plop = () => { tone(500, 0, .06, 'sine', .15); tone(900, .04, .08, 'sine', .1); };
  M.fanfare = () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.18, 'square', 0.12));
    [523, 659, 784, 1047].forEach(f => tone(f, 0.6, 0.9, 'triangle', 0.12));
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, 1.6 + i * 0.1, 0.2, 'square', 0.1));
    [1047, 1319, 1568, 2093].forEach(f => tone(f, 2.1, 1.2, 'triangle', 0.1));
    for (let i = 0; i < 12; i++) tone(1500 + Math.random() * 2500, 0.6 + Math.random() * 2.5, 0.15, 'sine', 0.05);
  };
  M.vibrate = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };

  // ---------- Kleine Effekte ----------
  M.toast = (msg, ms = 2200) => {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), ms);
  };
  M.sparkle = (el, n = 12, bits = ['⭐', '✨', '💖', '🌟']) => {
    const r = el.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div'); s.className = 'pop'; s.textContent = pick(bits);
      s.style.left = (r.left + r.width / 2 - 18) + 'px'; s.style.top = (r.top + r.height / 2 - 18) + 'px';
      const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 90;
      s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      document.body.appendChild(s); setTimeout(() => s.remove(), 1100);
    }
  };
  M.wiggle = el => { el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong'); setTimeout(() => el.classList.remove('wrong'), 450); };
  M.PRAISE = ['Super!', 'Richtig!', 'Toll gemacht!', 'Bravo, Maresa!', 'Klasse!', 'Genau!', 'Spitze!', 'Wow!'];  // wird pro Spieler neu gesetzt

  // Tier (oder Maresas Foto) als HTML
  M.avatarHTML = (size = 40) => M.face
    ? `<img class="av-photo" src="${M.face}" style="width:${size}px;height:${size}px" alt="">`
    : `<span class="av-emoji" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .62)}px">${M.player ? M.player.fig : '🙂'}</span>`;
  M.petHTML = (size = 40) => M.animal === 'ME' ? M.avatarHTML(size) : M.animal;
  const faceImg = new Image(); faceImg.src = M.face; M.faceImg = faceImg;
  M.drawPet = (ctx, cx, cy, size) => {
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
    if (M.animal === 'ME' && !M.face) { ctx.font = Math.floor(size) + 'px sans-serif'; ctx.fillText(M.player.fig, cx, cy + size * 0.05); }
    else if (M.animal === 'ME') {
      const r = size * 0.5;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.save(); ctx.clip();
      if (faceImg.complete) ctx.drawImage(faceImg, cx - r, cy - r, r * 2, r * 2);
      ctx.restore(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff4fa3'; ctx.lineWidth = Math.max(2, size * 0.08); ctx.stroke();
    } else { ctx.font = Math.floor(size) + 'px sans-serif'; ctx.fillText(M.animal, cx, cy + size * 0.05); }
    ctx.restore();
  };

  // =====================================================================
  //  LERNSTOFF – nach „Richtig rechnen 1“ (S. 1–7), „Frohes Lernen 1“ (S. 1–38: neu T t und N n)
  //  und den Leseblättern/Silbenteppichen 1–5 (M, A, I, O, S, U, R)
  // =====================================================================
  M.WORDS = [ // Wort, Bild, Silben
    ['Elefant','🐘','E-le-fant'], ['Salat','🥬','Sa-lat'], ['Haus','🏠','Haus'], ['Dino','🦕','Di-no'],
    ['Lampe','💡','Lam-pe'], ['Feder','🪶','Fe-der'], ['Krokodil','🐊','Kro-ko-dil'], ['Sofa','🛋️','So-fa'],
    ['Gans','🪿','Gans'], ['Paket','📦','Pa-ket'], ['Ameise','🐜','A-mei-se'], ['Banane','🍌','Ba-na-ne'],
    ['Nest','🪺','Nest'], ['Radio','📻','Ra-di-o'], ['Messer','🔪','Mes-ser'], ['Maus','🐭','Maus'],
    ['Igel','🦔','I-gel'], ['Insel','🏝️','In-sel'], ['Apfel','🍎','Ap-fel'], ['Ufo','🛸','U-fo'],
    ['Oma','👵','O-ma'], ['Rose','🌹','Ro-se'], ['Sonne','☀️','Son-ne'], ['Mond','🌙','Mond'],
    ['Auto','🚗','Au-to'], ['Hase','🐰','Ha-se'], ['Hut','👒','Hut'], ['Nase','👃','Na-se'],
    ['Ente','🦆','En-te'], ['Rakete','🚀','Ra-ke-te'], ['Blume','🌸','Blu-me'], ['Bus','🚌','Bus'],
    ['Krone','👑','Kro-ne'], ['Wal','🐋','Wal'], ['Tiger','🐯','Ti-ger'], ['Zebra','🦓','Ze-bra'],
    ['Melone','🍉','Me-lo-ne'], ['Kamel','🐫','Ka-mel'], ['Raupe','🐛','Rau-pe'], ['Tomate','🍅','To-ma-te'],
    ['Orange','🍊','O-ran-ge'], ['Ohr','👂','Ohr'], ['Uhr','⌚','Uhr'], ['Affe','🐒','Af-fe'],
    ['Schaf','🐑','Schaf'], ['Möhre','🥕','Möh-re'], ['Mais','🌽','Mais'], ['Rabe','🐦‍⬛','Ra-be'],
    // neu: Frohes Lernen S. 36–38 (T t, N n)
    ['Tor','🥅','Tor'], ['Turm','🗼','Turm'], ['Tasse','☕','Tas-se'], ['Teddy','🧸','Ted-dy'],
    ['Taxi','🚕','Ta-xi'], ['Torte','🎂','Tor-te'], ['Tür','🚪','Tür'], ['Trommel','🥁','Trom-mel'],
    ['Nudel','🍜','Nu-del'], ['Nuss','🥜','Nuss'], ['Nashorn','🦏','Nas-horn'], ['Nadel','🪡','Na-del'],
    ['Gespenst','👻','Ge-spenst'], ['Spinne','🕷️','Spin-ne'], ['Mama','👩','Ma-ma'], ['Moos','🌿','Moos']
  ];
  M.LEARNED = ['M', 'I', 'A', 'O', 'S', 'U', 'R', 'T', 'N'];      // im Heft schon geübt
  M.NEWEST = ['T', 'N'];                                          // gerade neu – kommen öfter dran
  M.pickLetter = (list = M.LEARNED) => { const n = M.NEWEST.filter(l => list.includes(l)); return n.length && Math.random() < .45 ? M.pick(n) : M.pick(list); };
  M.LETTERS = 'ABDEFGHIKLMNOPRSTUWZ'.split('');
  M.READ = [['OMA','👵'], ['MAMA','👩'], ['MAUS','🐭'], ['ARM','💪'], ['ROSE','🌹'], ['SOFA','🛋️'], ['UFO','🛸'], ['AUTO','🚗'], ['HASE','🐰'], ['NASE','👃'], ['SONNE','☀️'], ['MOND','🌙'],
    ['TOR','🥅'], ['ROT','🔴'], ['TURM','🗼'], ['MAIS','🌽'], ['MOOS','🌿'], ['NUSS','🥜'], ['TOMATE','🍅']];
  // Silbenteppich: Silben aus den gelernten Buchstaben (Leseblatt 1–5 + T, N)
  M.SYLL_CONS = ['M', 'S', 'R', 'T', 'N'];
  M.SYLL_VOW = ['a', 'i', 'o', 'u'];
  M.syllable = () => M.pickLetter(M.SYLL_CONS) + M.pick(M.SYLL_VOW);
  // Wörter, die man oft braucht (Frohes Lernen S. 37)
  M.SIGHT = ['im', 'am', 'um', 'ist', 'mit'];
  // Lese-Sätze aus Leseblatt 1–5 & der Gespenster-Geschichte von Toni
  M.SENTENCES = [
    ['Oma ist im Haus.', '👵', '🏠'], ['Mama ist am Mais.', '👩', '🌽'], ['Toni ist ein Gespenst.', '👻', ''],
    ['Die Rose ist rot.', '🌹', ''], ['Da ist eine Spinne.', '🕷️', ''], ['Mia ist am Tor.', '👧', '🥅'],
    ['Die Maus ist im Moos.', '🐭', '🌿'], ['Oma ist mit Mama im Turm.', '👵', '🗼']
  ];
  M.wordsWith = L => M.WORDS.filter(w => w[0][0].toUpperCase() === L && !w[0].startsWith('Sch'));

  M.numOpts = (ans, lo, hi) => {
    const s = new Set([ans]); let g = 0;
    while (s.size < 3 && g++ < 50) { const v = ans + pick([-2, -1, 1, 2, 3]); if (v >= lo && v <= hi) s.add(v); }
    while (s.size < 3) s.add(rnd(hi - lo + 1) + lo);
    return shuffle([...s]).map(v => ({ v, label: String(v) }));
  };
  const DICE = M.DICE = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  M.dice = (n, cls = '') => `<div class="dice ${cls}">` + Array.from({ length: 9 }, (_, i) => `<i class="${DICE[n].includes(i) ? 'on' : ''}"></i>`).join('') + '</div>';
  M.field = (n, split = 0) => '<div class="field">' + Array.from({ length: 10 }, (_, i) => `<b class="${i < n ? (split && i >= split ? 'u' : 'r') : ''}"></b>`).join('') + '</div>';
  const dots = (a, b) => '<div class="dotsrow">' + '<i class="r"></i>'.repeat(a) + '<span style="width:10px"></span>' + '<i class="u"></i>'.repeat(b) + '</div>';

  // Rätsel für die Schlüssel im Labyrinth
  const TASKS = {
    dice(L) { const n = rnd(6) + 1; return { text: 'Wie viele Punkte hat der Würfel?', speak: 'Wie viele Punkte hat der Würfel?', vis: M.dice(n), ans: n, opts: M.numOpts(n, 1, 6) }; },
    count(L) { const n = rnd(L < 3 ? 6 : 10) + 1; return { text: 'Wie viele Punkte siehst du?', speak: 'Zähle die Punkte. Wie viele sind es?', vis: M.field(n), ans: n, opts: M.numOpts(n, 1, 10) }; },
    house(L) {
      const T = L < 5 ? 5 : rnd(6) + 5, a = rnd(T + 1), left = Math.random() < .5;
      const cells = left ? `<span>${a}</span><span class="q">?</span>` : `<span class="q">?</span><span>${a}</span>`;
      return { text: `Zahlenhaus – immer ${T}. Was fehlt?`, speak: `Im Zahlenhaus wohnen immer ${T}. ${a} und wie viele noch?`,
        vis: `<div class="house"><div class="roof">${T}</div><div class="floor">${cells}</div></div>`, ans: T - a, opts: M.numOpts(T - a, 0, 10) };
    },
    plus(L) {
      const max = L < 5 ? 5 : 10, a = rnd(max) + 1, b = rnd(max - a + 1);
      return { text: 'Rechne!', speak: `Wie viel ist ${a} plus ${b}?`, vis: `<div class="sum">${a} + ${b} = <span class="q">?</span></div>${dots(a, b)}`, ans: a + b, opts: M.numOpts(a + b, 0, 10) };
    },
    missing(L) {
      const T = rnd(6) + 5, a = rnd(T + 1);
      return { text: 'Was fehlt?', speak: `${T} ist gleich ${a} plus wie viel?`, vis: `<div class="sum">${T} = ${a} + <span class="q">?</span></div>${M.field(T, a)}`, ans: T - a, opts: M.numOpts(T - a, 0, 10) };
    },
    anlaut(L) {
      const cand = M.WORDS.filter(x => !x[0].startsWith('Sch'));
      const newer = cand.filter(x => M.NEWEST.includes(x[0][0]));
      const [w, e] = pick(Math.random() < .35 ? newer : cand), A = w[0].toUpperCase();
      const others = shuffle(M.LETTERS.filter(x => x !== A)).slice(0, 2);
      const showBoxes = L >= 3 && w.length <= 7;
      const boxes = showBoxes ? '<div class="boxes">' + [...w.toUpperCase()].map((c, i) => i === 0 ? '<span class="q">?</span>' : `<span>${c}</span>`).join('') + '</div>' : '';
      return { text: `Mit welchem Buchstaben fängt ${showBoxes ? 'das Wort' : 'es'} an?`, speak: `${w}. Mit welchem Buchstaben fängt ${w} an?`,
        vis: `<div class="big-emoji">${e}</div>${boxes}`, ans: A, opts: shuffle([A, ...others]).map(v => ({ v, label: `${v}<small>${v.toLowerCase()}</small>` })) };
    },
    silben(L) {
      const [w, e, s] = pick(M.WORDS), n = s.split('-').length;
      return { text: 'Klatsch mit! Wie viele Silben?', speak: `${w}. Klatsch mit: ${s.split('-').join(' ... ')}. Wie viele Silben hat ${w}?`,
        vis: `<div class="big-emoji">${e}</div>`, ans: n, opts: [1, 2, 3].map(v => ({ v, label: '👏'.repeat(v) + `<small> ${v}</small>` })) };
    },
    lesen(L) {
      const [w, e] = pick(M.READ);
      const others = shuffle(M.READ.filter(r => r[0] !== w && r[1] !== e)).slice(0, 2);
      return { text: 'Lies das Wort! Welches Bild passt?', speak: 'Lies das Wort. Welches Bild passt dazu?', hintSpeak: w,
        vis: `<div class="word">${w}</div>`, ans: e, opts: shuffle([[w, e], ...others]).map(r => ({ v: r[1], label: r[1] })) };
    },
    // Silbenteppich: Silbe hören, richtige Silbe antippen
    silbe(L) {
      const a = M.syllable(), opts = new Set([a]);
      while (opts.size < 3) { const c = Math.random() < .5 ? a[0] + M.pick(M.SYLL_VOW) : M.pick(M.SYLL_CONS) + a[1]; opts.add(c); }
      return { text: 'Hör gut zu! Welche Silbe ist es?', speak: `Tipp auf die Silbe ${a.toLowerCase()}. ${a.toLowerCase()}!`, hintSpeak: a.toLowerCase(),
        vis: '<div class="big-emoji">👂</div>', ans: a, opts: shuffle([...opts]).map(v => ({ v, label: v })) };
    },
    // m oder n? (Frohes Lernen S. 38)
    mn(L) {
      const list = M.WORDS.filter(w => { const x = w[0].toLowerCase(); return x.includes('m') !== x.includes('n'); });
      const [w, e] = pick(list), ans = w.toLowerCase().includes('m') ? 'M' : 'N';
      return { text: 'Hörst du M oder N?', speak: `${w}. Hörst du M, oder N, in ${w}?`, hintSpeak: w,
        vis: `<div class="big-emoji">${e}</div>`, ans, opts: ['M', 'N'].map(v => ({ v, label: `${v}<small>${v.toLowerCase()}</small>` })) };
    },
    // Wörter, die man oft braucht: im, am, um, ist, mit
    merk(L) {
      const a = pick(M.SIGHT), others = shuffle(M.SIGHT.filter(x => x !== a)).slice(0, 2);
      return { text: 'Welches Wort hörst du?', speak: `Tipp auf das Wort: ${a}.`, hintSpeak: a,
        vis: '<div class="big-emoji">📖</div>', ans: a, opts: shuffle([a, ...others]).map(v => ({ v, label: v })) };
    },
    // kleiner Satz lesen, passendes Bild wählen
    satz(L) {
      const s = pick(M.SENTENCES), pic = r => r[1] + r[2];
      const others = shuffle(M.SENTENCES.filter(r => pic(r) !== pic(s) && r[1] !== s[1])).slice(0, 2);
      return { text: 'Lies den Satz! Welches Bild passt?', speak: 'Lies den Satz. Welches Bild passt?', hintSpeak: s[0],
        vis: `<div class="word" style="font-size:1.7rem;letter-spacing:1px">${s[0]}</div>`, ans: pic(s), opts: shuffle([s, ...others]).map(r => ({ v: pic(r), label: pic(r) })) };
    }
  };
  function pool(L, kind) {
    const math = L <= 2 ? ['dice', 'count'] : L <= 4 ? ['dice', 'count', 'house', 'plus'] : ['count', 'house', 'plus', 'missing'];
    const read = L <= 2 ? ['anlaut', 'silbe'] : L <= 4 ? ['anlaut', 'silben', 'silbe', 'mn', 'merk'] : ['anlaut', 'silben', 'lesen', 'silbe', 'mn', 'merk', 'satz'];
    if (kind === 'calc') return L <= 4 ? ['plus', 'house'] : ['plus', 'house', 'missing'];   // echte Rechenaufgaben
    const m = kind || M.mode;
    return m === 'math' ? math : m === 'read' ? read : math.concat(read);
  }
  let lastType = null;

  // Rätsel öffnen – Promise wird erfüllt, sobald es gelöst ist
  // kind: 'math' / 'read' / 'calc' (nur Plus & Zahlenhaus) erzwingt eine Aufgabenart, sonst gilt der gewählte Modus
  M.quiz = (L, title = '🔑 Schlüssel-Rätsel', kind) => new Promise(resolve => {
    let p = pool(L, kind); if (p.length > 1) p = p.filter(t => t !== lastType);
    lastType = pick(p);
    const cur = TASKS[lastType](L);
    let tries = 0;
    $('qtitle').textContent = title;
    $('qtext').textContent = cur.text;
    $('qvis').innerHTML = cur.vis;
    $('feedback').textContent = '';
    $('opts').innerHTML = '';
    $('speak').onclick = () => M.say(cur.speak);
    cur.opts.forEach(o => {
      const b = document.createElement('button');
      b.className = 'opt'; b.innerHTML = o.label;
      b.onclick = () => {
        if (b.disabled) return;
        if (o.v === cur.ans) {
          document.querySelectorAll('#opts .opt').forEach(x => x.disabled = true);
          b.classList.add('right');
          const pr = pick(M.PRAISE);
          $('feedback').textContent = '🎉 ' + pr;
          M.ding(); M.say(pr); M.vibrate([40, 30, 80]); M.sparkle(b, 12, ['⭐', '✨', '💖', '🔑', '🌟']);
          M.addRiddle();
          setTimeout(() => { $('quiz').classList.remove('active'); resolve(true); }, 1400);
        } else {
          tries++; M.wiggle(b); M.boop();
          if (tries === 1) { $('feedback').textContent = '🤔 Fast! Probier nochmal.'; M.say('Fast! Probier nochmal.'); }
          else {
            $('feedback').textContent = '💡 Schau mal, der hier leuchtet!';
            M.say(cur.hintSpeak ? 'Das Wort heißt ' + cur.hintSpeak : 'Schau mal, der hier leuchtet!');
            [...document.querySelectorAll('#opts .opt')].forEach((x, i) => { if (cur.opts[i].v === cur.ans) x.classList.add('hint'); });
          }
        }
      };
      $('opts').appendChild(b);
    });
    $('quiz').classList.add('active');
    tone(523, 0, .1); tone(784, .1, .15);
    setTimeout(() => M.say(cur.speak), 250);
  });

  // ---------- Zähler ----------
  M.addRiddle = () => { store.set('maresaRaetsel', store.num('maresaRaetsel') + 1); showStats(); };
  function showStats() {
    const t = store.num('maresaSchaetze'), r = store.num('maresaRaetsel');
    $('treasureCount').textContent = '💰 ' + t + (t === 1 ? ' Schatz' : ' Schätze');
    $('riddleCount').textContent = '⭐ ' + r + ' Aufgaben';
  }

  // =====================================================================
  //  SPIELE & SCHATZKARTE
  // =====================================================================
  M.games = {};
  M.register = (id, g) => { M.games[id] = g; };
  const ORDER = ['labyrinth', 'bubbles', 'memory', 'hop', 'catch', 'train', 'bakery', 'paint', 'pacman'];   // Mampf-Jagd als Schatz-Finale jeder Insel
  const ISLANDS = [
    ['🦄 Einhorn-Wiese', '#ff8fc8'], ['🌴 Palmen-Strand', '#ffb84f'], ['🏰 Ritter-Burg', '#9c7cf0'],
    ['🌊 Glitzer-Meer', '#4fb6ff'], ['🍭 Zuckerland', '#ff6fa8'], ['🌋 Feuerberg', '#ff7a4f'],
    ['❄️ Eisschloss', '#7cc8f0'], ['🚀 Sternenhimmel', '#6a5cff']
  ];
  M.island = i => ISLANDS[i % ISLANDS.length];
  const N = ORDER.length;   // Stationen pro Insel

  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
  }
  M.show = show;

  // ---------- Spieler ----------
  const BUILTIN = [
    { id: 'maresa', name: 'Maresa', fig: '👧', g: 'f', photo: 'img/maresa.jpg' },
    { id: 'baumgartner', name: 'Frau Baumgartner', fig: '👩‍🏫', g: 'f' }
  ];
  const custom = () => { try { return JSON.parse(localStorage.getItem('spielerListe') || '[]'); } catch (e) { return []; } };
  const saveCustom = l => { try { localStorage.setItem('spielerListe', JSON.stringify(l)); } catch (e) {} };
  const genitive = n => /[sßxz]$/i.test(n) ? n + '’' : n + 's';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function loadPlayer(p) {
    M.player = p; M.name = p.name; M.face = p.photo || null;
    if (M.face) faceImg.src = M.face;
    M.animal = store.get('maresaTier', '🦄');
    M.mode = store.get('maresaModus', 'both');
    M.progress = store.num('maresaStation', 0);
    M.PRAISE = ['Super!', 'Richtig!', 'Toll gemacht!', 'Bravo, ' + p.name + '!', 'Klasse!', 'Genau!', 'Spitze!', 'Wow!'];
    document.querySelectorAll('.avslot').forEach(s => s.innerHTML = M.avatarHTML(+s.dataset.size || 40));
    document.querySelectorAll('.pname').forEach(s => s.textContent = p.name);
    document.querySelectorAll('.pgen').forEach(s => s.textContent = genitive(p.name) + ' Spielewelt');
    document.title = genitive(p.name) + ' Spielewelt';
    document.querySelectorAll('.mode').forEach(b => b.classList.toggle('on', b.dataset.m === M.mode));
    document.querySelectorAll('.animal').forEach(b => b.classList.toggle('on', b.dataset.a === M.animal));
    showStats();
  }
  function playerStats(p) {
    const k = p.id === 'maresa' ? 'maresaStation' : 'sp_' + p.id + '_Station';
    let n = 0; try { n = parseInt(localStorage.getItem(k) || '0', 10) || 0; } catch (e) {}
    return n ? 'Station ' + (n + 1) : 'Neu dabei';
  }
  function renderPlayers() {
    const list = $('plist'); list.innerHTML = '';
    const all = BUILTIN.concat(custom());
    all.forEach(p => {
      const c = document.createElement('div'); c.className = 'pcard'; c.setAttribute('role', 'button');
      const av = p.photo ? `<img class="av-photo" src="${p.photo}" style="width:84px;height:84px" alt="">`
        : `<span class="av-emoji" style="width:84px;height:84px;font-size:52px">${p.fig}</span>`;
      c.innerHTML = av + `<div class="nm">${esc(p.name)}</div><div class="st">${playerStats(p)}</div>` + (p.builtin === false ? '<button class="pdel" aria-label="Spieler löschen">✕</button>' : '');
      c.onclick = e => {
        if (e.target.closest('.pdel') || e.target.closest('.pconfirm')) return;
        M.audio(); loadPlayer(p); show('start'); M.say('Hallo ' + p.name + '! Wer willst du heute sein?');
      };
      const del = c.querySelector('.pdel');
      if (del) del.onclick = () => {
        const box = document.createElement('div'); box.className = 'pconfirm';
        box.innerHTML = `${esc(p.name)} löschen?<div><button class="no">Nein</button><button class="yes" style="background:#ffd6d6">Ja, löschen</button></div>`;
        box.querySelector('.no').onclick = () => box.remove();
        box.querySelector('.yes').onclick = () => {
          saveCustom(custom().filter(x => x.id !== p.id));
          try { Object.keys(localStorage).filter(k => k.startsWith('sp_' + p.id + '_')).forEach(k => localStorage.removeItem(k)); } catch (e) {}
          renderPlayers();
        };
        c.appendChild(box);
      };
      list.appendChild(c);
    });
    const add = document.createElement('button'); add.className = 'pcard add';
    add.innerHTML = '<div class="plus">➕</div><div class="nm">Neuer Spieler</div>';
    add.onclick = () => { M.audio(); openNewPlayer(); };
    list.appendChild(add);
  }
  let newFig = null;
  function openNewPlayer() {
    newFig = null; $('npName').value = '';
    document.querySelectorAll('.fig').forEach(f => f.classList.remove('on'));
    checkNew(); show('newPlayer'); M.say('Wie heißt du? Und wer willst du sein?');
  }
  function checkNew() { $('npGo').disabled = !($('npName').value.trim() && newFig); }
  $('npName').addEventListener('input', checkNew);
  document.querySelectorAll('.fig').forEach(f => f.onclick = () => {
    newFig = { fig: f.dataset.f, g: f.dataset.g };
    document.querySelectorAll('.fig').forEach(x => x.classList.toggle('on', x === f)); M.blip(); checkNew();
  });
  $('npBack').onclick = () => { renderPlayers(); show('players'); };
  $('npGo').onclick = () => {
    const name = $('npName').value.trim().slice(0, 20); if (!name || !newFig) return;
    const p = { id: 'p' + Date.now().toString(36), name, fig: newFig.fig, g: newFig.g, builtin: false };
    saveCustom(custom().concat([p]));
    loadPlayer(p); show('start'); M.ding(); M.say('Hallo ' + name + '! Schön, dass du da bist! Such dir ein Tier aus!');
  };
  $('swapPlayer').onclick = () => { leaveGame(); renderPlayers(); show('players'); };
  loadPlayer(BUILTIN[0]);
  renderPlayers();

  // ---------- Startbildschirm ----------
  showStats();
  document.querySelectorAll('.mode').forEach(b => {
    b.classList.toggle('on', b.dataset.m === M.mode);
    b.onclick = () => { M.mode = b.dataset.m; store.set('maresaModus', M.mode); document.querySelectorAll('.mode').forEach(x => x.classList.toggle('on', x === b)); };
  });
  document.querySelectorAll('.animal').forEach(b => {
    b.classList.toggle('on', b.dataset.a === M.animal);
    b.addEventListener('click', () => {
      M.animal = b.dataset.a; store.set('maresaTier', M.animal); M.audio();
      document.querySelectorAll('.animal').forEach(x => x.classList.toggle('on', x === b));
      if (current && current.station != null && $('game').dataset.paused === '1') { resumeGame(); return; }
      openMap(true);
    });
  });

  // ---------- Karte (Schatzkarte) – immer genau EINE Insel, passt auf einen Bildschirm ----------
  const SEA = ['⛵', '🐙', '🐳', '🦈', '🐢', '🦑', '🏴‍☠️', '🐬'];
  const DECO = ['🌴', '🪨', '🌵', '🌺', '🍄', '🌴'];
  let viewIsland = null;
  // Schlangenweg: 3 Reihen à 3 Stationen (links→rechts, rechts→links, links→rechts)
  function layout(w, h) {
    const cols = 3, rows = Math.ceil(N / cols);
    const top = 132, bottom = Math.max(top + (rows - 1) * 118, h - 92);
    const gap = (bottom - top) / (rows - 1);
    const pts = [];
    for (let k = 0; k < N; k++) {
      const r = Math.floor(k / cols), c0 = k % cols, c = r % 2 ? cols - 1 - c0 : c0;
      const x = w * (0.19 + c * 0.31);
      const y = top + r * gap + (c === 1 ? gap * 0.16 : 0) * (r === 0 ? 1 : -1);
      pts.push({ x, y });
    }
    return { pts, height: bottom + 92 };
  }
  // weiche Kurve durch alle Stationen
  function curve(pts) {
    let d = `M${pts[0].x.toFixed(0)} ${pts[0].y.toFixed(0)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      d += ` Q${pts[i].x.toFixed(0)} ${pts[i].y.toFixed(0)} ${mx.toFixed(0)} ${my.toFixed(0)}`;
    }
    const l = pts[pts.length - 1]; return d + ` L${l.x.toFixed(0)} ${l.y.toFixed(0)}`;
  }
  function openMap(greet, isl) {
    show('map');
    const curIsland = Math.floor(M.progress / N);
    if (isl != null) viewIsland = isl;
    if (viewIsland == null || greet) viewIsland = curIsland;
    viewIsland = Math.max(0, Math.min(viewIsland, curIsland + 1));
    const inner = $('mapInner'), sc = $('mapScroll');
    const w = Math.min(sc.clientWidth || 360, 480), hAvail = sc.clientHeight || 560;
    const { pts, height } = layout(w, hAvail);
    const h = Math.max(hAvail, height);
    const [name, col] = M.island(viewIsland);
    const base = viewIsland * N;
    let html = `<div class="island one" style="background:radial-gradient(ellipse at 50% 45%, ${col}66, ${col}22 70%), #e2c47f"></div>`;
    html += `<div class="islandNav"><button class="inav" id="islPrev" ${viewIsland > 0 ? '' : 'disabled'}>◀</button>`
      + `<h2>Insel ${viewIsland + 1}<br><span>${name}</span></h2>`
      + `<button class="inav" id="islNext" ${viewIsland <= curIsland ? '' : 'disabled'}>▶</button></div>`;
    // Deko zwischen den Reihen + Meer an den Ecken
    [[.13, (pts[0].y + pts[5].y) / 2 + 20], [.87, (pts[3].y + pts[8].y) / 2 - 20], [.07, pts[0].y - 52], [.5, (pts[4].y + pts[7].y) / 2 + 8]].forEach(([fx, y], j) =>
      html += `<div class="deco" style="left:${w * fx}px;top:${y}px">${DECO[(j + viewIsland) % DECO.length]}</div>`);
    html += `<div class="deco sea" style="left:${w * .06}px;top:${h - 24}px">${SEA[(viewIsland * 3) % SEA.length]}</div><div class="deco sea" style="left:${w * .92}px;top:${108}px;animation-delay:.8s">${SEA[(viewIsland * 3 + 1) % SEA.length]}</div>`;
    pts.forEach((p, k) => {
      const i = base + k, g = M.games[ORDER[k]];
      const cls = i < M.progress ? 'done' : i === M.progress ? 'current' : 'locked';
      if (k === N - 1) html += `<div class="xmark" style="left:${p.x}px;top:${p.y}px">✖</div>`;
      html += `<button class="station ${cls}" data-i="${i}" style="left:${p.x}px;top:${p.y}px">${g.icon}<small>${g.name}</small></button>`;
    });
    if (viewIsland === curIsland) {
      const cp = pts[M.progress % N];
      html += `<div class="mapPet" id="mapPet" style="left:${cp.x}px;top:${cp.y}px">${M.petHTML(50)}</div>`;
    }
    const path = curve(pts);
    inner.style.height = h + 'px';
    inner.classList.add('compact');
    inner.innerHTML = `<svg width="100%" height="${h}"><path d="${path}" fill="none" stroke="rgba(90,52,18,.25)" stroke-width="9" stroke-linecap="round" transform="translate(2 3)"/><path d="${path}" fill="none" stroke="#b8322a" stroke-width="6" stroke-dasharray="14 12" stroke-linecap="round"/></svg>` + html;
    inner.querySelectorAll('.station').forEach(b => b.onclick = () => {
      const i = +b.dataset.i; if (i > M.progress) { M.boop(); M.say('Das ist noch zu. Spiel erst die Station davor!'); return; }
      startStation(i);
    });
    const prev = $('islPrev'), next = $('islNext');
    prev.onclick = () => { M.blip(); openMap(false, viewIsland - 1); };
    next.onclick = () => { M.blip(); openMap(false, viewIsland + 1); if (viewIsland > curIsland) M.say('Diese Insel wartet noch auf dich!'); };
    $('mapStation').textContent = 'Station ' + (M.progress % N + 1) + '/' + N;
    sc.scrollTop = 0;
    if (greet) M.say(M.progress === 0 ? 'Hallo ' + M.name + '! Tipp auf die erste Station!' : 'Weiter geht\'s! Tipp auf die leuchtende Station!');
  }
  M.openMap = openMap;
  $('mapHome').onclick = () => { leaveGame(); show('start'); };

  // ---------- Spiel starten ----------
  let current = null;
  function startStation(i) {
    leaveGame();
    const id = ORDER[i % N], g = M.games[id];
    const round = Math.floor(i / N) + 1;
    current = { station: i, id, round };
    $('gTitle').textContent = g.icon + ' ' + g.name;
    $('hud').textContent = '';
    $('game').dataset.paused = '';
    show('game');
    const stage = $('stage'); stage.innerHTML = '';
    // Kurze Erklärung vorher
    const intro = document.createElement('div'); intro.className = 'intro';
    intro.innerHTML = `<div class="qcard"><div class="big">${g.icon}</div><h3>${g.name}</h3><p>${g.howto(round)}</p><button class="btn pink">Los geht's! ▶</button></div>`;
    stage.appendChild(intro);
    M.say(g.howto(round).replace(/<[^>]+>/g, ''));
    intro.querySelector('button').onclick = () => {
      M.audio(); intro.remove();
      current.cleanup = g.start(stage, { round, station: i, done: () => win() });
    };
  }
  function leaveGame() {
    if (current && current.cleanup) { try { current.cleanup(); } catch (e) {} }
    $('quiz').classList.remove('active');
    try { speechSynthesis.cancel(); } catch (e) {}
    if (current) current.cleanup = null;
  }
  // Tierwechsel mitten im Spiel: Spiel bleibt, wie es ist
  function resumeGame() { $('game').dataset.paused = ''; show('game'); if (current && current.onResume) current.onResume(); window.dispatchEvent(new Event('resize')); }
  $('gMap').onclick = () => { leaveGame(); current = null; openMap(false); };
  $('gPet').onclick = () => { $('game').dataset.paused = '1'; show('start'); M.say('Welches Tier willst du sein?'); };
  M.setHud = t => { $('hud').innerHTML = t; };
  M.onResume = fn => { if (current) current.onResume = fn; };

  // ---------- Feuerwerk & Konfetti ----------
  const fx = $('fx'), fctx = fx.getContext('2d');
  let parts = [], running = false;
  function sizeFx() { const dpr = window.devicePixelRatio || 1; fx.width = innerWidth * dpr; fx.height = innerHeight * dpr; fctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function burst(x, y) {
    const hue = Math.random() * 360;
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 6;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, decay: 0.008 + Math.random() * 0.012, color: `hsl(${hue + Math.random() * 60},100%,60%)`, size: 2 + Math.random() * 3, type: 'spark' });
    }
  }
  function confetti(n) {
    for (let i = 0; i < n; i++) parts.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 3, life: 1, decay: 0.003, color: `hsl(${Math.random() * 360},100%,60%)`, size: 6 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - .5) * 0.3, type: 'conf' });
  }
  function loop() {
    fctx.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.type === 'spark') { p.vy += 0.08; p.vx *= 0.99; fctx.globalAlpha = Math.max(p.life, 0); fctx.fillStyle = p.color; fctx.beginPath(); fctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); fctx.fill(); }
      else { p.rot += p.vr; fctx.globalAlpha = 1; fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot); fctx.fillStyle = p.color; fctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); fctx.restore(); }
    });
    fctx.globalAlpha = 1;
    parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
    if (running || parts.length) requestAnimationFrame(loop);
  }
  function emojiRain(n) {
    const bits = ['💰', '💎', '⭐', '🌟', '✨', '🌈', '💖', '🎉', '👑', '🦄', '🍭', '🎊', '🪙', '🏆', '🔑'];
    for (let i = 0; i < n; i++) {
      const e = document.createElement('div');
      e.className = 'rain'; e.textContent = pick(bits);
      e.style.left = Math.random() * 100 + 'vw';
      e.style.fontSize = (1.5 + Math.random() * 2.5) + 'rem';
      e.style.animationDuration = (2 + Math.random() * 2.5) + 's';
      e.style.animationDelay = Math.random() * 3 + 's';
      $('party').appendChild(e); setTimeout(() => e.remove(), 8000);
    }
  }

  // ---------- DIE PARTY ----------
  const praises = () => {
    const N = M.name, f = M.player.g === 'f';
    return [
      f ? `${N}, die Königin! 👑` : `${N}, der König! 👑`, `WAHNSINN, ${N.toUpperCase()}!!! 🤩`, f ? 'Du bist die Allerbeste! 💖' : 'Du bist der Allerbeste! 💖',
      `Rechen-Profi ${N}! 🔢`, `Super-${N} hat's geschafft! ${f ? '🦸‍♀️' : '🦸‍♂️'}`, f ? 'Weltmeisterin! 🏆' : 'Weltmeister! 🏆',
      `So schlau! So mutig! So ${N}! ✨`, f ? 'Buchstaben-Detektivin! 🔍' : 'Buchstaben-Detektiv! 🔍', 'Mega-Giga-Super! 🚀'
    ];
  };
  let partyTimer = null;
  function win() {
    const s = current.station;
    const g = M.games[current.id];
    store.set('maresaSchaetze', store.num('maresaSchaetze') + 1); showStats();
    const islandDone = s === M.progress && s % N === N - 1;
    if (s === M.progress) { M.progress++; store.set('maresaStation', M.progress); }
    const p = $('party');
    $('partyPet').textContent = M.animal === 'ME' ? '🌟' : M.animal;
    const text = islandDone ? '🏝️ INSEL GESCHAFFT! 🏝️' : '🎉 GESCHAFFT, ' + M.name.toUpperCase() + '! 🎉';
    const colors = ['#fff', '#fff34f', '#ffffff', '#ffe3f3'];
    $('headline').innerHTML = [...text].map((ch, i) => ch === ' ' ? ' ' : `<span style="animation-delay:${(i * 0.05).toFixed(2)}s;color:${colors[i % colors.length]}">${ch}</span>`).join('');
    const pr = pick(praises());
    $('praise').textContent = pr;
    $('partyCount').textContent = g.icon + ' ' + g.name + ' geschafft!  ⭐ ' + store.num('maresaRaetsel') + ' Aufgaben gelöst';
    p.classList.add('active');
    const fl = document.createElement('div'); fl.className = 'flash'; p.appendChild(fl); setTimeout(() => fl.remove(), 600);
    const box = p.querySelector('.partybox'); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    M.vibrate([100, 50, 100, 50, 200, 100, 400]);
    M.fanfare();
    setTimeout(() => M.say((islandDone ? 'Wahnsinn! Die ganze Insel geschafft! ' : M.name + ' hat es geschafft! ') + pr.replace(/[^\p{L}\p{N}\s!,'’]/gu, ''), 1), 2600);
    sizeFx(); running = true; loop();
    confetti(islandDone ? 350 : 200); emojiRain(islandDone ? 100 : 60);
    let shots = 0;
    clearInterval(partyTimer);
    partyTimer = setInterval(() => {
      burst(Math.random() * innerWidth, innerHeight * (0.15 + Math.random() * 0.45));
      if (shots % 3 === 0) confetti(40);
      if (++shots > (islandDone ? 40 : 22)) { clearInterval(partyTimer); running = false; }
    }, 280);
  }
  function endParty() {
    clearInterval(partyTimer); running = false; parts = [];
    $('party').classList.remove('active');
    $('party').querySelectorAll('.rain').forEach(e => e.remove());
    try { speechSynthesis.cancel(); } catch (e) {}
  }
  $('next').onclick = () => { endParty(); leaveGame(); current = null; openMap(true); };
  $('again').onclick = () => { const s = current.station; endParty(); startStation(s); };
  window.addEventListener('resize', () => { if ($('party').classList.contains('active')) sizeFx(); if ($('map').classList.contains('active')) openMap(false); });

  // kleine Hilfe für die Spiele: Einleitung mit Ablauf
  M.ORDER = ORDER;
})();
