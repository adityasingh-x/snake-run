# ADR-004: State-Based Screen Navigation (No React Router)

**Status:** Accepted
**Date:** 2026-06-08
**Milestone:** 12 — User Experience & Navigation

## Context

Milestone 12 introduced six screens: Main Menu, Game, Statistics, Achievements, Settings, and Help / How To Play. The project needed a way to switch between these screens.

Adding React Router (or any routing library) would introduce:

1. A new runtime dependency for a single-page game with no deep-linking requirements
2. URL-based routing semantics that do not map cleanly to game state (e.g., "pause → return to menu" is not a URL change)
3. Additional bundle size for functionality that a single `useState` call provides

The game is a single-page application with no server-side routing, no bookmarkable URLs per screen, and no nested route hierarchies.

## Decision

Use a `useState<Screen>` in `App.tsx` as the single source of truth for screen navigation. Screen components are stateless presenters that receive data as props and call navigation callbacks upward.

```typescript
const [screen, setScreen] = useState<Screen>('menu');
```

The `Screen` type is a union literal: `'menu' | 'game' | 'statistics' | 'achievements' | 'settings' | 'help'`.

`App.tsx` renders the appropriate screen component via conditional rendering (logical AND guards). Navigation is performed by calling `setScreen(next)` from callback props.

### Data Flow

- `App.tsx` calls `loadGameProfile()` once on mount and passes slices to screens as props
- Screen components never read `localStorage` directly
- `src/game/profile.ts` is the centralized persistence service
- `src/hooks/useTheme.ts` is the only exception (SettingsScreen reads theme state independently, which is acceptable since theme is a live UI preference, not profile data)

## Consequences

### Positive

- **Zero new dependencies** — no routing library added to the project
- **Bundle size unchanged** — navigation is ~5 lines of state logic
- **Simple to test** — screen transitions are `setState` calls, no router context to mock
- **Easy to replace later** — if deep-linking or URL-based navigation becomes a requirement, the `Screen` type and callback pattern map cleanly to React Router routes
- **Matches project philosophy** — small, simple, maintainable solution for the current scope

### Negative

- **No URL-based navigation** — players cannot bookmark or share a specific screen via URL
- **Browser back/forward buttons do not work** — history is not managed
- **Manual conditional rendering** — adding a 7th screen requires a new `&&` guard in `App.tsx`

### Mitigations

- Deep-linking is not a current or planned requirement for a single-player game
- Browser back/forward is not expected behavior for game screens (players navigate via buttons)
- Conditional rendering scales fine for ≤10 screens; beyond that, a routing library would be justified

## Alternatives Considered

### A. React Router

Add `react-router-dom` with routes like `/menu`, `/game`, `/statistics`, etc. Rejected — overkill for 6 screens with no deep-linking, no nested routes, and no server-side rendering.

### B. Hash-based routing

Use `window.location.hash` for screen state without a library. Rejected — adds URL complexity without meaningful benefit. Players do not expect to share or bookmark game screens.

### C. Context-based navigation

Create a `NavigationContext` with provider/consumer pattern. Rejected — adds indirection for a single consumer (`App.tsx`). The `useState` pattern is simpler and equally testable.

## References

- `plans/ACTIVE.md` § Phase 1: "No React Router"
- `src/App.tsx`
- `src/types/navigation.ts`
- `src/game/profile.ts`
- `docs/ROADMAP.md` § "Milestone 12 — User Experience & Navigation"
