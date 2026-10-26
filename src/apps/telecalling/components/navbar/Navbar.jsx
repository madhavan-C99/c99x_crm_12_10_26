import {
  Badge,
  Menu,
  Box,
  Typography,
  Divider,
  Avatar,
  IconButton,
  MenuItem,
  Tooltip,
  Chip,
  Snackbar,
  Alert
} from "@mui/material";


import {
  CheckCircleRounded,
  CancelRounded,
  SwapHorizRounded,
  PersonAddAlt1Rounded,

} from "@mui/icons-material";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import AccessTimeFilled from "@mui/icons-material/AccessTimeFilled";
import Phone from "@mui/icons-material/Phone";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import DoneAllRounded from "@mui/icons-material/DoneAllRounded";
import Favorite from "@mui/icons-material/Favorite";
import WhatsApp from "@mui/icons-material/WhatsApp";
import MenuIcon from "@mui/icons-material/Menu";
import { useEffect, useRef, useState } from "react";
import { markNotificationRead } from "@/shared/services/notificationService";
import { useNavigate, useLocation } from "react-router-dom";
import { useLeadBadge , isLeadAssignNotification,
  getLeadCount, } from "@/shared/context/LeadBadgeContext";

import { WS_BASE_URL } from "@/shared/config/env";

// import VolumeUpRounded from "@mui/icons-material/VolumeUpRounded";
// import VolumeOffRounded from "@mui/icons-material/VolumeOffRounded";
import {
  initNotificationSound,
  createNewItemSoundGate,
} from "@/shared/utils/notificationSound";
import { loadSoundSetting } from "@/apps/telecalling/components/settings/notifications/NotificationsCard";



/* ------------------------------------------------------------------ */
/* Reminder types - indha types reminder bell la mattum varum          */
/* ------------------------------------------------------------------ */
const REMINDER_TYPES = [
  "followup_reminder",
  "missed_followup",
  "payment_followup_reminder",
  "missed_payment_followup",
];

const isReminderType = (type) => REMINDER_TYPES.includes(type);

// Socket open la irundha mattum send pannum (InvalidStateError varaadhu)
const safeSend = (socketRef, action) => {
  const ws = socketRef.current;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action }));
  }
};

// Live push message -> list item
const buildItem = (res) => ({
  id: res.data?.id ?? Date.now(),
  title: res.title,
  message: res.message,
  date: res.data?.created_at || new Date().toISOString(),
  notification_type: res.notification_type,
  read: false,
  lead_id: res.data?.lead_id || res.lead_id || res.data?.lead,
  lead_access: res.data?.lead_access
});

// Same id rendu thadava add aagaama
const addUnique = (prev, item) =>
  prev.some((n) => n.id === item.id) ? prev : [item, ...prev];

// Format notification/reminder time safely without double +5:30 timezone shift
const formatNotificationTime = (dateStr) => {
  if (!dateStr) return "";
  const cleaned = typeof dateStr === "string"
    ? dateStr.replace(/([+-]\d{2}:\d{2}|Z)$/, "").replace(" ", "T")
    : dateStr;
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/* ------------------------------------------------------------------ */
/* Icon / color meta helpers - decide which colored round icon to use */
/* based on notification_type + title/message keywords.               */
/* ------------------------------------------------------------------ */
const getNotificationMeta = (item) => {
  const type = item.notification_type || "";
  const title = (item.title || "").toLowerCase();

  // ---------- Loss request result ----------
  if (title.includes("approved")) {
    return { bg: "#E6F4EA", color: "#2E7D32", icon: <CheckCircleRounded fontSize="small" /> };
  }
  if (title.includes("rejected")) {
    return { bg: "#FBE7E7", color: "#E53935", icon: <CancelRounded fontSize="small" /> };
  }

  // ---------- Reassigned (old telecaller) ----------
  if (title.includes("reassign")) {
    return { bg: "#FFF3E0", color: "#FB8C00", icon: <SwapHorizRounded fontSize="small" /> };
  }

  // ---------- New lead assigned ----------
  if (type === "lead_notification" || title.includes("assigned")) {
    return { bg: "#E3EEFC", color: "#2979FF", icon: <PersonAddAlt1Rounded fontSize="small" /> };
  }

  if (type === "daily_followup_count" || title.includes("follow")) {
    return { bg: "#EAF7D9", color: "#7CB342", icon: <Favorite fontSize="small" /> };
  }

  return { bg: "#F0F0F0", color: "#888", icon: <NotificationsNoneRounded fontSize="small" /> };
};
const getReminderMeta = (item) => {
  const type = item.notification_type || "";
  const message = (item.message || "").toLowerCase();

  if (message.includes("whatsapp")) {
    return {
      bg: "#EAF7D9",
      color: "#25D366",
      icon: <WhatsApp fontSize="small" />,
    };
  }

  if (type === "missed_followup" || type === "missed_payment_followup") {
    return {
      bg: "#EAF7D9",
      color: "#7CB342",
      icon: <Favorite fontSize="small" />,
    };
  }

  // default -> followup_reminder
  return {
    bg: "#EAF7D9",
    color: "#7CB342",
    icon: <Phone fontSize="small" />,
  };
};



const tooltipSlotProps = {
  tooltip: {
    sx: {
      bgcolor: "#1E293B",
      color: "#fff",
      fontSize: "13px",
      fontWeight: 600,
      px: 1.5,
      py: 0.75,
      borderRadius: "8px",
    },
  },
  arrow: { sx: { color: "#1E293B" } },
};

function Navbar({ onToggleSidebar }) {
  const notificationSocketRef = useRef(null);
  const reminderSocketRef = useRef(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [reminderAnchor, setReminderAnchor] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [hoveredNotif, setHoveredNotif] = useState(null);
  const [hoveredReminder, setHoveredReminder] = useState(null);


  const { syncLeadItems, addLeadItem,removeLeadItem, markAllSeen } = useLeadBadge();

const [snackbar, setSnackbar] = useState({
  open: false,
  message: "",
  severity: "info",
});
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

const handsettingMenuOpen = (event) => {
    setAnchorEl(null);
  navigate("/telecalling/settings");
}

  const open = Boolean(anchorEl);

  const username = localStorage.getItem("username");
  const rawRole = localStorage.getItem("role") || "telecaller";
  const displayRole = rawRole
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const unreadNotification = notifications.length;
  const unreadReminder = reminders.length;
  const newNotificationCount = notifications.filter((n) => !n.read).length;
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();

    sessionStorage.clear();

    // login page ku navigate pannum
    navigate("/telecalling/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let stopped = false;

    // Sound: pudhu notification / reminder vandha mattum
    const removeUnlock = initNotificationSound();
    loadSoundSetting()
    const notifSound = createNewItemSoundGate("notification");
    const reminderSound = createNewItemSoundGate("reminder");

    const retries = { notification: 0, reminder: 0 };
    const timers = {};

    // Socket connect + auto reconnect (2s, 4s, 8s ... max 30s)
    const connect = (key, path, socketRef, action, onData) => {
      const ws = new WebSocket(`${WS_BASE_URL}${path}?token=${token}`);
      socketRef.current = ws;

      ws.onopen = () => {
        retries[key] = 0;
        ws.send(JSON.stringify({ action }));
      };

      ws.onmessage = (event) => {
        let res;
        try {
          res = JSON.parse(event.data);
        } catch {
          return;
        }
        onData(res);
      };

      ws.onerror = () => ws.close();

      ws.onclose = () => {
        if (stopped) return;
        retries[key] += 1;
        const delay = Math.min(1000 * 2 ** retries[key], 30000);
        timers[key] = setTimeout(
          () => connect(key, path, socketRef, action, onData),
          delay
        );
      };
    };

    // ---------- NOTIFICATION socket (reminder types vendaam) ----------
    const onNotificationData = (res) => {
      // Backend unread list (refresh / history rendum)
      if (Array.isArray(res.payload)) {
          const list = res.payload.filter(
            (n) => !isReminderType(n.notification_type)
          );
          setNotifications(list);
          notifSound.fromList(list);
          syncLeadItems(
            list
              .filter(isLeadAssignNotification)
              .map((n) => ({ id: n.id, count: getLeadCount(n) }))
          );          return;
      }

      // Live push: reminder types ignore, matha ellam (admin_message kooda) accept
      if (!res.notification_type || isReminderType(res.notification_type)) {
        return;
      }

      const item = buildItem(res);
      setNotifications((prev) => addUnique(prev, item));
      notifSound.fromPush(item);
      safeSend(notificationSocketRef, "notification");

      if (isLeadAssignNotification(res)) {
        addLeadItem({ id: item.id, count: getLeadCount(res) });
      }    
    };

    // ---------- REMINDER socket (reminder types mattum) ----------
const onReminderData = (res) => {
  if (Array.isArray(res.payload)) {
    const reminderList = res.payload.filter((n) =>
      isReminderType(n.notification_type)
    );
    setReminders(reminderList);
    reminderSound.fromList(reminderList);
    return;
  }

  if (!isReminderType(res.notification_type)) return;

  const reminderItem = buildItem(res);
  setReminders((prev) => addUnique(prev, reminderItem));
  reminderSound.fromPush(reminderItem);
};

    connect(
      "notification",
      "/ws/notification/",
      notificationSocketRef,
      "notification",
      onNotificationData
    );
    connect(
      "reminder",
      "/ws/reminder/",
      reminderSocketRef,
      "reminder_notification",
      onReminderData
    );

    // Fallback poll every 10 sec (socket open la irundha mattum)
    const pollInterval = setInterval(() => {
      if (document.hidden) return;
      safeSend(notificationSocketRef, "notification");
      safeSend(reminderSocketRef, "reminder_notification");
    }, 10000);

    return () => {
      stopped = true;
      removeUnlock(); 
      clearInterval(pollInterval);
      Object.values(timers).forEach(clearTimeout);
      notificationSocketRef.current?.close();
      reminderSocketRef.current?.close();
    };
  }, []);


//   const handleToggleSound = () => {
//   const next = !soundOn;
//   setSoundOn(next);
//   setSoundMuted(!next);
//   // ON panna preview sound (click = user gesture, so unlock kooda aagum)
//   if (next) playNotificationSound("notification", { force: true });
// };

  const handleNotificationClick = (e) => {
    setNotificationAnchor(e.currentTarget);
    safeSend(notificationSocketRef, "notification");
  };

  const handleReminderClick = (e) => {
    setReminderAnchor(e.currentTarget);
    safeSend(reminderSocketRef, "reminder_notification");
  };

  const handleItemClick = (item) => {
    setNotificationAnchor(null);
    setReminderAnchor(null);
    handleMarkAsRead(item.id);

    const leadId =
      item.lead_id || item.data?.lead_id || item.lead || item.data?.lead;
    if (leadId) {
      navigate(`/telecalling/lead-details/${leadId}`);
    } else {
      navigate(`/telecalling/pipeline`);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);

      // removeLeadItem(notificationId)
      // Remove read item from state immediately so badge and list update
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setReminders((prev) => prev.filter((n) => n.id !== notificationId));

      // Request fresh unread lists from WebSockets
      safeSend(notificationSocketRef, "notification");
      safeSend(reminderSocketRef, "reminder_notification");
    } catch (err) {
    }
  };


const handleNotificationItemClick = (item) => {
  setNotificationAnchor(null);

  if (!item.read) handleMarkAsRead(item.id);

  if (!item.lead_id) {
    navigate("/telecalling/pipeline");
    return;
  }

  switch (item.lead_access || "open") {
    case "open":
      navigate(`/telecalling/lead-details/${item.lead_id}`);
      break;

    case "loss":
      navigate(`/telecalling/lead-details/${item.lead_id}`, {
        state: { readOnly: true },
      });
      break;

    case "reassigned":
      setSnackbar({
        open: true,
        message: "This lead has been reassigned to another telecaller.",
        severity: "warning",
      });
      break;

    default:
      break;
  }
};



const location = useLocation();
const autoReadRef = useRef(new Set());

// Pipeline page la irukkumbodhu lead assign notifications ah read nu mark
// useEffect(() => {
//   if (location.pathname !== "/telecalling/pipeline") return;

//   const ids = notifications
//     .filter(isLeadAssignNotification)
//     .map((n) => n.id)
//     .filter((id) => !autoReadRef.current.has(id));

//   if (ids.length === 0) return;

//   ids.forEach((id) => autoReadRef.current.add(id));

//   Promise.allSettled(ids.map((id) => markNotificationRead(id))).then(
//     (results) => {
//       const done = ids.filter((_, i) => results[i].status === "fulfilled");
//       done.forEach(removeLeadItem);
//       setNotifications((prev) => prev.filter((n) => !done.includes(n.id)));
//       safeSend(notificationSocketRef, "notification");
//     }
//   );
// }, [location.pathname, notifications, removeLeadItem]);


  return (
    <Box
      sx={{
        height: "70px",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        px: { xs: 1.5, sm: 3 },
        borderBottom: "1px solid #E9E9E9",
      }}
    >
      {/* MOBILE HAMBURGER ICON */}
      <IconButton
        onClick={onToggleSidebar}
        sx={{
          display: { xs: "inline-flex", md: "none" },
          color: "#111",
          p: 0.75,
          mr: 1,
        }}
        aria-label="open navigation drawer"
      >
        <MenuIcon sx={{ fontSize: "28px" }} />
      </IconButton>

      {/* PUSH TO RIGHT */}
      <Box sx={{ flex: 1 }} />

      {/* RIGHT CONTENT */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >

        {/* <Tooltip title={soundOn ? "Sound ON" : "Sound OFF"}>
          <IconButton onClick={handleToggleSound}>
            {soundOn ? <VolumeUpRounded /> : <VolumeOffRounded />}
          </IconButton>
        </Tooltip> */}
        <Tooltip
          title={reminderAnchor ? "" : "Reminders"}
          arrow
          slotProps={tooltipSlotProps}
        >
          <IconButton onClick={handleReminderClick}>
            <Badge badgeContent={unreadReminder} color="error">
              <AccessTimeFilled />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip
          title={notificationAnchor ? "" : "Notifications"}
          arrow
          slotProps={tooltipSlotProps}
        >
          <IconButton onClick={handleNotificationClick}>
            <Badge badgeContent={unreadNotification} color="error">
              <NotificationsNoneRounded />
            </Badge>
          </IconButton>
        </Tooltip>

        <Box
          sx={{
            width: "1px",
            height: 36,
            background: "#D9D9D9",
            mx: 1.5,
          }}
        />
        
        <Box
          onClick={handleMenuOpen}
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <Avatar
            sx={{
              bgcolor: "#97C93D",
            }}
          >
            {username?.charAt(0)}
          </Avatar>

          <Box sx={{ ml: { xs: 1, sm: 2 }, display: { xs: "none", sm: "block" } }}>
            <Typography sx={{ fontWeight: 600 }}>{username}</Typography>

            <Typography
              sx={{
                fontSize: 13,
                color: "#888",
              }}
            >
              {displayRole}
            </Typography>
          </Box>

          <KeyboardArrowDownRounded sx={{ ml: 1 }} />
        </Box>
      </Box>

      {/* ACCOUNT MENU */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: {
                xs: 200,
                md: 260,
              },
              mt: 1.5,
              borderRadius: "20px",
              boxShadow: "0px 8px 30px rgba(0,0,0,0.15)",
              overflow: "hidden",
            },
          },
        }}
      >
        {/* HEADER */}
        <Box
        onClick={handsettingMenuOpen}
          sx={{
            px: 3.5,
            py: 1,
          }}
        >
          <Typography
            
            sx={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#111",
              textAlign: "center",
            }}
          >
            My Account
          </Typography>
        </Box>

        <Divider />

        <MenuItem
          onClick={handsettingMenuOpen}
          sx={{
            px: 3.5,
            pt: 1.5,
            fontSize: "14px",
            color: "#2B2F38",
            display: "flex",
            justifyContent: "center",
          }}
        >
          Settings
        </MenuItem>

        <MenuItem
          onClick={handleMenuClose}
          sx={{
            px: 3.5,
            fontSize: "14px",
            color: "#2B2F38",
            display: "flex",
            justifyContent: "center",
          }}
        >
          Activity Log
        </MenuItem>

        <Divider />

        {/* SIGN OUT */}
        <MenuItem
          onClick={handleLogout}
          sx={{
            px: 3.5,
            color: "#E53935",
            fontSize: "14px",
            fontWeight: 500,
            display: "flex",
            justifyContent: "center",
          }}
        >
          Sign Out
        </MenuItem>
      </Menu>

      {/* NOTIFICATIONS MENU */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={() => setNotificationAnchor(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 380,
              maxHeight: 450,
              mt: 1,
              borderRadius: "14px",
              border: "1px solid #E5E7EB",
              boxShadow: "0px 10px 30px rgba(0,0,0,0.12)",
              overflow: "hidden",
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid #ECECEC",
            background: "#FAFAFA",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Notifications
          </Typography>

          {newNotificationCount > 0 && (
            <Chip
              label={`${newNotificationCount} New`}
              size="small"
              sx={{
                background: "#EFEFEF",
                color: "#555",
                fontWeight: 600,
                fontSize: 12,
                height: 24,
              }}
            />
          )}
        </Box>

        <Box
          sx={{
            maxHeight: 370,
            overflowY: "auto",
          }}
        >
          {notifications.length === 0 ? (
            <Typography
              sx={{
                py: 5,
                textAlign: "center",
                color: "#888",
              }}
            >
              No Notifications
            </Typography>
          ) : (
            notifications.map((item) => {
              const meta = getNotificationMeta(item);

              return (
                <MenuItem
                  key={item.id}
                  onClick={() => handleNotificationItemClick(item)}
                  // onClick={() => handleItemClick(item)}
                  onMouseEnter={() => setHoveredNotif(item.id)}
                  onMouseLeave={() => setHoveredNotif(null)}
                  sx={{
                    alignItems: "flex-start",
                    py: 2,
                    px: 2,
                    gap: 1.5,
                    whiteSpace: "normal",
                    borderBottom: "1px solid #F2F2F2",
                    position: "relative",
                    background: item.read ? "#fff" : "#F7F8FA",
                    "&:hover": {
                      background: "#F8FBF1",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: meta.bg,
                      color: meta.color,
                      width: 36,
                      height: 36,
                      mt: 0.25,
                    }}
                  >
                    {meta.icon}
                  </Avatar>

                  {!item.read && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#4CAF50",
                      }}
                    />
                  )}

                  <Box
                    width="100%"
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Box sx={{ flex: 1, pr: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "#222",
                        }}
                      >
                        {item.title}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.5,
                          fontSize: 13,
                          color: "#666",
                          lineHeight: 1.5,
                        }}
                      >
                        {item.message}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 1,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#2B3A67",
                        }}
                      >
                        {formatNotificationTime(item.date)}
                      </Typography>
                    </Box>

                    {hoveredNotif === item.id && (
                      <Tooltip title="Mark as read">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(item.id);
                          }}
                          sx={{
                            color: "#97C93D",
                            alignSelf: "center",
                          }}
                        >
                          <DoneAllRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </MenuItem>
              );
            })
          )}
        </Box>
      </Menu>

      {/* REMINDERS MENU */}
      <Menu
        anchorEl={reminderAnchor}
        open={Boolean(reminderAnchor)}
        onClose={() => setReminderAnchor(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 380,
              maxHeight: 450,
              mt: 1,
              borderRadius: "14px",
              border: "1px solid #E5E7EB",
              boxShadow: "0px 10px 30px rgba(0,0,0,0.12)",
              overflow: "hidden",
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid #ECECEC",
            background: "#FAFAFA",
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Reminders
          </Typography>
        </Box>

        <Box
          sx={{
            maxHeight: 370,
            overflowY: "auto",
          }}
        >
          {reminders.length === 0 ? (
            <Typography
              sx={{
                py: 5,
                textAlign: "center",
                color: "#888",
              }}
            >
              No Reminders
            </Typography>
          ) : (
            reminders.map((item) => {
              const meta = getReminderMeta(item);

              return (
                <MenuItem
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => setHoveredReminder(item.id)}
                  onMouseLeave={() => setHoveredReminder(null)}
                  sx={{
                    alignItems: "flex-start",
                    py: 2,
                    px: 2,
                    gap: 1.5,
                    whiteSpace: "normal",
                    borderBottom: "1px solid #F2F2F2",
                    position: "relative",
                    background: item.read ? "#fff" : "#F7F8FA",
                    borderLeft: item.read
                      ? "3px solid transparent"
                      : "3px solid #97C93D",
                    "&:hover": {
                      background: "#F8FBF1",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: meta.bg,
                      color: meta.color,
                      width: 36,
                      height: 36,
                      mt: 0.25,
                    }}
                  >
                    {meta.icon}
                  </Avatar>

                  {!item.read && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#4CAF50",
                      }}
                    />
                  )}

                  <Box
                    width="100%"
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Box sx={{ flex: 1, pr: 1 }}>
                      <Typography
                        sx={{ fontWeight: 600, fontSize: 14, color: "#222" }}
                      >
                        {item.title}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.5,
                          fontSize: 13,
                          color: "#666",
                          lineHeight: 1.5,
                        }}
                      >
                        {item.message}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 1,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#2B3A67",
                        }}
                      >
                        {formatNotificationTime(item.date)}
                      </Typography>
                    </Box>

                    {hoveredReminder === item.id && (
                      <Tooltip title="Mark as read">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(item.id);
                          }}
                          sx={{ color: "#97C93D", alignSelf: "center" }}
                        >
                          <DoneAllRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </MenuItem>
              );
            })
          )}
        </Box>
      </Menu>

      <Snackbar
  open={snackbar.open}
  autoHideDuration={4000}
  onClose={() =>
    setSnackbar((prev) => ({ ...prev, open: false }))
  }
  anchorOrigin={{
    vertical: "top",
    horizontal: "right",
  }}
>
  <Alert
    onClose={() =>
      setSnackbar((prev) => ({ ...prev, open: false }))
    }
    severity={snackbar.severity}
    variant="filled"
    sx={{ width: "100%" }}
  >
    {snackbar.message}
  </Alert>
</Snackbar>
    </Box>
  );
}

export default Navbar;


// import {
//   Badge,
//   Menu,
//   Box,
//   Typography,
//   Divider,
//   Avatar,
//   IconButton,
//   MenuItem,
//   Tooltip,
//   Chip,
// } from "@mui/material";

// import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
// import AccessTimeFilled from "@mui/icons-material/AccessTimeFilled";
// import Phone from "@mui/icons-material/Phone";
// import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
// import DoneAllRounded from "@mui/icons-material/DoneAllRounded";
// import Favorite from "@mui/icons-material/Favorite";
// import WhatsApp from "@mui/icons-material/WhatsApp";
// import { useEffect, useRef, useState } from "react";
// import { markNotificationRead } from "@/shared/services/notificationService";
// import { useNavigate } from "react-router-dom";

// import { WS_BASE_URL } from "@/shared/config/env";
// /* ------------------------------------------------------------------ */
// /* Icon / color meta helpers - decide which colored round icon to use */
// /* based on notification_type + title/message keywords.               */
// /* ------------------------------------------------------------------ */





// const getNotificationMeta = (item) => {
//   const type = item.notification_type || "";
//   const title = (item.title || "").toLowerCase();

//   if (title.includes("reject") || title.includes("loss")) {
//     return {
//       bg: "#FBE7E7",
//       color: "#E53935",
//       icon: <Phone fontSize="small" />,
//     };
//   }

//   if (type === "lead_notification" || title.includes("assigned")) {
//     return {
//       bg: "#E3EEFC",
//       color: "#2979FF",
//       icon: <Phone fontSize="small" />,
//     };
//   }

//   if (type === "daily_followup_count" || title.includes("follow")) {
//     return {
//       bg: "#EAF7D9",
//       color: "#7CB342",
//       icon: <Favorite fontSize="small" />,
//     };
//   }

//   return {
//     bg: "#F0F0F0",
//     color: "#888",
//     icon: <NotificationsNoneRounded fontSize="small" />,
//   };
// };

// const getReminderMeta = (item) => {
//   const type = item.notification_type || "";
//   const message = (item.message || "").toLowerCase();

//   if (message.includes("whatsapp")) {
//     return {
//       bg: "#EAF7D9",
//       color: "#25D366",
//       icon: <WhatsApp fontSize="small" />,
//     };
//   }

//   if (type === "missed_followup") {
//     return {
//       bg: "#EAF7D9",
//       color: "#7CB342",
//       icon: <Favorite fontSize="small" />,
//     };
//   }

//   // default -> followup_reminder
//   return {
//     bg: "#EAF7D9",
//     color: "#7CB342",
//     icon: <Phone fontSize="small" />,
//   };
// };

// function Navbar({ onToggleSidebar }) {
//   const notificationSocketRef = useRef(null);
//   const reminderSocketRef = useRef(null);

//   const [anchorEl, setAnchorEl] = useState(null);
//   const [notificationAnchor, setNotificationAnchor] = useState(null);
//   const [reminderAnchor, setReminderAnchor] = useState(null);

//   const [notifications, setNotifications] = useState([]);
//   const [reminders, setReminders] = useState([]);

//   const [hoveredNotif, setHoveredNotif] = useState(null);
//   const [hoveredReminder, setHoveredReminder] = useState(null);

//   const handleMenuOpen = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };

//   const open = Boolean(anchorEl);

//   const username = localStorage.getItem("username");

//   const unreadNotification = notifications.length;
//   const unreadReminder = reminders.length;
//   const newNotificationCount = notifications.filter((n) => !n.read).length;
// const navigate = useNavigate();

//   const handleLogout = () => {

//     localStorage.clear();

//     sessionStorage.clear();

//     // login page ku navigate pannும்
//     navigate("/telecalling/login");
// };

//   useEffect(() => {
//     const token = localStorage.getItem("token");

//     notificationSocketRef.current = new WebSocket(
//       `${WS_BASE_URL}/ws/notification/?token=${token}`
//     );

//     notificationSocketRef.current.onopen = () => {

//       notificationSocketRef.current.send(
//         JSON.stringify({ action: "notification" })
//       );
//     };

//     reminderSocketRef.current = new WebSocket(
//       `${WS_BASE_URL}/ws/reminder/?token=${token}`
//     );

//     reminderSocketRef.current.onopen = () => {

//       reminderSocketRef.current.send(
//         JSON.stringify({ action: "reminder_notification" })
//       );
//     };

//     notificationSocketRef.current.onmessage = (event) => {
//       const res = JSON.parse(event.data);

//       // ✅ Refresh event - backend anuppura fresh unread list
//       if (res.action === "refresh" && Array.isArray(res.payload)) {
//         setNotifications(res.payload);
//         return;
//       }

//       if (Array.isArray(res.payload)) {
//         setNotifications(res.payload);
//         return;
//       }

//       // Live notification push
//       if (
//         res.notification_type === "lead_notification" ||
//         res.notification_type === "followup_reminder" ||
//         res.notification_type === "daily_followup_count"
//       ) {
//         const item = {
//           id: res.data?.id ?? Date.now(),
//           title: res.title,
//           message: res.message,
//           date: res.data?.created_at || new Date().toISOString(),
//           notification_type: res.notification_type,
//           read: false,
//           lead_id: res.data?.lead_id || res.lead_id || res.data?.lead,
//         };

//         setNotifications((prev) => [item, ...prev]);
//       }
//     };

//     reminderSocketRef.current.onmessage = (event) => {
//       const res = JSON.parse(event.data);

//       // ✅ Refresh event
//       if (res.action === "refresh" && Array.isArray(res.payload)) {
//         setReminders(res.payload);
//         return;
//       }

//       // History
//       if (Array.isArray(res.payload)) {
//         setReminders(res.payload);
//         return;
//       }

//       // Live reminder push
//       if (res.notification_type === "missed_followup") {
//         setReminders((prev) => [
//           {
//             id: res.data?.id || Date.now(),
//             title: res.title,
//             message: res.message,
//             date: res.data?.created_at || new Date().toISOString(),
//             notification_type: res.notification_type,
//             read: false,
//             lead_id: res.data?.lead_id || res.lead_id || res.data?.lead,
//           },
//           ...prev,
//         ]);
//       }
//     };

//     // ✅ Automatic 10-second background fetch interval so live updates show instantly without page refresh
//     const pollInterval = setInterval(() => {
//       if (document.hidden) return; // don't poll while the tab is in background
//       if (notificationSocketRef.current?.readyState === WebSocket.OPEN) {
//         notificationSocketRef.current.send(
//           JSON.stringify({ action: "notification" })
//         );
//       }
//       if (reminderSocketRef.current?.readyState === WebSocket.OPEN) {
//         reminderSocketRef.current.send(
//           JSON.stringify({ action: "reminder_notification" })
//         );
//       }
//     }, 10000);

//     return () => {
//       clearInterval(pollInterval);
//       notificationSocketRef.current?.close();
//       reminderSocketRef.current?.close();
//     };
//   }, []);

//   useEffect(() => {
//   }, [notifications]);

//   const handleNotificationClick = (e) => {
//     setNotificationAnchor(e.currentTarget);

//     notificationSocketRef.current?.send(
//       JSON.stringify({
//         action: "notification",
//       })
//     );
//   };

//   const handleReminderClick = (e) => {
//     setReminderAnchor(e.currentTarget);

//     reminderSocketRef.current?.send(
//       JSON.stringify({
//         action: "reminder_notification",
//       })
//     );
//   };

//   const handleItemClick = (item) => {
//     setNotificationAnchor(null);
//     setReminderAnchor(null);
//     handleMarkAsRead(item.id);

//     const leadId = item.lead_id || item.data?.lead_id || item.lead || item.data?.lead;
//     if (leadId) {
//       navigate(`/telecalling/lead-details/${leadId}`);
//     } else {
//       navigate(`/telecalling/pipeline`);
//     }
//   };

//   const handleMarkAsRead = async (notificationId) => {
//     try {
//       await markNotificationRead(notificationId);

//       // Remove read item from state immediately so badge and list update
//       setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
//       setReminders((prev) => prev.filter((n) => n.id !== notificationId));

//       // Request fresh unread lists from WebSockets
//       notificationSocketRef.current?.send(
//         JSON.stringify({ action: "notification" })
//       );
//       reminderSocketRef.current?.send(
//         JSON.stringify({ action: "reminder_notification" })
//       );
//     } catch (err) {
//     }
//   };

//   return (
//     <Box
//       sx={{
//         height: "70px",
//         background: "#fff",
//         display: "flex",
//         alignItems: "center",
//         px: 0,
//         borderBottom: "1px solid #E9E9E9",
//       }}
//     >
//       {/* PUSH TO RIGHT */}
//       <Box sx={{ flex: 1 }} />

//       {/* RIGHT CONTENT */}
//       <Box
//         sx={{
//           display: "flex",
//           alignItems: "center",
//           gap: 1,
//         }}
//       >
//         <IconButton onClick={handleReminderClick}>
//           <Badge badgeContent={unreadReminder} color="error">
//             <AccessTimeFilled />
//           </Badge>
//         </IconButton>

//         <IconButton onClick={handleNotificationClick}>
//           <Badge badgeContent={unreadNotification} color="error">
//             <NotificationsNoneRounded />
//           </Badge>
//         </IconButton>

//         <Box
//           sx={{
//             width: "1px",
//             height: 36,
//             background: "#D9D9D9",
//             mx: 1.5,
//           }}
//         />

//         <Box
//           onClick={handleMenuOpen}
//           sx={{
//             display: "flex",
//             alignItems: "center",
//             cursor: "pointer",
//           }}
//         >
//           <Avatar
//             sx={{
//               bgcolor: "#97C93D",
//             }}
//           >
//             {username?.charAt(0)}
//           </Avatar>

//           <Box sx={{ ml: { xs: 1, sm: 2 }, display: { xs: "none", sm: "block" } }}>
//             <Typography sx={{ fontWeight: 600 }}>{username}</Typography>

//             <Typography
//               sx={{
//                 fontSize: 13,
//                 color: "#888",
//               }}
//             >
//               Telecaller
//             </Typography>
//           </Box>

//           <KeyboardArrowDownRounded sx={{ ml: 1 }} />
//         </Box>
//       </Box>

//       {/* ACCOUNT MENU */}
//       <Menu
//         anchorEl={anchorEl}
//         open={open}
//         onClose={handleMenuClose}
//         anchorOrigin={{
//           vertical: "bottom",
//           horizontal: "right",
//         }}
//         transformOrigin={{
//           vertical: "top",
//           horizontal: "right",
//         }}
//         slotProps={{
//           paper: {
//             sx: {
//               width: {
//                 xs: 200,
//                 md: 260,
//               },
//               mt: 1.5,
//               borderRadius: "20px",
//               boxShadow: "0px 8px 30px rgba(0,0,0,0.15)",
//               overflow: "hidden",
//             },
//           },
//         }}
//       >
//         {/* HEADER */}
//         <Box
//           sx={{
//             px: 3.5,
//             py: 1,
//           }}
//         >
//           <Typography
//             sx={{
//               fontSize: "16px",
//               fontWeight: 600,
//               color: "#111",
//               textAlign: "center",
//             }}
//           >
//             My Account
//           </Typography>
//         </Box>

//         <Divider />

//         <MenuItem
//           onClick={handleMenuClose}
//           sx={{
//             px: 3.5,
//             pt: 1.5,
//             fontSize: "14px",
//             color: "#2B2F38",
//             display: "flex",
//             justifyContent: "center",
//           }}
//         >
//           Settings
//         </MenuItem>

//         <MenuItem
//           onClick={handleMenuClose}
//           sx={{
//             px: 3.5,
//             fontSize: "14px",
//             color: "#2B2F38",
//             display: "flex",
//             justifyContent: "center",
//           }}
//         >
//           Activity Log
//         </MenuItem>

//         <Divider />

//         {/* SIGN OUT */}
//         <MenuItem
//           onClick={
//             handleLogout
//           }
//           sx={{
//             px: 3.5,
//             color: "#E53935",
//             fontSize: "14px",
//             fontWeight: 500,
//             display: "flex",
//             justifyContent: "center",
//           }}
//         >
//           Sign Out
//         </MenuItem>
//       </Menu>

//       {/* NOTIFICATIONS MENU */}
//       <Menu
//         anchorEl={notificationAnchor}
//         open={Boolean(notificationAnchor)}
//         onClose={() => setNotificationAnchor(null)}
//         anchorOrigin={{
//           vertical: "bottom",
//           horizontal: "right",
//         }}
//         transformOrigin={{
//           vertical: "top",
//           horizontal: "right",
//         }}
//         slotProps={{
//           paper: {
//             sx: {
//               width: 380,
//               maxHeight: 450,
//               mt: 1,
//               borderRadius: "14px",
//               border: "1px solid #E5E7EB",
//               boxShadow: "0px 10px 30px rgba(0,0,0,0.12)",
//               overflow: "hidden",
//             },
//           },
//         }}
//       >
//         <Box
//           sx={{
//             px: 2,
//             py: 1.5,
//             borderBottom: "1px solid #ECECEC",
//             background: "#FAFAFA",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//           }}
//         >
//           <Typography
//             sx={{
//               fontWeight: 700,
//               fontSize: 16,
//             }}
//           >
//             Notifications
//           </Typography>

//           {newNotificationCount > 0 && (
//             <Chip
//               label={`${newNotificationCount} New`}
//               size="small"
//               sx={{
//                 background: "#EFEFEF",
//                 color: "#555",
//                 fontWeight: 600,
//                 fontSize: 12,
//                 height: 24,
//               }}
//             />
//           )}
//         </Box>

//         <Box
//           sx={{
//             maxHeight: 370,
//             overflowY: "auto",
//           }}
//         >
//           {notifications.length === 0 ? (
//             <Typography
//               sx={{
//                 py: 5,
//                 textAlign: "center",
//                 color: "#888",
//               }}
//             >
//               No Notifications
//             </Typography>
//           ) : (
//             notifications.map((item) => {
//               const meta = getNotificationMeta(item);

//               return (
//                 <MenuItem
//                   key={item.id}
//                   onClick={() => handleItemClick(item)}
//                   onMouseEnter={() => setHoveredNotif(item.id)}
//                   onMouseLeave={() => setHoveredNotif(null)}
//                   sx={{
//                     alignItems: "flex-start",
//                     py: 2,
//                     px: 2,
//                     gap: 1.5,
//                     whiteSpace: "normal",
//                     borderBottom: "1px solid #F2F2F2",
//                     position: "relative",
//                     background: item.read ? "#fff" : "#F7F8FA",
//                     "&:hover": {
//                       background: "#F8FBF1",
//                     },
//                   }}
//                 >
//                   <Avatar
//                     sx={{
//                       bgcolor: meta.bg,
//                       color: meta.color,
//                       width: 36,
//                       height: 36,
//                       mt: 0.25,
//                     }}
//                   >
//                     {meta.icon}
//                   </Avatar>

//                   {!item.read && (
//                     <Box
//                       sx={{
//                         position: "absolute",
//                         top: 14,
//                         right: 14,
//                         width: 8,
//                         height: 8,
//                         borderRadius: "50%",
//                         background: "#4CAF50",
//                       }}
//                     />
//                   )}

//                   <Box
//                     width="100%"
//                     sx={{ display: "flex", justifyContent: "space-between" }}
//                   >
//                     <Box sx={{ flex: 1, pr: 1 }}>
//                       <Typography
//                         sx={{
//                           fontWeight: 600,
//                           fontSize: 14,
//                           color: "#222",
//                         }}
//                       >
//                         {item.title}
//                       </Typography>

//                       <Typography
//                         sx={{
//                           mt: 0.5,
//                           fontSize: 13,
//                           color: "#666",
//                           lineHeight: 1.5,
//                         }}
//                       >
//                         {item.message}
//                       </Typography>

//                       <Typography
//                         sx={{
//                           mt: 1,
//                           fontSize: 12,
//                           fontWeight: 600,
//                           color: "#2B3A67",
//                         }}
//                       >
//                         {new Date(item.date).toLocaleTimeString("en-IN", {
//                           timeZone: "Asia/Kolkata",
//                           hour: "numeric",
//                           minute: "2-digit",
//                           hour12: true,
//                         })}
//                       </Typography>
//                     </Box>

//                     {hoveredNotif === item.id && (
//                       <Tooltip title="Mark as read">
//                         <IconButton
//                           size="small"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             handleMarkAsRead(item.id);
//                           }}
//                           sx={{
//                             color: "#97C93D",
//                             alignSelf: "center",
//                           }}
//                         >
//                           <DoneAllRounded fontSize="small" />
//                         </IconButton>
//                       </Tooltip>
//                     )}
//                   </Box>
//                 </MenuItem>
//               );
//             })
//           )}
//         </Box>
//       </Menu>

//       {/* REMINDERS MENU */}
//       <Menu
//         anchorEl={reminderAnchor}
//         open={Boolean(reminderAnchor)}
//         onClose={() => setReminderAnchor(null)}
//         anchorOrigin={{
//           vertical: "bottom",
//           horizontal: "right",
//         }}
//         transformOrigin={{
//           vertical: "top",
//           horizontal: "right",
//         }}
//         slotProps={{
//           paper: {
//             sx: {
//               width: 380,
//               maxHeight: 450,
//               mt: 1,
//               borderRadius: "14px",
//               border: "1px solid #E5E7EB",
//               boxShadow: "0px 10px 30px rgba(0,0,0,0.12)",
//               overflow: "hidden",
//             },
//           },
//         }}
//       >
//         <Box
//           sx={{
//             px: 2,
//             py: 1.5,
//             borderBottom: "1px solid #ECECEC",
//             background: "#FAFAFA",
//           }}
//         >
//           <Typography
//             sx={{
//               fontWeight: 700,
//               fontSize: 16,
//             }}
//           >
//             Reminders
//           </Typography>
//         </Box>

//         <Box
//           sx={{
//             maxHeight: 370,
//             overflowY: "auto",
//           }}
//         >
//           {reminders.length === 0 ? (
//             <Typography
//               sx={{
//                 py: 5,
//                 textAlign: "center",
//                 color: "#888",
//               }}
//             >
//               No Reminders
//             </Typography>
//           ) : (
//             reminders.map((item) => {
//               const meta = getReminderMeta(item);

//               return (
//                 <MenuItem
//                   key={item.id}
//                   onClick={() => handleItemClick(item)}
//                   onMouseEnter={() => setHoveredReminder(item.id)}
//                   onMouseLeave={() => setHoveredReminder(null)}
//                   sx={{
//                     alignItems: "flex-start",
//                     py: 2,
//                     px: 2,
//                     gap: 1.5,
//                     whiteSpace: "normal",
//                     borderBottom: "1px solid #F2F2F2",
//                     position: "relative",
//                     background: item.read ? "#fff" : "#F7F8FA",
//                     borderLeft: item.read ? "3px solid transparent" : "3px solid #97C93D",
//                     "&:hover": {
//                       background: "#F8FBF1",
//                     },
//                   }}
//                 >
//                   <Avatar
//                     sx={{
//                       bgcolor: meta.bg,
//                       color: meta.color,
//                       width: 36,
//                       height: 36,
//                       mt: 0.25,
//                     }}
//                   >
//                     {meta.icon}
//                   </Avatar>

//                   {!item.read && (
//                     <Box
//                       sx={{
//                         position: "absolute",
//                         top: 14,
//                         right: 14,
//                         width: 8,
//                         height: 8,
//                         borderRadius: "50%",
//                         background: "#4CAF50",
//                       }}
//                     />
//                   )}

//                   <Box
//                     width="100%"
//                     sx={{ display: "flex", justifyContent: "space-between" }}
//                   >
//                     <Box sx={{ flex: 1, pr: 1 }}>
//                       <Typography
//                         sx={{ fontWeight: 600, fontSize: 14, color: "#222" }}
//                       >
//                         {item.title}
//                       </Typography>

//                       <Typography
//                         sx={{
//                           mt: 0.5,
//                           fontSize: 13,
//                           color: "#666",
//                           lineHeight: 1.5,
//                         }}
//                       >
//                         {item.message}
//                       </Typography>

//                       <Typography
//                         sx={{
//                           mt: 1,
//                           fontSize: 12,
//                           fontWeight: 600,
//                           color: "#2B3A67",
//                         }}
//                       >
//                         {new Date(item.date).toLocaleTimeString("en-IN", {
//                           timeZone: "Asia/Kolkata",
//                           hour: "numeric",
//                           minute: "2-digit",
//                           hour12: true,
//                         })}
//                       </Typography>
//                     </Box>

//                     {hoveredReminder === item.id && (
//                       <Tooltip title="Mark as read">
//                         <IconButton
//                           size="small"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             handleMarkAsRead(item.id);
//                           }}
//                           sx={{ color: "#97C93D", alignSelf: "center" }}
//                         >
//                           <DoneAllRounded fontSize="small" />
//                         </IconButton>
//                       </Tooltip>
//                     )}
//                   </Box>
//                 </MenuItem>
//               );
//             })
//           )}
//         </Box>
//       </Menu>
//     </Box>
//   );
// }

// export default Navbar;
