import { EnemyType } from "../types";

export interface WavePatternRule {
  type: EnemyType;
  condition: (enemyIndex: number, totalEnemiesInWave: number) => boolean;
}

export interface WavePattern {
  minWave?: number;
  maxWave?: number;
  rules: WavePatternRule[];
  defaultType: EnemyType;
}

export const wavePatterns: WavePattern[] = [
  {
    // Waves 1, 2 (matches if waveNumber <= maxWave)
    maxWave: 2,
    rules: [], // No specific rules, only default
    defaultType: "basic",
  },
  {
    // Waves 3, 4 (matches if waveNumber >= minWave and waveNumber <= maxWave)
    minWave: 3,
    maxWave: 4,
    rules: [{ type: "fast", condition: (index) => index % 5 === 0 }],
    defaultType: "basic",
  },
  {
    // Waves 5-9
    minWave: 5,
    maxWave: 9,
    rules: [
      // Order of rules matters: the first matching rule is applied
      { type: "fast", condition: (index) => index % 5 === 0 },
      { type: "tank", condition: (index) => index % 7 === 0 }, // Applied if not index % 5 === 0
    ],
    defaultType: "basic",
  },
  {
    // Waves 10+ (matches if waveNumber >= minWave)
    minWave: 10,
    rules: [
      // Order of rules matters
      { type: "fast", condition: (index) => index % 5 === 0 },
      { type: "tank", condition: (index) => index % 7 === 0 },
      { type: "healer", condition: (index) => index % 10 === 0 },
    ],
    defaultType: "basic",
  },
];
