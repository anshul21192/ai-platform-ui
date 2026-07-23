// frontend/src/api/telemetryApi.ts

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

async function safeJsonResponse(res: Response, endpointName: string): Promise<any> {
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    throw new Error(`Failed to ${endpointName}: HTTP ${res.status} ${res.statusText}`);
  }
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Backend service at port 8000 returned non-JSON content (${contentType || "HTML"}). Please ensure the FastAPI backend is running at http://localhost:8000.`
    );
  }
  return res.json();
}

export async function fetchTelemetryMetrics(): Promise<TelemetryMetrics> {
  const res = await fetch(`${BASE_URL}/metrics`);
  return safeJsonResponse(res, "fetch telemetry metrics");
}

export async function fetchAllSessions(limit = 100): Promise<{ sessionCount: number; sessions: BackendSessionTelemetry[] }> {
  const res = await fetch(`${BASE_URL}/all-sessions?limit=${limit}`);
  return safeJsonResponse(res, "fetch session telemetry");
}

export async function fetchAllEvents(params?: {
  limit?: number;
  sessionId?: string;
  userId?: string;
  action?: string;
}): Promise<{ totalCount: number; eventCount: number; events: BackendTelemetryEvent[] }> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.sessionId) query.set("session_id", params.sessionId);
  if (params?.userId) query.set("user_id", params.userId);
  if (params?.action) query.set("action", params.action);

  const res = await fetch(`${BASE_URL}/all-events?${query.toString()}`);
  return safeJsonResponse(res, "fetch telemetry events");
}

export async function fetchSessionEvents(sessionId: string): Promise<{ sessionId: string; eventCount: number; events: BackendTelemetryEvent[] }> {
  const res = await fetch(`${BASE_URL}/events/${encodeURIComponent(sessionId)}`);
  return safeJsonResponse(res, "fetch session events");
}

export async function postTelemetryEvents(sessionId: string, events: any[]): Promise<{ status: string; message: string; eventsProcessed: number; riskAssessment?: any }> {
  const res = await fetch(`${BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, events }),
  });
  return safeJsonResponse(res, "ingest telemetry events");
}
