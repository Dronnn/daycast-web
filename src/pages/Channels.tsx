import { useCallback, useEffect, useState } from "react";
import { api, getGenerationSettings, saveGenerationSettings } from "../api/client";
import type { ChannelSetting } from "../types";
import "./Channels.css";

const CHANNELS = [
  {
    id: "blog",
    name: "Blog",
    desc: "Long-form, structured post",
    letter: "B",
    gradient: "linear-gradient(135deg, #0071e3, #00c6fb)",
  },
  {
    id: "diary",
    name: "Diary",
    desc: "Personal reflection, private tone",
    letter: "D",
    gradient: "linear-gradient(135deg, #bf5af2, #ff6bcb)",
  },
  {
    id: "tg_personal",
    name: "Telegram Personal",
    desc: "Informal, for close friends",
    letter: "T",
    gradient: "linear-gradient(135deg, #2AABEE, #229ED9)",
  },
  {
    id: "tg_public",
    name: "Telegram Public",
    desc: "Informative, for your audience",
    letter: "T",
    gradient: "linear-gradient(135deg, #2AABEE, #229ED9)",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    desc: "Short and punchy, 280 chars",
    letter: "X",
    gradient: "linear-gradient(135deg, #1d1d1f, #555)",
  },
];

const STYLES = ["concise", "detailed", "structured", "plan", "advisory", "casual", "funny", "serious", "list_numbered", "list_bulleted"];
const LANGUAGES = ["ru", "en", "de", "hy"];
const LENGTHS = [
  { id: "brief", label: "Brief" },
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "detailed", label: "Detailed" },
  { id: "full", label: "Full" },
];

type LocalSettings = Record<
  string,
  { is_active: boolean; default_style: string; default_language: string; default_length: string }
>;

function buildDefaults(): LocalSettings {
  const m: LocalSettings = {};
  for (const ch of CHANNELS) {
    m[ch.id] = { is_active: true, default_style: "casual", default_language: "ru", default_length: "medium" };
  }
  return m;
}

export default function Channels() {
  const [settings, setSettings] = useState<LocalSettings>(buildDefaults);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [separateBusinessPersonal, setSeparateBusinessPersonal] = useState(false);
  const [genSettingsLoading, setGenSettingsLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const data = await api.get<ChannelSetting[]>("/settings/channels");
      if (data.length > 0) {
        setSettings((prev) => {
          const next = { ...prev };
          for (const cs of data) {
            next[cs.channel_id] = {
              is_active: cs.is_active,
              default_style: cs.default_style,
              default_language: cs.default_language,
              default_length: cs.default_length || "medium",
            };
          }
          return next;
        });
      }
    } catch {
      // use defaults
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    getGenerationSettings().then(s => {
      setCustomInstruction(s.custom_instruction || '');
      setSeparateBusinessPersonal(s.separate_business_personal);
    }).catch(() => {});
  }, []);

  const handleSaveGenSettings = useCallback(async () => {
    setGenSettingsLoading(true);
    try {
      await saveGenerationSettings({
        custom_instruction: customInstruction || null,
        separate_business_personal: separateBusinessPersonal,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {} finally {
      setGenSettingsLoading(false);
    }
  }, [customInstruction, separateBusinessPersonal]);

  function updateChannel(
    channelId: string,
    field: "is_active" | "default_style" | "default_language" | "default_length",
    value: boolean | string
  ) {
    setSettings((prev) => ({
      ...prev,
      [channelId]: { ...prev[channelId], [field]: value },
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const channels = Object.entries(settings).map(([channel_id, s]) => ({
        channel_id,
        ...s,
      }));
      await api.post("/settings/channels", { channels });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="channels-page">
      <h1 className="channels-title">Channels</h1>
      <p className="channels-desc">
        Choose which channels to generate content for and set default style,
        language, and length.
      </p>
      <section className="gen-settings-section">
        <h3 className="gen-settings-title">Generation Settings</h3>
        <div className="gen-settings-card">
          <div className="gen-setting-row">
            <label className="gen-setting-label">Custom instruction for AI</label>
            <textarea
              className="gen-setting-textarea"
              value={customInstruction}
              onChange={e => setCustomInstruction(e.target.value)}
              placeholder="E.g.: Always mention the weather. Write in a formal tone..."
              rows={3}
            />
          </div>
          <div className="gen-setting-row toggle-row">
            <label className="gen-setting-label">Separate business & personal events</label>
            <button
              className={`toggle ${separateBusinessPersonal ? 'toggle-on' : ''}`}
              onClick={() => setSeparateBusinessPersonal(!separateBusinessPersonal)}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
          <button className="gen-settings-save" onClick={handleSaveGenSettings} disabled={genSettingsLoading}>
            {genSettingsLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </section>
      <div className="channels-list">
        {CHANNELS.map((ch) => {
          const s = settings[ch.id];
          return (
            <div
              key={ch.id}
              className={`channel-row ${!s.is_active ? "channel-row--off" : ""}`}
            >
              <div
                className="channel-icon"
                style={{ background: ch.gradient }}
              >
                {ch.letter}
              </div>
              <div className="channel-info">
                <div className="channel-name">{ch.name}</div>
                <div className="channel-desc">{ch.desc}</div>
              </div>
              <div className="channel-controls">
                <select
                  className="channel-select"
                  value={s.default_style}
                  onChange={(e) =>
                    updateChannel(ch.id, "default_style", e.target.value)
                  }
                >
                  {STYLES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <select
                  className="channel-select"
                  value={s.default_language}
                  onChange={(e) =>
                    updateChannel(ch.id, "default_language", e.target.value)
                  }
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <select
                  className="channel-select"
                  value={s.default_length}
                  onChange={(e) =>
                    updateChannel(ch.id, "default_length", e.target.value)
                  }
                >
                  {LENGTHS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={s.is_active}
                    onChange={(e) =>
                      updateChannel(ch.id, "is_active", e.target.checked)
                    }
                  />
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                </label>
              </div>
            </div>
          );
        })}
      </div>
      <div className="channels-save-wrap">
        <button
          className="channels-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
