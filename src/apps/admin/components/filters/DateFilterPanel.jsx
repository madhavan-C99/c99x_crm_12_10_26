import { useState } from "react";
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Divider,
} from "@mui/material";
import CustomDateRangePicker from "@/shared/components/dialogs/CustomDateDialog";

const options = [
  "Today",
  "Yesterday",
  "Last 7 days",
  "Last 30 days",
  "This Month",
  "Custom Range",
];

function parseRange(str) {
  if (typeof str === "string" && str.includes(" to ")) {
    const [from, to] = str.split(" to ");
    return { from: from?.trim() || "", to: to?.trim() || "" };
  }
  return { from: "", to: "" };
}

function DateFilterPanel({ defaultValue = "Last 7 days", onApply }) {
  const initialCustom = parseRange(defaultValue);
  const [value, setValue] = useState(defaultValue);
  const [customFrom, setCustomFrom] = useState(initialCustom.from);
  const [customTo, setCustomTo] = useState(initialCustom.to);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  // Sync state when defaultValue prop changes externally
  const [prevDefault, setPrevDefault] = useState(defaultValue);
  if (defaultValue !== prevDefault) {
    setPrevDefault(defaultValue);
    setValue(defaultValue);
    const parsed = parseRange(defaultValue);
    setCustomFrom(parsed.from);
    setCustomTo(parsed.to);
  }

  const isCustomSelected =
    value === "Custom Range" ||
    (typeof value === "string" && value.includes(" to "));

  const handleRadioChange = (e) => {
    const selected = e.target.value;
    if (selected === "Custom Range") {
      setValue("Custom Range");
      setIsCustomOpen(true);
    } else {
      setValue(selected);
    }
  };

  const handleCustomApply = (from, to) => {
    if (from && to) {
      setCustomFrom(from);
      setCustomTo(to);
      const rangeStr = `${from} to ${to}`;
      setValue(rangeStr);
      setIsCustomOpen(false);
      onApply?.(rangeStr);
    }
  };

  const handleCustomClose = () => {
    setIsCustomOpen(false);
    if (!customFrom || !customTo) {
      setValue((prev) => (prev === "Custom Range" ? defaultValue : prev));
    }
  };

  const handlePanelApply = () => {
    if (isCustomSelected) {
      if (!customFrom || !customTo) {
        setIsCustomOpen(true);
        return;
      }
      onApply?.(`${customFrom} to ${customTo}`);
      return;
    }
    onApply?.(value);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography sx={{ color: "#8BC34A", fontWeight: 700, fontSize: 14, mb: 1 }}>
        Choose Creation Timestamp
      </Typography>

      <RadioGroup
        value={isCustomSelected ? "Custom Range" : value}
        onChange={handleRadioChange}
      >
        {options.map((opt) => {
          const isCustomOpt = opt === "Custom Range";
          const label =
            isCustomOpt && customFrom && customTo
              ? `Custom Range (${customFrom} to ${customTo})`
              : opt;

          return (
            <FormControlLabel
              key={opt}
              value={opt}
              control={
                <Radio
                  size="small"
                  onClick={
                    isCustomOpt && isCustomSelected
                      ? () => setIsCustomOpen(true)
                      : undefined
                  }
                  sx={{ color: "#8BC34A", "&.Mui-checked": { color: "#4CAF50" } }}
                />
              }
              label={
                <Typography
                  onClick={
                    isCustomOpt && isCustomSelected
                      ? () => setIsCustomOpen(true)
                      : undefined
                  }
                  sx={{
                    fontSize: 13.5,
                    cursor: isCustomOpt && isCustomSelected ? "pointer" : "default",
                  }}
                >
                  {label}
                </Typography>
              }
            />
          );
        })}
      </RadioGroup>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          size="small"
          onClick={handlePanelApply}
          sx={{
            textTransform: "none",
            bgcolor: "#8BC34A",
            "&:hover": { bgcolor: "#7CB342" },
          }}
        >
          Apply
        </Button>
      </Box>

      <CustomDateRangePicker
        allowSingleDate
        open={isCustomOpen}
        onClose={handleCustomClose}
        onApply={handleCustomApply}
        initialFrom={customFrom}
        initialTo={customTo}
        accentColor="#8BC34A"
      />
    </Box>
  );
}

export default DateFilterPanel;