import { v4 as uuidv4 } from "uuid";
import { Enemy, EnemyAbility, EnemyType } from "../models/Enemy";
import { Difficulty } from "../models/Game";
import { Position } from "../models/Tower";

const ENEMY_SPAWN_DELAY_MS = 500; // Spawn an enemy every 0.5 seconds

export class EnemyService {
  generateEnemiesForWave(
    waveNumber: number,
    difficulty: Difficulty,
    waveStartTime: number
  ): Enemy[] {
    const enemies: Enemy[] = [];
    // const now = new Date(); // 'now' is replaced by waveStartTime for staggering

    // Base number of enemies increases with wave number
    const baseEnemyCount = Math.floor(10 + 5 * waveNumber);

    // Adjust based on difficulty
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    const enemyCount = Math.floor(baseEnemyCount * difficultyMultiplier);

    // Generate path (in a real game, this would be predefined or generated based on the map)
    const path = this.generatePath();

    // Generate enemies
    for (let i = 0; i < enemyCount; i++) {
      const enemyType = this.getEnemyTypeForWave(waveNumber, i, enemyCount);
      const spawnTime = new Date(waveStartTime + i * ENEMY_SPAWN_DELAY_MS);
      const enemy: Enemy = {
        id: uuidv4(),
        type: enemyType,
        health: this.getEnemyHealth(enemyType, waveNumber, difficulty),
        maxHealth: this.getEnemyHealth(enemyType, waveNumber, difficulty),
        position: { ...path[0] }, // Start at the beginning of the path
        speed: this.getEnemySpeed(enemyType, difficulty),
        reward: this.getEnemyReward(enemyType, waveNumber),
        damage: this.getEnemyDamage(enemyType, waveNumber, difficulty),
        abilities: this.getEnemyAbilities(enemyType, waveNumber),
        effects: [],
        path: [...path], // Clone the path
        pathIndex: 0,
        createdAt: spawnTime, // Use the calculated staggered spawn time
      };

      // Delay enemy spawn time
      enemies.push(enemy);
    }

    // Add boss at the end of each 5 waves
    if (waveNumber % 5 === 0) {
      const bossSpawnTime = new Date(
        waveStartTime + enemyCount * ENEMY_SPAWN_DELAY_MS
      ); // Boss spawns after all normal enemies in the wave
      const bossEnemy: Enemy = {
        id: uuidv4(),
        type: "boss",
        health: this.getEnemyHealth("boss", waveNumber, difficulty),
        maxHealth: this.getEnemyHealth("boss", waveNumber, difficulty),
        position: { ...path[0] }, // Start at the beginning of the path
        speed: this.getEnemySpeed("boss", difficulty),
        reward: this.getEnemyReward("boss", waveNumber),
        damage: this.getEnemyDamage("boss", waveNumber, difficulty),
        abilities: this.getEnemyAbilities("boss", waveNumber),
        effects: [],
        path: [...path], // Clone the path
        pathIndex: 0,
        createdAt: bossSpawnTime, // Boss also gets a specific spawnTime
      };

      enemies.push(bossEnemy);
    }

    return enemies;
  }

  private getEnemyTypeForWave(
    waveNumber: number,
    enemyIndex: number,
    totalEnemies: number
  ): EnemyType {
    // Mix of different enemy types depending on wave number
    if (waveNumber < 3) {
      // Early waves only have basic enemies
      return "basic";
    } else if (waveNumber < 5) {
      // Introduce some fast enemies
      return enemyIndex % 5 === 0 ? "fast" : "basic";
    } else if (waveNumber < 10) {
      // Add tank enemies
      if (enemyIndex % 5 === 0) return "fast";
      if (enemyIndex % 7 === 0) return "tank";
      return "basic";
    } else {
      // Add healer enemies in later waves
      if (enemyIndex % 5 === 0) return "fast";
      if (enemyIndex % 7 === 0) return "tank";
      if (enemyIndex % 10 === 0) return "healer";
      return "basic";
    }
  }

  private getEnemyHealth(
    type: EnemyType,
    waveNumber: number,
    difficulty: Difficulty
  ): number {
    const waveMultiplier = 1 + (waveNumber - 1) * 0.2;
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);

    let baseHealth: number;
    switch (type) {
      case "basic":
        baseHealth = 100;
        break;
      case "fast":
        baseHealth = 70;
        break;
      case "tank":
        baseHealth = 250;
        break;
      case "healer":
        baseHealth = 120;
        break;
      case "boss":
        baseHealth = 1000 + waveNumber * 200;
        break;
      default:
        baseHealth = 100;
    }

    return Math.floor(baseHealth * waveMultiplier * difficultyMultiplier);
  }
  private getEnemySpeed(type: EnemyType, difficulty: Difficulty): number {
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    const globalSpeedFactor = 0.3; // Significantly increased from 0.8

    let baseSpeed: number;
    switch (type) {
      case "basic":
        baseSpeed = 0.5; // Increased from 0.5
        break;
      case "fast":
        baseSpeed = 2.0; // Increased from 1.5
        break;
      case "tank":
        baseSpeed = 1.0; // Increased from 0.8
        break;
      case "healer":
        baseSpeed = 1.2; // Increased from 0.9
        break;
      case "boss":
        baseSpeed = 0.8; // Increased from 0.6
        break;
      default:
        baseSpeed = 1;
    }

    return baseSpeed * difficultyMultiplier * globalSpeedFactor;
  }

  private getEnemyReward(type: EnemyType, waveNumber: number): number {
    const waveMultiplier = 1 + (waveNumber - 1) * 0.1;

    let baseReward: number;
    switch (type) {
      case "basic":
        baseReward = 5;
        break;
      case "fast":
        baseReward = 8;
        break;
      case "tank":
        baseReward = 15;
        break;
      case "healer":
        baseReward = 12;
        break;
      case "boss":
        baseReward = 100;
        break;
      default:
        baseReward = 5;
    }

    return Math.floor(baseReward * waveMultiplier);
  }

  private getEnemyDamage(
    type: EnemyType,
    waveNumber: number,
    difficulty: Difficulty
  ): number {
    const waveMultiplier = 1 + (waveNumber - 1) * 0.15;
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);

    let baseDamage: number;
    switch (type) {
      case "basic":
        baseDamage = 1;
        break;
      case "fast":
        baseDamage = 1;
        break;
      case "tank":
        baseDamage = 2;
        break;
      case "healer":
        baseDamage = 1;
        break;
      case "boss":
        baseDamage = 10;
        break;
      default:
        baseDamage = 1;
    }

    return Math.floor(baseDamage * waveMultiplier * difficultyMultiplier);
  }
  private getEnemyAbilities(
    type: EnemyType,
    waveNumber: number
  ): EnemyAbility[] {
    switch (type) {
      case "basic":
        return [];
      case "fast":
        return waveNumber > 10 ? ["speed" as EnemyAbility] : [];
      case "tank":
        return waveNumber > 12 ? ["shield" as EnemyAbility] : [];
      case "healer":
        return ["heal" as EnemyAbility];
      case "boss":
        // Bosses get more abilities as waves progress
        const abilities: EnemyAbility[] = ["shield" as EnemyAbility];
        if (waveNumber >= 10) abilities.push("regen" as EnemyAbility);
        if (waveNumber >= 15) abilities.push("spawn" as EnemyAbility);
        return abilities;
      default:
        return [];
    }
  }

  private getDifficultyMultiplier(difficulty: Difficulty): number {
    switch (difficulty) {
      case "easy":
        return 0.8;
      case "normal":
        return 1.0;
      case "hard":
        return 1.3;
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
