import { TowerAttributes, TowerType, Tower } from "../types";
import {
  towerConfigurations,
  towerAttributeScalers,
} from "../config/towerConfig";

export interface UpgradePreview {
  currentLevel: number;
  nextLevel: number;
  currentAttributes: TowerAttributes;
  upgradedAttributes: TowerAttributes;
  upgradeCost: number;
  isMaxLevel: boolean;
  canAfford: boolean;
  statDeltas: {
    damage: number;
    range: number;
    cooldown: number;
    splashRadius?: number;
    slowFactor?: number;
    moneyBonus?: number;
    supportRadius?: number;
    supportBonus?: number;
  };
}

export interface TowerLevelConfig {
  maxLevel: number;
  milestones: { level: number; bonus: Partial<TowerAttributes> }[];
}

// Max levels for each tower type
export const towerLevelConfigs: Record<TowerType, TowerLevelConfig> = {
  basic: {
    maxLevel: 5,
    milestones: [
      { level: 3, bonus: { range: 0.5 } },
      { level: 5, bonus: { damage: 10 } },
    ],
  },
  sniper: {
    maxLevel: 5,
    milestones: [
      { level: 3, bonus: { splashRadius: 0.5 } },
      { level: 5, bonus: { range: 1 } },
    ],
  },
  splash: {
    maxLevel: 5,
    milestones: [
      { level: 3, bonus: { splashRadius: 0.5 } },
      { level: 5, bonus: { damage: 5, splashRadius: 0.5 } },
    ],
  },
  slow: {
    maxLevel: 5,
    milestones: [
      { level: 3, bonus: { slowFactor: 0.1 } },
      { level: 5, bonus: { range: 1, slowFactor: 0.1 } },
    ],
  },
  money: {
    maxLevel: 4,
    milestones: [
      { level: 3, bonus: { moneyBonus: 0.1 } },
      { level: 4, bonus: { range: 1, moneyBonus: 0.15 } },
    ],
  },
  rapidFire: {
    maxLevel: 6,
    milestones: [
      { level: 3, bonus: { damage: 3 } },
      { level: 5, bonus: { range: 0.5 } },
      { level: 6, bonus: { cooldown: -50 } },
    ],
  },
  support: {
    maxLevel: 4,
    milestones: [
      { level: 2, bonus: { supportRadius: 0.5 } },
      { level: 4, bonus: { supportBonus: 0.1, supportRadius: 1 } },
    ],
  },
};

/**
 * Calculates tower attributes for a given level
 */
export function calculateTowerAttributes(
  towerType: TowerType,
  level: number
): TowerAttributes {
  const baseConfig = towerConfigurations[towerType];
  const levelConfig = towerLevelConfigs[towerType];

  if (!baseConfig) {
    throw new Error(`Invalid tower type: ${towerType}`);
  }

  const scalers = towerAttributeScalers;
  const levelBonus = level - 1; // Level 1 is base, level 2 gets first bonus

  // Calculate base scaled attributes
  const scaledAttributes: TowerAttributes = {
    range:
      baseConfig.range +
      baseConfig.range * scalers.levelMultiplierFactor * levelBonus,
    damage:
      baseConfig.damage +
      baseConfig.damage * scalers.levelMultiplierFactor * levelBonus,
    cooldown: Math.max(
      100, // Minimum cooldown
      baseConfig.cooldown -
        baseConfig.cooldown * scalers.cooldownReductionFactor * levelBonus
    ),
    cost: baseConfig.cost,
    upgradeCost: Math.floor(
      baseConfig.upgradeCost *
        Math.pow(scalers.upgradeCostLevelFactor, levelBonus)
    ),
  };

  // Add type-specific attributes with scaling
  if (baseConfig.splashRadius !== undefined) {
    scaledAttributes.splashRadius =
      baseConfig.splashRadius +
      baseConfig.splashRadius * scalers.splashRadiusLevelFactor * levelBonus;
  }

  if (baseConfig.slowFactor !== undefined) {
    scaledAttributes.slowFactor = Math.min(
      0.9, // Maximum slow factor
      baseConfig.slowFactor + scalers.slowFactorLevelBonus * levelBonus
    );
  }

  if (baseConfig.moneyBonus !== undefined) {
    scaledAttributes.moneyBonus =
      baseConfig.moneyBonus + scalers.moneyBonusLevelBonus * levelBonus;
  }

  if (baseConfig.supportRadius !== undefined) {
    scaledAttributes.supportRadius =
      baseConfig.supportRadius +
      baseConfig.supportRadius * scalers.supportRadiusLevelFactor * levelBonus;
  }

  if (baseConfig.supportBonus !== undefined) {
    scaledAttributes.supportBonus =
      baseConfig.supportBonus + scalers.supportBonusLevelBonus * levelBonus;
  }

  // Apply milestone bonuses
  levelConfig.milestones.forEach((milestone) => {
    if (level >= milestone.level) {
      Object.entries(milestone.bonus).forEach(([key, value]) => {
        if (key in scaledAttributes && value !== undefined) {
          (scaledAttributes as any)[key] += value;
        }
      });
    }
  });

  return scaledAttributes;
}

/**
 * Calculates upgrade preview for a tower
 */
export function calculateUpgradePreview(
  towerType: TowerType,
  currentLevel: number,
  playerMoney: number
): UpgradePreview {
  const levelConfig = towerLevelConfigs[towerType];
  const nextLevel = currentLevel + 1;
  const isMaxLevel = currentLevel >= levelConfig.maxLevel;

  const currentAttributes = calculateTowerAttributes(towerType, currentLevel);
  const upgradedAttributes = isMaxLevel
    ? currentAttributes
    : calculateTowerAttributes(towerType, nextLevel);

  const upgradeCost = isMaxLevel ? 0 : upgradedAttributes.upgradeCost;
  const canAfford = playerMoney >= upgradeCost;

  const statDeltas = {
    damage: upgradedAttributes.damage - currentAttributes.damage,
    range: upgradedAttributes.range - currentAttributes.range,
    cooldown: upgradedAttributes.cooldown - currentAttributes.cooldown,
    splashRadius:
      (upgradedAttributes.splashRadius || 0) -
      (currentAttributes.splashRadius || 0),
    slowFactor:
      (upgradedAttributes.slowFactor || 0) -
      (currentAttributes.slowFactor || 0),
    moneyBonus:
      (upgradedAttributes.moneyBonus || 0) -
      (currentAttributes.moneyBonus || 0),
    supportRadius:
      (upgradedAttributes.supportRadius || 0) -
      (currentAttributes.supportRadius || 0),
    supportBonus:
      (upgradedAttributes.supportBonus || 0) -
      (currentAttributes.supportBonus || 0),
  };

  return {
    currentLevel,
    nextLevel,
    currentAttributes,
    upgradedAttributes,
    upgradeCost,
    isMaxLevel,
    canAfford,
    statDeltas,
  };
}

/**
 * Formats stat delta for display
 */
export function formatStatDelta(value: number, suffix = ""): string {
  if (value === 0) return "";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}${suffix}`;
}

/**
 * Gets upgrade availability indicator
 */
export function getUpgradeIndicator(
  towerType: TowerType,
  currentLevel: number,
  playerMoney: number
): "available" | "expensive" | "maxed" | "none" {
  const preview = calculateUpgradePreview(towerType, currentLevel, playerMoney);

  if (preview.isMaxLevel) return "maxed";
  if (preview.canAfford) return "available";
  if (preview.upgradeCost <= playerMoney * 1.5) return "expensive";
  return "none";
}

/**
 * Calculates total upgrade cost to reach a target level
 */
export function calculateTotalUpgradeCost(
  towerType: TowerType,
  fromLevel: number,
  toLevel: number
): number {
  let totalCost = 0;
  for (let level = fromLevel; level < toLevel; level++) {
    const attributes = calculateTowerAttributes(towerType, level + 1);
    totalCost += attributes.upgradeCost;
  }
  return totalCost;
}

/**
 * Calculates total money spent on a tower (initial cost + all upgrade costs)
 */
export function calculateTotalTowerCost(
  towerType: TowerType,
  currentLevel: number
): number {
  const baseConfig = towerConfigurations[towerType];
  const initialCost = baseConfig.cost;

  if (currentLevel <= 1) {
    return initialCost;
  }

  // Calculate total upgrade costs from level 1 to current level
  const totalUpgradeCosts = calculateTotalUpgradeCost(
    towerType,
    1,
    currentLevel
  );

  return initialCost + totalUpgradeCosts;
}

/**
 * Calculates sell value for a tower (80% of total cost spent)
 */
export function calculateSellValue(
  towerType: TowerType,
  currentLevel: number
): number {
  const totalCost = calculateTotalTowerCost(towerType, currentLevel);
  return Math.floor(totalCost * 0.8);
}
