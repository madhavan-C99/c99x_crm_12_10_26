import { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

const BRAND_GREEN = "#90D916";

export const UploadExcelModal = ({ open, onClose, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (file) {
      setSelectedFile(file);
      onUploadSuccess?.(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,Name,Mobile Number,Email,Lead Source,Stage\nJohn Doe,9876543210,john@gmail.com,Direct Walk-in,New Lead";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_leads_upload.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          p: 1,
          maxWidth: "620px",
        },
      }}
    >
      {/* DIALOG HEADER */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          pt: 1.5,
          px: 2.5,
        }}
      >
        <Typography
          sx={{
            fontSize: "20px",
            fontWeight: 700,
            color: BRAND_GREEN,
          }}
        >
          Upload Excel Sheet
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: BRAND_GREEN }}>
          <CloseIcon fontSize="medium" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
        {/* DRAG AND DROP AREA */}
        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: `2px dashed ${isDragging ? BRAND_GREEN : "#B8A7FB"}`,
            borderRadius: "14px",
            backgroundColor: isDragging ? "#F6FCEE" : "#FAF9FE",
            p: 4,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            mb: 2.5,
            transition: "all 0.2s ease",
          }}
        >
          <ArrowUpwardIcon sx={{ fontSize: 32, color: BRAND_GREEN }} />

          <Typography
            sx={{
              fontSize: "15px",
              fontWeight: 600,
              color: BRAND_GREEN,
            }}
          >
            Drag and drop file
          </Typography>

          <Button
            variant="contained"
            onClick={handleBrowseClick}
            sx={{
              backgroundColor: BRAND_GREEN,
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "14px",
              px: 3.5,
              py: 0.8,
              borderRadius: "8px",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#82C713",
                boxShadow: "none",
              },
            }}
          >
            Browse
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".csv, .xls, .xlsx"
            onChange={handleInputChange}
          />

          <Typography sx={{ fontSize: "12px", color: "#888888", mt: 0.5 }}>
            {selectedFile
              ? `Selected: ${selectedFile.name}`
              : "Supported formats are .csv, .xls, .xlsx"}
          </Typography>
        </Box>

        {/* INFO AND DOWNLOAD SAMPLE FILE ROW */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: "13px", color: "#666666" }}>
            Max leads: 25,000 at a time, file size limit: 3MB.
          </Typography>

          <Typography
            onClick={handleDownloadSample}
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: BRAND_GREEN,
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Download Sample file
          </Typography>
        </Box>

        {/* INSTRUCTION ALERT BANNER */}
        <Box
          sx={{
            backgroundColor: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "10px",
            p: 1.8,
            display: "flex",
            alignItems: "center",
            gap: 1.2,
          }}
        >
          <SettingsOutlinedIcon sx={{ fontSize: 20, color: "#D97706" }} />
          <Typography
            sx={{
              fontSize: "13px",
              color: "#4B5563",
              lineHeight: 1.4,
            }}
          >
            No specific column order needed! Just include crucial details like name
            and number in the file.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default UploadExcelModal;
