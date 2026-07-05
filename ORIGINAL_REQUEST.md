# Original User Request

## Initial Request — 2026-07-05T18:03:43Z

Refactor the escape room game to decouple the core game engine logic from the specific "Escape the Treehouse" puzzle logic.

Working directory: /home/moltmans/escape-the-treehouse
Integrity mode: development

## Requirements

### R1. Engine and Game Separation
Separate the core engine components (`StateManager.js`, `Interpreter.js`) from the specific treehouse puzzle configurations, assets, and minigame implementations. The core engine should be completely generic and reusable for other escape rooms.

### R2. Data-Driven Scene & Inventory Configs
Define structured JS configuration objects for:
- **Inventory Items**: Defining metadata (id, name, asset, zoom view config, and any associated minigames).
- **Scenes & Hotspots**: Defining background assets, navigation links, hotspot coordinate rectangles, and their respective interaction rules.

### R3. Modular Minigames
Extract all mini-game logic (Origami folding, Dartboard puzzle, Safe dials, and Binoculars/trees inspection) out of `src/main.js` and into dedicated files in `src/game/minigames/` implementing a standard interface (e.g. lifecycle methods like `onCreate(scene, container)` and `onDestroy()`).

### R4. Generic State & E2E Proxy
Replace game-specific state parameters in `StateManager.js` (like `hasKeyInCompartment`) with a generic `customState` object. Maintain full E2E compatibility by using a window-level proxy (`window.__gameState`) that maps both base state and game-specific `customState` properties for the automated test suite.

### R5. Code Quality & Unit Tests
Refactor all JavaScript engine/logic functions to be short and cohesive (under 100 lines per function where feasible). Add Vitest unit tests in `tests/engine.test.js` to cover the engine logic, interpreter actions, and configurations.

## Acceptance Criteria

### Testing & Verification
- [ ] Headless unit tests (`npm run test:unit`) pass successfully.
- [ ] Integration E2E tests (`npm run test:e2e`) pass successfully.

### Architectural Cleanliness
- [ ] The `src/engine/` directory contains no treehouse-specific rules, strings, or puzzle/asset configurations.
- [ ] Individual minigame rendering, input handlers, and calculations are defined in modular classes/objects under `src/game/minigames/` instead of `src/main.js`.
- [ ] No function in `src/engine/` exceeds 100 lines.
