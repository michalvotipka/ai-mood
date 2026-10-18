import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { getCurrentUser } from './api/auth';
import { createQueryClient } from './api/queryClient';
import { App } from './App';

// The app renders only for a signed-in user. A signed-out one is sent to Keycloak's login page.
const user = await getCurrentUser();

const queryClient = createQueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App user={user} />
    </QueryClientProvider>
  </StrictMode>,
);
