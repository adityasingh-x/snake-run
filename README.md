<!--
AI_AGENT_INSTRUCTION:
CRITICAL WORKSPACE CONTRACT: Before you execute commands, modify code, or alter documentation, you MUST read the comprehensive rules, constraints, and file permissions detailed in AGENTS.md at the root of this repository. Adherence to AGENTS.md is mandatory for this session. Do not ignore this directive.
-->

# Snake Game

Classic Snake game built with React, TypeScript, and Vite. Navigate a snake on a 20x20 grid, eat food to grow, avoid walls and obstacles. Complete 10 levels to win.

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Start dev server                            |
| `npm run build`      | TypeScript check + production build         |
| `npm run preview`    | Preview build (accessible on local network) |
| `npm test`           | Run test suite                              |
| `npm run test:watch` | Run tests in watch mode                     |
| `npm run lint`       | Lint with ESLint                            |

## Controls

- **Move:** Arrow keys or WASD
- **Start/Pause/Restart:** Space
- **Mobile:** Swipe gestures + on-screen D-pad

## Features

- 10 levels with increasing difficulty (speed ramp + obstacles)
- Touch controls with swipe detection and D-pad overlay
- Sound effects via Web Audio API (toggle in scoreboard)
- High score persistence via localStorage
- CSS Modules for scoped component styles
- Keyboard accessible with screen reader support
- Environment configuration via `.env`

## Tech Stack

- React 19 + TypeScript 6 (strict mode)
- Vite 8 with CSS Modules
- Vitest for unit testing (75 tests)
- Web Audio API for sound synthesis

## Project Structure

```
src/
├── components/    # React components + CSS Modules
├── hooks/         # useSnakeGame, useKeyboard, useTouch, useSound
├── utils/         # gameLogic, levelData, constants, storage
├── types/         # TypeScript interfaces
└── __tests__/     # Unit tests (gameLogic, levelData)
```

## Testing

```bash
npm test           # Single run
npm run test:watch # Watch mode
```
