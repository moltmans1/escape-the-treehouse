export class SafeDialsMinigame {
  constructor() {
    this.scene = null;
    this.container = null;
    this.elements = [];
    this.safeDials = [];
    this.tweens = [];
  }

  onCreate(scene, container) {
    this.scene = scene;
    this.container = container;
    this.safeDials = [];
    this.tweens = [];

    const stateManager = scene.stateManager;
    const isUnlocked = stateManager.hasFlag('safe_unlocked');

    if (isUnlocked) {
      const openBg = scene.add.image(480, 220, 'safe_open')
        .setDisplaySize(535, 535)
        .setDepth(2);
      this.container.add(openBg);
      this.elements.push(openBg);
      return;
    }

    const lockedBg = scene.add.image(480, 220, 'safe_bg')
      .setDisplaySize(960, 535)
      .setDepth(1);
    this.container.add(lockedBg);
    this.elements.push(lockedBg);

    const title = scene.add.text(480, 85, 'OLD DIAL SAFE', {
      fontFamily: 'Playfair Display',
      fontSize: '18px',
      fill: '#d4a373',
      fontWeight: 'bold',
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(3);
    this.container.add(title);
    this.elements.push(title);

    const subtitle = scene.add.text(480, 110, 'Click dials to rotate values', {
      fontFamily: 'Outfit',
      fontSize: '11px',
      fill: '#8f7155'
    }).setOrigin(0.5).setDepth(3);
    this.container.add(subtitle);
    this.elements.push(subtitle);

    const startX = 360;
    const spacing = 80;
    const slotGraphics = [];
    const wheelTexts = [];
    const hitZones = [];

    for (let i = 0; i < 4; i++) {
      const x = startX + i * spacing;

      const slotCasing = scene.add.graphics();
      slotCasing.fillStyle(0x1a1512, 1);
      slotCasing.fillRoundedRect(x - 20, 140, 40, 160, 5);
      slotCasing.lineStyle(2, 0x8f7155, 0.5);
      slotCasing.strokeRoundedRect(x - 20, 140, 40, 160, 5);
      slotCasing.setDepth(3);
      this.container.add(slotCasing);
      slotGraphics.push(slotCasing);
      this.elements.push(slotCasing);

      const digitStyle = {
        fontFamily: 'Outfit',
        fontWeight: 'bold'
      };

      const prevText = scene.add.text(x, 175, '9', { ...digitStyle, fontSize: '20px', fill: '#c8b7a6' })
        .setOrigin(0.5)
        .setAlpha(0.4)
        .setDepth(4);
      
      const activeText = scene.add.text(x, 220, '0', { ...digitStyle, fontSize: '32px', fill: '#d4a373' })
        .setOrigin(0.5)
        .setDepth(4);
      
      const nextText = scene.add.text(x, 265, '1', { ...digitStyle, fontSize: '20px', fill: '#c8b7a6' })
        .setOrigin(0.5)
        .setAlpha(0.4)
        .setDepth(4);

      this.container.add([prevText, activeText, nextText]);
      wheelTexts.push(prevText, activeText, nextText);
      this.elements.push(prevText, activeText, nextText);

      const hitZone = scene.add.rectangle(x, 220, 40, 160, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(5);
      
      hitZone.value = 0;
      hitZone.index = i;

      hitZone.on('pointerdown', () => {
        hitZone.value = (hitZone.value + 1) % 10;
        activeText.setText(hitZone.value);
        prevText.setText((hitZone.value - 1 + 10) % 10);
        nextText.setText((hitZone.value + 1) % 10);
        
        if (scene.updateCanvasCursor) scene.updateCanvasCursor();

        const combo = this.safeDials.map(d => d.value).join('');
        const minigameConfig = scene.TreehouseConfig.minigames.safe_view;
        
        if (combo === minigameConfig.combination) {
          hitZones.forEach(hz => hz.disableInteractive());

          stateManager.setFlag('safe_unlocked');
          stateManager.state.hasKeyInCompartment = false;
          stateManager.addItem('rusty_key');

          const openBg = scene.add.image(480, 220, 'safe_open')
            .setDisplaySize(535, 535)
            .setDepth(2);
          openBg.alpha = 0;
          this.container.add(openBg);
          this.elements.push(openBg);

          const fadeOutTween = scene.tweens.add({
            targets: [lockedBg, title, subtitle, ...slotGraphics, ...wheelTexts],
            alpha: 0,
            duration: 200,
            onComplete: () => {
              lockedBg.destroy();
              title.destroy();
              subtitle.destroy();
              slotGraphics.forEach(sg => sg.destroy());
              wheelTexts.forEach(wt => wt.destroy());
              hitZones.forEach(hz => hz.destroy());
            }
          });
          this.tweens.push(fadeOutTween);

          const fadeInTween = scene.tweens.add({
            targets: openBg,
            alpha: 1,
            duration: 200,
            onComplete: () => {
              stateManager.showDialog("The safe is open, a Rusty Old Key is inside! It has been added to your inventory.");
            }
          });
          this.tweens.push(fadeInTween);
        }
      });

      this.container.add(hitZone);
      hitZones.push(hitZone);
      this.safeDials.push(hitZone);
      this.elements.push(hitZone);
    }
  }

  onDestroy() {
    this.tweens.forEach(tw => {
      if (tw && tw.remove) tw.remove();
    });
    this.tweens = [];
    this.elements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.elements = [];
    this.safeDials = [];
    this.scene = null;
    this.container = null;
  }
}
