# Contributing locally

Read [README](README.md), [architecture](docs/architecture.md), [migration safety](docs/migrations.md) and the applicable `AGENTS.md` first. Use the documented Node22/npm11 toolchain and lockfile (`npm ci`, no force/legacy-peer-deps). No source license has been selected; see the [inactive proposal](docs/licensing-proposal.md) before assuming redistribution or contribution licensing terms.

Keep changes focused. Preserve local IDs, provider account links, original diary timestamps and physical watchlist rows. Never edit applied migration checksums, reset populated data, guess catalog matches/date conversions, auto-publish old records, or introduce production fake reviews/authentication bypasses. Use synthetic `.invalid` identities in disposable `_test` databases only. Never commit `.env`, tokens, OAuth cookies, real exports or personal screenshots.

Use the trusted server provider and explicit import actions. Test behavior at the boundary that can fail: calendar dates, uncertain-request retries, concurrency, ownership, public eligibility and quotas. Give demonstrated defects a reproducing regression. Document schema/API changes and operational recovery. Check UI at360/768/1440, both themes, keyboard/focus and reduced motion.

Before a review, run the complete [check sequence](README.md#verification). Browser tests must exit before Prisma generation/build on Windows to release the engine DLL. Explain what changed, why, tests actually run, data effects and remaining limits. Independent review is especially important for privacy, migrations, idempotency, quota/concurrency and release config. Do not claim fixture sessions prove real OAuth or local checks prove hosted CI.

Push, PR publication, deployment, cloud changes, production migrations and tester invitations are separate owner-authorized actions. A local commit is reviewable without any of those. Report vulnerabilities privately through an owner-agreed channel; do not publish personal records/tokens as a reproduction.
