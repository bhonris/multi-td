import { v4 as uuidv4 } from "uuid";
import { User, UserStats } from "../models/User";

// In a real application, this would interact with a database
// Here, we'll just use an in-memory map
const users: Map<string, User> = new Map();

interface CreateUserOptions {
  username: string;
  password: string;
  email: string;
}

export class UserService {
  async createUser(options: CreateUserOptions): Promise<User> {
    const { username, password, email } = options;

    // Check if username already exists
    const existingUser = await this.getUserByUsername(username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    const now = new Date();
    const user: User = {
      id: uuidv4(),
      username,
      password, // In a real application, this would be hashed
      email,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        highestWave: 0,
        totalEnemiesDefeated: 0,
        totalTowersBuilt: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    users.set(user.id, user);
    return user;
  }

  async getUserById(userId: string): Promise<User | null> {
    return users.get(userId) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    for (const user of users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user || user.password !== password) {
      return null;
    }
    return user;
  }

  generateToken(user: User): string {
    // In a real application, this would use JWT or another token method
    return `token-${user.id}-${Date.now()}`;
  }

  async updateUser(
    userId: string,
    updates: Partial<User>
  ): Promise<User | null> {
    const user = users.get(userId);

    if (!user) {
      return null;
    }

    // Don't allow updating certain fields
    const { id, password, createdAt, ...allowedUpdates } = updates;

    const updatedUser = {
      ...user,
      ...allowedUpdates,
      updatedAt: new Date(),
    };

    users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserStats(
    userId: string,
    stats: Partial<UserStats>
  ): Promise<User | null> {
    const user = users.get(userId);

    if (!user) {
      return null;
    }

    const updatedStats = {
      ...user.stats,
      ...stats,
    };

    const updatedUser = {
      ...user,
      stats: updatedStats,
      updatedAt: new Date(),
    };

    users.set(userId, updatedUser);
    return updatedUser;
  }
}
