# Exit Door Spec

This document details the specifications for the exit door mechanics in the Treehouse Escape Room: using the Rusty Old Key to unlock the exit door and access the Balcony.

---

## 📖 Description
The player must use the Rusty Old Key found in the safe compartment to unlock the exit door on the South View. Once unlocked, clicking the door transitions the player onto the Balcony overlooking the forest, where the final escape puzzles and zipline are located.

---

## 🎒 Items & Props
*   **Exit Door (South View):** The exit door. Initially locked with an old, rusty padlock.
*   **Rusty Old Key (`rusty_key`):** The inventory item used to unlock the padlock.

---

## ⚙️ Logic & State
*   **Preconditions:**
    *   Player has `rusty_key` in `gameState.inventory`.
    *   Game is in South view (`gameState.currentView === 'south'`).
*   **Locked Interaction:**
    *   Clicking the Exit Door without selecting `rusty_key` shows locked dialogue and does not unlock the door.
*   **Unlocking Action:**
    *   Player selects `rusty_key` in `gameState.inventory` (so `gameState.selectedItem` is `'rusty_key'`).
    *   Player clicks the Exit Door.
*   **State Changes upon Unlocking:**
    *   `gameState.solvedPuzzles` receives the value `'door_unlocked'`.
    *   `rusty_key` is removed from `gameState.inventory`.
    *   `gameState.selectedItem` is set to `null`.
*   **Balcony Access Interaction:**
    *   Clicking the Exit Door again (now that it is unlocked) transitions the player to the Balcony view (`gameState.currentView` is set to `'balcony'`).

---

## 🔍 Verification & Test Plan
The implementation of this transition is verified through E2E tests.

### Test Case: Unlocking and Entering the Balcony
1.  **Locked Door Check:**
    *   *Action:* Click the Exit Door without selecting the key.
    *   *Expected:* `dialogText` equals `"The door is locked."`.
2.  **Select Rusty Old Key:**
    *   *Action:* Select `rusty_key` in the inventory.
    *   *Expected:* `selectedItem` is set to `'rusty_key'`.
3.  **Unlock Door:**
    *   *Action:* Click the Exit Door with the key selected.
    *   *Expected:* `dialogText` equals `"You have inserted the rusty old key into the lock. The door is now unlocked, click again to go through."`, and the door unlocks (`solvedPuzzles` contains `'door_unlocked'`).
4.  **Transition to Balcony:**
    *   *Action:* Click the Exit Door again.
    *   *Expected:* `currentView` is set to `'balcony'`.

