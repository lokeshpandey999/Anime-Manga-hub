// Server-side route: looks up an IMDb rating by title via OMDb.
//
// SETUP (free, ~1 minute):
// 1. Go to https://www.omdbapi.com/apikey.aspx, choose the free tier, submit
//    your email. You'll get a key emailed to you almost instantly.
// 2. In your Vercel project: Settings -> Environment Variables, add:
//    OMDB_API_KEY = <the key from the email>
// 3. Redeploy.
//
// Without this env var set, this route just returns { found: false } and the
// detail page quietly skips showing a rating — nothing breaks.
//
// Note: OMDb only knows about titles that exist on IMDb as a movie/TV show.
// Manga has no IMDb presence at all, and plenty of niche or very recent anime
// won't have a match either — that's expected, not a bug.

export default async function handler(req, res) {
  const { OMDB_API_KEY } = process.env;
  const { title } = req.query;

  if (!OMDB_API_KEY) {
    return res.status(200).json({ found: false, reason: "OMDB_API_KEY not configured" });
  }
  if (!title) {
    return res.status(400).json({ found: false, reason: "Missing title" });
  }

  try {
    const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}&type=series`;
    const r = await fetch(url);
    const json = await r.json();

    if (json.Response === "False" || !json.imdbRating || json.imdbRating === "N/A") {
      // Retry once as a movie, in case it's a film rather than a series.
      const movieUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}&type=movie`;
      const r2 = await fetch(movieUrl);
      const json2 = await r2.json();
      if (json2.Response === "False" || !json2.imdbRating || json2.imdbRating === "N/A") {
        return res.status(200).json({ found: false });
      }
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
      return res.status(200).json({
        found: true,
        rating: json2.imdbRating,
        votes: json2.imdbVotes,
        imdbId: json2.imdbID,
      });
    }

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    res.status(200).json({
      found: true,
      rating: json.imdbRating,
      votes: json.imdbVotes,
      imdbId: json.imdbID,
    });
  } catch (e) {
    res.status(200).json({ found: false, reason: e.message });
  }
}
