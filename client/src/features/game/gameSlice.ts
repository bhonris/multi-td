import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { Enemy, Game, Tower } from "@shared/types"; // Updated import
import api from "../../utils/api";

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export interface GameState {
  // Export GameState
  currentGame: Game | null;
  currentWave: number;
  baseHealth: number;
  money: { [playerId: string]: number };
  towers: Tower[];
  enemies: Enemy[];
  loading: boolean;
  error: string | null;
}

const initialState: GameState = {
  currentGame: null,
  currentWave: 0,
  baseHealth: 0,
  money: {},
  towers: [],
  enemies: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchGameState = createAsyncThunk<
  Game,
  string,
  { rejectValue: string }
>("game/fetchGameState", async (gameId: string, { rejectWithValue }) => {
  try {
    console.log(`Fetching game state for game: ${gameId}`);
    const response = await api.get<Game>(`/api/game/${gameId}`);
    console.log(`Game state fetched successfully:`, response.data);
    return response.data;
  } catch (e: unknown) {
    const error = e as ApiError;
    console.error(`Error fetching game state for game ${gameId}:`, error);
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch game state"
    );
  }
});

export const createGame = createAsyncThunk<
  Game,
  {
    hostId: string;
    maxPlayers: number;
    difficulty: string;
  },
  { rejectValue: string }
>(
  "game/createGame",
  async (
    options: {
      hostId: string;
      maxPlayers: number;
      difficulty: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<Game>("/api/game", options);
      return response.data;
    } catch (e: unknown) {
      const error = e as ApiError;
      return rejectWithValue(
        error.response?.data?.message || "Failed to create game"
      );
    }
  }
);

export const joinGame = createAsyncThunk<
  Game,
  { gameId: string; playerId: string },
  { rejectValue: string }
>(
  "game/joinGame",
  async (
    { gameId, playerId }: { gameId: string; playerId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<Game>(`/api/game/${gameId}/join`, {
        playerId,
      });
      return response.data;
    } catch (e: unknown) {
      const error = e as ApiError;
      return rejectWithValue(
        error.response?.data?.message || "Failed to join game"
      );
    }
  }
);

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    gameUpdated: (
      state,
      action: PayloadAction<Partial<Game> & { error?: string }>
    ) => {
      console.log("gameSlice: gameUpdated received", action.payload);

      // If the payload contains an error, log it and return
      if (action.payload && action.payload.error) {
        console.error(
          "gameSlice: received error in gameUpdated:",
          action.payload.error
        );
        return;
      }

      // If the payload is a full Game object, update everything
      if (action.payload && action.payload.id && action.payload.hostId) {
        state.currentGame = action.payload as Game;
        state.currentWave = action.payload.wave || 0;
        state.baseHealth = action.payload.baseHealth || 0;
        state.money = action.payload.money || {};
        state.enemies = action.payload.enemies || [];
        state.towers = action.payload.towers || [];
        console.log(
          "gameSlice: gameUpdated with full Game object",
          action.payload
        );
        return;
      }

      // Handle partial updates (like those from socket events)
      if (action.payload.enemies) {
        state.enemies = action.payload.enemies;
      }
      if (action.payload.towers) {
        state.towers = action.payload.towers;
      }
      if (action.payload.baseHealth !== undefined) {
        state.baseHealth = action.payload.baseHealth;
      }
      if (action.payload.wave !== undefined) {
        state.currentWave = action.payload.wave;
      }
      if (action.payload.money) {
        state.money = { ...action.payload.money };
      }

      // Carefully update the game state
      if (state.currentGame) {
        const updatedGame = { ...state.currentGame };

        // Update game state if provided
        if (action.payload.state) {
          updatedGame.state = action.payload.state;
        }

        // Update wave if provided
        if (action.payload.wave !== undefined) {
          updatedGame.wave = action.payload.wave;
        }

        // Update players array with special handling for ready status
        if (action.payload.players) {
          // Complete replacement of players array
          updatedGame.players = action.payload.players;
        }

        // Apply the updates
        state.currentGame = updatedGame;

        console.log("gameSlice: currentGame updated", state.currentGame);
      }
    },
    waveStarted: (
      state,
      action: PayloadAction<{ wave: number; enemies: Enemy[] }>
    ) => {
      state.currentWave = action.payload.wave;
      state.enemies = action.payload.enemies;
    },
    towerBuilt: (state, action: PayloadAction<Tower>) => {
      state.towers.push(action.payload);
    },
    towerUpgraded: (state, action: PayloadAction<Tower>) => {
      const index = state.towers.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.towers[index] = action.payload;
      }
    },
    moneyUpdated: (
      state,
      action: PayloadAction<{ playerId: string; money: number }>
    ) => {
      const { playerId, money } = action.payload;
      state.money[playerId] = money;
    },
    enemyDamaged: (
      state,
      action: PayloadAction<{ enemyId: string; damage: number }>
    ) => {
      const { enemyId, damage } = action.payload;
      const enemyIndex = state.enemies.findIndex((e) => e.id === enemyId);
      if (enemyIndex !== -1) {
        state.enemies[enemyIndex].health -= damage;
        if (state.enemies[enemyIndex].health <= 0) {
          state.enemies.splice(enemyIndex, 1);
        }
      }
    },
    enemyMoved: (
      state,
      action: PayloadAction<{
        enemyId: string;
        position: { x: number; y: number };
      }>
    ) => {
      const { enemyId, position } = action.payload;
      const enemyIndex = state.enemies.findIndex((e) => e.id === enemyId);
      if (enemyIndex !== -1) {
        state.enemies[enemyIndex].position = position;
      }
    },
    baseHealthUpdated: (state, action: PayloadAction<number>) => {
      state.baseHealth = action.payload;
    },
    clearGame: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGameState.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGameState.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (payload) {
          state.currentGame = payload;
          state.currentWave = payload.wave || 0;
          state.baseHealth = payload.baseHealth || 0;
          state.error = null;

          // If the game state indicates the game is running, update all relevant state
          if (payload.state === "running") {
            state.money = payload.money || {};
            state.enemies = payload.enemies || [];
            state.towers = payload.towers || [];
            console.log("Game is running, updated game state in Redux");
          }
        }
      })
      .addCase(fetchGameState.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch game state";
      })
      .addCase(createGame.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGame.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGame = action.payload;
      })
      .addCase(createGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create game";
      })
      .addCase(joinGame.fulfilled, (state, action) => {
        state.currentGame = action.payload;
      })
      .addCase(joinGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to join game";
      });
  },
});

export const {
  gameUpdated,
  waveStarted,
  towerBuilt,
  towerUpgraded,
  moneyUpdated,
  enemyDamaged,
  enemyMoved,
  baseHealthUpdated,
  clearGame,
} = gameSlice.actions;

export default gameSlice.reducer;
