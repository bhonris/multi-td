import { Position, TowerType } from "@shared/types";
import { Request as ExpressRequest, Response } from "express";
import { GameService } from "../services/GameService";

// Define a custom Request type that includes the 'user' property
interface RequestWithUser extends ExpressRequest {
  user?: {
    id?: string;
    // Add other user properties if needed
  };
}

const gameService = new GameService();

export const createGame = async (req: RequestWithUser, res: Response) => {
  try {
    const hostId = req.body.hostId || req.user?.id;
    if (!hostId) {
      return res.status(400).json({ message: "Host ID is required." });
    }

    const { maxPlayers, difficulty } = req.body;
    if (typeof maxPlayers !== "number" || typeof difficulty !== "string") {
      return res
        .status(400)
        .json({ message: "Invalid parameters for creating game." });
    }

    const game = await gameService.createGame({
      hostId,
      maxPlayers,
      difficulty,
    });
    res.status(201).json(game);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const joinGame = async (req: RequestWithUser, res: Response) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: "Player ID is required" });
    }

    const game = await gameService.joinGame(gameId, playerId);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.status(200).json(game);
  } catch (error) {
    console.error("Error joining game:", error);
    res.status(500).json({ error: "Failed to join game" });
  }
};

export const getGameState = async (req: RequestWithUser, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = await gameService.getGameState(gameId);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.status(200).json(game);
  } catch (error) {
    console.error("Error getting game state:", error);
    res.status(500).json({ error: "Failed to get game state" });
  }
};

export const buildTower = async (req: RequestWithUser, res: Response) => {
  try {
    const { gameId } = req.params;
    const playerId = req.body.playerId || req.user?.id;
    if (!playerId) {
      return res.status(400).json({ message: "Player ID is required." });
    }
    const { towerType, position } = req.body as {
      towerType: TowerType;
      position: Position;
    };

    if (
      !towerType ||
      !position ||
      typeof position.x !== "number" ||
      typeof position.y !== "number"
    ) {
      return res
        .status(400)
        .json({ message: "Invalid tower type or position." });
    }

    const result = await gameService.buildTower(
      gameId,
      playerId,
      towerType,
      position
    );
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const upgradeTower = async (req: RequestWithUser, res: Response) => {
  try {
    const { gameId, towerId } = req.params;
    const playerId = req.body.playerId || req.user?.id;
    if (!playerId) {
      return res.status(400).json({ message: "Player ID is required." });
    }

    const result = await gameService.upgradeTower(gameId, playerId, towerId);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
