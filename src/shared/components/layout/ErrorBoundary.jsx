import { Component } from "react";
import { Box, Button, Typography } from "@mui/material";

const isChunkLoadError = (error) => {
  const msg = String(error?.message || error || "");
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
};

/**
 * Catches render errors anywhere below it so the user sees a recovery screen
 * instead of a blank white page. Also covers the "new version deployed, old
 * lazy-loaded chunk no longer exists" case (asks for a reload).
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UI crashed:", error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.assign("/");
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const outdated = isChunkLoadError(error);

    return (
      <Box
        role="alert"
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          p: 3,
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <Typography
          sx={{ fontSize: "22px", fontWeight: 700, color: "#0F172A" }}
        >
          {outdated ? "A new version is available" : "Something went wrong"}
        </Typography>
        <Typography sx={{ fontSize: "14px", color: "#64748B", maxWidth: 420 }}>
          {outdated
            ? "Please reload the page to get the latest version."
            : "An unexpected error occurred. Reload the page, or go back to the home screen. Your data is safe."}
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={this.handleReload}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Reload page
          </Button>
          {!outdated && (
            <Button
              variant="outlined"
              onClick={this.handleHome}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Go to home
            </Button>
          )}
        </Box>
      </Box>
    );
  }
}

export default ErrorBoundary;
