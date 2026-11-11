import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AIReview, Survey } from '@/types/research';
import { useStore } from '@/app/store';
import { useAppNavigation } from '@/app/navigation';
import { Button } from '@/components/ui/button';
import { Badge, PageHeading } from '@/components/ui/shared';
import { ReviewPanel } from '@/components/agents/ReviewPanel';
import {
  AgentWorkflow,
  ReviewProgress,
  type ResearchStage,
} from '@/components/agents/AgentWorkflow';
import { TopicIcon } from '@/components/surveys/SurveyTable';
import {
  applyReviewSuggestion,
  examplePrompts,
  generateSurvey,
  reviewSurvey,
} from '@/lib/mock-agents';
import { typeLabels } from '@/lib/survey-utils';
import { useListMotion } from '@/lib/use-list-motion';

const AGENT_DURATION_MS = 2500;

export default function StudioPage() {
  const { saveSurvey } = useStore();
  const { navigate } = useAppNavigation();
  const [objective, setObjective] = useState('');
  const [stage, setStage] = useState<ResearchStage>('idle');
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [review, setReview] = useState<AIReview | null>(null);
  const [error, setError] = useState('');
  const [checkedCount, setCheckedCount] = useState(0);
  const questionList = useListMotion(
    survey?.questions.map((q) => `${q.id}:${q.title}`).join('|') ?? '',
  );
  const run = useRef(0);
  const busy = stage === 'design' || stage === 'critic';
  useEffect(
    () => () => {
      run.current += 1;
    },
    [],
  );
  async function generate() {
    if (busy) return;
    if (objective.trim().length < 12) {
      setError('Describe your research goal in at least 12 characters.');
      return;
    }
    const current = ++run.current;
    setError('');
    setStage('design');
    setSurvey(null);
    setReview(null);
    setCheckedCount(0);
    try {
      await new Promise((resolve) => setTimeout(resolve, AGENT_DURATION_MS));
      if (run.current !== current) return;
      const draft = generateSurvey(objective);
      setSurvey(draft);
      setStage('critic');
      for (let index = 0; index < draft.questions.length; index += 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, AGENT_DURATION_MS / draft.questions.length),
        );
        if (run.current !== current) return;
        setCheckedCount(index + 1);
      }
      const result = reviewSurvey(draft);
      setReview(result);
      saveSurvey(draft, result);
      setStage('ready');
      toast.success('Survey ready');
    } catch {
      if (run.current === current) {
        setStage('error');
        setError('Could not generate this survey. Please try again.');
      }
    }
  }
  function resolveIssue(id: string, apply: boolean) {
    if (!survey || !review) return;
    const issue = review.issues.find((i) => i.id === id && i.status === 'open');
    if (!issue) return;
    const next = apply ? applyReviewSuggestion(survey, issue) : survey;
    const nextReview: AIReview = {
      ...review,
      issues: review.issues.map((i) =>
        i.id === id ? { ...i, status: apply ? 'applied' : 'dismissed' } : i,
      ),
    };
    setSurvey(next);
    setReview(nextReview);
    saveSurvey(next, nextReview);
    toast.success(apply ? 'Question updated' : 'Suggestion dismissed');
  }
  return (
    <div className="studio-page space-y-7" data-stage={stage}>
      <PageHeading
        title="AI Research Studio"
        description="Generate a survey from your objective, then review AI suggestions."
      />
      <div className="studio-workbench">
        <section className="panel objective-panel">
          <div className="brief-heading">
            <span className="brief-icon">
              <Sparkles size={18} />
            </span>
            <label htmlFor="objective" className="objective-label">
              Research objective
            </label>
          </div>
          <textarea
            id="objective"
            className="input objective-input resize-y"
            placeholder="What do you want to learn, and from whom?"
            value={objective}
            onChange={(e) => {
              setObjective(e.target.value);
              setError('');
            }}
            disabled={busy}
            maxLength={2000}
            aria-invalid={!!error}
            aria-describedby={error ? 'objective-error' : undefined}
          />
          {error && (
            <p id="objective-error" role="alert" className="mt-3 text-[13px] text-red-600">
              {error}
            </p>
          )}
          <p className="mb-3 mt-5 text-[12px] text-muted-foreground">Try an example</p>
          <div className="prompt-options">
            {examplePrompts.map((prompt) => (
              <button
                key={prompt.topic}
                className="example-prompt"
                aria-pressed={objective === prompt.objective}
                disabled={busy}
                onClick={() => {
                  setObjective(prompt.objective);
                  setError('');
                }}
              >
                <TopicIcon topic={prompt.topic as Survey['topic']} />
                <span>{prompt.label}</span>
                <ChevronRight size={13} className="shrink-0" />
              </button>
            ))}
          </div>
          <div className="objective-actions">
            <Button disabled={busy} onClick={() => void generate()}>
              {busy ? (
                <LoaderCircle className="animate-spin" />
              ) : stage === 'ready' ? (
                <RotateCcw />
              ) : (
                <Sparkles />
              )}
              {busy
                ? 'Generating…'
                : stage === 'ready'
                  ? 'Generate another draft'
                  : 'Generate Survey'}
            </Button>
          </div>
        </section>
        <AgentWorkflow
          stage={stage}
          questionCount={survey?.questions.length ?? 0}
          checkedCount={checkedCount}
          remaining={review?.issues.filter((issue) => issue.status === 'open').length ?? 0}
        />
      </div>
      {stage === 'design' && (
        <section className="panel draft-in-progress" aria-label="Survey draft in progress">
          <div className="draft-section-heading">
            <span>
              <Sparkles size={13} /> DESIGN AGENT
            </span>
            <span className="drafting-status" role="status">
              Drafting survey questions...
            </span>
          </div>
          <div className="draft-placeholder" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div
                className="draft-placeholder-question"
                key={index}
                style={{ animationDelay: `${index * 160}ms` }}
              >
                <span className="question-number">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {survey && (
        <div
          key={survey.id}
          className="studio-results grid items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
        >
          <section className="panel">
            <div className="draft-section-heading">
              <span>
                <FileText size={13} /> SURVEY DRAFT
              </span>
              <Badge variant="accent">{survey.questions.length} questions</Badge>
            </div>
            <h2 className="text-lg font-semibold">{survey.title}</h2>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{survey.description}</p>
            <div ref={questionList} className="draft-questions mt-4 divide-y divide-border">
              {survey.questions.map((q, index) => (
                <article
                  className="draft-question py-4"
                  key={q.id}
                  data-motion-key={q.id}
                  data-reviewing={stage === 'critic' && index === checkedCount}
                  data-checked={stage === 'critic' && index < checkedCount}
                  data-refined={review?.issues.some(
                    (issue) => issue.questionId === q.id && issue.status === 'applied',
                  )}
                  style={{ animationDelay: `${Math.min(index * 45, 270)}ms` }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="question-number">{String(index + 1).padStart(2, '0')}</span>
                    <Badge>{typeLabels[q.type]}</Badge>
                    {stage === 'critic' && index === checkedCount && (
                      <span className="question-review-state ml-auto">
                        <LoaderCircle size={11} className="animate-spin" /> Reviewing
                      </span>
                    )}
                    {stage === 'critic' && index < checkedCount && (
                      <span className="question-review-state ml-auto">
                        <ShieldCheck size={11} /> Checked
                      </span>
                    )}
                    {review?.issues.some(
                      (i) => i.questionId === q.id && i.status === 'applied',
                    ) && (
                      <span className="ml-auto flex items-center gap-1 text-[12px] text-emerald-600">
                        <Check size={11} /> Updated
                      </span>
                    )}
                  </div>
                  <p key={q.title} className="question-wording text-sm font-medium leading-6">
                    {q.title}
                  </p>
                  {'options' in q && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {q.options.map((option) => (
                        <span
                          key={option}
                          className="rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
          {review ? (
            <div className="space-y-4">
              <ReviewPanel
                survey={survey}
                review={review}
                onApply={(id) => resolveIssue(id, true)}
                onDismiss={(id) => resolveIssue(id, false)}
              />
              <Button className="w-full" onClick={() => navigate(`/builder/${survey.id}`)}>
                Continue to Survey Builder <ArrowRight />
              </Button>
            </div>
          ) : (
            <ReviewProgress checkedCount={checkedCount} questionCount={survey.questions.length} />
          )}
        </div>
      )}
    </div>
  );
}
