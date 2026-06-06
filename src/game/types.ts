export interface Position {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameStatus = 'idle' | 'playing' | 'paused' | 'levelComplete' | 'gameover' | 'won';

export interface Level {
  id: number;
  name: string;
  description: string;
  foodRequired: number;
  speed: number;
  layout: Position[];
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
  lastUnlockedLevel: number;
  foodEaten: number;
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'MOVE_SNAKE' }
  | { type: 'CHANGE_DIRECTION'; payload: Direction }
  | { type: 'RESET' }
  | { type: 'CONTINUE_GAME' }
  | { type: 'START_AT_LEVEL'; payload: number };
