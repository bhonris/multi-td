import { Difficulty } from "../types";

export interface GameSettings {
  initialBaseHealth: Record<Difficulty, number>;
  initialMoney: Record<Difficulty, number>;
  enemySpawnDelayMs: number;
  gameTickRateMs: number;
  maxTowerLevel: number;
}

export const gameSettingsConfig: GameSettings = {
  initialBaseHealth: {
    easy: 100,
    normal: 80,
    hard: 60,
  },
  initialMoney: {
    easy: 1000,
    normal: 200, // This was 200 in GameService, previously 500 in some comments
    hard: 150, // This was 150 in GameService, previously 300 in some comments
  },
  enemySpawnDelayMs: 500, // from ENEMY_SPAWN_DELAY_MS in EnemyService
  gameTickRateMs: 100, // from GameLoopService constructor in GameService
  maxTowerLevel: 3, // from upgradeTower method in GameService
};
