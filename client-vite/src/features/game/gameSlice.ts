import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Enemy, Game, Tower } from "../../types";
import api from "../../utils/api";

interface GameState {
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
export const fetchGameState = createAsyncThunk(
  "game/fetchGameState",
  async (gameId: string, { rejectWithValue }) => {
    try {
      console.log(`Fetching game state for game: ${gameId}`);
      const response = await api.get(`/api/game/${gameId}`);
      console.log(`Game state fetched successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching game state for game ${gameId}:`, error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch game state"
      );
    }
  }
);

export const createGame = createAsyncThunk(
  "game/createGame",
  async (options: {
    hostId: string;
    maxPlayers: number;
    difficulty: string;
  }) => {
    const response = await api.post("/api/game", options);
    return response.data;
  }
);

export const joinGame = createAsyncThunk(
  "game/joinGame",
  async ({ gameId, playerId }: { gameId: string; playerId: string }) => {
    const response = await api.post(`/api/game/${gameId}/join`, { playerId });
    return response.data;
  }
);

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    gameUpdated: (state, action: PayloadAction<Game | any>) => {
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
        state.currentGame = action.payload;
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
    clearGame: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGameState.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGameState.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as Game;
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
        state.error = action.error.message || "Failed to fetch game state";
      })
      .addCase(createGame.fulfilled, (state, action) => {
        state.currentGame = action.payload;
      })
      .addCase(joinGame.fulfilled, (state, action) => {
        state.currentGame = action.payload;
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
