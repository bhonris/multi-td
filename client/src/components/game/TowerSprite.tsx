import React from 'react';
import { TowerType } from '../../types';

interface TowerSpriteProps {
  type: TowerType;
  level: number;
  size: number;
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

const TowerSprite: React.FC<TowerSpriteProps> = ({ type, level, size }) => {
  const [iconSrc, setIconSrc] = React.useState<string | null>(null);

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
          justifyContent: 'center'
        }}
        title={`Loading ${type} icon...`}
      >
        L
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: size, height: size }}>      <img
      src={iconSrc} // Use state variable for src
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
  );
};

export default TowerSprite;
