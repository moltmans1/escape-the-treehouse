# Binoculars & Trees Puzzle Spec

This document details the specifications for the third puzzle in the Treehouse Escape Room: deciphering the safe combination of `1759`. This is done by using binoculars to identify tree leaf shapes, and correlating them with a book to find page numbers in an index.

---

## 📖 Description
The player must collect the Binoculars from the window sill in the East View and a "Trees of North America" book from the top left wall of the East View. 

Clicking the window in the South View opens a close-up (mini-scene) of the outdoor canopy showing three trees: Oak (left), White Pine (center), and Sugar Maple (right).

Selecting the Binoculars from the inventory makes it the active item. When selected, the player can click each tree in the window zoom-in view to inspect a zoomed-in branch and its leaf/needle shape. By cross-referencing these leaf shapes with the "Trees of North America" book (which contains page illustrations/details), the player solves the combination code `1759` (Oak = Page 17, White Pine = Page 5, Sugar Maple = Page 9).

---

## 🎒 Items & Props
*   **Binoculars (`binoculars`):** Inventory item. Collected from the window sill in the East View.
*   **Trees of North America Book (`trees_book`):** Inventory item. Collected from the top-left wall of the East View. Inspecting it opens the Book Zoom View (displaying page numbers for different tree species).
*   **South Window (South View):** An interactive hotspot. Clicking it opens the South Window Zoom View.
*   **South Window Zoom View (`south_window_zoom`):** Opens a mini-scene showing a zoomed-in view of the outdoors with three trees:
    *   **Oak Tree (Left):** Clickable zoom hotspot (requires `binoculars` selected).
    *   **White Pine Tree (Center):** Clickable zoom hotspot (requires `binoculars` selected).
    *   **Sugar Maple Tree (Right):** Clickable zoom hotspot (requires `binoculars` selected).
*   **Oak Leaf Zoom View (`oak_leaf_zoom`):** Shows a close-up of a branch with a lobed oak leaf shape.
*   **White Pine Zoom View (`white_pine_zoom`):** Shows a close-up of a branch with pine needles clustered in groups of five.
*   **Sugar Maple Zoom View (`sugar_maple_zoom`):** Shows a close-up of a branch with a palmate maple leaf shape.

---


## ⚙️ Logic & State

### State Changes upon Collection
*   Clicking the East View Window Sill adds `'binoculars'` to `gameState.inventory`.
*   Clicking the East View top-left wall adds `'trees_book'` to `gameState.inventory`.

### Window Interaction
*   Clicking the South Window hotspot opens `gameState.zoomView = 'south_window_zoom'`.

### Binoculars Leaf Zooming
*   If `gameState.selectedItem === 'binoculars'`, clicking the Left, Center, or Right tree in the South Window Zoom View transitions `gameState.zoomView` to `'oak_leaf_zoom'`, `'white_pine_zoom'`, or `'sugar_maple_zoom'` respectively.
*   Clicking these trees without selecting `binoculars` displays a neutral description text. It does not give any hints about needing more detail or using binoculars:
    *   Oak Tree: *"A tall deciduous tree with wide branches."*
    *   White Pine Tree: *"A tall evergreen tree with soft needles."*
    *   Sugar Maple Tree: *"A colorful maple tree with dense foliage."*

---

## 🔍 Verification & Test Plan
The implementation is verified through E2E tests.

### Test Case: Binoculars Puzzle
1.  **Collect Items:**
    *   *Action:* Go to East View, click the window sill (coordinates: `605, 260`).
    *   *Expected:* `binoculars` added to `inventory`.
    *   *Action:* Go to East View, click the top left wall (coordinates: `75, 85`).
    *   *Expected:* `trees_book` added to `inventory`.
2.  **Inspect South Window Zoom View:**
    *   *Action:* Go to South View, click the South Window (coordinates: `715, 190`).
    *   *Expected:* `zoomView` is set to `'south_window_zoom'`.
3.  **Try Inspecting Trees Without Binoculars:**
    *   *Action:* Clear selected item, click the Oak Tree (coordinates: `280, 220` relative inside window zoom).
    *   *Expected:* Dialog shows: *"A tall deciduous tree with wide branches."*
4.  **Use Binoculars to Inspect Trees:**
    *   *Action:* Select `binoculars`, click the Oak Tree.
    *   *Expected:* `zoomView` is set to `'oak_leaf_zoom'`.
    *   *Action:* Close zoom, select `binoculars`, click the White Pine.
    *   *Expected:* `zoomView` is set to `'white_pine_zoom'`.
    *   *Action:* Close zoom, select `binoculars`, click the Sugar Maple.
    *   *Expected:* `zoomView` is set to `'sugar_maple_zoom'`.
5.  **Read Trees Book:**
    *   *Action:* Close zoom, select/click `trees_book` in inventory.
    *   *Expected:* `zoomView` is set to `'trees_book'`. Shows leaf types and references.
