import api from "../../../shared/services/axios";

export const addNewLead = async (payload) => {
  try {
    return await api.post("/adm/add_new_lead_admin", payload);
  } catch (err) {
    if (err?.response?.status === 404) {
      return await api.post("/adm/add_new_lead", payload);
    }
    throw err;
  }
};
