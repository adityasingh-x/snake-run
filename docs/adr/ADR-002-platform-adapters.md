# ADR-002: Platform Adapter Pattern for Input and Audio

**Status:** Accepted
**Date:** 2026-06-01
**Milestone:** 1 — Foundation Refactor

## Context

Input handling (keyboard, touch) and audio output (sound effects) were previously implemented as React hooks (`useKeyboard`, `useTouch`, `useSound`). Each hook owned its lifecycle, attached DOM listeners in `useEffect`, and tore them down in the cleanup function. This had three concrete problems:

1. **Coupled to React** — the input layer could not be reused from a Capacitor plugin, a Tauri command, or a future non-React host. Each new platform would require re-implementing gesture detection and audio synthesis.
2. **Two `SoundManager` instances, one mute toggle** — the `useSound` hook and `Game.tsx` each instantiated their own `SoundManager` (see `review.md` issue #3). The mute icon updated the UI instance's `enabled` flag, but the engine (and therefore playback) used a different instance whose flag never changed. Sound could not actually be muted.
3. **Listener churn** — `useKeyboard` depended on five callback props; `Game.tsx` passed inline arrows for several, so the effect detached and re-attached the global `keydown` listener on every render.

## Decision

Isolate input and audio in framework-agnostic adapters under `src/platform/`. React hooks become thin wrappers.

### Module Layout

```
src/platform/
  keyboard.ts    # createKeyboardListener(handler) -> { attach, detach, setDirection, setStatus }
  touch.ts       # createTouchListener(handler)    -> { attach, detach, setEnabled }
  sound.ts       # SoundManager class + sharedSoundManager singleton
```

### Adapters vs. Hooks

| Concern            | Adapter (platform/)                | Hook (hooks/)                          |
|--------------------|------------------------------------|----------------------------------------|
| Lifecycle          | `attach()` / `detach()`            | `useEffect` calls them                 |
| Closure freshness  | Mutable state via `set*` methods   | Refs that mirror props                 |
| React deps         | None                               | Just the hook's own props              |
| Test surface       | Pure DOM functions                 | React Testing Library                  |

The adapters expose mutable, imperative handles — listeners and state are stored on the returned object. This avoids the closure-staleness problem without any React-specific magic.

### Shared SoundManager

`SoundManager` is a class. A single `sharedSoundManager` instance is exported from `src/platform/sound.ts`. Both the engine wiring (`useGame.ts`) and the UI toggle (`Game.tsx`) import the same instance, so the mute toggle now actually mutes playback.

```typescript
// src/platform/sound.ts
export class SoundManager { /* … */ }
export const sharedSoundManager = new SoundManager();
```

## Consequences

### Positive

- **Reusable from any host** — a Capacitor plugin can `createTouchListener(...)` and call `attach(el, true)` without React. A Tauri command can `sharedSoundManager.playEat()` without a DOM.
- **Mute toggle works** — one `SoundManager` instance, one `enabled` flag, one source of truth.
- **Stable keyboard listener** — `useKeyboard` now depends on stable callback identities from the parent. The parent uses `useCallback` for the actions it passes.
- **Smaller React surface** — the hooks are ~30 lines each and exist only to bridge React lifecycle to adapter lifecycle.
- **Direct adapter testability** — `keyboard.ts` and `touch.ts` can be unit-tested with synthetic `KeyboardEvent`/`TouchEvent` without React.

### Negative

- **Two layers of API** — readers must learn both `createKeyboardListener` and `useKeyboard`. Mitigated by the hook being a near-trivial wrapper.
- **Mutable adapter handles** — the `{ attach, detach, setDirection, … }` object is mutated in place. Easy to misuse (e.g., calling `attach` twice). Mitigated by the API being small and clearly named.
- **Singleton for sound** — `sharedSoundManager` is a process-wide singleton, which makes unit testing in isolation harder (a test that toggles sound will affect other tests). Acceptable for now because sound is a side concern; tests that need to mute it can stub `SoundManager` methods.

### Mitigations

- Document the two-layer API in ARCHITECTURE.md and SPEC.md.
- Future improvement: extract `sharedSoundManager` to a factory or accept it as a dependency if test isolation becomes a real problem.

## Alternatives Considered

### A. Keep hooks, share state via context

Use a React Context to share one `SoundManager` across `useSound` consumers. Solves the mute bug but keeps the input layer coupled to React. Rejected — does not unblock multi-platform.

### B. Web platform APIs only (no abstraction)

Drive input/audio directly from the engine. Rejected — the engine is supposed to be platform-agnostic; it must not import `window.addEventListener` or `AudioContext`.

### C. Dependency-inject the platform layer

Pass `keyboard`, `touch`, and `sound` adapters to the engine constructor. Cleaner separation but adds ceremony for a small game. Rejected for now; revisit if the engine grows beyond one platform.

## References

- ARCHITECTURE.md § "Platform Adapters"
- SPEC.md § "8. Input System" and § "9. Sound System"
- `src/platform/keyboard.ts`
- `src/platform/touch.ts`
- `src/platform/sound.ts`
- `src/hooks/useKeyboard.ts`, `src/hooks/useTouch.ts`
- `src/components/Game.tsx` (consumer)
- `review.md` § "Bug 3: Sound toggle does not actually mute sound" and § "Bug 5: Keyboard listener re-created on every render"
