

import { useEffect, useState } from "react";

import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Collapse,
  IconButton,
} from "@mui/material";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import { getSelectOptions } from "@/shared/services/dropdownService";
import{CATEGORY_ALIAS} from "@/shared/components/filters/popup/filterConfig";

const normalize = (val) => (val || "").toString().trim().toLowerCase();

const LeadSourceSection = ({
  leadData = {},
  formData,
  setFormData,
  isEdit,
  errors: parentErrors = {},
}) => {
  const [open, setOpen] = useState(true);
  const [dropdownOptions, setDropdownOptions] = useState([]); // course_name options
  const [coursePlanOptions, setCoursePlanOptions] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCoursePlanId, setSelectedCoursePlanId] = useState(null);
  const [courseTimingOptions, setCourseTimingOptions] = useState([]);
  const [leadSourceOptions, setLeadSourceOptions] = useState([]);
  const [sourceTypeOptions, setSourceTypeOptions] = useState([]);
  const [preferredTimingOptions, setPreferredTimingOptions] = useState([]);
  const [errors, setErrors] = useState({
    course_name: "",
    course_plan: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    const findByLabel = (options, value) =>
      options.find((item) => normalize(item.label) === normalize(value));

    if (name === "lead_source") {
      const selected = findByLabel(leadSourceOptions, value);

      setFormData((prev) => ({
        ...prev,
        lead_source: value,
        lead_source_id: selected?.value ?? null,
      }));

      return;
    }

    if (name === "campaign_name") {
      const selected = findByLabel(sourceTypeOptions, value);

      setFormData((prev) => ({
        ...prev,
        campaign_name: value,
        campaign_name_id: selected?.value ?? null,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

const handleCourseNameChange = (e) => {
    const courseId = e.target.value;

    const selected = dropdownOptions.find(
        (item) => String(item.value) === String(courseId)
    );

    setErrors((prev) => ({
        ...prev,
        course_name: "",
        course_plan: "",
    }));

    setSelectedCourseId(courseId || null);
    setSelectedCoursePlanId(null);

    // Old plan/timing clear
    setCoursePlanOptions([]);
    setCourseTimingOptions([]);

    setFormData((prev) => ({
        ...prev,

        course_name: selected?.label || "",
        course_name_id: courseId || null,
        course_id: courseId || null,

        course_plan: "",
        course_plan_id: null,

        course_timing: "",
        course_timing_id: null,

        course_fees: null,
    }));
};

const handleCoursePlanChange = (e) => {
    const planId = e.target.value;

    const selected = coursePlanOptions.find(
        (item) => String(item.value) === String(planId)
    );

    setErrors((prev) => ({
        ...prev,
        course_plan: "",
    }));

    setSelectedCoursePlanId(planId || null);

    // Old timing clear
    setCourseTimingOptions([]);

    setFormData((prev) => ({
        ...prev,

        course_plan: selected?.label || "",
        course_plan_id: planId || null,

        course_timing: "",
        course_timing_id: null,

        course_fees: null,
    }));
};

const handleCourseTimingChange = (e) => {
    const timingId = e.target.value;

    const selected = courseTimingOptions.find(
        (item) => String(item.value) === String(timingId)
    );

    setFormData((prev) => ({
        ...prev,

        course_timing: selected?.label || "",
        course_timing_id: timingId || null,

        course_fees:
            selected?.course_fees ??
            prev.course_fees ??
            null,
    }));
};

  const handlePreferredTimingChange = (e) => {
    const id = e.target.value;
    const selected = preferredTimingOptions.find((item) => item.value === id);

    setFormData((prev) => ({
      ...prev,
      preferred_timing: selected?.label || "",
      preferred_timing_id: id,
    }));
  };

  const [seeded, setSeeded] = useState({
    lead_source: false,
    campaign_name: false,
    course_name: false,
    course_plan: false,
    course_timing: false,
  });

  const markSeeded = (key) => setSeeded((prev) => ({ ...prev, [key]: true }));

  useEffect(() => {
    setSelectedCourseId(leadData?.course_name_id ?? null);
    setSelectedCoursePlanId(leadData?.course_plan_id ?? null);
  }, [leadData?.course_name_id, leadData?.course_plan_id]);

  useEffect(() => {
    if (selectedCourseId) {
      getCoursePlanOptions(selectedCourseId);
    } else {
      setCoursePlanOptions([]);
    }
  }, [selectedCourseId]);

useEffect(() => {
    if (selectedCoursePlanId && selectedCourseId) {
        getCourseTimingOptions(
            selectedCoursePlanId,
            selectedCourseId
        );
    } else {
        setCourseTimingOptions([]);
    }
}, [selectedCoursePlanId, selectedCourseId]);

  useEffect(() => {
    getCourseNameOptions(); // Course Name
    getPreferredTimingOptions();
    getLeadSourceOptions();
  }, []);

  useEffect(() => {
    if (!preferredTimingOptions.length || !leadData?.preferred_timing) return;

    const selected = preferredTimingOptions.find(
      (item) =>
        item.label.trim().toLowerCase() ===
        leadData.preferred_timing.trim().toLowerCase(),
    );

    if (selected) {
      setFormData((prev) => ({
        ...prev,
        preferred_timing: selected.label,
        preferred_timing_id: selected.value,
      }));
    }
  }, [preferredTimingOptions, leadData]);

  useEffect(() => {
    if (seeded.course_timing) return;
    if (!courseTimingOptions.length || !leadData?.course_timing) return;

    const selected = courseTimingOptions.find(
      (item) =>
        item.label.trim().toLowerCase() ===
        leadData.course_timing.trim().toLowerCase(),
    );

    if (selected) {
      setFormData((prev) => ({
        ...prev,
        course_timing: selected.label,
        course_timing_id: selected.value,
      }));
    }
  }, [courseTimingOptions, leadData]);

  useEffect(() => {
    if (seeded.course_plan) return;
    if (!coursePlanOptions.length || !leadData?.course_plan) return;

    const selected = coursePlanOptions.find(
      (item) =>
        item.label.trim().toLowerCase() ===
        leadData.course_plan.trim().toLowerCase(),
    );

    if (selected) {
      setSelectedCoursePlanId(selected.value);

      setFormData((prev) => ({
        ...prev,
        course_plan: selected.label,
        course_plan_id: selected.value,
      }));
    }
  }, [coursePlanOptions, leadData]);

  useEffect(() => {
    if (seeded.course_name) return;
    if (!dropdownOptions.length || !leadData?.course_name) return;

    const selected = dropdownOptions.find(
      (item) =>
        item.label.trim().toLowerCase() ===
        leadData.course_name.trim().toLowerCase(),
    );

    if (selected) {
      setSelectedCourseId(selected.value);

      setFormData((prev) => ({
        ...prev,
        course_name: selected.label,
        course_name_id: selected.value,
      }));
    }
  }, [dropdownOptions, leadData]);

  useEffect(() => {
    if (seeded.lead_source) return;
    if (!leadSourceOptions.length || !leadData?.lead_source) return;

    const selected = leadSourceOptions.find(
      (item) =>
        item.label.trim().toLowerCase() ===
        leadData.lead_source.trim().toLowerCase(),
    );

    if (selected) {
      setFormData((prev) => ({
        ...prev,
        lead_source: selected.label,
        lead_source_id: selected.value,
      }));
      setSeeded((prev) => ({ ...prev, lead_source: true })); // ✅ ஒரே ஒரு தடவை மட்டும்
    }
  }, [leadSourceOptions, leadData]);

  useEffect(() => {
    if (seeded.campaign_name) return;
    if (!sourceTypeOptions.length || !leadData?.campaign_name) return;

    const selected = sourceTypeOptions.find(
      (item) =>
        item.label.trim().toLowerCase() ===
        leadData.campaign_name.trim().toLowerCase(),
    );

    if (selected) {
      setFormData((prev) => ({
        ...prev,
        campaign_name: selected.label,
        campaign_name_id: selected.value,
      }));
      markSeeded("campaign_name");
    }
  }, [sourceTypeOptions, leadData]);

  const fieldStyle = {
    "& .MuiOutlinedInput-root": {
      height: "35px !important ",

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
      textTransform: "capitalize",
    },

    "& .MuiInputBase-input::placeholder": {
      color: "#A8A8A8",

      opacity: 1,
    },

    "& .MuiSelect-select": {
      padding: "13px 16px !important",
    },
  };

const getCourseNameOptions = async () => {
    try {
        const response = await getSelectOptions({
            field: CATEGORY_ALIAS.course_name,
        });
        setDropdownOptions(response.data.data || []);
    } catch (error) {
    }
};

const getCoursePlanOptions = async (courseId) => {
    if (!courseId) {
        setCoursePlanOptions([]);
        return;
    }

    try {
        const pipelineId =
            formData?.pipeline_id ||
            leadData?.pipeline_id ||
            leadData?.pipeline_category_id ||
            sessionStorage.getItem(
                "telecalling_pipeline_selected_pipeline"
            ) ||
            0;

        const response = await getSelectOptions({
            field: CATEGORY_ALIAS.course_plan,
            filter_id: "",
            opt_filter: {
                pipeline_id: Number(pipelineId) || 0,
                course_name_id: Number(courseId) || 0,
            },
        });

        const options = response?.data?.data || [];

        setCoursePlanOptions(options);
    } catch (error) {
        console.error("Course Plan Options Error:", error);
        setCoursePlanOptions([]);
    }
};

const getCourseTimingOptions = async (planId, courseId) => {
    if (!courseId || !planId) {
        setCourseTimingOptions([]);
        return;
    }

    try {
        const pipelineId =
            formData?.pipeline_id ||
            leadData?.pipeline_id ||
            leadData?.pipeline_category_id ||
            sessionStorage.getItem(
                "telecalling_pipeline_selected_pipeline"
            ) ||
            0;

        const response = await getSelectOptions({
            field: CATEGORY_ALIAS.course_time,
            filter_id: "",
            opt_filter: {
                pipeline_id: Number(pipelineId) || 0,
                course_name_id: Number(courseId) || 0,
                course_plan_id: Number(planId) || 0,
            },
        });

        const options = response?.data?.data || [];

        setCourseTimingOptions(options);
    } catch (error) {
        console.error("Course Timing Options Error:", error);
        setCourseTimingOptions([]);
    }
};

const getLeadSourceOptions = async () => {
    try {
        const pipelineId =
            formData?.pipeline_id ||
            leadData?.pipeline_id ||
            leadData?.pipeline_category_id ||
            sessionStorage.getItem(
                "telecalling_pipeline_selected_pipeline"
            ) ||
            0;

        const response = await getSelectOptions({
            field: CATEGORY_ALIAS.lead_source,
            filter_id: "",
            opt_filter: {
                pipeline_id: Number(pipelineId) || 0,
            },
        });

        setLeadSourceOptions(response?.data?.data || []);
    } catch (error) {
        console.error("Lead Source Options Error:", error);
        setLeadSourceOptions([]);
    }
};

const getPreferredTimingOptions = async () => {
    try {
        const response = await getSelectOptions({
            field: CATEGORY_ALIAS.preferred_timing,
        });

        setPreferredTimingOptions(response.data.data || []);
    } catch (error) {
    }
};

  const currentCourseNameId =
    formData?.course_name_id ?? leadData?.course_name_id ?? "";

  const currentCoursePlanId =
    formData?.course_plan_id ?? leadData?.course_plan_id ?? "";

  const currentCourseTimingId =
    formData?.course_timing_id ?? leadData?.course_timing_id ?? "";

  const currentPreferredTimingId =
    formData?.preferred_timing_id ?? leadData?.preferred_timing_id ?? "";

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

            gap: 1.5,
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
              fontSize: "17px",

              fontWeight: 700,

              color: "#111",
            }}
          >
            Lead & Source Details
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
          {/* LEFT SIDE */}

          {/* ENQUIRY DATE */}

          <Box>
            <FieldLabel label="Enquiry Date" />

            <TextField
              fullWidth
              type="datetime-local"
              disabled={!isEdit}
              name="enquiry_date"
              value={(
                formData?.enquiry_date ||
                leadData?.enquiry_date ||
                ""
              ).slice(0, 16)}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Box>

          {/* SOURCE STATUS */}

          {/* <Box>
            <FieldLabel label="Current Status" />
            <TextField
              select
              fullWidth
              disabled={!isEdit}
              name="current_status"
              value={formData?.current_status ?? leadData?.current_status ?? ""}
              onChange={handleChange}
              sx={fieldStyle}
              SelectProps={{
                displayEmpty: true,
              }}
            >
              <MenuItem value="">Select</MenuItem>

              <MenuItem value="Studying">Studying</MenuItem>
              <MenuItem value="working">Working</MenuItem>
              <MenuItem value="Loss">Loss</MenuItem>
              <MenuItem value="Follow Up">Follow Up</MenuItem>
            </TextField>
          </Box> */}
          {/* LEAD SOURCE - unchanged (label based, already working) */}

          <Box>
            <FieldLabel label="Lead Source" />
            <TextField
              select
              fullWidth
              disabled={!isEdit}
              name="lead_source"
              value={formData?.lead_source ?? leadData?.lead_source ?? ""}
              onChange={handleChange}
              sx={fieldStyle}
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

          {/* CAMPAIGN NAME - unchanged (label based, already working) */}

          {/* <Box>
            <FieldLabel label="Campaign Name" />

            <TextField
              select
              fullWidth
              disabled={!isEdit}
              name="campaign_name"
              value={formData?.campaign_name ?? leadData?.campaign_name ?? ""}
              onChange={handleChange}
              sx={fieldStyle}
            >
              {sourceTypeOptions.map((item) => (
                <MenuItem
                  key={item.value}
                  value={item.label}
                  sx={{ textTransform: "capitalize" }}
                >
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          </Box> */}

          {/* COURSE NAME - FIXED: id based */}

          <Box>
            <FieldLabel label="Course Name" />
            {/* COURSE NAME */}
            <TextField
              select
              fullWidth
              disabled={!isEdit}
              name="course_name"
              value={currentCourseNameId}
              onChange={handleCourseNameChange}
              error={!!parentErrors?.course_name}
              helperText={parentErrors?.course_name}
              sx={fieldStyle}
              SelectProps={{
                renderValue: () =>
                  formData?.course_name || leadData?.course_name || "",
              }}
            >
              {dropdownOptions.map((item) => (
                <MenuItem
                  key={item.value}
                  value={item.value}
                  sx={{ textTransform: "capitalize" }}
                >
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* RIGHT SIDE */}
          {/* COURSE PLAN - FIXED: id based */}

          {/* COURSE PLAN */}
<Box>
    <FieldLabel label="Course Plan" />

    <TextField
        select
        fullWidth
        disabled={!currentCourseNameId || !isEdit}
        name="course_plan"
        value={currentCoursePlanId}
        onChange={handleCoursePlanChange}
        error={!!parentErrors?.course_plan || !!errors.course_plan}
        helperText={
            parentErrors?.course_plan || errors.course_plan
        }
        sx={fieldStyle}
    >
        {!currentCourseNameId ? (
            <MenuItem value="" disabled>
                Select Course Name first
            </MenuItem>
        ) : coursePlanOptions.length === 0 ? (
            <MenuItem value="" disabled>
                No Course Plan Available
            </MenuItem>
        ) : (
            coursePlanOptions.map((item) => (
                <MenuItem
                    key={item.value}
                    value={item.value}
                    sx={{ textTransform: "capitalize" }}
                >
                    {item.label}
                </MenuItem>
            ))
        )}
    </TextField>
</Box>

          {/* COURSE TIMING - FIXED: id based */}

          <Box>
    <FieldLabel label="Course Timing" />

    <TextField
        select
        fullWidth
        disabled={
            !currentCourseNameId ||
            !currentCoursePlanId ||
            !isEdit
        }
        name="course_timing"
        value={currentCourseTimingId}
        onChange={handleCourseTimingChange}
        error={!!parentErrors?.course_timing}
        helperText={parentErrors?.course_timing}
        sx={fieldStyle}
    >
        {!currentCourseNameId ? (
            <MenuItem value="" disabled>
                Select Course Name first
            </MenuItem>
        ) : !currentCoursePlanId ? (
            <MenuItem value="" disabled>
                Select Course Plan first
            </MenuItem>
        ) : courseTimingOptions.length === 0 ? (
            <MenuItem value="" disabled>
                No Course Timing Available
            </MenuItem>
        ) : (
            courseTimingOptions.map((item) => (
                <MenuItem
                    key={item.value}
                    value={item.value}
                >
                    {item.label}
                </MenuItem>
            ))
        )}
    </TextField>
</Box>

          {/* PREFERRED TIMING - FIXED: id based */}

          <Box>
            <FieldLabel label="Preferred Timing" />

            <TextField
              select
              fullWidth
              disabled={!isEdit}
              name="preferred_timing"
              value={currentPreferredTimingId}
              onChange={handlePreferredTimingChange}
              onMouseDown={getPreferredTimingOptions}
              sx={fieldStyle}
            >
              {preferredTimingOptions.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

const FieldLabel = ({ label }) => {
  return (
    <Typography
      sx={{
        fontSize: "16px",

        fontWeight: 600,

        color: "#4D4D4D",

        mb: 1.2,
      }}
    >
      {label}
    </Typography>
  );
};

export default LeadSourceSection;
