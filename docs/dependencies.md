# Dependency assessment (updated 2026-10-19)

The owner requested that the deferred dependency findings be resolved before phase 1. This supersedes the earlier phase-0 decision to defer them.

## Current stack

Next.js and its ESLint config are now **16.4.2**, with **ESLint 10.13.0**, replacing the Next 15 / unsupported ESLint 9 baseline. React/React DOM remain patched **19.0.9**, NextAuth remains **4.24.15**, and Prisma client/CLI remain matching **6.19.3**. No database schema, migration history, account association or provider was changed.

The [Next 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) covers the new proxy convention, TypeScript JSX settings and image quality allowlist. `proxy.ts` now exports a local function delegating to the existing NextAuth gate. Both anonymous denial and signed-session access are tested. Image qualities 75 and 100 preserve the existing diary avatar request; its test reproduced HTTP 400 before configuration was updated.

Next 16's native flat ESLint config replaces the old FlatCompat setup. [Next's ESLint guide](https://nextjs.org/docs/app/api-reference/config/eslint) explicitly supports ESLint 10 from config 16.4. Some included plugins still declare only older peer ranges, so npm prints upstream peer-metadata warnings and `npm ls eslint --all` can flag those ranges despite the supported Next configuration. No force/legacy-peer-deps flags are used. Next's supplied compatibility wrapper and real lint-rule tests verify the active APIs.

New state-synchronization lint errors were resolved with render-time state adjustment for route/selection changes, directly derived filtered results, and the hydration external-store API. Existing search behavior has regression coverage. The optional React Compiler `incompatible-library` diagnostic is disabled only for the two existing RHF `watch()` consumers, because React Compiler is not enabled. Hook correctness, effect diagnostics, Next-specific and TypeScript rules remain enabled.

## Scoped security overrides

- `@next/eslint-plugin-next` receives `fast-glob` as an npm alias to **tinyglobby 0.2.17**. This removes the vulnerable braces/micromatch/fast-glob chain without dropping Next lint rules or installing a fake patched braces version. The plugin consumes `globSync(pattern, { onlyDirectories: true })`, which tinyglobby supports. Actual Next link-rule tests reject raw anchors and accept Next links with string and array root-directory globs, including Windows paths. Recheck this contract whenever upgrading the plugin, and remove the override when upstream replaces the vulnerable chain.
- `@prisma/config` receives **deepmerge-ts 8.0.2**. [The v8 release](https://github.com/RebeccaStevens/deepmerge-ts/releases/tag/v8.0.0) fixes recursive-graph stack exhaustion. Prisma's configuration loader uses the unchanged `deepmerge` export on records; the changed Map/custom-merger APIs are not used there. A real configuration-loader test verifies schema/migration path resolution; client generation, historical migration replay and database/browser journeys cover the existing application. This avoids an unnecessary Prisma 7 datasource/driver migration.
- The existing same-major **PostCSS ^8.5.31** override remains in place for transitive patches.

These are actual installed replacements, recorded in package-lock.json. Before the follow-up, npm audit reported 8 high findings from two underlying issues. After the replacements, **both full and runtime audits report zero vulnerabilities**. Clean-install and complete verification results are recorded in [the phase-0 report](phase-0-verification.md).

Previously removed packages remain removed after import checks: the unused Auth.js v5 Prisma adapter, Supabase client, Radix colors/themes, bcrypt/types, classnames and delay. Real Google OAuth still requires a new development client; no credentials are embedded in these changes.
