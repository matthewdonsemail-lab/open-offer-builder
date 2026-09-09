import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { Layout } from '@/components/common/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { OffersPage } from '@/pages/OffersPage';
import { OfferDetailPage } from '@/pages/OfferDetailPage';
import { PreviewPage } from '@/pages/PreviewPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AuthenticatedApp() {
  return (
    <Layout>
      <Routes>
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/offers/new" element={<OfferDetailPage />} />
        <Route path="/offers/:id" element={<OfferDetailPage />} />
        <Route path="*" element={<Navigate to="/offers" replace />} />
      </Routes>
    </Layout>
  );
}

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('offer-builder-token');
  });

  function handleLogin() {
    setIsAuthenticated(true);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <Routes>
            <Route 
              path="/login" 
              element={<LoginPage onLogin={handleLogin} />} 
            />
            <Route 
              path="/preview/:industryId/:id" 
              element={<PreviewPage />} 
            />
            <Route 
              path="/*" 
              element={
                isAuthenticated ? (
                  <AuthenticatedApp />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
          </Routes>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
}
