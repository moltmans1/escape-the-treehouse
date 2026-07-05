# Phase 4 E2E Test Planning & Hotspot Exploration Analysis

## Executive Summary
This analysis establishes the test-driven design and structural layout for running E2E Playwright tests on the Phase 4 features of **Escape the Treehouse**. By analyzing existing test paradigms, specification requirements, and layout geometries, we propose a precise layout of hotspots and zoom configurations, followed by a comprehensive specification of 93 E2E test cases across Tiers 1-4.

---

## 1. Analysis of Existing Playwright Tests (`tests/escape.spec.js`)
The existing Playwright test suite interactively drives the Phaser 3 rendering engine via standard coordinate clicks and verifies state transitions using window-level state variables.

### Helper Methods Used
1. **`hoverPosition(page, x, y)`**: Programmatically moves the mouse pointer relative to the 960x540 canvas area, calculating bounds dynamically to trigger hover highlights.
2. **`dismissDialog(page)`**: Evaluates game engine state directly, calling the Phaser scene method `hideDialog()` if active, and waiting for the state manager to synchronize (`dialogActive === false`). This speeds up E2E runs by bypassing UI transitions.
3. **`selectBinoculars(page)`**: Inspects `window.__gameState.selectedItem` and, if binoculars are not selected, clicks the slot coordinate `(120, 490)` to select them.
4. **`clickTree(page, side)`**: Selects left, center, or right tree rect components from `GameScene.zoomContainer` inside `south_window_zoom` and emits the `'pointerdown'` event.
5. **`clickDartboardNumber(page, num)`**: Calculates the angle of the dartboard number relative to the center and simulates a dart throw by emitting `'pointerdown'` with corresponding coordinates on the dartboard image.
6. **`clickKeypadButton(page, char)`**: For `E` submits the safe combination via the handle; for digits, rotates `GameScene.safeDials[idx]` until they match the target combination digit.
7. **`test.beforeEach` Hook**: Automatically handles setup by listening to console events, loading `/`, waiting for `window.__mainMenuReady` and `window.__gameReady`, clicking the start button, and dismissing the start dialog.

### Assertions Used
- **`expect(dialogText).toBe(expected)`**: Asserts the current overlay dialog text matches the specification.
- **`expect(inventory).toContain(item)` / `expect(inventory).not.toContain(item)`**: Verifies receipt or consumption of items (`origami_paper`, `origami_book`, `paper_airplane`, `rusty_key`, etc.).
- **`expect(inventory.filter(...).length).toBe(1)`**: Guards against duplicate items.
- **`expect(solvedPuzzles.includes(tag))`**: Verifies puzzle milestones (`dartboard_solved`, `safe_unlocked`, `door_unlocked`).
- **`expect(selectedItem).toBe(item)`**: Verifies inventory slot highlights.
- **`expect(hasKeyInCompartment).toBe(false)`**: Verifies safe state.
- **`page.waitForFunction(fn)`**: Awaits state conditions (e.g. view changes, zoom views opening/closing, and dialog resets).

---

## 2. Review of Phase 4 Specifications
We reviewed the specifications for the exit door, balcony, trunk, and lamp puzzles:
- **`specs/lamp_puzzle.md`**: Tracks ON/OFF state of North, East, South, and Balcony lamps via `lamp_north_on`, `lamp_east_on`, `lamp_south_on`, and `lamp_balcony_on`. Correct combination: North=ON, East=ON, South=OFF, Balcony=ON. Solved flag: `lamp_puzzle_solved`. Reward: `brass_key`.
- **`specs/trunk_puzzle.md`**: Trunk hotspot in North Cozy Corner requires `brass_key` to unlock. Once unlocked, clicking it rewards `harness`.
- **`specs/balcony_escape.md`**: Stepping out to Balcony requires `door_unlocked`. Balcony contains the Pinned Note (giving `pigpen_cipher_key` and opening `cipher_key_zoom`) and the Zipline. Using `harness` on the Zipline triggers `TRIGGER_WIN`.
- **`specs/exit_door.md`**: Padlocked door in South View. Selecting `rusty_key` unlocks it. Once unlocked, clicking it sets view to `'balcony'`.

---

## 3. Proposed Coordinates and Zoom Configurations
To ensure no overlapping collisions on the 960x540 canvas, we propose the following precise hotspots and zoom configurations:

### Proposed Hotspot Coordinates (Main Views)
| View | Hotspot Name | Proposed Rect (`[x, y, width, height]`) | Purpose / Action |
|---|---|---|---|
| **North** | `stack_of_books` | `[140, 380, 80, 70]` | Clicking yields Clue 4 (`clue_4_zoom`), sets `found_clue_4` |
| **North** | `lamp_north` | `[870, 90, 60, 90]` | Opens `lamp_north_zoom` close-up view |
| **East** | `painting` | `[320, 100, 140, 110]` | Clicking yields Clue 1 (`clue_1_zoom`), sets `found_clue_1` |
| **East** | `mattress` | `[160, 340, 300, 130]` | Clicking yields Clue 2 (`clue_2_zoom`), sets `found_clue_2` |
| **East** | `lamp_east` | `[530, 250, 60, 100]` | Opens `lamp_east_zoom` close-up view |
| **South** | `lamp_south` | `[580, 280, 60, 110]` | Opens `lamp_south_zoom` close-up view |
| **South** | `writing_desk` | `[780, 355, 360, 170]` | (Existing) Adds Clue 3 (`clue_3_zoom`) and sets `found_clue_3` on first click |
| **Balcony**| `pinned_note` | `[180, 150, 70, 90]` | Yields `pigpen_cipher_key`, opens `cipher_key_zoom` |
| **Balcony**| `lamp_balcony` | `[380, 290, 60, 110]` | Opens `lamp_balcony_zoom` close-up view |
| **Balcony**| `zipline` | `[550, 280, 180, 200]` | Triggers escape with `harness` selected |

### Proposed Zoom Configurations
1. **`lamp_north_zoom`**, **`lamp_east_zoom`**, **`lamp_south_zoom`**, **`lamp_balcony_zoom`**:
   - **Properties**: Title: e.g., "North Lamp Zoom". Contains a center interactive rect `[380, 100, 200, 340]` that toggles the lamp state when clicked.
2. **`clue_1_zoom`**, **`clue_2_zoom`**, **`clue_3_zoom`**, **`clue_4_zoom`**:
   - **Properties**: Shows close-up image of pigpen clues (e.g. circle off, triangle on, cross on, spiral on).
3. **`cipher_key_zoom`**:
   - **Properties**: Title: "Pigpen translation grid".

---

## 4. Test-Driven E2E Structure (93 Test Cases)
We propose splitting the E2E verification into four target files:
1. `tests/tier1_happy_paths.spec.js` (F1-F8, 40 tests)
2. `tests/tier2_boundaries.spec.js` (F1-F8, 40 tests)
3. `tests/tier3_pairwise.spec.js` (8 combinatorial tests)
4. `tests/tier4_scenarios.spec.js` (5 scenario walkthroughs)

Below are the detailed specifications for all 93 test cases:

### Tier 1: Happy Paths (5 Cases per Feature = 40 Cases)

#### F1: Origami Folding
- **T1-F1-1: Collect Origami Paper**: Click Hammock `[260, 290]`. Assert `origami_paper` is added and dialog is shown.
- **T1-F1-2: Collect Origami Book**: Click Bookshelf `[860, 180]`. Assert `origami_book` is added.
- **T1-F1-3: Open Book Zoom**: Click `origami_book` in inventory. Assert `zoomView === 'origami_book'`.
- **T1-F1-4: Select Paper with Book Open**: Open book zoom, click `origami_paper` in inventory. Assert `selectedItem === 'origami_paper'`.
- **T1-F1-5: Fold Paper Airplane**: Click folding zone `[605, 210]` with paper selected in book zoom. Assert `zoomView === 'paper_airplane'` and items swapped.

#### F2: Dartboard Puzzle
- **T1-F2-1: Open Dartboard Zoom**: Navigate to South, click Dartboard `[380, 205]`. Assert `zoomView === 'dartboard'`.
- **T1-F2-2: Throw First Correct Dart**: Click wedge 13 in zoom. Assert wedge 13 is added to sequence, 1 dart on board.
- **T1-F2-3: Throw Second Correct Dart**: Click wedge 20. Assert sequence is `[13, 20]`, 2 darts on board.
- **T1-F2-4: Solve Dartboard Puzzle**: Click wedge 10. Assert `solvedPuzzles` contains `dartboard_solved`, view shifts to `safe_view` after 0.5s.
- **T1-F2-5: Re-enter Safe Directly**: Close zoom, click Dartboard. Assert zoom opens directly to `safe_view`.

#### F3: Binoculars/Trees Inspection
- **T1-F3-1: Collect Binoculars**: In East view, click window sill `[605, 260]`. Assert `binoculars` is added.
- **T1-F3-2: Collect Trees Book**: In East view, click shelf `[75, 85]`. Assert `trees_book` is added.
- **T1-F3-3: Open South Window**: In South view, click window `[715, 190]`. Assert `zoomView === 'south_window_zoom'`.
- **T1-F3-4: Inspect Oak Tree**: Select binoculars, click Left tree. Assert `zoomView === 'oak_leaf_zoom'`.
- **T1-F3-5: Inspect Pine & Maple**: Repeat for Center and Right trees. Assert `zoomView` updates to pine and maple zooms.

#### F4: Safe Dials
- **T1-F4-1: Open Safe Zoom**: In South, click Safe `[380, 205]`. Assert `zoomView === 'safe_view'`.
- **T1-F4-2: Rotate Dial 1**: Click dial 1. Assert dial value increments.
- **T1-F4-3: Open Trees Book**: Click `trees_book` in inventory. Assert `zoomView === 'trees_book'`.
- **T1-F4-4: Solve Safe**: Rotate dials to `1759`. Assert `safe_unlocked` is set, `rusty_key` is added.
- **T1-F4-5: Inspect Empty Safe**: Click safe hotspot when solved. Assert empty safe dialog.

#### F5: Exit Door
- **T1-F5-1: Inspect Locked Door**: Click door `[185, 270]`. Assert locked dialog.
- **T1-F5-2: Select Rusty Key**: Click `rusty_key` in inventory. Assert `selectedItem === 'rusty_key'`.
- **T1-F5-3: Unlock Exit Door**: Select key, click door. Assert `door_unlocked` is set, key consumed.
- **T1-F5-4: Go to Balcony**: Click door again. Assert `currentView === 'balcony'`.
- **T1-F5-5: Return Inside**: Click balcony navigation arrow. Assert `currentView === 'south'`.

#### F6: Lamps Puzzle
- **T1-F6-1: Collect Clue 1**: Click East painting. Assert `clue_1` collected, zoom opens.
- **T1-F6-2: Collect Clue 2**: Click East mattress. Assert `clue_2` collected, zoom opens.
- **T1-F6-3: Collect Clue 3**: Click Writing Desk. Assert `clue_3` collected, zoom opens.
- **T1-F6-4: Collect Clue 4**: Click North stack of books. Assert `clue_4` collected, zoom opens.
- **T1-F6-5: Solve Lamp Combination**: Toggle North=ON, East=ON, South=OFF, Balcony=ON. Assert `lamp_puzzle_solved` set, `brass_key` added.

#### F7: Trunk Puzzle
- **T1-F7-1: Inspect Locked Trunk**: Click Trunk `[820, 370]`. Assert locked dialog.
- **T1-F7-2: Select Brass Key**: Click `brass_key`. Assert `selectedItem === 'brass_key'`.
- **T1-F7-3: Unlock Trunk**: Select key, click Trunk. Assert `trunk_unlocked` set, key consumed.
- **T1-F7-4: Collect Harness**: Click trunk again. Assert `harness` added.
- **T1-F7-5: Inspect Empty Trunk**: Click trunk again. Assert empty dialog.

#### F8: Zipline Escape
- **T1-F8-1: Step to Balcony**: Navigate to Balcony. Assert `currentView === 'balcony'`.
- **T1-F8-2: Inspect Zipline without Harness**: Click Zipline. Assert harness warning dialog.
- **T1-F8-3: Collect Cipher Key**: Click pinned note. Assert `pigpen_cipher_key` added, zoom opens.
- **T1-F8-4: Select Zipline Harness**: Click `harness`. Assert `selectedItem === 'harness'`.
- **T1-F8-5: Escape via Zipline**: Select harness, click Zipline. Assert victory screen triggered.

---

### Tier 2: Boundary/Corner Cases (5 Cases per Feature = 40 Cases)

#### F1: Origami Folding (Boundaries)
- **T2-F1-6: Multi-click Bookshelf**: Click Bookshelf 5 times. Assert only 1 book added.
- **T2-F1-7: Multi-click Hammock**: Click Hammock 5 times. Assert only 1 paper added.
- **T2-F1-8: Wrong Item Fold**: Select binoculars, click book folding zone. Assert no fold, no crash.
- **T2-F1-9: Out-of-bounds Click**: Select paper, click outside folding zone. Assert no fold.
- **T2-F1-10: Close Mid-fold**: Close book zoom with paper selected. Assert selection resets, no fold.

#### F2: Dartboard Puzzle (Boundaries)
- **T2-F2-6: Close Zoom Mid-sequence**: Click 13, close zoom. Re-open. Assert sequence reset.
- **T2-F2-7: Incorrect Sequence Reset**: Click 5, 5, 5. Wait 0.5s. Assert sequence cleared.
- **T2-F2-8: Throw 4th Dart Blocked**: Click 5, 5, 5, then click 13 immediately. Assert 4th click ignored.
- **T2-F2-9: Throw with Selected Item**: Select paper, throw darts. Assert darts register normally.
- **T2-F2-10: Rapid Same-wedge Clicks**: Click 13 three times rapidly. Assert sequence is `[13, 13, 13]`, resets.

#### F3: Binoculars/Trees Inspection (Boundaries)
- **T2-F3-6: Inspect Window without Binoculars**: Click Oak tree without binoculars. Assert descriptive text.
- **T2-F3-7: Inspect with Wrong Item**: Select origami book, click tree. Assert descriptive text.
- **T2-F3-8: Out-of-bounds Window Click**: Click window sky area. Assert no zoom transition.
- **T2-F3-9: Double Click Tree**: Double-click Oak tree with binoculars. Assert single zoom window handles safely.
- **T2-F3-10: Leaf Zoom Return**: Click tree with binoculars, close zoom. Assert view returns to window zoom.

#### F4: Safe Dials (Boundaries)
- **T2-F4-6: Dial value wrapping**: Click dial 10 times. Assert value wraps 9 -> 0.
- **T2-F4-7: Dial click when solved**: Try clicking dials when safe unlocked. Assert dials hidden/non-interactive.
- **T2-F4-8: Close mid-combination**: Set dials to 1, 7, 0, 0, close zoom, re-open. Assert state preserved.
- **T2-F4-9: Click Dials with Item Selected**: Select binoculars, click dial. Assert value increments normally.
- **T2-F4-10: Direct flag check**: Enter 1759. Assert `safe_unlocked` in solved set, key compartment flag false.

#### F5: Exit Door (Boundaries)
- **T2-F5-6: Use Wrong Key**: Select brass key, click exit door. Assert door remains locked.
- **T2-F5-7: Rapid click locked door**: Click door 5 times rapidly. Assert locked dialog updates without glitching.
- **T2-F5-8: Select key but click blank space**: Select key, click floor. Assert key not consumed.
- **T2-F5-9: Persistence Check**: Unlock door, walk to East view, return, click door. Assert stays unlocked.
- **T2-F5-10: Click door when dialog active**: Trigger dialog, click door. Assert dialog is dismissed first.

#### F6: Lamps Puzzle (Boundaries)
- **T2-F6-6: Toggle lamp multiple times**: Toggle lamp ON -> OFF -> ON -> OFF. Assert final state is OFF.
- **T2-F6-7: Incorrect Configuration**: Set North=ON, East=ON, South=ON, Balcony=ON. Assert puzzle remains unsolved.
- **T2-F6-8: Multi-view clue inspect**: Click clue 1 in inventory repeatedly. Assert zoom opens correctly each time.
- **T2-F6-9: Pre-unlock access block**: Try to toggle balcony lamp before door unlocked. Assert blocked.
- **T2-F6-10: Lamp state persistence**: Toggle North lamp ON, navigate away, return. Assert lamp is still ON.

#### F7: Trunk Puzzle (Boundaries)
- **T2-F7-6: Unlock with wrong item**: Select rusty key, click trunk. Assert trunk remains locked.
- **T2-F7-7: Retrieve harness pre-unlock**: Click trunk when locked. Assert harness not added.
- **T2-F7-8: Double-unlock check**: Click trunk with key when already unlocked. Assert no action / no consumption.
- **T2-F7-9: Harness retrieval dismiss block**: Click trunk, click outside dialog. Assert harness added.
- **T2-F7-10: Interaction post-win**: Try interacting with trunk after escaping. Assert game scene blocked.

#### F8: Zipline Escape (Boundaries)
- **T2-F8-6: Escape with wrong item**: Select rusty key, click Zipline. Assert harness warning.
- **T2-F8-7: Multi-click note**: Click pinned note 5 times. Assert only 1 key added to inventory.
- **T2-F8-8: Escape pre-collection**: Click Zipline when harness not in inventory. Assert blocked.
- **T2-F8-9: Select harness, click floor**: Select harness, click floor. Assert game is not won.
- **T2-F8-10: Escape with dialog active**: Trigger note dialog, click zipline. Assert dialog dismissed first.

---

### Tier 3: Pairwise Combinatorial Interactions (8 Cases)
- **T3-81: Binoculars x Safe**: Collect binoculars & book, but enter combo 1759 directly without viewing canopy. Assert safe unlocks.
- **T3-82: Origami x Dartboard**: Fold paper airplane, navigate to South, solve dartboard without opening airplane zoom view. Assert solved.
- **T3-83: Exit Door x Lamps**: Step onto Balcony, toggle Balcony Lamp ON, return to South, toggle South Lamp OFF, configure North/East to solve. Assert solved.
- **T3-84: Lamps x Trunk**: Solve lamps to get brass key, select it, navigate to North, unlock trunk. Assert trunk unlocked.
- **T3-85: Trunk x Zipline**: Retrieve harness, navigate to Balcony, use zipline. Assert win.
- **T3-86: Origami x Binoculars**: Collect origami paper, book, binoculars, trees book. Assert inventory list displays all four.
- **T3-87: Dartboard x Exit Door**: Solve dartboard to reveal safe. Try to unlock door without solving safe. Assert exit door locked.
- **T3-88: Safe Dials x Zipline**: Solve safe to get rusty key. Select it, click Zipline. Assert zipline rejects rusty key.

---

### Tier 4: Real-World Scenarios (5 Cases)
- **T4-89: Scenario 1: Standard Walkthrough**: Complete the full puzzle flow from start to finish (Origami -> Dartboard -> Binoculars -> Safe -> Exit Door -> Clues & Lamps -> Trunk & Harness -> Zipline Escape). Assert victory.
- **T4-90: Scenario 2: State Jump Quick Escape**: Inject `door_unlocked` state, jump directly to Balcony. Toggle lamps, open trunk, collect harness, use zipline. Assert victory.
- **T4-91: Scenario 3: Mistake Recovery**: Make incorrect attempts at folding, throwing darts, safe dials, door key, lamps, and zipline. Recover and successfully escape.
- **T4-92: Scenario 4: Empty Zoom Views**: Inspect and click all room elements after they are empty/solved to verify no regressions or duplication bugs occur.
- **T4-93: Scenario 5: Quick Door Escape**: Inject `rusty_key` into inventory, select key, unlock exit door, step onto balcony. Assert balcony view successfully loaded.
