import { Box, TextField } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined"; // icon kept as in the original design
import { controlFieldSx } from "./filterStyles";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search by name, phone, course......",
}) {
  return (
    <Box
      sx={{
        position: "relative",
        minWidth: { xs: "100%", md: "350px" },
        flex: 1,
      }}
    >
      <AddOutlinedIcon
        sx={{
          position: "absolute",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#9E9E9E",
          fontSize: "18px",
          zIndex: 1,
        }}
      />
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          ...controlFieldSx,
          "& .MuiOutlinedInput-root": {
            ...controlFieldSx["& .MuiOutlinedInput-root"],
            pl: "28px",
          },
          "& input::placeholder": {
            color: "#9E9E9E",
            opacity: 1,
            fontSize: "14px",
          },
        }}
      />
    </Box>
  );
}
