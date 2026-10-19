# Local retention verification

2026-10-19, existing `codex/talarama-phase-0` checkout, based on clean `ca021e3`. Owner confirmed noncommercial initial-release intent, kept licensing pending and authorized retention work only on disposable local fixtures plus a localhost preview. No push, merge, deploy, production/dev migration or real-data purge occurred.

## Implemented boundary

The operator factory accepts only a loopback `_test` URL without query/schema overrides and creates its own random `retention_<UUID>` schema. It cannot attach to existing data. Provenance/audit/termination-control tables exist only inside that fixture schema. App schema/migrations, normal import/read/cache/auth/privacy behavior and dependencies remain unchanged. Synthetic transport is explicitly injected into the real TMDB validation client; genuine credentials are never used.

Verified source fingerprints,150/180-day policy, preview, refresh/expiry, persistent termination, serializable batch/audit writes, stable UUID recovery and reviewed conflict handling are documented in [operations](tmdb-retention-local.md). Existing records are not automatically classified by TMDB ID/date. Unknown/shared ownership stays REVIEW. Reports/audits retain identifiers/hashes/times/outcomes, not expired payload/member content/tokens.

## Measured checks

| Check | Result |
| --- | --- |
| Unit/provider/component suite | 94/94 in28 files, including4 new policy/guard/fingerprint tests. |
| PostgreSQL integration | 49/49 in4 files, including15 retention/actual CLI tests and all prior34 regressions. |
| Types / lint | Passed. |
| Migration replay | Existing27 migrations, no drift. No new production migration. |
| Prior phase preservation | Schema/migrations, application code, dependency versions/lockfile and approved design/roadmap unchanged. |
| Localhost | HTTP200 home/catalog, public synthetic fixture checked; discovery visibly inspected in the in-app browser on127.0.0.1:3000. Separate `preview_<UUID>` schema. |
| Independent review | One read-only review of ca021e3..d6b5a5a: no Critical findings, two Important findings, no material Minor findings. Both Important findings reproduced and fixed; final checks passed. No second post-fix review claimed. |

Policy and integration tests initially failed on missing implementation. Termination regression then failed with RECOVER instead of KEEP_TERMINATED; a durable stop state now blocks both scheduled fetching and source registration after termination. An unexpected-provider exception regression initially silently retired fields; only known trusted transport failures now follow failure/expiry policy, while programming errors abort without writes. Both regressions pass in the complete suites.

One identity-mismatch test initially used the trusted transport itself, which correctly rejected the wrong ID as a failed upstream response. The test now injects a deliberately mismatched normalized result to exercise the operator's own identity guard; expired failed transport still cannot persist malformed metadata.

An initial full run passed46/47 but the two-subprocess CLI test exceeded Vitest's5second default during parallel CPU load. Its actual journal reached VERIFIED; a focused earlier run passed. That real subprocess test now permits30seconds without changing assertions. The pre-review full integration47/47 passed; after the two review regressions were added, final full integration49/49 passed. An ES2017-target BigInt-literal assertion was replaced with `BigInt(1)`; final typecheck passed. Lint and migration checks passed; warnings inherited from prior phases remain.

Final commands: `npm test -- --run` (npm ignored the redundant extra run flag; the package script itself is `vitest run`), `npm run test:integration`, `npm run typecheck`, `npm run lint`. All exited0. Logs are retained locally under `.superpowers/retention-{unit,integration,types,lint}-review-final.log`. The migration check remains applicable because no schema/migration changed during review fixes.

## Independent review disposition

1. Important: genre cleanup previously read the live registry outside the reviewed movie-only plan. A genre added/registered after preview could be retired without review. Accepted and fixed: plans now bind all genre identities, provenance hashes/states, acquisition times, references and conditional actions plus termination state. Whole-batch validation rejects changes; cleanup uses only reviewed candidates. The new regression failed on the baseline with an unexpected successful commit and passes after the fix. Evidence: `.superpowers/retention-review-genre-red.log` and `.superpowers/retention-review-green.log`.
2. Important: an identical request could commit between the initial audit miss and preflight inventory, causing the second caller to report a stale plan instead of the durable outcome. Accepted and fixed: failures after the initial lookup recheck the audit and recover only a matching UUID/plan. The deterministic barrier regression was separately run against d6b5a5a and failed with Stale; the restored fixed implementation passes with no extra fetch. Evidence: `.superpowers/retention-review-replay-isolated-{red,green}.log`. Four concurrent callers also converge in the full suite.

Both findings were handled in one fix pass. Ruling: retain the conservative full-inventory conflict check; its cost is requiring a new preview after unrelated fixture metadata/genre changes. Do not weaken preservation or automatically classify existing data to make a rehearsal pass.

## Preservation and recovery

Actual PostgreSQL fixtures compare complete users/accounts/Google sub and synthetic token values, diary ID/text/rating/visibility/exact `2020-02-29T23:30:00.000Z`, favorites/watchlist, movie IDs/TMDB links and genre IDs across expiry/termination. Provider-only metadata becomes neutral/null; only provider genre associations are removed and verified orphan labels are neutralized. Legacy director fields remain. No movie, genre or member row is deleted by retention.

Tests cover read-only preview, unknown/legacy protection, pre-expiry failed refresh retention, expired failure retirement, successful refresh and later recovery, durable lost-response replay without refetch, four concurrent UUID replays producing one audit, the initial-audit/preflight race, invalid identity refusal, stale plans including mutations during provider fetch and newly registered orphan genres, database-trigger failure after an earlier update with complete rollback, no-network termination and no scheduled resumption. Actual CLI tests verify exclusive report paths, payload/token exclusion and preservation/termination evidence. Each scope is disposed afterward; retained reports are ignored under `.superpowers/`.

The localhost preview uses disposable synthetic movies/member/review and blank Google credentials. It adds no authentication bypass. This turn did not rebuild or rerun browser journeys because normal application/runtime/schema/dependencies are unchanged; the serving build is the previously verified phase5 production build. Current lint/types/unit/database evidence applies to the new operator. Prior19 Chromium journeys/build are historical evidence, not claimed as new runs.

## Remaining gates and rulings

Production provenance/backfill, scheduling, worker/in-flight termination, Next/image caches, exports/backups, account-specific terms, actual staging preservation, hosted CI, real OAuth/TMDB and public launch remain unverified/unauthorized. No source LICENSE was added. This is a successful local database-mechanism rehearsal, not automatic production compliance.

The reviewer declined to judge five areas outside this patch. Rulings: production provenance/backfill and real-data preservation require separately authorized staging work; public activation/scheduling/worker coordination remain blocked; shared caches/images/exports/backups/restore expiry need a separate design and evidence; licensing/account terms stay pending despite the noncommercial initial-release intent; real OAuth/live-provider acceptance and new browser/build acceptance are not inferred from this operator-only work. Cost: these gates must be resolved before public release. None is waived or claimed complete.

Ruling: keep provenance/audit/control inside owned disposable schemas and leave the production model/runtime unchanged; cost is a separate reviewed activation/storage/cache/backup integration before release. Keep the existing branch/worktree/cluster/backups and prior scratch intact. Preview is intentionally left running for the owner's review while its process lives.
