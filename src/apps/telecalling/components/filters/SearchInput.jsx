import { Box, TextField, IconButton } from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { controlFieldSx } from "@/shared/components/filters/filterStyles";

export default function SearchInput({
  value = "",
  onChange,
  onSearch,
  placeholder = "Search by name, phone, course......",
}) {
  const handleClear = () => {
    if (onChange) onChange("");
    if (onSearch) onSearch("");
  };

  return (
    <Box
      sx={{
        position: "relative",
        minWidth: { xs: "100%", md: "350px" },
        flex: 1,
      }}
    >
      <SearchOutlinedIcon
        onClick={() => onSearch && onSearch(value)}
        sx={{
          position: "absolute",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#9E9E9E",
          fontSize: "18px",
          zIndex: 2,
          cursor: "pointer",
          "&:hover": { color: "#0205C8" },
        }}
      />
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSearch) {
            e.preventDefault();
            onSearch(value);
          }
        }}
        sx={{
          ...controlFieldSx,
          "& .MuiOutlinedInput-root": {
            ...controlFieldSx["& .MuiOutlinedInput-root"],
            pl: "28px",
            pr: value ? "36px" : "14px",
          },
          "& input::placeholder": {
            color: "#9E9E9E",
            opacity: 1,
            fontSize: "14px",
          },
        }}
      />
      {value ? (
        <IconButton
          size="small"
          onClick={handleClear}
          sx={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9E9E9E",
            p: 0.5,
            zIndex: 2,
            "&:hover": { color: "#333" },
          }}
        >
          <CancelOutlinedIcon sx={{ fontSize: "16px" }} />
        </IconButton>
      ) : null}
    </Box>
  );
}
