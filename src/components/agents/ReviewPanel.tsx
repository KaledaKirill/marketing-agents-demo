import { Check, CheckCheck, CircleCheck, ShieldCheck, X } from 'lucide-react';
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
  return (
    <section className="panel min-w-0">
      <div className="flex items-center gap-2.5">
        <span className="agent-symbol bg-violet-50 text-violet-500">
          <ShieldCheck size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Methodology review</h2>
        </div>
      </div>
      <div className="my-5 flex items-center gap-4 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
        <div className="relative flex size-16 shrink-0 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="27" fill="none" stroke="#e8e2ff" strokeWidth="4" />
            <circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              stroke="#8b6ce9"
              strokeWidth="4"
              strokeDasharray={`${review.score * 1.696} 170`}
              strokeLinecap="round"
            />
          </svg>
          <strong className="text-xl font-semibold text-violet-700">{review.score}</strong>
        </div>
        <div>
          <p className="text-xs font-semibold">Original quality score</p>
          <p className="mt-1 text-[10px] text-violet-600">
            {resolved.length} resolved · {open.length} remaining
          </p>
        </div>
      </div>
      {open.length === 0 && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
          <CircleCheck size={19} className="mb-2 text-emerald-600" />
          <h3 className="text-xs font-semibold text-emerald-800">No outstanding suggestions</h3>
        </div>
      )}
      <div className="space-y-3">
        {open.map((issue) => {
          const index = survey.questions.findIndex((q) => q.id === issue.questionId);
          return (
            <article key={issue.id} className="rounded-xl border border-border p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant={issue.severity === 'moderate' ? 'warning' : 'violet'}>
                  {issue.type}
                </Badge>
                <span className="ml-auto text-[10px] text-slate-400">Question {index + 1}</span>
              </div>
              <h3 className="text-xs font-semibold leading-5">
                {survey.questions[index]?.title ?? 'Question updated'}
              </h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{issue.explanation}</p>
              <div className="my-3 rounded-lg bg-slate-50 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-violet-600">
                  {issue.patch.kind === 'move' ? 'Suggested order' : 'Suggested wording'}
                </p>
                <p className="text-xs leading-6 text-slate-600">
                  {issue.patch.kind === 'move'
                    ? `Move question ${index + 1} to ${issue.patch.position === 'first' ? 'the beginning' : 'the end'}.`
                    : issue.patch.title}
                </p>
                <p className="mt-1 text-[10px] leading-5 text-slate-400">{issue.suggestion}</p>
              </div>
              {!readOnly && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onApply(issue.id)}>
                    <Check size={12} /> Apply Fix
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDismiss(issue.id)}>
                    <X size={12} /> Dismiss
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {resolved.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Review history
          </p>
          {resolved.map((issue) => (
            <div
              key={issue.id}
              className="flex items-center gap-2 py-2 text-[10px] text-muted-foreground"
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
