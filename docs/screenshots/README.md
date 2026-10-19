# Local synthetic portfolio captures

These images show invented movies/members/reviews in guarded disposable PostgreSQL schemas. They contain no live TMDB movie artwork or real member data. Each capture has a visible LOCAL SYNTHETIC FIXTURE label inserted by the test solely for screenshots. The application does not insert that banner or seed sample public reviews in production.

Run `npm run test:e2e -- tests/e2e/release-readiness.spec.ts` with the documented disposable test environment. Playwright uses reduced motion, widths 360/768/1440, light at 360/1440 and dark at 768; height 1000. It blurs active controls, scrolls to top and uses `caret:initial` for capture. Outputs are ignored `.superpowers/phase5-*.png`. Selected reviewed captures are copied here, not automatically rewritten on every test run.

| File | What it demonstrates |
| --- | --- |
| `discovery-360.png` | Mobile discovery, synthetic provider fixture and missing-artwork fallback. |
| `discovery-768.png` | Tablet/dark discovery with persistent labels. |
| `community-1440.png` | Desktop public activity using an explicitly published synthetic member/review. |
| `profile-360.png` | Mobile opt-in profile with public-only statistics. |
| `empty-community-360.png` | Honest initial empty state without production fake reviews. |
| `credits-dark.png` | Credits with original official TMDB logo on a dark backing and readable notices. |

The capture stylesheet hides only Next's development indicator and adds the fixture label; it does not replace product content. Fixtures are removed by test cleanup/teardown. These screenshots establish local presentation only: real OAuth/provider availability, hosting performance, hosted CI and public launch remain unverified. See [phase 5 evidence](../phase-5-verification.md).
