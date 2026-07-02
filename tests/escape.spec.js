import { test, expect } from '@playwright/test';

test.describe('Escape the Treehouse E2E Tests', () => {
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
        const rects = gameScene.zoomContainer.list.filter(c => c.width === 100 && c.height === 140);
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
        const child = gameScene.zoomContainer.list.find(c => c.text === numToClick.toString());
        if (child) {
          child.emit('pointerdown');
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
    
    // Expected: Dialogue box displays: "You search the bookshelves and find an Origami Guide."
    dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('You search the bookshelves and find an Origami Guide.');
    
    // Expected: origami_book is added to the inventory
    inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory).toContain('origami_book');

    // Dismiss the dialog
    await dismissDialog(page);

    // 4. Click the Bookshelf again
    await page.locator('canvas').click({ position: { x: 860, y: 180 } });
    
    // Expected: Dialogue box displays: "Various novels and guides about forest lore."
    dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('Various novels and guides about forest lore.');
    
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
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'dartboard');
    await page.waitForTimeout(200);

    // Click using programmatic event emitters
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 20);
    await clickDartboardNumber(page, 10);

    // Expected: zoomView closes, dartboard solved
    await page.waitForFunction(() => window.__gameState.zoomView === null);
    let solved = await page.evaluate(() => window.__gameState.solvedPuzzles.includes ? window.__gameState.solvedPuzzles.includes('dartboard_solved') : new Set(window.__gameState.solvedPuzzles).has('dartboard_solved'));
    expect(solved).toBe(true);

    // 1. Collect Binoculars from East Window Sill (go to East View first)
    await page.locator('canvas').click({ position: { x: 40, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'east');
    await page.locator('canvas').click({ position: { x: 605, y: 260 } });
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
    expect(dialogText).toBe('A tall deciduous tree with wide branches.');
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

    // 5. Open Safe Keypad (380, 205)
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_input');

    // Click keypad buttons programmatically: 1 -> 7 -> 5 -> 9 -> E
    await clickKeypadButton(page, '1');
    await clickKeypadButton(page, '7');
    await clickKeypadButton(page, '5');
    await clickKeypadButton(page, '9');
    await clickKeypadButton(page, 'E');

    // Expected: safe unlocked
    await page.waitForFunction(() => window.__gameState.zoomView === null);
    let safeUnlocked = await page.evaluate(() => window.__gameState.solvedPuzzles.includes ? window.__gameState.solvedPuzzles.includes('safe_unlocked') : new Set(window.__gameState.solvedPuzzles).has('safe_unlocked'));
    expect(safeUnlocked).toBe(true);

    // Dismiss safe unlocked dialog
    await dismissDialog(page);

    // 6. Click open safe to collect Rusty Old Key
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await dismissDialog(page);
    
    inventory = await page.evaluate(() => window.__gameState.inventory);
    expect(inventory).toContain('rusty_key');

    const hasKey = await page.evaluate(() => window.__gameState.hasKeyInCompartment);
    expect(hasKey).toBe(false);
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
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'dartboard');
    await page.waitForTimeout(200);

    // Solve dartboard programmatically
    await clickDartboardNumber(page, 13);
    await clickDartboardNumber(page, 20);
    await clickDartboardNumber(page, 10);
    await page.waitForFunction(() => window.__gameState.zoomView === null);

    // Collect Binoculars (go to East View)
    await page.locator('canvas').click({ position: { x: 40, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'east');
    await page.locator('canvas').click({ position: { x: 605, y: 260 } });
    await dismissDialog(page);

    // Collect Trees Book
    await page.locator('canvas').click({ position: { x: 75, y: 85 } });
    await dismissDialog(page);

    // Go back to South View
    await page.locator('canvas').click({ position: { x: 920, y: 220 } });
    await page.waitForFunction(() => window.__gameState.currentView === 'south');

    // Solve Safe
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await page.waitForFunction(() => window.__gameState.zoomView === 'safe_input');
    
    // Click keypad buttons programmatically
    await clickKeypadButton(page, '1');
    await clickKeypadButton(page, '7');
    await clickKeypadButton(page, '5');
    await clickKeypadButton(page, '9');
    await clickKeypadButton(page, 'E');
    await page.waitForFunction(() => window.__gameState.zoomView === null);
    await dismissDialog(page);

    // Collect key from open safe
    await page.locator('canvas').click({ position: { x: 380, y: 205 } });
    await dismissDialog(page);

    // 1. Click the Exit Door in the South View (185, 270) without selecting the key
    await page.locator('canvas').click({ position: { x: 185, y: 270 } });

    // Expected: Dialogue box displays: "The exit door is locked tight. The padlock is extremely old and rusty."
    let dialogText = await page.evaluate(() => window.__gameState.dialogText);
    expect(dialogText).toBe('The exit door is locked tight. The padlock is extremely old and rusty.');

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
    expect(dialogText).toBe('You insert the rusty old key into the padlock. With a heavy creak, the lock snaps open and the door swings open! Click again to exit.');

    // Dismiss the dialog
    await dismissDialog(page);

    // 4. Click the Exit Door again (185, 270)
    await page.locator('canvas').click({ position: { x: 185, y: 270 } });

    // Expected: The Victory Screen is shown (door_unlocked in solvedPuzzles)
    const doorUnlocked = await page.evaluate(() => window.__gameState.solvedPuzzles.includes ? window.__gameState.solvedPuzzles.includes('door_unlocked') : new Set(window.__gameState.solvedPuzzles).has('door_unlocked'));
    expect(doorUnlocked).toBe(true);
  });


});
