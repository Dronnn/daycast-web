import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { DayListResponse, DaySummary } from "../types";
import { motion } from "framer-motion";
import "./History.css";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function groupLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const rowVariants = {
  initial: { opacity: 0, x: -20 },
  whileInView: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
    },
  },
};

const groupVariants = {
  initial: { opacity: 0, y: 20 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    },
  },
};

export default function History() {
  const [days, setDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchDays = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const data = await api.get<DayListResponse>(`/days${params}`);
      setDays(data.items);
    } catch {
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(fetchDays, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchDays, search]);

  const grouped: Record<string, DaySummary[]> = {};
  for (const day of days) {
    const label = groupLabel(day.date);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(day);
  }

  return (
    <div className="history-page">
      <motion.h1
        className="history-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        History
      </motion.h1>
      <motion.p
        className="history-desc"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.05 }}
      >
        Browse your past days, inputs, and generated content.
      </motion.p>
      <motion.div
        className="history-search-wrap"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
      >
        <svg className="history-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="history-search"
          type="text"
          placeholder="Search days..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </motion.div>

      {loading ? (
        <p className="history-loading">Loading...</p>
      ) : days.length === 0 ? (
        <motion.p
          className="history-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {search ? "No matching days found." : "No history yet."}
        </motion.p>
      ) : (
        Object.entries(grouped).map(([label, groupDays]) => (
          <motion.div
            key={label}
            className="history-group"
            variants={groupVariants}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: "-40px" }}
          >
            <div className="history-group-label">{label}</div>
            <div className="history-list">
              <div className="history-timeline" />
              {groupDays.map((day, i) => (
                <motion.div
                  key={day.date}
                  className="history-row"
                  onClick={() => navigate(`/history/${day.date}`)}
                  variants={rowVariants}
                  initial="initial"
                  whileInView="whileInView"
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span
                    className={`history-dot ${day.generation_count > 0 ? "history-dot--active" : ""}`}
                  />
                  <span className="history-date">{formatDate(day.date)}</span>
                  <span className="history-stats">
                    {day.input_count} items &middot; {day.generation_count} gen
                  </span>
                  <svg className="history-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
