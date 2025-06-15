import {
  defaultTowerAttributes,
  towerAttributeScalers,
  towerConfigurations,
} from "@shared/config/towerConfig";
import { TowerAttributes, TowerType } from "@shared/types";

export class TowerService {
  getTowerAttributes(type: TowerType, level: number): TowerAttributes {
    const baseAttributes = towerConfigurations[type] || defaultTowerAttributes;

    // Calculate level multiplier for general stats
    const levelMultiplier =
      1 + (level - 1) * (towerAttributeScalers.levelMultiplierFactor || 0.3);
    // Calculate cooldown reduction - lower is better
    const cooldownReduction =
      (towerAttributeScalers.cooldownReductionFactor || 0.1) * (level - 1);

    const attributes: TowerAttributes = {
      ...baseAttributes, // Start with base attributes
      range: Math.floor(baseAttributes.range * levelMultiplier),
      damage: Math.floor(baseAttributes.damage * levelMultiplier),
      // Cooldown decreases with level. Ensure it doesn't go below a minimum (e.g., 50ms)
      cooldown: Math.max(
        50,
        Math.floor(baseAttributes.cooldown * (1 - cooldownReduction))
      ),
      cost: baseAttributes.cost, // Cost to build is fixed per type
      // Upgrade cost scales
      upgradeCost: Math.floor(
        baseAttributes.cost *
          (towerAttributeScalers.upgradeCostLevelFactor || 0.7) *
          level
      ),
    };

    // Handle specific attribute scaling
    if (
      baseAttributes.splashRadius !== undefined &&
      attributes.splashRadius !== undefined
    ) {
      attributes.splashRadius = parseFloat(
        (
          baseAttributes.splashRadius *
          (1 +
            (level - 1) *
              (towerAttributeScalers.splashRadiusLevelFactor || 0.3))
        ).toFixed(2)
      );
    }
    if (
      baseAttributes.slowFactor !== undefined &&
      attributes.slowFactor !== undefined
    ) {
      attributes.slowFactor = parseFloat(
        (
          baseAttributes.slowFactor +
          (level - 1) * (towerAttributeScalers.slowFactorLevelBonus || 0.1)
        ).toFixed(2)
      );
      // Ensure slow factor doesn't exceed a max (e.g., 0.9 for 90% slow)
      attributes.slowFactor = Math.min(0.9, attributes.slowFactor);
    }
    if (
      baseAttributes.moneyBonus !== undefined &&
      attributes.moneyBonus !== undefined
    ) {
      attributes.moneyBonus = parseFloat(
        (
          baseAttributes.moneyBonus +
          (level - 1) * (towerAttributeScalers.moneyBonusLevelBonus || 0.1)
        ).toFixed(2)
      );
    }
    if (
      baseAttributes.supportRadius !== undefined &&
      attributes.supportRadius !== undefined
    ) {
      attributes.supportRadius = parseFloat(
        (
          baseAttributes.supportRadius *
          (1 +
            (level - 1) *
              (towerAttributeScalers.supportRadiusLevelFactor || 0.15))
        ).toFixed(2)
      );
    }
    if (
      baseAttributes.supportBonus !== undefined &&
      attributes.supportBonus !== undefined
    ) {
      attributes.supportBonus = parseFloat(
        (
          baseAttributes.supportBonus +
          (level - 1) * (towerAttributeScalers.supportBonusLevelBonus || 0.05)
        ).toFixed(2)
      );
    }

    return attributes;
  }

  // getBaseTowerAttributes is no longer needed as we directly use towerConfigurations
}
