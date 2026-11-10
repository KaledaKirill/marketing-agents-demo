import { useState } from 'react';
import { Plus, Search, SquareStack } from 'lucide-react';
import { SafeLink } from '@/app/navigation';
import { useStore } from '@/app/store';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeading } from '@/components/ui/shared';
import { SurveyTable } from '@/components/surveys/SurveyTable';

export default function SurveysPage() {
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const surveys = state.surveys.filter(
    (s) =>
      (status === 'all' || s.status === status) &&
      s.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <PageHeading
        title="Surveys"
        action={
          <Button asChild>
            <SafeLink to="/studio">
              <Plus /> Create Survey
            </SafeLink>
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-2">
        <div className="flex flex-wrap gap-1">
          {[
            { value: 'all', label: 'All surveys' },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Drafts' },
          ].map((tab) => (
            <button
              key={tab.value}
              className={`filter-tab ${status === tab.value ? 'selected' : ''}`}
              onClick={() => setStatus(tab.value)}
            >
              {tab.label}
              <span>
                {state.surveys.filter((s) => tab.value === 'all' || s.status === tab.value).length}
              </span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          <input
            className="input border-transparent bg-slate-50 pl-9"
            placeholder="Search surveys…"
            aria-label="Search surveys"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <SquareStack size={14} />
          {surveys.length} {surveys.length === 1 ? 'survey' : 'surveys'}
        </span>
      </div>
      {surveys.length ? (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <SurveyTable surveys={surveys} />
        </div>
      ) : (
        <EmptyState
          title="No surveys found"
          description={
            query
              ? 'No surveys match your search. Try another title or clear your filters.'
              : 'Create a survey to get started.'
          }
          action={
            query || status !== 'all' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('');
                  setStatus('all');
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button asChild>
                <SafeLink to="/studio">
                  <Plus /> Create Survey
                </SafeLink>
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
