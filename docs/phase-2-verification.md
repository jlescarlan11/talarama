# Phase 2 verification

2026-10-19. Implemented in the existing isolated checkout `C:/Users/jlesc/.codex/worktrees/talarama-phase-0/Talarama`, on `codex/talarama-phase-0`, starting from phase 1 commit `c004c3d`. All work stays local. Nothing was pushed, merged, published or deployed.

## Delivered scope

- Refreshed home, discovery, movie cards and shared local/external detail screens. Permanent card titles and responsive labeled controls support touch and keyboard use.
- Popular discovery supports genre/year; title search supports optional year. Mode/query/year/genre/page/popular sort are URL state. Search debounces 300 ms, trims equivalent whitespace, cancels pending debounce on explicit controls and ignores obsolete result/error completions.
- Server-rendered direct/share URLs supply initial metadata. Subsequent discovery controls use Next's supported native history integration with `useSearchParams`; the guarded API hook owns subsequent reads. This avoids slow server-navigation completions overwriting newer typing. Back and refresh preserve URL state.
- One shared `movieHref` preserves unmatched local `/movies/[id]` URLs and prefers distinct `/movies/tmdb/[tmdbId]` URLs for external/mapped cards. No browse/detail read imports movies.
- Poster/backdrop, description, release year/runtime, genres, cast and directors have usable missing-data states. Provider failure retains saved local snapshots and legacy director/genre data. Removed/invalid IDs have a movie-specific not-found state; provider failure offers a fresh-server-render retry.
- TMDB scores are labeled `/10` with vote counts when known. Existing Talarama diary ratings are independently labeled `/5`, with no-rating and early-rating states. This does not implement the later public community aggregation/privacy model.
- Signed-out details explain saving and carry the selected movie URL through sign-in. Signed-in external actions first authenticate/import trusted metadata, then save by returned local ID. Favorite/watchlist POST adds and DELETE removes idempotently; failed responses can be retried without reversing intent. Pending controls are disabled and errors remain visible.
- Manual catalog create/edit/delete handlers now deny anonymous requests with 401 and signed-in requests with 403. Former new/edit pages guide members to discovery. Existing library/log/edit/delete journeys remain operational.

## Verification record

| Check | Result |
| --- | --- |
| Initial clean worktree and baseline | `c004c3d`, clean; 49 baseline unit tests passed |
| Prisma generation | Passed, Prisma/client 6.19.3 |
| Lint | Passed, no warnings/errors |
| TypeScript | Passed |
| Complete unit/provider suite | 80 tests in 22 files passed |
| PostgreSQL integration suite | 12 tests in 2 files passed |
| Historical migration replay | All 25 migrations passed; no schema drift |
| Chromium browser suite | Final run: all 13 journeys passed in 49.1 seconds, including 360/768/1440 layouts, light/dark themes and reduced motion |
| Production build | Final run passed: production compilation, type checking and generation of all 12 static pages |
| Full and runtime audits | Both zero vulnerabilities |
| Independent read-only review | Two P2 findings reproduced and fixed with regression tests; no Critical or additional actionable Minor findings |
| Preservation diff | Approved design/roadmap, Prisma schema/migrations and phase 1 TMDB modules unchanged |

Final unit, browser, generation, build and supporting check outputs were read before the local completion commit. This report is not evidence of real-token TMDB or Google OAuth acceptance.

Tests exercise strict mode/numeric/combination validation, separate route identities, safe provider errors, anonymous-before-import ordering, forged metadata rejection, retired writes, metadata fallbacks and explicit add/remove semantics. Real PostgreSQL tests run eight concurrent identical additions/removals for both library kinds, preserving another member's entries and legacy associations. Existing phase 1 migration/import/backup/restore tests remain in the complete suite.

Browser journeys assert read-only catalog/detail row counts, share URLs, pagination and Back, title search, empty/failure/recovery, keyboard retry, missing runtime/artwork, invalid/removed IDs, local fallback, external import-first saves, personal-library links and retired-write rejection. The stale-search journey types through the real search control, holds an old API response, types a new title and verifies fresh results and input survive. Component tests also prove stale errors/results cannot win even when transport ignores cancellation. Screenshots are kept locally in ignored `.superpowers/phase2-{discovery,detail}-{360,768,1440}.png`; 768 exercises dark mode, the other widths light mode. They depict synthetic fixtures, not real provider artwork.

## Independent review and regressions

One fresh read-only whole-phase reviewer inspected `c004c3d..fae95b3` and the small debounce correction in the working tree. It did not mutate Git/files/database or independently rerun the full verification matrix.

1. **Slow navigation overwrote newer typing (P2).** The reviewer reproduced `Alien` navigation completing after the user typed `Aliens`; the input reverted and the newer debounce disappeared. The browser regression using actual controls failed with server navigation, then passed with synchronous native-history URL state and the guarded API fetch. Existing Back/share/direct-render behavior remains tested. A separate component regression fails without whitespace equivalence and pending-debounce cancellation.
2. **Sign-in lost the selected movie (P2).** The installed NextAuth callback helper defaults to the origin or an earlier cookie when no callback is supplied. The generated-link assertion failed before adding the encoded detail URL and passed afterward. Real OAuth remains unverified.
3. **Visual QA: spacing-token collision.** The existing `--spacing-xl` makes `max-w-xl` resolve to 2.5 rem rather than a readable content measure. A real browser width assertion measured 35 px at 360 px and failed. Explicit 36 rem content limits in the new screens now pass and screenshots were inspected again. Existing theme tokens were preserved.

The fix pass used targeted failing/passing tests plus the complete suites. No extra review dispatch or unsupported claim of a post-fix independent review was made.

## Decisions and review items set aside

| Decision | Reason and practical limit |
| --- | --- |
| Proceed without another design/plan approval pause | Owner explicitly authorized autonomous phase 2 execution; changes remain local and reviewable. |
| Offer popular ordering only | Existing trusted provider supports popularity ordering; alternative sorts require another provider contract. |
| Retain current diary-based local scores/reviews | Public visibility, latest-per-member aggregation, moderation and other diary/community changes belong to later approved phases. This phase does not establish those privacy guarantees. |
| Accept streamed not-found HTTP 200 or 404 | Next can send headers before async not-found resolves. Tests assert the actual not-found screen; import API absence still returns 404. |
| No cross-client ordering/version model | Identical retries converge. Conflicting add/remove intentions from separate clients follow database arrival order; cross-tab synchronization/back-cache freshness has no new verified regression or promised ordering contract. |
| Keep existing decoration/greeting/retired-component choices | Reviewer found no material defect from card decoration removal, changed home greeting, unused retired components, formatting or snapshot wording; no actionable Minor issue was raised. |
| Treat live integrations separately from fixtures | Credentials are absent. Neither synthetic transport nor synthetic JWTs prove real TMDB/Google service acceptance. |
| Use implementing-agent verification totals | Reviewer performed static/read-only and in-memory reproduction work; full-suite totals below come from this implementation session. |

Reviewer also inspected trusted imports, identity links, malformed/anonymous mutations, snapshot fallback, missing metadata/artwork, score states, retired manual writes and metadata/member cache separation without establishing another defect. Planning workflow pauses/additional reviewer dispatches were set aside under owner authorization and the one-review execution workflow.

## Tooling findings and runtime limits

- Initial Windows browser harness startup stripped backslashes from `NODE_OPTIONS`; the test preload now uses a normalized absolute path. Three files initially saved through Windows encoding were normalized to UTF-8, and extra CR bytes removed. These failures were corrected before final checks.
- A test initially matched Next's route-announcer alert as well as the application alert; assertions now scope to `main`. Native-history browser tests wait for hydration through real controls. The original diary browser journey now waits for the actual first save response instead of assuming cold dev-route compilation fits a five-second assertion.
- Prisma generation initially hit an EPERM DLL rename while the Windows dev process held the engine. It passed once that process exited. No database reset or schema workaround was used.
- Playwright's default caret hiding modified input styles during early hydration in an initial screenshot run. Screenshots now use `caret: initial`. The pre-existing Next response-stream cancellation during navigation and a development LCP image warning were observed in passing runs; the suite does not establish a console-error-free runtime session.
- No dependency or lockfile changes were required. No phase 2 schema migration was added. The original checkout was not edited; its pre-existing untracked `docs/` was left alone.

## External blockers

The local environment was inspected with Next's environment loader without printing values: `TMDB_READ_TOKEN`, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are absent. Browser tests preload a synthetic TMDB transport only in the test server process, use a synthetic token, and exercise the real production transport validation/cache/import/handler path. Synthetic JWT sessions exercise authorization and persistence without adding an application auth bypass.

Live provider availability, real-token search/detail/import and real Google OAuth remain **unverified**. Configure genuine development credentials and run those smoke checks before claiming live acceptance. Production data preservation still needs the actual environment's staging restore and migration evidence. Public-launch provider attribution/terms and later privacy/community safeguards remain part of the approved later release work; nothing was deployed here.
