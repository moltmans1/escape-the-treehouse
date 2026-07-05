# Scope: E2E Testing Track

## Architecture
- **Test Runner**: Playwright (`playwright test`), configured in `playwright.config.js`.
- **E2E Compatibility Proxy**: The test suite interacts with the game via standard click coordinates on the Phaser canvas, and asserts state using `window.__gameState`, which exposes the global game state:
  - `inventory`: Array of strings representing items currently held by the player.
  - `selectedItem`: The currently selected inventory item string (or `null`).
  - `solvedPuzzles`: Set or Array of completed puzzle tags/flags.
  - `currentView`: The current room perspective (`'north'`, `'east'`, `'south'`, `'balcony'`).
  - `zoomView`: The active zoom window or minigame perspective (or `null`).
  - `dialogText`: The dialogue text currently displayed in the UI box.
  - `dialogActive`: A boolean indicating if a dialogue box is active.
- **Phaser Control Hook**: The test suite can dismiss dialogues programmatically using `window.__game.scene.keys.GameScene.hideDialog()` and interact with custom minigames by emitting pointerdown events directly on internal components.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Tier 1 Tests | Enumerate 8 features and write >=5 happy-path test cases per feature (40 tests total). | None | PLANNED |
| 2 | Tier 2 Tests | Write >=5 boundary/corner cases per feature (40 tests total), covering empty inputs, incorrect inputs, limits, etc. | M1 | PLANNED |
| 3 | Tier 3 Tests | Pairwise combinatorial tests for major feature interactions (8 tests total). | M2 | PLANNED |
| 4 | Tier 4 Tests | 5 realistic application-level scenarios (Standard Walkthrough, Quick Escape, Mistake Recovery, Empty Views, Door Escape). | M3 | PLANNED |
| 5 | Publish Test Suite | Consolidate tests under `tests/` directory, verify syntax, and publish `TEST_READY.md`. | M4 | PLANNED |

## Interface Contracts
### E2E Tests ↔ Phaser Game Shell
- **Page Load Ready**: Playwright waits for `window.__mainMenuReady === true` and `window.__gameReady === true`.
- **Dialogue Dismissal**: Call `gameScene.hideDialog()` to bypass UI tweens/delays for fast execution.
- **Minigame Interaction**:
  - **Dartboard**: Emit `'pointerdown'` on `dartboard` image with computed `worldX` and `worldY` corresponding to target number wedge.
  - **Safe Keypad/Dials**: Target `safeDials[idx]` and emit `'pointerdown'` until dial value matches combination. Target `safe_handle` for submission handle.
  - **Lamps**: Target each lamp zoom view and toggle the lamp state.
  - **Trunk**: Click trunk hotspot `[820, 370]` with or without `brass_key` selected.
  - **Zipline**: Click zipline hotspot with or without `harness` selected.
