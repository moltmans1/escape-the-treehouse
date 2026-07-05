## Challenge Summary

**Overall risk assessment**: MEDIUM

While the minigame classes themselves are structurally sound and clean up after themselves correctly, there are issues involving state synchronization and performance stalls that cause automated E2E tests to fail.

---

## Challenges

### [Medium] Challenge 1: Game State vs Hotspot Synchronization Race Condition

- **Assumption challenged**: The E2E tests assume that as soon as `window.__gameState.currentView` is updated to a new view, the corresponding hotspots are immediately interactive on the screen.
- **Attack scenario**: 
  1. The user clicks a navigation arrow.
  2. In `rotateRoom(direction)`:
     - `stateManager.setView(...)` is called synchronously, which immediately updates the global game state `currentView`.
     - `this.cameras.main.fadeOut(150, ...)` is called.
     - `this.updateHotspots()` is only called asynchronously in the `camerafadeoutcomplete` event listener (after 150ms).
  3. Playwright E2E tests observe the state change (`currentView === 'east'`) and instantly attempt to click on the new view's hotspots (e.g., collecting binoculars at `(605, 260)`).
  4. Because the transition is still active and `updateHotspots()` has not run, the click hits the old view's hotspots (or nothing).
  5. The item is not collected, the subsequent steps block, and the test times out.
- **Blast radius**: E2E test suites timeout and fail. Real users with rapid-click tools might also trigger hotspots on the wrong screen if clicking during the 150ms fade transition.
- **Mitigation**:
  - Update the interactive hotspots *synchronously* inside `rotateRoom()` when the state is set, rather than waiting for the fade-out completion, OR
  - Explicitly block all interaction (using an overlay or input disable) during the camera transition, and have tests wait for the transition to finish.

### [Low] Challenge 2: Headless WebGL Performance Stalls

- **Assumption challenged**: A 30,000ms test timeout is sufficient to run point-and-click sequences in a headless test runner.
- **Attack scenario**: 
  1. Phaser is initialized with `type: Phaser.AUTO`, which defaults to WebGL.
  2. Running Playwright in a headless environment without GPU acceleration causes WebGL emulation, resulting in severe GPU stalls (e.g., `GPU stall due to ReadPixels` warnings in browser logs).
  3. Frame rate drops significantly, causing game-time animations/tweens (like camera transitions and card fades) to consume significant real-world time.
  4. The cumulative delay across a multi-step test (like Test Case 3 and 4) exceeds the 30-second Playwright timeout.
- **Blast radius**: Intermittent or consistent E2E test failures on headless CI/CD runners.
- **Mitigation**: 
  - Change Phaser's renderer type to `Phaser.CANVAS` during test runs (e.g. via a URL query parameter `?canvas=true` or an environment flag).
  - Increase the Playwright test timeout or configure Chromium with custom flags to optimize headless GL rendering.

---

## Stress Test Results

- **Unit Tests Execution** → `npm run test:unit` → All 4 core engine tests passed successfully (0.3s) → **PASS**
- **E2E Tests Execution** → `npm run test:e2e` → 4 tests passed, 2 timed out (`Test Case 3: Dartboard & Safe Puzzle` and `Test Case 4: Final Escape`) due to the transition race condition and GPU stalls → **FAIL**
- **Safe Dials Rapid Clicking** → Click dials continuously while tweens are active or before they complete → Click interactions are immediately disabled upon solving, preventing duplicate solves. `onDestroy` halts active tweens safely → **PASS**
- **Dartboard Exiting Mid-Timer** → Exit Dartboard zoom view while the 500ms sequence check timer is active → `onDestroy` successfully removes the timer using `checkTimer.remove()`, preventing memory leaks and errors → **PASS**
- **Origami Book Rapid Clicking** → Rapidly click the fold zone in the book view → Synchronous view transition destroys the old minigame and `foldZone` hotspot instantly on the first click, preventing double triggers → **PASS**
