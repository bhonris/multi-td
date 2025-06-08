import { configureStore } from "@reduxjs/toolkit";
import gameReducer from "./features/game/gameSlice";
import socketReducer from "./features/socket/socketSlice";
import userReducer from "./features/user/userSlice";

const store = configureStore({
  reducer: {
    game: gameReducer,
    user: userReducer,
    socket: socketReducer,
  },
});

// Types for useDispatch and useSelector
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
