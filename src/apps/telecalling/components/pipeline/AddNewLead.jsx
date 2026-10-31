import { useEffect, useState } from "react";



import {

  Box,

  Button,

  Dialog,

  DialogTitle,

  DialogContent,

  DialogActions,  // ✅ Add this

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



import { addnewlead } from "@/apps/telecalling/services/addNewLeadService";



// import ImportLeadsDialog from "@/apps/telecalling/components/pipeline/ImportLeads";

import UploadLeadsModal from "@/apps/telecalling/components/pipeline/UploadLeadsModal";

import { getSelectOptions } from "@/shared/services/dropdownService";

import { CATEGORY_ALIAS } from "@/apps/telecalling/components/filters/popup/filterConfig";



const AddNewLead = ({ open, setOpen, refreshPipeline }) => {

  const [campaignOptions, setCampaignOptions] = useState([]);

  const [leadSourceOptions, setLeadSourceOptions] = useState([]);



  const [form, setForm] = useState({

    fullName: "",

    mobileNo: "",

    campaign: "",

    campaign_id: null,

    leadSource: "",

    lead_source_id: null,

    enquiryDate: "",

  });



  const [errors, setErrors] = useState({

    fullName: "",

    mobileNo: "",

    campaign: "",

    leadSource: "",

    enquiryDate: "",

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

        enquiryDate: "",

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

        campaign: "",

        leadSource: "",

        lead_source_id: null,

        enquiryDate: "",

        campaign_id: null,

      });



      setErrors({

        fullName: "",

        mobileNo: "",

        campaign: "",

        leadSource: "",

        enquiryDate: "",

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



      setErrorMessage(errorMsg);

      setErrorDialog(true);

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

    }

  };



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



      {/* ✅ ERROR DIALOG */}

      <Dialog

        open={errorDialog}

        onClose={() => setErrorDialog(false)}

        maxWidth="xs"

        fullWidth

      >

        <DialogTitle

          sx={{

            textAlign: "center",

            fontWeight: 600,

            color: "#d32f2f",

          }}

        ></DialogTitle>



        <DialogContent>

          <Alert severity="error" sx={{ mb: 1 }}>

            {errorMessage}

          </Alert>

          <Typography align="center" variant="body2" color="text.secondary">

            Please try again with different details.

          </Typography>

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

              bgcolor: "#d32f2f",

              textTransform: "none",

              "&:hover": {

                bgcolor: "#b71c1c",

              },

            }}

            onClick={() => {

              setErrorDialog(false);

            }}

          >

            Close

          </Button>

        </DialogActions>

      </Dialog>

    </>

  );

};



export default AddNewLead;

