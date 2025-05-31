import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Button from '../components/common/Button';
import { setTemporaryUser } from '../features/user/userSlice';
import { AppDispatch } from '../store';

const UsernameEntryContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  flex: 1;
`;

const UsernameForm = styled.form`
  background-color: #1e1e1e;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
`;

const FormTitle = styled.h2`
  margin-bottom: 2rem;
  text-align: center;
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

const ErrorMessage = styled.p`
  color: #e74c3c;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const UsernameEntryPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simple validation
    if (!username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }    // Set the temporary user and continue
    try {
      dispatch(setTemporaryUser(username.trim()));
      setLoading(false);
    } catch (error) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };
  const [hasUsername, setHasUsername] = useState(false);

  const handleCreateGame = () => {
    navigate('/');
  };

  const handleJoinGame = () => {
    navigate('/join-game');
  };

  return (
    <UsernameEntryContainer>
      {!hasUsername ? (
        <UsernameForm onSubmit={(e) => {
          handleSubmit(e);
          setHasUsername(true);
        }}>
          <FormTitle>Enter a Username to Play</FormTitle>
          <FormGroup>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoComplete="off"
              autoFocus
            />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Processing...' : 'Continue'}
          </Button>
        </UsernameForm>
      ) : (
        <UsernameForm onSubmit={(e) => e.preventDefault()}>
          <FormTitle>Welcome, {username}!</FormTitle>
          <p style={{ textAlign: 'center', marginBottom: '2rem' }}>What would you like to do?</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Button onClick={handleCreateGame} style={{ width: '100%' }}>
              Create New Game
            </Button>

            <Button onClick={handleJoinGame} variant="secondary" style={{ width: '100%' }}>
              Join Existing Game
            </Button>
          </div>
        </UsernameForm>
      )}
    </UsernameEntryContainer>
  );
};

export default UsernameEntryPage;
