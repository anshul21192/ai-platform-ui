import { Card, CardContent, Typography, Box, Avatar, Button, IconButton } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

interface BeneficiaryCardProps {
  name: string;
  initials: string;
  email: string;
  phone: string;
  bank: string;
  account: string;
  gradient: string;
  onMenuOpen?: (e: React.MouseEvent<HTMLElement>) => void;
}

export default function BeneficiaryCard({ name, initials, email, phone, bank, account, gradient, onMenuOpen }: BeneficiaryCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: "14px",
        height: "100%",
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3.25 }}>
        {/* Avatar + Menu */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              background: gradient,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "-0.4492px",
            }}
          >
            {initials}
          </Avatar>
          <IconButton
            size="small"
            sx={{ width: 36, height: 36, borderRadius: "10px" }}
            onClick={onMenuOpen}
          >
            <MoreVertIcon sx={{ fontSize: 20, color: "grey.700" }} />
          </IconButton>
        </Box>

        {/* Name */}
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: "text.primary", lineHeight: "28px", letterSpacing: "-0.4395px" }}>
          {name}
        </Typography>

        {/* Details */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EmailIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: "20px", letterSpacing: "-0.1504px" }}>
              {email}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PhoneIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: "20px", letterSpacing: "-0.1504px" }}>
              {phone}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccountBalanceIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: "20px", letterSpacing: "-0.1504px" }}>
              {bank}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: "20px", letterSpacing: "-0.1504px" }}>
            <Box component="span" sx={{ fontWeight: 500 }}>Account:</Box> {account}
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
          <Button
            variant="contained"
            fullWidth
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              height: 32,
              fontSize: 14,
              fontWeight: 500,
              lineHeight: "20px",
              letterSpacing: "-0.1504px",
            }}
          >
            Send Money
          </Button>
          <Button
            variant="outlined"
            fullWidth
            sx={{
              color: "text.primary",
              borderColor: "divider",
              textTransform: "none",
              borderRadius: "8px",
              height: 32,
              fontSize: 14,
              fontWeight: 500,
              lineHeight: "20px",
              letterSpacing: "-0.1504px",
              "&:hover": {
                borderColor: "grey.300",
                bgcolor: "grey.0",
              },
            }}
          >
            Request Money
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
