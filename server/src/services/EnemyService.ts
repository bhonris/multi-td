import {
  defaultEnemyAttributes,
  enemyAttributeScalers,
  enemyConfigurations,
} from "@shared/config/enemyConfig";
import { wavePatterns } from "@shared/config/wavePatterns";
import {
  Difficulty,
  Enemy,
  EnemyAbility,
  EnemyType,
  Position,
} from "@shared/types";
import { v4 as uuidv4 } from "uuid";

const ENEMY_SPAWN_DELAY_MS = 500; // Spawn an enemy every 0.5 seconds

export class EnemyService {
  generateEnemiesForWave(
    waveNumber: number,
    difficulty: Difficulty,
    waveStartTime: number
  ): Enemy[] {
    const enemies: Enemy[] = [];
    const wavePattern =
      wavePatterns.find(
        (wp) =>
          (!wp.minWave || waveNumber >= wp.minWave) &&
          (!wp.maxWave || waveNumber <= wp.maxWave)
      ) || wavePatterns[wavePatterns.length - 1]; // Fallback to last pattern

    // Base number of enemies from wave pattern or calculated
    const baseEnemyCount = Math.floor(10 + 5 * waveNumber); // Removed wavePattern.count

    // Adjust based on difficulty
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    const enemyCount = Math.floor(baseEnemyCount * difficultyMultiplier);

    // Generate path (in a real game, this would be predefined or generated based on the map)
    const path = this.generatePath();

    for (let i = 0; i < enemyCount; i++) {
      let enemyType = wavePattern.defaultType;
      for (const rule of wavePattern.rules) {
        if (rule.condition(i, enemyCount)) {
          enemyType = rule.type;
          break; // First matching rule applies
        }
      }

      const spawnTime = new Date(waveStartTime + i * ENEMY_SPAWN_DELAY_MS);
      const enemy: Enemy = {
        id: uuidv4(),
        type: enemyType,
        health: this.getEnemyHealth(enemyType, waveNumber, difficulty),
        maxHealth: this.getEnemyHealth(enemyType, waveNumber, difficulty),
        position: { ...path[0] },
        speed: this.getEnemySpeed(enemyType, waveNumber, difficulty),
        reward: this.getEnemyReward(enemyType, waveNumber),
        damage: this.getEnemyDamage(enemyType, waveNumber, difficulty),
        abilities: this.getEnemyAbilities(enemyType, waveNumber),
        effects: [],
        path: [...path],
        pathIndex: 0,
        createdAt: spawnTime,
      };
      enemies.push(enemy);
    }

    // Add boss based on wave pattern or existing logic
    // const bossTypeFromPattern = wavePattern.boss; // wavePattern.boss does not exist
    // For now, relying on the wave number for boss spawning.
    // This logic might need to be integrated with WavePattern.rules if specific boss types are defined there.
    let bossType: EnemyType | null = null;

    // Check if any rule defines a boss type for this wave
    // This is a placeholder for a more robust boss determination logic based on rules
    // For example, a rule could specify { type: "boss", condition: () => true } for a boss wave.
    // Or a specific enemy type like 'waveBoss' could be introduced.

    if (waveNumber % 5 === 0) {
      // Existing fallback logic for boss waves
      // Attempt to find a 'boss' type if defined in enemyConfigurations, or use a default 'boss'
      bossType = enemyConfigurations.boss ? "boss" : null; // Assuming 'boss' is a valid EnemyType
      if (!bossType) {
        // Fallback if 'boss' is not in enemyConfigurations, but it's a boss wave
        // This part might need adjustment based on how boss types are actually defined
        // For now, we'll assume a generic "boss" type if one isn't specifically configured
        // but is expected for the wave.
        // This could also be a point to check wavePattern.rules for a boss type.
        const bossRule = wavePattern.rules.find((rule) =>
          rule.type.includes("boss")
        ); // Simple check
        if (bossRule) {
          bossType = bossRule.type;
        } else {
          // If no specific boss rule, and waveNumber % 5 === 0, we might still want a boss.
          // This depends on game design. For now, let's use the generic "boss" type.
          // This assumes "boss" is a defined EnemyType in your types.
          bossType = "boss";
        }
      }
    }

    if (bossType) {
      const bossSpawnTime = new Date(
        waveStartTime + enemyCount * ENEMY_SPAWN_DELAY_MS
      );
      const bossEnemy: Enemy = {
        id: uuidv4(),
        type: bossType,
        health: this.getEnemyHealth(bossType, waveNumber, difficulty),
        maxHealth: this.getEnemyHealth(bossType, waveNumber, difficulty),
        position: { ...path[0] },
        speed: this.getEnemySpeed(bossType, waveNumber, difficulty),
        reward: this.getEnemyReward(bossType, waveNumber),
        damage: this.getEnemyDamage(bossType, waveNumber, difficulty),
        abilities: this.getEnemyAbilities(bossType, waveNumber),
        effects: [],
        path: [...path],
        pathIndex: 0,
        createdAt: bossSpawnTime,
      };
      enemies.push(bossEnemy);
    }
    // Removed the second boss block as the logic is consolidated above.

    return enemies;
  }

  // Removed getEnemyTypeForWave as it's now handled by wavePatterns

  private getEnemyHealth(
    type: EnemyType,
    waveNumber: number,
    difficulty: Difficulty
  ): number {
    const baseAttributes = enemyConfigurations[type] || defaultEnemyAttributes;
    const waveMultiplier =
      1 + (waveNumber - 1) * (enemyAttributeScalers.healthWaveFactor || 0);
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    return Math.floor(
      baseAttributes.health * waveMultiplier * difficultyMultiplier
    );
  }

  private getEnemySpeed(
    type: EnemyType,
    waveNumber: number,
    difficulty: Difficulty
  ): number {
    // Added waveNumber for consistency, though not used by current scaler
    const baseAttributes = enemyConfigurations[type] || defaultEnemyAttributes;
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    // Assuming globalSpeedFactor might be intended to apply to all, or could be per-enemy type
    // For now, using the direct speed from config, adjusted by difficulty.
    // If globalSpeedFactor is meant to be a wave-based increment, the formula would need adjustment.
    const speedMultiplier =
      0.2 + (waveNumber - 1) * (enemyAttributeScalers.globalSpeedFactor || 0); // Example if speed scales with waves
    return parseFloat(
      (baseAttributes.speed * difficultyMultiplier * speedMultiplier).toFixed(2)
    );
  }

  private getEnemyReward(type: EnemyType, waveNumber: number): number {
    const baseAttributes = enemyConfigurations[type] || defaultEnemyAttributes;
    const waveMultiplier =
      1 + (waveNumber - 1) * (enemyAttributeScalers.rewardWaveFactor || 0);
    return Math.floor(baseAttributes.reward * waveMultiplier);
  }

  private getEnemyDamage(
    type: EnemyType,
    waveNumber: number,
    difficulty: Difficulty
  ): number {
    const baseAttributes = enemyConfigurations[type] || defaultEnemyAttributes;
    const waveMultiplier =
      1 + (waveNumber - 1) * (enemyAttributeScalers.damageWaveFactor || 0);
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    return Math.floor(
      baseAttributes.damage * waveMultiplier * difficultyMultiplier
    );
  }

  private getEnemyAbilities(
    type: EnemyType,
    waveNumber: number // waveNumber can be used for conditional abilities
  ): EnemyAbility[] {
    const baseAttributes = enemyConfigurations[type] || defaultEnemyAttributes;
    let abilities = [...baseAttributes.abilities]; // Start with base abilities

    // Example of conditional abilities based on waveNumber (can be expanded)
    if (type === "fast" && waveNumber > 5) {
      if (!abilities.includes("speed")) abilities.push("speed");
    }
    if (type === "tank" && waveNumber > 8) {
      if (!abilities.includes("shield")) abilities.push("shield");
    }
    if (type === "boss") {
      // Boss might get more abilities in later waves
      if (waveNumber > 10 && !abilities.includes("regen"))
        abilities.push("regen");
    }
    return abilities;
  }

  private getDifficultyMultiplier(difficulty: Difficulty): number {
    // This could also be moved to a game settings configuration if it becomes more complex
    switch (difficulty) {
      case "easy":
        return 0.8;
      case "normal":
        return 1.0;
      case "hard":
        return 1.2;
      default:
        return 1.0;
    }
  }

  private generatePath(): Position[] {
    // In a real game, this would be based on the map layout
    // Here, we'll generate a simple path from left to right with some bends
    const path: Position[] = [];

    // Start from left edge
    let x = 0;
    let y = 5;

    // Add starting position
    path.push({ x, y });

    // Go right
    for (let i = 1; i < 10; i++) {
      x++;
      path.push({ x, y });
    }

    // Go down
    for (let i = 1; i < 5; i++) {
      y++;
      path.push({ x, y });
    } // Go right
    for (let i = 1; i <= 11; i++) {
      x++;
      path.push({ x, y });
    }

    // Go up
    for (let i = 1; i < 10; i++) {
      y--;
      path.push({ x, y });
    }

    return path;
  }
}
