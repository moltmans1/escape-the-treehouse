# Minigames Refactoring Analysis & Design Proposal

This document presents an investigation of the four minigames in **Escape the Treehouse** and proposes a modular refactoring design to move them from `src/main.js` into separate classes under `src/game/minigames/`.

---

## 🔍 Codebase Investigation & Current Logic

All minigames are currently rendered dynamically inside a custom zoom overlay manager inside `src/main.js`. 

### 1. Origami Minigame
*   **Locations:** `src/main.js` lines 671-771
*   **Assets:** `'open_origami_book'` (image), `'paper_airplane_clue'` (image), `'graphics_built_card'` (fallback texture).
*   **Logic Triggers:**
    *   `inspectOrigamiPaper()`: Draws the unfolded sheet of paper (Phaser Graphics) with creases and 6 scrambled text numbers (`'13'`, `'5'`, `'20'`, `'8'`, `'10'`, `'42'`) with specific angles and positions.
    *   `inspectOrigamiBook()`: Draws the open origami guide image. It features a transparent rectangle hotspot `foldZone` (at `605, 210, 240, 280`). If clicked while `origami_paper` is selected:
        1.  Removes `origami_paper` and `origami_book` from inventory.
        2.  Adds `paper_airplane` to inventory.
        3.  Instantly transitions to the paper airplane zoom view.
        4.  Displays dialog: *"Using the instructions in the book, you fold the paper into a Paper Airplane!"*.
    *   `inspectPaperAirplane()`: Renders the folded paper airplane illustration clue (`'paper_airplane_clue'`) as an image inside a rounded card background.

### 2. Dartboard Minigame
*   **Locations:** `src/main.js` lines 773-843
*   **Assets:** `'dartboard'` (image), `'dart_transparent'` (canvas texture).
*   **Logic Triggers:**
    *   `enterDartboardView()`: Draws a dark background panel and the `'dartboard'` image. Clicking the board calculates the angle relative to the center (`480, 220`) and matches it against standard dartboard numbers clockwise from the top: `[20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]`.
    *   **Interactive Input:** Spawns a `'dart_transparent'` image at the click coordinates. Pushes it to `this.thrownDarts` and appends the hit number to `gameState.dartboardSequence`.
    *   **Sequence Check:** If sequence length reaches 3, locks inputs. After a 500ms delay, checks if the sequence matches `[13, 20, 10]`.
        *   *If correct:* Executes success actions from `TreehouseConfig.minigames.dartboard_view.onSuccess` (sets `dartboard_solved` flag, removes `paper_airplane` from inventory, opens `safe_view`).
        *   *If incorrect:* Clears `this.thrownDarts` from container (destroys them), resets `gameState.dartboardSequence = []`, and unlocks input.

### 3. Safe Dials Minigame
*   **Locations:** `src/main.js` lines 942-1076
*   **Assets:** `'safe_bg'` (image), `'safe_open'` (image).
*   **Logic Triggers:**
    *   `enterSafeView()`: If `safe_unlocked` is set, displays `'safe_open'`. Otherwise, renders dial safe interface.
    *   **Dials Rendering:** Creates 4 slots spacing by 80px. Each slot has a casing graphic, and 3 text objects (`prevText`, `activeText`, `nextText`) representing values around the active digit (0-9).
    *   **Dial Interaction:** A transparent overlay rectangle hit zone handles clicks. Clicking increments value, updates digits, and checks combination.
    *   **Combination Check:** Combines active values into a 4-digit string. If combination matches `'1759'`:
        1.  Disables all interactive hit zones.
        2.  Sets `hasKeyInCompartment = false`, adds `'rusty_key'`.
        3.  Tweens out dial objects (alpha to 0) and tweens in `'safe_open'` background (alpha to 1).
        4.  Executes success actions from `TreehouseConfig.minigames.safe_view.onSuccess`.

### 4. Binoculars Minigame
*   **Locations:** `src/main.js` lines 853-941
*   **Assets:** `'south_window_view'` (image), `'oak_leaf'` (image), `'white_pine_needles'` (image), `'sugar_maple_leaf'` (image).
*   **Logic Triggers:**
    *   `inspectSouthWindow()`: Draws `'south_window_view'` and overlays three tree hotspots.
        *   *No Binoculars Selected:* Clicking displays descriptive text about the tree.
        *   *Binoculars Selected:* Transitions to corresponding tree branch zoom view: `'oak_leaf_zoom'`, `'white_pine_zoom'`, or `'sugar_maple_zoom'`.
    *   `inspectTreeBranch(viewName)`: Draws card background with leaf image based on selected tree. Closing goes back to the south window view.

---

## 🛠️ Refactoring & Architectural Design

To decouple these minigames from `src/main.js`, we propose placing them in a new directory: `src/game/minigames/`.

### The Base Interface Structure
Each minigame class will implement:
- `onCreate(scene, container)`: Receives the Phaser Scene and custom zoom container. It creates all graphics, images, text, and hit zones, adding them to the container.
- `onDestroy()`: Explicitly destroys all created elements, cancels tweens/delayed calls, and removes event listeners to prevent memory leaks.

```
src/game/
├── minigames/
│   ├── OrigamiMinigame.js
│   ├── DartboardMinigame.js
│   ├── SafeDialsMinigame.js
│   └── BinocularsMinigame.js
```

---

## 📦 Proposed Class Definitions

### 1. `OrigamiMinigame.js`
```javascript
export class OrigamiMinigame {
  /**
   * @param {string} subView - 'origami_paper', 'origami_book', or 'paper_airplane'
   */
  constructor(subView) {
    this.subView = subView;
    this.scene = null;
    this.container = null;
    this.elements = [];
  }

  onCreate(scene, container) {
    this.scene = scene;
    this.container = container;

    if (this.subView === 'origami_paper') {
      this.createPaperView();
    } else if (this.subView === 'origami_book') {
      this.createBookView();
    } else if (this.subView === 'paper_airplane') {
      this.createAirplaneView();
    }
  }

  createPaperView() {
    const paper = this.scene.add.graphics();
    paper.fillStyle(0xfaf6ee, 1);
    paper.fillRect(330, 70, 300, 300);
    paper.lineStyle(2, 0x8f7155, 1);
    paper.strokeRect(330, 70, 300, 300);

    paper.lineStyle(1, 0x8f7155, 0.2);
    paper.lineBetween(480, 70, 480, 370);
    paper.lineBetween(330, 220, 630, 220);

    const title = this.scene.add.text(480, 45, 'A sheet of paper', {
      fontFamily: 'Playfair Display',
      fontSize: '20px',
      fill: '#f4eade',
      fontWeight: 'bold'
    }).setOrigin(0.5);

    const nums = [
      { text: '13', x: 380, y: 130, angle: 45 },
      { text: '5', x: 390, y: 280, angle: 90 },
      { text: '20', x: 570, y: 130, angle: -60 },
      { text: '8', x: 440, y: 170, angle: 120 },
      { text: '10', x: 520, y: 310, angle: 180 },
      { text: '42', x: 580, y: 250, angle: 15 }
    ];

    const numObjects = nums.map(n => {
      return this.scene.add.text(n.x, n.y, n.text, {
        fontFamily: 'Outfit',
        fontSize: '24px',
        fill: '#5c4d3c',
        fontWeight: '600'
      }).setOrigin(0.5).setAngle(n.angle);
    });

    const views = [paper, title, ...numObjects];
    this.elements.push(...views);
    this.container.add(views);
  }

  createBookView() {
    const bookImage = this.scene.add.image(470, 210, 'open_origami_book')
      .setDisplaySize(540, 360);

    const foldZone = this.scene.add.rectangle(605, 210, 240, 280, 0xffffff, 0.0)
      .setInteractive({ useHandCursor: true });

    foldZone.on('pointerover', () => foldZone.setFillStyle(0xd4a373, 0.05));
    foldZone.on('pointerout', () => foldZone.setFillStyle(0xffffff, 0.0));
    
    foldZone.on('pointerdown', () => {
      const stateManager = this.scene.stateManager;
      if (stateManager.state.selectedItem === 'origami_paper') {
        // Execute folding sequence via actions!
        stateManager.executeActions([
          "REMOVE_INVENTORY: origami_paper",
          "REMOVE_INVENTORY: origami_book",
          "ADD_INVENTORY: paper_airplane",
          "SHOW_DIALOG: Using the instructions in the book, you fold the paper into a Paper Airplane!"
        ]);
        
        // Instantly transition to Paper Airplane Zoom View
        this.scene.inspectPaperAirplane();
      }
    });

    const views = [bookImage, foldZone];
    this.elements.push(...views);
    this.container.add(views);
  }

  createAirplaneView() {
    const card = this.scene.add.graphics();
    card.fillStyle(0xfefcf0, 1);
    card.fillRoundedRect(220, 45, 520, 330, 10);
    card.lineStyle(2, 0xd4a373, 1);
    card.strokeRoundedRect(220, 45, 520, 330, 10);

    const img = this.scene.add.image(480, 205, 'paper_airplane_clue')
      .setDisplaySize(480, 270);

    const title = this.scene.add.text(480, 65, 'Folded Paper Airplane', {
      fontFamily: 'Playfair Display',
      fontSize: '18px',
      fill: '#3d2b1f',
      fontWeight: 'bold'
    }).setOrigin(0.5);

    const views = [card, img, title];
    this.elements.push(...views);
    this.container.add(views);
  }

  onDestroy() {
    this.elements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.elements = [];
    this.scene = null;
    this.container = null;
  }
}
```

### 2. `DartboardMinigame.js`
```javascript
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
```

### 3. `SafeDialsMinigame.js`
```javascript
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

          // Mark rusty key compartment state
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
              // Execute the Success Action from configuration!
              stateManager.executeActions(minigameConfig.onSuccess);
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
```

### 4. `BinocularsMinigame.js`
```javascript
export class BinocularsMinigame {
  /**
   * @param {string} subView - 'south_window_zoom', 'oak_leaf_zoom', 'white_pine_zoom', or 'sugar_maple_zoom'
   */
  constructor(subView) {
    this.subView = subView;
    this.scene = null;
    this.container = null;
    this.elements = [];
  }

  onCreate(scene, container) {
    this.scene = scene;
    this.container = container;

    if (this.subView === 'south_window_zoom') {
      this.createSouthWindowView();
    } else {
      this.createTreeBranchView();
    }
  }

  createSouthWindowView() {
    const winPanel = this.scene.add.graphics();
    winPanel.fillStyle(0x1a202c, 1);
    winPanel.fillRect(180, 40, 600, 360);
    winPanel.lineStyle(3, 0x8f7155, 1);
    winPanel.strokeRect(180, 40, 600, 360);
    this.container.add(winPanel);
    this.elements.push(winPanel);

    const winImage = this.scene.add.image(480, 220, 'south_window_view')
      .setDisplaySize(600, 360);
    this.container.add(winImage);
    this.elements.push(winImage);

    const title = this.scene.add.text(480, 65, 'South Window View', {
      fontFamily: 'Playfair Display',
      fontSize: '20px',
      fill: '#f4eade',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    this.container.add(title);
    this.elements.push(title);

    const leftTreeHotspot = this.scene.add.rectangle(415, 200, 60, 140, 0xffffff, 0.0)
      .setInteractive({ useHandCursor: true });
    const centerTreeHotspot = this.scene.add.rectangle(502, 190, 60, 140, 0xffffff, 0.0)
      .setInteractive({ useHandCursor: true });
    const rightTreeHotspot = this.scene.add.rectangle(590, 200, 60, 140, 0xffffff, 0.0)
      .setInteractive({ useHandCursor: true });

    [leftTreeHotspot, centerTreeHotspot, rightTreeHotspot].forEach(hot => {
      hot.on('pointerover', () => {
        hot.setFillStyle(0xffffff, 0.05);
        if (this.scene.updateCanvasCursor) this.scene.updateCanvasCursor();
      });
      hot.on('pointerout', () => hot.setFillStyle(0xffffff, 0.0));
    });

    leftTreeHotspot.on('pointerdown', () => {
      const stateManager = this.scene.stateManager;
      if (stateManager.state.selectedItem === 'binoculars') {
        this.scene.inspectTreeBranch('oak_leaf_zoom');
      } else {
        stateManager.executeActions(["SHOW_DIALOG: A leafy tree standing in the middle of the canopy."]);
      }
    });

    centerTreeHotspot.on('pointerdown', () => {
      const stateManager = this.scene.stateManager;
      if (stateManager.state.selectedItem === 'binoculars') {
        this.scene.inspectTreeBranch('white_pine_zoom');
      } else {
        stateManager.executeActions(["SHOW_DIALOG: A tall green tree rustling in the wind."]);
      }
    });

    rightTreeHotspot.on('pointerdown', () => {
      const stateManager = this.scene.stateManager;
      if (stateManager.state.selectedItem === 'binoculars') {
        this.scene.inspectTreeBranch('sugar_maple_zoom');
      } else {
        stateManager.executeActions(["SHOW_DIALOG: A lush tree with dense foliage."]);
      }
    });

    const hotspots = [leftTreeHotspot, centerTreeHotspot, rightTreeHotspot];
    this.container.add(hotspots);
    this.elements.push(...hotspots);
  }

  createTreeBranchView() {
    const card = this.scene.add.graphics();
    card.fillStyle(0xfaf6ee, 1);
    card.fillRoundedRect(280, 60, 400, 300, 10);
    card.lineStyle(2, 0xd4a373, 1);
    card.strokeRoundedRect(280, 60, 400, 300, 10);
    this.container.add(card);
    this.elements.push(card);

    let key = '';
    if (this.subView === 'oak_leaf_zoom') key = 'oak_leaf';
    else if (this.subView === 'white_pine_zoom') key = 'white_pine_needles';
    else if (this.subView === 'sugar_maple_zoom') key = 'sugar_maple_leaf';

    const leafImage = this.scene.add.image(480, 210, key)
      .setDisplaySize(280, 280);
    this.container.add(leafImage);
    this.elements.push(leafImage);
  }

  onDestroy() {
    this.elements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.elements = [];
    this.scene = null;
    this.container = null;
  }
}
```

---

## 🔌 Integration Plan in `src/main.js`

To integrate this cleanly inside `GameScene` within `src/main.js`:

1.  **Imports:**
    Import the minigame classes:
    ```javascript
    import { OrigamiMinigame } from './game/minigames/OrigamiMinigame.js';
    import { DartboardMinigame } from './game/minigames/DartboardMinigame.js';
    import { SafeDialsMinigame } from './game/minigames/SafeDialsMinigame.js';
    import { BinocularsMinigame } from './game/minigames/BinocularsMinigame.js';
    ```

2.  **Scene State:**
    Add `this.activeMinigame = null` in the `create` or `constructor` of `GameScene`.

3.  **Refactoring `enterZoomView`:**
    Modify the Zoom View transitions to initialize the minigames and track them:
    ```javascript
    enterZoomView(viewName, minigameInstance, closeCallback) {
      if (this.activeMinigame) {
        this.activeMinigame.onDestroy();
        this.activeMinigame = null;
      }

      stateManager.setZoomView(viewName);
      this.leftArrow.setVisible(false);
      this.rightArrow.setVisible(false);

      this.zoomContainer.removeAll(true);
      
      const overlay = this.add.rectangle(480, 220, 960, 440, 0x000000, 0.75).setInteractive();
      this.zoomContainer.add(overlay);

      const closeBtn = this.add.text(900, 30, '✕ Close', {
        fontFamily: 'Outfit',
        fontSize: '18px',
        fill: '#f4eade',
        backgroundColor: '#9a3412',
        padding: { x: 10, y: 5 }
      })
      .setInteractive({ useHandCursor: true })
      .setDepth(10)
      .on('pointerdown', () => {
        if (closeCallback) {
          closeCallback();
        } else {
          this.exitZoomView();
        }
      });
      this.zoomContainer.add(closeBtn);

      // Create & attach the new minigame instance
      this.activeMinigame = minigameInstance;
      this.activeMinigame.onCreate(this, this.zoomContainer);

      // Fade-in animation for all items in the zoom view
      this.zoomContainer.list.forEach(item => {
        if (item) {
          const targetAlpha = item.alpha !== undefined ? item.alpha : 1;
          item.alpha = 0;
          this.tweens.add({
            targets: item,
            alpha: targetAlpha,
            duration: 150,
            ease: 'Quad.easeOut'
          });
        }
      });
    }
    ```

4.  **Refactoring `exitZoomView`:**
    Ensure proper teardown:
    ```javascript
    exitZoomView() {
      if (this.activeMinigame) {
        this.activeMinigame.onDestroy();
        this.activeMinigame = null;
      }
      stateManager.setZoomView(null);
      this.zoomContainer.removeAll(true);
      this.updateHotspots();
      this.updateCanvasCursor();
      
      this.leftArrow.setVisible(true);
      this.rightArrow.setVisible(true);
    }
    ```

5.  **Refactoring View Triggers in `GameScene`:**
    Update the zoom inspection methods to pass the new minigame instances:
    ```javascript
    inspectOrigamiPaper() {
      this.enterZoomView('origami_paper', new OrigamiMinigame('origami_paper'));
    }

    inspectOrigamiBook() {
      this.enterZoomView('origami_book', new OrigamiMinigame('origami_book'));
    }

    inspectPaperAirplane() {
      this.enterZoomView('paper_airplane', new OrigamiMinigame('paper_airplane'));
    }

    enterDartboardView() {
      this.enterZoomView('dartboard', new DartboardMinigame());
    }

    enterSafeView() {
      this.enterZoomView('safe_view', new SafeDialsMinigame());
    }

    inspectSouthWindow() {
      this.enterZoomView('south_window_zoom', new BinocularsMinigame('south_window_zoom'));
    }

    inspectTreeBranch(viewName) {
      this.enterZoomView(viewName, new BinocularsMinigame(viewName), () => this.inspectSouthWindow());
    }
    ```

### 🧠 Leak Prevention and Memory Safety Highlights
*   **Active Delayed Call Cancels:** In the `DartboardMinigame`, the 500ms delay to check sequence results (`checkTimer`) is tracked locally. If the user exits the zoom view while the timer is running, `onDestroy()` explicitly calls `checkTimer.remove()`, preventing asynchronous calls on destroyed scene objects.
*   **Tween Interruption:** Safe dial success transitions use tweens (`fadeTweens`). `onDestroy()` stops and removes any active tweens to prevent memory leaks in Phaser's tween manager.
*   **Explicit Sprite Destruction:** All generated assets are explicitly registered in `this.elements` and destroyed using Phaser's `.destroy()` method, guaranteeing GPU/CPU cleanup and event listener deregistration.
