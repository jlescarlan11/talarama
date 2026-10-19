# Deployment runbook — proposed, not executed

This phase authorizes local readiness only. No preview/production deployment, origin/callback change, cloud settings, production migration, hosted CI run or tester invitation has occurred. Complete the gates below under separate owner authorization before public launch. [Phase5 verification](phase-5-verification.md) separates measured local evidence from external acceptance.

## Proposed runtime configuration

Use a Node server supporting the installed Next 16 release, Node 22 and npm 11; build with `npm ci`, `npx prisma generate`, `npm run build`, then `npm start`. Static export is unsuitable for authenticated routes, Prisma and dynamic privacy reads. Keep test preloads, synthetic secrets and fixture data out of the deployed process. `NODE_OPTIONS` must never reference `tests/e2e/tmdb-fixture.cjs` there.

| Setting | Proposed initial value / acceptance |
| --- | --- |
| Environment separation | Separate development, preview and production databases, OAuth clients, provider tokens, auth secrets and origins. Preview never points to production. |
| Origin | Exact HTTPS `NEXTAUTH_URL`; Google web origin matches; callback is that origin plus `/api/auth/callback/google`. No invented domain is committed. Review trusted proxy/forwarded-host handling on the chosen host. |
| Secrets | Host secret store only; server-only TMDB token and Google client secret, random strong unique NextAuth secret. Never `NEXT_PUBLIC_`, logs, build screenshots or repository variables visible to clients. |
| Database | `DATABASE_URL` pool connection; `DIRECT_URL` direct connection to the same DB for reviewed migration. TLS verification and restricted network access; bounded connection pool. |
| Pool budget | Start with at most 5 Prisma connections/process and 10s acquisition timeout; cap replica count so total pools plus migrations/backup reserve stay below DB connection capacity. Confirm chosen pooler's Prisma6 compatibility and load-test before applying URL options. |
| Public discovery | At trusted hosting edge, proposed 60 requests/minute/client IP, burst 10, and a global upstream budget. Return429 with Retry-After. Hash/minimize retained IP data. Validate proxy source to prevent spoofed client identities. Tune on measured traffic. |
| Other public reads/auth | Proposed 120 reads/minute/client, stricter auth abuse controls reviewed with provider; exclude static assets from API budgets. Do not cache member/community payloads at the CDN. |
| Request/body bounds | Proposed64KiB JSON limit at edge for application mutations and100KiB URL/header cap or lower host-supported limits; verify Google callback/cookies remain functional. Existing server-action2MiB bound is not a route-handler JSON limit. |
| Timeouts | Existing TMDB 5s boundary; proposed 30s host request budget and 10s DB statement budget after measuring imports/transactions. Migration/backup jobs use separate reviewed limits. |
| Logging | Status, safe error code, route template, duration and random request ID. Exclude reviews, biographies, emails, dates, full URLs/query strings, authorization/cookies, provider responses, tokens and DB URLs. Restrict/redact stack traces; proposed 14-day operational retention, reviewed deletion/access rules. |
| Monitoring | Alerts for5xx, quota spikes, upstream timeout/error rate, pool waits, failed backup/restore and metadata age; never use private content as telemetry. Known navigation response-stream cancellations need diagnosis before a console-clean claim. |
| Backups | Proposed encrypted daily full backup, seven daily/four weekly retention with provider-content expiry review; least-privilege access. If supported, separately validate PITR. Proposed RPO 24h/RTO 4h are objectives until rehearsed with actual data. |
| Cache/retention | Metadata TTLs300/3600/86400s; dynamic/no-store personal/community reads. Persistent provider snapshots, images and backup retention need the blocking [TMDB process](tmdb-attribution.md). |

These are reviewable recommendations, not settings already configured or capacity guarantees. See the installed Next guides under `node_modules/next/dist/docs/01-app/01-getting-started/17-deploying.md` and [official Node deployment guidance](https://nextjs.org/docs/app/getting-started/deploying).

## Preview acceptance (requires authorization and genuine credentials)

1. Select a host/HTTPS preview origin and separate empty/authorized restored DB. Obtain real development Google and TMDB credentials; there are no old credentials to recover. Configure exact callbacks separately. Do not put them in test fixtures or paste them into logs/chat.
2. Run the declared checks in the approved CI environment. The committed workflow uses disposable fixtures and read-only repository permissions; it has no deploy step. A local Windows run does not prove Linux/hosted success.
3. On preview, search for a non-seeded title, inspect metadata, sign in with real Google, save/import, log/edit/delete and sign out/in. Verify an existing linked account still has its same ID/history. Check callback, secure cookies and selected-movie return URL. Fixtures cannot close this gate.
4. With two consenting test accounts, verify owner-only diary; explicit profile/entry publication; profile unpublish/removal from visited feed/profile/review/movie/count/rating pages; spoilers, reports, moderator actions and 429 draft recovery. No production fake activity.
5. Verify360/768/1440, both themes, keyboard/dialog focus, reduced motion, upstream slowdown/failure and local snapshot fallback. Review attribution/actual terms, metadata origin and generic member/review noindex. Verify request/pool/log/backup settings and no private cache headers at the real edge.

## Actual staging migration and recovery gate

Requires an expressly authorized copy of the actual populated environment, protected storage and an owner-reviewed migration/change window. The local fixtures do not supply that data or authorization.

1. Freeze the reviewed code revision and inventory migration history/schema first. Back up with matching PostgreSQL tools, e.g. `pg_dump --format=custom --no-owner --no-acl --file=<protected-new-backup>` using process environment/service credentials (never a password in command arguments). Record checksum/tool version, counts and sorted IDs/account provider associations/library/genre links, original diary timestamps/values and orphan checks. Protect exports as personal data.
2. Restore to a separately named isolated staging database with `pg_restore --exit-on-error --no-owner --no-acl --dbname=<isolated-db> <backup>`. Never run restore with `--clean` against the source. Inspect schema/history before `prisma migrate deploy`. Unknown drift/missing history needs an observed-state reconciliation, not a reset or a blanket baseline.
3. Apply only reviewed additive SQL; compare every original field/ID/link and exact legacy timestamp, plus counts and foreign keys. Public defaults remain unpublished; no guessed title/date/handle mappings. Review explicit preview reports separately. Run real account/provider and privacy smoke checks with permission.
4. Restore the pre-upgrade backup again to another isolated destination and rehearse upgrade; also restore a post-upgrade backup and compare. Time the recovery and test secret/config restoration. Record exact expected/actual comparisons, diffs and RPO/RTO. A backup file existing is insufficient.
5. Have the owner accept rehearsal evidence, retention plan and production SQL before scheduling production. Stop writes or use a reviewed consistent-cutover procedure. Rollback means restore to a separate destination, validate and explicitly authorize cutover; redeploying old code cannot undo schema/data writes. Keep incident evidence and reconcile writes after the backup. Never reverse by resetting or deleting member rows.

Local tools intentionally refuse non-loopback/non-dev-test destinations. Do not remove their guards to perform production work; obtain a separately reviewed operator procedure.

## Release gates still requiring acceptance

| Gate | Required evidence |
| --- | --- |
| Licensing | Actual rightsholder approval and precise copyright line; [proposal](licensing-proposal.md) remains inactive. |
| TMDB | Account-specific accepted terms, noncommercial/commercial eligibility, implemented retention/termination process, real-token smoke. |
| Hosted CI | Successful run of this revision on fresh Linux runner; no such run triggered here. |
| Preview/auth | Authorized host, actual HTTPS origin/callback config and real Google/linked-account journeys. |
| Preservation | Authorized actual staging copy, reviewed migration history/SQL and identity/relationship/timestamp/restore comparison. |
| Operations | Real hosting request limits, pool capacity, redacted logs, backup/restore monitoring, moderator staffing and access bootstrap procedure. |
| Publication | Owner approval of migrations, release/licensing/terms evidence, tester invitation text and public launch. None is inferred from local readiness. |
