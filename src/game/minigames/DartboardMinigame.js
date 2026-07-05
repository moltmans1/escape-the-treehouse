export class DartboardMinigame {
  constructor() {
    this.scene = null;
    this.container = null;
    this.elements = [];
    this.thrownDarts = [];
    this.inputLocked = false;
    this.checkTimer = null;
  }

  onCreate(scene, container) {
    this.scene = scene;
    this.container = container;
    this.thrownDarts = [];
    this.inputLocked = false;

    // Reset sequence on enter
    scene.gameState.dartboardSequence = [];

    const boardPanel = scene.add.graphics();
    boardPanel.fillStyle(0x1c1212, 1);
    boardPanel.fillRect(180, 20, 600, 400);
    boardPanel.lineStyle(3, 0x8f7155, 1);
    boardPanel.strokeRect(180, 20, 600, 400);
    this.container.add(boardPanel);
    this.elements.push(boardPanel);

    const dbImage = scene.add.image(480, 220, 'dartboard')
      .setDisplaySize(360, 360)
      .setInteractive({ useHandCursor: true });
    this.container.add(dbImage);
    this.elements.push(dbImage);

    const boardNumbers = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

    dbImage.on('pointerdown', (pointer) => {
      const stateManager = this.scene.stateManager;
      if (stateManager.hasFlag('dartboard_solved')) return;
      if (this.inputLocked) return;

      const clickX = pointer.worldX;
      const clickY = pointer.worldY;

      // Spawn transparent dart
      const dart = this.scene.add.image(clickX, clickY, 'dart_transparent')
        .setOrigin(0.06, 0.5)
        .setRotation(-0.26)
        .setDisplaySize(110, 110);
      this.container.add(dart);
      this.thrownDarts.push(dart);
      this.elements.push(dart);

      // Angle to wedge calculation
      const angleRad = Math.atan2(clickY - 220, clickX - 480);
      let angleDeg = angleRad * (180 / Math.PI);
      let rotatedDeg = angleDeg + 90;
      if (rotatedDeg < 0) rotatedDeg += 360;
      let shiftedDeg = rotatedDeg + 9;
      if (shiftedDeg >= 360) shiftedDeg -= 360;
      const wedgeIndex = Math.floor(shiftedDeg / 18);
      const num = boardNumbers[wedgeIndex];

      scene.gameState.dartboardSequence.push(num);

      const minigameConfig = scene.TreehouseConfig.minigames.dartboard_view;
      const seqLen = scene.gameState.dartboardSequence.length;

      if (seqLen === 3) {
        this.inputLocked = true;
        this.checkTimer = this.scene.time.delayedCall(500, () => {
          const targetSeq = minigameConfig.target;
          const isCorrect = scene.gameState.dartboardSequence.length === 3 &&
                            scene.gameState.dartboardSequence.every((val, i) => val === targetSeq[i]);
          if (isCorrect) {
            stateManager.executeActions(minigameConfig.onSuccess);
          } else {
            // Reset thrown darts on mismatch
            this.thrownDarts.forEach(d => { if (d && d.destroy) d.destroy(); });
            this.thrownDarts = [];
            scene.gameState.dartboardSequence = [];
            this.inputLocked = false;
          }
        });
      }
    });
  }

  onDestroy() {
    // Prevent memory leaks / running timers
    if (this.checkTimer) {
      this.checkTimer.remove();
      this.checkTimer = null;
    }
    this.elements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.elements = [];
    this.thrownDarts = [];
    this.scene = null;
    this.container = null;
  }
}
