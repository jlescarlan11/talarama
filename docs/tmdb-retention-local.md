# Local TMDB retention rehearsal

Owner decision on 2026-10-19: the initial release is noncommercial; licensing remains pending. Authorized work is limited to disposable local fixtures, preserving existing IDs/member data, with no push or deployment.

## Run it

Use the documented Node22/npm11 setup and a loopback PostgreSQL database ending `_test`, without query/schema overrides in `TEST_DATABASE_URL`. No development URL fallback or real provider credentials are used.

```text
npm run retention:rehearse -- .superpowers/NEW-retention-report.jsonl
```

The report must be a new path. It is reserved exclusively before database work. The tool creates its own random `retention_<UUID>` schema, initializes current Prisma tables and adds fixture-local provenance/audit/control tables. There is no option to attach to an existing schema or enable production access. The normal web app does not import this operator. No production schema migration or runtime retention job is added.

It seeds invented movies/member/account/diary/library records and exercises the real trusted TMDB client through a synthetic fetcher. Normal completion removes only its generated schema in `finally`; source, development schemas, cluster/backups and prior scratch remain intact. The JSONL report remains. Partial reports are not successful evidence. Hard interruption may leave the generated schema behind: inspect that exact schema/report before any separately reviewed cleanup; never wildcard-drop schemas or remove the guards.

## Policy exercised

| State | Scheduled outcome |
| --- | --- |
| Unmatched legacy metadata | Retain unchanged. |
| Mapped metadata without verified source | REVIEW; TMDB ID and age alone prove no ownership. |
| Verified provider metadata younger than150days | Keep. |
| Verified metadata150–179days old | Try trusted refresh; a known upstream failure retains the snapshot until expiry. |
| Verified metadata180days or older | Try refresh; a known upstream failure retires provider fields. |
| Previously expired/retired metadata | Later successful refresh restores fresh metadata using the same movie ID. |
| Terminated scope | No scheduled fetching, source registration or automatic resumption. |

The150/180-day elapsed UTC defaults are conservative rehearsal windows against the previously reviewed provider limit, not account-specific legal approval. Null/invalid/future acquisition dates, unknown ownership and changed fingerprints require review. Unexpected programming/provider exceptions and invalid normalized details abort; they do not silently authorize retirement. A trusted transport error/invalid upstream response counts as refresh failure under the age policy.

Termination retires known provider metadata regardless of age, makes no provider call and persists a stop state atomically with the audit. Unknown/legacy content remains untouched and explicitly unresolved. Resuming a terminated scope is unsupported.

## Preservation and transactions

Explicit synthetic-source registration stores fingerprints/acquisition times rather than a second metadata payload. Preview writes nothing and returns IDs, states, times, hashes and actions. It does not automatically register existing data.

Execution requires the reviewed plan, reviewer label and stable UUID. Plans expire after five minutes. The plan binds movie metadata, genre identities/ownership/acquisition times/references/actions and the termination control state. Refreshes are staged outside a serializable transaction. Inside it, fingerprints/policy are recomputed; changed metadata or genre inventory rejects the whole batch. Genre retirement considers only reviewed candidates. Concurrent refresh/manual changes win over an old plan. Database failure rolls back metadata writes and durable outcome together.

Retirement replaces verified provider title with a neutral placeholder and clears description/year/runtime/poster/backdrop/credits/score/acquisition time plus provider genre associations. Movie/Genre rows and IDs, external identity links and legacy director fields remain. Verified provider-only orphan genre labels become neutral placeholders with their IDs retained. Unknown/stale/referenced genre labels require review. Users, Google accounts, diary IDs/text/ratings/visibility/exact timestamps, favorites and physical `WatchedList` relationships remain unchanged.

Identical UUID+plan retries read the original durable audit before fetching/writing, including concurrent requests. A matching commit that occurs after the initial audit miss is recovered when later preflight/provider/transaction checks fail. UUID reuse with another plan fails. Lost-response and deterministic concurrent-commit tests verify recovery of the original result without another provider call. PREPARED alone is not proof of rollback after interruption: its schema/request ID identifies the fixture audit to inspect. Never guess the result or reuse its UUID for another plan.

Reports/audits contain safe IDs, hashes, times and outcomes, never old movie payloads, account tokens or member text. The final VERIFIED journal line requires complete member/identity equality and exact `2020-02-29T23:30:00.000Z` preservation through expiry/termination.

## Remaining production gates

This verifies a local database mechanism, not public-release compliance. Production provenance/backfill review, scheduling/monitoring, account-specific terms, Next shared-result invalidation, optimized images, exports/backups and restore-time expiry remain separate work/authorization. Normal runtime reads/imports retain the approved behavior.

The factory cannot attach this mechanism to real data. Before production activation, review a provenance/storage design against actual staging data. Unknown/shared fields must not be deleted to make a report green. Actual termination also needs all provider-consuming workers stopped and in-flight requests/cache/export handling coordinated. The fixture control demonstrates persistent stopping within this tool only. See [release gates](deployment.md#release-gates-still-requiring-acceptance).

## Localhost preview

The current app is available at `http://127.0.0.1:3000` while the owned preview process runs. It uses a separate `preview_<UUID>` schema, invented movies/member/review, blank Google credentials and test-only provider transport. Synthetic text identifies the fixtures. It demonstrates the interface; it establishes neither real sign-in nor live TMDB acceptance. No authentication bypass is added. Its schema is separate from every retention test.
