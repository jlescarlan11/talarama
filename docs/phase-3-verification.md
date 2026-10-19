# Phase 3 verification

2026-10-19. Work remains in `C:/Users/jlesc/.codex/worktrees/talarama-phase-0/Talarama`, branch `codex/talarama-phase-0`, based on phase 2 `1973d2f`. Phases 1 and 2 and their commits are preserved. No push, merge, PR, deployment or checkout removal is authorized or performed.

## Delivered

- One strict shared diary payload/type/schema, one shared create/edit log form and submit hook; details preserve trusted explicit import-first navigation into it. Optional null ratings, integer 1–5, trimmed empty-to-2000-character reviews, rewatch/spoiler flags, PRIVATE/PUBLIC intent and create UUIDs.
- An additive migration leaves all old IDs, values and links intact, makes rating nullable, initializes old entries PRIVATE, and adds request uniqueness. Prisma WatchlistEntry maps the existing physical WatchedList table. There is no physical rename or data-copy migration.
- New dates store UTC midnight and serialize as YYYY-MM-DD. Date validity/leap/future checks use the saved IANA timezone. Browser initialization writes the zone once, with UTC fallback. Later browser-zone changes cannot replace it. Profile timezone editing remains phase 4.
- Legacy dates are not converted by migrations. A local guarded preview exports originals/candidate dates/ambiguity. An operator-only reviewed manifest can normalize explicitly selected rows with stale-original/version checks and whole-batch rollback. No ambiguous development/production date conversion was applied.
- Owner-only no-store diary reads and mutations. Concurrent identical creates converge; independent request IDs permit same-day rewatches. Create and watchlist removal commit atomically. Review/date-only edits preserve later watchlist intent; a changed movie receives guarded, once-only cleanup. Retry returns the original log without removing a subsequently re-added watchlist entry. Deleting never restores watchlist; favorites remain independent.
- Private diary has month grouping, title search, year/rating filters, stable 20-entry watchedDate/ID pagination and separate viewing-log/distinct-movie counts. Existing local/TMDB links and discovery state behavior remain covered.
- All movie detail/catalog/favorites/watchlist queries exclude diary review/rating/count data. PUBLIC currently saves intent only; the form explains that profile publication and community eligibility must launch before public exposure. No phase 4 public feed/profile/moderation/aggregate was added.
- Date displays use UTC. Form controls are labeled, timezone initialization retries in place, uncertain submissions are reconciled before later edits, errors retain drafts and receive focus, rating can be cleared, native dialogs provide focus containment/Escape, and phone/tablet/desktop light/dark layouts remain readable.

## Verification evidence

| Check | Result |
| --- | --- |
| Initial branch/tree | Clean at `1973d2f` |
| Unit/provider suite | 85 tests in 25 files passed |
| PostgreSQL integration | 23 tests in 2 files passed |
| Historical migrations | 26 replayed; no schema drift |
| Chromium journeys | 14 passed; responsive 360/768/1440, light/dark, reduced motion, keyboard |
| Prisma/client generation | 6.19.3 passed after browser/test processes exited |
| Lint / TypeScript | Passed |
| Production build | Passed compilation, type checking and page generation |
| Full and runtime audits |Both zero vulnerabilities |
| Independent review | Four Important findings reproduced and fixed with RED→GREEN regressions; no Critical/Minor findings |

Checks use the existing commands in package.json. Ignored `.superpowers/phase3-*` logs/screenshots record local evidence; no secrets/exports are tracked. Screenshots use caret:initial and depict synthetic fixtures. Browser tests use the existing test-server-only transport fixture and synthetic JWTs, with no production bypass.

## Preservation and transactions

The real migration rehearsal replays the historical SQL, seeds old users/accounts/movies/reviews/favorites/watchlists/genres before applying phases 1/3 SQL, and checks old row fields and links. A representative non-midnight `2020-02-29T23:30:00Z` log remains byte-for-date unchanged, PRIVATE, with its original 4/5 rating and text. The test restores a genuine pre-upgrade pg_dump backup into a second guarded schema, applies both additive migrations, and compares all records. It also restores the post-migration backup and compares again. No reset or historical checksum edit occurs.

Database tests exercise eight concurrent same-request creates, deliberate same-date rewatches, owner-scoped request identity, a null-rating/empty-review log, malformed/anonymous requests, other-owner GET/edit/delete denial and generic404s, immutable retry identity, saved timezone initialization, future dates, equal-date pagination, no private catalog counts, and no movie-detail diary query. A database trigger deliberately rejects watchlist deletion; the log and both owners' watchlist rows remain unchanged. Reviewed date batches with a stale second original leave the first timestamp unchanged too.

The actual loopback development database was backed up to ignored `.superpowers/phase3-pre-migration-dev.sql`, then `prisma migrate deploy` applied phase 3 against its existing migration history. All legacy table rows compared unchanged. All eight inventoried content tables were empty; this is local operational evidence, not evidence about production data. The actual `diary:dates preview` exported zero entries. The existing phase 1 backup/baseline and PostgreSQL cluster are retained.

## Browser evidence and corrections

The final run passed all 14 journeys in 1.1 minutes after the fix pass, followed by successful Prisma generation and a production build with 13 generated static pages. The production code was then committed locally; no post-fix independent endorsement is claimed.

The retained save/log/edit/delete journey verifies existing account links and independent favorites, and now expects transactional watchlist removal. The added journey logs unrated rewatches at all three widths, verifies a Pacific/Honolulu browser still edits the same calendar date, simulates a committed request with a lost reply, verifies draft retention/reused UUID/single log, changes visibility intent, filters history and checks signed-out/second-member diary exclusion. Screenshots cover the form error/retry state and personal diary.

Two test-fixture issues were corrected during development: a text locator selected the hidden Not rated filter option before the actual entry label; a synthetic second-member JWT omitted fields required by the existing auth callback and received401 before ownership checks. The fixture now supplies those fields and reaches the expected404. The latter is not proof of real OAuth. Browser screenshot scroll is reset after focused error feedback to avoid capturing a sticky header halfway down a full-page image.

An integration regression reproduced a real old privacy leak: GET /api/movies and older catalog/library service queries included global diary counts/ratings. Removing those reads makes the regression pass. Existing movie detail public review/aggregate reads are also removed pending phase 4 eligibility.

## Independent review and fix pass

A fresh read-only reviewer inspected immutable `1973d2f..635b36e` and adjacent consumers. It performed source inspection and in-memory executions with the actual service/hook modules and substituted database/network boundaries. It did not rerun the full PostgreSQL/browser/build matrix or mutate the checkout. Verification totals are the implementing agent's runs.

Four Important findings were reproduced before fixes:

1. **Unchanged-date edits normalized legacy timestamps.** A PostgreSQL regression failed when a review-only PATCH changed 23:30 to 00:00. The service now retains the exact original timestamp if the submitted calendar day is unchanged; a genuinely changed date stores UTC midnight. The test verifies both cases.
2. **Failed timezone initialization blocked every later save.** A hook regression showed one failed request permanently retained as a rejected promise. The hook now clears failed initialization and coalesces/retries it in place. The recovery test verifies a later successful request and actual diary submission without remount/reload.
3. **Later draft edits disappeared after a lost create response.** A hook regression failed because navigation discarded later text after replay returned the original entry. The form now retains the first submitted payload, recovers it with the same UUID, keeps later edits visible, and changes the action to Update Entry. A subsequent explicit update saves to the recovered ID. A real browser regression edits text after a committed-but-lost reply and verifies one entry with the latest text.
4. **Edit retries removed a later watchlist addition.** A PostgreSQL regression reproduced same-movie edit retries deleting a re-added item. Ordinary edits now leave watchlists alone; only creates and actual movie changes remove an item. A further real overlapping-edit regression deliberately re-adds after deletion: it observed four cleanup calls before the movie/date update guard and exactly one afterward. Overlapping stale edits return 409 for retry rather than repeating cleanup.

The hook test harness initially needed to subscribe to React Hook Form's error state, just as the real form does; its navigation/payload regression already failed correctly before implementation. Browser filter and existing snapshot-fallback assertions were scoped to the visible tab panel/heading/status/article because Next may retain a hidden old route tree during navigation. These fixture corrections do not substitute for the failing behavioral regressions above.

No Critical or Minor findings were returned. The reviewer declined phase 4 profile publication, public eligibility, moderation and mutation-limit implementation because the roadmap assigns them to the next phase; phase 3 public diary suppression was reviewed. Ruling: retain that scope boundary—cost is delaying public community capability until its safeguards exist. No second reviewer dispatch is claimed; the fix pass is verified by reproducing tests and final suites.

## Rulings and limits

- Proceed under the owner's explicit autonomous execution authorization; no generic planning approval pause and no new checkout. Cost if revised: local code/plan changes only.
- Add only User.timeZone now because phase 3 calendar validation requires it; leave profile publication/editing/community/moderation to phase 4. Cost: public review availability is delayed until its privacy rules exist.
- Keep original ambiguous legacy timestamps, deterministically display their UTC date in the interim, and require a separate reviewed conversion. Cost: the displayed calendar interpretation may need correction after evidence review; original values remain recoverable.
- Consolidate phase 3 migration preservation into the existing real historical catalog migration/backup harness rather than duplicate a second cluster harness. It now tests both additive migrations and both pre/post restore paths. Cost if wrong: those checks share one harness failure domain.
- Keep the branch/worktree and backups intact under the owner's explicit choice. Cost if revised: integration remains a separate local decision.
- Cursor pages form a live view, without cross-request snapshot isolation. Edits can move a record to a different page; deterministic ordering does not promise a frozen dataset.

## External blockers and runtime observations

TMDB_READ_TOKEN, GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET remain absent as established at handoff; no credentials were printed/invented. Real-token provider availability/search/detail/import and genuine Google OAuth remain unverified. Fixtures and synthetic JWTs prove local contracts only. Actual production staging restore/migration remains a separate environment-specific release gate.

The known Next response-stream cancellation during navigation appeared in passing browser runs. Harmless Node color-environment warnings also remain. These checks do not establish a console-error-free runtime. Windows Prisma DLL locking was resolved by waiting for this checkout's own test process to exit; no forced engine deletion or process-wide termination occurred. No dependency versions changed. Full launch attribution/terms/deployment remain later approved work.
