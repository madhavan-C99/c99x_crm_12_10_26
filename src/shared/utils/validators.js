import { normalizeMobile, isValidIndianMobile } from "./mobile";

/**
 * Standard Regex Definitions
 */
export const REGEX = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9][0-9]{9}$/,
  pincode: /^[1-9][0-9]{5}$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  gstin: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
  url: /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/,
  city: /^[a-zA-Z\s]+$/,
};

/**
 * Indian State to 2-digit GST State Code mapping
 */
export const STATE_GST_CODES = {
  "jammu and kashmir": "01",
  "himachal pradesh": "02",
  "punjab": "03",
  "chandigarh": "04",
  "uttarakhand": "05",
  "haryana": "06",
  "delhi": "07",
  "rajasthan": "08",
  "uttar pradesh": "09",
  "bihar": "10",
  "sikkim": "11",
  "arunachal pradesh": "12",
  "nagaland": "13",
  "manipur": "14",
  "mizoram": "15",
  "tripura": "16",
  "meghalaya": "17",
  "assam": "18",
  "west bengal": "19",
  "jharkhand": "20",
  "odisha": "21",
  "chhattisgarh": "22",
  "madhya pradesh": "23",
  "gujarat": "24",
  "dadra and nagar haveli and daman and diu": "26",
  "maharashtra": "27",
  "andhra pradesh": "37",
  "karnataka": "29",
  "goa": "30",
  "lakshadweep": "31",
  "kerala": "32",
  "tamilnadu": "33",
  "tamil nadu": "33",
  "puducherry": "34",
  "pondicherry": "34",
  "andaman and nicobar islands": "35",
  "telangana": "36",
  "ladakh": "38",
};

/**
 * Returns expected GST code for a given state name
 */
export const getExpectedGstCodeForState = (stateName) => {
  if (!stateName) return null;
  const normalized = String(stateName).trim().toLowerCase().replace(/\s+/g, " ");
  return STATE_GST_CODES[normalized] || null;
};

/**
 * Validate Step 1 - Basic Information
 */
export const validateStep1 = (data) => {
  const errors = {};

  // Logo: optional, PNG/JPG only, max 2MB
  if (data.logoFile) {
    const file = data.logoFile;
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      errors.logo = "Logo must be a PNG or JPG file";
    } else if (file.size > 2 * 1024 * 1024) {
      errors.logo = "Logo file size must not exceed 2MB";
    }
  }

  // Organization Name: required, min 3 chars
  const orgName = (data.orgName || "").trim();
  if (!orgName) {
    errors.orgName = "Organization Name is required";
  } else if (orgName.length < 3) {
    errors.orgName = "Organization Name must be at least 3 characters";
  }

  // Display Name: required, min 3 chars
  const displayName = (data.displayName || "").trim();
  if (!displayName) {
    errors.displayName = "Display Name is required";
  } else if (displayName.length < 3) {
    errors.displayName = "Display Name must be at least 3 characters";
  }

  // Company Website: optional, valid URL if filled
  const website = (data.companyWebsite || "").trim();
  if (website && !REGEX.url.test(website)) {
    errors.companyWebsite = "Please enter a valid website URL (e.g. https://example.com)";
  }

  // Company Description: required, min 10 chars
  const companyDesc = (data.companyDesc || "").trim();
  if (!companyDesc) {
    errors.companyDesc = "Company Description is required";
  } else if (companyDesc.length < 10) {
    errors.companyDesc = "Company Description must be at least 10 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate Step 2 - Contact Information
 */
export const validateStep2 = (data) => {
  const errors = {};

  // Address Line 1: required
  const addressLine1 = (data.addressLine1 || "").trim();
  if (!addressLine1) {
    errors.addressLine1 = "Address Line 1 is required";
  }

  // Address Line 2: required
  const addressLine2 = (data.addressLine2 || "").trim();
  if (!addressLine2) {
    errors.addressLine2 = "Address Line 2 is required";
  }

  // City: required, letters/spaces only
  const city = (data.city || "").trim();
  if (!city) {
    errors.city = "City is required";
  } else if (!REGEX.city.test(city)) {
    errors.city = "City should contain letters and spaces only";
  }

  // State: required
  const stateVal = (data.stateVal || "").trim();
  if (!stateVal) {
    errors.stateVal = "State is required";
  }

  // Country: required
  const countryVal = (data.countryVal || "").trim();
  if (!countryVal) {
    errors.countryVal = "Country is required";
  }

  // Pincode: required, exactly 6 digits, not starting with 0
  const pincode = (data.pincode || "").trim();
  if (!pincode) {
    errors.pincode = "Pincode is required";
  } else if (!REGEX.pincode.test(pincode)) {
    errors.pincode = "Pincode must be exactly 6 digits and cannot start with 0";
  }

  // Official Email: required, valid email
  const email = (data.officialEmail || "").trim();
  if (!email) {
    errors.officialEmail = "Official Email is required";
  } else if (!REGEX.email.test(email)) {
    errors.officialEmail = "Please enter a valid official email address";
  }

  // Official Contact Number: required, 10 digits, starts with 6-9
  const contact = normalizeMobile(data.officialContact || "");
  if (!contact) {
    errors.officialContact = "Official Contact Number is required";
  } else if (contact.length !== 10 || !isValidIndianMobile(contact)) {
    errors.officialContact = "Contact number must be 10 digits starting with 6, 7, 8, or 9";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate Step 3 - Business Information
 */
export const validateStep3 = (data) => {
  const errors = {};

  const gstin = (data.gstIn || "").trim().toUpperCase();
  const pan = (data.companyPan || "").trim().toUpperCase();

  // GSTIN: required, 15-char valid GST format
  if (!gstin) {
    errors.gstIn = "GSTIN is required";
  } else if (!REGEX.gstin.test(gstin)) {
    errors.gstIn = "Please enter a valid 15-character GSTIN (e.g. 33AAAAA0000A1Z5)";
  }

  // Company PAN: required, 10-char valid PAN format
  if (!pan) {
    errors.companyPan = "Company PAN is required";
  } else if (!REGEX.pan.test(pan)) {
    errors.companyPan = "Please enter a valid 10-character PAN (e.g. ABCDE1234F)";
  }

  // Cross-check: GSTIN characters 3-12 must equal Company PAN
  if (gstin && pan && REGEX.gstin.test(gstin) && REGEX.pan.test(pan)) {
    const panFromGstin = gstin.substring(2, 12);
    if (panFromGstin !== pan) {
      errors.gstIn = `GSTIN PAN part (${panFromGstin}) does not match Company PAN (${pan})`;
      errors.companyPan = "Company PAN must match characters 3-12 of the GSTIN";
    }
  }

  // Cross-check: GSTIN first 2 digits must match selected State's GST state code
  if (gstin && data.stateVal && REGEX.gstin.test(gstin)) {
    const expectedStateCode = getExpectedGstCodeForState(data.stateVal);
    if (expectedStateCode) {
      const gstinStateCode = gstin.substring(0, 2);
      if (gstinStateCode !== expectedStateCode) {
        errors.gstIn = `First 2 digits of GSTIN (${gstinStateCode}) do not match ${data.stateVal} state code (${expectedStateCode})`;
      }
    }
  }

  // Date Format: required
  const dateFormat = (data.dateFormat || "").trim();
  if (!dateFormat) {
    errors.dateFormat = "Date Format is required";
  }

  // Time Format: required
  const timeFormat = (data.timeFormat || "").trim();
  if (!timeFormat) {
    errors.timeFormat = "Time Format is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate all steps at once (for final submit)
 * Returns { isValid, errors, firstErrorStep }
 */
export const validateAllOrganizationSteps = (data) => {
  const step1 = validateStep1(data);
  const step2 = validateStep2(data);
  const step3 = validateStep3(data);

  let firstErrorStep = null;
  if (!step1.isValid) firstErrorStep = 1;
  else if (!step2.isValid) firstErrorStep = 2;
  else if (!step3.isValid) firstErrorStep = 3;

  return {
    isValid: step1.isValid && step2.isValid && step3.isValid,
    firstErrorStep,
    errors: {
      ...step1.errors,
      ...step2.errors,
      ...step3.errors,
    },
    stepResults: {
      1: step1,
      2: step2,
      3: step3,
    },
  };
};
