# Phase 0 Implementation Plan

> Execute with superpowers:executing-plans. Owner authorized phase 0 on 2026-10-19; no further design approval is needed.

**Goal:** Reproducible development, repaired existing flows, focused regression tests, and shared UI foundations.
**Architecture:** Preserve Next.js/NextAuth/Prisma/PostgreSQL and all current records. No catalog or community features.
**Spec:** ../specs/2026-10-19-talarama-community-design.md

## Global constraints
No production database commands, resets, deployments, schema renames, rating optionality migration, or new publication behavior. Secrets never enter tracked files or logs.

## Tasks
1. Establish baseline: npm ci, Prisma generation, direct ESLint/typecheck/test scripts, placeholder env, setup instructions. Record original failures.
2. Regression tests first: form submits review/watchedDate; empty/omitted review accepted consistently, 1–5 integer rating retained; invalid dates return validation errors. Test create/update authorization and payload persistence, anonymous diary rendering, empty carousel, shared Prisma lifetime. Implement minimal corrections and remove private logging.
3. Assess dependencies separately using npm metadata/audit and official support/security notices. Stay on existing majors; verify lint/typecheck/tests/build before and after.
4. Replay migration history on disposable PostgreSQL and compare against schema. Document drift and explicit safe reconciliation strategy; never replay old destructive history on populated databases. Add isolated integration fixtures for save/log/edit/delete and account association preservation where runtime permits.
5. Shared Tailwind/DaisyUI tokens and reusable feedback controls; visible keyboard focus, skip link, reduced motion, accessible navigation and empty states. No links to unbuilt community features.
6. Final verification and independent whole-change review. Report real OAuth/configuration blockers precisely.

## Verification
npm ci; npx prisma generate; npm run lint; npm run typecheck; npm test; npm run test:integration; npm run test:e2e; npm run build.
Each script is introduced before use. External checks must explicitly skip or fail when prerequisites are absent, never report an unrun journey as passing.

## Review focus
Ownership boundaries; invalid/missing inputs; no private log output; data preservation across historical/schema mismatch; keyboard/touch and reduced-motion states.
