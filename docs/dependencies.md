# Phase-0 dependency assessment (2026-10-19)

Changes are kept on the existing application majors: Next.js/ESLint config 15.5.28, React/React DOM 19.0.9, NextAuth 4.24.15, and matching Prisma client/CLI 6.19.3. Other existing caret ranges were refreshed within their declared majors and locked. Vitest 5.0.5 is a new tool for this project, selected instead of retaining a vulnerable trial installation of Vitest 3. Node 22 types match the development runtime.

The [October 14 Next.js security release](https://nextjs.org/blog/nextjs-security-update-october-14-2026) identifies 15.5.28 as the patched maintenance release. [React's upstream advisory](https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3) and [release history](https://github.com/react/react/releases) identify the patched 19.0 line. [Prisma's v6 CLI documentation](https://www.prisma.io/docs/orm/v6/tools/prisma-cli) identifies 6.19.3. npm metadata verified NextAuth 4.24.15 supports React 19 and Next 15; no Auth.js major migration is introduced.

A same-major PostCSS override (`^8.5.31`) replaces the old transitive PostCSS pinned by Next 15; lint, tests and production compilation must verify it. Avoid `npm audit fix --force`, which proposes unrelated majors and even an ESLint config downgrade.

Unused packages removed after searching tracked imports: the Auth.js v5 Prisma adapter (NextAuth 4 uses `@next-auth/prisma-adapter`), Supabase client, Radix colors/themes, bcrypt and its types, classnames and delay. No runtime database/auth provider changes occurred.

## Remaining dependency work

The final npm audit reports **8 high findings**, no critical/moderate/low findings. They are two underlying issues propagated through dependency chains:

- `braces <=3.0.3` stack exhaustion via deeply nested patterns, through micromatch/fast-glob/Next ESLint tooling. No patched braces release is currently published. These patterns are from trusted source/tool configuration, not a public application endpoint. [Advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- `deepmerge-ts <8` recursive graph stack exhaustion, through `@prisma/config`/Prisma CLI. Prisma Client's optional CLI peer makes the CLI chain also appear in `npm audit --omit=dev` (3 high findings). The application's Prisma queries do not consume user-supplied Prisma configuration. A Prisma 7 migration or an out-of-range major override needs separate compatibility work; phase 0 preserves Prisma 6. [Advisory](https://github.com/advisories/GHSA-ggr8-5vv4-36mx).

[Next's support policy](https://nextjs.org/support-policy) lists 15.x as Maintenance LTS, released October 21, 2024, with a two-year maintenance window. That window reaches October 21, 2026. A deliberate Next 16 migration and compatible supported ESLint tooling must be scheduled before public launch. ESLint 9 itself is now unsupported; it is retained for compatibility with Next 15's declared peer range. This branch is a patched development baseline, not a claim that every dependency is supported indefinitely or that the audit is clean.
