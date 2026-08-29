import { Plus, Check, Star, Flame, X, Loader2 } from "lucide-react";

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

export function Badge({ children, color = COLORS.cobalt, className = "" }) {
  return (
    <span
      className={className}
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

export function Spinner({ size = 14, color = COLORS.muted }) {
  return <Loader2 size={size} color={color} className="spin-icon" />;
}

export function SkeletonBlock({ width = "100%", height = 16, style }) {
  return <div className="skeleton-block" style={{ width, height, ...style }} />;
}

export function MediaCard({ item, onAdd, added, delay = 0 }) {
  const title = item.title.english || item.title.romaji;
  return (
    <Panel
      className="fade-in-up hover-lift cover-zoom"
      style={{ overflow: "hidden", display: "flex", flexDirection: "column", animationDelay: `${delay}ms` }}
    >
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
            className="press-btn"
            onClick={() => onAdd(item)}
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
            }}
          >
            {added ? <><Check size={14} /> On your list</> : <><Plus size={14} /> Add to list</>}
          </button>
        )}
      </div>
    </Panel>
  );
}

// Small badge shown on news/thread items that match a title in the user's AniList list.
export function HighlightBadge() {
  return (
    <span
      className="highlight-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "'Bebas Neue', sans-serif",
        letterSpacing: "0.04em",
        fontSize: "11px",
        color: COLORS.paper,
        background: COLORS.vermillion,
        padding: "2px 8px",
        borderRadius: "2px",
      }}
    >
      <Flame size={11} /> In your list
    </span>
  );
}

// Bottom-right toast notification, used to surface "N news items about your list" alerts.
export function Toast({ children, onClose, tone = "cobalt" }) {
  const bg = tone === "vermillion" ? COLORS.vermillion : COLORS.cobalt;
  return (
    <div
      className="slide-in-right"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 1000,
        maxWidth: 320,
        background: bg,
        color: COLORS.paper,
        border: `3px solid ${COLORS.ink}`,
        borderRadius: "2px",
        boxShadow: `6px 6px 0 ${COLORS.ink}`,
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <Flame size={18} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>{children}</div>
      <button
        onClick={onClose}
        className="press-btn"
        aria-label="Dismiss"
        style={{ background: "transparent", border: "none", color: COLORS.paper, cursor: "pointer", padding: 0, flexShrink: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
