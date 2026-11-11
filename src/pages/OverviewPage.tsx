import { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { useStore } from '@/app/store';
import { SafeLink } from '@/app/navigation';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
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
    <div className="overview-page space-y-7">
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
      <section className="metrics-grid" aria-label="Workspace metrics">
        {metrics.map((metric) => (
          <div key={metric.title} className="metric-card">
            <p className="text-[13px] text-muted-foreground">{metric.title}</p>
            <p className="metric-value">{metric.value}</p>
          </div>
        ))}
      </section>
      <section className="panel min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title="Response activity" subtitle="Oct 13 – Nov 10, 2026" />
          <Select
            label="Activity date range"
            className="date-range-select"
            value={range}
            onValueChange={setRange}
            options={[
              { value: '30', label: 'Last 30 days' },
              { value: '14', label: 'Last 14 days' },
              { value: '7', label: 'Last 7 days' },
            ]}
          />
        </div>
        <ActivityChart data={activity} />
      </section>
      <section className="table-panel">
        <div className="table-panel-heading">
          <SectionTitle title="Recent surveys" />
          <Button asChild size="sm" variant="ghost">
            <SafeLink to="/surveys">
              View all <ArrowRight />
            </SafeLink>
          </Button>
        </div>
        <SurveyTable surveys={state.surveys.slice(0, 4)} compact />
      </section>
    </div>
  );
}
