import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: { fontSize: 48, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.48px" },
    h2: { fontSize: 40, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.4px" },
    h3: { fontSize: 32, fontWeight: 600, lineHeight: 1.4, letterSpacing: "-0.32px" },
    h4: { fontSize: 24, fontWeight: 600, lineHeight: 1.5, letterSpacing: "-0.24px" },
    h5: { fontSize: 20, fontWeight: 600, lineHeight: 1.4, letterSpacing: "-0.2px" },
    h6: { fontSize: 18, fontWeight: 600, lineHeight: 1.4, letterSpacing: "-0.18px" },
    body1: { fontSize: 18, fontWeight: 400, lineHeight: 1.55 },
    body2: { fontSize: 16, fontWeight: 400, lineHeight: 1.6 },
    subtitle1: { fontSize: 16, fontWeight: 600, lineHeight: 1.6 },
    subtitle2: { fontSize: 14, fontWeight: 600, lineHeight: 1.55 },
    caption: { fontSize: 14, fontWeight: 400, lineHeight: 1.55 },
    overline: { fontSize: 12, fontWeight: 600, lineHeight: 1.55 },
    button: { fontSize: 14, fontWeight: 500, lineHeight: 1.55, letterSpacing: "-0.14px" },
  },
  palette: {
    primary: {
      light: "#D3C4FC",
      main: "#6B39F4",
    },
    secondary: {
      light: "#CCE0FF",
      main: "#0062FF",
    },
    success: {
      light: "#D1FADF",
      main: "#12B76A",
      dark: "#039855",
    },
    error: {
      light: "#FECDCA",
      main: "#F04438",
      dark: "#B42318",
    },
    warning: {
      light: "#FEF0C7",
      main: "#F79009",
      dark: "#DC6803",
    },
    grey: {
      50: "#F8F9FB",
      100: "#ECEFF3",
      200: "#DFE1E6",
      300: "#C1C7CF",
      400: "#A4ABB8",
      500: "#808897",
      600: "#666D80",
      700: "#353849",
      800: "#272835",
      900: "#1A1B25",
    },
    background: {
      default: "#F8F9FB",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0D0D12",
      secondary: "#666D80",
    },
    divider: "#DFE1E6",
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none" as const,
        },
      },
    },
  },
});

export default theme;
