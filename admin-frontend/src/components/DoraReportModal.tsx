import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";
import ShieldIcon from "@mui/icons-material/Shield";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { fetchDoraReport } from "../api/telemetryApi";

interface DoraReportModalProps {
  open: boolean;
  sessionId: string | null;
  onClose: () => void;
}

export default function DoraReportModal({ open, sessionId, onClose }: DoraReportModalProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && sessionId) {
      setLoading(true);
      setError(null);
      fetchDoraReport(sessionId)
        .then((data) => setReport(data))
        .catch((err) => {
          console.error(err);
          setError("Failed to generate DORA report from backend.");
        })
        .finally(() => setLoading(false));
    } else {
      setReport(null);
    }
  }, [open, sessionId]);

  const handleDownloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.report_metadata?.dora_reference || "DORA_Report"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, p: 1 } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <DescriptionIcon color="primary" sx={{ fontSize: 30 }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              DORA Regulatory Incident Report
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Digital Operational Resilience Act (EU Regulation 2022/2554 Article 18)
            </Typography>
          </Box>
        </Box>
        <Button size="small" onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogTitle>

      <DialogContent sx={{ py: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {loading && (
          <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
            <CircularProgress />
            <Typography color="text.secondary" sx={{ mt: 2 }}>Generating compliance report...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        {!loading && report && (
          <Box id="dora-report-content" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header Metadata Banner */}
            <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "grey.50", borderLeft: "4px solid #ad46ff" }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>DORA REPORT REFERENCE</Typography>
                  <Typography variant="h6" sx={{ fontFamily: "monospace", fontWeight: 700, color: "primary.main" }}>
                    {report.report_metadata?.dora_reference}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: { sm: "right" } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>INCIDENT CLASSIFICATION</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={report.report_metadata?.classification}
                      color={report.report_metadata?.classification === "MAJOR_ICT_SECURITY_INCIDENT" ? "error" : "warning"}
                      sx={{ fontWeight: 700, fontSize: 12 }}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Entity Name:</Typography>
                  <Typography variant="body2" fontWeight={600}>{report.report_metadata?.entity_name}</Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: { sm: "right" } }}>
                  <Typography variant="caption" color="text.secondary">Timestamp:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {new Date(report.report_metadata?.timestamp).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Incident Summary */}
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                <ShieldIcon color="primary" fontSize="small" />
                1. Incident & Target Account Summary
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: 220 }}>Target Account / User ID</TableCell>
                      <TableCell>{report.incident_summary?.impacted_user_id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Session Reference</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{report.incident_summary?.session_id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Computed Threat Risk Score</TableCell>
                      <TableCell>
                        <Chip
                          label={`${report.incident_summary?.risk_score}% (${report.incident_summary?.risk_level})`}
                          color={report.incident_summary?.risk_score >= 80 ? "error" : "warning"}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Automated Session Lockout</TableCell>
                      <TableCell>{report.incident_summary?.is_blocked ? "YES (Terminated in Real-Time)" : "NO"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>2FA Step-up Verification Status</TableCell>
                      <TableCell>{report.incident_summary?.is_2fa_verified ? "Verified by Owner" : "Pending / Not Required"}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Root Cause & Resolution Guide for Analyst */}
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                <WarningAmberIcon color="warning" fontSize="small" />
                2. Threat Root Cause & Analyst Resolution Plan
              </Typography>
              <Paper variant="outlined" sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="error.main" fontWeight={700} sx={{ mb: 0.5 }}>
                    🔴 Why Risk Occurred (Root Cause Analysis):
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {report.root_cause_analysis?.summary || "Behavioral anomaly sequence detected."}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                    {report.root_cause_analysis?.threat_vectors?.map((v: string) => (
                      <Chip key={v} label={v} color="error" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ borderTop: "1px dashed", borderColor: "divider", pt: 1.5 }}>
                  <Typography variant="body2" color="success.main" fontWeight={700} sx={{ mb: 0.5 }}>
                    🟢 Analyst Resolution Points:
                  </Typography>
                  <Box component="ol" sx={{ pl: 2.5, m: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <li>
                      <Typography variant="body2">
                        <strong>Identity Step-Up Status:</strong> {report.incident_summary?.is_2fa_verified ? "2FA Verified by genuine owner." : "Requires mandatory 2FA Step-up code verification."}
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        <strong>Guardrail & Alert Enforcement:</strong> Confirm transaction alerts are re-enabled in user settings if previously toggled off.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        <strong>Out-of-Band Validation:</strong> If risk score &ge; 70%, perform out-of-band phone call verification prior to unblocking account.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        <strong>SOC Case Closure:</strong> Once verified, mark incident as RESOLVED in SOC Security Escalations.
                      </Typography>
                    </li>
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* Remediation */}
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                3. Remediation & Operational Mitigations
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
                  Mitigation Log:
                </Typography>
                <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
                  {report.remediation_and_mitigation?.mitigation_steps?.map((m: string, i: number) => (
                    <li key={i}>
                      <Typography variant="body2">{m}</Typography>
                    </li>
                  ))}
                </Box>
              </Paper>
            </Box>

            {/* Timeline */}
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                4. Chronological Telemetry Evidence Log ({report.chronological_telemetry_timeline?.length || 0} events)
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Seq</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Dwell (ms)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Payload Metadata</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.chronological_telemetry_timeline?.map((evt: any) => (
                      <TableRow key={evt.seq} hover>
                        <TableCell>#{evt.seq}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{evt.action}</TableCell>
                        <TableCell>{new Date(evt.timestamp_ms).toLocaleTimeString()}</TableCell>
                        <TableCell>{evt.dwell_from_prev_ms}ms</TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>
                          {JSON.stringify(evt.payload_metadata)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", p: 2, justifyContent: "space-between" }}>
        <Typography variant="caption" color="text.secondary">
          Generated automatically for SOC & Compliance Audit logging.
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} disabled={!report}>
            Print / Save PDF
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownloadJson} disabled={!report} color="primary">
            Download JSON Report
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
