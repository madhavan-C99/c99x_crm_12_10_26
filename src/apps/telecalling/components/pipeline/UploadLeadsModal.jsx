import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NorthIcon from "@mui/icons-material/North";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import WarningIcon from "@mui/icons-material/WarningOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAuth } from "@/shared/context/AuthContext";
// import UploadLeadsDialog from "@/apps/telecalling/shared/components/upload/UploadLeadsDialog";
import { getSelectOptions } from "@/apps/admin/services/dropdownService";
import { verifyLeadImport, submitLeadImport } from "@/apps/admin/services/leadService";
import UploadLeadsDialog from "../../../../shared/components/upload/UploadLeadDialog";

const UploadLeadsModal = ({ open, onClose, refreshPipeline, onUploadSuccess }) => {
  const { hasPermission } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState("select"); // "select" | "campaign_select" | "preview"
  const [previewRows, setPreviewRows] = useState([]);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [sources, setSources] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [fieldMapping, setFieldMapping] = useState({
    contactName: "",
    primaryNumber: "",
    // alternateNumber1: "",
    // email: "",
  });
  const fileInputRef = useRef(null);

  const handleMappingSubmit = (submission) => {
    const mappingObj = submission?.mapping || {};
    setFieldMapping(mappingObj);
    if (submission?.campaignId) {
      setSelectedCampaign(submission.campaignId);
    }
    if (submission?.sourceId) {
      setSelectedSource(submission.sourceId);
    }

    setPreviewRows((prevRows) => {
      return prevRows.map((r) => {
        const rawObj = r.rawObj || {};
        const contactName = mappingObj.contactName ? rawObj[mappingObj.contactName] : r.fullName;
        let primaryNo = mappingObj.primaryNumber ? rawObj[mappingObj.primaryNumber] : r.mobileNo;
        // const altNo = mappingObj.alternateNumber1 ? rawObj[mappingObj.alternateNumber1] : r.alternateNo;
        // const email = mappingObj.email ? rawObj[mappingObj.email] : r.email;

        let cleanDigits = String(primaryNo || "").replace(/\D/g, "");
        if (cleanDigits.startsWith("91") && cleanDigits.length > 10) {
          cleanDigits = cleanDigits.slice(2);
        }
        if (cleanDigits.length > 10) {
          cleanDigits = cleanDigits.slice(-10);
        }
        const formattedMobile = cleanDigits
          ? cleanDigits.length === 10
            ? `+91 ${cleanDigits}`
            : cleanDigits
          : primaryNo;

        return {
          ...r,
          fullName: contactName || r.fullName || "",
          mobileNo: formattedMobile || "",
        //   alternateNo: altNo || "",
        //   email: email || "",
          status: "unverified",
          reason: "Click Verify to validate with backend.",
        };
      });
    });

    setStep("preview");
  };

  useEffect(() => {
    if (open && step === "campaign_select") {
      Promise.all([
        getSelectOptions("L_CAMPAIGN_NAMES").catch(() => []),
        getSelectOptions("L_LEAD_SOURCES").catch(() => []),
      ]).then(([campRes, srcRes]) => {
        if (Array.isArray(campRes)) {
          setCampaigns(
            campRes.map((c) => ({
              id: String(c.id || c.value || c.name),
              name: String(c.name || c.label || c.campaign_name || c.value),
            }))
          );
        }
        if (Array.isArray(srcRes)) {
          setSources(
            srcRes.map((s) => ({
              id: String(s.id || s.value || s.name),
              name: String(s.name || s.label || s.source_name || s.value),
            }))
          );
          if (srcRes.length > 0 && !selectedSource) {
            setSelectedSource(String(srcRes[0].id || srcRes[0].value || srcRes[0].name));
          }
        }
      });
    }
  }, [open, step]);

  // Exact Lime Green Colors
  const LIME_GREEN = "#88D000";
  const LIME_HOVER = "#79B800";

  const handleDownloadSampleFile = () => {
    const csvContent =
      "First Name,Last Name,Mobile No,Email ID,Pipeline,Campaign,Source,User,Inquiry Date\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Sample_Leads_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
      e.target.value = "";
    }
  };

  const parseFileAndPreview = (file) => {
    const fileName = (file?.name || "").toLowerCase();
    const isCsv = fileName.endsWith(".csv");

    const reader = new FileReader();

    reader.onload = (e) => {
      let jsonRows = [];
      let detectedHeaders = [];

      try {
        if (isCsv) {
          const text = new TextDecoder("utf-8").decode(e.target.result);
          const workbook = XLSX.read(text, { type: "string" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          const rawHeaderRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] || [];
          if (Array.isArray(rawHeaderRow) && rawHeaderRow.length > 0) {
            detectedHeaders = rawHeaderRow
              .map((h) => (h !== undefined && h !== null ? String(h).trim() : ""))
              .filter((h) => h !== "");
          }
        } else {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          const rawHeaderRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] || [];
          if (Array.isArray(rawHeaderRow) && rawHeaderRow.length > 0) {
            detectedHeaders = rawHeaderRow
              .map((h) => (h !== undefined && h !== null ? String(h).trim() : ""))
              .filter((h) => h !== "");
          }
        }
      } catch (readErr) {
        console.warn("Primary XLSX read error:", readErr);
        if (isCsv) {
          try {
            const text = new TextDecoder("utf-8").decode(e.target.result);
            const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
            if (lines.length >= 2) {
              detectedHeaders = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
              for (let i = 1; i < lines.length; i++) {
                const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
                if (vals.length === 0 || (vals.length === 1 && !vals[0])) continue;
                const rowObj = {};
                detectedHeaders.forEach((h, idx) => {
                  rowObj[h] = vals[idx] || "";
                });
                jsonRows.push(rowObj);
              }
            }
          } catch (txtErr) {
            console.error("Text fallback failed:", txtErr);
          }
        }
      }

      if (!Array.isArray(jsonRows) || jsonRows.length === 0) {
        alert("File appears to be empty or contains no readable lead data.");
        return;
      }

      try {
        const allRowKeys = new Set(detectedHeaders);
        jsonRows.forEach((r) => {
          if (r && typeof r === "object") {
            Object.keys(r).forEach((k) => {
              if (k && String(k).trim()) allRowKeys.add(String(k).trim());
            });
          }
        });

        const headers = Array.from(allRowKeys);

        const parsed = jsonRows.map((rowObj, idx) => {
          const safeObj = rowObj && typeof rowObj === "object" ? rowObj : {};
          const getVal = (keys) => {
            try {
              const objKeys = Object.keys(safeObj);
              for (const k of keys) {
                const match = objKeys.find(
                  (h) => h && String(h).toLowerCase().replace(/[^a-z0-9]/g, "") === k.toLowerCase().replace(/[^a-z0-9]/g, "")
                );
                if (match && safeObj[match] !== undefined && safeObj[match] !== null) {
                  return String(safeObj[match]).trim();
                }
              }
            } catch {
              /* ignore */
            }
            return "";
          };

          const firstName = getVal(["firstname", "first_name"]);
          const lastName = getVal(["lastname", "last_name"]);
          const fullName = getVal(["fullname", "full_name", "name"]) || `${firstName} ${lastName}`.trim();
          let rawMobile = getVal(["mobileno", "mobile_no", "mobile", "phone", "phoneno", "contact"]);
          let cleanDigits = rawMobile.replace(/\D/g, "");
          if (cleanDigits.startsWith("91") && cleanDigits.length > 10) {
            cleanDigits = cleanDigits.slice(2);
          }
          if (cleanDigits.length > 10) {
            cleanDigits = cleanDigits.slice(-10);
          }
          const formattedMobile = cleanDigits ? (cleanDigits.length === 10 ? `+91 ${cleanDigits}` : cleanDigits) : rawMobile;

          const source = getVal(["source", "leadsource", "lead_source", "channel"]);

          return {
            id: idx + 1,
            firstName,
            lastName,
            fullName,
            mobileNo: formattedMobile,
            source,
            rawObj: safeObj,
            status: "unverified",
            reason: "Click Verify to validate with backend.",
          };
        });

        // Filter out garbage zip/xml rows
        const cleanRows = parsed.filter((row) => {
          const rawStr = JSON.stringify(row.rawObj || {}).toLowerCase();
          const isGarbage =
            rawStr.includes("docprops") ||
            rawStr.includes("xl/worksheets") ||
            rawStr.includes("xl/theme") ||
            rawStr.includes("xl/styles") ||
            rawStr.includes("_rels/.rels") ||
            rawStr.includes("[content_types]") ||
            rawStr.includes("pk\x03") ||
            rawStr.includes("pk\x04") ||
            rawStr.includes("app.xml") ||
            rawStr.includes("core.xml") ||
            rawStr.includes("sheet1.xml") ||
            rawStr.includes("theme1.xml") ||
            (rawStr.includes(".xml") && rawStr.includes("pk"));
          return !isGarbage;
        });

        const cleanHeaders = headers.filter((h) => {
          const hLow = String(h || "").toLowerCase();
          return (
            !hLow.includes("docprops") &&
            !hLow.includes("xl/") &&
            !hLow.includes("rels") &&
            !hLow.includes(".xml") &&
            !hLow.includes("content_types")
          );
        });

        setFileHeaders(cleanHeaders.length > 0 ? cleanHeaders : headers);
        setPreviewRows(cleanRows);
        setStep("campaign_select");
      } catch (procErr) {
        console.error("Error processing rows:", procErr);
        setFileHeaders(Object.keys(jsonRows[0] || {}));
        setPreviewRows(
          jsonRows.map((r, i) => ({
            id: i + 1,
            fullName: "Lead Record",
            mobileNo: "",
            rawObj: r || {},
            status: "unverified",
            reason: "Parsed Row",
          }))
        );
        setStep("campaign_select");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFile = (file) => {
    setSelectedFile(file);
    parseFileAndPreview(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteRow = (rowId) => {
    setPreviewRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleRemoveAllInvalidRows = () => {
    setPreviewRows((prev) =>
      prev.filter(
        (r) =>
          r.status !== "duplicate" &&
          r.status !== "error" &&
          r.status !== "mandatory_missing"
      )
    );
  };

const handleCellChange = (rowId, fieldId, newValue) => {
  setPreviewRows((prev) =>
    prev.map((r) => {
      if (r.id !== rowId) return r;

      const rawHeader = fieldMapping[fieldId];
      const updatedRaw = { ...(r.rawObj || {}) };
      if (rawHeader) {
        updatedRaw[rawHeader] = newValue;
      }

      return {
        ...r,
        fullName: fieldId === "contactName" ? newValue : r.fullName,
        mobileNo: fieldId === "primaryNumber" ? newValue : r.mobileNo,
        rawObj: updatedRaw,
        status: "unverified",
        reason: "Click Verify to validate with backend.",
      };
    })
  );
};

  const handleBackendVerify = async () => {
    if (previewRows.length === 0) return;

    try {
      setVerifying(true);

      const rowsPayload = previewRows.map((r) => {
        const rawName = fieldMapping.contactName ? r.rawObj?.[fieldMapping.contactName] : r.fullName || "";
        // const rawEmail = fieldMapping.email ? r.rawObj?.[fieldMapping.email] : r.email || "";
        let rawMobile = fieldMapping.primaryNumber ? r.rawObj?.[fieldMapping.primaryNumber] : r.mobileNo || "";
        let cleanDigits = String(rawMobile || "").replace(/\D/g, "");
        if (cleanDigits.startsWith("91") && cleanDigits.length > 10) {
          cleanDigits = cleanDigits.slice(2);
        }
        if (cleanDigits.length > 10) {
          cleanDigits = cleanDigits.slice(-10);
        }

        return {
          name: rawName || "",
        //   email: rawEmail || "",
          mobile: cleanDigits || rawMobile || "",
        };
      });

      const jsonPayload = { rows: rowsPayload };

      const res = await verifyLeadImport(jsonPayload);
      const resData = res?.data?.data || res?.data || {};
      const backendRows = resData?.rows || (Array.isArray(resData) ? resData : []);
      const normalizedRows = resData?.normalized_rows || [];

      if (Array.isArray(backendRows) && backendRows.length > 0) {
        const errorMap = new Map();
        backendRows.forEach((item, index) => {
          const rowNum = item.row_number ?? (index + 1);
          const rawErrs = Array.isArray(item.errors) ? item.errors : (item.error ? [item.error] : []);
          const errList = rawErrs
            .map((e) => {
              if (typeof e === "string") return e;
              if (e && typeof e === "object") return e.message || e.error || e.field || "";
              return String(e || "");
            })
            .filter(Boolean);

          errorMap.set(rowNum, errList);
        });

        setPreviewRows((prev) =>
          prev.map((r, i) => {
            const rowNum = i + 1;
            const errList = errorMap.get(rowNum) || [];
            const norm = normalizedRows[i];

            const isErr = errList.length > 0;
            return {
              ...r,
              fullName: norm?.name || r.fullName,
              // email: norm?.email || r.email,
              mobileNo: norm?.mobile ? (norm.mobile.length === 10 ? `+91 ${norm.mobile}` : norm.mobile) : r.mobileNo,
              status: isErr ? "duplicate" : "valid",
              reason: isErr ? errList.join(", ") : "Valid Lead",
            };
          })
        );
      } else {
        setPreviewRows((prev) =>
          prev.map((r) => ({
            ...r,
            status: "valid",
            reason: "Valid Lead",
          }))
        );
      }
    } catch (err) {
      console.error("Backend verify API error:", err);
      const errDetail = err?.response?.data?.message || err?.message || "Verification request failed";
      alert(`Backend Verification Error: ${errDetail}`);
    } finally {
      setVerifying(false);
    }
  };

const handleConfirmUpload = async () => {
    if (!hasPermission("api_upload_lead_excel_admin") && !hasPermission("feat_lead_import")) {
      alert("Permission denied: You do not have permission to upload leads.");
      return;
    }

    if (previewRows.length === 0) {
      alert("No rows available to upload.");
      return;
    }

    const isAllValid = previewRows.every((r) => r.status === "valid");
    if (!isAllValid) {
      alert("⚠️ Cannot submit! All rows must be verified as Valid by the backend before submitting.");
      return;
    }

    try {
      setUploading(true);

      const rowsPayload = previewRows.map((r) => {
        const rawName = fieldMapping.contactName ? r.rawObj?.[fieldMapping.contactName] : r.fullName || "";
        // const rawEmail = fieldMapping.email ? r.rawObj?.[fieldMapping.email] : r.email || "";
        let rawMobile = fieldMapping.primaryNumber ? r.rawObj?.[fieldMapping.primaryNumber] : r.mobileNo || "";
        let cleanDigits = String(rawMobile || "").replace(/\D/g, "");
        if (cleanDigits.startsWith("91") && cleanDigits.length > 10) {
          cleanDigits = cleanDigits.slice(2);
        }
        if (cleanDigits.length > 10) {
          cleanDigits = cleanDigits.slice(-10);
        }

        return {
          name: rawName || "",
          // email: rawEmail || "",
          mobile: cleanDigits || rawMobile || "",
        };
      });

      if (!selectedCampaign) {
        alert("Please select a campaign before submitting.");
        return;
      }

      const parsedCampaignId = isNaN(Number(selectedCampaign))
        ? selectedCampaign
        : Number(selectedCampaign);

      const parsedSourceId = isNaN(Number(selectedSource))
        ? (selectedSource ? Number(selectedSource) || selectedSource : 1)
        : Number(selectedSource);

      const submitPayload = {
        campaign_id: parsedCampaignId,
        source_id: parsedSourceId,
        rows: rowsPayload,
      };

    //   const res = await submitLeadImport(submitPayload);
    //   const resMsg = res?.data?.data?.message || res?.data?.message || "Leads imported successfully!";
    //   alert(`Success: ${resMsg}`);

    //   if (onUpload) {
    //     await onUpload(submitPayload);
    //   }
    //   handleModalClose();

    await submitLeadImport(submitPayload);

        refreshPipeline?.();      // board refresh
        handleModalClose();
        onUploadSuccess?.();  
    } catch (err) {
      console.error("Upload leads submit API error:", err);
      const errDetail = err?.response?.data?.message || err?.message || "Submit request failed";
      alert(`Backend Submit Error: ${errDetail}`);
    } finally {
      setUploading(false);
    }
  };

  const handleModalClose = () => {
    setSelectedFile(null);
    setUploading(false);
    setVerifying(false);
    setStep("select");
    setPreviewRows([]);
    setFileHeaders([]);
    onClose();
  };

  const validCount = previewRows.filter((r) => r.status === "valid").length;
  const invalidCount = previewRows.filter(
    (r) => r.status === "duplicate" || r.status === "error" || r.status === "mandatory_missing"
  ).length;
  const unverifiedCount = previewRows.filter((r) => r.status === "unverified" || !r.status).length;
  const isAllValid = previewRows.length > 0 && previewRows.every((r) => r.status === "valid");

  if (step === "campaign_select") {
    return (
      <UploadLeadsDialog
        open={open && step === "campaign_select"}
        onClose={handleModalClose}
        onBack={() => setStep("select")}
        onNext={(option, campaign) => {
          setSelectedCampaign(campaign);
        }}
        onSubmit={handleMappingSubmit}
        campaigns={campaigns}
        onRefreshCampaigns={(newCamps) => setCampaigns(newCamps)}
        fileColumns={fileHeaders.length > 0 ? fileHeaders : ["First Name", "Last Name", "Mobile No", "Email ID", "Source", "Campaign"]}
      />
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleModalClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: "20px",
          width: step === "preview" ? "960px" : "527px",
          maxWidth: "95vw",
          height: step === "preview" ? "82vh" : "auto",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
          transition: "width 0.3s ease-in-out, height 0.3s ease-in-out",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          p: "24px 28px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* FIXED TOP SECTION: TITLE & VERIFICATION BANNER */}
        <Box sx={{ flexShrink: 0 }}>
          {/* Title & Close Button */}
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 0,
              mb: step === "preview" ? 2 : 2.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {step === "preview" && (
                <IconButton
                  onClick={() => setStep("select")}
                  size="small"
                  sx={{ color: "#475569" }}
                >
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
              )}
              <Typography
                sx={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: LIME_GREEN,
                  letterSpacing: "-0.2px",
                }}
              >
                {step === "select" ? "Upload Excel Sheet" : "Verify & Review Upload Leads"}
              </Typography>
            </Box>
            <IconButton
              onClick={handleModalClose}
              size="small"
              sx={{
                color: LIME_GREEN,
                p: 0.5,
                "&:hover": { backgroundColor: "rgba(136, 208, 0, 0.08)" },
              }}
            >
              <CloseIcon sx={{ fontSize: "22px" }} />
            </IconButton>
          </DialogTitle>

          {/* Verification Summary Banner (Fixed Top) */}
          {step === "preview" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "14px",
                p: "14px 20px",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
                <Chip
                  icon={<CheckCircleIcon style={{ color: "#16A34A", fontSize: 18 }} />}
                  label={`Valid Leads: ${validCount}`}
                  sx={{
                    backgroundColor: "#DCFCE7",
                    color: "#15803D",
                    fontWeight: 700,
                    fontSize: "12.5px",
                    borderRadius: "20px",
                    px: 0.5,
                    py: 0.2,
                  }}
                />
                {invalidCount > 0 && (
                  <Chip
                    icon={<WarningIcon style={{ color: "#DC2626", fontSize: 18 }} />}
                    label={`Duplicate / Error Leads: ${invalidCount}`}
                    sx={{
                      backgroundColor: "#FEE2E2",
                      color: "#B91C1C",
                      fontWeight: 700,
                      fontSize: "12.5px",
                      borderRadius: "20px",
                      px: 0.5,
                      py: 0.2,
                    }}
                  />
                )}
                {unverifiedCount > 0 && (
                  <Chip
                    icon={<WarningIcon style={{ color: "#D97706", fontSize: 18 }} />}
                    label={`Unverified Leads: ${unverifiedCount}`}
                    sx={{
                      backgroundColor: "#FEF3C7",
                      color: "#92400E",
                      fontWeight: 700,
                      fontSize: "12.5px",
                      borderRadius: "20px",
                      px: 0.5,
                      py: 0.2,
                    }}
                  />
                )}
              </Box>

              {invalidCount > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                  onClick={handleRemoveAllInvalidRows}
                  sx={{
                    color: "#DC2626",
                    borderColor: "#FCA5A5",
                    backgroundColor: "#FEF2F2",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "12px",
                    borderRadius: "10px",
                    py: 0.6,
                    px: 1.8,
                    "&:hover": {
                      backgroundColor: "#FEE2E2",
                      borderColor: "#EF4444",
                    },
                  }}
                >
                  Remove All {invalidCount} Invalid Rows
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* STEP 1: FILE SELECTION VIEW */}
        {step === "select" && (
          <Box sx={{ p: 0, overflow: "visible" }}>
            <Box
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              sx={{
                border: dragActive
                  ? `2px dashed ${LIME_GREEN}`
                  : "1.5px dashed #CBD5E1",
                borderRadius: "14px",
                backgroundColor: dragActive ? "#F7FEE7" : "#F8FAFC",
                py: "42px",
                px: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease-in-out",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xls, .xlsx"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: LIME_GREEN,
                  mb: 0.5,
                }}
              >
                <NorthIcon sx={{ fontSize: 20, fontWeight: 700 }} />
              </Box>

              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: LIME_GREEN,
                  mb: 1.5,
                }}
              >
                Drag and drop file
              </Typography>

              <Button
                variant="contained"
                onClick={handleBrowseClick}
                sx={{
                  backgroundColor: LIME_GREEN,
                  color: "#FFF",
                  textTransform: "none",
                  borderRadius: "10px",
                  px: "28px",
                  py: "7px",
                  fontSize: "14px",
                  fontWeight: 600,
                  boxShadow: "none",
                  mb: 2,
                  "&:hover": {
                    backgroundColor: LIME_HOVER,
                    boxShadow: "none",
                  },
                }}
              >
                Browse
              </Button>

              <Typography
                sx={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#71717A",
                }}
              >
                Supported formats are .csv, .xls, .xlsx
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 2,
                mb: 0.5,
                px: 0.5,
              }}
            >
              <Typography sx={{ fontSize: "12.5px", color: "#4B5563", fontWeight: 500 }}>
                Max leads: 25,000 at a time, file size limit: 3MB.
              </Typography>

              <Typography
                component="span"
                onClick={handleDownloadSampleFile}
                sx={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: LIME_GREEN,
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Download Sample file
              </Typography>
            </Box>
          </Box>
        )}

        {/* STEP 2: FLEXIBLE MIDDLE SCROLLABLE TABLE AREA */}
        {step === "preview" && (
          <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", my: 1 }}>
            {(() => {
              const displayColumns = [
                {
                  id: "contactName",
                  label: "Contact Name",
                  getKey: (row) =>
                    (fieldMapping.contactName ? row.rawObj?.[fieldMapping.contactName] : null) || row.fullName || "-",
                },
                {
                  id: "primaryNumber",
                  label: "Primary Contact Number *",
                  getKey: (row) =>
                    (fieldMapping.primaryNumber ? row.rawObj?.[fieldMapping.primaryNumber] : null) || row.mobileNo || "-",
                },
                {
                  id: "alternateNumber1",
                  label: "Alternate Contact Number 1",
                  getKey: (row) =>
                    fieldMapping.alternateNumber1
                      ? row.rawObj?.[fieldMapping.alternateNumber1] || row.alternateNo || "-"
                      : "-",
                },
                {
                  id: "email",
                  label: "Email Address",
                  getKey: (row) =>
                    fieldMapping.email
                      ? row.rawObj?.[fieldMapping.email] || row.email || "-"
                      : "-",
                },
              ];

              return (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    flex: 1,
                    height: "100%",
                    borderRadius: "14px",
                    border: "1px solid #E2E8F0",
                    overflowY: "auto",
                    overflowX: "auto",
                    mb: 1,
                    "&::-webkit-scrollbar": { width: "8px", height: "8px" },
                    "&::-webkit-scrollbar-track": { backgroundColor: "#F1F5F9", borderRadius: "10px" },
                    "&::-webkit-scrollbar-thumb": { backgroundColor: "#94A3B8", borderRadius: "10px" },
                    "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#84CC16" },
                  }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow sx={{ "& th": { borderBottom: "2px solid #E2E8F0", py: "10px" } }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: "12px", whiteSpace: "nowrap", backgroundColor: "#F8FAFC", color: "#334155" }}>
                          S.No
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "12px", whiteSpace: "nowrap", backgroundColor: "#F8FAFC", color: "#334155" }}>
                          Status
                        </TableCell>

                        {displayColumns.map((col) => (
                          <TableCell
                            key={col.id}
                            sx={{ fontWeight: 700, fontSize: "12px", whiteSpace: "nowrap", backgroundColor: "#F8FAFC", color: "#0F172A" }}
                          >
                            {col.label}
                          </TableCell>
                        ))}

                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: "12px", whiteSpace: "nowrap", backgroundColor: "#F8FAFC", color: "#334155" }}>
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {previewRows.map((row, index) => {
                        const isValid = row.status === "valid";
                        const isUnverified = row.status === "unverified" || !row.status;

                        return (
                          <TableRow
                            key={row.id || index}
                            sx={{
                              backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                              transition: "background-color 0.15s ease",
                              "&:hover": { backgroundColor: "#F7FEE7" },
                              "& td": { py: "8px" },
                            }}
                          >
                            <TableCell sx={{ fontSize: "12.5px", color: "#64748B", fontWeight: 600 }}>
                              {index + 1}
                            </TableCell>
                            <TableCell sx={{ minWidth: "160px" }}>
                              <Tooltip title={row.reason || ""} arrow placement="top">
                                <Chip
                                  size="small"
                                  label={isValid ? "Valid" : isUnverified ? "Unverified" : (row.reason || "Error")}
                                  sx={{
                                    height: "auto",
                                    minHeight: "22px",
                                    py: 0.3,
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    borderRadius: "10px",
                                    maxWidth: "280px",
                                    "& .MuiChip-label": {
                                      whiteSpace: "normal",
                                      wordBreak: "break-word",
                                      px: 1,
                                      py: 0.2,
                                    },
                                    backgroundColor: isValid ? "#DCFCE7" : isUnverified ? "#FEF3C7" : "#FEE2E2",
                                    color: isValid ? "#166534" : isUnverified ? "#92400E" : "#991B1B",
                                  }}
                                />
                              </Tooltip>
                            </TableCell>

                            {displayColumns.map((col) => {
                              const rawVal =
                                col.id === "contactName"
                                  ? row.fullName
                                  : col.id === "primaryNumber"
                                  ? row.mobileNo
                                  : col.id === "alternateNumber1"
                                  ? row.alternateNo
                                  : row.email;
                              const cellVal = rawVal && rawVal !== "-" ? rawVal : "";

                              return (
                                <TableCell key={col.id} sx={{ p: "6px 8px" }}>
                                  <TextField
                                    size="small"
                                    value={cellVal}
                                    placeholder={`Enter ${col.label.replace(" *", "")}`}
                                    onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                    variant="outlined"
                                    sx={{
                                      width: col.id === "email" ? "190px" : col.id === "contactName" ? "160px" : "150px",
                                      "& .MuiOutlinedInput-root": {
                                        fontSize: "12.5px",
                                        fontWeight: col.id === "contactName" || col.id === "primaryNumber" ? 600 : 400,
                                        borderRadius: "8px",
                                        backgroundColor: "#FFFFFF",
                                        "& fieldset": {
                                          borderColor: "#CBD5E1",
                                        },
                                        "&:hover fieldset": {
                                          borderColor: "#94A3B8",
                                        },
                                        "&.Mui-focused fieldset": {
                                          borderColor: "#84CC16",
                                          borderWidth: "1.5px",
                                        },
                                        "& input": {
                                          py: "5px",
                                          px: "10px",
                                        },
                                      },
                                    }}
                                  />
                                </TableCell>
                              );
                            })}

                            <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                              <Tooltip title="Delete record from upload batch">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteRow(row.id)}
                                  sx={{
                                    color: "#EF4444",
                                    p: 0.8,
                                    borderRadius: "8px",
                                    "&:hover": { backgroundColor: "#FEE2E2" },
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {previewRows.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={displayColumns.length + 3}
                            align="center"
                            sx={{ py: 4, color: "#64748B", fontWeight: 500 }}
                          >
                            No lead records in preview table.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </Box>
        )}

        {/* STEP 3: FIXED BOTTOM FOOTER ACTIONS */}
        {step === "preview" && (
          <Box
            sx={{
              flexShrink: 0,
              pt: 2,
              mt: "auto",
              borderTop: "1px solid #F1F5F9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
              onClick={() => setStep("campaign_select")}
              sx={{
                borderColor: "#84CC16",
                color: "#84CC16",
                textTransform: "none",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "14px",
                height: "42px",
                px: 3,
                "&:hover": {
                  backgroundColor: "#F7FEE7",
                  borderColor: "#65A30D",
                },
              }}
            >
              Back to Mapping
            </Button>

            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              {/* Verify Button (Backend API call) */}
              <Button
                variant="outlined"
                onClick={handleBackendVerify}
                disabled={verifying || previewRows.length === 0}
                sx={{
                  borderColor: "#84CC16",
                  color: "#84CC16",
                  textTransform: "none",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "14px",
                  height: "42px",
                  px: 3,
                  "&:hover": {
                    backgroundColor: "#F7FEE7",
                    borderColor: "#65A30D",
                  },
                }}
              >
                {verifying ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} sx={{ color: "#84CC16" }} />
                    <span>Verifying...</span>
                  </Box>
                ) : (
                  "Verify"
                )}
              </Button>

              {/* Submit Button (Enabled ONLY if all rows verified Valid) */}
              <Button
                variant="contained"
                onClick={handleConfirmUpload}
                disabled={uploading || verifying || !isAllValid || previewRows.length === 0}
                sx={{
                  backgroundColor: !isAllValid ? "#94A3B8" : LIME_GREEN,
                  color: "#FFF",
                  textTransform: "none",
                  borderRadius: "10px",
                  height: "42px",
                  px: 4,
                  fontWeight: 700,
                  fontSize: "14px",
                  boxShadow: !isAllValid ? "none" : "0 4px 14px rgba(132, 204, 22, 0.35)",
                  "&:hover": {
                    backgroundColor: !isAllValid ? "#94A3B8" : LIME_HOVER,
                    boxShadow: !isAllValid ? "none" : "0 6px 18px rgba(132, 204, 22, 0.45)",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "#E2E8F0",
                    color: "#94A3B8",
                  },
                }}
              >
                {uploading ? (
                  <CircularProgress size={20} sx={{ color: "#FFF" }} />
                ) : unverifiedCount > 0 ? (
                  "Verify to Submit"
                ) : invalidCount > 0 ? (
                  `Remove Invalid Rows to Submit`
                ) : (
                  `Submit ${previewRows.length} Leads`
                )}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default UploadLeadsModal;
