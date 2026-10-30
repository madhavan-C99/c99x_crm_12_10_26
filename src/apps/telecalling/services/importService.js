import api from "@/shared/services/axios";

export const confirmLeadImport = async (leads) => {
  return api.post(
    "telecalling/lead_upload_excel",
    { leads },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

export const previewLeadsFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(
    "telecalling/lead_preview_excel",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
};

export const verifyLeadImport = async (payload) => {
  return await api.post("/adm/verify_lead_import", payload);
};

export const submitLeadImport = async (payload) => {
  return await api.post("/adm/submit_lead_import", payload);
};
