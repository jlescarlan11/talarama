# Community publication and moderation

Phase 4 extends the existing local application. Nothing is deployed or publicly launched. All existing users default to an unpublished profile, private favorites and MEMBER role. Existing diary visibility and values are retained; PUBLIC intent alone cannot publish an unpublished member's entries.

## Privacy contract

An entry is publicly eligible only when its owner has a published profile, the entry is PUBLIC and moderation state is VISIBLE. `publicEntryService.ts` owns the predicate and explicit public field selection. Profile, feed, text-review URLs, movie reviews, public statistics and community ratings use it. Public DTOs exclude email, account records/tokens, viewing dates, private counts and watchlists. Favorite movie identities appear only with the separate favorites opt-in.

Owners use `/settings/profile` even when unpublished. The owner API authorizes by session ID and accepts only username, display name, bio, IANA timezone and the two publication switches. Role, email, ID and image injection are rejected. Session updates reload persisted display values from the trusted member ID. Settings do not expose a role selector.

Community pages/APIs are dynamic/no-store. Client public views start without cached member content and re-fetch when mounted/resumed, focused, made visible, or notified of a publication mutation. First-party profile/diary/moderation mutations announce same-window and cross-tab changes. Failed rechecks clear previous content instead of retaining a stale public review. An already received copy cannot be recalled from someone else's device; the guarantee is exclusion from subsequent eligible reads and refreshed app views. Generic member/review metadata stays noindex in this release, including unavailable resources. There is no sitemap containing private resources.

Public activity uses creation order and 20-entry keyset pages with descending `(createdAt,id)` boundaries. A deleted cursor entry does not invalidate its ordering boundary. The live feed is not a cross-request snapshot. Rating-only and unrated logs are activity; only nonempty text entries have `/reviews/[id]` URLs. Native spoiler disclosure requires an explicit keyboard/touch action.

Movie community ratings use the newest eligible **rated** entry per member/movie, ordered creation time then ID. A later unrated/private/hidden entry does not erase an older still-eligible rating. Removing/hiding/making private the counted rating falls back to the next eligible rating. Unpublishing removes that member entirely. Average `/5` and member count are separate from TMDB `/10` and provider votes.

## Existing username review

No schema migration normalizes existing handles. The loopback development/test operator tools require matching DATABASE_URL/DIRECT_URL and names ending `_dev` or `_test`; there is no production override. Keep all exports/journals/backups in ignored protected storage.

```text
node --env-file-if-exists=.env --conditions=react-server --import tsx scripts/username-preview.ts preview .superpowers/new-username-preview.json
```

The exclusive report contains user IDs, original handles, deterministic proposed handles and changed flags. Existing valid lowercase handles retain priority; collisions receive bounded numeric suffixes. Null/invalid/reserved handles receive a neutral proposal. Reports refuse more than 1000 rows so a partial result cannot masquerade as a complete review. Preview never writes users or automatically approves a proposal. A failed partial report is not a completed preview; keep it for diagnosis and select a fresh output path.

Back up and restore first, review populated originals and collisions, and write a separate explicit manifest:

```json
{
  "version": 1,
  "reviewedBy": "operator identity",
  "mappings": [
    { "id": "existing-member-id", "original": "Original.Handle", "username": "reviewed_handle" }
  ]
}
```

```text
node --env-file-if-exists=.env --conditions=react-server --import tsx scripts/username-preview.ts --reviewed .superpowers/reviewed-usernames.json .superpowers/new-username-audit.jsonl
```

The tool reserves an exclusive journal and syncs PREPARED before writes. A transaction checks every exact original, applies only reviewed names and persists `UsernameMappingAudit`. Uniqueness conflicts, duplicate mappings, stale originals or invalid handles roll back the batch. IDs, account/provider links and all content relationships remain intact. Collision chains/swaps that conflict with populated handles require separate reviewed stages; the tool refuses to guess or overwrite another account. COMMITTED records the durable audit. PREPARED alone does not prove rollback: inspect the DB audit and compare original/intended handles before retrying. Never reset a populated database or blindly reverse the migration.

New signups never derive public handles from email prefixes. After account creation, neutral `member_` handles use database-backed unique-conflict retries. Users choose a valid lowercase 3–20-character handle in settings; only `[a-z0-9_]+` is accepted and admin/api/me/settings/support are reserved.

## Administrator bootstrap and reports

For an explicitly chosen **existing** local development/test member ID:

```text
node --env-file-if-exists=.env --conditions=react-server --import tsx scripts/set-admin.ts existing-member-id --grant-admin
```

The guarded operator command updates only that persisted user's role and adds an operator grant audit. There is no browser bootstrap and synthetic session role claims are ignored. Production bootstrap and deployment require a separately reviewed phase-5 operation.

Signed-in members can report an eligible text review with 1–500 trimmed characters. A database unique key permits one report per reporter/entry; retries converge. `/admin/reports` and all admin API actions reauthorize against the persisted ADMIN role. The queue uses stable creation/ID cursor pages of 100 reports, keeping old unresolved and resolved reports reachable. Hiding/unhiding changes visibility to visitors without deleting the owner's diary or changing their PRIVATE/PUBLIC intent. Resolving marks the report resolved. Each action writes a `ModerationAudit` in the same transaction. Audit IDs intentionally survive later report/entry/account deletion. Owners see “Hidden by moderation” beside their diary entry.

## Durable mutation limits

`MutationBucket` uses PostgreSQL's clock and a conditional atomic upsert, shared by all application processes. Limits are fixed ten-minute windows per member: 30 diary creates/updates/deletes, 60 combined favorite/watchlist writes, 5 reports. At a window boundary a fresh bucket becomes available. Invalid/rejected attempts can consume admission, which prevents bypass through failing mutations. Replaying an already committed create is checked before quota admission and never repeats watchlist removal. A create admitted concurrently rechecks the original request key after a conflict/error; no new request UUID is invented. Library POST/DELETE retain add/remove intent.

Expired bucket cleanup deletes at most 100 rows per admission, using the expiry index. HTTP 429 includes a positive `Retry-After` header and `retryAfter` seconds in its no-store JSON. Diary/profile/report drafts remain in their forms after errors. Wait for the retry interval and retry the same intended operation; do not rotate a diary UUID to recover an uncertain submission. The phase-3 original-submission/latest-draft recovery rules remain in force.

## Migration and verification limits

The additive phase4 SQL adds publication/profile/role fields, moderation state, reports/audits and atomic buckets. It preserves usernames, IDs, exact legacy timestamps, account links and physical `WatchedList`. Historical fixture tests seed before new SQL, then compare account/content relationships after actual migration and pre/post logical backup restoration. Development backup `.superpowers/phase4-pre-migration-dev.sql` precedes local deploy; its eight legacy content tables were empty, the username preview had zero rows, and no mapping was applied. This does not establish preservation for any unknown production database.

The existing TMDB cached provider/import boundary and diary contracts are unchanged. Live TMDB and real Google OAuth remain unverified without real credentials. Browser sessions and provider transport fixtures are synthetic. Navigation may still log Next's previously documented response-stream cancellation; passing journeys do not establish a console-error-free runtime.

Browser verification disables only persistent **compiler** disk caching via `TALARAMA_DISABLE_COMPILER_CACHE=1` to avoid filling constrained local disks. Use the same optional flag for local build verification; it does not change metadata caching, publication eligibility or authentication. Never remove backups/cluster/planning artifacts to recover compiler disk space.
