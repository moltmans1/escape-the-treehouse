# Dartboard Puzzle Spec

This document details the specifications for the second puzzle in the Treehouse Escape Room: deciphering the paper airplane clue to unlock the dartboard hidden compartment.

---

## 📖 Description
The player must inspect the dartboard in the South View and click standard dartboard numbers in the correct sequence (`13` -> `20` -> `10`) as indicated by the folded paper airplane clue. Successfully entering the sequence reveals a locked Safe behind it. The safe will be shown in the zoom view of the dartboard after it's solved, but it will not update the visual appearance in the room view. Clicking on the the dartboard after the dartboard puzzle is solved will instead open the safe zoom view.

---

## 🎒 Items & Props
*   **Dartboard (South View):** An interactive hotspot. Clicking it opens the Dartboard Zoom View.
*   **Paper Airplane (`paper_airplane`):** Inventory item containing the clue.
*   **Locked Safe:** A secret safe built behind the dartboard. Displays once the puzzle is solved. The graphic updates to show the dartboard rotated down (upside down, rotated around its bottom edge) to reveal the safe behind it.

---

## Dartboard zoom view
* Appearance: The dartboard is a nicely rendered image, in the same style as the one shown in the background. It should have a background the same color as the zoom view background.
* Hotspots: there should be pie shaped hotspots over each of the numbered sections of the dartboard. Each hotspot should correspond to the number for that wedge.
* The numbers should have a high contrast and be as big as reasonable so the user can see them clearly.

## ⚙️ Logic & State

### Preconditions
*   Player has deciphered the clue (conceptually).
*   Game is in South view (`gameState.currentView === 'south'`).

### Combination Sequence
*   The required combination is `13` -> `20` -> `10`.
*   Clicks are recorded in `gameState.dartboardSequence`.

### State Changes upon Solution
*   `gameState.zoomView` changes to `safe_view`.
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
        *   `zoomView` is set to `'safe_view'`.
        *   `solvedPuzzles` contains `'dartboard_solved'`.
        *   `paper_airplane` is removed from `inventory`.

### Test Case 4: Re-entering Solved Dartboard
1.  **Precondition:**
    *   `solvedPuzzles` contains `'dartboard_solved'`.
    *   `zoomView` is set to `null` (main room view).
2.  **Click Dartboard Area:**
    *   *Action:* Click the dartboard in South View (coordinates: `380, 205`).
    *   *Expected:* `zoomView` is set to `'safe_view'` (opening the safe zoom view directly).
