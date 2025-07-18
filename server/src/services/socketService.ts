import {
  BuildTowerResult,
  Game,
  SellTowerResult,
  UpgradeTowerResult,
} from "@shared/types"; // Corrected path for Game and other types
import { Server } from "socket.io";
import { GameService } from "./GameService";

export const setupSocket = (io: Server) => {
  const gameService = new GameService();
  const socketIdToGameIdMap = new Map<string, string>(); // Map to store socket.id -> gameId

  // Register game update handler
  gameService.onGameUpdate((gameId: string, game: Game) => {
    // Debug: log enemy positions
    if (game.enemies.length > 0) {
      console.log(
        `Emitting game update for game ${gameId} with ${game.enemies.length} enemies. First enemy health: ${game.enemies[0].health}`
      );
      // console.log(
      //   `First enemy position: (${game.enemies[0].position.x.toFixed(
      //     2
      //   )}, ${game.enemies[0].position.y.toFixed(2)})`
      // );
    } else {
      console.log(`Emitting game update for game ${gameId} with 0 enemies.`);
    }

    // Broadcast game state updates to all players in the game room
    io.to(`game-${gameId}`).emit("game-state-update", {
      id: game.id, // Add gameId for client-side matching if needed
      enemies: game.enemies,
      towers: game.towers,
      baseHealth: game.baseHealth,
      wave: game.wave,
      state: game.state,
      money: game.money, // This should be the game.money object or individual player money needs to be handled
      players: game.players, // Send player data if it can change (e.g. money, stats)
      updatedAt: game.updatedAt, // Send timestamp for debugging or sequencing
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
    console.log(`[SocketService] User connected: ${socket.id}`);

    socket.on("join-game", ({ gameId, playerId }) => {
      const roomName = `game-${gameId}`;
      socket.join(roomName);
      socketIdToGameIdMap.set(socket.id, gameId); // Store the mapping
      console.log(
        `[SocketService] Player ${playerId} (Socket ID: ${socket.id}) joined game room ${roomName}. Mapped socket to game.`
      );

      // Log rooms this socket is in
      console.log(`Socket ${socket.id} is now in rooms:`, socket.rooms);

      // Notify other players
      socket.to(roomName).emit("player-joined", { playerId });

      // Send current game state to the joining player
      gameService.getGameState(gameId).then((game) => {
        if (game) {
          socket.emit("game-state", game);
        }
      });
    });

    // Ready status
    socket.on("player-ready", ({ gameId, playerId, isReady }) => {
      console.log(
        `Player ${playerId} ready status changed to ${isReady} in game ${gameId}`
      );

      gameService
        .updatePlayerReady(gameId, playerId, isReady)
        .then((game) => {
          if (game) {
            console.log(
              `Broadcasting updated game state to all players in room game-${gameId}`
            );

            // Get the room
            const roomName = `game-${gameId}`;
            const room = io.sockets.adapter.rooms.get(roomName);
            console.log(
              `Room ${roomName} has ${room ? room.size : 0} clients:`,
              room ? [...room] : "none"
            );

            // Store last update timestamp in game object
            game.updatedAt = new Date();

            // Broadcast to all clients in the room with an event ID for acknowledgment
            const eventId = `player-ready-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`;
            io.to(roomName).emit("game-updated", {
              ...game,
              _eventId: eventId,
            });

            // Also emit directly to this socket as a backup with the same event ID
            socket.emit("game-updated", { ...game, _eventId: eventId });

            // Set a timeout to verify all clients received the update
            setTimeout(() => {
              // Send to each player individually for absolute redundancy
              game.players.forEach((player) => {
                // Find all sockets for this player
                const playerSockets = Array.from(
                  io.sockets.sockets.values()
                ).filter((s) => s.handshake.query.playerId === player.id);

                if (playerSockets.length > 0) {
                  console.log(
                    `Sending direct player-ready update to player ${player.id} via ${playerSockets.length} socket(s)`
                  );
                  playerSockets.forEach((s) =>
                    s.emit("game-updated", { ...game, _eventId: eventId })
                  );
                }
              });
            }, 500); // Wait 500ms before the redundant broadcast

            console.log("Player ready status updated successfully");
          } else {
            console.error(
              `Failed to update player ${playerId} ready status in game ${gameId}`
            );
            socket.emit("game-updated", {
              error: "Failed to update ready status",
            });
          }
        })
        .catch((error) => {
          console.error(`Error updating player ready status:`, error);
          socket.emit("game-updated", {
            error: "Server error updating ready status",
          });
        });
    }); // Build tower
    socket.on("build-tower", ({ gameId, playerId, towerType, position }) => {
      console.log(`Build tower request received:`, {
        gameId,
        playerId,
        towerType,
        position,
        socketId: socket.id,
      });

      // Check if socket is in the correct game room
      const roomName = `game-${gameId}`;
      const isInRoom = socket.rooms.has(roomName);
      const room = io.sockets.adapter.rooms.get(roomName);

      console.log(`Socket room check for tower building:`, {
        socketId: socket.id,
        isInRoom,
        roomSize: room ? room.size : 0,
        roomName,
        allSocketRooms: [...socket.rooms],
      });

      gameService
        .buildTower(gameId, playerId, towerType, position)
        .then((result: BuildTowerResult) => {
          if (result.success && result.tower && result.game) {
            const playerMoney = result.game.players.find(
              (p) => p.id === playerId
            )?.money;
            console.log(`Tower built successfully:`, {
              towerId: result.tower.id,
              type: result.tower.type,
              position: result.tower.position,
              remainingMoney: playerMoney, // Access money via game.players
            }); // Emit to room
            const roomName = `game-${gameId}`;
            io.to(roomName).emit("tower-built", result.tower);
            io.to(roomName).emit("money-updated", {
              playerId,
              money: playerMoney, // Access money via game.players
            });

            // Debug info
            const room = io.sockets.adapter.rooms.get(roomName);
            console.log(`Room ${roomName} has ${room ? room.size : 0} clients`);

            // Also emit directly to this socket as a backup strategy
            socket.emit("tower-built", result.tower);
            socket.emit("money-updated", {
              playerId,
              money: playerMoney, // Access money via game.players
            });

            // Try to find all sockets for this player and emit to them directly
            const playerSockets = Array.from(
              io.sockets.sockets.values()
            ).filter((s) => s.handshake.query.playerId === playerId);

            if (playerSockets.length > 0) {
              console.log(
                `Direct emitting to ${playerSockets.length} sockets for player ${playerId}`
              );
              playerSockets.forEach((s) => {
                s.emit("tower-built", result.tower);
                s.emit("money-updated", {
                  playerId,
                  money: playerMoney, // Access money via game.players
                });
              });
            }
          } else {
            console.error(`Tower build failed: ${result.message}`); // Use result.message
            socket.emit("build-error", { message: result.message }); // Use result.message
          }
        })
        .catch((error) => {
          console.error(`Error in build-tower:`, error);
          socket.emit("build-error", {
            message: "Server error: " + error.message,
          });
        });
    });

    // Upgrade tower
    socket.on("upgrade-tower", ({ gameId, playerId, towerId }) => {
      gameService
        .upgradeTower(gameId, playerId, towerId)
        .then((result: UpgradeTowerResult) => {
          if (result.success && result.tower && result.game) {
            const playerMoney = result.game.players.find(
              (p) => p.id === playerId
            )?.money;
            io.to(`game-${gameId}`).emit("tower-upgraded", result.tower);
            io.to(`game-${gameId}`).emit("money-updated", {
              playerId,
              money: playerMoney, // Access money via game.players
            });
          } else {
            socket.emit("upgrade-error", { message: result.message }); // Use result.message
          }
        });
    });

    socket.on("sell-tower", ({ gameId, playerId, towerId }) => {
      gameService
        .sellTower(gameId, playerId, towerId)
        .then((result: SellTowerResult) => {
          if (result.success && result.game) {
            const playerMoney = result.game.players.find(
              (p) => p.id === playerId
            )?.money;
            io.to(`game-${gameId}`).emit("tower-sold", {
              towerId: result.towerId,
              sellValue: result.sellValue,
              playerId,
            });
            io.to(`game-${gameId}`).emit("money-updated", {
              playerId,
              money: playerMoney,
            });
            // Send full game state update to ensure UI is in sync
            io.to(`game-${gameId}`).emit("game-state-update", result.game);
          } else {
            socket.emit("sell-error", { message: result.message });
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

        // Start the game
        gameService
          .startGame(gameId)
          .then((updatedGame) => {
            if (updatedGame) {
              const roomName = `game-${gameId}`;
              console.log(
                `Game started successfully: ${gameId}. Broadcasting to room: ${roomName}`
              );

              // Log all clients connected to this room
              const room = io.sockets.adapter.rooms.get(roomName);
              console.log(
                `Room ${roomName} has ${room ? room.size : 0} clients:`,
                room ? [...room] : "none"
              );

              // Emit to the specific room
              io.to(roomName).emit("game-started", updatedGame);

              // Also emit directly to all players individually as a backup strategy
              game.players.forEach((player) => {
                // Try to find socket for this player and emit directly
                const playerSockets = Array.from(
                  io.sockets.sockets.values()
                ).filter((s) => s.handshake.query.playerId === player.id);

                if (playerSockets.length > 0) {
                  console.log(
                    `Direct emitting game-started to player ${player.id}`
                  );
                  playerSockets.forEach((s) =>
                    s.emit("game-started", updatedGame)
                  );
                }
              });
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
    }); // Debug handler to check rooms
    socket.on("debug-rooms", ({ gameId }, callback) => {
      const roomName = `game-${gameId}`;
      const room = io.sockets.adapter.rooms.get(roomName);
      const isInRoom = socket.rooms.has(roomName);

      const response = {
        socketId: socket.id,
        isInRoom,
        roomSize: room ? room.size : 0,
        roomMembers: room ? [...room] : [],
        allRooms: [...socket.rooms],
      };

      console.log(`Debug rooms for socket ${socket.id}:`, response);

      if (callback) {
        callback(response);
      }
    });

    // Player disconnect
    socket.on("disconnect", () => {
      console.log(`[SocketService] User disconnected: ${socket.id}.`);
      const gameId = socketIdToGameIdMap.get(socket.id);

      if (gameId) {
        console.log(
          `[SocketService] Disconnected socket ${socket.id} was associated with gameId: ${gameId}.`
        );
        const roomName = `game-${gameId}`;

        // Important: Wait a brief moment for Socket.IO to update adapter.rooms
        setTimeout(() => {
          const room = io.sockets.adapter.rooms.get(roomName);
          const roomSize = room ? room.size : 0;
          console.log(
            `[SocketService] Game room ${roomName} (gameId: ${gameId}) current size after disconnect: ${roomSize}`
          );

          if (roomSize === 0) {
            console.log(
              `[SocketService] Game room ${roomName} (gameId: ${gameId}) is empty. Attempting to delete game.`
            );
            gameService
              .deleteGame(gameId)
              .then(() => {
                console.log(
                  `[SocketService] Successfully called deleteGame for ${gameId}.`
                );
              })
              .catch((error: Error) => {
                console.error(
                  `[SocketService] Error calling deleteGame for ${gameId}:`,
                  error
                );
              });
          } else {
            console.log(
              `[SocketService] Game room ${roomName} (gameId: ${gameId}) is not empty. Size: ${roomSize}. Not deleting.`
            );
          }
        }, 250); // 250ms delay, adjust if necessary

        socketIdToGameIdMap.delete(socket.id); // Clean up the mapping
        console.log(
          `[SocketService] Unmapped socket ${socket.id} from game ${gameId}.`
        );
      } else {
        console.log(
          `[SocketService] Disconnected socket ${socket.id} was not mapped to any game.`
        );
      }
    });
  });
};
