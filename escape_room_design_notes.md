# Treehouse Escape Room Design Notes

This document contains a structured distillation of ideas, props, and the logical puzzle flowchart for a treehouse-themed escape room game.

---

## 1. Environment & Architecture
### Rooms / Spaces
* **Main Space / Room:** The primary area where players begin.
* **Closet:** A locked or restricted secondary compartment within the main room.
* **Ladder to Look Out:** Leads upwards to a higher vantage point or a lookout station.

---

## 2. Inventory, Items, & Props
These items are scattered around the treehouse as interactive elements, background clutter, or puzzle components:
* **Furniture:** Table, chairs, hammock, trunk.
* **Tools & Optics:** Screwdriver / tool kit, telescope, magnifying glass, binoculars.
* **Thematic & Decorative Items:**
  * Dartboard
  * Origami book (orogomi)
  * Stars / constellations book or chart
  * Toys
  * Puzzle box
  * Random clutter
  * Drinks

---

## 3. Puzzle Brainstorming & Mechanics
* **Hidden Compartments:** A hidden compartment inside the tree trunk.
* **Paper Mechanics:** Folding paper into a map or code using origami.
* **Physical Triggers:** * Tilting a light fixture to reveal or open something.
  * Pressing the right board, nail, or stone in a specific sequence to yield a key or hint.
* **Vantage Points:** Using a statue's line of sight or using binoculars to scan for distant/hidden clues.
* **Exits:** A trap door leading to the roof, a ladder, and a zipline for the final escape.

---

## 4. Game Logic & Puzzle Flowchart
The following sequence outlines the linear and parallel paths required to solve the escape room:

### Path A: The Secret Sequence & The Trunk
1. **Discover Paper:** Locate a piece of paper.
2. **Origami Map/Code:** Fold the paper (`paper -> fold it into map/code`) to reveal a secret code.
3. **Board Sequence:** Use the code to press a specific sequence of wooden boards (`use code to press right sequence of boards`).
4. **Secret Compartment:** This action opens a small hidden compartment or a loose board (`open small compartment/loose board`).
5. **Acquire Key:** Grab the hidden key (`get key`).
6. **Unlock Trunk:** Use the key to unlock the main trunk (`open trunk`).
7. **Retrieve Box:** Inside the trunk, find a set of toys or a puzzle box (`find toys or puzzle box`).
8. **Solve Puzzle Box:** Open the puzzle box to retrieve a hidden clue (`open box -> get clue`).
9. **Dartboard Puzzle:** Use the puzzle box clue to arrange or throw darts into the correct segments of the dartboard (`use clue -> put darts in the right part of the dart board`).
10. **Dartboard Mechanism:** Successfully completing the dartboard task moves the board to reveal a hidden interaction point or password prompt (`dart board moves -> need password to open trap door`).

### Path B: The Optics & The Code
1. **Statue Sightline:** Observe a statue pointing towards an object or location (`see statue pointing to smth`).
2. **Binocular Scan:** Use the binoculars to look closely at what the statue is pointing at (`use binocs to see it`).
3. **Reveal Code:** This reveals a hidden code or house number (`its a code / house number?`).
4. **Input Password:** Enter this code into the system unlocked by the dartboard (`type in code`).
5. **Access Lookout:** Typing the code opens the trap door, revealing a ladder leading up to the look out (`trap door opens -> ladder to look out`).

### Path C: The Closet & The Zipline Harness
1. **Constellation Math:** Review the constellation book and use it to perform calculations or align a telescope (`look at constellations book -> make telescope math`).
2. **Closet Key:** Solving the telescope puzzle grants the key to the closet (`get key for closet`).
3. **Explore Closet:** Open the closet to find a box containing a zipline harness, which is currently locked or tied down (`open closet -> see box with harness in it -> need scissors`).
4. **Ceiling Clue:** Look up inside the closet to notice a clue painted or etched on the ceiling (`see clue on ceiling of closet`).
5. **Hanger Puzzle:** Use the ceiling clue to rotate the pole hangers inside the closet into the correct orientation (`use it to rotate pole hangers hang on`).
6. **Acquire Scissors:** Aligning the hangers opens a small latch to release a pair of scissors (`opens to get scissors`).
7. **Free the Harness:** Use the scissors to cut open or release the box containing the harness (`open box -> get harness`).

### Final Escape (The Resolution)
1. **Vantage Point Discovery:** From the ladder/lookout area, look through the telescope to locate the external zipline infrastructure (`see zip line / find telescope`).
2. **Equip Gear:** Recognize that using the zipline requires safety gear (`need harness`).
3. **Escape:** Combine the harness retrieved from the closet with the zipline platform (`get harness`).
4. **Win Condition:** Ride the zipline away from the treehouse to freedom (`fly to freedom`).
