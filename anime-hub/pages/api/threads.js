// Server-side route: Reddit's public /r/x/hot.json endpoint silently blocks
// most unauthenticated requests coming from cloud servers (Vercel, AWS, etc) —
// it returns an empty "successful" response instead of an error, which is why
// nothing showed up before. The real fix is to authenticate as a real Reddit
// app using the free "client credentials" (app-only) OAuth flow — no user
// login required, just a client id + secret from a free Reddit app.
//
// Setup (one-time, no terminal needed):
//   1. Go to https://www.reddit.com/prefs/apps
//   2. Click "create app" -> choose type "script" -> any name/redirect URL works
//   3. Copy the client id (under the app name) and the "secret"
//   4. In Vercel: Project -> Settings -> Environment Variables, add:
//        REDDIT_CLIENT_ID = <client id>
//        REDDIT_CLIENT_SECRET = <secret>
//   5. Redeploy (Vercel does this automatically on env var save, or hit Redeploy)

const SUBREDDITS = ["anime", "manga"];

// Cached in server memory between requests on the same lambda instance,
// so we're not re-authenticating with Reddit on every page load.
let cachedToken = null;
let tokenExpiry = 0;

async function getRedditToken() {
  const { REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET } = process.env;
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
    throw new Error(
      "Reddit API credentials not set. Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in Vercel's Environment Variables (see comment at top of pages/api/threads.js)."
    );
  }

  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const basicAuth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString("base64");
  const r = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "personal-anime-hub/1.0",
    },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) throw new Error(`Reddit auth failed (${r.status}) — check your client id/secret.`);
  const json = await r.json();
  cachedToken = json.access_token;
  tokenExpiry = Date.now() + (json.expires_in - 60) * 1000; // refresh slightly early
  return cachedToken;
}

export default async function handler(req, res) {
  try {
    const token = await getRedditToken();

    const results = await Promise.allSettled(
      SUBREDDITS.map(async (sub) => {
        const r = await fetch(`https://oauth.reddit.com/r/${sub}/hot?limit=10`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "personal-anime-hub/1.0",
          },
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
      .map((r, i) => (r.status === "rejected" ? { sub: SUBREDDITS[i], reason: r.reason?.message } : null))
      .filter(Boolean);

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.status(200).json({
      items: merged,
      failedSources: failed.map((f) => f.sub),
      // Surface the real reason (e.g. missing env vars) so the UI can show something useful
      error: merged.length === 0 && failed.length ? failed[0].reason : undefined,
    });
  } catch (e) {
    res.status(500).json({ items: [], error: e.message });
  }
}
