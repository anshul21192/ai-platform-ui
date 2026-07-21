import { useReducer, useState } from "react";
import { Box, Typography, TextField, Button, Card, CardContent, Switch, Alert, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import { trackEvent } from "../utils/eventLogger";

const languages = ["English", "Spanish", "French", "German", "Hindi"];
const currencies = ["USD - US Dollar", "EUR - Euro", "GBP - British Pound", "INR - Indian Rupee", "JPY - Japanese Yen"];
const timezones = ["UTC-05:00 Eastern Time", "UTC-06:00 Central Time", "UTC-07:00 Mountain Time", "UTC-08:00 Pacific Time", "UTC+00:00 GMT", "UTC+05:30 India"];

interface SettingsState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  transactionAlerts: boolean;
  weeklySummary: boolean;
  twoFactor: boolean;
  language: string;
  currency: string;
  timezone: string;
}

type SettingsAction =
  | { type: "SET_FIELD"; field: keyof SettingsState; value: string | boolean };

const initialState: SettingsState = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "+1 (555) 123-4567",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  emailNotifications: true,
  pushNotifications: true,
  transactionAlerts: true,
  weeklySummary: true,
  twoFactor: false,
  language: "English",
  currency: "USD - US Dollar",
  timezone: "UTC-05:00 Eastern Time",
};

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
  }
}

interface SectionHeaderProps {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
}

function SectionHeader({ iconBg, icon, title }: SectionHeaderProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
      <Box sx={{ bgcolor: iconBg, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "inherit" }}>
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
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography component="label" htmlFor={fieldId} sx={{ fontSize: 14, fontWeight: 500, color: "text.primary", lineHeight: "14px" }}>{label}</Typography>
      <TextField
        fullWidth
        id={fieldId}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          "& .MuiOutlinedInput-root": {
            bgcolor: "grey.50",
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
  const toggleId = `toggle-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5 }}>
      <Box>
        <Typography id={`${toggleId}-label`} sx={{ fontSize: 16, fontWeight: 500, color: "text.primary", lineHeight: "24px" }}>{title}</Typography>
        <Typography id={`${toggleId}-description`} sx={{ fontSize: 14, color: "text.secondary", lineHeight: "20px", mt: 0.5 }}>{description}</Typography>
      </Box>
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        inputProps={{ "aria-labelledby": `${toggleId}-label`, "aria-describedby": `${toggleId}-description` }}
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
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const set = (field: keyof SettingsState) => (value: string | boolean) =>
    dispatch({ type: "SET_FIELD", field, value });

  const handleSaveProfile = () => {
    trackEvent("UPDATE_PROFILE", { email: state.email, phone: state.phone, firstName: state.firstName, lastName: state.lastName });
    setSaveMessage("Profile saved successfully.");
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleUpdatePassword = () => {
    trackEvent("CHANGE_PASSWORD", { hasNewPassword: Boolean(state.newPassword) });
    setSaveMessage("Password updated successfully.");
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const cardSx = {
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "none",
  };

  return (
    <Box sx={{ p: 4 }}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Typography component="h1" sx={{ fontSize: 30, fontWeight: 600, color: "text.primary", lineHeight: "36px" }}>
            Settings
          </Typography>
          <Typography sx={{ fontSize: 16, color: "text.secondary", lineHeight: "24px", mt: 1 }}>
            Manage your account settings and preferences
          </Typography>
          {saveMessage && <Alert severity="success" sx={{ mt: 2 }}>{saveMessage}</Alert>}
        </Grid>

        {/* Profile Settings */}
        <Grid size={{ md: 8, lg: 6 }}>
          <Card variant="outlined" sx={cardSx}>
            <CardContent sx={{ p: "25px !important", display: "flex", flexDirection: "column" }}>
              <SectionHeader iconBg="primary.light" icon={<PersonOutlineIcon sx={{ fontSize: 20, color: "primary.main" }} />} title="Profile Settings" />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box sx={{ display: "flex", gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <FieldRow label="First Name" value={state.firstName} onChange={set("firstName")} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FieldRow label="Last Name" value={state.lastName} onChange={set("lastName")} />
                  </Box>
                </Box>
                <FieldRow label="Email" value={state.email} onChange={set("email")} type="email" />
                <FieldRow label="Phone Number" value={state.phone} onChange={set("phone")} />
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                    sx={{
                      height: 36,
                      fontSize: 14,
                      fontWeight: 500,
                      textTransform: "none",
                      boxShadow: "none",
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
              <SectionHeader iconBg="secondary.light" icon={<NotificationsNoneIcon sx={{ fontSize: 20, color: "secondary.main" }} />} title="Notifications" />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <ToggleRow title="Email Notifications" description="Receive email updates about your account" checked={state.emailNotifications} onChange={set("emailNotifications")} />
                <ToggleRow title="Push Notifications" description="Receive push notifications on your device" checked={state.pushNotifications} onChange={set("pushNotifications")} />
                <ToggleRow title="Transaction Alerts" description="Get notified about every transaction" checked={state.transactionAlerts} onChange={(val) => { set("transactionAlerts")(val); trackEvent("TOGGLE_TRANSACTION_ALERTS", { enabled: val }); }} />
                <ToggleRow title="Weekly Summary" description="Receive a weekly summary of your activity" checked={state.weeklySummary} onChange={set("weeklySummary")} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Security */}
        <Grid size={{ md: 8, lg: 6 }}>
          <Card variant="outlined" sx={cardSx}>
            <CardContent sx={{ p: "25px !important", display: "flex", flexDirection: "column" }}>
              <SectionHeader iconBg="error.light" icon={<ShieldOutlinedIcon sx={{ fontSize: 20, color: "error.main" }} />} title="Security" />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <FieldRow label="Current Password" value={state.currentPassword} onChange={set("currentPassword")} type="password" />
                <FieldRow label="New Password" value={state.newPassword} onChange={set("newPassword")} type="password" />
                <FieldRow label="Confirm New Password" value={state.confirmPassword} onChange={set("confirmPassword")} type="password" />
                <ToggleRow title="Two-Factor Authentication" description="Add an extra layer of security" checked={state.twoFactor} onChange={set("twoFactor")} />
                <Button
                  variant="contained"
                  onClick={handleUpdatePassword}
                    sx={{
                      height: 36,
                      fontSize: 14,
                      fontWeight: 500,
                      textTransform: "none",
                      boxShadow: "none",
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
              <SectionHeader iconBg="success.light" icon={<CreditCardOutlinedIcon sx={{ fontSize: 20, color: "success.main" }} />} title="Payment Methods" />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: `1px solid`, borderColor: "divider",
                    px: "17px",
                    py: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        background: "linear-gradient(90deg, #155dfc 0%, #9810fa 100%)",
                        width: 48,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "common.white" }}>VISA</Typography>
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
                      fontSize: 14,
                      fontWeight: 500,
                      textTransform: "none",
                      color: "text.primary",
                      borderColor: "divider",
                      "&:hover": { borderColor: "grey.300", bgcolor: "grey.50" },
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
                      fontSize: 14,
                      fontWeight: 500,
                      textTransform: "none",
                      color: "text.primary",
                      borderColor: "divider",
                      "&:hover": { borderColor: "grey.300", bgcolor: "grey.50" },
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
              <SectionHeader iconBg="warning.light" icon={<TuneIcon sx={{ fontSize: 20, color: "warning.dark" }} />} title="Preferences" />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary", lineHeight: "14px" }}>Language</Typography>
                  <TextField
                    select
                    fullWidth
                    value={state.language}
                    onChange={(e) => set("language")(e.target.value)}
                    slotProps={{ select: { native: true } }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "grey.300" },
                      },
                      "& .MuiInputBase-input": { fontSize: 14, py: "8px", px: "12px" },
                    }}
                  >
                    {languages.map((l) => <option key={l} value={l}>{l}</option>)}
                  </TextField>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary", lineHeight: "14px" }}>Currency</Typography>
                  <TextField
                    select
                    fullWidth
                    value={state.currency}
                    onChange={(e) => set("currency")(e.target.value)}
                    slotProps={{ select: { native: true } }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "grey.300" },
                      },
                      "& .MuiInputBase-input": { fontSize: 14, py: "8px", px: "12px" },
                    }}
                  >
                    {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                  </TextField>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary", lineHeight: "14px" }}>Timezone</Typography>
                  <TextField
                    select
                    fullWidth
                    value={state.timezone}
                    onChange={(e) => set("timezone")(e.target.value)}
                    slotProps={{ select: { native: true } }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "grey.300" },
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
