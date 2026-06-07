export interface Position {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameStatus = 'idle' | 'playing' | 'paused' | 'levelComplete' | 'gameover' | 'won';

export type FoodType = 'normal' | 'gold' | 'poison' | 'slow';

export interface Food {
  position: Position;
  type: FoodType;
  timer: number;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  foodRequired: number;
  speed: number;
  layout: Position[];
  wrapAround?: boolean;
  portals?: [Position, Position][];
}

export interface GameState {
  snake: Position[];
  food: Food;
  direction: Direction;
  nextDirection: Direction;
  status: GameStatus;
  score: number;
  highScore: number;
  level: number;
  obstacles: Position[];
  lastUnlockedLevel: number;
  foodEaten: number;
  isEndless: boolean;
  speedEffectTicks: number;
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'MOVE_SNAKE' }
  | { type: 'CHANGE_DIRECTION'; payload: Direction }
  | { type: 'RESET' }
  | { type: 'CONTINUE_GAME' }
  | { type: 'START_AT_LEVEL'; payload: number }
  | { type: 'START_ENDLESS_GAME' };
