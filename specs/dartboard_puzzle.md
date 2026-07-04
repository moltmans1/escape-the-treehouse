# Dartboard Puzzle Spec

This document details the specifications for the second puzzle in the Treehouse Escape Room: deciphering the paper airplane clue to unlock the dartboard hidden compartment.

---

## 📖 Description
The player must inspect the dartboard in the South View and click standard dartboard numbers in the correct sequence (`13` -> `20` -> `10`) as indicated by the folded paper airplane clue. Successfully entering the sequence rotates the dartboard down to reveal a locked Safe behind it.

---

## 🎒 Items & Props
*   **Dartboard (South View):** An interactive hotspot. Clicking it opens the Dartboard Zoom View.
*   **Paper Airplane (`paper_airplane`):** Inventory item containing the clue.
*   **Locked Safe:** A secret safe built behind the dartboard. Displays once the puzzle is solved. The graphic updates to show the dartboard rotated down (upside down, rotated around its bottom edge) to reveal the safe behind it.

---

## ⚙️ Logic & State

### Preconditions
*   Player has deciphered the clue (conceptually).
*   Game is in South view (`gameState.currentView === 'south'`).

### Combination Sequence
*   The required combination is `13` -> `20` -> `10`.
*   Clicks are recorded in `gameState.dartboardSequence`.

### State Changes upon Solution
*   `gameState.zoomView` closes (set to `null`).
*   `gameState.solvedPuzzles` receives the value `'dartboard_solved'`.
*   `paper_airplane` is removed from `gameState.inventory`.

---

## 🔍 Verification & Test Plan
The implementation of this puzzle is verified through E2E tests.

### Test Case 3: Dartboard Puzzle
1.  **Open Dartboard Zoom View:**
    *   *Action:* Click the dartboard in South View (coordinates: `380, 205`).
    *   *Expected:* `zoomView` is set to `'dartboard'`.
2.  **Input Sequence:**
    *   *Action:* Click dartboard number sections in sequence: `13` -> `20` -> `10`.
    *   *Expected:* 
        *   `zoomView` is set to `null` (closes).
        *   `solvedPuzzles` contains `'dartboard_solved'`.
        *   `paper_airplane` is removed from `inventory`.
        *   The visual representation shows the dartboard rotated down, revealing the locked safe behind it.
