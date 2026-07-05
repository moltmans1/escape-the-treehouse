# Escape the Treehouse: Minigames Refactoring Analysis

## Executive Summary
This document analyzes the existing minigame logic in `src/main.js` and `src/game/treehouse.config.js` and provides a modular refactoring plan. The goal is to move the monolithic rendering and interaction code for the four core minigames (Origami, Dartboard, Safe dials, and Binoculars) into self-contained, class-based modules under `src/game/minigames/`.

These modules will implement a uniform lifecycle interface (`onCreate` and `onDestroy`), trigger actions via the engine's `stateManager.executeActions(actions)`, prevent memory leaks, and maintain full compatibility with the project's Playwright integration tests.

---

## 1. Existing Minigames Logic Analysis

### 1.1 Origami Minigame
* **Locations**: `src/main.js`, lines 671-771 (`inspectOrigamiPaper`, `inspectOrigamiBook`, `inspectPaperAirplane`) and `src/game/treehouse.config.js` (zoomViews configurations).
* **Sub-views**:
  1. **Origami Paper (`origami_paper`)**:
     * Draws a plain white square using `graphics()` (`330, 70`, size `300 x 300`, line style `2`).
     * Draws faint crease lines: vertical (`480, 70` to `480, 370`) and horizontal (`330, 220` to `630, 220`) with 0.2 alpha.
     * Displays title text `"A sheet of paper"` at `480, 45`.
     * Renders 6 scrambled numbers with different rotations and positions (representing coordinates/angles on folded creases: `13` at 45°, `5` at 90°, `20` at -60°, `8` at 120°, `10` at 180°, and `42` at 15°).
  2. **Origami Book (`origami_book`)**:
     * Renders `open_origami_book` image at `470, 210` with display size `540, 360`.
     * Renders a transparent, interactive rectangle overlay `foldZone` at `605, 210` (size `240 x 280`).
     * Hovering over the zone changes its transparency to `0.05` with color `0xd4a373`.
     * Clicking the folding zone checks if `stateManager.state.selectedItem === 'origami_paper'`. If so, it removes `origami_paper` and `origami_book` from inventory, adds `paper_airplane`, shows dialogue, and immediately transitions to the Paper Airplane Zoom View.
  3. **Paper Airplane (`paper_airplane`)**:
     * Draws a rounded card background and loads the illustration image `paper_airplane_clue` at `480, 205` (size `480 x 270`).
     * Displays title `"Folded Paper Airplane"` at `480, 65`.

### 1.2 Dartboard Minigame
* **Locations**: `src/main.js`, lines 773-842 (`enterDartboardView`, dart click handling, sequence checking) and `src/game/treehouse.config.js` (`minigames.dartboard_view`).
* **Logic Flow**:
  * Draws a dark rectangular panel background and loads the high-fidelity `dartboard` image (`480, 220`, size `360 x 360`) as interactive.
  * Clicking on the dartboard image calculates the polar coordinates of the click relative to center `(480, 220)`:
    * `angleRad = Math.atan2(clickY - 220, clickX - 480)`
    * Converted to degrees and rotated by +90 + 9 to align with the board's 20 wedges (each 18°).
    * `wedgeIndex = Math.floor(shiftedDeg / 18)`
    * The hit number is looked up in the clockwise sequence: `[20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]`.
  * Spawns a visual dart sprite (`dart_transparent`) at the exact click location, rotated by `-0.26` (approx. -15 degrees) with an origin offset `0.06, 0.5` representing the steel tip.
  * Appends the hit number to `gameState.dartboardSequence`.
  * If sequence length reaches 3:
    * Locks input (`dartboardInputLocked = true`).
    * Schedules a 500ms delay to evaluate sequence against config target `[13, 20, 10]`.
    * If correct, executes `TreehouseConfig.minigames.dartboard_view.onSuccess` actions (`SET_FLAG: dartboard_solved`, etc.).
    * If incorrect, destroys all spawned darts, resets sequence and unlocks input.

### 1.3 Safe Dials Minigame
* **Locations**: `src/main.js`, lines 942-1076 (`enterSafeView`, dial rendering, combination checking) and `src/game/treehouse.config.js` (`minigames.safe_view`).
* **Logic Flow**:
  * If already unlocked (`safe_unlocked`), it directly draws `safe_open` image (size `535, 535`).
  * If locked, it draws a background (`safe_bg`), title, subtitle, and creates 4 numeric dial wheels:
    * Spaced horizontally by 80px starting at X = 360, Y = 220.
    * For each wheel, draws a vertical casing (`graphics`) and 3 text objects (`Outfit` font) representing the previous digit, active digit, and next digit. Active digit is highlighted in gold (`#d4a373`) and size 32, while neighboring digits are `#c8b7a6`, size 20, and alpha 0.4.
    * Places a transparent, interactive hit zone rectangle (`40 x 160`) over each wheel.
    * Clicking a hit zone increments its digit value (modulo 10), updates all three text elements, and evaluates the current safe combination.
    * When the combination matches `"1759"`:
      * Disables hit zone interaction.
      * Sets the flag `safe_unlocked` and adds `rusty_key` to inventory.
      * Spawns `safe_open` image with alpha 0.
      * Runs concurrent tweens to fade out the locked elements (locked background, casings, text) and fade in the open safe compartment. Upon completion, shows dialogue "The safe is open, a Rusty Old Key is inside!...".

### 1.4 Binoculars Minigame
* **Locations**: `src/main.js`, lines 853-940 (`inspectSouthWindow`, `inspectTreeBranch`).
* **Logic Flow**:
  * **South Window View (`south_window_zoom`)**:
    * Draws background panel, loads `south_window_view` image (size `600 x 360`), and displays title.
    * Sets up three tree hotspots (`leftTreeHotspot` at `415, 200`, `centerTreeHotspot` at `502, 190`, `rightTreeHotspot` at `590, 200`), each a transparent rectangle (size `60 x 140`).
    * Hovering updates cursor and sets hotspot background fill to `0xffffff, 0.05`.
    * Clicking a tree:
      * If selected item in inventory is `'binoculars'`: transitions to the respective tree branch zoom view (`oak_leaf_zoom`, `white_pine_zoom`, or `sugar_maple_zoom`).
      * Else: shows descriptive dialogue about the tree.
  * **Tree Branch Viewing (`inspectTreeBranch`)**:
    * Draws a card panel and displays the leaf/canopy illustration: `oak_leaf`, `white_pine_needles`, or `sugar_maple_leaf` (size `280 x 280`).
    * Exiting a tree branch view navigates back to `south_window_zoom` instead of closing the zoom view altogether.

---

## 2. Proposed Refactoring Design

### 2.1 File Directory Layout
We will create a dedicated `minigames/` subdirectory within the `src/game/` folder:
```text
src/
└── game/
    ├── minigames/
    │   ├── Minigame.js           # Abstract Base Class
    │   ├── OrigamiMinigame.js    # Origami view states & folding logic
    │   ├── DartboardMinigame.js  # Dart sequence check & rendering
    │   ├── SafeDialsMinigame.js  # 4-dial safe rendering & check
    │   └── BinocularsMinigame.js # South Window & tree canopy inspection
    └── treehouse.config.js
```

### 2.2 Base Class: `Minigame.js`
All minigame classes will extend this base class to ensure strict adherence to the uniform lifecycle interface.
```javascript
/**
 * Base Class for all Minigames.
 * Defines the standard lifecycle interface and provides basic initialization.
 */
export class Minigame {
  constructor() {
    this.scene = null;
    this.container = null;
    this.elements = []; // Tracks Phaser game objects for clean-up
  }

  /**
   * Called when the minigame is initialized inside a zoom view.
   * @param {Phaser.Scene} scene - The main GameScene.
   * @param {Object} container - The wrapper container for zoom views.
   */
  onCreate(scene, container) {
    this.scene = scene;
    this.container = container;
  }

  /**
   * Registers a game object to be tracked and destroyed on clean-up.
   * @param {Phaser.GameObjects.GameObject} obj
   * @returns {Phaser.GameObjects.GameObject}
   */
  track(obj) {
    if (obj) {
      this.elements.push(obj);
      this.container.add(obj);
    }
    return obj;
  }

  /**
   * Cleans up all elements, listeners, and custom bindings.
   * Must be overridden in subclasses.
   */
  onDestroy() {
    this.elements.forEach(el => {
      if (el && el.destroy) {
        el.destroy();
      }
    });
    this.elements = [];
  }
}
```

### 2.3 `OrigamiMinigame.js`
Handles the rendering and state logic for the paper sheet, book, and airplane.
```javascript
import { Minigame } from './Minigame.js';

export class OrigamiMinigame extends Minigame {
  onCreate(scene, container) {
    super.onCreate(scene, container);
    const viewName = scene.stateManager.state.zoomView;

    if (viewName === 'origami_paper') {
      this.renderPaper();
    } else if (viewName === 'origami_book') {
      this.renderBook();
    } else if (viewName === 'paper_airplane') {
      this.renderAirplane();
    }
  }

  renderPaper() {
    const paper = this.scene.add.graphics();
    paper.fillStyle(0xfaf6ee, 1);
    paper.fillRect(330, 70, 300, 300);
    paper.lineStyle(2, 0x8f7155, 1);
    paper.strokeRect(330, 70, 300, 300);

    paper.lineStyle(1, 0x8f7155, 0.2);
    paper.lineBetween(480, 70, 480, 370);
    paper.lineBetween(330, 220, 630, 220);
    this.track(paper);

    const title = this.scene.add.text(480, 45, 'A sheet of paper', {
      fontFamily: 'Playfair Display',
      fontSize: '20px',
      fill: '#f4eade',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    this.track(title);

    const nums = [
      { text: '13', x: 380, y: 130, angle: 45 },
      { text: '5', x: 390, y: 280, angle: 90 },
      { text: '20', x: 570, y: 130, angle: -60 },
      { text: '8', x: 440, y: 170, angle: 120 },
      { text: '10', x: 520, y: 310, angle: 180 },
      { text: '42', x: 580, y: 250, angle: 15 }
    ];

    nums.forEach(n => {
      const numTxt = this.scene.add.text(n.x, n.y, n.text, {
        fontFamily: 'Outfit',
        fontSize: '24px',
        fill: '#5c4d3c',
        fontWeight: '600'
      }).setOrigin(0.5).setAngle(n.angle);
      this.track(numTxt);
    });
  }

  renderBook() {
    const bookImage = this.scene.add.image(470, 210, 'open_origami_book')
      .setDisplaySize(540, 360);
    this.track(bookImage);

    const foldZone = this.scene.add.rectangle(605, 210, 240, 280, 0xffffff, 0.0)
      .setInteractive({ useHandCursor: true });
    this.track(foldZone);

    foldZone.on('pointerover', () => foldZone.setFillStyle(0xd4a373, 0.05));
    foldZone.on('pointerout', () => foldZone.setFillStyle(0xffffff, 0.0));
    
    foldZone.on('pointerdown', () => {
      if (this.scene.stateManager.state.selectedItem === 'origami_paper') {
        this.scene.stateManager.removeItem('origami_paper');
        this.scene.stateManager.removeItem('origami_book');
        this.scene.stateManager.addItem('paper_airplane');
        
        // Transition immediately to the Paper Airplane Zoom View
        this.scene.enterZoomView('paper_airplane');
        this.scene.stateManager.showDialog("Using the instructions in the book, you fold the paper into a Paper Airplane!");
      }
    });
  }

  renderAirplane() {
    const card = this.scene.add.graphics();
    card.fillStyle(0xfefcf0, 1);
    card.fillRoundedRect(220, 45, 520, 330, 10);
    card.lineStyle(2, 0xd4a373, 1);
    card.strokeRoundedRect(220, 45, 520, 330, 10);
    this.track(card);

    const img = this.scene.add.image(480, 205, 'paper_airplane_clue')
      .setDisplaySize(480, 270);
    this.track(img);

    const title = this.scene.add.text(480, 65, 'Folded Paper Airplane', {
      fontFamily: 'Playfair Display',
      fontSize: '18px',
      fill: '#3d2b1f',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    this.track(title);
  }
}
```

### 2.4 `DartboardMinigame.js`
Handles the interactive sequence matching dart throwing.
```javascript
import { Minigame } from './Minigame.js';
import { TreehouseConfig } from '../treehouse.config.js';

export class DartboardMinigame extends Minigame {
  constructor() {
    super();
    this.thrownDarts = [];
    this.inputLocked = false;
    this.resetTimer = null;
  }

  onCreate(scene, container) {
    super.onCreate(scene, container);

    // Keep scene-level references synchronized for E2E tests
    scene.thrownDarts = this.thrownDarts;
    scene.dartboardInputLocked = this.inputLocked;

    const boardPanel = this.scene.add.graphics();
    boardPanel.fillStyle(0x1c1212, 1);
    boardPanel.fillRect(180, 20, 600, 400);
    boardPanel.lineStyle(3, 0x8f7155, 1);
    boardPanel.strokeRect(180, 20, 600, 400);
    this.track(boardPanel);

    const dbImage = this.scene.add.image(480, 220, 'dartboard')
      .setDisplaySize(360, 360)
      .setInteractive({ useHandCursor: true });
    this.track(dbImage);

    const boardNumbers = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

    dbImage.on('pointerdown', (pointer) => {
      if (this.scene.stateManager.hasFlag('dartboard_solved')) return;
      if (this.inputLocked) return;

      const clickX = pointer.worldX;
      const clickY = pointer.worldY;

      // Spawn a dart
      const dart = this.scene.add.image(clickX, clickY, 'dart_transparent')
        .setOrigin(0.06, 0.5)
        .setRotation(-0.26)
        .setDisplaySize(110, 110);
      
      this.container.add(dart);
      this.thrownDarts.push(dart);

      // Angle calculation relative to center
      const angleRad = Math.atan2(clickY - 220, clickX - 480);
      let angleDeg = angleRad * (180 / Math.PI);
      let rotatedDeg = angleDeg + 90;
      if (rotatedDeg < 0) rotatedDeg += 360;
      let shiftedDeg = rotatedDeg + 9;
      if (shiftedDeg >= 360) shiftedDeg -= 360;
      const wedgeIndex = Math.floor(shiftedDeg / 18);
      const num = boardNumbers[wedgeIndex];

      // Update global sequence
      window.__gameState.dartboardSequence.push(num);

      const minigameConfig = TreehouseConfig.minigames.dartboard_view;
      const seqLen = window.__gameState.dartboardSequence.length;

      if (seqLen === 3) {
        this.inputLocked = true;
        this.scene.dartboardInputLocked = true;

        this.resetTimer = this.scene.time.delayedCall(500, () => {
          const targetSeq = minigameConfig.target;
          const isCorrect = window.__gameState.dartboardSequence.length === 3 &&
                            window.__gameState.dartboardSequence.every((val, i) => val === targetSeq[i]);
          
          if (isCorrect) {
            this.scene.stateManager.executeActions(minigameConfig.onSuccess);
          } else {
            // Reset on mistake
            this.thrownDarts.forEach(d => { if (d && d.destroy) d.destroy(); });
            this.thrownDarts = [];
            this.scene.thrownDarts = [];
            window.__gameState.dartboardSequence = [];
            this.inputLocked = false;
            this.scene.dartboardInputLocked = false;
          }
        });
      }
    });
  }

  onDestroy() {
    // Clear the active reset timer to prevent fires after destroy
    if (this.resetTimer) {
      this.resetTimer.remove();
      this.resetTimer = null;
    }

    // Destroy all thrown darts explicitly
    this.thrownDarts.forEach(d => { if (d && d.destroy) d.destroy(); });
    this.thrownDarts = [];
    
    // Clear GameScene references
    this.scene.thrownDarts = [];
    this.scene.dartboardInputLocked = false;
    window.__gameState.dartboardSequence = [];

    super.onDestroy();
  }
}
```

### 2.5 `SafeDialsMinigame.js`
Handles the dial rotation and combinations.
```javascript
import { Minigame } from './Minigame.js';
import { TreehouseConfig } from '../treehouse.config.js';

export class SafeDialsMinigame extends Minigame {
  constructor() {
    super();
    this.safeDials = [];
    this.tweens = [];
  }

  onCreate(scene, container) {
    super.onCreate(scene, container);
    
    // Synchronize for E2E tests
    scene.safeDials = this.safeDials;

    const isUnlocked = this.scene.stateManager.hasFlag('safe_unlocked');

    if (isUnlocked) {
      const openBg = this.scene.add.image(480, 220, 'safe_open')
        .setDisplaySize(535, 535)
        .setDepth(2);
      this.track(openBg);
      return;
    }

    const lockedBg = this.scene.add.image(480, 220, 'safe_bg')
      .setDisplaySize(960, 535)
      .setDepth(1);
    this.track(lockedBg);

    const title = this.scene.add.text(480, 85, 'OLD DIAL SAFE', {
      fontFamily: 'Playfair Display',
      fontSize: '18px',
      fill: '#d4a373',
      fontWeight: 'bold',
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(3);
    this.track(title);

    const subtitle = this.scene.add.text(480, 110, 'Click dials to rotate values', {
      fontFamily: 'Outfit',
      fontSize: '11px',
      fill: '#8f7155'
    }).setOrigin(0.5).setDepth(3);
    this.track(subtitle);

    const startX = 360;
    const spacing = 80;
    const slotGraphics = [];
    const wheelTexts = [];
    const hitZones = [];

    for (let i = 0; i < 4; i++) {
      const x = startX + i * spacing;

      const slotCasing = this.scene.add.graphics();
      slotCasing.fillStyle(0x1a1512, 1);
      slotCasing.fillRoundedRect(x - 20, 140, 40, 160, 5);
      slotCasing.lineStyle(2, 0x8f7155, 0.5);
      slotCasing.strokeRoundedRect(x - 20, 140, 40, 160, 5);
      slotCasing.setDepth(3);
      this.track(slotCasing);
      slotGraphics.push(slotCasing);

      const digitStyle = {
        fontFamily: 'Outfit',
        fontWeight: 'bold'
      };

      const prevText = this.scene.add.text(x, 175, '9', { ...digitStyle, fontSize: '20px', fill: '#c8b7a6' })
        .setOrigin(0.5)
        .setAlpha(0.4)
        .setDepth(4);
      
      const activeText = this.scene.add.text(x, 220, '0', { ...digitStyle, fontSize: '32px', fill: '#d4a373' })
        .setOrigin(0.5)
        .setDepth(4);
      
      const nextText = this.scene.add.text(x, 265, '1', { ...digitStyle, fontSize: '20px', fill: '#c8b7a6' })
        .setOrigin(0.5)
        .setAlpha(0.4)
        .setDepth(4);

      this.track(prevText);
      this.track(activeText);
      this.track(nextText);
      wheelTexts.push(prevText, activeText, nextText);

      const hitZone = this.scene.add.rectangle(x, 220, 40, 160, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(5);
      this.track(hitZone);
      
      hitZone.value = 0;
      hitZone.index = i;

      hitZone.on('pointerdown', () => {
        hitZone.value = (hitZone.value + 1) % 10;
        activeText.setText(hitZone.value);
        prevText.setText((hitZone.value - 1 + 10) % 10);
        nextText.setText((hitZone.value + 1) % 10);
        this.scene.updateCanvasCursor();

        const combo = this.safeDials.map(d => d.value).join('');
        const minigameConfig = TreehouseConfig.minigames.safe_view;
        
        if (combo === minigameConfig.combination) {
          hitZones.forEach(hz => hz.disableInteractive());

          this.scene.stateManager.setFlag('safe_unlocked');
          this.scene.stateManager.state.hasKeyInCompartment = false;
          this.scene.stateManager.addItem('rusty_key');

          const openBg = this.scene.add.image(480, 220, 'safe_open')
            .setDisplaySize(535, 535)
            .setDepth(2);
          openBg.alpha = 0;
          this.track(openBg);

          // Add and track tweens
          const fadeOutTween = this.scene.tweens.add({
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

          const fadeInTween = this.scene.tweens.add({
            targets: openBg,
            alpha: 1,
            duration: 200,
            onComplete: () => {
              this.scene.stateManager.showDialog("The safe is open, a Rusty Old Key is inside! It has been added to your inventory.");
            }
          });
          this.tweens.push(fadeInTween);
        }
      });

      hitZones.push(hitZone);
      this.safeDials.push(hitZone);
    }
  }

  onDestroy() {
    // Stop all active tweens to prevent memory leaks or callbacks firing post-destruction
    this.tweens.forEach(tween => {
      if (tween && tween.isPlaying()) {
        tween.stop();
      }
    });
    this.tweens = [];
    
    // Clear scene reference
    this.scene.safeDials = [];

    super.onDestroy();
  }
}
```

### 2.6 `BinocularsMinigame.js`
Handles the canopy inspection views and branching navigation.
```javascript
import { Minigame } from './Minigame.js';

export class BinocularsMinigame extends Minigame {
  onCreate(scene, container) {
    super.onCreate(scene, container);
    const viewName = scene.stateManager.state.zoomView;

    if (viewName === 'south_window_zoom') {
      this.renderWindow();
    } else {
      this.renderBranch(viewName);
    }
  }

  renderWindow() {
    const winPanel = this.scene.add.graphics();
    winPanel.fillStyle(0x1a202c, 1);
    winPanel.fillRect(180, 40, 600, 360);
    winPanel.lineStyle(3, 0x8f7155, 1);
    winPanel.strokeRect(180, 40, 600, 360);
    this.track(winPanel);

    const winImage = this.scene.add.image(480, 220, 'south_window_view')
      .setDisplaySize(600, 360);
    this.track(winImage);

    const title = this.scene.add.text(480, 65, 'South Window View', {
      fontFamily: 'Playfair Display',
      fontSize: '20px',
      fill: '#f4eade',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    this.track(title);

    const leftTreeHotspot = this.scene.add.rectangle(415, 200, 60, 140, 0xffffff, 0.0)
      .setInteractive({ useHandCursor: true });
    const centerTreeHotspot = this.scene.add.rectangle(502, 190, 60, 140, 0xffffff, 0.0)
      .setInteractive({ useHandCursor: true });
    const rightTreeHotspot = this.scene.add.rectangle(590, 200, 60, 140, 0xffffff, 0.0)
      .setInteractive({ useHandCursor: true });

    [leftTreeHotspot, centerTreeHotspot, rightTreeHotspot].forEach(hot => {
      this.track(hot);
      hot.on('pointerover', () => {
        hot.setFillStyle(0xffffff, 0.05);
        this.scene.updateCanvasCursor();
      });
      hot.on('pointerout', () => hot.setFillStyle(0xffffff, 0.0));
    });

    leftTreeHotspot.on('pointerdown', () => {
      if (this.scene.stateManager.state.selectedItem === 'binoculars') {
        this.scene.enterZoomView('oak_leaf_zoom');
      } else {
        this.scene.stateManager.showDialog("A leafy tree standing in the middle of the canopy.");
      }
    });

    centerTreeHotspot.on('pointerdown', () => {
      if (this.scene.stateManager.state.selectedItem === 'binoculars') {
        this.scene.enterZoomView('white_pine_zoom');
      } else {
        this.scene.stateManager.showDialog("A tall green tree rustling in the wind.");
      }
    });

    rightTreeHotspot.on('pointerdown', () => {
      if (this.scene.stateManager.state.selectedItem === 'binoculars') {
        this.scene.enterZoomView('sugar_maple_zoom');
      } else {
        this.scene.stateManager.showDialog("A lush tree with dense foliage.");
      }
    });
  }

  renderBranch(viewName) {
    const card = this.scene.add.graphics();
    card.fillStyle(0xfaf6ee, 1);
    card.fillRoundedRect(280, 60, 400, 300, 10);
    card.lineStyle(2, 0xd4a373, 1);
    card.strokeRoundedRect(280, 60, 400, 300, 10);
    this.track(card);

    let key = '';
    if (viewName === 'oak_leaf_zoom') key = 'oak_leaf';
    else if (viewName === 'white_pine_zoom') key = 'white_pine_needles';
    else if (viewName === 'sugar_maple_zoom') key = 'sugar_maple_leaf';

    const leafImage = this.scene.add.image(480, 210, key)
      .setDisplaySize(280, 280);
    this.track(leafImage);
  }

  /**
   * Overrides close behavior:
   * Exiting a branch zoom view goes back to South Window view instead of closing.
   */
  getCloseCallback(scene) {
    const viewName = scene.stateManager.state.zoomView;
    if (viewName !== 'south_window_zoom') {
      return () => scene.enterZoomView('south_window_zoom');
    }
    return null; // Default close
  }
}
```

---

## 3. GameScene Integration Design

The monolithic `inspect...` functions in `GameScene` in `src/main.js` can be refactored by mapping active zoom view states directly to their modular minigame classes.

### 3.1 Mapping Registry
In `src/main.js`, import and configure the minigames:
```javascript
import { OrigamiMinigame } from './game/minigames/OrigamiMinigame.js';
import { DartboardMinigame } from './game/minigames/DartboardMinigame.js';
import { SafeDialsMinigame } from './game/minigames/SafeDialsMinigame.js';
import { BinocularsMinigame } from './game/minigames/BinocularsMinigame.js';

const MINIGAME_CLASSES = {
  origami_paper: OrigamiMinigame,
  origami_book: OrigamiMinigame,
  paper_airplane: OrigamiMinigame,
  dartboard: DartboardMinigame,
  safe_view: SafeDialsMinigame,
  south_window_zoom: BinocularsMinigame,
  oak_leaf_zoom: BinocularsMinigame,
  white_pine_zoom: BinocularsMinigame,
  sugar_maple_zoom: BinocularsMinigame
};
```

### 3.2 Refactored `enterZoomView` and `exitZoomView` in `GameScene`
```javascript
  enterZoomView(viewName, drawCallback, closeCallback) {
    stateManager.setZoomView(viewName);
    this.leftArrow.setVisible(false);
    this.rightArrow.setVisible(false);

    // 1. Destroy and clear any previously active minigame to prevent memory leaks
    if (this.activeMinigame) {
      this.activeMinigame.onDestroy();
      this.activeMinigame = null;
    }

    this.zoomContainer.removeAll(true);
    this.thrownDarts = [];
    this.dartboardInputLocked = false;
    
    const overlay = this.add.rectangle(480, 220, 960, 440, 0x000000, 0.75).setInteractive();
    this.zoomContainer.add(overlay);

    // 2. Resolve if this zoom view matches a modular minigame
    const MinigameClass = MINIGAME_CLASSES[viewName];
    let customCloseCallback = closeCallback;

    if (MinigameClass) {
      const minigameInstance = new MinigameClass();
      this.activeMinigame = minigameInstance;
      
      // Override drawCallback to initialize the minigame
      drawCallback = () => {
        minigameInstance.onCreate(this, this.zoomContainer);
      };

      // Retrieve dynamic close behavior (e.g. tree branch returning to south window)
      if (minigameInstance.getCloseCallback) {
        customCloseCallback = minigameInstance.getCloseCallback(this) || closeCallback;
      }
    } else {
      // 3. Fallback/Default zoom view (static asset configured in TreehouseConfig)
      const zoomConfig = TreehouseConfig.zoomViews[viewName];
      if (zoomConfig && zoomConfig.asset) {
        drawCallback = () => {
          const fallbackImage = this.add.image(470, 210, zoomConfig.asset)
            .setDisplaySize(540, 360);
          this.zoomContainer.add(fallbackImage);
        };
      }
    }

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
      if (customCloseCallback) {
        customCloseCallback();
      } else {
        this.exitZoomView();
      }
    });
    
    this.zoomContainer.add(closeBtn);

    if (drawCallback) {
      drawCallback();
    }

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

  exitZoomView() {
    stateManager.setZoomView(null);
    
    // Clean up active minigame
    if (this.activeMinigame) {
      this.activeMinigame.onDestroy();
      this.activeMinigame = null;
    }

    this.zoomContainer.removeAll(true);
    this.updateHotspots();
    this.updateCanvasCursor();
    
    this.leftArrow.setVisible(true);
    this.rightArrow.setVisible(true);

    this.thrownDarts = [];
    this.dartboardInputLocked = false;
    gameState.dartboardSequence = [];
  }
```

---

## 4. Key Engineering Safeguards

### 4.1 Memory Leak & Crash Prevention
* **Pending Tweens & Timers**: If a zoom view is closed (via the Close button or state reset) while a delay timer or fade animation is still running, Phaser callback contexts could reference destroyed game objects and trigger runtime crashes.
  * *Fix*: All class instances maintain arrays/properties of their running tweens and Phaser timers (e.g. `this.resetTimer` in `DartboardMinigame` and `this.tweens` in `SafeDialsMinigame`) and explicitly cancel/stop them inside their `onDestroy()` hook.
* **Game Object Tracking**: The base `Minigame` class defines a `track()` helper that registers created visual nodes (`Image`, `Text`, `Rectangle`, `Graphics`) in `this.elements` and pushes them directly into the Phaser container, ensuring they are systematically destroyed upon calling `onDestroy()`.

### 4.2 E2E & Playwright Test Compatibility
The project's unit and integration tests (`tests/escape.spec.js`) interact directly with internal Phaser Scene properties via browser evaluates. The following variables must be preserved at the `GameScene` level to prevent test breakages:
1. **`gameScene.safeDials`**: Used by integration tests to locate and trigger click events on specific dials during the Safe puzzle resolution.
   * *Resolution*: Set `scene.safeDials` in `SafeDialsMinigame.onCreate` to reference the minigame's local dials array, and reset it to `[]` in `onDestroy`.
2. **`gameScene.thrownDarts`**: Evaluated to track the number of active darts thrown on the dartboard during sequential locks and resets.
   * *Resolution*: Set `scene.thrownDarts` in `DartboardMinigame.onCreate` to reference the minigame's darts array, and clean up on `onDestroy`.
3. **`gameScene.dartboardInputLocked`**: Checks input gating on invalid dart sequences.
   * *Resolution*: Sync `this.inputLocked` with `scene.dartboardInputLocked`.
4. **`window.__gameState.dartboardSequence`**: Evaluated globally to assess sequence progression.
   * *Resolution*: Update the sequence directly against the `window.__gameState` interface wrapper.
