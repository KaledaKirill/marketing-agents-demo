import { Check, FileText, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ResearchStage = 'idle' | 'design' | 'critic' | 'ready' | 'error';

export function AgentWorkflow({
  stage,
  questionCount,
  checkedCount,
  remaining,
}: {
  stage: ResearchStage;
  questionCount: number;
  checkedCount: number;
  remaining: number;
}) {
  const busy = stage === 'design' || stage === 'critic';
  const steps = [
    {
      label: 'Design Agent',
      description: 'Turns your objective into survey questions.',
      icon: Sparkles,
      state:
        stage === 'design'
          ? 'working'
          : stage === 'critic' || stage === 'ready'
            ? 'done'
            : 'waiting',
      detail:
        stage === 'critic' || stage === 'ready'
          ? `${questionCount} questions drafted`
          : stage === 'design'
            ? 'Drafting questions'
            : 'Waiting for objective',
    },
    {
      label: 'Methodology Critic',
      description: 'Checks wording, bias, and question flow.',
      icon: ShieldCheck,
      state: stage === 'critic' ? 'working' : stage === 'ready' ? 'done' : 'waiting',
      detail:
        stage === 'ready'
          ? `${remaining} suggestions remaining`
          : stage === 'critic'
            ? `${checkedCount} of ${questionCount} questions checked`
            : 'Receives the survey draft',
    },
    {
      label: 'Ready to edit',
      description: 'Review suggestions and open the builder.',
      icon: FileText,
      state: stage === 'ready' ? 'done' : 'waiting',
      detail: stage === 'ready' ? 'Ready for your decisions' : 'Waiting for review',
    },
  ];
  const status = busy
    ? 'In progress'
    : stage === 'ready'
      ? 'Complete'
      : stage === 'error'
        ? 'Interrupted'
        : 'Not started';
  return (
    <aside className="workflow-panel" aria-label="Research workflow" data-stage={stage}>
      <div className="workflow-heading">
        <h2>Research workflow</h2>
        <span
          role="status"
          className={cn('workflow-status', busy && 'working', stage === 'ready' && 'done')}
        >
          {status}
        </span>
      </div>
      <ol className="workflow-steps">
        {steps.map((step, index) => (
          <li
            className="workflow-step"
            data-state={step.state}
            key={step.label}
            aria-current={step.state === 'working' ? 'step' : undefined}
          >
            <span className="workflow-step-icon" aria-hidden="true">
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
              <span className="workflow-step-state" key={step.detail}>
                {step.detail}
              </span>
            </div>
            {busy && index === 0 && (
              <span className="workflow-packet" aria-hidden="true">
                <FileText size={10} />
              </span>
            )}
          </li>
        ))}
      </ol>
      <div
        className="workflow-progress"
        role="progressbar"
        aria-label="Completed research stages"
        aria-valuemin={0}
        aria-valuemax={3}
        aria-valuenow={stage === 'ready' ? 3 : stage === 'critic' ? 1 : 0}
      >
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            data-complete={stage === 'ready' || (stage === 'critic' && index === 0)}
            data-working={
              (stage === 'design' && index === 0) || (stage === 'critic' && index === 1)
            }
          />
        ))}
      </div>
    </aside>
  );
}

export function ReviewProgress({
  checkedCount,
  questionCount,
}: {
  checkedCount: number;
  questionCount: number;
}) {
  return (
    <section className="panel review-processing" aria-label="Methodology review in progress">
      <div className="review-processing-heading">
        <span className="agent-symbol bg-teal-50 text-teal-600">
          <ShieldCheck size={18} />
        </span>
        <div>
          <h2>Methodology review</h2>
          <p>Wording, bias, and question flow</p>
        </div>
        <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
      </div>
      <div className="review-count">
        <strong>{String(checkedCount).padStart(2, '0')}</strong>
        <span>/ {String(questionCount).padStart(2, '0')} questions checked</span>
      </div>
      <div
        className="question-check-track"
        role="progressbar"
        aria-label="Questions checked"
        aria-valuemin={0}
        aria-valuemax={questionCount}
        aria-valuenow={checkedCount}
      >
        {Array.from({ length: questionCount }, (_, index) => (
          <span
            key={index}
            data-checked={index < checkedCount}
            data-current={index === checkedCount}
          />
        ))}
      </div>
      <p className="review-processing-note" role="status">
        Reviewing the draft before returning suggestions.
      </p>
    </section>
  );
}
