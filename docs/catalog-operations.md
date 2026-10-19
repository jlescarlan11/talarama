# Catalog integration and reviewed migration

Phase 1 provides server services and operational tools. Phase 2 adds discovery screens, distinct TMDB detail routes and authenticated import-first save actions. Current local movie URLs continue to work. No search/detail read imports records.

## Configuration and ownership

Set `TMDB_READ_TOKEN` to a TMDB API Read Access Token in the ignored local `.env`. Never use a `NEXT_PUBLIC_` variable. Use the official [application authentication guide](https://developer.themoviedb.org/docs/authentication-application). The token is sent in an Authorization header to a fixed HTTPS API origin. No arbitrary URL, redirect, language, append endpoint or query parameter can be passed through the public client methods.

`app/lib/tmdb/client.ts` validates bounded input, streams at most 2 MB, enforces a five-second deadline across connection and body, maps safe errors, excludes adult list results and rejects adult direct details. It normalizes missing year/runtime/artwork and keeps TMDB scores on their own ten-point scale. Image URLs use raster paths and fixed w500/w1280 sizes following [TMDB image basics](https://developer.themoviedb.org/docs/image-basics). Existing legacy image hosts remain configured. No artwork or upstream metadata is licensed by the repository's eventual source license; attribution and terms must be checked before launch.

Server application code uses `app/lib/tmdb/server.ts`: Next's shared result cache wraps validated normalized results for search 300 s, discovery 3600 s, details 86400 s. Raw fetches use `no-store`, so a malformed HTTP 200 cannot poison retries. The bounded 200-entry process cache coalesces pending calls and evicts failures. Next may serve a previous valid value while refreshing; it never changes personal data. `unstable_cache` is retained because this existing application does not enable Cache Components. Operational CLIs use only the process cache and require no Next request context.

`MovieService.searchCatalog`, `discoverCatalog` and `getCatalogDetail` read provider metadata. `getLocalSnapshot` reads preserved local metadata even if TMDB is unavailable. `importMovie` and `refreshMovie` are **internal server primitives**. Phase 2's `POST /api/movies/import` authenticates before invoking import and accepts only a validated TMDB ID. Provider input is fetched again from the trusted boundary, never accepted from browser-supplied title/genre/artwork fields. Imports converge by unique TMDB identity with bounded serializable transaction retries; metadata refresh fetches successfully before writing anything.

The public `/api/catalog` read handler validates mode/page/year/genre inputs and returns safe retryable provider errors. It never imports. Search supports title/year; popular discovery supports genre/year. Favorite and watchlist POST requests now add idempotently; DELETE removes idempotently. Callers must use explicit intent rather than retrying a toggle. Personal state is never shared-cached. A saved local movie remains actionable without live provider credentials. Manual POST `/api/movies` and PATCH/DELETE `/api/movies/[id]` return 401 when anonymous and 403 when signed in. Former create/edit pages guide members to discovery.

## Additive migration and recovery

1. Before any populated environment migration, take a PostgreSQL `pg_dump` backup in secure storage and restore it into an isolated staging database. Capture table counts and relationships there. Never commit exports or credentials.
2. Review the new phase-1 SQL. It adds nullable metadata, nullable year/runtime, unique nullable TMDB identity and a durable mapping audit table. It removes descriptive title/year uniqueness, retaining all existing movie IDs and foreign keys. Both the historical constraint form and Prisma-created standalone index form are handled. No movie is merged, removed or mapped by the schema migration.
3. Apply through `prisma migrate deploy` against the reviewed staging copy, compare records and associations, and rehearse backup restoration. Tests use a separately named `_test` database and random schemas. `PG_BIN` can point to a PostgreSQL binary directory; Windows defaults to PostgreSQL 17, other platforms use PATH. `npm run test:integration` exercises actual old SQL, fixtures, the additive SQL, and `pg_dump`/`psql` restoration. `npm run test:migrations` replays all 25 migrations and checks drift.
4. Do not reset a populated database. If migration history is absent, compare the actual schema against the exact corresponding committed historical schema before any explicit baseline. The local scratch development database was verified against `1b931fe`, backed up under ignored `.superpowers/`, then its 24 matching historical migrations were baselined before phase 1 deployed. This is not a blanket production-baseline instruction.
5. Recovery uses the verified pre-migration backup in a separate database, followed by identity/relationship checks and a reviewed cutover. Do not reverse the title/year change by adding uniqueness after distinct external releases have been imported.

## Dry-run matching

The CLI refuses remote databases and names not ending `_dev` or `_test`. If set, `DIRECT_URL` must identify the same local database/schema. There is no production override. CLI files are exclusive new outputs with mode 0600 where supported; keep them in ignored `.superpowers/` and secure them with Windows filesystem permissions as needed.

```text
npm run catalog:match -- .superpowers/catalog-report.json
```

This selects at most 1000 unmatched local movies, searches by title with optional known year, and writes suggestions, unmatched rows, cross-row collisions and whether more candidate pages exist. It performs no catalog writes. It deliberately chooses no match even when only one candidate exists. A missing token or provider failure stops report creation; an empty/partial output is not a completed report. Use a new filename when retrying.

Review candidates using external details and available evidence, including remakes, alternate titles, missing dates and identical title/year releases. Do not infer identity from a title/year coincidence. Retain ambiguous/unmatched movies and their URLs. A report is not an apply manifest.

## Explicit reviewed apply

Prepare a separate JSON manifest, containing only mappings a person has verified:

```json
{
  "version": 1,
  "reviewedBy": "reviewer identifier",
  "mappings": [
    { "localId": "existing-local-id", "expectedTitle": "Reviewed title", "expectedYear": 2020, "tmdbId": 123 }
  ]
}
```

`expectedYear` can be null. Duplicate local IDs/targets are rejected. No mapping is auto-generated for apply.

```text
npm run catalog:apply -- --reviewed .superpowers/reviewed.json .superpowers/catalog-audit.jsonl
```

Apply reserves and syncs a PREPARED journal before writes, validates every target through the same non-adult provider boundary, checks each local title/year is unchanged, then applies identities and creates `CatalogMappingAudit` atomically. Existing descriptions, artwork, director fields and personal relationships remain intact. A stale local row, already mapped identity or target assigned to another local row fails the batch. There is no automatic merge. Reapplying the same manifest produces an empty change audit; it cannot duplicate movies or reverse an identity.

The COMMITTED journal line includes the durable audit ID and before/after identities. If file export fails after commit, recover the transaction record from `CatalogMappingAudit` before retrying. A PREPARED file alone is not proof of rollback: check the durable database audit after a crash. Audit rows deliberately survive future catalog deletion. Mapping rollback is a separately reviewed operation using the audit and backup; no destructive rollback command is provided.

No production mappings were applied. Live TMDB checks require a configured token; synthetic provider fixtures do not prove current upstream service availability or terms compliance.
