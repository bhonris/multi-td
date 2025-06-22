import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@shared/types";
import { v4 as uuidv4 } from "uuid";

export interface UserState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<string>) => {
      const username = action.payload;
      // Only create a new user if the username is different, or if there's no user
      if (!state.currentUser || state.currentUser.username !== username) {
        state.currentUser = {
          id: uuidv4(),
          username: username,
          email: `temp_${Date.now()}@example.com`, // Simplified email
          stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            highestWave: 0,
            totalEnemiesDefeated: 0,
            totalTowersBuilt: 0,
          },
        };
      }
    },
    logout: (state) => {
      state.currentUser = null;
    },
    updateUserStats: (state, action: PayloadAction<Partial<User["stats"]>>) => {
      if (state.currentUser) {
        state.currentUser.stats = {
          ...state.currentUser.stats,
          ...action.payload,
        };
      }
    },
  },
});

export const { setUser, logout, updateUserStats } = userSlice.actions;
export default userSlice.reducer;
