import api from "@/shared/services/axios";

export const loginApi = async (data) => {
  return api.post("/adm/create_token", data);
};

export const fetchUserPermissionApi = async () => {
  return await api.get("/adm/api_user_permissions");
};
