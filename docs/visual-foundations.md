# Shared visual foundation

Phase 0 retains Tailwind 4 and DaisyUI 5. `app/globals.css` defines light/dark surfaces, teal primary actions, restrained accent colors, shared radii, spacing, typography, visible focus, 44px controls, and reduced-motion overrides. `next-themes` writes `data-theme` so DaisyUI and the logo agree with system preference.

Use `.surface-panel` for a bordered content surface and `EmptyState` for missing-content or signed-out states. Use the existing `ErrorMessage`, `Skeleton`, `.btn`, `.input`, `.select`, and `.textarea` controls instead of adding another component library. Associate labels/errors with field IDs and give icon actions persistent accessible names. Rating buttons keep integer 1–5 semantics.

The layout provides a skip link and system-font stack, avoiding a network font download during builds. The mobile navigation uses a native modal dialog for focus containment, Escape, and focus return. No Community link is shown until that feature exists. Later phases should apply these foundations as their screens are upgraded.

The carousel follows reduced-motion changes while open and uses immediate scrolling when motion is reduced. Hover and keyboard focus pause rotation independently; rotation resumes only after both leave. Moving focus between carousel controls keeps it paused. Regression tests cover these interactions and preference changes.
