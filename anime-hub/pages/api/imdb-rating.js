// Server-side route: looks up an IMDb rating by title via OMDb.
//
// SETUP (free, ~1 minute):
// 1. Go to https://www.omdbapi.com/apikey.aspx, choose the free tier, submit
//    your email. You'll get a key emailed to you almost instantly.
// 2. In your Vercel project: Settings -> Environment Variables, add:
//    OMDB_API_KEY = <the key from the email>
//    IMPORTANT: check the "Production" box, not just "Development" —
//    otherwise your live deployed site never sees the key.
// 3. Redeploy.
//
// Without this env var set, this route just returns { found: false } and the
// detail page quietly skips showing a rating — nothing breaks.
//
// Note: OMDb only knows about titles that exist on IMDb as a movie/TV show.
// Manga has no IMDb presence at all, and plenty of niche or very recent anime
// won't have a match either — that's expected, not a bug.
//
// MATCHING STRATEGY: OMDb's exact-title lookup (t=) is strict and often misses
// long titles with colons/dashes (e.g. "Show: Subtitle - Part Name"), even when
// the entry genuinely exists. So this tries, in order:
//   1. Exact title lookup (t=), fastest when it works
//   2. Fuzzy search (s=) which returns multiple candidates, picks the best
//      match by closest release year, then fetches full details for that
//      specific IMDb ID (i=) to get the actual rating.

const OMDB_BASE = "https://www.omdbapi.com/";

async function exactLookup(apiKey, title, type) {
  const url = `${OMDB_BASE}?apikey=${apiKey}&t=${encodeURIComponent(title)}&type=${type}`;
  const r = await fetch(url);
  const json = await r.json();
  if (json.Response === "False" || !json.imdbRating || json.imdbRating === "N/A") return null;
  return json;
}

async function fuzzySearchThenFetch(apiKey, title, year) {
  const url = `${OMDB_BASE}?apikey=${apiKey}&s=${encodeURIComponent(title)}`;
  const r = await fetch(url);
  const json = await r.json();
  if (json.Response === "False" || !json.Search?.length) return null;

  // Pick the closest year match if we have one to compare against, otherwise
  // just take the top result (OMDb already sorts by relevance).
  let best = json.Search[0];
  if (year) {
    let bestDiff = Infinity;
    for (const candidate of json.Search) {
      const cYear = parseInt(candidate.Year, 10);
      if (!cYear) continue;
      const diff = Math.abs(cYear - year);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = candidate;
      }
    }
  }

  const detailUrl = `${OMDB_BASE}?apikey=${apiKey}&i=${best.imdbID}`;
  const r2 = await fetch(detailUrl);
  const detail = await r2.json();
  if (detail.Response === "False" || !detail.imdbRating || detail.imdbRating === "N/A") return null;
  return detail;
}

export default async function handler(req, res) {
  const { OMDB_API_KEY } = process.env;
  const { title, year } = req.query;

  if (!OMDB_API_KEY) {
    return res.status(200).json({ found: false, reason: "OMDB_API_KEY not configured" });
  }
  if (!title) {
    return res.status(400).json({ found: false, reason: "Missing title" });
  }

  const parsedYear = year ? parseInt(year, 10) : null;

  try {
    const result =
      (await exactLookup(OMDB_API_KEY, title, "series")) ||
      (await exactLookup(OMDB_API_KEY, title, "movie")) ||
      (await fuzzySearchThenFetch(OMDB_API_KEY, title, parsedYear));

    if (!result) {
      return res.status(200).json({ found: false });
    }

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    res.status(200).json({
      found: true,
      rating: result.imdbRating,
      votes: result.imdbVotes,
      imdbId: result.imdbID,
      matchedTitle: result.Title,
    });
  } catch (e) {
    res.status(200).json({ found: false, reason: e.message });
  }
}
