# TechSəs MVP Plan

## Implementation order

1. Establish design system and page shell.
2. Add typed issue data and interaction state.
3. Build session panel, conversation timeline, and issue cards.
4. Build ticket summary and success state.
5. Add responsive/accessibility polish.
6. Run typecheck/build and preview screenshots.

## Design direction

- Visual language: dark operations console with warm paper-white content panels and electric mint signal accents.
- Typography: Space Grotesk for display/UI labels, Manrope for readable body copy.
- Palette: ink `#101111`, graphite `#1B1F1E`, paper `#F4F3EE`, mint `#C7F36B`, sky `#9DDCF6`, amber `#F6C76B`, coral `#FF806B`.
- Spacing: 4px base rhythm, generous 24–40px panel spacing.
- Radius: 18px primary panels, 10px controls, pills for status.
- Shadows: soft black/green glow only where it reinforces hierarchy.
- Motion: 160–220ms ease-out; subtle waveform pulse and staggered card entrances; reduced-motion fallback.

## Task list

- [ ] Replace scaffold Home page with the TechSəs console.
  - Acceptance: desktop shell includes sidebar, session hero, transcript, issue shortcuts, and ticket panel.
  - Verify: `pnpm check` and screenshot at `/`.
  - Files: `client/src/pages/Home.tsx`, `client/src/App.tsx`.
- [ ] Replace default tokens and load fonts.
  - Acceptance: consistent dark/mint/paper visual system and accessible focus states.
  - Verify: `pnpm build` and mobile screenshot.
  - Files: `client/src/index.css`, `client/index.html`.
- [ ] Implement simulated voice workflow.
  - Acceptance: start session, issue selection, thinking state, response state, ticket creation, reset.
  - Verify: manual click path; no console errors.
  - Files: `client/src/pages/Home.tsx`.
- [ ] Verify production output.
  - Acceptance: no TypeScript/build errors and no visible horizontal overflow.
  - Verify: `pnpm check`, `pnpm build`, preview screenshot.
  - Files: none beyond fixes.
