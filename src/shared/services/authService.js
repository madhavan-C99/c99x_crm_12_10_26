import api from "@/shared/services/axios";

export const loginApi = async (data) => {
  return api.post("/adm/create_token", data);
};

export const fetchUserPermissionApi = async () => {
  // 🌟 10-second timeout prevents indefinite UI freezing if offline or tunnel is down
  return await api.get("/adm/api_user_permissions", { timeout: 10000 });
};
