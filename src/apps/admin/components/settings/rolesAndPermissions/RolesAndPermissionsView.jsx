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
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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

  const rawRoles = data.roles || data.roles_list || data.role_matrix?.roles || [];
  const rawCategories = data.categories || data.permission_categories || data.categories_list || data.role_matrix?.categories || [];

  const roles = Array.isArray(rawRoles)
    ? rawRoles.map((r, idx) => ({
        id: String(r.id ?? r.role_id ?? r.value ?? idx + 1),
        name: r.name || r.role_name || r.label || String(r.id ?? r.value ?? `Role ${idx + 1}`),
        isExecutive: Boolean(r.is_executive || r.isExecutive || r.scope === "own" || String(r.name || r.id || "").toLowerCase().includes("executive")),
      }))
    : [];

  const categories = Array.isArray(rawCategories)
    ? rawCategories.map((cat, catIdx) => ({
        id: String(cat.id ?? cat.category_id ?? `cat_${catIdx}`),
        name: cat.name || cat.category_name || cat.label || `Category ${catIdx + 1}`,
        permissions: Array.isArray(cat.permissions)
          ? cat.permissions.map((perm, permIdx) => {
              const permId = String(perm.id ?? perm.permission_id ?? `perm_${permIdx}`);
              const permValues = {};

              if (perm.values && typeof perm.values === "object") {
                Object.keys(perm.values).forEach((rKey) => {
                  permValues[rKey] = perm.values[rKey];
                });
              } else if (Array.isArray(perm.roles)) {
                perm.roles.forEach((r) => {
                  if (typeof r === "object") {
                    permValues[r.role_id || r.id] = r.has_permission ?? r.value ?? true;
                  } else {
                    permValues[r] = true;
                  }
                });
              }

              return {
                id: permId,
                name: perm.name || perm.permission_name || perm.label || permId,
                info: perm.info || perm.description || perm.tooltip || "",
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

  const handleTogglePermission = async (categoryId, permId, roleId, permName, roleName) => {
    const targetRole = rolesList.find((r) => String(r.id) === String(roleId));
    const isExecutiveRole = Boolean(targetRole?.isExecutive || targetRole?.scope === "own");

    const catObj = categoriesData.find((c) => String(c.id) === String(categoryId));
    const permObj = catObj?.permissions?.find((p) => String(p.id) === String(permId));
    const currentValue = permObj?.values?.[roleId];

    let nextValue;
    if (currentValue === true) {
      nextValue = isExecutiveRole ? "own" : false;
    } else if (currentValue === "own") {
      nextValue = false;
    } else {
      nextValue = true;
    }

    const hasPermissionBool = nextValue === true || nextValue === "own";

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
        })
      );

      toast.success(`Permission "${permName}" for ${roleName} updated successfully!`);
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
      toast.error(err?.response?.data?.message || err?.message || "Failed to create role");
    }
  };

  const renderValueCell = (val) => {
    if (val === true) {
      return (
        <CheckCircleIcon
          sx={{
            color: "#16A34A",
            fontSize: 22,
            transition: "transform 0.15s ease",
            "&:hover": { transform: "scale(1.2)" },
          }}
        />
      );
    }
    if (val === "own") {
      return (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.8,
            transition: "transform 0.15s ease",
            "&:hover": { transform: "scale(1.1)" },
          }}
        >
          <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 22 }} />
          <Box
            sx={{
              backgroundColor: "#F1F5F9",
              border: "1px solid #CBD5E1",
              borderRadius: "4px",
              px: "6px",
              py: "1px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#334155",
              lineHeight: 1.2,
            }}
          >
            Own
          </Box>
        </Box>
      );
    }
    return (
      <RadioButtonUncheckedIcon
        sx={{
          color: "#CBD5E1",
          fontSize: 22,
          transition: "transform 0.15s ease, color 0.15s ease",
          "&:hover": { transform: "scale(1.2)", color: "#94A3B8" },
        }}
      />
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          width: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error" sx={{ mb: 2, fontFamily: "Inter, sans-serif" }}>
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
              fontSize: "20px",
              fontWeight: 700,
              color: "#0F172A",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Roles & Permissions
          </Typography>
          <Typography
            sx={{
              fontSize: "13.5px",
              color: "#64748B",
              fontFamily: "Inter, sans-serif",
              mt: 0.3,
            }}
          >
            Tailor user roles and permissions to fit your company's needs. Click any checkbox cell to grant or revoke permission.
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
          {/* Sticky Table Header */}
          <TableHead sx={{ backgroundColor: "#FAFAFA" }}>
            <TableRow sx={{ height: "48px" }}>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#1E293B",
                  fontFamily: "Inter, sans-serif",
                  width: "30%",
                  pl: 3,
                  py: 1.5,
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
                    fontSize: "14px",
                    color: "#1E293B",
                    fontFamily: "Inter, sans-serif",
                    py: 1.5,
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
                      backgroundColor: "#ECFDF5",
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#D1FAE5" },
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <TableCell
                      colSpan={rolesList.length + 1}
                      sx={{
                        py: 1.2,
                        px: 3,
                        borderBottom: "1px solid #A7F3D0",
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
                            color: "#065F46",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {category.name}
                        </Typography>
                        <IconButton size="small" sx={{ color: "#047857" }}>
                          {isCollapsed ? (
                            <KeyboardArrowDownIcon sx={{ fontSize: 20 }} />
                          ) : (
                            <KeyboardArrowUpIcon sx={{ fontSize: 20 }} />
                          )}
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>

                  {/* Permission Rows inside Category */}
                  {!isCollapsed &&
                    category.permissions.map((perm, idx) => (
                      <TableRow
                        key={perm.id}
                        sx={{
                          backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                          "&:hover": { backgroundColor: "#F1F5F9" },
                        }}
                      >
                        {/* Permission Name + Info Icon */}
                        <TableCell
                          sx={{
                            py: 1.5,
                            pl: 3,
                            borderBottom: "1px solid #F1F5F9",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "13.5px",
                                fontWeight: 500,
                                color: "#334155",
                                fontFamily: "Inter, sans-serif",
                              }}
                            >
                              {perm.name}
                            </Typography>
                            {perm.info && (
                              <Tooltip title={perm.info} arrow placement="top">
                                <InfoOutlinedIcon
                                  sx={{
                                    fontSize: 16,
                                    color: "#94A3B8",
                                    cursor: "pointer",
                                    "&:hover": { color: "#64748B" },
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/* Interactive Role Permission Checkbox Cells */}
                        {rolesList.map((role) => (
                          <TableCell
                            key={role.id}
                            align="center"
                            onClick={() =>
                              handleTogglePermission(
                                category.id,
                                perm.id,
                                role.id,
                                perm.name,
                                role.name
                              )
                            }
                            sx={{
                              py: 1.5,
                              borderBottom: "1px solid #F1F5F9",
                              cursor: "pointer",
                              userSelect: "none",
                              "&:hover": {
                                backgroundColor: "#F1F5F9",
                              },
                            }}
                          >
                            <Tooltip
                              title={`Click to change ${perm.name} for ${role.name}`}
                              arrow
                              placement="top"
                            >
                              <Box sx={{ display: "inline-block" }}>
                                {renderValueCell(perm.values[role.id])}
                              </Box>
                            </Tooltip>
                          </TableCell>
                        ))}
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
