import { useState, useRef, useCallback } from "react";

export interface KeystrokeMetrics {
  averageDwellTime: number;
  averageFlightTime: number;
  typingSpeed: number;
  totalKeystrokes: number;
  backspaceCount: number;
  pauseCount: number;
}

export const useKeystrokeDynamics = () => {
  const [metrics, setMetrics] = useState<KeystrokeMetrics>({
    averageDwellTime: 0,
    averageFlightTime: 0,
    typingSpeed: 0,
    totalKeystrokes: 0,
    backspaceCount: 0,
    pauseCount: 0,
  });

  const keyDownTimes = useRef<Map<string, number>>(new Map());
  const firstKeyDownTime = useRef<number | null>(null);
  const previousKeyUpTime = useRef<number | null>(null);
  const totalDwellTimes = useRef<number>(0);
  const totalFlightTimes = useRef<number>(0);
  const totalKeystrokes = useRef<number>(0);
  const backspaceCount = useRef<number>(0);
  const pauseCount = useRef<number>(0);
  const lastKeyUpTime = useRef<number | null>(null);

  const getMetrics = useCallback((): KeystrokeMetrics => {
    const total = totalKeystrokes.current;
    const now = performance.now();
    const elapsedSeconds = firstKeyDownTime.current
      ? (now - firstKeyDownTime.current) / 1000
      : 0;

    return {
      averageDwellTime: total > 0 ? totalDwellTimes.current / total : 0,
      averageFlightTime: total > 1 ? totalFlightTimes.current / (total - 1) : 0,
      typingSpeed: elapsedSeconds > 0 ? total / elapsedSeconds : 0,
      totalKeystrokes: total,
      backspaceCount: backspaceCount.current,
      pauseCount: pauseCount.current,
    };
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const key = event.key;
    const now = performance.now();

    if (firstKeyDownTime.current === null) {
      firstKeyDownTime.current = now;
    }

    if (!keyDownTimes.current.has(key)) {
      keyDownTimes.current.set(key, now);
    }

    if (lastKeyUpTime.current && now - lastKeyUpTime.current > 500) {
      pauseCount.current += 1;
    }
  }, []);

  const handleKeyUp = useCallback((event: React.KeyboardEvent) => {
    const key = event.key;
    const now = performance.now();

    if (keyDownTimes.current.has(key)) {
      const keyDownTime = keyDownTimes.current.get(key)!;
      const dwellTime = now - keyDownTime;

      totalDwellTimes.current += dwellTime;
      totalKeystrokes.current += 1;

      keyDownTimes.current.delete(key);

      if (previousKeyUpTime.current !== null) {
        const flightTime = keyDownTime - previousKeyUpTime.current;
        totalFlightTimes.current += flightTime;
      }

      previousKeyUpTime.current = now;
    }

    if (key === "Backspace") {
      backspaceCount.current += 1;
    }

    lastKeyUpTime.current = now;

    setMetrics(getMetrics());
  }, [getMetrics]);

  const resetMetrics = useCallback(() => {
    keyDownTimes.current.clear();
    firstKeyDownTime.current = null;
    previousKeyUpTime.current = null;
    totalDwellTimes.current = 0;
    totalFlightTimes.current = 0;
    totalKeystrokes.current = 0;
    backspaceCount.current = 0;
    pauseCount.current = 0;
    lastKeyUpTime.current = null;

    setMetrics({
      averageDwellTime: 0,
      averageFlightTime: 0,
      typingSpeed: 0,
      totalKeystrokes: 0,
      backspaceCount: 0,
      pauseCount: 0,
    });
  }, []);

  return { metrics, getMetrics, handleKeyDown, handleKeyUp, resetMetrics };
};