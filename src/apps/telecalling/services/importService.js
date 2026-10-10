
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
  });
};
