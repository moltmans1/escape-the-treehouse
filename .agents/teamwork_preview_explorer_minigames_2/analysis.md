# Minigames Refactoring Analysis

## Executive Summary
This report analyzes the implementation details of the four minigames in the Escape the Treehouse codebase (`src/main.js` and `src/game/treehouse.config.js`). It proposes a modular, clean, and memory-safe design that extracts these minigames into separate classes under `src/game/minigames/` implementing standard lifecycle methods (`onCreate` and `onDestroy`), triggers actions via the `StateManager`, and preserves E2E test compatibility.

---

## 1. Observation

### Current Codebase Structure & Locations
The minigames and item-zoom views are currently defined as direct methods on the `GameScene` class inside `src/main.js` and referenced in the configuration file `src/game/treehouse.config.js`.

#### File Locations and Line Numbers:
1. **Origami Minigame**
   - **File:** `src/main.js`
   - **Line range:** 671–771
   - **Core methods:**
     - `inspectOrigamiPaper()`: Draws the unfolded sheet of paper graphics and six randomized clue numbers.
     - `inspectOrigamiBook()`: Renders the instructions book, sets up an interactive folding zone, and processes paper combination to obtain the paper airplane.
     - `inspectPaperAirplane()`: Draws the folded paper airplane card and clue image.
2. **Dartboard Minigame**
   - **File:** `src/main.js`
   - **Line range:** 773–842
   - **Core method:**
     - `enterDartboardView()`: Draws the panel background, interactive dartboard, calculates wedge numbers from click coordinates, manages the thrown dart images array (`this.thrownDarts`), implements sequence verification, and handles input lock timers (`this.dartboardInputLocked`).
3. **Safe Dials Minigame**
   - **File:** `src/main.js`
   - **Line range:** 942–1076
   - **Core method:**
     - `enterSafeView()`: Renders either the locked or open safe backgrounds, displays instructions text, builds four interactive thumbwheels/dials (prev, active, next value text fields + hit zones), verifies the combination (`"1759"`), and handles fade animations.
4. **Binoculars Minigame**
   - **File:** `src/main.js`
   - **Line range:** 853–940
   - **Core methods:**
     - `inspectSouthWindow()`: Renders the window frame, sky view image, and three tree canopy hotspots. It checks if the binoculars are selected and opens the corresponding branch zoom views.
     - `inspectTreeBranch(viewName)`: Draws leaf illustrations based on the selected canopy tree (`oak_leaf_zoom`, `white_pine_zoom`, `sugar_maple_zoom`).

#### Configurations in `src/game/treehouse.config.js`:
- `minigames.dartboard_view`: Target sequence `[13, 20, 10]`, onSuccess actions `["SET_FLAG: dartboard_solved", "REMOVE_INVENTORY: paper_airplane", "OPEN_ZOOM_VIEW: safe_view"]`.
- `minigames.safe_view`: Target combination `"1759"`, onSuccess actions `["SET_FLAG: safe_unlocked", "REFRESH_GRAPHICS", "SHOW_DIALOG: ..."]`.

---

## 2. Logic Chain

### Why Refactor?
- **Separation of Concerns:** `GameScene` in `src/main.js` is currently 1150 lines long, with more than half of its code dedicated to the UI drawing, hit detection, and math calculations of specific puzzles.
- **Memory Safety:** Inlining graphics creation, tweens, and event listeners directly on the scene increases the risk of memory leaks if cleanup is not done perfectly when switching or closing views.
- **Reusability & Modularity:** Defining minigames under a standard lifecycle (`onCreate(scene, container)` and `onDestroy()`) enables adding new puzzles without bloating the core scene class.

### How the Interface Works:
- **`onCreate(scene, container)`**:
  - The scene instance gives the minigame class access to the Phaser API (`scene.add`, `scene.tweens`, `scene.time`, etc.) and the state manager.
  - The container argument (representing the zoom view canvas/overlay) acts as the parent element. All created Phaser GameObjects are added to the container to ensure they are layered correctly.
- **`onDestroy()`**:
  - Automatically destroys all locally created Phaser GameObjects.
  - Stops and destroys active tweens or delayed call timers.
  - Unregisters event listeners and clears local arrays.
  - Removes dynamic properties mapped to the Scene for E2E tests, ensuring complete cleanup and avoiding memory leaks.

### E2E Test Compatibility Constraints:
The E2E tests (`tests/escape.spec.js`) utilize direct references on the `GameScene` instance:
1. `gameScene.thrownDarts` is asserted for length when analyzing inputs (Lines 368, 380, 395, 403, 408, 420).
2. `gameScene.safeDials` is expected to be an array of dial hit zones on the scene (Line 90).
3. The tree hotspots in the window view are retrieved from `zoomContainer.list` (Line 44).
4. The dartboard image is retrieved from `zoomContainer.list` (Line 57).

**Solution:** The refactored minigame classes must temporarily assign `scene.thrownDarts = this.thrownDarts` and `scene.safeDials = this.safeDials` during `onCreate`, and clean them up during `onDestroy`. Adding game objects to the passed `container` ensures they appear in `zoomContainer.list` for the E2E tests.

---

## 3. Caveats
1. **Read-only Investigation:** This is a diagnostic and design report; no actual code modifications have been written to the codebase files.
2. **Additional Minigames:** The lamp puzzle and balcony escape logic were not part of the requested four minigames and are handled separately, though they should follow the same pattern when implemented.

---

## 4. Conclusion & Proposed Class Definitions

### Class 1: `src/game/minigames/OrigamiMinigame.js`
```javascript
export class OrigamiMinigame {
  constructor(viewName) {
    this.viewName = viewName; // 'origami_paper', 'origami_book', or 'paper_airplane'
    this.elements = [];
  }

  onCreate(scene, container) {
    this.scene = scene;
    this.container = container;

    if (this.viewName === 'origami_paper') {
      this.createPaperView();
    } else if (this.viewName === 'origami_book') {
      this.createBookView();
    } else if (this.viewName === 'paper_airplane') {
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

    const numTexts = nums.map(n => {
      return this.scene.add.text(n.x, n.y, n.text, {
        fontFamily: 'Outfit',
        fontSize: '24px',
        fill: '#5c4d3c',
        fontWeight: '600'
      }).setOrigin(0.5).setAngle(n.angle);
    });

    this.container.add([paper, title, ...numTexts]);
    this.elements.push(paper, title, ...numTexts);
  }

  createBookView() {
    const bookImage = this.scene.add.image(470, 210, 'open_origami_book')
      .setDisplaySize(540, 360);
    this.container.add(bookImage);
    this.elements.push(bookImage);

    const foldZone = this.scene.add.rectangle(605, 210, 240, 280, 0xffffff, 0.0)
      .setInteractive({ useHandCursor: true });

    foldZone.on('pointerover', () => foldZone.setFillStyle(0xd4a373, 0.05));
    foldZone.on('pointerout', () => foldZone.setFillStyle(0xffffff, 0.0));
    
    foldZone.on('pointerdown', () => {
      if (this.scene.stateManager.state.selectedItem === 'origami_paper') {
        this.scene.stateManager.executeActions([
          'REMOVE_INVENTORY: origami_paper',
          'REMOVE_INVENTORY: origami_book',
          'ADD_INVENTORY: paper_airplane',
          'OPEN_ZOOM_VIEW: paper_airplane',
          'SHOW_DIALOG: Using the instructions in the book, you fold the paper into a Paper Airplane!'
        ]);
      }
    });

    this.container.add(foldZone);
    this.elements.push(foldZone);
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

    this.container.add([card, img, title]);
    this.elements.push(card, img, title);
  }

  onDestroy() {
    this.elements.forEach(el => { if (el && el.destroy) el.destroy(); });
    this.elements = [];
    this.scene = null;
    this.container = null;
  }
}
```

### Class 2: `src/game/minigames/DartboardMinigame.js`
```javascript
export class DartboardMinigame {
  constructor() {
    this.elements = [];
    this.thrownDarts = [];
    this.dartboardInputLocked = false;
  }

  onCreate(scene, container) {
    this.scene = scene;
    this.container = container;
    
    // Maintain direct reference for E2E tests
    this.scene.thrownDarts = this.thrownDarts;

    // Cache or global config lookup
    const minigameConfig = this.scene.cache.obj ? 
      this.scene.cache.obj.get('treehouseConfig').minigames.dartboard_view : 
      { target: [13, 20, 10], onSuccess: ["SET_FLAG: dartboard_solved", "REMOVE_INVENTORY: paper_airplane", "OPEN_ZOOM_VIEW: safe_view"] };

    const boardPanel = this.scene.add.graphics();
    boardPanel.fillStyle(0x1c1212, 1);
    boardPanel.fillRect(180, 20, 600, 400);
    boardPanel.lineStyle(3, 0x8f7155, 1);
    boardPanel.strokeRect(180, 20, 600, 400);
    this.container.add(boardPanel);
    this.elements.push(boardPanel);

    const dbImage = this.scene.add.image(480, 220, 'dartboard')
      .setDisplaySize(360, 360)
      .setInteractive({ useHandCursor: true });
    this.container.add(dbImage);
    this.elements.push(dbImage);

    const boardNumbers = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

    dbImage.on('pointerdown', (pointer) => {
      if (this.scene.stateManager.hasFlag('dartboard_solved')) return;
      if (this.dartboardInputLocked) return;

      const clickX = pointer.worldX;
      const clickY = pointer.worldY;

      const dart = this.scene.add.image(clickX, clickY, 'dart_transparent')
        .setOrigin(0.06, 0.5)
        .setRotation(-0.26)
        .setDisplaySize(110, 110);
      
      this.container.add(dart);
      this.elements.push(dart);
      this.thrownDarts.push(dart);

      const angleRad = Math.atan2(clickY - 220, clickX - 480);
      let angleDeg = angleRad * (180 / Math.PI);
      let rotatedDeg = angleDeg + 90;
      if (rotatedDeg < 0) rotatedDeg += 360;
      let shiftedDeg = rotatedDeg + 9;
      if (shiftedDeg >= 360) shiftedDeg -= 360;
      const wedgeIndex = Math.floor(shiftedDeg / 18);
      const num = boardNumbers[wedgeIndex];

      window.__gameState.dartboardSequence.push(num);

      if (window.__gameState.dartboardSequence.length === 3) {
        this.dartboardInputLocked = true;
        this.scene.time.delayedCall(500, () => {
          const targetSeq = minigameConfig.target;
          const isCorrect = window.__gameState.dartboardSequence.length === 3 &&
                            window.__gameState.dartboardSequence.every((val, i) => val === targetSeq[i]);
          if (isCorrect) {
            this.scene.stateManager.executeActions(minigameConfig.onSuccess);
          } else {
            this.clearDarts();
          }
        });
      }
    });
  }

  clearDarts() {
    this.thrownDarts.forEach(d => { if (d && d.destroy) d.destroy(); });
    this.thrownDarts = [];
    this.scene.thrownDarts = this.thrownDarts;
    window.__gameState.dartboardSequence = [];
    this.dartboardInputLocked = false;
  }

  onDestroy() {
    this.thrownDarts.forEach(d => { if (d && d.destroy) d.destroy(); });
    this.thrownDarts = [];
    if (this.scene) {
      this.scene.thrownDarts = [];
    }

    this.elements.forEach(el => { if (el && el.destroy) el.destroy(); });
    this.elements = [];
    this.scene = null;
    this.container = null;
  }
}
```

### Class 3: `src/game/minigames/SafeDialsMinigame.js`
```javascript
export class SafeDialsMinigame {
  constructor() {
    this.elements = [];
    this.safeDials = [];
    this.tweens = [];
  }

  onCreate(scene, container) {
    this.scene = scene;
    this.container = container;
    
    // Maintain direct reference for E2E tests
    this.scene.safeDials = this.safeDials;

    const minigameConfig = { combination: "1759", onSuccess: [
      "SET_FLAG: safe_unlocked",
      "REFRESH_GRAPHICS",
      "SHOW_DIALOG: With a heavy mechanical click, the safe swings open, revealing a Rusty Old Key inside! The Rusty Old Key has been added to your inventory."
    ]};

    const isUnlocked = this.scene.stateManager.hasFlag('safe_unlocked');

    if (isUnlocked) {
      const openBg = this.scene.add.image(480, 220, 'safe_open')
        .setDisplaySize(535, 535)
        .setDepth(2);
      this.container.add(openBg);
      this.elements.push(openBg);
      return;
    }

    const lockedBg = this.scene.add.image(480, 220, 'safe_bg')
      .setDisplaySize(960, 535)
      .setDepth(1);
    this.container.add(lockedBg);
    this.elements.push(lockedBg);

    const title = this.scene.add.text(480, 85, 'OLD DIAL SAFE', {
      fontFamily: 'Playfair Display',
      fontSize: '18px',
      fill: '#d4a373',
      fontWeight: 'bold',
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(3);
    this.container.add(title);
    this.elements.push(title);

    const subtitle = this.scene.add.text(480, 110, 'Click dials to rotate values', {
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

      const slotCasing = this.scene.add.graphics();
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

      this.container.add([prevText, activeText, nextText]);
      wheelTexts.push(prevText, activeText, nextText);
      this.elements.push(prevText, activeText, nextText);

      const hitZone = this.scene.add.rectangle(x, 220, 40, 160, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(5);
      
      hitZone.value = 0;
      hitZone.index = i;

      hitZone.on('pointerdown', () => {
        hitZone.value = (hitZone.value + 1) % 10;
        activeText.setText(hitZone.value);
        prevText.setText((hitZone.value - 1 + 10) % 10);
        nextText.setText((hitZone.value + 1) % 10);

        const combo = this.safeDials.map(d => d.value).join('');
        if (combo === minigameConfig.combination) {
          hitZones.forEach(hz => hz.disableInteractive());

          this.scene.stateManager.executeActions(minigameConfig.onSuccess);

          // State synchronization for tests
          this.scene.stateManager.state.hasKeyInCompartment = false;
          this.scene.stateManager.addItem('rusty_key');

          const openBg = this.scene.add.image(480, 220, 'safe_open')
            .setDisplaySize(535, 535)
            .setDepth(2);
          openBg.alpha = 0;
          this.container.add(openBg);
          this.elements.push(openBg);

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

      this.container.add(hitZone);
      hitZones.push(hitZone);
      this.elements.push(hitZone);
      this.safeDials.push(hitZone);
    }
  }

  onDestroy() {
    this.tweens.forEach(t => { if (t && t.remove) t.remove(); });
    this.tweens = [];
    this.elements.forEach(el => { if (el && el.destroy) el.destroy(); });
    this.elements = [];
    this.safeDials = [];
    if (this.scene) {
      this.scene.safeDials = null;
    }
    this.scene = null;
    this.container = null;
  }
}
```

### Class 4: `src/game/minigames/BinocularsMinigame.js`
```javascript
export class BinocularsMinigame {
  constructor(viewName) {
    this.viewName = viewName; // 'south_window_zoom', 'oak_leaf_zoom', 'white_pine_zoom', or 'sugar_maple_zoom'
    this.elements = [];
  }

  onCreate(scene, container) {
    this.scene = scene;
    this.container = container;

    if (this.viewName === 'south_window_zoom') {
      this.createWindowView();
    } else {
      this.createBranchView();
    }
  }

  createWindowView() {
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
      hot.on('pointerover', () => hot.setFillStyle(0xffffff, 0.05));
      hot.on('pointerout', () => hot.setFillStyle(0xffffff, 0.0));
      this.container.add(hot);
      this.elements.push(hot);
    });

    leftTreeHotspot.on('pointerdown', () => {
      if (this.scene.stateManager.state.selectedItem === 'binoculars') {
        this.scene.stateManager.executeActions(['OPEN_ZOOM_VIEW: oak_leaf_zoom']);
      } else {
        this.scene.stateManager.showDialog("A leafy tree standing in the middle of the canopy.");
      }
    });

    centerTreeHotspot.on('pointerdown', () => {
      if (this.scene.stateManager.state.selectedItem === 'binoculars') {
        this.scene.stateManager.executeActions(['OPEN_ZOOM_VIEW: white_pine_zoom']);
      } else {
        this.scene.stateManager.showDialog("A tall green tree rustling in the wind.");
      }
    });

    rightTreeHotspot.on('pointerdown', () => {
      if (this.scene.stateManager.state.selectedItem === 'binoculars') {
        this.scene.stateManager.executeActions(['OPEN_ZOOM_VIEW: sugar_maple_zoom']);
      } else {
        this.scene.stateManager.showDialog("A lush tree with dense foliage.");
      }
    });
  }

  createBranchView() {
    const card = this.scene.add.graphics();
    card.fillStyle(0xfaf6ee, 1);
    card.fillRoundedRect(280, 60, 400, 300, 10);
    card.lineStyle(2, 0xd4a373, 1);
    card.strokeRoundedRect(280, 60, 400, 300, 10);
    this.container.add(card);
    this.elements.push(card);

    let key = '';
    if (this.viewName === 'oak_leaf_zoom') key = 'oak_leaf';
    else if (this.viewName === 'white_pine_zoom') key = 'white_pine_needles';
    else if (this.viewName === 'sugar_maple_zoom') key = 'sugar_maple_leaf';

    const leafImage = this.scene.add.image(480, 210, key)
      .setDisplaySize(280, 280);
    this.container.add(leafImage);
    this.elements.push(leafImage);
  }

  onClose() {
    if (this.viewName !== 'south_window_zoom') {
      this.scene.stateManager.executeActions(['OPEN_ZOOM_VIEW: south_window_zoom']);
    } else {
      this.scene.exitZoomView();
    }
  }

  onDestroy() {
    this.elements.forEach(el => { if (el && el.destroy) el.destroy(); });
    this.elements = [];
    this.scene = null;
    this.container = null;
  }
}
```

---

## 5. Verification Method

### How to Verify the Refactored Design
1. **Source Layout Verification:** Ensure the new files are correctly situated inside `src/game/minigames/` and imported in `src/main.js`.
2. **Headless Unit Tests:**
   Run the following command to verify core engine mechanics still work correctly:
   ```bash
   npm run test:unit
   ```
3. **Integration / E2E Tests:**
   Verify full walkthrough capabilities, dialogue blocking, reset behavior, and item highlighting by running:
   ```bash
   npm run test:e2e
   ```
4. **Invalidation Conditions:**
   - E2E Test Case 2 fails: Origami folding logic is broken.
   - E2E Test Case 3 fails: Dartboard sequence math, safe combinations, or item selections are not being synchronized.
   - E2E Test Case 3b fails: Darts count check fails on `gameScene.thrownDarts`, or input locking behaves incorrectly.
