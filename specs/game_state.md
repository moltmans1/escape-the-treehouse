# Global Game State Specifications

This document defines the global game state structure and StateManager management that must be preserved across all features and code updates.

---

## 💾 Decoupled Game State & StateManager

The game state is managed entirely headlessly in [StateManager.js](file:///home/moltmans/escape-the-treehouse/src/engine/StateManager.js). Rather than mutating a local `gameState` object directly in the Phaser shell, state changes must be routed through the `StateManager` class instance (e.g. `stateManager.setView()`, `stateManager.selectItem()`, or evaluated interactively by `Interpreter.js` and executed via `stateManager.executeActions()`).

### State Structure
The `stateManager.state` object contains:
*   `inventory`: Array of strings (e.g., `'origami_paper'`, `'origami_book'`, `'paper_airplane'`, `'binoculars'`, `'trees_book'`, `'rusty_key'`)
*   `selectedItem`: String representing the active selected inventory item (or `null`)
*   `solvedPuzzles`: Set containing tags of solved puzzles and flags (e.g., `'dartboard_solved'`, `'safe_unlocked'`, `'door_unlocked'`, `'found_paper'`)
*   `currentView`: Active view: `'north'`, `'east'`, `'south'`
*   `zoomView`: Active zoom view identifier (or `null` if looking at main room)
*   `dialogText`: Dialogue text displayed in the message box
*   `dialogActive`: Boolean indicating whether a dialog box is overlaying interaction
*   `hasKeyInCompartment`: Boolean indicating if the `rusty_key` is still inside the safe/compartment

### E2E Test Compatibility Proxy
For compatibility with E2E tests in [tests/escape.spec.js](file:///home/moltmans/escape-the-treehouse/tests/escape.spec.js), a compatible `gameState` proxy object is exposed on the window as `window.__gameState` in [src/main.js](file:///home/moltmans/escape-the-treehouse/src/main.js). This object dynamically delegates property accesses to `stateManager.state`.

