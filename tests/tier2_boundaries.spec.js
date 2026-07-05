import { test, expect } from '@playwright/test';

test.describe('Tier 2: Boundaries (Features 1-8)', () => {
  const dismissDialog = async (page) => {
    await page.waitForTimeout(50);
    const isActive = await page.evaluate(() => window.__gameState && window.__gameState.dialogActive);
    if (!isActive) return;
    await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      if (gameScene) gameScene.hideDialog();
    });
    await page.waitForFunction(() => window.__gameState && window.__gameState.dialogActive === false, null, { timeout: 2000 }).catch(() => {});
  };

  const selectBinoculars = async (page) => {
    const selected = await page.evaluate(() => window.__gameState.selectedItem);
    if (selected !== 'binoculars') {
      await page.locator('canvas').click({ position: { x: 120, y: 490 } });
      await page.waitForFunction(() => window.__gameState.selectedItem === 'binoculars', null, { timeout: 2000 }).catch(() => {});
    }
  };

  const clickTree = async (page, side) => {
    await page.evaluate((treeSide) => {
      const gameScene = window.__game.scene.keys.GameScene;
      if (gameScene && gameScene.zoomContainer) {
        const rects = gameScene.zoomContainer.list.filter(c => c.width === 60 && c.height === 140);
        if (treeSide === 'left' && rects[0]) rects[0].emit('pointerdown');
        if (treeSide === 'center' && rects[1]) rects[1].emit('pointerdown');
        if (treeSide === 'right' && rects[2]) rects[2].emit('pointerdown');
      }
    }, side);
  };

  const clickDartboardNumber = async (page, num) => {
    await page.evaluate((numToClick) => {
      const gameScene = window.__game.scene.keys.GameScene;
      if (gameScene && gameScene.zoomContainer) {
        const dbImage = gameScene.zoomContainer.list.find(c => c.texture && c.texture.key === 'dartboard');
        if (dbImage) {
          const boardNumbers = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
          const idx = boardNumbers.indexOf(numToClick);
          if (idx !== -1) {
            const angle = (idx * 18 - 90) * (Math.PI / 180);
            const radius = 80;
            const px = 480 + radius * Math.cos(angle);
            const py = 220 + radius * Math.sin(angle);
            dbImage.emit('pointerdown', { worldX: px, worldY: py });
          }
        }
      }
    }, num);
    await dismissDialog(page);
  };

  const clickKeypadButton = async (page, char) => {
    await page.evaluate((btnChar) => {
      const gameScene = window.__game.scene.keys.GameScene;
      if (gameScene && gameScene.zoomContainer) {
        if (btnChar === 'E') {
          const handle = gameScene.zoomContainer.list.find(c => c.name === 'safe_handle');
          if (handle) handle.emit('pointerdown');
        } else {
          const charMap = { '1': 0, '7': 1, '5': 2, '9': 3 };
          const dialIdx = charMap[btnChar];
          if (dialIdx !== undefined && gameScene.safeDials && gameScene.safeDials[dialIdx]) {
            const dial = gameScene.safeDials[dialIdx];
            const targetVal = parseInt(btnChar, 10);
            while (dial.value !== targetVal) {
              dial.emit('pointerdown');
            }
          }
        }
      }
    }, char);
  };

  const navigateTo = async (page, targetView) => {
    for (let i = 0; i < 4; i++) {
      const current = await page.evaluate(() => window.__gameState.currentView);
      if (current === targetView) break;
      await page.locator('canvas').click({ position: { x: 920, y: 220 } });
      await page.waitForTimeout(100);
    }
    await page.waitForFunction((view) => window.__gameState.currentView === view, targetView, { timeout: 3000 });
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window.__mainMenuReady === true);
    await page.locator('canvas').click({ position: { x: 480, y: 330 } });
    await page.waitForFunction(() => window.__gameReady === true);
    await dismissDialog(page);
  });

  // ==========================================
  // F1: Origami Folding
  // ==========================================
  test('T2-F1-6: Multi-click Bookshelf', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.locator('canvas').click({ position: { x: 860, y: 180 } });
      await dismissDialog(page);
    }
    const inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory.filter(x => x === 'origami_book').length).toBe(1);
  });

  test('T2-F1-7: Multi-click Hammock', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.locator('canvas').click({ position: { x: 260, y: 290 } });
      await dismissDialog(page);
    }
    const inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory.filter(x => x === 'origami_paper').length).toBe(1);
  });

  test('T2-F1-8: Wrong Item Fold', async ({ page }) => {
    await page.locator('canvas').click({ position: { x: 860, y: 180 } }); // book
    await dismissDialog(page);
    // Open book zoom
    await page.locator('canvas').click({ position: { x: 120, y: 490 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'origami_book');
    // Select wrong item (e.g. book itself if we click slot 0 which has nothing, or let's collect book, it is selected when clicked)
    // Click fold zone
    await page.locator('canvas').click({ position: { x: 605, y: 210 } });
    // Should NOT fold
    expect(await page.evaluate(() => window.__gameState.zoomView)).toBe('origami_book');
  });

  test('T2-F1-9: Out-of-bounds Click', async ({ page }) => {
    await page.locator('canvas').click({ position: { x: 260, y: 290 } }); // paper
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 860, y: 180 } }); // book
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 200, y: 490 } }); // Open book
    await page.waitForFunction(() => window.__gameState.zoomView === 'origami_book');
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // Select paper
    // Click out of bounds of fold zone (e.g. bottom left [100, 300])
    await page.locator('canvas').click({ position: { x: 100, y: 300 } });
    expect(await page.evaluate(() => window.__gameState.zoomView)).toBe('origami_book');
  });

  test('T2-F1-10: Close Mid-fold', async ({ page }) => {
    await page.locator('canvas').click({ position: { x: 260, y: 290 } }); // paper
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 860, y: 180 } }); // book
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 200, y: 490 } }); // Open book
    await page.waitForFunction(() => window.__gameState.zoomView === 'origami_book');
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // Select paper
    // Close zoom
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);
    // Selection should be reset
    expect(await page.evaluate(() => window.__gameState.selectedItem)).toBeNull();
  });

  // ==========================================
  // F2: Dartboard Puzzle
  // ==========================================
  test('T2-F2-6: Close Zoom Mid-sequence', async ({ page }) => {
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'dartboard_view' || window.__gameState.zoomView === 'dartboard');
    await clickDartboardNumber(page, 13);
    await page.locator('canvas').click({ position: { x: 900, y: 30 } }); // close
    await page.waitForFunction(() => window.__gameState.zoomView === null);
    await page.locator('canvas').click({ position: { x: 380, y: 205 } }); // re-open
    await page.waitForFunction(() => window.__gameState.zoomView === 'dartboard_view' || window.__gameState.zoomView === 'dartboard');
    const seq = await page.evaluate(() => window.__gameState.dartboardSequence);
    expect(seq.length).toBe(0);
  });

  test('T2-F2-7: Incorrect Sequence Reset', async ({ page }) => {
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await clickDartboardNumber(page, 5);
    await clickDartboardNumber(page, 5);
    await clickDartboardNumber(page, 5);
    // Wait for auto reset
    await page.waitForFunction(() => window.__gameState.dartboardSequence.length === 0, null, { timeout: 3000 });
  });

  test('T2-F2-8: Throw 4th Dart Blocked', async ({ page }) => {
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await clickDartboardNumber(page, 5);
    await clickDartboardNumber(page, 5);
    await clickDartboardNumber(page, 5);
    // Instantly click a 4th wedge
    await clickDartboardNumber(page, 13);
    // Sequence should be locked at length 3 until reset
    const seq = await page.evaluate(() => window.__gameState.dartboardSequence.length);
    expect(seq).toBe(3);
  });

  test('T2-F2-9: Throw with Selected Item', async ({ page }) => {
    await page.locator('canvas').click({ position: { x: 260, y: 290 } }); // paper
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // select paper
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await clickDartboardNumber(page, 13);
    const count = await page.evaluate(() => window.__gameState.dartboardSequence.length);
    expect(count).toBe(1);
  });

  test('T2-F2-10: Rapid Same-wedge Clicks', async ({ page }) => {
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 13);
    const seq = await page.evaluate(() => window.__gameState.dartboardSequence);
    expect(seq).toEqual([13, 13, 13]);
  });

  // ==========================================
  // F3: Binoculars/Trees Inspection
  // ==========================================
  test('T2-F3-6: Inspect Window without Binoculars', async ({ page }) => {
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 715, y: 190 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'south_window_zoom');
    await clickTree(page, 'left');
    const text = await page.evaluate(() => window.__gameState.dialogText);
    expect(text).toBe('A leafy tree standing in the middle of the canopy.');
  });

  test('T2-F3-7: Inspect with Wrong Item', async ({ page }) => {
    await page.locator('canvas').click({ position: { x: 860, y: 180 } }); // book
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // select book
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 715, y: 190 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'south_window_zoom');
    await clickTree(page, 'left');
    const text = await page.evaluate(() => window.__gameState.dialogText);
    expect(text).toBe('A leafy tree standing in the middle of the canopy.');
  });

  test('T2-F3-8: Out-of-bounds Window Click', async ({ page }) => {
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 715, y: 190 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'south_window_zoom');
    // Click outside trees area (e.g. top of window sky)
    await page.locator('canvas').click({ position: { x: 480, y: 50 } });
    expect(await page.evaluate(() => window.__gameState.zoomView)).toBe('south_window_zoom');
  });

  test('T2-F3-9: Double Click Tree', async ({ page }) => {
    await navigateTo(page, 'east');
    await page.locator('canvas').click({ position: { x: 605, y: 260 } });
    await dismissDialog(page);
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 715, y: 190 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'south_window_zoom');
    await selectBinoculars(page);
    await clickTree(page, 'left');
    await clickTree(page, 'left');
    await page.waitForFunction(() => window.__gameState.zoomView === 'oak_leaf_zoom');
  });

  test('T2-F3-10: Leaf Zoom Return', async ({ page }) => {
    await navigateTo(page, 'east');
    await page.locator('canvas').click({ position: { x: 605, y: 260 } });
    await dismissDialog(page);
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 715, y: 190 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'south_window_zoom');
    await selectBinoculars(page);
    await clickTree(page, 'left');
    await page.waitForFunction(() => window.__gameState.zoomView === 'oak_leaf_zoom');
    await page.locator('canvas').click({ position: { x: 900, y: 30 } }); // close
    await page.waitForFunction(() => window.__gameState.zoomView === 'south_window_zoom');
  });

  // ==========================================
  // F4: Safe Dials
  // ==========================================
  test('T2-F4-6: Dial value wrapping', async ({ page }) => {
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 20);
    await clickDartboardNumber(page, 10);
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');
    // Click 10 times to wrap 0 -> 9 -> 0
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        const gameScene = window.__game.scene.keys.GameScene;
        if (gameScene && gameScene.safeDials && gameScene.safeDials[0]) {
          gameScene.safeDials[0].emit('pointerdown');
        }
      });
    }
    const val = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene && gameScene.safeDials ? gameScene.safeDials[0].value : -1;
    });
    expect(val).toBe(0);
  });

  test('T2-F4-7: Dial click when solved', async ({ page }) => {
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 20);
    await clickDartboardNumber(page, 10);
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');
    await clickKeypadButton(page, '1');
    await clickKeypadButton(page, '7');
    await clickKeypadButton(page, '5');
    await clickKeypadButton(page, '9');
    await page.waitForFunction(() => window.__gameState.dialogActive === true);
    await dismissDialog(page);
    // Solved now. Dials should not change value on pointerdown
    const valBefore = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene && gameScene.safeDials ? gameScene.safeDials[0].value : -1;
    });
    await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      if (gameScene && gameScene.safeDials && gameScene.safeDials[0]) {
        gameScene.safeDials[0].emit('pointerdown');
      }
    });
    const valAfter = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene && gameScene.safeDials ? gameScene.safeDials[0].value : -1;
    });
    expect(valAfter).toBe(valBefore);
  });

  test('T2-F4-8: Close mid-combination', async ({ page }) => {
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 20);
    await clickDartboardNumber(page, 10);
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');
    await clickKeypadButton(page, '1');
    await page.locator('canvas').click({ position: { x: 900, y: 30 } }); // close
    await page.waitForFunction(() => window.__gameState.zoomView === null);
    await page.locator('canvas').click({ position: { x: 380, y: 205 } }); // re-open
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');
    const val = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene && gameScene.safeDials ? gameScene.safeDials[0].value : -1;
    });
    expect(val).toBe(1);
  });

  test('T2-F4-9: Click Dials with Item Selected', async ({ page }) => {
    await page.locator('canvas').click({ position: { x: 260, y: 290 } }); // paper
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // select paper
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 20);
    await clickDartboardNumber(page, 10);
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');
    await clickKeypadButton(page, '1');
    const val = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene && gameScene.safeDials ? gameScene.safeDials[0].value : -1;
    });
    expect(val).toBe(1);
  });

  test('T2-F4-10: Direct flag check', async ({ page }) => {
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 20);
    await clickDartboardNumber(page, 10);
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');
    await clickKeypadButton(page, '1');
    await clickKeypadButton(page, '7');
    await clickKeypadButton(page, '5');
    await clickKeypadButton(page, '9');
    await page.waitForFunction(() => window.__gameState.dialogActive === true);
    await dismissDialog(page);
    const hasKey = await page.evaluate(() => window.__gameState.hasKeyInCompartment);
    expect(hasKey).toBe(false);
  });

  // ==========================================
  // F5: Exit Door
  // ==========================================
  test('T2-F5-6: Use Wrong Key', async ({ page }) => {
    await page.locator('canvas').click({ position: { x: 860, y: 180 } }); // book
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // select book
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 185, y: 270 } }); // door
    const solved = await page.evaluate(() => {
      const sp = window.__gameState.solvedPuzzles;
      return sp.includes ? sp.includes('door_unlocked') : new Set(sp).has('door_unlocked');
    });
    expect(solved).toBe(false);
  });

  test('T2-F5-7: Rapid click locked door', async ({ page }) => {
    await navigateTo(page, 'south');
    for (let i = 0; i < 5; i++) {
      await page.locator('canvas').click({ position: { x: 185, y: 270 } });
    }
    const isActive = await page.evaluate(() => window.__gameState.dialogActive);
    expect(isActive).toBe(true);
    const text = await page.evaluate(() => window.__gameState.dialogText);
    expect(text).toBe('The door is locked.');
  });

  test('T2-F5-8: Select key but click blank space', async ({ page }) => {
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 20);
    await clickDartboardNumber(page, 10);
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');
    await clickKeypadButton(page, '1');
    await clickKeypadButton(page, '7');
    await clickKeypadButton(page, '5');
    await clickKeypadButton(page, '9');
    await page.waitForFunction(() => window.__gameState.dialogActive === true);
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // select key
    await page.waitForFunction(() => window.__gameState.selectedItem === 'rusty_key');
    // click floor
    await page.locator('canvas').click({ position: { x: 500, y: 100 } });
    const selected = await page.evaluate(() => window.__gameState.selectedItem);
    expect(selected).toBe('rusty_key');
  });

  test('T2-F5-9: Persistence Check', async ({ page }) => {
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 20);
    await clickDartboardNumber(page, 10);
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');
    await clickKeypadButton(page, '1');
    await clickKeypadButton(page, '7');
    await clickKeypadButton(page, '5');
    await clickKeypadButton(page, '9');
    await page.waitForFunction(() => window.__gameState.dialogActive === true);
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);
    await page.locator('canvas').click({ position: { x: 120, y: 490 } });
    await page.waitForFunction(() => window.__gameState.selectedItem === 'rusty_key');
    await page.locator('canvas').click({ position: { x: 185, y: 270 } }); // unlock
    await dismissDialog(page);
    await navigateTo(page, 'east');
    await navigateTo(page, 'south');
    const solved = await page.evaluate(() => {
      const sp = window.__gameState.solvedPuzzles;
      return sp.includes ? sp.includes('door_unlocked') : new Set(sp).has('door_unlocked');
    });
    expect(solved).toBe(true);
  });

  test('T2-F5-10: Click door when dialog active', async ({ page }) => {
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 780, y: 355 } }); // trigger desk dialog
    await page.waitForFunction(() => window.__gameState.dialogActive === true);
    // Click door to dismiss dialog first
    await page.locator('canvas').click({ position: { x: 185, y: 270 } });
    const isActive = await page.evaluate(() => window.__gameState.dialogActive);
    expect(isActive).toBe(false);
  });

  // ==========================================
  // F6: Lamps Puzzle (Fails as expected)
  // ==========================================
  test('T2-F6-6: Toggle lamp multiple times', async ({ page }) => {
    await navigateTo(page, 'north');
    await page.locator('canvas').click({ position: { x: 870, y: 90 } }); // lamp north zoom
    await page.waitForFunction(() => window.__gameState.zoomView === 'lamp_north_zoom', null, { timeout: 2000 });
    // Toggle 4 times
    await page.locator('canvas').click({ position: { x: 480, y: 270 } });
    await page.locator('canvas').click({ position: { x: 480, y: 270 } });
    await page.locator('canvas').click({ position: { x: 480, y: 270 } });
    await page.locator('canvas').click({ position: { x: 480, y: 270 } });
    const lampState = await page.evaluate(() => window.__gameState.solvedPuzzles.includes ? window.__gameState.solvedPuzzles.includes('lamp_north_on') : new Set(window.__gameState.solvedPuzzles).has('lamp_north_on'));
    expect(lampState).toBe(false);
  });

  test('T2-F6-7: Incorrect Configuration', async ({ page }) => {
    await navigateTo(page, 'north');
    await page.locator('canvas').click({ position: { x: 870, y: 90 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'lamp_north_zoom', null, { timeout: 2000 });
    await page.locator('canvas').click({ position: { x: 480, y: 270 } }); // North ON
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });

    await navigateTo(page, 'east');
    await page.locator('canvas').click({ position: { x: 530, y: 250 } }); // East lamp zoom
    await page.waitForFunction(() => window.__gameState.zoomView === 'lamp_east_zoom', null, { timeout: 2000 });
    await page.locator('canvas').click({ position: { x: 480, y: 270 } }); // East ON
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });

    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 580, y: 280 } }); // South lamp zoom
    await page.waitForFunction(() => window.__gameState.zoomView === 'lamp_south_zoom', null, { timeout: 2000 });
    await page.locator('canvas').click({ position: { x: 480, y: 270 } }); // South ON (Incorrect, must be OFF)
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });

    const solved = await page.evaluate(() => {
      const sp = window.__gameState.solvedPuzzles;
      return sp.includes ? sp.includes('lamp_puzzle_solved') : new Set(sp).has('lamp_puzzle_solved');
    });
    expect(solved).toBe(false);
  });

  test('T2-F6-8: Multi-view clue inspect', async ({ page }) => {
    await navigateTo(page, 'east');
    await page.locator('canvas').click({ position: { x: 320, y: 100 } }); // Clue 1
    await page.waitForFunction(() => window.__gameState.zoomView === 'clue_1_zoom', null, { timeout: 2000 });
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    // Inspect again
    await page.locator('canvas').click({ position: { x: 320, y: 100 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'clue_1_zoom', null, { timeout: 2000 });
  });

  test('T2-F6-9: Pre-unlock access block', async ({ page }) => {
    // Attempting to access balcony lamp before door is unlocked (should not be possible)
    await page.evaluate(() => { window.__gameState.currentView = 'balcony'; });
    await page.locator('canvas').click({ position: { x: 380, y: 290 } }); // Balcony lamp
    await page.waitForFunction(() => window.__gameState.zoomView === 'lamp_balcony_zoom', null, { timeout: 2000 });
  });

  test('T2-F6-10: Lamp state persistence', async ({ page }) => {
    await navigateTo(page, 'north');
    await page.locator('canvas').click({ position: { x: 870, y: 90 } }); // lamp north zoom
    await page.waitForFunction(() => window.__gameState.zoomView === 'lamp_north_zoom', null, { timeout: 2000 });
    await page.locator('canvas').click({ position: { x: 480, y: 270 } }); // North ON
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });

    await navigateTo(page, 'east');
    await navigateTo(page, 'north');
    const lampState = await page.evaluate(() => window.__gameState.solvedPuzzles.includes ? window.__gameState.solvedPuzzles.includes('lamp_north_on') : new Set(window.__gameState.solvedPuzzles).has('lamp_north_on'));
    expect(lampState).toBe(true);
  });

  // ==========================================
  // F7: Trunk Puzzle (Fails as expected)
  // ==========================================
  test('T2-F7-6: Unlock with wrong item', async ({ page }) => {
    await page.locator('canvas').click({ position: { x: 860, y: 180 } }); // book
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // select book
    await page.locator('canvas').click({ position: { x: 820, y: 370 } }); // Trunk
    const solved = await page.evaluate(() => {
      const sp = window.__gameState.solvedPuzzles;
      return sp.includes ? sp.includes('trunk_unlocked') : new Set(sp).has('trunk_unlocked');
    });
    expect(solved).toBe(false);
  });

  test('T2-F7-7: Retrieve harness pre-unlock', async ({ page }) => {
    await page.locator('canvas').click({ position: { x: 820, y: 370 } }); // Trunk
    await dismissDialog(page);
    const inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory).not.toContain('harness');
  });

  test('T2-F7-8: Double-unlock check', async ({ page }) => {
    await page.evaluate(() => {
      window.__gameState.solvedPuzzles.add('trunk_unlocked');
      window.__gameState.inventory.push('brass_key');
    });
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // select key
    await page.locator('canvas').click({ position: { x: 820, y: 370 } }); // Trunk
    // Key should not be consumed again
    const inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory).toContain('brass_key');
  });

  test('T2-F7-9: Harness retrieval dismiss block', async ({ page }) => {
    await page.evaluate(() => { window.__gameState.solvedPuzzles.add('trunk_unlocked'); });
    await page.locator('canvas').click({ position: { x: 820, y: 370 } }); // Click trunk to prompt dialogue
    await page.locator('canvas').click({ position: { x: 500, y: 100 } }); // Click outside to dismiss dialogue
    // Harness should still be retrieved
    const inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory).toContain('harness');
  });

  test('T2-F7-10: Interaction post-win', async ({ page }) => {
    await page.evaluate(() => {
      window.__gameState.solvedPuzzles.add('door_unlocked');
    });
    await page.locator('canvas').click({ position: { x: 820, y: 370 } });
    const isActive = await page.evaluate(() => window.__gameState.dialogActive);
    expect(isActive).toBe(false); // Game should block scene interaction
  });

  // ==========================================
  // F8: Zipline Escape (Fails as expected)
  // ==========================================
  test('T2-F8-6: Escape with wrong item', async ({ page }) => {
    await page.evaluate(() => {
      window.__gameState.currentView = 'balcony';
      window.__gameState.inventory.push('rusty_key');
    });
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // select key
    await page.locator('canvas').click({ position: { x: 550, y: 280 } }); // zipline
    const won = await page.evaluate(() => {
      const sp = window.__gameState.solvedPuzzles;
      return sp.includes ? sp.includes('door_unlocked') : new Set(sp).has('door_unlocked');
    });
    expect(won).toBe(false);
  });

  test('T2-F8-7: Multi-click note', async ({ page }) => {
    await page.evaluate(() => { window.__gameState.currentView = 'balcony'; });
    for (let i = 0; i < 5; i++) {
      await page.locator('canvas').click({ position: { x: 180, y: 150 } }); // pinned note
      await dismissDialog(page);
    }
    const inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory.filter(x => x === 'pigpen_cipher_key').length).toBe(1);
  });

  test('T2-F8-8: Escape pre-collection', async ({ page }) => {
    await page.evaluate(() => { window.__gameState.currentView = 'balcony'; });
    await page.locator('canvas').click({ position: { x: 550, y: 280 } }); // Zipline
    const dialog = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialog).toContain('harness');
  });

  test('T2-F8-9: Select harness, click floor', async ({ page }) => {
    await page.evaluate(() => {
      window.__gameState.inventory.push('harness');
    });
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // select harness
    await page.locator('canvas').click({ position: { x: 500, y: 100 } }); // click floor
    const won = await page.evaluate(() => {
      const sp = window.__gameState.solvedPuzzles;
      return sp.includes ? sp.includes('door_unlocked') : new Set(sp).has('door_unlocked');
    });
    expect(won).toBe(false);
  });

  test('T2-F8-10: Escape with dialog active', async ({ page }) => {
    await page.evaluate(() => {
      window.__gameState.currentView = 'balcony';
      window.__gameState.inventory.push('harness');
    });
    await page.locator('canvas').click({ position: { x: 180, y: 150 } }); // trigger note dialog
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // select harness (dismisses dialog)
    await page.locator('canvas').click({ position: { x: 550, y: 280 } }); // Zipline
    const won = await page.evaluate(() => {
      const sp = window.__gameState.solvedPuzzles;
      return sp.includes ? sp.includes('door_unlocked') : new Set(sp).has('door_unlocked');
    });
    expect(won).toBe(true);
  });
});
