import { Box, Typography, Grid, Chip, Paper, useTheme } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShieldIcon from "@mui/icons-material/Shield";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import GroupIcon from "@mui/icons-material/Group";
import BarChartIcon from "@mui/icons-material/BarChart";
import TimerIcon from "@mui/icons-material/Timer";
import GppGoodIcon from "@mui/icons-material/GppGood";
import DataSaverOffIcon from "@mui/icons-material/DataSaverOff";
import FactCheckIcon from "@mui/icons-material/FactCheck";

const metrics = [
  {
    title: "Total Sessions",
    value: "12,485",
    icon: <TrendingUpIcon fontSize="large" />,
    subtitle: "Sessions ingested from telemetry",
  },
  {
    title: "Fraud Attempts Prevented",
    value: "1,237",
    icon: <ShieldIcon fontSize="large" />,
    subtitle: "High-risk incidents intercepted",
  },
  {
    title: "Estimated Loss Prevented",
    value: "$3.9M",
    icon: <AttachMoneyIcon fontSize="large" />,
    subtitle: "Projected loss avoided through detection",
  },
  {
    title: "High-Risk Users",
    value: "86",
    icon: <GroupIcon fontSize="large" />,
    subtitle: "Users flagged for elevated risk",
  },
  {
    title: "Average Risk Score",
    value: "62",
    icon: <BarChartIcon fontSize="large" />,
    subtitle: "Across analyzed sessions",
  },
  {
    title: "False Positive Rate",
    value: "7.4%",
    icon: <FactCheckIcon fontSize="large" />,
    subtitle: "Estimated alerts requiring review",
  },
  {
    title: "Time to Detect",
    value: "18s",
    icon: <TimerIcon fontSize="large" />,
    subtitle: "Mean detection latency",
  },
  {
    title: "Time to Respond",
    value: "4m 22s",
    icon: <DataSaverOffIcon fontSize="large" />,
    subtitle: "Mean incident response time",
  },
  {
    title: "DORA Compliance Status",
    value: "Ready",
    icon: <GppGoodIcon fontSize="large" />,
    subtitle: "Structured resilience reporting",
  },
];

export default function ExecutiveDashboardPage() {
  const theme = useTheme();

  return (
    <Box sx={{ p: 4 }}>
      <Typography component="h1" sx={{ fontSize: 32, fontWeight: 700, color: "text.primary", mb: 1 }}>
        Executive Dashboard
      </Typography>
      <Typography sx={{ fontSize: 16, color: "text.secondary", mb: 4 }}>
        Static business metrics to demonstrate fraud prevention impact and operational resilience readiness.
      </Typography>

      <Grid container spacing={3}>
        {metrics.map((metric) => (
          <Grid key={metric.title} item xs={12} sm={6} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                border: `1px solid ${theme.palette.divider}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 2,
                bgcolor: "background.paper",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    {metric.title}
                  </Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 700, color: "text.primary", mt: 1 }}>
                    {metric.value}
                  </Typography>
                </Box>
                <Box sx={{ color: theme.palette.primary.main }}>{metric.icon}</Box>
              </Box>
              <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
                {metric.subtitle}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Chip label="Static data" color="primary" />
        <Chip label="Business impact" />
        <Chip label="DORA readiness" variant="outlined" />
      </Box>
    </Box>
  );
}
