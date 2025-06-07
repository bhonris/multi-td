import React from 'react';
import { TowerType } from '../../types';

interface TowerSpriteProps {
  type: TowerType;
  level: number;
  size: number;
}

const TowerSprite: React.FC<TowerSpriteProps> = ({ type, level, size }) => {
  const getIconPath = () => {
    // Use require to import SVG files dynamically
    try {
      return require(`../../icons/${type}.svg`);
    } catch (error) {
      console.warn(`Could not load icon for tower type: ${type}`);
      return require('../../icons/basic.svg'); // fallback
    }
  };

  return (
    <div style={{ position: 'relative', width: size, height: size }}>      <img
        src={getIconPath()}
        alt={`${type} tower`}
        style={{
          width: size,
          height: size,
          transform: 'rotate(90deg)',
        }}
      />
      {/* Level indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          borderRadius: '50%',
          width: size * 0.3,
          height: size * 0.3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.2,
          fontWeight: 'bold',
          border: '1px solid #555',
        }}
      >
        {level}
      </div>
    </div>
  );};

export default TowerSprite;
