import { Alert, Snackbar } from "@mui/material";
import ExportColumnsModal from "./ExportColumnsModal";
import ActionFeedbackModal from "@/apps/telecalling/components/common/ActionFeedbackModal";

/** Column-picker modal + unified center feedback modal, driven by the useExport() result. */
export default function ExportDialogs({ exporter }) {
  const {
    dialogOpen,
    columnList,
    notice,
    clearNotice,
    closeDialog,
    runExport,
  } = exporter;

  const isSuccessNotice = notice?.severity === "success";

  return (
    <>
      <ExportColumnsModal
        open={dialogOpen}
        onClose={closeDialog}
        columns={columnList}
        onExport={runExport}
      />

      {/* Center Action Feedback Modal for Download/Export */}
      <ActionFeedbackModal
        open={Boolean(notice && isSuccessNotice)}
        type="download"
        title="Export Completed!"
        message={notice?.message || "Your export file has been generated and downloaded."}
        buttonText="Done"
        onClose={clearNotice}
      />

      {/* Fallback Snackbar for Error/Info notices */}
      <Snackbar
        open={Boolean(notice && !isSuccessNotice)}
        autoHideDuration={4000}
        onClose={clearNotice}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {notice && !isSuccessNotice ? (
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
