import api from "@/shared/services/axios";

export const getConnecetdCallDetails =
    (data) => {

        return api.post(
            "/telecalling/call_connect_api",
            data,
            {
                headers: {
                    "Content-Type":
                        "multipart/form-data",
                },
            }
        );

    };
