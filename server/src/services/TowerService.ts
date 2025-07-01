import {
  defaultTowerAttributes,
  towerAttributeScalers,
  towerConfigurations,
} from "@shared/config/towerConfig";
import { TowerAttributes, TowerType } from "@shared/types";
import {
  calculateTowerAttributes,
  towerLevelConfigs,
} from "@shared/utils/towerUpgradeUtils";

export class TowerService {
  getTowerAttributes(type: TowerType, level: number): TowerAttributes {
    // Use the shared upgrade calculation function
    return calculateTowerAttributes(type, level);
  }

  canUpgradeTower(type: TowerType, currentLevel: number): boolean {
    const levelConfig = towerLevelConfigs[type];
    return currentLevel < levelConfig.maxLevel;
  }

  getMaxLevel(type: TowerType): number {
    return towerLevelConfigs[type].maxLevel;
  }

  // Legacy method for backward compatibility
  getBaseTowerAttributes(type: TowerType): TowerAttributes {
    return towerConfigurations[type] || defaultTowerAttributes;
  }
}
