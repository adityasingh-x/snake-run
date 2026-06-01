# Snake Run

Classic Snake Run built with React, TypeScript, and Vite.

Navigate a snake on a 20x20 grid, eat food to grow, avoid walls and obstacles, and complete 10 levels to win.

## Project Goal

Create a polished Snake-inspired game that works well on desktop and mobile devices.

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

- 10 levels with increasing difficulty
- Touch controls with swipe detection and D-pad overlay
- Sound effects via Web Audio API
- High score persistence via localStorage
- CSS Modules for scoped component styles
- Keyboard accessible with screen reader support
- Environment configuration via `.env`

## Tech Stack

- React 19
- TypeScript 6 (strict mode)
- Vite 8
- CSS Modules
- Vitest
- Web Audio API

## Documentation

| File                  | Purpose                                   |
| --------------------- | ----------------------------------------- |
| AGENTS.md             | AI development workflow and project rules |
| SPEC.md               | Game behavior specification               |
| ARCHITECTURE.md       | Technical architecture and code structure |
| docs/PROJECT_STATE.md | Current project status                    |
| docs/ROADMAP.md       | Future roadmap                            |
| docs/IDEAS_BACKLOG.md | Future ideas and experiments              |

## Project Structure

```text
src/
├── game/          # React-independent game engine
├── platform/      # Platform-specific adapters (keyboard, touch, sound)
├── hooks/         # React bridge hooks
├── components/    # React UI
├── types/         # Shared types
└── utils/         # Legacy compatibility re-exports
```

## Testing

```bash
npm test
npm run test:watch
```
