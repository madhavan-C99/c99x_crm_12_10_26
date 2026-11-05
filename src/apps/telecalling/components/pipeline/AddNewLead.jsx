import { useEffect, useState } from "react";



import {

  Box,

  Button,

  Dialog,

  DialogTitle,

  DialogContent,

  DialogActions,
  Backdrop,  // ✅ Add this

  TextField,

  MenuItem,

  IconButton,

  Typography,

  InputAdornment,

  Alert,  // ✅ Add this for better error display

} from "@mui/material";



import CloseIcon from "@mui/icons-material/Close";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";



import { addnewlead } from "@/apps/telecalling/services/addNewLeadService";



// import ImportLeadsDialog from "@/apps/telecalling/components/pipeline/ImportLeads";

import UploadLeadsModal from "@/apps/telecalling/components/pipeline/UploadLeadsModal";

import { getSelectOptions } from "@/shared/services/dropdownService";

import { CATEGORY_ALIAS } from "@/apps/telecalling/components/filters/popup/filterConfig";



const getTodayDate = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const AddNewLead = ({ open, setOpen, refreshPipeline }) => {

  const [campaignOptions, setCampaignOptions] = useState([]);

  const [leadSourceOptions, setLeadSourceOptions] = useState([]);



  const [form, setForm] = useState({

    fullName: "",

    mobileNo: "",
    altMobileNo: "",

    campaign: "",

    campaign_id: null,

    leadSource: "",

    lead_source_id: null,

    enquiryDate: getTodayDate(),

  });



  const [errors, setErrors] = useState({

    fullName: "",

    mobileNo: "",
    altMobileNo: "",

    campaign: "",

    leadSource: "",

    // enquiryDate: getTodayDate(),

  });



  const [successDialog, setSuccessDialog] = useState(false);

  const [importDialog, setImportDialog] = useState(false);



  // ✅ Error Dialog state

  const [errorDialog, setErrorDialog] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");



  const handleClose = () => {

    setOpen(false);

  };



  const handleChange = (e) => {

    const { name, value } = e.target;



    if (name === "fullName") {

      const onlyLetters = value.replace(/[^a-zA-Z\s]/g, "");



      setForm({

        ...form,

        fullName: onlyLetters,

      });



      setErrors({

        ...errors,

        fullName: "",

      });



      return;

    }



    if (name === "mobileNo") {

      const onlyDigits = value.replace(/\D/g, "").slice(0, 10);



      setForm({

        ...form,

        mobileNo: onlyDigits,

      });



      setErrors({

        ...errors,

        mobileNo:

          onlyDigits.length !== 10 && onlyDigits.length > 0

            ? "Mobile number must be 10 digits"

            : "",

      });



      return;

    }



    if (name === "altMobileNo") {
      const onlyDigits = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({
        ...prev,
        altMobileNo: onlyDigits,
      }));
      setErrors((prev) => ({
        ...prev,
        altMobileNo:
          onlyDigits.length !== 10 && onlyDigits.length > 0
            ? "Alternate mobile number must be 10 digits"
            : "",
      }));
      return;
    }

    if (name === "campaign") {

      const selected = campaignOptions.find((item) => item.label === value);



      setForm((prev) => ({

        ...prev,

        campaign: value,

        campaign_id: selected?.value || null,

      }));



      setErrors((prev) => ({

        ...prev,

        campaign: value ? "" : "Please select a campaign",

      }));



      getCampaignOptions();

      return;

    }



    if (name === "leadSource") {

      const selected = leadSourceOptions.find((item) => item.label === value);



      setForm((prev) => ({

        ...prev,

        leadSource: value,

        lead_source_id: selected?.value || null,

      }));



      setErrors((prev) => ({

        ...prev,

        leadSource: "",

      }));



      return;

    }



    if (name === "enquiryDate") {

      setForm((prev) => ({

        ...prev,

        enquiryDate: value,

      }));



      setErrors((prev) => ({

        ...prev,

        enquiryDate: getTodayDate(),

      }));



      return;

    }



    setForm({

      ...form,

      [name]: value,

    });

  };



  const handleSave = async () => {

    const tempErrors = {};



    if (!form.fullName || !form.fullName.trim()) {
      tempErrors.fullName = "Full name is required";
    }

    if (form.altMobileNo && form.altMobileNo.length !== 10) {
      tempErrors.altMobileNo = "Alternate mobile number must be 10 digits";
    }

    if (form.mobileNo.length !== 10) {

      tempErrors.mobileNo = "Mobile number must be 10 digits";

    }



    if (!form.campaign || !form.campaign_id) {

      tempErrors.campaign = "Please select a campaign";

    }



    setErrors(tempErrors);



    if (Object.keys(tempErrors).length > 0) {

      return;

    }



    try {

      const selectedPipeline = sessionStorage.getItem(

        "telecalling_pipeline_selected_pipeline"

      );

      const payload = {

        full_name: form.fullName || "",

        mobile_no: `+91${form.mobileNo}`,
        alternative_mobile: form.altMobileNo ? `+91${form.altMobileNo}` : null,

        campaign_id: form.campaign_id,

        lead_source_id: form.lead_source_id,

        enquiry_date: form.enquiryDate || null,

        pipeline_id: selectedPipeline ? Number(selectedPipeline) : null,

      };



      await addnewlead(payload);

      refreshPipeline();



      setSuccessDialog(true);



      setForm({

        fullName: "",

        mobileNo: "",
    altMobileNo: "",

        campaign: "",

        leadSource: "",

        lead_source_id: null,

        enquiryDate: getTodayDate(),

        campaign_id: null,

      });



      setErrors({

        fullName: "",

        mobileNo: "",
    altMobileNo: "",

        campaign: "",

        leadSource: "",

        enquiryDate: getTodayDate(),

      });

    } catch (err) {



      // ✅ Extract error message from response

      let errorMsg = "Error while adding lead";



      if (err.response) {

        // If error response has detail field

        if (err.response.data?.detail) {

          errorMsg = err.response.data.detail;

        }

        // If error response has message field

        else if (err.response.data?.message) {

          errorMsg = err.response.data.message;

        }

        // If error response has error field

        else if (err.response.data?.error) {

          errorMsg = err.response.data.error;

        }

        // If backend returns array of errors

        else if (typeof err.response.data === "object") {

          const firstError = Object.values(err.response.data)[0];

          if (Array.isArray(firstError)) {

            errorMsg = firstError[0];

          }

        }

      }



      const lower = String(errorMsg).toLowerCase();
      const isDuplicate =
        lower.includes("already exists") ||
        lower.includes("already exist") ||
        lower.includes("already assigned") ||
        lower.includes("exists in");

      if (isDuplicate) {
        setErrorMessage(errorMsg);
        setErrorDialog(true);
      } else {
        const respData = err.response?.data;
        const fieldErrors = {};
        if (typeof respData?.message === "object" && !Array.isArray(respData.message)) {
          Object.entries(respData.message).forEach(([k, v]) => {
            const msg = Array.isArray(v) ? v[0] : String(v);
            if (k === "mobile_no" || k === "mobile") fieldErrors.mobileNo = msg;
            else if (k === "alternative_mobile" || k === "alt_mobile") fieldErrors.altMobileNo = msg;
            else if (k === "full_name" || k === "name") fieldErrors.fullName = msg;
            else if (k === "campaign" || k === "campaign_id") fieldErrors.campaign = msg;
            else if (k === "lead_source" || k === "lead_source_id") fieldErrors.leadSource = msg;
            else if (k === "enquiry_date") fieldErrors.enquiryDate = msg;
          });
        } else {
          if (lower.includes("alternate") || lower.includes("alt")) {
            fieldErrors.altMobileNo = errorMsg;
          } else if (lower.includes("mobile") || lower.includes("phone")) {
            fieldErrors.mobileNo = errorMsg;
          } else if (lower.includes("name") || lower.includes("student")) {
            fieldErrors.fullName = errorMsg;
          } else if (lower.includes("campaign")) {
            fieldErrors.campaign = errorMsg;
          } else if (lower.includes("source")) {
            fieldErrors.leadSource = errorMsg;
          } else if (lower.includes("date") || lower.includes("enquiry")) {
            fieldErrors.enquiryDate = errorMsg;
          } else {
            setErrorMessage(errorMsg);
            setErrorDialog(true);
            return;
          }
        }
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }


    }

  };

  const getLeadSourceOptions = async () => {

    try {

      // get_select_options payload: { field, opt_filter }

      const payload = {

        field: CATEGORY_ALIAS.lead_source,

        opt_filter: {},

      };

      const response = await getSelectOptions(payload);

      setLeadSourceOptions(response.data.data || []);

    } catch (error) {
      console.error("Failed to fetch lead source options:", error);
    }

  };

  const getCampaignOptions = async () => {

    try {

      // get_select_options payload: { field, opt_filter }

      const payload = {

        field: CATEGORY_ALIAS.campaign_name,

        opt_filter: {},

      };



      const response = await getSelectOptions(payload);



      setCampaignOptions(response.data.data || []);

    } catch (error) {
      console.error("Failed to fetch campaign options:", error);
    }

  };



    useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...prev,
        enquiryDate: prev.enquiryDate || getTodayDate(),
      }));
    }
  }, [open]);

useEffect(() => {

    getCampaignOptions();

    getLeadSourceOptions();

  }, []);



  return (

    <>

      <Dialog

        open={open}

        onClose={handleClose}

        fullWidth

        maxWidth={false}

        disableEnforceFocus

        sx={{

          "& .MuiDialog-paper": {

            width: {

              xs: "100%",

              sm: "420px",

              md: "435px",

            },



            maxWidth: {

              xs: "calc(100vw - 32px)",

              sm: "435px",

            },



            borderRadius: {

              xs: "8px",

              sm: "10px",

            },

            maxHeight: {

              xs: "90vh",

              sm: "calc(100% - 64px)",

            },

            p: 0,

            // overflow: "auto",

            // overflowY:"auto",

            background: "#FFFFFF",

            m: {

              xs: 1.5,

              sm: 2,

            },

          },

        }}

      >

        <DialogTitle

          sx={{

            px: {

              xs: 2,

              sm: 4,

            },



            pt: {

              xs: 1,

              sm: 1,

            },



            pb: 0,



            display: "flex",

            justifyContent: "space-between",

            alignItems: "flex-start",

          }}

        >

          <Typography

            sx={{

              fontSize: {

                xs: "16px",

                sm: "18px",

              },



              fontWeight: 600,

              color: "#111",

            }}

          >

            Add New Lead

          </Typography>



          <IconButton

            onClick={handleClose}

            sx={{

              p: 0,

            }}

          >

            <CloseIcon

              sx={{

                fontSize: {

                  xs: "22px",

                  sm: "25px",

                },



                color: "#111",

              }}

            />

          </IconButton>

        </DialogTitle>



        <Typography

          sx={{

            fontSize: {

              xs: "13px",

              sm: "14px",

            },



            color: "#444",



            px: {

              xs: 2,

              sm: 4,

            },

          }}

        >

          Enter the lead details below to add them to the pipeline.

        </Typography>



        <DialogContent

          sx={{

            px: {

              xs: 2,

              sm: 4,

            },



            pt: 1,



            pb: {

              xs: 2,

              sm: 3,

            },



            // overflow: "hidden",

          }}

        >

          <Box sx={{ mb: 2, mt: 1 }}>

            <Typography

              sx={{

                fontSize: {

                  xs: "14px",

                  sm: "16px",

                },



                fontWeight: 600,

                color: "#444",

                mb: 1,

              }}

            >

              Full Name

            </Typography>



            <TextField

              fullWidth

              name="fullName"

              value={form.fullName}

              onChange={handleChange}

              placeholder="Enter Full Name"

              error={!!errors.fullName}

              helperText={errors.fullName}

              sx={{

                "& .MuiOutlinedInput-root": {

                  height: "35px",



                  borderRadius: "5px",

                  background: "#F2F2F2",

                  fontSize: "14px",

                  fontWeight: 500,



                  "& fieldset": {

                    borderColor: errors.fullName ? "#FF4D4F" : "#D9D9D9",

                  },



                  "&:hover fieldset": {

                    borderColor: errors.fullName ? "#FF4D4F" : "#D9D9D9",

                  },



                  "&.Mui-focused fieldset": {

                    borderColor: errors.fullName

                      ? "#FF4D4F !important"

                      : "#90D916 !important",



                    borderWidth: "1.5px",

                  },

                },

              }}

            />

          </Box>



          <Box sx={{ mb: 2 }}>

            <Typography

              sx={{

                fontSize: { xs: "14px", sm: "16px" },

                fontWeight: 600,

                color: "#444",

                mb: 1,

              }}

            >

              Mobile No *

            </Typography>



            <TextField

              fullWidth

              name="mobileNo"

              value={form.mobileNo}

              onChange={handleChange}

              placeholder="Enter Mobile No"

              error={!!errors.mobileNo}

              helperText={errors.mobileNo}

              slotProps={{

                input: {

                  startAdornment: (

                    <InputAdornment position="start">

                      <Typography

                        sx={{

                          fontSize: "14px",

                          fontWeight: 500,

                          color: "#444",

                          borderRight: "1px solid #D9D9D9",

                          pr: 1,

                          mr: 0.5,

                        }}

                      >

                        +91

                      </Typography>

                    </InputAdornment>

                  ),

                },

              }}

              sx={{

                "& .MuiOutlinedInput-root": {

                  height: "35px",

                  borderRadius: "5px",

                  background: "#F2F2F2",

                  fontSize: "14px",

                  fontWeight: 500,



                  "& fieldset": {

                    borderColor: errors.mobileNo ? "#FF4D4F" : "#D9D9D9",

                  },



                  "&:hover fieldset": {

                    borderColor: errors.mobileNo ? "#FF4D4F" : "#D9D9D9",

                  },



                  "&.Mui-focused fieldset": {

                    borderColor: errors.mobileNo

                      ? "#FF4D4F !important"

                      : "#84C318 !important",

                    borderWidth: "2px",

                  },

                },

              }}

            />

          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: { xs: "14px", sm: "16px" },
                fontWeight: 600,
                color: "#444",
                mb: 1,
              }}
            >
              Alternate Mobile No
            </Typography>

            <TextField
              fullWidth
              name="altMobileNo"
              value={form.altMobileNo}
              onChange={handleChange}
              placeholder="Enter Alternate Mobile No"
              error={!!errors.altMobileNo}
              helperText={errors.altMobileNo}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#444",
                          borderRight: "1px solid #D9D9D9",
                          pr: 1,
                          mr: 0.5,
                        }}
                      >
                        +91
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: "35px",
                  borderRadius: "5px",
                  background: "#F2F2F2",
                  fontSize: "14px",
                  fontWeight: 500,
                  "& fieldset": {
                    borderColor: errors.altMobileNo ? "#FF4D4F" : "#D9D9D9",
                  },
                  "&:hover fieldset": {
                    borderColor: errors.altMobileNo ? "#FF4D4F" : "#D9D9D9",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: errors.altMobileNo
                      ? "#FF4D4F !important"
                      : "#84C318 !important",
                    borderWidth: "2px",
                  },
                },
              }}
            />
          </Box>

          {/* --- Lead Source Dropdown --- */}

          <Box sx={{ mb: 2 }}>

            <Typography

              sx={{

                fontSize: { xs: "14px", sm: "16px" },

                fontWeight: 600,

                color: "#444",

                mb: 1,

              }}

            >

              Lead Source

            </Typography>



            <TextField

              select

              fullWidth

              name="leadSource"

              value={form.leadSource}

              onChange={handleChange}

              error={!!errors.leadSource}

              helperText={errors.leadSource}

              onMouseDown={() => {

                if (leadSourceOptions.length === 0) {

                  getLeadSourceOptions();

                }

              }}

              SelectProps={{

                IconComponent: KeyboardArrowDownRoundedIcon,

              }}

              sx={{

                "& .MuiOutlinedInput-root": {

                  height: "35px",

                  borderRadius: "5px",

                  background: "#F2F2F2",

                  textTransform: "capitalize",

                },

              }}

            >

              {leadSourceOptions.map((item) => (

                <MenuItem

                  key={item.value}

                  value={item.label}

                  sx={{ textTransform: "capitalize" }}

                >

                  {item.label}

                </MenuItem>

              ))}

            </TextField>

          </Box>



          <Box sx={{ mb: 2 }}>

            <Typography

              sx={{

                fontSize: {

                  xs: "14px",

                  sm: "16px",

                },



                fontWeight: 600,

                color: "#444",

                mb: 1,

              }}

            >

              Campaigns *

            </Typography>



            <TextField

              select

              fullWidth

              name="campaign"

              value={form.campaign}

              onChange={handleChange}

              error={!!errors.campaign}

              helperText={errors.campaign}

              onMouseDown={() => {

                if (campaignOptions.length === 0) {

                  getCampaignOptions();

                }

              }}

              SelectProps={{

                IconComponent: KeyboardArrowDownRoundedIcon,

              }}

              sx={{

                "& .MuiOutlinedInput-root": {

                  height: "35px",

                  borderRadius: "5px",

                  background: "#F2F2F2",

                  textTransform: "capitalize",

                },

              }}

            >

              {campaignOptions.map((item) => (

                <MenuItem

                  key={item.value}

                  value={item.label}

                  sx={{ textTransform: "capitalize" }}

                >

                  {item.label}

                </MenuItem>

              ))}

            </TextField>

          </Box>



          <Box>

            <Typography

              sx={{

                fontSize: {

                  xs: "14px",

                  sm: "16px",

                },



                fontWeight: 600,

                color: "#444",

                mb: 1,

              }}

            >

              Enquiry Date

            </Typography>



            <TextField

              fullWidth

              type="date"

              name="enquiryDate"

              value={form.enquiryDate}

              onChange={handleChange}

              error={!!errors.enquiryDate}

              helperText={errors.enquiryDate}

              slotProps={{

                inputLabel: {

                  shrink: true,

                },

              }}

              sx={{

                "& .MuiOutlinedInput-root": {

                  height: "35px",



                  borderRadius: "5px",

                  background: "#F2F2F2",

                  fontSize: "14px",

                  fontWeight: 500,



                  "& fieldset": {

                    borderColor: "#D9D9D9",

                  },



                  "&:hover fieldset": {

                    borderColor: "#D9D9D9",

                  },



                  "&.Mui-focused fieldset": {

                    borderColor: "#84C318 !important",

                    borderWidth: "2px",

                  },

                },

              }}

            />

          </Box>



          <Box

            sx={{

              display: "flex",

              justifyContent: "space-between",



              gap: 2,



              mt: {

                xs: 2,

                sm: 2,

              },



              flexWrap: {

                xs: "wrap",

                sm: "nowrap",

              },

            }}

          >

            <Button

              variant="outlined"

              onClick={() => setImportDialog(true)}

              startIcon={

                <FileDownloadOutlinedIcon

                  sx={{

                    fontSize: "18px",

                  }}

                />

              }

              sx={{

                width: {

                  xs: "45%",

                },



                height: "31px",



                borderRadius: "5px",

                border: "1px solid #90D916",

                color: "#4D4D4D",

                background: "#F4FFD9",

                fontWeight: 600,

                textTransform: "none",

                fontSize: "14px",



                "&:hover": {

                  border: "1px solid #84C318",

                  background: "#EEFDD2",

                },

              }}

            >

              Upload

            </Button>



            <Button

              variant="contained"

              onClick={handleSave}

              sx={{

                width: {

                  xs: "45%",

                },



                height: "31px",



                borderRadius: "5px",

                background: "#90D916",

                fontWeight: 600,

                textTransform: "none",

                boxShadow: "none",

                color: "#FFFFFF",



                "&:hover": {

                  background: "#74B010",

                  boxShadow: "none",

                },

              }}

            >

              Save

            </Button>

          </Box>

        </DialogContent>

      </Dialog>



      {/* <ImportLeadsDialog

        open={importDialog}

        onClose={() => setImportDialog(false)}

        refreshPipeline={refreshPipeline}

        onUploadSuccess={() => setSuccessDialog(true)}

      /> */}



    

<UploadLeadsModal

  open={importDialog}

  onClose={() => setImportDialog(false)}

  refreshPipeline={refreshPipeline}

  onUploadSuccess={() => {

    setImportDialog(false);

    setOpen(false);

  }}

/>



      {/* ✅ SUCCESS DIALOG */}

      <Dialog

        open={successDialog}

        onClose={() => setSuccessDialog(false)}

        maxWidth="xs"

        fullWidth

      >

        <DialogTitle

          sx={{

            textAlign: "center",

            fontWeight: 600,

          }}

        >

          Success

        </DialogTitle>



        <DialogContent>

          <Typography align="center">Lead added successfully.</Typography>

        </DialogContent>



        <DialogActions

          sx={{

            justifyContent: "center",

            pb: 2,

          }}

        >

          <Button

            variant="contained"

            sx={{

              bgcolor: "#90D916",

              textTransform: "none",

            }}

            onClick={() => {

              setSuccessDialog(false);

              setOpen(false);

            }}

          >

            OK

          </Button>

        </DialogActions>

      </Dialog>



      {/* Modern Duplicate / Error Dialog */}
      <Dialog
        open={errorDialog}
        onClose={() => setErrorDialog(false)}
        maxWidth="xs"
        fullWidth
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 250,
            sx: {
              backgroundColor: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(4px)",
            },
          },
          paper: {
            sx: {
              borderRadius: "20px",
              p: { xs: 2.5, sm: 3 },
              m: 2,
              textAlign: "center",
              position: "relative",
              boxShadow: "0 25px 50px -12px rgba(220, 38, 38, 0.18), 0 10px 25px -5px rgba(0, 0, 0, 0.08)",
              border: "1px solid #FEE2E2",
              background: "#FFFFFF",
              overflow: "hidden",
            },
          },
        }}
      >
        {/* Top Right Close Button */}
        <IconButton
          onClick={() => setErrorDialog(false)}
          size="small"
          aria-label="Close"
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            color: "#94A3B8",
            bgcolor: "#F8FAFC",
            border: "1px solid #F1F5F9",
            transition: "all 0.2s ease",
            "&:hover": {
              color: "#334155",
              bgcolor: "#F1F5F9",
              transform: "rotate(90deg)",
            },
          }}
        >
          <CloseIcon sx={{ fontSize: 17 }} />
        </IconButton>

        <DialogContent sx={{ p: 0, pt: 1 }}>
          {/* Animated Glowing Icon Badge */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#FEF2F2",
                border: "2px solid #FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 0 8px rgba(239, 68, 68, 0.08)",
              }}
            >
              <ErrorOutlineRoundedIcon sx={{ fontSize: 34, color: "#DC2626" }} />
            </Box>
          </Box>

          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: "19px",
              color: "#0F172A",
              mb: 1.2,
            }}
          >
            Lead Already Exists
          </Typography>

          {/* Styled Message Card */}
          <Box
            sx={{
              bgcolor: "#FFF1F2",
              border: "1px solid #FFE4E6",
              borderRadius: "12px",
              p: 1.75,
              mb: 2,
              textAlign: "left",
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
            }}
          >
            <ReportProblemOutlinedIcon sx={{ fontSize: 20, color: "#E11D48", mt: 0.2, flexShrink: 0 }} />
            <Typography
              sx={{
                fontSize: "13px",
                lineHeight: 1.55,
                color: "#9F1239",
                fontWeight: 500,
              }}
            >
              {errorMessage}
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              fontSize: "12.5px",
              color: "#64748B",
              mb: 2.5,
              lineHeight: 1.5,
            }}
          >
            Please try again with a different number or verify with the assigned telecaller.
          </Typography>

          {/* Close Action Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={() => setErrorDialog(false)}
            sx={{
              bgcolor: "#DC2626",
              color: "#FFFFFF",
              borderRadius: "10px",
              py: 1.15,
              fontSize: "13.5px",
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
              "&:hover": {
                bgcolor: "#B91C1C",
                boxShadow: "0 6px 16px rgba(220, 38, 38, 0.35)",
              },
            }}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog></>

  );

};



export default AddNewLead;

