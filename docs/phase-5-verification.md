# Phase 5 local release readiness verification

2026-10-19. Work is confined to `C:/Users/jlesc/.codex/worktrees/talarama-phase-0/Talarama`, branch `codex/talarama-phase-0`, starting clean at `625938f`. Phases1–4 remain ancestors. The approved design and roadmap, schema/migrations, IDs/accounts/links and previous application contracts remain unchanged. No push, merge, PR publication, hosted CI trigger, preview/production deployment, cloud configuration, tester messaging, production access or worktree removal occurred.

## Delivered local work

- Read-only GitHub Actions definition with immutable action revisions, Node 22.14.0/npm 11.6.1, PostgreSQL 17 service/health check and matching client tools, disposable build DB and generated test schemas. No real OAuth/provider credentials or artifact uploads; no deploy step. Fresh-clone test configs create ignored output storage. Ubuntu/PG package patch updates remain upstream-managed; this is not a bit-for-bit container snapshot.
- Practical README/environment/contribution guidance, architecture decisions, migration/restore rehearsal evidence, proposed deployment controls/runbook, six honest portfolio screenshots and an inactive MIT proposal. No `LICENSE` or licensing metadata was added.
- `/about` credits with original contributor credits, official unchanged TMDB SVG, required notices and distinct upstream/member/code rights; global footer link and accurate root description/Twitter card type. No invented production URL. Generic noindex member/review metadata remains deliberate.
- Added three browser journeys: initial member/empty community, keyboard/focus/contrast/reduced-motion credits, slow/failing catalog/community with keyboard retries. Existing publication, moderation, date/retry/library/history/discovery regressions are retained.

## Measured checks

| Check | Local result |
| --- | --- |
| Clean install | `npm ci`:632 packages installed,633 audited; zero vulnerabilities; existing upstream peer/deprecation warnings retained. |
| Prisma generation | Client/CLI 6.19.3 passed, including after browser server exit. No forced DLL deletion or unrelated process termination. |
| Lint / types | Passed. |
| Unit/provider/component tests | 90 tests in 27 files passed, including 2 attribution tests. |
| PostgreSQL integration | 34 tests in 3 files passed. |
| Migration replay | All 27 historical/additive migrations; no schema drift. No migration files/checksums edited. |
| Chromium | All 19 journeys passed in2.7 minutes; focused new suite also passed 3/3 before full run. |
| Production build | Compiled, typechecked and generated 14 static pages. Used a fresh guarded `build_<UUID>` schema in the loopback `_test` DB, synthetic auth config, empty Google/TMDB values and no transport preload. Schema dropped afterward. |
| Production loopback smoke | Own `next start` on 127.0.0.1:3101: credits200, empty community no-store200, unconfigured provider503, unavailable member no-store404. Owned server exited and schema removed. This is not a deployed/live-provider smoke. |
| Dependency audits | Full and runtime audits both zero vulnerabilities. |
| CI definition | YAML parsed locally; commands reviewed against actual scripts/tools/env. Hosted Linux CI has not run. |
| Independent review | Fresh read-only review of `625938f..de86cf8`: no Critical/Important findings, one Minor README clarification corrected editorially. Local readiness accepted; public release remains blocked. |

Logs and extra screenshots are ignored `.superpowers/phase5-*`; no credential-bearing logs, dumps or auth state were committed. Next's actual env loader confirmed `TMDB_READ_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` absent, printing names/status only. No credentials were invented or requested as nonexistent old values.

## Preservation and recovery evidence

The first DB runs failed because the retained local PostgreSQL cluster was stopped; they are not counted as passes. The same17.4 cluster started on existing loopback 55439 and completed automatic recovery without reset. The successful reruns exercised guarded isolated schemas only; the development database had no phase 5 migration/mapping/conversion.

The historical catalog harness seeds old SQL before phases 1/3/4, captures representative records and restores genuine pre-upgrade and post-upgrade logical backups to a separate schema. Two movie IDs `legacy`/`unmatched`, user `owner`/exact `Legacy.Owner`, account `google-link`/unchanged provider sub and synthetic access/refresh values, diary `review`/rating4/text/exact `2020-02-29T23:30:00.000Z`, favorites, physical `WatchedList` and category links were compared unchanged. Restored snapshot arrays compare equal; old links/timestamps are not guessed or normalized. Existing cluster/backups and prior ignored planning artifacts remain intact. See [migration evidence](migrations.md#phase-5-local-rehearsal-and-external-gate).

This is synthetic fixture preservation, not actual populated staging/production acceptance. Empty development results from prior phases prove no production preservation. The [actual staging gate](deployment.md#actual-staging-migration-and-recovery-gate) remains mandatory.

## Presentation, interaction and accessibility evidence

1. **First member/empty community:** new unpublished synthetic member has 0 logs/0 movies, usable empty diary/favorites/watchlist and generic unavailable public profile. Community shows its real empty-state guidance without sample reviews. Checked 360/768/1440; no horizontal overflow. [Mobile empty capture](screenshots/empty-community-360.png).
2. **Discovery and profile/activity:** existing discovery tests retain share/back/filter/loading/missing-image/provider fallback coverage. New labeled captures show synthetic discovery and a deliberately published disposable member/review across 360/768/1440, light/dark and reduced motion. Public-only statistics remain separate. [Mobile discovery](screenshots/discovery-360.png), [dark tablet](screenshots/discovery-768.png), [desktop community](screenshots/community-1440.png), [mobile profile](screenshots/profile-360.png).
3. **Keyboard and credits:** skip link focuses `main`; TMDB link uses visible shared 3px focus outline; official logo retains original aspect/colors. All sampled normal credits paragraphs meet 4.5:1 in both themes using computed sRGB foreground/background compositing. Reduced motion has no running animations in that view. Prior full-suite menu focus trapping/Escape/resize and spoiler keyboard disclosure pass. [Dark credits](screenshots/credits-dark.png).
4. **Slow/failing reads:** held catalog/community requests show loading, safe failure, no stale community article, keyboard-focusable retry and eventual recovery. Prior uncertainty/draft-retention/privacy recheck tests remain green. Real upstream/hosting latency is unmeasured.

The author inspected all six committed screenshots and the broader width contact sheet. Capture-only CSS adds the synthetic label and hides Next's development indicator; no production banner or fake activity is introduced. The initial DOM-inserted banner caused a hydration mismatch and was replaced with a pseudo-element; the subsequent targeted/full logs showed no such capture mismatch. A new credits utility suppressed the desired global outline; removing the redundant utility made the failing focus assertion pass.

This is scoped accessibility verification, not full WCAG certification or screen-reader/device coverage. Contrast samples cover credits paragraphs; screenshots and existing tests cover other selected surfaces but do not establish every color/state combination. Known inherited Next destination/response-stream cancellation during navigation remains a runtime limitation; passing journeys do not establish a console-error-free app. Node color and upstream ESLint peer-metadata warnings remain.

## Terms, licensing and external release gates

Official [TMDB FAQ](https://developer.themoviedb.org/docs/faq), [logo guidance](https://www.themoviedb.org/about/logos-attribution) and [API terms](https://www.themoviedb.org/api-terms-of-use) were checked with browsing. Restricted direct requests were supplemented by a successful read-only browser read; retrieved terms report last updated October 20, 2023. The official asset's SHA256 is `8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c`, matching the downloaded bytes and asset URL digest. Current account-specific terms acceptance is still an owner review gate. See [attribution and retention](tmdb-attribution.md).

| External/retained gate | Honest status |
| --- | --- |
| License | MIT is an inactive [proposal](licensing-proposal.md), pending actual rightsholder approval/copyright line. No source license granted. |
| TMDB retention | Persistent snapshots/caches/backups need an implemented reviewed expiry/refresh/termination process under applicable terms. Short result TTLs are insufficient. No preserved rows were purged to manufacture compliance. |
| Real provider/OAuth | Genuine credentials absent; synthetic JWT/transport proves local contracts only. Real search/detail/import, sign-in/callback and linked-account smoke unverified. |
| Hosted CI | Workflow committed for review; no remote run triggered or reported passing. Local OS is Windows. |
| Actual staging migration | No authorized populated staging copy available/accessed. Fixture restores do not close identity/account/relationship/date preservation for production. |
| Hosting/operations | Origin/callback, edge limits, pool capacity, private-data-safe logs, monitoring, backups/restore timings and moderator bootstrap/staffing remain proposed runbook settings, not external configurations. |
| Publication/testers | No invitation, preview, production migration, deployment or public launch authorized/performed. Separate owner approval required. |

Local phase 5 readiness does not mean a deployed public launch. [Deployment runbook](deployment.md) names the evidence required to close each external gate.

## Independent review and rulings

One independent reviewer inspected immutable `625938f..de86cf8`, the approved design/roadmap, execution plan/rulings, adjacent harness/configuration, documentation and all six screenshots. It found no Critical or Important defects and accepted LOCAL readiness while retaining all PUBLIC launch gates. It verified the SVG digest and preservation diff. Its declined-to-judge list was empty.

One Minor README ambiguity used “Saving” for watchlist removal. Source inspection confirmed `createDiaryEntry` removes the logged movie within its transaction, completed replay returns before removal, and ordinary review/date edits preserve watchlist intent. The README now explicitly says “Creating a viewing log.” This is an editorial clarification under the requested documentation scope; no application behavior changed and no extra regression test or full-suite rerun was needed. No deferred minors remain. The final documentation pass also normalized prose spacing. No second reviewer endorsement is claimed.

The reviewer did not rerun suites, access databases, independently retrieve current provider terms/action pins, or execute hosted Linux CI. All command totals in this report are the implementing author's measured runs. Final relative-link/image checks, credential-format scan, foundation preservation and Git whitespace/status checks passed; those do not substitute for external acceptance.

Execution rulings: autonomous plan execution under owner authorization (cost: reversible local edits if changed); retain scratch/worktree/backups (cost: disk use); preserve persistent snapshots while retention mechanism/terms await review (cost: public release remains blocked); correct the review's minor wording as part of the authorized documentation deliverable instead of deferring it (cost: one reversible sentence edit). No licensing or external deployment decision has been inferred. The detailed [execution ledger](superpowers/plans/2026-10-19-phase-5-execution.md) remains the task record.
