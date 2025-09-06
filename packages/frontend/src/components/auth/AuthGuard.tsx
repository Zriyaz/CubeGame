import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { routes } from '@/routes';
import { Stack, Spinner } from 'tamagui';

interface AuthGuardProps {
  children?: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" color="$neonBlue" />
      </Stack>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the attempted location
    return <Navigate to={routes.login} state={{ from: location }} replace />;
  }

  return <>{children || <Outlet />}</>;
}