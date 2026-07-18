import { Card, CardContent, Typography, Box } from "@mui/material";
import type { SvgIconProps } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon: React.ReactElement<SvgIconProps>;
  iconBgKey?: string;
}

export default function StatCard({ title, value, change, positive, icon, iconBgKey }: StatCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: "14px",
        height: "100%",
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ p: 3.125, display: "flex", flexDirection: "column", gap: 5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "10px",
              bgcolor: iconBgKey ?? "grey.100",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              "& svg": { fontSize: 24 },
            }}
          >
            {icon}
          </Box>
          {positive !== undefined && change !== undefined && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {positive ? (
                <ArrowUpwardIcon sx={{ fontSize: 16, color: "success.dark" }} />
              ) : (
                <ArrowDownwardIcon sx={{ fontSize: 16, color: "error.main" }} />
              )}
              <Typography sx={{ fontSize: 14, color: positive ? "success.dark" : "error.main" }}>
                {change}
              </Typography>
            </Box>
          )}
        </Box>
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 600, color: "text.primary", lineHeight: "32px", letterSpacing: "0.0703px" }}>
            {value}
          </Typography>
          <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: "20px", mt: 0.5 }}>
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
