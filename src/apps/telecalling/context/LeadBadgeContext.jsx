import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Reassign ku vera type anuppina, ingaye add pannunga
const LEAD_ASSIGN_TYPES = ["lead_notification"];

export const isLeadAssignNotification = (n) => {
  if (!n) return false;
  const type = n.notification_type || "";
  const title = (n.title || "").toLowerCase();

  // reject / loss notification pipeline badge ku vendaam
  if (title.includes("reject") || title.includes("loss")) return false;

  return (
    LEAD_ASSIGN_TYPES.includes(type) ||
    title.includes("assigned") ||
    title.includes("reassign")
  );
};

// Oru notification la ethana lead irukku (bulk upload na 20)
export const getLeadCount = (n) => {
  const d = n?.data || {};

  // 1) Backend count field anuppina adhu mudhalla
  const raw =
    d.lead_count ??
    d.leads_count ??
    d.total_leads ??
    d.count ??
    n?.lead_count ??
    n?.leads_count ??
    n?.count;
  const num = Number(raw);
  if (Number.isFinite(num) && num > 0) return Math.floor(num);

  // 2) Illa na message la "20 new leads" maari irundha adhula irundhu
  const text = `${n?.message || ""} ${n?.title || ""}`;
  const m = text.match(/(\d+)\s+(?:new\s+)?leads?/i);
  if (m) return Number(m[1]);

  // 3) Default: single lead
  return 1;
};

// Pipeline page paartha notification ids (refresh kum niikkum)
const seenKey = () =>
  `pipeline_badge_seen_${localStorage.getItem("user_id") || "anon"}`;

const loadSeen = () => {
  try {
    return JSON.parse(localStorage.getItem(seenKey())) || [];
  } catch {
    return [];
  }
};

const saveSeen = (ids) => {
  try {
    localStorage.setItem(seenKey(), JSON.stringify(ids.slice(-200)));
  } catch {
    // ignore
  }
};

const LeadBadgeContext = createContext({
  count: 0,
  syncLeadItems: () => {},
  addLeadItem: () => {},
  removeLeadItem: () => {},
  markAllSeen: () => {},
});

export const LeadBadgeProvider = ({ children }) => {
  // [{ id: notificationId, count: leadCount }]
  const [leadItems, setLeadItems] = useState([]);
  const [seenIds, setSeenIds] = useState(loadSeen);

  useEffect(() => {
    saveSeen(seenIds);
  }, [seenIds]);

  // Socket list (refresh / 10 sec poll) -> full replace
  const syncLeadItems = useCallback((items) => setLeadItems(items), []);

  // Socket live push -> oru item add
  const addLeadItem = useCallback(
    (item) =>
      setLeadItems((prev) =>
        prev.some((x) => x.id === item.id) ? prev : [item, ...prev],
      ),
    [],
  );

  // Notification read panna -> udane remove
  const removeLeadItem = useCallback(
    (id) => setLeadItems((prev) => prev.filter((x) => x.id !== id)),
    [],
  );

  // Pipeline page la irukkumbodhu ellaathaiyum seen nu mark
  const markAllSeen = useCallback(() => {
    setSeenIds((prev) => {
      const missing = leadItems
        .map((x) => x.id)
        .filter((id) => !prev.includes(id));
      return missing.length ? [...prev, ...missing] : prev;
    });
  }, [leadItems]);

  // Badge = unseen notifications oda lead count kootu
  const count = useMemo(
    () =>
      leadItems
        .filter((x) => !seenIds.includes(x.id))
        .reduce((sum, x) => sum + x.count, 0),
    [leadItems, seenIds],
  );

  const value = useMemo(
    () => ({ count, syncLeadItems, addLeadItem, removeLeadItem, markAllSeen }),
    [count, syncLeadItems, addLeadItem, removeLeadItem, markAllSeen],
  );

  return (
    <LeadBadgeContext.Provider value={value}>
      {children}
    </LeadBadgeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLeadBadge = () => useContext(LeadBadgeContext);
