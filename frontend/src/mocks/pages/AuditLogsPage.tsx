import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  useTheme,
  Grid,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import BugReportIcon from "@mui/icons-material/BugReport";
import SecurityIcon from "@mui/icons-material/Security";
import {
  getEvents,
  getBufferedEvents,
  clearEvents,
  trackEvent,
  getSessionId,
  getUserId,
} from "../../utils/eventLogger";
import type { AppEvent } from "../../utils/eventLogger";

export default function AuditLogsPage() {
  const theme = useTheme();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [buffered, setBuffered] = useState<AppEvent[]>([]);

  const refreshLogs = () => {
    setEvents(getEvents());
    setBuffered(getBufferedEvents());
  };

  useEffect(() => {
    refreshLogs();
    const interval = setInterval(refreshLogs, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleClear = () => {
    clearEvents();
    refreshLogs();
  };

  const handleSimulateNormal = () => {
    trackEvent("LOGIN", { newDevice: false, newLocation: false, username: "john@vault.bank" });
    trackEvent("VIEW_DASHBOARD", { path: "/" });
    trackEvent("VIEW_ACCOUNTS", { path: "/accounts" });
    trackEvent("VIEW_TRANSACTIONS", { path: "/transactions" });
    trackEvent("VIEW_BENEFICIARIES", { path: "/beneficiaries" });
    trackEvent("VIEW_SEND_MONEY", { path: "/payments/send-money" });
    trackEvent("TRANSFER", { amount: 150, currency: "USD", recipientName: "Jane Smith", accountNumber: "jane@example.com" });
    trackEvent("VIEW_DASHBOARD", { path: "/" });
    trackEvent("VIEW_SETTINGS", { path: "/settings" });
    trackEvent("TOGGLE_TRANSACTION_ALERTS", { enabled: true });
    trackEvent("VIEW_DASHBOARD", { path: "/" });
    trackEvent("LOGOUT");
    refreshLogs();
  };

  const handleSimulateFraud = () => {
    trackEvent("LOGIN", { newDevice: true, newLocation: true, username: "john@vault.bank" });
    trackEvent("VIEW_DASHBOARD", { path: "/" });
    trackEvent("VIEW_SETTINGS", { path: "/settings" });
    trackEvent("CHANGE_EMAIL", { newEmail: "attacker@evil.com" });
    trackEvent("CHANGE_MOBILE", { newPhone: "+44 7911 123456" });
    trackEvent("VIEW_BENEFICIARIES", { path: "/beneficiaries" });
    trackEvent("VIEW_SEND_MONEY", { path: "/payments/send-money" });
    trackEvent("ADD_PAYEE", { payeeName: "Offshore Account", accountNumber: "OFFSHORE-9988" });
    trackEvent("VIEW_TRANSACTIONS", { path: "/transactions" });
    trackEvent("BULK_DOWNLOAD", { recordCount: 500 });
    trackEvent("VIEW_SEND_MONEY", { path: "/payments/send-money" });
    trackEvent("TRANSFER", { amount: 25000, currency: "USD", recipientName: "Offshore Account", accountNumber: "OFFSHORE-9988" });
    trackEvent("LOGOUT");
    refreshLogs();
  };

  const cardSx = {
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "none",
  };

  const sessionId = getSessionId();
  const userId = getUserId();
  const allEvents = [...buffered, ...events].sort((a, b) => a.seq - b.seq);

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid size={12} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
              <Typography component="h1" sx={{ fontSize: 30, fontWeight: 600, color: "text.primary", lineHeight: "36px" }}>
              Interaction & Event Logs
            </Typography>
            <Typography sx={{ fontSize: 16, color: "text.secondary", lineHeight: "24px", mt: 1 }}>
              Inspect client-side behavioral telemetry captured for fraud detection.
            </Typography>
          </Box>
        </Grid>

        {/* Session Info & Simulators */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={cardSx}>
            <CardContent sx={{ p: "25px !important" }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: "text.secondary", mb: 2 }}>
                Session Info
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontSize: 14, color: "text.secondary" }}>User ID:</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, fontFamily: "monospace" }}>
                    {userId || "—"}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Session ID:</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace", wordBreak: "break-all" }}>
                    {sessionId || "—"}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Flushed:</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{events.length}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Buffered:</Typography>
                  <Chip
                    label={buffered.length}
                    size="small"
                    color={buffered.length > 0 ? "warning" : "default"}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined" sx={cardSx}>
            <CardContent sx={{ p: "25px !important", display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: "text.secondary" }}>
                Simulation Tools
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<SecurityIcon />}
                  onClick={handleSimulateNormal}
                  sx={{ textTransform: "none" }}
                >
                  Simulate Normal Session
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<BugReportIcon />}
                  onClick={handleSimulateFraud}
                  sx={{ textTransform: "none", boxShadow: "none" }}
                >
                  Simulate Fraud Session
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={handleClear}
                  sx={{ textTransform: "none", ml: "auto" }}
                >
                  Clear Logs
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={refreshLogs}
                  sx={{ textTransform: "none" }}
                >
                  Refresh
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Logs Table */}
        <Grid size={12}>
          <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: "none", borderColor: "divider" }}>
            <Table>
              <TableHead sx={{ bgcolor: "grey.50" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Seq</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Dwell (ms)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Metadata</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      <HistoryIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                      <Typography>No events recorded yet. Log in and navigate the app, or use simulation tools!</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  allEvents.map((event, idx) => {
                    const isInBuffer = idx < buffered.length;
                    return (
                      <TableRow key={`${event.sessionId}-${event.seq}`} hover>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>
                          {event.seq}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.action}
                            size="small"
                            color={isInBuffer ? "warning" : "primary"}
                            variant="outlined"
                            sx={{ fontWeight: 500, fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: 13 }}>
                          {new Date(event.ts).toLocaleTimeString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: 13 }}>
                          {event.dwellFromPrevMs}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isInBuffer ? "BUFFERED" : "FLUSHED"}
                            size="small"
                            color={isInBuffer ? "warning" : "success"}
                            sx={{ fontWeight: 600, fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: 12, maxWidth: 300 }}>
                          {Object.keys(event.metadata).length > 0
                            ? JSON.stringify(event.metadata)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}
