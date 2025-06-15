import { configureStore } from "@reduxjs/toolkit";
import type { GameState } from "./features/game/gameSlice"; // Import GameState type
import gameReducer from "./features/game/gameSlice";
import type { SocketState } from "./features/socket/socketSlice"; // Import SocketState type
import socketReducer from "./features/socket/socketSlice";
import type { UserState } from "./features/user/userSlice"; // Import UserState type
import userReducer from "./features/user/userSlice";

export interface RootState {
  game: GameState;
  socket: SocketState;
  user: UserState;
}

const store = configureStore({
  reducer: {
    game: gameReducer,
    socket: socketReducer,
    user: userReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export default store;
