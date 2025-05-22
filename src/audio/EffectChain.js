// EffectChain.js
class EffectChain {
  constructor(audioContext, inputNode, outputNode) {
    this.audioContext = audioContext;
    this.input = inputNode;
    this.output = outputNode;
    // Add effects like reverb, delay, etc.
  }
}

export default EffectChain;
