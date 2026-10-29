/**
 * Normalise any stored / typed mobile value to a plain 10-digit string.
 *
 * Handles: "+91 98765 43210", "+91-9876543210", "919876543210", "09876543210",
 * and a bare 10-digit number that happens to start with "91" (e.g. 9123456789).
 *
 * The old `.replace(/^\+?91/, "")` stripped the leading "91" of a valid bare
 * 10-digit number and left spaces/dashes in "+91 9876543210", which made the
 * "Mobile number must be 10 digits" validation fail on Save.
 */
export const normalizeMobile = (value) => {
  let digits = String(value ?? "").replace(/\D/g, "");

  // Strip country code / trunk prefix only when there are extra digits.
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);

  return digits.slice(0, 10);
};

export const isValidMobile = (value) => /^\d{10}$/.test(normalizeMobile(value));

/** Validates that the number has 10 digits and starts with 6, 7, 8, or 9 (standard Indian mobile format) */
export const isValidIndianMobile = (value) => /^[6-9]\d{9}$/.test(normalizeMobile(value));

/**
 * Returns an error string if invalid, or null if valid.
 */
export const validateMobile = (value, fieldName = "Mobile Number") => {
  const digits = normalizeMobile(value);
  if (!digits) return `${fieldName} is required`;
  if (digits.length !== 10) return `${fieldName} must be exactly 10 digits`;
  if (!/^[6-9]\d{9}$/.test(digits)) return `${fieldName} must start with 6, 7, 8, or 9`;
  return null;
};

/**
 * Returns standard "+91 XXXXXXXXXX" format for backend submission.
 */
export const formatWithCountryCode = (value) => {
  const digits = normalizeMobile(value);
  return digits.length === 10 ? `+91 ${digits}` : (value || "");
};

/**
 * For onChange handlers: keeps typing natural (an 11th typed digit is simply
 * ignored) but still handles a pasted "+91 98765 43210" / "919876543210".
 */
export const sanitizeMobileInput = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits.slice(0, 10);
};
