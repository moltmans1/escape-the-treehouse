export class Interpreter {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }

  evaluateInteraction(interactionArray) {
    if (!interactionArray || !Array.isArray(interactionArray)) return [];

    for (const block of interactionArray) {
      let passed = true;

      if (block.if_flag && !this.stateManager.hasFlag(block.if_flag)) passed = false;
      if (block.if_selected_item && this.stateManager.state.selectedItem !== block.if_selected_item) passed = false;

      if (passed) {
        return block.then || block.else || [];
      } else if (block.else) {
        return block.else;
      }
    }
    return [];
  }
}
