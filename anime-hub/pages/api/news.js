// Server-side route: fetches RSS feeds directly (no CORS restriction here,
// since this code runs on your server, not in the browser).
// Add or remove feed URLs freely.
const FEEDS = [
  { url: "https://www.animenewsnetwork.com/all/rss.xml", tag: "ANN" },
  { url: "https://myanimelist.net/rss/news.xml", tag: "MAL" },
  { url: "https://www.crunchyroll.com/newsrss", tag: "Crunchyroll" },
];

function parseRSS(xml, tag) {
  const items = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/g) || [];
  for (const block of itemBlocks) {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    if (title && link) {
      items.push({ tag, title: decodeEntities(title), link: link.trim(), pubDate: pubDate || null });
    }
  }
  return items;
}

function extractTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  if (!match) return null;
  let val = match[1].trim();
  const cdataMatch = val.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (cdataMatch) val = cdataMatch[1].trim();
  return val;
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export default async function handler(req, res) {
  try {
    const results = await Promise.allSettled(
      FEEDS.map(async (feed) => {
        const r = await fetch(feed.url, {
          headers: { "User-Agent": "Mozilla/5.0 (personal anime-hub RSS reader)" },
        });
        if (!r.ok) throw new Error(`${feed.tag} responded ${r.status}`);
        const xml = await r.text();
        return parseRSS(xml, feed.tag).slice(0, 8);
      })
    );

    const merged = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value)
      .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

    const failed = results
      .map((r, i) => (r.status === "rejected" ? FEEDS[i].tag : null))
      .filter(Boolean);

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate");
    res.status(200).json({ items: merged, failedSources: failed });
  } catch (e) {
    res.status(500).json({ items: [], error: e.message });
  }
}
