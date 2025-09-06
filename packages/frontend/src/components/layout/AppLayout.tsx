import { Stack } from 'tamagui';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

interface AppLayoutProps {
  showHeader?: boolean;
  showBackButton?: boolean;
  title?: string;
}

export function AppLayout({ 
  showHeader = true, 
  showBackButton = false,
  title 
}: AppLayoutProps) {
  return (
    <Stack flex={1} backgroundColor="$background" minHeight="100vh">
      {showHeader && (
        <Header showBackButton={showBackButton} title={title} />
      )}
      
      <Stack flex={1} overflow="auto">
        <Outlet />
      </Stack>
    </Stack>
  );
}