import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import useGameLoop from '../../hooks/useGameLoop';
import { Enemy, Position, Tower, TowerType } from '../../types';

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
  &:hover {
    box-shadow: inset 0 0 0 2px #4d9aff;
    cursor: pointer;
  }
`;

const TowerElement = styled.div<{ towerType: TowerType; level: number }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 10;
  border: 2px solid #777;
  
  ${props => {
    switch (props.towerType) {
      case 'basic':
        return `
          background-color: #4d9aff;
        `;
      case 'sniper':
        return `
          background-color: #e74c3c;
        `;
      case 'splash':
        return `
          background-color: #9b59b6;
        `;
      case 'slow':
        return `
          background-color: #3498db;
        `;
      case 'money':
        return `
          background-color: #f1c40f;
        `;
      default:
        return `
          background-color: #4d9aff;
        `;
    }
  }}
  
  &::after {
    content: "${props => props.level}";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-weight: bold;
    font-size: 14px;
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
    background-color: #333;
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
interface SmoothedEnemy extends Enemy {
  visualPosition: Position;
}

const GameMap: React.FC<GameMapProps> = ({
  towers,
  enemies,
  gridSize,
  selectedTowerType,
  selectedTower,
  onMapClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [smoothedEnemies, setSmoothedEnemies] = useState<SmoothedEnemy[]>([]);

  // console.log('GameMap received enemies prop:', JSON.stringify(enemies.map(e => ({ id: e.id, health: e.health, maxHealth: e.maxHealth }))));

  // Create smoothed versions of enemies with interpolated positions
  useEffect(() => {
    if (enemies.length > 0) {
      // Map actual enemies to smoothed enemies, preserving previous visual positions when possible
      setSmoothedEnemies(prevSmoothed => {
        return enemies.map(enemy => {
          // Try to find existing smoothed enemy
          const existing = prevSmoothed.find(e => e.id === enemy.id);

          if (existing) {
            // Keep the visual position from before to animate toward the new position
            return {
              ...enemy,
              visualPosition: { ...existing.visualPosition }
            };
          } else {
            // New enemy, start with actual position
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
  // Generate the path cells to match the server-side path
  const pathCells: Position[] = [];

  // Horizontal path at y=5 from x=0 to x=9
  for (let x = 0; x <= 9; x++) {
    pathCells.push({ x, y: 5 });
  }

  // Vertical path at x=9 going down from y=6 to y=9
  for (let y = 6; y <= 9; y++) {
    pathCells.push({ x: 9, y });
  }
  // Horizontal path at y=9 from x=10 to x=20
  for (let x = 10; x <= 20; x++) {
    pathCells.push({ x, y: 9 });
  }

  // Vertical path at x=20 going up from y=8 to y=0
  for (let y = 8; y >= 0; y--) {
    pathCells.push({ x: 20, y });
  }

  // Handle tower shooting logic
  useEffect(() => {
    const newProjectiles: Projectile[] = [];

    // Check each tower that has a target
    towers.forEach(tower => {
      if (tower.target) {
        // Find the target enemy
        const targetEnemy = enemies.find(enemy => enemy.id === tower.target);

        if (targetEnemy) {          // Create a new projectile if the tower just fired (within last 100ms)
          const now = Date.now();
          if (now - tower.lastAttackTime < 100) {
            // Calculate hit radius based on tower type - splash towers have larger radius
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
  }, [towers, enemies]);  // Effect for tower impacts - this will display splash effects
  const [impacts, setImpacts] = useState<{ position: Position, towerType: TowerType, timestamp: number, hitRadius?: number }[]>([]);
  // Update projectile positions and handle impacts using game loop
  useGameLoop((deltaTime) => {
    // Update projectile positions
    setProjectiles(prev => {
      const newImpacts: { position: Position, towerType: TowerType, timestamp: number, hitRadius?: number }[] = [];
      // Move each projectile forward
      const updatedProjectiles = prev.map(proj => {
        // Make projectiles faster - complete in 200ms instead of 250ms
        const newProgress = Math.min(proj.progress + (deltaTime / 200), 1);        // If projectile just reached its target or is close enough, create an impact effect
        // This creates the area of effect visual - projectiles can hit even if they don't land directly on an enemy
        const closeToTarget = newProgress > 0.9; // Allow hitting when close enough to target
        if ((proj.progress < 1 && newProgress === 1) || (proj.progress < 0.9 && closeToTarget)) {
          newImpacts.push({
            position: proj.targetPosition,
            towerType: proj.towerType,
            timestamp: Date.now(),
            hitRadius: proj.hitRadius // Pass the hit radius to the impact
          });
        }

        return {
          ...proj,
          progress: newProgress
        };
      });

      // Add any new impacts
      if (newImpacts.length > 0) {
        setImpacts(prevImpacts => [...prevImpacts, ...newImpacts]);
      }

      // Remove projectiles that have reached their target
      return updatedProjectiles.filter(p => p.progress < 1);
    });

    // Remove impacts after animation duration (600ms)
    setImpacts(prev => prev.filter(impact => Date.now() - impact.timestamp < 600));

    // Smoothly interpolate enemy positions
    setSmoothedEnemies(prevSmoothed => {
      if (prevSmoothed.length === 0) return prevSmoothed;

      return prevSmoothed.map(smoothedEnemy => {
        // Find the corresponding real enemy 
        const realEnemy = enemies.find(e => e.id === smoothedEnemy.id);

        // If real enemy doesn't exist anymore, keep this one for one more frame
        if (!realEnemy) return smoothedEnemy;        // Calculate how much to move towards the actual position
        // Use a smooth interpolation factor - smaller number = slower/smoother movement
        const interpolationSpeed = 0.05; // Further reduced from 0.08 for smoother movement
        const dx = realEnemy.position.x - smoothedEnemy.visualPosition.x;
        const dy = realEnemy.position.y - smoothedEnemy.visualPosition.y;

        // Calculate distance to determine if we need to snap to final position
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If we're very close to the target position, just snap to it to avoid tiny movements
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
    // Check if the cell is on the path - don't allow building there
    if (pathCells.some(cell => cell.x === x && cell.y === y)) {
      return;
    }

    onMapClick({ x, y });
  };

  const getCellPosition = (position: Position): { top: number; left: number } => {
    const cellSize = 40; // Same as in the CSS
    const padding = 10;

    return {
      top: position.y * (cellSize + 1) + padding + cellSize / 2,
      left: position.x * (cellSize + 1) + padding + cellSize / 2,
    };
  };

  // Calculate position of a projectile based on its progress
  const getProjectilePosition = (projectile: Projectile): { top: number; left: number } => {
    const sourcePos = getCellPosition(projectile.sourcePosition);
    const targetPos = getCellPosition(projectile.targetPosition);

    // Linear interpolation between source and target based on progress
    return {
      top: sourcePos.top + (targetPos.top - sourcePos.top) * projectile.progress,
      left: sourcePos.left + (targetPos.left - sourcePos.left) * projectile.progress
    };
  };

  return (
    <MapContainer ref={mapRef}>
      <Grid width={gridSize.width} height={gridSize.height}>
        {Array.from({ length: gridSize.height }).map((_, y) =>
          Array.from({ length: gridSize.width }).map((_, x) => {
            const isPath = pathCells.some(cell => cell.x === x && cell.y === y);
            return (
              <Cell
                key={`${x}-${y}`}
                isPath={isPath}
                onClick={() => handleCellClick(x, y)}
              />
            );
          })
        )}
      </Grid>      {/* Render towers */}
      {towers.map(tower => {
        const position = getCellPosition(tower.position);

        // Calculate rotation angle if tower has a target
        let rotationStyle = {};
        if (tower.target) {
          const targetEnemy = enemies.find(enemy => enemy.id === tower.target);
          if (targetEnemy) {
            const dx = targetEnemy.position.x - tower.position.x;
            const dy = targetEnemy.position.y - tower.position.y;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            rotationStyle = { transform: `translate(-50%, -50%) rotate(${angle}deg)` };
          }
        }

        return (
          <TowerElement
            key={tower.id}
            style={{
              top: position.top,
              left: position.left,
              ...rotationStyle
            }}
            towerType={tower.type}
            level={tower.level}
          />
        );
      })}{/* Render projectiles */}
      {projectiles.map(projectile => {
        const position = getProjectilePosition(projectile);
        return (
          <ProjectileElement
            key={projectile.id}
            style={{ top: position.top, left: position.left }}
            towerType={projectile.towerType}
          />
        );
      })}      {/* Render impact effects */}
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
      })}{/* Render enemies with smoothed positions */}
      {smoothedEnemies.map(enemy => {
        const position = getCellPosition(enemy.visualPosition || enemy.position);
        const healthPercent = (enemy.health / enemy.maxHealth) * 100;
        console.log(`GameMap rendering enemy ID: ${enemy.id}, Health: ${enemy.health}, MaxHealth: ${enemy.maxHealth}, HealthPercent: ${healthPercent}`);

        return (
          <EnemyElement
            key={enemy.id}
            style={{ top: position.top, left: position.left }}
            type={enemy.type}
            healthPercent={healthPercent}
          />
        );
      })}{/* Show range indicator for the tower type being placed or the selected tower */}
      {selectedTowerType ? (
        // When placing a new tower, show the cursor range
        <RangeIndicator
          key="range-preview"
          style={{
            top: `${(selectedTowerType === 'sniper' ? 150 : 100)}px`, // Approximate position
            left: '50%',
            opacity: 0.3,
            pointerEvents: 'none'
          }}
          range={
            selectedTowerType === 'basic' ? 3 :
              selectedTowerType === 'sniper' ? 5 :
                selectedTowerType === 'splash' ? 2.5 :
                  selectedTowerType === 'slow' ? 2.5 :
                    3 // Default
          }
        />
      ) : towers
        .filter(tower => tower.id === (towers.find(t =>
          t.position.x === (selectedTower?.position.x || -1) &&
          t.position.y === (selectedTower?.position.y || -1))?.id))
        .map(tower => {
          const position = getCellPosition(tower.position);
          return (
            <RangeIndicator
              key={`range-${tower.id}`}
              style={{ top: position.top, left: position.left, opacity: 0.3 }}
              range={tower.attributes.range}
            />
          );
        })}
    </MapContainer>
  );
};

export default GameMap;
