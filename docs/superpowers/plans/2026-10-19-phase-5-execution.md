# Phase 5 Local Release Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. The owner explicitly authorized plan preparation followed by autonomous native implementation and independent review in the existing checkout. No further design approval pause.

**Goal:** Make local release checks reproducible and present the project honestly, while retaining all external launch and licensing gates.

**Architecture:** Keep the existing application boundaries and data model. Add a secret-free CI definition around disposable PostgreSQL schemas, accessible attribution/credits, behavioral browser checks and synthetic portfolio captures. Operational documents describe future authorized deployment without configuring it.

**Tech Stack:** Existing Next 16, React, TypeScript, Prisma 6, PostgreSQL 17, Vitest, Playwright, GitHub Actions; no new application dependency.

**Spec:** `docs/superpowers/specs/2026-10-19-talarama-community-design.md`; Subproject D of `docs/superpowers/plans/2026-10-19-talarama-upgrade-roadmap.md`. Both approved files remain unchanged.

## Global Constraints

- Work only in `C:/Users/jlesc/.codex/worktrees/talarama-phase-0/Talarama`, branch `codex/talarama-phase-0`, starting clean at `625938f`; preserve every prior commit and data value.
- Local commits only. No push, merge, PR publication, hosted CI trigger, deploy, cloud configuration, invitations/messages, production/staging access or worktree removal.
- Preserve trusted explicit import, URL/debounce/stale guards, add/remove semantics, private-by-default diary, legacy timestamps, retry recovery, shared public eligibility, no-store rechecks, moderation and durable quotas.
- Never reset populated data, edit historical migration checksums, print credentials or use real identities in fixtures. No new schema migration is expected.
- Propose MIT for review in a clearly inactive document; do not create `LICENSE` or claim an open-source license has been granted.
- Distinguish synthetic local verification from real OAuth/TMDB, actual staging preservation, hosted CI and public launch acceptance.
- Retain worktree, PostgreSQL cluster, backups and existing ignored planning artifacts; avoid broad cleanup. Stop only owned test/dev processes before generation/build.

## Review Focus

- Fresh Linux CI must have matching PostgreSQL server/client tools, Node/npm versions, schema isolation and synthetic credentials; never reach real services or retain sensitive artifacts.
- A first member/empty community must work without production fake reviews; fixture screenshots must say they are synthetic.
- Slow and failed catalog/community reads must expose useful loading/retry states without leaking private content or losing drafts.
- Attribution must use an official unchanged logo, appropriate notice and rights distinction; unverified full terms/retention must remain a release gate.
- Migration documentation must not confuse current-schema development bootstrap with historical baselining or prove production preservation from empty development data.

### Task 1: Reproducible local/CI checks

**Files:** `.github/workflows/ci.yml`, `.env.example`, relevant browser setup/config only if needed.

**Interfaces:** Existing `npm run lint`, `typecheck`, `test`, `test:integration`, `test:migrations`, `test:e2e`, `build`; `TEST_DATABASE_URL` names a separate disposable `_test` database. Browser preload remains test-server-only.

- [ ] Define read-only Actions permissions, pinned action revisions, Node 22/npm 11, PostgreSQL 17 service with health check, matching client binaries, synthetic environment and bounded job runtime. Create current-schema build DB separately from generated test schemas; install Chromium and create ignored screenshot directory on fresh clones.
- [ ] Run `npm ci`, `npx prisma generate`, lint/types/unit, PostgreSQL integration and migrations locally, with logs in ignored `.superpowers/phase5-*`. Expected: commands pass, 27 migrations/no drift; historical fixtures compare IDs, accounts, relationships and exact `2020-02-29T23:30:00.000Z` through pre/post backup restores.
- [ ] Inspect workflow paths/commands and parse YAML locally. Expected: all steps use declared tools/env; no real secrets, deploy or publication steps. Record Windows/Linux and unrun hosted execution limitations.
- [ ] Commit local CI/config deliverable after checks.

### Task 2: Attribution and presentation verification

**Files:** `app/about/page.tsx`, `app/components/Footer.tsx`, `app/layout.tsx`, official logo asset if accessible; `tests/unit/attribution.test.tsx`, `tests/e2e/release-readiness.spec.ts`, `docs/screenshots/`.

**Interfaces:** Footer links to `/about`; credits identify provider and upstream rights. Public metadata remains generic/noindex for members/reviews, without invented production origin. Test fixture identities use `.invalid` addresses and test-only database setup.

- [ ] Browse official current TMDB FAQ, API terms and approved logo guidance. Record retrieval date, exact source links and access limitations. Preserve service/fallback semantics; surface any retention obligation needing an operational release gate.
- [ ] Write/render attribution test expecting credits link, logo and required notice; run it RED before implementation. Implement minimal About/Credits and footer attribution with an official unmodified asset; retain contributor credits. Run targeted tests GREEN.
- [ ] Add browser journeys for a brand-new empty member/community, widths 360/768/1440 in light/dark, no horizontal overflow, keyboard skip/focus, reduced motion and slow/failing retry. Preserve existing dialog/spoiler/diary regressions. A demonstrated product defect gets its own failing assertion before fix.
- [ ] Capture local portfolio screenshots from disposable synthetic data only, with visible fixture labeling injected by the capture test, never production sample reviews. Inspect output pixels; record scope and contrast measurements without claiming complete WCAG conformance.
- [ ] Run complete browser suite, stop owned server, then generation/build. Expected: all journeys/build pass; no production auth bypass or fixture preload in application imports. Commit local presentation deliverable.

### Task 3: Developer and operator documentation

**Files:** `README.md`, `CONTRIBUTING.md`, `docs/architecture.md`, `docs/deployment.md`, `docs/migrations.md`, `docs/licensing-proposal.md`, `docs/tmdb-attribution.md`, `docs/screenshots/README.md`.

**Interfaces:** Docs consume actual scripts/env/schema contracts and measured Task 1/2 results. License proposal is inactive until owner/rightsholder review. Deployment runbook is future, separately authorized work.

- [ ] Replace stale pre-community README statements; document purpose, honest screenshots, setup, fresh empty DB vs populated migration, environment table, checks, architecture and operation links.
- [ ] Explain local/external movie identity, source/member/provider data ownership, saved-zone/calendar and exact legacy timestamp semantics, idempotency/uncertain-response recovery, public eligibility, quotas/moderation and generic noindex ruling.
- [ ] Document proposed production request/body/time limits, pool budgets/direct migration connection, origin/callback separation, secret handling, private-data-safe logs, backups/restore and rollback cutover. Include practical acceptance checklist and explicit unavailable real credentials, authorized staging-copy, legal/retention, hosted CI and launch gates.
- [ ] Reuse the actual guarded historical fixture rehearsal; record pre/post restored identity/relationship equality and exact legacy timestamp, no guessed mappings/conversions. No actual production rehearsal claimed.
- [ ] Check all relative document links and command names, compare example env names with runtime use, inspect tracked files for fixture/secret boundaries. Expected: links/scripts valid, no active license/new data exports. Commit local documentation deliverable.

### Task 4: Independent review and final verification

**Files:** `docs/phase-5-verification.md`, this plan's execution ledger, material fixes/tests if reviewer finds defects.

- [ ] Dispatch one independent read-only whole-phase reviewer against immutable `625938f..HEAD`, the spec, this plan and its rulings. Request severity, exact evidence, release gates and declined behaviors. Review CI on Linux semantics, privacy/retention, fixtures, setup and accessible states.
- [ ] Re-grade findings by actual user impact. Fix Critical/Important in one pass, each with a reproducing RED→GREEN test and final relevant/full suite; defer Minor transparently. Record every declined-behavior ruling and its cost. No second reviewer endorsement claimed.
- [ ] Run final lint/types/unit/integration/migrations/browser/build plus dependency audits as appropriate after material changes; inspect evidence. Confirm prior phases and approved files unchanged, clean local branch after commits, no `LICENSE`, no external writes.
- [ ] Write measured local verification and an explicit table of blocked external gates. Commit locally and leave checkout/branch intact. Local readiness is not public launch completion.

## Preflight interfaces and rulings

| Producer → consumer | Contract checked | Ruling |
| --- | --- | --- |
| Existing harness → CI | `_test` DB, generated schemas, PostgreSQL client binaries, `.superpowers` screenshots | Create directory explicitly; matching PG17 tools; no production credentials. |
| Attribution → docs/screenshots | Official branding/notice and upstream rights separate from code | Verify primary sources and label retrieval limits; no implied rights grant. |
| Browser fixtures → portfolio | Synthetic sessions/data never loaded in production | Visible capture banner plus captions; keep preload test-only. |
| Measured checks → release docs | Local evidence vs hosted/provider/staging acceptance | Record distinct gates; fixtures cannot close external gates. |

## Execution ledger

- Preflight: clean at `625938f`, authorized existing branch; approximately 9.5 GB free. No other checkout touched.
- Ruling: owner explicitly authorized autonomous planning/implementation, so no repeated spec/plan approval pause. Cost if changed: local reversible edits only.
- Ruling: retain execution evidence and ignored scratch under the owner's preservation instruction; no skill-directed worktree/scratch deletion. Cost: local disk usage.
