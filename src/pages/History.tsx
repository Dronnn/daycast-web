import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { DayListResponse, DaySummary } from "../types";
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
      <h1 className="history-title">History</h1>
      <p className="history-desc">
        Browse your past days, inputs, and generated content.
      </p>
      <div className="history-search-wrap">
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
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text3)" }}>Loading...</p>
      ) : days.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text3)" }}>
          {search ? "No matching days found." : "No history yet."}
        </p>
      ) : (
        Object.entries(grouped).map(([label, groupDays]) => (
          <div key={label} className="history-group">
            <div className="history-group-label">{label}</div>
            <div className="history-list">
              {groupDays.map((day) => (
                <div
                  key={day.date}
                  className="history-row"
                  onClick={() => navigate(`/history/${day.date}`)}
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
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
