# Talarama community upgrade: proposed design

Date: 2026-10-19
Status: Proposed for review; product implementation has not started.

## Purpose and success

Turn Talarama into a community for movie fans that also demonstrates a complete, maintainable portfolio project. Preserve its movie diary, reviews, ratings, favorites, watchlist, and Google sign-in. Replace the manually maintained catalog with external movie discovery. Full-movie streaming is outside the product.

The main journey is: discover a movie, save it, log a viewing, choose whether to publish it, and discover other members through their public reviews.

Success means a new member can complete that journey on a phone; existing members retain their records; visitors can browse useful content before signing in; and another developer can run the open-source project from its README. These are acceptance goals, not measured results.

## Confirmed scope and proposed defaults

Confirmed by the owner: community audience, portfolio quality, existing features retained, dynamic movie catalog, no full-movie streaming.

Proposed defaults for this plan:

- Refresh the interface alongside each feature, using a shared visual foundation first.
- Keep the existing application and database architecture; avoid a ground-up rewrite.
- Use TMDB for movie information. Keep Google as the only sign-in provider initially.
- Keep integer ratings from 1 to 5. Allow an unrated diary entry and an empty review.
- Entries are private by default. Publishing is an explicit choice, including for existing entries.
- Launch public profiles and a chronological community feed first; defer follows and a personalized feed.
- Assume existing database records matter. Use backups, previews, and additive migrations.
- Develop and launch as a noncommercial project initially. Check service terms again before monetization.

## Existing application: evidence from the repository

- `package.json`: Next.js 15.3.2, React 19, TypeScript, Prisma 6, PostgreSQL, NextAuth 4, Tailwind 4, DaisyUI, Radix, React Hook Form, and Zod. npm lockfile is present.
- `app/services/movieService.ts`: catalog search and filters query local movies; metadata is not fetched dynamically. Request code disconnects the shared Prisma client after queries.
- `prisma/schema.prisma`: `Movie`, `Genre`, `DiaryEntry`, `LikedBy`, and `WatchedList` already exist. Movies have no TMDB identifier.
- `app/api/movies/[id]/watchlist/route.ts` and `app/diaries/Watchlist.tsx`: the misleadingly named `WatchedList` represents movies to watch, rather than viewing history.
- `app/diaries/_hooks/useDiaryForm.ts`: the submission uses `notes` and `date`; the diary API validates `review` and `watchedDate`. The form and API also differ on optional review text.
- `app/auth/authOptions.ts`: Google sign-in and JWT sessions already exist. Username generation and session refresh need attention before editable public profiles.
- `app/api/movies/[id]/route.ts`: shared movie editing and deletion check sign-in without distinguishing an administrator. Catalog ownership needs an explicit policy.
- `app/movies/[id]/page.tsx`: review queries have no visibility condition, because privacy is not modeled yet.
- `app/diaries/page.tsx`: anonymous access returns a JSON response from a page component; this needs a proper sign-in experience.
- No automated test files were found in the tracked application paths inspected. Runtime, database connectivity, and production configuration have not been verified in this planning session.

## Approach considered

1. **Extend the current app (recommended).** Add a server-side TMDB boundary, evolve the existing schema, and improve each flow. Preserves existing work and demonstrates a realistic migration.
2. **Rewrite the application.** Allows a clean start, but duplicates working features and makes data migration and feature parity harder. No demonstrated need for it.
3. **Update only discovery and styling.** Produces a useful personal app sooner, but does not fulfill the community goal. Use this as the first beta, rather than the final scope.

## Architecture and ownership

Browser -> Next.js server components or route handlers -> feature services -> TMDB or Prisma/PostgreSQL.

- Keep server-rendered public pages. Use client components for interactive forms, search input, spoiler reveal, and optimistic save actions.
- TMDB supplies titles, artwork, descriptions, release details, genres, cast, and directors. Talarama owns identities, favorites, watchlists, diary entries, visibility, moderation, and its own community ratings.
- Use a server-only TMDB read token. Never expose it through a `NEXT_PUBLIC_` variable or accept arbitrary upstream URLs.
- Put TMDB transport and normalization under `app/lib/tmdb/`; keep orchestration in `app/services/`. Reuse the existing Prisma singleton.
- Avoid introducing another backend, authentication provider, database provider, component library, or state-management framework for this upgrade.
- Stabilize the current app, then update dependencies in a separate verified task. Check supported and patched versions when executing; this plan does not pin an unverified future version.

## Movie identity and TMDB integration

Preserve `Movie.id` and all existing foreign keys. Add a nullable unique `tmdbId` and metadata refresh timestamp. Permit missing release year/runtime for upstream titles that have incomplete metadata. Add a backdrop URL and compact cached credits metadata; keep existing director fields readable during the transition.

Use two explicit route forms:

- `/movies/[id]`: existing local movie links continue working.
- `/movies/tmdb/[tmdbId]`: externally discovered movies can be viewed before a local record exists. Mapped local cards prefer this URL through one shared link helper.

Search and browse do not import every returned movie. Viewing a detail page also does not write to the database. On the first signed-in save, favorite, or log action, an import service fetches trusted metadata and creates or reuses a local movie by its unique `tmdbId`. Concurrent imports must return the same local movie.

Browse popular movies and filter by genre/year; search by title with an optional year. Keep these as separate modes because TMDB search and discovery have different capabilities. Persist mode, query, page, filters, and sort in the URL. Use paginated responses, a 300 ms search debounce, and discard stale requests.

Cache shared search results for 5 minutes, discovery for 1 hour, and details for 24 hours as initial application defaults, subject to provider terms. Bound upstream requests with a 5-second timeout. On an upstream failure, show a retry state; previously saved local movies and personal data remain available from local snapshots. Never clear existing metadata because a refresh failed. Label TMDB scores on their own 10-point scale separately from Talarama ratings.

Restrict search/discovery to non-adult results. Missing posters, unknown release dates, missing runtime, and removed upstream titles must have usable fallbacks. Direct imports must enforce the same content rule.

### Migrating the existing catalog

1. Export a backup and capture row/relationship counts in a staging copy.
2. Add fields without deleting existing rows or changing IDs.
3. Generate a matching report with title/year candidates, local IDs, and suggested TMDB IDs; no writes by default.
4. Review ambiguous matches and duplicate mappings manually. A title/year match is a suggestion, not proof.
5. Apply explicit mappings transactionally with an audit file. Conflicting mappings fail with a clear report; no automatic row merging.
6. Retain unmatched local movies and their existing URLs. They remain usable in the diary.

The existing unique title/year constraint must not determine external identity. Replace it with unique `tmdbId` only after the matching preview and import tests demonstrate that same-title releases cannot be conflated. Old local records remain intact. Recovery uses the pre-migration backup and mapping audit, never a production database reset.

## Diary, reviews, ratings, and watchlist

Retain one `DiaryEntry` per viewing. A public review is a public diary entry with review text; do not create a second review table that duplicates that text.

- One shared input contract: `movieId`, `watchedDate` (`YYYY-MM-DD`), `rating` (null or integer 1-5), `review` (trimmed string, 0-2000 characters), `isRewatch`, `containsSpoilers`, `visibility` (`PRIVATE` or `PUBLIC`), and `clientRequestId` for create retries.
- Add visibility, rewatch, spoiler, moderation, and idempotency fields; make rating nullable. Preserve old rating values without conversion. Review text can remain a non-null string with an empty default.
- Preserve multiple viewings, including the same movie on the same date. A unique nullable `(userId, clientRequestId)` prevents duplicate submission retries without preventing legitimate rewatches.
- Treat watched date as a calendar date, not a time of day. Store new values at UTC midnight in the existing DateTime column and serialize dates without viewer-timezone shifts. Validate dates and future dates against the signed-in user's saved IANA timezone, initialized from their browser with UTC fallback.
- Preview legacy timestamp-to-calendar-date interpretation before normalization. Preserve original timestamps in the export and flag ambiguous records for review.
- Editing or deleting an entry requires ownership. Private entries never appear in public endpoints, public statistics, or shared caches.
- After a successful log, remove that movie from the member's watchlist in the same transaction. This behavior must be visible in the UI. Deleting a log does not recreate a watchlist item.
- Rename the Prisma model to `WatchlistEntry` while mapping to the existing physical table with `@@map`; preserve every row. Derive watched history from diary entries. Keep favorites independent.
- Replace toggle-based save requests with idempotent add/remove operations, so retries cannot reverse the user's intent.

The private diary offers month grouping, movie search, year and rating filters, edit/delete actions, and clear log-versus-distinct-movie counts. Profile statistics count distinct public movies and public logs separately.

For community ratings, count only the newest public, non-hidden, rated entry per user/movie, ordered by creation time and ID. A rewatch does not give one member extra weight. Unrated/private/hidden entries do not contribute; display both average and member count. A member with no qualifying entry contributes nothing.

## Identity, profiles, and privacy

- Add `bio` (maximum 300 characters), `timeZone`, `profilePublished` (false by default), `showFavorites` (false by default), and a member/admin role to User.
- New usernames are normalized lowercase, 3-20 characters, matching `[a-z0-9_]+`; reserve `admin`, `api`, `me`, `settings`, and `support`. Database-backed uniqueness must survive concurrent sign-ups.
- Preview existing username normalization and collisions before applying it. Preserve user IDs and Google account links. Resolve collisions deterministically with a suffix and record changes in the migration report.
- Stop exposing an email prefix as a new user's public identity. Use a neutral temporary unique handle until the member chooses one. Keep existing usernames visible to their owner for review before profile publication.
- `/members/[username]` shows only a published profile: display name, handle, bio, avatar with fallback, and explicitly public entries. Favorite films appear only if the member enables them; watchlists stay private in this release.
- `/settings/profile` lets the member edit their profile, timezone, and publication controls. Public serializers must select safe fields explicitly and never return emails, account tokens, or private statistics.
- Profile publication is a master switch: an unpublished profile's entries are excluded from community surfaces even when an entry is marked public. Explain this in the entry form.
- Profile unpublishing, making an entry private, and deleting an entry remove it from public pages and aggregates immediately. Do not statically cache community/private queries in the first release; metadata caching stays separate.
- Update session display data after profile changes. Authorize by the session user ID, never by a client-supplied user ID or handle.

## Community release

Add `/community` with a chronological feed of published, non-hidden public diary activity and `/reviews/[id]` as a shareable page for an entry with review text. Movie detail pages display public reviews, spoiler warnings, and the local community rating independently of TMDB's score.

Use cursor pagination of 20 entries with a stable `(createdAt, id)` order. Do not expose other members' private viewing dates via counts or activity. Feed snippets respect spoiler flags; revealing a spoiler is an explicit action. Empty feeds point visitors to discovery and invite them to publish their first review; sample development records must be clearly labeled and must not impersonate real users.

Before opening community publication to the public, include:

- Signed-in members can report a public review for spam, abuse, or another reason with up to 500 characters of explanation. One report per reporter/entry.
- Administrators can list reports, hide/unhide a reported entry, and resolve a report with an audit record. Hiding affects public surfaces immediately; it does not delete the owner's diary.
- Member accounts cannot edit shared catalog metadata, invoke moderation, or grant themselves roles. Retire the old manual movie write endpoints from ordinary use; unmatched legacy records remain readable.
- Use durable, shared mutation limits: 30 diary writes and 60 favorite/watchlist writes per member per 10 minutes; 5 reports per member per 10 minutes. Store atomic buckets in PostgreSQL, expire old buckets, and return 429 with a retry interval. Apply hosting-level request limits to public discovery during deployment rather than an in-memory production limiter.

Follows, personalized feeds, review likes, comments, notifications, direct messages, custom lists, half-star ratings, AI recommendations, television tracking, trailers, and watch-provider integrations are subsequent product decisions. They are not dependencies of this release.

## Visual and interaction direction

Proposed direction: a poster-led movie journal with strong typography, readable review text, restrained color, and consistent light/dark themes. Keep navigation focused on Discover, Community, and My Diary, with profile/settings in the account menu. Preserve existing routes where practical.

Start with shared colors, type sizes, spacing, buttons, inputs, cards, dialogs, and feedback states using the existing Tailwind/DaisyUI foundation. Consolidate overlapping controls only as their flows are upgraded. Then apply the same system to discovery, movie details, logging, diary, profiles, and community. No screen should imply a full-movie playback feature.

Keyboard access, visible focus, labeled rating controls, dialog focus management, reduced motion, readable contrast, and persistent action labels on touch screens are acceptance requirements. Define skeleton, empty, signed-out, missing-image, validation, and network-error states as part of each screen.

## Delivery and verification

Ship in six phases: foundation, catalog migration/integration, discovery interface, diary, profiles/community, and launch. The catalog/diary beta can be tested with invited members before community publication opens.

- Use meaningful unit and integration tests for normalization, identity, idempotency, validation, permissions, privacy, rating rules, and pagination.
- Add browser tests for a visitor browsing, a member saving/logging/editing, private data exclusion, profile publication, spoilers, and moderation.
- Exercise real Prisma migrations against a disposable PostgreSQL database seeded with representative legacy records. Mock TMDB in automated tests; reserve a configured real-token smoke check for manual verification.
- Establish repeatable `lint`, `typecheck`, `test`, `test:integration`, `test:e2e`, and `build` commands. Require those checks before release.
- Verify layout at 360 px, 768 px, and 1440 px; test keyboard navigation and reduced motion. Test slow and failed upstream responses.
- Preview deployments use a separate database and separate Google callback configuration. Test migration restore before production migration.
- Release documentation covers setup, environment variables, architecture, data ownership, migrations, TMDB attribution, contribution workflow, and screenshots. A source-code license applies to code, not movie artwork or upstream data. Propose MIT for the owner's review before adding the license.

## Required configuration at execution time

Provide a development PostgreSQL connection, a separate disposable test database, Google OAuth credentials, NextAuth secret/base URL, a server-only TMDB read token, and the intended deployment origin. None is required to review this plan. Do not commit real credentials or production exports. No existing deployment, database contents, or budget was assumed to have been verified.

## Reference documentation

- TMDB search/detail workflow: https://developer.themoviedb.org/docs/search-and-query-for-details
- TMDB discovery: https://developer.themoviedb.org/reference/discover-movie
- TMDB authentication: https://developer.themoviedb.org/docs/authentication-application
- TMDB images: https://developer.themoviedb.org/docs/image-basics
- TMDB usage and attribution: https://developer.themoviedb.org/docs/faq

## Review points

The recommended product and technical choices are explicit so they can be reviewed together: incremental upgrade; redesign alongside features; private-by-default entries; public profile opt-in; integer 1-5 ratings; optional review/rating; automatic watchlist removal on logging; and a public feed before follows. The owner can change these defaults before implementation tasks are finalized.
