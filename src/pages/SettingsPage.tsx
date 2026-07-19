import { useState } from "react";
import { Box, Typography, TextField, Button, Card, CardContent, Switch, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import TuneIcon from "@mui/icons-material/Tune";

const languages = ["English", "Spanish", "French", "German", "Hindi"];
const currencies = ["USD - US Dollar", "EUR - Euro", "GBP - British Pound", "INR - Indian Rupee", "JPY - Japanese Yen"];
const timezones = ["UTC-05:00 Eastern Time", "UTC-06:00 Central Time", "UTC-07:00 Mountain Time", "UTC-08:00 Pacific Time", "UTC+00:00 GMT", "UTC+05:30 India"];

interface SectionHeaderProps {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
}

function SectionHeader({ iconBg, icon, title }: SectionHeaderProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
      <Box sx={{ bgcolor: iconBg, borderRadius: "10px", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "inherit" }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: 20, fontWeight: 600, color: "text.primary", lineHeight: "28px", letterSpacing: "-0.4492px" }}>
        {title}
      </Typography>
    </Box>
  );
}

interface FieldRowProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  fullWidth?: boolean;
}

function FieldRow({ label, placeholder, value, onChange, type = "text" }: FieldRowProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#0a0a0a", lineHeight: "14px" }}>{label}</Typography>
      <TextField
        fullWidth
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            bgcolor: "#f3f3f5",
            "& fieldset": { border: "none" },
            "&:hover fieldset": { border: "none" },
            "&.Mui-focused fieldset": { border: "none" },
          },
          "& .MuiInputBase-input": { fontSize: 14, py: "6px", px: "12px" },
        }}
      />
    </Box>
  );
}

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ title, description, checked, onChange }: ToggleRowProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5 }}>
      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 500, color: "text.primary", lineHeight: "24px" }}>{title}</Typography>
        <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: "20px", mt: 0.5 }}>{description}</Typography>
      </Box>
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        sx={{
          width: 40,
          height: 22,
          padding: "2px",
          "& .MuiSwitch-switchBase": { padding: "2px", "&.Mui-checked": { transform: "translateX(18px)" } },
          "& .MuiSwitch-thumb": { width: 18, height: 18 },
          "& .MuiSwitch-track": { borderRadius: 11, opacity: 1 },
        }}
      />
    </Box>
  );
}

export default function SettingsPage() {
  const theme = useTheme();

  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [email, setEmail] = useState("john@example.com");
  const [phone, setPhone] = useState("+1 (555) 123-4567");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const [language, setLanguage] = useState("English");
  const [currency, setCurrency] = useState("USD - US Dollar");
  const [timezone, setTimezone] = useState("UTC-05:00 Eastern Time");

  const cardSx = {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "14px",
    boxShadow: "none",
  };

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Typography sx={{ fontSize: 30, fontWeight: 600, color: "text.primary", lineHeight: "36px" }}>
            Settings
          </Typography>
          <Typography sx={{ fontSize: 16, color: "text.secondary", lineHeight: "24px", mt: 1 }}>
            Manage your account settings and preferences
          </Typography>
        </Grid>

        {/* Profile Settings */}
        <Grid size={{ md: 8, lg: 6 }}>
          <Card variant="outlined" sx={cardSx}>
            <CardContent sx={{ p: "25px !important", display: "flex", flexDirection: "column" }}>
              <SectionHeader iconBg="#dbeafe" icon={<PersonOutlineIcon sx={{ fontSize: 20, color: "#2563eb" }} />} title="Profile Settings" />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box sx={{ display: "flex", gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <FieldRow label="First Name" value={firstName} onChange={setFirstName} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FieldRow label="Last Name" value={lastName} onChange={setLastName} />
                  </Box>
                </Box>
                <FieldRow label="Email" value={email} onChange={setEmail} type="email" />
                <FieldRow label="Phone Number" value={phone} onChange={setPhone} />
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#155dfc",
                    height: 36,
                    borderRadius: "8px",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#1250d6", boxShadow: "none" },
                  }}
                >
                  Save Changes
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid size={{ md: 8, lg: 6 }}>
          <Card variant="outlined" sx={cardSx}>
            <CardContent sx={{ p: "25px !important", display: "flex", flexDirection: "column" }}>
              <SectionHeader iconBg="#f3e8ff" icon={<NotificationsNoneIcon sx={{ fontSize: 20, color: "#9333ea" }} />} title="Notifications" />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <ToggleRow title="Email Notifications" description="Receive email updates about your account" checked={emailNotifications} onChange={setEmailNotifications} />
                <ToggleRow title="Push Notifications" description="Receive push notifications on your device" checked={pushNotifications} onChange={setPushNotifications} />
                <ToggleRow title="Transaction Alerts" description="Get notified about every transaction" checked={transactionAlerts} onChange={setTransactionAlerts} />
                <ToggleRow title="Weekly Summary" description="Receive a weekly summary of your activity" checked={weeklySummary} onChange={setWeeklySummary} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Security */}
        <Grid size={{ md: 8, lg: 6 }}>
          <Card variant="outlined" sx={cardSx}>
            <CardContent sx={{ p: "25px !important", display: "flex", flexDirection: "column" }}>
              <SectionHeader iconBg="#ffe2e2" icon={<ShieldOutlinedIcon sx={{ fontSize: 20, color: "#dc2626" }} />} title="Security" />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <FieldRow label="Current Password" value={currentPassword} onChange={setCurrentPassword} type="password" />
                <FieldRow label="New Password" value={newPassword} onChange={setNewPassword} type="password" />
                <FieldRow label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} type="password" />
                <ToggleRow title="Two-Factor Authentication" description="Add an extra layer of security" checked={twoFactor} onChange={setTwoFactor} />
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#155dfc",
                    height: 36,
                    borderRadius: "8px",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#1250d6", boxShadow: "none" },
                  }}
                >
                  Update Password
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Methods */}
        <Grid size={{ md: 8, lg: 6 }}>
          <Card variant="outlined" sx={cardSx}>
            <CardContent sx={{ p: "25px !important", display: "flex", flexDirection: "column" }}>
              <SectionHeader iconBg="#dcfce7" icon={<CreditCardOutlinedIcon sx={{ fontSize: 20, color: "#16a34a" }} />} title="Payment Methods" />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: `1px solid rgba(0,0,0,0.1)`,
                    borderRadius: "10px",
                    px: "17px",
                    py: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        background: "linear-gradient(90deg, #155dfc 0%, #9810fa 100%)",
                        borderRadius: "4px",
                        width: 48,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>VISA</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 16, fontWeight: 500, color: "text.primary", lineHeight: "24px" }}>
                        &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4242
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: "20px" }}>
                        Expires 12/27
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    sx={{
                      height: 32,
                      minWidth: 78,
                      borderRadius: "8px",
                      fontSize: 14,
                      fontWeight: 500,
                      textTransform: "none",
                      color: "#0a0a0a",
                      borderColor: "rgba(0,0,0,0.1)",
                      "&:hover": { borderColor: "rgba(0,0,0,0.2)", bgcolor: "grey.50" },
                    }}
                  >
                    Remove
                  </Button>
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    height: 36,
                    borderRadius: "8px",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    color: "#0a0a0a",
                    borderColor: "rgba(0,0,0,0.1)",
                    "&:hover": { borderColor: "rgba(0,0,0,0.2)", bgcolor: "grey.50" },
                  }}
                >
                  Add Payment Method
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Preferences */}
        <Grid size={{ md: 8, lg: 6 }}>
          <Card variant="outlined" sx={cardSx}>
            <CardContent sx={{ p: "25px !important", display: "flex", flexDirection: "column" }}>
              <SectionHeader iconBg="#ffedd4" icon={<TuneIcon sx={{ fontSize: 20, color: "#ea580c" }} />} title="Preferences" />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#0a0a0a", lineHeight: "14px" }}>Language</Typography>
                  <TextField
                    select
                    fullWidth
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    slotProps={{ select: { native: true } }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        "& fieldset": { borderColor: "#d1d5dc" },
                      },
                      "& .MuiInputBase-input": { fontSize: 14, py: "8px", px: "12px" },
                    }}
                  >
                    {languages.map((l) => <option key={l} value={l}>{l}</option>)}
                  </TextField>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#0a0a0a", lineHeight: "14px" }}>Currency</Typography>
                  <TextField
                    select
                    fullWidth
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    slotProps={{ select: { native: true } }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        "& fieldset": { borderColor: "#d1d5dc" },
                      },
                      "& .MuiInputBase-input": { fontSize: 14, py: "8px", px: "12px" },
                    }}
                  >
                    {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                  </TextField>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#0a0a0a", lineHeight: "14px" }}>Timezone</Typography>
                  <TextField
                    select
                    fullWidth
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    slotProps={{ select: { native: true } }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        "& fieldset": { borderColor: "#d1d5dc" },
                      },
                      "& .MuiInputBase-input": { fontSize: 14, py: "8px", px: "12px" },
                    }}
                  >
                    {timezones.map((t) => <option key={t} value={t}>{t}</option>)}
                  </TextField>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
