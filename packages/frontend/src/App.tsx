import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Stack, Spinner } from 'tamagui';

// Query client
import { queryClient } from './lib/query-client';

// Routes
import { routes } from './routes';

// Components
import { AppLayout } from './components/layout/AppLayout';
import { AuthGuard } from './components/auth/AuthGuard';

// Contexts
import { SocketProvider } from './contexts/SocketContext';

// Pages
import { LandingPage } from './pages/auth/LandingPage';
import { DashboardPage } from './pages/lobby/DashboardPage';
import { CreateGamePage } from './pages/game/CreateGamePage';
import { JoinGamePage } from './pages/game/JoinGamePage';
import { GameRoomPage } from './pages/game/GameRoomPage';
import { GameActivePage } from './pages/game/GameActivePage';
import { GameResultsPage } from './pages/game/GameResultsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { GameHistoryPage } from './pages/history/GameHistoryPage';
import { LeaderboardPage } from './pages/leaderboard/LeaderboardPage';

// Stores and hooks
import { useAuthStore } from './stores/auth.store';
import { useCurrentUser } from './hooks/useAuth';
import { soundManager } from './utils/sound/soundManager';

function AppContent() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { isLoading } = useCurrentUser();

  useEffect(() => {
    // Cleanup sounds on unmount
    return () => {
      soundManager.cleanup();
    };
  }, []);

  // Show loading spinner while checking auth
  if (!isInitialized || isLoading) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" minHeight="100vh">
        <Spinner size="large" color="$neonBlue" />
      </Stack>
    );
  }

  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          {/* Public Routes */}
          <Route
            path={routes.landing}
            element={isAuthenticated ? <Navigate to={routes.dashboard} replace /> : <LandingPage />}
          />
          {/* Redirect login to landing page */}
          <Route
            path={routes.login}
            element={<Navigate to={routes.landing} replace />}
          />

          {/* Protected Routes */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
            {/* Dashboard */}
            <Route path={routes.dashboard} element={<DashboardPage />} />
            
            {/* Game Routes */}
            <Route path={routes.createGame} element={<CreateGamePage />} />
            <Route path={routes.joinGame} element={<JoinGamePage />} />
            <Route path={routes.gameRoom} element={<GameRoomPage />} />
            
            {/* Profile & Settings */}
            <Route path={routes.profile} element={<ProfilePage />} />
            <Route path={routes.settings} element={<SettingsPage />} />
            
            {/* History & Stats */}
            <Route path={routes.history} element={<GameHistoryPage />} />
            <Route path={routes.leaderboard} element={<LeaderboardPage />} />
          </Route>

          {/* Game Play Routes (No Header) */}
          <Route path={routes.gameActive} element={<GameActivePage />} />
          <Route path={routes.gameResults} element={<GameResultsPage />} />
        </Route>

        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to={routes.landing} replace />} />
      </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;