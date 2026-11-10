import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { Toaster } from 'sonner';
import { StoreProvider, useStore } from './store';
import { NavigationProvider } from './navigation';
import { AppShell, Logo } from '@/components/layout/AppShell';
import { ConfirmProvider } from '@/components/ui/confirm';
import { Button } from '@/components/ui/button';
import { MissingState } from '@/components/ui/shared';

const OverviewPage = lazy(() => import('@/pages/OverviewPage'));
const SurveysPage = lazy(() => import('@/pages/SurveysPage'));
const StudioPage = lazy(() => import('@/pages/StudioPage'));
const BuilderPage = lazy(() => import('@/pages/BuilderPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const PublicSurveyPage = lazy(() => import('@/pages/PublicSurveyPage'));
function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `Intergam — ${pathname.startsWith('/survey/') ? 'Share your perspective' : 'Research OS'}`;
  }, [pathname]);
  return null;
}
function Application() {
  const { recovery, warning, reset } = useStore();
  if (recovery)
    return (
      <div className="grid min-h-dvh place-items-center bg-background p-6">
        <div className="panel max-w-lg p-8">
          <Logo />
          <AlertTriangle className="my-6 text-amber-500" size={28} />
          <h1 className="text-2xl">Let’s restore your workspace.</h1>
          <p className="my-4 text-sm leading-7 text-muted-foreground">
            The saved data is damaged or uses an unsupported version. It has not been overwritten.
            Reset to restore the three original studies; custom local data will be replaced.
          </p>
          <Button onClick={reset}>Restore workspace</Button>
        </div>
      </div>
    );
  return (
    <>
      <RouteEffects />
      {warning && (
        <div role="status" className="storage-warning">
          <AlertTriangle size={14} /> Storage is unavailable. Your changes work for this session but
          may not survive a refresh.
        </div>
      )}
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById('main-content');
          main?.setAttribute('tabindex', '-1');
          main?.focus();
        }}
      >
        Skip to content
      </a>
      <Suspense
        fallback={
          <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle size={19} className="animate-spin" /> Opening your workspace…
          </div>
        }
      >
        <Routes>
          <Route path="/survey/:slug" element={<PublicSurveyPage />} />
          <Route element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="surveys" element={<SurveysPage />} />
            <Route path="studio" element={<StudioPage />} />
            <Route path="builder/:id" element={<BuilderPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="analytics/:id" element={<AnalyticsPage />} />
            <Route path="*" element={<MissingState />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
export default function App() {
  return (
    <HashRouter>
      <StoreProvider>
        <NavigationProvider>
          <ConfirmProvider>
            <Application />
            <Toaster position="bottom-right" richColors closeButton />
          </ConfirmProvider>
        </NavigationProvider>
      </StoreProvider>
    </HashRouter>
  );
}
