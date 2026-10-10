import { useEffect, useRef, useState } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Tooltip,
  CircularProgress,
  Alert,
  MenuItem,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import { previewLeadsFile, confirmLeadImport } from "@/apps/telecalling/services/importService";
import { getSelectOptions } from "@/shared/services/dropdownService";
import { CATEGORY_ALIAS } from "@/shared/components/filters/popup/filterConfig";


const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const MAX_FILE_SIZE_MB = 5;

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const STATUS_COLOR = {
  Valid: { bg: "#EAF7D9", color: "#4C8C0A", border: "#B7E36B" },
  Duplicate: { bg: "#FFF4DE", color: "#B4740A", border: "#FFD98F" },
  Error: { bg: "#FFEAEA", color: "#D32F2F", border: "#FFB3B3" },
};

/**
 * ImportLeadsDialog
 * -------------------
 * Two-step import flow:
 *  1) SELECT — user picks a csv/xlsx/xls file. Clicking "Preview" calls
 *     previewLeadsFile() and shows row-by-row status (Valid / Duplicate / Error).
 *     NOTHING is saved to DB at this stage — it's read-only preview.
 *  2) PREVIEW — Duplicate & Error rows can be edited (fix name/mobile/lead
 *     source/campaign) or removed. Clicking "Confirm & Upload" calls
 *     confirmLeadImport() with only the remaining valid rows — THIS is the
 *     only step that actually saves.
 *
 * ✅ EXCEL HAS 4 COLUMNS: full_name, mobile_no, lead_source, campaign_name
 *    Both lead_source AND campaign_name are DUAL DROPDOWN-MAPPED fields:
 *    - lead_source   -> text from Excel, matched against leadSourceOptions
 *                        dropdown list to resolve a lead_source_id (FK)
 *    - campaign_name -> text from Excel, matched against campaignOptions
 *                        dropdown list to resolve a campaign_id (FK)
 *    These are two COMPLETELY SEPARATE dropdown option lists / matching
 *    functions / edit fields / payload IDs.
 *
 * ✅ EDIT BEHAVIOUR: clicking Save on a row only marks it "Edited" if a
 *    value was ACTUALLY changed compared to what it was before editing
 *    started. If the user opens edit mode and saves without changing
 *    anything, the row's original status/message stay untouched.
 *
 * Props:
 * - open            : boolean
 * - onClose         : () => void
 * - refreshPipeline : () => void   -> called after a successful confirm-upload
 * - onUploadSuccess : () => void   -> called after successful confirm-upload
 */
const ImportLeadsDialog = ({ open, onClose, refreshPipeline, onUploadSuccess }) => {

  const [step, setStep] = useState("select"); // "select" | "preview"

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [summary, setSummary] = useState(null); // { total_rows, valid_rows, duplicate_rows, error_rows }
  const [rows, setRows] = useState([]); // editable copy of preview_data
  const [confirming, setConfirming] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null); // { severity: "warning" | "error", text: "" }

  const [campaignOptions, setCampaignOptions] = useState([]);   // [{ label, value(id) }]
  const [leadSourceOptions, setLeadSourceOptions] = useState([]); // [{ label, value(id) }]

  useEffect(() => {
    if (open) {
      getCampaignOptions();
      getLeadSourceOptions();
    }
  }, [open]);

  const getCampaignOptions = async () => {
    try {
      const payload = {
        field: CATEGORY_ALIAS.campaign_name, // ⚠️ confirm exact category key with backend
        filter_id: "",
      };

      const response = await getSelectOptions(payload);
      const options = response.data.data || [];
      setCampaignOptions(options);
      return options; // ✅ return directly so callers don't have to wait on state
    } catch (error) {
      return [];
    }
  };

  // ✅ separate fetch for lead_source dropdown options
  const getLeadSourceOptions = async () => {
    try {
      const payload = {
        // ⚠️ ADJUST — change to the actual dropdown_category value your
        // backend uses for lead source options (e.g. "lead_source").
        field: CATEGORY_ALIAS.lead_source,
        filter_id: "",
      };

      const response = await getSelectOptions(payload);
      const options = response.data.data || [];
      setLeadSourceOptions(options);
      return options; // ✅ return directly so callers don't have to wait on state
    } catch (error) {
      return [];
    }
  };

  // generic case/space-insensitive label matcher, reused for both dropdowns
  const findOptionByName = (name, options) => {
    if (!name) return null;

    const normalized = name.trim().toLowerCase();

    return (
      options.find(
        (opt) => opt.label?.trim().toLowerCase() === normalized
      ) || null
    );
  };

  // ============ SELECT STEP HELPERS ============

  const validateAndSetFile = (file) => {

    if (!file) return;

    const nameLower = file.name.toLowerCase();
    const isAllowed = ALLOWED_EXTENSIONS.some((ext) =>
      nameLower.endsWith(ext)
    );

    if (!isAllowed) {
      setFileError("Only .csv, .xlsx or .xls files are allowed");
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File size should not exceed ${MAX_FILE_SIZE_MB}MB`);
      setSelectedFile(null);
      return;
    }

    setFileError("");
    setSelectedFile(file);
  };

  const handleBrowseClick = () => fileInputRef.current?.click();

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError("");
  };

  // ============ PREVIEW (STEP 1 -> 2) — READ ONLY, NOTHING SAVED HERE ============
  // Sends the raw FILE (multipart) to the preview endpoint.

  const handlePreviewFile = async () => {

    if (!selectedFile) {
      setFileError("Please choose a file to import");
      return;
    }

    try {
      setPreviewLoading(true);

      const [campaignOpts, leadSourceOpts] = await Promise.all([
        campaignOptions.length > 0 ? Promise.resolve(campaignOptions) : getCampaignOptions(),
        leadSourceOptions.length > 0 ? Promise.resolve(leadSourceOptions) : getLeadSourceOptions(),
      ]);

      const response = await previewLeadsFile(selectedFile);
      // backend wraps the payload as { data: { total_rows, preview_data, ... } }
      const data = response.data?.data;

      setSummary({
        total_rows: data.total_rows,
        valid_rows: data.valid_rows,
        duplicate_rows: data.duplicate_rows,
        error_rows: data.error_rows,
      });

      // build editable local rows
      // ✅ excel row has: full_name, mobile_no, lead_source, campaign_name
      // ✅ BOTH lead_source and campaign_name are matched separately against
      // their own dropdown option lists
      const editableRows = (data.preview_data || []).map((r) => {
        const matchedLeadSource = findOptionByName(r.lead_source, leadSourceOpts);
        const matchedCampaign = findOptionByName(r.campaign_name, campaignOpts);

        return {
          ...r,
          removed: false,
          editing: false,
          editFullName: r.full_name || "",
          editMobile: r.mobile_no || "",

          lead_source_id: matchedLeadSource?.value || null,
          lead_source_name: matchedLeadSource?.label || r.lead_source || "",
          editLeadSourceId: matchedLeadSource?.value || "",

          campaign_id: matchedCampaign?.value || null,
          campaign_name: matchedCampaign?.label || r.campaign_name || "",
          editCampaignId: matchedCampaign?.value || "",
        };
      });

      setRows(editableRows);
      setPreviewLoading(false);
      setStep("preview");

    } catch (err) {
      setPreviewLoading(false);
      alert("Error while previewing file");
    }
  };

  // ============ PREVIEW STEP — EDIT / REMOVE ============

  const startEditRow = (rowIndex) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIndex
          ? {
              ...r,
              editing: true,
              editFullName: r.full_name,
              editMobile: r.mobile_no,
              editLeadSourceId: r.lead_source_id || "",
              editCampaignId: r.campaign_id || "",
            }
          : r
      )
    );
  };

  const cancelEditRow = (rowIndex) => {
    setRows((prev) =>
      prev.map((r, i) => (i === rowIndex ? { ...r, editing: false } : r))
    );
  };

  const changeEditField = (rowIndex, field, value) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIndex) return r;

        if (field === "editMobile") {
          const onlyDigits = value.replace(/\D/g, "").slice(0, 10);
          return { ...r, editMobile: onlyDigits };
        }

        if (field === "editFullName") {
          const onlyLetters = value.replace(/[^a-zA-Z\s]/g, "");
          return { ...r, editFullName: onlyLetters };
        }

        // ✅ lead source dropdown selection
        if (field === "editLeadSourceId") {
          return { ...r, editLeadSourceId: value };
        }

        // ✅ campaign dropdown selection
        if (field === "editCampaignId") {
          return { ...r, editCampaignId: value };
        }

        return r;
      })
    );
  };

  const saveEditRow = (rowIndex) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIndex) return r;

        const fixedName = r.editFullName.trim();
        const fixedMobile = r.editMobile.trim();
        const fixedLeadSourceId = r.editLeadSourceId || null;
        const fixedCampaignId = r.editCampaignId || null;

        // ✅ FIX — compare new values against what the row had BEFORE
        // editing started. Only if something actually changed do we
        // touch status/message. Otherwise leave the row exactly as it was.
        const nothingChanged =
          fixedName === (r.full_name || "").trim() &&
          fixedMobile === (r.mobile_no || "").trim() &&
          fixedLeadSourceId === (r.lead_source_id || null) &&
          fixedCampaignId === (r.campaign_id || null);

        if (nothingChanged) {
          // just close edit mode, nothing else changes
          return {
            ...r,
            editing: false,
          };
        }

        const matchedLeadSourceOption = leadSourceOptions.find(
          (opt) => opt.value === fixedLeadSourceId
        );
        const matchedCampaignOption = campaignOptions.find(
          (opt) => opt.value === fixedCampaignId
        );

        // ✅ requires BOTH dropdowns matched, plus name / mobile
        const isValidNow =
          !!fixedName &&
          fixedMobile.length === 10 &&
          !!fixedLeadSourceId &&
          !!fixedCampaignId;

        return {
          ...r,
          full_name: fixedName,
          mobile_no: fixedMobile,
          lead_source_id: fixedLeadSourceId,
          lead_source_name: matchedLeadSourceOption?.label || r.lead_source_name,
          campaign_id: fixedCampaignId,
          campaign_name: matchedCampaignOption?.label || r.campaign_name,
          editing: false,
          // only overwrite status/message because something really changed
          status: isValidNow ? "Valid" : r.status,
          message: isValidNow ? "Edited" : r.message,
        };
      })
    );
  };

  const toggleRemoveRow = (rowIndex) => {
    setRows((prev) =>
      prev.map((r, i) => (i === rowIndex ? { ...r, removed: !r.removed } : r))
    );
  };

  // ✅ a row is safe to send only if not removed AND has:
  // name + 10-digit mobile + matched lead_source + matched campaign
  const isRowSubmittable = (row) =>
    !row.removed &&
    !!row.full_name &&
    (row.mobile_no || "").length === 10 &&
    !!row.lead_source_id &&
    !!row.campaign_id;

  const submittableCount = rows.filter(isRowSubmittable).length;

  const handleConfirmUpload = async () => {

    const payload = rows
      .filter(isRowSubmittable)
      .map((r) => ({
        full_name: r.full_name,
        mobile_no: r.mobile_no,
        lead_source: r.lead_source_id,   // ✅ matched lead source ID
        campaign_name: r.campaign_id,    // ✅ matched campaign ID
      }));

    if (payload.length === 0) {
      setUploadMessage({
        severity: "warning",
        text: "No valid leads to upload. Please fix or remove the flagged rows.",
      });
      return;
    }

    setUploadMessage(null);

    try {
      setConfirming(true);

      const response = await confirmLeadImport(payload);

      // ✅ backend returns 201 even when success_count is 0
      // (all rows turned out to be duplicates at save time), so we must
      // check the actual counts before treating this as a success.
      const report = response.data?.message;
      const successCount = report?.success_count ?? 0;
      const duplicateCount = report?.duplicate_count ?? 0;

      refreshPipeline?.();
      setConfirming(false);

      if (successCount > 0) {
        // at least one lead was actually saved
        handleCloseDialog();
        onUploadSuccess?.();
      } else {
        // nothing was saved — everything turned out to be a duplicate
        // at the moment of saving. Keep the dialog open, show an inline
        // banner instead of a browser alert(), so the user can see/edit/
        // remove the flagged rows right there.
        setUploadMessage({
          severity: "warning",
          text: `No leads were added. All ${duplicateCount} number(s) already exist in the system.`,
        });
      }

    } catch (err) {
      setConfirming(false);
      setUploadMessage({
        severity: "error",
        text: "Error while importing leads. Please try again.",
      });
    }
  };

  // ============ RESET / CLOSE / BACK ============

  const resetAll = () => {
    setStep("select");
    setSelectedFile(null);
    setFileError("");
    setIsDragging(false);
    setSummary(null);
    setRows([]);
    setUploadMessage(null);
  };

  const handleCloseDialog = () => {
    resetAll();
    onClose();
  };

  const handleBackToSelect = () => {
    setStep("select");
    setSummary(null);
    setRows([]);
    setUploadMessage(null);
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      fullWidth
      maxWidth={false}
      sx={{
        "& .MuiDialog-paper": {
          width: step === "preview"
            ? { xs: "94vw", sm: "800px", md: "900px" }
            : { xs: "400px", sm: "420px", md: "435px" },
          maxWidth: step === "preview" ? "900px" : "435px",
          // preview step gets a fixed height + flex column so the
          // heading and footer buttons stay put; only the table body
          // scrolls inside its own box below.
          height: step === "preview" ? { xs: "88vh", sm: "80vh" } : "auto",
          maxHeight: step === "preview" ? "720px" : "none",
          display: step === "preview" ? "flex" : "block",
          flexDirection: "column",
          borderRadius: { xs: "8px", sm: "10px" },
          p: 0,
          overflow: "hidden",
          background: "#FFFFFF",
          m: { xs: 1.5, sm: 2 },
          transition: "width 0.15s ease",
        },
      }}
    >

      <DialogTitle
        sx={{
          px: { xs: 2, sm: 4 },
          pt: 2,
          pb: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexShrink: 0, // heading stays fixed, never shrinks/scrolls
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {step === "preview" && (
            <IconButton onClick={handleBackToSelect} sx={{ p: 0.5 }}>
              <ArrowBackRoundedIcon sx={{ fontSize: "20px", color: "#444" }} />
            </IconButton>
          )}

          <Typography
            sx={{
              fontSize: { xs: "16px", sm: "18px" },
              fontWeight: 600,
              color: "#111",
            }}
          >
            {step === "select" ? "Import Leads" : "Review Leads Before Upload"}
          </Typography>
        </Box>

        <IconButton onClick={handleCloseDialog} sx={{ p: 0 }}>
          <CloseIcon sx={{ fontSize: { xs: "22px", sm: "25px" }, color: "#111" }} />
        </IconButton>
      </DialogTitle>

      <Typography
        sx={{
          fontSize: { xs: "13px", sm: "14px" },
          color: "#444",
          px: { xs: 2, sm: 4 },
          flexShrink: 0, // subtitle stays fixed too
        }}
      >
        {step === "select"
          ? "Upload a CSV or Excel file to add leads in bulk."
          : "Fix or remove duplicate / invalid rows below, then confirm to upload."}
      </Typography>

      {/* DialogContent becomes a flex column that fills remaining height
          on the preview step, so its children (chips/table/footer) can be
          arranged with only the table scrolling. On the select step it
          behaves like before (auto height). */}
      <DialogContent
        sx={{
          px: { xs: 2, sm: 4 },
          pt: 2,
          pb: { xs: 2, sm: 3 },
          display: step === "preview" ? "flex" : "block",
          flexDirection: "column",
          flex: step === "preview" ? 1 : "unset",
          overflow: step === "preview" ? "hidden" : "visible",
          minHeight: 0, // required for flex children to allow inner scrolling
        }}
      >

        {/* ================= STEP 1 — SELECT FILE ================= */}
        {step === "select" && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInputChange}
              style={{ display: "none" }}
            />

            <Box
              onClick={handleBrowseClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: `1.5px dashed ${
                  fileError ? "#FF4D4F" : isDragging ? "#84C318" : "#D9D9D9"
                }`,
                borderRadius: "8px",
                background: isDragging ? "#F4FFD9" : "#FAFAFA",
                px: 2,
                py: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <UploadFileOutlinedIcon sx={{ fontSize: "32px", color: "#90D916", mb: 1 }} />

              <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#444", textAlign: "center" }}>
                Drag & drop your file here
              </Typography>

              <Typography sx={{ fontSize: "12px", color: "#888", mt: 0.5, textAlign: "center" }}>
                or click to browse (.csv, .xlsx, .xls — max {MAX_FILE_SIZE_MB}MB)
              </Typography>

              <Typography sx={{ fontSize: "11px", color: "#AAA", mt: 1, textAlign: "center" }}>
                Expected columns: full_name, mobile_no, lead_source, campaign_name
              </Typography>
            </Box>

            {fileError && (
              <Typography sx={{ fontSize: "12px", color: "#FF4D4F", mt: 1 }}>
                {fileError}
              </Typography>
            )}

            {selectedFile && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 2,
                  p: 1.5,
                  borderRadius: "5px",
                  background: "#F2F2F2",
                  border: "1px solid #D9D9D9",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                  <InsertDriveFileOutlinedIcon sx={{ color: "#84C318", fontSize: "20px" }} />

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#333",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "220px",
                      }}
                    >
                      {selectedFile.name}
                    </Typography>

                    <Typography sx={{ fontSize: "11px", color: "#888" }}>
                      {formatFileSize(selectedFile.size)}
                    </Typography>
                  </Box>
                </Box>

                <IconButton onClick={handleRemoveFile} sx={{ p: 0.5 }}>
                  <DeleteOutlineRoundedIcon sx={{ fontSize: "18px", color: "#FF4D4F" }} />
                </IconButton>
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleCloseDialog}
                sx={{
                  width: "45%",
                  height: "31px",
                  borderRadius: "5px",
                  border: "1px solid #D9D9D9",
                  color: "#4D4D4D",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "14px",
                  "&:hover": { border: "1px solid #BFBFBF", background: "#F2F2F2" },
                }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={handlePreviewFile}
                disabled={!selectedFile || previewLoading}
                sx={{
                  width: "45%",
                  height: "31px",
                  borderRadius: "5px",
                  background: "#90D916",
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "none",
                  color: "#FFFFFF",
                  "&:hover": { background: "#74B010", boxShadow: "none" },
                  "&.Mui-disabled": { background: "#E0E0E0", color: "#A0A0A0" },
                }}
              >
                {previewLoading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Preview"}
              </Button>
            </Box>
          </>
        )}

        {/* ================= STEP 2 — PREVIEW / EDIT / REMOVE ================= */}
        {step === "preview" && (
          <>
            {/* SUMMARY CHIPS — fixed, does not scroll */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2, flexShrink: 0 }}>
              <Chip size="small"
                    label={`Total: ${summary?.total_rows ?? 0}`}
                     sx={{ fontWeight: 600 }}
             />
              <Chip
                size="small"
                label={`Valid: ${rows.filter((r) => r.status === "Valid" && !r.removed).length}`}
                sx={{ fontWeight: 600, bgcolor: STATUS_COLOR.Valid.bg, color: STATUS_COLOR.Valid.color }}
              />
              <Chip
                size="small"
                label={`Duplicate: ${rows.filter((r) => r.status === "Duplicate" && !r.removed).length}`}
                sx={{ fontWeight: 600, bgcolor: STATUS_COLOR.Duplicate.bg, color: STATUS_COLOR.Duplicate.color }}
              />
              <Chip
                size="small"
                label={`Error: ${rows.filter((r) => r.status === "Error" && !r.removed).length}`}
                sx={{ fontWeight: 600, bgcolor: STATUS_COLOR.Error.bg, color: STATUS_COLOR.Error.color }}
              />
            </Box>

            {/* INLINE UPLOAD RESULT MESSAGE — replaces browser alert() — fixed, does not scroll */}
            {uploadMessage && (
              <Alert
                severity={uploadMessage.severity}
                onClose={() => setUploadMessage(null)}
                sx={{ mb: 2, fontSize: "13px", borderRadius: "6px", flexShrink: 0 }}
              >
                {uploadMessage.text}
              </Alert>
            )}

            {/* TABLE — this is the ONLY part that scrolls. flex:1 makes it
                fill all remaining space between the fixed chips/alert above
                and the fixed footer text/buttons below. */}
            <Box sx={{ flex: 1, overflowY: "auto", border: "1px solid #EEE", borderRadius: "6px", minHeight: 0 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>S No</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Full Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Mobile No</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Lead Source</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Campaign</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Message</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "12px" }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((r, index) => {
                    const colors = STATUS_COLOR[r.status] || STATUS_COLOR.Error;

                    return (
                      <TableRow
                        key={r.row ?? index}
                        sx={{
                          opacity: r.removed ? 0.45 : 1,
                          background: r.removed ? "#FAFAFA" : "transparent",
                        }}
                      >
                        <TableCell sx={{ fontSize: "12px" }}>{index + 1}</TableCell>

                        {/* FULL NAME */}
                        <TableCell sx={{ fontSize: "12px" }}>
                          {r.editing ? (
                            <TextField
                              size="small"
                              value={r.editFullName}
                              onChange={(e) => changeEditField(index, "editFullName", e.target.value)}
                              placeholder="Full Name"
                              sx={{ "& .MuiOutlinedInput-input": { fontSize: "12px", py: 0.7 } }}
                            />
                          ) : (
                            r.full_name || "—"
                          )}
                        </TableCell>

                        {/* MOBILE */}
                        <TableCell sx={{ fontSize: "12px" }}>
                          {r.editing ? (
                            <TextField
                              size="small"
                              value={r.editMobile}
                              onChange={(e) => changeEditField(index, "editMobile", e.target.value)}
                              placeholder="Mobile No"
                              sx={{ "& .MuiOutlinedInput-input": { fontSize: "12px", py: 0.7 } }}
                            />
                          ) : (
                            r.mobile_no || "—"
                          )}
                        </TableCell>

                        {/* LEAD SOURCE — dropdown, matched to leadSourceOptions */}
                        <TableCell sx={{ fontSize: "12px" }}>
                          {r.editing ? (
                            <TextField
                              select
                              size="small"
                              value={r.editLeadSourceId}
                              onChange={(e) => changeEditField(index, "editLeadSourceId", e.target.value)}
                              placeholder="Lead Source"
                              sx={{
                                minWidth: "130px",
                                "& .MuiOutlinedInput-input": { fontSize: "12px", py: 0.7 },
                              }}
                            >
                              {leadSourceOptions.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "12px" }}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : r.lead_source_id ? (
                            r.lead_source_name
                          ) : (
                            <Typography component="span" sx={{ fontSize: "12px", color: "#D32F2F" }}>
                              {r.lead_source_name || "No match"}
                            </Typography>
                          )}
                        </TableCell>

                        {/* CAMPAIGN — dropdown, matched to campaignOptions */}
                        <TableCell sx={{ fontSize: "12px" }}>
                          {r.editing ? (
                            <TextField
                              select
                              size="small"
                              value={r.editCampaignId}
                              onChange={(e) => changeEditField(index, "editCampaignId", e.target.value)}
                              placeholder="Campaign"
                              sx={{
                                minWidth: "130px",
                                "& .MuiOutlinedInput-input": { fontSize: "12px", py: 0.7 },
                              }}
                            >
                              {campaignOptions.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "12px" }}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : r.campaign_id ? (
                            r.campaign_name
                          ) : (
                            <Typography
                              component="span"
                              sx={{ fontSize: "12px", color: "#D32F2F" }}
                            >
                              {r.campaign_name || "No match"}
                            </Typography>
                          )}
                        </TableCell>

                        {/* STATUS */}
                        <TableCell sx={{ fontSize: "12px" }}>
                          <Chip
                            size="small"
                            label={r.status}
                            sx={{
                              fontWeight: 600,
                              fontSize: "11px",
                              bgcolor: colors.bg,
                              color: colors.color,
                              border: `1px solid ${colors.border}`,
                            }}
                          />
                        </TableCell>

                        {/* MESSAGE */}
                        <TableCell sx={{ fontSize: "12px", color: "#888", maxWidth: "160px" }}>
                          {r.message}
                        </TableCell>

                        {/* ACTIONS */}
                        <TableCell align="right">
                          {r.editing ? (
                            <>
                              <Tooltip title="Save">
                                <IconButton size="small" onClick={() => saveEditRow(index)}>
                                  <CheckRoundedIcon sx={{ fontSize: "18px", color: "#4C8C0A" }} />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Cancel">
                                <IconButton size="small" onClick={() => cancelEditRow(index)}>
                                  <CloseRoundedIcon sx={{ fontSize: "18px", color: "#888" }} />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              {!r.removed && (
                                <Tooltip title="Edit">
                                  <IconButton size="small" onClick={() => startEditRow(index)}>
                                    <EditOutlinedIcon sx={{ fontSize: "17px", color: "#666" }} />
                                  </IconButton>
                                </Tooltip>
                              )}

                              <Tooltip title={r.removed ? "Undo remove" : "Remove"}>
                                <IconButton size="small" onClick={() => toggleRemoveRow(index)}>
                                  {r.removed ? (
                                    <RestartAltRoundedIcon sx={{ fontSize: "17px", color: "#666" }} />
                                  ) : (
                                    <DeleteOutlineRoundedIcon sx={{ fontSize: "17px", color: "#FF4D4F" }} />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            {/* FIXED FOOTER — ready-count text + action buttons stay
                pinned at the bottom, never scroll with the table */}
            <Typography sx={{ fontSize: "12px", color: "#888", mt: 1, flexShrink: 0 }}>
              {submittableCount} of {rows.length} leads ready to upload.
            </Typography>

            {/* PREVIEW STEP BUTTONS */}
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 3, flexShrink: 0 }}>
              <Button
                variant="outlined"
                onClick={handleCloseDialog}
                sx={{
                  width: "45%",
                  height: "31px",
                  borderRadius: "5px",
                  border: "1px solid #D9D9D9",
                  color: "#4D4D4D",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "14px",
                  "&:hover": { border: "1px solid #BFBFBF", background: "#F2F2F2" },
                }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={handleConfirmUpload}
                disabled={submittableCount === 0 || confirming}
                sx={{
                  width: "45%",
                  height: "31px",
                  borderRadius: "5px",
                  background: "#90D916",
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "none",
                  color: "#FFFFFF",
                  "&:hover": { background: "#74B010", boxShadow: "none" },
                  "&.Mui-disabled": { background: "#E0E0E0", color: "#A0A0A0" },
                }}
              >
                {confirming ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Confirm & Upload"}
              </Button>
            </Box>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
};

export default ImportLeadsDialog;
