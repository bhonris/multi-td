import { TowerAttributes, TowerType } from "../models/Tower";

export class TowerService {
  getTowerAttributes(type: TowerType, level: number): TowerAttributes {
    const baseAttributes = this.getBaseTowerAttributes(type);

    // Calculate level multiplier
    const levelMultiplier = 1 + (level - 1) * 0.3;

    // Upgrade attributes based on level
    return {
      range: Math.floor(baseAttributes.range * levelMultiplier),
      damage: Math.floor(baseAttributes.damage * levelMultiplier),
      cooldown: Math.floor(baseAttributes.cooldown * (1 / levelMultiplier)), // Lower cooldown is better
      splashRadius: baseAttributes.splashRadius
        ? Math.floor(baseAttributes.splashRadius * levelMultiplier)
        : undefined,
      slowFactor: baseAttributes.slowFactor
        ? baseAttributes.slowFactor + (level - 1) * 0.1
        : undefined,
      moneyBonus: baseAttributes.moneyBonus
        ? baseAttributes.moneyBonus + (level - 1) * 0.1
        : undefined,
      cost: baseAttributes.cost,
      upgradeCost: Math.floor(baseAttributes.cost * 0.7 * level),
    };
  }

  private getBaseTowerAttributes(type: TowerType): TowerAttributes {
    switch (type) {
      case "basic":
        return {
          range: 3,
          damage: 20,
          cooldown: 1000, // 1 second
          cost: 100,
          upgradeCost: 70,
        };

      case "sniper":
        return {
          range: 6,
          damage: 50,
          cooldown: 2000, // 2 seconds
          cost: 200,
          upgradeCost: 140,
        };

      case "splash":
        return {
          range: 2,
          damage: 15,
          splashRadius: 1,
          cooldown: 1500, // 1.5 seconds
          cost: 150,
          upgradeCost: 105,
        };

      case "slow":
        return {
          range: 3,
          damage: 5,
          slowFactor: 0.3, // Slows enemies by 30%
          cooldown: 1000, // 1 second
          cost: 150,
          upgradeCost: 105,
        };

      case "money":
        return {
          range: 4,
          damage: 10,
          moneyBonus: 0.2, // 20% bonus money from enemies killed
          cooldown: 1000, // 1 second
          cost: 200,
          upgradeCost: 140,
        };

      default:
        return {
          range: 3,
          damage: 20,
          cooldown: 1000,
          cost: 100,
          upgradeCost: 70,
        };
    }
  }
}
