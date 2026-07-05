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
        this.scene.showDialog("A leafy tree standing in the middle of the canopy.");
      }
    });

    centerTreeHotspot.on('pointerdown', () => {
      const stateManager = this.scene.stateManager;
      if (stateManager.state.selectedItem === 'binoculars') {
        this.scene.inspectTreeBranch('white_pine_zoom');
      } else {
        this.scene.showDialog("A tall green tree rustling in the wind.");
      }
    });

    rightTreeHotspot.on('pointerdown', () => {
      const stateManager = this.scene.stateManager;
      if (stateManager.state.selectedItem === 'binoculars') {
        this.scene.inspectTreeBranch('sugar_maple_zoom');
      } else {
        this.scene.showDialog("A lush tree with dense foliage.");
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
