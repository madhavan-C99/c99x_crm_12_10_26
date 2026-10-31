import "@/shared/services/notification";
import { StrictMode } from "react";
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