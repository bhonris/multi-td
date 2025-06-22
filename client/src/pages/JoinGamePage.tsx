import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Button from '../components/common/Button';
import type { RootState } from '../store';

const JoinGameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  flex: 1;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #4d9aff;
`;

const JoinForm = styled.div`
  background-color: #1e1e1e;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
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

const JoinGamePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [gameId, setGameId] = useState('');

  const handleJoinGame = () => {
    if (gameId.trim() && currentUser) {
      navigate(`/lobby/${gameId}`);
    }
  };

  return (
    <JoinGameContainer>
      <Title>Join a Game</Title>
      <JoinForm>
        <FormGroup>
          <Label htmlFor="gameId">Game ID</Label>
          <Input
            id="gameId"
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Enter the game ID"
          />
        </FormGroup>
        <Button onClick={handleJoinGame} disabled={!gameId.trim() || !currentUser}>
          Join Game
        </Button>
      </JoinForm>
    </JoinGameContainer>
  );
};

export default JoinGamePage;
