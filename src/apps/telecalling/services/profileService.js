// !!! unga project la use panra axios instance path-ku maathunga !!!
import api from "@/shared/services/axios";




export const getTelecallingUserProfile = async (payload = {}) => {
    return api.get("adm/fetch_one_telecalling_user",
        payload
    );
};