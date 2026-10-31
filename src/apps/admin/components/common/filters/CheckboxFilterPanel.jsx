import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
} from "@mui/material";

function CheckboxFilterPanel({ title, options = [], defaultSelected = [], onApply }) {
  const [selected, setSelected] = useState(defaultSelected);

  // 🌟 PRESERVE SELECTED VALUES WHEN RE-OPENED
  useEffect(() => {
    setSelected(defaultSelected);
  }, [defaultSelected]);

  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      const val =
        opt.name ||
        opt.label ||
        opt.user_name ||
        opt.stage_name ||
        String(opt.id || "");
      const label =
        opt.label ||
        opt.name ||
        opt.user_name ||
        opt.stage_name ||
        String(opt.id || "");
      return { val, label };
    }
    return { val: opt, label: opt };
  });

  const allChecked =
    normalizedOptions.length > 0 && selected.length === normalizedOptions.length;

  const toggleAll = () => {
    setSelected(allChecked ? [] : normalizedOptions.map((o) => o.val));
  };

  const toggleOne = (optVal) => {
    setSelected((prev) =>
      prev.includes(optVal)
        ? prev.filter((s) => s !== optVal)
        : [...prev, optVal]
    );
  };

  return (
    <Box
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        maxHeight: "300px",
        boxSizing: "border-box",
      }}
    >
      <Typography
        sx={{
          color: "#8BC34A",
          fontWeight: 700,
          fontSize: 14,
          mb: 1,
          flexShrink: 0,
        }}
      >
        {title}
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={allChecked}
            indeterminate={selected.length > 0 && !allChecked}
            onChange={toggleAll}
          />
        }
        label={<Typography sx={{ fontSize: 13.5 }}>Select all</Typography>}
        sx={{ display: "flex", flexShrink: 0 }}
      />

      <Box
        sx={{
          flex: 1,
          maxHeight: "180px",
          overflowY: "auto",
          pr: 0.5,
          "&::-webkit-scrollbar": { width: "5px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#CBD5E1",
            borderRadius: "4px",
          },
        }}
      >
        {normalizedOptions.map(({ val, label }) => (
          <FormControlLabel
            key={val}
            control={
              <Checkbox
                size="small"
                checked={selected.includes(val)}
                onChange={() => toggleOne(val)}
              />
            }
            label={<Typography sx={{ fontSize: 13.5 }}>{label}</Typography>}
            sx={{ display: "flex" }}
          />
        ))}
      </Box>

      <Divider sx={{ my: 1, flexShrink: 0 }} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          flexShrink: 0,
        }}
      >
        <Button
          variant="contained"
          size="small"
          onClick={() => onApply?.(selected)}
          sx={{
            textTransform: "none",
            bgcolor: "#8BC34A",
            "&:hover": { bgcolor: "#7CB342" },
          }}
        >
          Apply
        </Button>
      </Box>
    </Box>
  );
}

export default CheckboxFilterPanel;
