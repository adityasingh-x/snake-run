# Plan: Directional Snake Eyes

## Objective
Implement visual directional cues for the snake head (e.g., eyes) based on the current movement direction.

## Context
- `src/components/Cell.tsx`: The rendering component for each grid cell.
- `src/hooks/useSnakeGame.ts`: Manages snake state and position.
- `src/utils/gameLogic.ts`: Contains logic for snake movement.

## Implementation Steps

1. **Verify State Tracking:** Ensure the snake head's current direction is easily accessible to the rendering layer.
2. **Component Update (`Cell.tsx`):**
    - Add visual markers (e.g., small circles or CSS pseudo-elements) to the snake head.
    - Conditional rendering or dynamic CSS classes to rotate the markers based on `direction`.
3. **Refinement:**
    - Test the appearance for all four directions (UP, DOWN, LEFT, RIGHT).
    - Ensure styling remains consistent with the project's CSS Module design.

## Verification
- Run existing unit tests (`npm test`) to ensure no regressions.
- Verify visual changes manually by running the dev server.
- Ensure behavior remains consistent across desktop and mobile.

## Documentation
- Update `SPEC.md` if the visual specification for the snake head changes.
