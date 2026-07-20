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
import TouchAppIcon from "@mui/icons-material/TouchApp";
import SpeedIcon from "@mui/icons-material/Speed";
import { getEvents, clearEvents, logEvent, getCachedIp } from "../utils/eventLogger";
import type { AppEvent } from "../utils/eventLogger";

export default function AuditLogsPage() {
  const theme = useTheme();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [ip, setIp] = useState<string>("127.0.0.1");

  const refreshLogs = () => {
    setEvents(getEvents());
    setIp(getCachedIp());
  };

  useEffect(() => {
    refreshLogs();
    // Refresh periodically
    const interval = setInterval(refreshLogs, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleClear = () => {
    clearEvents();
    refreshLogs();
  };

  const handleSingleClick = () => {
    logEvent("test-single-click-btn", "interactive", "click", { source: "audit-logs-page" });
    refreshLogs();
  };

  const handleSimulateSpasm = () => {
    // Generate 5 clicks separated by 50ms to verify click counts in the last 1s
    for (let i = 1; i <= 5; i++) {
      setTimeout(() => {
        logEvent(`spasm-click-btn-${i}`, "interactive-spasm", "click", { clickSequence: i });
        if (i === 5) {
          refreshLogs();
        }
      }, i * 60);
    }
  };

  const cardSx = {
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "none",
  };

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid size={12} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography sx={{ fontSize: 30, fontWeight: 600, color: "text.primary", lineHeight: "36px" }}>
              Interaction & Event Logs
            </Typography>
            <Typography sx={{ fontSize: 16, color: "text.secondary", lineHeight: "24px", mt: 1 }}>
              Inspect client-side click and navigation telemetry captured for security auditing.
            </Typography>
          </Box>
        </Grid>

        {/* Info Cards & Simulators */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={cardSx}>
            <CardContent sx={{ p: "25px !important" }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: "text.secondary", mb: 2 }}>
                Client Metadata
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Resolved IP:</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{ip}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Total Logs:</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{events.length}</Typography>
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
                  startIcon={<TouchAppIcon />}
                  onClick={handleSingleClick}
                  sx={{ textTransform: "none" }}
                >
                  Trigger Normal Click
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<SpeedIcon />}
                  onClick={handleSimulateSpasm}
                  sx={{ textTransform: "none", boxShadow: "none" }}
                >
                  Trigger Click Spasm (5 clicks in &lt;1s)
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
                  <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Event Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Action / Target ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Clicks in Last 1s</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      <HistoryIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                      <Typography>No events recorded yet. Click around the app or trigger simulation events!</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => {
                    const isSpasm = event.clicksInLastSecond >= 4;
                    return (
                      <TableRow key={event.id} hover>
                        <TableCell sx={{ fontSize: 13 }}>
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.type.toUpperCase()}
                            size="small"
                            color={event.type === "click" ? "primary" : "secondary"}
                            variant="outlined"
                            sx={{ fontWeight: 500, fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>
                          {event.actionId}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.category}
                            size="small"
                            sx={{ bgcolor: "grey.100", color: "grey.800", fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{event.ip}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={event.clicksInLastSecond}
                            size="small"
                            color={isSpasm ? "error" : event.clicksInLastSecond > 1 ? "warning" : "default"}
                            sx={{ fontWeight: 600 }}
                          />
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
