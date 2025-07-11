import type { Game } from '@shared/types';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import Button from '../components/common/Button';
import { fetchGameState, gameUpdated, joinGame } from '../features/game/gameSlice';
import { initializeSocket } from '../features/socket/socketSlice';
import { useGameBroadcast } from '../hooks/useGameBroadcast';
import { useNotifications } from '../hooks/useNotifications';
import type { AppDispatch, RootState } from '../store';
import { checkServerSync, logGameState } from '../utils/debugHelpers';
import socketManager from '../utils/socketManager';

// Add global window type extension for navigation timer
declare global {
  interface Window {
    _gameStartNavigationTimer?: ReturnType<typeof setTimeout>;
  }
}

// Styled components (unchanged from original)
const LobbyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  flex: 1;
`;

const LobbyCard = styled.div`
  background-color: #1e1e1e;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
`;

const LobbyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const LobbyTitle = styled.h2`
  margin: 0;
`;

const LobbyInfo = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const InfoItem = styled.div`
  background-color: #2e2e2e;
  padding: 1rem;
  border-radius: 4px;
`;

const InfoLabel = styled.div`
  font-size: 0.9rem;
  color: #999;
  margin-bottom: 0.5rem;
`;

const InfoValue = styled.div`
  font-size: 1.2rem;
  font-weight: 500;
`;

const PlayersList = styled.div`
  margin-bottom: 2rem;
`;

const PlayerItem = styled.div<{ isHost: boolean; isReady: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #2e2e2e;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  
  ${props => props.isHost ? `border-left: 4px solid #f1c40f;` : ''}
  ${props => props.isReady ? `border-right: 4px solid #2ecc71;` : ''}
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PlayerStatus = styled.span<{ isReady: boolean }>`
  color: ${props => props.isReady ? '#2ecc71' : '#e74c3c'};
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

const GameCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
  background-color: #2e2e2e;
  padding: 1rem;
  border-radius: 4px;
`;

const GameCode = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
`;

const CopyButton = styled.button`
  background: none;
  border: 1px solid #4d9aff;
  color: #4d9aff;
  padding: 6px 12px;
  margin-top: 0.5rem;
  
  &:hover {
    background-color: rgba(77, 154, 255, 0.1);
  }
`;

const StatusIndicator = styled.div<{ connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: ${props => props.connected ? '#2ecc71' : '#e74c3c'};
  margin-top: 10px;
  
  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => props.connected ? '#2ecc71' : '#e74c3c'};
  }
`;

const LobbyPage: React.FC<{}> = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentGame, loading, error } = useSelector((state: RootState) => state.game);
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { connected } = useSelector((state: RootState) => state.socket);
  const { showNotification: notify } = useNotifications();

  // Use the player's ready state from the game state instead of a local state
  const currentPlayerInGame = currentGame?.players.find(p => p.id === currentUser?.id);
  const [isReady, setIsReady] = useState(currentPlayerInGame?.isReady || false);
  const [isStarting, setIsStarting] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const isMountedRef = useRef(true);
  const gameStartCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [gameJoined, setGameJoined] = useState(false);

  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;

      // Clear any timers on unmount
      if (gameStartCheckIntervalRef.current) {
        clearInterval(gameStartCheckIntervalRef.current);
      }
      if (gameStartTimeoutRef.current) {
        clearTimeout(gameStartTimeoutRef.current);
      }
      if (window._gameStartNavigationTimer) {
        clearTimeout(window._gameStartNavigationTimer);
      }
    };
  }, []);

  // Update local ready state when game state changes
  useEffect(() => {
    if (currentPlayerInGame) {
      setIsReady(currentPlayerInGame.isReady);
    }
  }, [currentPlayerInGame]);

  // Redirect if there is no user and fetch initial game state
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    if (gameId) {
      dispatch(initializeSocket());
      dispatch(fetchGameState(gameId));
    }
  }, [dispatch, gameId, currentUser, navigate]);
  // Set up socket connection and event listeners
  useEffect(() => {
    const socket = socketManager.getSocket();

    // Initialize socket if needed
    if (!socket && gameId && currentUser) {
      console.log('Socket not found, initializing...');
      socketManager.connect();
    }

    if (socket && gameId && currentUser) {
      // Track socket connection status for UI
      setSocketConnected(socket.connected);

      // Remove any existing listeners before adding new ones to prevent duplicates
      socket.off('connect');
      socket.off('disconnect');
      socket.off('player-joined');
      socket.off('game-updated');
      socket.off('game-started');

      // Setup socket event listeners
      socket.on('connect', () => {
        console.log('Socket connected with ID:', socket.id);
        setSocketConnected(true);
        dispatch({ type: 'socket/socketConnected' }); // Fix: use action object instead of boolean

        console.log(connected, gameId, currentUser, currentGame, dispatch, navigate, notify);
        // Join the game room
        socket.emit('join-game', {
          gameId,
          playerId: currentUser.id
        });
        console.log('Emitted join-game event for', gameId);

        // Debug message to check game state
        socket.emit('debug-rooms', { gameId }, (response: any) => {
          console.log('Debug rooms response:', response);
        });
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setSocketConnected(false);

        // Fetch latest state when reconnected
        if (gameId) {
          dispatch(fetchGameState(gameId));
        }
      });

      // If already connected, make sure we join the game room
      if (socket.connected && !gameJoined) {
        setSocketConnected(true);
        socket.emit('join-game', {
          gameId,
          playerId: currentUser.id
        });
        console.log('Already connected, emitted join-game event for', gameId);
        setGameJoined(true);
      }

      socket.on('player-joined', (data: any) => {
        console.log('Player joined game:', data);
        // Refresh game state when a new player joins
        if (gameId) {
          dispatch(fetchGameState(gameId));
        }
      });

      socket.on('game-updated', (updatedGameData: Partial<Game> & { error?: string }) => {
        console.log('Game updated event received:', updatedGameData);

        if (updatedGameData.error) {
          console.error('Game error received:', updatedGameData.error);
          notify(`Game error: ${updatedGameData.error}`, 'error');
          return;
        }

        // Log detailed game state for debugging
        if (currentUser && gameId) {
          logGameState(gameId, currentUser.id, updatedGameData);
        }

        // Dispatch the gameUpdated action with the received data
        dispatch(gameUpdated(updatedGameData));

        // If the update includes player info, update our local isReady state
        if (updatedGameData.players && currentUser) {
          const updatedCurrentPlayer = updatedGameData.players.find(p => p.id === currentUser.id);
          if (updatedCurrentPlayer) {
            setIsReady(updatedCurrentPlayer.isReady);
          }
        }

        // Check if game state has been updated to running (as another way to detect game start)
        if (updatedGameData.state === 'running' && gameId) {
          console.log('Game state changed to running via game-updated event');
          handleGameStarted(updatedGameData as Game);
        }
      });

      socket.on('game-started', (game: Game) => {
        console.log('Game started event received!', game);
        handleGameStarted(game);
      });

      // Try to join the game if not already in it
      const isPlayerInGame = currentGame?.players.some(p => p.id === currentUser.id);
      if (!isPlayerInGame && gameId) {
        dispatch(joinGame({ gameId, playerId: currentUser.id }));
      }

      // Log the current socket status
      console.log('Socket configuration status:', {
        socketId: socket.id,
        connected: socket.connected,
        hasListeners: {
          connect: socket.hasListeners('connect'),
          'game-started': socket.hasListeners('game-started'),
          'game-updated': socket.hasListeners('game-updated')
        }
      });

      return () => {
        console.log('Cleaning up socket event listeners');
        socket.off('connect');
        socket.off('disconnect');
        socket.off('player-joined');
        socket.off('game-updated');
        socket.off('game-started');
      };
    }
  }, [connected, gameId, currentUser, currentGame, dispatch, navigate, notify]);

  // Handler for game start events - centralized to avoid duplicate navigation
  const handleGameStarted = (game: Game) => {
    if (!gameId || !isMountedRef.current) return;

    // Log detailed game state for debugging
    if (currentUser && gameId) {
      logGameState(gameId, currentUser.id, game);
    }

    // Only process if we're not already navigating
    if (window._gameStartNavigationTimer) {
      console.log('Navigation already in progress, ignoring duplicate start event');
      return;
    }

    // Show a notification but don't block
    const startingAlert = 'Game is starting! Navigating to game page...';
    console.log(startingAlert);
    notify(startingAlert, 'success');

    // Update game state with the received data
    dispatch(gameUpdated(game));

    // Clear any existing check intervals
    if (gameStartCheckIntervalRef.current) {
      clearInterval(gameStartCheckIntervalRef.current);
      gameStartCheckIntervalRef.current = null;
    }

    // Navigate to game page when game starts
    try {
      console.log('Navigating to game page:', `/game/${gameId}`);
      window._gameStartNavigationTimer = setTimeout(() => {
        if (isMountedRef.current) {
          console.log('Executing navigation to game page');
          navigate(`/game/${gameId}`, { replace: true });
        }
      }, 500); // Reduced delay for more responsiveness
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Use the game broadcast hooks for enhanced reliability
  const { broadcastPlayerReady, broadcastGameStart } = useGameBroadcast();

  const handleReadyToggle = () => {
    if (!gameId || !currentUser) {
      console.error('Cannot toggle ready state: missing gameId or currentUser', {
        hasGameId: !!gameId,
        hasCurrentUser: !!currentUser
      });

      notify('Error: Unable to update ready status. Please try again or refresh the page.', 'error');
      return;
    }

    const newReadyState = !isReady;

    // Set optimistic UI state
    setIsReady(newReadyState);

    console.log('Toggling player ready state:', {
      gameId,
      playerId: currentUser.id,
      isReady: newReadyState
    });

    // Use the enhanced broadcast method for greater reliability
    broadcastPlayerReady(gameId, currentUser.id, newReadyState);
  };

  const handleStartGame = () => {
    // Validate all requirements before starting the game
    if (!gameId) {
      console.error('Game ID is missing');
      notify('Error: Game ID is missing', 'error');
      return;
    }

    if (!currentUser) {
      console.error('Current user is not defined');
      notify('Error: User information is missing', 'error');
      return;
    }

    if (!currentGame) {
      console.error('Current game is not defined');
      notify('Error: Game information is missing', 'error');

      // Try to fetch the game state and retry
      if (gameId) {
        dispatch(fetchGameState(gameId)).then(() => {
          console.log('Fetched game state, retrying game start');
          setTimeout(handleStartGame, 1000);
        });
      }
      return;
    }

    if (currentGame.hostId !== currentUser.id) {
      console.error('Only the host can start the game');
      notify('Error: Only the host can start the game', 'error');
      return;
    }

    if (!allPlayersReady) {
      console.error('All players must be ready to start the game');
      notify('Error: All players must be ready to start the game', 'error');
      return;
    }

    // Log detailed game state before starting
    if (gameId) {
      logGameState(gameId, currentUser.id, currentGame);
    }

    console.log('Starting game with enhanced broadcast method');

    // Use the enhanced broadcast method for greater reliability
    if (gameId) {
      const success = broadcastGameStart(gameId, currentUser.id);
      if (!success) {
        notify('Error: Failed to send start game command. Please try again.', 'error');
        setIsStarting(false);
        return;
      }
    }

    // Get socket for logging purposes
    const socket = socketManager.getSocket();

    console.log('Attempting to start game:', {
      gameId,
      hostId: currentUser.id,
      socketId: socket?.id,
      socketConnected: socket?.connected,
      players: currentGame.players.map(p => ({ id: p.id, username: p.username, isReady: p.isReady }))
    });

    setIsStarting(true);
    console.log('Game start process initiated');

    // Improved fallback: If game-started event is missed, check state periodically
    let fallbackAttempts = 0;
    const MAX_FALLBACK_ATTEMPTS = 6; // Reduced attempts with faster checking

    // Store interval reference so we can clear it when component unmounts
    gameStartCheckIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        if (gameStartCheckIntervalRef.current) {
          clearInterval(gameStartCheckIntervalRef.current);
          gameStartCheckIntervalRef.current = null;
        }
        return;
      }

      fallbackAttempts++;
      console.log(`Fallback attempt ${fallbackAttempts}/${MAX_FALLBACK_ATTEMPTS} to check game state...`);

      if (fallbackAttempts >= MAX_FALLBACK_ATTEMPTS) {
        console.log('Max fallback attempts reached, stopping fallback checks.');
        if (gameStartCheckIntervalRef.current) {
          clearInterval(gameStartCheckIntervalRef.current);
          gameStartCheckIntervalRef.current = null;
        }
        setIsStarting(false);
        return;
      }

      // Check if socket is connected, try to rejoin the game room to ensure we receive events
      const currentSocket = socketManager.getSocket();
      if (currentSocket?.connected && currentUser && gameId) {
        currentSocket.emit('join-game', {
          gameId,
          playerId: currentUser.id
        });
        console.log('Re-joined game room to ensure event reception');
      }

      if (gameId) {
        dispatch(fetchGameState(gameId))
          .then((action: any) => {
            if (!isMountedRef.current || !gameStartCheckIntervalRef.current) return;

            const gameFromServer = action.payload as Game;

            // Check if game is now in running state
            if (gameFromServer?.state === 'running') {
              console.log('Fallback: Game state is "running". Handling game start.');
              if (gameStartCheckIntervalRef.current) {
                clearInterval(gameStartCheckIntervalRef.current);
                gameStartCheckIntervalRef.current = null;
              }
              handleGameStarted(gameFromServer);
            } else if (!isStarting) {
              // If we're no longer trying to start, clear the interval
              if (gameStartCheckIntervalRef.current) {
                clearInterval(gameStartCheckIntervalRef.current);
                gameStartCheckIntervalRef.current = null;
              }
            }
          })
          .catch((fetchError) => {
            console.error('Fallback: Error checking game start status:', fetchError);
          });
      }
    }, 2000); // Check every 2 seconds

    // Create a timeout to stop checking and reset the button after a reasonable period
    gameStartTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;

      // Before giving up, try one last time with a direct server check
      if (gameId) {
        checkServerSync(gameId, dispatch).then(isInSync => {
          if (isInSync) {
            // Server has the game, try one more look at the game state
            dispatch(fetchGameState(gameId))
              .then((action: any) => {
                const gameFromServer = action.payload;
                if (gameFromServer?.state === 'running') {
                  console.log('Final check: Game is running! Handling game start...');
                  handleGameStarted(gameFromServer);
                  return;
                }

                // Give up
                if (gameStartCheckIntervalRef.current) {
                  clearInterval(gameStartCheckIntervalRef.current);
                  gameStartCheckIntervalRef.current = null;
                }
                setIsStarting(false);
                console.log('Fallback timeout reached. Resetting start button.');
                notify('The game start timed out. Please ensure all players are connected and try again.', 'error');
              });
          } else {
            if (gameStartCheckIntervalRef.current) {
              clearInterval(gameStartCheckIntervalRef.current);
              gameStartCheckIntervalRef.current = null;
            }
            setIsStarting(false);
            console.log('Fallback timeout reached. Resetting start button.');
            notify('The game start timed out. Please ensure all players are connected and try again.', 'error');
          }
        });
      } else {
        if (gameStartCheckIntervalRef.current) {
          clearInterval(gameStartCheckIntervalRef.current);
          gameStartCheckIntervalRef.current = null;
        }
        setIsStarting(false);
        console.log('Fallback timeout reached but no game ID available.');
        notify('Error: Game ID is missing', 'error');
      }
    }, 15000); // 15 seconds total timeout
  };

  const handleLeaveGame = () => {
    navigate('/');
  };

  const handleCopyGameCode = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId)
        .then(() => notify('Game code copied to clipboard!', 'info'))
        .catch(err => console.error('Failed to copy: ', err));
    }
  };

  if (loading) {
    return (
      <LobbyContainer>
        <div>Loading lobby...</div>
      </LobbyContainer>
    );
  }

  if (error || !currentGame) {
    return (
      <LobbyContainer>
        <div>Error loading game: {error || 'Game not found'}</div>
        <Button onClick={handleLeaveGame}>
          Return Home
        </Button>
      </LobbyContainer>
    );
  }

  console.log('LobbyPage render - Current game state:', {
    gameId,
    hostId: currentGame.hostId,
    players: currentGame.players.map(p => ({
      id: p.id,
      username: p.username,
      isReady: p.isReady,
      isHost: p.id === currentGame.hostId
    })),
    playerCount: currentGame.players.length,
    allPlayersReady: currentGame.players.every(p => p.isReady)
  });

  const isHost = currentUser?.id === currentGame.hostId;
  const allPlayersReady = currentGame.players.every(player => player.isReady);
  const currentPlayer = currentGame.players.find(player => player.id === currentUser?.id);
  // Use the server's state of whether the player is ready, not the local state
  const playerIsReady = currentPlayer?.isReady || false;

  return (
    <LobbyContainer>
      <LobbyCard>
        <LobbyHeader>
          <LobbyTitle>Game Lobby</LobbyTitle>
          <Button variant="secondary" onClick={handleLeaveGame}>
            Leave Game
          </Button>
        </LobbyHeader>

        <LobbyInfo>
          <InfoItem>
            <InfoLabel>Host</InfoLabel>
            <InfoValue>
              {currentGame.players.find(p => p.id === currentGame.hostId)?.username || 'Unknown'}
            </InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Players</InfoLabel>
            <InfoValue>{currentGame.players.length}/{currentGame.maxPlayers}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Difficulty</InfoLabel>
            <InfoValue>{currentGame.difficulty}</InfoValue>
          </InfoItem>
        </LobbyInfo>

        <PlayersList>
          {currentGame.players.map(player => (
            <PlayerItem
              key={player.id}
              isHost={player.id === currentGame.hostId}
              isReady={player.isReady}
            >
              <PlayerInfo>
                <div>{player.username}</div>
                {player.id === currentGame.hostId && <span>(Host)</span>}
              </PlayerInfo>
              <PlayerStatus isReady={player.isReady}>
                {player.isReady ? 'Ready' : 'Not Ready'}
              </PlayerStatus>
            </PlayerItem>
          ))}
        </PlayersList>

        <ButtonsContainer>
          <Button
            onClick={handleReadyToggle}
            variant={playerIsReady ? 'secondary' : 'primary'}
            disabled={isStarting}
          >
            {playerIsReady ? 'Not Ready' : 'Ready'}
          </Button>

          {isHost && (
            <Button
              onClick={handleStartGame}
              disabled={!allPlayersReady || isStarting}
            >
              {isStarting ? 'Starting...' : 'Start Game'}
            </Button>
          )}
        </ButtonsContainer>

        <GameCodeContainer>
          <div>Share this code with friends:</div>
          <GameCode>{gameId}</GameCode>
          <CopyButton onClick={handleCopyGameCode}>
            Copy Code
          </CopyButton>
          <StatusIndicator connected={socketConnected}>
            {socketConnected ? 'Connected' : 'Disconnected'}
          </StatusIndicator>
        </GameCodeContainer>
      </LobbyCard>
    </LobbyContainer>
  );
};

export default LobbyPage;
