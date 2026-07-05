# Handoff Report — 2026-07-05T14:14:40-04:00

## 1. Observation
- **Unit Tests result**:
  ```
  RUN  v1.6.1 /home/moltmans/escape-the-treehouse
  ✓ tests/engine.test.js (4)
     ✓ Escape Room Headless Core Engine (4)
  Test Files  1 passed (1)
  Tests  4 passed (4)
  ```
- **E2E Tests result**:
  ```
  2 failed
    [chromium] › tests/escape.spec.js:219:3 › Escape the Treehouse E2E Tests › Test Case 3: Dartboard & Safe Puzzle 
    [chromium] › tests/escape.spec.js:426:3 › Escape the Treehouse E2E Tests › Test Case 4: Final Escape 
  4 passed (1.8m)
  ```
- **Verbatim Error in Test Case 3**:
  ```
  Error: page.waitForFunction: Test timeout of 30000ms exceeded.
    304 |     await page.waitForFunction(() => window.__gameState.zoomView === 'sugar_maple_zoom');
    305 |     await page.locator('canvas').click({ position: { x: 900, y: 30 } }); // Close maple zoom
  > 306 |     await page.waitForFunction(() => window.__gameState.zoomView === 'south_window_zoom');
        |                ^
  ```
- **Verbatim Error in Test Case 4**:
  ```
  Error: locator.click: Test timeout of 30000ms exceeded.
    465 |     // Collect Trees Book
  > 466 |     await page.locator('canvas').click({ position: { x: 75, y: 85 } });
        |                                  ^
  ```
- **Browser Performance Stalls in E2E Logs**:
  ```
  BROWSER LOG: [.WebGL-0x3c0014a200]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
  ```
- **Visual vs. State Transitions in `src/main.js`**:
  - `rotateRoom(direction)` (lines 333-349):
    ```javascript
    stateManager.setView(views[index]); // Updates state instantly
    this.cameras.main.fadeOut(150, 18, 14, 10);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      ...
      this.updateHotspots(); // Spawns interactive hotspots after 150ms
    });
    ```
- **Minigame Cleanups**:
  - `SafeDialsMinigame.js` (lines 160-173):
    ```javascript
    onDestroy() {
      this.tweens.forEach(tw => { if (tw && tw.remove) tw.remove(); });
      this.tweens = [];
      this.elements.forEach(el => { if (el && el.destroy) el.destroy(); });
      ...
    ```
  - `DartboardMinigame.js` (lines 88-102):
    ```javascript
    onDestroy() {
      if (this.checkTimer) { this.checkTimer.remove(); this.checkTimer = null; }
      this.elements.forEach(el => { if (el && el.destroy) el.destroy(); });
      ...
    ```

---

## 2. Logic Chain
1. The game state is updated instantly in `rotateRoom()` using `stateManager.setView(...)`, meaning `window.__gameState.currentView` updates instantly.
2. The E2E tests wait for `window.__gameState.currentView` to match the target view, and then immediately execute `click` events on the canvas targeting coordinates of hotspots in that view.
3. However, `rotateRoom()` defers calling `updateHotspots()` (which updates the interactive shapes on the canvas) until after the camera's `fadeOut` animation completes (150ms).
4. In a headless environment with hardware acceleration disabled, software WebGL emulation triggers GPU stalls (`GPU stall due to ReadPixels`), causing the 150ms Phaser camera transition to block/slow down the frame budget.
5. As a result, the E2E clicks land before `updateHotspots()` has executed for the new view. The click fails to activate the intended interaction (such as picking up binoculars or the trees book), stalling the test sequence.
6. The test runner spends its remaining time waiting for expected state changes or element visibility, ultimately exceeding the 30-second Playwright timeout.
7. Unit tests pass because they verify the decoupled headless engine (`StateManager` and `Interpreter`) which does not rely on visual/render loops.
8. The minigame files under `src/game/minigames/` are properly designed and release all resources (including active tweens, delayed timers, and graphic components) in their `onDestroy()` methods, preventing leaks.

---

## 3. Caveats
- No real-user testing with hardware-accelerated browsers was conducted (only headless Playwright runs).
- Testing was restricted to the `npm run test:e2e` configuration as defined in `package.json` and `playwright.config.js`.

---

## 4. Conclusion
The refactored minigames correctly clean up all assets, graphics, and timers on destruction. However, there is a design discrepancy between visual updates (hotspots updated after a 150ms fade-out) and state updates (view state changes instantly). In slow/headless WebGL emulation, this causes a race condition that makes E2E tests fail due to timeouts.

---

## 5. Verification Method
- **Core Unit Verification**: Run `npm run test:unit`. All 4 tests must pass.
- **E2E Verification**: Run `npm run test:e2e` to verify the timeouts.
- **Check files**: Inspect `src/game/minigames/DartboardMinigame.js` (lines 88-102) and `src/game/minigames/SafeDialsMinigame.js` (lines 160-173) to verify that timers and tweens are stopped on exit.
