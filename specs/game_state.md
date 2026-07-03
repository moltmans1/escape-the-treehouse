# Global Game State & Cursor Specifications

This document defines the global game state structure and custom mouse cursor invariants that must be preserved across all features and code updates.

---

## 💾 Global Game State Structure

All point-and-click logic, inventory changes, and puzzle states must conform to the structure of the global `gameState` object managed in [src/main.js](file:///home/moltmans/escape-the-treehouse/src/main.js):

```javascript
const gameState = {
  inventory: [],               // Array of strings (e.g., 'origami_paper', 'origami_book', 'paper_airplane', 'binoculars', 'trees_book', 'rusty_key')
  selectedItem: null,          // String representing the active selected inventory item (or null)
  solvedPuzzles: new Set(),    // Set containing tags of solved puzzles (e.g., 'dartboard_solved', 'safe_unlocked', 'door_unlocked')
  currentView: 'north',        // Active view: 'north', 'east', 'south'
  zoomView: null,              // Active zoom view identifier (or null if looking at main room)
  dialogText: '',              // Dialogue text displayed in the message box
  dialogActive: false,         // Boolean indicating whether a dialog box is overlaying interaction
  dartboardSequence: [],       // Array storing current dartboard click sequences (e.g., [13, 20])
  hasKeyInCompartment: true    // Boolean indicating if the rusty_key is still inside the safe/compartment
};
```

---

## 🖱️ Selected Item Cursors

Custom cursor overrides are configured based on the currently selected inventory item:
* Only the following items support custom canvas cursors:
  * `binoculars` ➔ `🔭`
  * `origami_paper` ➔ `📄`
  * `rusty_key` ➔ `🔑`
* All other items (such as `paper_airplane`, `origami_book`, and `trees_book`) do not have custom cursor overrides and must use the standard system cursor.
