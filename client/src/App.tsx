import React from 'react';
import { Route, Routes } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/common/Header';
import useSocketInitializer from './hooks/useSocketInitializer';
import GamePage from './pages/GamePage';
import HomePage from './pages/HomePage';
import JoinGamePage from './pages/JoinGamePage';
// Import real-time version of the Lobby
import LobbyPage from './pages/LobbyPage.real-time';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UsernameEntryPage from './pages/UsernameEntryPage';
import GlobalStyles from './styles/GlobalStyles';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #121212;
  color: #f0f0f0;
`;

const App: React.FC = () => {
  // Initialize socket connection when the app starts
  useSocketInitializer();

  return (
    <AppContainer>
      <GlobalStyles />
      <Header />      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/lobby/:gameId" element={<LobbyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/username-entry" element={<UsernameEntryPage />} />
        <Route path="/join-game" element={<JoinGamePage />} />
      </Routes>
    </AppContainer>
  );
};

export default App;
