# RoninDeck — personal anime/manga hub

A small Next.js site for personal use:

- **Discover** — live search/trending anime & manga via AniList's public API
- **My List** — pulls your *real* AniList list by username (read-only mirror; edit on AniList itself, this just displays it here)
- **Community** — live MyAnimeList forum discussion threads for top airing anime, via the free Jikan API, fetched server-side
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
- **Community:** edit `TOP_ANIME_COUNT` and `TOPICS_PER_ANIME` in `pages/api/threads.js` to pull from more shows or more threads per show. You can also swap `filter=airing` for `filter=upcoming` or drop the filter for all-time top anime.

## Community tab: real MyAnimeList forum activity

Earlier versions pulled Community content from Reddit, but Reddit closed
self-service API app registration in late 2025 under its "Responsible Builder
Policy" — new developers can no longer create an API app without manual
approval, and the old public `.json` endpoints are blocked too.

Instead, Community now pulls **live discussion threads from MyAnimeList's own
forums** — arguably the most active anime/manga discussion space online — for
whatever anime are currently top of the airing charts. This goes through
[Jikan](https://jikan.moe), a free, keyless, community-maintained API that
mirrors MAL's public data (MAL itself has no official public forum API).
Because Jikan is an unofficial third-party project, treat it as "very
reliable, not contractually guaranteed" — if it's ever down, the Community tab
will show a clear error instead of silently failing, and the rest of the app
(which uses AniList directly) is unaffected.

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

## Why a server route for News and Community, but not Discover/List?

RSS feeds and Jikan don't send the CORS headers needed for direct browser requests, so `pages/api/news.js` and `pages/api/threads.js` fetch them server-side and hand back clean JSON. AniList's GraphQL API (used by Discover and My List) already allows direct browser requests, so those go straight from the client.

## Notes

- Styling is inline (no Tailwind/CSS framework) to keep the project dependency-free — feel free to swap in Tailwind if you want to extend the design system.
- No login/auth system — this is built for a single personal user, not multi-user hosting.
