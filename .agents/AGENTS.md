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

