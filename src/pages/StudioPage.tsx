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
    <div className="space-y-6">
      <PageHeading
        title="AI Research Studio"
        description="Generate a survey from a research objective."
      />
      <section className="panel">
        <label htmlFor="objective" className="field-label">
          Research objective
        </label>
        <textarea
          id="objective"
          className="input min-h-32 resize-y text-sm leading-7"
          placeholder="What do you want to learn, and from whom?"
          value={objective}
          onChange={(e) => {
            setObjective(e.target.value);
            setError('');
          }}
          disabled={busy}
          maxLength={2000}
          aria-invalid={!!error}
        />
        {error && (
          <p role="alert" className="mt-3 text-xs text-red-600">
            {error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {examplePrompts.map((prompt) => (
            <button
              key={prompt.topic}
              className="example-prompt"
              disabled={busy}
              onClick={() => {
                setObjective(prompt.objective);
                setError('');
              }}
            >
              {prompt.label}
              <ChevronRight size={11} />
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
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
      {stage !== 'idle' && stage !== 'error' && (
        <section className="pipeline" aria-live="polite">
          {[
            {
              label: 'Design Agent',
              state: stage === 'design' ? 'working' : 'done',
              icon: Sparkles,
            },
            {
              label: 'Methodology Critic',
              state: stage === 'design' ? 'waiting' : stage === 'critic' ? 'working' : 'done',
              icon: CheckCheck,
            },
            {
              label: 'Ready to edit',
              state: stage === 'ready' ? 'done' : 'waiting',
              icon: FileText,
            },
          ].map((step, index) => (
            <div className="pipeline-step" key={step.label}>
              <span
                className={cn(
                  'pipeline-icon',
                  step.state === 'done' && 'done',
                  step.state === 'working' && 'working',
                )}
              >
                {step.state === 'working' ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : step.state === 'done' ? (
                  <Check size={18} />
                ) : (
                  <step.icon size={17} />
                )}
              </span>
              <p className="text-xs font-medium">{step.label}</p>
              {index < 2 && (
                <ArrowRight size={15} className="ml-auto hidden text-slate-300 md:block" />
              )}
            </div>
          ))}
        </section>
      )}
      {survey && (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="panel">
            <h2 className="text-lg font-semibold">{survey.title}</h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">{survey.description}</p>
            <div className="mt-4 divide-y divide-border">
              {survey.questions.map((q, index) => (
                <article className="py-4" key={q.id}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="question-number">{String(index + 1).padStart(2, '0')}</span>
                    <Badge>{typeLabels[q.type]}</Badge>
                    {review?.issues.some(
                      (i) => i.questionId === q.id && i.status === 'applied',
                    ) && (
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600">
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
                          className="rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground"
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
            <div className="panel flex items-center gap-3 text-xs text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Reviewing questions…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
