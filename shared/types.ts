// Game related types
export interface Position {
  x: number;
  y: number;
}

export type TowerType =
  | "basic"
  | "sniper"
  | "splash"
  | "slow"
  | "money"
  | "rapidFire"
  | "support";

export interface TowerAttributes {
  range: number;
  damage: number;
  cooldown: number; // in milliseconds
  cost: number;
  upgradeCost: number;
  splashRadius?: number; // For splash towers
  slowFactor?: number; // For slow towers
  moneyBonus?: number; // For money towers
  supportRadius?: number; // For support towers
  supportBonus?: number; // For support towers
  // Projectile details (like type, speed) if needed for shared logic can be added
  // or handled as client-specific visual data.
  // For now, keeping attributes aligned with server config.
}

export interface Tower {
  id: string;
  type: TowerType;
  playerId: string;
  position: Position;
  level: number;
  attributes: TowerAttributes;
  target?: string; // Enemy ID
  lastAttackTime: number;
  createdAt: Date;
}

export type EnemyType = "basic" | "fast" | "tank" | "healer" | "boss";

export type EnemyAbility = "heal" | "speed" | "spawn" | "shield" | "regen";

export interface EnemyEffect {
  type: "slow" | "damage-over-time" | "stun";
  duration: number; // in milliseconds
  endTime: number; // timestamp when the effect ends
  factor: number; // slow factor or damage per tick
  sourceId: string; // tower ID that applied the effect
}

export interface Enemy {
  id: string;
  type: EnemyType;
  health: number;
  maxHealth: number;
  position: Position;
  speed: number;
  reward: number;
  damage: number; // damage to base if it reaches the end
  abilities: EnemyAbility[];
  effects: EnemyEffect[];
  path: Position[];
  pathIndex: number;
  createdAt: Date;
}

export interface PlayerStatistics {
  towersBuilt: number;
  enemiesDefeated: number;
  moneySpent: number;
  moneyEarned: number;
}

export interface Player {
  id: string;
  username: string;
  isReady: boolean;
  isConnected: boolean;
  money: number;
  statistics: PlayerStatistics;
}

export type GameState =
  | "waiting"
  | "running"
  | "paused"
  | "finished"
  | "game-over";

export type Difficulty = "easy" | "normal" | "hard";

export interface Game {
  id: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  state: GameState;
  difficulty: Difficulty;
  wave: number;
  baseHealth: number;
  enemies: Enemy[];
  pendingEnemies?: Enemy[]; // Added pendingEnemies
  towers: Tower[];
  money: { [playerId: string]: number }; // Consider if this is needed if Player has money
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User related types
export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  highestWave: number;
  totalEnemiesDefeated: number;
  totalTowersBuilt: number;
}

export interface User {
  id: string;
  username: string;
  password?: string; // Added optional password for server-side use
  email: string; // Assuming email is part of the User model
  token?: string; // Optional token, often handled client-side or via http-only cookies
  stats: UserStats;
  createdAt?: Date; // Added createdAt
  updatedAt?: Date; // Added updatedAt
}

// Added from server/src/services/GameService.ts (or similar)
export interface BuildTowerResult {
  success: boolean;
  message?: string;
  tower?: Tower;
  game?: Game; // Or relevant parts of the game state
}

export interface UpgradeTowerResult {
  success: boolean;
  message?: string;
  tower?: Tower;
  game?: Game; // Or relevant parts of the game state
}

// Added from server/src/services/GameLoopService.ts (or similar)
export type GameUpdateHandler = (gameId: string, game: Game) => void;

// Added from server/src/config/wavePatterns.ts
export interface WavePattern {
  wave: number;
  composition: EnemyType[];
  count?: number; // Optional: if not present, count can be calculated or use a default
  boss?: EnemyType; // Optional: specific boss for this wave
  // Add any other wave-specific properties you might need
}
