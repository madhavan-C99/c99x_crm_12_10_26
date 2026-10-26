import { Alert, Snackbar } from "@mui/material";
import ExportColumnsModal from "./ExportColumnsModal";

/** Column-picker modal + toast message, driven by the useExport() result. */
export default function ExportDialogs({ exporter }) {
  const {
    dialogOpen,
    columnList,
    notice,
    clearNotice,
    closeDialog,
    runExport,
  } = exporter;

  return (
    <>
      <ExportColumnsModal
        open={dialogOpen}
        onClose={closeDialog}
        columns={columnList}
        onExport={runExport}
      />

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        onClose={clearNotice}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {notice ? (
          <Alert
            onClose={clearNotice}
            severity={notice.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {notice.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
