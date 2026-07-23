// frontend/src/pages/RiskDashboardPage.tsx
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
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
  useTheme,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import SecurityIcon from "@mui/icons-material/Security";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RefreshIcon from "@mui/icons-material/Refresh";
import StorageIcon from "@mui/icons-material/Storage";
import EventNoteIcon from "@mui/icons-material/EventNote";
import InfoIcon from "@mui/icons-material/Info";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import PsychologyIcon from "@mui/icons-material/Psychology";
import AssignmentIcon from "@mui/icons-material/Assignment";

export default function RiskDashboardPage() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [showcaseData, setShowcaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/fraud/telemetry/dashboard-showcase");
      if (res.ok) {
        const data = await res.json();
        setShowcaseData(data);
      } else {
        throw new Error(`Failed to load: HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to the FastAPI fraud engine.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !showcaseData) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" action={<Button color="inherit" onClick={loadData}>Retry</Button>}>
          {error || "Could not retrieve backend telemetry data structures."}
        </Alert>
      </Box>
    );
  }

  const { engine, stats, signalWeights, fraudPatterns, baselines } = showcaseData;

  return (
    <Box sx={{ p: 4, display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Title */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1.5 }}>
            <SecurityIcon color="primary" sx={{ fontSize: 32 }} />
            Risk & Fraud Engine Showcase
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, maxWidth: 800 }}>
            Standalone showcase of the backend security parameters, active SQLite statistics, evidence-based signal weights, and typologies.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} sx={{ textTransform: "none" }}>
          Refresh Backend Info
        </Button>
      </Box>

      {/* Stats row */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderLeft: `4px solid ${theme.palette.primary.main}` }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Total Telemetry Events</Typography>
                <StorageIcon color="primary" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>{stats.totalIngestedEvents}</Typography>
              <Typography variant="caption" color="text.secondary">Raw event logs in DB</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderLeft: `4px solid ${theme.palette.info.main}` }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Monitored Sessions</Typography>
                <EventNoteIcon color="info" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>{stats.totalSessionsMonitored}</Typography>
              <Typography variant="caption" color="text.secondary">Unique user sessions tracked</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderLeft: `4px solid ${theme.palette.error.main}` }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Blocked Sessions</Typography>
                <WarningAmberIcon color="error" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "error.main" }}>{stats.totalSessionsBlocked}</Typography>
              <Typography variant="caption" color="text.secondary">Users restricted in real-time</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderLeft: `4px solid ${theme.palette.warning.main}` }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Escalated Audits</Typography>
                <SecurityIcon color="warning" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "warning.main" }}>{stats.totalEscalatedIncidents}</Typography>
              <Typography variant="caption" color="text.secondary">Pending/Resolved incidents</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Risk dashboard tabs">
          <Tab icon={<InfoIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Engine Overview" sx={{ textTransform: "none", fontWeight: 600 }} />
          <Tab icon={<FitnessCenterIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Evidence-Based Weights" sx={{ textTransform: "none", fontWeight: 600 }} />
          <Tab icon={<PsychologyIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Typologies (Rules)" sx={{ textTransform: "none", fontWeight: 600 }} />
          <Tab icon={<AssignmentIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="User Baselines" sx={{ textTransform: "none", fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {tabValue === 0 && (
        <Paper variant="outlined" sx={{ p: 4, display: "flex", flexDirection: "column", gap: 3 }}>
          <Typography variant="h6" fontWeight={700}>Backend Classification Engine Specifications</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Engine Name</TableCell>
                      <TableCell>{engine.name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Active Version</TableCell>
                      <TableCell>
                        <Chip label={engine.version} size="small" color="primary" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Architecture Classifier</TableCell>
                      <TableCell>{engine.type}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>LLM Decision Model</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{engine.aiModel}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ p: 3, bgcolor: "grey.50", border: "1px dashed", borderColor: "divider", display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={700}>How Real-Time Session Blocking Works</Typography>
                <Typography variant="body2" color="text.secondary">
                  1. **Browser Telemetry Ingestion**: Every user action (clicks, navigation, keyboard timing) is captured in a local event buffer and flushed to `/api/v1/fraud/telemetry/events`.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  2. **Sequence Analysis**: The backend loads all historical telemetry logs for that session from SQLite and scans for multi-event sequences (e.g., direct settings navigation + alert disabled + transfer).
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  3. **Dynamic Scoring**: The hybrid engine computes a risk index (0-100%). Overrides force a HIGH risk classification (&ge; 85%) for critical indicators like bot typing speed or alert guardrail removal.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  4. **Automatic Lockout**: If the score exceeds 80%, the session is flagged as `is_blocked = True`. Within 3 seconds, the browser polling loop detects the block, terminates the session, and triggers an immediate redirect.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper variant="outlined" sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" fontWeight={700}>Evidence-Based Signal Weights</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Raw threat indicators and their corresponding risk contribution weights applied during rule-based fallback analysis.
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Signal Key</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Weight / Points</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Severity Indicator</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(signalWeights).map(([key, value]: any) => (
                  <TableRow key={key} hover>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{key}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{value} points</TableCell>
                    <TableCell>
                      <Chip
                        label={value >= 30 ? "CRITICAL" : value >= 20 ? "HIGH" : "MEDIUM"}
                        size="small"
                        color={value >= 30 ? "error" : value >= 20 ? "warning" : "default"}
                        sx={{ fontSize: 11, fontWeight: 700, height: 20 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          {fraudPatterns.map((pattern: any) => (
            <Grid size={{ xs: 12, md: 6 }} key={pattern.id}>
              <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, flexGrow: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{pattern.id}</Typography>
                      <Typography variant="subtitle1" fontWeight={700}>{pattern.name}</Typography>
                    </Box>
                    <Chip label={`Risk: ${pattern.risk_score_if_matched}%`} color="error" size="small" sx={{ fontWeight: 700 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                    {pattern.description}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {pattern.indicators.map((ind: string) => (
                      <Chip key={ind} label={ind} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          {Object.entries(baselines).map(([userId, profile]: any) => (
            <Grid size={{ xs: 12, md: 4 }} key={userId}>
              <Card variant="outlined">
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6" fontWeight={700}>{profile.persona}</Typography>
                    <Chip label={userId} size="small" variant="outlined" />
                  </Box>
                  <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: "none" }}>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Max Transfer</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>${profile.maxTransferAmount}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Max Records</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{profile.maxBulkDownloadRecords} records</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Active Hours</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>
                            {profile.commonLoginHours.map((h: number) => `${h}:00`).join(", ")}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}