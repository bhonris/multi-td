import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Button from '../components/common/Button';
import { createGame } from '../features/game/gameSlice';
import { AppDispatch, RootState } from '../store';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  flex: 1;
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #4d9aff;
`;

const Subtitle = styled.h2`
  font-size: 1.5rem;
  font-weight: normal;
  margin-bottom: 2rem;
  color: #f0f0f0;
  max-width: 700px;
`;

const GameOptionsContainer = styled.div`
  background-color: #1e1e1e;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #555;
  background-color: #2e2e2e;
  color: white;
  font-size: 16px;
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
`;

const FeaturesSection = styled.div`
  margin-top: 4rem;
`;

const FeaturesTitle = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
`;

const FeaturesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  width: 100%;
`;

const FeatureItem = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;

const FeatureTitle = styled.h3`
  color: #4d9aff;
  margin-bottom: 1rem;
`;

const HomePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useSelector((state: RootState) => state.user);

  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const handleCreateGame = async () => {
    if (isAuthenticated && currentUser) {
      try {
        const result = await dispatch(createGame({
          hostId: currentUser.id,
          maxPlayers: 16,
          difficulty
        })).unwrap();

        navigate(`/lobby/${result.id}`);
      } catch (error) {
        console.error('Failed to create game:', error);
      }
    } else {
      navigate('/username-entry');
    }
  };

  const handleJoinGame = () => {
    // In a real app, we would have a modal or input to enter a game code
    // For now, we'll navigate to a placeholder route
    navigate('/join-game');
  };

  return (
    <HomeContainer>      <HeroSection>
      <Title>Multiplayer Tower Defense</Title>
      <Subtitle>
        Work together with friends to build towers, defend against waves of enemies,
        and compete for the highest score in this real-time multiplayer tower defense game!
      </Subtitle>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {isAuthenticated ? (
          <>
            <Button size="large" onClick={handleCreateGame}>
              Create New Game
            </Button>
            <Button size="large" variant="secondary" onClick={handleJoinGame}>
              Join Existing Game
            </Button>
          </>
        ) : (
          <Button size="large" onClick={() => navigate('/username-entry')}>
            Enter Username to Play
          </Button>
        )}
      </div>
    </HeroSection>

      {isAuthenticated && (
        <GameOptionsContainer>
          <h2>Create a New Game</h2>

          <FormGroup>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'normal' | 'hard')}
            >
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </Select>
          </FormGroup>

          {/* <FormGroup>
            <Label htmlFor="maxPlayers">Max Players</Label>
            <Select
              id="maxPlayers"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
            >
              <option value="2">2 Players</option>
              <option value="3">3 Players</option>
              <option value="4">4 Players</option>
            </Select>
          </FormGroup> */}

          <ButtonsContainer>
            <Button size="medium" onClick={handleCreateGame}>
              Create Game
            </Button>

            <Button
              size="medium"
              variant="secondary"
              onClick={handleJoinGame}
            >
              Join Existing Game
            </Button>
          </ButtonsContainer>
        </GameOptionsContainer>
      )}

      <FeaturesSection>
        <FeaturesTitle>Game Features</FeaturesTitle>

        <FeaturesList>
          <FeatureItem>
            <FeatureTitle>Multiplayer Cooperation</FeatureTitle>
            <p>
              Team up with friends to defend against increasingly difficult waves of enemies.
              Coordinate your tower placements and strategies to maximize your defense.
            </p>
          </FeatureItem>

          <FeatureItem>
            <FeatureTitle>Diverse Towers</FeatureTitle>
            <p>
              Choose from multiple tower types with unique abilities and attributes.
              Upgrade your towers to increase their power and unlock special abilities.
            </p>
          </FeatureItem>

          <FeatureItem>
            <FeatureTitle>Strategic Gameplay</FeatureTitle>
            <p>
              Plan your defenses carefully! Different enemy types require different strategies,
              and bosses will test the strength of your fortifications.
            </p>
          </FeatureItem>

          <FeatureItem>
            <FeatureTitle>Challenging Bosses</FeatureTitle>
            <p>
              Every few waves, powerful boss enemies will appear with special abilities.
              Work together to defeat them before they destroy your base!
            </p>
          </FeatureItem>
        </FeaturesList>
      </FeaturesSection>
    </HomeContainer>
  );
};

export default HomePage;
