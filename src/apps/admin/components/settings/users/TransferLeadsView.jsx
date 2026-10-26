import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import TransferAllCampaignsModal from "./TransferAllCampaignsModal";
import TransferSingleLeadModal from "./TransferSingleLeadModal";
import TransferLeadsSuccessModal from "./TransferLeadsSuccessModal";
import {
  fetchUserCampaignsAdmin,
  fetchTransferTelecallersAdmin,
  transferSingleCampaignLeadsAdmin,
  transferAllCampaignsLeadsAdmin,
} from "@/apps/admin/services/userService";

const ACCENT = "#90D916";

export default function TransferLeadsView({ user, onBack, onTransferComplete }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [isAllTransferOpen, setIsAllTransferOpen] = useState(false);
  const [isSingleTransferOpen, setIsSingleTransferOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [successDistributions, setSuccessDistributions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [campaignsData, setCampaignsData] = useState([]);
  const [userSummary, setUserSummary] = useState({
    user_id: user?.id || user?.user_id,
    user_name: user?.full_name || user?.name || "User",
    total_campaigns: 0,
    total_leads: 0,
  });
  const [telecallersList, setTelecallersList] = useState([]);

  const loadUserCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?.user_id || user?.raw?.id || user?.raw?.user_id;
      const empId = user?.emp_id && user?.emp_id !== "-" ? user.emp_id : user?.raw?.emp_id || user?.raw?.employee_id || user?.employee_id || "";
      const res = await fetchUserCampaignsAdmin({ user_id: Number(userId), emp_id: String(empId) });
      const rawData = res?.data;

      // Support nested API response structures (e.g. res.data.data.data.campaigns)
      const innerData = rawData?.data?.data || rawData?.data || rawData || {};

      setUserSummary({
        user_id: innerData.user_id || userId,
        user_name: innerData.user_name || user?.full_name || user?.name || "User",
        total_campaigns: innerData.total_campaigns ?? 0,
        total_leads: innerData.total_leads ?? 0,
      });

      let list = [];
      if (Array.isArray(innerData.campaigns)) {
        list = innerData.campaigns;
      } else if (Array.isArray(innerData.user_campaigns)) {
        list = innerData.user_campaigns;
      } else if (Array.isArray(innerData.campaign_list)) {
        list = innerData.campaign_list;
      } else if (Array.isArray(innerData.results)) {
        list = innerData.results;
      } else if (Array.isArray(innerData)) {
        list = innerData;
      } else if (Array.isArray(rawData?.data?.campaigns)) {
        list = rawData.data.campaigns;
      } else if (Array.isArray(rawData?.campaigns)) {
        list = rawData.campaigns;
      }

      setCampaignsData(list);
    } catch (err) {
      console.error("Error loading user campaigns:", err);
      setCampaignsData([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadTelecallers = useCallback(async () => {
    try {
      const userId = user?.id || user?.user_id || user?.raw?.id || user?.raw?.user_id;
      const res = await fetchTransferTelecallersAdmin({ from_user_id: userId });
      const rawData = res?.data;
      const list = Array.isArray(rawData?.data?.data)
        ? rawData.data.data
        : Array.isArray(rawData?.data?.telecallers)
        ? rawData.data.telecallers
        : Array.isArray(rawData?.data?.results)
        ? rawData.data.results
        : Array.isArray(rawData?.data)
        ? rawData.data
        : Array.isArray(rawData?.telecallers)
        ? rawData.telecallers
        : Array.isArray(rawData?.results)
        ? rawData.results
        : Array.isArray(rawData)
        ? rawData
        : [];
      setTelecallersList(list);
    } catch (err) {
      console.error("Error loading telecallers for transfer:", err);
    }
  }, [user]);

  useEffect(() => {
    loadUserCampaigns();
    loadTelecallers();
  }, [loadUserCampaigns, loadTelecallers]);

  const handleOpenAllTransfer = () => {
    setIsAllTransferOpen(true);
    setSuccessCount(userSummary.total_leads || 250);
    setSuccessDistributions([]);
  };

  const handleOpenRowTransfer = (row) => {
    setSelectedRow(row);
    setIsSingleTransferOpen(true);
    setSuccessCount(row.total_leads || 30);
  };

  const handleSingleTransferConfirm = async (transferPayload) => {
    try {
      const userId = user?.id || user?.user_id;
      const payload = {
        from_user_id: userId,
        campaign_id: selectedRow?.id,
        total_leads: selectedRow?.total_leads || 30,
        distributions: transferPayload.distributions || [],
      };
      const res = await transferSingleCampaignLeadsAdmin(payload);
      if (res?.data?.status !== false) {
        toast.success(res?.data?.message || "Leads transferred successfully!");
        setSuccessCount(selectedRow?.total_leads || 30);
        setSuccessDistributions(transferPayload.distributions || []);
        setIsSuccessModalOpen(true);
        await loadUserCampaigns();
      } else {
        toast.error(res?.data?.message || "Transfer failed");
      }
    } catch (err) {
      console.error("Error in single campaign transfer:", err);
      toast.error(err?.response?.data?.message || "Failed to transfer leads");
    }
  };

  const handleAllTransferConfirm = async (selectedTelecallerId) => {
    try {
      const userId = user?.id || user?.user_id;
      const payload = {
        from_user_id: userId,
        to_telecaller_id: selectedTelecallerId,
        total_campaigns: userSummary.total_campaigns || campaignsData.length || 10,
        total_leads: userSummary.total_leads || 250,
      };
      const res = await transferAllCampaignsLeadsAdmin(payload);
      if (res?.data?.status !== false) {
        toast.success(res?.data?.message || "All campaign leads transferred successfully!");
        const selectedTelecallerObj = telecallersList.find(
          (t) => (t.to_telecaller_id ?? t.id) === selectedTelecallerId
        );
        const telecallerName =
          selectedTelecallerObj?.name ||
          selectedTelecallerObj?.full_name ||
          "Selected Telecaller";

        setSuccessCount(userSummary.total_leads || 250);
        setSuccessDistributions([
          {
            telecaller_name: telecallerName,
            lead_count: userSummary.total_leads || 250,
          },
        ]);
        setIsSuccessModalOpen(true);
        await loadUserCampaigns();
      } else {
        toast.error(res?.data?.message || "Transfer all campaigns failed");
      }
    } catch (err) {
      console.error("Error in bulk campaign transfer:", err);
      toast.error(err?.response?.data?.message || "Failed to transfer all campaigns");
    }
  };

  const filteredData = campaignsData.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.campaign_name && item.campaign_name.toLowerCase().includes(term)) ||
      (item.pipeline_name && item.pipeline_name.toLowerCase().includes(term))
    );
  });

  return (
    <Box sx={{ width: "100%", pb: 2 }}>
      {/* Top Header Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        {/* Title with Back Arrow */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            onClick={onBack}
            sx={{
              p: 0.5,
              color: ACCENT,
              "&:hover": { backgroundColor: "#F7FEE7" },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 24, color: ACCENT }} />
          </IconButton>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "20px",
              color: "#0F172A",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Transfer Leads
          </Typography>
        </Box>

        {/* Right Search & Action Button */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Search Box */}
          <TextField
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              width: "220px",
              "& .MuiOutlinedInput-root": {
                height: "36px",
                backgroundColor: "#FFFFFF",
                borderRadius: "6px",
                fontSize: "14px",
                "& fieldset": { border: "1px solid #E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused fieldset": { border: `1px solid ${ACCENT}` },
              },
              "& .MuiInputBase-input": {
                py: 0,
                px: 1.5,
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
                color: "#374151",
                "&::placeholder": {
                  color: "#9CA3AF",
                  opacity: 1,
                },
              },
            }}
          />

          {/* Transfer All Campaigns Button */}
          <Button
            variant="contained"
            onClick={handleOpenAllTransfer}
            sx={{
              backgroundColor: ACCENT,
              color: "#FFFFFF",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              textTransform: "none",
              height: "36px",
              px: 2.5,
              borderRadius: "6px",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              "&:hover": {
                backgroundColor: "#7EC610",
              },
            }}
          >
            Transfer All Campaigns
          </Button>
        </Box>
      </Box>

      {/* Main Table Card */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: "1px solid #E2E8F0",
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
          mb: 1,
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          {/* Table Header */}
          <TableHead>
            <TableRow sx={{ backgroundColor: "#EBEBEB" }}>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#0F172A",
                  fontFamily: "Inter, sans-serif",
                  py: 1.5,
                  width: "80px",
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                S.No
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#0F172A",
                  fontFamily: "Inter, sans-serif",
                  py: 1.5,
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                Campaign Name
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#0F172A",
                  fontFamily: "Inter, sans-serif",
                  py: 1.5,
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                Pipeline Name
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#0F172A",
                  fontFamily: "Inter, sans-serif",
                  py: 1.5,
                  width: "150px",
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                Action
              </TableCell>
            </TableRow>
          </TableHead>

          {/* Table Body */}
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} sx={{ color: ACCENT }} />
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: "#64748B" }}>
                  No campaigns found for transfer.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  sx={{
                    "&:hover": { backgroundColor: "#F8FAFC" },
                    "&:last-child td, &:last-child th": { border: 0 },
                  }}
                >
                  <TableCell
                    sx={{
                      fontSize: "14px",
                      color: "#334155",
                      fontFamily: "Inter, sans-serif",
                      py: 1.2,
                    }}
                  >
                    {row.s_no ?? index + 1}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "14px",
                      color: "#334155",
                      fontFamily: "Inter, sans-serif",
                      py: 1.2,
                    }}
                  >
                    {row.campaign_name}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "14px",
                      color: "#334155",
                      fontFamily: "Inter, sans-serif",
                      py: 1.2,
                    }}
                  >
                    {row.pipeline_name}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenRowTransfer(row)}
                      sx={{
                        backgroundColor: ACCENT,
                        color: "#FFFFFF",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 600,
                        fontSize: "13px",
                        textTransform: "none",
                        height: "28px",
                        px: 2.5,
                        borderRadius: "5px",
                        boxShadow: "none",
                        "&:hover": {
                          backgroundColor: "#7EC610",
                          boxShadow: "none",
                        },
                      }}
                    >
                      Transfer
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Table Footer Pagination */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 2,
            px: 3,
            pt: 2.5,
            pb: 3.5,
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Typography
            sx={{
              fontSize: "13px",
              color: "#64748B",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Items per page:
          </Typography>

          <Select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(e.target.value)}
            size="small"
            variant="standard"
            disableUnderline
            sx={{
              fontSize: "13px",
              color: "#334155",
              fontWeight: 500,
              fontFamily: "Inter, sans-serif",
              "& .MuiSelect-select": { py: 0.2, pr: 2 },
            }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>

          <Typography
            sx={{
              fontSize: "13px",
              color: "#64748B",
              fontFamily: "Inter, sans-serif",
              ml: 1,
              mr: 1,
            }}
          >
            1-{filteredData.length} of {filteredData.length}
          </Typography>

          {/* Pagination Navigation Icons */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton size="small" sx={{ color: "#94A3B8" }}>
              <FirstPageIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton size="small" sx={{ color: "#94A3B8" }}>
              <KeyboardArrowLeft sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton size="small" sx={{ color: "#94A3B8" }}>
              <KeyboardArrowRight sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton size="small" sx={{ color: "#94A3B8" }}>
              <LastPageIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      </TableContainer>

      {/* 1. Transfer All Campaigns Modal */}
      <TransferAllCampaignsModal
        open={isAllTransferOpen}
        onClose={() => setIsAllTransferOpen(false)}
        onTransferConfirm={handleAllTransferConfirm}
        fromUserId={userSummary.user_id || user?.id || user?.user_id}
        telecallersList={telecallersList}
        title="Transfer All Campaign"
        subtitleText={null}
        campaignValueText={`${userSummary.total_campaigns || campaignsData.length} Campaigns`}
        leadsCountValueText={`${userSummary.total_leads} Leads`}
        currentAssignee={userSummary.user_name || user?.full_name || user?.name || "Ezhil"}
        totalLeadsCount={userSummary.total_leads}
        totalCampaignsCount={userSummary.total_campaigns || campaignsData.length}
      />

      {/* 2. Single Campaign / Row Transfer Lead Modal */}
      <TransferSingleLeadModal
        open={isSingleTransferOpen}
        onClose={() => setIsSingleTransferOpen(false)}
        onTransferConfirm={handleSingleTransferConfirm}
        fromUserId={userSummary.user_id || user?.id || user?.user_id}
        campaignId={selectedRow?.id || selectedRow?.campaign_id}
        telecallersList={telecallersList}
        title="Transfer Leads"
        subtitleText={`${selectedRow?.total_leads || 0} leads`}
        campaignValueText={selectedRow?.campaign_name || "Campaign"}
        leadsCountValueText={`${selectedRow?.total_leads || 0} Leads`}
        currentAssignee={userSummary.user_name || user?.full_name || user?.name || ""}
        totalLeadsCount={selectedRow?.total_leads || 0}
      />

      {/* 3. Transfer Leads Success Modal */}
      <TransferLeadsSuccessModal
        open={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          if (onTransferComplete) {
            onTransferComplete(userSummary);
          }
        }}
        count={successCount}
        distributions={successDistributions}
      />
    </Box>
  );
}
