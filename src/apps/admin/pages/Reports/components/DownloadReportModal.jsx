import React, { useState } from "react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";

const ACCENT_GREEN = "#84CC16";
const FONT = "Inter, sans-serif";

export default function DownloadReportModal({
  open,
  onClose,
  reportName = "Report",
  columns = [],
  onDownload,
}) {
  const [viewType, setViewType] = useState("current"); // "current" | "detailed"
  const [fileFormat, setFileFormat] = useState("xlsx"); // "xlsx" | "csv" | "pdf"
  const [selectedColumns, setSelectedColumns] = useState(columns);

  // Sync selected columns when columns prop changes
  React.useEffect(() => {
    if (columns && columns.length > 0) {
      setSelectedColumns(columns);
    }
  }, [columns]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedColumns([...columns]);
    } else {
      setSelectedColumns([]);
    }
  };

  const handleToggleColumn = (col) => {
    if (selectedColumns.includes(col)) {
      setSelectedColumns(selectedColumns.filter((c) => c !== col));
    } else {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload({
        viewType,
        fileFormat,
        selectedColumns: viewType === "detailed" ? selectedColumns : columns,
      });
    }
    onClose();
  };

  const isAllSelected = columns.length > 0 && selectedColumns.length === columns.length;

  return (
    <Dialog
      open={open}
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
          Download Report
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
        {/* VIEW TYPE SECTION */}
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
                Export only the visible columns on your screen.
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
                Export all columns, with customizable options for flexibility.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* CHOOSE COLUMNS SECTION (ONLY FOR DETAILED VIEW) */}
        {viewType === "detailed" && (
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
                maxHeight: "160px",
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
                    checked={isAllSelected}
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
                const checked = selectedColumns.includes(col);
                return (
                  <FormControlLabel
                    key={col}
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={() => handleToggleColumn(col)}
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
                        {col}
                      </Typography>
                    }
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* FILE FORMAT SECTION */}
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
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1.5,
            }}
          >
            {/* XLSX Format Button */}
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
              XLSX
            </Button>

            {/* CSV Format Button */}
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
              CSV
            </Button>

            {/* PDF Format Button */}
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
              PDF
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ justifyContent: "flex-end", gap: 1.5, px: 3, pb: 2, pt: 1 }}
      >
        <Button
          onClick={onClose}
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
          variant="contained"
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
          }}
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
}
