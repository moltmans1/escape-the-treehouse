# Scope: Implementation Track Refactoring

## Architecture
The escape room game code will be refactored to decouple the core game engine from game-specific puzzle logic:
1. **Core Engine (`src/engine/`)**:
   - `StateManager.js`: Completely generic state management. Holds generic states like `inventory`, `selectedItem`, `solvedPuzzles`, `currentView`, `zoomView`, `dialogText`, `dialogActive` and a generic `customState` object for game-specific state flags/variables.
   - `Interpreter.js`: Generic interaction rule evaluator. Evaluates checks (`if_flag`, `if_selected_item`, `if_custom_state`) and maps to commands (`SET_FLAG`, `CLEAR_FLAG`, `ADD_INVENTORY`, `REMOVE_INVENTORY`, `SHOW_DIALOG`, `OPEN_ZOOM_VIEW`, `TRIGGER_WIN`, etc.).
2. **Game Configurations (`src/game/`)**:
   - `treehouse.config.js`: Contains all treehouse-specific scenes, inventory configurations, hotspots, interaction rules, zoom view details, and minigame definitions.
   - `minigames/`: Dedicated directory containing modular minigame implementations.
3. **Phaser Shell / Rendering Shell (`src/main.js`)**:
   - Acts as the rendering and Phaser lifecycle host. It reads configurations dynamically from `treehouse.config.js` to render views and hotspots.
   - Imports modular minigames dynamically/statically and hosts them using the lifecycle interface.
   - Sets up `window.__gameState` Compatibility Proxy to translate legacy E2E test state checks into generic `StateManager` state properties or `customState` values.

## Interface Contracts
### Phaser Shell ↔ Minigames
Each minigame under `src/game/minigames/` must implement:
- `onCreate(scene, container)`: Called when the minigame is initialized. Takes the Phaser `Scene` object and a Phaser `Container` (or similar node) to render/mount its graphical elements.
- `onDestroy()`: Called when the minigame is closed/dismissed. Must clean up all graphics, tweens, local timers, input listeners, and custom textures to prevent leaks.
Minigames trigger state updates or commands by calling `scene.stateManager.executeActions(actions)`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Extract Modular Minigames | Extract Origami, Dartboard, Safe dials, Binoculars minigame logic into `src/game/minigames/` modular classes. | None | VERIFYING (Auditor: bc910a54) |
| 2 | Scene & Inventory Data-Drive | Move hotspot/scene/inventory configs to `treehouse.config.js` and update `main.js` to dynamically render them. | M1 | PLANNED |
| 3 | Core Decoupling & Proxy | Refactor `StateManager` & `Interpreter` under `src/engine/` to be completely generic, move game-specific state to `customState` and establish the E2E proxy. | M2 | PLANNED |
| 4 | final: E2E and Hardening | Validate all tests, and perform Tier 5 white-box coverage / adversarial verification. | M3 | PLANNED |

## Code Layout
- `src/engine/StateManager.js` - Generic state manager
- `src/engine/Interpreter.js` - Generic rule evaluator
- `src/game/treehouse.config.js` - Game configuration (rooms, views, items, rules)
- `src/game/minigames/` - Minigames directory
  - `OrigamiMinigame.js` - Decoupled Origami puzzle logic
  - `DartboardMinigame.js` - Decoupled Dartboard sequence puzzle logic
  - `SafeDialsMinigame.js` - Decoupled Safe combination dials puzzle logic
  - `BinocularsMinigame.js` - Decoupled Binoculars / South Window tree views logic
- `src/main.js` - Phaser game loop & configuration loader
