import { Outlet, useLocation } from 'react-router-dom';
import { BarChart3, LayoutDashboard, Sparkles, SquareStack } from 'lucide-react';
import { SafeLink } from '@/app/navigation';
import { cn } from '@/lib/utils';

const links = [
  { to: '/', title: 'Overview', icon: LayoutDashboard },
  { to: '/surveys', title: 'Surveys', icon: SquareStack },
  { to: '/studio', title: 'AI Research Studio', icon: Sparkles },
  { to: '/analytics', title: 'Analytics', icon: BarChart3 },
];
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="logo-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {!compact && (
        <span className="brand-word font-semibold tracking-[-1px]">
          intergam<span className="brand-dot">.</span>
        </span>
      )}
    </span>
  );
}
export function AppShell() {
  const { pathname } = useLocation();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <SafeLink to="/" aria-label="Intergam overview" className="sidebar-home">
            <Logo />
          </SafeLink>
        </div>
        <nav
          id="workspace-navigation"
          className="mt-5 space-y-1.5 px-4"
          aria-label="Main navigation"
        >
          {links.map(({ to, title, icon: Icon }) => {
            const active =
              to === '/'
                ? pathname === '/'
                : pathname.startsWith(to) || (to === '/surveys' && pathname.startsWith('/builder'));
            return (
              <SafeLink
                key={to}
                to={to}
                title={title}
                aria-label={title}
                aria-current={active ? 'page' : undefined}
                className={cn('nav-item', active && 'active')}
              >
                <Icon size={18} strokeWidth={1.7} />
                <span>{title}</span>
              </SafeLink>
            );
          })}
        </nav>
      </aside>
      <div className="main-panel">
        <main id="main-content" className="page-content">
          <div className="page-arrival" key={pathname}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
