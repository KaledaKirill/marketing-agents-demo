import { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { useStore } from '@/app/store';
import { SafeLink } from '@/app/navigation';
import { Button } from '@/components/ui/button';
import { PageHeading, SectionTitle } from '@/components/ui/shared';
import { SurveyTable } from '@/components/surveys/SurveyTable';
import { ActivityChart } from '@/components/charts/ResearchCharts';
import { activityFixture, overviewFixture } from '@/data/analytics';
import { number } from '@/lib/utils';

export default function OverviewPage() {
  const { state } = useStore();
  const [range, setRange] = useState('30');
  const activity = activityFixture.slice(range === '7' ? -4 : range === '14' ? -7 : 0);
  const metrics = [
    { title: 'Surveys', value: state.surveys.length },
    { title: 'Published', value: state.surveys.filter((s) => s.status === 'published').length },
    { title: 'Responses', value: number(overviewFixture.responses) },
    { title: 'Completion rate', value: `${overviewFixture.completionRate}%` },
  ];
  return (
    <div className="space-y-6">
      <PageHeading
        title="Overview"
        action={
          <Button asChild>
            <SafeLink to="/studio">
              <Plus /> Create Survey
            </SafeLink>
          </Button>
        }
      />
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Workspace metrics">
        {metrics.map((metric) => (
          <div key={metric.title} className="metric-card">
            <p className="text-xs text-muted-foreground">{metric.title}</p>
            <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight">
              {metric.value}
            </p>
          </div>
        ))}
      </section>
      <section className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between p-5">
          <SectionTitle title="Recent surveys" />
          <Button asChild size="sm" variant="ghost">
            <SafeLink to="/surveys">
              View all <ArrowRight />
            </SafeLink>
          </Button>
        </div>
        <SurveyTable surveys={state.surveys.slice(0, 4)} compact />
      </section>
      <section className="panel min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title="Response activity" subtitle="Oct 13 – Nov 10, 2026" />
          <select
            aria-label="Activity date range"
            className="input h-9 min-h-0 w-36 py-1 text-xs"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="30">Last 30 days</option>
            <option value="14">Last 14 days</option>
            <option value="7">Last 7 days</option>
          </select>
        </div>
        <ActivityChart data={activity} />
      </section>
    </div>
  );
}
