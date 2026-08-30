// pages/api/imdb-rating.js
//
// Rating lookup pipeline:
//   1. OMDb exact title match (t=)
//   2. OMDb fuzzy search (s=), picks best match by year if provided
//   3. OMDb again with season/part/cour suffixes stripped from the title
//   4. TMDB fallback — used when OMDb has no entry for the title at all
//      (common for newer/ongoing anime that OMDb hasn't synced yet)
//
// Response shape is always: { found: boolean, rating, votes, source, url }
// `source` is "imdb" or "tmdb" so the frontend can label the badge correctly —
// a TMDB rating is NOT an IMDb rating and shouldn't be presented as one.

const OMDB_KEY = process.env.OMDB_API_KEY;
const TMDB_KEY = process.env.TMDB_API_KEY;

// Strips common season/part/cour markers so "Show Season 4" -> "Show"
function stripSeasonSuffix(title) {
  return title
    .replace(/[:\-–]?\s*(season|part|cour)\s*\d+.*$/i, '')
    .replace(/\s+\d+(st|nd|rd|th)\s+season.*$/i, '')
    .trim();
}

async function omdbExact(title, year) {
  const params = new URLSearchParams({ apikey: OMDB_KEY, t: title, type: 'series' });
  if (year) params.set('y', year);
  const res = await fetch(`https://www.omdbapi.com/?${params}`);
  const data = await res.json();
  return data.Response === 'True' ? data : null;
}

async function omdbSearch(title, year) {
  const params = new URLSearchParams({ apikey: OMDB_KEY, s: title, type: 'series' });
  const res = await fetch(`https://www.omdbapi.com/?${params}`);
  const data = await res.json();
  if (data.Response !== 'True' || !data.Search?.length) return null;

  // Prefer a result matching the given year, otherwise take the first hit
  const match = year
    ? data.Search.find((r) => r.Year?.includes(String(year))) || data.Search[0]
    : data.Search[0];

  return omdbExact(match.Title, match.Year?.slice(0, 4));
}

async function tmdbFallback(title, year) {
  if (!TMDB_KEY) return null;

  const searchParams = new URLSearchParams({ api_key: TMDB_KEY, query: title });
  if (year) searchParams.set('first_air_date_year', year);

  const searchRes = await fetch(`https://api.themoviedb.org/3/search/tv?${searchParams}`);
  const searchData = await searchRes.json();
  const best = searchData.results?.[0];
  if (!best) return null;

  const detailRes = await fetch(
    `https://api.themoviedb.org/3/tv/${best.id}?api_key=${TMDB_KEY}&append_to_response=external_ids`
  );
  const detail = await detailRes.json();

  return {
    found: true,
    rating: best.vote_average?.toFixed(1) ?? null,
    votes: best.vote_count ?? null,
    source: 'tmdb',
    imdbId: detail.external_ids?.imdb_id ?? null,
    url: detail.external_ids?.imdb_id
      ? `https://www.imdb.com/title/${detail.external_ids.imdb_id}/`
      : `https://www.themoviedb.org/tv/${best.id}`,
  };
}

export default async function handler(req, res) {
  const { title, year } = req.query;

  if (!title) {
    return res.status(400).json({ found: false, error: 'Missing title parameter' });
  }
  if (!OMDB_KEY) {
    return res.status(500).json({ found: false, error: 'OMDB_API_KEY not configured' });
  }

  try {
    // 1. Exact match
    let data = await omdbExact(title, year);

    // 2. Fuzzy search
    if (!data) data = await omdbSearch(title, year);

    // 3. Strip season/part suffix and retry both exact + fuzzy
    if (!data) {
      const base = stripSeasonSuffix(title);
      if (base !== title) {
        data = (await omdbExact(base, year)) || (await omdbSearch(base, year));
      }
    }

    if (data) {
      return res.status(200).json({
        found: true,
        rating: data.imdbRating !== 'N/A' ? data.imdbRating : null,
        votes: data.imdbVotes !== 'N/A' ? data.imdbVotes : null,
        source: 'imdb',
        url: `https://www.imdb.com/title/${data.imdbID}/`,
      });
    }

    // 4. TMDB fallback — only reached if OMDb has no matching entry at all
    const tmdbResult = await tmdbFallback(title, year);
    if (tmdbResult) {
      return res.status(200).json(tmdbResult);
    }

    return res.status(200).json({ found: false });
  } catch (err) {
    console.error('Rating lookup failed:', err);
    return res.status(500).json({ found: false, error: 'Lookup failed' });
  }
}
