import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { TowerType, Tower } from "@shared/types";
import {
  calculateUpgradePreview,
  getUpgradeIndicator,
} from "@shared/utils/towerUpgradeUtils";
import type { UpgradePreview } from "@shared/utils/towerUpgradeUtils";
import type { RootState } from "../store";

export function useTowerUpgradePreview(
  tower: Tower | null
): UpgradePreview | null {
  const playerMoney = useSelector((state: RootState) => {
    const game = state.game.currentGame;
    const currentPlayer = state.user.currentUser;

    if (!game || !currentPlayer) return 0;

    const player = game.players.find((p) => p.id === currentPlayer.id);
    return player?.money || 0;
  });

  return useMemo(() => {
    if (!tower) return null;

    return calculateUpgradePreview(tower.type, tower.level, playerMoney);
  }, [tower, playerMoney]);
}

export function useTowerUpgradeIndicator(
  towerType: TowerType,
  level: number
): string {
  const playerMoney = useSelector((state: RootState) => {
    const game = state.game.currentGame;
    const currentPlayer = state.user.currentUser;

    if (!game || !currentPlayer) return 0;

    const player = game.players.find((p) => p.id === currentPlayer.id);
    return player?.money || 0;
  });

  return useMemo(() => {
    return getUpgradeIndicator(towerType, level, playerMoney);
  }, [towerType, level, playerMoney]);
}

export function useCanAffordUpgrade(tower: Tower | null): boolean {
  const preview = useTowerUpgradePreview(tower);
  return preview?.canAfford || false;
}

export function useUpgradeAffordability(): (
  towerType: TowerType,
  level: number
) => boolean {
  const playerMoney = useSelector((state: RootState) => {
    const game = state.game.currentGame;
    const currentPlayer = state.user.currentUser;

    if (!game || !currentPlayer) return 0;

    const player = game.players.find((p) => p.id === currentPlayer.id);
    return player?.money || 0;
  });

  return useMemo(() => {
    return (towerType: TowerType, level: number) => {
      const preview = calculateUpgradePreview(towerType, level, playerMoney);
      return preview.canAfford;
    };
  }, [playerMoney]);
}
