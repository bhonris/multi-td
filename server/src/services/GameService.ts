import { gameSettingsConfig } from "@shared/config/gameSettingsConfig"; // Corrected import name
import {
  BuildTowerResult,
  Difficulty,
  Game,
  GameUpdateHandler,
  Player,
  Position,
  Tower,
  TowerType,
  UpgradeTowerResult,
} from "@shared/types";
import { v4 as uuidv4 } from "uuid";
import { AttackService } from "./AttackService";
import { EnemyService } from "./EnemyService";
import { GameLoopService } from "./GameLoopService"; // Removed GameUpdateHandler from here
import { TowerService } from "./TowerService";

// In a real application, this would be stored in a database
const games: Map<string, Game> = new Map();

interface CreateGameOptions {
  hostId: string;
  maxPlayers: number;
  difficulty: string;
}

export class GameService {
  private enemyService: EnemyService;
  private towerService: TowerService;
  private attackService: AttackService;
  private gameLoopService: GameLoopService;
  private gameUpdateHandlers: GameUpdateHandler[] = [];
  constructor() {
    this.enemyService = new EnemyService();
    this.towerService = new TowerService();
    this.attackService = new AttackService();
    this.gameLoopService = new GameLoopService({
      tickRate: gameSettingsConfig.gameTickRateMs, // Use from config
      onUpdate: this.handleGameUpdate.bind(this),
    });
  }

  /**
   * Register a handler to be called when a game is updated
   */
  onGameUpdate(handler: GameUpdateHandler): void {
    this.gameUpdateHandlers.push(handler);
  }

  /**
   * Handle game updates and broadcast them to clients
   * This method will be called by the GameLoopService on each game tick
   */
  private handleGameUpdate(gameId: string, game: Game): void {
    // Update the game state in our local map
    // Ensure the game still exists before updating and notifying
    if (!games.has(gameId)) {
      console.warn(`Game ${gameId} no longer exists. Skipping update.`);
      this.gameLoopService.stopGameLoop(gameId); // Ensure loop is stopped if game is gone
      return;
    }
    games.set(gameId, game);

    // Notify all registered handlers
    this.gameUpdateHandlers.forEach((handler) => handler(gameId, game));
  }

  async createGame(options: CreateGameOptions): Promise<Game> {
    const { hostId, maxPlayers, difficulty: gameDifficulty } = options; // Renamed difficulty to avoid conflict

    const game: Game = {
      id: uuidv4(),
      hostId,
      players: [],
      maxPlayers,
      state: "waiting",
      difficulty: gameDifficulty as Difficulty, // Use gameDifficulty
      wave: 0,
      baseHealth:
        gameSettingsConfig.initialBaseHealth[gameDifficulty as Difficulty] || // Use gameDifficulty
        gameSettingsConfig.initialBaseHealth.normal,
      enemies: [],
      pendingEnemies: [], // Initialize pendingEnemies
      towers: [],
      money: {},
      startTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    games.set(game.id, game);

    // Add host as first player
    await this.joinGame(game.id, hostId); // Player money will be set by joinGame

    return game;
  }

  async joinGame(gameId: string, playerId: string): Promise<Game | null> {
    const game = games.get(gameId);

    if (!game) {
      console.error(`Game not found: ${gameId}`);
      return null;
    }

    // Check if player is already in the game
    if (game.players.some((p) => p.id === playerId)) {
      console.warn(`Player ${playerId} already in game ${gameId}`);
      return game; // Or handle as an error/specific message
    }

    // Check if game is full
    if (game.players.length >= game.maxPlayers) {
      throw new Error("Game is full");
    }

    // Check if game has already started (optional: allow joining if not running, e.g. paused or finished for viewing)
    if (game.state !== "waiting") {
      throw new Error("Game has already started");
    }
    const initialPlayerMoney =
      gameSettingsConfig.initialMoney[game.difficulty] ||
      gameSettingsConfig.initialMoney.normal;
    // Add player to the game
    const newPlayer: Player = {
      id: playerId,
      username: `Player-${playerId.substring(0, 5)}`, // Consider a better way to get username
      isReady: false,
      isConnected: true,
      // Use gameSettings for initial money
      money: initialPlayerMoney,
      statistics: {
        towersBuilt: 0,
        enemiesDefeated: 0,
        moneySpent: 0,
        moneyEarned: 0,
      },
    };

    game.players.push(newPlayer);
    // Ensure money is also set in the game.money map if you use that structure elsewhere
    game.money[playerId] = initialPlayerMoney;
    game.updatedAt = new Date();

    games.set(gameId, game);
    console.log(
      `Player ${playerId} joined game ${gameId}. Current players: ${game.players.length}`
    );
    return game;
  }

  async getGameState(gameId: string): Promise<Game | null> {
    return games.get(gameId) || null;
  }

  async updatePlayerReady(
    gameId: string,
    playerId: string,
    isReady: boolean
  ): Promise<Game | null> {
    const game = games.get(gameId);

    if (!game) {
      return null;
    }

    const player = game.players.find((p) => p.id === playerId);

    if (!player) {
      return null;
    }

    player.isReady = isReady;
    game.updatedAt = new Date();

    games.set(gameId, game);

    return game;
  }

  async startGame(gameId: string): Promise<Game | null> {
    console.log(`Attempting to start game: ${gameId}`);
    const game = games.get(gameId);
    if (!game) {
      console.error(`Game not found: ${gameId}`);
      return null;
    }
    if (game.state === "running") {
      console.warn(`Game ${gameId} is already running.`);
      return game;
    }

    // Check if all players are ready
    const allPlayersReady = game.players.every((player) => player.isReady);
    if (!allPlayersReady && game.players.length > 0) {
      // Allow solo start if no players or if host is ready
      // For multiplayer, ensure all are ready. For solo, this check might be bypassed or host auto-ready.
      // This depends on game rules. For now, requiring all connected players to be ready.
      if (game.players.some((p) => p.isConnected && !p.isReady)) {
        throw new Error("Not all players are ready");
      }
    }
    console.log(
      `All players ready for game ${gameId}. Player count: ${game.players.length}`
    );

    // Initialize the game state
    game.state = "running";
    game.wave = 0; // Start at wave 0, first wave will be 1
    game.enemies = [];
    game.towers = []; // Reset towers (or decide if they persist between game "restarts")
    game.startTime = new Date();
    game.updatedAt = new Date();

    console.log(`Game state set to '${game.state}' for game ${gameId}`);

    // Reset player money and base health according to difficulty from gameSettings
    const initialMoney =
      gameSettingsConfig.initialMoney[game.difficulty] ||
      gameSettingsConfig.initialMoney.normal;
    game.players.forEach((player) => {
      player.money = initialMoney;
      if (game.money) game.money[player.id] = initialMoney; // Also update the game.money map
    });
    game.baseHealth =
      gameSettingsConfig.initialBaseHealth[game.difficulty as Difficulty] || // Use game.difficulty
      gameSettingsConfig.initialBaseHealth.normal;

    console.log(`Game ${gameId} initialized, starting game loop`);

    // Start the game loop
    this.gameLoopService.startGameLoop(gameId, game);

    console.log(`Game ${gameId} started successfully`);

    games.set(gameId, game);
    // Notify handlers that game has started
    this.gameUpdateHandlers.forEach((handler) => handler(gameId, game));

    return game;
  }

  async stopGame(gameId: string): Promise<Game | null> {
    const game = games.get(gameId);
    if (!game) {
      return null;
    }

    // Stop the game loop
    this.gameLoopService.stopGameLoop(gameId);

    // Update game state
    game.state = "finished";
    game.updatedAt = new Date();

    return game;
  }

  async pauseGame(gameId: string): Promise<Game | null> {
    const game = games.get(gameId);
    if (!game) {
      return null;
    }

    // Only running games can be paused
    if (game.state !== "running") {
      throw new Error("Game is not running");
    }

    // Stop the game loop
    this.gameLoopService.stopGameLoop(gameId);

    // Update game state
    game.state = "paused";
    game.updatedAt = new Date();

    return game;
  }

  async resumeGame(gameId: string): Promise<Game | null> {
    const game = games.get(gameId);
    if (!game) {
      return null;
    }

    // Only paused games can be resumed
    if (game.state !== "paused") {
      throw new Error("Game is not paused");
    }

    // Start the game loop
    this.gameLoopService.startGameLoop(gameId, game);

    return game;
  }

  async startWave(gameId: string): Promise<Game | null> {
    const game = games.get(gameId);

    if (!game) {
      return null;
    } // Increment wave number
    game.wave++;
    game.state = "running";

    // Generate enemies for this wave with staggered spawn times
    const allEnemiesForWave = this.enemyService.generateEnemiesForWave(
      game.wave,
      game.difficulty,
      Date.now() // Use current time as the base for staggering spawn times
    );

    game.pendingEnemies = allEnemiesForWave; // Store all generated enemies in pendingEnemies
    // game.enemies will be populated by the GameLoopService as enemies spawn

    game.updatedAt = new Date();

    games.set(gameId, game);

    return game;
  }
  async buildTower(
    gameId: string,
    playerId: string,
    towerType: TowerType,
    position: Position
  ): Promise<BuildTowerResult> {
    const game = games.get(gameId);
    if (!game) {
      return { success: false, message: "Game not found" };
    }
    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      return { success: false, message: "Player not found in game" };
    }

    const towerAttributes = this.towerService.getTowerAttributes(towerType, 1);
    if (player.money < towerAttributes.cost) {
      return { success: false, message: "Not enough money" };
    }

    // Basic check for tower placement (e.g., not on path, not too close to others)
    // This is a simplified check. A real game would have a more complex grid/path system.
    if (this.isTowerPositionOccupied(game, position)) {
      return { success: false, message: "Position is occupied or invalid" };
    }

    player.money -= towerAttributes.cost;
    player.statistics.towersBuilt += 1;
    player.statistics.moneySpent += towerAttributes.cost;

    const newTower: Tower = {
      // Tower type should be available now
      id: uuidv4(),
      type: towerType,
      playerId,
      position,
      level: 1,
      attributes: towerAttributes,
      lastAttackTime: 0,
      createdAt: new Date(),
    };
    game.towers.push(newTower);
    game.money[playerId] = player.money; // Update money map if used
    game.updatedAt = new Date();
    games.set(gameId, game);

    return { success: true, tower: newTower, game };
  }

  async upgradeTower(
    gameId: string,
    playerId: string,
    towerId: string
  ): Promise<UpgradeTowerResult> {
    const game = games.get(gameId);
    if (!game) {
      return { success: false, message: "Game not found" };
    }
    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      return { success: false, message: "Player not found in game" };
    }
    const tower = game.towers.find(
      (t) => t.id === towerId && t.playerId === playerId
    );
    if (!tower) {
      return {
        success: false,
        message: "Tower not found or not owned by player",
      };
    }

    if (tower.level >= gameSettingsConfig.maxTowerLevel) {
      // Use from config
      return { success: false, message: "Tower is already at max level" };
    }

    const nextLevel = tower.level + 1;
    const upgradeAttributes = this.towerService.getTowerAttributes(
      tower.type,
      nextLevel
    );
    const upgradeCost = tower.attributes.upgradeCost; // Cost to upgrade *from current level*

    if (player.money < upgradeCost) {
      return { success: false, message: "Not enough money to upgrade" };
    }

    player.money -= upgradeCost;
    player.statistics.moneySpent += upgradeCost;

    tower.level = nextLevel;
    tower.attributes = upgradeAttributes;
    game.money[playerId] = player.money; // Update money map if used
    game.updatedAt = new Date();
    games.set(gameId, game);

    return { success: true, tower, game };
  }

  // Add this helper method if it's not already present
  private isTowerPositionOccupied(game: Game, position: Position): boolean {
    // Example check: ensure not too close to another tower
    const minDistance = 1; // Define a minimum distance, e.g., 1 grid unit
    for (const t of game.towers) {
      const dist = Math.sqrt(
        Math.pow(t.position.x - position.x, 2) +
          Math.pow(t.position.y - position.y, 2)
      );
      if (dist < minDistance) {
        return true; // Too close to another tower
      }
    }
    // Add other checks like: is on path, is out of bounds, etc.
    return false; // Position is valid
  }

  // ... any other existing methods like startWave, processEnemyMovement, etc.

  async deleteGame(gameId: string): Promise<boolean> {
    if (games.has(gameId)) {
      this.gameLoopService.stopGameLoop(gameId); // Stop game loop if running
      games.delete(gameId);
      console.log(`[GameService] Game ${gameId} deleted.`);
      return true;
    }
    console.warn(
      `[GameService] Attempted to delete non-existent game: ${gameId}`
    );
    return false;
  }
}
