import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { DayResponse, InputItem } from "../types";
import "./HistoryDetail.css";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateHeading(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function copyText(text: string) {
  // Fallback for non-HTTPS (navigator.clipboard requires secure context)
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

function EditHistory({ item }: { item: InputItem }) {
  const [expanded, setExpanded] = useState(false);
  const edits = item.edits || [];
  if (edits.length === 0) return null;

  return (
    <div className="hd-edit-history">
      <button
        className="hd-edit-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Hide" : "Show"} edit history ({edits.length}{" "}
        {edits.length === 1 ? "edit" : "edits"})
      </button>
      {expanded && (
        <div className="hd-edit-list">
          {edits.map((edit) => (
            <div key={edit.id} className="hd-edit-entry">
              <span className="hd-edit-time">
                {formatTime(edit.edited_at)}
              </span>
              <p className="hd-edit-content">{edit.old_content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistoryDetail() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [day, setDay] = useState<DayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchDay = useCallback(async () => {
    if (!date) return;
    try {
      const data = await api.get<DayResponse>(`/days/${date}`);
      setDay(data);
    } catch {
      setDay(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchDay();
  }, [fetchDay]);

  function handleCopy(text: string, id: string) {
    copyText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  if (loading) {
    return (
      <div className="hd-page">
        <p style={{ textAlign: "center", color: "var(--text3)", marginTop: 80 }}>Loading...</p>
      </div>
    );
  }

  if (!day) {
    return (
      <div className="hd-page">
        <p style={{ textAlign: "center", color: "var(--text3)", marginTop: 80 }}>Day not found.</p>
      </div>
    );
  }

  return (
    <div className="hd-page">
      <button className="hd-back" onClick={() => navigate("/history")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        History
      </button>

      <h1 className="hd-title">{formatDateHeading(day.date)}</h1>

      {/* Input items section */}
      <section className="hd-section">
        <h2 className="hd-section-title">
          Messages
          <span className="hd-count">{day.input_items.length}</span>
        </h2>
        {day.input_items.length === 0 ? (
          <p className="hd-empty">No messages this day.</p>
        ) : (
          <div className="hd-items">
            {day.input_items.map((item) => (
              <div
                key={item.id}
                className={`hd-item ${item.cleared ? "hd-item--cleared" : ""}`}
              >
                {item.cleared && <span className="hd-cleared-badge">Deleted</span>}
                {(item.edits?.length ?? 0) > 0 && !item.cleared && (
                  <span className="hd-edited-badge">Edited</span>
                )}
                {item.type === "image" ? (
                  <img
                    className="hd-item-img"
                    src={`/api/v1/uploads/${item.content}`}
                    alt="Uploaded"
                  />
                ) : item.type === "url" ? (
                  <div className="hd-item-url">
                    <span className="hd-item-domain">{getDomain(item.content)}</span>
                    <a href={item.content} target="_blank" rel="noopener noreferrer">
                      {item.content}
                    </a>
                    {item.extracted_text && (
                      <p className="hd-item-extract">{item.extracted_text}</p>
                    )}
                  </div>
                ) : (
                  <p className="hd-item-text">{item.content}</p>
                )}
                <span className="hd-item-time">{formatTime(item.created_at)}</span>
                <EditHistory item={item} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Generations section */}
      <section className="hd-section">
        <h2 className="hd-section-title">
          Generations
          <span className="hd-count">{day.generations.length}</span>
        </h2>
        {day.generations.length === 0 ? (
          <p className="hd-empty">No generations this day.</p>
        ) : (
          day.generations.map((gen, gi) => (
            <div key={gen.id} className="hd-gen">
              <div className="hd-gen-header">
                Generation #{gi + 1}
                <span className="hd-gen-time">{formatTime(gen.created_at)}</span>
              </div>
              <div className="hd-gen-results">
                {gen.results.map((r) => (
                  <div key={r.id} className="hd-result">
                    <div className="hd-result-header">
                      <span className="hd-result-channel">{r.channel_id}</span>
                      <span className="hd-result-meta">{r.style} / {r.language}</span>
                    </div>
                    <p className="hd-result-text">{r.text}</p>
                    <button
                      className="hd-copy-btn"
                      onClick={() => handleCopy(r.text, r.id)}
                    >
                      {copiedId === r.id ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
