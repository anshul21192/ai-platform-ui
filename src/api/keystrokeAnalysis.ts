import { trackEvent, type AppEvent } from "../utils/eventLogger";

export const sendKeystrokeMetrics = (metrics: object): AppEvent | null => {
  try {
    return trackEvent("KEYSTROKE_DYNAMICS", metrics);
  } catch (error) {
    console.error("Error logging keystroke metrics:", error);
    return null;
  }
};