export interface Position {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover' | 'won';

export interface Level {
  id: number;
  targetScore: number;
  speed: number;
}

export interface GameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction;
  status: GameStatus;
  score: number;
  highScore: number;
  level: number;
  obstacles: Position[];
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'MOVE_SNAKE' }
  | { type: 'CHANGE_DIRECTION'; payload: Direction }
  | { type: 'RESET' };
