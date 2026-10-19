# Database setup and migration safety

## Historical baseline

The checked-in historical chain produces the current schema on an empty database. It contains destructive table/column replacements and a final `DELETE FROM "Movie"` deduplication. Never replay these on a populated database that has not applied them. Never run `prisma migrate reset` against member data.

Phase 0 replayed all 24 migrations in disposable PostgreSQL and compared the result to `prisma/schema.prisma`: no drift. The schema remains unchanged. `npm run test:migrations` repeats this check in a generated test schema.

## New empty development database

Create a dedicated empty database. Configure DATABASE_URL and DIRECT_URL to it in `.env`, then run `npx prisma db push` (without `--accept-data-loss`). This initializes the **current schema**, not the destructive historical chain. This is a development bootstrap only; it does not establish migration history for production. Start with no catalog, or add a development-only movie using the existing signed-in form. Do not copy production records/tokens into fixtures.

## Disposable integration database

Use PostgreSQL 17 and create a separate empty database whose name ends in `_test`. Set TEST_DATABASE_URL in `.env` or the process environment; the test runner checks this suffix and refuses to use DATABASE_URL implicitly. Run `npm run test:integration`. Tests create/drop their own unique PostgreSQL schema inside that test database, initialize it from the checked-in Prisma schema, and remove it afterward. They do not reset the public schema. The suite exercises real Prisma and HTTP handlers with synthetic authentication, including account links, favorites, watchlist, diary create/edit/delete, and ownership. It does not contact Google.

Browser tests also create an isolated schema and run a local server on port 3100 with test-only authentication settings. The signed browser journey creates its JWT locally from a fixed test secret; that secret is never used by the development or production app. The fixture user has a synthetic Google provider association, not real OAuth tokens. Do not expose the browser-test server publicly.

## Before any populated-database migration

1. Take and restore a backup into an isolated staging database. Inventory migration records, schema, all user/account/movie IDs and relationship counts.
2. Compare staging against the current schema and against the result of the historical chain. Do not infer production state from either repository artifact.
3. If production already matches the current schema, prepare a squashed baseline generated from the schema for future installations. Review and mark it applied only after exact comparison. Retain old migrations as an archive; do not edit already-applied checksums.
4. If drift exists, write a separate reviewed reconciliation migration for that **observed** state. Retain IDs and account provider associations, add/backfill columns before imposing constraints, and report duplicate title/year rows instead of deleting/merging them. Do not delete role data or other extra columns merely to make a diff empty.
5. Rehearse reconciliation and restore with representative legacy data. Compare IDs, counts, orphan checks, account sign-in, and diary relationships before and after. Only then plan deployment as a separate authorized action.

Phase 0 deliberately does not invent an automatic reconciliation against an unknown populated database.

## Phase 3 additive diary migration

The current chain contains26 migrations. The phase3 migration makes rating nullable, adds PRIVATE-default visibility, flags/retry identity and nullable saved timezone, and maps Prisma WatchlistEntry to physical WatchedList. No log dates, old ratings/text, IDs or relationships are converted/deleted. [Diary operations](diary-operations.md) documents preview-first date handling, explicit reviewed manifests, uncertain-commit recovery and backup/restore evidence. The original phase1 development baseline/history remains intact; phase3 was deployed locally after a new backup, without reset. Production/staging application remains a separate reviewed operation.

## Phase 4 additive community migration

The current chain contains 27 migrations. Phase4 adds unpublished/private-favorites defaults, bio, member/admin role, visible moderation state, reports/audits and PostgreSQL mutation buckets. It does not normalize usernames, publish profiles, convert dates or modify IDs/account links/content relationships. [Community operations](community-operations.md) documents read-only username previews, explicit reviewed apply, durable audits and operator administrator bootstrap. Populated historical fixtures preserve a mixed-case invalid legacy handle, synthetic account token values and exact non-midnight log timestamp through actual SQL and pre/post backup restoration. Local development was backed up to `.superpowers/phase4-pre-migration-dev.sql` before additive deploy; all eight existing content tables were empty and unchanged. No username mapping was applied. Unknown production preservation still requires its own staging copy and reviewed evidence.
