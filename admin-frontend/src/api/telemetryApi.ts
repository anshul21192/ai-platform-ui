export interface BackendTelemetryEvent {
  id?: number;
  user_id: string;
  session_id: string;
  seq: number;
  action: string;
  ts: number;
  dwell_from_prev_ms: number;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface BackendSessionTelemetry {
  id?: number;
  user_id: string;
  session_id: string;
  event_count: number;
  sensitive_actions?: string[];
  risk_score: number;
  risk_level: string;
  anomalies?: string[];
  recommendation?: string;
  action_taken?: string;
  is_blocked?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TelemetryMetrics {
  totalSessions: number;
  totalEvents: number;
  highRiskSessions: number;
  mediumRiskSessions: number;
  lowRiskSessions: number;
  averageRiskScore: number;
  anomalyBreakdown: Record<string, number>;
  recentSessions: BackendSessionTelemetry[];
}

const BASE_URL = "/api/v1/fraud/telemetry";

async function handleResponse(res: Response, name: string) {
  if (!res.ok) {
    throw new Error(`Failed to ${name}: HTTP ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTelemetryMetrics(): Promise<TelemetryMetrics> {
  const res = await fetch(`${BASE_URL}/metrics`);
  return handleResponse(res, "fetch metrics");
}

export async function fetchAllSessions(limit = 100): Promise<{ sessionCount: number; sessions: BackendSessionTelemetry[] }> {
  const res = await fetch(`${BASE_URL}/all-sessions?limit=${limit}`);
  return handleResponse(res, "fetch all sessions");
}

export async function fetchSessionEvents(sessionId: string): Promise<{ sessionId: string; eventCount: number; events: BackendTelemetryEvent[] }> {
  const res = await fetch(`${BASE_URL}/events/${encodeURIComponent(sessionId)}`);
  return handleResponse(res, "fetch session events");
}

export async function postTelemetryEvents(sessionId: string, events: any[]): Promise<any> {
  const res = await fetch(`${BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, events }),
  });
  return handleResponse(res, "ingest events");
}

export async function blockSession(sessionId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/session/${encodeURIComponent(sessionId)}/block`, {
    method: "POST",
  });
  return handleResponse(res, "block session");
}

export async function unblockSession(sessionId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/session/${encodeURIComponent(sessionId)}/unblock`, {
    method: "POST",
  });
  return handleResponse(res, "unblock session");
}
