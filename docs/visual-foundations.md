# Shared visual foundation

Tailwind 4 and DaisyUI 5 remain. Following the owner's original-UI restoration request, `app/globals.css` uses the original DaisyUI light/dark palette rather than the phase0 teal overrides. Shared typography, visible focus, 44px controls and reduced-motion improvements remain. `next-themes` writes `data-theme` so DaisyUI and the logo agree with system preference. See [restoration and local preview](original-ui-restoration.md).

Use `.surface-panel` for a bordered content surface and `EmptyState` for missing-content or signed-out states. Use the existing `ErrorMessage`, `Skeleton`, `.btn`, `.input`, `.select`, and `.textarea` controls instead of adding another component library. Associate labels/errors with field IDs and give icon actions persistent accessible names. Rating buttons keep integer 1–5 semantics.

The layout provides a skip link and system-font stack, avoiding a network font download during builds. The mobile navigation uses a native modal dialog for focus containment, Escape, and focus return. Community/profile settings remain available; New Diary is available through the settings menu on desktop and the mobile menu.

The carousel follows reduced-motion changes while open and uses immediate scrolling when motion is reduced. Hover and keyboard focus pause rotation independently; rotation resumes only after both leave. Moving focus between carousel controls keeps it paused. Regression tests cover these interactions and preference changes.
