import { Request, Response } from "express";
import { GameService } from "../services/GameService";

export class GameController {
  private gameService: GameService;

  constructor() {
    this.gameService = new GameService();
  }

  createGame = async (req: Request, res: Response) => {
    try {
      const { hostId, maxPlayers, difficulty } = req.body;

      if (!hostId) {
        return res.status(400).json({ error: "Host ID is required" });
      }

      const game = await this.gameService.createGame({
        hostId,
        maxPlayers: maxPlayers || 4,
        difficulty: difficulty || "normal",
      });

      res.status(201).json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ error: "Failed to create game" });
    }
  };

  joinGame = async (req: Request, res: Response) => {
    try {
      const { gameId } = req.params;
      const { playerId } = req.body;

      if (!playerId) {
        return res.status(400).json({ error: "Player ID is required" });
      }

      const game = await this.gameService.joinGame(gameId, playerId);

      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      res.status(200).json(game);
    } catch (error) {
      console.error("Error joining game:", error);
      res.status(500).json({ error: "Failed to join game" });
    }
  };

  getGameState = async (req: Request, res: Response) => {
    try {
      const { gameId } = req.params;
      const game = await this.gameService.getGameState(gameId);

      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      res.status(200).json(game);
    } catch (error) {
      console.error("Error getting game state:", error);
      res.status(500).json({ error: "Failed to get game state" });
    }
  };
}
