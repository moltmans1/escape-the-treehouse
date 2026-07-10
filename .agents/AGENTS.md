# Escape the Treehouse - Agent Rules & Instructions

All coding assistants working on this codebase must follow these project-wide rules:

## 📋 Essential Specifications to Reference

* **Global Game State**: Always read and adhere to [specs/game_state.md](file:///home/moltmans/escape-the-treehouse/specs/game_state.md) to ensure all state manipulations are consistent with the project standards.
* **Master Game Plan**: Consult [PLAN.md](file:///home/moltmans/escape-the-treehouse/PLAN.md) for overall game design, layout, and navigation.

## 🛠️ Testing Invariants
* Before concluding any work that updates executable code (e.g. JavaScript, CSS, HTML), always run:
  1. Headless unit tests using `npm run test:unit`
  2. Integration E2E tests using `npm run test:e2e`
  to verify no regressions have been introduced. Running tests is not required if only documentation, specifications, or markdown (`.md`) files were changed.
* **Assess Test Coverage**: When adding new logic, puzzles, or code features, always assess whether new unit tests (under `tests/engine.test.js`) or integration/E2E tests (under `tests/escape.spec.js`) are needed to cover the new functionality.

## 📦 Git & Commit Guidelines
* After every major change, stage and create a local commit.
* Do not attempt to run `git push`; the user will handle pushing and authentication.

## 🎨 Game Mechanics & Design Patterns
* **Prefer Generated/Background Assets Over Rendered Drawings**: When displaying items, states, or zoom views, prefer using generated image assets or items already present in the background images instead of drawing vector shapes or using tints. This maintains the established visual theme.
* **Decouple Logic from Display**: Separate the game state, data model, and business logic from Phaser display logic. Puzzle validation, command interpretation, and inventory management must reside in separate headless libraries (e.g., [StateManager.js](file:///home/moltmans/escape-the-treehouse/src/engine/StateManager.js)) and be accessed from UI handlers, rather than implementing validation inside event handlers.
* **Align Hotspots Using Model Vision**: When defining interactable hotspots over background items, use the model's vision capabilities to locate objects in the background images. Remember to:
  1. **Identify Raw Bounding Box**: Find the object's boundaries in the original high-resolution background image coordinates (`[raw_x, raw_y, raw_w, raw_h]` as a top-left box, where the background image size is e.g. `1376x768`).
  2. **Calculate Scale Factors**:
     - `Scale_X = Game_Width / Image_Width` (e.g., `960 / 1376` ≈ `0.69767`)
     - `Scale_Y = Game_Height / Image_Height` (e.g., `440 / 768` ≈ `0.57292`)
  3. **Scale and Convert to Center Coordinates**:
     - First, scale the raw top-left coordinates and dimensions:
       - `Scaled_X = raw_x * Scale_X`
       - `Scaled_Y = raw_y * Scale_Y`
       - `Scaled_W = raw_w * Scale_X`
       - `Scaled_H = raw_h * Scale_Y`
     - Second, convert the scaled top-left coordinates to center coordinates:
       - `Center_X = Scaled_X + Scaled_W / 2`
       - `Center_Y = Scaled_Y + Scaled_H / 2`
  4. **Convert to Phaser Format**: Format the final parameters as `[Center_X, Center_Y, Scaled_W, Scaled_H]` for the Phaser rectangle.
  5. **Synchronize E2E Tests**: Update the corresponding click assertions in E2E tests (`tests/escape.spec.js`) to click on the new scaled center coordinates `[center_x, center_y]`.
* **Synchronize Test Cases**: When updating any puzzle configurations, keys, or combination logic, always update the corresponding assertions in both the unit tests (`tests/engine.test.js`) and the integration/E2E tests (`tests/escape.spec.js`).


