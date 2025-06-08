// Game related types
export interface Position {
  x: number;
  y: number;
}

export interface Tower {
  id: string;
  type: TowerType;
  playerId: string;
  position: Position;
  level: number;
  attributes: TowerAttributes;
  target?: string;
  lastAttackTime: number;
  createdAt: Date;
}

export type TowerType = "basic" | "sniper" | "splash" | "slow" | "money";

export interface TowerAttributes {
  range: number;
  damage: number;
  cooldown: number;
  splashRadius?: number;
  slowFactor?: number;
  moneyBonus?: number;
  cost: number;
  upgradeCost: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  health: number;
  maxHealth: number;
  position: Position;
  speed: number;
  reward: number;
  damage: number;
  abilities: EnemyAbility[];
  effects: EnemyEffect[];
  path: Position[];
  pathIndex: number;
  createdAt: Date;
}

export type EnemyType = "basic" | "fast" | "tank" | "healer" | "boss";

export type EnemyAbility = "heal" | "speed" | "spawn" | "shield" | "regen";

export interface EnemyEffect {
  type: "slow" | "damage-over-time" | "stun";
  duration: number;
  endTime: number;
  factor: number;
  sourceId: string;
}

export interface Player {
  id: string;
  username: string;
  isReady: boolean;
  isConnected: boolean;
  money: number;
  statistics: PlayerStatistics;
}

export interface PlayerStatistics {
  towersBuilt: number;
  enemiesDefeated: number;
  moneySpent: number;
  moneyEarned: number;
}

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
  towers: Tower[];
  money: { [playerId: string]: number };
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type GameState =
  | "waiting"
  | "running"
  | "paused"
  | "finished"
  | "game-over";
export type Difficulty = "easy" | "normal" | "hard";

// User related types
export interface User {
  id: string;
  username: string;
  email: string;
  token?: string;
  stats: UserStats;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  highestWave: number;
  totalEnemiesDefeated: number;
  totalTowersBuilt: number;
}
