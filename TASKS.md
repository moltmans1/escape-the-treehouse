# Escape the Treehouse - Task Roadmap

This document outlines the three separate tasks we will execute in sequential conversations to refine and polish the game. Splitting the work this way keeps our conversation context windows clean, token-efficient, and highly focused.

---

## 📌 Task 1: Fix the Cursors (Next Conversation)

### 🎯 Goal
Ensure that custom item cursors (e.g. Binoculars `🔭`, Key `🔑`) remain active and visible when hovering over interactive canvas elements (hotspots, navigation arrows, inventory slots), instead of being overridden by Phaser's default `'pointer'` hand cursor.

### 📋 Specifications
1.  **Cursor Override:**
    *   When an inventory item is selected (i.e. `gameState.selectedItem` is not null), the mouse cursor must display that item's custom cursor *everywhere* on the game canvas.
    *   Phaser's default hand cursor behavior (`useHandCursor`) must be suppressed or overridden while an item is active.
2.  **Standard Cursor Behavior:**
    *   When no inventory item is selected, the game should display the standard pointer over empty space and the hand cursor (`pointer`) over interactive hotspots.
3.  **Supported Items & Icons:**
    *   Binoculars (`binoculars`) $\rightarrow$ `🔭`
    *   Sheet of Paper (`origami_paper`) $\rightarrow$ `📄`
    *   Rusty Old Key (`rusty_key`) $\rightarrow$ `🔑`
    **Unsupported Items & Icons:***
    Don't include for anything not listed above.
    *   Paper Airplane (`paper_airplane`) $\rightarrow$ `✈️`
    *   Origami Book & Trees Book (`origami_book`, `trees_book`) $\rightarrow$ `📖`
4.  **Verification:**
    *   Run E2E tests using `npm run test:e2e` to verify all state flows are unchanged and pass.

---

## 📌 Task 2: Reposition Hotspots & Items (Second Conversation)

### 🎯 Goal
Align the interactive hotspot rectangles and item collection coordinates in the game with the actual visual items shown in the background images (`bg_north.jpg`, `bg_east.jpg`, `bg_south.jpg`).

### 📋 Specifications
1.  **Asset Inspection:**
    *   Inspect/analyze the background image coordinates.
    *   Match interactive zones to the visual bounds of:
        *   **North View:** Hammock (origami paper) and Bookshelf (origami book).
        *   **East View:** Trees Book shelf and the circular South window frame.
        *   **South View:** Writing desk (binoculars), Dartboard/Safe, and the Exit Door.
2.  **Code Updates:**
    *   Update hotspot dimensions and positions in `src/main.js`'s `updateHotspots()` and `updateDynamicGraphics()`.
    *   Synchronize the E2E click coordinates in `tests/escape.spec.js` to match the new visual locations.
3.  **Verification:**
    *   Ensure all 4 E2E tests pass cleanly with the new coordinates.

---

## 📌 Task 3: Update the Visuals & Assets (Third Conversation)

### 🎯 Goal
Replace remaining procedural Phaser vector drawings with high-fidelity image assets and custom layouts to create a premium-feeling escape room. Keep all visual styling consistent with the 3 main room views. For each sub task below ask questions if the instructions are unclear. Let me review the images before updating the code hotspots where necessary.

### 📋 Specifications
1.  **High-Fidelity Dartboard:**
    *   Replace the procedurally drawn dartboard with a clean **Dartboard image asset**.
    *   Ensure that segment clicking (`13 -> 20 -> 10`) still maps correctly over the image structure.
    *   Provide a second **rotated/open dartboard image** (or adjust rendering) to display the dartboard hanging down once the safe is revealed.
    *   Maybe remove the dartboard from the background image and just include the darboard image asset as the dartboard in both the room and in the dartboard mini-scene.
2.  **Trees Book Close-up:**
    *   Replace the index page text layout with a custom styled graphical mockup showing leaf silhouettes and page details. There should be images on both pages of the open book.  Each one should be the tree profile image, leaf and branch closeup and reference to the correct page number to correspond to the code.
    **Tree miniscene:**
    *   When zooming in on each tree do not have any text but make sure the leaf image matches the one in the tree book. The trees for the background image should be generated to also match. Stylistically match it to the background image from the treehouse view.
3.  **Safe & Keypad Lock:**
    *   Style the Safe to look old and have 4 dials with numbers instead of a numberic keypad.  This will require changes to the spec and implementation for that puzzle.
4.  **Micro-animations:**
    *   Add transitions (e.g. fade-ins for zoom overlays, hover scale expansions for slots and buttons).
5.  **Binoculars**
    *   Update the inventory icon to be binoculars instead of telescope.
    *   Keep the binoculars drawn directly in the background image `bg_east.jpg`. Clicking the hotspot around the binoculars on the windowsill (615, 320) collects the binoculars into the inventory, but doesn't change the background image (no separate image needs to be layered on top).
    **Origami Paper and origami book**
    *   Origami paper should not have rounded edges.
    *   Update the style to match the style of the room.
    **Delete the bg_west assets**
    *   We don't need them remove them.
6.  **Verification:**
    *   All E2E tests must pass successfully.
