import api from "@/shared/services/axios";

export const fetchAdminPendingPayments = (payload = {}) => {
    return api.post("/adm/fetch_all_pending_payments_admin", payload);
};

import { getSelectOptions } from "@/apps/admin/services/dropdownService";

export const fetchPendingPaymentFilterDropdowns = async () => {
  const [statuses, courseNames, coursePlans, users, amounts, courseTimes] = await Promise.all([
    getSelectOptions("L_PAYMENT_STATUSES"),
    getSelectOptions("L_COURSE_NAMES"),
    getSelectOptions("L_COURSE_PLANS"),
    getSelectOptions("L_TELECALLERS"),
    getSelectOptions("L_AMOUNT_STAGES"),
    getSelectOptions("L_COURSE_TIMES"),
  ]);

  let courses = courseNames.length > 0 ? courseNames : await getSelectOptions("L_COURSES").catch(() => []);
  let plans = coursePlans.length > 0 ? coursePlans : courses;

  return {
    data: {
      statuses,
      payment_stages: statuses,
      payment_stage: statuses,
      courses,
      course_names: courses,
      course_name: courses,
      course_plans: plans,
      course_plan: plans,
      plans,
      telecallers: users,
      assigned_to: users,
      pending_amounts: amounts,
      amount_stages: amounts,
      course_times: courseTimes,
      course_time: courseTimes,
      timings: courseTimes,
      course_timings: courseTimes,
    },
  };
};

export const exportAdminPendingPaymentsFile = (payload = {}) => {
    return api.post("/adm/export_data_api", payload);
};

