// Server-side route: Reddit blocks most unauthenticated browser fetches
// and requires a real User-Agent, which browsers won't let JS set.
// Doing this server-side sidesteps both problems.
const SUBREDDITS = ["anime", "manga"];

export default async function handler(req, res) {
  try {
    const results = await Promise.allSettled(
      SUBREDDITS.map(async (sub) => {
        const r = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=10`, {
          headers: { "User-Agent": "personal-anime-hub/1.0 (by u/anonymous)" },
        });
        if (!r.ok) throw new Error(`r/${sub} responded ${r.status}`);
        const json = await r.json();
        return (json.data.children || [])
          .filter((c) => !c.data.stickied)
          .map((c) => ({
            id: c.data.id,
            title: c.data.title,
            sub,
            replies: c.data.num_comments,
            link: `https://reddit.com${c.data.permalink}`,
            createdUtc: c.data.created_utc,
          }));
      })
    );

    const merged = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value)
      .sort((a, b) => b.createdUtc - a.createdUtc);

    const failed = results
      .map((r, i) => (r.status === "rejected" ? SUBREDDITS[i] : null))
      .filter(Boolean);

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.status(200).json({ items: merged, failedSources: failed });
  } catch (e) {
    res.status(500).json({ items: [], error: e.message });
  }
}
