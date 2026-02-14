import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, publishPost, unpublishPost, getPublishStatus } from "../api/client";
import type { DayResponse, InputItem } from "../types";
import { motion, AnimatePresence } from "framer-motion";
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

function computeWordDiff(oldText: string, newText: string): { type: 'same' | 'added' | 'removed'; text: string }[] {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);
  const result: { type: 'same' | 'added' | 'removed'; text: string }[] = [];

  let i = 0, j = 0;
  while (i < oldWords.length && j < newWords.length) {
    if (oldWords[i] === newWords[j]) {
      result.push({ type: 'same', text: oldWords[i] });
      i++; j++;
    } else {
      result.push({ type: 'removed', text: oldWords[i] });
      result.push({ type: 'added', text: newWords[j] });
      i++; j++;
    }
  }
  while (i < oldWords.length) {
    result.push({ type: 'removed', text: oldWords[i++] });
  }
  while (j < newWords.length) {
    result.push({ type: 'added', text: newWords[j++] });
  }
  return result;
}

function EditHistory({ item }: { item: InputItem }) {
  const [expanded, setExpanded] = useState(false);
  const edits = item.edits || [];
  if (edits.length === 0) return null;

  return (
    <div className="hd-edit-history">
      <motion.button
        className="hd-edit-toggle"
        onClick={() => setExpanded(!expanded)}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        {expanded ? "Hide" : "Show"} edit history ({edits.length}{" "}
        {edits.length === 1 ? "edit" : "edits"})
      </motion.button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="hd-edit-list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {edits.map((edit) => (
              <div key={edit.id} className="hd-edit-entry">
                <span className="hd-edit-time">
                  {formatTime(edit.edited_at)}
                </span>
                <div className="diff-display">
                  {computeWordDiff(edit.old_content, item.content).map((part, idx) => (
                    <span key={idx} className={part.type === 'removed' ? 'diff-removed' : part.type === 'added' ? 'diff-added' : ''}>
                      {part.text}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const itemVariants = {
  initial: { opacity: 0, y: 24 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
    },
  },
};

const genVariants = {
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

export default function HistoryDetail() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [day, setDay] = useState<DayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<Record<string, string | null>>({});

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

  useEffect(() => {
    if (!day) return;
    const ids = day.generations.flatMap(g => g.results.map(r => r.id));
    if (ids.length === 0) return;
    getPublishStatus(ids).then(resp => setPublishStatus(resp.statuses)).catch(() => {});
  }, [day]);

  async function handlePublish(resultId: string) {
    try {
      const post = await publishPost(resultId);
      setPublishStatus(prev => ({ ...prev, [resultId]: post.id }));
    } catch {
      // silent
    }
  }

  async function handleUnpublish(resultId: string) {
    const postId = publishStatus[resultId];
    if (!postId) return;
    try {
      await unpublishPost(postId);
      setPublishStatus(prev => ({ ...prev, [resultId]: null }));
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="hd-page">
        <p className="hd-empty" style={{ marginTop: 80 }}>Loading...</p>
      </div>
    );
  }

  if (!day) {
    return (
      <div className="hd-page">
        <p className="hd-empty" style={{ marginTop: 80 }}>Day not found.</p>
      </div>
    );
  }

  return (
    <div className="hd-page">
      <motion.button
        className="hd-back"
        onClick={() => navigate("/history")}
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        History
      </motion.button>

      <motion.h1
        className="hd-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {formatDateHeading(day.date)}
      </motion.h1>

      {/* Input items section */}
      <section className="hd-section">
        <motion.h2
          className="hd-section-title"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
        >
          Messages
          <span className="hd-count">{day.input_items.length}</span>
        </motion.h2>
        {day.input_items.length === 0 ? (
          <p className="hd-empty">No messages this day.</p>
        ) : (
          <div className="hd-items">
            {day.input_items.map((item, i) => (
              <motion.div
                key={item.id}
                className={`hd-item ${item.cleared ? "hd-item--cleared" : ""}`}
                variants={itemVariants}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale: 1.005 }}
              >
                {item.cleared && <span className="hd-cleared-badge">Deleted</span>}
                {(item.edits?.length ?? 0) > 0 && !item.cleared && (
                  <span className="hd-edited-badge">Edited</span>
                )}
                {!item.include_in_generation && (
                  <span className="hd-excluded-badge">Excluded</span>
                )}
                {item.importance != null && item.importance > 0 && (
                  <span className="hd-importance">
                    {Array.from({ length: item.importance }, (_, i) => (
                      <span key={i} style={{ fontSize: `${10 + i * 3}px` }}>🔥</span>
                    ))}
                  </span>
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
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Generations section */}
      <section className="hd-section">
        <motion.h2
          className="hd-section-title"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.15 }}
        >
          Generations
          <span className="hd-count">{day.generations.length}</span>
        </motion.h2>
        {day.generations.length === 0 ? (
          <p className="hd-empty">No generations this day.</p>
        ) : (
          day.generations.map((gen, gi) => (
            <motion.div
              key={gen.id}
              className="hd-gen"
              variants={genVariants}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: gi * 0.06 }}
            >
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
                    <div className="hd-result-actions">
                      <motion.button
                        className="hd-copy-btn"
                        onClick={() => handleCopy(r.text, r.id)}
                        whileTap={{ scale: 0.93 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        {copiedId === r.id ? "Copied!" : "Copy"}
                      </motion.button>
                      {publishStatus[r.id] ? (
                        <>
                          <span className="hd-published-badge">Published</span>
                          <motion.button
                            className="hd-unpublish-btn"
                            onClick={() => handleUnpublish(r.id)}
                            whileTap={{ scale: 0.93 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                          >
                            Unpublish
                          </motion.button>
                        </>
                      ) : (
                        <motion.button
                          className="hd-publish-btn"
                          onClick={() => handlePublish(r.id)}
                          whileTap={{ scale: 0.93 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          Publish
                        </motion.button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </section>
    </div>
  );
}
