## 2026-07-05T18:07:22Z
You are a Worker. Please implement the minigame extraction refactoring (Milestone 1) as defined in the scope:
1. Create the four modular minigame classes under `src/game/minigames/` (OrigamiMinigame.js, DartboardMinigame.js, SafeDialsMinigame.js, BinocularsMinigame.js) implementing the standard lifecycle interface:
   - `onCreate(scene, container)`
   - `onDestroy()`
2. Update `src/main.js` to import and run these minigames.
3. Keep the existing Playwright E2E tests fully compatible. To do this, you MUST expose getters and setters for `thrownDarts` and `safeDials` on the `GameScene` class that proxy access to the active minigame instance (e.g. returning `this.activeMinigame.thrownDarts` if active, or `[]` otherwise), as E2E tests access these properties directly.
4. After implementing, run `npm run test:unit` and `npm run test:e2e` to verify that all unit and E2E tests pass perfectly.
5. Create a git commit for the changes locally (do not push).

Detailed design guidelines can be found in the synthesis document at `/home/moltmans/escape-the-treehouse/.agents/sub_orch_implementation/synthesis_m1.md` and explorer analysis at `/home/moltmans/escape-the-treehouse/.agents/teamwork_preview_explorer_minigames_3/analysis.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please write a handoff report to `/home/moltmans/escape-the-treehouse/.agents/worker_minigames/handoff.md` summarizing the changes, test results, and layout verification, then message parent.
