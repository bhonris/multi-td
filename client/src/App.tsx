import React from 'react';
import { Route, Routes } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/common/Header';
import GamePage from './pages/GamePage';
import HomePage from './pages/HomePage';
import JoinGamePage from './pages/JoinGamePage';
import LobbyPage from './pages/LobbyPage';
import GlobalStyles from './styles/GlobalStyles';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #121212;
  color: #f0f0f0;
`;

const App: React.FC = () => {
  return (
    <AppContainer>
      <GlobalStyles />
      <Header />      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/lobby/:gameId" element={<LobbyPage />} />
        <Route path="/join-game" element={<JoinGamePage />} />
      </Routes>
    </AppContainer>
  );
};

export default App;
