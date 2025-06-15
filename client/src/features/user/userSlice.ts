import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { User } from "@shared/types";
import { v4 as uuidv4 } from "uuid";
import api from "../../utils/api";

export interface UserState {
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
    // Assuming the server returns the created user or a success message
    return response.data; // Adjust if server returns { user: User }
  }
);

export const loginUser = createAsyncThunk<
  { token: string; user: User }, // This is the return type of the thunk's payload
  { username: string; password: string } // This is the type of the argument to the thunk
>("user/loginUser", async (credentials) => {
  const response = await api.post("/api/users/login", credentials);
  return response.data as { token: string; user: User }; // Assuming server returns { token: string, user: User }
});

export const fetchUserProfile = createAsyncThunk<
  User, // Return type
  string // Argument type (userId)
>("user/fetchUserProfile", async (userId) => {
  const response = await api.get(`/api/users/profile/${userId}`);
  return response.data as User;
});

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
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        // If registration implies login, you would set user and token here.
        // For example:
        // if (action.payload && action.payload.token) { // Check if token is part of payload
        //   state.isAuthenticated = true;
        //   state.currentUser = action.payload.user; // Assuming payload is { user: User, token: string }
        //   localStorage.setItem("token", action.payload.token);
        //   localStorage.setItem("user", JSON.stringify(action.payload.user));
        // } else if (action.payload) { // If payload is just the User object
        //  // Potentially set user if needed, or just handle success
        // }
        console.log("User registration successful:", action.payload); // Example: Log payload
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Registration failed";
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        loginUser.fulfilled,
        (state, action: PayloadAction<{ token: string; user: User }>) => {
          state.loading = false;
          state.isAuthenticated = true;
          state.currentUser = action.payload.user;

          // Store token and user in localStorage
          localStorage.setItem("token", action.payload.token);
          localStorage.setItem("user", JSON.stringify(action.payload.user));
        }
      )
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Login failed";
      })
      .addCase(
        fetchUserProfile.fulfilled,
        (state, action: PayloadAction<User>) => {
          if (state.currentUser && state.currentUser.id === action.payload.id) {
            // Only update if the fetched profile is for the current user
            state.currentUser = {
              ...state.currentUser, // Keep existing client-side state not returned by API if any
              ...action.payload, // Overwrite with fetched data
            };
          } else if (!state.currentUser && action.payload) {
            // If no current user, but profile fetched (e.g. deep link, or admin action)
            // This case might need more thought depending on app logic
            // For now, let's assume we only care about the logged-in user's profile
          }
        }
      );
  },
});

export const { logout, updateUserStats, setTemporaryUser } = userSlice.actions;

export default userSlice.reducer;
