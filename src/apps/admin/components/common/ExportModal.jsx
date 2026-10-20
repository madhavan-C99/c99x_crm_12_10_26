import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";

const ACCENT_GREEN = "#84CC16";
const FONT = "'Inter', sans-serif";

const getColKey = (col) => {
  if (typeof col === "object" && col !== null) {
    return col.backendKey || col.id || col.field || col.key || col.label;
  }
  return String(col);
};

const getColLabel = (col) => {
  if (typeof col === "object" && col !== null) {
    return col.label || col.headerName || col.name || getColKey(col);
  }
  return String(col);
};

export default function ExportModal({
  open,
  onClose,
  reportName = "Report",
  columns = [],
  availableFormats = ["xlsx", "csv", "pdf"],
  onDownload,
  isSubmitting = false,
}) {
  const [viewType, setViewType] = useState("current"); // "current" | "detailed"
  const [fileFormat, setFileFormat] = useState(availableFormats[0] || "xlsx");
  const [selectedMap, setSelectedMap] = useState({});
  const [validationError, setValidationError] = useState("");

  const hasColumns = Array.isArray(columns) && columns.length > 0;

  useEffect(() => {
    if (open) {
      setValidationError("");
      if (availableFormats.length > 0 && !availableFormats.includes(fileFormat)) {
        setFileFormat(availableFormats[0]);
      }
      if (hasColumns) {
        const initialMap = {};
        columns.forEach((col) => {
          initialMap[getColKey(col)] = true;
        });
        setSelectedMap(initialMap);
      }
    }
  }, [open, columns, availableFormats]);

  const allSelected =
    hasColumns && columns.every((col) => selectedMap[getColKey(col)]);

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    const nextMap = {};
    columns.forEach((col) => {
      nextMap[getColKey(col)] = isChecked;
    });
    setSelectedMap(nextMap);
  };

  const handleToggleColumn = (key) => {
    setSelectedMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDownloadClick = () => {
    if (hasColumns && !viewType) {
      setValidationError("Please select a view type (Current or Detailed).");
      return;
    }
    if (!fileFormat) {
      setValidationError("Please select a file format.");
      return;
    }

    const selectedCols =
      viewType === "detailed" && hasColumns
        ? columns.filter((col) => selectedMap[getColKey(col)])
        : [...columns];

    const selectedKeys =
      viewType === "detailed" && hasColumns
        ? columns
            .filter((col) => selectedMap[getColKey(col)])
            .map((col) => getColKey(col))
        : columns.map((col) => getColKey(col));

    if (viewType === "detailed" && hasColumns && selectedKeys.length === 0) {
      setValidationError("Please select at least one column to download.");
      return;
    }

    setValidationError("");
    if (onDownload) {
      onDownload({
        viewType,
        fileFormat,
        selectedColumns: selectedCols,
        selectedKeys,
      });
    }
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          p: 1.5,
          fontFamily: FONT,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: "20px",
            fontWeight: 700,
            color: ACCENT_GREEN,
            fontFamily: FONT,
          }}
        >
          {reportName ? `Download ${reportName}` : "Download Report"}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "#9CA3AF" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          py: 1,
        }}
      >
        {/* VIEW TYPE SECTION (ONLY IF COLUMNS EXIST) */}
        {hasColumns && (
          <Box>
            <Typography
              sx={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#374151",
                mb: 1.2,
                fontFamily: FONT,
              }}
            >
              View Type *
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.5,
              }}
            >
              {/* Current View Card */}
              <Box
                onClick={() => setViewType("current")}
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  border:
                    viewType === "current"
                      ? `2px solid ${ACCENT_GREEN}`
                      : "1px solid #E2E8F0",
                  backgroundColor: viewType === "current" ? "#F7FEE7" : "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: ACCENT_GREEN,
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8 }}>
                  <GridViewIcon
                    sx={{
                      fontSize: 20,
                      color: viewType === "current" ? ACCENT_GREEN : "#64748B",
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: "14.5px",
                      fontWeight: 600,
                      color: viewType === "current" ? ACCENT_GREEN : "#0F172A",
                      fontFamily: FONT,
                    }}
                  >
                    Current View
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#64748B",
                    fontFamily: FONT,
                    lineHeight: 1.4,
                  }}
                >
                  Export all default visible columns on your screen.
                </Typography>
              </Box>

              {/* Detailed View Card */}
              <Box
                onClick={() => setViewType("detailed")}
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  border:
                    viewType === "detailed"
                      ? `2px solid ${ACCENT_GREEN}`
                      : "1px solid #E2E8F0",
                  backgroundColor: viewType === "detailed" ? "#F7FEE7" : "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: ACCENT_GREEN,
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8 }}>
                  <ViewColumnIcon
                    sx={{
                      fontSize: 20,
                      color: viewType === "detailed" ? ACCENT_GREEN : "#64748B",
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: "14.5px",
                      fontWeight: 600,
                      color: viewType === "detailed" ? ACCENT_GREEN : "#0F172A",
                      fontFamily: FONT,
                    }}
                  >
                    Detailed View
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#64748B",
                    fontFamily: FONT,
                    lineHeight: 1.4,
                  }}
                >
                  Export selected columns with customized options.
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* CHOOSE COLUMNS SECTION (ONLY FOR DETAILED VIEW) */}
        {hasColumns && viewType === "detailed" && (
          <Box>
            <Typography
              sx={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#374151",
                mb: 1.2,
                fontFamily: FONT,
              }}
            >
              Choose what you want to download *
            </Typography>

            <Box
              sx={{
                maxHeight: "180px",
                overflowY: "auto",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                backgroundColor: "#FFFFFF",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(allSelected)}
                    onChange={handleSelectAll}
                    sx={{
                      color: "#94A3B8",
                      "&.Mui-checked": { color: ACCENT_GREEN },
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: ACCENT_GREEN,
                      fontFamily: FONT,
                    }}
                  >
                    Select All
                  </Typography>
                }
              />

              {columns.map((col) => {
                const key = getColKey(col);
                const label = getColLabel(col);
                const checked = Boolean(selectedMap[key]);
                return (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={() => handleToggleColumn(key)}
                        sx={{
                          color: "#94A3B8",
                          "&.Mui-checked": { color: ACCENT_GREEN },
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontSize: "13.5px",
                          fontWeight: 500,
                          color: checked ? ACCENT_GREEN : "#334155",
                          fontFamily: FONT,
                        }}
                      >
                        {label}
                      </Typography>
                    }
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* FILE FORMAT SECTION */}
        {availableFormats.length > 0 && (
          <Box>
            <Typography
              sx={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#374151",
                mb: 1.2,
                fontFamily: FONT,
              }}
            >
              File Format *
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(availableFormats.length, 3)}, 1fr)`,
                gap: 1.5,
              }}
            >
              {availableFormats.includes("xlsx") && (
                <Button
                  variant="outlined"
                  onClick={() => setFileFormat("xlsx")}
                  sx={{
                    py: 1.2,
                    borderRadius: "10px",
                    textTransform: "none",
                    fontFamily: FONT,
                    fontWeight: 600,
                    fontSize: "14px",
                    borderColor: fileFormat === "xlsx" ? ACCENT_GREEN : "#E2E8F0",
                    backgroundColor: fileFormat === "xlsx" ? ACCENT_GREEN : "#FFFFFF",
                    color: fileFormat === "xlsx" ? "#FFFFFF" : "#334155",
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: fileFormat === "xlsx" ? "#65A30D" : "#F8FAFC",
                      borderColor: ACCENT_GREEN,
                    },
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      px: 0.6,
                      py: 0.2,
                      borderRadius: "4px",
                      backgroundColor: "#16A34A",
                      color: "#FFFFFF",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    XLSX
                  </Box>
                  Excel (.xlsx)
                </Button>
              )}

              {availableFormats.includes("csv") && (
                <Button
                  variant="outlined"
                  onClick={() => setFileFormat("csv")}
                  sx={{
                    py: 1.2,
                    borderRadius: "10px",
                    textTransform: "none",
                    fontFamily: FONT,
                    fontWeight: 600,
                    fontSize: "14px",
                    borderColor: fileFormat === "csv" ? ACCENT_GREEN : "#E2E8F0",
                    backgroundColor: fileFormat === "csv" ? ACCENT_GREEN : "#FFFFFF",
                    color: fileFormat === "csv" ? "#FFFFFF" : "#334155",
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: fileFormat === "csv" ? "#65A30D" : "#F8FAFC",
                      borderColor: ACCENT_GREEN,
                    },
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      px: 0.6,
                      py: 0.2,
                      borderRadius: "4px",
                      backgroundColor: "#0284C7",
                      color: "#FFFFFF",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    CSV
                  </Box>
                  CSV (.csv)
                </Button>
              )}

              {availableFormats.includes("pdf") && (
                <Button
                  variant="outlined"
                  onClick={() => setFileFormat("pdf")}
                  sx={{
                    py: 1.2,
                    borderRadius: "10px",
                    textTransform: "none",
                    fontFamily: FONT,
                    fontWeight: 600,
                    fontSize: "14px",
                    borderColor: fileFormat === "pdf" ? ACCENT_GREEN : "#E2E8F0",
                    backgroundColor: fileFormat === "pdf" ? ACCENT_GREEN : "#FFFFFF",
                    color: fileFormat === "pdf" ? "#FFFFFF" : "#334155",
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: fileFormat === "pdf" ? "#65A30D" : "#F8FAFC",
                      borderColor: ACCENT_GREEN,
                    },
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      px: 0.6,
                      py: 0.2,
                      borderRadius: "4px",
                      backgroundColor: "#DC2626",
                      color: "#FFFFFF",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    PDF
                  </Box>
                  PDF (.pdf)
                </Button>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      {validationError && (
        <Box sx={{ px: 3, pt: 0.5 }}>
          <Typography
            sx={{
              color: "#DC2626",
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: FONT,
            }}
          >
            {validationError}
          </Typography>
        </Box>
      )}

      <DialogActions
        sx={{ justifyContent: "flex-end", gap: 1.5, px: 3, pb: 2, pt: 1 }}
      >
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          variant="outlined"
          sx={{
            borderColor: ACCENT_GREEN,
            color: ACCENT_GREEN,
            textTransform: "none",
            borderRadius: "8px",
            px: 3,
            fontWeight: 600,
            fontSize: "14px",
            "&:hover": { borderColor: "#65A30D", backgroundColor: "#F7FEE7" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDownloadClick}
          disabled={isSubmitting}
          variant="contained"
          startIcon={
            isSubmitting ? (
              <CircularProgress size={16} sx={{ color: "#FFF" }} />
            ) : null
          }
          sx={{
            backgroundColor: ACCENT_GREEN,
            color: "#FFF",
            textTransform: "none",
            borderRadius: "8px",
            px: 3,
            fontWeight: 600,
            fontSize: "14px",
            boxShadow: "none",
            "&:hover": { backgroundColor: "#65A30D" },
            "&.Mui-disabled": {
              backgroundColor: "#A3E635",
              color: "#FFFFFF",
              opacity: 0.7,
            },
          }}
        >
          {isSubmitting ? "Downloading..." : "Download"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
