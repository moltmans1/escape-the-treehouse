# Lamp Puzzle Spec

This document details the specifications for the Lamp Puzzle in the Treehouse Escape Room, focusing on the visual representation, interaction mechanics, clues, and combination logic of the four lamps.

---

## 📖 Description

The player must discover and configure the correct ON/OFF state for the four lamps scattered across the treehouse's views (North, East, South, and the Balcony). The correct configuration is solved by finding and deciphering four pigpen cipher clues hidden throughout the room.

---

## 🎒 Items & Props

### Room Lamps

1.  **North Lamp (North View):** Located on the bookshelf. Has a carved **Spiral** pattern on its base.
2.  **East Lamp (East View):** Located next to the window. Has a carved **Triangle** pattern on its base.
3.  **South Lamp (South View):** Located near the writing desk. Has a carved **Circle** pattern on its base.
4.  **Balcony Lamp (Balcony View):** Located on the balcony rail. Has a carved **Cross** pattern on its base.

### Combination Clues (Slips of Paper)

*   **Clue 1 (East View - Painting):**
    *   *Location:* Hidden behind the painting in the East View. Clicking the painting adds `'clue_1'` to the inventory and sets `'found_clue_1'`.
    *   *Zoom View (`clue_1_zoom`):* Shows a slip of paper with "circle off" written in the Pigpen cipher.
*   **Clue 2 (East View - Mattress):**
    *   *Location:* Hidden under the mattress in the East View. Clicking the mattress adds `'clue_2'` to the inventory and sets `'found_clue_2'`.
    *   *Zoom View (`clue_2_zoom`):* Shows a slip of paper with "triangle on" written in the Pigpen cipher.
*   **Clue 3 (South View - Writing Desk):**
    *   *Location:* Found on the writing desk. Clicking the desk when `'found_clue_3'` is not set adds `'clue_3'` to the inventory and sets `'found_clue_3'`.
    *   *Zoom View (`clue_3_zoom`):* Shows a slip of paper with "cross on" written in the Pigpen cipher.
*   **Clue 4 (North View - Stack of Books):**
    *   *Location:* Found under the mug on the stack of books in the North View. Clicking the stack of books/mug adds `'clue_4'` to the inventory and sets `'found_clue_4'`.
    *   *Zoom View (`clue_4_zoom`):* Shows a slip of paper with "spiral on" written in the Pigpen cipher.

### Zoom Views & Interactive Mechanics

*   **Lamp Zoom Views (`lamp_north_zoom`, `lamp_east_zoom`, `lamp_south_zoom`, `lamp_balcony_zoom`):**
    *   Clicking any lamp in the main room views opens its close-up zoom view.
    *   In the zoom view, the carved pattern (Spiral, Triangle, Circle, or Cross) is clearly visible on the base of the lamp.
    *   Clicking the lamp itself inside the zoom view toggles its state between **ON** and **OFF**.
    *   The visual rendering updates dynamically:
        *   **ON state:** Displays a glowing lamp graphic.
        *   **OFF state:** Displays a dark lamp graphic.
    *   A close button (top right) closes the zoom view.

---

## ⚙️ Logic & State

### State Properties
*   `solvedPuzzles` / Flags:
    *   `'lamp_north_on'`, `'lamp_east_on'`, `'lamp_south_on'`, `'lamp_balcony_on'`: Track the ON/OFF states (flags are present/set if the lamp is ON, and absent/removed if the lamp is OFF).
    *   `'lamp_puzzle_solved'`: Boolean flag set when the puzzle is successfully solved.
*   `inventory`:
    *   `'brass_key'`: Added to the inventory once the puzzle is solved.

### Preconditions
*   The Balcony view must be accessible to interact with the Balcony Lamp (the exit door must be unlocked and opened first).

### Initial State
*   All four lamps start in the **OFF** state (no `'lamp_..._on'` flags are set in `solvedPuzzles`).

### Solution Configuration
*   The correct configuration of the four lamps is:
    *   **North Lamp (Spiral):** ON (`lamp_north_on`)
    *   **East Lamp (Triangle):** ON (`lamp_east_on`)
    *   **South Lamp (Circle):** OFF (`!lamp_south_on`)
    *   **Balcony Lamp (Cross):** ON (`lamp_balcony_on`)
*   When the player toggles any lamp, the system checks if the current state of all four lamps matches the solution.
*   As soon as the states match:
    *   `solvedPuzzles` receives `'lamp_puzzle_solved'`.
    *   `brass_key` is added to `inventory`.
    *   A dialog is displayed: *"A hidden compartment in the bottom of the lamp popped open and revealed a brass key! It has been added to your inventory."*

---

## 🔍 Verification & Test Plan

### Test Case: Toggling Lamps & Solving Puzzle
1.  **Toggle Lamp ON:**
    *   *Action:* Click North Lamp in North View. Click lamp inside `lamp_north_zoom`.
    *   *Expected:* Lamp glows (displays ON graphic), and `solvedPuzzles` contains `'lamp_north_on'`.
2.  **Toggle Lamp OFF:**
    *   *Action:* Click North Lamp again inside `lamp_north_zoom`.
    *   *Expected:* Lamp goes dark (displays OFF graphic), and `'lamp_north_on'` is removed from `solvedPuzzles`.
3.  **Solve Puzzle:**
    *   *Action:* Configure the lamps to the correct combination (North=ON, East=ON, South=OFF, Balcony=ON).
    *   *Expected:*
        *   `solvedPuzzles` contains `'lamp_puzzle_solved'`.
        *   `brass_key` is added to `inventory`.
        *   Dialog displays: *"A hidden compartment in the bottom of the lamp popped open and revealed a brass key! It has been added to your inventory."*
