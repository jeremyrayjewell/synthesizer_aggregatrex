import React, { Suspense, useEffect, startTransition } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Html } from '@react-three/drei';
import SceneManager from './SceneManager';
import ZoomControls from '../components/ZoomControls';
import CameraAnimation from '../components/CameraAnimation';
import DynamicLighting from '../components/DynamicLighting';
import NoteReactiveLights from '../components/NoteReactiveLights';
import SceneBackground from '../components/SceneBackground';

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
      <fog attach="fog" args={['#111122', 10, 50]} />
      <DynamicLighting />
      <NoteReactiveLights activeNotes={activeNotes} />
      <SceneBackground activeNotes={activeNotes} />
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
  const cameraAnimationEnabled = true;

  useEffect(() => {
    startTransition(() => {
    });
  }, []);
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>      <Canvas
        camera={{
          fov: 45,
          near: 0.1,
          far: 1000,
          position: [0, 2, 20]
        }}
        shadows
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={<LoadingScreen />}>
          <CanvasContent
            onNoteOn={onNoteOn}
            onNoteOff={onNoteOff}
            activeNotes={activeNotes}
          >
            {children}
            <ZoomControls 
              minZoom={0.5}
              maxZoom={2.5}
              zoomStep={0.2}
              pinchSensitivity={0.01}
            />
            <CameraAnimation
              radius={1.5}
              speed={0.25}
              verticalFactor={0.9}
              enabled={true}
            />
          </CanvasContent>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ThreeCanvas;
