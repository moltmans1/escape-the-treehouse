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

    foldZone.on('pointerover', () => {
      foldZone.setFillStyle(0xd4a373, 0.05);
      if (this.scene.updateCanvasCursor) this.scene.updateCanvasCursor();
    });
    foldZone.on('pointerout', () => foldZone.setFillStyle(0xffffff, 0.0));
    
    foldZone.on('pointerdown', () => {
      const stateManager = this.scene.stateManager;
      if (stateManager.state.selectedItem === 'origami_paper') {
        stateManager.removeItem('origami_paper');
        stateManager.removeItem('origami_book');
        stateManager.addItem('paper_airplane');
        
        // Instantly transition to the Paper Airplane Zoom View
        this.scene.inspectPaperAirplane();
        
        stateManager.showDialog("Using the instructions in the book, you fold the paper into a Paper Airplane!");
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
