# Synthesis - Milestone 1: Modular Minigames

## Consensus
We have analyzed the four minigames (Origami, Dartboard, Safe Dials, Binoculars) in `src/main.js` and have developed a consensus design to modularize them under `src/game/minigames/` implementing the `onCreate(scene, container)` and `onDestroy()` lifecycle interface.

1. **OrigamiMinigame.js**: Decouples the origami book, unfolded paper, and paper airplane views.
2. **DartboardMinigame.js**: Decouples the dartboard rendering, click angle calculation, and sequential sequence check. To prevent memory leaks, its `onDestroy()` will clean up `this.checkTimer` and destroy all spawned darts.
3. **SafeDialsMinigame.js**: Decouples safe dials casing, dial text rotation, click hit zones, and tweens. Teardown handles removal of dial tweens and interactive hit zones.
4. **BinocularsMinigame.js**: Decouples south window view with hotspots for left/center/right trees and tree branch zoom views.

### E2E Compatibility Requirements
To ensure the automated Playwright E2E tests pass without modification:
1. `GameScene` in `src/main.js` must expose getters/setters for `thrownDarts` and `safeDials` that proxy access to the active minigame instance (e.g. `this.activeMinigame.thrownDarts` and `this.activeMinigame.safeDials`).
2. The global `window.__gameState` must still correctly reflect game state changes via `StateManager`.
