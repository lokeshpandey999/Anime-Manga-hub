# RoninDeck — personal anime/manga hub

A small Next.js site for personal use:

- **Discover** — live search/trending anime & manga via AniList's public API
- **My List** — pulls your *real* AniList list by username (read-only mirror; edit on AniList itself, this just displays it here)
- **Community** — live threads from r/anime + r/manga, fetched server-side so the browser never blocks it
- **News** — headlines aggregated from Anime News Network, MyAnimeList, and Crunchyroll News RSS feeds, also fetched server-side

It never hosts, streams, or embeds anyone else's copyrighted video/manga pages — it links out to the real sources (Crunchyroll, official manga apps, the original articles). That's what keeps it simple, fast, and not-a-legal-headache for personal use.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Use your AniList list

Go to the "My List" tab and type your AniList username (the one at anilist.co/user/yourname). Your list needs to be public, which is the default — check under AniList Settings → Social if you're not sure.

## Deploy it so it's always up

The easiest free option is Vercel:

```bash
npm install -g vercel
vercel
```

Follow the prompts — it'll give you a live URL in about a minute. Any time you `git push` after connecting a repo, it redeploys automatically.

## Add more sources

- **News:** edit the `FEEDS` array in `pages/api/news.js` — add any RSS feed URL.
- **Community:** edit `SUBREDDITS` in `pages/api/threads.js` — add any subreddit name.

## Community tab requires a free Reddit app (one-time setup)

Reddit silently blocks unauthenticated requests from cloud servers like Vercel (it
returns an empty "success" response instead of an error). The fix is to authenticate
as a real Reddit app using the free "app-only" OAuth flow — no user login, no cost:

1. Go to https://www.reddit.com/prefs/apps
2. Click **create app**, choose type **script**, fill in any name and redirect URL (e.g. `http://localhost`)
3. Copy the **client id** (the string under the app name) and the **secret**
4. In Vercel: **Project → Settings → Environment Variables**, add:
   - `REDDIT_CLIENT_ID` = your client id
   - `REDDIT_CLIENT_SECRET` = your secret
5. Redeploy (Vercel → Deployments → ⋯ → Redeploy)

Until these are set, the Community tab will show the real error message instead of
silently failing.

## AniList-aware news highlighting

If you've entered your AniList username (My List tab), the News tab automatically:
- Flags any headline that mentions a title in your anime/manga list with a red "In your list" badge
- Pins matching headlines to the top
- Shows a small count badge on the News tab itself
- Pops up a one-time toast notification when a fresh batch of headlines contains matches

## What's animated

Card entrances (staggered fade-in), hover "lift" effect on all cards/panels, button
press feedback, tab transitions, a slow-drifting header texture, shimmering loading
skeletons instead of plain "Loading..." text, and a pop-in badge/toast for AniList
matches. All animations respect the OS-level "reduce motion" accessibility setting.

## Why a server route instead of fetching straight from the browser?

Reddit and most news sites don't allow cross-origin browser requests (CORS), and Reddit also requires a real `User-Agent` header that browsers won't let JavaScript set. Routing through `/api/news` and `/api/threads` — which run on the server, not in the visitor's browser — sidesteps both issues entirely. This is also why those two tabs are reliable while a pure client-side version wasn't.

## Notes

- Styling is inline (no Tailwind/CSS framework) to keep the project dependency-free — feel free to swap in Tailwind if you want to extend the design system.
- No login/auth system — this is built for a single personal user, not multi-user hosting.
