import React from "react";

import {
  Paper,
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  Box,
  Collapse,
  Checkbox,
  Skeleton,
  IconButton,
  Popover,
  FormControlLabel,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

const Table = ({
  columns = [],
  rows = [],
  loading = false,
  minWidth = 1200,
  maxHeight = "calc(100vh - 280px)",
  sx = {},
  getRowStyle,
  onRowClick,
  getRowId = (row) => row.id,
  expandedRowId = null,
  renderExpandedRow,
  selectable = false,
  onSelectionChange,
  // 🌟 NEW: pass enableColumnSettings to show the ⚙ gear icon in the header
  // that lets the user show/hide columns. Columns can opt out of being
  // hideable by setting `hideable: false` on that column definition
  // (e.g. "No" / "Action" columns you never want hidden).
  enableColumnSettings = false,
  serverSide = false,
  page: controlledPage,
  rowsPerPage: controlledRowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  pagination = true,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
}) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [selected, setSelected] = React.useState([]);
  const [settingsAnchorEl, setSettingsAnchorEl] = React.useState(null);
  const [hiddenFields, setHiddenFields] = React.useState([]);

  const rowRefs = React.useRef({});

  const containerRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(0);

  const isServer = Boolean(serverSide);
  const activeRowsPerPage =
    isServer && controlledRowsPerPage !== undefined
      ? controlledRowsPerPage
      : rowsPerPage;
  const totalRowsCount =
    isServer && totalCount !== undefined ? totalCount : rows.length;
  const maxPage = Math.max(
    0,
    Math.ceil(totalRowsCount / (activeRowsPerPage || 1)) - 1,
  );
  const paginationPage = isServer
    ? controlledPage !== undefined
      ? Math.min(Math.max(0, controlledPage), maxPage)
      : page
    : page;

  const displayRows = isServer
    ? rows
    : rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    if (isServer) {
      onPageChange?.(event, newPage);
    } else {
      setPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    if (isServer) {
      onRowsPerPageChange?.(event);
    } else {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    }
  };

  const allSelected = rows.length > 0 && selected.length === rows.length;

  const toggleAll = () => {
    const next = allSelected
      ? []
      : rows.map((row, index) => getRowId(row, index));
    setSelected(next);
    onSelectionChange?.(next);
  };

  const toggleOne = (rowId) => {
    const next = selected.includes(rowId)
      ? selected.filter((id) => id !== rowId)
      : [...selected, rowId];
    setSelected(next);
    onSelectionChange?.(next);
  };

  // 🌟 COLUMN VISIBILITY LOGIC
  const toggleableColumns = columns.filter((c) => c.hideable !== false);
  const visibleColumns = columns.filter((c) => !hiddenFields.includes(c.field));

  const handleSettingsOpen = (event) =>
    setSettingsAnchorEl(event.currentTarget);
  const handleSettingsClose = () => setSettingsAnchorEl(null);
  const settingsOpen = Boolean(settingsAnchorEl);

  const toggleFieldVisibility = (field) => {
    setHiddenFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  };

  const totalColSpan =
    visibleColumns.length +
    (selectable ? 1 : 0) +
    (enableColumnSettings ? 1 : 0);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const CHECKBOX_W = 42;
  const stickyLeftMap = {};
  let stickyAcc = selectable ? CHECKBOX_W : 0;
  visibleColumns.forEach((c) => {
    if (c.sticky) {
      stickyLeftMap[c.field] = stickyAcc;
      stickyAcc += c.stickyWidth || 70;
    }
  });

  const getStickyStyle = (column, isHeader, row) =>
    column.sticky
      ? {
          position: "sticky",
          left: stickyLeftMap[column.field],
          zIndex: isHeader ? 4 : 1,
          width: column.stickyWidth || 70,
          minWidth: column.stickyWidth || 70,
          backgroundColor: isHeader
            ? "#E6E6E6"
            : (row && getRowStyle?.(row)?.backgroundColor) || "#fff",
        }
      : {};

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        border: "1px solid #D0CCCC",
        borderRadius: "12px",
        background: "#fff",
        ...sx,
      }}
    >
      <TableContainer
        ref={containerRef}
        sx={{
          width: "100%",
          maxHeight: maxHeight,
          overflowX: "auto",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          "&::-webkit-scrollbar": {
            height: "6px",
            width: "6px",
          },
        }}
      >
        <MuiTable
          stickyHeader
          sx={{
            minWidth,
            width: "100%",
            borderCollapse: "collapse",
            "& th": {
              borderRadius: 0,
              whiteSpace: "nowrap",
              borderBottom: "none",
            },
            "& td": {
              borderRadius: 0,
              whiteSpace: "nowrap",
            },
          }}
        >
          {/* TABLE HEAD */}
          <TableHead sx={{ backgroundColor: "#E6E6E6", height: "55px" }}>
            <TableRow sx={{ backgroundColor: "#E6E6E6", height: "55px" }}>
              {selectable && (
                <TableCell
                  padding="checkbox"
                  sx={{
                    backgroundColor: "#E6E6E6",
                    borderBottom: "none",
                    height: "55px",
                    opacity: 1,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    indeterminate={selected.length > 0 && !allSelected}
                    onChange={toggleAll}
                  />
                </TableCell>
              )}
              {visibleColumns.map((column, index) => (
                <TableCell
                  key={index}
                  align={column.align || "left"}
                  sx={{
                    backgroundColor: "#E6E6E6",
                    color: "#000000",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    fontSize: "16px",
                    lineHeight: "100%",
                    letterSpacing: "0px",
                    textAlign: "center",
                    height: "55px",
                    py: 0,
                    px: 2,
                    opacity: 1,
                    minWidth: column.minWidth || "auto",
                    borderBottom: "none",
                    borderRight: "none",
                    ...getStickyStyle(column, true),
                  }}
                >
                  {column.headerName}
                </TableCell>
              ))}

              {/* 🌟 COLUMN SETTINGS GEAR ICON */}
              {enableColumnSettings && (
                <TableCell
                  align="center"
                  sx={{
                    backgroundColor: "#E6E6E6",
                    borderBottom: "none",
                    width: 48,
                    position: "sticky",
                    right: 0,
                  }}
                >
                  <IconButton size="small" onClick={handleSettingsOpen}>
                    <SettingsIcon fontSize="small" sx={{ color: "#555" }} />
                  </IconButton>

                  <Popover
                    open={settingsOpen}
                    anchorEl={settingsAnchorEl}
                    onClose={handleSettingsClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                  >
                    <Box sx={{ p: 1.5, minWidth: 200 }}>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#333",
                          mb: 0.5,
                          px: 0.5,
                        }}
                      >
                        Show / Hide Columns
                      </Typography>
                      {toggleableColumns.map((column) => (
                        <FormControlLabel
                          key={column.field}
                          sx={{ display: "flex", ml: 0, mr: 0 }}
                          control={
                            <Checkbox
                              size="small"
                              checked={!hiddenFields.includes(column.field)}
                              onChange={() =>
                                toggleFieldVisibility(column.field)
                              }
                            />
                          }
                          label={
                            <Typography
                              sx={{ fontSize: "13px", color: "#444" }}
                            >
                              {column.headerName}
                            </Typography>
                          }
                        />
                      ))}
                    </Box>
                  </Popover>
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          {/* TABLE BODY */}
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, rIdx) => (
                <TableRow key={`skeleton-row-${rIdx}`}>
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Skeleton variant="rectangular" width={20} height={20} />
                    </TableCell>
                  )}
                  {visibleColumns.map((_, cIdx) => (
                    <TableCell
                      key={`skeleton-col-${cIdx}`}
                      align="center"
                      sx={{ py: 2 }}
                    >
                      <Skeleton
                        variant="text"
                        width="80%"
                        height={24}
                        sx={{ mx: "auto" }}
                      />
                    </TableCell>
                  ))}
                  {enableColumnSettings && <TableCell />}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={totalColSpan}
                  align="center"
                  sx={{
                    py: 6,
                    height: "250px", // 1. Table சுருங்காமல் ஒரே உயரத்தில் static-ஆக இருக்க
                    borderBottom: "none",
                  }}
                >
                  {/* 2. Horizontal scroll பண்ணினாலும் screen center-ல் static-ஆக நிற்க */}
                  <Box
                    sx={{
                      position: "sticky",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "max-content",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "22px",
                        color: "#666",
                        fontWeight: 500,
                      }}
                    >
                      No Data Found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row, rowIndex) => {
                const rowId = getRowId(row, rowIndex);
                const isExpanded =
                  renderExpandedRow &&
                  expandedRowId !== null &&
                  expandedRowId !== undefined &&
                  rowId === expandedRowId;

                return (
                  <React.Fragment key={rowId ?? rowIndex}>
                    <TableRow
                      ref={(el) => {
                        rowRefs.current[rowId] = el;
                      }}
                      onClick={() => onRowClick && onRowClick(row)}
                      sx={{
                        height: "50px",
                        cursor: onRowClick ? "pointer" : "default",
                        ...(getRowStyle ? getRowStyle(row) : {}),
                      }}
                    >
                      {selectable && (
                        <TableCell
                          padding="checkbox"
                          sx={{
                            height: "50px",
                            opacity: 1,
                            borderBottom: isExpanded
                              ? "none"
                              : "2px solid #D0CCCC",
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={selected.includes(rowId)}
                            onChange={(event) => {
                              event.stopPropagation();
                              toggleOne(rowId);
                            }}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </TableCell>
                      )}
                      {visibleColumns.map((column, colIndex) => (
                        <TableCell
                          key={colIndex}
                          align={column.align || "left"}
                          sx={{
                            color: "#4D4D4D",
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 500,
                            fontSize: "14px",
                            lineHeight: "100%",
                            letterSpacing: "0px",
                            height: "50px",
                            py: 0,
                            opacity: 1,
                            whiteSpace: "nowrap",
                            minWidth: column.minWidth || "auto",
                            textAlign: "center",
                            borderBottom: isExpanded
                              ? "none"
                              : "2px solid #D0CCCC",
                            ...getStickyStyle(column, false, row),
                          }}
                        >
                          {column.renderCell
                            ? column.renderCell(row, rowIndex)
                            : row[column.field]}
                        </TableCell>
                      ))}
                      {enableColumnSettings && (
                        <TableCell
                          sx={{
                            borderBottom: isExpanded
                              ? "none"
                              : "2px solid #D0CCCC",
                          }}
                        />
                      )}
                    </TableRow>

                    {/* {renderExpandedRow && (
                        <TableRow>
                          <TableCell colSpan={totalColSpan} sx={{ p: 0, background: "#F7F7F7", border: "none" ,position: "sticky",}}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit sx={{ background: "#F7F7F7",position: "sticky", }}>
                              {renderExpandedRow(row)}
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )} */}
                    {renderExpandedRow && (
                      <TableRow>
                        <TableCell
                          colSpan={totalColSpan}
                          sx={{ p: 0, background: "#F7F7F7", border: "none" }}
                        >
                          <Collapse
                            in={isExpanded}
                            timeout="auto"
                            unmountOnExit
                            sx={{ background: "#F7F7F7", overflow: "visible" }} // 👈 sticky ku overflow visible venum
                          >
                            <Box
                              sx={{
                                position: "sticky",
                                left: 0, // 👈 horizontal scroll panninalum left la stuck
                                width: containerWidth || "100%",
                                maxWidth: "100%",
                                boxSizing: "border-box",
                                overflow: "hidden", // 👈 expanded kulla scroll illa
                                whiteSpace: "normal",

                                "& .MuiGrid-container": {
                                  flexWrap: { xs: "wrap", md: "nowrap" },
                                },
                                "& .MuiGrid-item": {
                                  minWidth: "0 !important",
                                  maxWidth: "none",
                                  flex: { xs: "1 1 100%", md: "1 1 0" },
                                  width: { xs: "100%", md: "auto" },
                                },
                              }}
                            >
                              {renderExpandedRow(row)}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </MuiTable>
      </TableContainer>

      {pagination && (
        <TablePagination
          component="div"
          count={totalRowsCount}
          page={paginationPage}
          onPageChange={handleChangePage}
          rowsPerPage={activeRowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Items per page"
          rowsPerPageOptions={rowsPerPageOptions}
          showFirstButton
          showLastButton
          sx={{
            borderTop: "1px solid #E5E5E5",
            "& .MuiTablePagination-toolbar": { minHeight: "52px" },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              { fontSize: "14px", color: "#666" },
            "& .MuiSelect-select": { fontSize: "14px" },
          }}
        />
      )}
    </Paper>
  );
};

export default Table;
