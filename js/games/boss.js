/* 🐙 Insel-Boss: Die freundliche Krake bewacht den Weg zum Schatz – 5 gemischte Fragen, dann gibt sie den Weg frei */
M.register('boss', {
  name: 'Insel-Krake', icon: '🐙',
  howto: r => 'Die freundliche Krake Olga bewacht den Weg zum Schatz! Beantworte ihre 5 Fragen – dann macht sie den Weg frei.',
  start(stage, { round, done }) {
    const goal = 5;
    let n = 0, alive = true;
    const L = Math.min(6, round + 2);   // Krake fragt etwas schwerer – gemischt aus allem, was auf der Insel dran war
    stage.innerHTML = `<div class="bo-scene">
        <div class="bo-kraken" id="boK">🐙</div>
        <div class="bo-ink" id="boInk">${'<span>🫧</span>'.repeat(goal)}</div>
        <div class="bo-chest" id="boChest">🔒</div>
      </div>
      <div class="bubbletalk" id="boTalk">Hallo! Ich bin Olga. Weißt du die Antworten?</div>
      <button class="btn pink" id="boGo" style="font-size:1.3rem;padding:14px 28px;margin-top:14px">Frage stellen ❓</button>`;
    const $s = q => stage.querySelector(q);
    const hud = () => M.setHud(`🐙 ${n}/${goal}`);
    const lines = ['Oh, du weißt ja viel!', 'Hihi, das kitzelt!', 'Wow, schon wieder richtig!', 'Du bist richtig schlau!', 'Meine Arme sind ganz wackelig vor Staunen!'];
    hud();
    setTimeout(() => alive && M.say('Hallo! Ich bin Olga, die Krake. Ich lasse dich zum Schatz, wenn du meine 5 Fragen beantwortest!'), 300);
    async function ask() {
      const go = $s('#boGo'); go.disabled = true;
      await M.quiz(L, `🐙 Olgas Frage ${n + 1}/${goal}`);
      if (!alive) return;
      n++; hud();
      const ink = $s('#boInk').children[n - 1]; if (ink) ink.classList.add('gone');
      const k = $s('#boK'); k.classList.remove('happy'); void k.offsetWidth; k.classList.add('happy');
      if (n >= goal) {
        $s('#boChest').textContent = '🔓'; $s('#boTalk').textContent = 'Du hast es geschafft! Der Weg zum Schatz ist frei!';
        k.classList.add('swim');
        M.fanfare(); setTimeout(() => M.say('Du hast es geschafft! Der Weg zum Schatz ist frei!'), 400);
        setTimeout(() => alive && done(), 2600);
      } else {
        const t = lines[(n - 1) % lines.length]; $s('#boTalk').textContent = t;
        setTimeout(() => alive && M.say(t), 1500);
        go.disabled = false; go.textContent = 'Nächste Frage ❓';
      }
    }
    $s('#boGo').onclick = ask;
    return () => { alive = false; };
  }
});
