let audioContext = null;
let isContextReady = false;

const createContext = async () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Add state change listener
      audioContext.addEventListener('statechange', () => {
        console.log(`Audio context state changed to: ${audioContext.state}`);
        isContextReady = audioContext.state === 'running';
      });
    }
    
    return audioContext;
  } catch (error) {
    console.error('Failed to create AudioContext:', error);
    throw error;
  }
};

const setupUserActivationListeners = () => {
  const activationEvents = ['mousedown', 'touchstart', 'keydown'];

  const initOnFirstInteraction = async (event) => {
    if (!audioContext) return;
    
    try {
      console.log('First user interaction detected, attempting to resume audio context');
      await audioContext.resume();
      
      if (audioContext.state === 'running') {
        console.log('Audio context resumed successfully');
        isContextReady = true;
        // Remove listeners since we don't need them anymore
        activationEvents.forEach(type => {
          window.removeEventListener(type, initOnFirstInteraction);
        });
      }
    } catch (error) {
      console.error('Failed to resume audio context:', error);
    }
  };

  // Add listeners for user interaction events
  activationEvents.forEach(type => {
    window.addEventListener(type, initOnFirstInteraction);
  });
};

const resumeContext = async () => {
  if (!audioContext) return false;
  
  try {
    if (audioContext.state === 'suspended') {
      console.log('Attempting to resume suspended audio context');
      await audioContext.resume();
      isContextReady = audioContext.state === 'running';
      return isContextReady;
    }
    return true;
  } catch (error) {
    console.error('Failed to resume audio context:', error);
    return false;
  }
};

const isReady = () => isContextReady && audioContext?.state === 'running';

const getContext = () => audioContext;

export default {
  createContext,
  setupUserActivationListeners,
  resumeContext,
  isReady,
  getContext
};
