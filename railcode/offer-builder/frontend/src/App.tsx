import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { Spokes } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { Layout } from '@/components/common/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
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
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/offers/new" element={<OfferDetailPage />} />
        <Route path="/offers/:id" element={<OfferDetailPage />} />
        {/* Blueprint alias: internal builder surface */}
        <Route path="/admin/offers/:id" element={<OfferDetailPage />} />
        <Route path="*" element={<Navigate to="/offers" replace />} />
      </Routes>
    </Layout>
  );
}

/** Public funnel surface (offer.domain.com): no auth, no editor chrome. */
function PublicOfferRoute() {
  const { slug } = useParams<{ slug: string }>();
  return <PreviewPage mode="public" slug={slug || 'default'} />;
}

/** Industry pages: serves the offer linked to the prospect, or 404s. */
function PublicProspectRoute() {
  const { prospectKey } = useParams<{ prospectKey: string }>();
  return <PreviewPage mode="public" slug="default" key={prospectKey} />;
}

export function App() {
  // Railcode edition: the session is the platform login (ctx.user in the
  // worker). No local token — prove it against /api/auth/me on boot.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.auth
      .me()
      .then((me) => {
        if (!cancelled) setIsAuthenticated(!!(me as any)?.user);
      })
      .catch(() => {
        if (!cancelled) setIsAuthenticated(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogin() {
    setIsAuthenticated(true);
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FCFE]">
        <Spokes className="h-8 w-8 text-[var(--ods-brand-600)]" />
      </div>
    );
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
            {/* Blueprint alias: embedded Twenty preview surface */}
            <Route
              path="/preview/offers/:id"
              element={<PreviewPage />}
            />
            {/* Blueprint: public funnel surface (offer.domain.com) */}
            <Route
              path="/offer"
              element={<PreviewPage mode="public" slug="default" />}
            />
            <Route
              path="/offer/:slug"
              element={<PublicOfferRoute />}
            />
            {/* Industry surface: prospect-linked offer or 404 */}
            <Route
              path="/offer/prospect/:prospectKey"
              element={<PublicProspectRoute />}
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
