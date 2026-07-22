import { useRef, useCallback, useEffect, useState } from "react";
import { KeystrokeCollector, type KeystrokeFeatures } from "../utils/keystrokeCapture";

export const useKeystrokeDynamics = () => {
  const collectorRef = useRef<KeystrokeCollector>(new KeystrokeCollector());
  const containerRef = useRef<HTMLElement | null>(null);
  const [metrics, setMetrics] = useState<KeystrokeFeatures | null>(null);

  const getMetrics = useCallback((): KeystrokeFeatures => {
    const currentFeatures = collectorRef.current.getFeatures();
    setMetrics(currentFeatures);
    return currentFeatures;
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent | KeyboardEvent) => {
    collectorRef.current.onKeyDown(event);
    setMetrics(collectorRef.current.getFeatures());
  }, []);

  const handleKeyUp = useCallback((event: React.KeyboardEvent | KeyboardEvent) => {
    collectorRef.current.onKeyUp(event);
    setMetrics(collectorRef.current.getFeatures());
  }, []);

  const resetMetrics = useCallback(() => {
    collectorRef.current.reset();
    setMetrics(null);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const onNativeKeyDown = (e: KeyboardEvent) => handleKeyDown(e);
    const onNativeKeyUp = (e: KeyboardEvent) => handleKeyUp(e);

    element.addEventListener("keydown", onNativeKeyDown);
    element.addEventListener("keyup", onNativeKeyUp);

    return () => {
      element.removeEventListener("keydown", onNativeKeyDown);
      element.removeEventListener("keyup", onNativeKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return {
    containerRef,
    metrics,
    getMetrics,
    handleKeyDown,
    handleKeyUp,
    resetMetrics,
  };
};