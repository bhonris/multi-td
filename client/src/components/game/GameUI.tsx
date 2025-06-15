import { towerConfigurations } from '@shared/config/towerConfig';
import type { Tower, TowerType } from "@shared/types";
import React from 'react';
import styled from 'styled-components';
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

const TowerOption = styled.div<{ selected: boolean }>`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid ${props => props.selected ? '#4d9aff' : '#555'};
  box-shadow: ${props => props.selected ? '0 0 10px #4d9aff' : 'none'};
  background-color: rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  img {
    width: 35px;
    height: 35px;
  }
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

const AdContainer = styled.div`
  width: 200px;
  height: 120px;
  border: 2px solid #444;
  border-radius: 8px;
  background: linear-gradient(135deg, #2c3e50, #34495e);
  margin: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(77, 154, 255, 0.3);
  }

  &::before {
    content: 'AD';
    position: absolute;
    top: 2px;
    right: 5px;
    font-size: 0.6rem;
    color: #888;
    background: #333;
    padding: 1px 4px;
    border-radius: 2px;
  }
`;

const AdTitle = styled.h4`
  margin: 0 0 5px 0;
  font-size: 0.9rem;
  color: #f39c12;
  font-weight: bold;
`;

const AdText = styled.p`
  margin: 0;
  font-size: 0.7rem;
  color: #ecf0f1;
  line-height: 1.2;
`;

const AdBanner = styled.div`
  background: linear-gradient(90deg, #e74c3c, #c0392b);
  color: white;
  padding: 5px 10px;
  font-size: 0.8rem;
  font-weight: bold;
  text-align: center;
  border-radius: 4px;
  margin: 10px 0;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
`;

const AdSection = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  border-left: 1px solid #333;
`;

// Fake ad data
const fakeAds = [
  {
    title: "Tower Insurance Co.",
    text: "Protect your towers from enemy lawsuits! 99% of towers recommend us!",
    clickText: "Get Quote Now!"
  },
  {
    title: "Enemy Speed Dating",
    text: "Tired of running alone? Meet other enemies in your area! Swipe right for chaos!",
    clickText: "Find Love Today!"
  },
  {
    title: "Base Health Supplements",
    text: "Doctors HATE this one trick! Increase your base health by 500% instantly!",
    clickText: "Order Now - $9.99"
  },
  {
    title: "Tower University",
    text: "Learn to shoot straight! Online courses in Advanced Projectile Physics!",
    clickText: "Enroll Today!"
  },
  {
    title: "Pixel Perfect Repairs",
    text: "Is your tower looking pixelated? We fix graphics glitches while you wait!",
    clickText: "Book Service"
  },
  {
    title: "Enemy Relocation Services",
    text: "Tired of the same old path? We help enemies find new routes to happiness!",
    clickText: "Get Moving!"
  },
  {
    title: "Splash Damage Lawyers",
    text: "Collateral damage got you down? We sue towers for excessive splash radius!",
    clickText: "Free Consultation"
  },
  {
    title: "Money Tower MLM",
    text: "Make money with money towers! Recruit 5 friends and become a Tower Boss!",
    clickText: "Join Pyramid!"
  },
  {
    title: "Slow Tower Therapy",
    text: "Is your slow tower having an existential crisis? We provide counseling!",
    clickText: "Book Session"
  },
  {
    title: "Sniper Tower Dating App",
    text: "Long distance relationships made easy! Connect with towers across the map!",
    clickText: "Download App"
  },
  {
    title: "GameStop 2: Electric Boogaloo",
    text: "We buy used projectiles! Trade in your old ammo for store credit!",
    clickText: "To The Moon! 🚀"
  },
  {
    title: "Enemy Life Insurance",
    text: "What happens to your family when you get splashed? We've got you covered!",
    clickText: "Protect Family"
  },
  {
    title: "Tower Whisperer Services",
    text: "Is your tower not performing? I speak fluent Tower and can translate!",
    clickText: "Book Consultation"
  },
  {
    title: "Upgrade Addiction Anonymous",
    text: "Can't stop upgrading towers? You're not alone. Meeting Tuesdays at 7PM.",
    clickText: "Get Help Now"
  },
  {
    title: "Enemy Fashion Week",
    text: "Tired of the same old sprite? Upgrade your look with premium skins!",
    clickText: "Shop Now"
  },
  {
    title: "Tower Tinder Premium",
    text: "Swipe right on compatible tower types! Find your perfect defensive match!",
    clickText: "Upgrade Dating"
  },
  {
    title: "Procrastination Station",
    text: "Why defend your base now when you can do it later? Join millions of procrastinators!",
    clickText: "Maybe Tomorrow"
  },
  {
    title: "Enemy Uber",
    text: "Skip the walking! Fast transport directly to your base. 5-star service guaranteed!",
    clickText: "Request Ride"
  },
  {
    title: "Tower Chef Academy",
    text: "Learn to serve up destruction! Master classes in projectile preparation!",
    clickText: "Enroll Now"
  },
  {
    title: "Base Feng Shui",
    text: "Is your base's energy flow blocking success? Realign your defensive chakras today!",
    clickText: "Find Balance"
  }
];

const getRandomAd = () => {
  return fakeAds[Math.floor(Math.random() * fakeAds.length)];
};

const FakeAd: React.FC = () => {
  const [currentAd, setCurrentAd] = React.useState(getRandomAd());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd(getRandomAd());
    }, 15000); // Change ad every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const handleAdClick = () => {
    // Rotate to a new ad immediately when clicked
    setCurrentAd(getRandomAd());
  };

  return (
    <AdContainer onClick={handleAdClick} title="Click for new ad!">
      <AdTitle>{currentAd.title}</AdTitle>
      <AdText>{currentAd.text}</AdText>
      <AdBanner>{currentAd.clickText}</AdBanner>
    </AdContainer>
  );
};

// Helper function to construct icon paths
// Vite handles dynamic imports with variable parts if they follow a certain pattern.
// We construct a map of all possible icon paths.
const iconModules = import.meta.glob('../../icons/*.svg');

const getTowerIconPath = async (type: TowerType): Promise<string> => {
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
    // If even fallback fails (e.g., basic.svg is missing), return a placeholder or handle error
    // For now, let's assume basic.svg will always be there or throw error if not.
    const fallbackModule = await iconModules[fallbackPath](); // try again
    return (fallbackModule as { default: string }).default;
  }
};

// New component to handle asynchronous icon loading
interface TowerIconProps {
  type: TowerType;
  alt: string;
  style?: React.CSSProperties;
}

const TowerIcon: React.FC<TowerIconProps> = ({ type, alt, style }) => {
  const [iconSrc, setIconSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    getTowerIconPath(type).then(src => {
      if (isMounted) {
        setIconSrc(src);
      }
    }).catch(err => {
      console.error("Failed to set icon source:", err);
      // Optionally set a default/error icon source here
    });
    return () => { isMounted = false; };
  }, [type]);

  if (!iconSrc) {
    // Optional: return a placeholder or null while loading
    return <div style={{ width: 35, height: 35, backgroundColor: '#333', borderRadius: '4px' }} title="Loading icon..."></div>;
  }

  return <img src={iconSrc} alt={alt} style={style} />;
};

// Reinstated getTowerInfo for UI-specific details like name and description
const getTowerInfo = (type: TowerType) => {
  // Costs will be overridden by towerConfigurations later
  switch (type) {
    case 'basic':
      return {
        name: 'Basic Tower',
        description: 'Balanced tower with medium range and damage.',
        stats: { Damage: 20, Range: 3, Cooldown: '1s' },
        cost: towerConfigurations.basic.cost, // Get cost from shared config
      };
    case 'sniper':
      return {
        name: 'Sniper Tower',
        description: 'Long range tower with high damage but slow firing rate.',
        stats: { Damage: 50, Range: 6, Cooldown: '2s' },
        cost: towerConfigurations.sniper.cost,
      };
    case 'splash':
      return {
        name: 'Splash Tower',
        description: 'Deals area damage to multiple enemies.',
        stats: { Damage: 15, Range: 2, Cooldown: '1.5s', 'Splash Radius': 1 },
        cost: towerConfigurations.splash.cost,
      };
    case 'slow':
      return {
        name: 'Slow Tower',
        description: 'Slows down enemies in its range.',
        stats: { Damage: 5, Range: 3, Cooldown: '1s', 'Slow Effect': '30%' },
        cost: towerConfigurations.slow.cost,
      };
    case 'money':
      return {
        name: 'Money Tower',
        description: 'Generates bonus money when killing enemies.',
        stats: { Damage: 10, Range: 4, Cooldown: '1s', 'Money Bonus': '20%' },
        cost: towerConfigurations.money.cost,
      };
    case 'rapidFire': // Added rapidFire
      return {
        name: 'Rapid Fire Tower',
        description: 'Attacks very quickly with moderate damage.',
        stats: { Damage: 10, Range: 2.5, Cooldown: '0.3s' }, // Example stats
        cost: towerConfigurations.rapidFire?.cost || 175, // Get cost or fallback
      };
    case 'support': // Added support
      return {
        name: 'Support Tower',
        description: 'Boosts nearby towers.',
        stats: { Range: 3, 'Support Bonus': '10%', 'Support Radius': 2 }, // Example stats
        cost: towerConfigurations.support?.cost || 225, // Get cost or fallback
      };
    default: {
      const exhaustiveCheck: never = type;
      console.warn(`Unknown tower type in getTowerInfo: ${exhaustiveCheck}`);
      return {
        name: 'Unknown Tower',
        cost: 0,
        description: '',
        stats: {}
      };
    }
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

  // Reinstated towerTypes for UI iteration, sourcing cost from towerConfigurations
  const towerTypesForUI: { type: TowerType; name: string; cost: number }[] = [
    { type: "basic", name: "Basic", cost: towerConfigurations.basic.cost },
    { type: "sniper", name: "Sniper", cost: towerConfigurations.sniper.cost },
    { type: "splash", name: "Splash", cost: towerConfigurations.splash.cost },
    { type: "slow", name: "Slow", cost: towerConfigurations.slow.cost },
    { type: "money", name: "Money", cost: towerConfigurations.money.cost },
    { type: "rapidFire", name: "Rapid Fire", cost: towerConfigurations.rapidFire?.cost || 0 }, // Added, ensure rapidFire exists in config
    { type: "support", name: "Support", cost: towerConfigurations.support?.cost || 0 }, // Added, ensure support exists in config
  ];

  const renderTowerInfo = () => {
    if (selectedTower) {
      const uiInfo = getTowerInfo(selectedTower.type);
      const upgradeCost = selectedTower.attributes.upgradeCost;
      const MAX_TOWER_LEVEL = 3; // Example, should ideally come from shared config (e.g. gameSettingsConfig.maxTowerLevel)
      const isMaxLevel = selectedTower.level >= MAX_TOWER_LEVEL;

      return (
        <TowerInfo>
          <TowerTitle>{uiInfo.name} (Level {selectedTower.level})</TowerTitle>
          <p>{uiInfo.description}</p>
          <TowerStats>
            {Object.entries(selectedTower.attributes).map(([key, value]) => {
              if (key !== 'cost' && key !== 'upgradeCost') {
                const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return (
                  <React.Fragment key={key}>
                    <StatName>{displayName}</StatName>
                    <div>{String(value)}</div>
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
      const uiInfo = getTowerInfo(selectedTowerType);
      const canAfford = money >= uiInfo.cost;

      return (
        <TowerInfo>
          <TowerTitle>{uiInfo.name}</TowerTitle>
          <p>{uiInfo.description}</p>
          <TowerStats>
            {Object.entries(uiInfo.stats).map(([key, value]) => (
              <React.Fragment key={key}>
                <StatName>{key}</StatName>
                <div>{String(value)}</div>
              </React.Fragment>
            ))}
          </TowerStats>
          <div>Cost: ${uiInfo.cost}</div>
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
        {towerTypesForUI.map(towerData => {
          // const towerInfo = getTowerInfo(towerData.type); // Not needed if towerData has cost
          const canAfford = money >= towerData.cost;

          return (
            <TowerOption
              key={towerData.type}
              selected={selectedTowerType === towerData.type}
              onClick={() => handleTowerClick(towerData.type)}
              style={{ opacity: canAfford ? 1 : 0.5 }}
              title={`${towerData.name} - $${towerData.cost}`}
            >
              <TowerIcon
                type={towerData.type}
                alt={`${towerData.name} tower`}
              />
            </TowerOption>
          );
        })}
      </TowerSelection>

      {renderTowerInfo()}

      <StartWaveButton
        variant="success"
        onClick={onStartWave}
      >
        Start Wave
      </StartWaveButton>      <AdSection>
        <FakeAd />
        <FakeAd />
      </AdSection>
    </UIContainer>
  );
};

export default GameUI;
