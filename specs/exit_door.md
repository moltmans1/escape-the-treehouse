# Exit Door Spec

This document details the specifications for the final escape mechanics in the Treehouse Escape Room: using the Rusty Old Key to unlock the exit door and win the game.

---

## 📖 Description
The final puzzle involves using the Rusty Old Key found in the dartboard compartment to unlock the exit door on the South View. Once unlocked, the door swings open and the player can click the open doorway to escape high in the trees and win.

---

## 🎒 Items & Props
*   **Exit Door (South View):** The final exit door. Initially locked with an old, rusty padlock.
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
*   **Escape Interaction:**
    *   Clicking the Exit Door again (now that it is unlocked) triggers the Win/Victory Screen.

---

## 🔍 Verification & Test Plan
The implementation of this puzzle is verified through E2E tests in [escape.spec.js](file:///home/moltmans/escape-the-treehouse/tests/escape.spec.js#L207-L277).

### Test Case 4: Final Escape
1.  **Locked Door Check:**
    *   *Action:* Click the Exit Door (coordinates: `190, 250`) without selecting the key.
    *   *Expected:* `dialogText` equals `"The exit door is locked tight. The padlock is extremely old and rusty."`.
2.  **Select Rusty Old Key:**
    *   *Action:* Select `rusty_key` in the inventory.
    *   *Expected:* `selectedItem` is set to `'rusty_key'`.
3.  **Unlock Door:**
    *   *Action:* Click the Exit Door (coordinates: `190, 250`) with the key selected.
    *   *Expected:* `dialogText` equals `"You insert the rusty old key into the padlock. With a heavy creak, the lock snaps open and the door swings open! Click again to exit."`, and the door unlocks (`solvedPuzzles` contains `'door_unlocked'`).
4.  **Escape:**
    *   *Action:* Click the Exit Door again (coordinates: `190, 250`).
    *   *Expected:* The Victory Screen is shown, displaying `"YOU ESCAPED!"`.
