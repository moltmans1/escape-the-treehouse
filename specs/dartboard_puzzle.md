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
*   **Dart (`dart`):** Visual sprite added to the board upon click.

---

## Dartboard zoom view
* **Appearance**: The dartboard is a nicely rendered image, in the same style as the one shown in the background. It has a background the same color as the zoom view background.
* **Interaction**: The entire dartboard image is interactive. Clicking on a section of the board calculates the angle of the click relative to the center to identify which numbered wedge (1-20) was selected. This removes the need for overlapping text overlays, ensuring the visual image remains clean and legible.
* **Dart-Throwing Feedback**:
  - When the player clicks on the dartboard, a dart sprite is spawned on the screen.
  - The metal tip of the dart is aligned exactly with the clicked coordinate on the board.
  - All darts are rendered at a fixed, slightly downward-pointing angle (tilted 15 degrees).
  - A maximum of three darts can be thrown.
  - After the 3rd dart is thrown:
    - The player cannot throw additional darts.
    - If the 3-digit sequence matches the target combination (`13` -> `20` -> `10`), the darts remain visible for 0.5 seconds, and then the view transitions to the safe zoom view and the puzzle is marked as solved.
    - If the sequence is incorrect, the darts remain visible for 0.5 seconds, and then all darts disappear, and the sequence resets so the player can try again.
  - If the player closes the zoom view at any point (even mid-sequence or during the 0.5-second delay), all darts are cleared and the sequence is reset immediately.

## ⚙️ Logic & State

### Preconditions
*   Player has deciphered the clue (conceptually).
*   Game is in South view (`gameState.currentView === 'south'`).

### Combination Sequence
*   The required combination is `13` -> `20` -> `10`.
*   Clicks are recorded in `gameState.dartboardSequence`.

### State Changes upon Solution
*   `gameState.zoomView` changes to `safe_view` (after a 0.5-second delay with darts visible).
*   `gameState.solvedPuzzles` receives the value `'dartboard_solved'`.
*   `paper_airplane` is removed from `gameState.inventory`.

---

## 🔍 Verification & Test Plan
The implementation of this puzzle is verified through E2E tests.

### Test Case 3: Dartboard Puzzle
1.  **Open Dartboard Zoom View:**
    *   *Action:* Click the dartboard in South View.
    *   *Expected:* `zoomView` is set to `'dartboard'`.
2.  **Input Sequence:**
    *   *Action:* Click dartboard number sections in sequence: `13` -> `20` -> `10`.
    *   *Expected:* 
        *   Darts appear on the board at the clicked coordinates.
        *   After a 0.5-second delay, `zoomView` is set to `'safe_view'`.
        *   `solvedPuzzles` contains `'dartboard_solved'`.
        *   `paper_airplane` is removed from `inventory`.

### Test Case 4: Re-entering Solved Dartboard
1.  **Precondition:**
    *   `solvedPuzzles` contains `'dartboard_solved'`.
    *   `zoomView` is set to `null` (main room view).
2.  **Click Dartboard Area:**
    *   *Action:* Click the dartboard in South View.
    *   *Expected:* `zoomView` is set to `'safe_view'` (opening the safe zoom view directly).
