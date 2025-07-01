import { towerConfigurations } from '@shared/config/towerConfig';
import type { Enemy, EnemyAbility, EnemyEffect, EnemyType, Position, Tower, TowerType } from '@shared/types'; // Corrected import path
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import useGameLoop from '../../hooks/useGameLoop';
import TowerSprite from './TowerSprite';

interface GameMapProps {
  towers: Tower[];
  enemies: Enemy[];
  gridSize: { width: number; height: number };
  selectedTowerType: TowerType | null;
  selectedTower: Tower | null;
  onMapClick: (position: Position) => void;
}

// Define a projectile interface
interface Projectile {
  id: string;
  sourcePosition: Position;
  targetPosition: Position;
  towerType: TowerType;
  progress: number; // 0 to 1
  hitRadius: number; // Area of effect radius for projectile to hit enemies
}

const MapContainer = styled.div`
  position: relative;
  flex: 1;
  background-color: #253530;
  overflow: hidden;
`;

const Grid = styled.div<{ width: number; height: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.width}, 40px);
  grid-template-rows: repeat(${props => props.height}, 40px);
  gap: 1px;
  padding: 10px;
`;

const Cell = styled.div<{ isPath?: boolean }>`
  width: 40px;
  height: 40px;
  background-color: ${props => props.isPath ? '#2c4034' : '#1a2a25'};
  border: 1px solid #30443c;
  position: relative; // Added for positioning RangeIndicator for hover preview
  &:hover {
    box-shadow: inset 0 0 0 2px #4d9aff;
    cursor: pointer;
  }
`;

const EnemyElement = styled.div<{ type: string; healthPercent: number }>`
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 5;
  border-radius: ${props => props.type === 'boss' ? '5px' : '50%'};
  
  ${props => {
    const size = props.type === 'boss' ? 30 :
      props.type === 'tank' ? 22 :
        props.type === 'fast' ? 14 :
          props.type === 'healer' ? 18 : 18;

    return `
      width: ${size}px;
      height: ${size}px;
    `;
  }}
  
  ${props => {
    switch (props.type) {
      case 'basic':
        return `background-color: #7f8c8d;`;
      case 'fast':
        return `background-color: #2ecc71;`;
      case 'tank':
        return `background-color: #7f8c8d;`;
      case 'healer':
        return `background-color: #e67e22;`;
      case 'boss':
        return `background-color: #c0392b;`;
      default:
        return `background-color: #7f8c8d;`;
    }
  }}
  
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: 0;
    height: 3px;
    width: 100%;
    background-color: #ff0000; // Changed to bright red
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -4px;
    left: 0;
    height: 3px;
    width: ${props => props.healthPercent}%;
    background-color: #27ae60;
  }
`;

const RangeIndicator = styled.div<{ range: number }>`
  position: absolute;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
  width: ${props => props.range * 80}px;
  height: ${props => props.range * 80}px;
`;

const ProjectileElement = styled.div<{ towerType: TowerType }>`
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 20;
  border-radius: 50%;
  
  ${props => {
    switch (props.towerType) {
      case 'basic':
        return `
          width: 8px;
          height: 8px;
          background-color: #4d9aff;
          box-shadow: 0 0 5px #4d9aff;
        `;
      case 'sniper':
        return `
          width: 6px;
          height: 12px;
          background-color: #e74c3c;
          box-shadow: 0 0 8px #e74c3c;
          border-radius: 2px;
          transform: translate(-50%, -50%) rotate(45deg);
        `;
      case 'splash':
        return `
          width: 10px;
          height: 10px;
          background-color: #9b59b6;
          box-shadow: 0 0 12px #9b59b6;
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
        `;
      case 'slow':
        return `
          width: 8px;
          height: 8px;
          background-color: #3498db;
          box-shadow: 0 0 10px #3498db;
          border-radius: 0;
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
          animation: rotate 1s linear infinite;
          @keyframes rotate {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
        `;
      case 'money':
        return `
          width: 8px;
          height: 8px;
          background-color: #f1c40f;
          box-shadow: 0 0 8px #f1c40f;
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        `;
      default:
        return `
          width: 8px;
          height: 8px;
          background-color: #4d9aff;
          box-shadow: 0 0 5px #4d9aff;
        `;
    }
  }}
`;

const ImpactEffect = styled.div<{ towerType: TowerType, hitRadius?: number }>`
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 15;
  border-radius: 50%;
  animation: impact 0.7s ease-out forwards;
  
  @keyframes impact {
    0% { 
      opacity: 1;
      transform: translate(-50%, -50%) scale(0.5); 
    }
    100% { 
      opacity: 0;
      transform: translate(-50%, -50%) scale(2.5); 
    }
  }
  
  ${props => {
    // Use hitRadius to scale the impact size - default to 1 if not provided
    const sizeMultiplier = props.hitRadius ? props.hitRadius * 20 : 20;

    switch (props.towerType) {
      case 'basic':
        return `
          width: ${sizeMultiplier * 1.0}px;
          height: ${sizeMultiplier * 1.0}px;
          background-color: rgba(77, 154, 255, 0.5);
          box-shadow: 0 0 ${sizeMultiplier * 0.7}px #4d9aff;
        `;
      case 'sniper':
        return `
          width: ${sizeMultiplier * 0.8}px;
          height: ${sizeMultiplier * 0.8}px;
          background-color: rgba(231, 76, 60, 0.5);
          box-shadow: 0 0 ${sizeMultiplier * 0.8}px #e74c3c;
        `;
      case 'splash':
        return `
          width: ${sizeMultiplier * 1.5}px;
          height: ${sizeMultiplier * 1.5}px;
          background-color: rgba(155, 89, 182, 0.5);
          box-shadow: 0 0 ${sizeMultiplier * 1.0}px #9b59b6;
          animation: impact-splash 1s ease-out forwards;
          @keyframes impact-splash {
            0% { 
              opacity: 0.8;
              transform: translate(-50%, -50%) scale(0.5); 
            }
            50% {
              opacity: 0.6;
              transform: translate(-50%, -50%) scale(2);
            }
            100% { 
              opacity: 0;
              transform: translate(-50%, -50%) scale(3); 
            }
          }
        `;
      case 'slow':
        return `
          width: ${sizeMultiplier * 1.2}px;
          height: ${sizeMultiplier * 1.2}px;
          background-color: rgba(52, 152, 219, 0.5);
          box-shadow: 0 0 ${sizeMultiplier * 0.8}px #3498db;
          animation: impact-slow 0.9s ease-out forwards;
          @keyframes impact-slow {
            0% { 
              opacity: 0.8;
              transform: translate(-50%, -50%) scale(0.5); 
            }
            50% {
              opacity: 0.6;
              transform: translate(-50%, -50%) scale(1.8);
            }
            100% { 
              opacity: 0;
              transform: translate(-50%, -50%) scale(2.8); 
            }
          }
        `;
      case 'money':
        return `
          width: ${sizeMultiplier * 0.8}px;
          height: ${sizeMultiplier * 0.8}px;
          background-color: rgba(241, 196, 15, 0.5);
          box-shadow: 0 0 ${sizeMultiplier * 0.6}px #f1c40f;
        `;
      default:
        return `
          width: ${sizeMultiplier}px;
          height: ${sizeMultiplier}px;
          background-color: rgba(77, 154, 255, 0.5);
          box-shadow: 0 0 ${sizeMultiplier * 0.6}px #4d9aff;
        `;
    }
  }}
`;

// Interface for smoothed enemy position
// Explicitly defining properties from Enemy to help with type resolution
interface SmoothedEnemy {
  id: string;
  type: EnemyType;
  health: number;
  maxHealth: number;
  position: Position;
  speed: number;
  reward: number;
  damage: number;
  abilities: EnemyAbility[];
  effects: EnemyEffect[];
  path: Position[];
  pathIndex: number;
  createdAt: Date;
  visualPosition: Position; // Specific to SmoothedEnemy
}

const GameMap: React.FC<GameMapProps> = ({
  towers,
  enemies,
  gridSize,
  selectedTowerType,
  selectedTower,
  onMapClick,
}) => {
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
  const [towerAngles, setTowerAngles] = useState<Record<string, number>>({});
  const [smoothedEnemies, setSmoothedEnemies] = useState<SmoothedEnemy[]>([]);
  const [impacts, setImpacts] = useState<{ position: Position, towerType: TowerType, timestamp: number, hitRadius?: number }[]>([]);
  const [hoveredTowerId, setHoveredTowerId] = useState<string | null>(null);

  // Update tower angles
  useEffect(() => {
    setTowerAngles(prevAngles => {
      const newAngles = { ...prevAngles };
      let hasChanges = false;

      towers.forEach(tower => {
        if (tower.target) {
          const targetEnemy = enemies.find(enemy => enemy.id === tower.target);
          if (targetEnemy) { // Added condition to complete the if statement
            const dx = targetEnemy.position.x - tower.position.x;
            const dy = targetEnemy.position.y - tower.position.y;
            const calculatedAngle = Math.atan2(dy, dx) * (180 / Math.PI);

            if (newAngles[tower.id] !== calculatedAngle) {
              newAngles[tower.id] = calculatedAngle;
              hasChanges = true;
            }
          }
        }
      });

      for (const towerId in newAngles) {
        if (!towers.some(t => t.id === towerId)) {
          delete newAngles[towerId];
          hasChanges = true;
        }
      }
      // Ensure the state setter returns the new state or the previous one
      return hasChanges ? newAngles : prevAngles;
    });
  }, [towers, enemies]);

  useEffect(() => {
    if (enemies.length > 0) {
      setSmoothedEnemies((prevSmoothed: SmoothedEnemy[]): SmoothedEnemy[] => {
        return enemies.map((enemy: Enemy): SmoothedEnemy => {
          const existing = prevSmoothed.find((e: SmoothedEnemy) => e.id === enemy.id);
          if (existing) {
            return {
              ...enemy,
              visualPosition: { ...existing.visualPosition }
            };
          } else {
            return {
              ...enemy,
              visualPosition: { ...enemy.position }
            };
          }
        });
      });
    } else {
      setSmoothedEnemies([]);
    }
  }, [enemies]);

  const pathCells: Position[] = [];
  for (let x = 0; x <= 9; x++) {
    pathCells.push({ x, y: 5 });
  }
  for (let y = 6; y <= 9; y++) {
    pathCells.push({ x: 9, y });
  }
  for (let x = 10; x <= 20; x++) {
    pathCells.push({ x, y: 9 });
  }
  for (let y = 8; y >= 0; y--) {
    pathCells.push({ x: 20, y });
  }

  useEffect(() => {
    const newProjectiles: Projectile[] = [];
    towers.forEach(tower => {
      if (tower.target) {
        const targetEnemy = enemies.find(enemy => enemy.id === tower.target);
        if (targetEnemy) {
          const now = Date.now();
          if (now - tower.lastAttackTime < 100) {
            const hitRadius = tower.type === 'splash' ? 1.5 :
              tower.type === 'basic' ? 0.8 :
                tower.type === 'sniper' ? 0.5 :
                  tower.type === 'slow' ? 1.0 : 0.7;
            newProjectiles.push({
              id: `${tower.id}-${now}`,
              sourcePosition: tower.position,
              targetPosition: targetEnemy.position,
              towerType: tower.type,
              progress: 0,
              hitRadius
            });
          }
        }
      }
    });
    if (newProjectiles.length > 0) {
      setProjectiles(prev => [...prev, ...newProjectiles]);
    }
  }, [towers, enemies]);

  useGameLoop((deltaTime: number) => {
    setProjectiles((prevProjectiles: Projectile[]): Projectile[] => {
      const newImpacts: { position: Position, towerType: TowerType, timestamp: number, hitRadius?: number }[] = [];
      const updatedProjectiles = prevProjectiles.map((proj: Projectile) => {
        const newProgress = Math.min(proj.progress + (deltaTime / 200), 1);
        const closeToTarget = newProgress > 0.9;
        if ((proj.progress < 1 && newProgress === 1) || (proj.progress < 0.9 && closeToTarget)) {
          newImpacts.push({
            position: proj.targetPosition,
            towerType: proj.towerType,
            timestamp: Date.now(),
            hitRadius: proj.hitRadius
          });
        }
        return {
          ...proj,
          progress: newProgress
        };
      });
      if (newImpacts.length > 0) {
        setImpacts(prevImpacts => [...prevImpacts, ...newImpacts]);
      }
      return updatedProjectiles.filter(p => p.progress < 1);
    });

    setImpacts((prevImpacts: { position: Position, towerType: TowerType, timestamp: number, hitRadius?: number }[]) =>
      prevImpacts.filter(impact => Date.now() - impact.timestamp < 600)
    );

    setSmoothedEnemies((prevSmoothed: SmoothedEnemy[]): SmoothedEnemy[] => {
      if (prevSmoothed.length === 0) return prevSmoothed;
      return prevSmoothed.map((smoothedEnemy: SmoothedEnemy) => {
        const realEnemy = enemies.find((e: Enemy) => e.id === smoothedEnemy.id);
        if (!realEnemy) return smoothedEnemy;
        const interpolationSpeed = 0.05;
        const dx = realEnemy.position.x - smoothedEnemy.visualPosition.x;
        const dy = realEnemy.position.y - smoothedEnemy.visualPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 0.01) {
          return {
            ...realEnemy,
            visualPosition: { ...realEnemy.position }
          };
        }
        return {
          ...realEnemy,
          visualPosition: {
            x: smoothedEnemy.visualPosition.x + dx * Math.min(interpolationSpeed * deltaTime / 16, 1),
            y: smoothedEnemy.visualPosition.y + dy * Math.min(interpolationSpeed * deltaTime / 16, 1)
          }
        };
      });
    });
  }, 60);

  const handleCellClick = (x: number, y: number) => {
    if (pathCells.some(cell => cell.x === x && cell.y === y)) {
      return;
    }
    onMapClick({ x, y });
  };

  const handleCellMouseEnter = (x: number, y: number) => {
    setHoveredCell({ x, y });
  };

  const handleCellMouseLeave = () => {
    setHoveredCell(null);
  };

  const getCellPosition = (position: Position): { top: number; left: number } => {
    const cellSize = 40;
    const padding = 10;
    return {
      top: position.y * (cellSize + 1) + padding + cellSize / 2,
      left: position.x * (cellSize + 1) + padding + cellSize / 2,
    };
  };

  const getProjectilePosition = (projectile: Projectile): { top: number; left: number } => {
    const sourcePos = getCellPosition(projectile.sourcePosition);
    const targetPos = getCellPosition(projectile.targetPosition);
    return {
      top: sourcePos.top + (targetPos.top - sourcePos.top) * projectile.progress,
      left: sourcePos.left + (targetPos.left - sourcePos.left) * projectile.progress
    };
  };

  const renderGrid = () => {
    const gridCells = [];
    for (let y = 0; y < gridSize.height; y++) {
      for (let x = 0; x < gridSize.width; x++) {
        const isPath = pathCells.some(cell => cell.x === x && cell.y === y);
        const towerConfigForHover = selectedTowerType ? towerConfigurations[selectedTowerType as TowerType] : null;
        gridCells.push(
          <Cell
            key={`${x}-${y}`}
            isPath={isPath}
            onClick={() => handleCellClick(x, y)}
            onMouseEnter={() => handleCellMouseEnter(x, y)}
            onMouseLeave={handleCellMouseLeave}
          >
            {selectedTowerType && towerConfigForHover && hoveredCell && hoveredCell.x === x && hoveredCell.y === y && !isPath && (
              <RangeIndicator
                range={towerConfigForHover.range}
                style={{
                  left: `20px`,
                  top: `20px`,
                }}
              />
            )}
          </Cell>
        );
      }
    }
    return gridCells;
  };

  const renderSelectedTowerRange = () => {
    if (selectedTower && mapRef.current) {
      const towerConfig = towerConfigurations[selectedTower.type as TowerType];
      if (!towerConfig) return null;
      const cellSize = 40;
      const mapPadding = 10;
      const cellWithGap = cellSize + 1;
      const left = selectedTower.position.x * cellWithGap + cellWithGap / 2 + mapPadding;
      const top = selectedTower.position.y * cellWithGap + cellWithGap / 2 + mapPadding;
      return (
        <RangeIndicator
          range={selectedTower.attributes.range}
          style={{
            left: `${left}px`,
            top: `${top}px`,
          }}
        />
      );
    }
    return null;
  };

  const renderHoveredTowerRange = () => {
    if (hoveredTowerId && mapRef.current) {
      const tower = towers.find(t => t.id === hoveredTowerId);
      if (!tower) return null;
      const towerConfig = towerConfigurations[tower.type as TowerType];
      if (!towerConfig) return null;
      const cellSize = 40;
      const mapPadding = 10;
      const cellWithGap = cellSize + 1;
      const left = tower.position.x * cellWithGap + cellWithGap / 2 + mapPadding;
      const top = tower.position.y * cellWithGap + cellWithGap / 2 + mapPadding;
      return (
        <RangeIndicator
          range={tower.attributes.range}
          style={{
            left: `${left}px`,
            top: `${top}px`,
            pointerEvents: 'none', // Ensure it doesn't interfere with mouse events on towers
          }}
        />
      );
    }
    return null;
  };

  // The component must return a JSX element or null.
  return (
    <MapContainer ref={mapRef}>
      <Grid width={gridSize.width} height={gridSize.height}>
        {renderGrid()}
      </Grid>
      {renderSelectedTowerRange()}
      {renderHoveredTowerRange()}
      {towers.map(tower => {
        const position = getCellPosition(tower.position);
        const currentAngle = towerAngles[tower.id] || 0;
        const towerStyle: React.CSSProperties = {
          position: 'absolute',
          top: position.top,
          left: position.left,
          transform: `translate(-50%, -50%) rotate(${currentAngle}deg)`,
          zIndex: 10,
        };
        return (
          <div
            key={tower.id}
            style={towerStyle}
            onMouseEnter={() => setHoveredTowerId(tower.id)}
            onMouseLeave={() => setHoveredTowerId(null)}
          >
            <TowerSprite
              type={tower.type}
              level={tower.level}
              size={36}
              isSelected={selectedTower?.id === tower.id}
              isHovered={hoveredTowerId === tower.id}
              onClick={() => onMapClick(tower.position)}
              onMouseEnter={() => setHoveredTowerId(tower.id)}
              onMouseLeave={() => setHoveredTowerId(null)}
            />
          </div>
        );
      })}
      {projectiles.map(projectile => {
        const position = getProjectilePosition(projectile);
        return (
          <ProjectileElement
            key={projectile.id}
            style={{ top: position.top, left: position.left }}
            towerType={projectile.towerType}
          />
        );
      })}
      {impacts.map((impact, index) => {
        const position = getCellPosition(impact.position);
        return (
          <ImpactEffect
            key={`impact-${impact.timestamp}-${index}`}
            style={{ top: position.top, left: position.left }}
            towerType={impact.towerType}
            hitRadius={impact.hitRadius}
          />
        );
      })}
      {smoothedEnemies.map((enemy: SmoothedEnemy) => {
        const position = getCellPosition(enemy.visualPosition || enemy.position);
        const healthPercent = (enemy.health / enemy.maxHealth) * 100;
        return (
          <EnemyElement
            key={enemy.id}
            style={{ top: position.top, left: position.left }}
            type={enemy.type}
            healthPercent={healthPercent}
          />
        );
      })}
      {/* Conditional rendering for range indicator based on selectedTowerType or selectedTower */}
      {selectedTowerType && !selectedTower && towerConfigurations[selectedTowerType as TowerType] && (
        <RangeIndicator
          key="range-preview-selected-type"
          style={{
            // This is just an example for a fixed preview, 
            // ideally, this should follow the mouse or be centered on the potential build cell.
            top: `50%`,
            left: '50%',
            opacity: 0.3,
            pointerEvents: 'none'
          }}
          range={towerConfigurations[selectedTowerType as TowerType].range}
        />
      )}
    </MapContainer>
  );
}; // Added closing curly brace for the component

export default GameMap;
