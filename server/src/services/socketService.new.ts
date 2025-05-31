import { Server } from "socket.io";
import { Game } from "../models/Game";
import { BuildTowerResult, UpgradeTowerResult } from "../types";
import { GameService } from "./GameService";

export const setupSocket = (io: Server) => {
  const gameService = new GameService();

  // Register game update handler
  gameService.onGameUpdate((gameId: string, game: Game) => {
    // Broadcast game state updates to all players in the game room
    io.to(`game-${gameId}`).emit("game-state-update", {
      enemies: game.enemies,
      towers: game.towers,
      baseHealth: game.baseHealth,
      wave: game.wave,
      state: game.state,
    });

    // Send specific targeted events for animations/sounds
    if (game.state === "game-over") {
      io.to(`game-${gameId}`).emit("game-over", {
        wave: game.wave,
        baseHealth: game.baseHealth,
      });
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a game room
    socket.on("join-game", ({ gameId, playerId }) => {
      socket.join(`game-${gameId}`);
      console.log(`Player ${playerId} joined game room ${gameId}`);

      // Notify other players
      socket.to(`game-${gameId}`).emit("player-joined", { playerId });

      // Send current game state to the joining player
      gameService.getGameState(gameId).then((game) => {
        if (game) {
          socket.emit("game-state", game);
        }
      });
    }); // Ready status
    socket.on("player-ready", ({ gameId, playerId, isReady }) => {
      gameService.updatePlayerReady(gameId, playerId, isReady).then((game) => {
        if (game) {
          io.to(`game-${gameId}`).emit("game-updated", game);
          // Don't auto-start game when all players are ready
          // Let the host manually start the game
        }
      });
    });

    // Build tower
    socket.on("build-tower", ({ gameId, playerId, towerType, position }) => {
      gameService
        .buildTower(gameId, playerId, towerType, position)
        .then((result: BuildTowerResult) => {
          if (result.success) {
            io.to(`game-${gameId}`).emit("tower-built", result.tower);
            io.to(`game-${gameId}`).emit("money-updated", {
              playerId,
              money: result.money,
            });
          } else {
            socket.emit("build-error", { message: result.error });
          }
        });
    });

    // Upgrade tower
    socket.on("upgrade-tower", ({ gameId, playerId, towerId }) => {
      gameService
        .upgradeTower(gameId, playerId, towerId)
        .then((result: UpgradeTowerResult) => {
          if (result.success) {
            io.to(`game-${gameId}`).emit("tower-upgraded", result.tower);
            io.to(`game-${gameId}`).emit("money-updated", {
              playerId,
              money: result.money,
            });
          } else {
            socket.emit("upgrade-error", { message: result.error });
          }
        });
    });

    // Start wave manually (if not auto)
    socket.on("start-wave", ({ gameId }) => {
      gameService.startWave(gameId).then((game: Game | null) => {
        if (game) {
          io.to(`game-${gameId}`).emit("wave-started", {
            wave: game.wave,
            enemies: game.enemies,
          });
        }
      });
    });

    // Start game (manually triggered by host)
    socket.on("start-game", ({ gameId }) => {
      console.log(`Host requested to start game: ${gameId}`);

      // Get the current game state
      gameService.getGameState(gameId).then((game) => {
        if (!game) {
          console.error(`Game not found: ${gameId}`);
          socket.emit("game-updated", { error: "Game not found" });
          return;
        } // Check if all players are ready
        const allPlayersReady = game.players.every((p) => p.isReady);
        if (!allPlayersReady) {
          console.error(`Not all players are ready in game: ${gameId}`);
          socket.emit("game-updated", {
            error: "All players must be ready to start the game",
          });
          return;
        }

        // Allow solo play - removed minimum player check

        // Start the game
        gameService
          .startGame(gameId)
          .then((updatedGame) => {
            if (updatedGame) {
              console.log(`Game started successfully: ${gameId}`);
              io.to(`game-${gameId}`).emit("game-started", updatedGame);
            } else {
              console.error(`Failed to start game: ${gameId}`);
              socket.emit("game-updated", { error: "Failed to start game" });
            }
          })
          .catch((error) => {
            console.error(`Error starting game ${gameId}:`, error);
            socket.emit("game-updated", {
              error: error.message || "Failed to start game",
            });
          });
      });
    });

    // Pause game
    socket.on("pause-game", ({ gameId }) => {
      gameService.pauseGame(gameId).then((game: Game | null) => {
        if (game) {
          io.to(`game-${gameId}`).emit("game-paused", game);
        }
      });
    });

    // Resume game
    socket.on("resume-game", ({ gameId }) => {
      gameService.resumeGame(gameId).then((game: Game | null) => {
        if (game) {
          io.to(`game-${gameId}`).emit("game-resumed", game);
        }
      });
    });

    // Player disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      // TODO: Handle player disconnection
    });
  });
};
