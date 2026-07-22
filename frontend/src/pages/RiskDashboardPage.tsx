// frontend/src/pages/RiskDashboardPage.tsx
import { useMemo, useState } from "react";
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
  Divider,
  useTheme,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RiskIcon from "@mui/icons-material/PieChartOutline";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";

const riskSummaryCards = [
  {
    title: "Current Risk Score",
    value: "72",
    change: "+18%",
    positive: true,
    description: "High risk detected this session",
    color: "error.main" as const,
    icon: <SecurityIcon />,
  },
  {
    title: "High-Risk Sessions",
    value: "8",
    description: "Count of flagged sessions this week",
    color: "warning.main" as const,
    icon: <WarningAmberIcon />,
  },
  {
    title: "Open Incidents",
    value: "5",
    description: "Pending investigation items",
    color: "secondary.main" as const,
    icon: <TrendingUpIcon />,
  },
  {
    title: "Average Risk Score",
    value: "42",
    description: "Average across all sessions",
    color: "success.main" as const,
    icon: <CheckCircleIcon />,
  },
];

const riskTrendLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const riskTrendValues = [18, 30, 25, 58, 72, 66, 55];

const riskDistribution = [
  { label: "Low", value: 42, color: "#10b981" },
  { label: "Medium", value: 33, color: "#f59e0b" },
  { label: "High", value: 25, color: "#ef4444" },
];

const sessionTelemetry = [
  {
    sessionId: "session_001",
    userId: "U1023",
    riskScore: 18,
    riskLevel: "LOW",
    events: 12,
    anomalies: ["None"],
    decision: "Continue Banking",
  },
  {
    sessionId: "session_042",
    userId: "U1023",
    riskScore: 55,
    riskLevel: "MEDIUM",
    events: 22,
    anomalies: ["Direct Route Access", "Settings Change"],
    decision: "Monitor",
  },
  {
    sessionId: "session_100",
    userId: "U9999",
    riskScore: 84,
    riskLevel: "HIGH",
    events: 31,
    anomalies: ["Bulk Download", "Transfer After Payee Add"],
    decision: "Step-up Authentication",
  },
  {
    sessionId: "session_112",
    userId: "U1023",
    riskScore: 60,
    riskLevel: "MEDIUM",
    events: 19,
    anomalies: ["Rapid Sensitive Actions"],
    decision: "Monitor",
  },
];

const incidentData = [
  {
    id: 101,
    userId: "U9999",
    sessionId: "session_100",
    riskScore: 84,
    reason: "Large transfer after suspicious payee addition",
    status: "PENDING",
  },
  {
    id: 102,
    userId: "U1023",
    sessionId: "session_042",
    riskScore: 55,
    reason: "Direct route access and settings change",
    status: "REVIEW",
  },
  {
    id: 103,
    userId: "U1023",
    sessionId: "session_089",
    riskScore: 76,
    reason: "High typing speed with new device",
    status: "ESCALATED",
  },
];

export default function RiskDashboardPage() {
  const theme = useTheme();
  const [selectedSession, setSelectedSession] = useState(sessionTelemetry[2]);

  const riskLevelCounts = useMemo(() => {
    return riskDistribution.reduce(
      (acc, item) => ({ ...acc, [item.label]: item.value }),
      {} as Record<string, number>,
    );
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={3}>
        <Grid item component="div" xs={12}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Risk & Fraud Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 680 }}>
            Real-time risk trends and behavioral evidence from the AI Risk Engine. Monitor session
            risk, incident escalation, and step-up authentication decisions from one place.
          </Typography>
        </Grid>

        {riskSummaryCards.map((card) => (
          <Grid item xs={12} md={6} lg={3} key={card.title}>
            <Card variant="outlined" sx={{ height: "100%", borderColor: card.color }}>
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: card.color,
                    color: "common.white",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} lg={8}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, gap: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Risk Trend
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Session-based risk score progression over the last 7 days.
                  </Typography>
                </Box>
                <Chip
                  icon={<RiskIcon />}
                  label="AI Risk Score"
                  sx={{ bgcolor: "grey.100", fontWeight: 600 }}
                />
              </Box>
              <BarChart
                height={320}
                xAxis={[{ data: riskTrendLabels, scaleType: "band" }]}
                series={[{ data: riskTrendValues, color: theme.palette.error.main }]}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Risk Level Distribution
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Share of sessions by risk category.
                </Typography>
              </Box>
              <PieChart
                height={320}
                series={[
                  {
                    data: riskDistribution.map((item) => ({
                      id: item.label,
                      value: item.value,
                      label: item.label,
                      color: item.color,
                    })),
                    innerRadius: 54,
                    paddingAngle: 3,
                    cornerRadius: 6,
                  },
                ]}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Latest Risk Sessions
                </Typography>
                <Button size="small" variant="outlined" onClick={() => setSelectedSession(sessionTelemetry[0])}>
                  Refresh
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: "none" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Session</TableCell>
                      <TableCell>Risk</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Decision</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessionTelemetry.map((session) => (
                      <TableRow
                        key={session.sessionId}
                        hover
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                        onClick={() => setSelectedSession(session)}
                      >
                        <TableCell>{session.sessionId}</TableCell>
                        <TableCell>
                          <Chip
                            label={session.riskLevel}
                            color={
                              session.riskLevel === "HIGH"
                                ? "error"
                                : session.riskLevel === "MEDIUM"
                                ? "warning"
                                : "success"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{session.riskScore}</TableCell>
                        <TableCell>{session.decision}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Selected Session Details
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {selectedSession.sessionId} — {selectedSession.userId}
              </Typography>

              <Box sx={{ display: "grid", gap: 2, mt: 3 }}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Risk Score
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                    {selectedSession.riskScore}
                  </Typography>
                </Card>

                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Anomalies Detected
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                    {selectedSession.anomalies.map((anomaly) => (
                      <Chip key={anomaly} label={anomaly} size="small" />
                    ))}
                  </Box>
                </Card>

                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Decision
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1, fontWeight: 700 }}>
                    {selectedSession.decision}
                  </Typography>
                </Card>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Incident Log
                </Typography>
                <Button variant="contained" size="small">
                  New Investigation
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: "none" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Session</TableCell>
                      <TableCell>Risk</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {incidentData.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell>{incident.id}</TableCell>
                        <TableCell>{incident.userId}</TableCell>
                        <TableCell>{incident.sessionId}</TableCell>
                        <TableCell>{incident.riskScore}</TableCell>
                        <TableCell>{incident.reason}</TableCell>
                        <TableCell>
                          <Chip
                            label={incident.status}
                            color={
                              incident.status === "ESCALATED"
                                ? "error"
                                : incident.status === "PENDING"
                                ? "warning"
                                : "success"
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Decision Engine
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Step-up Authentication Triggers
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ display: "grid", gap: 1 }}>
                  <Typography>
                    High risk sessions trigger verification, incident creation, and evidence capture.
                  </Typography>
                  <Typography color="text.secondary">
                    This dashboard can be wired to backend APIs to show actual live risk, session events,
                    and compliance evidence.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}