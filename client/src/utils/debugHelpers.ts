/**
 * Utility functions to help debug multiplayer connectivity issues
 */

import { fetchGameState } from "../features/game/gameSlice";
import socketManager from "./socketManager";

/**
 * Checks the socket room connection status for the current player
 *
 * @param gameId - The ID of the game to check
 * @returns A promise that resolves with the room status
 */
export const checkRoomStatus = (gameId: string): Promise<any> => {
  const socket = socketManager.getSocket();

  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      reject(new Error("Socket not connected"));
      return;
    }

    socket.emit("debug-rooms", { gameId }, (response: any) => {
      resolve(response);
    });

    // Add a timeout to reject if no response is received
    setTimeout(() => {
      reject(new Error("Room status check timed out"));
    }, 3000);
  });
};

/**
 * Logs detailed game state information to help debug multiplayer issues
 *
 * @param gameId - The ID of the game to debug
 * @param playerId - The ID of the current player
 * @param game - The current game state
 */
export const logGameState = (
  gameId: string,
  playerId: string,
  game: any
): void => {
  if (!game) {
    console.error("No game state available for debugging");
    return;
  }

  console.group("Game State Debug Info");
  console.log("Game ID:", gameId);
  console.log("Game State:", game.state);
  console.log("Player ID:", playerId);
  console.log("Is Host:", game.hostId === playerId);
  console.log("Event ID:", game._eventId || "none"); // Track event IDs for debugging

  console.log("Players:");
  game.players?.forEach((player: any) => {
    console.log(
      ` - ${player.id} (${player.username}): ${
        player.isReady ? "READY" : "NOT READY"
      }`
    );
  });

  console.log(
    "All Players Ready:",
    game.players?.every((p: any) => p.isReady)
  );

  // Check socket status
  const socket = socketManager.getSocket();
  console.log("Socket Status:", {
    connected: socket?.connected,
    id: socket?.id,
  });

  // Check if socket is connected but room check can still be run
  if (socket?.connected) {
    checkRoomStatus(gameId)
      .then((roomStatus) => {
        console.log("Room Status:", roomStatus);
        console.groupEnd();
      })
      .catch((error) => {
        console.error("Error checking room status:", error);
        console.groupEnd();
      });
  } else {
    console.groupEnd();
  }
};

/**
 * Debug helper to check if we're still in touch with server
 */
export const checkServerSync = async (gameId: string, dispatch: any) => {
  console.log(`[ServerSync] Checking sync for game ${gameId}...`);
  try {
    const action = await dispatch(fetchGameState(gameId));
    const serverGame = action.payload;

    if (serverGame) {
      console.log(`[ServerSync] Server has game state:`, {
        gameId: serverGame.id,
        state: serverGame.state,
        playersReady: serverGame.players.map((p: any) => ({
          id: p.id,
          ready: p.isReady,
        })),
        updatedAt: serverGame.updatedAt,
        lastEventId: serverGame._eventId,
      });
      return true;
    } else {
      console.error(`[ServerSync] Failed to get game state from server`);
      return false;
    }
  } catch (err) {
    console.error(`[ServerSync] Error checking server sync:`, err);
    return false;
  }
};

/**
 * Creates a visual notification instead of an alert
 */
export const showNotification = (
  message: string,
  type: "info" | "success" | "error" = "info",
  durationMs = 3000
) => {
  const alertDiv = document.createElement("div");
  alertDiv.style.position = "fixed";
  alertDiv.style.top = "50%";
  alertDiv.style.left = "50%";
  alertDiv.style.transform = "translate(-50%, -50%)";

  // Set color based on type
  let bgColor = "#4CAF50"; // green/success default
  if (type === "info") bgColor = "#2196F3"; // blue
  if (type === "error") bgColor = "#F44336"; // red

  alertDiv.style.backgroundColor = bgColor;
  alertDiv.style.color = "white";
  alertDiv.style.padding = "20px";
  alertDiv.style.borderRadius = "5px";
  alertDiv.style.zIndex = "1000";
  alertDiv.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);

  // Remove after duration
  setTimeout(() => {
    if (alertDiv.parentNode) {
      document.body.removeChild(alertDiv);
    }
  }, durationMs);

  return alertDiv;
};

export default {
  checkRoomStatus,
  logGameState,
  checkServerSync,
  showNotification,
};
