# RoninDeck — personal anime/manga hub

A small Next.js site for personal use:

- **Discover** — live search/trending anime & manga via AniList's public API. Click any card to open a full detail page.
- **Title detail pages** (`/anime/[id]`, `/manga/[id]`) — synopsis, genres, studio, status, related titles, and a link to AniList. Anime pages also show an **IMDb rating** pulled via the free OMDb API (manga has no IMDb presence, so manga pages just show AniList's score).
- **My List** — pulls your *real* AniList list by username (read-only mirror; edit on AniList itself, this just displays it here)
- **Community** — live discussion threads from AniList's own public forum, sorted by activity.
- **News** — headlines aggregated from Anime News Network, MyAnimeList, and Crunchyroll News RSS feeds, fetched server-side. Any headline that mentions a title from your My List gets a "★ In your list" highlight and floats to the top, and the News tab shows a small badge with how many matches are currently live.

It never hosts, streams, or embeds anyone else's copyrighted video/manga pages — it links out to the real sources (Crunchyroll, official manga apps, the original articles). That's what keeps it simple, fast, and not-a-legal-headache for personal use.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Use your AniList list

Go to the "My List" tab and type your AniList username (the one at anilist.co/user/yourname). Your list needs to be public, which is the default — check under AniList Settings → Social if you're not sure.

## Get IMDb ratings on anime detail pages (optional)

1. Go to https://www.omdbapi.com/apikey.aspx, pick the free tier, submit your email — a key arrives almost instantly.
2. Locally: create a `.env.local` file in the project root with `OMDB_API_KEY=your_key_here`.
3. On Vercel: Settings → Environment Variables, add `OMDB_API_KEY` with the same value, then redeploy.

Without this key, anime pages just skip the IMDb badge — nothing breaks. Free tier allows 1,000 lookups/day, which is far more than a personal site needs. Matching is by title, so very niche or brand-new anime may not have an IMDb entry at all — that's expected, not a bug.

## Deploy it so it's always up

The easiest free option is Vercel:

```bash
npm install -g vercel
vercel
```

Follow the prompts — it'll give you a live URL in about a minute. Any time you `git push` after connecting a repo, it redeploys automatically.

**Important:** in Vercel's project settings, set **Framework Preset** to "Next.js" and **Root Directory** to wherever `package.json` actually lives in your repo (if you uploaded the whole project folder rather than just its contents, this is usually the folder's name). Otherwise the build looks for a static `public` folder and 404s.

## Add more sources

- **News:** edit the `FEEDS` array in `pages/api/news.js` — add any RSS feed URL.
- **Community:** edit the `THREADS_QUERY` in `pages/index.js` if you want to sort differently (e.g. `CREATED_AT_DESC` for newest instead of most active) — see AniList's API docs for other thread filters.

## Animations

The UI uses lightweight CSS-only animations (no extra dependencies): cards fade/slide in with a slight stagger, tab switches animate in, hover states lift and tilt panels slightly (matching the comic-panel visual style), the News tab badge pops in, and loading states use a shimmering skeleton instead of plain "Loading..." text. All of this lives in `styles/globals.css` under the `/* ---- Animations ---- */` section if you want to tweak timing or add more.

## Notes

- Styling is inline (no Tailwind/CSS framework) to keep the project dependency-free — feel free to swap in Tailwind if you want to extend the design system.
- No login/auth system — this is built for a single personal user, not multi-user hosting.
