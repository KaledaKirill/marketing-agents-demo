import { Check, CheckCheck, CircleCheck, ShieldCheck, X } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import type { AIReview, Survey } from '@/types/research';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';

export function ReviewPanel({
  survey,
  review,
  onApply,
  onDismiss,
  readOnly = false,
}: {
  survey: Survey;
  review: AIReview;
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
  readOnly?: boolean;
}) {
  const open = review.issues.filter((i) => i.status === 'open');
  const resolved = review.issues.filter((i) => i.status !== 'open');
  const panel = useRef<HTMLElement>(null);
  const restoreFocus = useRef(false);
  useLayoutEffect(() => {
    if (!restoreFocus.current) return;
    restoreFocus.current = false;
    const target = panel.current?.querySelector<HTMLElement>(
      '.review-issue-slot[data-resolved="false"] button, .review-complete',
    );
    target?.focus({ preventScroll: true });
  }, [resolved.length]);
  function resolve(id: string, apply: boolean, button: HTMLButtonElement) {
    const slot = button.closest<HTMLElement>('.review-issue-slot');
    if (slot) slot.style.setProperty('--exit-height', `${slot.getBoundingClientRect().height}px`);
    restoreFocus.current = true;
    if (apply) onApply(id);
    else onDismiss(id);
  }
  return (
    <section ref={panel} className="panel review-panel min-w-0">
      <div className="flex items-center gap-2.5">
        <span className="agent-symbol bg-teal-50 text-teal-500">
          <ShieldCheck size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Methodology review</h2>
        </div>
      </div>
      <div className="my-5 flex items-center gap-4 rounded-xl border border-teal-100 bg-teal-50/50 p-4">
        <div className="relative flex size-16 shrink-0 items-center justify-center">
          <svg
            className="quality-score-ring absolute inset-0 -rotate-90"
            viewBox="0 0 64 64"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="27" fill="none" stroke="#dcece7" strokeWidth="4" />
            <circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              stroke="#187f70"
              strokeWidth="4"
              strokeDasharray={`${review.score * 1.696} 170`}
              strokeLinecap="round"
              className="quality-score-value"
            />
          </svg>
          <strong className="text-xl font-semibold text-teal-700">{review.score}</strong>
        </div>
        <div>
          <p className="text-[13px] font-semibold">Original quality score</p>
          <p className="mt-1 text-[12px] text-teal-600">
            {resolved.length} resolved · {open.length} remaining
          </p>
        </div>
      </div>
      <div
        className="review-resolution-track"
        role="progressbar"
        aria-label="Resolved suggestions"
        aria-valuemin={0}
        aria-valuemax={Math.max(1, review.issues.length)}
        aria-valuenow={resolved.length}
      >
        <span
          style={{
            width: `${review.issues.length ? (resolved.length / review.issues.length) * 100 : 100}%`,
          }}
        />
      </div>
      {open.length === 0 && (
        <div
          tabIndex={-1}
          className="review-complete rounded-lg border border-emerald-100 bg-emerald-50/60 p-4"
          role="status"
        >
          <CircleCheck size={19} className="mb-2 text-emerald-600" />
          <h3 className="text-[13px] font-semibold text-emerald-800">No outstanding suggestions</h3>
        </div>
      )}
      <div className="review-issues">
        {review.issues.map((issue) => {
          const index = survey.questions.findIndex((q) => q.id === issue.questionId);
          return (
            <div
              key={issue.id}
              className="review-issue-slot"
              data-resolved={issue.status !== 'open'}
              aria-hidden={issue.status !== 'open'}
              inert={issue.status !== 'open'}
            >
              <div className="review-issue-clip">
                {issue.status === 'open' ? (
                  <article className="review-issue">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge variant={issue.severity === 'moderate' ? 'warning' : 'accent'}>
                        {issue.type}
                      </Badge>
                      <span className="ml-auto text-[12px] text-slate-400">
                        Question {index + 1}
                      </span>
                    </div>
                    <h3 className="text-[13px] font-semibold leading-5">
                      {survey.questions[index]?.title ?? 'Question updated'}
                    </h3>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                      {issue.explanation}
                    </p>
                    <div className="my-3 rounded-lg bg-slate-50 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-teal-600">
                        {issue.patch.kind === 'move' ? 'Suggested order' : 'Suggested wording'}
                      </p>
                      <p className="text-[13px] leading-6 text-slate-600">
                        {issue.patch.kind === 'move'
                          ? `Move question ${index + 1} to ${issue.patch.position === 'first' ? 'the beginning' : 'the end'}.`
                          : issue.patch.title}
                      </p>
                      <p className="mt-1 text-[12px] leading-5 text-slate-400">
                        {issue.suggestion}
                      </p>
                    </div>
                    {!readOnly && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(event) => resolve(issue.id, true, event.currentTarget)}
                        >
                          <Check size={12} /> Apply Fix
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(event) => resolve(issue.id, false, event.currentTarget)}
                        >
                          <X size={12} /> Dismiss
                        </Button>
                      </div>
                    )}
                  </article>
                ) : (
                  <div className="resolved-issue-space" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {resolved.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
            Review history
          </p>
          {resolved.map((issue) => (
            <div
              key={issue.id}
              className="review-history-item flex items-center gap-2 py-2 text-[12px] text-muted-foreground"
            >
              <CheckCheck
                size={13}
                className={issue.status === 'applied' ? 'text-emerald-500' : 'text-slate-400'}
              />
              <span className="capitalize">{issue.type}</span>
              <span className="ml-auto capitalize">{issue.status}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
