## 2026-07-05T18:05:43Z

You are an Explorer. Investigate the codebase, in particular `src/main.js` and `src/game/treehouse.config.js`, to identify the logic for the four minigames:
1. Origami (including inspectOrigamiPaper, inspectOrigamiBook, inspectPaperAirplane)
2. Dartboard (including enterDartboardView, dart click handling, sequence checking)
3. Safe dials (including enterSafeView, dial rendering, combo checking)
4. Binoculars (including inspectSouthWindow, inspectTreeBranch, tree branch viewing)

Propose a refactoring design to extract these minigames into modular classes under `src/game/minigames/` implementing the following standard lifecycle interface:
- `onCreate(scene, container)`: Called when initialized, takes Phaser Scene and Container (or parent elements).
- `onDestroy()`: Called when closed/destroyed, must clean up all local elements, listeners, and custom textures to prevent memory leaks.
Ensure the minigames trigger actions via `scene.stateManager.executeActions(actions)`.

Create and write your findings, analysis, and proposed class definitions to `/home/moltmans/escape-the-treehouse/.agents/teamwork_preview_explorer_minigames_3/analysis.md` and notify parent.
