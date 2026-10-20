import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  IconButton,
  InputAdornment,
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import DownloadIcon from "@mui/icons-material/Download";

import FilterButton from "@/apps/admin/components/common/filters/FilterButton";
import DateFilterPanel from "@/apps/admin/components/common/filters/DateFilterPanel";
import CheckboxFilterPanel from "@/apps/admin/components/common/filters/CheckboxFilterPanel";
import FilterLeadsPanel from "@/apps/admin/components/common/filters/FilterLeadsPanel";
import BulkActionsPanel from "./BulkActionsPanel";

const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7 1V13M1 7H13"
      stroke="#888888"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

function LeadSummaryToolbar({
  search,
  onSearchChange,
  onSaveFilter,
  onDownload,
  onSort,
  selectedCount = 0,
  filterDropdownOptions = {},
  telecallers = [],
  selectedDate = "",
  selectedUsers = [],
  selectedStages = [],
  appliedPanelFilters = {},
  onDateApply,
  onUserApply,
  onStageApply,
  onFilterApply,
  onBulkAction,
}) {
  const [dateActive, setDateActive] = useState(false);
  const [userActive, setUserActive] = useState(false);
  const [stageActive, setStageActive] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  const activeTelecallersList =
    telecallers && telecallers.length > 0
      ? telecallers
      : [];

  const activeStagesList =
    filterDropdownOptions &&
    filterDropdownOptions.stages &&
    filterDropdownOptions.stages.length > 0
      ? filterDropdownOptions.stages
      : [];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.2,
        mb: 1.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          width: { xs: "100%", md: "auto" },
        }}
      >
        <FilterButton label="Date" active={dateActive || Boolean(selectedDate)}>
          {({ close }) => (
            <DateFilterPanel
              defaultValue={selectedDate || ""}
              onApply={(val) => {
                setDateActive(true);
                onDateApply?.(val);
                close();
              }}
            />
          )}
        </FilterButton>

        <FilterButton
          label="Assigned to"
          active={userActive || selectedUsers.length > 0}
        >
          {({ close }) => (
            <CheckboxFilterPanel
              title="Choose Assigned To"
              options={activeTelecallersList}
              defaultSelected={selectedUsers}
              onApply={(vals) => {
                setUserActive(vals.length > 0);
                onUserApply?.(vals);
                close();
              }}
            />
          )}
        </FilterButton>

        <FilterButton
          label="Stage"
          active={stageActive || selectedStages.length > 0}
        >
          {({ close }) => (
            <CheckboxFilterPanel
              title="Choose Lead Stage"
              options={activeStagesList}
              defaultSelected={selectedStages}
              onApply={(vals) => {
                setStageActive(vals.length > 0);
                onStageApply?.(vals);
                close();
              }}
            />
          )}
        </FilterButton>

        <FilterButton
          label="Filter"
          active={filterActive || Object.keys(appliedPanelFilters).length > 0}
          width={380}
        >
          {({ close }) => (
            <FilterLeadsPanel
              closePanel={close}
              initialFilters={appliedPanelFilters}
              campaignOptions={filterDropdownOptions.campaigns}
              courseOptions={filterDropdownOptions.courses}
              coursePlanOptions={filterDropdownOptions.coursePlans}
              sourceOptions={filterDropdownOptions.sources}
              paymentStatusOptions={
                filterDropdownOptions.paymentStages ||
                filterDropdownOptions.paymentStatuses
              }
              paymentStageOptions={
                filterDropdownOptions.paymentStages ||
                filterDropdownOptions.paymentStatuses
              }
              priorityOptions={
                filterDropdownOptions.tags || filterDropdownOptions.priorities
              }
              tagOptions={
                filterDropdownOptions.tags || filterDropdownOptions.priorities
              }
              onApply={(filterData) => {
                setFilterActive(true);
                onFilterApply?.(filterData);
                close();
              }}
              onReset={() => {
                setFilterActive(false);
                onFilterApply?.({});
              }}
            />
          )}
        </FilterButton>

        {/* 🌟 PERFECT WIDTH AT 310PX (No Cut-off!) */}
        <FilterButton label="Bulk Actions" width={310}>
          {({ close }) => (
            <BulkActionsPanel
              disabled={selectedCount === 0}
              onSelect={(action) => {
                onBulkAction?.(action);
                close();
              }}
            />
          )}
        </FilterButton>
      </Box>

      {/* Right Actions Cluster */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={<SwapVertIcon fontSize="small" sx={{ color: "#333" }} />}
          onClick={onSaveFilter}
          sx={{
            textTransform: "none",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: "14px",
            height: 36,
            px: 1.8,
            borderColor: "#D0D0D0",
            color: "#333",
            bgcolor: "#ffffff",
            borderRadius: "6px",
            "&:hover": { bgcolor: "#F9F9F9" },
          }}
        >
          Save Filter
        </Button>

        <TextField
          size="small"
          placeholder="Search"
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 0.8 }}>
                <PlusIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: "100%", sm: 220 },
            "& .MuiOutlinedInput-root": {
              height: 36,
              backgroundColor: "#F4F4F4",
              borderRadius: "6px",
              fontSize: "14px",
              fontFamily: "'Inter', sans-serif",
            },
          }}
        />

        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            size="small"
            onClick={onDownload}
            sx={{
              width: 36,
              height: 36,
              border: "1px solid #D0D0D0",
              bgcolor: "#fff",
            }}
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={onSort}
            sx={{
              width: 36,
              height: 36,
              border: "1px solid #D0D0D0",
              bgcolor: "#fff",
            }}
          >
            <SwapVertIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

export default LeadSummaryToolbar;
