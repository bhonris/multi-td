import type { Game, Position, Tower, TowerType } from '@shared/types'; // Updated import
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import GameMap from '../components/game/GameMap';
import GameUI from '../components/game/GameUI';
import { fetchGameState } from '../features/game/gameSlice';
import { socketConnected } from '../features/socket/socketSlice';
import type { AppDispatch, RootState } from '../store'; // Use import type
import socketManager from '../utils/socketManager';

const GamePageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px); /* Adjust based on header height */
  position: relative;
`;

const GameContainer = styled.div`
  flex: 1;
  display: flex;
`;

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const gameRef = useRef<HTMLDivElement>(null);
  // Ensure state.game.currentGame is properly typed or handled if null
  const { currentGame, towers, enemies, baseHealth, money } = useSelector((state: RootState) => state.game || {});
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { connected } = useSelector((state: RootState) => state.socket);

  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);
  useEffect(() => {
    console.log('GamePage mounted with gameId:', gameId, 'and user:', currentUser?.id);

    if (!gameId) {
      console.error('Missing gameId, redirecting to home');
      navigate('/');
      return;
    }

    if (!currentUser) {
      console.error('Missing user, redirecting to username-entry');
      return;
    }

    // Instead of reinitializing the socket, ensure it's connected
    console.log('Ensuring socket connection from GamePage');

    // Get the socket, connect if needed
    const socket = socketManager.ensureConnected(gameId, currentUser.id)
      ? socketManager.getSocket()
      : socketManager.connect();
    if (socket) {
      console.log('Socket reconnected with ID:', socket.id);
      dispatch(socketConnected());

      // Immediately join the game room after socket connection
      socket.on('connect', () => {
        console.log('Socket connected in initial setup, joining game room');
        socket.emit('join-game', {
          gameId,
          playerId: currentUser.id
        });
        console.log('Emitted join-game event in initial setup for', gameId);
      });

      // If the socket is already connected, join immediately
      if (socket.connected) {
        socket.emit('join-game', {
          gameId,
          playerId: currentUser.id
        });
        console.log('Immediate join-game event in initial setup for', gameId, 'as socket is already connected');
      }
    } else {
      console.error('Failed to reconnect socket');
    }

    // Fetch initial game state
    console.log('Fetching initial game state for game:', gameId);
    dispatch(fetchGameState(gameId));

    return () => {
      console.log('GamePage unmounting');

      // Cleanup the connect event listener if needed
      const socket = socketManager.getSocket();
      if (socket) {
        socket.off('connect');
      }
    };
  }, [dispatch, gameId, currentUser, navigate]);
  useEffect(() => {
    if (gameId && currentUser) {
      console.log('Setting up socket event listeners in GamePage');
      // Get socket from manager
      const socket = socketManager.getSocket();

      if (socket) {
        // Setup socket event listeners
        socket.on('connect', () => {
          console.log('Socket connected in GamePage with ID:', socket.id);
          dispatch(socketConnected());

          // Join the game room
          socket.emit('join-game', {
            gameId,
            playerId: currentUser.id
          });
          console.log('Emitted join-game event from GamePage for', gameId);
        });

        socket.on('game-updated', (gameData: Game) => { // Use Game type
          console.log('Game updated event received in GamePage');
          // No action needed - this is handled by 'game-state-update'
        });

        socket.on('game-state-update', (gameData: Partial<Game>) => { // Use Partial<Game> or a more specific type
          // Update enemy positions, towers, and game state
          dispatch({ type: 'game/gameUpdated', payload: gameData });
        });

        socket.on('tower-built', (tower: Tower) => { // Use Tower type
          console.log('Tower built event received:', tower);
          dispatch({ type: 'game/towerBuilt', payload: tower });
        });

        socket.on('tower-upgraded', (tower: Tower) => { // Use Tower type
          console.log('Tower upgraded event received:', tower);
          dispatch({ type: 'game/towerUpgraded', payload: tower });
        });

        socket.on('money-updated', (data: { playerId: string; money: number }) => { // More specific type
          console.log('Money updated event received:', data);
          dispatch({ type: 'game/moneyUpdated', payload: data });
        });

        socket.on('wave-started', (waveData: { wave: number; enemies: any[] }) => { // Define a specific type for waveData if available
          console.log('Wave started event received:', waveData);
          dispatch({ type: 'game/waveStarted', payload: waveData });
        });

        socket.on('enemy-damaged', (data: { enemyId: string; damage: number; newHealth: number }) => { // More specific type
          console.log('Enemy damaged event received:', data);
          dispatch({ type: 'game/enemyDamaged', payload: data });
        });

        socket.on('game-over', (result: { victory: boolean; gameId: string }) => { // More specific type
          console.log('Game over event received:', result);
          // Handle game over
          alert(result.victory ? 'Victory!' : 'Game Over');
          navigate('/');
        });

        return () => {
          console.log('Cleaning up socket event listeners in GamePage');
          socket.off('connect');
          socket.off('game-updated');
          socket.off('game-state-update');
          socket.off('tower-built');
          socket.off('tower-upgraded');
          socket.off('money-updated');
          socket.off('wave-started');
          socket.off('enemy-damaged');
          socket.off('game-over');
        };
      } else {
        console.error('Socket is not available in GamePage');
      }
    }
  }, [connected, gameId, currentUser, dispatch, navigate]);

  const handleTowerSelect = (towerType: TowerType) => {
    setSelectedTowerType(towerType);
    setSelectedTower(null);
  }; const handleMapClick = (position: Position) => {
    const socket = socketManager.getSocket();
    console.log('Map clicked at position:', position, 'Selected tower type:', selectedTowerType);

    if (selectedTowerType && socket && gameId && currentUser) {
      console.log('Attempting to build tower:', {
        gameId,
        playerId: currentUser.id,
        towerType: selectedTowerType,
        position,
        socketConnected: socket.connected,
        socketId: socket.id
      });

      // Build tower at clicked position
      socket.emit('build-tower', {
        gameId,
        playerId: currentUser.id,
        towerType: selectedTowerType,
        position
      });

      // Debug socket rooms right after sending the event
      socket.emit('debug-rooms', { gameId }, (response) => {
        console.log('Socket room status after build request:', response);
      });

      // Reset tower selection
      setSelectedTowerType(null);
    } else if (!selectedTowerType) {
      // Check if we clicked on an existing tower
      const tower = towers.find(t =>
        t.position.x === position.x &&
        t.position.y === position.y
      );

      if (tower) {
        setSelectedTower(tower);
        console.log('Selected existing tower:', tower);
      } else {
        setSelectedTower(null);
        console.log('No tower selected, no tower type selected');
      }
    } else {
      // Debug why we couldn't build a tower
      console.error('Unable to build tower:', {
        hasSelectedTowerType: !!selectedTowerType,
        hasSocket: !!socket,
        socketConnected: socket?.connected,
        hasGameId: !!gameId,
        hasCurrentUser: !!currentUser
      });
    }
  };

  const handleUpgradeTower = (towerId: string) => {
    const socket = socketManager.getSocket();

    if (socket && gameId && currentUser) {
      socket.emit('upgrade-tower', {
        gameId,
        playerId: currentUser.id,
        towerId
      });
    }
  };

  const handleStartWave = () => {
    const socket = socketManager.getSocket();

    if (socket && gameId) {
      socket.emit('start-wave', { gameId });
    }
  };

  if (!currentGame || !currentUser) {
    console.log("GamePage - No game or user data loaded yet");
    return (
      <GamePageContainer>
        <div style={{ textAlign: 'center', margin: '2rem' }}>
          <h2>Loading game...</h2>
          <p>Please wait while the game data is being loaded</p>
          {gameId && !currentGame && (
            <div style={{ marginTop: '1rem' }}>
              <p>Game ID: {gameId}</p>
              <button onClick={() => dispatch(fetchGameState(gameId))}>
                Retry Loading
              </button>
            </div>
          )}
        </div>
      </GamePageContainer>
    );
  }

  const playerMoney = money && currentUser ? money[currentUser.id] || 0 : 0;

  return (
    <GamePageContainer>      <GameContainer ref={gameRef}>        <GameMap
      towers={towers || []} // Ensure towers is not undefined
      enemies={enemies || []} // Ensure enemies is not undefined
      gridSize={{ width: 21, height: 15 }} // Example, adjust as needed
      selectedTowerType={selectedTowerType}
      selectedTower={selectedTower}
      onMapClick={handleMapClick}
    />
    </GameContainer>
      <GameUI
        baseHealth={baseHealth !== undefined ? baseHealth : (currentGame?.baseHealth || 0)} // Ensure baseHealth is not undefined
        money={playerMoney}
        wave={currentGame.wave}
        onTowerSelect={handleTowerSelect}
        selectedTowerType={selectedTowerType}
        selectedTower={selectedTower}
        onUpgradeTower={handleUpgradeTower}
        onStartWave={handleStartWave}
      />
    </GamePageContainer>
  );
};

export default GamePage;
