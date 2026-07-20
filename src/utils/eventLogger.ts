export interface AppEvent {
  id: string;
  timestamp: string;
  actionId: string;
  category: string;
  type: 'click' | 'navigation';
  ip: string;
  clicksInLastSecond: number;
  details?: Record<string, any>;
}

const STORAGE_KEY = "vault_bank_events";
const MAX_EVENTS = 200;

let cachedIp = "127.0.0.1";
let ipFetched = false;
let clickTimestamps: number[] = [];
let lastNavTime = Date.now();
let lastPath = window.location.pathname;

// Initialize IP lookup and global click listener
export async function initEventLogger(): Promise<void> {
  if (ipFetched) return;
  
  // 1. Fetch IP
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (response.ok) {
      const data = await response.json();
      cachedIp = data.ip || "127.0.0.1";
      ipFetched = true;
    }
  } catch (error) {
    console.warn("Failed to fetch public IP, using default fallback:", error);
    cachedIp = "127.0.0.1";
  }

  // 2. Global click listener to capture every button, link, or role="button" click automatically
  window.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const clickable = target.closest("button, a, [role='button'], input[type='submit'], input[type='button']");
    if (clickable) {
      const id = clickable.id;
      const text = clickable.textContent?.trim().slice(0, 30) || (clickable as HTMLInputElement).value || "";
      const description = id ? `#${id} (${text})` : `"${text}"`;
      const category = clickable.getAttribute("data-category") || "button-click";
      
      logEvent(`Clicked ${clickable.tagName.toLowerCase()}: ${description}`, category, "click");
    }
  });
}

// Track page navigation and calculate time spent on the previous page
export function logNavigation(newPath: string) {
  const now = Date.now();
  const timeSpentSec = Math.round((now - lastNavTime) / 100) / 10; // decimal format (e.g., 2.3s)

  // Log the time spent on the previous page
  logEvent(
    `Navigated to ${newPath}`,
    "navigation",
    "navigation",
    {
      previousPage: lastPath,
      timeSpentOnPreviousPageSec: timeSpentSec,
      timeSpentDesc: `Spent ${timeSpentSec}s on ${lastPath}`
    }
  );

  lastNavTime = now;
  lastPath = newPath;
}

export function getCachedIp(): string {
  return cachedIp;
}

// Log a click or navigation event
export function logEvent(
  actionId: string,
  category: string,
  type: 'click' | 'navigation' = 'click',
  details?: Record<string, any>
): AppEvent {
  const now = Date.now();

  // If this is a click, update click timing history
  if (type === 'click') {
    clickTimestamps.push(now);
  }

  // Filter timestamps to only keep those within the last 1000ms
  clickTimestamps = clickTimestamps.filter(t => now - t <= 1000);
  const clicksInLastSecond = type === 'click' ? clickTimestamps.length : 0;

  // Build the event
  const newEvent: AppEvent = {
    id: Math.random().toString(36).substring(2, 9) + '-' + now,
    timestamp: new Date(now).toISOString(),
    actionId,
    category,
    type,
    ip: cachedIp,
    clicksInLastSecond,
    details
  };

  try {
    const existingEvents = getEvents();
    existingEvents.unshift(newEvent); // Add new event at the beginning (newest first)

    // Limit to max events
    const trimmedEvents = existingEvents.slice(0, MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedEvents));
  } catch (err) {
    console.error("Failed to save event to localStorage", err);
  }

  return newEvent;
}

// Retrieve events
export function getEvents(): AppEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AppEvent[];
  } catch (err) {
    console.error("Failed to parse events from localStorage", err);
    return [];
  }
}

// Clear events
export function clearEvents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    clickTimestamps = [];
  } catch (err) {
    console.error("Failed to clear events from localStorage", err);
  }
}
