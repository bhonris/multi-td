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
