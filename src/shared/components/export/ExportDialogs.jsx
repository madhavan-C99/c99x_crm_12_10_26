import { Alert, Snackbar } from "@mui/material";
import ExportDialog from "./ExportDialog";

/** Column-picker dialog + success/error toast, driven by the useExport() result. */
export default function ExportDialogs({ exporter }) {
  const {
    dialogOpen,
    columnList,
    selectedColumns,
    notice,
    clearNotice,
    closeDialog,
    toggleColumn,
    selectAll,
    clearAll,
    runExport,
  } = exporter;

  return (
    <>
      <ExportDialog
        open={dialogOpen}
        onClose={closeDialog}
        columnList={columnList}
        selectedColumns={selectedColumns}
        handleColumnChange={toggleColumn}
        handleExport={runExport}
        handleSelectAll={selectAll}
        handleClearAll={clearAll}
      />

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        onClose={clearNotice}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {notice ? (
          <Alert onClose={clearNotice} severity={notice.severity} variant="filled" sx={{ width: "100%" }}>
            {notice.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
