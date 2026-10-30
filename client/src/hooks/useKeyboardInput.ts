import { useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

interface KeyState {
  KeyW: boolean;
  KeyS: boolean;
  KeyA: boolean;
  KeyD: boolean;
  KeyQ: boolean;
  KeyE: boolean;
  Space: boolean;
  ShiftLeft: boolean;
  ArrowUp: boolean;
  ArrowDown: boolean;
}

const keyState: KeyState = {
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false,
  KeyQ: false,
  KeyE: false,
  Space: false,
  ShiftLeft: false,
  ArrowUp: false,
  ArrowDown: false,
};

export function useKeyboardInput() {
  const updateInput = useGameStore((state) => state.updateInput);
  const showChat = useGameStore((state) => state.showChat);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore input when chat is open
    if (showChat) return;
    
    const code = e.code as keyof KeyState;
    if (code in keyState) {
      keyState[code] = true;
      e.preventDefault();
    }
  }, [showChat]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const code = e.code as keyof KeyState;
    if (code in keyState) {
      keyState[code] = false;
    }
  }, []);

  // Update game input based on key state
  useEffect(() => {
    const interval = setInterval(() => {
      if (showChat) return;
      
      // Calculate input values
      let pitch = 0;
      let roll = 0;
      let yaw = 0;
      
      // Pitch: W/S or Arrow Up/Down
      if (keyState.KeyW || keyState.ArrowUp) pitch -= 1;
      if (keyState.KeyS || keyState.ArrowDown) pitch += 1;
      
      // Roll: A/D
      if (keyState.KeyA) roll -= 1;
      if (keyState.KeyD) roll += 1;
      
      // Yaw: Q/E
      if (keyState.KeyQ) yaw -= 1;
      if (keyState.KeyE) yaw += 1;
      
      // Throttle: handled separately
      const currentInput = useGameStore.getState().input;
      let throttle = currentInput.throttle;
      
      if (keyState.ShiftLeft) {
        throttle = Math.min(1, throttle + 0.02);
      }
      if (keyState.Space && !keyState.ShiftLeft) {
        throttle = Math.max(0, throttle - 0.02);
      }
      
      updateInput({
        pitch,
        roll,
        yaw,
        throttle,
        brake: keyState.Space,
        boost: keyState.ShiftLeft,
      });
    }, 16); // ~60Hz

    return () => clearInterval(interval);
  }, [updateInput, showChat]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
