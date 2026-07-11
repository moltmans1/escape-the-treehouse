# Trunk Puzzle Spec

This document details the specifications for the Trunk in the North View, covering its locking mechanisms, key requirement, and how the zipline harness is acquired.

---

## 📖 Description

The decorative trunk in the North View contains the zipline harness necessary for the final escape. However, it is locked shut and requires the **Brass Key** (obtained by solving the Lamp Puzzle) to open. Once unlocked, the player can inspect the trunk to retrieve the harness.

---

## 🎒 Items & Props

*   **Locked Trunk (North View):** An interactive hotspot in the Cozy Corner (North View).
*   **Brass Key (`brass_key`):** The inventory item used to unlock the trunk.
*   **Zipline Harness (`harness`):** The item found inside the unlocked trunk, needed to safely use the zipline.

---

## ⚙️ Logic & State

### State Properties
*   `inventory`:
    *   `'brass_key'`: Required to unlock the trunk. Removed upon successful unlock.
    *   `'harness'`: Collected from the unlocked trunk and added to the inventory.
*   `solvedPuzzles` / Flags:
    *   `'trunk_unlocked'`: Set to indicate the trunk has been opened.
    *   `'found_harness'`: Set to indicate the harness has been collected.

### Interaction Flows

1.  **Locked Trunk (Without Key):**
    *   *Action:* Player clicks the trunk hotspot when `'trunk_unlocked'` is not set, and `selectedItem` is NOT `'brass_key'`.
    *   *Dialogue:* *"It's a heavy iron-banded trunk. It is locked and you don't have a key."*
2.  **Unlocking the Trunk & Collecting the Harness (With Key):**
    *   *Action:* Player selects `'brass_key'` in inventory and clicks the trunk hotspot.
    *   *State Changes:*
        *   `solvedPuzzles` receives `'trunk_unlocked'`.
        *   `solvedPuzzles` receives `'found_harness'`.
        *   `'brass_key'` is removed from `inventory`.
        *   `'harness'` is added to `inventory`.
        *   `selectedItem` is set to `null`.
    *   *Dialogue:* *"You insert the brass key into the lock and turn it. With a loud click, the trunk swings open. Inside, you find a zipline harness! It has been added to your inventory."*
3.  **Inspecting empty open trunk:**
    *   *Action:* Player clicks the trunk hotspot when `'trunk_unlocked'` is set.
    *   *Dialogue:* *"The trunk is empty."*

---

## 🔍 Verification & Test Plan

### Test Case: Unlocking Trunk and Retrieving Harness
1.  **Check Locked State:**
    *   *Action:* Click Trunk without selecting a key.
    *   *Expected:* Dialogue displays: *"It's a heavy iron-banded trunk. It is locked and you don't have a key."*
2.  **Unlock Trunk and Get Harness:**
    *   *Action:* Select `brass_key` and click Trunk.
    *   *Expected:*
        *   Trunk is unlocked (`trunk_unlocked` is set).
        *   Harness is found (`found_harness` is set).
        *   `brass_key` is removed from inventory.
        *   `harness` is added to inventory.
        *   Dialogue displays: *"You insert the brass key into the lock and turn it. With a loud click, the trunk swings open. Inside, you find a zipline harness! It has been added to your inventory."*
3.  **Verify Empty Trunk:**
    *   *Action:* Click Trunk again.
    *   *Expected:* Dialogue displays: *"The trunk is empty."*
