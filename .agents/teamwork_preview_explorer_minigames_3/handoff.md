# Handoff Report: Minigames Refactoring Design

## 1. Observation
We directly observed the following files and details in the codebase:
- In `src/main.js`:
  - **Origami minigame logic** (lines 671-771): Defines methods `inspectOrigamiPaper()`, `inspectOrigamiBook()`, and `inspectPaperAirplane()` which manually render the sheet of paper with numbers, the open book guide with folding collision zone, and the folded paper airplane clue respectively.
  - **Dartboard minigame logic** (lines 773-843): Defines `enterDartboardView()` which renders the interactive dartboard, processes pointer coordinates, creates a transparent dart texture canvas, tracks thrown darts in `this.thrownDarts`, checks combinations against target sequences using `this.time.delayedCall(500, ...)`, and executes onSuccess actions.
  - **Safe dials minigame logic** (lines 942-1076): Defines `enterSafeView()` which renders the dial combination safe, handles pointer events to rotate the digits, tracks the active dial array in `this.safeDials`, runs tweens for safe-opening transitions, and executes onSuccess actions.
  - **Binoculars minigame logic** (lines 853-941): Defines `inspectSouthWindow()` and `inspectTreeBranch()` which render the south window layout, define interactive hotspots for three canopy trees, and present zoom views of specific leaf structures.
- In `src/game/treehouse.config.js`:
  - Defines the minigames configurations (lines 188-207):
    ```javascript
    minigames: {
      dartboard_view: {
        type: "sequential_sequence",
        target: [13, 20, 10],
        onSuccess: [
          "SET_FLAG: dartboard_solved",
          "REMOVE_INVENTORY: paper_airplane",
          "OPEN_ZOOM_VIEW: safe_view"
        ]
      },
      safe_view: {
        type: "thumb_wheels",
        combination: "1759",
        onSuccess: [
          "SET_FLAG: safe_unlocked",
          "REFRESH_GRAPHICS",
          "SHOW_DIALOG: With a heavy mechanical click, the safe swings open, revealing a Rusty Old Key inside! The Rusty Old Key has been added to your inventory."
        ]
      }
    }
    ```
- In `tests/escape.spec.js`:
  - Specific assertions query the global game state proxy object (`window.__gameState`) to ensure E2E compatibility:
    - Line 191: `await page.waitForFunction(() => window.__gameState.zoomView === 'origami_book');`
    - Line 386: `let midSeqLength = await page.evaluate(() => window.__gameState.dartboardSequence.length);`

## 2. Logic Chain
1. Since the four minigames (Origami, Dartboard, Safe Dials, and Binoculars) are currently implemented entirely as inline methods inside `src/main.js`, they pollute the main `GameScene` class definition with local temporary variables (`thrownDarts`, `dartboardInputLocked`, `safeDials`) and custom view-specific drawing functions.
2. In order to cleanly isolate and modularize these minigames, we can extract them into separate classes inside `src/game/minigames/` implementing standard lifecycle methods: `onCreate(scene, container)` for setup, and `onDestroy()` for teardown.
3. Memory leaks are a significant risk when creating objects dynamically in Phaser 3. Therefore, `onDestroy()` must explicitly cancel active timers (like `this.checkTimer` in Dartboard), stop active tweens (like success transitions in Safe Dials), destroy interactive shapes/text instances, and clean up temporary textures.
4. E2E tests query `window.__gameState` for zoom states (e.g. `'origami_book'`, `'safe_view'`) and sequences (e.g. `dartboardSequence`). To keep these tests passing without changes, the minigame classes must still update the global state variables on the scene (such as `scene.gameState.dartboardSequence` and setting zoom views using `scene.stateManager.setZoomView()`).
5. By making the refactored minigame classes call `scene.stateManager.executeActions(actions)` to execute game state transitions (such as adding/removing inventory items, unlocking safe flags, etc.), we preserve the decoupled architecture of the game engine.

## 3. Caveats
- We assumed that `window.__gameState` delegates directly to the scene state, which was verified in `src/main.js` (line 11).
- We did not investigate modifying the actual E2E test files because they are outside of the task scope (which is read-only analysis and design).
- We assume that canvas textures created in `BootScene` (like `'dart_transparent'` and `'arrow'`) are safe to persist across the lifecycle of GameScene zoom views and do not need to be destroyed/recreated on every zoom entry.

## 4. Conclusion
We propose a complete modular design that extracts Origami, Dartboard, Safe Dials, and Binoculars into separate classes inside `src/game/minigames/` implementing the `onCreate` and `onDestroy` lifecycle methods. This refactoring will isolate local state pollution, ensure memory safety through explicit teardown of Phaser objects/timers/tweens, preserve engine state decoupling via stateManager action triggers, and remain 100% compatible with existing E2E/unit tests.

## 5. Verification Method
To verify that this refactoring is correct and does not introduce regressions:
1. After implementing the proposed classes under `src/game/minigames/` and updating `src/main.js` to integrate them:
   - Run the headless unit tests:
     ```bash
     npm run test:unit
     ```
   - Run the E2E integration tests:
     ```bash
     npm run test:e2e
     ```
2. The verification passes if both test suites run to completion without any errors or failures.
