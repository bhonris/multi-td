// filepath: c:/repos/td-vibe/shared/config/towerConfig.ts
import { TowerAttributes, TowerType } from "../types";

export const towerConfigurations: Record<
  TowerType,
  TowerAttributes & {
    projectile?: { type: string; speed: number; splashRadius?: number };
  }
> = {
  basic: {
    range: 3,
    damage: 20,
    cooldown: 1000, // 1 second
    cost: 100,
    upgradeCost: 70,
    projectile: {
      type: "arrow",
      speed: 10,
    },
  },
  sniper: {
    range: 6,
    damage: 50,
    cooldown: 2000, // 2 seconds
    cost: 200,
    upgradeCost: 140,
    projectile: {
      type: "bullet",
      speed: 20,
    },
  },
  splash: {
    range: 2,
    damage: 15,
    splashRadius: 1, // Specific to splash tower
    cooldown: 1500, // 1.5 seconds
    cost: 150,
    upgradeCost: 105,
    projectile: {
      type: "cannonball",
      speed: 5,
      splashRadius: 1, // Projectile splash, matches tower's splashRadius
    },
  },
  slow: {
    range: 3,
    damage: 5, // Minimal direct damage
    slowFactor: 0.3, // Slows enemies by 30%
    cooldown: 1000, // 1 second
    cost: 150,
    upgradeCost: 105,
    projectile: {
      type: "ice",
      speed: 7,
    },
  },
  money: {
    range: 4, // Can have range if it also attacks
    damage: 10, // Can do some damage
    moneyBonus: 0.2, // 20% bonus money
    cooldown: 1000, // 1 second, if it attacks
    cost: 200,
    upgradeCost: 140,
    // projectile: { type: "coin", speed: 8 }, // Optional projectile if it attacks
  },
  rapidFire: {
    range: 2, // Short range
    damage: 8, // Low damage
    cooldown: 250, // Very fast, 0.25 seconds
    cost: 175,
    upgradeCost: 120,
    projectile: {
      type: "bullet",
      speed: 15,
    },
  },
  support: {
    range: 0, // Support towers do not attack directly
    damage: 0, // No direct damage
    cooldown: 0, // No attack cooldown
    supportRadius: 2, // Radius within which it buffs other towers
    supportBonus: 0.2, // 20% damage bonus to towers in radius
    cost: 250,
    upgradeCost: 150,
    // No projectile for support towers
  },
};

export const defaultTowerAttributes: TowerAttributes = {
  range: 3,
  damage: 20,
  cooldown: 1000,
  cost: 100,
  upgradeCost: 70,
};

export const towerAttributeScalers = {
  levelMultiplierFactor: 0.4, // Increased for more noticeable upgrades
  cooldownReductionFactor: 0.12, // Slightly faster cooldown reduction
  splashRadiusLevelFactor: 0.25, // More splash radius growth
  slowFactorLevelBonus: 0.08, // Better slow effect scaling
  moneyBonusLevelBonus: 0.12, // Better money generation scaling
  supportRadiusLevelFactor: 0.2, // More support radius growth
  supportBonusLevelBonus: 0.08, // Better support bonus scaling
  upgradeCostLevelFactor: 1.5, // More expensive upgrades (was 0.7)
};

// Helper function, similar to client's getBaseTowerAttributesForClient
export const getTowerAttributes = (
  towerType: TowerType
):
  | (TowerAttributes & {
      projectile?: { type: string; speed: number; splashRadius?: number };
    })
  | null => {
  return towerConfigurations[towerType] || null;
};
