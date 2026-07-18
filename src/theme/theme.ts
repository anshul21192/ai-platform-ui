import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  palette: {
    background: {
      default: "#f6f8fa",
    },
    text: {
      primary: "#1a1a1a",
      secondary: "#6b7280",
    },
  },
  shape: {
    borderRadius: 8,
  },
});

export default theme;
