# Original UI restoration

Owner request on 2026-10-19: restore the original UI, retain all functional improvements, keep work local and show localhost again. Reference: original checkout commit `c92c01f`; starting upgrade revision `f325cef`. Work stays in the existing `codex/talarama-phase-0` worktree. No push, deploy, source licensing decision or real-data operation is authorized.

## Presentation

Restore the centered Welcome to Movie Diary/personal greeting and original carousel, compact discovery header with breadcrumbs, poster overlays, original DaisyUI light/dark palette, unframed movie detail layout and diary profile/statistics panel. Retain dynamic discovery, URL search/filter/pagination, separate provider scores, import-on-save, independent library actions, calendar-date and retry/draft handling, privacy/publication/reporting/moderation and provider attribution. New screens remain accessible through navigation. The diary panel shows accurate log/distinct-movie counts rather than guessing a top genre from a paginated result.

Accessibility fixes remain: theme synchronization, reduced motion, focus/skip navigation, mobile modal behavior, touch controls, image fallback and always-visible poster titles/year/score. The existing local system font stack remains; the old Google-hosted Inter build download is not reintroduced. This restores the original visual structure while retaining responsive and functional fixes.

The home carousel accepts provider results without importing them into PostgreSQL. Provider failure retains the saved-local catalog fallback and reports it honestly. Reading the session restores the personal greeting and keeps the home page rendered per request.

## Why only one movie appeared

The existing browser-test transport intentionally returns one invented movie per page. The prior localhost launcher reused that transport; this was a limited sample dataset, not a one-movie database limit. No genuine TMDB credential is configured. Production provider transport/search/discovery remain unchanged.

`npm run preview:local` uses an opt-in preview transport with24 invented titles,12 results per page, matching title/year/genre filters, consistent details and locally generated abstract PNG poster artwork. `Sample:` titles and an on-page notice identify the demonstration. The preview overrides Google/TMDB credentials with blank/synthetic values and uses a fresh random `preview_<UUID>` schema in a guarded loopback `_test` database. It cannot attach to existing member data. There is no login bypass. Normal browser regressions continue using their existing small transport unless the preview flag is explicitly enabled.

Run from this checkout after a production build and with `TEST_DATABASE_URL` configured locally:

```text
npm run preview:local
```

It binds only `127.0.0.1:3000`, refuses an occupied port, and records only schema/stop-file/PIDs in ignored `.superpowers/local-preview-session.json`. Stop with Ctrl+C or create that session's exact stop file. Normal shutdown drops only its own generated schema. Hard interruption may leave that disposable schema; never wildcard-drop schemas or reset a database to clean it up. Stop the preview before rebuilding its `.next` output.

Provider cache keys include a server-only scope. Each browser run and sample preview supplies its generated schema name as a unique scope; ordinary servers default to `provider`. The normalized cache key version is2, so ordinary servers stop reading older unscoped fixture entries. Cache files are preserved; this does not claim a production cache purge. Preview results cannot populate the ordinary namespace. No member data or credentials are put in cache keys.

Live TMDB results need a valid `TMDB_READ_TOKEN` in local `.env` and the ordinary development server, which does not load the fixture transport. Keep secrets out of chat and Git. The sample launcher intentionally continues using samples even if a real token is present. Real OAuth, live-provider acceptance, production retention/storage/cache/backup operations and licensing remain pending.

## Verification

The first regression run failed on the missing original welcome/personal greeting and the one-result fixture. After implementation, the focused12 tests passed;97 unit tests, lint/types and20 Chromium journeys passed before review. Browser journeys cover discovery, saves, diary mutations, privacy, publication/reporting/moderation and responsive light/dark presentation. Prior backend/retention evidence remains historical rather than being claimed as new runs.

## Independent review disposition

One read-only review of `f325cef..16fe81b` found no Critical findings, two Important findings and one Minor. All were accepted and fixed in one pass:

- Important: the original preview reused ordinary Next cache keys. The production build succeeded but the unconfigured-provider smoke unexpectedly returned200 instead of503, confirming cached fixture contamination. A regression also served invented data through the ordinary scope. Unique preview/browser scopes and a version2 ordinary namespace fix this without deleting existing caches.
- Important: changing the home grid back to a carousel removed persistent year/provider-score information for touch/keyboard users. The regression failed on missing score text. The restored carousel now exposes metadata in the normal, hover and keyboard-focus states; its original structure remains.
- Minor: the home carousel lacked the grid's broken-artwork fallback. A regression failed after an image error. The carousel now uses the existing safe local fallback pattern.

The first new carousel test attempt exposed jsdom's missing `scrollTo`; the test harness was corrected before confirming the two actual metadata/fallback failures. Red/green evidence is retained in `.superpowers/ui-restore-review-{red,green}.log`. The preview launcher's ESM/CommonJS guard import was checked and corrected before launch. No second post-fix review is claimed.

Reviewer declined-area rulings: real TMDB responses/artwork/acceptance and Google OAuth remain unverified; unchanged import/save/log/privacy/moderation implementations are exercised by browser journeys rather than re-reviewed as a new subsystem; production retention/licensing/storage/backups and cache purge remain gated; schema creation/process cleanup are verified only for the owned disposable preview; visual checks cover360/768/1440 layouts rather than every authenticated screen/modal/viewport; deployment/cloud settings/repository-wide security assessment remain outside this local task. None of these areas is waived or claimed complete. The cache-boundary fix changes only metadata cache partitioning; schema, identity routing, auth and retention behavior remain intact.

## Final measured results

- `npm test`:101/101 in32 files. `npm run lint` and `npm run typecheck` passed. Final logs: `.superpowers/ui-restore-{unit,lint,types}-artwork-final.log` (the unit filename is `ui-restore-unit-artwork-final.log`).
- `npm run test:e2e`:20/20 Chromium journeys after the cache/carousel review fixes, including the new original-home dynamic/read-only/keyboard-metadata journey. Responsive screenshots at360/768/1440 were inspected. Log: `.superpowers/ui-restore-browser-final.log`.
- Production build and loopback smoke passed using an owned empty `build_<UUID>` schema with no provider preload: credits200, community no-store200/empty, unconfigured provider503 and missing/unpublished member no-store404. Log: `.superpowers/ui-restore-build-final.log`. The prior503 assertion failure was resolved; no ordinary cache contents were deleted.
- The visible sample preview then exposed a separate artwork issue: Next16's native-HTTPS image optimizer bypasses global fetch. The regression failed with external DNS explicitly forbidden. The opt-in Node preview preload now replaces only that pinned optimizer module's upstream-image export with local PNG generation and rejects other external artwork. Production app image validation/optimization and other optimizer exports remain unchanged. Red/green logs: `.superpowers/ui-preview-image-{red,green}.log`. This adapter must be reverified on a Next upgrade.
- After this preview-only adapter change,101 unit tests, lint/types and actual production-preview HTTP checks passed. App build/runtime source and the ordinary browser transport were unchanged, so the full20-journey/build checks were not repeated solely for this fixture adapter. Actual optimized sample poster returned200 with9526 bytes; catalog returned12 distinct results on each of two pages, total24, and Harbor search returned2 matching titles. The preview was stopped/restarted through its exact owned stop file; its prior generated schema was removed normally.
- Both restored home and catalog were visibly inspected in the in-app browser and left open. Screenshots: `.superpowers/restored-localhost-home.png` and `.superpowers/restored-localhost-catalog.png`. The owned `npm run preview:local` process remains running on127.0.0.1:3000 for the owner.
- Compared with f325cef: schema/migrations, API handlers, auth implementation, feature services, retention implementation and dependency lockfile are unchanged. Prior commits remain ancestors. No source LICENSE, real credential configuration, push, merge, deployment or real-member operation occurred. Final Git state is committed locally and clean.
