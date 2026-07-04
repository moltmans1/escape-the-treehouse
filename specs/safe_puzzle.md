# Safe Puzzle Spec

This document details the specifications for interacting with and opening the safe in the Treehouse Escape Room, and retrieving the key inside.

---

## 📖 Description
Once the Dartboard Puzzle is solved, a locked safe is revealed on the wall in the South View. The player must inspect the safe, rotate its four dials to the combination (`1759`) discovered via the botanical canopy clues, pull the handle to unlock the compartment, and retrieve the Rusty Old Key.

---

## 🎒 Items & Props
*   **Locked Safe (South View):** Interactive hotspot revealed behind the dartboard once `solvedPuzzles` contains `'dartboard_solved'`. Clicking it opens the Safe Input Zoom View.
*   **Safe Input Zoom View (`safe_input`):** A close-up view of the safe door containing:
    *   **Four Rotary Dials:** Dials representing digits from `0` to `9`. Clicking a dial increments its value (wrapping back to `0` after `9`).
    *   **Open Handle:** An interactive button/lever to submit the dial combination.
*   **Open Safe:** The graphical representation of the safe in the main South View once unlocked. Shows the open compartment.
*   **Rusty Old Key (`rusty_key`):** The physical key resting inside the safe compartment.

---

## ⚙️ Logic & State

### Preconditions
*   The dartboard puzzle has been solved (i.e. `solvedPuzzles` contains `'dartboard_solved'`).

### Dial Interaction
*   Clicking dial `i` increments its state: `dial.value = (dial.value + 1) % 10`.
*   The safe dials display their active values visually.

### Unlocking the Safe
*   The correct combination sequence is `1759`.
*   Clicking the **Open Handle** checks the dial values:
    *   If correct:
        *   `solvedPuzzles` receives the flag `'safe_unlocked'`.
        *   `zoomView` is set to `null` (closes the zoom view).
        *   Phaser updates the room overlay to draw the open safe door.
        *   A success dialog is shown: *"With a heavy mechanical click, the safe swings open, revealing a Rusty Old Key inside!"*
    *   If incorrect:
        *   The handle executes a jiggle animation.
        *   A prompt dialog is shown: *"The handle won't budge. The dials must be in the wrong position."*

### Key Collection
*   Once `solvedPuzzles` contains `'safe_unlocked'` and `hasKeyInCompartment` is `true`, clicking the safe hotspot in the main South View triggers:
    *   `hasKeyInCompartment` is set to `false`.
    *   `rusty_key` is added to `inventory`.
    *   Phaser updates the dynamic graphics to show the safe compartment as empty.
    *   A dialog is shown: *"You pick up the Rusty Old Key from the open safe."*
*   If the safe is clicked again when the key has already been collected, it displays: *"The safe is open and empty."*

---

## 🔍 Verification & Test Plan
The implementation of this puzzle is verified through E2E tests.

### Test Case: Unlocking the Safe & Collecting the Key
1.  **Open Safe Keypad View:**
    *   *Action:* Click the safe in South View (coordinates: `380, 205`).
    *   *Expected:* `zoomView` is set to `'safe_input'`.
2.  **Submit Incorrect Combination:**
    *   *Action:* Set dials to `0000`, click the handle.
    *   *Expected:* Dialogue box displays: *"The handle won't budge. The dials must be in the wrong position."*
3.  **Submit Correct Combination:**
    *   *Action:* Set dials to `1759`, click the handle.
    *   *Expected:* 
        *   `zoomView` is set to `null` (closes).
        *   `solvedPuzzles` contains `'safe_unlocked'`.
        *   Visual overlay shows the safe door swung open.
4.  **Collect Key:**
    *   *Action:* Click the open safe in South View (coordinates: `380, 205`).
    *   *Expected:*
        *   `rusty_key` is added to `inventory`.
        *   `hasKeyInCompartment` is set to `false`.
        *   Dialogue displays: *"You pick up the Rusty Old Key from the open safe."*
