import { createTheme } from "@mui/material";

export const LIME = "#84D700";
export const LIME_SOFT = "#EEF9D8";
export const LIME_DARK = "#3F7A00";
export const INK = "#16181D";
export const MUTED = "#6B7280";
export const LINE = "#E8EAED";

export const theme = createTheme({
  palette: {
    primary: { main: LIME, contrastText: INK },
    error: { main: "#E5383B" },
    background: { default: "#F4F5F7" },
    text: { primary: INK, secondary: MUTED },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-checked": { color: "#fff" },
          "&.Mui-checked + .MuiSwitch-track": { backgroundColor: LIME, opacity: 1 },
        },
      },
    },
    MuiCheckbox: { styleOverrides: { root: { "&.Mui-checked": { color: LIME } } } },
  },
});
