import { useContext, useEffect, useRef, useState, createContext } from 'react';
import SynthEngine from '../audio/SynthEngine';

// Create React Context
const SynthContext = createContext(null);

// Synth Provider Component
export const SynthProvider = ({ children }) => {
  const synthRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    synthRef.current = new SynthEngine();
    setIsReady(true);
  }, []);

  return (
    <SynthContext.Provider value={synthRef.current}>
      {isReady ? children : null}
    </SynthContext.Provider>
  );
};

// Custom Hook to use Synth
export const useSynth = () => {
  const synth = useContext(SynthContext);
  if (!synth) {
    throw new Error('useSynth must be used within a SynthProvider');
  }
  return synth;
};
