# Cursor Specification

We want to replace the cursor with an image of the selected item from the inventory.

## 🖱️ Selected Item Cursors
* When an item is selected from the inventory, a custom CSS/browser cursor image represents the active held item across the game scene area (`y < 440`).
* When the item is deselected or removed from inventory, the cursor reverts to the default pointer (`'default'`).

## 🎯 Hover & Sizing Rules
1. **Normal Scene Hover (`y < 440`):**
   * Over non-interactive background areas in the game scene, the standard item cursor is shown (e.g. 32x32).
2. **Standard Hotspots / UI Elements:**
   * When hovering over non-matching interactive hotspots, buttons, or navigation arrows, the cursor displays the standard interactive hand pointer (`pointer`).
3. **Inventory Bar Area (`y >= 440`):**
   * When the mouse hovers over the inventory bar area, the custom item cursor image is suppressed:
     * Over empty inventory bar space: displays the standard default arrow (`default`).
     * Over clickable inventory item slots: displays the interactive hand pointer (`pointer`).
   * When the mouse moves back up into the game scene area (`y < 440`), the custom held item cursor is immediately restored.
4. **Matching Hotspots (50% Larger Highlight Cursor):**
   * When hovering over the specific "matching hotspots" for the selected item, the cursor expands to a **50% larger version** (e.g. 48x48) to indicate an active valid target.
   * **Origami Paper (`origami_paper`):**
     * Matching target: The entire open Origami Book in `origami_book` zoom view.
   * **Binoculars (`binoculars`):**
     * Matching targets: The South Window in South view, and the 3 Tree Hotspots (Left, Center, Right) in the South Window zoom view.