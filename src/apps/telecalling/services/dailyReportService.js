import api from "@/shared/services/axios";

export const getDailyReportData = async (user_id) => {

    return api.post(
        "/telecalling/daily_report_api",
        {
            id: user_id,
        }
    );
};

// export const DailyReportPdfDownload = async () => {
//     return api.get("/telecalling/daily-report/download");
// };

export const DailyReportSubmitData = async (payload) => {
    return api.post(
        "/telecalling/daily-report/submit",
        payload
    );
};


export const initiateExport = (payload) =>
    api.post("/adm/export_data_api", payload);

export const getExportDownload = (payload) =>
    api.post("/adm/export_download", payload);