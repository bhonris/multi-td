export interface User {
  id: string;
  username: string;
  password: string; // This would be hashed in a real application
  email: string;
  stats: UserStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  highestWave: number;
  totalEnemiesDefeated: number;
  totalTowersBuilt: number;
}
