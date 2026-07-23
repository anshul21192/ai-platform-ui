import { Box, Paper, Typography, Button, Divider } from "@mui/material";
import GppBadIcon from "@mui/icons-material/GppBad";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import LogoutIcon from "@mui/icons-material/Logout";

interface BlockedScreenProps {
  sessionId: string;
  userId: string;
  riskScore: number;
  reason?: string;
  anomalies?: string[];
  onLogout: () => void;
}

export default function BlockedScreen({
  sessionId,
  userId,
  riskScore,
  reason,
  anomalies,
  onLogout,
}: BlockedScreenProps) {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        background: "radial-gradient(circle at center, #1a103c 0%, #0d0d12 100%)",
        color: "common.white",
        p: 3,
        overflow: "auto",
      }}
    >
      <Paper
        elevation={24}
        sx={{
          maxWidth: 550,
          w: "100%",
          p: 5,
          textAlign: "center",
          bgcolor: "rgba(39, 40, 53, 0.8)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(240, 68, 56, 0.3)",
          color: "common.white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        {/* Shield Icon with glowing ring */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: "rgba(240, 68, 56, 0.15)",
            border: "2px solid #F04438",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 0 20px rgba(240, 68, 56, 0.4)",
            animation: "pulse 2s infinite ease-in-out",
            "@keyframes pulse": {
              "0%": { transform: "scale(1)", boxShadow: "0 0 20px rgba(240, 68, 56, 0.4)" },
              "50%": { transform: "scale(1.05)", boxShadow: "0 0 35px rgba(240, 68, 56, 0.6)" },
              "100%": { transform: "scale(1)", boxShadow: "0 0 20px rgba(240, 68, 56, 0.4)" },
            },
          }}
        >
          <GppBadIcon sx={{ fontSize: 45, color: "#F04438" }} />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: "-0.5px" }}>
            Session Suspended
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "error.light", fontWeight: 600 }}>
            Potential Fraud Activity Detected
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ color: "grey.300", lineHeight: 1.6 }}>
          For your protection, the Vault Bank real-time threat prevention engine has temporarily locked this session. Behavioral telemetry does not match your standard profile.
        </Typography>

        <Box
          sx={{
            width: "100%",
            bgcolor: "rgba(13, 13, 18, 0.6)",
            p: 3,
            borderRadius: 1.5,
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <Typography variant="caption" sx={{ color: "grey.500", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
            Security Diagnostics
          </Typography>
          
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="grey.400">User ID:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{userId}</Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="grey.400">Session ID:</Typography>
            <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{sessionId}</Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="grey.400">Behavioral Risk Score:</Typography>
            <Typography variant="body2" sx={{ color: "#F04438", fontWeight: 700 }}>{riskScore} / 100</Typography>
          </Box>

          {reason && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, pt: 1, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <Typography variant="caption" color="grey.500">Security Team Action:</Typography>
              <Typography variant="body2" color="error.light" sx={{ fontStyle: "italic" }}>
                {reason}
              </Typography>
            </Box>
          )}

          {anomalies && anomalies.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography variant="caption" color="grey.500">Anomalies Detected:</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                {anomalies.map((anom) => (
                  <Box
                    key={anom}
                    sx={{
                      fontSize: 10,
                      px: 1,
                      py: 0.25,
                      bgcolor: "rgba(240, 68, 56, 0.2)",
                      border: "1px solid rgba(240, 68, 56, 0.3)",
                      borderRadius: 1,
                      color: "#FECDCA",
                      fontWeight: 600,
                    }}
                  >
                    {anom}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        <Divider sx={{ width: "100%", bgcolor: "rgba(255, 255, 255, 0.1)" }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyCenter: "center", gap: 1, color: "grey.400", mx: "auto" }}>
            <SupportAgentIcon sx={{ fontSize: 20 }} />
            <Typography variant="body2">
              Helpline: <strong>1-800-555-0199</strong> (Quote Ref: FRAUD-EVA)
            </Typography>
          </Box>

          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={onLogout}
            sx={{
              mt: 1,
              textTransform: "none",
              fontWeight: 600,
              color: "#F04438",
              borderColor: "rgba(240, 68, 56, 0.5)",
              "&:hover": {
                borderColor: "#F04438",
                bgcolor: "rgba(240, 68, 56, 0.05)",
              },
            }}
          >
            Sign Out and Terminate Session
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
