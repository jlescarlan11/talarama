# Wikidata catalog implementation plan

> For agentic workers: use superpowers:executing-plans and test-driven-development. Execute inline in the existing isolated worktree under the owner's direct authorization. Obtain one independent read-only final review using requesting-code-review; no other delegation is needed.

**Goal:** Live, key-free Wikidata discovery and authenticated imports with original UI and preserved data.

**Architecture:** Separate Wikidata provider/types/cache, selector for ordinary catalog reads, additive ExternalMovieIdentity table and new /movies/wikidata/Qâ€¦ route. Legacy TMDB imports/routes stay compatible. Use existing library/diary/publication/moderation behavior after resolving a stable local Movie ID.

**Tech stack:** Existing Next16, Prisma6/PostgreSQL17, Zod, Vitest/Playwright; no new dependencies.

**Spec:** ../specs/2026-10-19-wikidata-catalog.md

## Constraints / review focus

- Work only in existing codex/talarama-phase-0 checkout starting a694ae3; no push/deploy/production migration or real-member writes.
- Test identity collisions, replay/concurrency, malformed/redirected/non-film/adult provider data, literal search escaping, exact year filtering, cache/source isolation and failure fallback.
- Preserve original visual structure; label Wikidata metadata/ordering and missing artwork/scores honestly. Never discard functional improvements or legacy timestamps.

## Tasks

- [x] Provider/types: add bounded Wikidata client, validated entity normalization, verified genre map, source-specific cache/selector. Test RED then GREEN for live-like discovery/search/year/genres, non-film/adult filtering, redirect/wrong-ID/malformed/oversized/timeout/429 behavior. Use existing trusted TmdbError categories without changing TMDB transport.
- [x] Identity/import: add ExternalMovieIdentity relation/table SQL only. Implement importWikidataMovie(qid,{db?,provider?}) using existing serializable retry helper. Test actual migration/backup preservation and concurrent imports; no title/year or TMDB backfill.
- [x] Integrate: route, import endpoint union, source-aware URLs/cards/carousel/detail/actions/fallback, selected catalog read paths, about credits and live-preview option. Preserve old APIs/routes and explicitly force TMDB in existing synthetic browser tests. Add a Wikidata browser journey with fixture transport; verify save/log/library actions and read-only browsing.
- [x] Verify full lint/types/unit/PostgreSQL/migrations/browser/build, real Wikidata list/search/year/detail reads, one independent review and material fix regressions. Commit locally, clean tree, show/leave live localhost and capture evidence. No real Google acceptance or production release claim.

## Network findings before implementation

Official Action API and Inception Q25188 entity reads returned200 locally. Film searches expose real identifiers and total counts. SPARQL date-range query returned200 in approximately11seconds; broad coverage ordering exceeded15seconds, so ordinary discovery uses the faster Action API and year-constrained queries use bounded SPARQL. Family genre is Q1361932; Q75653 is unrelated and must not be used. Sources: Wikidata Data access, WikiProject Movies/Properties and MediaWiki WikibaseCirrusSearch documentation, checked2026-10-19.


## Execution ledger and review decisions

Implementation was executed inline from a694ae3 in the existing isolated checkout, with one independent read-only final review of the complete working change. No implementer delegation, real-member mutation, push or deployment occurred. The skill's integration menu is superseded by the owner's explicit keep-local instruction; keep this branch and worktree.

- Provider RED: missing module in wikidata-provider-red.log. GREEN: normalized Q IDs, trusted requests, genre/year/search, blocked/non-film/wrong IDs, 429, malformed/oversized/streaming/stalled-body behavior and failed-cache retry. Literal search quotes/operators/backslashes were also exercised against the real endpoint without an API error.
- Identity RED: missing module in wikidata-identity-red.log. GREEN: real additive DDL, six concurrent saves, mismatch rejection, legacy/account/member preservation and pg_dump restoration including the identity table.
- Integration: original20 TMDB browser journeys and the new Wikidata journey passed in independent disposable schemas. New journey covers360/768/1440px, pagination/filters, read-only details, signed-in watch/favorite/import/log, automatic watchlist removal and the unchanged local-ID route.
- Ruling: keep CC0 metadata and existing fallback artwork only — linked images have separate rights — cost is fewer posters until a separately reviewed image integration.
- Ruling: retain separate WIKIDATA identities; no title/year merge or automatic TMDB backfill — protects legacy IDs/member links — cost is possible duplicate titles across providers until reviewed mapping.
- Ruling: cap title/year at100 candidates and use explicit film/genre statements for year browsing — unrestricted multi-class/label scans timed out; bounded queries passed and the UI discloses coverage — cost is incomplete year-search coverage and shorter pages when regional re-releases or blocked records are excluded.
- Ruling: omit optional maxlag for interactive public reads — the live Action API returned maxlag because of a delayed query-service replica, while direct entity reads were available; official MediaWiki guidance permits this for interactive tasks — cost is continuing interactive read traffic during lag, bounded by caching and429 cooldown.
- Review fix: fake film/public review leaked into --wikidata preview. Extracted the existing seed helper, observed the real DB regression fail (movie count1), then gated movie/review seeds to sample mode; final54-test DB suite passes.
- Review regrading: the page500 Next issue and saved Wikidata fallback source label were treated as important because they break the promised navigation boundary and source attribution. Both regressions failed first, then passed after enforcing the page cap and loading external identities for the saved carousel. They were fixed in the same review pass; no second reviewer was dispatched.
- Ruling on declined live availability/search semantics: verified discovery, title, title/year, year/genre, year-only and Inception detail directly without fixture transport; operators/quotes/backslashes also returned normal API responses. Public availability remains variable and year-only reads can take about20seconds — cost is occasional retry/latency.
- Ruling on declined browser/build results: coordinator owns final measured verification rather than inferring it from review. Browser20+1 passed; final build and localhost evidence recorded below when completed.
- Ruling on declined production readiness and real authentication: intentionally remain outside this local trial; Google is blank in the disposable preview and real OAuth/hosting/source licensing stay pending — cost is no claim of public-release acceptance.
- Ruling on declined full visual equivalence: preserved the restored UI component structures/classes; browser layouts and final screenshots verify local rendering. Provider labels, missing images/ratings and metadata content change deliberately — cost is a visibly less illustrated catalog until artwork rights are addressed.

Verification artifacts are ignored local .superpowers/wikidata-*.log files. Full final suite:113 unit tests and54 PostgreSQL tests passed. Historical migrations replayed with no schema drift. Browser regression suite20/20 and Wikidata journey1/1 passed. Final lint/build/local preview checks are recorded at completion below. No deferred review finding remains.


Completion evidence: final lint passed; production build/type validation and loopback3101 smoke passed after the final source changes. The final pagination test's Testing Library selector was changed to an anchored name regex to satisfy its types, then its5-test file passed. Local `preview:wikidata` is running on127.0.0.1:3000 with no fixture provider preload. Live localhost API returned12 real Wikidata films, Inception detail returned200/Christopher Nolan, community was empty, and owned preview counts remained movies0/entries0/identities0 after browsing. Existing browser tabs1(catalog) and2(home) were refreshed and marked deliverable. Screenshots: `.superpowers/wikidata-localhost-catalog.png` and `wikidata-localhost-home.png`. The original UI structures remain, with deliberate provider wording/fallback artwork. No production migration, real Google acceptance, push or deployment occurred. Licensing remains pending.
