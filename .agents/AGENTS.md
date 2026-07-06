# Escape the Treehouse - Agent Rules & Instructions

All coding assistants working on this codebase must follow these project-wide rules:

## 📋 Essential Specifications to Reference

* **Global Game State**: Always read and adhere to [specs/game_state.md](file:///home/moltmans/escape-the-treehouse/specs/game_state.md) to ensure all state manipulations are consistent with the project standards.
* **Master Game Plan**: Consult [PLAN.md](file:///home/moltmans/escape-the-treehouse/PLAN.md) for overall game design, layout, and navigation.

## 🛠️ Testing Invariants
* Before concluding any work, always run:
  1. Headless unit tests using `npm run test:unit`
  2. Integration E2E tests using `npm run test:e2e`
  to verify no regressions have been introduced.

## 📦 Git & Commit Guidelines
* After every major change, stage and create a local commit.
* Do not attempt to run `git push`; the user will handle pushing and authentication.

## 🎨 Game Mechanics & Design Patterns
* **Prefer Generated/Background Assets Over Rendered Drawings**: When displaying items, states, or zoom views, prefer using generated image assets or items already present in the background images instead of drawing vector shapes or using tints. This maintains the established visual theme.
* **Decouple Logic from Display**: Separate the game state, data model, and business logic from Phaser display logic. Puzzle validation, command interpretation, and inventory management must reside in separate headless libraries (e.g., [StateManager.js](file:///home/moltmans/escape-the-treehouse/src/engine/StateManager.js)) and be accessed from UI handlers, rather than implementing validation inside event handlers.
* **Align Hotspots Using Model Vision**: When defining interactable hotspots over background items, use a model call to locate objects in the background images. Remember to scale the hotspot coordinates to match any scaling applied to the background images in the game view.
* **Synchronize Test Cases**: When updating any puzzle configurations, keys, or combination logic, always update the corresponding assertions in both the unit tests (`tests/engine.test.js`) and the integration/E2E tests (`tests/escape.spec.js`).


