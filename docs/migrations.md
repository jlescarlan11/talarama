# Database setup and migration safety

## Historical baseline

The checked-in migrations predate the current schema and contain destructive table/column replacements and a final `DELETE FROM "Movie"` deduplication. Never replay these on a populated database that has not applied them. Never run `prisma migrate reset` against member data.

Phase 0 tests history in a newly created disposable PostgreSQL database, then compares its result to `prisma/schema.prisma`. The schema remains unchanged in phase 0; see phase-0-verification.md for the measured drift.

## New empty development database

Create a dedicated empty database. Configure DATABASE_URL and DIRECT_URL to it in `.env`, then run `npx prisma db push` (without `--accept-data-loss`). This initializes the **current schema**, not the destructive historical chain. This is a development bootstrap only; it does not establish migration history for production. Start with no catalog, or add a development-only movie using the existing signed-in form. Do not copy production records/tokens into fixtures.

## Disposable integration database

Use PostgreSQL 17 and create a separate empty database whose name ends in `_test`. Set TEST_DATABASE_URL in the process environment; the test runner checks this suffix and refuses to use DATABASE_URL implicitly. Run `npm run test:integration`. Tests create/drop their own unique PostgreSQL schema inside that test database, initialize it from the checked-in Prisma schema, and remove it afterward. They do not reset the public schema. The suite exercises real Prisma and HTTP handlers with synthetic authentication, including account links, favorites, watchlist, diary create/edit/delete, and ownership. It does not contact Google.

## Before any populated-database migration

1. Take and restore a backup into an isolated staging database. Inventory migration records, schema, all user/account/movie IDs and relationship counts.
2. Compare staging against the current schema and against the result of the historical chain. Do not infer production state from either repository artifact.
3. If production already matches the current schema, prepare a squashed baseline generated from the schema for future installations. Review and mark it applied only after exact comparison. Retain old migrations as an archive; do not edit already-applied checksums.
4. If drift exists, write a separate reviewed reconciliation migration for that **observed** state. Retain IDs and account provider associations, add/backfill columns before imposing constraints, and report duplicate title/year rows instead of deleting/merging them. Do not delete role data or other extra columns merely to make a diff empty.
5. Rehearse reconciliation and restore with representative legacy data. Compare IDs, counts, orphan checks, account sign-in, and diary relationships before and after. Only then plan deployment as a separate authorized action.

Phase 0 deliberately does not invent an automatic reconciliation against an unknown populated database.
