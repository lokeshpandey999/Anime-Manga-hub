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

## Why a server route instead of fetching straight from the browser?

Reddit and most news sites don't allow cross-origin browser requests (CORS), and Reddit also requires a real `User-Agent` header that browsers won't let JavaScript set. Routing through `/api/news` and `/api/threads` — which run on the server, not in the visitor's browser — sidesteps both issues entirely. This is also why those two tabs are reliable while a pure client-side version wasn't.

## Notes

- Styling is inline (no Tailwind/CSS framework) to keep the project dependency-free — feel free to swap in Tailwind if you want to extend the design system.
- No login/auth system — this is built for a single personal user, not multi-user hosting.
