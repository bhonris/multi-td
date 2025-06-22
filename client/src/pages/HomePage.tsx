import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Button from '../components/common/Button';
import { createGame } from '../features/game/gameSlice';
import { setUser } from '../features/user/userSlice';
import type { AppDispatch, RootState } from '../store';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  flex: 1;
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

const ErrorMessage = styled.p`
  color: red;
  margin-top: 1rem;
  text-align: center;
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

const Input = styled.input`
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

const HomePage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { loading, error } = useSelector((state: RootState) => state.game);
  const [username, setUsername] = useState(currentUser?.username || '');
  const [isAttemptingCreate, setAttemptingCreate] = useState(false);

  useEffect(() => {
    if (isAttemptingCreate && currentUser) {
      const createAndNavigate = async () => {
        const resultAction = await dispatch(
          createGame({
            hostId: currentUser.id,
            maxPlayers: 4,
            difficulty: 'normal',
          })
        );
        if (createGame.fulfilled.match(resultAction)) {
          const { id: gameId } = resultAction.payload;
          navigate(`/lobby/${gameId}`);
        }
        setAttemptingCreate(false); // Reset for next time
      };

      createAndNavigate();
    }
  }, [currentUser, isAttemptingCreate, dispatch, navigate]);

  const handleCreateGame = () => {
    if (username.trim()) {
      dispatch(setUser(username));
      setAttemptingCreate(true);
    }
  };

  const handleNavigateToJoin = () => {
    if (username.trim()) {
      dispatch(setUser(username));
      navigate('/join-game');
    }
  };

  return (
    <HomeContainer>
      <Title>Tower Defense Vibe</Title>
      <Subtitle>Team up and defend against waves of enemies.</Subtitle>
      <GameOptionsContainer>
        <FormGroup>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
        </FormGroup>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <ButtonsContainer>
          <Button onClick={handleCreateGame} disabled={!username.trim() || loading}>
            {loading ? 'Creating...' : 'Create Game'}
          </Button>
          <Button onClick={handleNavigateToJoin} disabled={!username.trim()}>Join Game</Button>
        </ButtonsContainer>
      </GameOptionsContainer>
    </HomeContainer>
  );
};

export default HomePage;
