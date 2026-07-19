import { useState } from "react";
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
  Link,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonIcon from '@mui/icons-material/Person';
import Add from '@mui/icons-material/Add';
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SavingsIcon from '@mui/icons-material/Savings';
import LanguageIcon from "@mui/icons-material/Language";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false);

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
          <SavingsIcon />
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
          <Link
            href="#"
            sx={{
              color: "text.primary",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              lineHeight: "20px",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Register
          </Link>
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
          <Box component="form" noValidate autoComplete="off">
            {/* Email */}
            <TextField
              fullWidth
              label="Username"
              placeholder="Ex: z@financial.com"
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
              <Link
                href="#"
                sx={{
                  color: "text.primary",
                  fontSize: 14,
                  textDecoration: "none",
                  fontWeight: 400,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Forgot Password?
              </Link>
            </Box>

            {/* Sign In Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={onLogin}
              sx={{
                height: 48,
                // bgcolor: "grey.800",
                textTransform: "none",
                fontSize: 16,
                fontWeight: 500,
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}
            >
              Sign In
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
          ©2024 Financial Dashboard
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
          <LanguageIcon sx={{ fontSize: 14 }} />
          <Typography variant="body2" sx={{ fontSize: 14 }}>ENG</Typography>
        </Box>
      </Box>
    </Box>
  );
}
