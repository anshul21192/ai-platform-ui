
export interface AppEvent {
  userId: string;
  sessionId: string;
  seq: number;
  action: string;
  ts: number;
  dwellFromPrevMs: number;
  metadata: Record<string, any>;
}

const STORAGE_KEY = "vault_bank_events";
const MAX_EVENTS = 200;
const SENSITIVE_ACTIONS = new Set([
  "DELETE_BENEFICIARY",
  "EDIT_BENEFICIARIES",
  "ADD_PAYEE",
  "BULK_DOWNLOAD",
  "TRANSFER",
  "REQUEST_MONEY",
  "CHANGE_EMAIL",
  "CHANGE_MOBILE",
  "CHANGE_PASSWORD",
  "TOGGLE_TRANSACTION_ALERTS",
  "LOGIN_LOCKOUT",
]);

const ROUTE_ACTION_MAP: Record<string, string> = {
  "/": "VIEW_DASHBOARD",
  "/transactions": "VIEW_TRANSACTIONS",
  "/beneficiaries": "VIEW_BENEFICIARIES",
  "/manage-beneficiary": "VIEW_MANAGE_BENEFICIARY",
  "/settings": "VIEW_SETTINGS",
  "/audit-logs": "VIEW_AUDIT_LOGS",
  "/payments/send-money": "VIEW_SEND_MONEY",
  "/payments/request-money": "VIEW_REQUEST_MONEY",
};

const SENSITIVE_ROUTES: Record<string, string[]> = {
  "/payments/send-money": ["/beneficiaries", "/dashboard", "/audit-logs", "/"],
  "/payments/request-money": ["/beneficiaries", "/dashboard", "/audit-logs", "/"],
  "/manage-beneficiary": ["/beneficiaries", "/audit-logs"],
  "/settings": ["/dashboard", "/audit-logs", "/"],
  "/transactions": ["/dashboard", "/audit-logs", "/"],
};

const NAV_HISTORY_MAX = 15;

let currentUserId: string | null = null;
let currentSessionId: string | null = null;
let seq = 0;
let previousEventTs = 0;
let buffer: AppEvent[] = [];
let onFlushCallback: ((events: AppEvent[]) => void) | null = null;
let navHistory: string[] = [];

export function setSession(userId: string, sessionId: string): void {
  clearBuffer();
  currentUserId = userId;
  currentSessionId = sessionId;
  seq = 0;
  previousEventTs = Date.now();
  navHistory = [];
}

export function clearSession(): void {
  flush();
  currentUserId = null;
  currentSessionId = null;
  seq = 0;
  previousEventTs = 0;
  navHistory = [];
}

export function setFlushCallback(fn: (events: AppEvent[]) => void): void {
  onFlushCallback = fn;
}

export function trackEvent(
  action: string,
  metadata: Record<string, any> = {}
): AppEvent | null {
  const now = Date.now();
  const dwellFromPrevMs = now - previousEventTs;

  const event: AppEvent = {
    userId: currentUserId ?? "anonymous",
    sessionId: currentSessionId ?? "pre-session",
    seq: ++seq,
    action,
    ts: now,
    dwellFromPrevMs,
    metadata,
  };

  buffer.push(event);
  previousEventTs = now;

  if (SENSITIVE_ACTIONS.has(action)) {
    flush();
  }

  return event;
}

export function flush(): void {
  if (buffer.length === 0) return;

  const eventsToFlush = [...buffer];
  buffer = [];

  try {
    const existing = getEvents();
    const merged = [...eventsToFlush, ...existing].slice(0, MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.error("Failed to persist events to localStorage", err);
  }

  if (currentSessionId || eventsToFlush.length > 0) {
    const sessionId = currentSessionId ?? eventsToFlush[0]?.sessionId ?? "unknown";
    fetch(`http://localhost:8000/v1/fraud/telemetry/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, events: eventsToFlush }),
    }).catch((err) => console.error("Failed to flush events to telemetry endpoint", err));
  }

  onFlushCallback?.(eventsToFlush);
}

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

export function getBufferedEvents(): AppEvent[] {
  return [...buffer];
}

export function clearEvents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear events from localStorage", err);
  }
  clearBuffer();
}

export function logNavigation(newPath: string): void {
  const action = ROUTE_ACTION_MAP[newPath] || `NAVIGATE_${newPath.replace(/\//g, "_").toUpperCase()}`;
  trackEvent(action, { path: newPath });

  const prevRoute = navHistory.length > 0 ? navHistory[navHistory.length - 1] : null;
  navHistory.push(newPath);
  if (navHistory.length > NAV_HISTORY_MAX) {
    navHistory.shift();
  }

  const validPredecessors = SENSITIVE_ROUTES[newPath];
  if (validPredecessors) {
    const isDirectAccess = !prevRoute || !validPredecessors.includes(prevRoute);
    if (isDirectAccess) {
      trackEvent("DIRECT_ROUTE_ACCESS", {
        targetRoute: newPath,
        previousRoute: prevRoute,
        navHistory: [...navHistory],
        reason: prevRoute
          ? `Navigated directly from ${prevRoute} without visiting a valid predecessor`
          : "First route accessed after login with no navigation history",
      });
    }
  }
}

export function getNavHistory(): string[] {
  return [...navHistory];
}

export function getSessionId(): string | null {
  return currentSessionId;
}

export function getUserId(): string | null {
  return currentUserId;
}

function clearBuffer(): void {
  buffer = [];
}
