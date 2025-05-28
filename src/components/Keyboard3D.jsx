import React, { useState, useEffect, useRef } from 'react';

const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEYS = [1, 3, 6, 8, 10];
const isBlack = (note) => BLACK_KEYS.includes(note % 12);
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const Key = ({ note, x, isBlackKey, isPressed, onNoteOn, onNoteOff }) => {
  const width = isBlackKey ? 0.6 : 1;
  const height = isBlackKey ? 0.5 : 0.2;
  const depth = isBlackKey ? 3 : 4.5;
  const color = isBlackKey ? 'black' : 'white';
  const pressDepth = 0.05;
  const pressTilt = isBlackKey ? 0.05 : 0.03;

  return (
    <group
      position={[x, 0, isBlackKey ? -0.75 : 0]}
      rotation={[isPressed ? pressTilt : 0, 0, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        onNoteOn(note, 127);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        onNoteOff(note);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onNoteOff(note);
      }}
    >
      <mesh position={[0, height / 2 - (isPressed ? pressDepth : 0), 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

const Keyboard3D = ({
  startNote = 21,
  endNote = 108,
  onNoteOn,
  onNoteOff,
  activeNotes = new Set(),
}) => {
  const notes = Array.from({ length: endNote - startNote + 1 }, (_, i) => startNote + i);
  const whiteNotes = notes.filter(n => !isBlack(n));
  const blackNotes = notes.filter(n => isBlack(n));

  const keySpacing = 1.05;
  const totalWidth = whiteNotes.length * keySpacing;
  const initialOffset = totalWidth / 2;
  const viewWidth = 15;
  const maxOffset = totalWidth / 2;
  const minOffset = -totalWidth / 2;

  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const dragging = useRef(false);
  const lastX = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') {
        setKeyboardOffset(offset => clamp(offset + 2, minOffset, maxOffset));
      } else if (e.key === 'ArrowRight') {
        setKeyboardOffset(offset => clamp(offset - 2, minOffset, maxOffset));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [minOffset, maxOffset]);

  useEffect(() => {
    const handleDown = (e) => {
      if (e.button === 2) {
        dragging.current = true;
        lastX.current = e.clientX;
        e.preventDefault();
      }
    };

    const handleMove = (e) => {
      if (!dragging.current) return;
      const deltaX = e.clientX - lastX.current;
      setKeyboardOffset(offset =>
        clamp(offset + deltaX * 0.05, minOffset, maxOffset)
      );
      lastX.current = e.clientX;
    };

    const handleUp = () => {
      dragging.current = false;
    };

    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [minOffset, maxOffset]);

  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      setKeyboardOffset(offset =>
        clamp(offset - e.deltaX * 0.02, minOffset, maxOffset)
      );
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [minOffset, maxOffset]);

  return (
    <group position={[-initialOffset + keyboardOffset, 0, 0]}>
      {whiteNotes.map((note, i) => (
        <Key
          key={note}
          note={note}
          x={i * keySpacing}
          isBlackKey={false}
          isPressed={activeNotes.has(note)}
          onNoteOn={onNoteOn}
          onNoteOff={onNoteOff}
        />
      ))}
      {blackNotes.map((note) => {
        const index = whiteNotes.findIndex(n => n > note) - 1;
        const x = index * keySpacing + 0.65;
        return (
          <Key
            key={note}
            note={note}
            x={x}
            isBlackKey={true}
            isPressed={activeNotes.has(note)}
            onNoteOn={onNoteOn}
            onNoteOff={onNoteOff}
          />
        );
      })}
    </group>
  );
};

export default Keyboard3D;
