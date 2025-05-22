import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import SceneManager from './SceneManager';

const ThreeCanvas = ({ children, onNoteOn, onNoteOff, activeNotes }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 30], fov: 45 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <Suspense fallback={null}>
        <SceneManager
          onNoteOn={onNoteOn}
          onNoteOff={onNoteOff}
          activeNotes={activeNotes}
        />
      </Suspense>
      {children}
    </Canvas>
  );
};

export default ThreeCanvas;
