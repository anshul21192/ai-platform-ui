export const sendKeystrokeMetrics = async (metrics: object) => {
    try {
      const response = await fetch("/api/keystroke-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metrics),
      });
  
      if (!response.ok) {
        throw new Error("Failed to send keystroke metrics");
      }
  
      return await response.json();
    } catch (error) {
      console.error("Error sending keystroke metrics:", error);
      throw error;
    }
  };