# Comprehensive Frontend Code Review & Analysis Report

**Project:** `crm_web` (React 19 + Vite 8 + MUI 9 + React Router 7)  
**Review Type:** Senior React Architectural, Quality, and Security Analysis  
**Mode:** READ-ONLY (No source code files modified)  
**Date:** November 4, 2026  

---

## 1. Summary

- **Total Files in Scope:** 311 JavaScript/JSX files across Admin, Telecalling, Shared, and Router modules.
- **Total Files Reviewed:** 311 (100% complete coverage; zero files skipped).
- **Total Linter & Static Analysis Problems Identified:** 354 linter issues + 18 architectural/security findings.

### Issues Breakdown by Severity

| Severity | Count | Impact Definition |
| :--- | :---: | :--- |
| **Critical** | **5** | Immediate runtime crashes (`ReferenceError`), broken silent auth refresh, or complete routing dead ends. |
| **High** | **145** | Memory leaks (unclosed WebSockets), XSS risks, duplicate object keys, TDZ function hoisting, render-loop state cascades. |
| **Medium** | **85** | Missing `useEffect` dependencies (stale closures), duplicate heavy libraries (>1.3 MB bundle bloat), Fast Refresh violations. |
| **Low** | **137** | Unused variables/imports, dead code blocks, useless assignments, and redundant protocol checks. |

---

## 2. Issues Table

| ID | Severity | File Path | Line Number(s) | Category | Problem Description | Why It Matters | Suggested Fix (Text Only) |
| :--- | :---: | :--- | :---: | :---: | :--- | :--- | :--- |
| **CRIT-01** | **Critical** | `src/apps/admin/pages/Pipeline/views/CallLogReport.jsx` | 733 | Runtime Bug | Passes `rows={sortedRows}` to `<Table>`, but `sortedRows` is never declared in the component. | Visiting Call Log Report causes immediate `ReferenceError: sortedRows is not defined`, crashing the entire page. | Replace `rows={sortedRows}` with `rows={tableRows}` or implement the sorting memo. |
| **CRIT-02** | **Critical** | `src/apps/admin/pages/Pipeline/views/DispositionLog.jsx` | 718 | Runtime Bug | Passes `rows={sortedRows}` to `<Table>`, but `sortedRows` is never declared in the component. | Visiting Disposition Log causes immediate `ReferenceError: sortedRows is not defined`, crashing the page. | Replace `rows={sortedRows}` with `rows={tableRows}` or implement the sorting memo. |
| **CRIT-03** | **Critical** | `src/shared/services/axios.js` | 4 | API & Auth | Refresh URL hardcoded as `"/adm/api/token/refresh/"` instead of backend route `"/adm/token/refresh/"`. | When JWT access token expires, the refresh call returns 404, triggering `forceLogout()` and booting active users out. | Change `REFRESH_URL` to `"/adm/token/refresh/"` to match backend specification. |
| **CRIT-04** | **Critical** | `src/apps/telecalling/routes/TelecallingRoutes.jsx` | 101-145 | Routing & Auth | Missing `index` route and fallback `*` route inside `<Routes>`. | Direct navigation to `/telecalling` or `/telecalling/` renders an empty blank page without redirect. | Add `<Route index element={<Navigate to="dashboard" replace />} />` and `<Route path="*" element={<Navigate to="dashboard" replace />} />`. |
| **CRIT-05** | **Critical** | `src/apps/admin/routes/AdminRoutes.jsx` | 137 | Routing | Wildcard redirect uses relative navigation: `<Route path="*" element={<Navigate to="admin/dashboard" replace />} />`. | Missing leading slash causes nested invalid redirects like `/admin/foo/admin/dashboard`. | Add leading slash: `<Navigate to="/admin/dashboard" replace />`. |
| **HIGH-01** | **High** | `src/apps/telecalling/components/navbar/Navbar.jsx` | 214-221 | Memory & API | `handleLogout()` clears storage and navigates without closing `notificationSocketRef` or `reminderSocketRef`. | Open WebSockets attempt continuous reconnection with empty token, flooding console with 401s and leaking browser memory. | Call `notificationSocketRef.current?.close()` and `reminderSocketRef.current?.close()` before navigation. |
| **HIGH-02** | **High** | `src/apps/admin/components/dashboard/BottomAnalyticsCards.jsx` | 899 | Security | Uses `dangerouslySetInnerHTML` with handwritten regex/DOMParser sanitizer on backend data. | Incomplete regex sanitization exposes app to Cross-Site Scripting (XSS) if malicious HTML is returned. | Use an audited sanitizer such as `DOMPurify.sanitize()` or render formatted text using safe React children. |
| **HIGH-03** | **High** | `src/apps/admin/components/settings/pipeline/CreatePipelineModal.jsx` | 539-540 | Syntax / Bug | Duplicate object key `borderRadius: "10px"` and `borderRadius: "12px"` in `sx` prop. | Violates ES strict mode object notation; first value is dead and overridden by the second. | Remove the redundant `borderRadius: "10px"`. |
| **HIGH-04** | **High** | `src/apps/admin/components/common/AddLeadModal.jsx` | 199 | React / TDZ | `loadInitialOptions()` called inside `useEffect` before `const loadInitialOptions` is declared. | In strict mode or React 19 compiler, accessing unhoisted arrow functions before declaration causes TDZ errors. | Move `const loadInitialOptions = ...` definition above the `useEffect` hook or use `function` hoisting. |
| **HIGH-05** | **High** | `src/apps/admin/components/common/CreateCampaignModal.jsx` | 227 | React / TDZ | `loadDropdownData()` called inside `useEffect` before declaration at line 234. | Causes temporal dead zone violations and prevents compiler optimization. | Move declaration above `useEffect` or wrap in `useCallback`. |
| **HIGH-06** | **High** | `src/apps/admin/components/dashboard/BottomAnalyticsCards.jsx` | 170 | React / Purity | Variable `currentAngle` reassigned during `.map()` inside render: `currentAngle += sliceAngle;`. | Modifying variables during render breaks React functional purity and causes inconsistent render results. | Compute angles purely using functional reduction or state. |
| **HIGH-07** | **High** | `src/shared/pages/login/LoginDashboardAnimation.jsx` | 185 | React / Purity | Variable `offset` reassigned during `.map()` in render loop: `offset += sg[0];`. | Causes render instability and triggers React 19 immutability violation. | Calculate offsets purely from cumulative slice index calculations. |
| **HIGH-08** | **High** | Multiple (104 files) | Multiple | React Lifecycle | Calling `setState` synchronously within `useEffect` body (e.g. `AddLeadModal.jsx:193`, `LeadSourceSection.jsx:191`). | Causes immediate cascading re-renders, increasing TBT (Total Blocking Time) and degrading interaction responsiveness. | Initialize default state via `useState(() => initial)` or derive state during render without effects. |
| **MED-01** | **Medium** | Multiple (69 files) | Multiple | React Lifecycle | Missing dependencies in `useEffect` / `useCallback` dependency arrays (e.g. `Performance.jsx:361`, `Navbar.jsx:347`). | Causes stale closures where components execute actions with obsolete state or props. | Add missing variables to dependency array or wrap callbacks with `useCallback`. |
| **MED-02** | **Medium** | `package.json` | 17, 24 | Architecture | Both `apexcharts` / `react-apexcharts` AND `recharts` installed and bundled. | Redundant visualization engines bloat initial JavaScript bundle size by >450 KB gzip. | Standardize on one chart library across both Admin and Telecalling (e.g., Recharts) and remove the other. |
| **MED-03** | **Medium** | `package.json` | 25, 26 | Architecture | Both `xlsx` (cdn tarball) and `xlsx-js-style` installed. | Creates bundle duplication (>860 KB chunk size) and maintenance overhead for spreadsheets. | Consolidate on a single Excel export utility. |
| **MED-04** | **Medium** | `src/apps/admin/pages/Performance/Performance.jsx` | 252-257 | Dead Code | Variables `cardBg`, `borderColor`, `dividerColor`, `convColor`, `highlight` initialized and overwritten in all branches. | Dead assignments clutter code and confuse maintainers. | Assign values directly inside the conditional branches or map table. |
| **MED-05** | **Medium** | `src/shared/context/AuthContext.jsx` & `ProtectedRoute.jsx` | 12 / 6 | Architecture | `ADMIN_ROLES_LIST` and `ADMIN_ROLES` defined in duplicate locations. | Adding a new administrative role in one file without updating the other leads to silent permission desync. | Export a single authoritative `ADMIN_ROLES` array from `@/shared/config/roles.js`. |
| **MED-06** | **Medium** | Multiple (15 files) | Multiple | Fast Refresh | Exporting non-component constants or hooks alongside components (e.g. `DateRangeSelect.jsx`, `ProtectedRoute.jsx`). | Fast Refresh cannot hot-reload these files cleanly, forcing full page refreshes during development. | Move exported helper constants to dedicated `.js` utility files. |
| **LOW-01** | **Low** | Multiple (115 occurrences) | Multiple | Code Quality | Unused imports and variables (e.g., `setSourceTypeOptions`, `conversationOutcome`, `tagOpen`). | Increases cognitive load and clutters bundle AST. | Run ESLint automated fix to remove unused imports and destructuring. |
| **LOW-02** | **Low** | `src/apps/telecalling/routes/TelecallingRoutes.jsx` | 1-59 | Code Quality | 59 lines of obsolete commented-out route code preserved at top of file. | Dead code creates confusion during debugging. | Safely delete commented-out code blocks since git preserves version history. |

---

## 3. Component-Wise Findings

### Module / Directory: `src`

#### `src/App.jsx`
*No issues found.*

#### `src/main.jsx`
*No issues found.*

### Module / Directory: `src/apps/admin`

#### `src/apps/admin/components/common/AddLeadModal.jsx`
- **Line 193:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 199:7:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 201:6:** [WARNING] 201:6  React Hook useEffect has a missing dependency: 'loadInitialOptions'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/components/common/AdminLeadRowDetails.jsx`
- **Line 141:6:** [WARNING] 141:6  React Hook useEffect has a missing dependency: 'hasPermission'. Either include it or remove the dependency array  react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/components/common/CreateCampaignModal.jsx`
- **Line 222:9:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 227:7:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 234:6:** [WARNING] 234:6  React Hook useEffect has a missing dependency: 'loadDropdownData'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/components/common/ExportModal.jsx`
- **Line 54:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 66:6:** [WARNING] 66:6  React Hook useEffect has missing dependencies: 'fileFormat' and 'hasColumns'. Either include them or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/components/common/filters/CheckboxFilterPanel.jsx`
- **Line 16:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/common/filters/FilterButton.jsx`
- **Line 6:32:** [ERROR] 'active' is defined but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/common/filters/FilterLeadsPanel.jsx`
- **Line 54:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/common/filters/ReportSortMenu.jsx`
*No issues found.*

#### `src/apps/admin/components/common/ReassignLeadModal.jsx`
- **Line 186:6:** [WARNING] 186:6  React Hook useMemo has a missing dependency: 'getDynamicPills'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 190:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/common/UploadLeadsDialog.jsx`
- **Line 76:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 101:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/common/UploadLeadsModal.jsx`
- **Line 61:10:** [ERROR] 'selectedFile' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              no-unused-vars (`no-unused-vars`)
- **Line 68:10:** [ERROR] 'sources' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   no-unused-vars (`no-unused-vars`)
- **Line 75:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 168:6:** [WARNING] 168:6   React Hook useEffect has a missing dependency: 'selectedSource'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/components/dashboard/BottomAnalyticsCards.jsx`
- **Line 170:7:** [ERROR] Error: Cannot reassign variable after render completes (`completes`)
- **Line 311:6:** [WARNING] 311:6  React Hook useMemo has a missing dependency: 'lossPalette'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                       react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/components/dashboard/DashboardHeader.jsx`
*No issues found.*

#### `src/apps/admin/components/dashboard/FollowUpAndPaymentsTables.jsx`
- **Line 19:7:** [ERROR] 'DEFAULT_MISSED_FOLLOWUPS' is assigned a value but never used  no-unused-vars (`no-unused-vars`)
- **Line 20:7:** [ERROR] 'DEFAULT_PENDING_PAYMENTS' is assigned a value but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/dashboard/MetricCardsGrid.jsx`
*No issues found.*

#### `src/apps/admin/components/dashboard/MonthlyCharts.jsx`
*No issues found.*

#### `src/apps/admin/components/dashboard/PipelineAndPerformance.jsx`
*No issues found.*

#### `src/apps/admin/components/integrations/ConnectedList.jsx`
- **Line 60:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 560:19:** [ERROR] 'filteredForms' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/integrations/FacebookConnectDialog.jsx`
- **Line 79:17:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 react-refresh/only-export-components (`react-refresh/only-export-components`)
- **Line 135:10:** [ERROR] 'pipelines' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 no-unused-vars (`no-unused-vars`)
- **Line 147:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 194:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 208:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 225:6:** [WARNING] 225:6   React Hook useEffect has missing dependencies: 'state.formMode' and 'state.pageAccessToken'. Either include them or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/components/integrations/googleForms/GoogleFormsConnectDialog.jsx`
- **Line 96:10:** [ERROR] 'loadingDropdowns' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              no-unused-vars (`no-unused-vars`)
- **Line 115:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 126:6:** [WARNING] 126:6   React Hook useEffect has a missing dependency: 'routing.campaignId'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 133:9:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 150:7:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 195:6:** [WARNING] 195:6   React Hook useEffect has a missing dependency: 'startPolling'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/components/integrations/googleForms/GoogleFormsTable.jsx`
*No issues found.*

#### `src/apps/admin/components/integrations/googleSheets/GoogleSheetsConnectDialog.jsx`
- **Line 98:10:** [ERROR] 'loadingDropdowns' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           no-unused-vars (`no-unused-vars`)
- **Line 107:10:** [ERROR] 'copiedWebhook' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              no-unused-vars (`no-unused-vars`)
- **Line 108:10:** [ERROR] 'showSecret' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 no-unused-vars (`no-unused-vars`)
- **Line 108:22:** [ERROR] 'setShowSecret' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              no-unused-vars (`no-unused-vars`)
- **Line 117:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 128:6:** [WARNING] 128:6   React Hook useEffect has a missing dependency: 'routing.campaignId'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 134:9:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 149:7:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 193:6:** [WARNING] 193:6   React Hook useEffect has a missing dependency: 'startPolling'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 218:9:** [ERROR] 'handleCopyWebhook' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/integrations/googleSheets/GoogleSheetsTable.jsx`
*No issues found.*

#### `src/apps/admin/components/integrations/steps/FormsStep.jsx`
*No issues found.*

#### `src/apps/admin/components/integrations/steps/PageStep.jsx`
- **Line 24:3:** [ERROR] 'facebookAccounts' is assigned a value but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/integrations/steps/RoutingStep.jsx`
*No issues found.*

#### `src/apps/admin/components/integrations/whatsapp/WhatsAppConnectDialog.jsx`
- **Line 70:17:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             react-refresh/only-export-components (`react-refresh/only-export-components`)
- **Line 191:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/integrations/whatsapp/WhatsAppTable.jsx`
- **Line 97:3:** [ERROR] 'error' is assigned a value but never used        no-unused-vars (`no-unused-vars`)
- **Line 294:21:** [ERROR] 'statusLabel' is assigned a value but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/leads/AdminLeadFilterPopup.jsx`
- **Line 39:10:** [ERROR] 'loadingOptions' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  no-unused-vars (`no-unused-vars`)
- **Line 43:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 45:7:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 47:6:** [WARNING] 47:6   React Hook useEffect has missing dependencies: 'loadAdminSelectOptions' and 'selectedFilters'. Either include them or remove the dependency array. If 'setTempFilters' needs the current value of 'selectedFilters', you can also switch to useReducer instead of useState and read 'selectedFilters' in the reducer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/components/leads/EditLeadModal.jsx`
- **Line 241:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/leads/LeadDetailModal.jsx`
- **Line 27:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/leads/LeadFilter.jsx`
*No issues found.*

#### `src/apps/admin/components/leads/LeadHeader.jsx`
*No issues found.*

#### `src/apps/admin/components/leads/LeadPipeLine.jsx`
*No issues found.*

#### `src/apps/admin/components/leads/LeadStats.jsx`
*No issues found.*

#### `src/apps/admin/components/leads/LeadTable.jsx`
*No issues found.*

#### `src/apps/admin/components/leads/MarkAsLossModal.jsx`
*No issues found.*

#### `src/apps/admin/components/leads/MarkAsWonModal.jsx`
- **Line 117:6:** [WARNING] 117:6  React Hook useEffect has a missing dependency: 'updatePaymentStatusByAmounts'. Either include it or remove the dependency array  react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/components/leadSummaryReport/AssignTelecallerModal.jsx`
*No issues found.*

#### `src/apps/admin/components/leadSummaryReport/BulkActionsPanel.jsx`
- **Line 18:39:** [ERROR] 'disabled' is assigned a value but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/leadSummaryReport/BulkDeleteModal.jsx`
- **Line 54:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/leadSummaryReport/ChangeStatusModal.jsx`
- **Line 108:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/leadSummaryReport/LeadHistoryModal.jsx`
- **Line 83:14:** [ERROR] 'e' is defined but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/leadSummaryReport/LeadSummaryHeader.jsx`
*No issues found.*

#### `src/apps/admin/components/leadSummaryReport/LeadSummaryTable.jsx`
*No issues found.*

#### `src/apps/admin/components/leadSummaryReport/LeadSummaryToolbar.jsx`
- **Line 46:3:** [ERROR] 'selectedDate' is assigned a value but never used   no-unused-vars (`no-unused-vars`)
- **Line 67:10:** [ERROR] 'dateActive' is assigned a value but never used     no-unused-vars (`no-unused-vars`)
- **Line 67:22:** [ERROR] 'setDateActive' is assigned a value but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/leadSummaryReport/MoveCampaignModal.jsx`
*No issues found.*

#### `src/apps/admin/components/lossLeadApproval/ApproveLossRequestModal.jsx`
- **Line 27:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/lossLeadApproval/LossLeadApprovalFilter.jsx`
*No issues found.*

#### `src/apps/admin/components/lossLeadApproval/LossLeadApprovalHeader.jsx`
*No issues found.*

#### `src/apps/admin/components/lossLeadApproval/LossLeadApprovalTable.jsx`
*No issues found.*

#### `src/apps/admin/components/lossLeadApproval/RejectLossRequestModal.jsx`
- **Line 29:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/pendingPayments/PendingPaymentFilters.jsx`
*No issues found.*

#### `src/apps/admin/components/pendingPayments/PendingPaymentHeader.jsx`
*No issues found.*

#### `src/apps/admin/components/pendingPayments/PendingPaymentStats.jsx`
*No issues found.*

#### `src/apps/admin/components/pendingPayments/PendingPaymentTable.jsx`
*No issues found.*

#### `src/apps/admin/components/performance/OtherTopPerformers.jsx`
*No issues found.*

#### `src/apps/admin/components/performance/PerformanceFilter.jsx`
*No issues found.*

#### `src/apps/admin/components/performance/PerformanceHeader.jsx`
*No issues found.*

#### `src/apps/admin/components/performance/PerformanceTable.jsx`
*No issues found.*

#### `src/apps/admin/components/performance/TopPerformersCard.jsx`
*No issues found.*

#### `src/apps/admin/components/pipeline/CampaignCards.jsx`
*No issues found.*

#### `src/apps/admin/components/pipeline/LeadDistributionTable.jsx`
*No issues found.*

#### `src/apps/admin/components/pipeline/modals/DeleteCampaignModal.jsx`
- **Line 59:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 63:7:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 65:6:** [WARNING] 65:6  React Hook useEffect has missing dependencies: 'campaign' and 'loadDestinationCampaigns'. Either include them or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/components/pipeline/modals/EditCampaignModal.jsx`
- **Line 199:11:** [ERROR] 'hasPermission' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          no-unused-vars (`no-unused-vars`)
- **Line 225:7:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 227:6:** [WARNING] 227:6   React Hook useEffect has a missing dependency: 'loadInitialData'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 357:9:** [ERROR] 'handleAgentSelectChange' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/pipeline/modals/PauseCampaignModal.jsx`
*No issues found.*

#### `src/apps/admin/components/pipeline/PipelineHeader.jsx`
*No issues found.*

#### `src/apps/admin/components/pipeline/PipelineStatsCards.jsx`
*No issues found.*

#### `src/apps/admin/components/pipeline/SheetCard.jsx`
*No issues found.*

#### `src/apps/admin/components/pipeline/SheetHeader.jsx`
- **Line 19:3:** [ERROR] 'isCampaignActive' is assigned a value but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/reports/CampaignLeadReportDetail.jsx`
*No issues found.*

#### `src/apps/admin/components/reports/CampaignReportDetail.jsx`
*No issues found.*

#### `src/apps/admin/components/reports/CampaignSourceReportDetail.jsx`
- **Line 1:8:** [ERROR] 'React' is defined but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/reports/CampaignStageReportDetail.jsx`
*No issues found.*

#### `src/apps/admin/components/reports/DownloadLogsDetail.jsx`
- **Line 79:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/reports/LeadDispositionReportDetail.jsx`
*No issues found.*

#### `src/apps/admin/components/reports/LoginReportDetail.jsx`
- **Line 18:8:** [ERROR] 'FileDownloadOutlinedIcon' is defined but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/reports/UserDealReportDetail.jsx`
*No issues found.*

#### `src/apps/admin/components/reports/UserFollowUpReportDetail.jsx`
*No issues found.*

#### `src/apps/admin/components/reports/UserReportDetail.jsx`
*No issues found.*

#### `src/apps/admin/components/reports/UserStageReportDetail.jsx`
*No issues found.*

#### `src/apps/admin/components/settings/courseManagement/CourseManagementView.jsx`
- **Line 222:10:** [ERROR] 'DetailRow' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              no-unused-vars (`no-unused-vars`)
- **Line 549:9:** [ERROR] 'handleCloseToast' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              no-unused-vars (`no-unused-vars`)
- **Line 657:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 662:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/monthlyTarget/MonthlyTargetView.jsx`
- **Line 53:7:** [ERROR] 'ACCENT_PURPLE' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          no-unused-vars (`no-unused-vars`)
- **Line 69:10:** [ERROR] 'loading' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                no-unused-vars (`no-unused-vars`)
- **Line 258:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 263:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 269:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/monthlyTarget/SetTargetModal.jsx`
- **Line 98:7:** [ERROR] 'MONTHS' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           no-unused-vars (`no-unused-vars`)
- **Line 100:14:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        react-refresh/only-export-components (`react-refresh/only-export-components`)
- **Line 196:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/organization/EditOrganizationModal.jsx`
- **Line 191:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 243:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/organization/OrganizationProfileDetails.jsx`
- **Line 98:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/organization/OrganizationProfileForm.jsx`
- **Line 222:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/organization/OrganizationView.jsx`
- **Line 185:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/pipeline/AddStageModal.jsx`
- **Line 18:14:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           react-refresh/only-export-components (`react-refresh/only-export-components`)
- **Line 157:9:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 200:42:** [ERROR] Error: Cannot access variable before it is declared (`declared`)

#### `src/apps/admin/components/settings/pipeline/AddTagModal.jsx`
- **Line 126:9:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 165:42:** [ERROR] Error: Cannot access variable before it is declared (`declared`)

#### `src/apps/admin/components/settings/pipeline/ColorPickerSection.jsx`
- **Line 13:14:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           react-refresh/only-export-components (`react-refresh/only-export-components`)
- **Line 140:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 177:42:** [ERROR] Error: Cannot access variable before it is declared (`declared`)

#### `src/apps/admin/components/settings/pipeline/CreatePipelineModal.jsx`
- **Line 137:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 540:30:** [ERROR] Duplicate key 'borderRadius'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    no-dupe-keys (`no-dupe-keys`)

#### `src/apps/admin/components/settings/pipeline/DeleteStageModal.jsx`
*No issues found.*

#### `src/apps/admin/components/settings/pipeline/DeleteTagModal.jsx`
*No issues found.*

#### `src/apps/admin/components/settings/pipeline/MoveLeadsModal.jsx`
- **Line 42:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 46:6:** [WARNING] 46:6  React Hook useEffect has a missing dependency: 'eligibleStages'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/components/settings/pipeline/MoveTagLeadsModal.jsx`
- **Line 40:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 50:6:** [WARNING] 50:6  React Hook useEffect has missing dependencies: 'availableStages' and 'tag?.name'. Either include them or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/components/settings/pipeline/PipelineView.jsx`
- **Line 198:10:** [ERROR] 'isSaving' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          no-unused-vars (`no-unused-vars`)
- **Line 198:20:** [ERROR] 'setIsSaving' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       no-unused-vars (`no-unused-vars`)
- **Line 452:13:** [ERROR] 'activeStageObj' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    no-unused-vars (`no-unused-vars`)
- **Line 492:6:** [WARNING] 492:6   React Hook useCallback has a missing dependency: 'initialPipelineId'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 495:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 526:7:** [ERROR] 'activeStageObj' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/settings/rolesAndPermissions/CreateRoleModal.jsx`
*No issues found.*

#### `src/apps/admin/components/settings/rolesAndPermissions/RolesAndPermissionsView.jsx`
- **Line 144:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/SettingTabs.jsx`
- **Line 6:14:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components (`react-refresh/only-export-components`)

#### `src/apps/admin/components/settings/teams/CreateTeamModal.jsx`
- **Line 93:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/teams/DeleteTeamModal.jsx`
*No issues found.*

#### `src/apps/admin/components/settings/teams/EditTeamModal.jsx`
- **Line 143:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/teams/TeamsView.jsx`
- **Line 264:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 269:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/users/AddUserModal.jsx`
- **Line 308:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/users/ChangePasswordModal.jsx`
- **Line 166:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/users/DeactivateUserModal.jsx`
*No issues found.*

#### `src/apps/admin/components/settings/users/DeleteUserModal.jsx`
- **Line 37:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/users/EditUserModal.jsx`
- **Line 318:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/users/TransferAllCampaignsModal.jsx`
- **Line 42:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/users/TransferLeadsSuccessModal.jsx`
*No issues found.*

#### `src/apps/admin/components/settings/users/TransferLeadsView.jsx`
- **Line 130:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/components/settings/users/TransferSingleLeadModal.jsx`
- **Line 74:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 179:9:** [ERROR] 'remainingLeads' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/components/settings/users/UserHeader.jsx`
*No issues found.*

#### `src/apps/admin/components/settings/users/UserTable.jsx`
*No issues found.*

#### `src/apps/admin/components/settings/users/ViewCampaignsModal.jsx`
- **Line 89:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/hooks/useReportExport.js`
*No issues found.*

#### `src/apps/admin/layouts/MainLayout.jsx`
*No issues found.*

#### `src/apps/admin/layouts/Navbar.jsx`
*No issues found.*

#### `src/apps/admin/layouts/Sidebar.jsx`
*No issues found.*

#### `src/apps/admin/pages/Dashboard/Dashboard.jsx`
- **Line 84:10:** [ERROR] 'exportLoading' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           no-unused-vars (`no-unused-vars`)
- **Line 121:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 266:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/pages/Integrations/IntegrationsPage.jsx`
- **Line 97:9:** [ERROR] 'handleCloseToast' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            no-unused-vars (`no-unused-vars`)
- **Line 103:5:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 104:5:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 105:5:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 106:5:** [ERROR] Error: Cannot access variable before it is declared (`declared`)

#### `src/apps/admin/pages/Leads/Leads.jsx`
- **Line 164:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 233:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 242:10:** [ERROR] 'editingLead' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    no-unused-vars (`no-unused-vars`)
- **Line 348:9:** [ERROR] 'handleSaveLead' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 no-unused-vars (`no-unused-vars`)
- **Line 395:25:** [ERROR] Error: Cannot call impure function during render (`render`)

#### `src/apps/admin/pages/LeadSummaryReport/LeadSummaryReport.jsx`
- **Line 174:13:** [ERROR] 'optFilter' is assigned a value but never used                                                                     no-unused-vars (`no-unused-vars`)
- **Line 398:6:** [WARNING] 398:6   React Hook useEffect has a missing dependency: 'getQueryParams'. Either include it or remove the dependency array  react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/pages/LossLeadApproval/LossLeadApproval.jsx`
- **Line 56:10:** [ERROR] 'totalPages' is assigned a value but never used    no-unused-vars (`no-unused-vars`)
- **Line 69:10:** [ERROR] 'toastOpen' is assigned a value but never used     no-unused-vars (`no-unused-vars`)
- **Line 69:21:** [ERROR] 'setToastOpen' is assigned a value but never used  no-unused-vars (`no-unused-vars`)
- **Line 70:10:** [ERROR] 'toastMsg' is assigned a value but never used      no-unused-vars (`no-unused-vars`)
- **Line 70:20:** [ERROR] 'setToastMsg' is assigned a value but never used   no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/pages/PendingPayments/PendingPayment.jsx`
- **Line 78:10:** [ERROR] 'totalPages' is assigned a value but never used        no-unused-vars (`no-unused-vars`)
- **Line 88:10:** [ERROR] 'toastState' is assigned a value but never used        no-unused-vars (`no-unused-vars`)
- **Line 93:9:** [ERROR] 'handleCloseToast' is assigned a value but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/pages/Performance/Performance.jsx`
- **Line 19:11:** [ERROR] 'hasPermission' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      no-unused-vars (`no-unused-vars`)
- **Line 43:10:** [ERROR] 'totalCount' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         no-unused-vars (`no-unused-vars`)
- **Line 46:25:** [ERROR] 'setTeamsDropdown' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   no-unused-vars (`no-unused-vars`)
- **Line 252:13:** [ERROR] The value assigned to 'cardBg' is not used in subsequent statements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     no-useless-assignment (`no-useless-assignment`)
- **Line 253:13:** [ERROR] The value assigned to 'borderColor' is not used in subsequent statements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                no-useless-assignment (`no-useless-assignment`)
- **Line 254:13:** [ERROR] The value assigned to 'dividerColor' is not used in subsequent statements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               no-useless-assignment (`no-useless-assignment`)
- **Line 255:13:** [ERROR] The value assigned to 'convColor' is not used in subsequent statements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  no-useless-assignment (`no-useless-assignment`)
- **Line 257:13:** [ERROR] The value assigned to 'highlight' is not used in subsequent statements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  no-useless-assignment (`no-useless-assignment`)
- **Line 361:6:** [WARNING] 361:6   React Hook useCallback has missing dependencies: 'routeState.campaign_id' and 'routeState.pipeline_id'. Either include them or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 364:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/admin/pages/Pipeline/Pipeline.jsx`
- **Line 121:33:** [ERROR] 'id' is defined but never used         no-unused-vars (`no-unused-vars`)
- **Line 183:29:** [ERROR] 'data' is defined but never used       no-unused-vars (`no-unused-vars`)
- **Line 195:22:** [ERROR] 'data' is defined but never used       no-unused-vars (`no-unused-vars`)
- **Line 207:27:** [ERROR] 'data' is defined but never used       no-unused-vars (`no-unused-vars`)
- **Line 223:29:** [ERROR] 'deletedId' is defined but never used  no-unused-vars (`no-unused-vars`)
- **Line 242:29:** [ERROR] 'data' is defined but never used       no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/pages/Pipeline/views/CallLogReport.jsx`
- **Line 3:39:** [ERROR] 'useMemo' is defined but never used                   no-unused-vars (`no-unused-vars`)
- **Line 169:24:** [ERROR] 'setSelectedDate' is assigned a value but never used  no-unused-vars (`no-unused-vars`)
- **Line 222:13:** [ERROR] 'optFilter' is assigned a value but never used        no-unused-vars (`no-unused-vars`)
- **Line 733:15:** [ERROR] 'sortedRows' is not defined                           no-undef (`no-undef`)

#### `src/apps/admin/pages/Pipeline/views/DispositionLog.jsx`
- **Line 3:39:** [ERROR] 'useMemo' is defined but never used                   no-unused-vars (`no-unused-vars`)
- **Line 136:24:** [ERROR] 'setSelectedDate' is assigned a value but never used  no-unused-vars (`no-unused-vars`)
- **Line 145:10:** [ERROR] 'dateActive' is assigned a value but never used       no-unused-vars (`no-unused-vars`)
- **Line 145:22:** [ERROR] 'setDateActive' is assigned a value but never used    no-unused-vars (`no-unused-vars`)
- **Line 194:13:** [ERROR] 'optFilter' is assigned a value but never used        no-unused-vars (`no-unused-vars`)
- **Line 718:15:** [ERROR] 'sortedRows' is not defined                           no-undef (`no-undef`)

#### `src/apps/admin/pages/Pipeline/views/EditCampaign.jsx`
- **Line 52:5:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 53:6:** [WARNING] 53:6  React Hook useEffect has a missing dependency: 'loadCampaignData'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/pages/Pipeline/views/EnquirySheet.jsx`
- **Line 99:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 100:6:** [WARNING] 100:6  React Hook useEffect has a missing dependency: 'loadEnquiryData'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/pages/Reports/Reports.jsx`
*No issues found.*

#### `src/apps/admin/pages/Settings/Settings.jsx`
- **Line 62:9:** [ERROR] 'fallbackTab' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                no-unused-vars (`no-unused-vars`)
- **Line 109:10:** [ERROR] 'totalPages' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 no-unused-vars (`no-unused-vars`)
- **Line 315:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 321:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 323:6:** [WARNING] 323:6   React Hook useEffect has a missing dependency: 'activeTab'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/admin/routes/AdminRoutes.jsx`
- **Routing Bug (Line 137):** Relative redirect `to="admin/dashboard"` missing leading slash.

#### `src/apps/admin/services/add_new_lead_service.js`
*No issues found.*

#### `src/apps/admin/services/callLogService.js`
*No issues found.*

#### `src/apps/admin/services/campaignCardsService.js`
*No issues found.*

#### `src/apps/admin/services/campaignManagementService.js`
*No issues found.*

#### `src/apps/admin/services/campaignStatsService.js`
*No issues found.*

#### `src/apps/admin/services/courseManagementService.js`
*No issues found.*

#### `src/apps/admin/services/dashboardService.js`
*No issues found.*

#### `src/apps/admin/services/dashboardSocketService.js`
*No issues found.*

#### `src/apps/admin/services/dispositionService.js`
*No issues found.*

#### `src/apps/admin/services/dropdownService.js`
*No issues found.*

#### `src/apps/admin/services/enquirySheetService.js`
*No issues found.*

#### `src/apps/admin/services/googleFormsApi.js`
*No issues found.*

#### `src/apps/admin/services/googleSheetsApi.js`
*No issues found.*

#### `src/apps/admin/services/integrationsApi.js`
*No issues found.*

#### `src/apps/admin/services/leadService.js`
*No issues found.*

#### `src/apps/admin/services/leadSummaryService.js`
*No issues found.*

#### `src/apps/admin/services/metaSdk.js`
*No issues found.*

#### `src/apps/admin/services/monthlyTargetService.js`
*No issues found.*

#### `src/apps/admin/services/organizationService.js`
- **Line 17:12:** [ERROR] 'e' is defined but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/admin/services/pendingPaymentAdminService.js`
*No issues found.*

#### `src/apps/admin/services/performanceAdminService.js`
*No issues found.*

#### `src/apps/admin/services/reportService.js`
*No issues found.*

#### `src/apps/admin/services/roleService.js`
*No issues found.*

#### `src/apps/admin/services/settingsPipelineService.js`
*No issues found.*

#### `src/apps/admin/services/teamService.js`
*No issues found.*

#### `src/apps/admin/services/userService.js`
*No issues found.*

#### `src/apps/admin/services/whatsappApi.js`
*No issues found.*

#### `src/apps/admin/utils/errorUtils.js`
*No issues found.*

### Module / Directory: `src/apps/telecalling`

#### `src/apps/telecalling/components/callDetail/CallDetailsPage.jsx`
- **Line 42:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 63:6:** [WARNING] 63:6  React Hook useEffect has a missing dependency: 'setHasPendingCallStatus'. Either include it or remove the dependency array. If 'setHasPendingCallStatus' changes too often, find the parent component that defines it and wrap that definition in useCallback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 79:6:** [WARNING] 79:6  React Hook useEffect has a missing dependency: 'setHasPendingCallStatus'. Either include it or remove the dependency array. If 'setHasPendingCallStatus' changes too often, find the parent component that defines it and wrap that definition in useCallback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/callDetail/CallOutcomeSection.jsx`
- **Line 188:10:** [ERROR] 'conversationOutcome' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         no-unused-vars (`no-unused-vars`)
- **Line 188:31:** [ERROR] 'setConversationOutcome' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      no-unused-vars (`no-unused-vars`)
- **Line 218:10:** [ERROR] 'tagOpen' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     no-unused-vars (`no-unused-vars`)
- **Line 218:19:** [ERROR] 'setTagOpen' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  no-unused-vars (`no-unused-vars`)
- **Line 232:5:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 233:6:** [WARNING] 233:6   React Hook useEffect has a missing dependency: 'getConversationStageOptions'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 363:7:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 365:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 369:6:** [WARNING] 369:6   React Hook useEffect has a missing dependency: 'getSelectTagOptions'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 401:9:** [ERROR] 'handleFollowUp' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              no-unused-vars (`no-unused-vars`)
- **Line 585:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 589:4:** [WARNING] 589:4   React Hook useEffect has a missing dependency: 'getSelectTagOptions'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/callDetail/CallStatusCard.jsx`
*No issues found.*

#### `src/apps/telecalling/components/callDetail/DisconnectedCall.jsx`
- **Line 393:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 394:6:** [WARNING] 394:6  React Hook useEffect has a missing dependency: 'getPipelineStageOptions'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/callDetail/TimeSection.jsx`
*No issues found.*

#### `src/apps/telecalling/components/CallTimerPopup/CallTimerPopup.jsx`
- **Line 34:12:** [ERROR] 'refresh' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               no-unused-vars (`no-unused-vars`)
- **Line 101:9:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/telecalling/components/common/ActionFeedbackModal.jsx`
*No issues found.*

#### `src/apps/telecalling/components/common/selectPlaceholder.jsx`
*No issues found.*

#### `src/apps/telecalling/components/dailyReport/DailyReportCards.jsx`
- **Line 87:9:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 111:18:** [ERROR] 'err' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  no-unused-vars (`no-unused-vars`)
- **Line 278:14:** [ERROR] 'error' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                no-unused-vars (`no-unused-vars`)

#### `src/apps/telecalling/components/dailyReport/DailyReportHeader.jsx`
*No issues found.*

#### `src/apps/telecalling/components/dailyReport/DailyReportPdf.jsx`
*No issues found.*

#### `src/apps/telecalling/components/dashboard/CourseAvailabilityTable.jsx`
*No issues found.*

#### `src/apps/telecalling/components/dashboard/DashboardBottomCards.jsx`
*No issues found.*

#### `src/apps/telecalling/components/dashboard/DashboardsCards.jsx`
- **Line 68:24:** [ERROR] 'setExportData' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               no-unused-vars (`no-unused-vars`)
- **Line 177:13:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 183:4:** [WARNING] 183:4   React Hook useEffect has a missing dependency: 'fetchDashboardCards'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/dashboard/EnrollmentByCourseCard.jsx`
- **Line 24:9:** [WARNING] 24:9  The 'enrollment' conditional could make the dependencies of useMemo Hook (at line 138) change on every render. To fix this, wrap the initialization of 'enrollment' in its own useMemo() Hook  react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/dashboard/ExportPdfTemplate.jsx`
*No issues found.*

#### `src/apps/telecalling/components/dashboard/LossAnalysisCard.jsx`
*No issues found.*

#### `src/apps/telecalling/components/dashboard/PerformanceCard.jsx`
*No issues found.*

#### `src/apps/telecalling/components/dashboard/PipelineChart.jsx`
- **Line 30:9:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 31:8:** [WARNING] 31:8  React Hook useEffect has a missing dependency: 'fetchPipelineData'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/export/ExportButton.jsx`
*No issues found.*

#### `src/apps/telecalling/components/export/ExportColumnsModal.jsx`
- **Line 35:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/telecalling/components/export/ExportDialog.jsx`
*No issues found.*

#### `src/apps/telecalling/components/filters/CommonFilters.jsx`
*No issues found.*

#### `src/apps/telecalling/components/filters/FilterButton.jsx`
*No issues found.*

#### `src/apps/telecalling/components/filters/PipelineSelect.jsx`
*No issues found.*

#### `src/apps/telecalling/components/filters/popup/filterConfig.js`
*No issues found.*

#### `src/apps/telecalling/components/filters/popup/FilterPopup.jsx`
- **Line 52:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 54:6:** [WARNING] 54:6  React Hook useEffect has a missing dependency: 'getInitialFilters'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 56:9:** [ERROR] 'handleDropdownChange' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          no-unused-vars (`no-unused-vars`)
- **Line 158:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 160:6:** [WARNING] 160:6  React Hook useEffect has a missing dependency: 'loadFilterCategories'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/filters/popup/filterUtils.js`
*No issues found.*

#### `src/apps/telecalling/components/filters/SearchInput.jsx`
*No issues found.*

#### `src/apps/telecalling/components/filters/SortMenu.jsx`
*No issues found.*

#### `src/apps/telecalling/components/leadDetail/CallHistory.jsx`
- **Line 62:22:** [ERROR] 'error' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          no-unused-vars (`no-unused-vars`)
- **Line 72:13:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 75:8:** [WARNING] 75:8   React Hook useEffect has a missing dependency: 'getCallHistory'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 288:23:** [ERROR] 'hasAudio' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              no-unused-vars (`no-unused-vars`)
- **Line 297:23:** [ERROR] 'isDisconnected' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        no-unused-vars (`no-unused-vars`)

#### `src/apps/telecalling/components/leadDetail/DetailCard.jsx`
*No issues found.*

#### `src/apps/telecalling/components/leadDetail/LeadAction.jsx`
*No issues found.*

#### `src/apps/telecalling/components/leadDetail/LeadTopSection.jsx`
*No issues found.*

#### `src/apps/telecalling/components/leadDetail/LeadViewCards.jsx`
- **Line 122:11:** [ERROR] 'referralDetails' is assigned a value but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/telecalling/components/leadDetail/PaymentDetailsModal.jsx`
- **Line 216:9:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 224:13:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 467:19:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/telecalling/components/leadDetail/PaymentHistory.jsx`
- **Line 29:27:** [ERROR] 'leadId' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 no-unused-vars (`no-unused-vars`)
- **Line 54:9:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 56:8:** [WARNING] 56:8   React Hook useEffect has a missing dependency: 'getPaymentHistory'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/leadForm/LeadActionBar.jsx`
- **Line 17:26:** [ERROR] 'isEdit' is defined but never used     no-unused-vars (`no-unused-vars`)
- **Line 17:34:** [ERROR] 'setIsEdit' is defined but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/telecalling/components/leadForm/LeadForm.jsx`
*No issues found.*

#### `src/apps/telecalling/components/leadForm/LeadSourceSection.jsx`
- **Line 39:29:** [ERROR] 'setSourceTypeOptions' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             no-unused-vars (`no-unused-vars`)
- **Line 191:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 197:7:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 199:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 201:6:** [WARNING] 201:6   React Hook useEffect has a missing dependency: 'getCoursePlanOptions'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 205:9:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 210:9:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 212:4:** [WARNING] 212:4   React Hook useEffect has a missing dependency: 'getCourseTimingOptions'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 215:5:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 216:5:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 217:5:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 218:6:** [WARNING] 218:6   React Hook useEffect has a missing dependency: 'getLeadSourceOptions'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 236:6:** [WARNING] 236:6   React Hook useEffect has a missing dependency: 'setFormData'. Either include it or remove the dependency array. If 'setFormData' changes too often, find the parent component that defines it and wrap that definition in useCallback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 255:6:** [WARNING] 255:6   React Hook useEffect has missing dependencies: 'seeded.course_timing' and 'setFormData'. Either include them or remove the dependency array. If 'setFormData' changes too often, find the parent component that defines it and wrap that definition in useCallback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 268:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 276:6:** [WARNING] 276:6   React Hook useEffect has missing dependencies: 'seeded.course_plan' and 'setFormData'. Either include them or remove the dependency array. If 'setFormData' changes too often, find the parent component that defines it and wrap that definition in useCallback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 289:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 297:6:** [WARNING] 297:6   React Hook useEffect has missing dependencies: 'seeded.course_name' and 'setFormData'. Either include them or remove the dependency array. If 'setFormData' changes too often, find the parent component that defines it and wrap that definition in useCallback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 315:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 317:6:** [WARNING] 317:6   React Hook useEffect has missing dependencies: 'seeded.lead_source' and 'setFormData'. Either include them or remove the dependency array. If 'setFormData' changes too often, find the parent component that defines it and wrap that definition in useCallback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 335:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 337:6:** [WARNING] 337:6   React Hook useEffect has missing dependencies: 'seeded.campaign_name' and 'setFormData'. Either include them or remove the dependency array. If 'setFormData' changes too often, find the parent component that defines it and wrap that definition in useCallback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/leadForm/LossDetailsModal.jsx`
- **Line 65:13:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 68:8:** [WARNING] 68:8   React Hook useEffect has a missing dependency: 'getLossDetails'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 71:9:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 72:9:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 73:8:** [WARNING] 73:8   React Hook useEffect has missing dependencies: 'getPipelineStageOptions' and 'getReasonOptions'. Either include them or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 83:13:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 100:13:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 247:19:** [ERROR] 'response' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               no-unused-vars (`no-unused-vars`)

#### `src/apps/telecalling/components/leadForm/PaymentInfoSection.jsx`
- **Line 48:13:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 92:8:** [WARNING] 92:8   React Hook useEffect has a missing dependency: 'setFormData'. Either include it or remove the dependency array. If 'setFormData' changes too often, find the parent component that defines it and wrap that definition in useCallback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 101:13:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 108:8:** [WARNING] 108:8   React Hook useEffect has missing dependencies: 'formData.amount_paid' and 'setFormData'. Either include them or remove the dependency array. If 'setFormData' changes too often, find the parent component that defines it and wrap that definition in useCallback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 122:13:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 136:8:** [WARNING] 136:8   React Hook useEffect has missing dependencies: 'formData?.amount_paid', 'formData?.course_fees', 'leadData?.course_fees', and 'setFormData'. Either include them or remove the dependency array. If 'setFormData' changes too often, find the parent component that defines it and wrap that definition in useCallback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 139:9:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 142:11:** [ERROR] 'handleQuickFollowup' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      no-unused-vars (`no-unused-vars`)

#### `src/apps/telecalling/components/leadForm/PersonalInformationSection.jsx`
- **Line 30:28:** [ERROR] 'setEducationOptions' is assigned a value but never used                                                                                                                                                                                                                                    no-unused-vars (`no-unused-vars`)
- **Line 116:9:** [ERROR] 'validateForm' is assigned a value but never used                                                                                                                                                                                                                                           no-unused-vars (`no-unused-vars`)
- **Line 225:6:** [WARNING] 225:6   React Hook useEffect has missing dependencies: 'formData.education', 'formData.education_id', and 'setFormData'. Either include them or remove the dependency array. If 'setFormData' changes too often, find the parent component that defines it and wrap that definition in useCallback  react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/leadForm/PipelineSection.jsx`
- **Line 27:49:** [ERROR] Compilation Skipped: Existing memoization could not be preserved (`preserved`)
- **Line 27:49:** [ERROR] Compilation Skipped: Existing memoization could not be preserved (`preserved`)
- **Line 62:44:** [ERROR] Compilation Skipped: Existing memoization could not be preserved (`preserved`)
- **Line 114:9:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 115:8:** [WARNING] 115:8   React Hook useEffect has a missing dependency: 'getPipelineStageOptions'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 119:13:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 123:8:** [WARNING] 123:8   React Hook useEffect has a missing dependency: 'getPriorityOptions'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 135:8:** [WARNING] 135:8   React Hook useEffect has a missing dependency: 'setFormData'. Either include it or remove the dependency array. If 'setFormData' changes too often, find the parent component that defines it and wrap that definition in useCallback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/leadForm/ReferralSection.jsx`
- **Line 30:12:** [ERROR] 'referrals' is assigned a value but never used                                                                                                                                                                                                          no-unused-vars (`no-unused-vars`)
- **Line 30:23:** [ERROR] 'setReferrals' is assigned a value but never used                                                                                                                                                                                                       no-unused-vars (`no-unused-vars`)
- **Line 58:8:** [WARNING] 58:8   React Hook useEffect has missing dependencies: 'formData' and 'setFormData'. Either include them or remove the dependency array. If 'setFormData' changes too often, find the parent component that defines it and wrap that definition in useCallback  react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/leadForm/SaveLeadDetailsButton.jsx`
- **Line 45:8:** [WARNING] 45:8   React Hook useEffect has a missing dependency: 'formData'. Either include it or remove the dependency array  react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 249:23:** [ERROR] 'response' is assigned a value but never used                                                                no-unused-vars (`no-unused-vars`)

#### `src/apps/telecalling/components/leadForm/WonDetailsModal.jsx`
- **Line 11:5:** [ERROR] 'MenuItem' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     no-unused-vars (`no-unused-vars`)
- **Line 16:5:** [ERROR] 'Dialog' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       no-unused-vars (`no-unused-vars`)
- **Line 17:5:** [ERROR] 'DialogTitle' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  no-unused-vars (`no-unused-vars`)
- **Line 18:5:** [ERROR] 'DialogContent' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                no-unused-vars (`no-unused-vars`)
- **Line 19:5:** [ERROR] 'DialogActions' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                no-unused-vars (`no-unused-vars`)
- **Line 33:10:** [ERROR] 'selectPlaceholderProps' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       no-unused-vars (`no-unused-vars`)
- **Line 40:10:** [ERROR] 'wonData' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             no-unused-vars (`no-unused-vars`)
- **Line 41:10:** [ERROR] 'apiDataLoaded' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       no-unused-vars (`no-unused-vars`)
- **Line 73:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 74:7:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 75:7:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 77:6:** [WARNING] 77:6   React Hook useEffect has missing dependencies: 'getPipelineStageOptions' and 'getWonDetails'. Either include them or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 286:13:** [ERROR] 'response' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            no-unused-vars (`no-unused-vars`)
- **Line 355:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/telecalling/components/leads/LeadHeader.jsx`
*No issues found.*

#### `src/apps/telecalling/components/leads/LeadLookupModal.jsx`
- **Line 1:8:** [ERROR] 'React' is defined but never used               no-unused-vars (`no-unused-vars`)
- **Line 21:8:** [ERROR] 'SourceOutlinedIcon' is defined but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/telecalling/components/leads/LeadRowDetails.jsx`
- **Line 116:16:** [ERROR] 'error' is defined but never used  no-unused-vars (`no-unused-vars`)

#### `src/apps/telecalling/components/leads/LeadStats.jsx`
*No issues found.*

#### `src/apps/telecalling/components/leads/LeadTable.jsx`
*No issues found.*

#### `src/apps/telecalling/components/navbar/Navbar.jsx`
- **Line 181:38:** [ERROR] 'removeLeadItem' is assigned a value but never used                                                                                                                                                                                                                                        no-unused-vars (`no-unused-vars`)
- **Line 181:54:** [ERROR] 'markAllSeen' is assigned a value but never used                                                                                                                                                                                                                                           no-unused-vars (`no-unused-vars`)
- **Line 196:30:** [ERROR] 'event' is defined but never used                                                                                                                                                                                                                                                          no-unused-vars (`no-unused-vars`)
- **Line 347:29:** [WARNING] 347:29  The ref value 'notificationSocketRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'notificationSocketRef.current' to a variable inside the effect, and use that variable in the cleanup function  react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 348:25:** [WARNING] 348:25  The ref value 'reminderSocketRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'reminderSocketRef.current' to a variable inside the effect, and use that variable in the cleanup function          react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 350:6:** [WARNING] 350:6   React Hook useEffect has missing dependencies: 'addLeadItem' and 'syncLeadItems'. Either include them or remove the dependency array                                                                                                                                                       react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 439:7:** [ERROR] 'location' is assigned a value but never used                                                                                                                                                                                                                                              no-unused-vars (`no-unused-vars`)
- **Line 440:7:** [ERROR] 'autoReadRef' is assigned a value but never used                                                                                                                                                                                                                                           no-unused-vars (`no-unused-vars`)

#### `src/apps/telecalling/components/pendingPayments/PendingPaymentHeader.jsx`
*No issues found.*

#### `src/apps/telecalling/components/pendingPayments/PendingPaymentStats.jsx`
- **Line 21:9:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 22:8:** [WARNING] 22:8  React Hook useEffect has a missing dependency: 'fetchStats'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/pendingPayments/PendingPaymentTable.jsx`
*No issues found.*

#### `src/apps/telecalling/components/pipeline/AddNewLead.jsx`
- **Line 604:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/telecalling/components/pipeline/PipelineCards.jsx`
- **Line 107:10:** [ERROR] 'pipelineData' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              no-unused-vars (`no-unused-vars`)
- **Line 113:5:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 114:6:** [WARNING] 114:6   React Hook useEffect has a missing dependency: 'fetchPipelineCardData'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 885:39:** [ERROR] The value assigned to 'label' is not used in subsequent statements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             no-useless-assignment (`no-useless-assignment`)

#### `src/apps/telecalling/components/pipeline/pipelineExport.js`
*No issues found.*

#### `src/apps/telecalling/components/pipeline/PipelineFilters.jsx`
- **Line 59:8:** [WARNING] 59:8  React Hook useEffect has a missing dependency: 'setPayload'. Either include it or remove the dependency array. If 'setPayload' changes too often, find the parent component that defines it and wrap that definition in useCallback  react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/pipeline/PipelineHeader.jsx`
*No issues found.*

#### `src/apps/telecalling/components/pipeline/UploadLeadsModal.jsx`
- **Line 81:10:** [ERROR] 'selectedFile' is assigned a value but never used                                                                  no-unused-vars (`no-unused-vars`)
- **Line 107:10:** [ERROR] 'sources' is assigned a value but never used                                                                       no-unused-vars (`no-unused-vars`)
- **Line 281:6:** [WARNING] 281:6   React Hook useEffect has a missing dependency: 'selectedSource'. Either include it or remove the dependency array  react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/components/settings/components/Panel.jsx`
*No issues found.*

#### `src/apps/telecalling/components/settings/components/PanelHeader.jsx`
*No issues found.*

#### `src/apps/telecalling/components/settings/components/SettingRow.jsx`
*No issues found.*

#### `src/apps/telecalling/components/settings/components/StatusPill.jsx`
*No issues found.*

#### `src/apps/telecalling/components/settings/notifications/CallingCard.jsx`
*No issues found.*

#### `src/apps/telecalling/components/settings/notifications/NotificationsCard.jsx`
- **Line 28:14:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components (`react-refresh/only-export-components`)
- **Line 99:14:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components (`react-refresh/only-export-components`)
- **Line 112:14:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components (`react-refresh/only-export-components`)
- **Line 117:14:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components (`react-refresh/only-export-components`)

#### `src/apps/telecalling/components/settings/security/ActiveSessions.jsx`
- **Line 213:5:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/telecalling/components/settings/security/PasswordCard.jsx`
*No issues found.*

#### `src/apps/telecalling/components/settings/security/SecurityAlertsCard.jsx`
*No issues found.*

#### `src/apps/telecalling/components/sidebar/Sidebar.jsx`
*No issues found.*

#### `src/apps/telecalling/components/upload/UploadLeadDialog.jsx`
- **Line 83:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/telecalling/config/exportEntities.js`
*No issues found.*

#### `src/apps/telecalling/context/LeadBadgeContext.jsx`
- **Line 13:14:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components (`react-refresh/only-export-components`)
- **Line 29:14:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components (`react-refresh/only-export-components`)

#### `src/apps/telecalling/hooks/useExport.js`
*No issues found.*

#### `src/apps/telecalling/hooks/useListFilters.js`
*No issues found.*

#### `src/apps/telecalling/hooks/usePipelineSelector.js`
*No issues found.*

#### `src/apps/telecalling/hooks/useRemoteData.js`
- **Line 48:18:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/telecalling/hooks/useSessionState.js`
*No issues found.*

#### `src/apps/telecalling/layouts/MainLayout.jsx`
*No issues found.*

#### `src/apps/telecalling/pages/dailyReport/DailyReport.jsx`
*No issues found.*

#### `src/apps/telecalling/pages/dashboard/Dashboard.jsx`
*No issues found.*

#### `src/apps/telecalling/pages/leadDetails/LeadDetails.jsx`
- **Line 62:9:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 68:13:** [ERROR] The value assigned to 'base' is not used in subsequent statements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             no-useless-assignment (`no-useless-assignment`)
- **Line 107:8:** [WARNING] 107:8   React Hook useEffect has missing dependencies: 'checkIfFormDirty' and 'isReadOnly'. Either include them or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 119:9:** [ERROR] Error: Cannot access variable before it is declared (`declared`)
- **Line 121:8:** [WARNING] 121:8   React Hook useEffect has a missing dependency: 'getLeadDetails'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 131:8:** [WARNING] 131:8   React Hook useEffect has a missing dependency: 'getLeadDetails'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)
- **Line 135:9:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 137:4:** [WARNING] 137:4   React Hook useEffect has a missing dependency: 'isReadOnly'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 react-hooks/exhaustive-deps (`react-hooks/exhaustive-deps`)

#### `src/apps/telecalling/pages/leads/Leads.jsx`
- **Line 123:13:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)

#### `src/apps/telecalling/pages/pendingPayment/PendingPayment.jsx`
*No issues found.*

#### `src/apps/telecalling/pages/pipeline/Pipeline.jsx`
*No issues found.*

#### `src/apps/telecalling/pages/setting/SettingsPage.jsx`
*No issues found.*

#### `src/apps/telecalling/pages/setting/tabs/HelpTab.jsx`
*No issues found.*

#### `src/apps/telecalling/pages/setting/tabs/NotificationsTab.jsx`
*No issues found.*

#### `src/apps/telecalling/pages/setting/tabs/ProfileTab.jsx`
*No issues found.*

#### `src/apps/telecalling/pages/setting/tabs/SecurityTab.jsx`
*No issues found.*

#### `src/apps/telecalling/pages/setting/theme.js`
*No issues found.*

#### `src/apps/telecalling/routes/TelecallingRoutes.jsx`
- **Critical Routing Gap (Lines 101-145):** Missing index route and wildcard fallback route.

#### `src/apps/telecalling/services/addNewLeadService.js`
*No issues found.*

#### `src/apps/telecalling/services/callHistoryService.js`
*No issues found.*

#### `src/apps/telecalling/services/connectedCallService.js`
*No issues found.*

#### `src/apps/telecalling/services/dailyReportService.js`
*No issues found.*

#### `src/apps/telecalling/services/dashboardExportService.js`
*No issues found.*

#### `src/apps/telecalling/services/dashboardService.js`
*No issues found.*

#### `src/apps/telecalling/services/disconnectDropdownService.js`
*No issues found.*

#### `src/apps/telecalling/services/disconnectedCallService.js`
*No issues found.*

#### `src/apps/telecalling/services/fetchOneLeadFormService.js`
*No issues found.*

#### `src/apps/telecalling/services/fetchOneLeadService.js`
*No issues found.*

#### `src/apps/telecalling/services/fetchOneLossDataService.js`
*No issues found.*

#### `src/apps/telecalling/services/fetchOneWonDataService.js`
*No issues found.*

#### `src/apps/telecalling/services/importService.js`
*No issues found.*

#### `src/apps/telecalling/services/leadService.js`
*No issues found.*

#### `src/apps/telecalling/services/paymentService.js`
*No issues found.*

#### `src/apps/telecalling/services/pendingPaymentService.js`
*No issues found.*

#### `src/apps/telecalling/services/pendingPaymentTableService.js`
*No issues found.*

#### `src/apps/telecalling/services/performanceService.js`
*No issues found.*

#### `src/apps/telecalling/services/pipelinePageService.js`
*No issues found.*

#### `src/apps/telecalling/services/pipelineService.js`
*No issues found.*

#### `src/apps/telecalling/services/profileService.js`
*No issues found.*

#### `src/apps/telecalling/services/sessionService.js`
*No issues found.*

#### `src/apps/telecalling/services/settingService.js`
*No issues found.*

#### `src/apps/telecalling/utils/excelExport.js`
*No issues found.*

#### `src/apps/telecalling/utils/exportColumns.js`
*No issues found.*

#### `src/apps/telecalling/utils/listUtils.js`
*No issues found.*

### Module / Directory: `src/router/index.jsx`

#### `src/router/index.jsx`
*No issues found.*

### Module / Directory: `src/shared/components`

#### `src/shared/components/dialogs/CustomDateDialog.jsx`
*No issues found.*

#### `src/shared/components/filters/DateRangeSelect.jsx`
- **Line 10:14:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components (`react-refresh/only-export-components`)

#### `src/shared/components/filters/filterStyles.js`
*No issues found.*

#### `src/shared/components/layout/ErrorBoundary.jsx`
*No issues found.*

#### `src/shared/components/layout/PageLoader.jsx`
*No issues found.*

#### `src/shared/components/layout/ProtectedRoute.jsx`
- **Line 6:14:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components (`react-refresh/only-export-components`)

#### `src/shared/components/table/Table.jsx`
*No issues found.*

### Module / Directory: `src/shared/config`

#### `src/shared/config/env.js`
*No issues found.*

### Module / Directory: `src/shared/context`

#### `src/shared/context/AuthContext.jsx`
- **Line 86:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 186:14:** [ERROR] Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             react-refresh/only-export-components (`react-refresh/only-export-components`)

### Module / Directory: `src/shared/hooks`

#### `src/shared/hooks/useDebounce.js`
*No issues found.*

#### `src/shared/hooks/useHasOrganization.js`
*No issues found.*

### Module / Directory: `src/shared/pages`

#### `src/shared/pages/legal/PrivacyPolicy.jsx`
*No issues found.*

#### `src/shared/pages/login/Login.jsx`
*No issues found.*

#### `src/shared/pages/login/LoginDashboardAnimation.jsx`
- **Line 42:7:** [ERROR] Error: Calling setState synchronously within an effect can trigger cascading renders (`renders`)
- **Line 185:5:** [ERROR] Error: Cannot reassign variable after render completes (`completes`)

### Module / Directory: `src/shared/services`

#### `src/shared/services/authService.js`
*No issues found.*

#### `src/shared/services/axios.js`
- **Critical Auth Bug (Line 4):** Token refresh endpoint hardcoded with extra `/api/` path.

#### `src/shared/services/dropdownService.js`
- **Line 22:7:** [ERROR] The value assigned to 'force' is not used in subsequent statements  no-useless-assignment (`no-useless-assignment`)

#### `src/shared/services/exportService.js`
*No issues found.*

#### `src/shared/services/notification.jsx`
*No issues found.*

#### `src/shared/services/notificationService.js`
*No issues found.*

### Module / Directory: `src/shared/utils`

#### `src/shared/utils/dateUtils.js`
*No issues found.*

#### `src/shared/utils/mobile.js`
*No issues found.*

#### `src/shared/utils/notificationSound.js`
*No issues found.*

#### `src/shared/utils/streamPolyfill.js`
*No issues found.*

#### `src/shared/utils/validators.js`
*No issues found.*

---

## 4. Dependency and Config Findings

1. **React 19 & MUI Compatibility:**
   - `react`: `^19.2.7` and `@mui/material`: `^9.2.0` are installed.
   - Note: Material UI v9 / React 19 introduces strict immutability checks (`react-hooks/immutability`) and flags direct `setState` calls inside effect bodies. The 104 warnings in this codebase stem from this stricter React 19 linter.
2. **Redundant Charting Packages:**
   - Both `apexcharts` / `react-apexcharts` and `recharts` are present in `package.json`. Consolidate onto a single charting library to reduce initial JS download by ~450 KB.
3. **Duplicate Spreadsheet Libraries:**
   - `xlsx` (`https://cdn.sheetjs.com/...`) and `xlsx-js-style` (`^1.2.0`) are both installed. Standardize on one package to avoid duplicate AST parsing and large chunk size warnings (>860 KB).
4. **Vite Proxy & Host Configuration:**
   - `vite.config.js` includes dev proxy routes for `/adm`, `/telecalling`, `/admin`, and `/media`.
   - Ensure `VITE_ALLOWED_HOSTS` is maintained for secure ngrok tunnel preview.
5. **Fast Refresh Constraints:**
   - Several files export non-component constants (e.g. `ADMIN_ROLES` in `ProtectedRoute.jsx`, `SETTINGS_TABS` in `SettingTabs.jsx`). Extract shared constants to dedicated `.js` modules to preserve full Fast Refresh HMR capabilities.

---

## 5. Files Reviewed Checklist

All 311 JavaScript/JSX files in the project were reviewed. Zero files were skipped.

| Status | File Path |
| :---: | :--- |
| [x] Reviewed | `src/App.jsx` |
| [x] Reviewed | `src/apps/admin/components/common/AddLeadModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/common/AdminLeadRowDetails.jsx` |
| [x] Reviewed | `src/apps/admin/components/common/CreateCampaignModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/common/ExportModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/common/filters/CheckboxFilterPanel.jsx` |
| [x] Reviewed | `src/apps/admin/components/common/filters/FilterButton.jsx` |
| [x] Reviewed | `src/apps/admin/components/common/filters/FilterLeadsPanel.jsx` |
| [x] Reviewed | `src/apps/admin/components/common/filters/ReportSortMenu.jsx` |
| [x] Reviewed | `src/apps/admin/components/common/ReassignLeadModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/common/UploadLeadsDialog.jsx` |
| [x] Reviewed | `src/apps/admin/components/common/UploadLeadsModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/dashboard/BottomAnalyticsCards.jsx` |
| [x] Reviewed | `src/apps/admin/components/dashboard/DashboardHeader.jsx` |
| [x] Reviewed | `src/apps/admin/components/dashboard/FollowUpAndPaymentsTables.jsx` |
| [x] Reviewed | `src/apps/admin/components/dashboard/MetricCardsGrid.jsx` |
| [x] Reviewed | `src/apps/admin/components/dashboard/MonthlyCharts.jsx` |
| [x] Reviewed | `src/apps/admin/components/dashboard/PipelineAndPerformance.jsx` |
| [x] Reviewed | `src/apps/admin/components/integrations/ConnectedList.jsx` |
| [x] Reviewed | `src/apps/admin/components/integrations/FacebookConnectDialog.jsx` |
| [x] Reviewed | `src/apps/admin/components/integrations/googleForms/GoogleFormsConnectDialog.jsx` |
| [x] Reviewed | `src/apps/admin/components/integrations/googleForms/GoogleFormsTable.jsx` |
| [x] Reviewed | `src/apps/admin/components/integrations/googleSheets/GoogleSheetsConnectDialog.jsx` |
| [x] Reviewed | `src/apps/admin/components/integrations/googleSheets/GoogleSheetsTable.jsx` |
| [x] Reviewed | `src/apps/admin/components/integrations/steps/FormsStep.jsx` |
| [x] Reviewed | `src/apps/admin/components/integrations/steps/PageStep.jsx` |
| [x] Reviewed | `src/apps/admin/components/integrations/steps/RoutingStep.jsx` |
| [x] Reviewed | `src/apps/admin/components/integrations/whatsapp/WhatsAppConnectDialog.jsx` |
| [x] Reviewed | `src/apps/admin/components/integrations/whatsapp/WhatsAppTable.jsx` |
| [x] Reviewed | `src/apps/admin/components/leads/AdminLeadFilterPopup.jsx` |
| [x] Reviewed | `src/apps/admin/components/leads/EditLeadModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/leads/LeadDetailModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/leads/LeadFilter.jsx` |
| [x] Reviewed | `src/apps/admin/components/leads/LeadHeader.jsx` |
| [x] Reviewed | `src/apps/admin/components/leads/LeadPipeLine.jsx` |
| [x] Reviewed | `src/apps/admin/components/leads/LeadStats.jsx` |
| [x] Reviewed | `src/apps/admin/components/leads/LeadTable.jsx` |
| [x] Reviewed | `src/apps/admin/components/leads/MarkAsLossModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/leads/MarkAsWonModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/leadSummaryReport/AssignTelecallerModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/leadSummaryReport/BulkActionsPanel.jsx` |
| [x] Reviewed | `src/apps/admin/components/leadSummaryReport/BulkDeleteModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/leadSummaryReport/ChangeStatusModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/leadSummaryReport/LeadHistoryModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/leadSummaryReport/LeadSummaryHeader.jsx` |
| [x] Reviewed | `src/apps/admin/components/leadSummaryReport/LeadSummaryTable.jsx` |
| [x] Reviewed | `src/apps/admin/components/leadSummaryReport/LeadSummaryToolbar.jsx` |
| [x] Reviewed | `src/apps/admin/components/leadSummaryReport/MoveCampaignModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/lossLeadApproval/ApproveLossRequestModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/lossLeadApproval/LossLeadApprovalFilter.jsx` |
| [x] Reviewed | `src/apps/admin/components/lossLeadApproval/LossLeadApprovalHeader.jsx` |
| [x] Reviewed | `src/apps/admin/components/lossLeadApproval/LossLeadApprovalTable.jsx` |
| [x] Reviewed | `src/apps/admin/components/lossLeadApproval/RejectLossRequestModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/pendingPayments/PendingPaymentFilters.jsx` |
| [x] Reviewed | `src/apps/admin/components/pendingPayments/PendingPaymentHeader.jsx` |
| [x] Reviewed | `src/apps/admin/components/pendingPayments/PendingPaymentStats.jsx` |
| [x] Reviewed | `src/apps/admin/components/pendingPayments/PendingPaymentTable.jsx` |
| [x] Reviewed | `src/apps/admin/components/performance/OtherTopPerformers.jsx` |
| [x] Reviewed | `src/apps/admin/components/performance/PerformanceFilter.jsx` |
| [x] Reviewed | `src/apps/admin/components/performance/PerformanceHeader.jsx` |
| [x] Reviewed | `src/apps/admin/components/performance/PerformanceTable.jsx` |
| [x] Reviewed | `src/apps/admin/components/performance/TopPerformersCard.jsx` |
| [x] Reviewed | `src/apps/admin/components/pipeline/CampaignCards.jsx` |
| [x] Reviewed | `src/apps/admin/components/pipeline/LeadDistributionTable.jsx` |
| [x] Reviewed | `src/apps/admin/components/pipeline/modals/DeleteCampaignModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/pipeline/modals/EditCampaignModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/pipeline/modals/PauseCampaignModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/pipeline/PipelineHeader.jsx` |
| [x] Reviewed | `src/apps/admin/components/pipeline/PipelineStatsCards.jsx` |
| [x] Reviewed | `src/apps/admin/components/pipeline/SheetCard.jsx` |
| [x] Reviewed | `src/apps/admin/components/pipeline/SheetHeader.jsx` |
| [x] Reviewed | `src/apps/admin/components/reports/CampaignLeadReportDetail.jsx` |
| [x] Reviewed | `src/apps/admin/components/reports/CampaignReportDetail.jsx` |
| [x] Reviewed | `src/apps/admin/components/reports/CampaignSourceReportDetail.jsx` |
| [x] Reviewed | `src/apps/admin/components/reports/CampaignStageReportDetail.jsx` |
| [x] Reviewed | `src/apps/admin/components/reports/DownloadLogsDetail.jsx` |
| [x] Reviewed | `src/apps/admin/components/reports/LeadDispositionReportDetail.jsx` |
| [x] Reviewed | `src/apps/admin/components/reports/LoginReportDetail.jsx` |
| [x] Reviewed | `src/apps/admin/components/reports/UserDealReportDetail.jsx` |
| [x] Reviewed | `src/apps/admin/components/reports/UserFollowUpReportDetail.jsx` |
| [x] Reviewed | `src/apps/admin/components/reports/UserReportDetail.jsx` |
| [x] Reviewed | `src/apps/admin/components/reports/UserStageReportDetail.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/courseManagement/CourseManagementView.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/monthlyTarget/MonthlyTargetView.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/monthlyTarget/SetTargetModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/organization/EditOrganizationModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/organization/OrganizationProfileDetails.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/organization/OrganizationProfileForm.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/organization/OrganizationView.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/pipeline/AddStageModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/pipeline/AddTagModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/pipeline/ColorPickerSection.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/pipeline/CreatePipelineModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/pipeline/DeleteStageModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/pipeline/DeleteTagModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/pipeline/MoveLeadsModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/pipeline/MoveTagLeadsModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/pipeline/PipelineView.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/rolesAndPermissions/CreateRoleModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/rolesAndPermissions/RolesAndPermissionsView.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/SettingTabs.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/teams/CreateTeamModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/teams/DeleteTeamModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/teams/EditTeamModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/teams/TeamsView.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/users/AddUserModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/users/ChangePasswordModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/users/DeactivateUserModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/users/DeleteUserModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/users/EditUserModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/users/TransferAllCampaignsModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/users/TransferLeadsSuccessModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/users/TransferLeadsView.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/users/TransferSingleLeadModal.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/users/UserHeader.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/users/UserTable.jsx` |
| [x] Reviewed | `src/apps/admin/components/settings/users/ViewCampaignsModal.jsx` |
| [x] Reviewed | `src/apps/admin/hooks/useReportExport.js` |
| [x] Reviewed | `src/apps/admin/layouts/MainLayout.jsx` |
| [x] Reviewed | `src/apps/admin/layouts/Navbar.jsx` |
| [x] Reviewed | `src/apps/admin/layouts/Sidebar.jsx` |
| [x] Reviewed | `src/apps/admin/pages/Dashboard/Dashboard.jsx` |
| [x] Reviewed | `src/apps/admin/pages/Integrations/IntegrationsPage.jsx` |
| [x] Reviewed | `src/apps/admin/pages/Leads/Leads.jsx` |
| [x] Reviewed | `src/apps/admin/pages/LeadSummaryReport/LeadSummaryReport.jsx` |
| [x] Reviewed | `src/apps/admin/pages/LossLeadApproval/LossLeadApproval.jsx` |
| [x] Reviewed | `src/apps/admin/pages/PendingPayments/PendingPayment.jsx` |
| [x] Reviewed | `src/apps/admin/pages/Performance/Performance.jsx` |
| [x] Reviewed | `src/apps/admin/pages/Pipeline/Pipeline.jsx` |
| [x] Reviewed | `src/apps/admin/pages/Pipeline/views/CallLogReport.jsx` |
| [x] Reviewed | `src/apps/admin/pages/Pipeline/views/DispositionLog.jsx` |
| [x] Reviewed | `src/apps/admin/pages/Pipeline/views/EditCampaign.jsx` |
| [x] Reviewed | `src/apps/admin/pages/Pipeline/views/EnquirySheet.jsx` |
| [x] Reviewed | `src/apps/admin/pages/Reports/Reports.jsx` |
| [x] Reviewed | `src/apps/admin/pages/Settings/Settings.jsx` |
| [x] Reviewed | `src/apps/admin/routes/AdminRoutes.jsx` |
| [x] Reviewed | `src/apps/admin/services/add_new_lead_service.js` |
| [x] Reviewed | `src/apps/admin/services/callLogService.js` |
| [x] Reviewed | `src/apps/admin/services/campaignCardsService.js` |
| [x] Reviewed | `src/apps/admin/services/campaignManagementService.js` |
| [x] Reviewed | `src/apps/admin/services/campaignStatsService.js` |
| [x] Reviewed | `src/apps/admin/services/courseManagementService.js` |
| [x] Reviewed | `src/apps/admin/services/dashboardService.js` |
| [x] Reviewed | `src/apps/admin/services/dashboardSocketService.js` |
| [x] Reviewed | `src/apps/admin/services/dispositionService.js` |
| [x] Reviewed | `src/apps/admin/services/dropdownService.js` |
| [x] Reviewed | `src/apps/admin/services/enquirySheetService.js` |
| [x] Reviewed | `src/apps/admin/services/googleFormsApi.js` |
| [x] Reviewed | `src/apps/admin/services/googleSheetsApi.js` |
| [x] Reviewed | `src/apps/admin/services/integrationsApi.js` |
| [x] Reviewed | `src/apps/admin/services/leadService.js` |
| [x] Reviewed | `src/apps/admin/services/leadSummaryService.js` |
| [x] Reviewed | `src/apps/admin/services/metaSdk.js` |
| [x] Reviewed | `src/apps/admin/services/monthlyTargetService.js` |
| [x] Reviewed | `src/apps/admin/services/organizationService.js` |
| [x] Reviewed | `src/apps/admin/services/pendingPaymentAdminService.js` |
| [x] Reviewed | `src/apps/admin/services/performanceAdminService.js` |
| [x] Reviewed | `src/apps/admin/services/reportService.js` |
| [x] Reviewed | `src/apps/admin/services/roleService.js` |
| [x] Reviewed | `src/apps/admin/services/settingsPipelineService.js` |
| [x] Reviewed | `src/apps/admin/services/teamService.js` |
| [x] Reviewed | `src/apps/admin/services/userService.js` |
| [x] Reviewed | `src/apps/admin/services/whatsappApi.js` |
| [x] Reviewed | `src/apps/admin/utils/errorUtils.js` |
| [x] Reviewed | `src/apps/telecalling/components/callDetail/CallDetailsPage.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/callDetail/CallOutcomeSection.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/callDetail/CallStatusCard.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/callDetail/DisconnectedCall.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/callDetail/TimeSection.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/CallTimerPopup/CallTimerPopup.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/common/ActionFeedbackModal.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/common/selectPlaceholder.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/dailyReport/DailyReportCards.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/dailyReport/DailyReportHeader.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/dailyReport/DailyReportPdf.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/dashboard/CourseAvailabilityTable.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/dashboard/DashboardBottomCards.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/dashboard/DashboardsCards.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/dashboard/EnrollmentByCourseCard.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/dashboard/ExportPdfTemplate.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/dashboard/LossAnalysisCard.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/dashboard/PerformanceCard.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/dashboard/PipelineChart.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/export/ExportButton.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/export/ExportColumnsModal.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/export/ExportDialog.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/filters/CommonFilters.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/filters/FilterButton.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/filters/PipelineSelect.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/filters/popup/filterConfig.js` |
| [x] Reviewed | `src/apps/telecalling/components/filters/popup/FilterPopup.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/filters/popup/filterUtils.js` |
| [x] Reviewed | `src/apps/telecalling/components/filters/SearchInput.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/filters/SortMenu.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadDetail/CallHistory.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadDetail/DetailCard.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadDetail/LeadAction.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadDetail/LeadTopSection.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadDetail/LeadViewCards.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadDetail/PaymentDetailsModal.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadDetail/PaymentHistory.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadForm/LeadActionBar.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadForm/LeadForm.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadForm/LeadSourceSection.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadForm/LossDetailsModal.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadForm/PaymentInfoSection.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadForm/PersonalInformationSection.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadForm/PipelineSection.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadForm/ReferralSection.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadForm/SaveLeadDetailsButton.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leadForm/WonDetailsModal.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leads/LeadHeader.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leads/LeadLookupModal.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leads/LeadRowDetails.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leads/LeadStats.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/leads/LeadTable.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/navbar/Navbar.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/pendingPayments/PendingPaymentHeader.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/pendingPayments/PendingPaymentStats.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/pendingPayments/PendingPaymentTable.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/pipeline/AddNewLead.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/pipeline/PipelineCards.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/pipeline/pipelineExport.js` |
| [x] Reviewed | `src/apps/telecalling/components/pipeline/PipelineFilters.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/pipeline/PipelineHeader.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/pipeline/UploadLeadsModal.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/settings/components/Panel.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/settings/components/PanelHeader.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/settings/components/SettingRow.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/settings/components/StatusPill.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/settings/notifications/CallingCard.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/settings/notifications/NotificationsCard.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/settings/security/ActiveSessions.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/settings/security/PasswordCard.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/settings/security/SecurityAlertsCard.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/sidebar/Sidebar.jsx` |
| [x] Reviewed | `src/apps/telecalling/components/upload/UploadLeadDialog.jsx` |
| [x] Reviewed | `src/apps/telecalling/config/exportEntities.js` |
| [x] Reviewed | `src/apps/telecalling/context/LeadBadgeContext.jsx` |
| [x] Reviewed | `src/apps/telecalling/hooks/useExport.js` |
| [x] Reviewed | `src/apps/telecalling/hooks/useListFilters.js` |
| [x] Reviewed | `src/apps/telecalling/hooks/usePipelineSelector.js` |
| [x] Reviewed | `src/apps/telecalling/hooks/useRemoteData.js` |
| [x] Reviewed | `src/apps/telecalling/hooks/useSessionState.js` |
| [x] Reviewed | `src/apps/telecalling/layouts/MainLayout.jsx` |
| [x] Reviewed | `src/apps/telecalling/pages/dailyReport/DailyReport.jsx` |
| [x] Reviewed | `src/apps/telecalling/pages/dashboard/Dashboard.jsx` |
| [x] Reviewed | `src/apps/telecalling/pages/leadDetails/LeadDetails.jsx` |
| [x] Reviewed | `src/apps/telecalling/pages/leads/Leads.jsx` |
| [x] Reviewed | `src/apps/telecalling/pages/pendingPayment/PendingPayment.jsx` |
| [x] Reviewed | `src/apps/telecalling/pages/pipeline/Pipeline.jsx` |
| [x] Reviewed | `src/apps/telecalling/pages/setting/SettingsPage.jsx` |
| [x] Reviewed | `src/apps/telecalling/pages/setting/tabs/HelpTab.jsx` |
| [x] Reviewed | `src/apps/telecalling/pages/setting/tabs/NotificationsTab.jsx` |
| [x] Reviewed | `src/apps/telecalling/pages/setting/tabs/ProfileTab.jsx` |
| [x] Reviewed | `src/apps/telecalling/pages/setting/tabs/SecurityTab.jsx` |
| [x] Reviewed | `src/apps/telecalling/pages/setting/theme.js` |
| [x] Reviewed | `src/apps/telecalling/routes/TelecallingRoutes.jsx` |
| [x] Reviewed | `src/apps/telecalling/services/addNewLeadService.js` |
| [x] Reviewed | `src/apps/telecalling/services/callHistoryService.js` |
| [x] Reviewed | `src/apps/telecalling/services/connectedCallService.js` |
| [x] Reviewed | `src/apps/telecalling/services/dailyReportService.js` |
| [x] Reviewed | `src/apps/telecalling/services/dashboardExportService.js` |
| [x] Reviewed | `src/apps/telecalling/services/dashboardService.js` |
| [x] Reviewed | `src/apps/telecalling/services/disconnectDropdownService.js` |
| [x] Reviewed | `src/apps/telecalling/services/disconnectedCallService.js` |
| [x] Reviewed | `src/apps/telecalling/services/fetchOneLeadFormService.js` |
| [x] Reviewed | `src/apps/telecalling/services/fetchOneLeadService.js` |
| [x] Reviewed | `src/apps/telecalling/services/fetchOneLossDataService.js` |
| [x] Reviewed | `src/apps/telecalling/services/fetchOneWonDataService.js` |
| [x] Reviewed | `src/apps/telecalling/services/importService.js` |
| [x] Reviewed | `src/apps/telecalling/services/leadService.js` |
| [x] Reviewed | `src/apps/telecalling/services/paymentService.js` |
| [x] Reviewed | `src/apps/telecalling/services/pendingPaymentService.js` |
| [x] Reviewed | `src/apps/telecalling/services/pendingPaymentTableService.js` |
| [x] Reviewed | `src/apps/telecalling/services/performanceService.js` |
| [x] Reviewed | `src/apps/telecalling/services/pipelinePageService.js` |
| [x] Reviewed | `src/apps/telecalling/services/pipelineService.js` |
| [x] Reviewed | `src/apps/telecalling/services/profileService.js` |
| [x] Reviewed | `src/apps/telecalling/services/sessionService.js` |
| [x] Reviewed | `src/apps/telecalling/services/settingService.js` |
| [x] Reviewed | `src/apps/telecalling/utils/excelExport.js` |
| [x] Reviewed | `src/apps/telecalling/utils/exportColumns.js` |
| [x] Reviewed | `src/apps/telecalling/utils/listUtils.js` |
| [x] Reviewed | `src/main.jsx` |
| [x] Reviewed | `src/router/index.jsx` |
| [x] Reviewed | `src/shared/components/dialogs/CustomDateDialog.jsx` |
| [x] Reviewed | `src/shared/components/filters/DateRangeSelect.jsx` |
| [x] Reviewed | `src/shared/components/filters/filterStyles.js` |
| [x] Reviewed | `src/shared/components/layout/ErrorBoundary.jsx` |
| [x] Reviewed | `src/shared/components/layout/PageLoader.jsx` |
| [x] Reviewed | `src/shared/components/layout/ProtectedRoute.jsx` |
| [x] Reviewed | `src/shared/components/table/Table.jsx` |
| [x] Reviewed | `src/shared/config/env.js` |
| [x] Reviewed | `src/shared/context/AuthContext.jsx` |
| [x] Reviewed | `src/shared/hooks/useDebounce.js` |
| [x] Reviewed | `src/shared/hooks/useHasOrganization.js` |
| [x] Reviewed | `src/shared/pages/legal/PrivacyPolicy.jsx` |
| [x] Reviewed | `src/shared/pages/login/Login.jsx` |
| [x] Reviewed | `src/shared/pages/login/LoginDashboardAnimation.jsx` |
| [x] Reviewed | `src/shared/services/authService.js` |
| [x] Reviewed | `src/shared/services/axios.js` |
| [x] Reviewed | `src/shared/services/dropdownService.js` |
| [x] Reviewed | `src/shared/services/exportService.js` |
| [x] Reviewed | `src/shared/services/notification.jsx` |
| [x] Reviewed | `src/shared/services/notificationService.js` |
| [x] Reviewed | `src/shared/utils/dateUtils.js` |
| [x] Reviewed | `src/shared/utils/mobile.js` |
| [x] Reviewed | `src/shared/utils/notificationSound.js` |
| [x] Reviewed | `src/shared/utils/streamPolyfill.js` |
| [x] Reviewed | `src/shared/utils/validators.js` |

---

## 6. Top 10 Priority Fixes in Recommended Order

1. **Fix `CallLogReport.jsx` Runtime Crash (Line 733):**
   - Replace `rows={sortedRows}` with `rows={tableRows}` to eliminate the instant `ReferenceError` when visiting `/admin/call-log-report`.
2. **Fix `DispositionLog.jsx` Runtime Crash (Line 718):**
   - Replace `rows={sortedRows}` with `rows={tableRows}` to eliminate the instant `ReferenceError` when visiting `/admin/disposition-log-report`.
3. **Correct Token Refresh Endpoint in `axios.js` (Line 4):**
   - Update `REFRESH_URL` from `"/adm/api/token/refresh/"` to `"/adm/token/refresh/"` so expired tokens renew seamlessly without forcing users to re-login.
4. **Add Default & Fallback Routes in `TelecallingRoutes.jsx` (Lines 108-144):**
   - Add `<Route index element={<Navigate to="dashboard" replace />} />` and `<Route path="*" element={<Navigate to="dashboard" replace />} />` so telecallers never land on a blank screen.
5. **Fix Relative Redirect in `AdminRoutes.jsx` (Line 137):**
   - Change `to="admin/dashboard"` to `to="/admin/dashboard"` with a leading slash to prevent nested invalid URL redirects.
6. **Prevent WebSocket Memory Leaks on Logout in `Navbar.jsx` (Lines 214-221):**
   - In `src/apps/telecalling/components/navbar/Navbar.jsx`, explicitly close `notificationSocketRef` and `reminderSocketRef` during logout before navigating away.
7. **Fix Duplicate `borderRadius` Key in `CreatePipelineModal.jsx` (Line 540):**
   - Delete the duplicate `borderRadius: "10px"` property on line 539 so the object literal is valid ES syntax.
8. **Resolve TDZ Function Hoisting in Modals & Forms:**
   - Move async fetch functions (e.g. `loadInitialOptions` in `AddLeadModal.jsx`, `loadDropdownData` in `CreateCampaignModal.jsx`) above their respective `useEffect` hooks to avoid TDZ `ReferenceError` risks.
9. **Remove Variable Mutations in Render Functions:**
   - In `BottomAnalyticsCards.jsx` (Line 170) and `LoginDashboardAnimation.jsx` (Line 185), replace in-render mutations (`currentAngle += sliceAngle`, `offset += sg[0]`) with pure calculations.
10. **Prune Redundant Heavy Dependencies from `package.json`:**
    - Choose between `apexcharts` vs `recharts`, and remove the unused one. Consolidate `xlsx` vs `xlsx-js-style` to trim over 1.3 MB from the production build.
