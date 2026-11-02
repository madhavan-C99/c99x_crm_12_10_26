import "@/shared/services/notification";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import {AuthProvider} from "@/shared/context/AuthContext";

import App from "./App.jsx";

// 100% MUI Only Theme Configuration
const theme = createTheme({
  palette: {
    background: {
      default: "#F1F1F1",
    },
  },
  typography: {
    fontFamily: "'Inter'",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: "'Inter'",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        list: {
          maxHeight: "300px !important",
          overflowY: "auto !important",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#94A3B8", borderRadius: "4px" },
          "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#64748B" },
        },
      },
    },
  },
});

createRoot(document.getElementById("root")).render(
  
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
);