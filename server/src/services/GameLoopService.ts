import { Game } from "../../../shared/types"; // Adjusted import path
import { Enemy, EnemyEffect } from "../models/Enemy";
import { AttackService } from "./AttackService";
import { EnemyService } from "./EnemyService";

// Collection of active game loops
const gameLoops: Map<string, NodeJS.Timeout> = new Map();

interface GameLoopOptions {
  tickRate: number; // milliseconds per game tick
  onUpdate: (gameId: string, game: Game) => void;
}

export class GameLoopService {
  private attackService: AttackService;
  private enemyService: EnemyService;
  private options: GameLoopOptions;

  constructor(options: GameLoopOptions) {
    this.attackService = new AttackService();
    this.enemyService = new EnemyService();
    this.options = options;
  }

  /**
   * Start the game loop for a specific game
   */
  startGameLoop(gameId: string, game: Game): void {
    // Stop any existing loop for this game
    this.stopGameLoop(gameId);

    // Start a new loop
    const interval = setInterval(() => {
      this.gameTick(gameId, game);
    }, this.options.tickRate);

    // Store the interval for later cleanup
    gameLoops.set(gameId, interval);

    // Mark game as running initially, or waiting for first wave
    // game.state = "running"; // State will be set to running by startWave or startGame
    game.updatedAt = new Date();

    // REMOVED: Start first wave automatically. Waves are now started by 'start-wave' event.
    // this.startNextWave(game);
  }

  /**
   * Stop the game loop for a specific game
   */
  stopGameLoop(gameId: string): void {
    console.log(
      `[GameLoopService] Attempting to stop game loop for gameId: ${gameId}`
    );
    const interval = gameLoops.get(gameId);
    if (interval) {
      console.log(
        `[GameLoopService] Interval found for gameId: ${gameId}. Clearing interval.`
      );
      clearInterval(interval);
      gameLoops.delete(gameId);
      console.log(
        `[GameLoopService] Interval cleared and deleted from map for gameId: ${gameId}. Active game loops: ${gameLoops.size}`
      );
    } else {
      console.warn(
        `[GameLoopService] No interval found for gameId: ${gameId} when trying to stop loop. It might have already been stopped or never started. Active game loops: ${gameLoops.size}`
      );
    }
  }

  /**
   * Start the next wave of enemies
   */
  startNextWave(game: Game): void {
    // Increment wave number
    game.wave++;
    game.state = "running"; // Ensure game is in 'running' state when a wave starts

    // Generate enemies for this wave
    const newEnemies = this.enemyService.generateEnemiesForWave(
      game.wave,
      game.difficulty,
      Date.now() // Add waveStartTime argument
    );

    // Add enemies to the game
    game.enemies = game.enemies.concat(newEnemies);

    // Update game state
    game.updatedAt = new Date();
    this.options.onUpdate(game.id, game); // Notify that wave has started and enemies are added
  }

  /**
   * Process a single game tick
   */
  private gameTick(gameId: string, game: Game): void {
    // Skip processing if game is not running (e.g., paused, waiting for wave, game-over)
    if (game.state !== "running") {
      return;
    }

    // Ensure all towers have the new tracking fields for backward compatibility
    game.towers = game.towers.map((tower) => {
      if (tower.totalDamageDealt === undefined) {
        tower.totalDamageDealt = 0;
      }
      if (tower.totalKills === undefined) {
        tower.totalKills = 0;
      }
      return tower;
    });

    const now = Date.now();

    // Spawn pending enemies whose time has come
    if (game.pendingEnemies && game.pendingEnemies.length > 0) {
      const newlySpawnedEnemies: Enemy[] = [];
      // Filter pendingEnemies, moving due enemies to newlySpawnedEnemies
      game.pendingEnemies = game.pendingEnemies.filter((enemy: Enemy) => {
        if (now >= enemy.createdAt.getTime()) {
          // enemy.createdAt is used as its spawnTime
          newlySpawnedEnemies.push(enemy);
          return false; // Remove from pending
        }
        return true; // Keep in pending
      });

      if (newlySpawnedEnemies.length > 0) {
        game.enemies.push(...newlySpawnedEnemies); // Add to active enemies list
        // Optional: log spawning
        // console.log(`GameLoop: Spawned ${newlySpawnedEnemies.length} enemies for game ${game.id}. Total active: ${game.enemies.length}`);
      }
    }

    // Process tower attacks
    this.attackService.processAttacks(game);

    // Move enemies along their paths
    this.moveEnemies(game);

    // Handle enemies that have reached the end of the path
    this.handleEnemiesAtEnd(game);

    // Check game over conditions
    if (this.checkGameOverConditions(game)) {
      // Game state is now "game-over", and loop is stopped by checkGameOverConditions.
      // Notify about the game over state.
      this.options.onUpdate(game.id, game);
      return; // Exit early as the game is over
    }

    // If we reach here, the game is not over.
    // Check if the current wave is complete (all enemies defeated or off-screen)
    this.checkWaveStatus(game); // This method now just logs and potentially sets a 'wave_cleared' state if desired

    // Update game timestamp
    game.updatedAt = new Date();

    // Notify via onUpdate for a regular running tick
    this.options.onUpdate(game.id, game);
  }
  /**
   * Move all active enemies along their paths
   */
  private moveEnemies(game: Game): void {
    const now = Date.now();
    // console.log(`Moving ${game.enemies.length} enemies for game ${game.id}`);

    // Enhanced debugging - log enemy paths and positions
    if (game.enemies.length > 0 && game.enemies[0]?.path) {
      console.log(
        `Path length for enemy ${game.enemies[0]?.id}: ${game.enemies[0]?.path.length}`
      );
      console.log(`Current path index: ${game.enemies[0]?.pathIndex}`);
    }

    game.enemies.forEach((enemy: Enemy) => {
      // Skip dead enemies
      if (enemy.health <= 0) return;

      // Skip enemies that have reached the end
      if (enemy.pathIndex >= enemy.path.length - 1) return;

      // Calculate base movement speed
      let speed = enemy.speed;
      // Apply slow effects if any
      enemy.effects = enemy.effects.filter((effect: EnemyEffect) => {
        // Remove expired effects
        if (now > effect.endTime) {
          return false;
        }

        // Apply effect
        if (effect.type === "slow") {
          speed *= 1 - effect.factor;
        }

        return true;
      });

      // Calculate next position on path
      const currentPathPoint = enemy.path[enemy.pathIndex];
      const nextPathPoint = enemy.path[enemy.pathIndex + 1];

      // Calculate direction vector
      const dx = nextPathPoint.x - enemy.position.x;
      const dy = nextPathPoint.y - enemy.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Store the original position for logging
      const originalPosition = { ...enemy.position };

      // If the enemy has reached the next path point
      if (distance < speed) {
        enemy.pathIndex++;
        enemy.position = { ...enemy.path[enemy.pathIndex] };
      } else {
        // Move enemy along the path
        const dirX = dx / distance;
        const dirY = dy / distance;

        enemy.position.x += dirX * speed;
        enemy.position.y += dirY * speed;
      }

      // Debug log for the first enemy to see if it's moving
      if (enemy.id === game.enemies[0]?.id) {
        console.log(
          `Enemy ${enemy.id} moved from (${originalPosition.x.toFixed(
            2
          )}, ${originalPosition.y.toFixed(2)}) to (${enemy.position.x.toFixed(
            2
          )}, ${enemy.position.y.toFixed(2)}) with speed ${speed}`
        );
      }
    });
  }

  /**
   * Handle enemies that have reached the end of the path
   */
  private handleEnemiesAtEnd(game: Game): void {
    game.enemies.forEach((enemy: Enemy) => {
      // Skip enemies that haven't reached the end
      if (enemy.pathIndex < enemy.path.length - 1) return;

      // Apply damage to base health
      game.baseHealth -= enemy.damage;

      // Mark enemy as dead
      enemy.health = 0;
    });

    // Remove enemies that have reached the end
    game.enemies = game.enemies.filter(
      (e: Enemy) => e.health > 0 && e.pathIndex < e.path.length - 1
    );
  }

  /**
   * Check if the current wave is complete
   * This method no longer starts the next wave automatically.
   * It can be used to determine if a wave is over, so the UI can enable the "Start Wave" button.
   */
  private checkWaveStatus(game: Game): void {
    if (game.enemies.length === 0 && game.state === "running") {
      // console.log(
      //   `Wave ${game.wave} cleared for game ${game.id}. Waiting for host to start next wave.`
      // );
      // Consider changing game.state to 'waiting' or 'wave_cleared' here
      // game.state = "waiting"; // This would pause the gameTick effectively until next startWave
      // If changing state, ensure onUpdate is called:
      // this.options.onUpdate(game.id, game);
    }
  }

  /**
   * Check game over conditions
   */
  private checkGameOverConditions(game: Game): boolean {
    // Game over if base health reaches zero
    if (game.baseHealth <= 0) {
      if (game.state !== "game-over") {
        // Prevent redundant operations if already game over
        game.state = "game-over";
        game.baseHealth = 0; // Ensure health doesn't go negative

        // Stop the game loop
        this.stopGameLoop(game.id);
      }
      return true; // Game is over
    }
    return false; // Game is not over
  }
}
