import React, { Suspense, useEffect, startTransition } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Html, OrbitControls } from '@react-three/drei';
import SceneManager from './SceneManager';

const LoadingScreen = () => (
  <Html center>
    <div style={{ 
      color: 'white', 
      fontSize: '1.5em',
      textAlign: 'center',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: '20px',
      borderRadius: '10px'
    }}>
      Loading Synthesizer...
    </div>
  </Html>
);

const CanvasContent = ({ onNoteOn, onNoteOff, activeNotes, children }) => {
  return (
    <group>
      <color attach="background" args={['#111']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <OrbitControls enabled={false} />
      <Environment preset="studio" />
      <SceneManager
        onNoteOn={onNoteOn}
        onNoteOff={onNoteOff}
        activeNotes={activeNotes}
      />
      {children}
    </group>
  );
};

const ThreeCanvas = ({ children, onNoteOn, onNoteOff, activeNotes }) => {
  useEffect(() => {
    // Ensure the canvas is mounted before doing any state updates
    startTransition(() => {
      // Any state updates will be wrapped in startTransition
    });
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
      <Canvas
        camera={{
          fov: 45,
          near: 0.1,
          far: 1000,
          position: [0, 2, 20]
        }}
      >
        <Suspense fallback={<LoadingScreen />}>
          <CanvasContent
            onNoteOn={onNoteOn}
            onNoteOff={onNoteOff}
            activeNotes={activeNotes}
          >
            {children}
          </CanvasContent>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ThreeCanvas;
