import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Button from '../components/common/Button';
import { joinGame } from '../features/game/gameSlice';
import { AppDispatch, RootState } from '../store';

const JoinGameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  flex: 1;
`;

const JoinGameCard = styled.div`
  background-color: #1e1e1e;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
`;

const FormTitle = styled.h2`
  margin-bottom: 1.5rem;
  text-align: center;
  color: #4d9aff;
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
  &:focus {
    border-color: #4d9aff;
    outline: none;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  margin-top: 1rem;
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-top: 2rem;
`;

const JoinGamePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useSelector((state: RootState) => state.user);
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Redirect to username entry if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/username-entry');
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    if (!gameId.trim()) {
      setError('Please enter a valid game code');
      return;
    }

    setError(null);

    try {      // Try to join the game
      if (currentUser) {
        await dispatch(joinGame({
          gameId: gameId.trim(),
          playerId: currentUser.id
        })).unwrap();
      } else {
        throw new Error('User not found');
      }

      // If successful, navigate to the lobby
      navigate(`/lobby/${gameId.trim()}`);
    } catch (err) {
      console.error('Failed to join game:', err);
      setError('Failed to join game. Please check the game code and try again.');
    }
  };

  return (
    <JoinGameContainer>
      <JoinGameCard>
        <FormTitle>Join a Game</FormTitle>

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="gameId">Game Code</Label>
            <Input
              id="gameId"
              type="text"
              placeholder="Enter the game code"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
            />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <ButtonContainer>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/')}
            >
              Back
            </Button>
            <Button type="submit">
              Join Game
            </Button>
          </ButtonContainer>
        </form>
      </JoinGameCard>
    </JoinGameContainer>
  );
};

export default JoinGamePage;
