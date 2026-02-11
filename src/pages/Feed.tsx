import { useCallback, useEffect, useRef, useState } from "react";
import { api, publishInputItem, unpublishPost, getInputPublishStatus, exportDay } from "../api/client";
import type { InputItem, DayResponse } from "../types";
import "./Feed.css";

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatFeedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

const URL_RE = /^https?:\/\/.+/i;

export default function Feed() {
  const [items, setItems] = useState<InputItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedEdits, setExpandedEdits] = useState<Set<string>>(new Set());
  const [publishedMap, setPublishedMap] = useState<Record<string, string>>({}); // input_item_id -> post_id

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const date = todayISO();

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const day = await api.get<DayResponse>(`/days/${todayISO()}`);
      setItems(day.input_items.filter(i => !i.cleared));
    } catch {
      try {
        const data = await api.get<InputItem[]>(`/inputs?date=${todayISO()}`);
        setItems(data);
      } catch {
        // empty feed on error
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length]);

  // Fetch publish status for text items
  useEffect(() => {
    const textIds = items.filter(i => i.type === "text").map(i => i.id);
    if (textIds.length === 0) return;
    getInputPublishStatus(textIds).then(res => {
      const map: Record<string, string> = {};
      for (const [inputId, postId] of Object.entries(res.statuses)) {
        if (postId) map[inputId] = postId;
      }
      setPublishedMap(map);
    }).catch(() => {});
  }, [items]);

  const handleSetImportance = useCallback(async (id: string, importance: number | null) => {
    try {
      await api.put(`/inputs/${id}`, { importance });
      setItems(prev => prev.map(item => item.id === id ? { ...item, importance } : item));
    } catch {}
  }, []);

  const handleToggleGeneration = useCallback(async (id: string, include: boolean) => {
    try {
      await api.put(`/inputs/${id}`, { include_in_generation: include });
      setItems(prev => prev.map(item => item.id === id ? { ...item, include_in_generation: include } : item));
    } catch {}
  }, []);

  const handleTogglePublish = useCallback(async (inputItemId: string) => {
    const postId = publishedMap[inputItemId];
    try {
      if (postId) {
        await unpublishPost(postId);
        setPublishedMap(prev => { const next = { ...prev }; delete next[inputItemId]; return next; });
        setError("Unpublished!");
      } else {
        const post = await publishInputItem(inputItemId);
        setPublishedMap(prev => ({ ...prev, [inputItemId]: post.id }));
        setError("Published!");
      }
      setTimeout(() => setError(null), 2000);
    } catch (e: any) {
      setError(e.message);
    }
  }, [publishedMap]);

  const handleExport = useCallback(async () => {
    try {
      const result = await exportDay(todayISO());
      await navigator.clipboard.writeText(result.text);
      setError("Copied to clipboard!");
      setTimeout(() => setError(null), 2000);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  async function handleSend() {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setError(null);
    try {
      const type = URL_RE.test(value) ? "url" : "text";
      const item = await api.post<InputItem>("/inputs", {
        type,
        content: value,
        date,
      });
      setItems((prev) => [...prev, item]);
      setText("");
      inputRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleUpload(file: File) {
    const form = new FormData();
    form.append("file", file);
    form.append("date", date);
    try {
      const item = await api.post<InputItem>("/inputs/upload", form);
      setItems((prev) => [...prev, item]);
    } catch {
      // ignore upload errors for now
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/inputs/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleEdit(id: string) {
    if (!editText.trim()) return;
    const updated = await api.put<InputItem>(`/inputs/${id}`, {
      content: editText.trim(),
    });
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    setEditingId(null);
    setEditText("");
  }

  async function handleClearDay() {
    await api.delete(`/inputs?date=${date}`);
    setItems([]);
  }

  function startEdit(item: InputItem) {
    setEditingId(item.id);
    setEditText(item.content);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleEditKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit(id);
    }
    if (e.key === "Escape") {
      setEditingId(null);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        if (file.type.startsWith("image/")) handleUpload(file);
      });
      return;
    }

    const url =
      e.dataTransfer.getData("text/uri-list") ||
      e.dataTransfer.getData("text/plain");
    if (url && URL_RE.test(url.trim())) {
      api
        .post<InputItem>("/inputs", { type: "url", content: url.trim(), date })
        .then((item) => setItems((prev) => [...prev, item]));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  }

  return (
    <div
      className="feed-page"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="feed-drop-overlay">
          <div className="feed-drop-card">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Drop links or photos here</span>
          </div>
        </div>
      )}

      <div className="feed-header">
        <span className="feed-date">Today, {formatFeedDate()}</span>
        {items.length > 0 && (
          <>
            <button className="feed-clear" onClick={handleClearDay}>
              Clear day
            </button>
            <button className="day-action export-btn" onClick={handleExport}>Export</button>
          </>
        )}
      </div>

      <div className="feed-list" ref={listRef}>
        {loading ? (
          <div className="feed-empty">
            <p className="feed-empty-text">Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="feed-empty">
            <p className="feed-empty-text">No items yet today.</p>
            <p className="feed-empty-hint">
              Add text, links, or photos below to get started.
            </p>
          </div>
        ) : (
          <div className="feed-items">
            {items.map((item) => (
              <div key={item.id} className={`item${!item.include_in_generation ? ' item-excluded' : ''}`}>
                {editingId === item.id ? (
                  <div className="edit-bubble">
                    <input
                      className="edit-input"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button
                        className="edit-save"
                        onClick={() => handleEdit(item.id)}
                      >
                        Save
                      </button>
                      <button
                        className="edit-cancel"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : item.type === "url" ? (
                  <a
                    href={item.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bubble link-card"
                  >
                    <div className="link-img">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </div>
                    <div className="link-content">
                      <div className="link-domain">
                        {getDomain(item.content)}
                      </div>
                      <div className="link-title">{item.content}</div>
                      {item.extracted_text && (
                        <div className="link-desc">{item.extracted_text}</div>
                      )}
                    </div>
                  </a>
                ) : item.type === "image" ? (
                  <div className="bubble photo">
                    <img
                      className="photo-img"
                      src={`/api/v1/uploads/${item.content}`}
                      alt="Uploaded"
                    />
                  </div>
                ) : (
                  <div className="bubble">{item.content}</div>
                )}

                {/* Star rating */}
                <div className="item-stars" onClick={e => e.stopPropagation()}>
                  {[1,2,3,4,5].map(n => (
                    <span
                      key={n}
                      className={`star ${(item.importance || 0) >= n ? 'star-filled' : ''}`}
                      onClick={() => handleSetImportance(item.id, item.importance === n ? null : n)}
                    >
                      {(item.importance || 0) >= n ? '\u2605' : '\u2606'}
                    </span>
                  ))}
                </div>

                {/* Edit history */}
                {item.edits && item.edits.length > 0 && (
                  <div className="edit-history-section">
                    <button
                      className="edited-badge"
                      onClick={() => setExpandedEdits(prev => {
                        const next = new Set(prev);
                        next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                        return next;
                      })}
                    >
                      Edited ({item.edits.length})
                    </button>
                    {expandedEdits.has(item.id) && (
                      <div className="edit-history-list">
                        {item.edits.map(edit => (
                          <div key={edit.id} className="edit-entry">
                            <div className="edit-old-content">{edit.old_content}</div>
                            <div className="edit-time">{formatTime(edit.edited_at)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="item-meta">
                  <span className="item-time">
                    {formatTime(item.created_at)}
                  </span>
                  <div className="item-actions">
                    <button
                      className={`ai-pill ${!item.include_in_generation ? 'ai-pill--off' : ''}`}
                      title={item.include_in_generation ? 'Included in AI generation' : 'Excluded from AI generation'}
                      onClick={() => handleToggleGeneration(item.id, !item.include_in_generation)}
                    >
                      AI
                    </button>
                    {item.type === 'text' && (
                      <button
                        className={`item-act ${publishedMap[item.id] ? 'unpublish-btn' : 'publish-btn'}`}
                        onClick={() => handleTogglePublish(item.id)}
                        title={publishedMap[item.id] ? 'Unpublish' : 'Publish'}
                      >
                        {publishedMap[item.id] ? 'Unpublish' : 'Publish'}
                      </button>
                    )}
                    {item.type !== "image" && (
                      <button
                        className="item-act"
                        onClick={() => startEdit(item)}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      className="item-act item-act--delete"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && <div style={{color: error.startsWith("Published") || error.startsWith("Unpublished") || error.startsWith("Copied") ? "#34C759" : "#e74c3c",textAlign:"center",padding:"8px",fontSize:"14px"}}>{error}</div>}
      <div className="composer">
        <div className="composer-inner">
          <div className="composer-tools">
            <button
              className="tool-btn"
              title="Add link"
              onClick={() => {
                setText("https://");
                inputRef.current?.focus();
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
            <button
              className="tool-btn"
              title="Add photo"
              onClick={() => fileRef.current?.click()}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="file-input-hidden"
              onChange={handleFileChange}
            />
          </div>
          <input
            ref={inputRef}
            className="composer-input"
            type="text"
            placeholder="What's on your mind today?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <button
            className="send-btn"
            title="Send"
            onClick={handleSend}
            disabled={!text.trim() || sending}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
