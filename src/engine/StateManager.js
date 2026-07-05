export class StateManager {
  constructor() {
    this.state = {
      inventory: [],
      selectedItem: null,
      solvedPuzzles: new Set(),
      currentView: 'north',
      zoomView: null,
      dialogText: '',
      dialogActive: false,
      hasKeyInCompartment: true // Keep this specifically for E2E tests and game state compliance
    };
    this.listeners = {};
  }

  reset() {
    this.state.inventory = [];
    this.state.selectedItem = null;
    this.state.solvedPuzzles.clear();
    this.state.currentView = 'north';
    this.state.zoomView = null;
    this.state.dialogText = '';
    this.state.dialogActive = false;
    this.state.hasKeyInCompartment = true;
    this.emit('state_changed', this.state);
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  hasFlag(flag) {
    if (flag.startsWith('!')) {
      return !this.state.solvedPuzzles.has(flag.substring(1));
    }
    return this.state.solvedPuzzles.has(flag);
  }

  setFlag(flag) {
    if (!this.state.solvedPuzzles.has(flag)) {
      this.state.solvedPuzzles.add(flag);
      this.emit('state_changed', this.state);
    }
  }

  clearFlag(flag) {
    if (this.state.solvedPuzzles.has(flag)) {
      this.state.solvedPuzzles.delete(flag);
      this.emit('state_changed', this.state);
    }
  }

  addItem(item) {
    if (!this.state.inventory.includes(item)) {
      this.state.inventory.push(item);
      this.emit('inventory_changed', this.state.inventory);
      this.emit('state_changed', this.state);
    }
  }

  removeItem(item) {
    const originalLength = this.state.inventory.length;
    this.state.inventory = this.state.inventory.filter(i => i !== item);
    if (this.state.selectedItem === item) {
      this.state.selectedItem = null;
    }
    if (this.state.inventory.length !== originalLength) {
      this.emit('inventory_changed', this.state.inventory);
      this.emit('state_changed', this.state);
    }
  }

  selectItem(item) {
    this.state.selectedItem = (this.state.selectedItem === item) ? null : item;
    this.emit('inventory_changed', this.state.inventory);
    this.emit('state_changed', this.state);
  }

  setView(view) {
    if (this.state.currentView !== view) {
      this.state.currentView = view;
      this.emit('state_changed', this.state);
    }
  }

  setZoomView(zoomView) {
    if (this.state.zoomView !== zoomView) {
      this.state.zoomView = zoomView;
      this.emit('state_changed', this.state);
    }
  }

  showDialog(text) {
    this.state.dialogText = text;
    this.state.dialogActive = true;
    this.emit('state_changed', this.state);
  }

  hideDialog() {
    this.state.dialogActive = false;
    this.emit('state_changed', this.state);
  }

  // Parses and executes commands directly on the state
  executeActions(actions) {
    if (!actions || !Array.isArray(actions)) return;

    actions.forEach(action => {
      const splitIdx = action.indexOf(':');
      let command = action;
      let arg = '';
      if (splitIdx !== -1) {
        command = action.substring(0, splitIdx).trim();
        arg = action.substring(splitIdx + 1).trim();
      }

      switch (command) {
        case 'SET_FLAG':
          this.setFlag(arg);
          break;
        case 'SET_VIEW':
          this.setView(arg);
          break;
        case 'CLEAR_FLAG':
          this.clearFlag(arg);
          break;
        case 'ADD_INVENTORY':
          this.addItem(arg);
          break;
        case 'REMOVE_INVENTORY':
          this.removeItem(arg);
          break;
        case 'SHOW_DIALOG':
          this.showDialog(arg);
          break;
        case 'OPEN_ZOOM_VIEW':
          this.setZoomView(arg);
          break;
        case 'TRIGGER_WIN':
          this.setFlag('door_unlocked');
          break;
        case 'LAUNCH_MINIGAME':
          // Minigame state changes are processed by listeners, do not set zoomView
          break;
        default:
          // Other commands like REFRESH_GRAPHICS will be handled by the Phaser Shell listening to state_changed
          break;
      }
    });

    // Notify listeners that actions have run
    this.emit('actions_executed', actions);
  }
}
