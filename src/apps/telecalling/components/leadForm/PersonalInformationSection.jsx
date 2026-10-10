import { useEffect, useState } from "react";

import {
    Box,
    Typography,
    TextField,
    Collapse,
    IconButton,
    InputAdornment
} from "@mui/material";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";

const PersonalInformationSection = ({
  leadData = {},
  formData,
  setFormData,
  isEdit,
  errors,
  setErrors,
      pipelines = [],
    selectedPipelineId = 0,
    handlePipelineChange,
}) => {
  const [open, setOpen] = useState(true);

  const [educationOptions, setEducationOptions] = useState([]);

  const getSelectOptions = async () => {
    try {
      const payload = {
        field: "education",
        filter_id: "",
        opt_filter:{"pipeline_id":selectedPipelineId || 0}
      };

      const response = await getSelectOptions(payload);

      setEducationOptions(response.data.data || []);
    } catch (error) {
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "education") {
      setFormData((prev) => ({
        ...prev,
        education: value,
        education_id: null,
      }));
      return;
    }

    let updatedValue = value;

    // Full Name -> letters only
    if (name === "fullname") {
      updatedValue = value.replace(/[^a-zA-Z\s]/g, "");
    }

    // Mobile -> numbers only, max 10 digits
    if (name === "mobile") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);

      setFormData((prev) => ({
        ...prev,
        mobile: numericValue,
      }));

      setErrors((prev) => ({
        ...prev,
        mobile:
          numericValue.length > 0 && numericValue.length < 10
            ? "Mobile number must be 10 digits"
            : "",
      }));

      return;
    }
    // Alternative Mobile -> numbers only, max 10 digits
    if (name === "alternative_mobile") {
      updatedValue = value.replace(/\D/g, "").slice(0, 10);
    }
    // email
    if (name === "email") {
      setFormData((prev) => ({
        ...prev,
        email: value,
      }));

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      setErrors((prev) => ({
        ...prev,
        email:
          value && !emailRegex.test(value) ? "Enter a valid email address" : "",
      }));

      return;
    }
    // Passed Out Year -> numbers only, max 4 digits
    if (name === "passed_out_year") {
      updatedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    if (name === "location") {
      updatedValue = value.replace(/[^a-zA-Z\s]/g, "");
    }

    // Remove error when user types
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: updatedValue,
      };

      return updated;
    });
  };

  const validateForm = () => {
    let tempErrors = {};

    // Full Name Mandatory
    if (!formData?.fullname?.trim()) {
      tempErrors.fullname = "Full Name is required";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullname)) {
      tempErrors.fullname = "Only letters allowed";
    }

    // Mobile Required
    if (!formData?.mobile?.trim()) {
      tempErrors.mobile = "Mobile number is required";
    }
    // Mobile Length
    else if (!/^\d{10}$/.test(formData.mobile)) {
      tempErrors.mobile = "Mobile number must be 10 digits";
    }

    // Alternative Mobile
    if (
      formData?.alternative_mobile &&
      !/^[0-9]{10}$/.test(formData.alternative_mobile)
    ) {
      tempErrors.alternative_mobile = "Enter valid 10 digit mobile number";
    }

    // Email
    if (formData?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      tempErrors.email = "Enter valid email";
    }

    // Passed Out Year
    if (
      formData?.passed_out_year &&
      !/^\d{4}$/.test(formData.passed_out_year)
    ) {
      tempErrors.passed_out_year = "Enter valid year";
    }

    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
  };

  const fieldStyle = {
    "& .MuiOutlinedInput-root": {
      height: "35px !important",

      background: "#F2F2F2",

      borderRadius: "5px",

      fontSize: "14px",

      "& fieldset": {
        border: "0.5px solid #00000017 ",
      },

      "&:hover fieldset": {
        border: "1px solid #ECECEC",
      },

      "&.Mui-focused fieldset": {
        border: "1px solid #90D916",
      },
    },

    "& .MuiInputBase-input": {
      padding: "13px 16px",

      fontSize: "14px",

      color: "#000000",

      fontWeight: 400,
    },

    "& .MuiInputBase-input::placeholder": {
      color: "#A8A8A8",

      opacity: 1,

      fontSize: "14px",
    },

    "& .MuiSelect-select": {
      padding: "13px 16px !important",
    },
  };
  useEffect(() => {
    if (
      educationOptions.length &&
      formData.education &&
      !formData.education_id
    ) {
      const selected = educationOptions.find(
        (item) =>
          item.label.trim().toLowerCase() ===
          formData.education.trim().toLowerCase(),
      );

      if (selected) {
        setFormData((prev) => ({
          ...prev,
          education_id: selected.value,
        }));
      }
    }
  }, [educationOptions]);

  return (
    <Box
      sx={{
        background: "#fff",

        border: "1px solid #D0CCCC",

        borderRadius: "17px",

        px: {
          xs: 2,
          md: 4,
        },

        py: 3,

        mb: 4,
      }}
    >
      {/* HEADER */}

      <Box
        sx={{
          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          cursor: "pointer",
        }}
        onClick={() => setOpen(!open)}
      >
        <Box
          sx={{
            display: "flex",

            alignItems: "center",

            gap: "7px",
          }}
        >
          <PersonOutlineOutlinedIcon
            sx={{
              color: "#90D916",

              fontSize: "24px",
            }}
          />

          <Typography
            sx={{
              fontSize: "18px",

              fontWeight: 600,
            }}
          >
            Personal Information
          </Typography>
        </Box>

        <IconButton
          sx={{
            p: 0,
          }}
        >
          {open ? (
            <KeyboardArrowDownRoundedIcon
              sx={{
                fontSize: "28px",

                color: "#000000",
              }}
            />
          ) : (
            <KeyboardArrowUpRoundedIcon
              sx={{
                fontSize: "28px",

                color: "#000000",
              }}
            />
          )}
        </IconButton>
      </Box>

      {/* BODY */}

      <Collapse in={open}>
        <Box
          sx={{
            mt: 3,

            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
            },

            columnGap: "30px",

            rowGap: "24px",
          }}
        >
          {/* FULL NAME */}

          <Box>
            <FieldLabel label="Full Name" />

            <TextField
              fullWidth
              placeholder="Enter Name"
              name="fullname"
              disabled={!isEdit}
              error={!!errors.fullname}
              helperText={errors.fullname}
              value={formData?.fullname ?? leadData?.full_name ?? ""}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Box>

          {/* MOBILE */}

          {/* MOBILE */}

          <Box>
            <FieldLabel label="Mobile No*" />

            <TextField
              fullWidth
              placeholder="Enter Mobile No"
              disabled={!isEdit}
              name="mobile"
              value={(formData?.mobile ?? leadData?.mobile_no ?? "")
                .toString()
                .replace(/^\+?91/, "")}
              onChange={handleChange}
              error={!!errors.mobile}
              helperText={errors.mobile}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{
                        height: "100%",
                        maxHeight: "none",
                        alignItems: "center",
                        display: "flex",
                        marginRight: "8px",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#444",
                          borderRight: "1px solid #D9D9D9",
                          paddingRight: "8px",
                          lineHeight: "normal",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        +91
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                ...fieldStyle,
                "& .MuiOutlinedInput-root": {
                  ...fieldStyle["& .MuiOutlinedInput-root"],
                  alignItems: "center", // ✅ ADD
                  display: "flex",
                  paddingLeft: "10px",
                },
                "& .MuiInputBase-input": {
                  ...fieldStyle["& .MuiInputBase-input"],
                  padding: "0 !important",
                  paddingLeft: "0 !important",
                },
              }}
            />
          </Box>

          {/* ALT MOBILE */}

          {/* ALT MOBILE */}

          <Box>
            <FieldLabel label="Alternative Mobile No" />

            <TextField
              fullWidth
              placeholder="Optional"
              disabled={!isEdit}
              name="alternative_mobile"
              error={!!errors.alternative_mobile}
              helperText={errors.alternative_mobile}
              value={(
                formData?.alternative_mobile ??
                leadData?.alternative_mobile ??
                ""
              )
                .toString()
                .replace(/^\+?91/, "")}
              onChange={handleChange}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{
                        height: "100%",
                        maxHeight: "none",
                        alignItems: "center",
                        display: "flex",
                        marginRight: "8px",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#444",
                          borderRight: "1px solid #D9D9D9",
                          paddingRight: "8px",
                          lineHeight: "normal",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        +91
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                ...fieldStyle,
                "& .MuiOutlinedInput-root": {
                  ...fieldStyle["& .MuiOutlinedInput-root"],
                  alignItems: "center",
                  display: "flex",
                  paddingLeft: "10px",
                },
                "& .MuiInputBase-input": {
                  ...fieldStyle["& .MuiInputBase-input"],
                  padding: "0 !important",
                  paddingLeft: "0 !important",
                },
              }}
            />
          </Box>

          {/* EMAIL */}

          <Box>
            <FieldLabel label="Email Id" />

            <TextField
              fullWidth
              placeholder="Enter Mail id"
              disabled={!isEdit}
              name="email"
              value={formData?.email ?? leadData?.email ?? ""}
              error={!!errors.email}
              helperText={errors.email}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Box>

          {/* LOCATION */}

          <Box>
            <FieldLabel label="Location" />

            <TextField
              fullWidth
              placeholder="Enter City"
              disabled={!isEdit}
              name="location"
              error={!!errors.location}
              helperText={errors.location}
              value={formData?.location ?? leadData?.location ?? ""}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Box>

          {/* EDUCATION */}

          <Box>
            <FieldLabel label="Education" />
            <TextField
              fullWidth
              placeholder="Enter Education (e.g. B.E, B.Sc, MBA)"
              disabled={!isEdit}
              name="education"
              value={formData?.education ?? leadData?.education ?? ""}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Box>

          {/* PASSED OUT YEAR */}

          <Box>
            <FieldLabel label="Passed Out Year" />

            <TextField
              fullWidth
              type="number"
              placeholder="****"
              name="passed_out_year"
              disabled={!isEdit}
              error={!!errors.passed_out_year}
              helperText={errors.passed_out_year}
              value={
                formData?.passed_out_year ?? leadData?.passed_out_year ?? ""
              }
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Box>

          {/* EXPERIENCE */}

          <Box>
            <FieldLabel label="Experience" />

            <TextField
              fullWidth
              placeholder="Experience"
              disabled={!isEdit}
              name="experience"
              value={formData?.experience ?? leadData?.experience ?? ""}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

const FieldLabel = ({ label, sx }) => {
  return (
    <Typography
      sx={{
        fontSize: "16px",

        fontWeight: 600,

        color: "#4D4D4D",

        mb: 1.2,
        ...sx,
      }}
    >
      {label}
    </Typography>
  );
};

export default PersonalInformationSection;
