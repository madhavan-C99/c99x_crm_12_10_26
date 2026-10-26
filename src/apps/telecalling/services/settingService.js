import api from "@/shared/services/axios";

export const getAllSettings = async () => {
return api.get("telecalling/get_all_settings"

)
};

export const updateNotificationSettings = async (payload) => {
  return api.post("telecalling/notification_api",
     payload);

};
