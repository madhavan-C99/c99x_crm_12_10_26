import api from "@/shared/services/axios";

export const markNotificationRead = async (notificationId) => {
  return api.post("/telecalling/mark_notification_read", {
    notification_id: notificationId,
  });
};
