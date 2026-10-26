import api from "@/shared/services/axios";

// export const dashboardExportJsonData = async (payload) => {

//     return api.post(
//         // "/telecalling/dashboard/pdf-data/",
//         "adm/export_data_api",
//         payload
//     );
// };


export const initiateExport = (payload) =>
    api.post("/adm/export_data_api", payload);

export const getExportDownload = (payload) =>
    api.post("/adm/export_download", payload);