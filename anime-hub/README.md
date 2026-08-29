# RoninDeck — personal anime/manga hub

A small Next.js site for personal use:

- **Discover** — live search/trending anime & manga via AniList's public API
- **My List** — pulls your *real* AniList list by username (read-only mirror; edit on AniList itself, this just displays it here)
- **Community** — live discussion threads from the AniList forum, fetched via the same public AniList API used elsewhere
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
- **Community:** the forum feed is a single query in `pages/index.js` (`THREADS_QUERY`) — you can filter it to a specific AniList media/genre using AniList's `threads` query args if you want it narrower than "all recent forum activity."

## Community tab uses AniList's own forum

Earlier versions of this project pulled Community content from Reddit, but Reddit
closed self-service API app registration in late 2025 under its "Responsible
Builder Policy" — new developers can no longer create an API app without manual
approval, and the old public `.json` endpoints are blocked too. Rather than wait
on that, Community now pulls **live discussion threads straight from AniList's own
forum** via the same public, keyless GraphQL API already used by Discover/List —
no setup, no approval process, no risk of it breaking again.

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

## Why a server route for News but not Community?

News sites' RSS feeds don't allow cross-origin browser requests (CORS), so `pages/api/news.js` fetches them server-side and hands back clean JSON. Community doesn't need this — AniList's GraphQL API already allows direct browser requests, same as Discover and My List.

## Notes

- Styling is inline (no Tailwind/CSS framework) to keep the project dependency-free — feel free to swap in Tailwind if you want to extend the design system.
- No login/auth system — this is built for a single personal user, not multi-user hosting.
