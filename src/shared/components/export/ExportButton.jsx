import { Button } from "@mui/material";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import useExport from "@/shared/hooks/useExport";
import ExportDialogs from "./ExportDialogs";

/**
 * Self-contained "Export" button: column picker dialog, download and toast messages.
 * Accepts the same options as useExport().
 */
export default function ExportButton(exportOptions) {
  const exporter = useExport(exportOptions);

  return (
    <>
      <Button
        startIcon={<CalendarMonth />}
        variant="outlined"
        onClick={exporter.openDialog}
        disabled={exporter.isExporting}
        sx={{
          borderColor: "#A4CE3C",
          color: "#111",
          textTransform: "none",
          borderRadius: "6px",
          width: { xs: "100%", sm: "104px" },
          height: "31px",
          backgroundColor: "#E9F6D4",
          "&:hover": { backgroundColor: "#DDF0BE", borderColor: "#A4CE3C" },
        }}
      >
        {exporter.isExporting ? "Exporting..." : "Export"}
      </Button>

      <ExportDialogs exporter={exporter} />
    </>
  );
}
