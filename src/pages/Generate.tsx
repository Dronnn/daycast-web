import { useCallback, useEffect, useRef, useState } from "react";
import { api, publishPost, unpublishPost, getPublishStatus } from "../api/client";
import type {
  DayResponse,
  Generation,
  GenerationResult,
  InputItem,
} from "../types";
import { motion, AnimatePresence, useInView } from "framer-motion";
import "./Generate.css";

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

const CHANNEL_META: Record<
  string,
  { letter: string; css: string; name: string }
> = {
  blog: { letter: "B", css: "blog", name: "Blog" },
  diary: { letter: "D", css: "diary", name: "Personal Diary" },
  tg_personal: { letter: "T", css: "tg", name: "Telegram Personal" },
  tg_public: { letter: "T", css: "tg", name: "Telegram Public" },
  twitter: { letter: "X", css: "x", name: "Twitter / X" },
};

function channelMeta(id: string) {
  return CHANNEL_META[id] ?? { letter: id[0]?.toUpperCase(), css: "", name: id };
}

const cardVariants = {
  initial: { opacity: 0, y: 30, scale: 0.96 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
      delay: i * 0.08,
    },
  }),
};

/* -- Skeleton card -- */
function SkeletonCard({ channel }: { channel: string }) {
  const m = channelMeta(channel);
  return (
    <div className="gen-card">
      <div className="gen-card-head">
        <div className={`gen-card-icon ${m.css}`}>{m.letter}</div>
        <div>
          <div className="gen-card-name">{m.name}</div>
        </div>
      </div>
      <div className="gen-card-body">
        <div className="skeleton">
          <div className="sk-line" style={{ width: "100%" }} />
          <div className="sk-line" style={{ width: "88%" }} />
          <div className="sk-line" style={{ width: "93%" }} />
          <div className="sk-line" style={{ width: "55%" }} />
        </div>
      </div>
    </div>
  );
}

/* -- Result card -- */
function ResultCard({
  result,
  index,
  onRegenerate,
  regenerating,
  publishedPostId,
  onPublish,
  onUnpublish,
}: {
  result: GenerationResult;
  index: number;
  onRegenerate: (channelId: string) => void;
  regenerating: boolean;
  publishedPostId: string | null | undefined;
  onPublish: (resultId: string) => void;
  onUnpublish: (resultId: string) => void;
}) {
  const m = channelMeta(result.channel_id);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-50px" });

  function handleCopy() {
    copyText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      ref={cardRef}
      className="gen-card"
      variants={cardVariants}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      custom={index}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="gen-card-accent" data-channel={result.channel_id} />
      <div className="gen-card-head">
        <div className={`gen-card-icon ${m.css}`}>{m.letter}</div>
        <div>
          <div className="gen-card-name">{m.name}</div>
          <div className="gen-card-meta">
            {result.style} &middot; {result.language}
          </div>
        </div>
      </div>
      <div className="gen-card-body">
        <div className="gen-card-text">{result.text}</div>
      </div>
      <div className="gen-card-foot">
        <motion.button
          className="gen-card-btn main"
          onClick={handleCopy}
          whileTap={{ scale: 0.93 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          {copied ? "Copied!" : "Copy"}
        </motion.button>
        <motion.button
          className="gen-card-btn sec"
          onClick={() => onRegenerate(result.channel_id)}
          disabled={regenerating}
          whileTap={{ scale: 0.93 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          Regenerate
        </motion.button>
        {publishedPostId ? (
          <>
            <span className="gen-card-badge published">Published</span>
            <motion.button
              className="gen-card-btn unpublish"
              onClick={() => onUnpublish(result.id)}
              whileTap={{ scale: 0.93 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              Unpublish
            </motion.button>
          </>
        ) : (
          <motion.button
            className="gen-card-btn publish"
            onClick={() => onPublish(result.id)}
            whileTap={{ scale: 0.93 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            Publish
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* -- Source item -- */
function SourceItem({ item }: { item: InputItem }) {
  return (
    <div className="source-item">
      <span className="source-type">{item.type}</span>
      <span className="source-content">
        {item.type === "image" ? "(photo)" : item.content}
      </span>
    </div>
  );
}

/* -- Main page -- */
export default function Generate() {
  const [items, setItems] = useState<InputItem[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [genIdx, setGenIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<Record<string, string | null>>({});

  const date = todayISO();

  const fetchDay = useCallback(async () => {
    try {
      const day = await api.get<DayResponse>(`/days/${date}`);
      setItems(day.input_items);
      setGenerations(day.generations);
      if (day.generations.length > 0) {
        setGenIdx(day.generations.length - 1);
      }
    } catch {
      // no data yet
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchDay();
  }, [fetchDay]);

  const currentGen = generations[genIdx] ?? null;

  useEffect(() => {
    if (!currentGen) return;
    const ids = currentGen.results.map(r => r.id);
    if (ids.length === 0) return;
    getPublishStatus(ids).then(resp => setPublishStatus(resp.statuses)).catch(() => {});
  }, [currentGen]);

  async function handlePublish(resultId: string) {
    try {
      const post = await publishPost(resultId);
      setPublishStatus(prev => ({ ...prev, [resultId]: post.id }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    }
  }

  async function handleUnpublish(resultId: string) {
    const postId = publishStatus[resultId];
    if (!postId) return;
    try {
      await unpublishPost(postId);
      setPublishStatus(prev => ({ ...prev, [resultId]: null }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unpublish failed");
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const gen = await api.post<Generation>("/generate", { date });
      setGenerations((prev) => [...prev, gen]);
      setGenIdx(generations.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerateAll() {
    if (!currentGen) return;
    setGenerating(true);
    setError(null);
    try {
      const gen = await api.post<Generation>(
        `/generate/${currentGen.id}/regenerate`,
        {}
      );
      setGenerations((prev) => [...prev, gen]);
      setGenIdx(generations.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regeneration failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerateChannel(channelId: string) {
    if (!currentGen) return;
    setGenerating(true);
    setError(null);
    try {
      const gen = await api.post<Generation>(
        `/generate/${currentGen.id}/regenerate`,
        { channels: [channelId] }
      );
      setGenerations((prev) => [...prev, gen]);
      setGenIdx(generations.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regeneration failed");
    } finally {
      setGenerating(false);
    }
  }

  const skeletonChannels = ["blog", "diary", "tg_personal", "twitter"];
  const sourceItems = items.filter(i => i.include_in_generation && !i.cleared);
  const hasItems = items.length > 0;
  const showHero = !generating && !currentGen;
  const showSkeleton = generating && !currentGen;
  const showResults = !!currentGen && !generating;

  if (loading) {
    return <div className="generate-page" />;
  }

  return (
    <div className="generate-page">
      <div className="generate-scroll">
        <div className="generate-content">
          {/* -- Hero -- */}
          <AnimatePresence mode="wait">
            {showHero && (
              <motion.div
                className="generate-hero"
                key="hero"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="generate-glow" />
                <motion.div
                  className="generate-badge"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  {items.length} item{items.length !== 1 ? "s" : ""} ready
                </motion.div>
                <h1 className="generate-title">
                  Turn your day into{" "}
                  <span className="generate-title-gradient">content</span>.
                </h1>
                <p className="generate-desc">
                  {hasItems
                    ? "Transform today's thoughts, links, and photos into polished posts for every channel you care about."
                    : "Add some thoughts, links, or photos to your feed first, then come back to generate."}
                </p>
                <motion.button
                  className="generate-btn"
                  onClick={handleGenerate}
                  disabled={!hasItems}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </motion.button>
                {error && <p className="generate-error">{error}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* -- Skeleton -- */}
          <AnimatePresence>
            {showSkeleton && (
              <motion.div
                className="generate-skeleton"
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="generate-btn generate-btn--spinning">
                  <div className="spinner" />
                </div>
                <div className="gen-cards">
                  {skeletonChannels.map((ch) => (
                    <SkeletonCard key={ch} channel={ch} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* -- Results -- */}
          {showResults && (
            <>
              <motion.div
                className="gen-actions-bar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
              >
                  <motion.button
                    className="gen-source-btn"
                    onClick={() => setShowSource((s) => !s)}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {showSource ? "Hide source" : "Show source"}
                  </motion.button>
                  <motion.button
                    className="gen-regen-btn"
                    onClick={handleRegenerateAll}
                    disabled={generating}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    Regenerate All
                  </motion.button>
                  <motion.button
                    className="gen-new-btn"
                    onClick={handleGenerate}
                    disabled={generating || !hasItems}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    Generate New
                  </motion.button>
              </motion.div>

              <motion.div
                className="gen-results-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 20 }}
              >
                <div>
                  <p className="gen-results-label">
                    Generation #{genIdx + 1}
                    {generations.length > 1 && (
                      <span className="gen-nav">
                        <button
                          className="gen-nav-btn"
                          disabled={genIdx === 0}
                          onClick={() => setGenIdx((i) => i - 1)}
                        >
                          &lsaquo;
                        </button>
                        <span>
                          {genIdx + 1}/{generations.length}
                        </span>
                        <button
                          className="gen-nav-btn"
                          disabled={genIdx === generations.length - 1}
                          onClick={() => setGenIdx((i) => i + 1)}
                        >
                          &rsaquo;
                        </button>
                      </span>
                    )}
                  </p>
                  <h2 className="gen-results-title">Your Content</h2>
                </div>
              </motion.div>

              {error && <p className="generate-error">{error}</p>}

              {/* Source panel */}
              <AnimatePresence>
                {showSource && sourceItems.length > 0 && (
                  <motion.div
                    className="gen-source-panel"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 28 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div className="gen-source-label">
                      Source — {sourceItems.length} item{sourceItems.length !== 1 ? "s" : ""}
                    </div>
                    <div className="gen-source-list">
                      {sourceItems.map((item) => (
                        <SourceItem key={item.id} item={item} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cards */}
              <div className="gen-cards">
                {currentGen.results.map((result, i) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    index={i}
                    onRegenerate={handleRegenerateChannel}
                    regenerating={generating}
                    publishedPostId={publishStatus[result.id]}
                    onPublish={handlePublish}
                    onUnpublish={handleUnpublish}
                  />
                ))}
              </div>

            </>
          )}

          {/* -- Generating overlay on results -- */}
          {generating && currentGen && (
            <>
              <div className="gen-results-header" style={{ opacity: 0.5 }}>
                <div>
                  <p className="gen-results-label">Generating...</p>
                  <h2 className="gen-results-title">Your Content</h2>
                </div>
              </div>
              <div className="gen-cards">
                {skeletonChannels.map((ch) => (
                  <SkeletonCard key={ch} channel={ch} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
