/**
 * Helpers so a <TextField select> shows a grey placeholder when it is empty
 * (instead of a blank box) and the saved value when the API returned one.
 *
 * Usage:
 *   <TextField select value={id ?? ""} slotProps={{ select: selectPlaceholderProps(
 *       (v) => options.find((o) => String(o.value) === String(v))?.label, "Select Course") }}>
 */
export const PLACEHOLDER_COLOR = "#A8A8A8";

export const selectPlaceholderProps = (getLabel, placeholder) => ({
  displayEmpty: true,
  renderValue: (selected) => {
    const label = getLabel ? getLabel(selected) : selected;
    const hasValue =
      label !== undefined && label !== null && String(label).trim() !== "";

    if (!hasValue) {
      return (
        <span style={{ color: PLACEHOLDER_COLOR, textTransform: "none" }}>
          {placeholder}
        </span>
      );
    }
    return label;
  },
});
