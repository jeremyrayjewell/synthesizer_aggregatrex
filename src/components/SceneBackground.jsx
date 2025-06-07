import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSynthContext } from '../hooks/useSynth';

const SceneBackground = React.memo(({ activeNotes = new Set() }) => {
  const meshRef = useRef();
  const { synthParams } = useSynthContext();
    // Performance optimization: track last update time
  const lastUpdateRef = useRef(0);
  const updateIntervalRef = useRef(50); // Update every ~50ms instead of every frame
  
  // Create custom shader material for dynamic background
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        audioLevel: { value: 0 },
        frequency: { value: 440 },
        activeNoteCount: { value: 0 },
        colorPalette: { value: [
          new THREE.Color('#1a0033'),
          new THREE.Color('#330066'),
          new THREE.Color('#660099'),
          new THREE.Color('#9900cc')
        ]},
        noiseScale: { value: 0.5 },
        waveAmplitude: { value: 0.3 },
        spiralIntensity: { value: 0.2 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 resolution;
        uniform float audioLevel;
        uniform float frequency;
        uniform float activeNoteCount;
        uniform vec3 colorPalette[4];
        uniform float noiseScale;
        uniform float waveAmplitude;
        uniform float spiralIntensity;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        // Noise function
        vec3 random3(vec3 c) {
          float j = 4096.0 * sin(dot(c, vec3(17.0, 59.4, 15.0)));
          vec3 r;
          r.z = fract(512.0 * j);
          j *= .125;
          r.x = fract(512.0 * j);
          j *= .125;
          r.y = fract(512.0 * j);
          return r - 0.5;
        }
        
        // Simplex noise
        float simplex3d(vec3 p) {
          float f3 = 1.0 / 3.0;
          float s = (p.x + p.y + p.z) * f3;
          int i = int(floor(p.x + s));
          int j = int(floor(p.y + s));
          int k = int(floor(p.z + s));
          
          float g3 = 1.0 / 6.0;
          float t = float(i + j + k) * g3;
          float x0 = float(i) - t;
          float y0 = float(j) - t;
          float z0 = float(k) - t;
          x0 = p.x - x0;
          y0 = p.y - y0;
          z0 = p.z - z0;
          
          int i1, j1, k1;
          int i2, j2, k2;
          
          if (x0 >= y0) {
            if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
            else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
            else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
          } else {
            if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
            else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
            else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
          }
          
          float x1 = x0 - float(i1) + g3;
          float y1 = y0 - float(j1) + g3;
          float z1 = z0 - float(k1) + g3;
          float x2 = x0 - float(i2) + 2.0 * g3;
          float y2 = y0 - float(j2) + 2.0 * g3;
          float z2 = z0 - float(k2) + 2.0 * g3;
          float x3 = x0 - 1.0 + 3.0 * g3;
          float y3 = y0 - 1.0 + 3.0 * g3;
          float z3 = z0 - 1.0 + 3.0 * g3;
          
          vec3 ijk0 = vec3(i, j, k);
          vec3 ijk1 = vec3(i + i1, j + j1, k + k1);
          vec3 ijk2 = vec3(i + i2, j + j2, k + k2);
          vec3 ijk3 = vec3(i + 1, j + 1, k + 1);
          
          vec3 gr0 = normalize(random3(ijk0));
          vec3 gr1 = normalize(random3(ijk1));
          vec3 gr2 = normalize(random3(ijk2));
          vec3 gr3 = normalize(random3(ijk3));
          
          float n0 = 0.0;
          float n1 = 0.0;
          float n2 = 0.0;
          float n3 = 0.0;
          
          float t0 = 0.5 - x0 * x0 - y0 * y0 - z0 * z0;
          if (t0 >= 0.0) {
            t0 *= t0;
            n0 = t0 * t0 * dot(gr0, vec3(x0, y0, z0));
          }
          float t1 = 0.5 - x1 * x1 - y1 * y1 - z1 * z1;
          if (t1 >= 0.0) {
            t1 *= t1;
            n1 = t1 * t1 * dot(gr1, vec3(x1, y1, z1));
          }
          float t2 = 0.5 - x2 * x2 - y2 * y2 - z2 * z2;
          if (t2 >= 0.0) {
            t2 *= t2;
            n2 = t2 * t2 * dot(gr2, vec3(x2, y2, z2));
          }
          float t3 = 0.5 - x3 * x3 - y3 * y3 - z3 * z3;
          if (t3 >= 0.0) {
            t3 *= t3;
            n3 = t3 * t3 * dot(gr3, vec3(x3, y3, z3));
          }
          return 96.0 * (n0 + n1 + n2 + n3);
        }
        
        void main() {
          vec2 uv = vUv;
          vec2 center = vec2(0.5, 0.5);
          
          // Calculate distance from center
          float dist = distance(uv, center);
          
          // Create spiraling effect
          float angle = atan(uv.y - center.y, uv.x - center.x);
          float spiral = sin(angle * 8.0 + time * 2.0 - dist * 20.0) * spiralIntensity;
          
          // Audio-reactive wave patterns
          float wave1 = sin(uv.x * 10.0 + time * 3.0 + audioLevel * 5.0) * waveAmplitude;
          float wave2 = cos(uv.y * 8.0 + time * 2.0 + frequency * 0.01) * waveAmplitude;
          
          // Noise layer for texture
          vec3 noisePos = vec3(uv * noiseScale, time * 0.5);
          float noise = simplex3d(noisePos) * 0.5 + 0.5;
          
          // Combine effects
          float pattern = wave1 + wave2 + spiral + noise * 0.3;
          pattern += audioLevel * 0.5;
          pattern += activeNoteCount * 0.1;
          
          // Create dynamic color mixing
          float colorIndex = fract(pattern + time * 0.2) * 3.0;
          int index1 = int(floor(colorIndex));
          int index2 = int(mod(float(index1 + 1), 4.0));
          float mix_factor = fract(colorIndex);
          
          vec3 color1 = colorPalette[index1];
          vec3 color2 = colorPalette[index2];
          vec3 finalColor = mix(color1, color2, mix_factor);
          
          // Add brightness variation based on audio
          finalColor *= (0.8 + audioLevel * 0.4);
          
          // Add glow effect near center
          float glow = 1.0 - smoothstep(0.0, 0.8, dist);
          finalColor += glow * vec3(0.1, 0.05, 0.2) * audioLevel;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,      side: THREE.BackSide // Render on the inside of the sphere
    });
  }, []);

  // Update shader uniforms based on synth state
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const now = Date.now();
    // Performance optimization: skip update if not enough time has passed
    if (now - lastUpdateRef.current < updateIntervalRef.current) return;
    lastUpdateRef.current = now;
    
    const time = state.clock.elapsedTime;
    const material = meshRef.current.material;
    
    // Update time
    material.uniforms.time.value = time;
    
    // Calculate audio level from synth parameters
    const masterVolume = synthParams?.master?.volume || 0;
    const filterFreq = synthParams?.filter?.frequency || 440;
    const cutoff = synthParams?.filter?.cutoff || 1000;
    
    // Audio-reactive parameters
    material.uniforms.audioLevel.value = masterVolume * 0.8 + 0.2;
    material.uniforms.frequency.value = filterFreq;
    material.uniforms.activeNoteCount.value = activeNotes.size * 0.1;
    
    // Dynamic color palette based on effects
    if (synthParams?.effects?.distortion?.enabled) {
      material.uniforms.colorPalette.value = [
        new THREE.Color('#ff0033'),
        new THREE.Color('#ff3366'),
        new THREE.Color('#ff6699'),
        new THREE.Color('#ff99cc')
      ];
    } else if (synthParams?.effects?.reverb?.enabled) {
      material.uniforms.colorPalette.value = [
        new THREE.Color('#0033ff'),
        new THREE.Color('#3366ff'),
        new THREE.Color('#6699ff'),
        new THREE.Color('#99ccff')
      ];
    } else {
      material.uniforms.colorPalette.value = [
        new THREE.Color('#1a0033'),
        new THREE.Color('#330066'),
        new THREE.Color('#660099'),
        new THREE.Color('#9900cc')
      ];
    }
    
    // Adjust effects intensity based on synth parameters
    material.uniforms.noiseScale.value = 0.5 + (cutoff / 10000) * 0.5;
    material.uniforms.waveAmplitude.value = 0.3 + masterVolume * 0.2;
    material.uniforms.spiralIntensity.value = 0.2 + (synthParams?.effects?.chorus?.enabled ? 0.3 : 0);
  });
  return (
    <mesh ref={meshRef} scale={[150, 150, 150]}>
      <sphereGeometry args={[1, 64, 32]} />
      <primitive object={shaderMaterial} />
    </mesh>
  );
});

export default SceneBackground;
