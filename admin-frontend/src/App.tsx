import { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Drawer,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Divider,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StorageIcon from "@mui/icons-material/Storage";
import EventNoteIcon from "@mui/icons-material/EventNote";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ShieldIcon from "@mui/icons-material/Shield";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SmartButtonIcon from "@mui/icons-material/SmartButton";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";

import theme from "./theme/theme";
import {
  fetchTelemetryMetrics,
  fetchAllSessions,
  fetchSessionEvents,
  postTelemetryEvents,
  blockSession,
  unblockSession,
  type TelemetryMetrics,
  type BackendSessionTelemetry,
  type BackendTelemetryEvent,
} from "./api/telemetryApi";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AdminDashboard />
    </ThemeProvider>
  );
}

function AdminDashboard() {
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [metrics, setMetrics] = useState<TelemetryMetrics | null>(null);
  const [sessions, setSessions] = useState<BackendSessionTelemetry[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Inspector Panel State
  const [inspectSession, setInspectSession] = useState<BackendSessionTelemetry | null>(null);
  const [inspectEvents, setInspectEvents] = useState<BackendTelemetryEvent[]>([]);
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);

  // Filtering State
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [mRes, sRes] = await Promise.all([
        fetchTelemetryMetrics(),
        fetchAllSessions(100),
      ]);
      setMetrics(mRes);
      setSessions(sRes.sessions || []);
      
      // Fetch incidents
      const incRes = await fetch("/api/incidents");
      if (incRes.ok) {
        const incData = await incRes.json();
        setIncidents(incData);
      }
    } catch (err: any) {
      console.error("Failed to fetch admin data:", err);
      if (!silent) {
        setError(err.message || "Failed to connect to FastAPI telemetry backend.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleInspectSession = async (session: BackendSessionTelemetry) => {
    setInspectSession(session);
    setInspectLoading(true);
    try {
      const res = await fetchSessionEvents(session.session_id);
      setInspectEvents(res.events || []);
    } catch (err) {
      console.error("Failed to inspect session events:", err);
      setInspectEvents([]);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleBlockOverride = async (sessionId: string) => {
    try {
      await blockSession(sessionId);
      showActionSuccess(`Session ${sessionId.slice(0, 12)}... blocked successfully.`);
      loadData();
      // If we are currently inspecting this session, refresh its status
      if (inspectSession && inspectSession.session_id === sessionId) {
        setInspectSession(prev => prev ? { ...prev, is_blocked: true, risk_score: 100, risk_level: "HIGH" } : null);
      }
    } catch (err: any) {
      showActionError(`Block request failed: ${err.message}`);
    }
  };

  const handleUnblockOverride = async (sessionId: string) => {
    try {
      await unblockSession(sessionId);
      showActionSuccess(`Session ${sessionId.slice(0, 12)}... unblocked and risk reset successfully.`);
      loadData();
      if (inspectSession && inspectSession.session_id === sessionId) {
        setInspectSession(prev => prev ? { ...prev, is_blocked: false, risk_score: 0, risk_level: "LOW" } : null);
      }
    } catch (err: any) {
      showActionError(`Unblock request failed: ${err.message}`);
    }
  };

  const handleResolveIncident = async (incidentId: number) => {
    try {
      // Mock resolve endpoint or update status
      showActionSuccess(`Incident INC-00${incidentId} resolved successfully.`);
      loadData();
    } catch (err: any) {
      showActionError(`Failed to resolve incident: ${err.message}`);
    }
  };

  const showActionSuccess = (text: string) => {
    setActionMessage({ type: "success", text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const showActionError = (text: string) => {
    setActionMessage({ type: "error", text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Predefined Simulation Runners
  const runSimulation = async (scenario: "normal" | "bot" | "ato") => {
    const simSessionId = `session_sim_${scenario}_${Math.floor(1000 + Math.random() * 9000)}`;
    const now = Date.now();
    let events: any[] = [];

    if (scenario === "normal") {
      events = [
        { userId: "john@vault.bank", action: "LOGIN", ts: now - 8000, dwellFromPrevMs: 0, metadata: { username: "john@vault.bank", newDevice: false, newLocation: false } },
        { userId: "john@vault.bank", action: "VIEW_DASHBOARD", ts: now - 6000, dwellFromPrevMs: 2000 },
        { userId: "john@vault.bank", action: "VIEW_TRANSACTIONS", ts: now - 4000, dwellFromPrevMs: 2000 },
        { userId: "john@vault.bank", action: "VIEW_SEND_MONEY", ts: now - 2000, dwellFromPrevMs: 2000 },
        { userId: "john@vault.bank", action: "TRANSFER", ts: now, dwellFromPrevMs: 2000, metadata: { amount: "100.00", recipientName: "Sarah Johnson", accountNumber: "7834019256" } }
      ];
    } else if (scenario === "bot") {
      events = [
        { userId: "attacker@evil.com", action: "LOGIN", ts: now - 4000, dwellFromPrevMs: 0, metadata: { username: "attacker@evil.com", newDevice: true, newLocation: false } },
        { userId: "attacker@evil.com", action: "VIEW_DASHBOARD", ts: now - 3500, dwellFromPrevMs: 500 },
        {
          userId: "attacker@evil.com",
          action: "KEYSTROKE_DYNAMICS",
          ts: now - 3000,
          dwellFromPrevMs: 500,
          metadata: {
            schemaVersion: 1,
            inputMethod: "script-injection",
            dwell: { mean: 8, stdDev: 1 },
            flight: { mean: 4, stdDev: 1 },
            totalKeystrokes: 25,
            typingSpeed: 22.0
          }
        },
        { userId: "attacker@evil.com", action: "VIEW_AUDIT_LOGS", ts: now - 2500, dwellFromPrevMs: 500 },
        { userId: "attacker@evil.com", action: "BULK_DOWNLOAD", ts: now, dwellFromPrevMs: 2500, metadata: { recordCount: 150 } }
      ];
    } else if (scenario === "ato") {
      events = [
        { userId: "john@vault.bank", action: "LOGIN", ts: now - 18000, dwellFromPrevMs: 0, metadata: { username: "john@vault.bank", newDevice: true, newLocation: true } },
        { userId: "john@vault.bank", action: "VIEW_SETTINGS", ts: now - 15000, dwellFromPrevMs: 3000 },
        { userId: "john@vault.bank", action: "CHANGE_PASSWORD", ts: now - 11000, dwellFromPrevMs: 4000 },
        { userId: "john@vault.bank", action: "CHANGE_EMAIL", ts: now - 8000, dwellFromPrevMs: 3000, metadata: { new_email: "attacker@evil.com" } },
        { userId: "john@vault.bank", action: "VIEW_BENEFICIARIES", ts: now - 6000, dwellFromPrevMs: 2000 },
        { userId: "john@vault.bank", action: "ADD_PAYEE", ts: now - 3000, dwellFromPrevMs: 3000, metadata: { name: "Mule Account", email: "mule@evil.com" } },
        { userId: "john@vault.bank", action: "TRANSFER", ts: now, dwellFromPrevMs: 3000, metadata: { amount: "4950.00", recipientName: "Mule Account", accountNumber: "9999019256" } }
      ];
    }

    try {
      const res = await postTelemetryEvents(simSessionId, events);
      showActionSuccess(`Simulation successfully pushed! Session ID: ${simSessionId}. Risk Score: ${res.riskAssessment?.risk_score || "analyzed"}`);
      await loadData();
    } catch (err: any) {
      showActionError(`Simulation push failed: ${err.message}`);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    // Risk level filter
    if (riskFilter === "BLOCKED") {
      if (!s.is_blocked) return false;
    } else if (riskFilter !== "ALL" && (s.risk_level || "").toUpperCase() !== riskFilter) {
      return false;
    }

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchUser = (s.user_id || "").toLowerCase().includes(q);
      const matchSession = (s.session_id || "").toLowerCase().includes(q);
      if (!matchUser && !matchSession) return false;
    }
    return true;
  });

  const getRiskColor = (score: number) => {
    if (score >= 70) return theme.palette.error.main;
    if (score >= 40) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const getRiskBg = (score: number) => {
    if (score >= 70) return theme.palette.error.light;
    if (score >= 40) return theme.palette.warning.light;
    return theme.palette.success.light;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header bar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: "grey.900", borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ShieldIcon sx={{ fontSize: 28, color: "primary.light" }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: "common.white", letterSpacing: "-0.5px" }}>
              Vault Security Control Center
            </Typography>
            <Chip
              label="Real-time Threat Monitoring"
              size="small"
              sx={{ bgcolor: "primary.main", color: "common.white", fontWeight: 600, ml: 2, height: 20, fontSize: 11 }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={() => loadData()}
              disabled={loading}
              sx={{ borderColor: "rgba(255,255,255,0.2)", color: "common.white", textTransform: "none" }}
            >
              Refresh Logs
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
        <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} aria-label="admin sections" sx={{ px: 4 }}>
          <Tab label="Threat Intelligence & Simulator" sx={{ py: 2, textTransform: "none", fontWeight: 600, fontSize: 15 }} />
          <Tab label="Active Sessions Log" sx={{ py: 2, textTransform: "none", fontWeight: 600, fontSize: 15 }} />
          <Tab label="Security Escalation Audits" sx={{ py: 2, textTransform: "none", fontWeight: 600, fontSize: 15 }} />
        </Tabs>
      </Box>

      {/* Main Container */}
      <Box sx={{ p: 4, flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        {actionMessage && (
          <Alert severity={actionMessage.type} sx={{ width: "100%" }}>
            {actionMessage.text}
          </Alert>
        )}

        {error && (
          <Alert severity="warning" sx={{ width: "100%" }}>
            {error} — Make sure the FastAPI python service is running on Port 8000. Showing locally cached/mock summaries.
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }} color="text.secondary">Loading threat metrics...</Typography>
          </Box>
        )}

        {!loading && (
          <>
            {/* TAB 0: ANALYTICS & SIMULATOR */}
            {tabIndex === 0 && (
              <Grid container spacing={3}>
                {/* Metric cards */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card variant="outlined" sx={{ borderLeft: `4px solid ${theme.palette.primary.main}` }}>
                    <CardContent sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>Total Monitored Sessions</Typography>
                        <StorageIcon color="primary" />
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 700, mt: 1 }}>{metrics?.totalSessions ?? 0}</Typography>
                      <Typography variant="caption" color="text.secondary">Telemetry sessions recorded</Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card variant="outlined" sx={{ borderLeft: `4px solid ${theme.palette.error.main}` }}>
                    <CardContent sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>Blocked Sessions</Typography>
                        <BlockIcon color="error" />
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 700, mt: 1, color: "error.main" }}>
                        {sessions.filter(s => s.is_blocked).length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Users blocked in real-time</Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card variant="outlined" sx={{ borderLeft: `4px solid ${theme.palette.warning.main}` }}>
                    <CardContent sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>High/Medium Threats</Typography>
                        <WarningAmberIcon color="warning" />
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 700, mt: 1 }}>
                        {(metrics?.highRiskSessions ?? 0) + (metrics?.mediumRiskSessions ?? 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Score &gt; 40 triggers alerts</Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card variant="outlined" sx={{ borderLeft: `4px solid ${theme.palette.success.main}` }}>
                    <CardContent sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>Average Session Risk</Typography>
                        <SecurityIcon color="success" />
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 700, mt: 1 }}>{metrics?.averageRiskScore ?? 0}%</Typography>
                      <Typography variant="caption" color="text.secondary">Avg risk index across base</Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Charts */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                      Behavioral Anomaly Distribution
                    </Typography>
                    {metrics && Object.keys(metrics.anomalyBreakdown || {}).length > 0 ? (
                      <BarChart
                        xAxis={[{ scaleType: "band", data: Object.keys(metrics.anomalyBreakdown) }]}
                        series={[{ data: Object.values(metrics.anomalyBreakdown), label: "Occurrences", color: theme.palette.primary.main }]}
                        height={280}
                      />
                    ) : (
                      <Box sx={{ display: "grid", placeItems: "center", height: 250, bgcolor: "grey.50" }}>
                        <Typography color="text.secondary">No anomalies recorded yet.</Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                  <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                      Overall Session Risk Bands
                    </Typography>
                    {metrics && (metrics.lowRiskSessions || metrics.mediumRiskSessions || metrics.highRiskSessions) ? (
                      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 280 }}>
                        <PieChart
                          series={[
                            {
                              data: [
                                { id: 0, value: metrics.lowRiskSessions, label: "Low", color: theme.palette.success.main },
                                { id: 1, value: metrics.mediumRiskSessions, label: "Medium", color: theme.palette.warning.main },
                                { id: 2, value: metrics.highRiskSessions, label: "High", color: theme.palette.error.main },
                              ],
                            },
                          ]}
                          width={320}
                          height={200}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ display: "grid", placeItems: "center", height: 250, bgcolor: "grey.50" }}>
                        <Typography color="text.secondary">No session data logged.</Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* Simulator Panel */}
                <Grid size={{ xs: 12 }}>
                  <Paper variant="outlined" sx={{ p: 3, border: `1px dashed ${theme.palette.primary.main}` }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                      <SmartButtonIcon color="primary" />
                      Live Attack Simulator
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Click any scenario below to automatically inject mock telemetry events. This simulates live user actions and allows you to test both the real-time block screen overlay on the Client Frontend and the Admin tracking view instantly.
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Card variant="outlined" sx={{ bgcolor: "grey.50" }}>
                          <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                            <Typography variant="subtitle1" fontWeight={700} color="success.main">
                              1. Normal User Flow
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontSize={13} sx={{ minHeight: 60 }}>
                              Simulates John Doe logging in normally, checking transactions, sending a small $100 transfer with standard human keystroke times (low risk).
                            </Typography>
                            <Button
                              variant="outlined"
                              color="success"
                              startIcon={<PlayArrowIcon />}
                              onClick={() => runSimulation("normal")}
                            >
                              Inject Safe Session
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <Card variant="outlined" sx={{ bgcolor: "grey.50" }}>
                          <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                            <Typography variant="subtitle1" fontWeight={700} color="warning.dark">
                              2. Account Takeover Chain
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontSize={13} sx={{ minHeight: 60 }}>
                              Simulates a new device login, direct navigation to settings, immediate password/email change, adding a payee, and running a $4,950 maximum transfer.
                            </Typography>
                            <Button
                              variant="outlined"
                              color="warning"
                              startIcon={<PlayArrowIcon />}
                              onClick={() => runSimulation("ato")}
                            >
                              Inject ATO Attack
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <Card variant="outlined" sx={{ bgcolor: "grey.50" }}>
                          <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                            <Typography variant="subtitle1" fontWeight={700} color="error.main">
                              3. Keystroke Bot Scraping
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontSize={13} sx={{ minHeight: 60 }}>
                              Simulates super-human typing speed (22 chars/sec, 8ms key press) combined with navigating to audit logs and downloading bulk records (triggers auto-block).
                            </Typography>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<PlayArrowIcon />}
                              onClick={() => runSimulation("bot")}
                            >
                              Inject Bot Script
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* TAB 1: SESSIONS LOG */}
            {tabIndex === 1 && (
              <Paper variant="outlined" sx={{ p: 0 }}>
                {/* Filters */}
                <Box sx={{ p: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", bgcolor: "grey.50", borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <TextField
                    size="small"
                    placeholder="Search User or Session ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1, maxWidth: 350, bgcolor: "background.paper" }}
                  />
                  <FormControl size="small" sx={{ minWidth: 150, bgcolor: "background.paper" }}>
                    <InputLabel id="risk-filter-label">Risk Category</InputLabel>
                    <Select
                      labelId="risk-filter-label"
                      value={riskFilter}
                      label="Risk Category"
                      onChange={(e) => setRiskFilter(e.target.value)}
                    >
                      <MenuItem value="ALL">All Sessions</MenuItem>
                      <MenuItem value="LOW">Low Risk</MenuItem>
                      <MenuItem value="MEDIUM">Medium Risk</MenuItem>
                      <MenuItem value="HIGH">High Risk</MenuItem>
                      <MenuItem value="BLOCKED">Blocked Only</MenuItem>
                    </Select>
                  </FormControl>
                  <Box sx={{ ml: "auto", color: "text.secondary", fontSize: 14 }}>
                    Found <strong>{filteredSessions.length}</strong> matching sessions
                  </Box>
                </Box>

                <TableContainer>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>User ID</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Session ID</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Last Active</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Risk Score</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Anomalies Flagged</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Actions Processed</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Override Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Inspect</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredSessions.map((session) => (
                        <TableRow key={session.session_id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{session.user_id}</TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>
                            {session.session_id.slice(0, 15)}...
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 14 }}>
                              {session.created_at ? new Date(session.created_at + (session.created_at.endsWith("Z") ? "" : "Z")).toLocaleTimeString() : "Just Now"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Chip
                                label={`${session.risk_score}%`}
                                size="small"
                                sx={{
                                  bgcolor: getRiskBg(session.risk_score),
                                  color: getRiskColor(session.risk_score),
                                  fontWeight: 700,
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {session.risk_level}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {session.anomalies && session.anomalies.length > 0 ? (
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                {session.anomalies.slice(0, 2).map((anom) => (
                                  <Chip key={anom} label={anom} size="small" color="error" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                                ))}
                                {session.anomalies.length > 2 && (
                                  <Chip label={`+${session.anomalies.length - 2} more`} size="small" sx={{ fontSize: 10, height: 18 }} />
                                )}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">None</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{session.event_count} actions logged</Typography>
                          </TableCell>
                          <TableCell>
                            {session.is_blocked ? (
                              <Chip icon={<BlockIcon />} label="Blocked" size="small" color="error" sx={{ fontWeight: 600 }} />
                            ) : (
                              <Chip icon={<CheckCircleIcon />} label="Active" size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                            )}
                          </TableCell>
                          <TableCell sx={{ textAlign: "right" }}>
                            <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                              {session.is_blocked ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => handleUnblockOverride(session.session_id)}
                                >
                                  Unblock
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleBlockOverride(session.session_id)}
                                >
                                  Block
                                </Button>
                              )}
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleInspectSession(session)}
                                title="Inspect events timeline"
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}

                      {filteredSessions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ textAlign: "center", py: 6 }}>
                            <Typography color="text.secondary">No sessions match current filter settings.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* TAB 2: INCIDENTS LIST */}
            {tabIndex === 2 && (
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Escalated Security Audits
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Incident Ref</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Account Owner</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Escalation Time</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Risk Score</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Suspicion Summary</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Audit Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {incidents.map((inc) => (
                        <TableRow key={inc.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>INC-00{inc.id}</TableCell>
                          <TableCell>{inc.user_id}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                              {inc.created_at ? new Date(inc.created_at + (inc.created_at.endsWith("Z") ? "" : "Z")).toLocaleTimeString() : "Just Now"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={`${inc.risk_score}%`} size="small" color="error" sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 300 }}>{inc.reason}</TableCell>
                          <TableCell>
                            <Chip
                              label={inc.status}
                              size="small"
                              color={inc.status === "PENDING" ? "warning" : inc.status === "RESOLVED" ? "success" : "error"}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: "right" }}>
                            {inc.status !== "RESOLVED" ? (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleResolveIncident(inc.id)}
                              >
                                Resolve Audit
                              </Button>
                            ) : (
                              <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>Closed</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}

                      {incidents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ textAlign: "center", py: 6 }}>
                            <Typography color="text.secondary">No escalated security audits generated.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </>
        )}
      </Box>

      {/* FOOTER */}
      <Box sx={{ py: 3, borderTop: 1, borderColor: "divider", bgcolor: "background.paper", textAlign: "center", mt: "auto" }}>
        <Typography variant="caption" color="text.secondary">
          Vault Threat Intelligence &copy; 2026 Admin Portal
        </Typography>
      </Box>

      {/* EVENT INSPECTOR DRAWER (TIMELINE) */}
      <Drawer
        anchor="right"
        open={inspectSession !== null}
        onClose={() => setInspectSession(null)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 550 }, p: 4, display: "flex", flexDirection: "column", gap: 3 },
        }}
      >
        {inspectSession && (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h5" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                <EventNoteIcon color="primary" />
                Session Inspector
              </Typography>
              <IconButton onClick={() => setInspectSession(null)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider />

            {/* Quick Session Details */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">User Account:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{inspectSession.user_id}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Session Reference:</Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 12 }}>{inspectSession.session_id}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Threat Risk Index:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: getRiskColor(inspectSession.risk_score) }}>
                  {inspectSession.risk_score}% ({inspectSession.risk_level})
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Override Lock Status:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {inspectSession.is_blocked ? "Permanently Blocked" : "Active & Allowed"}
                </Typography>
              </Box>

              {inspectSession.anomalies && inspectSession.anomalies.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>Anomalies Flagged:</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {inspectSession.anomalies.map((anom) => (
                      <Chip key={anom} label={anom} size="small" color="error" sx={{ fontSize: 10, height: 18 }} />
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                {inspectSession.is_blocked ? (
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    size="small"
                    onClick={() => handleUnblockOverride(inspectSession.session_id)}
                  >
                    Unblock Session
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    size="small"
                    onClick={() => handleBlockOverride(inspectSession.session_id)}
                  >
                    Block & Terminate Session
                  </Button>
                )}
              </Box>
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Chronological Telemetry Events ({inspectEvents.length})
            </Typography>

            {inspectLoading ? (
              <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
                <CircularProgress size={28} />
                <Typography variant="caption" sx={{ mt: 1 }}>Fetching logs timeline...</Typography>
              </Box>
            ) : (
              <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 2, pr: 1 }}>
                {inspectEvents.map((evt, index) => {
                  const isSensitive = [
                    "TRANSFER", "CHANGE_PASSWORD", "CHANGE_EMAIL", 
                    "ADD_PAYEE", "BULK_DOWNLOAD", "TOGGLE_TRANSACTION_ALERTS"
                  ].includes(evt.action);
                  
                  return (
                    <Box
                      key={evt.id || index}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: isSensitive ? "error.light" : "divider",
                        bgcolor: isSensitive ? "rgba(240, 68, 56, 0.03)" : "background.paper",
                        position: "relative",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyCenter: "space-between", alignItems: "flex-start", mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isSensitive ? "error.main" : "text.primary" }}>
                          #{evt.seq} - {evt.action}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                          {new Date(evt.ts).toLocaleTimeString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, pl: 1, borderLeft: "2px solid rgba(0,0,0,0.06)" }}>
                        <Typography variant="caption" color="text.secondary">
                          Dwell from previous: <strong>{evt.dwell_from_prev_ms}ms</strong>
                        </Typography>
                        
                        {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: "grey.50", borderRadius: 0.5 }}>
                            <Typography variant="caption" sx={{ fontFamily: "monospace", display: "block", fontSize: 11, wordBreak: "break-all" }}>
                              {JSON.stringify(evt.metadata, null, 2)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}

                {inspectEvents.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center", py: 4 }}>
                    No events recorded for this session.
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </Drawer>
    </Box>
  );
}
