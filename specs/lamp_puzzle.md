# Lamp & Balcony Puzzle Spec

This document details the specifications for the Lamp Puzzle, Balcony access, Trunk unlocking, and the Zipline escape in the Treehouse Escape Room.

---

## 📖 Description

The game's progression is extended past the exit door. Unlocking the exit door with the `rusty_key` now opens access to a new view—the **Balcony**. On the balcony, the player finds a **Zipline** (the escape route) and the **Pigpen Cipher Key** pinned to the wall. 

To escape, the player needs a **Zipline Harness** locked inside the heavy trunk in the **North View**. The key to this trunk—the **Brass Key**—is obtained by solving the **Lamp Puzzle** which requires setting four lamps scattered across the four views (North, East, South, Balcony) to the correct ON/OFF configuration.

---

## 🎒 Items & Props

### Main Views & Hotspots

1.  **Exit Door (South View):** Clicking the door after it is unlocked with the `rusty_key` transitions the player to the **Balcony View** (`SET_VIEW: balcony`).
2.  **Balcony View (`balcony`):** A new main view representing the wooden balcony overlooking the forest canopy.
    *   **Zipline:** A hotspot on the balcony. Clicking it with the `harness` selected triggers the escape victory condition (`TRIGGER_WIN`). Clicking it without the harness selected displays a message: *"A zipline overlooking the forest. It looks like a fast way down, but I need a harness to use it safely."*
    *   **Pinned Note (Cipher Key):** A hotspot showing a note pinned to the balcony wall. Clicking it adds the `pigpen_cipher_key` to the inventory and opens its zoom view.
    *   **Balcony Lamp:** A hotspot for the lamp on the balcony. Clicking it opens its zoom view.
3.  **Trunk (North View):**
    *   Clicking the locked trunk with the `brass_key` selected unlocks it, removes the key from the inventory, and sets the flag `trunk_unlocked`.
    *   Clicking the unlocked trunk when `harness` has not been found adds the `harness` to the inventory and sets the flag `found_harness`.
    *   Clicking the unlocked trunk after collecting the harness shows a message: *"The trunk is empty."*

### Clues (Slips of Paper)

*   **Clue 1 (East View - Painting):** Hidden behind the painting. Clicking the painting adds `clue_1` to the inventory, sets `found_clue_1`, and opens its zoom view.
*   **Clue 2 (East View - Mattress):** Hidden under the mattress. Clicking the mattress adds `clue_2` to the inventory, sets `found_clue_2`, and opens its zoom view.
*   **Clue 3 (South View - Writing Desk):** Found on the writing desk. Clicking the desk when `!found_clue_3` adds `clue_3` to the inventory, sets `found_clue_3`, and opens its zoom view.
*   **Clue 4 (North View - Stack of Books):** Hidden under the mug on the stack of books. Clicking the stack of books/mug adds `clue_4` to the inventory, sets `found_clue_4`, and opens its zoom view.

### Zoom Views

1.  **Clue Zoom Views (`clue_1_zoom`, `clue_2_zoom`, `clue_3_zoom`, `clue_4_zoom`):** Close-up views showing slips of paper with symbols written in the Pigpen cipher:
    *   `clue_1_zoom`: Displays "circle off" in Pigpen cipher.
    *   `clue_2_zoom`: Displays "triangle on" in Pigpen cipher.
    *   `clue_3_zoom`: Displays "cross on" in Pigpen cipher.
    *   `clue_4_zoom`: Displays "spiral on" in Pigpen cipher.
2.  **Cipher Key Zoom View (`cipher_key_zoom`):** Displays the grid mapping of the Pigpen cipher.
3.  **Lamp Zoom Views (`lamp_north_zoom`, `lamp_east_zoom`, `lamp_south_zoom`, `lamp_balcony_zoom`):**
    *   Each zoom view displays the close-up of a lamp.
    *   The lamp's base has a carved pattern:
        *   North Lamp: **Spiral**
        *   East Lamp: **Triangle**
        *   South Lamp: **Circle**
        *   Balcony Lamp: **Cross**
    *   Clicking the lamp inside the zoom view toggles its state between **ON** and **OFF**.
    *   The visual updates to show the lamp glowing (ON) or dark (OFF).

---

## ⚙️ Logic & State

### State Properties
*   `inventory`: Supports new items: `'clue_1'`, `'clue_2'`, `'clue_3'`, `'clue_4'`, `'pigpen_cipher_key'`, `'brass_key'`, and `'harness'`.
*   `solvedPuzzles` / Flags:
    *   `'found_clue_1'`, `'found_clue_2'`, `'found_clue_3'`, `'found_clue_4'`: Track collected clues.
    *   `'found_cipher_key'`: Tracks collection of the Pigpen Cipher Key.
    *   `'lamp_north_on'`, `'lamp_east_on'`, `'lamp_south_on'`, `'lamp_balcony_on'`: Boolean flags indicating if each lamp is ON (flags set if ON, absent/removed if OFF).
    *   `'lamp_puzzle_solved'`: Set when the correct configuration is achieved.
    *   `'trunk_unlocked'`: Set when the trunk is unlocked with the `brass_key`.
    *   `'found_harness'`: Set when the harness is collected from the trunk.

### Initial State
*   All four lamps start in the **OFF** state (none of the `'lamp_..._on'` flags are set).

### Lamp Puzzle Solution Configuration
*   The correct configuration based on the cipher clues is:
    *   **North Lamp (Spiral):** ON (`lamp_north_on`)
    *   **East Lamp (Triangle):** ON (`lamp_east_on`)
    *   **South Lamp (Circle):** OFF (`!lamp_south_on`)
    *   **Balcony Lamp (Cross):** ON (`lamp_balcony_on`)
*   When this configuration is met, the puzzle is solved:
    *   `solvedPuzzles` receives `'lamp_puzzle_solved'`.
    *   The `brass_key` is added to the inventory.
    *   A dialog is displayed: *"A hidden compartment in the bottom of the lamp popped open and revealed a brass key! It has been added to your inventory."*

---

## 🔍 Verification & Test Plan

### Test Case 1: Balcony Access & Clue Collection
1.  **Unlock Door and Enter Balcony:**
    *   *Action:* Click exit door with `rusty_key` selected. Then click exit door again.
    *   *Expected:* `currentView` is set to `'balcony'`.
2.  **Collect Cipher Key:**
    *   *Action:* Click pinned note on balcony wall.
    *   *Expected:* `pigpen_cipher_key` added to inventory, `found_cipher_key` is set, and `zoomView` is `'cipher_key_zoom'`.
3.  **Collect Clues:**
    *   *Action:* Locate and click hotspots for Painting (East), Mattress (East), Desk (South), and Books/Mug (North).
    *   *Expected:* Slips of paper (`clue_1` to `clue_4`) are added to the inventory and their respective zoom views open.

### Test Case 2: Lamp Interaction & Puzzle Solution
1.  **Toggle Lamps:**
    *   *Action:* Go to North View, click North Lamp to open zoom view. Click lamp in zoom view.
    *   *Expected:* Lamp toggles ON, `'lamp_north_on'` flag is set.
2.  **Set Complete Configuration:**
    *   *Action:* Toggle North Lamp (ON), East Lamp (ON), South Lamp (OFF), Balcony Lamp (ON).
    *   *Expected:* 
        *   `solvedPuzzles` contains `'lamp_puzzle_solved'`.
        *   `brass_key` is added to inventory.
        *   Dialog displays: *"A hidden compartment in the bottom of the lamp popped open and revealed a brass key! It has been added to your inventory."*

### Test Case 3: Trunk Unlocking & Escape
1.  **Unlock Trunk:**
    *   *Action:* Go to North View. Select `brass_key` and click Trunk.
    *   *Expected:* Trunk is unlocked (`trunk_unlocked` is set), `brass_key` is removed from inventory.
2.  **Collect Harness:**
    *   *Action:* Click Trunk again.
    *   *Expected:* `harness` is added to inventory, `found_harness` is set.
3.  **Zipline Escape:**
    *   *Action:* Go to Balcony. Select `harness` and click Zipline.
    *   *Expected:* Victory screen triggers (`TRIGGER_WIN`).
