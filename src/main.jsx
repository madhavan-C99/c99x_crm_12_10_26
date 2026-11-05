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
        "@keyframes muiMenuIgnoreInitialClick": {
          "0%": { pointerEvents: "none !important" },
          "99%": { pointerEvents: "none !important" },
          "100%": { pointerEvents: "auto !important" },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        MenuProps: {
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "left",
          },
          transformOrigin: {
            vertical: "top",
            horizontal: "left",
          },
          autoFocus: false,
          disableAutoFocusItem: true,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        slotProps: {
          select: {
            MenuProps: {
              anchorOrigin: {
                vertical: "bottom",
                horizontal: "left",
              },
              transformOrigin: {
                vertical: "top",
                horizontal: "left",
              },
              autoFocus: false,
              disableAutoFocusItem: true,
            },
          },
        },
        SelectProps: {
          MenuProps: {
            anchorOrigin: {
              vertical: "bottom",
              horizontal: "left",
            },
            transformOrigin: {
              vertical: "top",
              horizontal: "left",
            },
            autoFocus: false,
            disableAutoFocusItem: true,
          },
        },
      },
    },
    MuiMenu: {
      defaultProps: {
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "left",
        },
        transformOrigin: {
          vertical: "top",
          horizontal: "left",
        },
        autoFocus: false,
        disableAutoFocusItem: true,
      },
      styleOverrides: {
        paper: {
          animation: "muiMenuIgnoreInitialClick 0.22s step-end forwards",
        },
        list: {
          animation: "muiMenuIgnoreInitialClick 0.22s step-end forwards",
          maxHeight: "300px !important",
          overflowY: "auto !important",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#94A3B8", borderRadius: "4px" },
          "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#64748B" },
        },
      },
    },
    MuiMenuItem: {
      defaultProps: {
        autoFocus: false,
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