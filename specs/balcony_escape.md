# Balcony Escape Spec

This document details the specifications for the Balcony View, the collection of the Pigpen Cipher Key, the Zipline interaction, and the final escape win condition.

---

## 📖 Description

Upon unlocking the exit door with the `rusty_key`, the player can step out onto a wooden balcony overlooking the lush forest canopy. Pinned to the wall of the balcony is a note showing the key to translate the Pigpen cipher. A zipline is installed on the balcony railing, serving as the final escape route. Once the player obtains the harness from the trunk, they can use it on the zipline to slide down to safety and win the game.

---

## 🎒 Items & Props

### Balcony Scene Description

*   **Background View (`balcony`):** A wooden balcony attached to the side of the treehouse. The background shows tree branches, green leaves, and the forest floor far below under a bright sky.
*   **Balcony Lamp:** Described in [specs/lamp_puzzle.md](file:///home/moltmans/escape-the-treehouse/specs/lamp_puzzle.md).
*   **Zipline:** A metal cable anchored to the balcony railing, stretching down into the forest canopy. It has an attachment point on the shuttle for the harness but no way to ride it without a harness.
*   **Pinned Note:** A slip of paper pinned to the wooden siding of the balcony, displaying the Pigpen cipher grid layout.
*   **Door:** The other side of the door leading back into the treehouse.

### Collectibles & Inventory Items

*   **Pigpen Cipher Key (`pigpen_cipher_key`):** An item added to the inventory when the player clicks the pinned note on the balcony wall.
*   **Cipher Key Zoom View (`cipher_key_zoom`):** A close-up zoom view displaying the translation layout for the Pigpen cipher symbols (grids and crosses with dot variations).
*   **Zipline Harness (`harness`):** The inventory item retrieved from the trunk in the North View (see [specs/trunk_puzzle.md](file:///home/moltmans/escape-the-treehouse/specs/trunk_puzzle.md)).

---

## ⚙️ Logic & State

### Preconditions
*   The exit door must be unlocked (`solvedPuzzles` contains `'door_unlocked'`).

### Navigation
*   From the South View, clicking the unlocked exit door sets `currentView` to `'balcony'`.
*   From the Balcony View, clicking on the door will switch back to the inside the treehouse.
*   No other navigation is possible from the balcony, so no navigation arrows are needed.

### Pinned Note Interaction
*   *Action:* Clicking the pinned note on the balcony wall.
*   *State Changes:*
    *   `solvedPuzzles` receives `'found_cipher_key'`.
    *   `'pigpen_cipher_key'` is added to `inventory`.
    *   `zoomView` is set to `'cipher_key_zoom'` to show a close-up of the key.
    *   *Dialogue:* *"You take the pinned note from the wall. It appears to be a key for translating the strange symbols."*

### Zipline Escape Interaction
*   **Without Harness:**
    *   *Action:* Player clicks the zipline hotspot when `selectedItem` is NOT `'harness'`.
    *   *Dialogue:* *"A zipline overlooking the forest. It looks like a fast way down, but I need a harness to use it safely."*
*   **With Harness (Victory/Win Trigger):**
    *   *Action:* Player selects `'harness'` in the inventory and clicks the zipline hotspot.
    *   *State Changes:*
        *   Trigger the Phaser victory win sequence (`TRIGGER_WIN`).
    *   *Victory Behavior:* The game transitions to the victory screen displaying *"YOU ESCAPED!"* and congratulating the player.

---

## 🔍 Verification & Test Plan

### Test Case: Balcony Exploration & Escape
1.  **Step onto Balcony:**
    *   *Action:* Click exit door when `door_unlocked` is set.
    *   *Expected:* `currentView` is set to `'balcony'`.
2.  **Inspect Zipline without Harness:**
    *   *Action:* Click Zipline hotspot on the balcony.
    *   *Expected:* Dialogue displays: *"A zipline overlooking the forest. It looks like a fast way down, but I need a harness to use it safely."*
3.  **Collect Cipher Key:**
    *   *Action:* Click the pinned note on the balcony wall.
    *   *Expected:*
        *   `pigpen_cipher_key` is added to inventory.
        *   `found_cipher_key` is set.
        *   `zoomView` opens to `'cipher_key_zoom'`.
        *   Dialogue displays: *"You take the pinned note from the wall. It appears to be a key for translating the strange symbols."*
4.  **Escape using Harness:**
    *   *Action:* Select `harness` in inventory, then click Zipline.
    *   *Expected:* Victory win sequence is triggered (`TRIGGER_WIN`), transitioning the game to the victory screen.
