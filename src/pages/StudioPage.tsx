import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  FileText,
  LoaderCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AIReview, Survey } from '@/types/research';
import { useStore } from '@/app/store';
import { useAppNavigation } from '@/app/navigation';
import { Button } from '@/components/ui/button';
import { Badge, PageHeading } from '@/components/ui/shared';
import { ReviewPanel } from '@/components/agents/ReviewPanel';
import { TopicIcon } from '@/components/surveys/SurveyTable';
import {
  applyReviewSuggestion,
  examplePrompts,
  generateSurvey,
  reviewSurvey,
} from '@/lib/mock-agents';
import { typeLabels } from '@/lib/survey-utils';
import { cn } from '@/lib/utils';

type Stage = 'idle' | 'design' | 'critic' | 'ready' | 'error';
export default function StudioPage() {
  const { saveSurvey } = useStore();
  const { navigate } = useAppNavigation();
  const [objective, setObjective] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [review, setReview] = useState<AIReview | null>(null);
  const [error, setError] = useState('');
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
    try {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      if (run.current !== current) return;
      const draft = generateSurvey(objective);
      setSurvey(draft);
      setStage('critic');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (run.current !== current) return;
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
    <div className="studio-page space-y-7">
      <PageHeading
        title="AI Research Studio"
        description="Generate a survey from a research objective."
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
        <aside className="workflow-panel" aria-label="Research workflow" aria-live="polite">
          <div className="workflow-heading">
            <h2>Research workflow</h2>
            <span className={cn('workflow-status', busy && 'working', stage === 'ready' && 'done')}>
              {busy ? 'In progress' : stage === 'ready' ? 'Complete' : 'Not started'}
            </span>
          </div>
          <ol className="workflow-steps">
            {[
              {
                label: 'Design Agent',
                description: 'Turns your objective into survey questions.',
                state:
                  stage === 'design'
                    ? 'working'
                    : stage === 'critic' || stage === 'ready'
                      ? 'done'
                      : 'waiting',
                icon: Sparkles,
              },
              {
                label: 'Methodology Critic',
                description: 'Checks wording, bias, and question flow.',
                state: stage === 'critic' ? 'working' : stage === 'ready' ? 'done' : 'waiting',
                icon: CheckCheck,
              },
              {
                label: 'Ready to edit',
                description: 'Review suggestions and open the builder.',
                state: stage === 'ready' ? 'done' : 'waiting',
                icon: FileText,
              },
            ].map((step) => (
              <li className="workflow-step" data-state={step.state} key={step.label}>
                <span className="workflow-step-icon">
                  {step.state === 'working' ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : step.state === 'done' ? (
                    <Check size={17} />
                  ) : (
                    <step.icon size={17} />
                  )}
                </span>
                <div>
                  <h3>{step.label}</h3>
                  <p>{step.description}</p>
                  <span className="workflow-step-state">
                    {step.state === 'working'
                      ? 'Working'
                      : step.state === 'done'
                        ? 'Complete'
                        : 'Waiting'}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
      {survey && (
        <div className="studio-results grid items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <section className="panel">
            <h2 className="text-lg font-semibold">{survey.title}</h2>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{survey.description}</p>
            <div className="mt-4 divide-y divide-border">
              {survey.questions.map((q, index) => (
                <article className="py-4" key={q.id}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="question-number">{String(index + 1).padStart(2, '0')}</span>
                    <Badge>{typeLabels[q.type]}</Badge>
                    {review?.issues.some(
                      (i) => i.questionId === q.id && i.status === 'applied',
                    ) && (
                      <span className="ml-auto flex items-center gap-1 text-[12px] text-emerald-600">
                        <Check size={11} /> Updated
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium leading-6">{q.title}</p>
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
            <div className="panel flex items-center gap-3 text-[13px] text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Reviewing questions…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
