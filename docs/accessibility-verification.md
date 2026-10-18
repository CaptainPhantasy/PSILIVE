# Accessibility verification

Checked October 10, 2026, for the Precision Sewer Inspection editing copy.

The starting audit found five types of WCAG failures: text contrast, unnamed buttons, undersized controls, zoom restrictions, and inline links identified only by color. Additional browser checks found narrow-screen clipping, missing disclosure states, and keyboard focus lost or obscured during navigation.

## Changes

- Made the complete customer feedback section readable in both themes, including its heading, ratings, metadata, links, and expansion control.
- Separated theme foreground colors from backgrounds that carry white labels. Corrected orange and blue buttons, badges, labels, subdued text, form boundaries, and placeholders.
- Corrected text over photo ribbons and gradients, and theme-aware backgrounds on privacy/support pages.
- Added clear keyboard focus, named password and booking controls, selected date/time states, menu/disclosure states, and focus management.
- Enabled zoom on field pages and corrected 320px wrapping on maintenance, privacy, support, and floating controls.
- Preserved service content, supplied artwork, booking behavior, and application boundaries.

## Final evidence

| Check | Coverage | Result |
| --- | --- | --- |
| Source TypeScript | Entire source project | Passed |
| Publication build | Static pages and booking bridge | Passed |
| Full axe audit | 49 routes, both CSS themes, 98 states | Passed after settled staff recheck |
| Staff theme recheck | 13 routes, 26 settled states | Zero violations |
| Customer interactions and narrow screens | 49 routes, 200 states, 192 axe scans | Zero violations or keyboard assertion failures |
| Maintenance footer after its final correction | Light/dark at 320px and 1440px | All four states passed |
| Independent maintenance bounds | Every rendered element at 320px in both themes | No clipped or overflowing content |
| Photo and gradient contrast | 132 meaningful representative samples in both themes | Zero failures; no missing selectors |
| Search and asset audit | 33 public pages, 49 exports, 98 sharing-image references and 97 inline image references | Zero failures |

The staff applications intentionally do not adopt customer theme preferences. Their CSS was additionally exercised in both themes without changing that application boundary. Color transitions were allowed to settle before contrast measurements.

The interaction checks cover expanded Google reviews, all FAQ answers and no-results search, mobile navigation, accessibility/language/font controls, and all four booking steps with expanded terms. Availability was mocked, external requests and writes were blocked, and no real booking or lead submission was made. The editing build intentionally omits the chat panel; preserved source chat improvements passed source type checking rather than a published browser check.

The photo/gradient test measured background pixels where automated contrast checks could not judge them. Three decorative arrows/dots were excluded from meaningful text samples. Tests assess the recorded pages and states; they are not a formal accessibility certification or a substitute for feedback from users of assistive technology.

## Repeatable checks

Run the publication build, then:

- `node scripts/audit-accessibility.mjs`
- `node scripts/audit-interactions.mjs .sites-runtime/accessibility-interactions.json`
- `node scripts/audit-gradient-contrast.mjs .sites-runtime/accessibility-report.json .sites-runtime/gradient-contrast.json`
- `node scripts/audit-seo.mjs`

The final aggregate browser report is in `.sites-runtime/accessibility-validated.json`. Supporting reports remain local and are intentionally excluded from source publication.
