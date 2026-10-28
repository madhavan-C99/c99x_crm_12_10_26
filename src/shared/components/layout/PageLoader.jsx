import React from "react";
import { Box, Skeleton, Grid, Paper } from "@mui/material";

/**
 * Universal CRM Page Skeleton:
 * Replaces full-page loading spinners with a realistic, responsive page skeleton.
 * Includes Header skeleton, 4 Metric/Stat card skeletons, Filter toolbar skeleton,
 * and Table row skeletons.
 */
export default function PageLoader() {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "80vh",
        p: { xs: 2, md: 3 },
        boxSizing: "border-box",
      }}
    >
      {/* 1. TOP HEADER SKELETON */}
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
        <Box>
          <Skeleton
            variant="rectangular"
            width={220}
            height={32}
            sx={{ borderRadius: 1.5, mb: 1 }}
            animation="wave"
          />
          <Skeleton
            variant="text"
            width={140}
            height={18}
            animation="wave"
          />
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Skeleton
            variant="rectangular"
            width={110}
            height={38}
            sx={{ borderRadius: 1.5 }}
            animation="wave"
          />
          <Skeleton
            variant="rectangular"
            width={120}
            height={38}
            sx={{ borderRadius: 1.5 }}
            animation="wave"
          />
        </Box>
      </Box>

      {/* 2. STAT / METRIC CARDS SKELETON */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[0, 1, 2, 3].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                backgroundColor: "#FFFFFF",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Skeleton
                  variant="text"
                  width={100}
                  height={20}
                  animation="wave"
                />
                <Skeleton
                  variant="circular"
                  width={34}
                  height={34}
                  animation="wave"
                />
              </Box>
              <Skeleton
                variant="rectangular"
                width={120}
                height={32}
                sx={{ borderRadius: 1, mb: 1 }}
                animation="wave"
              />
              <Skeleton
                variant="rectangular"
                width={70}
                height={18}
                sx={{ borderRadius: 1 }}
                animation="wave"
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 3. FILTER / SEARCH BAR SKELETON */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Skeleton
          variant="rectangular"
          width={260}
          height={40}
          sx={{ borderRadius: 1.5 }}
          animation="wave"
        />
        <Skeleton
          variant="rectangular"
          width={160}
          height={40}
          sx={{ borderRadius: 1.5 }}
          animation="wave"
        />
        <Skeleton
          variant="rectangular"
          width={140}
          height={40}
          sx={{ borderRadius: 1.5 }}
          animation="wave"
        />
        <Box sx={{ flex: 1 }} />
        <Skeleton
          variant="rectangular"
          width={100}
          height={40}
          sx={{ borderRadius: 1.5 }}
          animation="wave"
        />
      </Paper>

      {/* 4. TABLE SKELETON CONTAINER */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Table Header */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            pb: 2,
            borderBottom: "2px solid #F1F5F9",
          }}
        >
          {[120, 180, 140, 160, 130, 110].map((w, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={w}
              height={24}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
          ))}
        </Box>

        {/* Table Rows */}
        {Array.from({ length: 6 }).map((_, rIdx) => (
          <Box
            key={rIdx}
            sx={{
              display: "flex",
              gap: 2,
              py: 2,
              borderBottom: "1px solid #F8FAFC",
              alignItems: "center",
            }}
          >
            <Skeleton
              variant="rectangular"
              width={120}
              height={20}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
            <Skeleton
              variant="rectangular"
              width={180}
              height={20}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
            <Skeleton
              variant="rectangular"
              width={140}
              height={20}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
            <Skeleton
              variant="rectangular"
              width={160}
              height={20}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
            <Skeleton
              variant="rectangular"
              width={130}
              height={20}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
            <Skeleton
              variant="rectangular"
              width={110}
              height={20}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
