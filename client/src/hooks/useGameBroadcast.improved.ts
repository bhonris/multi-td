import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { fetchGameState } from "../features/game/gameSlice";
import { Game } from "../types";
import { logGameState } from "../utils/debugHelpers";
import socketManager from "../utils/socketManager";

/**
 * Hook to simplify and standardize broadcasting game events in a way that
 * maximizes reliability in multi-player scenarios.
 *
 * Uses a combination of socket events and REST API calls to ensure all clients
 * have the correct game state.
 */
export const useGameBroadcast = () => {
  const dispatch = useDispatch() as ThunkDispatch<any, any, AnyAction>;

  /**
   * Broadcast a player's ready status change with enhanced reliability
   */
  const broadcastPlayerReady = useCallback(
    (gameId: string, playerId: string, isReady: boolean) => {
      console.log("Broadcasting player ready:", { gameId, playerId, isReady });

      // First we set optimistic UI state
      const socket = socketManager.getSocket();

      if (!socket || !socket.connected) {
        console.warn("Socket not connected, reconnecting...");
        socketManager.connect();

        // Still make API call as fallback
        setTimeout(() => {
          dispatch(fetchGameState(gameId));
        }, 500);

        return true;
      }

      // Make sure we're in the game room
      socketManager.ensureConnected(gameId, playerId);

      // Track when we see a server confirmation of our state
      let stateConfirmed = false;
      let retryCount = 0;
      const MAX_RETRIES = 3;

      // Setup confirmation listener
      const confirmationHandler = (updatedGame: any) => {
        // Check if the update includes our player's ready state
        const updatedPlayer = updatedGame.players?.find(
          (p: any) => p.id === playerId
        );
        if (updatedPlayer) {
          console.log(
            `Server reports player ${playerId} ready status: ${updatedPlayer.isReady}`
          );

          if (updatedPlayer.isReady === isReady) {
            stateConfirmed = true;
            console.log("Ready state confirmed by server!");
          } else if (retryCount < MAX_RETRIES) {
            // Still not matching, retry
            console.warn(
              `Ready state mismatch (try ${
                retryCount + 1
              }/${MAX_RETRIES}), retrying...`
            );
            retryEmit();
          }
        }
      };

      // Function to emit the ready status
      const emitReady = () => {
        if (socket && socket.connected) {
          socket.emit("player-ready", {
            gameId,
            playerId,
            isReady,
          });
          return true;
        }
        return false;
      };

      // Function to retry the emit with backoff
      const retryEmit = () => {
        retryCount++;
        if (retryCount <= MAX_RETRIES) {
          setTimeout(() => {
            console.log(
              `Retry ${retryCount}/${MAX_RETRIES} for player ready status`
            );
            emitReady();
          }, 200 * retryCount); // Increase delay with each retry
        }
      };

      // 1. Add listener first
      if (socket) {
        socket.on("game-updated", confirmationHandler);
      }

      // 2. Emit event
      emitReady();

      // 3. Set up fallbacks - only one API fallback for simplicity
      setTimeout(() => {
        if (!stateConfirmed) {
          console.log("Fallback: fetching game state via API");
          dispatch(fetchGameState(gameId)).then((action: any) => {
            if (action.payload) {
              const game = action.payload as Game;
              confirmationHandler(game);
              logGameState(gameId, playerId, game);
            }
          });
        }
      }, 1000);

      // Clean up the event listener after a reasonable time
      setTimeout(() => {
        if (socket) {
          socket.off("game-updated", confirmationHandler);
          console.log(
            `Removed game-updated listener after ${
              stateConfirmed ? "successful" : "attempted"
            } ready status update`
          );
        }
      }, 5000);

      return true;
    },
    [dispatch]
  );

  /**
   * Broadcast game start with enhanced reliability
   */
  const broadcastGameStart = useCallback(
    (gameId: string, hostId: string) => {
      console.log("Broadcasting game start:", { gameId, hostId });

      const socket = socketManager.getSocket();

      if (!socket || !socket.connected) {
        console.warn("Socket not connected, reconnecting and trying again...");
        const newSocket = socketManager.connect();
        if (!newSocket) {
          console.error("Failed to connect socket for game start");
          return false;
        }

        // Wait a bit for the socket to connect before continuing
        setTimeout(() => {
          broadcastGameStart(gameId, hostId);
        }, 1000);

        return true;
      }

      // Make sure we're properly connected to the game room
      socketManager.ensureConnected(gameId, hostId);

      // Track when we receive a game-started event
      let gameStartConfirmed = false;
      let retryCount = 0;
      const MAX_RETRIES = 2;

      // Game started event handler
      const gameStartedHandler = (gameData: any) => {
        console.log("Game started confirmation received:", gameData);
        gameStartConfirmed = true;

        // Log event for debugging
        if (gameId && hostId) {
          logGameState(gameId, hostId, gameData);
        }
      };

      // Add listener first
      socket.on("game-started", gameStartedHandler);

      // Function to emit the start game event
      const emitGameStart = () => {
        if (socket && socket.connected) {
          console.log(
            `Emitting start-game event (try ${retryCount + 1}/${
              MAX_RETRIES + 1
            })`
          );
          socket.emit("start-game", { gameId });

          // Debug room status
          socket.emit("debug-rooms", { gameId }, (response) => {
            console.log("Room status after game start broadcast:", response);

            // If no other sockets in room, we need additional help from the server
            if (response && response.roomSize <= 1) {
              console.warn(
                "Only one client in room. Server should broadcast to all connected players directly."
              );
            }
          });
          return true;
        }
        return false;
      };

      // Initial emit
      emitGameStart();

      // Set up a few retries in case the first emit doesn't go through
      setTimeout(() => {
        if (!gameStartConfirmed) {
          retryCount++;
          emitGameStart();
        }
      }, 500);

      setTimeout(() => {
        if (!gameStartConfirmed) {
          retryCount++;
          emitGameStart();
        }
      }, 1500);

      // Clean up listener after a reasonable time
      setTimeout(() => {
        socket.off("game-started", gameStartedHandler);
        console.log("Removed game-started listener");

        // If game start wasn't confirmed, check via API
        if (!gameStartConfirmed) {
          console.log("Game start not confirmed via socket, checking via API");
          dispatch(fetchGameState(gameId));
        }
      }, 5000);

      // Return success - additional fallbacks handled in LobbyPage
      return true;
    },
    [dispatch]
  );

  return {
    broadcastPlayerReady,
    broadcastGameStart,
  };
};

export default useGameBroadcast;
