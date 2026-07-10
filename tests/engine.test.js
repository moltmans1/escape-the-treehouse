import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../src/engine/StateManager';
import { Interpreter } from '../src/engine/Interpreter';

describe('Escape Room Headless Core Engine', () => {
  let state;
  let interpreter;

  beforeEach(() => {
    state = new StateManager();
    interpreter = new Interpreter(state);
  });

  it('should collect items and flag dependencies correctly', () => {
    const rules = [
      {
        if_flag: "!found_item",
        then: ["SET_FLAG: found_item", "ADD_INVENTORY: testing_object"]
      }
    ];

    const actions = interpreter.evaluateInteraction(rules);
    expect(actions).toContain("SET_FLAG: found_item");
    expect(actions).toContain("ADD_INVENTORY: testing_object");

    // Execute the actions
    state.executeActions(actions);

    expect(state.state.inventory).toContain("testing_object");
    expect(state.hasFlag("found_item")).toBe(true);
  });

  it('should block conditional processing when required item is not highlighted', () => {
    const rules = [
      {
        if_selected_item: "special_key",
        then: ["TRIGGER_WIN"]
      },
      {
        else: ["SHOW_DIALOG: Locked tight."]
      }
    ];

    let actions = interpreter.evaluateInteraction(rules);
    expect(actions).toContain("SHOW_DIALOG: Locked tight.");

    state.addItem("special_key");
    state.selectItem("special_key");

    actions = interpreter.evaluateInteraction(rules);
    expect(actions).toContain("TRIGGER_WIN");
  });

  it('should process state commands correctly via executeActions', () => {
    state.executeActions([
      "SET_FLAG: solved_puzzle",
      "ADD_INVENTORY: paper_airplane",
      "OPEN_ZOOM_VIEW: safe_view",
      "SHOW_DIALOG: Hello World",
      "SET_VIEW: balcony"
    ]);

    expect(state.hasFlag("solved_puzzle")).toBe(true);
    expect(state.state.inventory).toContain("paper_airplane");
    expect(state.state.zoomView).toBe("safe_view");
    expect(state.state.dialogText).toBe("Hello World");
    expect(state.state.dialogActive).toBe(true);
    expect(state.state.currentView).toBe("balcony");

    state.executeActions([
      "REMOVE_INVENTORY: paper_airplane"
    ]);
    expect(state.state.inventory).not.toContain("paper_airplane");
  });

  it('should handle view rotations and zoom transitions correctly', () => {
    state.setView("east");
    expect(state.state.currentView).toBe("east");

    state.setZoomView("origami_book");
    expect(state.state.zoomView).toBe("origami_book");
  });

  it('should toggle lamp flags and solve the lamp puzzle when combination is correct', () => {
    // Initial states: no lamp flags set
    expect(state.hasFlag('lamp_north_on')).toBe(false);
    expect(state.hasFlag('lamp_east_on')).toBe(false);
    expect(state.hasFlag('lamp_south_on')).toBe(false);
    expect(state.hasFlag('lamp_balcony_on')).toBe(false);
    expect(state.hasFlag('lamp_puzzle_solved')).toBe(false);

    // Set correct configuration (North=ON, East=OFF, South=ON, Balcony=ON)
    state.executeActions([
      'SET_FLAG: lamp_north_on',
      'SET_FLAG: lamp_south_on',
      'SET_FLAG: lamp_balcony_on',
      'CHECK_LAMP_PUZZLE'
    ]);

    expect(state.hasFlag('lamp_north_on')).toBe(true);
    expect(state.hasFlag('lamp_east_on')).toBe(false);
    expect(state.hasFlag('lamp_south_on')).toBe(true);
    expect(state.hasFlag('lamp_balcony_on')).toBe(true);
    
    // Puzzle should be solved
    expect(state.hasFlag('lamp_puzzle_solved')).toBe(true);
    expect(state.state.inventory).toContain('brass_key');

    // Reset and test incorrect state: e.g. east lamp ON
    state.reset();
    state.executeActions([
      'SET_FLAG: lamp_north_on',
      'SET_FLAG: lamp_east_on', // incorrect
      'SET_FLAG: lamp_south_on',
      'SET_FLAG: lamp_balcony_on',
      'CHECK_LAMP_PUZZLE'
    ]);
    expect(state.hasFlag('lamp_puzzle_solved')).toBe(false);
    expect(state.state.inventory).not.toContain('brass_key');
  });

  it('should find clue 1 behind the painting and add it to the inventory', () => {
    expect(state.hasFlag('found_clue_1')).toBe(false);
    expect(state.state.inventory).not.toContain('clue_1');

    const interactions = [
      {
        if_flag: "!found_clue_1",
        then: [
          "SET_FLAG: found_clue_1",
          "ADD_INVENTORY: clue_1",
          "SHOW_DIALOG: You find a torn slip of paper with strange markings."
        ]
      }
    ];

    const actions = interpreter.evaluateInteraction(interactions);
    state.executeActions(actions);

    expect(state.hasFlag('found_clue_1')).toBe(true);
    expect(state.state.inventory).toContain('clue_1');
  });

  it('should find clue 2 under the mattress and add it to the inventory', () => {
    expect(state.hasFlag('found_clue_2')).toBe(false);
    expect(state.state.inventory).not.toContain('clue_2');

    state.executeActions([
      'SET_FLAG: found_clue_2',
      'ADD_INVENTORY: clue_2'
    ]);

    expect(state.hasFlag('found_clue_2')).toBe(true);
    expect(state.state.inventory).toContain('clue_2');
  });

  it('should find clue 3 on the writing desk and add it to the inventory', () => {
    expect(state.hasFlag('found_clue_3')).toBe(false);
    expect(state.state.inventory).not.toContain('clue_3');

    state.executeActions([
      'SET_FLAG: found_clue_3',
      'ADD_INVENTORY: clue_3'
    ]);

    expect(state.hasFlag('found_clue_3')).toBe(true);
    expect(state.state.inventory).toContain('clue_3');
  });

  it('should find clue 4 on the books stack and add it to the inventory', () => {
    expect(state.hasFlag('found_clue_4')).toBe(false);
    expect(state.state.inventory).not.toContain('clue_4');

    state.executeActions([
      'SET_FLAG: found_clue_4',
      'ADD_INVENTORY: clue_4'
    ]);

    expect(state.hasFlag('found_clue_4')).toBe(true);
    expect(state.state.inventory).toContain('clue_4');
  });
});
