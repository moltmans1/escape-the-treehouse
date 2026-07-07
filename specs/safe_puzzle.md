# Safe Puzzle Spec

This document details the specifications for interacting with and opening the safe in the Treehouse Escape Room, and retrieving the key inside.

---

## 📖 Description
Once the Dartboard Puzzle is solved, a locked safe is revealed on the wall in the South View. The player must inspect the safe, rotate its four vertical numeric thumb wheels to the combination (`1759`) discovered via the botanical canopy clues. Once correct, the safe automatically swings open (revealing the Rusty Old Key inside via a new graphic) and adds the key to their inventory. The player can then close the zoom view.

---

## 🎒 Items & Props
*   **Locked Safe (South View):** Interactive hotspot revealed behind the dartboard once `solvedPuzzles` contains `'dartboard_solved'`. Clicking it opens the Safe Input Zoom View.
*   **Safe Input Zoom View (`safe_view`):** A close-up view of the safe door displaying:
    *   **Safe Door Background:** The `safe.png` image loaded and scaled to fill the entire width of the zoom area (960px wide).
    *   **Four Numeric Thumb Wheels:** Vertical rolling wheels representing digits from `0` to `9`, aligned side-by-side in the center-middle region. Each wheel shows the current digit in the center (fully visible and highlighted), with the adjacent numbers (previous and next digits) partially visible above and below it at reduced opacity/scale. Clicking a wheel increments its active digit (wrapping back to `0` after `9`).
    *   **Open Safe Background (Unlocked):** Once the combination is correct, the background is replaced with the `safe_open.jpg` image (showing the safe open with the key in it), and the thumb wheels are removed or hidden.
*   **Open Safe (South View):** There is no separate graphical representation of the open safe in the main South View; the room background remains as-is. Clicking the safe hotspot in the main view after it has been unlocked displays the dialogue stating that it is open and empty.
*   **Rusty Old Key (`rusty_key`):** The physical key resting inside the safe compartment (represented in the `safe_open.jpg` graphic).

---

## ⚙️ Logic & State

### Preconditions
*   The dartboard puzzle has been solved (i.e. `solvedPuzzles` contains `'dartboard_solved'`).

### Thumb Wheel Interaction
*   Clicking thumb wheel `i` increments its state: `wheel.value = (wheel.value + 1) % 10`.
*   The wheels update their visual rendering to display the new active digit in the center and the adjacent digits above/below.
*   Upon every increment, the system checks the full combination across the four wheels.

### Unlocking the Safe & Collecting the Key
*   The correct combination sequence is `1759`.
*   As soon as the four wheels match `1759`:
    *   `solvedPuzzles` receives the flag `'safe_unlocked'`.
    *   The background image of the zoom view is replaced with the `safe_open.jpg` asset.
    *   The four thumb wheels are hidden or destroyed (non-interactive).
    *   `rusty_key` is added to `inventory` immediately.
    *   `hasKeyInCompartment` is set to `false` immediately.
    *   A success dialog is shown: *"The safe is open, a Rusty Old Key is inside! It has been added to your inventory."*
    *   The zoom view remains active. The player manually closes the zoom view by clicking the **Close** button, which sets `zoomView` to `null`.

### Post-Unlock Interaction
*   If the player clicks the open safe hotspot in the main South View (coordinates: `366, 171`) after the key is collected, a dialog is shown: *"The unlocked safe is empty."*, and the zoom view `safe_view` is opened.

---

## 🔍 Verification & Test Plan
The implementation of this puzzle is verified through E2E tests.

### Test Case: Unlocking the Safe & Collecting the Key
1.  **Open Safe Keypad View:**
    *   *Action:* Click the safe in South View (coordinates: `366, 171`).
    *   *Expected:* `zoomView` is set to `'safe_view'`.
2.  **Enter Correct Combination:**
    *   *Action:* Rotate/click the wheels programmatically until the combination displays `1759`.
    *   *Expected:* 
        *   The safe automatically unlocks immediately.
        *   Background graphic switches to `safe_open.jpg`.
        *   Thumb wheels are hidden.
        *   `rusty_key` is added to `inventory`.
        *   `hasKeyInCompartment` is `false`.
        *   Dialogue displays: *"The safe is open, a Rusty Old Key is inside! It has been added to your inventory."*
3.  **Close Zoom View:**
    *   *Action:* Click the Close button (coordinates: `900, 30`).
    *   *Expected:*
        *   `zoomView` is set to `null` (closes).
4.  **Verify Safe in South View:**
    *   *Action:* Click the open safe in South View (coordinates: `366, 171`).
    *   *Expected:*
        *   Dialogue displays: *"The unlocked safe is empty."*
        *   `zoomView` is set to `'safe_view'`.
