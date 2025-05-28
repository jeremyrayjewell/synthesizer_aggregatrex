const midiManager = {
  initialized: false,
  init() {
    this.initialized = true;
    return this;
  }
};

export default midiManager;