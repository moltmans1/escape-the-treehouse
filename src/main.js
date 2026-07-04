import Phaser from 'phaser';
import { StateManager } from './engine/StateManager.js';
import { Interpreter } from './engine/Interpreter.js';
import { TreehouseConfig } from './game/treehouse.config.js';

// Instantiate core engine
const stateManager = new StateManager();
const interpreter = new Interpreter(stateManager);

// Global Game State Proxy/Wrapper for compatibility
const gameState = {
  get inventory() { return stateManager.state.inventory; },
  set inventory(v) { stateManager.state.inventory = v; },
  
  get selectedItem() { return stateManager.state.selectedItem; },
  set selectedItem(v) { stateManager.state.selectedItem = v; },
  
  get solvedPuzzles() { return stateManager.state.solvedPuzzles; },
  
  get currentView() { return stateManager.state.currentView; },
  set currentView(v) { stateManager.state.currentView = v; },
  
  get zoomView() { return stateManager.state.zoomView; },
  set zoomView(v) { stateManager.state.zoomView = v; },
  
  get dialogText() { return stateManager.state.dialogText; },
  set dialogText(v) { stateManager.state.dialogText = v; },
  
  get dialogActive() { return stateManager.state.dialogActive; },
  set dialogActive(v) { stateManager.state.dialogActive = v; },
  
  get hasKeyInCompartment() { return stateManager.state.hasKeyInCompartment; },
  set hasKeyInCompartment(v) { stateManager.state.hasKeyInCompartment = v; },

  dartboardSequence: []
};

// --- BOOT SCENE ---
class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }
  create() {
    this.scene.start('PreloadScene');
  }
}

// --- PRELOAD SCENE ---
class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const loadingText = this.add.text(width / 2, height / 2 - 40, 'Entering the Treehouse...', {
      fontFamily: 'Outfit',
      fontSize: '24px',
      fill: '#d4a373'
    }).setOrigin(0.5);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1c1212, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 10, 320, 20);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xd4a373, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 5, 300 * value, 10);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load background illustrations
    this.load.image('bg_north', 'assets/bg_north.jpg');
    this.load.image('bg_east', 'assets/bg_east.jpg');
    this.load.image('bg_south', 'assets/bg_south.jpg');
    this.load.image('paper_airplane_clue', 'assets/paper_airplane.jpg');
    this.load.image('dartboard', 'assets/dartboard.jpg');
    this.load.image('open_book', 'assets/open_book.jpg');
    this.load.image('oak_leaf', 'assets/oak_leaf.jpg');
    this.load.image('white_pine_needles', 'assets/white_pine_needles.jpg');
    this.load.image('sugar_maple_leaf', 'assets/sugar_maple_leaf.jpg');
    this.load.image('binoculars', 'assets/binoculars.png');
    this.load.image('open_origami_book', 'assets/open_origami_book.jpg');
    this.load.image('south_window_view', 'assets/south_window_view.jpg');
    this.load.image('safe_bg', 'assets/safe.png');
    this.load.image('safe_open', 'assets/safe_open.jpg');
    
    // Load navigation arrow
    this.createArrowTexture();
  }

  create() {
    this.scene.start('MainMenuScene');
  }

  createArrowTexture() {
    const arrowCanvas = this.textures.createCanvas('arrow', 40, 60);
    const actx = arrowCanvas.context;
    actx.fillStyle = '#d4a373';
    actx.beginPath();
    actx.moveTo(10, 10);
    actx.lineTo(30, 30);
    actx.lineTo(10, 50);
    actx.closePath();
    actx.fill();
    arrowCanvas.refresh();
  }
}

// --- MAIN MENU SCENE ---
class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.graphics()
      .fillGradientStyle(0x12100e, 0x12100e, 0x241d18, 0x241d18, 1)
      .fillRect(0, 0, width, height);

    this.add.text(width / 2, height / 2 - 80, 'ESCAPE THE TREEHOUSE', {
      fontFamily: 'Playfair Display',
      fontSize: '46px',
      fontWeight: 'bold',
      fill: '#d4a373',
      shadow: { blur: 10, color: '#000', fill: true }
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 20, 'A cozy 2D point-and-click escape room adventure', {
      fontFamily: 'Outfit',
      fontSize: '18px',
      fill: '#c8b7a6'
    }).setOrigin(0.5);

    const startButton = this.add.text(width / 2, height / 2 + 60, 'Start Adventure', {
      fontFamily: 'Outfit',
      fontSize: '22px',
      fill: '#f4eade',
      backgroundColor: '#3d2b1f',
      padding: { x: 25, y: 12 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => {
      startButton.setStyle({ fill: '#d4a373', backgroundColor: '#4e3829' });
    });
    startButton.on('pointerout', () => {
      startButton.setStyle({ fill: '#f4eade', backgroundColor: '#3d2b1f' });
    });
    startButton.on('pointerdown', () => {
      window.__mainMenuReady = false;
      window.__gameReady = false;
      stateManager.reset();
      gameState.dartboardSequence = [];
      this.scene.start('GameScene');
    });

    window.__mainMenuReady = true;
  }
}

// --- GAME SCENE ---
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {


    // Set the default cursor state initially
    this.input.setDefaultCursor('default');

    // Main room background
    this.bg = this.add.sprite(0, 0, `bg_${gameState.currentView}`).setOrigin(0, 0);
    this.bg.setDisplaySize(960, 440);

    // Dynamic overlay for open compartment (drawn on top of background)
    this.compartmentGraphic = this.add.graphics();

    // UI setup
    this.createNavigation();
    this.createInventoryBar();
    this.createDialogBox();

    // Group for active hotspots
    this.hotspots = this.add.group();
    
    // Custom container wrapper to bypass Phaser 3 container input scaling bug on Scale.FIT
    this.zoomContainer = {
      list: [],
      add: (items) => {
        if (Array.isArray(items)) {
          items.forEach(item => {
            if (item) this.zoomContainer.list.push(item);
          });
        } else {
          if (items) this.zoomContainer.list.push(items);
        }
      },
      removeAll: (destroy) => {
        if (destroy) {
          this.zoomContainer.list.forEach(item => {
            if (item && item.destroy) {
              item.destroy();
            }
          });
        }
        this.zoomContainer.list = [];
      }
    };

    // Rotated dartboard sprite (initially invisible, used when solved)
    this.rotatedDartboardSprite = this.add.image(380, 250, 'dartboard')
      .setDisplaySize(60, 60)
      .setAngle(180)
      .setVisible(false)
      .setDepth(2);


    // Clear previous listeners to avoid duplicates on restart
    stateManager.listeners = {};

    // Register engine event listeners
    stateManager.on('state_changed', (state) => {
      this.handleStateChanged(state);
    });

    stateManager.on('inventory_changed', () => {
      this.updateInventoryUI();
    });

    stateManager.on('actions_executed', (actions) => {
      this.handleActionsExecuted(actions);
    });

    this.updateHotspots();
    this.updateDynamicGraphics();

    // Start dialogue
    stateManager.showDialog("You are trapped in a cozy, sunlit treehouse. The wind rustles the leaves outside.");
    window.__gameReady = true;
  }

  // --- NAVIGATION ---
  createNavigation() {
    this.leftArrow = this.add.image(40, 220, 'arrow')
      .setInteractive({ useHandCursor: true })
      .setAngle(180)
      .setAlpha(0.8)
      .setDepth(10);

    this.rightArrow = this.add.image(920, 220, 'arrow')
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.8)
      .setDepth(10);

    [this.leftArrow, this.rightArrow].forEach(arrow => {
      arrow.on('pointerover', () => {
        arrow.setAlpha(1.0);
        this.tweens.add({
          targets: arrow,
          scale: 1.15,
          duration: 100
        });
        this.updateCanvasCursor();
      });
      arrow.on('pointerout', () => {
        arrow.setAlpha(0.8);
        this.tweens.add({
          targets: arrow,
          scale: 1.0,
          duration: 100
        });
      });
    });

    this.leftArrow.on('pointerdown', () => this.rotateRoom(-1));
    this.rightArrow.on('pointerdown', () => this.rotateRoom(1));
  }

  rotateRoom(direction) {
    if (stateManager.state.dialogActive || stateManager.state.zoomView) return;

    const views = ['north', 'east', 'south'];
    let index = views.indexOf(stateManager.state.currentView);
    index = (index + direction + views.length) % views.length;
    stateManager.setView(views[index]);

    this.cameras.main.fadeOut(150, 18, 14, 10);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.bg.setTexture(`bg_${stateManager.state.currentView}`);
      this.bg.setDisplaySize(960, 440);
      this.updateHotspots();
      this.updateDynamicGraphics();
      this.cameras.main.fadeIn(150, 18, 14, 10);
    });
  }

  // --- INVENTORY ---
  createInventoryBar() {
    const barHeight = 100;
    const yStart = 440;

    const bar = this.add.graphics();
    bar.fillStyle(0x1a1512, 1);
    bar.fillRect(0, yStart, 960, barHeight);
    bar.lineStyle(2, 0x8f7155, 0.5);
    bar.lineBetween(0, yStart, 960, yStart);

    this.add.text(15, yStart + 10, 'INVENTORY', {
      fontFamily: 'Outfit',
      fontSize: '12px',
      fontWeight: '600',
      fill: '#8f7155',
      letterSpacing: 1.5
    });

    this.inventorySlots = [];
    for (let i = 0; i < 8; i++) {
      const x = 120 + i * 80;
      const y = yStart + 50;
      
      const slotBox = this.add.graphics();
      slotBox.lineStyle(1, 0x8f7155, 0.3);
      slotBox.strokeRect(x - 30, y - 30, 60, 60);

      this.inventorySlots.push({ x, y, item: null, sprite: null });
    }
  }

  addToInventory(itemId) {
    stateManager.addItem(itemId);
  }

  removeFromInventory(itemId) {
    stateManager.removeItem(itemId);
  }

  updateInventoryUI() {
    this.inventorySlots.forEach(slot => {
      if (slot.sprite) {
        slot.sprite.destroy();
        slot.sprite = null;
      }
      slot.item = null;
    });

    stateManager.state.inventory.forEach((item, idx) => {
      if (idx < this.inventorySlots.length) {
        const slot = this.inventorySlots[idx];
        slot.item = item;
        
        let displayName = item.replace(/_/g, '\n').toUpperCase();
        if (item === 'origami_paper') {
          displayName = 'SHEET OF\nPAPER';
        }
        
        const itemText = this.add.text(slot.x, slot.y, displayName, {
          fontFamily: 'Outfit',
          fontSize: '10px',
          fill: '#f4eade',
          backgroundColor: (stateManager.state.selectedItem === item) ? '#d4a373' : '#3d2b1f',
          color: (stateManager.state.selectedItem === item) ? '#12100e' : '#f4eade',
          align: 'center',
          padding: { x: 5, y: 5 },
          wordWrap: { width: 50 }
        }).setOrigin(0.5);

        itemText.setInteractive({ useHandCursor: true });
        
        itemText.on('pointerover', () => {
          this.tweens.add({
            targets: itemText,
            scale: 1.08,
            duration: 100
          });
        });
        itemText.on('pointerout', () => {
          this.tweens.add({
            targets: itemText,
            scale: 1.0,
            duration: 100
          });
        });
        
        itemText.on('pointerdown', () => {
          stateManager.selectItem(item);
          
          // Inspect item ONLY if no zoom view is currently active.
          // If a zoom view (like the book) is open, clicking another item (like the paper)
          // should ONLY select it to allow combining, and NOT trigger its own zoom view.
          if (!stateManager.state.zoomView) {
            if (stateManager.state.selectedItem === item) {
              if (item === 'origami_paper') {
                this.inspectOrigamiPaper();
              } else if (item === 'origami_book') {
                this.inspectOrigamiBook();
              } else if (item === 'paper_airplane') {
                this.inspectPaperAirplane();
              } else if (item === 'trees_book') {
                this.inspectTreesBook();
              }
            }
          }
        });

        slot.sprite = itemText;
      }
    });

    this.updateCanvasCursor();
  }

  // --- DIALOG / TEXT BOX ---
  createDialogBox() {
    // Transparent full-screen input blocker overlay
    this.dialogBlocker = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.0)
      .setInteractive()
      .setVisible(false)
      .setDepth(99);

    this.dialogBlocker.on('pointerdown', (pointer, localX, localY, event) => {
      if (event) event.stopPropagation();
      this.hideDialog();
    });

    this.dialogBg = this.add.graphics();
    this.dialogBg.fillStyle(0x1c1212, 0.95);
    this.dialogBg.fillRect(100, 280, 760, 120);
    this.dialogBg.lineStyle(2, 0xd4a373, 0.8);
    this.dialogBg.strokeRect(100, 280, 760, 120);
    this.dialogBg.setVisible(false);
    this.dialogBg.setDepth(100);

    this.dialogTxt = this.add.text(130, 300, '', {
      fontFamily: 'Outfit',
      fontSize: '16px',
      fill: '#f4eade',
      wordWrap: { width: 700 },
      lineSpacing: 6
    }).setVisible(false);
    this.dialogTxt.setDepth(101);
  }

  showDialog(text) {
    stateManager.showDialog(text);
  }

  hideDialog() {
    stateManager.hideDialog();
  }

  // --- ZOOM VIEWS ---
  enterZoomView(viewName, drawCallback, closeCallback) {
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

    drawCallback();

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
    this.zoomContainer.removeAll(true);
    this.updateHotspots();
    this.updateCanvasCursor();
    
    this.leftArrow.setVisible(true);
    this.rightArrow.setVisible(true);
  }

  // --- DYNAMIC GRAPHICS ---
  updateDynamicGraphics() {
    this.compartmentGraphic.clear();

    if (this.rotatedDartboardSprite) {
      this.rotatedDartboardSprite.setVisible(false);
    }
  }

  // --- HOTSPOTS (ROOM INTERACTION) ---
  updateHotspots() {
    this.hotspots.clear(true, true);

    if (stateManager.state.zoomView) return;

    const currentViewConfig = TreehouseConfig.views[stateManager.state.currentView];
    if (currentViewConfig && currentViewConfig.hotspots) {
      currentViewConfig.hotspots.forEach(hotspot => {
        const [x, y, w, h] = hotspot.rect;
        this.addHotspot(x, y, w, h, null, () => {
          const actions = interpreter.evaluateInteraction(hotspot.interactions);
          stateManager.executeActions(actions);
        });
      });
    }
  }

  addHotspot(x, y, width, height, description, callback) {
    const rect = this.add.rectangle(x, y, width, height, 0xffffff, 0.0)
      .setInteractive({ useHandCursor: true });

    rect.on('pointerover', () => {
      rect.setFillStyle(0xffffff, 0.05);
      this.updateCanvasCursor();
    });
    rect.on('pointerout', () => rect.setFillStyle(0xffffff, 0.0));
    
    rect.on('pointerdown', () => {
      if (stateManager.state.dialogActive || stateManager.state.zoomView) return;
      if (callback) {
        callback();
      } else if (description) {
        this.showDialog(description);
      }
    });

    this.hotspots.add(rect);
  }

  handleStateChanged(state) {
    if (state.dialogActive) {
      this.dialogTxt.setText(state.dialogText);
      this.dialogBg.setVisible(true);
      this.dialogTxt.setVisible(true);
      if (this.dialogBlocker) {
        this.dialogBlocker.setVisible(true);
      }
      this.leftArrow.setVisible(false);
      this.rightArrow.setVisible(false);
    } else {
      this.dialogBg.setVisible(false);
      this.dialogTxt.setVisible(false);
      if (this.dialogBlocker) {
        this.dialogBlocker.setVisible(false);
      }
      if (!state.zoomView) {
        this.leftArrow.setVisible(true);
        this.rightArrow.setVisible(true);
      }
    }
    this.updateDynamicGraphics();
  }

  handleActionsExecuted(actions) {
    actions.forEach(action => {
      const splitIdx = action.indexOf(':');
      let command = action;
      let arg = '';
      if (splitIdx !== -1) {
        command = action.substring(0, splitIdx).trim();
        arg = action.substring(splitIdx + 1).trim();
      }
      
      switch (command) {
        case 'OPEN_ZOOM_VIEW':
          if (arg === 'south_window_zoom') this.inspectSouthWindow();
          else if (arg === 'safe_view') this.enterSafeView();
          else if (arg === 'dartboard_view') this.enterDartboardView();
          break;
        case 'LAUNCH_MINIGAME':
          if (arg === 'open_safe_compartment') {
            if (stateManager.state.hasKeyInCompartment) {
              stateManager.state.hasKeyInCompartment = false;
              stateManager.addItem('rusty_key');
              this.updateDynamicGraphics();
              stateManager.showDialog("You found a Rusty Old Key in the safe.");
            } else {
              stateManager.showDialog("The unlocked safe is empty.");
            }
          }
          break;
        case 'TRIGGER_WIN':
          this.triggerVictory();
          break;
        case 'REFRESH_GRAPHICS':
          this.updateDynamicGraphics();
          break;
      }
    });
  }

  // --- ZOOM PUZZLE: UNFOLDED ORIGAMI PAPER ---
  inspectOrigamiPaper() {
    this.enterZoomView('origami_paper', () => {
      const paper = this.add.graphics();
      // Draw a plain square paper sheet in the center
      paper.fillStyle(0xfaf6ee, 1);
      paper.fillRect(330, 70, 300, 300);
      paper.lineStyle(2, 0x8f7155, 1);
      paper.strokeRect(330, 70, 300, 300);

      // Fold/crease lines
      paper.lineStyle(1, 0x8f7155, 0.2);
      paper.lineBetween(480, 70, 480, 370);
      paper.lineBetween(330, 220, 630, 220);

      const title = this.add.text(480, 45, 'A sheet of paper', {
        fontFamily: 'Playfair Display',
        fontSize: '20px',
        fill: '#f4eade',
        fontWeight: 'bold'
      }).setOrigin(0.5);

      // Scrambled numbers at different rotations and positions
      const nums = [
        { text: '13', x: 380, y: 130, angle: 45 },
        { text: '5', x: 390, y: 280, angle: 90 },
        { text: '20', x: 570, y: 130, angle: -60 },
        { text: '8', x: 440, y: 170, angle: 120 },
        { text: '10', x: 520, y: 310, angle: 180 },
        { text: '42', x: 580, y: 250, angle: 15 }
      ];

      const numObjects = nums.map(n => {
        return this.add.text(n.x, n.y, n.text, {
          fontFamily: 'Outfit',
          fontSize: '24px',
          fill: '#5c4d3c',
          fontWeight: '600'
        }).setOrigin(0.5).setAngle(n.angle);
      });

      this.zoomContainer.add([paper, title, ...numObjects]);
    });
  }

  // --- ZOOM PUZZLE: ORIGAMI BOOK ---
  inspectOrigamiBook() {
    this.enterZoomView('origami_book', () => {
      // Draw high-fidelity open origami book image
      const bookImage = this.add.image(470, 210, 'open_origami_book')
        .setDisplaySize(540, 360);
      this.zoomContainer.add(bookImage);

      // Interactive folding zone on the right page
      const foldZone = this.add.rectangle(605, 210, 240, 280, 0xffffff, 0.0)
        .setInteractive({ useHandCursor: true });

      foldZone.on('pointerover', () => foldZone.setFillStyle(0xd4a373, 0.05));
      foldZone.on('pointerout', () => foldZone.setFillStyle(0xffffff, 0.0));
      
      foldZone.on('pointerdown', () => {
        if (stateManager.state.selectedItem === 'origami_paper') {
          // Perform folding
          stateManager.removeItem('origami_paper');
          stateManager.removeItem('origami_book');
          stateManager.addItem('paper_airplane');
          
          // Instantly transition to the Paper Airplane Zoom View
          this.inspectPaperAirplane();
          
          stateManager.showDialog("Using the instructions in the book, you fold the paper into a Paper Airplane!");
        }
      });

      this.zoomContainer.add(foldZone);
    });
  }

  // --- ZOOM PUZZLE: FOLDED PAPER AIRPLANE ---
  inspectPaperAirplane() {
    this.enterZoomView('paper_airplane', () => {
      const card = this.add.graphics();
      card.fillStyle(0xfefcf0, 1);
      card.fillRoundedRect(220, 45, 520, 330, 10);
      card.lineStyle(2, 0xd4a373, 1);
      card.strokeRoundedRect(220, 45, 520, 330, 10);

      // Display the generated illustration
      const img = this.add.image(480, 205, 'paper_airplane_clue');
      img.setDisplaySize(480, 270);

      const title = this.add.text(480, 65, 'Folded Paper Airplane', {
        fontFamily: 'Playfair Display',
        fontSize: '18px',
        fill: '#3d2b1f',
        fontWeight: 'bold'
      }).setOrigin(0.5);

      this.zoomContainer.add([card, img, title]);
    });
  }

  // --- ZOOM PUZZLE: DARTBOARD ---
  enterDartboardView() {
    this.enterZoomView('dartboard', () => {
      const boardPanel = this.add.graphics();
      boardPanel.fillStyle(0x1c1212, 1);
      boardPanel.fillRect(180, 20, 600, 400);
      boardPanel.lineStyle(3, 0x8f7155, 1);
      boardPanel.strokeRect(180, 20, 600, 400);

      this.zoomContainer.add(boardPanel);

      // Draw high-fidelity dartboard image and make it interactive
      const dbImage = this.add.image(480, 220, 'dartboard')
        .setDisplaySize(360, 360)
        .setInteractive({ useHandCursor: true });
      this.zoomContainer.add(dbImage);

      // Dartboard standard numbers sequence clockwise from top
      const boardNumbers = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

      dbImage.on('pointerdown', (pointer) => {
        if (stateManager.hasFlag('dartboard_solved')) return;

        // Calculate click coordinates relative to dartboard center (480, 220)
        const clickX = pointer.worldX;
        const clickY = pointer.worldY;

        const angleRad = Math.atan2(clickY - 220, clickX - 480);
        let angleDeg = angleRad * (180 / Math.PI);
        let rotatedDeg = angleDeg + 90;
        if (rotatedDeg < 0) rotatedDeg += 360;
        let shiftedDeg = rotatedDeg + 9;
        if (shiftedDeg >= 360) shiftedDeg -= 360;
        const wedgeIndex = Math.floor(shiftedDeg / 18);
        const num = boardNumbers[wedgeIndex];

        gameState.dartboardSequence.push(num);

        const minigameConfig = TreehouseConfig.minigames.dartboard_view;
        // Check sequence
        const seqLen = gameState.dartboardSequence.length;
        const targetSeq = minigameConfig.target.slice(0, seqLen);

        if (gameState.dartboardSequence.every((val, i) => val === targetSeq[i])) {
          if (seqLen === minigameConfig.target.length) {
            stateManager.executeActions(minigameConfig.onSuccess);
          }
        } else {
          // Reset on mistake
          gameState.dartboardSequence = [];
        }
      });
    });
  }

  inspectTreesBook() {
    this.enterZoomView('trees_book', () => {
      // Draw high-fidelity open book image
      const bookImage = this.add.image(470, 210, 'open_book')
        .setDisplaySize(540, 360);
      this.zoomContainer.add(bookImage);
    });
  }

  inspectSouthWindow() {
    this.enterZoomView('south_window_zoom', () => {
      // Draw background panel border
      const winPanel = this.add.graphics();
      winPanel.fillStyle(0x1a202c, 1); // Dark blue sky fallback
      winPanel.fillRect(180, 40, 600, 360);
      winPanel.lineStyle(3, 0x8f7155, 1);
      winPanel.strokeRect(180, 40, 600, 360);

      this.zoomContainer.add(winPanel);

      // Load and add the new window view image
      const winImage = this.add.image(480, 220, 'south_window_view')
        .setDisplaySize(600, 360);
      this.zoomContainer.add(winImage);

      const title = this.add.text(480, 65, 'South Window View', {
        fontFamily: 'Playfair Display',
        fontSize: '20px',
        fill: '#f4eade',
        fontWeight: 'bold'
      }).setOrigin(0.5);
      this.zoomContainer.add(title);

      // Hotspots for the three trees adjusted to match the generated image
      const leftTreeHotspot = this.add.rectangle(415, 200, 60, 140, 0xffffff, 0.0)
        .setInteractive({ useHandCursor: true });
      const centerTreeHotspot = this.add.rectangle(502, 190, 60, 140, 0xffffff, 0.0)
        .setInteractive({ useHandCursor: true });
      const rightTreeHotspot = this.add.rectangle(590, 200, 60, 140, 0xffffff, 0.0)
        .setInteractive({ useHandCursor: true });

      [leftTreeHotspot, centerTreeHotspot, rightTreeHotspot].forEach(hot => {
        hot.on('pointerover', () => {
          hot.setFillStyle(0xffffff, 0.05);
          this.updateCanvasCursor();
        });
        hot.on('pointerout', () => hot.setFillStyle(0xffffff, 0.0));
      });

      leftTreeHotspot.on('pointerdown', () => {
        if (gameState.selectedItem === 'binoculars') {
          this.inspectTreeBranch('oak_leaf_zoom');
        } else {
          this.showDialog("A leafy tree standing in the middle of the canopy.");
        }
      });

      centerTreeHotspot.on('pointerdown', () => {
        if (gameState.selectedItem === 'binoculars') {
          this.inspectTreeBranch('white_pine_zoom');
        } else {
          this.showDialog("A tall green tree rustling in the wind.");
        }
      });

      rightTreeHotspot.on('pointerdown', () => {
        if (gameState.selectedItem === 'binoculars') {
          this.inspectTreeBranch('sugar_maple_zoom');
        } else {
          this.showDialog("A lush tree with dense foliage.");
        }
      });

      this.zoomContainer.add([leftTreeHotspot, centerTreeHotspot, rightTreeHotspot]);
    });
  }

  inspectTreeBranch(viewName) {
    this.enterZoomView(viewName, () => {
      const card = this.add.graphics();
      card.fillStyle(0xfaf6ee, 1);
      card.fillRoundedRect(280, 60, 400, 300, 10);
      card.lineStyle(2, 0xd4a373, 1);
      card.strokeRoundedRect(280, 60, 400, 300, 10);

      this.zoomContainer.add(card);

      let key = '';
      if (viewName === 'oak_leaf_zoom') key = 'oak_leaf';
      else if (viewName === 'white_pine_zoom') key = 'white_pine_needles';
      else if (viewName === 'sugar_maple_zoom') key = 'sugar_maple_leaf';

      const leafImage = this.add.image(480, 210, key)
        .setDisplaySize(280, 280);
      this.zoomContainer.add(leafImage);
    }, () => this.inspectSouthWindow());
  }

  enterSafeView() {
    this.enterZoomView('safe_view', () => {
      this.safeDials = [];

      const isUnlocked = stateManager.hasFlag('safe_unlocked');

      if (isUnlocked) {
        const openBg = this.add.image(480, 220, 'safe_open');
        openBg.setDisplaySize(535, 535).setDepth(2);
        this.zoomContainer.add(openBg);
        return;
      }

      const lockedBg = this.add.image(480, 220, 'safe_bg');
      lockedBg.setDisplaySize(960, 535).setDepth(1);
      this.zoomContainer.add(lockedBg);

      const title = this.add.text(480, 85, 'OLD DIAL SAFE', {
        fontFamily: 'Playfair Display',
        fontSize: '18px',
        fill: '#d4a373',
        fontWeight: 'bold',
        letterSpacing: 2
      }).setOrigin(0.5).setDepth(3);
      this.zoomContainer.add(title);

      const subtitle = this.add.text(480, 110, 'Click dials to rotate values', {
        fontFamily: 'Outfit',
        fontSize: '11px',
        fill: '#8f7155'
      }).setOrigin(0.5).setDepth(3);
      this.zoomContainer.add(subtitle);

      const startX = 360;
      const spacing = 80;
      const slotGraphics = [];
      const wheelTexts = [];
      const hitZones = [];

      for (let i = 0; i < 4; i++) {
        const x = startX + i * spacing;

        // Draw a dark rounded slot casing behind each wheel
        const slotCasing = this.add.graphics();
        slotCasing.fillStyle(0x1a1512, 1);
        slotCasing.fillRoundedRect(x - 20, 140, 40, 160, 5);
        slotCasing.lineStyle(2, 0x8f7155, 0.5);
        slotCasing.strokeRoundedRect(x - 20, 140, 40, 160, 5);
        slotCasing.setDepth(3);
        this.zoomContainer.add(slotCasing);
        slotGraphics.push(slotCasing);

        // Value text styling
        const digitStyle = {
          fontFamily: 'Outfit',
          fontWeight: 'bold'
        };

        const prevText = this.add.text(x, 175, '9', { ...digitStyle, fontSize: '20px', fill: '#c8b7a6' })
          .setOrigin(0.5)
          .setAlpha(0.4)
          .setDepth(4);
        
        const activeText = this.add.text(x, 220, '0', { ...digitStyle, fontSize: '32px', fill: '#d4a373' })
          .setOrigin(0.5)
          .setDepth(4);
        
        const nextText = this.add.text(x, 265, '1', { ...digitStyle, fontSize: '20px', fill: '#c8b7a6' })
          .setOrigin(0.5)
          .setAlpha(0.4)
          .setDepth(4);

        this.zoomContainer.add([prevText, activeText, nextText]);
        wheelTexts.push(prevText, activeText, nextText);

        const hitZone = this.add.rectangle(x, 220, 40, 160, 0xffffff, 0)
          .setInteractive({ useHandCursor: true })
          .setDepth(5);
        
        hitZone.value = 0;
        hitZone.index = i;

        hitZone.on('pointerdown', () => {
          hitZone.value = (hitZone.value + 1) % 10;
          activeText.setText(hitZone.value);
          prevText.setText((hitZone.value - 1 + 10) % 10);
          nextText.setText((hitZone.value + 1) % 10);
          this.updateCanvasCursor();

          const combo = this.safeDials.map(d => d.value).join('');
          const minigameConfig = TreehouseConfig.minigames.safe_view;
          if (combo === minigameConfig.combination) {
            // Disable all hit zones immediately to prevent double clicking
            hitZones.forEach(hz => hz.disableInteractive());

            stateManager.setFlag('safe_unlocked');
            stateManager.state.hasKeyInCompartment = false;
            stateManager.addItem('rusty_key');

            const openBg = this.add.image(480, 220, 'safe_open');
            openBg.setDisplaySize(535, 535).setDepth(2);
            openBg.alpha = 0;
            this.zoomContainer.add(openBg);

            this.tweens.add({
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

            this.tweens.add({
              targets: openBg,
              alpha: 1,
              duration: 200,
              onComplete: () => {
                stateManager.showDialog("The safe is open, a Rusty Old Key is inside! It has been added to your inventory.");
              }
            });
          }
        });

        this.zoomContainer.add(hitZone);
        hitZones.push(hitZone);
        this.safeDials.push(hitZone);
      }
    });
  }

  updateCanvasCursor() {
    // Custom cursor styling disabled
  }

  // --- DYNAMIC GRAPHICS ---
  // --- VICTORY ---
  triggerVictory() {
    this.leftArrow.setVisible(false);
    this.rightArrow.setVisible(false);
    this.zoomContainer.removeAll(true);
    if (this.rotatedDartboardSprite) {
      this.rotatedDartboardSprite.setVisible(false);
    }

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x12100e, 1);
    overlay.fillRect(0, 0, width, height);

    const winText = this.add.text(width / 2, height / 2 - 60, 'YOU ESCAPED!', {
      fontFamily: 'Playfair Display',
      fontSize: '48px',
      fontWeight: 'bold',
      fill: '#d4a373'
    }).setOrigin(0.5);

    const subText = this.add.text(width / 2, height / 2, 'You unlocked the door and made your way down to the forest floor.', {
      fontFamily: 'Outfit',
      fontSize: '18px',
      fill: '#c8b7a6'
    }).setOrigin(0.5);

    const replayBtn = this.add.text(width / 2, height / 2 + 80, 'Play Again', {
      fontFamily: 'Outfit',
      fontSize: '20px',
      fill: '#f4eade',
      backgroundColor: '#3d2b1f',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    replayBtn.on('pointerover', () => replayBtn.setStyle({ fill: '#d4a373', backgroundColor: '#4e3829' }));
    replayBtn.on('pointerout', () => replayBtn.setStyle({ fill: '#f4eade', backgroundColor: '#3d2b1f' }));
    replayBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });

    this.zoomContainer.add([overlay, winText, subText, replayBtn]);
  }
}

// --- GAME CONFIGURATION ---
const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: 'game-canvas-container',
  backgroundColor: '#12100e',
  scene: [BootScene, PreloadScene, MainMenuScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);
window.__game = game;
window.__gameState = gameState;

