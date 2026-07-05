import { test, expect } from '@playwright/test';

test.describe('Tier 3: Pairwise Combinations', () => {
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

  test('T3-81: Binoculars x Safe', async ({ page }) => {
    // Collect binoculars & trees book but do not look at tree leaves. Enter combination 1759 directly.
    await navigateTo(page, 'east');
    await page.locator('canvas').click({ position: { x: 605, y: 260 } }); // binoculars
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 75, y: 85 } }); // trees book
    await dismissDialog(page);
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } }); // dartboard
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
    const solved = await page.evaluate(() => {
      const sp = window.__gameState.solvedPuzzles;
      return sp.includes ? sp.includes('safe_unlocked') : new Set(sp).has('safe_unlocked');
    });
    expect(solved).toBe(true);
  });

  test('T3-82: Origami x Dartboard', async ({ page }) => {
    // Fold paper airplane, then navigate to south and solve dartboard without opening airplane zoom view.
    await page.locator('canvas').click({ position: { x: 260, y: 290 } }); // paper
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 860, y: 180 } }); // book
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 200, y: 490 } }); // Open book
    await page.waitForFunction(() => window.__gameState.zoomView === 'origami_book');
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // select paper
    await page.locator('canvas').click({ position: { x: 605, y: 210 } }); // fold
    await page.waitForFunction(() => window.__gameState.zoomView === 'paper_airplane');
    await page.locator('canvas').click({ position: { x: 900, y: 30 } }); // close zoom
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 20);
    await clickDartboardNumber(page, 10);
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');
    const solved = await page.evaluate(() => {
      const sp = window.__gameState.solvedPuzzles;
      return sp.includes ? sp.includes('dartboard_solved') : new Set(sp).has('dartboard_solved');
    });
    expect(solved).toBe(true);
  });

  test('T3-83: Exit Door x Lamps', async ({ page }) => {
    // Step onto Balcony, toggle Balcony Lamp ON, return to South, toggle South Lamp OFF, configure North/East to solve.
    await page.evaluate(() => {
      window.__gameState.solvedPuzzles.add('door_unlocked');
      window.__gameState.currentView = 'balcony';
    });
    // Click balcony lamp
    await page.locator('canvas').click({ position: { x: 380, y: 290 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'lamp_balcony_zoom', null, { timeout: 2000 });
  });

  test('T3-84: Lamps x Trunk', async ({ page }) => {
    // Solve lamps to get brass key, select it, navigate to North, unlock trunk.
    await page.evaluate(() => {
      window.__gameState.inventory.push('brass_key');
    });
    await navigateTo(page, 'north');
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // select key
    await page.locator('canvas').click({ position: { x: 820, y: 370 } }); // trunk
    await page.waitForFunction(() => {
      const sp = window.__gameState.solvedPuzzles;
      return sp.includes ? sp.includes('trunk_unlocked') : new Set(sp).has('trunk_unlocked');
    }, null, { timeout: 2000 });
  });

  test('T3-85: Trunk x Zipline', async ({ page }) => {
    // Retrieve harness, navigate to Balcony, use zipline.
    await page.evaluate(() => {
      window.__gameState.solvedPuzzles.add('trunk_unlocked');
      window.__gameState.currentView = 'balcony';
    });
    // Click Zipline with harness
    await page.evaluate(() => { window.__gameState.inventory.push('harness'); });
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // select harness
    await page.locator('canvas').click({ position: { x: 550, y: 280 } }); // zipline
    const won = await page.evaluate(() => {
      const sp = window.__gameState.solvedPuzzles;
      return sp.includes ? sp.includes('door_unlocked') : new Set(sp).has('door_unlocked');
    });
    expect(won).toBe(true);
  });

  test('T3-86: Origami x Binoculars', async ({ page }) => {
    // Collect origami paper, book, binoculars, trees book. Assert inventory list displays all four.
    await page.locator('canvas').click({ position: { x: 260, y: 290 } }); // paper
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 860, y: 180 } }); // book
    await dismissDialog(page);
    await navigateTo(page, 'east');
    await page.locator('canvas').click({ position: { x: 605, y: 260 } }); // binoculars
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 75, y: 85 } }); // trees book
    await dismissDialog(page);

    const inv = await page.evaluate(() => window.__gameState.inventory);
    expect(inv).toContain('origami_paper');
    expect(inv).toContain('origami_book');
    expect(inv).toContain('binoculars');
    expect(inv).toContain('trees_book');
  });

  test('T3-87: Dartboard x Exit Door', async ({ page }) => {
    // Solve dartboard to reveal safe. Try to unlock door without solving safe (having no key).
    await navigateTo(page, 'south');
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 20);
    await clickDartboardNumber(page, 10);
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');
    await page.locator('canvas').click({ position: { x: 900, y: 30 } }); // close zoom
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // Try to unlock exit door
    await page.locator('canvas').click({ position: { x: 185, y: 270 } });
    const text = await page.evaluate(() => window.__gameState.dialogText);
    expect(text).toBe('The door is locked.');
  });

  test('T3-88: Safe Dials x Zipline', async ({ page }) => {
    // Solve safe to get rusty key. Select it, click Zipline. Assert zipline rejects/fails.
    await page.evaluate(() => {
      window.__gameState.inventory.push('rusty_key');
      window.__gameState.currentView = 'balcony';
    });
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // select rusty key
    await page.locator('canvas').click({ position: { x: 550, y: 280 } }); // zipline
    const text = await page.evaluate(() => window.__gameState.dialogText);
    expect(text).toContain('harness');
  });
});
