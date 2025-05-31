import { Enemy } from "./models/Enemy";
import { Game } from "./models/Game";
import { Tower } from "./models/Tower";

export interface BuildTowerResult {
  success: boolean;
  tower?: Tower;
  money?: number;
  error?: string;
}

export interface UpgradeTowerResult {
  success: boolean;
  tower?: Tower;
  money?: number;
  error?: string;
}

export type GameUpdateHandler = (gameId: string, game: Game) => void;

export interface GameUpdateEvent {
  enemies: Enemy[];
  towers: Tower[];
  baseHealth: number;
  wave: number;
  state: string;
}
