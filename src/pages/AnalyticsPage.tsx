import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  ClipboardList,
  MessageSquareText,
  Quote,
  Star,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { useStore } from '@/app/store';
import { SafeLink, useAppNavigation } from '@/app/navigation';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  Badge,
  EmptyState,
  MissingState,
  PageHeading,
  SectionTitle,
  StatusBadge,
} from '@/components/ui/shared';
import { ActivityChart, DistributionChart } from '@/components/charts/ResearchCharts';
import { analyticsFixture } from '@/data/analytics';
import { typeLabels } from '@/lib/survey-utils';
import { formatDate, number } from '@/lib/utils';
import { formatDuration } from '@/lib/response-utils';
import { downloadResponsesCsv } from '@/lib/csv';

export default function AnalyticsPage() {
  const { id } = useParams();
  const { state } = useStore();
  const { navigate } = useAppNavigation();
  const published = state.surveys.filter((s) => s.status === 'published');
  const survey = id ? state.surveys.find((s) => s.id === id) : published[0];
  const fixture = useMemo(() => (survey ? analyticsFixture(survey) : null), [survey]);
  if (id && !survey) return <MissingState />;
  if (!survey || !fixture)
    return (
      <EmptyState
        title="No published surveys"
        description="Publish a survey to view results."
        action={
          <Button asChild>
            <SafeLink to="/studio">Create a survey</SafeLink>
          </Button>
        }
      />
    );
  if (survey.status === 'draft')
    return (
      <EmptyState
        title="This survey is a draft"
        description="Publish it to view results."
        action={
          <Button asChild>
            <SafeLink to={`/builder/${survey.id}`}>Continue editing</SafeLink>
          </Button>
        }
      />
    );
  return (
    <div className="analytics-page space-y-7">
      <PageHeading
        title="Analytics"
        action={
          <>
            <Button
              variant="outline"
              onClick={() => {
                try {
                  downloadResponsesCsv(survey, fixture.responses);
                  toast.success('CSV exported');
                } catch {
                  toast.error('Could not export CSV. Please try again.');
                }
              }}
            >
              <Download /> Export CSV
            </Button>
            <Button asChild variant="outline">
              <SafeLink to={`/builder/${survey.id}`}>
                View questionnaire <ArrowUpRight />
              </SafeLink>
            </Button>
          </>
        }
      />
      <div className="survey-selector flex flex-wrap items-center justify-between gap-4">
        <div className="analytics-study-control">
          <BarChart3 size={17} className="text-primary" aria-hidden="true" />
          <label htmlFor="analytics-survey" className="sr-only">
            Select survey
          </label>
          <Select
            id="analytics-survey"
            label="Select survey"
            className="analytics-select"
            value={survey.id}
            onValueChange={(value) => navigate(`/analytics/${value}`)}
            options={published.map((s) => ({ value: s.id, label: s.title }))}
          />
          <StatusBadge status="published" />
        </div>
        <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <CalendarDays size={12} /> Published {formatDate(survey.publishedAt ?? survey.createdAt)}
        </span>
      </div>
      <section className="metrics-grid" aria-label="Survey metrics">
        {[
          {
            title: 'Responses',
            value: number(fixture.total),
            detail: 'Completed',
            icon: MessageSquareText,
          },
          {
            title: 'Completion rate',
            value: `${fixture.completionRate.toFixed(1)}%`,
            detail: 'Sample rate',
            icon: CheckCircle2,
          },
          {
            title: 'Survey questions',
            value: String(survey.questions.length).padStart(2, '0'),
            detail: 'Published questionnaire',
            icon: ClipboardList,
          },
          {
            title: 'Avg. completion time',
            value: formatDuration(fixture.averageCompletionSeconds),
            detail: 'Start to submission',
            icon: Clock3,
          },
        ].map(({ title, value, detail, icon: Icon }) => (
          <div className="metric-card" key={title}>
            <div className="flex items-center justify-between text-[12px] text-muted-foreground">
              <span>{title}</span>
              <Icon size={15} />
            </div>
            <p className="metric-value">{value}</p>
            <p className="text-[12px] leading-5 text-slate-400">{detail}</p>
          </div>
        ))}
      </section>
      <section className="panel min-w-0">
        <SectionTitle title="Responses over time" subtitle="Oct 13 – Nov 10, 2026" />
        <div className="mt-6">
          <ActivityChart data={fixture.activity} />
        </div>
      </section>
      <div className="flex items-center justify-between pt-2">
        <SectionTitle title="Question results" />
        <span className="text-[12px] text-slate-400">{survey.questions.length} questions</span>
      </div>
      <div className="question-results grid items-stretch gap-5 xl:grid-cols-2">
        {[
          ...survey.questions.filter((q) => q.type !== 'text'),
          ...survey.questions.filter((q) => q.type === 'text'),
        ].map((q) => {
          const index = survey.questions.findIndex((question) => question.id === q.id);
          const data = fixture.questions.find((item) => item.questionId === q.id)!;
          return (
            <section
              key={q.id}
              className={`panel min-w-0 ${q.type === 'text' ? 'xl:col-span-2' : ''}`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="question-number">{String(index + 1).padStart(2, '0')}</span>
                <Badge>{typeLabels[q.type]}</Badge>
              </div>
              <h3 className="min-h-12 text-sm font-semibold leading-6">{q.title}</h3>
              {data.average !== null && (
                <div className="mb-3 flex items-center gap-2">
                  <Star size={17} className="fill-amber-400 text-amber-400" />
                  <span className="text-2xl font-semibold tracking-tight">
                    {data.average.toFixed(1)}
                  </span>
                  <span className="text-[13px] text-muted-foreground">/ 5 average rating</span>
                </div>
              )}
              {data.nps && (
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <strong className="text-3xl font-semibold tracking-tight">
                      {data.nps.score === null
                        ? '—'
                        : data.nps.score > 0
                          ? `+${data.nps.score}`
                          : data.nps.score}
                    </strong>
                    <span className="text-[13px] text-muted-foreground">NPS</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                    {(
                      [
                        ['Promoters', data.nps.promoters],
                        ['Passives', data.nps.passives],
                        ['Detractors', data.nps.detractors],
                      ] as const
                    ).map(([label, count]) => (
                      <span key={label}>
                        {label} {data.nps!.total ? Math.round((count / data.nps!.total) * 100) : 0}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {q.type === 'text' ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {data.texts.map((text) => (
                    <article
                      key={text.respondent}
                      className="rounded-lg border border-border bg-slate-50/60 p-4"
                    >
                      <Quote size={15} className="mb-3 text-teal-300" />
                      <p className="text-[13px] leading-6 text-slate-600">{text.text}</p>
                      <p className="mt-4 text-[12px] text-slate-400">{text.respondent}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <>
                  <DistributionChart
                    data={data.distribution}
                    rating={q.type === 'rating' || q.type === 'nps'}
                  />
                  <p className="mt-2 text-[12px] text-slate-400">
                    {q.type === 'multiple_choice'
                      ? 'Multiple selections allowed · Totals can exceed sample respondent count.'
                      : `${number(fixture.total)} responses`}
                  </p>
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
