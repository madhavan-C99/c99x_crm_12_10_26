import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from "@mui/material";

const LIME = "#84CC16";
const LIME_DARK = "#65A30D";
const LIME_LIGHT = "#F7FEE7";
const SLATE = "#475569";
const FONT = "'Inter', sans-serif";

export default function DownloadStartedDialog({ open, onClose, onView }) {
  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": {
          width: 380,
          maxWidth: "calc(100% - 32px)",
          m: 2,
          borderRadius: "20px",
          p: { xs: 2, sm: 2.5 },
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <DialogTitle sx={{ px: 1, pt: 1, pb: 1.5 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: "22px",
            color: LIME,
            fontFamily: FONT,
            letterSpacing: "-0.01em",
          }}
        >
          Download Started
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 1, py: 0.5 }}>
        <Typography
          sx={{
            fontSize: "15px",
            color: SLATE,
            fontFamily: FONT,
            lineHeight: 1.6,
          }}
        >
          If your download has not already started, click on the view button to
          check the status of your download.
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{ px: 1, pt: 3, pb: 0.5, gap: 1.5, justifyContent: "flex-end" }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: "8px",
            border: `1.5px solid ${LIME}`,
            color: LIME,
            backgroundColor: "#FFFFFF",
            textTransform: "none",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: "15px",
            px: 4,
            py: 0.8,
            boxShadow: "none",
            "&:hover": {
              border: `1.5px solid ${LIME}`,
              backgroundColor: LIME_LIGHT,
              boxShadow: "none",
            },
          }}
        >
          Ok
        </Button>

        <Button
          onClick={onView}
          variant="contained"
          sx={{
            borderRadius: "8px",
            backgroundColor: LIME,
            color: "#FFFFFF",
            textTransform: "none",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: "15px",
            px: 4,
            py: 0.8,
            boxShadow: "none",
            "&:hover": {
              backgroundColor: LIME_DARK,
              boxShadow: "none",
            },
          }}
        >
          View
        </Button>
      </DialogActions>
    </Dialog>
  );
}
