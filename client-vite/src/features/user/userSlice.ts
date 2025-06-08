import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import { User } from "../../types";
import api from "../../utils/api";

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isTemporaryUser: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  isTemporaryUser: false,
  loading: false,
  error: null,
};

// Check for existing token in localStorage
const token = localStorage.getItem("token");
if (token) {
  const userJSON = localStorage.getItem("user");
  if (userJSON) {
    try {
      initialState.currentUser = JSON.parse(userJSON);
      initialState.isAuthenticated = true;
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }
}

// Async thunks
export const registerUser = createAsyncThunk(
  "user/registerUser",
  async (userData: { username: string; password: string; email: string }) => {
    const response = await api.post("/api/users/register", userData);
    return response.data;
  }
);

export const loginUser = createAsyncThunk(
  "user/loginUser",
  async (credentials: { username: string; password: string }) => {
    const response = await api.post("/api/users/login", credentials);
    return response.data;
  }
);

export const fetchUserProfile = createAsyncThunk(
  "user/fetchUserProfile",
  async (userId: string) => {
    const response = await api.get(`/api/users/profile/${userId}`);
    return response.data;
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setTemporaryUser: (state, action: PayloadAction<string>) => {
      const username = action.payload;
      // Create a temporary user with minimal information
      state.currentUser = {
        id: uuidv4(),
        username: username,
        email: `temp_${uuidv4()}@example.com`,
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          highestWave: 0,
          totalEnemiesDefeated: 0,
          totalTowersBuilt: 0,
        },
      };
      state.isAuthenticated = true;
      state.isTemporaryUser = true;
    },
    logout: (state) => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      state.currentUser = null;
      state.isAuthenticated = false;
      state.isTemporaryUser = false;
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
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Registration failed";
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.currentUser = action.payload;

        // Store token and user in localStorage
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Login failed";
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        if (state.currentUser) {
          state.currentUser = {
            ...state.currentUser,
            ...action.payload,
          };
        }
      });
  },
});

export const { logout, updateUserStats, setTemporaryUser } = userSlice.actions;

export default userSlice.reducer;
