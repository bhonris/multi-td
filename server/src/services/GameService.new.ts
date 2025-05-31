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
      tickRate: 100, // 10 updates per second
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

  private getInitialBaseHealth(difficulty: Difficulty): number {
    switch (difficulty) {
      case "easy":
        return 100;
      case "normal":
        return 75;
      case "hard":
        return 50;
      default:
        return 100;
    }
  }

  private getInitialMoney(difficulty: Difficulty): number {
    switch (difficulty) {
      case "easy":
        return 200;
      case "normal":
        return 150;
      case "hard":
        return 100;
      default:
        return 150;
    }
  }

  async joinGame(gameId: string, playerId: string): Promise<Game | null> {
    const game = games.get(gameId);

    if (!game) {
      return null;
    }

    // Check if player is already in the game
    if (game.players.some((p) => p.id === playerId)) {
      // Player is already in the game, just update connection status
      const playerIndex = game.players.findIndex((p) => p.id === playerId);
      game.players[playerIndex].isConnected = true;
      game.updatedAt = new Date();
      games.set(gameId, game);
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

    if (game.players.length < 2) {
      console.error(`Not enough players in game ${gameId}`);
      throw new Error("At least 2 players are required to start the game");
    }

    // Initialize the game state
    game.state = "running";
    game.wave = 0;
    game.enemies = [];
    game.towers = [];
    game.startTime = new Date();
    game.updatedAt = new Date();

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
    game.endTime = new Date();

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
    }

    // Check if game is running
    if (game.state !== "running") {
      throw new Error("Game is not running");
    }

    // Check if there are existing enemies
    if (game.enemies.length > 0) {
      throw new Error("Wave is already in progress");
    }

    // Increment wave number
    game.wave++;
    game.state = "running";

    // Generate enemies for this wave
    game.enemies = this.enemyService.generateEnemiesForWave(
      game.wave,
      game.difficulty
    );

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
      return { success: false, error: "Game not found" };
    }

    const player = game.players.find((p) => p.id === playerId);

    if (!player) {
      return { success: false, error: "Player not found in this game" };
    }

    // Check if position is available
    if (this.isTowerPositionOccupied(game, position)) {
      return { success: false, error: "Position is already occupied" };
    }

    // Get tower cost
    const towerAttributes = this.towerService.getTowerAttributes(towerType, 1);

    // Check if player has enough money
    if (game.money[playerId] < towerAttributes.cost) {
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

  private isTowerPositionOccupied(game: Game, position: Position): boolean {
    return game.towers.some(
      (t) => t.position.x === position.x && t.position.y === position.y
    );
  }

  async getGameList(): Promise<Game[]> {
    return Array.from(games.values()).filter(
      (game) =>
        game.state === "waiting" && game.players.length < game.maxPlayers
    );
  }
}
