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

function MoveCampaignModal({
  open,
  onClose,
  onMove,
  selectedCount = 0,
  campaignOptions = [],
}) {
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [note, setNote] = useState("");

  const handleMove = () => {
    if (!selectedCampaign) return;
    onMove?.({ campaign: selectedCampaign, note });
    onClose?.();
  };

  const cleanCampaigns = (Array.isArray(campaignOptions) ? campaignOptions : []).filter((c) => {
    if (!c) return false;
    const name = typeof c === "object" ? (c.campaign_name || c.name || c.label) : c;
    return name && name !== "All" && name !== "All Leads";
  });

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
            Move to Other Campaign
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
            You are about to move{" "}
            <strong>{selectedCount} selected leads</strong> to another campaign.
          </Typography>
        </Box>

        {/* Select Campaign Dropdown */}
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
            Select Campaign <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              displayEmpty
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
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
                Select Campaign
              </MenuItem>
              {cleanCampaigns.map((c, idx) => {
                const isObj = typeof c === "object" && c !== null;
                const val = isObj ? (c.value ?? c.id ?? c.campaign_name ?? c.name ?? idx) : c;
                const label = isObj ? (c.campaign_name ?? c.name ?? c.label ?? val) : c;
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
            placeholder="Enter reason for moving leads..."
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
            disabled={!selectedCampaign}
            onClick={handleMove}
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
            Move {selectedCount} Leads
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
          Selected leads will be moved from current campaign to the campaign you
          choose.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

export default MoveCampaignModal;
