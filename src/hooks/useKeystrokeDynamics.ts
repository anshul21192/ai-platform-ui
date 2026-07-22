import { useEffect, useRef, useCallback, useState } from "react";
import { KeystrokeCapture, type KeystrokeFeatures } from "../utils/keystrokeCapture";

export type { KeystrokeFeatures };

export const useKeystrokeDynamics = () => {
  const containerRef = useRef<HTMLFormElement | HTMLDivElement | null>(null);
  const captureInstance = useRef<KeystrokeCapture | null>(null);
  const [metrics, setMetrics] = useState<KeystrokeFeatures | null>(null);

  const startCapture = useCallback(() => {
    if (containerRef.current) {
      if (captureInstance.current) {
        captureInstance.current.stop();
      }
      captureInstance.current = new KeystrokeCapture(containerRef.current, {
        inputMethod: "physical-keyboard",
      });
      captureInstance.current.start();
    }
  }, []);

  useEffect(() => {
    startCapture();
    return () => {
      captureInstance.current?.stop();
    };
  }, [startCapture]);

  const getMetrics = useCallback((): KeystrokeFeatures | null => {
    if (!captureInstance.current) return null;
    const features = captureInstance.current.stop();
    setMetrics(features);
    return features;
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics(null);
    startCapture();
  }, [startCapture]);

  // Compatibility handlers in case inputs still pass onKeyDown/onKeyUp props
  const handleKeyDown = useCallback((_event: React.KeyboardEvent) => {
    // KeystrokeCapture handles event listeners on containerRef directly via DOM bubbling
  }, []);

  const handleKeyUp = useCallback((_event: React.KeyboardEvent) => {
    // KeystrokeCapture handles event listeners on containerRef directly via DOM bubbling
  }, []);

  return {
    containerRef,
    metrics,
    getMetrics,
    resetMetrics,
    handleKeyDown,
    handleKeyUp,
  };
};