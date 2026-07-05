# Handoff Report: E2E Test Exploration & Phase 4 Preparation

## 1. Observation
- Verified that `tests/escape.spec.js` defines several helpers:
  - `hoverPosition(page, x, y)` (lines 5-12)
  - `dismissDialog(page)` (lines 15-28)
  - `selectBinoculars(page)` (lines 31-37)
  - `clickTree(page, side)` (lines 40-50)
  - `clickDartboardNumber(page, num)` (lines 53-72)
  - `clickKeypadButton(page, char)` (lines 75-101)
- Ran the existing E2E test suite via `npm run test:e2e`:
  ```
  Running 6 tests using 1 worker
  ✓  1 …3 › Escape the Treehouse E2E Tests › Test Case 1: Item Collection (4.4s)
  ✓  2 …3 › Escape the Treehouse E2E Tests › Test Case 2: Origami Folding (5.5s)
  ✓  3 …e the Treehouse E2E Tests › Test Case 3: Dartboard & Safe Puzzle (25.0s)
  ✓  4 …ape the Treehouse E2E Tests › Test Case 3b: Dartboard Input Lock & Reset (8.2s)
  ✓  5 …6:3 › Escape the Treehouse E2E Tests › Test Case 4: Final Escape (24.2s)
  ✓  6 …reehouse E2E Tests › Test Case 5: Dialogue Blocking & Dismissal Behavior (3.9s)
  6 passed (1.2m)
  ```
- Verified `TEST_INFRA.md` mandates 93 E2E test cases (lines 33-38):
  - Tier 1: 40 cases (5 per feature)
  - Tier 2: 40 cases (5 per feature)
  - Tier 3: 8 cases (pairwise coverage)
  - Tier 4: 5 cases (realistic application scenarios)
- Verified existing coordinate definitions in `src/game/treehouse.config.js` (lines 5-179).

## 2. Logic Chain
- **Requirement**: `TEST_INFRA.md` demands exactly 93 test cases covering 8 features across 4 tiers.
- **Deduction**: Partitioning these into 4 separate files (`tier1_happy_paths.spec.js`, `tier2_boundaries.spec.js`, `tier3_pairwise.spec.js`, `tier4_scenarios.spec.js`) under `tests/` ensures structured execution, prevents test pollution, and matches Playwright conventions.
- **Coordinate Proposals**: Designed coordinates on the 960x540 canvas to avoid overlaps (e.g. South Window `[715, 190, 370, 180]` is separate from South Lamp `[580, 280, 60, 110]`), ensuring clean point-and-click E2E interaction.

## 3. Caveats
- Read-only investigation: No code or tests are implemented yet.
- Assumed standard Phaser assets and internal state keys matching the config.

## 4. Conclusion
The comprehensive test-driven design for the 93 test cases has been fully documented in `explorer_analysis.md`. The coordinate mapping for all Phase 4 hotspots prevents overlap and is ready for implementation.

## 5. Verification Method
- Run unit tests: `npm run test:unit`
- Run integration tests: `npm run test:e2e`
- Inspect `explorer_analysis.md` to confirm the proposed structure and all 93 test cases.
