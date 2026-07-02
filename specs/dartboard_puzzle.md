# Dartboard Puzzle Spec

This document details the specifications for the second puzzle in the Treehouse Escape Room: deciphering the paper airplane clue to unlock the dartboard hidden compartment.

---

## 📖 Description
The player must inspect the dartboard in the South View and click standard dartboard numbers in the correct sequence (`13` -> `20` -> `10`) as indicated by the folded paper airplane clue. Successfully entering the sequence rotates the dartboard down to reveal a locked Safe behind it.

---

## 🎒 Items & Props
*   **Dartboard (South View):** An interactive hotspot. Clicking it opens the Dartboard Zoom View.
*   **Paper Airplane (`paper_airplane`):** Inventory item containing the clue.
*   **Locked Safe:** A secret safe built behind the dartboard. Displays once the puzzle is solved. The graphic should update to show the dartboard rotated down to reveal the safe behind it (i.e., the dartboard will be upside down, rotated around the bottom edge of the original dartboard position).
*   **Hidden Safe (South View):** Revealed behind the dartboard once the dartboard puzzle is solved. Clicking it opens the Safe Input Zoom View.
*   **Safe Input Zoom View (`safe_input`):** A keypad or input lock interface taking a 4-digit code.
*   **Rusty Old Key (`rusty_key`):** The key hidden inside the safe, used to open the exit door.
---

## ⚙️ Logic & State
*   **Preconditions:**
    *   Player has deciphered the clue (conceptually).
    *   Game is in South view (`gameState.currentView === 'south'`).
*   **Combination Sequence:**
    *   The required combination is `13` -> `20` -> `10`.
    *   Clicks are recorded in `gameState.dartboardSequence`.
*   **State Changes upon Solution:**
    *   `gameState.zoomView` closes (set to `null`).
    *   `gameState.solvedPuzzles` receives the value `'dartboard_solved'`.
    *   `paper_airplane` is removed from `gameState.inventory`.
    **Safe Interaction:**
    *   Once the safe is revealed (after `gameState.solvedPuzzles` contains `'dartboard_solved'`), clicking the safe opens `gameState.zoomView = 'safe_input'`.
    *   Entering the code `1759` transitions the state:
        *   `gameState.solvedPuzzles` receives `'safe_unlocked'`.
        *   The safe graphics update to "Open Safe".
        *   `gameState.zoomView` is set to `null` (closes).
*   **Key Collection:**
    *   Once the safe is unlocked, clicking the open safe on the main South View adds `rusty_key` to `gameState.inventory` and sets `gameState.hasKeyInCompartment` to `false` (in this configuration, the key is inside the safe).

---

## 🔍 Verification & Test Plan
The implementation of this puzzle is verified through E2E tests.

### Test Case 3: Dartboard Puzzle
1.  **Open Dartboard Zoom View:**
    *   *Action:* Click the dartboard in South View (coordinates: `385, 200`).
    *   *Expected:* `zoomView` is set to `'dartboard'`.
2.  **Input Sequence:**
    *   *Action:* Click dartboard number sections in sequence: `13` -> `20` -> `10`.
    *   *Expected:* 
        *   `zoomView` is set to `null` (closes).
        *   `solvedPuzzles` contains `'dartboard_solved'`.
        *   `paper_airplane` is removed from `inventory`.
        *   The visual representation shows the dartboard rotated down, revealing the locked safe behind it.
