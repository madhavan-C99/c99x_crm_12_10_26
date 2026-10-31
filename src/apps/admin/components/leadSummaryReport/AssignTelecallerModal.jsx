import { useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  TextField,
  Button,
  FormControl,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const modalMenuProps = {
  className: "modal-select-menu",
  PaperProps: {
    className: "modal-select-paper",
    style: { maxHeight: 250 },
    sx: {
      maxHeight: "250px !important",
      overflowY: "auto",
      borderRadius: "8px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      "&::-webkit-scrollbar": { width: "5px" },
      "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
    },
  },
  slotProps: {
    paper: {
      className: "modal-select-paper",
      style: { maxHeight: 250 },
      sx: {
        maxHeight: "250px !important",
        overflowY: "auto",
        borderRadius: "8px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        "&::-webkit-scrollbar": { width: "5px" },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
      },
    },
    list: {
      style: { maxHeight: 250 },
      sx: {
        maxHeight: "250px !important",
        overflowY: "auto",
        "&::-webkit-scrollbar": { width: "5px" },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
      },
    },
  },
  MenuListProps: {
    style: { maxHeight: 250 },
    sx: {
      maxHeight: "250px !important",
      overflowY: "auto",
      "&::-webkit-scrollbar": { width: "5px" },
      "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
    },
  },
};

function AssignTelecallerModal({
  open,
  onClose,
  onAssign,
  selectedCount = 0,
  telecallerOptions = [],
}) {
  const [selectedTelecaller, setSelectedTelecaller] = useState("");
  const [note, setNote] = useState("");

  const handleAssign = () => {
    if (!selectedTelecaller) return;
    onAssign?.({ telecaller: selectedTelecaller, note });
    onClose?.();
  };

  const activeTelecallers =
    Array.isArray(telecallerOptions) && telecallerOptions.length > 0
      ? telecallerOptions
      : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          p: 0.5,
          boxShadow: "0px 10px 30px rgba(0,0,0,0.15)",
        },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        {/* Header Title with Close Icon */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              color: "#111827",
            }}
          >
            Assign / Reassign to Telecaller
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: "#6B7280" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Info Alert Box */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            bgcolor: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: "8px",
            p: 1.8,
            mb: 2.5,
          }}
        >
          <InfoOutlinedIcon sx={{ color: "#2563EB", fontSize: "20px" }} />
          <Typography
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "13.5px",
              color: "#1E40AF",
              fontWeight: 500,
            }}
          >
            You are about to assign{" "}
            <strong>{selectedCount} selected leads</strong> to a telecaller.
          </Typography>
        </Box>

        {/* Select Telecaller Dropdown */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              mb: 0.8,
            }}
          >
            Select Telecaller <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              displayEmpty
              value={selectedTelecaller}
              onChange={(e) => setSelectedTelecaller(e.target.value)}
              MenuProps={modalMenuProps}
              sx={{
                borderRadius: "8px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                bgcolor: "#FFFFFF",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D1D5DB",
                },
              }}
            >
              <MenuItem value="" disabled sx={{ color: "#9CA3AF" }}>
                Select Telecaller
              </MenuItem>
              {activeTelecallers.map((t, idx) => {
                const isObj = typeof t === "object" && t !== null;
                const val = isObj ? (t.value ?? t.id ?? t.user_name ?? t.name ?? idx) : t;
                const label = isObj ? (t.user_name ?? t.name ?? t.label ?? val) : t;
                return (
                  <MenuItem key={`${val}-${idx}`} value={val} sx={{ fontSize: "14px" }}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>

        {/* Add Note Textarea */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              mb: 0.8,
            }}
          >
            Add Note (Optional)
          </Typography>
          <TextField
            multiline
            rows={3}
            fullWidth
            placeholder="Enter note..."
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
              },
            }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
            <Typography
              sx={{ fontSize: "11.5px", color: "#9CA3AF", fontWeight: 500 }}
            >
              {note.length}/200
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{ display: "flex", gap: 1.5, justifyContent: "center", mb: 2 }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              flex: 1,
              py: 1.2,
              borderRadius: "8px",
              borderColor: "#8BC34A",
              color: "#8BC34A",
              fontWeight: 600,
              fontSize: "14px",
              textTransform: "none",
              "&:hover": { borderColor: "#7CB34A", bgcolor: "#F7FEE7" },
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={!selectedTelecaller}
            onClick={handleAssign}
            sx={{
              flex: 1.3,
              py: 1.2,
              borderRadius: "8px",
              bgcolor: "#8BC34A",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "14px",
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { bgcolor: "#7CB34A" },
              "&.Mui-disabled": { bgcolor: "#E5E7EB", color: "#9CA3AF" },
            }}
          >
            Assign {selectedCount} Leads
          </Button>
        </Box>

        {/* Footer Helper Info Text */}
        <Typography
          align="center"
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "#6B7280",
            lineHeight: 1.4,
          }}
        >
          Selected leads will be assigned to the telecaller you choose.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

export default AssignTelecallerModal;
