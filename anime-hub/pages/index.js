import { useState, useEffect, useCallback } from "react";
import { Search, LayoutGrid, MessageSquare, Newspaper, ExternalLink, Clock, RefreshCw } from "lucide-react";
import { Panel, Badge, MediaCard, COLORS } from "../components/UI";

const ANILIST_URL = "https://graphql.anilist.co";

const SEARCH_QUERY = `
query ($search: String, $type: MediaType) {
  Page(page: 1, perPage: 12) {
    media(search: $search, type: $type, sort: POPULARITY_DESC) {
      id title { romaji english } coverImage { large } averageScore genres
    }
  }
}`;

const TRENDING_QUERY = `
query ($type: MediaType) {
  Page(page: 1, perPage: 10) {
    media(type: $type, sort: TRENDING_DESC) {
      id title { romaji english } coverImage { large } averageScore genres
    }
  }
}`;

const MY_LIST_QUERY = `
query ($userName: String, $type: MediaType) {
  MediaListCollection(userName: $userName, type: $type) {
    lists {
      name
      entries {
        id
        status
        progress
        score
        media { id title { romaji english } coverImage { large } episodes chapters }
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
  if (!res.ok) throw new Error(`AniList responded ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || "AniList error");
  return json.data;
}

function timeAgo(input) {
  const ms = typeof input === "number" ? input * 1000 : new Date(input).getTime();
  const diff = Date.now() - ms;
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TABS = [
  { id: "discover", label: "Discover", icon: Search },
  { id: "list", label: "My List", icon: LayoutGrid },
  { id: "community", label: "Community", icon: MessageSquare },
  { id: "news", label: "News", icon: Newspaper },
];

export default function Home() {
  const [tab, setTab] = useState("discover");

  // Discover
  const [mediaType, setMediaType] = useState("ANIME");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState(null);

  const runDiscover = useCallback(async (type, search) => {
    setDiscoverLoading(true);
    setDiscoverError(null);
    try {
      const data = search.trim()
        ? await anilist(SEARCH_QUERY, { search, type })
        : await anilist(TRENDING_QUERY, { type });
      setResults(data.Page.media);
    } catch (e) {
      setDiscoverError(e.message);
      setResults([]);
    }
    setDiscoverLoading(false);
  }, []);

  useEffect(() => {
    runDiscover(mediaType, "");
  }, [mediaType, runDiscover]);

  const onSubmitSearch = (e) => {
    e.preventDefault();
    runDiscover(mediaType, query);
  };

  // My List (real AniList account data)
  const [username, setUsername] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [listType, setListType] = useState("ANIME");
  const [myLists, setMyLists] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("anilistUsername") : null;
    if (saved) {
      setUsername(saved);
      setUsernameInput(saved);
    }
  }, []);

  const loadMyList = useCallback(async (name, type) => {
    if (!name.trim()) return;
    setListLoading(true);
    setListError(null);
    try {
      const data = await anilist(MY_LIST_QUERY, { userName: name, type });
      setMyLists(data.MediaListCollection.lists || []);
    } catch (e) {
      setListError(e.message.includes("User not found") ? "AniList username not found." : e.message);
      setMyLists([]);
    }
    setListLoading(false);
  }, []);

  useEffect(() => {
    if (username) loadMyList(username, listType);
  }, [username, listType, loadMyList]);

  const saveUsername = (e) => {
    e.preventDefault();
    const name = usernameInput.trim();
    setUsername(name);
    if (typeof window !== "undefined") window.localStorage.setItem("anilistUsername", name);
  };

  // Community (Reddit, via server route)
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState(null);

  const loadThreads = useCallback(async () => {
    setThreadsLoading(true);
    setThreadsError(null);
    try {
      const res = await fetch("/api/threads");
      const json = await res.json();
      setThreads(json.items || []);
      if (json.items?.length === 0 && json.error) setThreadsError(json.error);
    } catch (e) {
      setThreadsError(e.message);
    }
    setThreadsLoading(false);
  }, []);

  // News (RSS, via server route)
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(null);

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const res = await fetch("/api/news");
      const json = await res.json();
      setNews(json.items || []);
      if (json.items?.length === 0 && json.error) setNewsError(json.error);
    } catch (e) {
      setNewsError(e.message);
    }
    setNewsLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "community" && threads.length === 0 && !threadsLoading) loadThreads();
    if (tab === "news" && news.length === 0 && !newsLoading) loadNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const halftone = {
    backgroundImage: `radial-gradient(${COLORS.border} 1px, transparent 1px)`,
    backgroundSize: "10px 10px",
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ ...halftone, borderBottom: `4px solid ${COLORS.ink}`, padding: "20px 24px", background: COLORS.ink }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12, maxWidth: 1100, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "38px", color: COLORS.paper, margin: 0, letterSpacing: "0.03em" }}>
            RONIN<span style={{ color: COLORS.vermillion }}>DECK</span>
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: COLORS.muted, margin: 0 }}>
            Your personal anime & manga hub
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, borderBottom: `3px solid ${COLORS.ink}`, background: COLORS.paper, maxWidth: 1100, margin: "0 auto" }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "12px 8px", fontFamily: "'Bebas Neue', sans-serif", fontSize: "15px", letterSpacing: "0.03em",
                color: active ? COLORS.paper : COLORS.ink, background: active ? COLORS.cobalt : "transparent",
                border: "none", borderRight: `2px solid ${COLORS.ink}`, cursor: "pointer",
              }}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "20px 24px 40px", maxWidth: 1100, margin: "0 auto" }}>
        {tab === "discover" && (
          <div>
            <form onSubmit={onSubmitSearch} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", border: `2px solid ${COLORS.ink}`, borderRadius: "2px", overflow: "hidden" }}>
                {["ANIME", "MANGA"].map((mt) => (
                  <button type="button" key={mt} onClick={() => setMediaType(mt)}
                    style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", padding: "9px 14px", border: "none",
                      background: mediaType === mt ? COLORS.ink : COLORS.paper, color: mediaType === mt ? COLORS.paper : COLORS.ink, cursor: "pointer" }}>
                    {mt === "ANIME" ? "Anime" : "Manga"}
                  </button>
                ))}
              </div>
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${mediaType === "ANIME" ? "anime" : "manga"} titles...`}
                style={{ flex: 1, minWidth: 200, padding: "9px 12px", border: `2px solid ${COLORS.ink}`, borderRadius: "2px", background: COLORS.paper, fontSize: "14px" }} />
              <button type="submit" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", padding: "9px 16px", border: `2px solid ${COLORS.ink}`, background: COLORS.vermillion, color: COLORS.paper, cursor: "pointer", borderRadius: "2px" }}>
                Search
              </button>
            </form>

            <div style={{ marginBottom: 12 }}>
              <Badge color={COLORS.muted}>{query.trim() ? "Results" : "Trending now"}</Badge>
            </div>

            {discoverLoading && <p style={{ color: COLORS.muted }}>Loading from AniList...</p>}
            {discoverError && (
              <Panel style={{ padding: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#5A5648" }}>
                  AniList request failed: {discoverError}. Check your internet connection and reload.
                </p>
              </Panel>
            )}
            {!discoverLoading && !discoverError && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
                {results.map((item) => <MediaCard key={item.id} item={item} />)}
                {results.length === 0 && <p style={{ color: COLORS.muted }}>No results found.</p>}
              </div>
            )}
          </div>
        )}

        {tab === "list" && (
          <div>
            <form onSubmit={saveUsername} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <input value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Your AniList username"
                style={{ flex: 1, minWidth: 200, padding: "9px 12px", border: `2px solid ${COLORS.ink}`, borderRadius: "2px", background: COLORS.paper, fontSize: "14px" }} />
              <button type="submit" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", padding: "9px 16px", border: `2px solid ${COLORS.ink}`, background: COLORS.ink, color: COLORS.paper, cursor: "pointer", borderRadius: "2px" }}>
                Save
              </button>
              <div style={{ display: "flex", border: `2px solid ${COLORS.ink}`, borderRadius: "2px", overflow: "hidden" }}>
                {["ANIME", "MANGA"].map((mt) => (
                  <button type="button" key={mt} onClick={() => setListType(mt)}
                    style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", padding: "9px 14px", border: "none",
                      background: listType === mt ? COLORS.ink : COLORS.paper, color: listType === mt ? COLORS.paper : COLORS.ink, cursor: "pointer" }}>
                    {mt === "ANIME" ? "Anime" : "Manga"}
                  </button>
                ))}
              </div>
              {username && (
                <button type="button" onClick={() => loadMyList(username, listType)} title="Refresh"
                  style={{ border: `2px solid ${COLORS.ink}`, background: COLORS.paper, padding: "9px 10px", cursor: "pointer", borderRadius: "2px" }}>
                  <RefreshCw size={14} />
                </button>
              )}
            </form>

            {!username && (
              <Panel style={{ padding: 24, textAlign: "center" }}>
                <p style={{ color: COLORS.muted, margin: 0 }}>
                  Enter your AniList username above to pull your real watching/reading list. (Your AniList list needs to be public — the default setting.)
                </p>
              </Panel>
            )}
            {username && listLoading && <p style={{ color: COLORS.muted }}>Loading your list from AniList...</p>}
            {username && listError && (
              <Panel style={{ padding: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#5A5648" }}>{listError}</p>
              </Panel>
            )}
            {username && !listLoading && !listError && myLists.map((list) => (
              <div key={list.name} style={{ marginBottom: 20 }}>
                <Badge>{list.name}</Badge>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {list.entries.map((entry) => {
                    const title = entry.media.title.english || entry.media.title.romaji;
                    const total = entry.media.episodes || entry.media.chapters;
                    return (
                      <Panel key={entry.id} style={{ padding: "10px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                        <img src={entry.media.coverImage.large} alt="" style={{ width: 44, height: 62, objectFit: "cover", border: `2px solid ${COLORS.ink}` }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "15px", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.muted }}>
                            Progress: {entry.progress}{total ? ` / ${total}` : ""} {entry.score ? `· Score ${entry.score}` : ""}
                          </p>
                        </div>
                      </Panel>
                    );
                  })}
                  {list.entries.length === 0 && <p style={{ color: COLORS.muted, fontSize: 13 }}>Nothing in this list yet.</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "community" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Panel style={{ padding: "10px 14px", background: COLORS.ink }}>
              <p style={{ fontSize: 12, color: COLORS.muted, margin: 0 }}>
                Live from r/anime + r/manga, fetched server-side so it always loads.
              </p>
            </Panel>
            {threadsLoading && <p style={{ color: COLORS.muted }}>Loading threads...</p>}
            {threadsError && (
              <Panel style={{ padding: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#5A5648" }}>Couldn't reach Reddit right now: {threadsError}</p>
              </Panel>
            )}
            {threads.map((t) => (
              <a key={t.id} href={t.link} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <Panel style={{ padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.cobalt, color: COLORS.paper, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, flexShrink: 0 }}>
                    r/{t.sub.slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{t.title}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.muted }}>r/{t.sub} · {t.replies} comments · {timeAgo(t.createdUtc)}</p>
                  </div>
                  <ExternalLink size={14} color={COLORS.muted} />
                </Panel>
              </a>
            ))}
          </div>
        )}

        {tab === "news" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Panel style={{ padding: "10px 14px", background: COLORS.ink }}>
              <p style={{ fontSize: 12, color: COLORS.muted, margin: 0 }}>
                Headlines aggregated from ANN, MyAnimeList and Crunchyroll News, fetched server-side. Add more feeds in pages/api/news.js.
              </p>
            </Panel>
            {newsLoading && <p style={{ color: COLORS.muted }}>Loading headlines...</p>}
            {newsError && (
              <Panel style={{ padding: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#5A5648" }}>Couldn't reach one or more feeds: {newsError}</p>
              </Panel>
            )}
            {news.map((n, i) => (
              <a key={`${n.tag}-${i}`} href={n.link} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <Panel style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Badge>{n.tag}</Badge>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: COLORS.muted }}>
                      <Clock size={11} /> {n.pubDate ? timeAgo(n.pubDate) : ""}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 19, margin: 0 }}>{n.title}</h3>
                </Panel>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
