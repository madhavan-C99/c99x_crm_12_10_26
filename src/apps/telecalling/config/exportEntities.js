/**
 * Everything the single export API (POST /adm/export_data_api) needs to know about a page.
 * Column `id`s are the column names the backend understands - keep them in sync with the API.
 */
export const EXPORT_ENTITIES = {
  leads: {
    columns: [
      { id: "s_no", label: "S.No" },
      { id: "name", label: "Name" },
      { id: "mobile_no", label: "Contact" },
      { id: "assigned_to", label: "Assigned to" },
      { id: "stage", label: "Stage" },
      { id: "pipeline", label: "Pipeline" },
      { id: "campaign_name", label: "Campaign" },
      { id: "source", label: "Source" },
      { id: "course_plan", label: "Course Plan" },
      { id: "course_name", label: "Course" },
      { id: "next_follow_up", label: "Next Follow-Up" },
      { id: "amount", label: "Amount" },
      { id: "pending_amount", label: "Pending Amount" },
      { id: "last_contacted", label: "Last Contacted" },
      { id: "last_conversation_outcome", label: "Last Conversation Outcome" },
      { id: "created", label: "Created" },
    ],
  },
  pending_payments: {
    columns: [
      { id: "s_no", label: "S.No" },
      { id: "name", label: "Name" },
      { id: "contact", label: "Contact" },
      { id: "assigned_to", label: "Assign To" },
      { id: "campaign", label: "Campaign" },
      { id: "course_plan", label: "Course Plan" },
      { id: "course", label: "Course" },
      { id: "joining_date", label: "Joining Date" },
      { id: "batch_timing", label: "Batch & Timing" },
      { id: "amount_paid", label: "Amount Paid" },
      { id: "pending_amount", label: "Pending Amount" },
      { id: "status", label: "Status" },
      { id: "next_followup", label: "Next Follow up" },
      { id: "last_conversation", label: "Last Conversation" },
    ],
  },
  loss_lead_approval: {
    columns: [
      { id: "s_no", label: "S.No" },
      { id: "name", label: "Name" },
      { id: "contact", label: "Contact" },
      { id: "assigned_to", label: "Assigned to" },
      { id: "effort_summary", label: "Effort Summary" },
      { id: "loss_reason", label: "Loss Reason" },
      { id: "last_conversation_outcome", label: "Last Conversation Outcome" },
      { id: "last_contacted", label: "Last Contacted" },
      { id: "inquiry_date", label: "Inquiry Date" },
      { id: "lead_age", label: "Lead Age" },
    ],
  },
  performance_overview: {
    columns: [
      { id: "rank", label: "Rank" },
      { id: "telecaller", label: "Telecaller Name" },
      { id: "team", label: "Team" },
      { id: "leads_assigned", label: "Leads Assigned" },
      { id: "calls_made", label: "Calls Made" },
      { id: "followups_done", label: "Follow-Ups Done" },
      { id: "admissions", label: "Admissions" },
      { id: "pending_followups", label: "Pending Follow-Ups" },
      { id: "performance_score", label: "Performance Score" },
      { id: "rating", label: "Rating" },
      { id: "avg_calling_time", label: "Avg Calling Time" },
    ],
  },
  dashboard: {
    columns: [
      { id: "label", label: "Metric" },
      { id: "value", label: "Value" },
      { id: "percentage", label: "Change %" },
    ],
  },
};

/** frontend page name -> backend entity */
export const ENTITY_BY_PAGE = {
  lead: "leads",
  leads: "leads",
  "pending-payments": "pending_payments",
  pending_payments: "pending_payments",
  "loss-approvals": "loss_lead_approval",
  loss_lead_approval: "loss_lead_approval",
  performance: "performance_overview",
  performance_overview: "performance_overview",
  dashboard: "dashboard",
};
