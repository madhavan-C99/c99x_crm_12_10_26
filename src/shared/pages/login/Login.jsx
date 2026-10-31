import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { useNavigate } from "react-router-dom";
import { loginApi } from "@/shared/services/authService";
import { ADMIN_ROLES } from "@/shared/components/layout/ProtectedRoute";

// Images (login-dashboard.webp is no longer needed - the dashboard is now vector)
import loginbg from "@/shared/assets/login/login-bg.webp";
import logo from "@/shared/assets/logo.webp";
import leftFrameImage from "@/shared/assets/login/login-frame.png";

import LoginDashboardAnimation from "./LoginDashboardAnimation";

/* ------------------------------------------------------------------ */
/* Animations                                                          */
/* ------------------------------------------------------------------ */
const rise = keyframes`
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: none; }
`;
const floaty = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-16px); }
`;
const drift = keyframes`
  from { transform: translate(0, 0) scale(1.02); }
  to   { transform: translate(-1.6%, -1.2%) scale(1.07); }
`;

const noMotion = {
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none !important",
    transition: "none !important",
  },
};

// staggered entrance for items inside the login card
const stagger = (i) => ({
  animation: `${rise} 0.65s cubic-bezier(0.2, 0.7, 0.2, 1) both`,
  animationDelay: `${i * 70}ms`,
  ...noMotion,
});

// decorative floating rings on the right side
const RINGS = [
  { size: 26, left: "12%", top: "14%", t: 6, d: 0 },
  { size: 22, left: "6%", top: "42%", t: 7, d: 0.8 },
  { size: 34, left: "24%", top: "62%", t: 8, d: 1.6 },
  { size: 30, right: "8%", top: "32%", t: 6.5, d: 0.4 },
  { size: 20, right: "16%", top: "54%", t: 7.5, d: 2 },
  { size: 28, right: "22%", bottom: "10%", t: 9, d: 1.2 },
];

// left side carousel slides
const SLIDES = [
  {
    lead: "CRM built for ",
    accent: "telecallers.",
    sub: "Track calls, manage leads, and close more admissions- all from one dashboard",
  },
  {
    lead: "Every lead in one ",
    accent: "pipeline.",
    sub: "See each stage at a glance and move leads forward without switching screens.",
  },
  {
    lead: "Follow-ups that never ",
    accent: "slip.",
    sub: "Due and missed follow-ups are surfaced for every user, every day.",
  },
];

// shared dark input styles with green focus glow
const darkFieldSx = {
  mb: 2.5,
  "& .MuiFilledInput-root": {
    height: "42px",
    background: "#1B1B1B",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "14px",
    border: "1px solid #2E2E2E",
    transition: "border-color .25s ease, box-shadow .25s ease",
    "&:hover": {
      background: "#1B1B1B",
      border: "1px solid #90D916",
    },
    "&.Mui-focused": {
      background: "#1B1B1B",
      border: "1px solid #90D916",
      boxShadow: "0 0 0 4px rgba(144, 217, 22, 0.18)",
    },
    "&:before, &:after": {
      display: "none",
    },
  },
  ...noMotion,
};

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    password: "",
    login: "",
  });

  const [loading, setLoading] = useState(false);

  // carousel
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(id);
  }, [slide]); // restart timer when user clicks a dot

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      login: "",
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    let tempErrors = {};

    if (!formData.username) {
      tempErrors.username = "Username is required";
    }

    if (!formData.password) {
      tempErrors.password = "Password is required";
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await loginApi(formData);

      // 🔍 1. Console Log for debugging Backend Response

      const tokenData = response?.data?.data?.token || response?.data?.token;
      const userData = response?.data?.data?.user || response?.data?.user;

      const accessToken =
        tokenData?.access ||
        response?.data?.access ||
        response?.data?.data?.access ||
        (typeof tokenData === "string" ? tokenData : null);
      const refreshToken =
        tokenData?.refresh ||
        response?.data?.refresh ||
        response?.data?.data?.refresh;

      const rawRole =
        userData?.role || response?.data?.role || response?.data?.data?.role;
      const roleString =
        typeof rawRole === "object"
          ? rawRole?.name ||
            rawRole?.role_name ||
            rawRole?.slug ||
            rawRole?.title ||
            ""
          : String(rawRole || "");

      const userRole = String(
        roleString || userData?.role_name || response?.data?.role_name || "",
      )
        .toLowerCase()
        .trim();

      // 🌟 ROLE VALIDATION
      if (!userRole) {
        setErrors((prev) => ({
          ...prev,
          login: "User role is required to login.",
        }));
        return;
      }

      if (accessToken) {
        localStorage.setItem("token", accessToken);
        if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
        if (userData?.user_name || userData?.username)
          localStorage.setItem(
            "username",
            userData.user_name || userData.username,
          );
        if (userData?.user_id || userData?.id)
          localStorage.setItem("user_id", userData.user_id || userData.id);

        localStorage.setItem("role", userRole);

        const permsRaw =
          userData?.permissions ||
          userData?.user_permissions ||
          userData?.role_permissions ||
          userData?.role?.permissions ||
          (typeof rawRole === "object" ? rawRole?.permissions : null) ||
          response?.data?.permissions ||
          response?.data?.user_permissions ||
          response?.data?.data?.permissions ||
          response?.data?.data?.user_permissions ||
          response?.data?.data?.user?.permissions ||
          response?.data?.data?.user?.user_permissions;

        let permsArray = [];

        if (Array.isArray(permsRaw)) {
          permsArray = permsRaw;
        } else if (typeof permsRaw === "object" && permsRaw !== null) {
          permsArray = Object.keys(permsRaw);
        } else if (typeof permsRaw === "string" && permsRaw.trim() !== "") {
          permsArray = permsRaw.split(",").map((p) => p.trim());
        }

        // 🌟 In-Memory permissions: remove any stale cache from storage
        localStorage.removeItem("permissions");

        // Event trigger for active listeners
        window.dispatchEvent(new Event("storage"));

        // 🌟 Redirect Path: Management roles route to admin portal, TL and executives to telecalling screen
        const isTeamLeadOrExecutive = ["team_lead", "telecaller", "executive"].includes(userRole);
        const targetPath =
          !isTeamLeadOrExecutive &&
          (ADMIN_ROLES.includes(userRole) || userData?.is_superuser)
            ? "/admin/dashboard"
            : "/telecalling/dashboard";

        sessionStorage.removeItem("telecalling_pipeline_selected_pipeline");
        sessionStorage.removeItem("telecalling_pipeline_user_switched");

        // 🌟 window.location.href பயன்படுத்துவதால் தானாகவே Refresh ஆகி
        // Permissions உடனேயே Dashboard-இல் கிடைத்துவிடும்!
        window.location.href = targetPath;
      } else {
        setErrors((prev) => ({
          ...prev,
          login: "Something went wrong with response data.",
        }));
      }
    } catch (error) {
      console.error("Login Error:", error);
      setErrors((prev) => ({
        ...prev,
        login: error.response?.data?.message || "Invalid Credentials",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* ============================================ */}
      {/* LEFT SIDE - DARK PROMO PANEL */}
      {/* ============================================ */}

      <Box
        sx={{
          display: {
            xs: "none",
            md: "flex",
          },
          width: "50%",
          height: "100%",
          position: "relative",
          backgroundColor: "#0A1A0A",
          backgroundImage: `url(${leftFrameImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 6,
          overflow: "hidden",
        }}
      >
        {/* ANIMATED DASHBOARD (vector) */}
        <LoginDashboardAnimation />

        {/* PAGINATION DOTS */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mb: 3,
            mt: 3,
          }}
        >
          {SLIDES.map((_, i) => (
            <Box
              key={i}
              component="button"
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setSlide(i)}
              sx={{
                all: "unset",
                cursor: "pointer",
                height: 8,
                width: slide === i ? 26 : 8,
                borderRadius: "99px",
                background: slide === i ? "#90D916" : "#4D4D4D",
                transition: "width .4s ease, background .4s ease",
                "&:focus-visible": {
                  outline: "2px solid #90D916",
                  outlineOffset: "3px",
                },
                ...noMotion,
              }}
            />
          ))}
        </Box>

        {/* HEADLINE + SUBTEXT (fade between slides) */}
        <Box
          sx={{
            position: "relative",
            height: 120,
            width: "100%",
            maxWidth: 380,
          }}
        >
          {SLIDES.map((s, i) => (
            <Box
              key={i}
              aria-hidden={slide !== i}
              sx={{
                position: "absolute",
                inset: 0,
                textAlign: "center",
                opacity: slide === i ? 1 : 0,
                transform: slide === i ? "none" : "translateY(14px)",
                transition: "opacity .6s ease, transform .6s ease",
                pointerEvents: "none",
                ...noMotion,
              }}
            >
              <Typography
                sx={{
                  color: "#fff",
                  fontSize: "26px",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {s.lead}
                <Box component="span" sx={{ color: "#90D916" }}>
                  {s.accent}
                </Box>
              </Typography>

              <Typography
                sx={{
                  color: "#9E9E9E",
                  fontSize: "14px",
                  textAlign: "center",
                  mt: 1.5,
                  mx: "auto",
                  maxWidth: "360px",
                }}
              >
                {s.sub}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ============================================ */}
      {/* RIGHT SIDE - LOGIN PANEL */}
      {/* ============================================ */}

      <Box
        sx={{
          width: {
            xs: "100%",
            md: "50%",
          },
          height: "100%",
          position: "relative",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* DECORATIVE BG IMAGE (slow drift) */}
        <Box
          component="img"
          src={loginbg}
          alt=""
          sx={{
            position: "absolute",
            top: "-3%",
            left: "-3%",
            width: "106%",
            height: "106%",
            objectFit: "cover",
            zIndex: 0,
            animation: `${drift} 18s ease-in-out infinite alternate`,
            ...noMotion,
          }}
        />

        {/* FLOATING RINGS */}
        {RINGS.map((r, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              zIndex: 0,
              width: r.size,
              height: r.size,
              left: r.left,
              right: r.right,
              top: r.top,
              bottom: r.bottom,
              border: "2px solid #90D916",
              borderRadius: "50%",
              opacity: 0.55,
              pointerEvents: "none",
              animation: `${floaty} ${r.t}s ease-in-out ${r.d}s infinite`,
              ...noMotion,
            }}
          />
        ))}

        {/* LOGIN CARD */}
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: 300,
            background: "#0A1A0A",
            borderRadius: "16px",
            p: 4,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          {/* LOGO */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 3,
              justifyContent: "center",
              ...stagger(0),
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="Logo"
              sx={{
                width: 45,
                height: 45,
                borderRadius: "50%",
              }}
            />

            <Typography
              component="div"
              sx={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#90D916",
              }}
            >
              Code99
              <Typography
                component="div"
                sx={{
                  fontSize: "9px",
                  letterSpacing: "1px",
                  color: "#fff",
                  fontWeight: 600,
                  mt: "-2px",
                }}
              >
                IT ACADEMY
              </Typography>
            </Typography>
          </Box>

          {/* HEADING */}
          <Typography
            sx={{
              color: "#fff",
              fontSize: "22px",
              fontWeight: 700,
              mb: 3,
              textAlign: "center",
              ...stagger(1),
            }}
          >
            Welcome Back
          </Typography>

          {/* FORM */}
          <Box component="form" onSubmit={handleLogin}>
            {/* USERNAME */}
            <Box sx={stagger(2)}>
              <Typography
                sx={{
                  color: "#B5B5B5",
                  fontSize: "13px",
                  fontWeight: 500,
                  mb: 0.7,
                }}
              >
                Username
              </Typography>

              <TextField
                fullWidth
                variant="filled"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                error={!!errors.username}
                helperText={errors.username}
                onChange={handleChange}
                required
                sx={{
                  ...darkFieldSx,
                  "& .MuiFilledInput-input": {
                    padding: "10px 16px",
                  },
                }}
              />
            </Box>

            {/* PASSWORD */}
            <Box sx={stagger(3)}>
              <Typography
                sx={{
                  color: "#B5B5B5",
                  fontSize: "13px",
                  fontWeight: 500,
                  mb: 0.7,
                }}
              >
                Password
              </Typography>

              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                variant="filled"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                error={!!errors.password}
                helperText={errors.password}
                onChange={handleChange}
                // MUI slotProps
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          sx={{ color: "#B5B5B5", padding: "4px" }}
                          tabIndex={-1}
                          type="button"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <VisibilityOff sx={{ fontSize: "20px" }} />
                          ) : (
                            <Visibility sx={{ fontSize: "20px" }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  ...darkFieldSx,
                  "& .MuiFilledInput-root": {
                    ...darkFieldSx["& .MuiFilledInput-root"],
                    display: "flex",
                    alignItems: "center",
                    pr: 1.5,
                  },
                  "& .MuiFilledInput-input": {
                    padding: "10px 12px",
                  },
                }}
              />
            </Box>

            {/* ERROR MESSAGE DISPLAY */}
            {errors.login && (
              <Typography
                sx={{
                  color: "#f44336",
                  fontSize: "13px",
                  mb: 2,
                  textAlign: "center",
                }}
              >
                {errors.login}
              </Typography>
            )}

            {/* SIGN IN BUTTON */}
            <Box sx={stagger(4)}>
              <Button
                fullWidth
                type="submit"
                disabled={loading}
                sx={{
                  height: "44px",
                  borderRadius: "6px",
                  background: "#90D916",
                  color: "#0A1A0A",
                  textTransform: "none",
                  fontSize: "15px",
                  fontWeight: 700,
                  boxShadow: "none",
                  transition:
                    "transform .2s ease, box-shadow .2s ease, background .2s ease",
                  "&:hover": {
                    background: "#9BE006",
                    boxShadow: "0 8px 20px rgba(144, 217, 22, 0.35)",
                    transform: "translateY(-2px)",
                  },
                  "&:active": {
                    transform: "scale(0.98)",
                  },
                  "&.Mui-disabled": {
                    background: "#90D916",
                    opacity: 0.85,
                  },
                  ...noMotion,
                }}
              >
                {loading ? (
                  <CircularProgress size={22} sx={{ color: "#0A1A0A" }} />
                ) : (
                  "Sign In"
                )}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Login;
