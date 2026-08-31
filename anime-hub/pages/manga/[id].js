import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, Star, ExternalLink } from "lucide-react";
import { Panel, Badge, COLORS, ProgressEditor } from "../../components/UI";

const ANILIST_URL = "https://graphql.anilist.co";

const MEDIA_QUERY = `
query ($id: Int) {
  Media(id: $id, type: MANGA) {
    id
    title { romaji english native }
    coverImage { extraLarge }
    description(asHtml: false)
    genres
    averageScore
    chapters
    volumes
    status
    startDate { year }
    staff(perPage: 1) { edges { node { name { full } role: id } } }
    siteUrl
    relations {
      edges {
        relationType
        node { id type title { romaji english } coverImage { large } }
      }
    }
  }
}`;

async function anilist(query, variables) {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || "AniList error");
  return json.data;
}

export default function MangaDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    anilist(MEDIA_QUERY, { id: Number(id) })
      .then((data) => setMedia(data.Media))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: COLORS.muted, fontFamily: "'Inter', sans-serif" }}>
        Loading...
      </div>
    );
  }

  if (error || !media) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "'Inter', sans-serif" }}>
        <p style={{ color: COLORS.muted }}>{error || "Not found."}</p>
        <Link href="/" style={{ color: COLORS.cobalt }}>← Back to RoninDeck</Link>
      </div>
    );
  }

  const title = media.title.english || media.title.romaji;

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 40 }}>
      <div className="fade-in" style={{ padding: "16px 24px", borderBottom: `4px solid ${COLORS.ink}`, background: COLORS.ink }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: COLORS.paper, fontFamily: "'Inter', sans-serif", fontSize: 13, textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back to RoninDeck
          </Link>
        </div>
      </div>

      <div className="tab-content" style={{ maxWidth: 1000, margin: "24px auto", padding: "0 24px", display: "flex", gap: 24, flexWrap: "wrap" }}>
        <img
          src={media.coverImage.extraLarge}
          alt={title}
          style={{ width: 220, borderRadius: 2, border: `3px solid ${COLORS.ink}`, boxShadow: `6px 6px 0 ${COLORS.ink}`, flexShrink: 0 }}
        />

        <div style={{ flex: 1, minWidth: 260 }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, margin: "0 0 6px", color: COLORS.ink }}>{title}</h1>
          {media.title.native && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: COLORS.muted, margin: "0 0 12px" }}>{media.title.native}</p>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
            {media.averageScore && (
              <Panel style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                <Star size={14} fill={COLORS.vermillion} stroke={COLORS.vermillion} />
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15 }}>{media.averageScore}<span style={{ fontSize: 11, color: COLORS.muted }}>/100 AniList</span></span>
              </Panel>
            )}
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: COLORS.muted }}>
              IMDb doesn't cover manga — this rating is AniList's community score only.
            </span>
          </div>

          <div style={{ margin: "0 0 16px" }}>
            <ProgressEditor mediaId={media.id} maxProgress={media.chapters} />
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {media.genres?.map((g) => (
              <span key={g} style={{ fontSize: 11, fontFamily: "'Inter', sans-serif", color: COLORS.muted, border: `1px solid ${COLORS.border}`, padding: "2px 8px", borderRadius: 10 }}>{g}</span>
            ))}
          </div>

          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, lineHeight: 1.6, color: "#3A362E", marginBottom: 16 }}>
            {media.description?.replace(/<[^>]+>/g, "") || "No description available."}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 16, fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
            <div><strong>Chapters:</strong> {media.chapters || "Ongoing"}</div>
            <div><strong>Volumes:</strong> {media.volumes || "—"}</div>
            <div><strong>Status:</strong> {media.status?.replace(/_/g, " ") || "—"}</div>
            <div><strong>Started:</strong> {media.startDate?.year || "—"}</div>
          </div>

          <a href={media.siteUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: COLORS.cobalt, textDecoration: "none" }}>
            View on AniList <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {media.relations?.edges?.length > 0 && (
        <div className="tab-content" style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px" }}>
          <Badge color={COLORS.muted}>Related</Badge>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginTop: 10 }}>
            {media.relations.edges.slice(0, 8).map((edge) => {
              const node = edge.node;
              const nTitle = node.title.english || node.title.romaji;
              const href = node.type === "ANIME" ? `/anime/${node.id}` : `/manga/${node.id}`;
              return (
                <Link key={node.id} href={href} style={{ textDecoration: "none" }}>
                  <Panel className="hover-lift fade-in-up" style={{ overflow: "hidden" }}>
                    <img src={node.coverImage.large} alt={nTitle} style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", display: "block", borderBottom: `2px solid ${COLORS.ink}` }} />
                    <div style={{ padding: 8 }}>
                      <p style={{ fontSize: 10, color: COLORS.muted, margin: 0, fontFamily: "'Inter', sans-serif" }}>{edge.relationType.replace(/_/g, " ")}</p>
                      <p style={{ fontSize: 12, margin: "2px 0 0", fontFamily: "'Inter', sans-serif", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nTitle}</p>
                    </div>
                  </Panel>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
