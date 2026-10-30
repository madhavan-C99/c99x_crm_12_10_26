import { Box } from "@mui/material";
import SearchInput from "./SearchInput";
import DateRangeSelect from "@/shared/components/filters/DateRangeSelect";
import FilterButton from "./FilterButton";
import SortMenu from "./SortMenu";
import ExportButton from "@/apps/telecalling/components/export/ExportButton";
import { filterBarSx } from "@/shared/components/filters/filterStyles";

/**
 * Standard list-page toolbar: search | period | filter | sort | export.
 * Each piece is its own component, this file only wires them together.
 */
const CommonFilters = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  sortType,
  setSortType,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  selectedFilters,
  setSelectedFilters,
  dropdownCategory = "L_FETCH_FILTER_LEAD",
  pageName,
  getExportPayload,
  exportRows,
  selectedPipelineId = 0,
}) => (
  <Box sx={filterBarSx}>
    <SearchInput value={searchTerm} onChange={setSearchTerm} />

    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: { xs: "center", sm: "flex-end" },
        gap: 1.5,
        flexWrap: "wrap",
        width: { xs: "100%", md: "auto" },
      }}
    >
      <DateRangeSelect
        filterType={filterType}
        setFilterType={setFilterType}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
      />

      <FilterButton
        selectedFilters={selectedFilters}
        setSelectedFilters={setSelectedFilters}
        dropdownCategory={dropdownCategory}
        selectedPipelineId={selectedPipelineId}
      />

      <SortMenu sortType={sortType} setSortType={setSortType} />

      <ExportButton
        pageName={pageName}
        rows={exportRows}
        getExportPayload={getExportPayload}
      />
    </Box>
  </Box>
);

export default CommonFilters;
