import React, { createContext, useState, useEffect, useCallback } from 'react';
import SynthEngine from '../audio/SynthEngine';
// import { DEFAULT_PATCH } from '../presets/default'; // Example: if you have a default patch

const SynthContext = createContext(null);

export const SynthProvider = ({ children }) => {
  const [synthEngine, setSynthEngine] = useState(null);
  const [currentPatch, setCurrentPatch] = useState({}); // Or load a default patch
  const [isPlaying, setIsPlaying] = useState(false); // e.g., for a global play/stop or sequencer
  const [automationData, setAutomationData] = useState({}); // For automation parameters

  useEffect(() => {
    const engine = new SynthEngine();
    setSynthEngine(engine);
    // setCurrentPatch(DEFAULT_PATCH); // Load a default patch

    return () => {
      if (engine && engine.audioContext && engine.audioContext.state !== 'closed') {
        engine.audioContext.close();
      }
    };
  }, []);

  // Example function to update patch and inform synthEngine
  const loadPatch = useCallback((patchData) => {
    setCurrentPatch(patchData);
    if (synthEngine) {
      // synthEngine.applyPatch(patchData); // You'd need to implement this in SynthEngine
    }
  }, [synthEngine]);

  // Example: toggle global play state
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
    if (synthEngine) {
      // synthEngine.setPlaybackState(!isPlaying); // You'd need to implement this
    }
  }, [isPlaying, synthEngine]);


  const contextValue = {
    synthEngine,
    currentPatch,
    loadPatch, // Function to load/update patch
    isPlaying,
    togglePlay, // Function to toggle play
    automationData,
    setAutomationData, // Function to update automation
    // Add other relevant states and setters
  };

  return (
    <SynthContext.Provider value={contextValue}>
      {children}
    </SynthContext.Provider>
  );
};

export default SynthContext;
