# Talarama Community Upgrade Roadmap

Date: 2026-10-19
Status: Proposed release plan for review. This is a roadmap for the complete upgrade, not an instruction to start modifying the application.

**Goal:** Build a dynamic movie discovery, diary, review, and community app suitable for public use and a portfolio.

**Architecture:** Extend the current Next.js/React application, Google sign-in, and Prisma/PostgreSQL database. A server-only TMDB integration supplies movie information; Talarama retains user-created content and social identity. Keep existing movie IDs and relationships through additive migrations.

**Tech stack:** Existing Next.js, React, TypeScript, NextAuth, Prisma/PostgreSQL, Tailwind/DaisyUI, React Hook Form, Zod; proposed Vitest for logic/integration tests and Playwright for browser journeys.

**Design:** [Proposed community design](../specs/2026-10-19-talarama-community-design.md).

**Execution structure:** Review the design first. Then prepare executable task plans for the four subprojects below, one at a time, so later implementation decisions reflect what earlier releases taught us. Each execution plan specifies interfaces, migrations, exact assertions, commands, and commit boundaries. Do not attempt all phases as one large change.

## Scope and constraints

- Preserve Google accounts, local movie IDs, reviews, diary entries, favorites, and watchlists.
- No production database reset, automatic ambiguous catalog merges, or automatic publication of existing entries.
- Keep metadata, private member state, and public community queries separate.
- No new streaming subsystem, backend rewrite, or auth/database provider migration.
- Keep new dependency choices minimal; validate compatibility during the foundation phase.
- A public launch includes reporting/moderation and privacy verification, not just a feed UI.
- Dates and ratings retain the explicit semantics in the design; no silent rating-scale conversion.

## Roadmap at a glance

| Phase | Deliverable | Depends on | Release gate |
| --- | --- | --- | --- |
| 0 | Working development baseline and shared UI foundations | Development configuration | Reproducible install, sign-in, and existing core flows |
| 1 | TMDB integration and safe catalog migration | 0 | Real catalog, preserved local relationships, concurrent import safety |
| 2 | Refreshed discovery and movie pages | 1 | Visitor finds a non-seeded movie and member saves it |
| 3 | Reliable diary and personal library | 1-2 | Save/log/edit/delete/rewatch flows work end to end |
| 4 | Public profiles, reviews, community feed, and moderation | 3 | Explicit publication and public/private boundaries verified |
| 5 | Public deployment and open-source portfolio presentation | 0-4 | Release checks, migration rehearsal, documentation, screenshots |

**First beta:** End of phase 3. Invite a few testers to exercise discovery and their private diaries.

**Community v1:** End of phase 5. Open publication after profiles, privacy, reporting, and deployment checks pass.

## Subproject A: foundation and dynamic catalog (phases 0-2)

### Phase 0: establish the baseline

Work areas: `package.json`, `package-lock.json`, `next.config.ts`, `eslint.config.mjs`, `prisma/client.ts`, `app/auth/authOptions.ts`, `app/services/movieService.ts`, `app/validationSchemas.ts`, `app/diaries/_hooks/useDiaryForm.ts`, `app/types/diary.ts`, `app/diaries/page.tsx`, `app/components/MovieCarousel.tsx`.

- [ ] Create an isolated development checkout before product implementation and inventory current baseline behavior.
- [ ] Document environment variables with placeholder-only `.env.example`; allow that example through `.gitignore` without allowing real environment files.
- [ ] Run a reproducible npm install; generate Prisma; run lint, type checking, and build. Record and fix baseline failures before adding features.
- [ ] Replace the existing lint command with the supported direct ESLint invocation; add a type-check command and focused test setup. Add integration/browser test setup with the first tests that need them.
- [ ] Use a disposable PostgreSQL database to verify that historical migrations produce the checked-in schema. If there is drift, write an explicit migration strategy rather than resetting a populated database.
- [ ] Establish a successful Google sign-in flow and preserve existing account associations.
- [ ] Fix the existing diary submission field mismatch and shared validation inconsistency without changing saved records. Correct anonymous diary access and make an empty carousel safe.
- [ ] Remove per-request disconnects of the shared Prisma singleton and unnecessary logging of diary content/session details from the paths being upgraded.
- [ ] Upgrade to verified supported/patched dependency versions in a separately tested change; avoid unrelated major migrations. Remove duplicate/unused packages only after checking imports.
- [ ] Define the shared visual foundation in `app/globals.css`, `app/layout.tsx`, `app/NavBar.tsx`, and focused reusable controls under `app/components/`.

Acceptance: another developer can configure the app and run it; sign-in and an existing movie's save/log/edit/delete flow pass; missing content and anonymous access render valid pages; baseline failures have recorded resolutions. Do not represent unrun checks as passing.

### Phase 1: movie identity, migration, and provider boundary

Modify: `prisma/schema.prisma`, new additive directories under `prisma/migrations/`, `app/services/movieService.ts`, `next.config.ts`.

Create: `app/lib/tmdb/client.ts`, `app/lib/tmdb/types.ts`, `app/lib/tmdb/normalize.ts`, `app/lib/tmdb/images.ts`, `app/lib/tmdb/cache.ts`, `app/services/movieImportService.ts`, `scripts/catalog-match.ts`, `scripts/catalog-apply.ts`, and tests in `tests/catalog/` and `tests/integration/catalog/`.

- [ ] Define the normalized movie result/detail types, preserving separate external TMDB and local IDs and separate score scales.
- [ ] Add nullable unique `tmdbId`, refresh timestamp, backdrop/credits snapshot fields, and nullable missing metadata support without changing existing IDs.
- [ ] Write migration fixtures containing existing reviews, favorites, watchlist entries, ambiguous titles, and unmatched local movies. Assert relationships and IDs survive migration and restoration.
- [ ] Implement the server-only TMDB client with allowlisted endpoints, response validation, bounded pagination, timeout/error mapping, shared metadata caching, image handling, and non-adult filtering.
- [ ] Generate a dry-run catalog matching report. Review mappings before using the explicit apply command. Record collisions and unmatched records rather than guessing.
- [ ] Implement idempotent import-by-TMDB-ID using trusted upstream details. Test simultaneous imports and the current title/year unique constraint before replacing that identity constraint.
- [ ] Configure trusted TMDB image patterns and placeholders. Keep prior local artwork functional.

Acceptance: a title not in the original database can be searched and inspected without creating local rows; a signed-in save creates/reuses one local row; existing diaries and links still resolve; upstream failures leave local content intact.

### Phase 2: discovery and detail screens

Modify: `app/page.tsx`, `app/movies/page.tsx`, `app/movies/MovieSearch.tsx`, `app/movies/MovieFilters.tsx`, `app/movies/MovieGrid.tsx`, `app/movies/MovieCard.tsx`, `app/movies/[id]/page.tsx`, `app/movies/[id]/MovieReviews.tsx`, current movie action components, and `app/hooks/useMovieSearch.ts`.

Create: `app/movies/tmdb/[tmdbId]/page.tsx`, `app/api/catalog/route.ts`, `app/api/movies/import/route.ts`, `app/lib/movies/links.ts`, focused shared detail components, and `tests/e2e/discovery.spec.ts`.

- [ ] Build the shared movie-link helper and detail rendering so old local URLs and external TMDB URLs stay unambiguous.
- [ ] Add popular discovery, genre/year browse filters, title/year search, URL-driven pagination, and a debounced search input. Do not advertise unsupported combined search filters.
- [ ] Show poster/backdrop, description, release details, genres, cast, and directors; provide fallback content for missing upstream fields.
- [ ] Distinguish provider scores from Talarama ratings, including unrated and low-count states.
- [ ] Connect favorite/watchlist actions to import-first behavior for new external titles. Change save actions to idempotent add/remove operations.
- [ ] Retire normal-member manual movie creation/edit/delete paths and their UI links. Keep legacy local titles readable. Metadata refresh uses the provider service.
- [ ] Add loading, empty, signed-out, invalid-ID, provider-error, and stale-search states with keyboard/touch access.

Acceptance: a visitor discovers a movie, shares its URL, and opens details; a member saves it and sees the same movie in their personal library; refreshing or navigating back preserves filters. Rapid search changes cannot replace fresh results with stale ones.

## Subproject B: diary and personal library (phase 3)

Modify: `prisma/schema.prisma`, additive migrations, `app/validationSchemas.ts`, `app/types/diary.ts`, `app/diaries/types/diary.ts`, `app/diaries/_hooks/useDiaryForm.ts`, `app/diaries/diaryService.ts`, `app/api/diaries/route.ts`, `app/api/diaries/[id]/route.ts`, existing diary create/edit routes and components, `app/diaries/Watchlist.tsx`, `app/diaries/Favorites.tsx`, `app/movies/[id]/types.ts`, and all rating consumers found by search.

Create: `app/lib/diary/contracts.ts`, `app/lib/diary/dates.ts`, `app/services/diaryEntryService.ts`, `app/services/watchlistService.ts`, `tests/diary/`, `tests/integration/diary/`, and `tests/e2e/diary.spec.ts`.

- [ ] Migrate to optional ratings, empty reviews, explicit visibility, rewatch/spoiler flags, and retry-safe create IDs. Existing entries become private pending explicit publication.
- [ ] Rename the watchlist model in Prisma while mapping to the existing physical table; verify every reference and row is preserved.
- [ ] Consolidate all diary form/API types and validation into the single payload contract specified in the design. Remove contradictory duplicate types after migrating callers.
- [ ] Implement calendar-date parsing and future-date validation, including leap days and timezone boundaries. Preview legacy date normalization before applying it.
- [ ] Build one accessible log form shared by movie details and diary create/edit flows. Explain public/private state, spoilers, and automatic watchlist removal.
- [ ] Implement create/edit/delete transactions and ownership checks; repeated create requests with the same request ID return the same entry. Confirm users can intentionally log same-day rewatches.
- [ ] Remove a logged movie from the owner's watchlist transactionally. Failed logging leaves both tables unchanged.
- [ ] Add paginated diary month grouping, movie search, year/rating filters, and separate log/distinct-movie statistics. Keep favorites, watchlist, and viewing history distinct.
- [ ] Update rating displays for null values and preserve 1-5 integer semantics throughout the app.

Acceptance: a member can log with or without a rating/review, mark rewatches/spoilers, edit/delete only their entries, and recover from a failed request without duplication. Another member cannot read or mutate their private diary. Calendar dates display identically across viewer timezones.

## Subproject C: community identity and publication (phase 4)

### Profiles and publication boundaries

Modify: `prisma/schema.prisma`, additive migrations, `app/auth/authOptions.ts`, `app/types/next-auth.d.ts`, `app/NavBar.tsx`, and existing movie-review queries.

Create: `app/members/[username]/page.tsx`, `app/settings/profile/page.tsx`, `app/api/profile/route.ts`, `app/services/profileService.ts`, `app/services/publicEntryService.ts`, `app/lib/profiles/contracts.ts`, `scripts/username-preview.ts`, and `tests/profiles/`.

- [ ] Add the profile fields, timezone, publication controls, and member/admin roles from the design.
- [ ] Preview legacy username normalization/collisions, retain user/account IDs, and apply reviewed mappings. Allocate new neutral unique handles with database-backed conflict retries.
- [ ] Add profile settings with username/bio validation and updated session display data. Never accept identity or role changes through a general profile payload.
- [ ] Build shareable public profiles, fallback avatars, optionally public favorites, and statistics derived solely from eligible public entries.
- [ ] Centralize public eligibility: published profile, public entry, and non-hidden moderation state. Use it across profile, movie, feed, review, count, and rating queries.
- [ ] Keep private and community query responses out of shared/static caches in v1. Test publication changes against already visited pages.

Acceptance: profile/entry publication is deliberate; existing diary content is not automatically exposed; public responses contain no emails, account tokens, private entries, or private counts. Owner settings remain available when their public profile is unpublished.

### Feed, public reviews, and aggregate ratings

Create: `app/community/page.tsx`, `app/reviews/[id]/page.tsx`, `app/api/community/route.ts`, `app/services/communityService.ts`, `app/services/communityRatingService.ts`, feed/review/spoiler components, `tests/community/`, and `tests/e2e/community.spec.ts`.

- [ ] Build chronological public activity with stable cursor pagination and a useful empty state. Use public creation order rather than a recommendation algorithm.
- [ ] Build a shareable review page and movie-level review pagination. Rating-only logs can appear as activity without being rendered as text reviews.
- [ ] Apply spoiler protection to snippets and full review text with accessible reveal controls.
- [ ] Compute the newest eligible rated entry per member/movie, then aggregate the 1-5 community average and member count. Test ties, rewatches, private entries, deleted entries, and moderation changes.
- [ ] Invalidate visible public results after privacy/profile/moderation changes; re-check eligibility on each server request.
- [ ] Add appropriate metadata for public movie/profile/review pages. Unpublished/private resources return a generic not-found response and are excluded from sitemap/indexing paths.

Acceptance: two members can publish reviews and discover one another; visitors can browse without signing in; pagination does not repeat equal-time items; a private or hidden entry is absent from all public surfaces and aggregates.

### Public-launch reporting and moderation

Create: report and moderation models/migrations, `app/api/reviews/[id]/reports/route.ts`, `app/admin/reports/page.tsx`, `app/api/admin/reports/[id]/route.ts`, `app/services/moderationService.ts`, `app/lib/rateLimit.ts`, a rate-limit bucket model, `scripts/set-admin.ts`, and `tests/integration/moderation/`.

- [ ] Add per-member review reporting, bounded reason text, unique reporter/entry constraints, and a report dialog.
- [ ] Add an administrator-only report queue with hide/unhide and resolution audit records. Bootstrap an administrator through an operator script, never a browser role selector.
- [ ] Implement the design's mutation limits with atomic PostgreSQL buckets and bounded cleanup. Return 429/retry information and preserve draft form text.
- [ ] Verify ordinary members cannot invoke administration, change roles, or edit shared movie metadata through retired endpoints.
- [ ] Keep hidden reviews in the owner's private diary and make their moderation state visible to that owner.

Acceptance: a report can be triaged without deleting personal history; hidden content disappears immediately from feed, profile, movie reviews, review URLs, and rating counts for visitors. Concurrent writes cannot bypass the shared limiter.

## Subproject D: launch and portfolio presentation (phase 5)

Modify/create: `README.md`, `.env.example`, `CONTRIBUTING.md`, proposed `LICENSE`, `docs/architecture.md`, `docs/deployment.md`, `docs/migrations.md`, `.github/workflows/ci.yml`, page metadata, TMDB attribution, and test fixtures.

- [ ] Run lint, type checking, unit tests, PostgreSQL integration tests, browser journeys, and production build in CI using test credentials and isolated fixtures.
- [ ] Review responsive layouts at 360/768/1440 px; verify keyboard use, focus handling, contrast, reduced motion, empty states, and slow/upstream-failure states.
- [ ] Test initial-user/empty-community behavior. Do not rely on fake reviews to make the production product seem active.
- [ ] Verify TMDB attribution and current usage terms. State that source-code licensing does not license upstream artwork/data.
- [ ] Write a practical README: purpose, screenshots, setup, environment variables, test commands, migration workflow, architecture, deployment, and contribution instructions. Add the proposed MIT code license after owner review.
- [ ] Deploy a preview with a separate database and OAuth callback settings. Verify real-token search/details and real sign-in without putting secrets in test fixtures or logs.
- [ ] Rehearse migrations and restore using a staging copy with reviewed mapping reports. Record pre/post IDs, row counts, and foreign-key checks.
- [ ] Configure deployment origin, environment variables, request limits, database connection pooling, error logging without private content, and a working backup/restore procedure.
- [ ] Invite initial testers, fix demonstrated issues, then deploy the community release. Review production migrations before applying them; publication/deployment is a separate execution action from this planning request.
- [ ] Capture screenshots and document key engineering decisions: external/local identity, privacy-safe queries, date-only logs, idempotent writes, and tested migration preservation.

Acceptance: a fresh developer can follow setup instructions, CI passes, the preview passes the main journeys, recovery has been rehearsed, and public metadata/attribution reflect the actual deployment.

## Review focus for every execution plan

| Failure mode | Expected outcome | Owning phase |
| --- | --- | --- |
| Ambiguous catalog match or simultaneous import | No lost relationships or duplicate TMDB records | 1 |
| Missing metadata, timeout, stale search response | Usable fallback/retry; no loss of personal data | 1-2 |
| Calendar boundaries, retries, same-day rewatches | Stable dates; no accidental duplicates; deliberate rewatches work | 3 |
| Private/unpublished/hidden content | Absent from public pages, serializers, counts, and rating aggregates | 4 |
| Old usernames, sign-up races, role escalation | Existing accounts retained; unique handles; server-enforced privileges | 0, 4 |

## Verification commands to establish during execution

```text
npm ci
npx prisma generate
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build
```

The additional scripts do not exist yet. Each execution plan must introduce its required commands and fixtures before relying on them. Production credentials are never used for automated migration/integration tests.

## Deferred work

Follows/personalized feeds, comments, review likes, notifications, chat, custom lists, advanced recommendation systems, half-star ratings, TV shows, trailers, streaming links, and full-movie playback are outside this release. Revisit follows after observing whether people publish and read reviews in the initial community.

## First execution slice

After design review, produce the detailed foundation-and-catalog implementation plan for subproject A. Implement that slice and verify its release gate before expanding into B, C, and D. The first concrete deliverable is a reproducible running application with the existing diary flow repaired; the first visible feature milestone is searching and saving a movie that was never manually seeded.
