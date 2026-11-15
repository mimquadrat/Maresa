/* 🧁 Zahlenhaus-Bäckerei: Kunden wollen eine bestimmte Anzahl – auffüllen, was fehlt */
M.register('bakery', {
  name: 'Bäckerei', icon: '🧁',
  howto: r => 'Die Kunden wollen immer eine bestimmte Anzahl Leckereien. Leg dazu, was noch fehlt, und drück die Klingel!',
  start(stage, { round, done }) {
    const goal = 5;
    const WHO = ['🐻', '🐼', '🦊', '🐸', '🐷', '🐨', '🐵', '🐧', '🦁', '🐮'];
    const TREATS = [['🍪', 'Kekse'], ['🧁', 'Muffins'], ['🍩', 'Donuts'], ['🍓', 'Erdbeeren'], ['🥐', 'Hörnchen']];
    let served = 0, alive = true, order = null, onPlate = 0, tries = 0, wait = false;
    stage.innerHTML = `<div class="shop">
      <div class="customer"><div class="who" id="bWho"></div><div class="bubbletalk" id="bTalk"></div></div>
      <div class="mini-house"><div class="roof" id="bRoof" style="width:150px;height:60px;font-size:1.8rem"></div><div class="floor" style="width:120px"><span id="bHave" style="height:48px;font-size:1.8rem"></span><span class="q" id="bNeed" style="height:48px;font-size:1.8rem">?</span></div></div>
      <div class="plate" id="bPlate"></div>
      <div class="shop-btns"><button class="btn pink" id="bAdd"></button><button class="btn green" id="bBell">🔔 Fertig</button></div>
    </div>`;
    const $s = sel => stage.querySelector(sel);
    const hud = () => M.setHud(`🧁 ${served}/${goal}`);
    function render() {
      const plate = $s('#bPlate'); plate.innerHTML = '';
      for (let i = 0; i < onPlate; i++) {
        const t = document.createElement('span'); t.className = 'treat'; t.textContent = order.treat[0];
        t.onclick = () => { if (wait) return; if (onPlate > order.start) { onPlate--; M.blip(); render(); } else { M.wiggle(t); M.say('Die waren schon da. Die bleiben!'); } };
        plate.appendChild(t);
      }
      $s('#bHave').textContent = order.start;
    }
    function newOrder() {
      hud(); tries = 0;
      const T = round === 1 ? 5 : round === 2 ? 5 + M.rnd(3) : 5 + M.rnd(6);
      const start = M.rnd(T);   // mindestens 1 fehlt
      order = { T, start, who: M.pick(WHO), treat: M.pick(TREATS) };
      onPlate = start;
      $s('#bWho').textContent = order.who;
      $s('#bTalk').innerHTML = `Ich möchte <b>${T}</b> ${order.treat[0]}!`;
      $s('#bRoof').textContent = T;
      $s('#bAdd').textContent = '+ ' + order.treat[0];
      render();
      M.say(`Hallo! Ich möchte ${T} ${order.treat[1]}. ${start ? start + ' sind schon auf dem Teller.' : 'Der Teller ist noch leer.'} Leg dazu, was fehlt!`);
    }
    $s('#bAdd').onclick = () => { if (!alive || wait) return; if (onPlate >= 12) { M.boop(); return; } onPlate++; M.plop(); render(); M.say(String(onPlate), 1.1); };
    $s('#bBell').onclick = () => {
      if (!alive || wait) return;
      M.tone(1568, 0, .5, 'sine', .15);
      if (onPlate === order.T) {
        M.ding(); M.sparkle($s('#bPlate'), 12, ['💖', '⭐', order.treat[0]]); M.addRiddle();
        M.say(`Danke! ${order.start} und ${order.T - order.start} sind ${order.T}. ${M.pick(M.PRAISE)}`);
        $s('#bNeed').textContent = order.T - order.start;
        served++; hud(); wait = true;
        setTimeout(() => { wait = false; $s('#bNeed').textContent = '?'; if (served >= goal) done(); else newOrder(); }, 2600);
      } else {
        tries++; M.boop(); M.wiggle($s('#bPlate'));
        const msg = onPlate < order.T ? `Das sind erst ${onPlate}. Ich möchte ${order.T}!` : `Oh, das sind ${onPlate}. Das ist zu viel! Ich möchte nur ${order.T}.`;
        M.say(msg + (tries >= 2 ? ' Zähl mal mit mir!' : ''));
        M.toast(msg);
      }
    };
    newOrder();
    return () => { alive = false; };
  }
});
