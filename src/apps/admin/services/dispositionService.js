import api from "../../../shared/services/axios";

export const getDispositionLogReport = async (data = {}, config = {}) => {
  return api.post("/adm/disposition_log_report", data, config);
};
