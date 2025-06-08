import { useEffect, useRef } from "react";

/**
 * Custom hook for creating a game loop with a specified frame rate
 * @param callback - Function to call on each frame
 * @param fps - Target frames per second (default: 60)
 */
const useGameLoop = (
  callback: (deltaTime: number) => void,
  fps: number = 60,
  isActive: boolean = true
) => {
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isActive) return;

    const targetInterval = 1000 / fps;

    const animate = (time: number) => {
      if (previousTimeRef.current !== null) {
        const deltaTime = time - previousTimeRef.current;

        // Only call the callback if enough time has passed
        if (deltaTime >= targetInterval) {
          callback(deltaTime);
          previousTimeRef.current = time;
        }
      } else {
        previousTimeRef.current = time;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback, fps, isActive]);
};

export default useGameLoop;
