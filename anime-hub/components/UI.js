import { Plus, Check, Star } from "lucide-react";

export const COLORS = {
  ink: "#16141C",
  paper: "#F2EEE3",
  cobalt: "#2F3FBF",
  vermillion: "#E14A2E",
  muted: "#8B8578",
  border: "#C9C4B4",
};

export function Panel({ children, style }) {
  return (
    <div
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

export function MediaCard({ item, onAdd, added }) {
  const title = item.title.english || item.title.romaji;
  return (
    <Panel style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
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
