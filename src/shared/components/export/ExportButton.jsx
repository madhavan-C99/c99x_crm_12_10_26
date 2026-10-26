import { Button } from "@mui/material";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import useExport from "@/shared/hooks/useExport";
import ExportDialogs from "./ExportDialog";
import { useAuth } from "@/shared/context/AuthContext";

/**
 * Self-contained "Export" button: column picker modal, API call, download and toast.
 * Accepts the same options as useExport().
 * Role-gated: Hides completely if role has no export permissions.
 */
export default function ExportButton(exportOptions) {
  const { hasPermission } = useAuth();
  const exporter = useExport(exportOptions);

  const canExport =
    hasPermission("api_export_all_leads_admin") ||
    hasPermission("api_dynamic_export_excel") ||
    hasPermission("feat_lead_export") ||
    hasPermission("api_export_data_api") ||
    hasPermission("api_export_pending_payments_admin") ||
    hasPermission("api_export_performance_overview_admin");

  if (!canExport) {
    return null;
  }

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
          width: { xs: "auto", sm: "104px" },
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
