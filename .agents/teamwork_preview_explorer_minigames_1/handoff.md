# Handoff Report: Minigames Refactoring Design

## 1. Observation
The following configurations and code segments were directly observed in the codebase:
1. **Minigame Configs** in `src/game/treehouse.config.js`:
   * Lines 188-207:
     ```javascript
     minigames: {
       dartboard_view: {
         type: "sequential_sequence",
         target: [13, 20, 10],
         onSuccess: [ ... ]
       },
       safe_view: {
         type: "thumb_wheels",
         combination: "1759",
         onSuccess: [ ... ]
       }
     }
     ```
2. **Minigame Drawing and Event Handling** in `src/main.js`:
   * Lines 671-771: Origami view methods (`inspectOrigamiPaper()`, `inspectOrigamiBook()`, `inspectPaperAirplane()`).
   * Lines 773-842: Dartboard view method (`enterDartboardView()`) including coordinates-to-wedge math on lines 809-816.
   * Lines 853-940: Binoculars view methods (`inspectSouthWindow()`, `inspectTreeBranch()`).
   * Lines 942-1076: Safe dial rendering and combination checking (`enterSafeView()`).
3. **Integration Test Dependencies** in `tests/escape.spec.js`:
   * Lines 90-91: Accesses `gameScene.safeDials[dialIdx]` to programmatically rotate safe wheels.
   * Lines 369, 381, 397: Accesses `gameScene.thrownDarts.length` to evaluate visual darts thrown.
   * Lines 386, 392, 414: Accesses `window.__gameState.dartboardSequence.length` to check dart sequence lengths.
4. **E2E Baseline Execution**:
   * Executed `npm run test:e2e` (Task ID: `task-31`) which completed successfully:
     ```text
     Running 6 tests using 1 worker
     ...
     ✓  6 passed (45.8s)
     ```

## 2. Logic Chain
1. Moving the four minigames into modular classes (`OrigamiMinigame`, `DartboardMinigame`, `SafeDialsMinigame`, `BinocularsMinigame`) under `src/game/minigames/` will decouple drawing and event handling from `GameScene` (supported by observations of monolithic functions in `src/main.js`).
2. Adopting `onCreate(scene, container)` and `onDestroy()` lifecycle methods enables `GameScene` to interact with all zoom views uniformly using a class resolver mapping (configured in `MINIGAME_CLASSES`), deleting around 350 lines of specific scene code.
3. Incorporating action execution via `scene.stateManager.executeActions(actions)` keeps state mutations centralized in the engine interpreter, ensuring minigames do not directly run side-effects.
4. To prevent integration test breakages, the minigame classes must synchronize their internal state references (`safeDials`, `thrownDarts`, `dartboardSequence`) with `GameScene` and `window.__gameState` (supported by the observation that Playwright tests evaluate these exact properties on the scene object).
5. Tweens and delayed callbacks must be tracked and stopped in `onDestroy()` to prevent memory leaks and exceptions when callbacks execute on destroyed visual nodes.

## 3. Caveats
* The static zoom view `trees_book` (`inspectTreesBook()`) is not an interactive minigame and was not refactored into a separate class, although a fallback handler in `enterZoomView` has been designed to support it without changes.
* Assumed the bundler/Vite supports ES6 modules correctly when compiling multiple files.

## 4. Conclusion
Extracting the four minigames into separate ES6 classes under `src/game/minigames/` is highly feasible. It will significantly improve clean code practices and structure without breaking the Playwright tests as long as reference variables (`safeDials`, `thrownDarts`, `dartboardSequence`) are preserved on the scene level.

## 5. Verification Method
1. Review the proposed class definitions and integration designs in:
   `/.agents/teamwork_preview_explorer_minigames_1/analysis.md`
2. Once implemented, verify changes by running the test suite:
   * Unit tests: `npm run test:unit`
   * Integration tests: `npm run test:e2e`
3. A successful run (6 tests passed) will invalidate any regression concerns.
