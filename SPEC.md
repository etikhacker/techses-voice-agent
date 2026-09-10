# Spec: TechSəs — IT Help Desk Voice Agent MVP

## Objective

TechSəs is a polished browser demo for the AssemblyAI Voice Agent Hackathon. It helps a user describe a common IT problem by voice or by selecting a guided example, then returns a concise troubleshooting response and a ticket-ready summary. The MVP is client-only and uses realistic simulated states so the demo is usable without exposing secrets in the browser.

### Primary user story

As a person with a computer problem, I can start a voice session, describe my issue, see the live conversation state, receive a practical next step, and create a draft support ticket with one click.

### Scope

- Dashboard-style single page.
- Simulated microphone/session states: ready, listening, thinking, response.
- Example issue prompts for Wi-Fi, printer, Windows, and account access.
- Live transcript panel and assistant recommendation.
- Ticket summary card with priority, category, and next action.
- Responsive desktop/mobile layout and keyboard-accessible controls.
- Clear visual boundary that AssemblyAI integration is the next wiring step; no secret/API key is embedded.

### Out of scope for this MVP

- Real AssemblyAI WebSocket/API connection.
- Authentication, database persistence, real email/ticket delivery.
- Production-grade diagnosis or medical/safety-critical advice.

## Tech Stack

- React 19 + TypeScript + Vite.
- Tailwind CSS 4 and existing shadcn/ui primitives.
- lucide-react for icons.
- Wouter-compatible single route scaffold.

## Commands

- Dev: `pnpm dev`
- Type check: `pnpm check`
- Build: `pnpm build`
- Format: `pnpm format`

## Project Structure

- `client/src/pages/Home.tsx` — page layout and interactive MVP state.
- `client/src/App.tsx` — app shell and route.
- `client/src/index.css` — design tokens, typography, visual system.
- `client/index.html` — metadata and font loading.
- `tests/` — future unit and interaction tests once the app logic is extracted.

## Code Style

Use small typed data objects and named handlers. Keep presentation components local until reuse is proven. Prefer semantic buttons, explicit `aria-label`s, and state names that describe user-visible behavior.

```tsx
const handleExampleIssue = (issue: Issue) => {
  setActiveIssue(issue.id);
  setTranscript(issue.prompt);
  setSessionState("thinking");
};
```

## Testing Strategy

- First verification: TypeScript check and production build.
- Manual acceptance: start session, choose an issue, receive response, create ticket, reset session, and inspect mobile layout.
- Future test extraction: pure issue-response mapping and ticket formatting should have Vitest coverage.

## Boundaries

- Always: keep API keys out of client code, validate user-visible state transitions, preserve keyboard focus, and run build/check before delivery.
- Ask first: adding a backend, database, authentication, or real external API integration; adding paid assets or a new third-party dependency.
- Never: commit secrets, claim a real AssemblyAI connection when it is simulated, or collect/send user data without explicit consent.

## Success Criteria

- The page clearly communicates TechSəs and its Azerbaijani-friendly IT support purpose.
- The main interaction can be completed without a real microphone: choose an example, see transcript and response, and create a ticket draft.
- Session states are visually distinct and understandable.
- The layout works at desktop and mobile widths without horizontal overflow.
- `pnpm check` and `pnpm build` succeed.

## Open Questions

- Final AssemblyAI Voice Agent API integration and server-side token strategy.
- Whether the hackathon submission should use an Azerbaijani-first or bilingual voice prompt.
- Final project name may remain TechSəs or change before submission.
