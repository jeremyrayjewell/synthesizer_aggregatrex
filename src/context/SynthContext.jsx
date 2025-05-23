import { createContext } from 'react';

// Create a SynthContext that will be used throughout the application
export const SynthContext = createContext(null);

// The provider implementation has been moved to src/hooks/useSynth.js
// This file now just exports the context for use in other components
export default SynthContext;
