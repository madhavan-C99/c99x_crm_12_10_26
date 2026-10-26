import api from "@/shared/services/axios";
import { getSelectOptions } from "@/apps/admin/services/dropdownService";

export const fetchAdminPendingPayments = (payload = {}, config = {}) => {
  return api.post("/adm/fetch_all_pending_payments_admin", payload, config);
};

export const fetchPendingPaymentFilterDropdowns = async (optFilter = null) => {
  const filter =
    optFilter && typeof optFilter === "object"
      ? optFilter
      : optFilter
      ? { pipeline_id: optFilter }
      : null;

  const [courses, coursePlans, courseTimes, paymentStages, amountStages] =
    await Promise.all([
      getSelectOptions("L_COURSE_NAMES", filter).catch(() => []),
      getSelectOptions("L_COURSE_PLANS", filter).catch(() => []),
      getSelectOptions("L_COURSE_TIMES", filter).catch(() => []),
      getSelectOptions("L_PAYMENT_STAGES", filter).catch(() => []),
      getSelectOptions("L_AMOUNT_STAGES", filter).catch(() => []),
    ]);

  return {
    data: {
      courses,
      course_plans: coursePlans,
      course_times: courseTimes,
      payment_stages: paymentStages,
      pending_amounts: amountStages,
    },
  };
};

export const exportAdminPendingPaymentsFile = (payload = {}) => {
  return api.post("/adm/export_data_api", payload);
};
