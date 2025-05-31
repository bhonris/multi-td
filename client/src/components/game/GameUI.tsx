import React from 'react';
import styled from 'styled-components';
import { Tower, TowerType } from '../../types';
import Button from '../common/Button';

interface GameUIProps {
  baseHealth: number;
  money: number;
  wave: number;
  selectedTowerType: TowerType | null;
  selectedTower: Tower | null;
  onTowerSelect: (type: TowerType) => void;
  onUpgradeTower: (towerId: string) => void;
  onStartWave: () => void;
}

const UIContainer = styled.div`
  display: flex;
  background-color: #1e1e1e;
  padding: 10px;
  border-top: 2px solid #333;
`;

const GameStats = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-right: auto;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #aaa;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
`;

const HealthValue = styled(StatValue) <{ health: number }>`
  color: ${props => {
    if (props.health > 60) return '#2ecc71';
    if (props.health > 30) return '#f39c12';
    return '#e74c3c';
  }};
`;

const TowerSelection = styled.div`
  display: flex;
  gap: 10px;
  padding: 0 20px;
  align-items: center;
`;

const TowerOption = styled.div<{ type: TowerType; selected: boolean }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid ${props => props.selected ? '#4d9aff' : '#555'};
  box-shadow: ${props => props.selected ? '0 0 10px #4d9aff' : 'none'};
  
  ${props => {
    switch (props.type) {
      case 'basic':
        return `background-color: #4d9aff;`;
      case 'sniper':
        return `background-color: #e74c3c;`;
      case 'splash':
        return `background-color: #9b59b6;`;
      case 'slow':
        return `background-color: #3498db;`;
      case 'money':
        return `background-color: #f1c40f;`;
      default:
        return `background-color: #4d9aff;`;
    }
  }}
`;

const TowerInfo = styled.div`
  padding: 0 20px;
  border-left: 1px solid #333;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 250px;
`;

const TowerTitle = styled.h3`
  margin: 0;
  color: #4d9aff;
`;

const TowerStats = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 5px;
  font-size: 0.9rem;
`;

const StatName = styled.div`
  color: #aaa;
`;

const StartWaveButton = styled(Button)`
  margin-left: 20px;
`;

const getTowerInfo = (type: TowerType) => {
  switch (type) {
    case 'basic':
      return {
        name: 'Basic Tower',
        cost: 100,
        description: 'Balanced tower with medium range and damage.',
        stats: {
          Damage: 20,
          Range: 3,
          Cooldown: '1s',
        }
      };
    case 'sniper':
      return {
        name: 'Sniper Tower',
        cost: 200,
        description: 'Long range tower with high damage but slow firing rate.',
        stats: {
          Damage: 50,
          Range: 6,
          Cooldown: '2s',
        }
      };
    case 'splash':
      return {
        name: 'Splash Tower',
        cost: 150,
        description: 'Deals area damage to multiple enemies.',
        stats: {
          Damage: 15,
          Range: 2,
          Cooldown: '1.5s',
          'Splash Radius': 1,
        }
      };
    case 'slow':
      return {
        name: 'Slow Tower',
        cost: 150,
        description: 'Slows down enemies in its range.',
        stats: {
          Damage: 5,
          Range: 3,
          Cooldown: '1s',
          'Slow Effect': '30%',
        }
      };
    case 'money':
      return {
        name: 'Money Tower',
        cost: 200,
        description: 'Generates bonus money when killing enemies.',
        stats: {
          Damage: 10,
          Range: 4,
          Cooldown: '1s',
          'Money Bonus': '20%',
        }
      };
    default:
      return {
        name: 'Unknown Tower',
        cost: 0,
        description: '',
        stats: {}
      };
  }
};

const GameUI: React.FC<GameUIProps> = ({
  baseHealth,
  money,
  wave,
  selectedTowerType,
  selectedTower,
  onTowerSelect,
  onUpgradeTower,
  onStartWave
}) => {
  const handleTowerClick = (type: TowerType) => {
    onTowerSelect(type);
  };

  const towerTypes: TowerType[] = ['basic', 'sniper', 'splash', 'slow', 'money'];

  const renderTowerInfo = () => {
    if (selectedTower) {
      const towerInfo = getTowerInfo(selectedTower.type);
      const upgradeCost = selectedTower.attributes.upgradeCost;
      const isMaxLevel = selectedTower.level >= 3;

      return (
        <TowerInfo>
          <TowerTitle>{towerInfo.name} (Level {selectedTower.level})</TowerTitle>
          <p>{towerInfo.description}</p>
          <TowerStats>
            {Object.entries(selectedTower.attributes).map(([key, value]) => {
              if (key !== 'cost' && key !== 'upgradeCost') {
                return (
                  <React.Fragment key={key}>
                    <StatName>{key.charAt(0).toUpperCase() + key.slice(1)}</StatName>
                    <div>{value}</div>
                  </React.Fragment>
                );
              }
              return null;
            })}
          </TowerStats>
          {!isMaxLevel ? (
            <Button
              onClick={() => onUpgradeTower(selectedTower.id)}
              disabled={money < upgradeCost}
            >
              Upgrade (${upgradeCost})
            </Button>
          ) : (
            <div>Max Level Reached</div>
          )}
        </TowerInfo>
      );
    }

    if (selectedTowerType) {
      const towerInfo = getTowerInfo(selectedTowerType);
      const canAfford = money >= towerInfo.cost;

      return (
        <TowerInfo>
          <TowerTitle>{towerInfo.name}</TowerTitle>
          <p>{towerInfo.description}</p>
          <TowerStats>
            {Object.entries(towerInfo.stats).map(([key, value]) => (
              <React.Fragment key={key}>
                <StatName>{key}</StatName>
                <div>{value}</div>
              </React.Fragment>
            ))}
          </TowerStats>
          <div>Cost: ${towerInfo.cost}</div>
          {!canAfford && <div style={{ color: '#e74c3c' }}>Not enough money</div>}
        </TowerInfo>
      );
    }

    return (
      <TowerInfo>
        <TowerTitle>Tower Defense</TowerTitle>
        <p>Select a tower to build or click on an existing tower for more information.</p>
      </TowerInfo>
    );
  };

  return (
    <UIContainer>
      <GameStats>
        <StatItem>
          <StatLabel>Health</StatLabel>
          <HealthValue health={baseHealth}>{baseHealth}</HealthValue>
        </StatItem>

        <StatItem>
          <StatLabel>Money</StatLabel>
          <StatValue>${money}</StatValue>
        </StatItem>

        <StatItem>
          <StatLabel>Wave</StatLabel>
          <StatValue>{wave}</StatValue>
        </StatItem>
      </GameStats>

      <TowerSelection>
        {towerTypes.map(type => {
          const towerInfo = getTowerInfo(type);
          const canAfford = money >= towerInfo.cost;

          return (
            <TowerOption
              key={type}
              type={type}
              selected={selectedTowerType === type}
              onClick={() => handleTowerClick(type)}
              style={{ opacity: canAfford ? 1 : 0.5 }}
              title={`${towerInfo.name} - $${towerInfo.cost}`}
            />
          );
        })}
      </TowerSelection>

      {renderTowerInfo()}

      <StartWaveButton
        variant="success"
        onClick={onStartWave}
      >
        Start Wave
      </StartWaveButton>
    </UIContainer>
  );
};

export default GameUI;
