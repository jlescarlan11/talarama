# Phase-0 dependency and carousel follow-up

Owner request: fix all remaining dependency and carousel issues before phase 1 (2026-10-19).

- Reproduce live reduced-motion and independent hover/focus failures; fix with a media-query subscription and separate pause reasons. Cover loss of either pause reason and preference changes.
- Upgrade Next/ESLint to current supported releases. Preserve existing auth checks, database schema, migrations, and Next-specific lint protection.
- Remove vulnerable braces dependency through a scoped, API-compatible glob replacement for Next's lint plugin, with real rule tests for globbed project roots.
- Patch Prisma's config-only deepmerge dependency with a scoped override; verify actual config loading, client generation, migrations and data journeys rather than migrating the database/client API unnecessarily.
- Verify audit (all and runtime), npm ci, lint, typecheck, unit/integration/migration/browser suites, and build. Update the handoff so resolved findings are no longer described as deferred. Real Google OAuth remains a separate missing-credential blocker.
