import { EnemyAbility, EnemyType } from "../types";

export interface EnemyBaseAttributes {
  health: number;
  speed: number;
  reward: number;
  damage: number;
  abilities: EnemyAbility[];
}

export const enemyConfigurations: Record<EnemyType, EnemyBaseAttributes> = {
  basic: {
    health: 100,
    speed: 1.0, // Was 0.5, then 1.5 in a comment, then 0.5. Sticking to 0.5 as per latest switch case
    reward: 15,
    damage: 1,
    abilities: [],
  },
  fast: {
    health: 70,
    speed: 2.0, // Was 1.5, then 2.0
    reward: 20,
    damage: 1,
    abilities: [], // Abilities like 'speed' are added conditionally in getEnemyAbilities based on waveNumber
  },
  tank: {
    health: 250,
    speed: 0.8, // Was 0.8, then 1.0
    reward: 25,
    damage: 2,
    abilities: [], // Abilities like 'shield' are added conditionally
  },
  healer: {
    health: 120,
    speed: 1.0, // Was 0.9, then 1.2
    reward: 20,
    damage: 1,
    abilities: ["heal" as EnemyAbility], // 'heal' is a base ability for healer
  },
  boss: {
    health: 1000, // Base health, waveNumber multiplier is applied in getEnemyHealth
    speed: 0.8, // Was 0.6, then 0.8
    reward: 100,
    damage: 10,
    abilities: ["shield" as EnemyAbility], // Base abilities, others are added conditionally
  },
};

export const defaultEnemyAttributes: EnemyBaseAttributes = {
  health: 100,
  speed: 1,
  reward: 5,
  damage: 1,
  abilities: [],
};

export const enemyAttributeScalers = {
  healthWaveFactor: 0.2,
  rewardWaveFactor: 0.1,
  damageWaveFactor: 0.15,
  globalSpeedFactor: 0.3,
};
