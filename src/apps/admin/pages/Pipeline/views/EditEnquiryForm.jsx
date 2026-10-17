import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Select,
  IconButton,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const BRAND_GREEN = "#90D916";

export const EditEnquiryForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawTitle = searchParams.get("campaign_name") || "";
  const pageTitle = rawTitle
    ? rawTitle.includes("Enquiry")
      ? rawTitle
      : `${rawTitle} Enquiry Sheet`
    : "";

  const [formTitle, setFormTitle] = useState(
    rawTitle ? `${rawTitle} Enquiry Form` : "",
  );
  const [afterSectionRoute, setAfterSectionRoute] = useState("");
  const [questions, setQuestions] = useState([]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { id: Date.now(), label: `Question ${prev.length + 1}`, type: "text" },
    ]);
  };

  const handleClearForm = () => {
    setFormTitle(rawTitle ? `${rawTitle} Enquiry Form` : "");
    setAfterSectionRoute("");
    setQuestions([]);
  };

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 4 },
        py: 3,
        bgcolor: "#F3F4F6",
        minHeight: "100vh",
      }}
    >
      {/* TOP HEADER ROW */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3.5,
        }}
      >
        {/* LEFT: BACK ARROW + CAMPAIGN TITLE */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <IconButton
            onClick={() => navigate(-1)}
            size="small"
            sx={{ color: BRAND_GREEN, p: 0.5 }}
          >
            <ArrowBackIcon sx={{ fontSize: "24px" }} />
          </IconButton>
          <Typography
            sx={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {pageTitle}
          </Typography>
        </Box>

        {/* RIGHT ACTION BUTTONS */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            onClick={handleClearForm}
            sx={{
              height: "36px",
              px: 2.5,
              borderRadius: "6px",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 600,
              border: "1px solid #FCA5A5",
              color: "#EF4444",
              backgroundColor: "#FFFFFF",
              "&:hover": {
                backgroundColor: "#FEF2F2",
                borderColor: "#EF4444",
              },
            }}
          >
            Clear Form
          </Button>

          <Button
            sx={{
              height: "36px",
              px: 2.5,
              borderRadius: "6px",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 600,
              border: "1px solid #818CF8",
              color: "#4F46E5",
              backgroundColor: "#FFFFFF",
              "&:hover": {
                backgroundColor: "#EEF2FF",
                borderColor: "#4F46E5",
              },
            }}
          >
            Create Form
          </Button>

          <Button
            disabled
            sx={{
              height: "36px",
              px: 2.5,
              borderRadius: "6px",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 600,
              backgroundColor: "#CCCCCC",
              color: "#FFFFFF",
              "&.Mui-disabled": {
                backgroundColor: "#CCCCCC",
                color: "#FFFFFF",
              },
            }}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 8px 1fr",
          },
          gap: { xs: 3, md: 4 },
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN: FORM BUILDER CARD */}
        <Box>
          {/* SECTION HEADER BAR */}
          <Box
            sx={{
              backgroundColor: BRAND_GREEN,
              color: "#FFFFFF",
              px: 3,
              py: 1.5,
              borderRadius: "14px 14px 0 0",
            }}
          >
            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              Section 1 of 1
            </Typography>
          </Box>

          {/* SECTION WHITE CONTAINER */}
          <Box
            sx={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderTop: "none",
              borderRadius: "0 0 14px 14px",
              p: 3,
              pb: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            {/* FORM TITLE INPUT ROW */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 3,
              }}
            >
              <TextField
                fullWidth
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    height: "44px",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "#111827",
                    "& fieldset": { borderColor: "#D1D5DB" },
                  },
                }}
              />

              <IconButton
                size="small"
                sx={{
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  p: 1,
                  color: "#6B7280",
                  "&:hover": { backgroundColor: "#F3F4F6" },
                }}
              >
                <ContentCopyIcon sx={{ fontSize: "18px" }} />
              </IconButton>
            </Box>

            {/* ROUTING ROW */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 3,
              }}
            >
              <Typography
                sx={{
                  fontSize: "13.5px",
                  color: "#4B5563",
                  fontWeight: 500,
                }}
              >
                After this section go to
              </Typography>

              <Select
                displayEmpty
                value={afterSectionRoute}
                onChange={(e) => setAfterSectionRoute(e.target.value)}
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <Typography sx={{ color: "#9CA3AF", fontSize: "13.5px" }}>
                        Enter Name
                      </Typography>
                    );
                  }
                  return selected;
                }}
                sx={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: "6px",
                  height: "36px",
                  width: "200px",
                  fontSize: "13.5px",
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                }}
              >
                <MenuItem value="Section 1">Section 1</MenuItem>
                <MenuItem value="Submit Form">Submit Form</MenuItem>
              </Select>
            </Box>

            {/* QUESTIONS LIST */}
            {questions.length > 0 && (
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}
              >
                {questions.map((q, idx) => (
                  <Box
                    key={q.id}
                    sx={{
                      p: 2,
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      backgroundColor: "#F9FAFB",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      {idx + 1}. {q.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* ADD QUESTION BUTTON */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 3,
              }}
            >
              <Button
                onClick={handleAddQuestion}
                sx={{
                  border: "1px solid #D1D5DB",
                  backgroundColor: "#F9FAFB",
                  color: "#374151",
                  borderRadius: "8px",
                  px: 4,
                  py: 0.8,
                  fontSize: "14px",
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#F3F4F6",
                    borderColor: "#9CA3AF",
                  },
                }}
              >
                Add Question
              </Button>
            </Box>
          </Box>
        </Box>

        {/* MIDDLE VERTICAL SEPARATOR BAR */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            width: "6px",
            height: "420px",
            borderRadius: "3px",
            backgroundColor: "#CBD5E1",
            justifySelf: "center",
            mt: 2,
          }}
        />

        {/* RIGHT COLUMN: PREVIEW PANEL */}
        <Box sx={{ pl: { md: 1 } }}>
          <Typography
            sx={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#475569",
              mb: 1,
            }}
          >
            Preview
          </Typography>

          <Box
            sx={{
              borderBottom: "1px solid #CBD5E1",
              mb: 3,
            }}
          />

          <Box
            sx={{
              minHeight: "300px",
              p: 2,
              borderRadius: "8px",
              backgroundColor: "transparent",
            }}
          >
            {/* PREVIEW CONTENT */}
            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#111827",
                mb: 1,
              }}
            >
              {formTitle || pageTitle}
            </Typography>

            {questions.length === 0 ? (
              <Typography sx={{ fontSize: "13.5px", color: "#9CA3AF" }}>
                Form preview will appear here as questions are added.
              </Typography>
            ) : (
              questions.map((q, i) => (
                <Box key={q.id} sx={{ mb: 2 }}>
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#374151",
                      mb: 0.5,
                    }}
                  >
                    {i + 1}. {q.label}
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Enter answer"
                    size="small"
                    disabled
                    sx={{
                      "& .MuiOutlinedInput-root": { backgroundColor: "#FFF" },
                    }}
                  />
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default EditEnquiryForm;
