import { useState, useRef, useCallback } from "react";

interface Metrics {
  averageDwellTime: number;
  averageFlightTime: number;
  typingSpeed: number;
  totalKeystrokes: number;
  backspaceCount: number;
  pauseCount: number;
}

export const useKeystrokeDynamics = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    averageDwellTime: 0,
    averageFlightTime: 0,
    typingSpeed: 0,
    totalKeystrokes: 0,
    backspaceCount: 0,
    pauseCount: 0,
  });

  const keyDownTimes = useRef<Map<string, number>>(new Map());
  const previousKeyUpTime = useRef<number | null>(null);
  const totalDwellTimes = useRef<number>(0);
  const totalFlightTimes = useRef<number>(0);
  const totalKeystrokes = useRef<number>(0);
  const backspaceCount = useRef<number>(0);
  const pauseCount = useRef<number>(0);

  const lastKeyUpTime = useRef<number | null>(null);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const key = event.key;
    const now = performance.now();

    // Record keyDown time if not already recorded
    if (!keyDownTimes.current.has(key)) {
      keyDownTimes.current.set(key, now);
    }

    // Check for pauses (time between key presses > 500ms)
    if (lastKeyUpTime.current && now - lastKeyUpTime.current > 500) {
      pauseCount.current += 1;
    }
  }, []);

  const handleKeyUp = useCallback((event: React.KeyboardEvent) => {
    const key = event.key;
    const now = performance.now();

    // Calculate dwell time
    if (keyDownTimes.current.has(key)) {
      const keyDownTime = keyDownTimes.current.get(key)!;
      const dwellTime = now - keyDownTime;

      totalDwellTimes.current += dwellTime;
      totalKeystrokes.current += 1;

      keyDownTimes.current.delete(key);

      // Calculate flight time
      if (previousKeyUpTime.current !== null) {
        const flightTime = keyDownTime - previousKeyUpTime.current;
        totalFlightTimes.current += flightTime;
      }

      previousKeyUpTime.current = now;

      // Update metrics
      setMetrics({
        averageDwellTime: totalDwellTimes.current / totalKeystrokes.current,
        averageFlightTime: totalFlightTimes.current / (totalKeystrokes.current - 1 || 1),
        typingSpeed: totalKeystrokes.current / (now / 1000),
        totalKeystrokes: totalKeystrokes.current,
        backspaceCount: backspaceCount.current,
        pauseCount: pauseCount.current,
      });
    }

    // Count backspace presses
    if (key === "Backspace") {
      backspaceCount.current += 1;
    }

    // Update last key up time
    lastKeyUpTime.current = now;
  }, []);

  const resetMetrics = useCallback(() => {
    keyDownTimes.current.clear();
    previousKeyUpTime.current = null;
    totalDwellTimes.current = 0;
    totalFlightTimes.current = 0;
    totalKeystrokes.current = 0;
    backspaceCount.current = 0;
    pauseCount.current = 0;

    setMetrics({
      averageDwellTime: 0,
      averageFlightTime: 0,
      typingSpeed: 0,
      totalKeystrokes: 0,
      backspaceCount: 0,
      pauseCount: 0,
    });
  }, []);

  return { metrics, handleKeyDown, handleKeyUp, resetMetrics };
};