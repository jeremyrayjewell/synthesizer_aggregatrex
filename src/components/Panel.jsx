import React from 'react';

const Panel = () => {
  return (
    <group>
      {/* Base panel box */}
      <mesh position={[0, -1, -7]}>
        <boxGeometry args={[36, 23, 0.5]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
};

export default Panel;
