import type { ReactNode } from 'react';
import { ArrowUpRight, Inbox, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeLink } from '@/app/navigation';
import { Button } from './button';

export function Badge({
  children,
  variant = 'neutral',
}: {
  children: ReactNode;
  variant?: 'neutral' | 'success' | 'accent' | 'warning';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium leading-none',
        {
          'bg-slate-100 text-slate-600': variant === 'neutral',
          'bg-emerald-50 text-emerald-700': variant === 'success',
          'bg-teal-50 text-teal-700': variant === 'accent',
          'bg-amber-50 text-amber-700': variant === 'warning',
        },
      )}
    >
      {children}
    </span>
  );
}
export function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  return (
    <Badge variant={status === 'published' ? 'success' : 'neutral'}>
      <span
        className={cn(
          'size-1.5 rounded-full',
          status === 'published' ? 'bg-emerald-500' : 'bg-slate-400',
        )}
      />
      {status === 'published' ? 'Published' : 'Draft'}
    </Badge>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </header>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white p-8 text-center">
      <div className="mb-4 rounded-2xl bg-slate-50 p-4">
        <Inbox className="size-6 text-slate-400" />
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mb-5 mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
export function MissingState({ publicView = false }: { publicView?: boolean }) {
  return (
    <div className="mx-auto max-w-xl py-16">
      <EmptyState
        title={publicView ? 'This survey is not available here' : 'We couldn’t find that page'}
        description={
          publicView
            ? 'Custom surveys only exist in the browser where they were created. Try a preloaded survey or return to your workspace.'
            : 'The page may have moved, or the survey may have been removed.'
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="outline">
              <SafeLink to="/">Back to overview</SafeLink>
            </Button>
            {publicView && (
              <Button asChild>
                <SafeLink to="/survey/demo-ev-satisfaction">
                  Open EV survey <ArrowUpRight />
                </SafeLink>
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
}
export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function Breadcrumb({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-2 text-[13px] text-muted-foreground">
      <SafeLink to="/surveys" className="hover:text-primary">
        Surveys
      </SafeLink>
      <ChevronRight size={12} />
      <span className="truncate">{children}</span>
    </div>
  );
}
