# E2E Test Infra: Escape Room Decoupling

## Test Philosophy
- Opaque-box, requirement-driven. Direct dependency only on exposed interfaces, not implementation internals.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workloads.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Origami folding | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 2 | Dartboard puzzle | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 3 | Binoculars/trees inspection | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 4 | Safe dials | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 5 | Exit Door | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 6 | Lamps puzzle | PLAN.md (Phase 4) | 5 | 5 | ✓ |
| 7 | Trunk puzzle | PLAN.md (Phase 4) | 5 | 5 | ✓ |
| 8 | Zipline Escape | PLAN.md (Phase 4) | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Playwright, run via `npm run test:e2e` (passing/failing on exit code).
- Test case format: Automated Playwright script interacting with canvas coordinates or state manager proxy, asserting correct state transitions and UI elements.
- Directory layout: `tests/escape.spec.js` and custom generated tests under `tests/`.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Standard Walkthrough | F1, F2, F3, F4, F5, F6, F7, F8 | High |
| 2 | Quick Escape (State Jump) | F5, F6, F7, F8 | Medium |
| 3 | Mistake Recovery | F1, F2, F4 | Medium |
| 4 | Empty Zoom Views & Inspects | F1, F3, F7 | Low |
| 5 | Quick Door Escape | F5 | Low |

## Coverage Thresholds
- Tier 1: ≥5 per feature (Total: 40 cases)
- Tier 2: ≥5 per feature (Total: 40 cases)
- Tier 3: Pairwise coverage of major feature interactions (Total: 8 cases)
- Tier 4: ≥5 realistic application scenarios (Total: 5 cases)
