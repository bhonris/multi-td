import { io, Socket } from "socket.io-client";

// Define socket event interfaces
export interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  "game-updated": (data: any) => void;
  "game-state-update": (data: any) => void;
  "tower-built": (tower: any) => void;
  "tower-upgraded": (tower: any) => void;
  "money-updated": (data: any) => void;
  "wave-started": (data: any) => void;
  "enemy-damaged": (data: any) => void;
  "game-over": (result: any) => void;
  "player-joined": (data: any) => void;
  "game-started": (data: any) => void;
  // Add error events
  connect_error: (error: Error) => void;
  connect_timeout: (error: Error) => void;
  error: (error: Error) => void; // Add the error event to the interface
}

export interface ClientToServerEvents {
  "join-game": (data: { gameId: string; playerId: string }) => void;
  "build-tower": (data: any) => void;
  "upgrade-tower": (data: any) => void;
  "start-wave": (data: { gameId: string }) => void;
  "player-ready": (data: any) => void;
  "start-game": (data: { gameId: string }) => void;
  "debug-rooms": (
    data: { gameId: string },
    callback: (response: any) => void
  ) => void;
}

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";
  private reconnectionAttempts = 0;
  private MAX_RECONNECTION_ATTEMPTS = 10;

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public getSocket(): Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null {
    return this.socket;
  }

  public connect(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    if (!this.socket) {
      console.log(`Connecting to socket at ${this.API_URL}...`);
      try {
        // Get playerId from localStorage if available
        const userId = localStorage.getItem("userId");

        this.socket = io(this.API_URL, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: this.MAX_RECONNECTION_ATTEMPTS,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          query: userId ? { playerId: userId } : undefined,
          autoConnect: true,
        }) as Socket<ServerToClientEvents, ClientToServerEvents>;

        // Setup enhanced global event listeners
        this.setupEventListeners();
      } catch (err) {
        console.error("Error creating socket connection:", err);
        alert("Failed to establish connection to the game server.");
      }
    } else if (!this.socket.connected) {
      // If socket exists but not connected, reconnect
      console.log("Socket exists but not connected. Reconnecting...");
      this.socket.connect();
    }

    return this.socket;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Handle successful connections
    this.socket.on("connect", () => {
      console.log("Socket connected successfully with ID:", this.socket?.id);
      this.reconnectionAttempts = 0; // Reset attempts counter on successful connection
    });

    // Handle disconnections with better reconnection logic
    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected. Reason:", reason);

      if (reason === "io server disconnect") {
        // Server performed a force disconnect, need to manually reconnect
        console.log("Server forced disconnect, attempting manual reconnection");
        this.socket?.connect();
      }
      // For other cases, socket.io will automatically try to reconnect
    });

    // Better error handling
    this.socket.on("connect_error", (error) => {
      this.reconnectionAttempts++;
      console.error(
        `Socket connection error (attempt ${this.reconnectionAttempts}/${this.MAX_RECONNECTION_ATTEMPTS}):`,
        error
      );

      // Only alert after multiple failed attempts
      if (this.reconnectionAttempts >= 3) {
        alert(
          "Connection error: Unable to connect to the game server. Please check your connection and try again."
        );
      }
    });

    // Listen for game events
    this.socket.on("game-started", (data) => {
      console.log(
        "Game started event received on socket:",
        this.socket?.id,
        data
      );
    });

    // Generic error handler
    this.socket.on("error", (error: Error) => {
      console.error("Socket general error:", error);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Check connection status with retries
  public ensureConnected(gameId?: string, playerId?: string): boolean {
    if (!this.socket) {
      this.connect();
      return false;
    }

    if (!this.socket.connected) {
      console.log("Socket not connected, attempting to reconnect");
      this.socket.connect();
      return false;
    }

    // If we have game and player info and we're connected, ensure we're in the game room
    if (gameId && playerId && this.socket.connected) {
      console.log(`Ensuring socket is in game room: ${gameId}`);
      this.socket.emit("join-game", { gameId, playerId });
    }

    return this.socket.connected;
  }
}

export default SocketManager.getInstance();
