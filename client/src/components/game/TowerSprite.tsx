import React from 'react';
import { TowerType } from '../../types';

interface TowerSpriteProps {
  type: TowerType;
  level: number;
  size: number;
}

const TowerSprite: React.FC<TowerSpriteProps> = ({ type, level, size }) => {
  // Different tower designs based on type and level
  const renderTower = () => {
    const baseSize = size * 0.8;
    const strokeWidth = size * 0.1;

    switch (type) {
      case 'basic':
        return (
          <>
            {/* Base circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={baseSize / 2}
              fill="#4d9aff"
              stroke="#2c3e50"
              strokeWidth={strokeWidth}
            />
            {/* Cannon */}
            <rect
              x={(size - baseSize * 0.3) / 2}
              y={(size - baseSize * 0.8) / 2}
              width={baseSize * 0.3}
              height={baseSize * 0.8}
              fill="#2c3e50"
              rx={2}
            />
            {/* Level indicator */}
            <text
              x={size / 2}
              y={size / 2 + size * 0.1}
              textAnchor="middle"
              fill="white"
              fontSize={size * 0.3}
              fontWeight="bold"
            >
              {level}
            </text>
          </>
        );

      case 'sniper':
        return (
          <>
            {/* Base diamond */}
            <polygon
              points={`${size / 2},${size * 0.1} ${size * 0.9},${size / 2} ${size / 2},${size * 0.9} ${size * 0.1},${size / 2}`}
              fill="#e74c3c"
              stroke="#2c3e50"
              strokeWidth={strokeWidth}
            />
            {/* Crosshairs */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={baseSize * 0.2}
              fill="none"
              stroke="#2c3e50"
              strokeWidth={strokeWidth / 2}
            />
            <line
              x1={size * 0.35}
              y1={size / 2}
              x2={size * 0.65}
              y2={size / 2}
              stroke="#2c3e50"
              strokeWidth={strokeWidth / 2}
            />
            <line
              x1={size / 2}
              y1={size * 0.35}
              x2={size / 2}
              y2={size * 0.65}
              stroke="#2c3e50"
              strokeWidth={strokeWidth / 2}
            />
            {/* Level indicator */}
            <text
              x={size / 2}
              y={size / 2 + size * 0.15}
              textAnchor="middle"
              fill="white"
              fontSize={size * 0.3}
              fontWeight="bold"
            >
              {level}
            </text>
          </>
        );

      case 'splash':
        return (
          <>
            {/* Base hexagon */}
            <polygon
              points={`
                ${size / 2},${size * 0.1}
                ${size * 0.85},${size * 0.3}
                ${size * 0.85},${size * 0.7}
                ${size / 2},${size * 0.9}
                ${size * 0.15},${size * 0.7}
                ${size * 0.15},${size * 0.3}
              `}
              fill="#9b59b6"
              stroke="#2c3e50"
              strokeWidth={strokeWidth}
            />
            {/* Splash pattern */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={baseSize * 0.2}
              fill="#8e44ad"
            />
            <circle
              cx={size / 2 - baseSize * 0.15}
              cy={size / 2 - baseSize * 0.15}
              r={baseSize * 0.1}
              fill="#8e44ad"
            />
            <circle
              cx={size / 2 + baseSize * 0.15}
              cy={size / 2 - baseSize * 0.15}
              r={baseSize * 0.1}
              fill="#8e44ad"
            />
            <circle
              cx={size / 2 - baseSize * 0.15}
              cy={size / 2 + baseSize * 0.15}
              r={baseSize * 0.1}
              fill="#8e44ad"
            />
            <circle
              cx={size / 2 + baseSize * 0.15}
              cy={size / 2 + baseSize * 0.15}
              r={baseSize * 0.1}
              fill="#8e44ad"
            />
            {/* Level indicator */}
            <text
              x={size / 2}
              y={size / 2 + size * 0.1}
              textAnchor="middle"
              fill="white"
              fontSize={size * 0.3}
              fontWeight="bold"
            >
              {level}
            </text>
          </>
        );

      case 'slow':
        return (
          <>
            {/* Base octagon */}
            <polygon
              points={`
                ${size * 0.3},${size * 0.1}
                ${size * 0.7},${size * 0.1}
                ${size * 0.9},${size * 0.3}
                ${size * 0.9},${size * 0.7}
                ${size * 0.7},${size * 0.9}
                ${size * 0.3},${size * 0.9}
                ${size * 0.1},${size * 0.7}
                ${size * 0.1},${size * 0.3}
              `}
              fill="#3498db"
              stroke="#2c3e50"
              strokeWidth={strokeWidth}
            />
            {/* Slow symbol */}
            <path
              d={`M${size * 0.3},${size * 0.3} L${size * 0.7},${size * 0.7} M${size * 0.3},${size * 0.7} L${size * 0.7},${size * 0.3}`}
              stroke="#2c3e50"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={baseSize * 0.15}
              fill="#2980b9"
            />
            {/* Level indicator */}
            <text
              x={size / 2}
              y={size / 2 + size * 0.1}
              textAnchor="middle"
              fill="white"
              fontSize={size * 0.3}
              fontWeight="bold"
            >
              {level}
            </text>
          </>
        );

      case 'money':
        return (
          <>
            {/* Base square */}
            <rect
              x={size * 0.1}
              y={size * 0.1}
              width={size * 0.8}
              height={size * 0.8}
              fill="#f1c40f"
              stroke="#2c3e50"
              strokeWidth={strokeWidth}
            />
            {/* Dollar sign */}
            <text
              x={size / 2}
              y={size / 2 + size * 0.15}
              textAnchor="middle"
              fill="#2c3e50"
              fontSize={size * 0.5}
              fontWeight="bold"
            >
              $
            </text>
            {/* Level indicator */}
            <circle
              cx={size * 0.75}
              cy={size * 0.25}
              r={size * 0.15}
              fill="#e67e22"
              stroke="#2c3e50"
              strokeWidth={strokeWidth / 2}
            />
            <text
              x={size * 0.75}
              y={size * 0.25 + size * 0.05}
              textAnchor="middle"
              fill="white"
              fontSize={size * 0.2}
              fontWeight="bold"
            >
              {level}
            </text>
          </>
        );

      default:
        return (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={baseSize / 2}
            fill="#95a5a6"
            stroke="#2c3e50"
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {renderTower()}
    </svg>
  );
};

export default TowerSprite;
