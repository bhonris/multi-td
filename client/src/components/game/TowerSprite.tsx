import type { TowerType } from '@shared/types';
import React from 'react';
import { useTowerUpgradeIndicator } from '../../hooks/useTowerUpgradePreview';

interface TowerSpriteProps {
  type: TowerType;
  level: number;
  size: number;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// Helper function to construct icon paths using Vite's import.meta.glob
const iconModules = import.meta.glob('../../icons/*.svg');

const getIconPath = async (type: TowerType): Promise<string> => {
  const path = `../../icons/${type}.svg`;
  const fallbackPath = '../../icons/basic.svg';
  try {
    if (iconModules[path]) {
      const module = await iconModules[path]();
      return (module as { default: string }).default;
    }
    console.warn(`Could not load icon for tower type: ${type}, attempting fallback.`);
    const fallbackModule = await iconModules[fallbackPath]();
    return (fallbackModule as { default: string }).default;
  } catch (error) {
    console.error(`Error loading icon for tower type: ${type}`, error);
    // Attempt to load fallback again, or handle error appropriately
    try {
      const fallbackModule = await iconModules[fallbackPath]();
      return (fallbackModule as { default: string }).default;
    } catch (fallbackError) {
      console.error('Error loading fallback icon:', fallbackError);
      return ''; // Return empty string or a placeholder path if fallback also fails
    }
  }
};

const TowerSprite: React.FC<TowerSpriteProps> = ({
  type,
  level,
  size,
  isSelected = false,
  isHovered = false,
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  const [iconSrc, setIconSrc] = React.useState<string | null>(null);
  const upgradeIndicator = useTowerUpgradeIndicator(type, level);

  React.useEffect(() => {
    let isMounted = true;
    getIconPath(type).then(src => {
      if (isMounted) {
        setIconSrc(src);
      }
    }).catch(err => {
      console.error(`Failed to set icon source for ${type}:`, err);
      // Optionally set a default/error icon source here if needed
      if (isMounted) {
        setIconSrc(''); // Set to empty or a placeholder if error occurs
      }
    });
    return () => { isMounted = false; };
  }, [type]);

  const getSelectionStyles = () => {
    if (isSelected) {
      return {
        boxShadow: '0 0 8px 2px #4CAF50',
        border: '2px solid #4CAF50',
      };
    }
    if (isHovered) {
      return {
        boxShadow: '0 0 6px 1px #FFC107',
        border: '2px solid #FFC107',
      };
    }
    return {};
  };

  const getUpgradeGlow = () => {
    switch (upgradeIndicator) {
      case 'available':
        return { filter: 'drop-shadow(0 0 4px #4CAF50)' };
      case 'expensive':
        return { filter: 'drop-shadow(0 0 4px #FFC107)' };
      case 'maxed':
        return { filter: 'drop-shadow(0 0 4px #9C27B0)' };
      default:
        return {};
    }
  };

  const getLevelIndicatorColor = () => {
    if (level >= 5) return '#9C27B0'; // Purple for high levels
    if (level >= 3) return '#FF9800'; // Orange for mid levels
    if (level >= 2) return '#4CAF50'; // Green for upgraded
    return '#757575'; // Gray for level 1
  };

  const renderLevelStars = () => {
    const maxStars = Math.min(level, 5);
    const stars = [];

    for (let i = 0; i < maxStars; i++) {
      stars.push(
        <span
          key={i}
          style={{
            color: '#FFD700',
            fontSize: size * 0.08,
            textShadow: '0 0 2px rgba(0,0,0,0.8)'
          }}
        >
          ★
        </span>
      );
    }

    return stars;
  };

  if (!iconSrc) {
    // Optional: return a placeholder or null while loading
    return (
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: '#333',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClick ? 'pointer' : 'default',
          ...getSelectionStyles(),
        }}
        title={`Loading ${type} icon...`}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        L
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: '8px',
        ...getSelectionStyles(),
        ...getUpgradeGlow(),
        transition: 'all 0.2s ease-in-out',
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <img
        src={iconSrc}
        alt={`${type} tower`}
        style={{
          width: size,
          height: size,
          transform: 'rotate(90deg)',
          borderRadius: '8px',
        }}
      />

      {/* Enhanced level indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          backgroundColor: getLevelIndicatorColor(),
          color: 'white',
          borderRadius: '50%',
          width: size * 0.35,
          height: size * 0.35,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.18,
          fontWeight: 'bold',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {level}
      </div>

      {/* Star indicators for levels */}
      {level > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            display: 'flex',
            flexWrap: 'wrap',
            width: size * 0.4,
          }}
        >
          {renderLevelStars()}
        </div>
      )}

      {/* Upgrade availability indicator */}
      {upgradeIndicator === 'available' && (
        <div
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: size * 0.2,
            height: size * 0.2,
            backgroundColor: '#4CAF50',
            borderRadius: '50%',
            animation: 'pulse 2s infinite',
            boxShadow: '0 0 6px #4CAF50',
          }}
        />
      )}

      {upgradeIndicator === 'maxed' && (
        <div
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            fontSize: size * 0.15,
            color: '#9C27B0',
            textShadow: '0 0 4px rgba(156, 39, 176, 0.8)',
            fontWeight: 'bold',
          }}
        >
          MAX
        </div>
      )}
    </div>
  );
};

export default TowerSprite;
