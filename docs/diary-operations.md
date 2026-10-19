# Diary dates and preservation

Phase 3 adds private diary state without converting old timestamps or changing movie, account, user, log, favorite or watchlist identities. `WatchlistEntry` maps to the existing physical `WatchedList` table. History comes from diary entries. Ratings remain integer 1–5, or null for new/edited unrated logs; no scale conversion occurs. Existing reviews/rating values are untouched and existing entries receive PRIVATE visibility.

## Local and staging migration

Back up a populated environment using `pg_dump`, restore into an isolated staging database, inventory IDs/rows/accounts/foreign keys, review SQL, and apply additive migrations with `prisma migrate deploy`. Compare all old fields and links after migration and rehearse restoration before applying to the actual environment. Never reset populated data or replay old destructive migrations against it. See the existing migration guidance for reconciling missing historical migration metadata.

The phase-3 schema migration changes only shape/defaults/indexes. It deliberately leaves all `watchedDate` values intact. New web writes store the selected calendar date at UTC midnight; responses use YYYY-MM-DD. Displays/month groups use UTC so viewer timezones do not shift dates. Until a reviewed conversion, a legacy non-midnight timestamp displays its UTC calendar day while its original value is retained.

## Date preview

Local operator tools require a loopback database ending `_dev` or `_test`, and matching DIRECT_URL. There is no production override. Keep backups/reports in ignored secure storage. Reports include personal record IDs/timestamps and must not be published.

```text
npm run diary:dates -- preview .superpowers/new-date-preview.json
```

This performs reads only and writes a new exclusive report, including every original timestamp, UTC date, saved-user-zone date and an ambiguity flag. Non-midnight timestamps are ambiguous even if both candidate dates agree: the original timezone/intent is not established. UTC midnight already follows the new convention. A null saved zone is reported as UTC fallback. The tool refuses more than 1000 records rather than silently producing a partial report; use a separately reviewed batch/export workflow for larger data. A failed/partial output is not a successful preview; preserve it for diagnosis and choose a fresh filename.

The development database was empty at phase 3. The actual preview had zero rows; no date conversion was applied there. Representative ambiguous dates were rehearsed only in guarded disposable schemas.

## Explicit reviewed conversion

Do not generate conversion mappings automatically from candidates. Review the preview alongside original evidence. Retain uncertain rows unchanged. Back up and restore first. Prepare a separate manifest containing only reviewed entries:

```json
{
  "version": 1,
  "reviewedBy": "reviewer identifier",
  "mappings": [
    {
      "id": "existing-entry-id",
      "original": "2020-02-29T23:30:00.000Z",
      "date": "2020-03-01"
    }
  ]
}
```

```text
npm run diary:dates -- --reviewed .superpowers/reviewed-dates.json .superpowers/new-date-audit.jsonl
```

The exclusive journal is reserved, originals written as PREPARED and synced before writes. A transaction compares every original timestamp and current update version, then changes dates only. Stale/missing records, invalid dates and duplicate IDs reject the entire batch. No diary content, identity, visibility, favorites or watchlists are changed. COMMITTED output records old/new dates. Preserve both backup and manifest/audit.

An interrupted process can leave an uncertain commit outcome. PREPARED alone does not prove rollback. Compare every current timestamp against originals and intended midnight values and inspect the backup before making any retry/recovery decision. A repeated successful manifest fails stale-original validation rather than reconverting records. There is no automatic reverse migration. Restoration uses the preserved backup into a separate database and reviewed cutover.

## Web contract and privacy

Authenticated create/edit payloads share movieId, watchedDate YYYY-MM-DD, rating null or integer1–5, trimmed review0–2000, isRewatch, containsSpoilers, visibility PRIVATE/PUBLIC and UUID clientRequestId. No userId is accepted. New draft IDs remain stable through response failures; same owner/request ID returns the original log. Different request IDs permit same-day rewatches. Editing preserves the original retry identity. Saving removes the logged movie from the owner's watchlist in the transaction; rollback preserves both, replay performs no further removal, and delete does not restore watchlist.

User.timeZone is nullable only to distinguish uninitialized users. The form initializes it once from the browser's valid IANA zone (UTC if unavailable). The server validates future dates against the saved zone, with UTC fallback for requests before initialization. Reopening the form in another browser zone cannot overwrite it. Profile timezone editing belongs to phase 4.

Entries default PRIVATE. PUBLIC currently records intent only: phase 3 publishes no diary content and exposes no diary counts/ratings through catalog/detail/library queries. Profile publication/eligibility and community controls must launch before any such reads are added. Owner diary APIs are no-store and filter by session user ID; unknown/other-owner entry IDs share a generic 404. Cursor pages order watchedDate descending then ID descending, retain all same-date viewings, and never use a supplied cursor to read another user's entry. New/deleted/edited records can move between requests; pagination is a live view, not a cross-request snapshot.
