import { test, expect } from '@playwright/test';

test.describe('Escape the Treehouse E2E Tests', () => {
  // Helper to check set membership in the browser
  const hasFlag = async (page, flag) => {
    return await page.evaluate((f) => {
      const solved = window.__gameState.solvedPuzzles;
      return solved.includes ? solved.includes(f) : new Set(solved).has(f);
    }, flag);
  };

  // Helper to programmatically hover over coordinates using trusted mouse events
  const hoverPosition = async (page, x, y) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) return;
    const cx = box.x + x * (box.width / 960);
    const cy = box.y + y * (box.height / 540);
    await page.mouse.move(cx, cy, { steps: 5 });
  };

  // Helper to wait for and dismiss a dialog directly via GameScene method
  const dismissDialog = async (page) => {
    await page.waitForTimeout(50);
    const isActive = await page.evaluate(() => window.__gameState && window.__gameState.dialogActive);
    if (!isActive) {
      return;
    }
    await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      if (gameScene) {
        gameScene.hideDialog();
      }
    });
    await page.waitForFunction(() => window.__gameState && window.__gameState.dialogActive === false);
  };

  // Helper to select binoculars safely without toggling it off if already selected
  const selectBinoculars = async (page) => {
    const selected = await page.evaluate(() => window.__gameState.selectedItem);
    if (selected !== 'binoculars') {
      await page.locator('canvas').click({ position: { x: 120, y: 490 } });
      await page.waitForFunction(() => window.__gameState.selectedItem === 'binoculars');
    }
  };

  // Helper to programmatically click trees inside south_window_zoom
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

  // Helper to programmatically click dartboard numbers
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
            const radius = 80; // Click at radius 80 inside the wedge
            const px = 480 + radius * Math.cos(angle);
            const py = 220 + radius * Math.sin(angle);
            dbImage.emit('pointerdown', { worldX: px, worldY: py });
          }
        }
      }
    }, num);
    await dismissDialog(page);
  };

  // Helper to programmatically click keypad buttons in safe keypad view
  const clickKeypadButton = async (page, char) => {
    await page.evaluate((btnChar) => {
      const gameScene = window.__game.scene.keys.GameScene;
      if (gameScene && gameScene.zoomContainer) {
        if (btnChar === 'E') {
          // Click the submit handle/lever
          const handle = gameScene.zoomContainer.list.find(c => c.name === 'safe_handle');
          if (handle) {
            handle.emit('pointerdown');
          }
        } else {
          // We have a 4-dial safe now.
          // Map digits to dial indices: '1' -> dial 0, '7' -> dial 1, '5' -> dial 2, '9' -> dial 3
          const charMap = { '1': 0, '7': 1, '5': 2, '9': 3 };
          const dialIdx = charMap[btnChar];
          if (dialIdx !== undefined && gameScene.safeDials && gameScene.safeDials[dialIdx]) {
            const dial = gameScene.safeDials[dialIdx];
            const targetVal = parseInt(btnChar, 10);
            // Simulate clicking/interacting until value matches
            while (dial.value !== targetVal) {
              dial.emit('pointerdown');
            }
          }
        }
      }
    }, char);
  };


  test.beforeEach(async ({ page }) => {
    // Log console messages and errors from the browser
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    // Open the game page
    await page.goto('/');

    // Wait for the Main Menu Scene ready signal
    await page.waitForFunction(() => window.__mainMenuReady === true);
    
    // Click the start button
    await page.locator('canvas').click({ position: { x: 480, y: 330 } });
    
    // Wait for the Game Scene ready signal (meaning the scene started and start dialogue is active)
    await page.waitForFunction(() => window.__gameReady === true);

    // Dismiss the initial dialog using the direct helper
    await dismissDialog(page);
  });

  test('Test Case 1: Item Collection', async ({ page }) => {
    // 1. Click the Hammock in the North View (260, 290)
    await page.locator('canvas').click({ position: { x: 260, y: 290 } });
    
    // Expected: Dialogue box displays: "Underneath the pillow, you find a sheet of paper."
    let dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('Underneath the pillow, you find a sheet of paper.');
    
    // Expected: origami_paper is added to the inventory
    let inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory).toContain('origami_paper');

    // Dismiss the dialog
    await dismissDialog(page);

    // 2. Click the Hammock again
    await page.locator('canvas').click({ position: { x: 260, y: 290 } });
    
    // Expected: Dialogue box displays: "A comfortable hammock. There's nothing else under the pillow."
    dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe("A comfortable hammock. There's nothing else under the pillow.");
    
    // Expected: No duplicate items are added
    inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory.filter(item => item === 'origami_paper').length).toBe(1);

    // Dismiss the dialog
    await dismissDialog(page);

    // 3. Click the Bookshelf in the North View (860, 180)
    await page.locator('canvas').click({ position: { x: 860, y: 180 } });
    
    // Expected: Dialogue box displays: "You found an Origami book."
    dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('You found an Origami book.');
    
    // Expected: origami_book is added to the inventory
    inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory).toContain('origami_book');

    // Dismiss the dialog
    await dismissDialog(page);

    // 4. Click the Bookshelf again
    await page.locator('canvas').click({ position: { x: 860, y: 180 } });
    
    // Expected: Dialogue box displays: "Various novels and guides."
    dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('Various novels and guides.');
    
    // Expected: No duplicate items are added
    inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory.filter(item => item === 'origami_book').length).toBe(1);
  });

  test('Test Case 2: Origami Folding', async ({ page }) => {
    // First, collect the paper and the book
    await page.locator('canvas').click({ position: { x: 260, y: 290 } }); // Hammock
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 860, y: 180 } }); // Bookshelf
    await dismissDialog(page);

    // 1. Click the Origami Book in the inventory.
    await page.locator('canvas').click({ position: { x: 200, y: 490 } });

    // Expected: The Book Zoom View opens.
    await page.waitForFunction(() => window.__gameState.zoomView === 'origami_book');

    // 2. Click the Origami Paper in the inventory while the Book Zoom View is open.
    await page.locator('canvas').click({ position: { x: 120, y: 490 } });

    // Expected: The origami_paper slot is highlighted (selected)
    await page.waitForFunction(() => window.__gameState.selectedItem === 'origami_paper');

    // 3. Click on the folding zone (605, 210)
    await page.locator('canvas').click({ position: { x: 605, y: 210 } });

    // Expected: The zoom view transitions to show the Paper Airplane zoom view
    await page.waitForFunction(() => window.__gameState.zoomView === 'paper_airplane');

    // Expected: The items are swapped in inventory
    let inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory).not.toContain('origami_paper');
    expect(inventory).not.toContain('origami_book');
    expect(inventory).toContain('paper_airplane');

    // Dismiss the dialog that appears upon folding
    await dismissDialog(page);

    // 4. Close the zoom view (900, 30)
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);
  });

  test('Test Case 3: Dartboard & Safe Puzzle', async ({ page }) => {
    // Prep: Fold the paper airplane
    await page.locator('canvas').click({ position: { x: 260, y: 290 } }); // Hammock
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 860, y: 180 } }); // Bookshelf
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 200, y: 490 } }); // Open book
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // Select paper
    await page.locator('canvas').click({ position: { x: 605, y: 210 } }); // Fold
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });  // Close zoom view
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // Navigate to South View
    await page.locator('canvas').click({ position: { x: 920, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'east');
    await page.locator('canvas').click({ position: { x: 920, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'south');

    // Solve dartboard
    await page.locator('canvas').click({ position: { x: 366, y: 171 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'dartboard');
    await page.waitForTimeout(200);

    // Click using programmatic event emitters
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 20);
    await clickDartboardNumber(page, 10);

    // Expected: zoomView transitions to safe_view, dartboard solved
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');
    let solved = await page.evaluate(() => window.__gameState.solvedPuzzles.includes ? window.__gameState.solvedPuzzles.includes('dartboard_solved') : new Set(window.__gameState.solvedPuzzles).has('dartboard_solved'));
    expect(solved).toBe(true);

    // Close zoom view to navigate to East View
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // 1. Collect Binoculars from East Window Sill (go to East View first)
    await page.locator('canvas').click({ position: { x: 40, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'east');
    await page.locator('canvas').click({ position: { x: 592, y: 282 } });
    await dismissDialog(page);
    let inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory).toContain('binoculars');

    // 2. Collect Trees Book from East Top-Left Wall (already in East View)
    await page.locator('canvas').click({ position: { x: 75, y: 85 } });
    await dismissDialog(page);
    inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory).toContain('trees_book');

    // Go back to South View
    await page.locator('canvas').click({ position: { x: 920, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'south');

    // 3. Inspect South Window (715, 190)
    await page.locator('canvas').click({ position: { x: 715, y: 190 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'south_window_zoom');

    // Try clicking Oak tree (left) without binoculars
    await clickTree(page, 'left');
    let dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('A leafy tree standing in the middle of the canopy.');
    await dismissDialog(page);

    // Select Binoculars
    await selectBinoculars(page);

    // Click Oak Tree with binoculars
    await clickTree(page, 'left');
    await page.waitForFunction(() => window.__gameState.zoomView === 'oak_leaf_zoom');
    await page.locator('canvas').click({ position: { x: 900, y: 30 } }); // Close oak zoom
    await page.waitForFunction(() => window.__gameState.zoomView === 'south_window_zoom');

    // Select Binoculars and click Pine tree
    await selectBinoculars(page);
    await clickTree(page, 'center');
    await page.waitForFunction(() => window.__gameState.zoomView === 'white_pine_zoom');
    await page.locator('canvas').click({ position: { x: 900, y: 30 } }); // Close pine zoom
    await page.waitForFunction(() => window.__gameState.zoomView === 'south_window_zoom');

    // Select Binoculars and click Maple tree
    await selectBinoculars(page);
    await clickTree(page, 'right');
    await page.waitForFunction(() => window.__gameState.zoomView === 'sugar_maple_zoom');
    await page.locator('canvas').click({ position: { x: 900, y: 30 } }); // Close maple zoom
    await page.waitForFunction(() => window.__gameState.zoomView === 'south_window_zoom');

    // Close South Window zoom view
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // 4. Open Trees Book from inventory slot 1 (200, 490)
    await page.locator('canvas').click({ position: { x: 200, y: 490 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'trees_book');
    await page.locator('canvas').click({ position: { x: 900, y: 30 } }); // Close book zoom
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // 5. Open Safe Keypad (366, 171)
    await page.locator('canvas').click({ position: { x: 366, y: 171 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');

    // Click keypad buttons programmatically: 1 -> 7 -> 5 -> 9
    await clickKeypadButton(page, '1');
    await clickKeypadButton(page, '7');
    await clickKeypadButton(page, '5');
    await clickKeypadButton(page, '9');

    // Dismiss safe unlocked dialog (displays after 200ms tween completes)
    await page.waitForFunction(() => window.__gameState.dialogActive === true);
    await dismissDialog(page);

    // Close zoom view manually
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    let safeUnlocked = await page.evaluate(() => window.__gameState.solvedPuzzles.includes ? window.__gameState.solvedPuzzles.includes('safe_unlocked') : new Set(window.__gameState.solvedPuzzles).has('safe_unlocked'));
    expect(safeUnlocked).toBe(true);

    inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory).toContain('rusty_key');

    const hasKey = await page.evaluate(() => window.__gameState.hasKeyInCompartment);
    expect(hasKey).toBe(false);

    // 6. Click open safe to verify it is empty and opens the safe view
    await page.locator('canvas').click({ position: { x: 366, y: 171 } });
    const emptyDialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(emptyDialogText).toBe("The unlocked safe is empty.");
    await dismissDialog(page);

    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');
  });

  test('Test Case 3b: Dartboard Input Lock & Reset', async ({ page }) => {
    // Navigate to South View
    await page.locator('canvas').click({ position: { x: 920, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'east');
    await page.locator('canvas').click({ position: { x: 920, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'south');

    // Open dartboard
    await page.locator('canvas').click({ position: { x: 366, y: 171 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'dartboard');
    await page.waitForTimeout(200);

    // Verify initially no darts thrown
    let initialDartsCount = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene && gameScene.thrownDarts ? gameScene.thrownDarts.length : -1;
    });
    expect(initialDartsCount).toBe(0);

    // Throw three incorrect darts
    await clickDartboardNumber(page, 5);
    await clickDartboardNumber(page, 5);
    await clickDartboardNumber(page, 5);

    // Verify 3 darts are visible on the board
    let midDartsCount = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene && gameScene.thrownDarts ? gameScene.thrownDarts.length : -1;
    });
    expect(midDartsCount).toBe(3);

    // Verify sequence has 3 items
    let midSeqLength = await page.evaluate(() => window.__gameState.dartboardSequence.length);
    expect(midSeqLength).toBe(3);

    // Immediately click a 4th number and verify it is BLOCKED
    await clickDartboardNumber(page, 10);

    let blockedSeqLength = await page.evaluate(() => window.__gameState.dartboardSequence.length);
    expect(blockedSeqLength).toBe(3);

    let blockedDartsCount = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene && gameScene.thrownDarts ? gameScene.thrownDarts.length : -1;
    });
    expect(blockedDartsCount).toBe(3);

    // Wait for the 0.5 seconds delay to complete (waitForFunction keeps requestAnimationFrame ticking in headless browser)
    await page.waitForFunction(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene && gameScene.thrownDarts && gameScene.thrownDarts.length === 0;
    });

    // Verify darts are cleared and sequence is reset
    let finalDartsCount = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene && gameScene.thrownDarts ? gameScene.thrownDarts.length : -1;
    });
    expect(finalDartsCount).toBe(0);

    let finalSeqLength = await page.evaluate(() => window.__gameState.dartboardSequence.length);
    expect(finalSeqLength).toBe(0);

    // Verify input is unlocked
    await clickDartboardNumber(page, 13);
    let afterUnlockDartsCount = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene && gameScene.thrownDarts ? gameScene.thrownDarts.length : -1;
    });
    expect(afterUnlockDartsCount).toBe(1);
  });

  test('Test Case 4: Final Escape', async ({ page }) => {
    // Setup Origami
    await page.locator('canvas').click({ position: { x: 260, y: 290 } }); // Hammock
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 860, y: 180 } }); // Bookshelf
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 200, y: 490 } }); // Open book
    await page.locator('canvas').click({ position: { x: 120, y: 490 } }); // Select paper
    await page.locator('canvas').click({ position: { x: 605, y: 210 } }); // Fold
    await dismissDialog(page);
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });  // Close zoom view
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // Navigate to South View
    await page.locator('canvas').click({ position: { x: 920, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'east');
    await page.locator('canvas').click({ position: { x: 920, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'south');

    // Solve dartboard
    await page.locator('canvas').click({ position: { x: 366, y: 171 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'dartboard');
    await page.waitForTimeout(200);

    // Solve dartboard programmatically
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 20);
    await clickDartboardNumber(page, 10);
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');
    // Close zoom view to navigate to East View
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // Collect Binoculars (go to East View)
    await page.locator('canvas').click({ position: { x: 40, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'east');
    await page.locator('canvas').click({ position: { x: 592, y: 282 } });
    await dismissDialog(page);

    // Collect Trees Book
    await page.locator('canvas').click({ position: { x: 75, y: 85 } });
    await dismissDialog(page);

    // Go back to South View
    await page.locator('canvas').click({ position: { x: 920, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'south');

    // Solve Safe
    await page.locator('canvas').click({ position: { x: 366, y: 171 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');
    
    // Click keypad buttons programmatically
    await clickKeypadButton(page, '1');
    await clickKeypadButton(page, '7');
    await clickKeypadButton(page, '5');
    await clickKeypadButton(page, '9');
    await page.waitForFunction(() => window.__gameState.dialogActive === true);
    await dismissDialog(page);

    // Close zoom view manually
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // Click the safe again after solving it to verify it opens the safe view
    await page.locator('canvas').click({ position: { x: 366, y: 171 } });
    await dismissDialog(page);
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_view');

    // Close zoom view again
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // 1. Click the Exit Door in the South View (185, 270) without selecting the key
    await page.locator('canvas').click({ position: { x: 185, y: 270 } });

    // Expected: Dialogue box displays: "The door is locked."
    let dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('The door is locked.');

    // Dismiss the dialog
    await dismissDialog(page);

    // 2. Select the Rusty Old Key in the inventory
    // Since binoculars (slot 0) and trees_book (slot 1) are still there, key is at slot 2 (280, 490)
    await page.locator('canvas').click({ position: { x: 280, y: 490 } });

    // Expected: Key slot is highlighted.
    let selectedItem = await page.evaluate(() => window.__gameState.selectedItem);
    expect(selectedItem).toBe('rusty_key');

    // 3. Click the Exit Door (185, 270)
    await page.locator('canvas').click({ position: { x: 185, y: 270 } });

    // Expected: heavy creak dialog
    dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('You have inserted the rusty old key into the lock. The door is now unlocked, click again to go through.');

    // Dismiss the dialog
    await dismissDialog(page);

    // 4. Click the Exit Door again (185, 270)
    await page.locator('canvas').click({ position: { x: 185, y: 270 } });

    // Expected: currentView is set to 'balcony'
    await page.waitForFunction(() => window.__gameState.currentView === 'balcony');

    // 5. Click the Zipline hotspot (530, 123)
    await page.locator('canvas').click({ position: { x: 530, y: 123 } });
    dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('A zipline overlooking the forest. It looks like a fast way down, but I need a harness to use it safely.');
    await dismissDialog(page);

    // 6. Click the pinned note on the wall (621, 186)
    await page.locator('canvas').click({ position: { x: 621, y: 186 } });

    // Expected: cipher_key is added to inventory, found_cipher_key is set, zoomView is cipher_key_zoom
    const hasCipherKey = await page.evaluate(() => window.__gameState.inventory.includes('cipher_key'));
    expect(hasCipherKey).toBe(true);

    const foundCipherKey = await page.evaluate(() => {
      const solved = window.__gameState.solvedPuzzles;
      return solved.includes ? solved.includes('found_cipher_key') : new Set(solved).has('found_cipher_key');
    });
    expect(foundCipherKey).toBe(true);

    await page.waitForFunction(() => window.__gameState.zoomView === 'cipher_key_zoom');

    dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('You take the pinned note from the wall. It appears to be a key for translating the strange symbols.');
    await dismissDialog(page);

    // 7. Close zoom view (900, 30)
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // 8. Inspect the Cipher Key in the inventory slot 2 (280, 490)
    await page.locator('canvas').click({ position: { x: 280, y: 490 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'cipher_key_zoom');

    // Close zoom view again
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // 9. Click the door on the balcony (781, 246) to go back inside
    await page.locator('canvas').click({ position: { x: 781, y: 246 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'south');
  });

  test('Test Case 5: Dialogue Blocking & Dismissal Behavior', async ({ page }) => {
    // Trigger dialogue by clicking the hammock (260, 290).
    await page.locator('canvas').click({ position: { x: 260, y: 290 } });

    // Verify dialogue is active and displaying the expected text.
    let isActive = await page.evaluate(() => window.__gameState.dialogActive);
    expect(isActive).toBe(true);
    let dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('Underneath the pillow, you find a sheet of paper.');

    // While dialogue is active, try clicking the hammock again (260, 290).
    // The dialog blocker should intercept the click, dismissing the dialogue.
    // It should NOT re-trigger the hammock's secondary description.
    await page.locator('canvas').click({ position: { x: 260, y: 290 } });

    // Verify dialogue is now dismissed.
    isActive = await page.evaluate(() => window.__gameState.dialogActive);
    expect(isActive).toBe(false);

    // Verify dialogue text hasn't changed to the secondary description, indicating the blocker worked.
    dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('Underneath the pillow, you find a sheet of paper.');

    // Now that dialogue is inactive, clicking the hammock again should trigger the secondary description.
    await page.locator('canvas').click({ position: { x: 260, y: 290 } });

    // Verify description dialogue is active.
    isActive = await page.evaluate(() => window.__gameState.dialogActive);
    expect(isActive).toBe(true);
    dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe("A comfortable hammock. There's nothing else under the pillow.");

    // Dismiss by clicking on a non-hotspot blank area of the room (500, 100).
    await page.locator('canvas').click({ position: { x: 500, y: 100 } });
    isActive = await page.evaluate(() => window.__gameState.dialogActive);
    expect(isActive).toBe(false);
  });

  test('Test Case 5b: Clue 1 Collection & Inspection', async ({ page }) => {
    // Rotate to East View
    await page.locator('canvas').click({ position: { x: 920, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'east');
    await page.waitForTimeout(300);

    // Click the painting (195, 164) to find the clue
    await page.locator('canvas').click({ position: { x: 195, y: 164 } });

    // Verify dialogue is active and clue_1 added to inventory
    let isActive = await page.evaluate(() => window.__gameState.dialogActive);
    expect(isActive).toBe(true);
    let dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('You find a torn slip of paper with strange markings.');

    // Dismiss dialogue
    await page.locator('canvas').click({ position: { x: 500, y: 100 } });
    isActive = await page.evaluate(() => window.__gameState.dialogActive);
    expect(isActive).toBe(false);

    // Verify inventory has clue_1
    const hasClue1 = await page.evaluate(() => window.__gameState.inventory.includes('clue_1'));
    expect(hasClue1).toBe(true);

    // Click the clue_1 slot in inventory to inspect (select then inspect)
    const clueIndex = await page.evaluate(() => window.__gameState.inventory.indexOf('clue_1'));
    const slotX = 120 + clueIndex * 80;
    const slotY = 490;

    await page.locator('canvas').click({ position: { x: slotX, y: slotY } });
    await page.locator('canvas').click({ position: { x: slotX, y: slotY } });

    // Verify zoomView is clue_1_zoom
    await page.waitForFunction(() => window.__gameState.zoomView === 'clue_1_zoom');

    // Close zoom view
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);
  });

  test('Test Case 5c: Clues 2, 3, and 4 Collection & Inspection', async ({ page }) => {
    // 1. East View: mattress is at (822, 321)
    await page.evaluate(() => window.__stateManager.setView('east'));
    await page.waitForFunction(() => window.__gameState.currentView === 'east');
    await page.waitForTimeout(300);

    // Click mattress to get clue 2
    await page.locator('canvas').click({ position: { x: 822, y: 321 } });
    await page.locator('canvas').click({ position: { x: 500, y: 100 } }); // dismiss dialogue

    const hasClue2 = await page.evaluate(() => window.__gameState.inventory.includes('clue_2'));
    expect(hasClue2).toBe(true);

    // Inspect clue 2
    const clue2Idx = await page.evaluate(() => window.__gameState.inventory.indexOf('clue_2'));
    const slot2X = 120 + clue2Idx * 80;
    await page.locator('canvas').click({ position: { x: slot2X, y: 490 } });
    await page.locator('canvas').click({ position: { x: slot2X, y: 490 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'clue_2_zoom');
    await page.locator('canvas').click({ position: { x: 900, y: 30 } }); // close

    // 2. South View: desk is at (780, 355)
    await page.locator('canvas').click({ position: { x: 920, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'south');
    await page.waitForTimeout(300);

    // Click desk to get clue 3
    await page.locator('canvas').click({ position: { x: 780, y: 355 } });
    await page.locator('canvas').click({ position: { x: 500, y: 100 } }); // dismiss dialogue

    const hasClue3 = await page.evaluate(() => window.__gameState.inventory.includes('clue_3'));
    expect(hasClue3).toBe(true);

    // Inspect clue 3
    const clue3Idx = await page.evaluate(() => window.__gameState.inventory.indexOf('clue_3'));
    const slot3X = 120 + clue3Idx * 80;
    await page.locator('canvas').click({ position: { x: slot3X, y: 490 } });
    await page.locator('canvas').click({ position: { x: slot3X, y: 490 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'clue_3_zoom');
    await page.locator('canvas').click({ position: { x: 900, y: 30 } }); // close

    // 3. North View: books stack is at (464, 340)
    await page.locator('canvas').click({ position: { x: 920, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'north');
    await page.waitForTimeout(300);

    // Click books stack to get clue 4
    await page.locator('canvas').click({ position: { x: 464, y: 340 } });
    await page.locator('canvas').click({ position: { x: 500, y: 100 } }); // dismiss dialogue

    const hasClue4 = await page.evaluate(() => window.__gameState.inventory.includes('clue_4'));
    expect(hasClue4).toBe(true);

    // Inspect clue 4
    const clue4Idx = await page.evaluate(() => window.__gameState.inventory.indexOf('clue_4'));
    const slot4X = 120 + clue4Idx * 80;
    await page.locator('canvas').click({ position: { x: slot4X, y: 490 } });
    await page.locator('canvas').click({ position: { x: slot4X, y: 490 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'clue_4_zoom');
    await page.locator('canvas').click({ position: { x: 900, y: 30 } }); // close
  });

  test('Test Case 6: Lamp Puzzle Toggling & Solving', async ({ page }) => {
    // 1. Open the North Lamp zoom view in the North View (440, 57)
    await page.locator('canvas').click({ position: { x: 440, y: 57 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'triangle_lamp_zoom_view');

    // Verify it is North Lamp (Triangle)
    let titleText = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      const titleObj = gameScene.zoomContainer.list.find(c => c.text && c.text.includes('Lamp'));
      return titleObj ? titleObj.text : '';
    });
    expect(titleText).toContain('North Lamp (Triangle)');

    // Toggle North Lamp ON
    await page.locator('canvas').click({ position: { x: 480, y: 210 } });
    expect(await hasFlag(page, 'lamp_north_on')).toBe(true);

    // Toggle North Lamp OFF
    await page.locator('canvas').click({ position: { x: 480, y: 210 } });
    expect(await hasFlag(page, 'lamp_north_on')).toBe(false);

    // Toggle North Lamp ON again
    await page.locator('canvas').click({ position: { x: 480, y: 210 } });
    expect(await hasFlag(page, 'lamp_north_on')).toBe(true);

    // Close zoom view
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // 2. Rotate to East View
    await page.locator('canvas').click({ position: { x: 920, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'east');

    // Open East Lamp zoom view (42, 292)
    await page.locator('canvas').click({ position: { x: 42, y: 292 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'circle_lamp_zoom_view');

    // Toggle East Lamp ON
    await page.locator('canvas').click({ position: { x: 480, y: 210 } });
    expect(await hasFlag(page, 'lamp_east_on')).toBe(true);

    // Toggle East Lamp OFF (it must be OFF to solve the puzzle)
    await page.locator('canvas').click({ position: { x: 480, y: 210 } });
    expect(await hasFlag(page, 'lamp_east_on')).toBe(false);

    // Close zoom view
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // 3. Rotate to South View
    await page.locator('canvas').click({ position: { x: 920, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'south');

    // Open South Lamp zoom view (495, 66)
    await page.locator('canvas').click({ position: { x: 495, y: 66 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'cross_lamp_zoom_view');

    // Toggle South Lamp ON
    await page.locator('canvas').click({ position: { x: 480, y: 210 } });
    expect(await hasFlag(page, 'lamp_south_on')).toBe(true);

    // Close zoom view
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // 4. Force state transition to Balcony View
    await page.evaluate(() => {
      const stateManager = window.__stateManager;
      stateManager.setFlag('door_unlocked');
      stateManager.setView('balcony');
    });
    await page.waitForFunction(() => window.__gameState.currentView === 'balcony');

    // Open Balcony Lamp zoom view (904, 291)
    await page.locator('canvas').click({ position: { x: 904, y: 291 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'spiral_lamp_zoom_view');

    // Toggle Balcony Lamp ON -> Should solve the puzzle
    await page.locator('canvas').click({ position: { x: 480, y: 210 } });

    // Verify puzzle solved
    expect(await hasFlag(page, 'lamp_puzzle_solved')).toBe(true);

    // Verify brass key in inventory
    let inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory).toContain('brass_key');

    // Verify dialog displayed
    let dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('A hidden compartment in the bottom of the lamp popped open and revealed a brass key! It has been added to your inventory.');

    // Dismiss dialog
    await dismissDialog(page);

    // Close zoom view
    await page.locator('canvas').click({ position: { x: 900, y: 30 } });
    await page.waitForFunction(() => window.__gameState.zoomView === null);
  });

  test('Test Case 7: Hotspot Debug Mode Toggle', async ({ page }) => {
    // Check initial state: debugModeActive should be false
    let isDebugActive = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene ? gameScene.debugModeActive : null;
    });
    expect(isDebugActive).toBe(false);

    // Verify debug button is present
    const debugBtn = page.locator('#toggle-debug-btn');
    await expect(debugBtn).toBeVisible();
    await expect(debugBtn).not.toHaveClass(/active/);

    // Click toggle button
    await debugBtn.click();

    // Verify debugModeActive is true
    isDebugActive = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene ? gameScene.debugModeActive : null;
    });
    expect(isDebugActive).toBe(true);
    await expect(debugBtn).toHaveClass(/active/);

    // Verify visual labels are rendered in the scene
    let textLabelsCount = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene && gameScene.hotspots ? gameScene.hotspots.getChildren().filter(c => c.text !== undefined).length : -1;
    });
    // Hammock, Bookshelves, North Lamp, Trunk, Books Stack should all have text labels
    expect(textLabelsCount).toBe(5);

    // Click toggle button again
    await debugBtn.click();

    // Verify debugModeActive is false
    isDebugActive = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene ? gameScene.debugModeActive : null;
    });
    expect(isDebugActive).toBe(false);
    await expect(debugBtn).not.toHaveClass(/active/);

    // Verify labels are destroyed
    textLabelsCount = await page.evaluate(() => {
      const gameScene = window.__game.scene.keys.GameScene;
      return gameScene && gameScene.hotspots ? gameScene.hotspots.getChildren().filter(c => c.text !== undefined).length : -1;
    });
    expect(textLabelsCount).toBe(0);
  });

});
