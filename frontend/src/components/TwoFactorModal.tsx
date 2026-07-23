import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import ShieldIcon from "@mui/icons-material/Shield";

interface TwoFactorModalProps {
  open: boolean;
  sessionId: string;
  riskScore: number;
  onVerified: () => void;
  onCancel: () => void;
}

export default function TwoFactorModal({
  open,
  sessionId,
  riskScore,
  onVerified,
  onCancel,
}: TwoFactorModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code || code.trim().length < 4) {
      setError("Please enter a valid 2FA verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/fraud/telemetry/session/${sessionId}/verify-2fa`, {
        method: "POST",
      });
      if (res.ok) {
        onVerified();
      } else {
        throw new Error("Failed to verify 2FA. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "2FA Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} disableEscapeKeyDown maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        <ShieldIcon color="warning" sx={{ fontSize: 28 }} />
        <Typography variant="h6" fontWeight={700}>
          Security Step-Up Required
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Alert severity="warning" icon={<SecurityIcon fontSize="inherit" />}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Moderate Threat Level Detected
              </Typography>
              <Chip label={`Risk Score: ${riskScore}%`} color="warning" size="small" sx={{ fontWeight: 700 }} />
            </Box>
            <Typography variant="body2">
              Unusual behavioral patterns were detected during this session. To protect your financial assets, please verify 2-Factor Authentication.
            </Typography>
          </Alert>

          <Box component="form" onSubmit={handleVerify} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter the 6-digit authentication code sent to your registered device (Demo: enter any 6 digits e.g. <code>123456</code>):
            </Typography>

            <TextField
              autoFocus
              fullWidth
              label="2FA Verification Code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              slotProps={{
                htmlInput: { maxLength: 6, style: { textAlign: "center", letterSpacing: "4px", fontSize: "20px", fontWeight: 700 } }
              }}
            />

            {error && (
              <Typography variant="caption" color="error.main" fontWeight={600}>
                {error}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onCancel} color="inherit" disabled={loading} sx={{ textTransform: "none" }}>
          Cancel / Logout
        </Button>
        <Button
          onClick={() => handleVerify()}
          variant="contained"
          color="warning"
          disabled={loading || !code}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ShieldIcon />}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Verify 2FA & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
