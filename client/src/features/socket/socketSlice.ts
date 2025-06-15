import { createSlice } from "@reduxjs/toolkit";
import socketManager from "../../utils/socketManager";

export interface SocketState {
  connected: boolean;
}

const initialState: SocketState = {
  connected: false,
};

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    initializeSocket: (state) => {
      // Initialize the socket via the socketManager
      socketManager.connect();
      return state;
    },
    socketConnected: (state) => {
      state.connected = true;
    },
    socketDisconnected: (state) => {
      state.connected = false;
    },
    destroySocket: (state) => {
      // Disconnect the socket via the socketManager
      socketManager.disconnect();
      state.connected = false;
    },
  },
});

export const {
  initializeSocket,
  socketConnected,
  socketDisconnected,
  destroySocket,
} = socketSlice.actions;

export default socketSlice.reducer;
