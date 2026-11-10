import { Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Sparkles,
  SquareStack,
} from 'lucide-react';
import { SafeLink } from '@/app/navigation';
import { useStore } from '@/app/store';
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
        <span className="brand-word text-[23px] font-semibold tracking-[-1px]">
          intergam<span className="text-primary">.</span>
        </span>
      )}
    </span>
  );
}
export function AppShell() {
  const { state, setSidebar } = useStore();
  const collapsed = state.preferences.sidebarCollapsed;
  const { pathname } = useLocation();
  return (
    <div className={cn('app-shell', collapsed && 'sidebar-collapsed')}>
      <aside className="sidebar">
        <div
          className={cn(
            'sidebar-brand flex h-[81px] shrink-0 items-center border-b border-border px-6',
            collapsed && 'justify-center px-3',
          )}
        >
          <SafeLink to="/" aria-label="Intergam overview">
            <Logo compact={collapsed} />
          </SafeLink>
        </div>
        <nav className="mt-6 space-y-1 px-3" aria-label="Main navigation">
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
                className={cn('nav-item', active && 'active', collapsed && 'justify-center px-0')}
              >
                <Icon size={18} strokeWidth={1.7} />
                {!collapsed && <span>{title}</span>}
              </SafeLink>
            );
          })}
        </nav>
        <div className="sidebar-actions mt-auto px-3 pb-5">
          <button
            className={cn(
              'sidebar-collapse nav-item mt-1 w-full',
              collapsed && 'justify-center px-0',
            )}
            onClick={() => setSidebar(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight size={17} />
            ) : (
              <>
                <ChevronLeft size={17} />
                <span>Collapse sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
      <div className="main-panel">
        <main id="main-content" className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
