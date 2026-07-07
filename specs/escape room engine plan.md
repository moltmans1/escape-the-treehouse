# Technical Specification & Configuration Blueprint: Escape the Treehouse
## 1. System Architecture & Component Design
The objective of this refactoring is to completely decouple the Phaser 3 rendering lifecycle from the core game logic. The application is divided into a **Headless Engine Core** (pure, platform-agnostic JavaScript) and a **Phaser Shell** (responsible solely for visual representation, input registration, and audio).
### 1.1 Architecture Overview
```text
+-----------------------------------------------------------------------+
|                             PHASER SHELL                              |
|   Coordinates Input events, visual renders, asset loads & animations  |
+------------------------------------+----------------------------------+
                                     | Dispatches User Inputs
                                     v
+-----------------------------------------------------------------------+
|                           CORE ENGINE CORE                            |
|               (100% Headless, Pure JS, Node-Compatible)               |
|                                                                       |
|  +---------------------+   Processes   +---------------------------+  |
|  |     Interpreter     |-------------->|       StateManager        |  |
|  | Evaluates DSL rules |               | In-memory items & flags   |  |
|  +---------------------+               +-------------+-------------+  |
|             ^                                        |                |
|             | Reads Targets                          v Emits Mutations|
|  +----------+----------+               +-------------+-------------+  |
|  |    ViewManager      |               |      Event Bus / UI       |  |
|  | Carousel & Zoom state|               | Directs Phaser UI updates |  |
|  +---------------------+               +---------------------------+  |
+-----------------------------------------------------------------------+

```
### 1.2 Core Module Implementations
#### StateManager (src/engine/StateManager.js)
Manages inventory mutations, game flags, and actively dispatches state transition events.
```javascript
export class StateManager {
  constructor() {
    this.state = {
      inventory: [],
      selectedItem: null,
      solvedPuzzles: new Set(),
      currentView: 'north',
      zoomView: null
    };
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  hasFlag(flag) {
    if (flag.startsWith('!')) return !this.state.solvedPuzzles.has(flag.substring(1));
    return this.state.solvedPuzzles.has(flag);
  }

  setFlag(flag) {
    this.state.solvedPuzzles.add(flag);
    this.emit('state_changed', this.state);
  }

  addItem(item) {
    if (!this.state.inventory.includes(item)) {
      this.state.inventory.push(item);
      this.emit('inventory_changed', this.state.inventory);
    }
  }

  removeItem(item) {
    this.state.inventory = this.state.inventory.filter(i => i !== item);
    if (this.state.selectedItem === item) this.state.selectedItem = null;
    this.emit('inventory_changed', this.state.inventory);
  }

  selectItem(item) {
    this.state.selectedItem = (this.state.selectedItem === item) ? null : item;
    this.emit('inventory_changed', this.state.inventory);
  }
}

```
#### Interpreter (src/engine/Interpreter.js)
Evaluates declarative condition blocks against the live state matrix and provides operational instruction arrays.
```javascript
export class Interpreter {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }

  evaluateInteraction(interactionArray) {
    for (const block of interactionArray) {
      let passed = true;

      if (block.if_flag && !this.stateManager.hasFlag(block.if_flag)) passed = false;
      if (block.if_selected_item && this.stateManager.state.selectedItem !== block.if_selected_item) passed = false;

      if (passed || block.else) {
        return block.then || block.else;
      }
    }
    return [];
  }
}

```
## 2. Targeted Headless Test Suite
This test suite executes in a pure Node/Vitest/Jest environment with zero window, document, or canvas dependencies.
```javascript
// tests/engine.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../src/engine/StateManager';
import { Interpreter } from '../src/engine/Interpreter';

describe('Escape Room Headless Core Engine', () => {
  let state;
  let interpreter;

  beforeEach(() => {
    state = new StateManager();
    interpreter = new Interpreter(state);
  });

  it('should collect items and flag dependencies correctly', () => {
    const rules = [
      {
        if_flag: "!found_item",
        then: ["SET_FLAG: found_item", "ADD_INVENTORY: testing_object"]
      }
    ];

    const actions = interpreter.evaluateInteraction(rules);
    expect(actions).toContain("SET_FLAG: found_item");
    expect(actions).toContain("ADD_INVENTORY: testing_object");

    state.setFlag("found_item");
    state.addItem("testing_object");

    expect(state.state.inventory).toContain("testing_object");
    expect(state.hasFlag("found_item")).toBe(true);
  });

  it('should block conditional processing when required item is not highlighted', () => {
    const rules = [
      {
        if_selected_item: "special_key",
        then: ["TRIGGER_WIN"]
      },
      {
        else: ["SHOW_DIALOG: Locked tight."]
      }
    ];

    let actions = interpreter.evaluateInteraction(rules);
    expect(actions).toContain("SHOW_DIALOG: Locked tight.");

    state.addItem("special_key");
    state.selectItem("special_key");

    actions = interpreter.evaluateInteraction(rules);
    expect(actions).toContain("TRIGGER_WIN");
  });
});

```
## 3. Incremental Migration Plan
 * **Phase 1: Headless Architecture Foundation**
   * Create src/engine/StateManager.js and src/engine/Interpreter.js.
   * Verify setup by executing tests/engine.test.js completely headlessly.
 * **Phase 2: Data Configuration Integration**
   * Introduce src/game/treehouse.config.js.
   * Modify GameScene.js to clear hardcoded switch blocks and dynamically map view assets using the data file.
 * **Phase 3: Event Hook Refactor**
   * Replace interior hotspot action methods with event triggers processed through Interpreter.js.
   * Bind inventory slots and textual overlays to update exclusively via state_changed listeners.
 * **Phase 4: Componentizing Minigames**
   * Extract Dartboard input sequencers and Safe Dial arrays into dedicated subclasses.
   * Route puzzle victory states to update the engine via command strings like SET_FLAG: dartboard_solved.
 * **Phase 5: Deprecation & Final Testing**
   * Remove legacy global trackers and dead branches within main.js.
   * Run comprehensive end-to-end integration verifications.
## 4. Plot Setup & Puzzle Flow Guide
### 4.1 Scenario Overview
The player awakens locked inside a high-altitude wilderness treehouse canopy. The access ladder is blocked by a heavy trapdoor platform. Escape requires navigating ecological clues and hidden mechanisms distributed throughout the room.
### 4.2 Taxonomy of Items
 * origami_paper: Clean white square sheet found beneath pillows.
 * origami_book: Structural guide mapping physical crease combinations.
 * trees_book: Field guide documenting regional botanical species profiles.
 * binoculars: Optical magnification lenses used to survey external points of interest.
 * paper_airplane: Folded projectile revealing a precise three-digit sequence pattern.
 * rusty_key: Heavy antique security key concealed behind wall fixtures.
### 4.3 Logic Progression Flow
```text
                  +-------------------+
                  |  Explore Room     |
                  +---------+---------+
                            |
           +----------------+----------------+
           v                                 v
+--------------------+             +--------------------+
| Find Origami Book  |             | Find Origami Paper |
+----------+---------+             +---------+----------+
           |                                 |
           +----------------+----------------+
                            |
                            v Combine Items
                 +--------------------+
                 |   Paper Airplane   |
                 +----------+---------+
                            | Inspects Clue
                            v (Code: 13-20-10)
                 +--------------------+
                 |  Dartboard Puzzle  |
                 +----------+---------+
                            | Unlocks Safe Location
                            v
+--------------------+   Reveals   +--------------------+
| Find 'Trees' Book  |             | Four-Dial Safe Wall|
+----------+---------+             +---------+----------+
           | Look up Pages                   | Input Combination
           v (Oak=17, Pine=5, Maple=9)       v (Combination: 1759)
+--------------------------------------------+----------+
|            Acquire Secure Lock Box Key                |
+---------------------------+---------------------------+
                            |
                            v Apply Key to Exit Padlock
+--------------------------------------------+
|            ESCAPE TREEHOUSE WALLS          |
+--------------------------------------------+

```
### 4.4 Riddle Breakdowns
 1. **The Dartboard Pattern:** The raw paper contains scrambled integers (13, 5, 20, 8, 10, 42) at various rotations. Combining it with the instructions in the Origami Guide creates a paper airplane, bringing key alignments into view that isolate 13, 20, and 10 as a sequence.
 2. **The Dial Combination Lock:** Looking out the South Window reveals three trees: an Oak (left), a White Pine (center), and a Sugar Maple (right). Cross-referencing these species with their dedicated indices in the "Trees of North America" field guide yields their page coordinates: Oak (Page 17), Pine (Page 5), and Maple (Page 9). This translates to the master entry code: 1759.
## 5. Static Room Configuration Data
Save this module to src/game/treehouse.config.js to drive the decoupled game loops.
```javascript
export const TreehouseConfig = {
  roomName: "Escape the Treehouse",
  initialView: "north",
  
  views: {
    north: {
      backgroundImage: "bg_north",
      hotspots: [
        {
          name: "hammock",
          rect: [260, 290, 370, 180],
          interactions: [
            {
              if_flag: "!found_paper",
              then: [
                "SET_FLAG: found_paper",
                "ADD_INVENTORY: origami_paper",
                "SHOW_DIALOG: Underneath the pillow, you find a sheet of paper."
              ]
            },
            {
              else: [
                "SHOW_DIALOG: A comfortable hammock. There's nothing else under the pillow."
              ]
            }
          ]
        },
        {
          name: "bookshelves",
          rect: [850, 170, 210, 260],
          interactions: [
            {
              if_flag: "!found_book",
              then: [
                "SET_FLAG: found_book",
                "ADD_INVENTORY: origami_book",
                "SHOW_DIALOG: You search the bookshelves and find an Origami Guide."
              ]
            },
            {
              else: [
                "SHOW_DIALOG: Various novels and guides about forest lore."
              ]
            }
          ]
        },
        {
          name: "trunk",
          rect: [800, 380, 240, 120],
          interactions: [
            {
              else: [
                "SHOW_DIALOG: It's a heavy iron-banded trunk. The padlock is rusted shut and won't budge. There doesn't seem to be a way to open it."
              ]
            }
          ]
        }
      ]
    },

    east: {
      backgroundImage: "bg_east",
      hotspots: [
        {
          name: "trees_book_shelf",
          rect: [75, 85, 150, 130],
          interactions: [
            {
              if_flag: "!found_trees_book",
              then: [
                "SET_FLAG: found_trees_book",
                "ADD_INVENTORY: trees_book",
                "REFRESH_GRAPHICS",
                "SHOW_DIALOG: On a small wooden shelf on the wall, you find a book titled 'Trees of North America'."
              ]
            },
            {
              else: [
                "SHOW_DIALOG: A small wooden shelf on the wall."
              ]
            }
          ]
        },
        {
          name: "binoculars",
          rect: [592, 282, 58, 58],
          interactions: [
            {
              if_flag: "!found_binoculars",
              then: [
                "SET_FLAG: found_binoculars",
                "ADD_INVENTORY: binoculars",
                "REFRESH_GRAPHICS",
                "SHOW_DIALOG: On the window sill, you find a pair of binoculars."
              ]
            },
            {
              else: [
                "SHOW_DIALOG: Various plants sit on the window sill."
              ]
            }
          ]
        }
      ]
    },

    south: {
      backgroundImage: "bg_south",
      hotspots: [
        {
          name: "exit_door",
          rect: [185, 270, 230, 340],
          interactions: [
            {
              if_flag: "door_unlocked",
              then: ["TRIGGER_WIN"]
            },
            {
              if_selected_item: "rusty_key",
              then: [
                "SET_FLAG: door_unlocked",
                "REMOVE_INVENTORY: rusty_key",
                "SHOW_DIALOG: You insert the rusty old key into the padlock. With a heavy creak, the lock snaps open and the door swings open! Click again to exit."
              ]
            },
            {
              else: [
                "SHOW_DIALOG: The exit door is locked tight. The padlock is extremely old and rusty."
              ]
            }
          ]
        },
        {
          name: "writing_desk",
          rect: [780, 355, 360, 170],
          interactions: [
            {
              else: [
                "SHOW_DIALOG: A cozy writing desk with some inkwells and loose sheets of scrap paper."
              ]
            }
          ]
        },
        {
          name: "south_window",
          rect: [715, 190, 370, 180],
          interactions: [
            {
              else: ["OPEN_ZOOM_VIEW: south_window_zoom"]
            }
          ]
        },
        {
          name: "dartboard_safe_zone",
          rect: [366, 171, 118, 96],
          interactions: [
            {
              if_flag: "safe_unlocked",
              then: [
                "LAUNCH_MINIGAME: open_safe_compartment"
              ]
            },
            {
              if_flag: "dartboard_solved",
              then: [
                "OPEN_ZOOM_VIEW: safe_input"
              ]
            },
            {
              else: [
                "OPEN_ZOOM_VIEW: dartboard_view"
              ]
            }
          ]
        }
      ]
    }
  },

  zoomViews: {
    origami_paper: { title: "A sheet of paper", asset: "graphics_built_card" },
    origami_book: { title: "Origami Guide", asset: "open_origami_book" },
    paper_airplane: { title: "Folded Paper Airplane", asset: "paper_airplane_clue" },
    trees_book: { title: "Trees of North America", asset: "open_book" }
  },

  minigames: {
    dartboard_view: {
      type: "sequential_sequence",
      target: [13, 20, 10],
      onSuccess: [
        "SET_FLAG: dartboard_solved",
        "REMOVE_INVENTORY: paper_airplane",
        "REFRESH_GRAPHICS",
        "SHOW_DIALOG: With a soft click, a secret compartment slides open behind the dartboard, revealing a Rusty Old Key."
      ]
    },
    safe_input: {
      type: "rotary_dials",
      combination: "1759",
      onSuccess: [
        "SET_FLAG: safe_unlocked",
        "REFRESH_GRAPHICS",
        "SHOW_DIALOG: With a heavy mechanical click, the safe swings open, revealing a Rusty Old Key inside!"
      ]
    }
  }
};

```
