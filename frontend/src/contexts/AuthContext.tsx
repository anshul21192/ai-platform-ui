import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { authenticate, createSessionId, type AuthUser } from "../utils/auth";
import { setSession, clearSession, trackEvent, flush, clearEvents } from "../utils/eventLogger";
import { sendKeystrokeMetrics } from "../api/keystrokeAnalysis";
import BlockedScreen from "../components/BlockedScreen";

const SESSION_KEY = "vault_bank_session";
const MAX_FAILED_ATTEMPTS = 3;

interface SessionData {
  user: AuthUser;
  sessionId: string;
  newDevice: boolean;
  newLocation: boolean;
  fingerprint?: Record<string, unknown> | null;
}

interface AuthContextValue {
  userId: string | null;
  displayName: string | null;
  username: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  loginError: string | null;
  login: (username: string, password: string, newDevice: boolean, newLocation: boolean, keystrokeMetrics?: object, fingerprintData?: Record<string, unknown> | null) => boolean;
  logout: () => void;
  clearLoginError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

function saveSession(data: SessionData): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function removeSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<SessionData | null>(loadSession);
  const [loginError, setLoginError] = useState<string | null>(null);
  const failedAttempts = useRef(0);

  // Synchronize event logger with session on mount and session updates
  useEffect(() => {
    if (session) {
      setSession(session.user.username, session.sessionId);
    }
  }, [session]);

  const login = useCallback(
    (
      username: string,
      password: string,
      newDevice: boolean,
      newLocation: boolean,
      keystrokeMetrics?: object,
      fingerprintData?: Record<string, unknown> | null
    ): boolean => {
      const user = authenticate(username, password);
      if (!user) {
        if (keystrokeMetrics) {
          sendKeystrokeMetrics(keystrokeMetrics);
        }
        failedAttempts.current++;
        if (failedAttempts.current > MAX_FAILED_ATTEMPTS) {
          trackEvent("LOGIN_LOCKOUT", { username, failedAttempts: failedAttempts.current });
          flush();
          setLoginError("Account temporarily locked. Too many failed attempts.");
        } else {
          setLoginError("Invalid username or password");
        }
        return false;
      }

      const sessionId = createSessionId();
      const data: SessionData = { user, sessionId, newDevice, newLocation, fingerprint: fingerprintData ?? null };

      saveSession(data);
      setSessionState(data);
      setLoginError(null);
      failedAttempts.current = 0;

      setSession(user.username, sessionId);
      trackEvent("LOGIN", { newDevice, newLocation, username, fingerprint: fingerprintData ?? null  });

      if (keystrokeMetrics) {
        sendKeystrokeMetrics(keystrokeMetrics);
      }

      if (newDevice || newLocation) {
        flush();
      }

      return true;
    },
    []
  );

  const logout = useCallback(() => {
    trackEvent("LOGOUT");
    flush();
    clearEvents();
    clearSession();
    removeSession();
    setSessionState(null);
  }, []);

  const clearLoginError = useCallback(() => setLoginError(null), []);

  const [isBlocked, setIsBlocked] = useState(false);
  const [blockDetails, setBlockDetails] = useState<{
    riskScore: number;
    reason?: string;
    anomalies?: string[];
  } | null>(null);

  // Poll block status and listen for telemetry block events
  useEffect(() => {
    if (!session?.sessionId) {
      setIsBlocked(false);
      setBlockDetails(null);
      return;
    }

    const checkBlockStatus = async () => {
      try {
        const res = await fetch(`/api/v1/fraud/telemetry/session/${session.sessionId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.is_blocked) {
            localStorage.setItem("fraud_logged_out", "true");
            localStorage.setItem("fraud_risk_score", (data.risk_score || 85).toString());
            alert(`Security Alert: Suspicious fraud activity detected (Risk Score: ${data.risk_score || 85}%)! Your session has been terminated immediately.`);
            logout();
          } else {
            setIsBlocked(false);
            setBlockDetails(null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch session status:", err);
      }
    };

    // Run initial check
    checkBlockStatus();

    // Set up polling every 3 seconds
    const interval = setInterval(checkBlockStatus, 3000);

    // Also listen for real-time events triggered by the telemetry flush
    const handleBlockedEvent = (e: Event) => {
      const risk = (e as CustomEvent).detail || {};
      const score = risk.risk_score || risk.riskScore || 85;
      localStorage.setItem("fraud_logged_out", "true");
      localStorage.setItem("fraud_risk_score", score.toString());
      alert(`Security Alert: Suspicious fraud activity detected (Risk Score: ${score}%)! Your session has been terminated immediately.`);
      logout();
    };

    window.addEventListener("vault-session-blocked", handleBlockedEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener("vault-session-blocked", handleBlockedEvent);
    };
  }, [session]);

  const value: AuthContextValue = {
    userId: session?.user.userId ?? null,
    displayName: session?.user.displayName ?? null,
    username: session?.user.username ?? null,
    sessionId: session?.sessionId ?? null,
    isAuthenticated: session !== null,
    loginError,
    login,
    logout,
    clearLoginError,
  };

  return (
    <AuthContext.Provider value={value}>
      {isBlocked && session && (
        <BlockedScreen
          sessionId={session.sessionId}
          userId={session.user.userId}
          riskScore={blockDetails?.riskScore ?? 85}
          reason={blockDetails?.reason}
          anomalies={blockDetails?.anomalies}
          onLogout={logout}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
