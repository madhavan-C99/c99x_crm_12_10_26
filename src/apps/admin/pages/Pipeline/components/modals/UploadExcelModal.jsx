import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import api from "@/shared/services/axios";
import { uploadLeadsExcel } from "@/apps/admin/services/leadService";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

const BRAND_GREEN = "#90D916";

export const UploadExcelModal = ({
  open,
  onClose,
  campaignId = null,
  campaignName = "",
  selectedPipelineId = null,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setSelectedFile(file);

    try {
      setUploading(true);

      // Mode 1: Campaign-specific Lead Upload (from EnquirySheet)
      if (campaignId) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawRows || rawRows.length === 0) {
          toast.error("Excel sheet is empty!");
          setUploading(false);
          return;
        }

        const parsedLeads = rawRows
          .map((row) => {
            const keys = Object.keys(row);
            const nameVal =
              row["Name"] ||
              row["Full Name"] ||
              row["name"] ||
              (keys.length > 0 ? row[keys[0]] : "");
            const mobileVal =
              row["Mobile Number"] ||
              row["Phone"] ||
              row["Mobile"] ||
              (keys.length > 1 ? row[keys[1]] : "");
            return {
              full_name: String(nameVal).trim(),
              mobile_no: String(mobileVal).replace(/\D/g, "").slice(-10),
              campaign_id: campaignId,
              campaign_name: campaignName,
            };
          })
          .filter((l) => l.mobile_no && l.mobile_no.length >= 10);

        if (parsedLeads.length === 0) {
          toast.error("No valid 10-digit mobile numbers found in file!");
          setUploading(false);
          return;
        }

        const response = await api.post("telecalling/lead_upload_excel", {
          leads: parsedLeads,
          campaign_id: campaignId,
          campaign_name: campaignName,
        });

        const resMsg = response.data?.message || {};
        const successCnt =
          resMsg.success_count !== undefined
            ? resMsg.success_count
            : response.data?.leads_created || 0;
        const dupes = resMsg.duplicates || [];

        if (successCnt > 0) {
          toast.success(
            `✅ Successfully uploaded ${successCnt} new leads into campaign!`,
          );
        } else if (dupes.length > 0) {
          toast.warning(`⚠️ ${dupes[0]}`);
        } else {
          toast.info(resMsg.message || "File processed.");
        }

        onUploadSuccess?.(response.data);
        onClose();
      } else {
        // Mode 2: General Pipeline Upload (from Pipeline Dashboard)
        const formData = new FormData();
        formData.append("file", file);
        if (selectedPipelineId) {
          formData.append("pipeline_id", selectedPipelineId);
        }
        const res = await uploadLeadsExcel(formData);
        toast.success(res?.data?.message || "Excel sheet uploaded successfully!");
        onUploadSuccess?.(file);
        onClose?.();
      }
    } catch (err) {
      console.error("Excel Upload Error:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to upload Excel file.",
      );
    } finally {
      setUploading(false);
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
    const time = Date.now().toString().slice(-5);
    const rows = [
      "Name,Mobile Number,Email,Lead Source,Stage",
      `Test User 1,987${time}0001,user1_${time}@example.com,Website,New Lead`,
      `Test User 2,987${time}0002,user2_${time}@example.com,Facebook Ads,New Lead`,
      `Test User 3,987${time}0003,user3_${time}@example.com,Google Ads,New Lead`,
      `Test User 4,987${time}0004,user4_${time}@example.com,Direct Walk-in,New Lead`,
      `Test User 5,987${time}0005,user5_${time}@example.com,Instagram,New Lead`,
      `Test User 6,987${time}0006,user6_${time}@example.com,Referral,New Lead`,
      `Test User 7,987${time}0007,user7_${time}@example.com,Website,New Lead`,
      `Test User 8,987${time}0008,user8_${time}@example.com,Facebook Ads,New Lead`,
      `Test User 9,987${time}0009,user9_${time}@example.com,Google Ads,New Lead`,
      `Test User 10,987${time}0010,user10_${time}@example.com,Direct Walk-in,New Lead`,
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
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
            disabled={uploading}
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
            {uploading ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : (
              "Browse"
            )}
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
