// Server-side route: pulls real MyAnimeList forum discussion threads for the
// currently top airing anime, via Jikan — a free, keyless, community-run
// wrapper around MAL's public data (https://jikan.moe). MAL's forums are one
// of the most active anime/manga discussion spaces around, and unlike Reddit,
// this needs no signup, no manual approval, and no risk of getting locked
// down (Jikan has been running as a stable public service for years).
const JIKAN_BASE = "https://api.jikan.moe/v4";
const TOP_ANIME_COUNT = 5;
const TOPICS_PER_ANIME = 6;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  try {
    const topRes = await fetch(`${JIKAN_BASE}/top/anime?filter=airing&limit=${TOP_ANIME_COUNT}`);
    if (!topRes.ok) throw new Error(`Jikan top/anime responded ${topRes.status}`);
    const topJson = await topRes.json();
    const topAnime = topJson.data || [];

    const allTopics = [];
    const failed = [];

    // Sequential with a short pause between calls to stay comfortably under
    // Jikan's public rate limit (roughly 3 requests/second).
    for (const anime of topAnime) {
      try {
        const forumRes = await fetch(`${JIKAN_BASE}/anime/${anime.mal_id}/forum`);
        if (!forumRes.ok) throw new Error(`responded ${forumRes.status}`);
        const forumJson = await forumRes.json();
        const topics = (forumJson.data || []).slice(0, TOPICS_PER_ANIME).map((t) => ({
          id: t.mal_id,
          title: t.title,
          link: t.url,
          replies: t.comments,
          author: t.author_username,
          date: t.date,
          animeTitle: anime.title,
        }));
        allTopics.push(...topics);
      } catch (e) {
        failed.push(anime.title);
      }
      await sleep(400);
    }

    const merged = allTopics.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate");
    res.status(200).json({
      items: merged,
      failedSources: failed,
      error: merged.length === 0 ? "Couldn't load any forum topics right now — Jikan may be temporarily rate-limited or down." : undefined,
    });
  } catch (e) {
    res.status(500).json({ items: [], error: e.message });
  }
}
