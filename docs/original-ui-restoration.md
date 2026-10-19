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

Live TMDB results need a valid `TMDB_READ_TOKEN` in local `.env` and the ordinary development server, which does not load the fixture transport. Keep secrets out of chat and Git. The sample launcher intentionally continues using samples even if a real token is present. Real OAuth, live-provider acceptance, production retention/storage/cache/backup operations and licensing remain pending.

## Verification

The first regression run failed on the missing original welcome/personal greeting and the one-result fixture. After implementation, the focused12 tests passed. Final unit, lint, types, browser, production-build and visible-preview results are recorded after completion; prior backend/retention evidence remains historical rather than being claimed as new runs.
