import type { Position } from "@shared/types";
import { useEffect, useState } from "react";

/**
 * Hook for creating and managing the tower defense game map grid
 * @param width - Grid width in cells
 * @param height - Grid height in cells
 * @param cellSize - Size of each cell in pixels
 */
export const useGameGrid = (
  width: number,
  height: number,
  cellSize: number = 40
) => {
  const [grid, setGrid] = useState<
    { isPath: boolean; isOccupied: boolean }[][]
  >([]);
  const [pathCells, setPathCells] = useState<Position[]>([]);

  // Initialize the grid
  useEffect(() => {
    // Create empty grid
    const newGrid = Array(height)
      .fill(null)
      .map(() =>
        Array(width)
          .fill(null)
          .map(() => ({ isPath: false, isOccupied: false }))
      ); // Define the enemy path through the grid - matching server-side path in EnemyService.ts
    const path: Position[] = [];

    // Horizontal path at y=5 from x=0 to x=9
    for (let x = 0; x <= 9; x++) {
      path.push({ x, y: 5 });
      if (newGrid[5] && newGrid[5][x]) {
        newGrid[5][x].isPath = true;
      }
    }

    // Vertical path at x=9 going down from y=6 to y=9
    for (let y = 6; y <= 9; y++) {
      path.push({ x: 9, y });
      if (newGrid[y] && newGrid[y][9]) {
        newGrid[y][9].isPath = true;
      }
    } // Horizontal path at y=9 from x=10 to x=20
    for (let x = 10; x <= 20; x++) {
      path.push({ x, y: 9 });
      if (newGrid[9] && newGrid[9][x]) {
        newGrid[9][x].isPath = true;
      }
    }

    // Vertical path at x=20 going up from y=8 to y=0
    for (let y = 8; y >= 0; y--) {
      path.push({ x: 20, y });
      if (newGrid[y] && newGrid[y][20]) {
        newGrid[y][20].isPath = true;
      }
    }

    setPathCells(path);
    setGrid(newGrid);
  }, [width, height]);

  // Check if a position is on the path
  const isPositionOnPath = (position: Position): boolean => {
    return pathCells.some(
      (cell) => cell.x === position.x && cell.y === position.y
    );
  };

  // Check if a position is within grid bounds
  const isPositionInBounds = (position: Position): boolean => {
    return (
      position.x >= 0 &&
      position.x < width &&
      position.y >= 0 &&
      position.y < height
    );
  };

  // Mark a cell as occupied (for tower placement)
  const setOccupied = (position: Position, occupied: boolean) => {
    if (isPositionInBounds(position)) {
      setGrid((prev) => {
        const newGrid = [...prev];
        newGrid[position.y] = [...newGrid[position.y]];
        newGrid[position.y][position.x] = {
          ...newGrid[position.y][position.x],
          isOccupied: occupied,
        };
        return newGrid;
      });
    }
  };

  // Convert grid position to canvas coordinates
  const gridToPixel = (position: Position): { x: number; y: number } => {
    return {
      x: position.x * cellSize + cellSize / 2,
      y: position.y * cellSize + cellSize / 2,
    };
  };

  // Convert pixel coordinates to grid position
  const pixelToGrid = (x: number, y: number): Position => {
    return {
      x: Math.floor(x / cellSize),
      y: Math.floor(y / cellSize),
    };
  };

  return {
    grid,
    pathCells,
    isPositionOnPath,
    isPositionInBounds,
    setOccupied,
    gridToPixel,
    pixelToGrid,
  };
};

export default useGameGrid;
