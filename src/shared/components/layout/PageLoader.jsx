import { Box, CircularProgress } from "@mui/material";

/** Suspense fallback shown while a lazy page chunk is downloading. */
export default function PageLoader() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "40vh",
      }}
    >
      <CircularProgress size={32} />
    </Box>
  );
}
