import { toast } from "react-toastify";
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import useDebounce from "@/shared/hooks/useDebounce";
import SettingsTabs, {
  SETTINGS_TABS,
} from "@/apps/admin/components/settings/SettingTabs";
import { useAuth } from "@/shared/context/AuthContext";
import UsersHeader from "@/apps/admin/components/settings/users/UserHeader";
import UserTable from "@/apps/admin/components/settings/users/UserTable";
import AddUserModal from "@/apps/admin/components/settings/users/AddUserModal";
import EditUserModal from "@/apps/admin/components/settings/users/EditUserModal";
import DeactivateUserModal from "@/apps/admin/components/settings/users/DeactivateUserModal";
import ChangePasswordModal from "@/apps/admin/components/settings/users/ChangePasswordModal";
import ViewCampaignsModal from "@/apps/admin/components/settings/users/ViewCampaignsModal";
import DeleteUserModal from "@/apps/admin/components/settings/users/DeleteUserModal";
import TransferLeadsView from "@/apps/admin/components/settings/users/TransferLeadsView";
import OrganizationView from "@/apps/admin/components/settings/organization/OrganizationView";
import PipelineView from "@/apps/admin/components/settings/pipeline/PipelineView";
import TeamsView from "@/apps/admin/components/settings/teams/TeamsView";
import MonthlyTargetView from "@/apps/admin/components/settings/monthlyTarget/MonthlyTargetView";
import RolesAndPermissionsView from "@/apps/admin/components/settings/rolesAndPermissions/RolesAndPermissionsView";
import CourseManagementView from "@/apps/admin/components/settings/courseManagement/CourseManagementView";
import IntegrationsPage from "@/apps/admin/pages/Integrations/IntegrationsPage";
import {
  fetchUsersAdmin,
  createUserAdmin,
  editUserAdmin,
  changeUserPasswordAdmin,
  toggleLeadAssignmentAdmin,
  fetchUserDropdownsAdmin,
  toggleUserStatusAdmin,
} from "@/apps/admin/services/userService";

export default function Settings() {
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const tabFromQuery = searchParams.get("tab") || location.state?.tab;
  const initialPipelineId =
    searchParams.get("pipeline_id") || location.state?.pipeline_id || null;

  const allowedTabs = useMemo(
    () =>
      SETTINGS_TABS.filter((t) => !t.permission || hasPermission(t.permission)),
    [hasPermission],
  );
  const fallbackTab =
    allowedTabs.find((t) => t.id === tabFromQuery)?.id ||
    allowedTabs[0]?.id ||
    "users";

  const activeTab = useMemo(() => {
    if (tabFromQuery && allowedTabs.some((t) => t.id === tabFromQuery)) {
      return tabFromQuery;
    }
    return allowedTabs[0]?.id || "users";
  }, [tabFromQuery, allowedTabs]);

  useEffect(() => {
    const currentTab = searchParams.get("tab") || location.state?.tab;
    if (false && currentTab && currentTab !== activeTab) {
      const isAllowed = allowedTabs.some((t) => t.id === currentTab);
      if (isAllowed) {
        // do nothing
      } else if (allowedTabs.length > 0) {
        // do nothing
      }
    }
  }, [searchParams, location.state, allowedTabs, activeTab]);

  const handleTabChange = (tabId) => {
    // tab state synced via searchParams
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tabId);
      return next;
    });
  };
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeactivateUserOpen, setIsDeactivateUserOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isViewCampaignsOpen, setIsViewCampaignsOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [isTransferLeadsOpen, setIsTransferLeadsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deactivatingUser, setDeactivatingUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [transferUser, setTransferUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [sortOption, setSortOption] = useState("newest");

  // Server-Side Pagination States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [dropdownOptions, setDropdownOptions] = useState({
    rolesList: [],
    managersList: [],
    teamsList: [],
  });

  const dropdownsFetchedRef = useRef(false);
  // Load User Dropdowns (Roles, Managers, Teams) from Backend API lazily on modal open
  const loadDropdowns = useCallback(async () => {
    if (dropdownsFetchedRef.current) return;
    try {
      dropdownsFetchedRef.current = true;
      const response = await fetchUserDropdownsAdmin();
      const rawData = response?.data;
      const data = rawData?.data || rawData || {};

      let roles =
        data.roles || data.roles_list || data.role_list || data.user_roles;
      let managers =
        data.managers ||
        data.managers_list ||
        data.reporting_users ||
        data.reporting_to_list ||
        data.reporting_managers;
      let teams =
        data.teams || data.teams_list || data.team_list || data.user_teams;

      const rolesArr = Array.isArray(roles) ? roles : [];
      const managersArr = Array.isArray(managers) ? managers : [];
      const teamsArr = Array.isArray(teams) ? teams : [];

      setDropdownOptions({
        rolesList: rolesArr,
        managersList: managersArr,
        teamsList: teamsArr,
      });
    } catch (err) {
      console.error("Error loading user dropdowns from API:", err);
      dropdownsFetchedRef.current = false;
    }
  }, []);

  // Load Users from Backend API with pagination, debounced search & sort
  const loadUsers = useCallback(
    async (targetPage = page, targetPageSize = pageSize) => {
      try {
        setLoading(true);
        const response = await fetchUsersAdmin({
          search: debouncedSearchTerm,
          sort: sortOption,
          page: targetPage,
          page_size: targetPageSize,
        });
        const rawData = response?.data;
        const apiData =
          rawData?.data?.users ||
          rawData?.data?.user_list ||
          rawData?.data?.results ||
          rawData?.data ||
          rawData?.users ||
          rawData?.user_list ||
          rawData?.results ||
          rawData?.details ||
          (Array.isArray(rawData) ? rawData : []);

        const totalRec =
          rawData?.total_records ??
          rawData?.total_count ??
          rawData?.data?.total_records ??
          rawData?.data?.total_count ??
          (Array.isArray(apiData) ? apiData.length : 0);

        const totalPg =
          rawData?.total_pages ??
          rawData?.total_page ??
          (Math.ceil(totalRec / targetPageSize) || 1);

        setTotalRecords(totalRec);
        setTotalPages(totalPg);

        const formattedList = Array.isArray(apiData)
          ? apiData.map((item, idx) => ({
              id: item.id || item.user_id || idx + 1,
              s_no: (targetPage - 1) * targetPageSize + idx + 1,
              emp_id:
                item.emp_id ||
                item.employee_id ||
                item.employeeId ||
                item.emp_code ||
                item.employee_code ||
                "-",
              name:
                item.name ||
                item.full_name ||
                item.fullName ||
                item.user_name ||
                item.username ||
                "-",
              mobile_no:
                item.mobile_no ||
                item.contact_no ||
                item.contactNo ||
                item.phone_no ||
                item.phone ||
                item.mobile ||
                "-",
              location: item.location || "-",
              email: item.email || "-",
              role:
                (typeof item.role === "object"
                  ? item.role?.name || item.role?.role_name
                  : item.role) ||
                item.role_name ||
                "-",
              reporting_to:
                (typeof item.reporting_to === "string" &&
                item.reporting_to.trim()
                  ? item.reporting_to
                  : null) ||
                (typeof item.reporting_to === "object" &&
                item.reporting_to !== null
                  ? item.reporting_to.name ||
                    item.reporting_to.full_name ||
                    item.reporting_to.username
                  : null) ||
                (typeof item.reporting_manager === "object" &&
                item.reporting_manager !== null
                  ? item.reporting_manager.name ||
                    item.reporting_manager.full_name ||
                    item.reporting_manager.username
                  : null) ||
                (typeof item.reportingTo === "string"
                  ? item.reportingTo
                  : null) ||
                (typeof item.reporting_manager === "string"
                  ? item.reporting_manager
                  : null) ||
                (typeof item.manager_name === "string"
                  ? item.manager_name
                  : null) ||
                (typeof item.manager === "string" ? item.manager : null) ||
                "-",
              reporting_to_id:
                item.reporting_to_id ||
                item.reportingToId ||
                item.reporting_manager_id ||
                item.manager_id ||
                null,
              joined_date: item.joined_date || item.joinedDate || "",
              team: item.team || item.team_name || "",
              team_id: item.team_id || null,
              status: item.status || (item.is_active ? "Active" : "Deactive"),
              is_lead_enabled:
                item.is_lead_enabled !== undefined
                  ? Boolean(item.is_lead_enabled)
                  : item.disable_lead_assignment !== undefined
                    ? !item.disable_lead_assignment
                    : item.lead_assignment !== undefined
                      ? Boolean(item.lead_assignment)
                      : true,
              action_state:
                item.is_lead_enabled !== undefined
                  ? Boolean(item.is_lead_enabled)
                  : item.disable_lead_assignment !== undefined
                    ? !item.disable_lead_assignment
                    : true,
              raw: item,
            }))
          : [];

        setUsersList(formattedList);
      } catch (err) {
        console.error("Error loading users from backend API:", err);
        setUsersList([]);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearchTerm, sortOption, page, pageSize],
  );

  const prevFiltersRef = useRef({
    debouncedSearchTerm,
    sortOption,
  });

  useEffect(() => {
    if (activeTab !== "users") return;
    const prev = prevFiltersRef.current;
    const filtersChanged =
      prev.debouncedSearchTerm !== debouncedSearchTerm ||
      prev.sortOption !== sortOption;

    prevFiltersRef.current = {
      debouncedSearchTerm,
      sortOption,
    };

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }

    if (activeTab === "users") {
      loadUsers(page, pageSize);
    }
  }, [activeTab, debouncedSearchTerm, sortOption, page, pageSize, loadUsers]);

  useEffect(() => {
    if (activeTab === "users" && (isAddUserOpen || isEditUserOpen)) {
      loadDropdowns();
    }
  }, [isAddUserOpen, isEditUserOpen, loadDropdowns]);

  const handleAddUser = async (newUserData) => {
    try {
      await createUserAdmin(newUserData);
      await loadUsers();
    } catch (err) {
      console.error("Error creating user via API:", err);
      throw err;
    }
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setIsEditUserOpen(true);
  };

  const handleOpenDeactivateUser = (user) => {
    setDeactivatingUser(user);
    setIsDeactivateUserOpen(true);
  };

  const handleOpenChangePassword = (user) => {
    setPasswordUser(user);
    setIsChangePasswordOpen(true);
  };

  const handleOpenViewCampaigns = (user) => {
    setViewingUser(user);
    setIsViewCampaignsOpen(true);
  };

  const handleOpenTransferLeads = (user) => {
    setTransferUser(user);
    setIsTransferLeadsOpen(true);
  };

  const handleTransferComplete = async (updatedUserSummary) => {
    setIsTransferLeadsOpen(false);
    await loadUsers();
    if (
      !updatedUserSummary ||
      updatedUserSummary.total_leads === 0 ||
      updatedUserSummary.total_leads === undefined
    ) {
      setUserToDelete(transferUser);
      setIsDeleteUserOpen(true);
    }
  };

  const handleOpenDeleteUser = (user) => {
    setUserToDelete(user);
    setIsDeleteUserOpen(true);
  };

  const handleDeleteUserConfirm = async () => {
    await loadUsers();
  };

  const handleUpdateUser = async (updatedData) => {
    try {
      await editUserAdmin(updatedData); toast.success("User updated successfully!"); await loadUsers();
    } catch (err) {
      console.error("Error updating user via API:", err);
      throw err;
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    try {
      const isCurrentActive =
        (targetUser?.status || "").toLowerCase() === "active";
      const nextStatus = isCurrentActive ? "Inactive" : "Active";
      const userIdVal =
        targetUser?.id ||
        targetUser?.user_id ||
        targetUser?.raw?.id ||
        targetUser?.raw?.user_id;
      const empIdVal =
        targetUser?.emp_id ||
        targetUser?.raw?.emp_id ||
        targetUser?.raw?.employee_id ||
        targetUser?.raw?.emp_code ||
        "";

      await toggleUserStatusAdmin({ id: Number(userIdVal), emp_id: String(empIdVal), status: nextStatus }); toast.success(`User status changed to ${nextStatus}!`); await loadUsers();
    } catch (err) {
      console.error("Error toggling user status via API:", err);
      throw err;
    }
  };

  const handleChangePasswordSave = async ({
    user,
    newPassword,
    confirmPassword,
  }) => {
    try {
      const userIdVal =
        user?.id || user?.user_id || user?.raw?.id || user?.raw?.user_id;
      const empIdVal =
        user?.emp_id ||
        user?.raw?.emp_id ||
        user?.raw?.employee_id ||
        user?.raw?.emp_code ||
        "";

      await changeUserPasswordAdmin({ id: Number(userIdVal), emp_id: String(empIdVal), newPassword: newPassword, confirmPassword: confirmPassword || newPassword }); toast.success("User password updated successfully!"); await loadUsers();
    } catch (err) {
      console.error("Error updating password via API:", err);
      throw err;
    }
  };

  const handleToggleLeadAllocation = async (user, newLeadState) => {
    try {
      const userIdVal =
        user?.id || user?.user_id || user?.raw?.id || user?.raw?.user_id;
      const empIdVal =
        user?.emp_id ||
        user?.raw?.emp_id ||
        user?.raw?.employee_id ||
        user?.raw?.emp_code ||
        "";

      await toggleLeadAssignmentAdmin({ id: Number(userIdVal), emp_id: String(empIdVal), is_lead_enabled: Boolean(newLeadState), disable_lead_assignment: !newLeadState }); toast.success(newLeadState ? "Lead allocation enabled for user" : "Lead allocation disabled for user"); await loadUsers();
    } catch (err) {
      console.error("Error toggling lead allocation via API:", err);
    }
  };

  return (
    <Box
      sx={{
        width: "98%",
        maxWidth: "1818px",
        minHeight: "808px",
        opacity: 1,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pb: 3,
        boxSizing: "border-box",
      }}
    >
      {/* Settings Title */}
      <Typography
        variant="h5"
        sx={{ fontWeight: 600, color: "#0F172A", mb: 2, fontSize: "24px" }}
      >
        Settings
      </Typography>

      {/* Top Sub Tabs */}
      <SettingsTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Render Users View when activeTab === "users" */}
      {activeTab === "users" &&
        (isTransferLeadsOpen ? (
          <TransferLeadsView
            user={transferUser}
            onBack={() => setIsTransferLeadsOpen(false)}
            onTransferComplete={handleTransferComplete}
          />
        ) : (
          <>
            <UsersHeader
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSortChange={setSortOption}
              onAddUserClick={() => setIsAddUserOpen(true)}
            />
            <UserTable
              tableData={usersList}
              loading={loading}
              page={page}
              pageSize={pageSize}
              totalRecords={totalRecords}
              onPageChange={(event, newPage) => {
                setPage(newPage + 1);
              }}
              onRowsPerPageChange={(event) => {
                const newSize = parseInt(event.target.value, 10);
                setPageSize(newSize);
                setPage(1);
              }}
              onEditUser={handleOpenEditUser}
              onDeactivateUser={handleOpenDeactivateUser}
              onChangePassword={handleOpenChangePassword}
              onViewCampaigns={handleOpenViewCampaigns}
              onTransferLeads={handleOpenTransferLeads}
              onDeleteUser={handleOpenDeleteUser}
              onToggleLeadAllocation={handleToggleLeadAllocation}
            />
            <AddUserModal
              open={isAddUserOpen}
              onClose={() => setIsAddUserOpen(false)}
              onSave={handleAddUser}
              rolesList={dropdownOptions.rolesList}
              managersList={
                dropdownOptions.managersList.length > 0
                  ? dropdownOptions.managersList
                  : usersList
              }
              teamsList={dropdownOptions.teamsList}
            />
            <EditUserModal
              open={isEditUserOpen}
              user={editingUser}
              onClose={() => setIsEditUserOpen(false)}
              onSave={handleUpdateUser}
              rolesList={dropdownOptions.rolesList}
              managersList={
                dropdownOptions.managersList.length > 0
                  ? dropdownOptions.managersList
                  : usersList
              }
              teamsList={dropdownOptions.teamsList}
            />
            <DeactivateUserModal
              open={isDeactivateUserOpen}
              user={deactivatingUser}
              onClose={() => setIsDeactivateUserOpen(false)}
              onConfirm={handleToggleUserStatus}
            />
            <ChangePasswordModal
              open={isChangePasswordOpen}
              user={passwordUser}
              onClose={() => setIsChangePasswordOpen(false)}
              onSave={handleChangePasswordSave}
            />
            <ViewCampaignsModal
              open={isViewCampaignsOpen}
              user={viewingUser}
              onClose={() => setIsViewCampaignsOpen(false)}
            />
            <DeleteUserModal
              open={isDeleteUserOpen}
              user={userToDelete}
              onClose={() => setIsDeleteUserOpen(false)}
              onDeleteConfirm={handleDeleteUserConfirm}
              onTransferLeads={(targetUser) => {
                setIsDeleteUserOpen(false);
                handleOpenTransferLeads(targetUser);
              }}
            />
          </>
        ))}

      {/* Render Organization View when activeTab === "organization" */}
      {activeTab === "organization" &&
        hasPermission("api_get_organization_profile_admin") && (
          <OrganizationView />
        )}

      {/* Render Pipeline View when activeTab === "pipeline" */}
      {activeTab === "pipeline" &&
        hasPermission("api_fetch_loss_reasons_admin") && (
          <PipelineView initialPipelineId={initialPipelineId} />
        )}

      {/* Render Teams View when activeTab === "teams" */}
      {activeTab === "teams" && hasPermission("api_fetch_all_teams_admin") && (
        <TeamsView />
      )}

      {/* Render Roles & Permissions View when activeTab === "roles" */}
      {activeTab === "roles" &&
        hasPermission("api_get_roles_and_permissions") && (
          <RolesAndPermissionsView />
        )}

      {/* Render Monthly Target View when activeTab === "target" */}
      {activeTab === "target" &&
        hasPermission("api_fetch_monthly_target_admin") && (
          <MonthlyTargetView />
        )}

      {/* Render Course Management View when activeTab === "course_mgmt" */}
      {activeTab === "course_mgmt" && hasPermission("api_add_course") && (
        <CourseManagementView />
      )}

      {/* Render Integrations View when activeTab === "integrations" */}
      {activeTab === "integrations" && <IntegrationsPage />}
    </Box>
  );
}
