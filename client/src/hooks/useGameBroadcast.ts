import type { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import type { Game } from "@shared/types";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { fetchGameState } from "../features/game/gameSlice";
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
      }

      // Track when we see a server confirmation of our state
      let stateConfirmed = false;
      let retryCount = 0;
      const MAX_RETRIES = 5;

      // Track broadcast receipt using event ID
      const lastEventIds: string[] = [];

      // Setup confirmation listener
      const confirmationHandler = (updatedGame: any) => {
        // Check if there's an event ID and store it if we haven't seen it before
        if (
          updatedGame._eventId &&
          !lastEventIds.includes(updatedGame._eventId)
        ) {
          lastEventIds.push(updatedGame._eventId);
          console.log(
            `Received game update with event ID: ${updatedGame._eventId}`
          );
        }

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

          // Debug room status
          socket.emit("debug-rooms", { gameId }, (response) => {
            console.log("Room status after ready broadcast:", response);
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

      // 3. Set up fallbacks

      // First fallback: API call after a delay
      setTimeout(() => {
        if (!stateConfirmed) {
          console.log("First fallback: fetching game state via API");

          dispatch(fetchGameState(gameId)).then((action: any) => {
            if (action.payload) {
              const game = action.payload as Game;
              confirmationHandler(game);
              logGameState(gameId, playerId, game);
            }
          });
        }
      }, 1000);

      // Second fallback: another retry with longer delay
      setTimeout(() => {
        if (!stateConfirmed && retryCount < MAX_RETRIES) {
          console.log(
            "Second fallback: trying one more emit with API verification"
          );
          emitReady();

          // And verify with API again
          setTimeout(() => {
            dispatch(fetchGameState(gameId));
          }, 500);
        }
      }, 2000);

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
        console.warn("Socket not connected, reconnecting...");
        socketManager.connect();
        return false;
      }

      // Make sure socket is in the game room
      socketManager.ensureConnected(gameId, hostId);

      // Track when we receive a game-started event
      let gameStartConfirmed = false;
      let retryCount = 0;
      const MAX_RETRIES = 3;

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

            // If no other sockets in room, we may need additional help from the server
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

      // Function to retry with backoff
      const retryEmit = () => {
        retryCount++;
        if (retryCount <= MAX_RETRIES) {
          setTimeout(() => {
            if (!gameStartConfirmed) {
              console.log(`Retry ${retryCount}/${MAX_RETRIES} for game start`);
              emitGameStart();
            }
          }, 300 * retryCount); // Increase delay with each retry
        }
      };

      // Initial emit
      emitGameStart();

      // Set up automatic retries with staggered timing
      for (let i = 1; i <= MAX_RETRIES; i++) {
        setTimeout(() => {
          if (!gameStartConfirmed) {
            retryEmit();
          }
        }, 800 * i); // Staggered retries
      }

      // Set up API fallbacks if socket doesn't work
      setTimeout(() => {
        if (!gameStartConfirmed) {
          console.log("Socket broadcast not confirmed, trying API fallback");
          // Make an API call to check game status
          dispatch(fetchGameState(gameId));
        }
      }, 2000);

      // Clean up listener after a reasonable time
      setTimeout(() => {
        socket.off("game-started", gameStartedHandler);
        console.log("Removed game-started listener");
      }, 10000); // 10 seconds should be plenty of time

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
