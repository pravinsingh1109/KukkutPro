import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './routes';
import { BottomNav } from './components/shared/BottomNav';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppShell: React.FC = () => {
  const location = useLocation();
  const hideNav = location.pathname === '/setup';

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <AppRoutes />
      {!hideNav && <BottomNav />}
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
