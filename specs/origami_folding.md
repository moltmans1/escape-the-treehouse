# Origami Folding Spec

This document details the specifications for the first puzzle in the Treehouse Escape Room: finding the materials and folding the paper airplane clue.

---

## 📖 Description
The player must find a sheet of paper hidden under a pillow in the hammock and search the bookshelves to find an origami folding guide. By selecting the paper in their inventory while viewing the guide, they fold the paper into a paper airplane, which reveals a code sequence clue on its wings.

---

## 🎒 Items & Props
*   **Hammock (North View):** An interactive hotspot. Clicking it yields the `origami_paper` item.
*   **Bookshelf (North View):** An interactive hotspot. Clicking it yields the `origami_book` item.
*   **Sheet of Paper (`origami_paper`):** Inventory item. Before folding, inspecting it shows random decoy numbers.
*   **Origami Book (`origami_book`):** Inventory item. Inspecting it opens the Book Zoom View, which displays instructions on how to fold an airplane.
*   **Paper Airplane (`paper_airplane`):** Inventory item. Created by combining the paper and the book. Inspecting it displays a zoom-in of the plane wings showing the numbers `13 20 10`.

---

## ⚙️ Logic & State
*   **Preconditions:**
    *   Hammock hotspot has not been clicked yet (`!inventory.includes('origami_paper')` and paper is not consumed).
    *   Bookshelf hotspot has not been clicked yet (`!inventory.includes('origami_book')` and book is not consumed).
*   **Folding Trigger:**
    *   `gameState.zoomView` is `'origami_book'`.
    *   `gameState.selectedItem` is `'origami_paper'`.
    *   Player clicks on the folding zone (right page) in the book zoom view.
*   **State Changes upon Folding:**
    *   `origami_paper` and `origami_book` are removed from `gameState.inventory`.
    *   `paper_airplane` is added to `gameState.inventory`.
    *   `gameState.zoomView` transitions to `'paper_airplane'`.
    *   `gameState.selectedItem` is reset to `null`.

---

## 🔍 Verification & Test Plan
The implementation of this puzzle is verified through E2E tests in [escape.spec.js](file:///home/moltmans/escape-the-treehouse/tests/escape.spec.js#L21-L135).

### Test Case 1: Item Collection
1.  **Hammock Interaction:**
    *   *Action:* Click the hammock.
    *   *Expected:* `dialogText` equals `"Underneath the pillow, you find a sheet of paper."`, and `origami_paper` is present in `inventory`.
2.  **Duplicate Prevention (Hammock):**
    *   *Action:* Dismiss the dialog, click the hammock again.
    *   *Expected:* `dialogText` equals `"A comfortable hammock. There's nothing else under the pillow."`, and `inventory` does not contain duplicate `origami_paper`.
3.  **Bookshelf Interaction:**
    *   *Action:* Click the bookshelf.
    *   *Expected:* `dialogText` equals `"You found an Origami book."`, and `origami_book` is present in `inventory`.
4.  **Duplicate Prevention (Bookshelf):**
    *   *Action:* Dismiss the dialog, click the bookshelf again.
    *   *Expected:* `dialogText` equals `"Various novels and guides."`, and `inventory` does not contain duplicate `origami_book`.

### Test Case 2: Origami Folding
1.  **Open Origami Book:**
    *   *Action:* Click `origami_book` in the inventory.
    *   *Expected:* `zoomView` is set to `'origami_book'`.
2.  **Select Sheet of Paper:**
    *   *Action:* Click `origami_paper` in the inventory while the zoom view is active.
    *   *Expected:* `selectedItem` is set to `'origami_paper'`, and `zoomView` remains `'origami_book'` (does not trigger paper zoom view).
3.  **Perform Folding Action:**
    *   *Action:* Click the right page folding zone.
    *   *Expected:* `zoomView` transitions to `'paper_airplane'`. `inventory` has items `origami_paper` and `origami_book` removed and `paper_airplane` added.
4.  **Inspect Paper Airplane:**
    *   *Action:* Close the zoom view, select/click `paper_airplane` in the inventory.
    *   *Expected:* `zoomView` is set to `'paper_airplane'`. The graphic shows the sequence `13 20 10` on the folded wings.
