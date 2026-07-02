import Phaser from 'phaser';

// Global Game State
const gameState = {
  inventory: [],
  selectedItem: null,
  solvedPuzzles: new Set(),
  currentView: 'north', // 'north', 'east', 'south'
  zoomView: null,       // null or name of zoomed-in view
  dialogText: '',
  dialogActive: false,
  
  // Puzzle-specific states
  dartboardSequence: [], // Player's click sequence on the dartboard
  hasKeyInCompartment: true
};

const DARTBOARD_CORRECT_SEQUENCE = [13, 20, 10];

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
      // Reset game state
      gameState.inventory = [];
      gameState.selectedItem = null;
      gameState.solvedPuzzles.clear();
      gameState.currentView = 'north';
      gameState.zoomView = null;
      gameState.dartboardSequence = [];
      gameState.hasKeyInCompartment = true;
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

    this.updateHotspots();
    this.updateDynamicGraphics();

    // Start dialogue
    this.showDialog("You wake up in a cozy, sunlit treehouse. The wind rustles the leaves outside. The door is locked, and the ladder down is nowhere to be seen. You need to find another way down.");
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
        arrow.setAlpha(1.0).setScale(1.1);
        this.updateCanvasCursor();
      });
      arrow.on('pointerout', () => arrow.setAlpha(0.8).setScale(1.0));
    });

    this.leftArrow.on('pointerdown', () => this.rotateRoom(-1));
    this.rightArrow.on('pointerdown', () => this.rotateRoom(1));
  }

  rotateRoom(direction) {
    if (gameState.dialogActive || gameState.zoomView) return;

    const views = ['north', 'east', 'south'];
    let index = views.indexOf(gameState.currentView);
    index = (index + direction + views.length) % views.length;
    gameState.currentView = views[index];

    this.cameras.main.fadeOut(150, 18, 14, 10);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.bg.setTexture(`bg_${gameState.currentView}`);
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
    if (gameState.inventory.includes(itemId)) return;
    gameState.inventory.push(itemId);
    this.updateInventoryUI();
  }

  removeFromInventory(itemId) {
    gameState.inventory = gameState.inventory.filter(item => item !== itemId);
    if (gameState.selectedItem === itemId) {
      gameState.selectedItem = null;
    }
    this.updateInventoryUI();
  }

  updateInventoryUI() {
    this.inventorySlots.forEach(slot => {
      if (slot.sprite) {
        slot.sprite.destroy();
        slot.sprite = null;
      }
      slot.item = null;
    });

    gameState.inventory.forEach((item, idx) => {
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
          backgroundColor: (gameState.selectedItem === item) ? '#d4a373' : '#3d2b1f',
          color: (gameState.selectedItem === item) ? '#12100e' : '#f4eade',
          align: 'center',
          padding: { x: 5, y: 5 },
          wordWrap: { width: 50 }
        }).setOrigin(0.5);

        itemText.setInteractive({ useHandCursor: true });
        
        itemText.on('pointerdown', () => {
          if (gameState.selectedItem === item) {
            gameState.selectedItem = null;
            this.updateInventoryUI();
          } else {
            gameState.selectedItem = item;
            this.updateInventoryUI();
            
            // Inspect item ONLY if no zoom view is currently active.
            // If a zoom view (like the book) is open, clicking another item (like the paper)
            // should ONLY select it to allow combining, and NOT trigger its own zoom view.
            if (!gameState.zoomView) {
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
    this.dialogBg = this.add.graphics();
    this.dialogBg.fillStyle(0x1c1212, 0.95);
    this.dialogBg.fillRect(100, 280, 760, 120);
    this.dialogBg.lineStyle(2, 0xd4a373, 0.8);
    this.dialogBg.strokeRect(100, 280, 760, 120);
    this.dialogBg.setVisible(false);

    this.dialogTxt = this.add.text(130, 300, '', {
      fontFamily: 'Outfit',
      fontSize: '16px',
      fill: '#f4eade',
      wordWrap: { width: 700 },
      lineSpacing: 6
    }).setVisible(false);

    this.input.on('pointerdown', () => {
      if (gameState.dialogActive) {
        this.hideDialog();
      }
    });
  }

  showDialog(text) {
    gameState.dialogText = text;
    gameState.dialogActive = true;
    
    this.dialogTxt.setText(text);
    this.dialogBg.setVisible(true);
    this.dialogTxt.setVisible(true);

    this.leftArrow.setVisible(false);
    this.rightArrow.setVisible(false);
  }

  hideDialog() {
    gameState.dialogActive = false;
    this.dialogBg.setVisible(false);
    this.dialogTxt.setVisible(false);

    if (!gameState.zoomView) {
      this.leftArrow.setVisible(true);
      this.rightArrow.setVisible(true);
    }
  }

  // --- ZOOM VIEWS ---
  enterZoomView(viewName, drawCallback, closeCallback) {
    gameState.zoomView = viewName;
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
    .on('pointerdown', () => {
      if (closeCallback) {
        closeCallback();
      } else {
        this.exitZoomView();
      }
    });
    
    this.zoomContainer.add(closeBtn);

    drawCallback();
  }

  exitZoomView() {
    gameState.zoomView = null;
    this.zoomContainer.removeAll(true);
    this.updateHotspots();
    this.updateCanvasCursor();
    
    this.leftArrow.setVisible(true);
    this.rightArrow.setVisible(true);
  }

  // --- DYNAMIC GRAPHICS ---
  updateDynamicGraphics() {
    this.compartmentGraphic.clear();

    // Draw binoculars on the desk (desk hotspot is 790, 320, size 260 x 160)
    if (gameState.currentView === 'south' && !gameState.solvedPuzzles.has('found_binoculars')) {
      this.compartmentGraphic.fillStyle(0x2d3748, 1); // Dark blue-gray
      this.compartmentGraphic.fillRect(780, 310, 10, 20);
      this.compartmentGraphic.fillRect(795, 310, 10, 20);
      this.compartmentGraphic.fillStyle(0x4a5568, 1);
      this.compartmentGraphic.fillRect(790, 317, 5, 6);
    }

    // Draw book on East wall shelf (shelf hotspot is 150, 120, size 100 x 150)
    if (gameState.currentView === 'east' && !gameState.solvedPuzzles.has('found_trees_book')) {
      this.compartmentGraphic.fillStyle(0x276749, 1); // Forest green
      this.compartmentGraphic.fillRect(140, 100, 20, 35);
      this.compartmentGraphic.fillStyle(0xf7fafc, 1);
      this.compartmentGraphic.fillRect(142, 102, 16, 2);
    }

    // Draw safe / rotated dartboard on the South View if solved
    if (gameState.currentView === 'south' && gameState.solvedPuzzles.has('dartboard_solved')) {
      // Draw safe compartment behind dartboard
      this.compartmentGraphic.fillStyle(0x1a1a1a, 1);
      this.compartmentGraphic.fillRect(355, 150, 60, 60);
      this.compartmentGraphic.lineStyle(2, 0x555555, 1);
      this.compartmentGraphic.strokeRect(355, 150, 60, 60);

      if (gameState.solvedPuzzles.has('safe_unlocked')) {
        // Open safe
        this.compartmentGraphic.fillStyle(0x0a0a0a, 1);
        this.compartmentGraphic.fillRect(358, 153, 54, 54);
        
        if (gameState.hasKeyInCompartment) {
          // Draw key inside
          this.compartmentGraphic.lineStyle(2, 0xc8b7a6, 1);
          this.compartmentGraphic.strokeCircle(385, 175, 5);
          this.compartmentGraphic.lineBetween(385, 180, 385, 195);
          this.compartmentGraphic.lineBetween(385, 187, 389, 187);
          this.compartmentGraphic.lineBetween(385, 192, 389, 192);
        }
      } else {
        // Closed safe (draw dial/keypad)
        this.compartmentGraphic.fillStyle(0x333333, 1);
        this.compartmentGraphic.fillRect(360, 155, 50, 50);
        this.compartmentGraphic.fillStyle(0x111111, 1);
        this.compartmentGraphic.fillRect(375, 170, 20, 20); // dial/keypad
      }

      // Draw rotated down dartboard hanging upside down under safe
      this.compartmentGraphic.lineStyle(2, 0x8f7155, 0.8);
      this.compartmentGraphic.fillStyle(0x0e0a08, 0.9);
      this.compartmentGraphic.fillCircle(385, 245, 30);
      this.compartmentGraphic.strokeCircle(385, 245, 30);
      this.compartmentGraphic.strokeCircle(385, 245, 20);
      this.compartmentGraphic.strokeCircle(385, 245, 10);
    }
  }

  // --- HOTSPOTS (ROOM INTERACTION) ---
  updateHotspots() {
    this.hotspots.clear(true, true);

    if (gameState.zoomView) return;

    switch (gameState.currentView) {
      case 'north':
        // Hammock
        this.addHotspot(200, 240, 250, 160, "Underneath the pillow, you find a sheet of paper.", () => {
          if (!gameState.solvedPuzzles.has('found_paper')) {
            gameState.solvedPuzzles.add('found_paper');
            this.addToInventory('origami_paper');
            this.showDialog("Underneath the pillow, you find a sheet of paper.");
          } else {
            this.showDialog("A comfortable hammock. There's nothing else under the pillow.");
          }
        });

        // Bookshelves
        this.addHotspot(900, 150, 100, 180, "A shelf full of books.", () => {
          if (!gameState.solvedPuzzles.has('found_book')) {
            gameState.solvedPuzzles.add('found_book');
            this.addToInventory('origami_book');
            this.showDialog("You search the bookshelves and find an Origami Guide.");
          } else {
            this.showDialog("Various novels and guides about forest lore.");
          }
        });

        // Trunk (Decorative)
        this.addHotspot(820, 340, 220, 140, "A sturdy wooden trunk. It is locked with a heavy brass padlock.", () => {
          this.showDialog("It's a heavy iron-banded trunk. The padlock is rusted shut and won't budge. There doesn't seem to be a way to open it.");
        });
        break;

      case 'east':
        // Window
        this.addHotspot(500, 170, 320, 320, "A large circular window looking out into the forest canopy. The sun is beginning to set, casting a golden glow.", null);

        // Trees Book Shelf (Top-Left Wall)
        this.addHotspot(150, 120, 100, 150, "A small wooden shelf on the wall.", () => {
          if (!gameState.solvedPuzzles.has('found_trees_book')) {
            gameState.solvedPuzzles.add('found_trees_book');
            this.addToInventory('trees_book');
            this.updateDynamicGraphics();
            this.showDialog("On a small wooden shelf on the wall, you find a book titled 'Trees of North America'.");
          } else {
            this.showDialog("A small wooden shelf on the wall.");
          }
        });
        break;

      case 'south':
        // Exit Door
        this.addHotspot(190, 250, 180, 320, "A heavy wooden door leading out of the treehouse. It is locked with a rusty old padlock.", () => {
          if (gameState.solvedPuzzles.has('door_unlocked')) {
            this.triggerVictory();
          } else if (gameState.selectedItem === 'rusty_key') {
            gameState.solvedPuzzles.add('door_unlocked');
            this.removeFromInventory('rusty_key');
            this.showDialog("You insert the rusty old key into the padlock. With a heavy creak, the lock snaps open and the door swings open! Click again to exit.");
          } else {
            this.showDialog("The exit door is locked tight. The padlock is extremely old and rusty.");
          }
        });

        // Writing Desk / Binoculars
        this.addHotspot(790, 320, 260, 160, "A cozy writing desk with some inkwells and loose sheets of scrap paper.", () => {
          if (!gameState.solvedPuzzles.has('found_binoculars')) {
            gameState.solvedPuzzles.add('found_binoculars');
            this.addToInventory('binoculars');
            this.updateDynamicGraphics();
            this.showDialog("On the corner of the writing desk, you find a pair of binoculars.");
          } else {
            this.showDialog("A cozy writing desk with some inkwells and loose sheets of scrap paper.");
          }
        });

        // South Window
        this.addHotspot(600, 150, 160, 200, "The window looks out into the forest canopy.", () => {
          this.inspectSouthWindow();
        });

        // Dartboard / Safe
        this.addHotspot(385, 200, 100, 100, "A circular dartboard hanging on the wall.", () => {
          if (gameState.solvedPuzzles.has('dartboard_solved')) {
            if (gameState.solvedPuzzles.has('safe_unlocked')) {
              if (gameState.hasKeyInCompartment) {
                gameState.hasKeyInCompartment = false;
                this.addToInventory('rusty_key');
                this.updateDynamicGraphics();
                this.showDialog("You pick up the Rusty Old Key from the open safe.");
              } else {
                this.showDialog("The safe is open and empty.");
              }
            } else {
              this.enterSafeInputView();
            }
          } else {
            this.enterDartboardView();
          }
        });
        break;
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
      if (gameState.dialogActive || gameState.zoomView) return;
      if (callback) {
        callback();
      } else if (description) {
        this.showDialog(description);
      }
    });

    this.hotspots.add(rect);
  }

  // --- ZOOM PUZZLE: UNFOLDED ORIGAMI PAPER ---
  inspectOrigamiPaper() {
    this.enterZoomView('origami_paper', () => {
      const paper = this.add.graphics();
      paper.fillStyle(0xfefcf0, 1);
      paper.fillRoundedRect(280, 60, 400, 300, 10);
      paper.lineStyle(2, 0xd4a373, 1);
      paper.strokeRoundedRect(280, 60, 400, 300, 10);

      // Doodles and fold lines
      paper.lineStyle(1, 0xd4a373, 0.3);
      paper.lineBetween(480, 60, 480, 360);
      paper.lineBetween(280, 210, 680, 210);
      
      const title = this.add.text(480, 85, 'A sheet of paper', {
        fontFamily: 'Playfair Display',
        fontSize: '20px',
        fill: '#3d2b1f',
        fontWeight: 'bold'
      }).setOrigin(0.5);

      // Scrambled numbers at different rotations and positions
      const nums = [
        { text: '13', x: 340, y: 140, angle: 45 },
        { text: '5', x: 380, y: 280, angle: 90 },
        { text: '20', x: 600, y: 130, angle: -60 },
        { text: '8', x: 440, y: 170, angle: 120 },
        { text: '10', x: 520, y: 310, angle: 180 },
        { text: '42', x: 620, y: 250, angle: 15 }
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
      const book = this.add.graphics();
      // Draw left page
      book.fillStyle(0xfaf6ee, 1);
      book.fillRoundedRect(200, 60, 270, 300, { tl: 10, bl: 10, tr: 0, br: 0 });
      book.lineStyle(2, 0x8f7155, 1);
      book.strokeRoundedRect(200, 60, 270, 300, { tl: 10, bl: 10, tr: 0, br: 0 });

      // Draw right page
      book.fillStyle(0xfaf6ee, 1);
      book.fillRoundedRect(470, 60, 270, 300, { tl: 0, bl: 0, tr: 10, br: 10 });
      book.strokeRoundedRect(470, 60, 270, 300, { tl: 0, bl: 0, tr: 10, br: 10 });

      // Left page text
      const title = this.add.text(335, 100, 'Origami Guide', {
        fontFamily: 'Playfair Display',
        fontSize: '22px',
        fill: '#3d2b1f',
        fontWeight: 'bold'
      }).setOrigin(0.5);

      const instructions = this.add.text(335, 200, 'Chapter 4:\nThe Paper Airplane', {
        fontFamily: 'Outfit',
        fontSize: '14px',
        fill: '#5c4d3c',
        align: 'center',
        wordWrap: { width: 220 }
      }).setOrigin(0.5);

      // Right page drawing (Paper Airplane folding outline)
      const outline = this.add.graphics();
      outline.lineStyle(2, 0x8f7155, 0.6);
      outline.strokeTriangle(520, 220, 680, 220, 600, 140);
      outline.lineBetween(600, 140, 600, 220);

      // Interactive folding zone on the right page
      const foldZone = this.add.rectangle(605, 210, 240, 280, 0xffffff, 0.0)
        .setInteractive({ useHandCursor: true });

      foldZone.on('pointerover', () => foldZone.setFillStyle(0xd4a373, 0.05));
      foldZone.on('pointerout', () => foldZone.setFillStyle(0xffffff, 0.0));
      
      foldZone.on('pointerdown', () => {
        if (gameState.selectedItem === 'origami_paper') {
          // Perform folding
          this.removeFromInventory('origami_paper');
          this.removeFromInventory('origami_book');
          this.addToInventory('paper_airplane');
          
          // Instantly transition to the Paper Airplane Zoom View
          this.inspectPaperAirplane();
          
          this.showDialog("Using the instructions in the book, you fold the paper into a neat Paper Airplane!");
        } else {
          this.showDialog("You need to select the sheet of paper in your inventory first to fold it here.");
        }
      });

      this.zoomContainer.add([book, title, instructions, outline, foldZone]);
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
      boardPanel.fillRect(200, 40, 560, 360);
      boardPanel.lineStyle(3, 0x8f7155, 1);
      boardPanel.strokeRect(200, 40, 560, 360);

      this.zoomContainer.add(boardPanel);

      const title = this.add.text(480, 70, 'Dartboard', {
        fontFamily: 'Playfair Display',
        fontSize: '22px',
        fill: '#d4a373',
        fontWeight: 'bold'
      }).setOrigin(0.5);
      this.zoomContainer.add(title);

      // Draw standard dartboard rings
      const db = this.add.graphics();
      db.lineStyle(2, 0x8f7155, 1);
      db.fillStyle(0x0e0a08, 1);
      db.fillCircle(480, 220, 120);
      db.strokeCircle(480, 220, 120);
      db.strokeCircle(480, 220, 80);
      db.strokeCircle(480, 220, 40);
      db.strokeCircle(480, 220, 10);
      this.zoomContainer.add(db);

      // Dartboard standard numbers sequence clockwise from top
      const boardNumbers = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
      const radius = 100;

      boardNumbers.forEach((num, idx) => {
        // Calculate angle (0 is 12 o'clock, which is the number 20)
        const angle = (idx * 18 - 90) * (Math.PI / 180);
        const x = 480 + radius * Math.cos(angle);
        const y = 220 + radius * Math.sin(angle);

        // Clickable number text
        const numText = this.add.text(x, y, num.toString(), {
          fontFamily: 'Outfit',
          fontSize: '16px',
          fill: '#f4eade',
          fontWeight: '600'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        numText.on('pointerover', () => numText.setStyle({ fill: '#d4a373', fontSize: '20px' }));
        numText.on('pointerout', () => numText.setStyle({ fill: '#f4eade', fontSize: '16px' }));

        numText.on('pointerdown', () => {
          if (gameState.solvedPuzzles.has('dartboard_solved')) return;

          gameState.dartboardSequence.push(num);
          this.showDialog(`You click on segment: ${num}.`);

          // Check sequence
          const seqLen = gameState.dartboardSequence.length;
          const targetSeq = DARTBOARD_CORRECT_SEQUENCE.slice(0, seqLen);

          if (gameState.dartboardSequence.every((val, i) => val === targetSeq[i])) {
            if (seqLen === DARTBOARD_CORRECT_SEQUENCE.length) {
              gameState.solvedPuzzles.add('dartboard_solved');
              this.removeFromInventory('paper_airplane');
              this.updateDynamicGraphics();
              this.showDialog("With a soft click, a secret compartment slides open behind the dartboard, revealing a Rusty Old Key.");
              this.exitZoomView();
            }
          } else {
            // Reset on mistake
            gameState.dartboardSequence = [];
            this.showDialog("Nothing happens. Maybe the order was wrong?");
          }
        });

        this.zoomContainer.add(numText);
      });
    });
  }

  // --- ADDITIONAL ZOOM PUZZLES: BOOK, WINDOW, BRANCHES, SAFE ---
  inspectTreesBook() {
    this.enterZoomView('trees_book', () => {
      const book = this.add.graphics();
      // Draw left page
      book.fillStyle(0xfaf6ee, 1);
      book.fillRoundedRect(200, 60, 270, 300, { tl: 10, bl: 10, tr: 0, br: 0 });
      book.lineStyle(2, 0x8f7155, 1);
      book.strokeRoundedRect(200, 60, 270, 300, { tl: 10, bl: 10, tr: 0, br: 0 });

      // Draw right page
      book.fillStyle(0xfaf6ee, 1);
      book.fillRoundedRect(470, 60, 270, 300, { tl: 0, bl: 0, tr: 10, br: 10 });
      book.strokeRoundedRect(470, 60, 270, 300, { tl: 0, bl: 0, tr: 10, br: 10 });

      // Left page text
      const title = this.add.text(335, 100, 'Trees of North America', {
        fontFamily: 'Playfair Display',
        fontSize: '20px',
        fill: '#1a365d',
        fontWeight: 'bold',
        align: 'center',
        wordWrap: { width: 220 }
      }).setOrigin(0.5);

      const intro = this.add.text(335, 200, 'An identification guide for common forest trees and their foliage features.', {
        fontFamily: 'Outfit',
        fontSize: '13px',
        fill: '#4a5568',
        align: 'center',
        wordWrap: { width: 220 }
      }).setOrigin(0.5);

      // Right page text: Page index table
      const indexTitle = this.add.text(605, 95, 'Index of Common Trees', {
        fontFamily: 'Playfair Display',
        fontSize: '16px',
        fill: '#1a365d',
        fontWeight: 'bold'
      }).setOrigin(0.5);

      const indexText = this.add.text(605, 210, 
        "Oak (Lobed Leaves) ........... Page 17\n\n" +
        "White Pine (Needles) ......... Page 5\n\n" +
        "Sugar Maple (Palmate) ........ Page 9\n\n" +
        "Birch (Double Serrate) ....... Page 23\n\n" +
        "Redwood (Scale-like) ......... Page 48", {
        fontFamily: 'Outfit',
        fontSize: '12px',
        fill: '#2d3748',
        align: 'left',
        wordWrap: { width: 240 }
      }).setOrigin(0.5);

      this.zoomContainer.add([book, title, intro, indexTitle, indexText]);
    });
  }

  inspectSouthWindow() {
    this.enterZoomView('south_window_zoom', () => {
      // Draw background panel
      const winPanel = this.add.graphics();
      winPanel.fillStyle(0x1a202c, 1); // Dark blue sky
      winPanel.fillRect(180, 40, 600, 360);
      winPanel.lineStyle(3, 0x8f7155, 1);
      winPanel.strokeRect(180, 40, 600, 360);

      this.zoomContainer.add(winPanel);

      const title = this.add.text(480, 65, 'South Window View', {
        fontFamily: 'Playfair Display',
        fontSize: '20px',
        fill: '#f4eade',
        fontWeight: 'bold'
      }).setOrigin(0.5);
      this.zoomContainer.add(title);

      // Draw the three trees: Left (Oak), Center (White Pine), Right (Sugar Maple)
      const treesGraphics = this.add.graphics();
      
      // Oak Tree (Left) - Broad leafy green canopy
      treesGraphics.fillStyle(0x718096, 1); // Trunk
      treesGraphics.fillRect(275, 240, 10, 60);
      treesGraphics.fillStyle(0x2f855a, 1); // Leaves
      treesGraphics.fillCircle(280, 210, 40);
      treesGraphics.fillCircle(255, 220, 30);
      treesGraphics.fillCircle(305, 220, 30);

      // White Pine Tree (Center) - Evergreen tall triangular shape
      treesGraphics.fillStyle(0x718096, 1);
      treesGraphics.fillRect(475, 250, 10, 60);
      treesGraphics.fillStyle(0x22543d, 1); // Pine green
      treesGraphics.fillTriangle(480, 140, 430, 220, 530, 220);
      treesGraphics.fillTriangle(480, 170, 440, 250, 520, 250);

      // Sugar Maple Tree (Right) - Colorful orange/red maple
      treesGraphics.fillStyle(0x718096, 1);
      treesGraphics.fillRect(675, 240, 10, 60);
      treesGraphics.fillStyle(0xc53030, 1); // Reddish-orange
      treesGraphics.fillCircle(680, 205, 45);
      treesGraphics.fillStyle(0xdd6b20, 1);
      treesGraphics.fillCircle(660, 215, 30);
      treesGraphics.fillCircle(700, 215, 30);

      this.zoomContainer.add(treesGraphics);

      // Hotspots for the three trees: Left (Oak: 280, 220), Center (White Pine: 480, 220), Right (Sugar Maple: 680, 220)
      const leftTreeHotspot = this.add.rectangle(280, 220, 100, 140, 0xffffff, 0.0)
        .setInteractive({ useHandCursor: true });
      const centerTreeHotspot = this.add.rectangle(480, 220, 100, 140, 0xffffff, 0.0)
        .setInteractive({ useHandCursor: true });
      const rightTreeHotspot = this.add.rectangle(680, 220, 100, 140, 0xffffff, 0.0)
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
          this.showDialog("A tall deciduous tree with wide branches.");
        }
      });

      centerTreeHotspot.on('pointerdown', () => {
        if (gameState.selectedItem === 'binoculars') {
          this.inspectTreeBranch('white_pine_zoom');
        } else {
          this.showDialog("A tall evergreen tree with soft needles.");
        }
      });

      rightTreeHotspot.on('pointerdown', () => {
        if (gameState.selectedItem === 'binoculars') {
          this.inspectTreeBranch('sugar_maple_zoom');
        } else {
          this.showDialog("A colorful maple tree with dense foliage.");
        }
      });

      this.zoomContainer.add([leftTreeHotspot, centerTreeHotspot, rightTreeHotspot]);
    });
  }

  inspectTreeBranch(viewName) {
    this.enterZoomView(viewName, () => {
      const card = this.add.graphics();
      card.fillStyle(0xfefcf0, 1);
      card.fillRoundedRect(280, 60, 400, 300, 10);
      card.lineStyle(2, 0xd4a373, 1);
      card.strokeRoundedRect(280, 60, 400, 300, 10);

      this.zoomContainer.add(card);

      let titleText = '';
      let descText = '';
      
      const branchGraphic = this.add.graphics();
      branchGraphic.lineStyle(4, 0x718096, 1); // branch stem

      if (viewName === 'oak_leaf_zoom') {
        titleText = 'Oak Tree Zoom';
        descText = 'Oak branch - Lobed leaves.\nRef: Page 17';
        
        branchGraphic.lineBetween(320, 280, 460, 180);
        branchGraphic.fillStyle(0x2f855a, 1);
        branchGraphic.fillCircle(400, 190, 20);
        branchGraphic.fillCircle(420, 175, 15);
        branchGraphic.fillCircle(440, 160, 10);
        
      } else if (viewName === 'white_pine_zoom') {
        titleText = 'White Pine Zoom';
        descText = 'White Pine branch - Needles in clusters of 5.\nRef: Page 5';
        
        branchGraphic.lineBetween(320, 280, 460, 180);
        branchGraphic.lineStyle(1.5, 0x22543d, 1);
        for (let i = 0; i < 5; i++) {
          const angle = (i * 15 - 30) * (Math.PI / 180);
          branchGraphic.lineBetween(400, 222, 400 + 40 * Math.cos(angle), 222 + 40 * Math.sin(angle));
        }
      } else if (viewName === 'sugar_maple_zoom') {
        titleText = 'Sugar Maple Zoom';
        descText = 'Sugar Maple branch - Palmate leaves.\nRef: Page 9';
        
        branchGraphic.lineBetween(320, 280, 460, 180);
        branchGraphic.fillStyle(0xdd6b20, 1);
        branchGraphic.fillTriangle(410, 210, 430, 185, 390, 190);
        branchGraphic.fillTriangle(400, 220, 415, 175, 430, 210);
      }

      this.zoomContainer.add(branchGraphic);

      const title = this.add.text(480, 90, titleText, {
        fontFamily: 'Playfair Display',
        fontSize: '22px',
        fill: '#3d2b1f',
        fontWeight: 'bold'
      }).setOrigin(0.5);

      const description = this.add.text(480, 310, descText, {
        fontFamily: 'Outfit',
        fontSize: '14px',
        fill: '#5c4d3c',
        align: 'center',
        fontWeight: '600'
      }).setOrigin(0.5);

      this.zoomContainer.add([title, description]);
    }, () => this.inspectSouthWindow());
  }

  enterSafeInputView() {
    this.enterZoomView('safe_input', () => {
      this.safeInputBuffer = '';

      const keypadPanel = this.add.graphics();
      keypadPanel.fillStyle(0x1a1512, 1);
      keypadPanel.fillRoundedRect(320, 50, 320, 340, 10);
      keypadPanel.lineStyle(3, 0x8f7155, 1);
      keypadPanel.strokeRoundedRect(320, 50, 320, 340, 10);

      keypadPanel.fillStyle(0x0e0a08, 1);
      keypadPanel.fillRect(350, 75, 260, 45);
      keypadPanel.strokeRect(350, 75, 260, 45);

      this.zoomContainer.add(keypadPanel);

      const title = this.add.text(480, 35, 'ENTER SAFE CODE', {
        fontFamily: 'Outfit',
        fontSize: '12px',
        fill: '#8f7155',
        fontWeight: '600',
        letterSpacing: 1.5
      }).setOrigin(0.5);
      this.zoomContainer.add(title);

      const displayText = this.add.text(480, 97, '----', {
        fontFamily: 'Outfit',
        fontSize: '28px',
        fill: '#68d391',
        letterSpacing: 6
      }).setOrigin(0.5);
      this.zoomContainer.add(displayText);

      const buttons = [
        { label: '1', x: 380, y: 160 },
        { label: '2', x: 480, y: 160 },
        { label: '3', x: 580, y: 160 },
        { label: '4', x: 380, y: 220 },
        { label: '5', x: 480, y: 220 },
        { label: '6', x: 580, y: 220 },
        { label: '7', x: 380, y: 280 },
        { label: '8', x: 480, y: 280 },
        { label: '9', x: 580, y: 280 },
        { label: 'C', x: 380, y: 340, color: '#e53e3e' },
        { label: '0', x: 480, y: 340 },
        { label: 'E', x: 580, y: 340, color: '#38a169' }
      ];

      buttons.forEach(btn => {
        const btnBox = this.add.rectangle(btn.x, btn.y, 60, 40, 0x2d231e, 1)
          .setInteractive({ useHandCursor: true });
        
        const btnText = this.add.text(btn.x, btn.y, btn.label, {
          fontFamily: 'Outfit',
          fontSize: '18px',
          fill: btn.color || '#f4eade',
          fontWeight: 'bold'
        }).setOrigin(0.5);

        btnBox.on('pointerover', () => {
          btnBox.setFillStyle(0x3e3029, 1);
          this.updateCanvasCursor();
        });
        btnBox.on('pointerout', () => btnBox.setFillStyle(0x2d231e, 1));
        
        btnBox.on('pointerdown', () => {
          if (btn.label === 'C') {
            this.safeInputBuffer = '';
            displayText.setText('----');
          } else if (btn.label === 'E') {
            if (this.safeInputBuffer === '1759') {
              gameState.solvedPuzzles.add('safe_unlocked');
              this.updateDynamicGraphics();
              this.showDialog("With a heavy mechanical click, the safe swings open, revealing a Rusty Old Key inside!");
              this.exitZoomView();
            } else {
              this.safeInputBuffer = '';
              displayText.setText('WRONG');
              this.time.delayedCall(800, () => {
                if (displayText.text === 'WRONG') displayText.setText('----');
              });
            }
          } else {
            if (this.safeInputBuffer.length < 4) {
              this.safeInputBuffer += btn.label;
              displayText.setText(this.safeInputBuffer.padEnd(4, '-'));
            }
          }
        });

        this.zoomContainer.add([btnBox, btnText]);
      });
    });
  }

  updateCanvasCursor() {
    if (gameState.selectedItem) {
      let cursorStyle = 'default';
      if (gameState.selectedItem === 'binoculars') {
        cursorStyle = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size: 24px;'><text y='24'>🔭</text></svg>\") 16 16, pointer";
      } else if (gameState.selectedItem === 'origami_paper') {
        cursorStyle = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size: 24px;'><text y='24'>📄</text></svg>\") 16 16, pointer";
      } else if (gameState.selectedItem === 'paper_airplane') {
        cursorStyle = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size: 24px;'><text y='24'>✈️</text></svg>\") 16 16, pointer";
      } else if (gameState.selectedItem === 'origami_book' || gameState.selectedItem === 'trees_book') {
        cursorStyle = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size: 24px;'><text y='24'>📖</text></svg>\") 16 16, pointer";
      } else if (gameState.selectedItem === 'rusty_key') {
        cursorStyle = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size: 24px;'><text y='24'>🔑</text></svg>\") 16 16, pointer";
      }
      this.input.setDefaultCursor(cursorStyle);
      if (this.game && this.game.canvas) {
        this.game.canvas.style.cursor = cursorStyle;
      }
    } else {
      this.input.setDefaultCursor('default');
      if (this.game && this.game.canvas) {
        this.game.canvas.style.cursor = 'default';
      }
    }
  }

  // --- DYNAMIC GRAPHICS ---
  // --- VICTORY ---
  triggerVictory() {
    this.leftArrow.setVisible(false);
    this.rightArrow.setVisible(false);
    this.zoomContainer.removeAll(true);

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

