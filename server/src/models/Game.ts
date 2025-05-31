import { Enemy } from "./Enemy";
import { Player } from "./Player";
import { Tower } from "./Tower";

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
  pendingEnemies: Enemy[]; // Enemies waiting to be spawned in the current wave
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
