// !!! unga project la use panra axios instance path-ku maathunga !!!
import api from "@/shared/services/axios";

export const getSessions = () => api.get("adm/sessions/");

export const logoutSession = (id) => api.post(`adm/sessions/${id}/logout/`);

export const logoutOtherSessions = () => api.post("adm/sessions/logout-others/");