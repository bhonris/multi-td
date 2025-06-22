import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  destroySocket,
  initializeSocket,
  socketConnected,
  socketDisconnected,
} from "../features/socket/socketSlice";
import type { AppDispatch, RootState } from "../store";
import socketManager from "../utils/socketManager";

/**
 * Custom hook for managing WebSocket connections in the tower defense game
 * @param gameId - The ID of the current game
 * @param playerId - The ID of the current player
 */
const useGameSocket = (
  gameId: string | undefined,
  playerId: string | undefined
) => {
  const dispatch = useDispatch<AppDispatch>();
  const { connected } = useSelector((state: RootState) => state.socket);

  useEffect(() => {
    if (gameId && playerId) {
      // Initialize socket connection
      dispatch(initializeSocket());
    }

    return () => {
      // Clean up socket connection when component unmounts
      dispatch(destroySocket());
    };
  }, [dispatch, gameId, playerId]);
  useEffect(() => {
    const socket = socketManager.getSocket();

    if (socket) {
      const handleConnect = () => {
        console.log("Socket connected");
        dispatch(socketConnected());

        if (gameId && playerId) {
          socket.emit("join-game", { gameId, playerId });
        }
      };

      const handleDisconnect = () => {
        console.log("Socket disconnected");
        dispatch(socketDisconnected());
      };

      // Set up event listeners
      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);

      // Clean up event listeners
      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
      };
    }
  }, [connected, gameId, playerId, dispatch]);

  // Return the socket from the manager and connection status from Redux
  return { socket: socketManager.getSocket(), connected };
};

export default useGameSocket;
