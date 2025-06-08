import { v4 as uuidv4 } from "uuid";
import { Difficulty, Game } from "../models/Game";
import { Player } from "../models/Player";
import { Position, Tower, TowerType } from "../models/Tower";
import {
  BuildTowerResult,
  GameUpdateHandler,
  UpgradeTowerResult,
} from "../types";
import { AttackService } from "./AttackService";
import { EnemyService } from "./EnemyService";
import { GameLoopService } from "./GameLoopService";
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
      tickRate: 100, // 10 updates per second (increased from 50ms to 100ms to reduce CPU load)
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
    const { hostId, maxPlayers, difficulty } = options;

    const game: Game = {
      id: uuidv4(),
      hostId,
      players: [],
      maxPlayers,
      state: "waiting",
      difficulty: difficulty as Difficulty,
      wave: 0,
      baseHealth: this.getInitialBaseHealth(difficulty as Difficulty),
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
    await this.joinGame(game.id, hostId);

    return game;
  }

  async joinGame(gameId: string, playerId: string): Promise<Game | null> {
    const game = games.get(gameId);

    if (!game) {
      return null;
    }

    // Check if player is already in the game
    if (game.players.some((p) => p.id === playerId)) {
      return game;
    }

    // Check if game is full
    if (game.players.length >= game.maxPlayers) {
      throw new Error("Game is full");
    }

    // Check if game has already started
    if (game.state !== "waiting") {
      throw new Error("Game has already started");
    }

    // Add player to the game
    const newPlayer: Player = {
      id: playerId,
      username: `Player-${playerId.substring(0, 5)}`, // Placeholder, would come from user service
      isReady: false,
      isConnected: true,
      money: this.getInitialMoney(game.difficulty),
      statistics: {
        towersBuilt: 0,
        enemiesDefeated: 0,
        moneySpent: 0,
        moneyEarned: 0,
      },
    };

    game.players.push(newPlayer);
    game.money[playerId] = this.getInitialMoney(game.difficulty);
    game.updatedAt = new Date();

    games.set(gameId, game);

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

    // Check if all players are ready
    const allPlayersReady = game.players.every((player) => player.isReady);
    if (!allPlayersReady) {
      console.error(`Not all players are ready in game ${gameId}`);
      throw new Error("Not all players are ready");
    }
    console.log(
      `All players ready for game ${gameId}. Player count: ${game.players.length}`
    );

    // Removed minimum player check to allow solo play    // Initialize the game state
    game.state = "running"; // This is the proper state value that the client expects
    game.wave = 0;
    game.enemies = [];
    game.towers = [];
    game.startTime = new Date();
    game.updatedAt = new Date();

    console.log(`Game state set to '${game.state}' for game ${gameId}`);

    // Reset player money to initial amount
    game.players.forEach((player) => {
      player.money = this.getInitialMoney(game.difficulty);
      game.money[player.id] = player.money;
    });

    console.log(`Game ${gameId} initialized, starting game loop`);

    // Start the game loop
    this.gameLoopService.startGameLoop(gameId, game);

    console.log(`Game ${gameId} started successfully`);

    // Update the game in the store
    games.set(gameId, game);

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
    console.log(
      `Building tower request: gameId=${gameId}, playerId=${playerId}, type=${towerType}, position=(${position.x},${position.y})`
    );

    const game = games.get(gameId);

    if (!game) {
      console.error(`Failed to build tower: Game ${gameId} not found`);
      return { success: false, error: "Game not found" };
    }

    const player = game.players.find((p) => p.id === playerId);

    if (!player) {
      console.error(
        `Failed to build tower: Player ${playerId} not found in game ${gameId}`
      );
      return { success: false, error: "Player not found in this game" };
    }

    // Check if position is available
    if (this.isTowerPositionOccupied(game, position)) {
      console.error(
        `Failed to build tower: Position (${position.x},${position.y}) is already occupied`
      );
      return { success: false, error: "Position is already occupied" };
    }

    // Get tower cost
    const towerAttributes = this.towerService.getTowerAttributes(towerType, 1);

    // Check if player has enough money
    if (game.money[playerId] < towerAttributes.cost) {
      console.error(
        `Failed to build tower: Player ${playerId} has insufficient funds (${game.money[playerId]}/${towerAttributes.cost})`
      );
      return { success: false, error: "Not enough money" };
    }

    // Create tower
    const tower: Tower = {
      id: uuidv4(),
      type: towerType,
      playerId,
      position,
      level: 1,
      attributes: towerAttributes,
      lastAttackTime: Date.now(),
      createdAt: new Date(),
    };

    // Update player money
    game.money[playerId] -= towerAttributes.cost;

    // Update player statistics
    player.statistics.towersBuilt++;
    player.statistics.moneySpent += towerAttributes.cost;

    // Add tower to game
    game.towers.push(tower);

    game.updatedAt = new Date();

    games.set(gameId, game);

    return {
      success: true,
      tower,
      money: game.money[playerId],
    };
  }

  async upgradeTower(
    gameId: string,
    playerId: string,
    towerId: string
  ): Promise<UpgradeTowerResult> {
    const game = games.get(gameId);

    if (!game) {
      return { success: false, error: "Game not found" };
    }

    const towerIndex = game.towers.findIndex((t) => t.id === towerId);

    if (towerIndex === -1) {
      return { success: false, error: "Tower not found" };
    }

    const tower = game.towers[towerIndex];

    // Check if player owns the tower
    if (tower.playerId !== playerId) {
      return { success: false, error: "You do not own this tower" };
    }

    // Check if tower can be upgraded (max level 3)
    if (tower.level >= 3) {
      return { success: false, error: "Tower is already at maximum level" };
    }

    // Get upgrade cost
    const upgradeCost = tower.attributes.upgradeCost;

    // Check if player has enough money
    if (game.money[playerId] < upgradeCost) {
      return { success: false, error: "Not enough money for upgrade" };
    }

    // Update player money
    game.money[playerId] -= upgradeCost;

    // Update player statistics
    const player = game.players.find((p) => p.id === playerId)!;
    player.statistics.moneySpent += upgradeCost;

    // Upgrade tower
    tower.level++;
    tower.attributes = this.towerService.getTowerAttributes(
      tower.type,
      tower.level
    );

    game.towers[towerIndex] = tower;
    game.updatedAt = new Date();

    games.set(gameId, game);

    return {
      success: true,
      tower,
      money: game.money[playerId],
    };
  }

  private getInitialBaseHealth(difficulty: Difficulty): number {
    switch (difficulty) {
      case "easy":
        return 100;
      case "normal":
        return 80;
      case "hard":
        return 60;
      default:
        return 80;
    }
  }

  private getInitialMoney(difficulty: Difficulty): number {
    console.log(`Setting initial money for difficulty: ${difficulty}`);
    switch (difficulty) {
      case "easy":
        return 1000;
      case "normal":
        return 200;
      case "hard":
        return 150;
      default:
        return 200;
    }
  }

  private isTowerPositionOccupied(game: Game, position: Position): boolean {
    return game.towers.some(
      (tower) =>
        tower.position.x === position.x && tower.position.y === position.y
    );
  }

  async deleteGame(gameId: string): Promise<void> {
    console.log(`[GameService] deleteGame called for gameId: ${gameId}`);
    const game = games.get(gameId);
    if (game) {
      console.log(
        `[GameService] Game ${gameId} found. Attempting to stop game loop.`
      );
      this.gameLoopService.stopGameLoop(gameId);
      console.log(`[GameService] After calling stopGameLoop for ${gameId}.`);
      games.delete(gameId);
      console.log(
        `[GameService] Game ${gameId} and its loop have been deleted from 'games' map. Remaining games: ${games.size}`
      );
    } else {
      console.warn(
        `[GameService] Attempted to delete non-existent game: ${gameId}`
      );
    }
  }
}
