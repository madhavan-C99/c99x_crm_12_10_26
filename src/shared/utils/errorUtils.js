/**
 * Utility helper to extract a clean, user-friendly error message
 * from various API response shapes (string, array, Record<string, string[]>).
 *
 * Handles Django / DRF and custom API error formats:
 * { "status": "error", "message": string | Record<string, string[]> | string[], "code": number }
 *
 * @param {unknown} err - The error object caught in try/catch (AxiosError or Error)
 * @param {string} [fallback="An error occurred. Please try again."] - Fallback message
 * @returns {string} Clean error string for toasts and UI alerts
 */
export function extractErrorMessage(
  err,
  fallback = "An error occurred. Please try again."
) {
  if (!err) return fallback;

  if (typeof err === "string") return err;

  const respData = err?.response?.data;
  if (respData) {
    const rawMsg = respData.message ?? respData.error ?? respData.detail;

    // 1. Direct string
    if (typeof rawMsg === "string" && rawMsg.trim()) {
      return rawMsg;
    }

    // 2. Array of strings (e.g. ["Field error 1", "Field error 2"])
    if (Array.isArray(rawMsg) && rawMsg.length > 0) {
      return rawMsg
        .map((m) => (typeof m === "string" ? m : JSON.stringify(m)))
        .join(" ");
    }

    // 3. Object / Record<string, string[] | string> (e.g. { name: ["This field is required."] })
    if (typeof rawMsg === "object" && rawMsg !== null) {
      const parts = [];
      for (const [key, val] of Object.entries(rawMsg)) {
        const fieldName = key.replace(/_/g, " ");
        if (Array.isArray(val)) {
          parts.push(`${fieldName}: ${val.join(", ")}`);
        } else if (typeof val === "string") {
          parts.push(`${fieldName}: ${val}`);
        }
      }
      if (parts.length > 0) {
        return parts.join(" | ");
      }
    }
  }

  return err?.message || fallback;
}
