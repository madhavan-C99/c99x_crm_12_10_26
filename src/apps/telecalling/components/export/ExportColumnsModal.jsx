import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  IconButton,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

const ACCENT = "#90D916";

const ExportColumnsModal = ({
  open,
  onClose,
  columns = [],
  onExport,
  title = "Select Columns to Export",
}) => {
  const [selectedMap, setSelectedMap] = useState({});

  useEffect(() => {
    if (open) {
      const initialMap = {};
      columns.forEach((col) => {
        const key = col.id || col.key || col.label;
        initialMap[key] = col.defaultChecked !== false;
      });
      setSelectedMap(initialMap);
    }
  }, [open, columns]);

  const allSelected =
    columns.length > 0 &&
    columns.every((col) => selectedMap[col.id || col.key || col.label]);
  const isIndeterminate =
    columns.some((col) => selectedMap[col.id || col.key || col.label]) &&
    !allSelected;

  const handleToggleAll = () => {
    const nextState = !allSelected;
    const nextMap = {};
    columns.forEach((col) => {
      const key = col.id || col.key || col.label;
      nextMap[key] = nextState;
    });
    setSelectedMap(nextMap);
  };

  const handleToggleCol = (key) => {
    setSelectedMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleConfirmExport = () => {
    const selectedKeys = columns
      .filter((col) => selectedMap[col.id || col.key || col.label])
      .map((col) => col.id || col.key || col.label);

    if (selectedKeys.length === 0) {
      onExport?.([]); // the export hook shows "select at least one column"
      return;
    }

    if (onExport) {
      onExport(selectedKeys);
    }
    onClose();
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "6px",
          width: "480px",
          maxWidth: "92vw",
          opacity: 1,
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          pt: 2,
          pb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FileDownloadIcon sx={{ color: ACCENT, fontSize: 20 }} />
          <Typography
            sx={{
              color: ACCENT,
              fontWeight: 600,
              fontSize: "17px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ p: 0.5 }}>
          <CloseIcon sx={{ fontSize: 20, color: "#6B7280" }} />
        </IconButton>
      </Box>

      <Divider />

      <DialogContent
        sx={{
          px: 3,
          pt: 2,
          pb: 2.5,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        <Box sx={{ mb: 1.5, pb: 1, borderBottom: "1px solid #E5E7EB" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={allSelected}
                indeterminate={isIndeterminate}
                onChange={handleToggleAll}
                size="small"
                sx={{
                  color: "#9CA3AF",
                  "&.Mui-checked": { color: ACCENT },
                  "&.MuiCheckbox-indeterminate": { color: ACCENT },
                }}
              />
            }
            label={
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  color: "#2B2B2B",
                }}
              >
                Select All Columns ({columns.length})
              </Typography>
            }
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
            maxHeight: "280px",
            overflowY: "auto",
            pr: 0.5,
          }}
        >
          {columns.map((col) => {
            const key = col.id || col.key || col.label;
            const isChecked = Boolean(selectedMap[key]);
            return (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={isChecked}
                    onChange={() => handleToggleCol(key)}
                    size="small"
                    sx={{
                      color: "#9CA3AF",
                      "&.Mui-checked": { color: ACCENT },
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      fontWeight: 500,
                      fontFamily: "Inter, sans-serif",
                      color: "#344054",
                    }}
                  >
                    {col.label || col.name || key}
                  </Typography>
                }
              />
            );
          })}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
        <Button
          onClick={onClose}
          sx={{
            border: `1px solid ${ACCENT}`,
            color: ACCENT,
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            textTransform: "none",
            height: "36px",
            px: 3,
            borderRadius: "5px",
            "&:hover": {
              backgroundColor: "rgba(144, 217, 22, 0.08)",
              border: `1px solid ${ACCENT}`,
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirmExport}
          variant="contained"
          startIcon={<FileDownloadIcon />}
          sx={{
            backgroundColor: ACCENT,
            color: "#FFFFFF",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            textTransform: "none",
            height: "36px",
            px: 3,
            borderRadius: "5px",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#7EC610",
              boxShadow: "none",
            },
          }}
        >
          Export Now
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportColumnsModal;
