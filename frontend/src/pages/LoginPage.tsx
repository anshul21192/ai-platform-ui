import { useState, useRef} from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Avatar,
  Switch,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useVisitorData } from "@fingerprintjs/fingerprintjs-pro-react";
import PersonIcon from '@mui/icons-material/Person';
import Add from '@mui/icons-material/Add';
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SavingsIcon from '@mui/icons-material/Savings';
import LanguageIcon from "@mui/icons-material/Language";
import { useAuth } from "../contexts/AuthContext";
import {useKeystrokeDynamics} from "../hooks/useKeystrokeDynamics";



export default function LoginPage() {
  const { login, loginError, clearLoginError } = useAuth();
  const navigate = useNavigate();
  const { getData } = useVisitorData();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newDevice, setNewDevice] = useState(false);
  const [newLocation, setNewLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fingerprintStatus, setFingerprintStatus] = useState<string | null>(null);
  
  // Check if fingerprint is enabled via env variable
  const fingerprintEnabled = "bYcOv9gpXAX0S0wYP7eq";
  

  const {
    containerRef,
    getMetrics,
    handleKeyDown,
    handleKeyUp,
    resetMetrics,
  } = useKeystrokeDynamics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginError();
    setIsSubmitting(true);
    setFingerprintStatus(fingerprintEnabled ? "Capturing browser fingerprint..." : "Fingerprinting is disabled. Set VITE_FINGERPRINT_PUBLIC_KEY to enable it.");

    let fingerprintData: Record<string, unknown> | null = null;
    
    if (fingerprintEnabled) {
      try {
        const fingerprintResult = await getData({
          tag: { source: "vault-bank-login" },
          linkedId: username.trim() || "guest",
        });

        const visitorData = (fingerprintResult as { data?: { visitorId?: string; confidence?: { score?: number }; ip?: string } } | undefined)?.data ?? (fingerprintResult as { visitorId?: string; confidence?: { score?: number }; ip?: string } | undefined);

        fingerprintData = {
          visitorId: visitorData?.visitorId ?? null,
          confidence: visitorData?.confidence?.score ?? null,
          ipAddress: visitorData?.ip ?? null,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          requestId: (fingerprintResult as { requestId?: string }).requestId ?? null,
          userName: username.trim() || "guest",
        };

        console.log("Fingerprint data captured:", fingerprintData);

        try {
          const response = await fetch("http://localhost:8000/api/v1/fraud/telemetry/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: username.trim() || "guest",
              ...fingerprintData,
            }),
          });

          if (response.ok) {
            console.log("Fingerprint data sent to backend successfully");
          } else {
            console.warn("Backend returned status:", response.status);
          }
        } catch (sendError) {
          console.error("Unable to send fingerprint to backend", sendError);
        }

        setFingerprintStatus("Browser fingerprint captured for this login.");
      } catch (error) {
        console.error("Unable to capture login fingerprint", error);
        setFingerprintStatus("Fingerprint capture failed. Continuing with standard login.");
      }
    }

     const currentMetrics = getMetrics();
    console.log("Metrics before sending:", currentMetrics);


    try {
      const success = login(
        username,
        password,
        newDevice,
        newLocation,
        currentMetrics
      );

    resetMetrics();
    setIsSubmitting(false);

    if (success) {
      navigate("/");
    }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 4,
          py: 3,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <SavingsIcon aria-hidden="true" />
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 600,
              color: "text.primary",
              lineHeight: "28px",
            }}
          >
            Vault Bank
          </Typography>
        </Box>

        {/* Register link */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
            Don't have an account?
          </Typography>
          <Typography
            component="span"
            sx={{
              color: "text.primary",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              lineHeight: "20px",
            }}
          >
            Register
          </Typography>
        </Box>
      </Box>
      {/* Login Card */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 448,
            bgcolor: "background.paper",
            boxShadow: "0px 4px 3px rgba(0,0,0,0.1), 0px 10px 7.5px rgba(0,0,0,0.1)",
            px: 4,
            py: 5,
          }}
        >
          {/* Logo */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 4, position: "relative" }}>
            <Avatar
              aria-hidden="true"
              sx={{
                width: 80,
                height: 80,
                bgcolor: "grey.100",
                color: "text.primary",
              }}
            >
              <PersonIcon />
            </Avatar>
            <Avatar
              aria-hidden="true"
              sx={{
                width: 24,
                height: 24,
                bgcolor: "text.primary",
                position: "absolute",
                bottom: 0,
                right: "calc(50% - 48px)",
                border: "2px solid", borderColor: "common.white",
                "& svg": { width: 12, height: 12 },
              }}
            >
              <Add />
            </Avatar>
          </Box>

          {/* Title */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: 24, lineHeight: "32px", color: "text.primary", mb: 1 }}>
              Login to your account
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 14, lineHeight: "20px" }}>
              Enter your details to login.
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" ref={containerRef} noValidate autoComplete="off" onSubmit={handleSubmit}>
            {/* Email */}
            <TextField
              fullWidth
              label="Username"
              placeholder="Ex: john@vault.bank"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: "grey.400", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  height: 50,
                  "& fieldset": { borderColor: "grey.200" },
                  "&:hover fieldset": { borderColor: "grey.300" },
                  "&.Mui-focused fieldset": { borderColor: "text.primary" },
                },
                "& input::placeholder": { color: "grey.500", fontSize: 16, opacity: 1 },
              }}
            />

            {/* Password */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: "grey.400", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        sx={{ color: "grey.400" }}
                      >
                        {showPassword ? (
                          <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />
                        ) : (
                          <VisibilityOffOutlinedIcon sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  height: 50,
                  "& fieldset": { borderColor: "grey.200" },
                  "&:hover fieldset": { borderColor: "grey.300" },
                  "&.Mui-focused fieldset": { borderColor: "text.primary" },
                },
                "& input::placeholder": { color: "grey.500", fontSize: 16, opacity: 1 },
              }}
            />

            {/* Remember me / Forgot password */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 14 }}>
                    Remember me
                  </Typography>
                }
              />
              <Typography
                component="span"
                sx={{
                  color: "text.primary",
                  fontSize: 14,
                  textDecoration: "none",
                  fontWeight: 400,
                }}
              >
                Forgot Password?
              </Typography>
            </Box>

            {/* New Device Toggle */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, p: 1.5, bgcolor: "grey.50", border: `1px solid`, borderColor: "divider" }}>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary" }}>
                  Simulate New Device
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  Flag login as from an unrecognized device
                </Typography>
              </Box>
              <Switch
                checked={newDevice}
                onChange={(e) => setNewDevice(e.target.checked)}
                color="warning"
                size="small"
                inputProps={{ "aria-label": "Simulate new device" }}
              />
            </Box>

            {/* New Location Toggle */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, p: 1.5, bgcolor: "grey.50", border: `1px solid`, borderColor: "divider" }}>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary" }}>
                  Simulate New Location
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  Flag login as from an unusual geographic location
                </Typography>
              </Box>
              <Switch
                checked={newLocation}
                onChange={(e) => setNewLocation(e.target.checked)}
                color="warning"
                size="small"
                inputProps={{ "aria-label": "Simulate new location" }}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            {loginError && (
              <Alert severity="error" sx={{ mb: 2, fontSize: 14 }}>
                {loginError}
              </Alert>
            )}

            {fingerprintStatus && (
              <Alert severity={fingerprintStatus.includes("failed") ? "warning" : "info"} sx={{ mb: 2, fontSize: 14 }}>
                {fingerprintStatus}
              </Alert>
            )}

            {/* Sign In Button */}
            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{
                height: 48,
                textTransform: "none",
                fontSize: 16,
                fontWeight: 500,
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}
            >
              {/* Sign In */}
              {isSubmitting ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Signing in...</span>
                </Box>
              ) : (
                "Sign In"
              )}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 4,
          py: 3,
        }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 14 }}>
          ©2026 Financial Dashboard
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
          <LanguageIcon sx={{ fontSize: 14 }} />
          <Typography variant="body2" sx={{ fontSize: 14 }}>ENG</Typography>
        </Box>
      </Box>
    </Box>
  );
}
