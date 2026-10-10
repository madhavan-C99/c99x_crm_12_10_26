import api from "@/shared/services/axios";

export const fetchOneLead = async (id) => {

  return api.post(
    "/telecalling/fetch_one_lead",
    {
      lead_id: id,
    }
  );
};
