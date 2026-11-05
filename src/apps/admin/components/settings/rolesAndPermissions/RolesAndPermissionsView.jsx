import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Skeleton,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import InfoIcon from "@mui/icons-material/Info";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import CreateRoleModal from "./CreateRoleModal";
import {
  fetchRolesAndPermissionsAdmin,
  createRoleAdmin,
  updateRolePermissionAdmin,
} from "@/apps/admin/services/roleService";

// TODO(backend): Verify exact /adm/get_roles_and_permissions API response payload structure with backend docs
const mapRolesAndPermissionsResponse = (response) => {
  const data = response?.data?.data || response?.data || {};

  const rawRoles =
    data.roles || data.roles_list || data.role_matrix?.roles || [];
  const rawCategories =
    data.categories ||
    data.permission_categories ||
    data.categories_list ||
    data.role_matrix?.categories ||
    [];

  const roles = Array.isArray(rawRoles)
    ? rawRoles.map((r, idx) => ({
        id: String(r.id ?? r.role_id ?? r.value ?? idx + 1),
        name:
          r.name ||
          r.role_name ||
          r.label ||
          String(r.id ?? r.value ?? `Role ${idx + 1}`),
        isOrgAdmin: Boolean(
          r.is_org_admin ||
          r.is_admin ||
          String(r.name || r.role_name || r.label || "")
            .toLowerCase()
            .replace(/[\s_-]/g, "")
            .includes("orgadmin") ||
          String(r.name || r.role_name || r.label || "")
            .toLowerCase()
            .trim() === "admin",
        ),
        isExecutive: Boolean(
          r.is_executive ||
          r.isExecutive ||
          r.scope === "own" ||
          String(r.name || r.id || "")
            .toLowerCase()
            .includes("executive"),
        ),
      }))
    : [];

  const categories = Array.isArray(rawCategories)
    ? rawCategories.map((cat, catIdx) => ({
        id: String(cat.id ?? cat.category_id ?? `cat_${catIdx}`),
        name:
          cat.name ||
          cat.category_name ||
          cat.label ||
          `Category ${catIdx + 1}`,
        permissions: Array.isArray(cat.permissions)
          ? cat.permissions.map((perm, permIdx) => {
              const permId = String(
                perm.id ?? perm.permission_id ?? `perm_${permIdx}`,
              );
              const permValues = {};

              if (perm.values && typeof perm.values === "object") {
                Object.keys(perm.values).forEach((rKey) => {
                  permValues[rKey] = perm.values[rKey];
                });
              } else if (Array.isArray(perm.roles)) {
                perm.roles.forEach((r) => {
                  if (typeof r === "object") {
                    permValues[r.role_id || r.id] =
                      r.has_permission ?? r.value ?? true;
                  } else {
                    permValues[r] = true;
                  }
                });
              }

              return {
                id: permId,
                name: perm.name || perm.permission_name || perm.label || permId,
                info: perm.info || perm.description || perm.tooltip || "",
                apiCount: perm.api_count ?? perm.apiCount ?? 0,
                values: permValues,
              };
            })
          : [],
      }))
    : [];

  return { roles, categories };
};

export default function RolesAndPermissionsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rolesList, setRolesList] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);

  const loadRolesAndPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchRolesAndPermissionsAdmin();
      const mapped = mapRolesAndPermissionsResponse(res);
      setRolesList(mapped.roles);
      setCategoriesData(mapped.categories);
    } catch (err) {
      console.error("Failed to load roles and permissions:", err);
      setError("Failed to load roles and permissions data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRolesAndPermissions();
  }, [loadRolesAndPermissions]);

  const toggleCategory = (categoryId) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleTogglePermission = async (
    categoryId,
    permId,
    roleId,
    permName,
    roleName,
  ) => {
    const targetRole = rolesList.find((r) => String(r.id) === String(roleId));
    const isOrgAdmin = Boolean(
      targetRole?.isOrgAdmin ||
      String(targetRole?.name || "")
        .toLowerCase()
        .replace(/[\s_-]/g, "")
        .includes("orgadmin") ||
      String(targetRole?.name || "")
        .toLowerCase()
        .trim() === "admin",
    );
    if (isOrgAdmin) return; // Org Admin permissions are permanently granted and locked

    const catObj = categoriesData.find(
      (c) => String(c.id) === String(categoryId),
    );
    const permObj = catObj?.permissions?.find(
      (p) => String(p.id) === String(permId),
    );
    const currentValue = permObj?.values?.[roleId];

    const isCurrentlyActive = currentValue === true || currentValue === "own";
    const nextValue = !isCurrentlyActive;
    const hasPermissionBool = !isCurrentlyActive;

    try {
      await updateRolePermissionAdmin({
        role_id: roleId,
        category_id: categoryId,
        permission_id: permId,
        has_permission: hasPermissionBool,
        value: nextValue,
      });

      setCategoriesData((prevCategories) =>
        prevCategories.map((cat) => {
          if (String(cat.id) !== String(categoryId)) return cat;
          return {
            ...cat,
            permissions: cat.permissions.map((perm) => {
              if (String(perm.id) !== String(permId)) return perm;
              return {
                ...perm,
                values: {
                  ...perm.values,
                  [roleId]: nextValue,
                },
              };
            }),
          };
        }),
      );

      toast.success(
        `Permission "${permName}" for ${roleName} updated successfully!`,
      );
    } catch (err) {
      console.error("Failed to update role permission:", err);
      toast.error(`Failed to update permission "${permName}" for ${roleName}`);
    }
  };

  const handleCreateRoleSave = async ({ name, duplicateFrom }) => {
    try {
      await createRoleAdmin({
        name,
        duplicate_from: duplicateFrom,
      });
      toast.success(`Role "${name}" created successfully!`);
      await loadRolesAndPermissions();
    } catch (err) {
      console.error("Failed to create role:", err);
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to create role",
      );
      throw err;
    }
  };

  const renderValueCell = (val, isDisabled = false) => {
    const isChecked = val === true || val === "own";
    if (isChecked) {
      return (
        <CheckCircleIcon
          sx={{
            color: "#84CC16",
            fontSize: 22,
            transition: "transform 0.15s ease",
            cursor: isDisabled ? "default" : "pointer",
            ...(!isDisabled && {
              "&:hover": { transform: "scale(1.15)" },
            }),
          }}
        />
      );
    }
    return (
      <RadioButtonUncheckedIcon
        sx={{
          color: "#84CC16",
          fontSize: 22,
          transition: "transform 0.15s ease",
          cursor: isDisabled ? "default" : "pointer",
          ...(!isDisabled && {
            "&:hover": { transform: "scale(1.15)" },
          }),
        }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton variant="rectangular" width={200} height={32} sx={{ borderRadius: 1.5 }} animation="wave" />
          <Skeleton variant="rectangular" width={140} height={40} sx={{ borderRadius: 1.5 }} animation="wave" />
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, my: 1 }}>
          {[100, 120, 100, 110].map((w, idx) => (
            <Skeleton key={idx} variant="rectangular" width={w} height={38} sx={{ borderRadius: 2 }} animation="wave" />
          ))}
        </Box>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #E5E7EB" }}>
          <Box sx={{ display: "flex", gap: 2, pb: 2, borderBottom: "1px solid #E5E7EB" }}>
            <Skeleton variant="rectangular" width={250} height={24} sx={{ borderRadius: 1 }} animation="wave" />
            <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1 }} animation="wave" />
            <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1 }} animation="wave" />
            <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1 }} animation="wave" />
          </Box>
          {Array.from({ length: 6 }).map((_, rIdx) => (
            <Box key={rIdx} sx={{ display: "flex", gap: 2, py: 2, borderBottom: "1px solid #F1F5F9", alignItems: "center" }}>
              <Skeleton variant="rectangular" width={250} height={20} sx={{ borderRadius: 1 }} animation="wave" />
              <Skeleton variant="circular" width={22} height={22} animation="wave" />
              <Box sx={{ width: 78 }} />
              <Skeleton variant="circular" width={22} height={22} animation="wave" />
              <Box sx={{ width: 78 }} />
              <Skeleton variant="circular" width={22} height={22} animation="wave" />
            </Box>
          ))}
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography
          color="error"
          sx={{ mb: 2, fontFamily: "Inter, sans-serif" }}
        >
          {error}
        </Typography>
        <Button variant="outlined" onClick={loadRolesAndPermissions}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: "14px",
              color: "#64748B",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Tailor user roles and permissions to fit your company's needs.
          </Typography>
        </Box>

        {/* Create Role Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 18 }} />}
          onClick={() => setIsCreateRoleOpen(true)}
          sx={{
            backgroundColor: "#1D4ED8",
            color: "#FFFFFF",
            fontSize: "13.5px",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "6px",
            px: 2.5,
            py: 0.9,
            fontFamily: "Inter, sans-serif",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#1E40AF",
              boxShadow: "none",
            },
          }}
        >
          Create Role
        </Button>
      </Box>

      {/* Permissions Matrix Table Container */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        <Table sx={{ minWidth: 750 }}>
          {/* Table Header */}
          <TableHead sx={{ backgroundColor: "#FFFFFF" }}>
            <TableRow sx={{ height: "52px" }}>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "14.5px",
                  color: "#0F172A",
                  fontFamily: "Inter, sans-serif",
                  width: "30%",
                  pl: 3,
                  py: 1.8,
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                Permission
              </TableCell>
              {rolesList.map((role) => (
                <TableCell
                  key={role.id}
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: "14.5px",
                    color: "#0F172A",
                    fontFamily: "Inter, sans-serif",
                    py: 1.8,
                    borderBottom: "1px solid #E2E8F0",
                  }}
                >
                  {role.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {categoriesData.map((category) => {
              const isCollapsed = Boolean(collapsedCategories[category.id]);
              return (
                <React.Fragment key={category.id}>
                  {/* Category Banner Row */}
                  <TableRow
                    onClick={() => toggleCategory(category.id)}
                    sx={{
                      backgroundColor: "#EBF5D6",
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#E3EFCC" },
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <TableCell
                      colSpan={rolesList.length + 1}
                      sx={{
                        py: 1.4,
                        px: 3,
                        borderBottom: "1px solid #E2E8F0",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "14.5px",
                            color: "#0F172A",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {category.name}
                        </Typography>
                        <IconButton size="small" sx={{ color: "#0F172A", p: 0.5 }}>
                          {isCollapsed ? (
                            <KeyboardArrowDownIcon sx={{ fontSize: 22 }} />
                          ) : (
                            <KeyboardArrowUpIcon sx={{ fontSize: 22 }} />
                          )}
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>

                  {/* Permission Rows inside Category */}
                  {!isCollapsed &&
                    category.permissions.map((perm) => (
                      <TableRow
                        key={perm.id}
                        sx={{
                          backgroundColor: "#FFFFFF",
                          "&:hover": { backgroundColor: "#FAFAFA" },
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        {/* Permission Name + Info Icon */}
                        <TableCell
                          sx={{
                            py: 1.8,
                            pl: 3,
                            borderBottom: "1px solid #F0F0F0",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.2,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#1E293B",
                                fontFamily: "Inter, sans-serif",
                              }}
                            >
                              {perm.name}
                            </Typography>
                            <Tooltip title={perm.info || perm.name} arrow placement="top">
                              <InfoIcon
                                sx={{
                                  fontSize: 16,
                                  color: "#84CC16",
                                  cursor: "pointer",
                                }}
                              />
                            </Tooltip>
                          </Box>
                        </TableCell>

                        {/* Interactive Role Permission Checkbox Cells */}
                        {rolesList.map((role) => {
                          const isOrgAdmin = Boolean(
                            role.isOrgAdmin ||
                            String(role.name || "")
                              .toLowerCase()
                              .replace(/[\s_-]/g, "")
                              .includes("orgadmin") ||
                            String(role.name || "")
                              .toLowerCase()
                              .trim() === "admin",
                          );

                          return (
                            <TableCell
                              key={role.id}
                              align="center"
                              onClick={() => {
                                if (isOrgAdmin) return;
                                handleTogglePermission(
                                  category.id,
                                  perm.id,
                                  role.id,
                                  perm.name,
                                  role.name,
                                );
                              }}
                              sx={{
                                py: 1.8,
                                borderBottom: "1px solid #F0F0F0",
                                cursor: isOrgAdmin ? "default" : "pointer",
                                userSelect: "none",
                                "&:hover": {
                                  backgroundColor: isOrgAdmin
                                    ? "transparent"
                                    : "#F9FAFB",
                                },
                              }}
                            >
                              <Tooltip
                                title={
                                  isOrgAdmin
                                    ? "Org Admin has all permissions granted by default"
                                    : `Click to change ${perm.name} for ${role.name}`
                                }
                                arrow
                                placement="top"
                              >
                                <Box
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: isOrgAdmin ? "default" : "pointer",
                                  }}
                                >
                                  {renderValueCell(
                                    isOrgAdmin ? true : perm.values[role.id],
                                    isOrgAdmin,
                                  )}
                                </Box>
                              </Tooltip>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Role Modal */}
      <CreateRoleModal
        open={isCreateRoleOpen}
        onClose={() => setIsCreateRoleOpen(false)}
        onSave={handleCreateRoleSave}
        existingRoles={rolesList}
      />
    </Box>
  );
}
