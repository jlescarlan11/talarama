# Phase 2 Discovery Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. The owner authorized autonomous phase 2 execution in the existing isolated checkout; no additional design approval is required.

**Goal:** Visitors discover and share external movies; members save them safely into their existing local library.

**Architecture:** URL-driven discovery reads the existing cached TMDB boundary through a validated catalog handler. Shared details read provider metadata with local snapshot fallback. Authenticated mutations import trusted metadata first, then apply idempotent library intent. Reads never import.

**Tech Stack:** Existing Next 16, React, TypeScript, Zod, Prisma 6, PostgreSQL, Vitest and Playwright; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-19-talarama-community-design.md`, phase 2 of `docs/superpowers/plans/2026-10-19-talarama-upgrade-roadmap.md`.

## Global Constraints

- Use `C:/Users/jlesc/.codex/worktrees/talarama-phase-0/Talarama`, branch `codex/talarama-phase-0`, preserving phase 1 at c004c3d.
- Preserve IDs, account links, diary and library rows; no schema changes needed. Approved design and roadmap stay unchanged.
- No push, merge, PR publication or deployment. No diary/privacy/community implementation from later phases.
- Reuse cached server provider, trusted transport, importMovie and Prisma singleton. No browser metadata accepted for import.
- Separate popular genre/year discovery from title/year search. URL holds mode/query/year/genre/page/sort; search debounce 300 ms and obsolete responses cannot win.
- Preserve `/movies/[id]`; mapped cards prefer `/movies/tmdb/[tmdbId]`. No reads import.
- No real TMDB or Google credentials exist at handoff; fixtures prove contracts only.

## Review Focus

- A stale response after a mode/query/back-navigation change must never replace the current result.
- Repeated/concurrent saves must converge, and anonymous malformed requests must not invoke import or writes.
- Removed/failed provider detail must keep saved local metadata and actions usable.
- Unknown metadata, zero votes, one local rating and missing art must have honest labels and usable layouts.
- Manual write URLs/API methods must not permit ordinary catalog edits or deletion.

### Task 1: Identity, query contracts and catalog reads

**Files:** `app/lib/movies/{links,catalog-query}.ts`, `app/api/catalog/route.ts`, `tests/unit/catalog-query.test.ts`, `tests/unit/catalog-route.test.ts`.

**Interfaces:** `movieHref({id?,localId?,tmdbId?}): string`; `parseCatalogQuery(URLSearchParams)` validates only supported mode-specific inputs. `GET /api/catalog` returns normalized CatalogPage or safe 400/503, never writes.

- [ ] Write failing tests for local/mapped/external links, strict numeric bounds, separate modes, pagination and safe provider errors; run targeted Vitest and observe failure.
- [ ] Implement pure identity/query helpers and catalog handler reusing `tmdb` from server.ts. Popular is the sole supported sort; reject unsupported combinations rather than silently misrepresent filters.
- [ ] Run targeted tests and full unit suite; expected all pass. Commit local task.

### Task 2: Authenticated import and idempotent library actions

**Files:** `app/lib/movies/http.ts`, `app/services/movieLibraryService.ts`, `app/api/movies/import/route.ts`, existing movie/like/watchlist handlers, retired new/edit pages, `tests/unit/catalog-actions.test.ts`, existing catalog integration tests.

**Interfaces:** POST import accepts strict `{tmdbId}` after session authentication. POST like/watchlist means add, DELETE means remove. `setLibraryEntry(userId,movieId,kind,present,{db?})` uses unique identity/createMany skipDuplicates or deleteMany. Authentication precedes parse/import; missing IDs yield 404. Responses are no-store.

- [ ] Write failing handler tests for anonymous, invalid input, untrusted payload, provider errors, retired manual writes; integration tests prove repeated/concurrent add/remove and preserved relationships.
- [ ] Implement authenticated handlers, shared safe errors and idempotent service. Retire manual POST/PATCH/DELETE with 401/403 and replace new/edit screens with discovery guidance.
- [ ] Run unit and database tests; expected all pass. Commit local task.

### Task 3: Discovery UI and navigation

**Files:** `app/movies/{page,Discovery,CatalogCard}.tsx`, `app/hooks/useCatalogSearch.ts`, home page, existing local MovieCard/carousel links, `tests/unit/discovery.test.tsx`, `tests/e2e/discovery.spec.ts`.

**Interfaces:** server page validates URL and supplies initial results/error without importing. Client URL controls update mode/query/year/genre/page/sort; fetch hook keys results to current URL and aborts/ignores obsolete work. Input debounces URL updates 300 ms; filters reset page. Browser back restores controls/results.

- [ ] Write failing UI tests for search debounce, out-of-order resolution, back navigation, separate filters, retry and pagination.
- [ ] Build labeled responsive controls, permanent card labels, missing poster/year, loading/empty/error and retry states. Popular home discovery CTA uses existing local library fallback when provider is unavailable.
- [ ] Run unit and fixture browser tests; expected all pass. Commit local task.

### Task 4: Shared movie details and save flow

**Files:** `app/movies/_components/{MovieDetail,LibraryActions}.tsx`, local and TMDB detail routes/loading, `app/services/movieDetailService.ts`, `tests/unit/movie-detail.test.tsx`, browser discovery tests.

**Interfaces:** details distinguish local identity/provider identity, read cached trusted metadata, use local snapshot on provider failure, and independently load uncached member state/local ratings. Actions import only after signed-in explicit intent, use returned local ID, then POST/DELETE library intent. Failed saves retain retryable intent; controls remain disabled while pending.

- [ ] Write failing tests for metadata fallbacks, invalid IDs, safe provider errors, signed-out actions, separate 10-point TMDB and 5-point local scores, import-first action retry.
- [ ] Implement shared detail rendering with poster/backdrop, description, release/runtime, genres, cast/director and score labels. Local legacy directors/genres remain readable. Retain existing reviews without inventing phase 4 privacy/publication semantics; label local ratings as current Talarama ratings, not new community aggregation.
- [ ] Remove manual edit/delete links from active details; update remaining library consumers for add/remove HTTP semantics.
- [ ] Run tests and browser journeys at 360/768/1440, keyboard/reduced motion and provider failure/empty/missing metadata. Commit local task.

### Task 5: Verification and independent review

**Files:** `docs/phase-2-verification.md`, catalog operations/README updates and plan progress.

- [ ] Run Prisma generation, lint, types, complete units/integration/migration/browser suites, build and full/runtime audits. No migration added; verify prior schema/history and phase 1 preservation.
- [ ] Inspect credential presence without values; record real-token and Google OAuth limitations.
- [ ] Dispatch one fresh read-only whole-phase review under executing-plans; reproduce and fix important findings with failing tests, rerun affected/full checks.
- [ ] Review requirements against evidence, document results/blockers and local commits; keep checkout intact and all work local.

## Execution decisions

- Owner's explicit autonomous execution supersedes the planning skill's generic approval pause. Existing isolated checkout is reused, not recreated.
- The provider only supports popular discovery sorting; URL persists `sort=popular` and the interface states that order. No unsupported provider sort is added.
- Use fixture transport outside production app code for browser verification; no test-only authentication/provider bypass ships in application code.
