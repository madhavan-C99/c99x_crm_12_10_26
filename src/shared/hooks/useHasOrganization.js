import { useState, useEffect } from "react";

/**
 * Universal Hook to track whether the logged-in user has configured an organization profile.
 * Synchronizes reactively across components via storage events.
 *
 * @returns {boolean} true if user has an organization, false otherwise.
 */
export function useHasOrganization() {
  const [hasOrg, setHasOrg] = useState(() => {
    return localStorage.getItem("has_organization") !== "false";
  });

  useEffect(() => {
    const handleStorage = () => {
      setHasOrg(localStorage.getItem("has_organization") !== "false");
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return hasOrg;
}

export default useHasOrganization;
