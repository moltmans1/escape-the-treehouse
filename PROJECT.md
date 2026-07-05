# Project: Escape Room Decoupling

## Architecture
- **Core Engine (`src/engine/`)**: Completely generic, containing:
  - `StateManager.js`: Manages standard state properties (`inventory`, `selectedItem`, `solvedPuzzles`, `currentView`, `zoomView`, `dialogText`, `dialogActive`) and a generic `customState` object for game-specific properties (e.g. `hasKeyInCompartment`).
  - `Interpreter.js`: Generic interaction rule evaluator. Evaluates checks (`if_flag`, `if_selected_item`, `if_custom_state`) and maps to commands (`SET_FLAG`, `CLEAR_FLAG`, `ADD_INVENTORY`, `REMOVE_INVENTORY`, `SHOW_DIALOG`, `OPEN_ZOOM_VIEW`, `TRIGGER_WIN`, etc.).
- **Game Configurations & Assets (`src/game/`)**:
  - `treehouse.config.js`: All scene, inventory, hotspot, interaction rule, and minigame definitions specific to the "Escape the Treehouse" puzzle.
  - `minigames/`: Dedicated directory containing modular minigame implementations.
- **Rendering Shell (`src/main.js`)**: Phaser-specific engine wrapper. It instantiates the decoupled engine, registers custom minigames, reads configurations from `treehouse.config.js`, displays elements, processes events, and exposes E2E testing proxy (`window.__gameState`).
- **E2E Compatibility Proxy**: A window-level proxy (`window.__gameState`) that maps all direct properties like `dialogActive` or `inventory` to the `StateManager`'s state, and traps game-specific properties (like `hasKeyInCompartment`) to transparently get/set them in the `customState` object, maintaining full compatibility with the existing automated tests.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Testing Track | Verify & structure E2E test suite (Tiers 1-4) | None | PLANNED |
| 2 | Modular Minigames | Extract minigames (Origami, Dartboard, Safe dials, Binoculars) into modular classes under `src/game/minigames/` implementing standard lifecycle interface | None | PLANNED |
| 3 | Scene & Inventory Data-Drive | Move all hotspot, scene, and inventory configs to `treehouse.config.js` and update `main.js` to dynamically render them | M2 | PLANNED |
| 4 | Core Decoupling & Custom State | Refactor `StateManager` & `Interpreter` under `src/engine/` to be completely generic; move game-specific states to `customState` and implement the E2E compatibility proxy | M3 | PLANNED |
| 5 | final: E2E and Hardening | Validate all tests, and perform Tier 5 white-box coverage / adversarial verification | M1, M4 | PLANNED |

## Interface Contracts
### Phaser Shell ↔ Minigames
Each minigame under `src/game/minigames/` must implement:
- `onCreate(scene, container)`: Called when the minigame is initialized. Takes the Phaser `Scene` object and the parent `Container` to render elements.
- `onDestroy()`: Called when closing/destroying the minigame. Must clean up any local elements, textures, or listeners to prevent leaks.
Minigames trigger state updates by calling `scene.stateManager.executeActions(actions)`.

## Code Layout
- `src/engine/StateManager.js` - Core state management (generic)
- `src/engine/Interpreter.js` - Core rule interpreter (generic)
- `src/game/treehouse.config.js` - Puzzle & scene configurations (game-specific)
- `src/game/minigames/` - Minigames directory
- `src/main.js` - UI/Rendering shell (Phaser)
- `tests/engine.test.js` - Vitest unit tests
- `tests/escape.spec.js` - Playwright E2E tests
