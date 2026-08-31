import { Plus, Check, Star, Minus, LogIn } from "lucide-react";
import { useState } from "react";
import { getToken, getAuthorizeUrl, anilistAuthed, SAVE_ENTRY_MUTATION } from "../lib/anilist-auth";

export const COLORS = {
  ink: "#16141C",
  paper: "#F2EEE3",
  cobalt: "#2F3FBF",
  vermillion: "#E14A2E",
  muted: "#8B8578",
  border: "#C9C4B4",
};

export function Panel({ children, style, className = "" }) {
  return (
    <div
      className={className}
      style={{
        background: COLORS.paper,
        border: `3px solid ${COLORS.ink}`,
        borderRadius: "2px",
        boxShadow: `5px 5px 0 ${COLORS.ink}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SkeletonCard({ height = 240 }) {
  return (
    <div
      className="skeleton"
      style={{
        height,
        border: `3px solid ${COLORS.ink}`,
        borderRadius: "2px",
      }}
    />
  );
}

const STATUS_OPTIONS = [
  { value: "CURRENT", label: "Watching/Reading" },
  { value: "PLANNING", label: "Planning" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PAUSED", label: "Paused" },
  { value: "DROPPED", label: "Dropped" },
];

export function ProgressEditor({ mediaId, maxProgress }) {
  const [connected, setConnected] = useState(false);
  const [checked, setChecked] = useState(false);
  const [status, setStatus] = useState("CURRENT");
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  if (typeof window !== "undefined" && !checked) {
    setChecked(true);
    setConnected(!!getToken());
  }

  if (!checked) return null;

  if (!connected) {
    const url = typeof window !== "undefined" ? getAuthorizeUrl() : null;
    return (
      <Panel style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <LogIn size={16} color={COLORS.muted} />
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: COLORS.muted, flex: 1 }}>
          Connect your AniList account to update progress right here.
        </span>
        {url ? (
          <a href={url} style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, background: COLORS.cobalt, color: COLORS.paper, padding: "6px 12px", borderRadius: 2, border: `2px solid ${COLORS.ink}` }}>
              Connect AniList
            </span>
          </a>
        ) : (
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: COLORS.muted }}>
            (needs NEXT_PUBLIC_ANILIST_CLIENT_ID set — see README)
          </span>
        )}
      </Panel>
    );
  }

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await anilistAuthed(SAVE_ENTRY_MUTATION, { mediaId, status, progress });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  return (
    <Panel style={{ padding: "12px 14px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, padding: "6px 8px", border: `1px solid ${COLORS.border}`, borderRadius: 2 }}
      >
        {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${COLORS.border}`, borderRadius: 2, padding: "2px 6px" }}>
        <button onClick={() => setProgress((p) => Math.max(0, p - 1))} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
          <Minus size={13} />
        </button>
        <input
          type="number"
          value={progress}
          onChange={(e) => setProgress(Math.max(0, parseInt(e.target.value, 10) || 0))}
          style={{ width: 46, textAlign: "center", border: "none", fontFamily: "'Inter', sans-serif", fontSize: 13 }}
        />
        {maxProgress ? <span style={{ fontSize: 11, color: COLORS.muted }}>/ {maxProgress}</span> : null}
        <button onClick={() => setProgress((p) => (maxProgress ? Math.min(maxProgress, p + 1) : p + 1))} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
          <Plus size={13} />
        </button>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className={saved ? "pop-in" : ""}
        style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: "0.03em",
          background: saved ? COLORS.vermillion : COLORS.ink, color: COLORS.paper,
          padding: "7px 14px", border: `2px solid ${COLORS.ink}`, borderRadius: 2, cursor: "pointer",
        }}
      >
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save to AniList"}
      </button>

      {error && <span style={{ fontSize: 11, color: "#B23A2A", width: "100%" }}>{error}</span>}
    </Panel>
  );
}

export function Badge({ children, color = COLORS.cobalt }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "'Bebas Neue', sans-serif",
        letterSpacing: "0.05em",
        fontSize: "12px",
        color: COLORS.paper,
        background: color,
        padding: "2px 8px",
        borderRadius: "2px",
      }}
    >
      {children}
    </span>
  );
}

export function MediaCard({ item, onAdd, added, style }) {
  const title = item.title.english || item.title.romaji;
  return (
    <Panel className="hover-lift" style={{ overflow: "hidden", display: "flex", flexDirection: "column", ...style }}>
      <div style={{ position: "relative", aspectRatio: "2/3", overflow: "hidden", borderBottom: `3px solid ${COLORS.ink}` }}>
        <img src={item.coverImage.large} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {item.averageScore ? (
          <div style={{ position: "absolute", top: 8, right: 8, background: COLORS.ink, color: COLORS.paper, fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", padding: "3px 8px", display: "flex", alignItems: "center", gap: 4, borderRadius: "2px" }}>
            <Star size={12} fill={COLORS.vermillion} stroke={COLORS.vermillion} /> {item.averageScore}
          </div>
        ) : null}
      </div>
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "17px", lineHeight: 1.05, color: COLORS.ink, margin: 0, letterSpacing: "0.01em" }}>{title}</h3>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(item.genres || []).slice(0, 2).map((g) => (
            <span key={g} style={{ fontSize: "10px", fontFamily: "'Inter', sans-serif", color: COLORS.muted, border: `1px solid ${COLORS.border}`, padding: "1px 6px", borderRadius: "10px" }}>{g}</span>
          ))}
        </div>
        {onAdd && (
          <button
            onClick={() => onAdd(item)}
            className={added ? "pop-in" : ""}
            style={{
              marginTop: "auto",
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "0.04em",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "7px 10px",
              border: `2px solid ${COLORS.ink}`,
              background: added ? COLORS.vermillion : COLORS.ink,
              color: COLORS.paper,
              cursor: "pointer",
              borderRadius: "2px",
              transition: "background 0.2s ease",
            }}
          >
            {added ? <><Check size={14} /> On your list</> : <><Plus size={14} /> Add to list</>}
          </button>
        )}
      </div>
    </Panel>
  );
}
