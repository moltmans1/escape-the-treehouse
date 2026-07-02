# Binoculars & Trees Puzzle Spec

This document details the specifications for the third puzzle in the Treehouse Escape Room: getting the safe combo of `1759`.  This is done by using binoculars to identify tree leaf shapes, correlating them with a book to find the code `1759` based on their page numbers in an index image.

---

## 📖 Description
The player must collect the Binoculars from the desk in the South View and a "Trees of North America" book from the top left wall of the East View. 

Once the Dartboard Puzzle is solved, a locked Safe was revealed. Clicking the window in the South View opens a close-up (mini-scene) of the outdoor canopy showing three trees: Oak (left), White Pine (center), and Sugar Maple (right).

Selecting the Binoculars from the inventory changes the cursor to binoculars. When selected, the player can click each tree in the window zoom-in view to inspect a zoomed-in branch and its leaf/needle shape. By cross-referencing these leaf shapes with the "Trees of North America" book (which contains page illustrations/details), the player solves the combination code `1759`.

---

## 🎒 Items & Props
*   **Binoculars (`binoculars`):** Inventory item. Collected from the desk in the South View.
*   **Trees of North America Book (`trees_book`):** Inventory item. Collected from the top-left wall of the East View. Inspecting it opens the Book Zoom View (displaying a placeholder illustration/text of leaf types).
*   **South Window (South View):** An interactive hotspot. Clicking it opens the South Window Zoom View.
*   **South Window Zoom View (`south_window_zoom`):** Opens a mini-scene showing a zoomed-in view of the outdoors with three trees:
    *   **Oak Tree (Left):** Clickable zoom hotspot (requires `binoculars` selected).
    *   **White Pine Tree (Center):** Clickable zoom hotspot (requires `binoculars` selected).
    *   **Sugar Maple Tree (Right):** Clickable zoom hotspot (requires `binoculars` selected).
*   **Oak Leaf Zoom View (`oak_leaf_zoom`):** Shows a close-up of a branch with a lobed oak leaf shape.
*   **White Pine Zoom View (`white_pine_zoom`):** Shows a close-up of a branch with pine needles clustered in groups of five.
*   **Sugar Maple Zoom View (`sugar_maple_zoom`):** Shows a close-up of a branch with a palmate maple leaf shape.

---

## 🖱️ Selected Item Cursors
When an inventory item is active/selected (i.e., `gameState.selectedItem` is not null), the mouse cursor style updates to reflect that item:
*   Selecting `binoculars` updates the cursor style to look like binoculars.
*   Selecting `origami_paper` or `paper_airplane` updates the cursor to a paper sheet/airplane graphic.
*   Selecting `trees_book` or `origami_book` updates the cursor to a book icon.
*   Selecting `rusty_key` updates the cursor to a key.
*   Deselecting the item or closing the zoom views resets the cursor to the default pointer/hand icon.

---

## ⚙️ Logic & State
*   **State Changes upon Collection:**
    *   Clicking the South View Desk adds `'binoculars'` to `gameState.inventory`.
    *   Clicking the East View top-left wall adds `'trees_book'` to `gameState.inventory`.
*   **Window Interaction:**
    *   Clicking the South Window hotspot opens `gameState.zoomView = 'south_window_zoom'`.
*   **Binoculars Leaf Zooming:**
    *   If `gameState.selectedItem === 'binoculars'`, clicking the Left, Center, or Right tree in the South Window Zoom View transitions `gameState.zoomView` to `'oak_leaf_zoom'`, `'white_pine_zoom'`, or `'sugar_maple_zoom'` respectively.
    *   Clicking these trees without selecting `binoculars` displays a neutral description text. It should not give any hints about needing more detail or using binoculars:
        *   Oak Tree: *"A tall deciduous tree with wide branches."*
        *   White Pine Tree: *"A tall evergreen tree with soft needles."*
        *   Sugar Maple Tree: *"A colorful maple tree with dense foliage."*

---

## 🔍 Verification & Test Plan
The implementation will be verified through E2E tests in a new or updated test file.

### Test Case: Binoculars Puzzle
1.  **Collect Items:**
    *   *Action:* Go to South View, click the desk (coordinates: `790, 320`).
    *   *Expected:* `binoculars` added to `inventory`.
    *   *Action:* Go to East View, click the top left wall (coordinates: `150, 120`).
    *   *Expected:* `trees_book` added to `inventory`.
2.  **Verify Custom Cursor:**
    *   *Action:* Select `binoculars` from the inventory.
    *   *Expected:* Cursor style is updated to binoculars representation.
3.  **Inspect South Window Zoom View:**
    *   *Action:* Go to South View, click the South Window (coordinates: `600, 150`).
    *   *Expected:* `zoomView` is set to `'south_window_zoom'`.
4.  **Try Inspecting Trees Without Binoculars:**
    *   *Action:* Clear selected item, click the Oak Tree (coordinates: `280, 220`).
    *   *Expected:* Dialog shows: *"A tall deciduous tree with wide branches."*
5.  **Use Binoculars to Inspect Trees:**
    *   *Action:* Select `binoculars`, click the Oak Tree (coordinates: `280, 220`).
    *   *Expected:* `zoomView` is set to `'oak_leaf_zoom'`.
    *   *Action:* Close zoom, select `binoculars`, click the White Pine (coordinates: `480, 220`).
    *   *Expected:* `zoomView` is set to `'white_pine_zoom'`.
    *   *Action:* Close zoom, select `binoculars`, click the Sugar Maple (coordinates: `680, 220`).
    *   *Expected:* `zoomView` is set to `'sugar_maple_zoom'`.
6.  **Read Trees Book:**
    *   *Action:* Close zoom, select/click `trees_book` in inventory.
    *   *Expected:* `zoomView` is set to `'trees_book'`. Shows leaf types and references.
7.  **Unlock Safe:**
    *   *Action:* Solve Dartboard puzzle to reveal Safe. Click Safe (coordinates: `385, 200`).
    *   *Expected:* `zoomView` is set to `'safe_input'`.
    *   *Action:* Input code `1759`.
    *   *Expected:* `solvedPuzzles` contains `'safe_unlocked'`, zoom view closes, and safe compartment is shown open.
8.  **Collect Key:**
    *   *Action:* Click the open safe (coordinates: `385, 200`).
    *   *Expected:* `rusty_key` is added to `inventory`, and `hasKeyInCompartment` becomes `false`.
