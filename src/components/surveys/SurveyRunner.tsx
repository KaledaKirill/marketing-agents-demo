import { useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3 } from 'lucide-react';
import type { Answer, Question, Survey, SurveyResponse } from '@/types/research';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { validateAnswer } from '@/lib/survey-utils';
import { cn, uid } from '@/lib/utils';
import { useConfirm } from '@/components/ui/confirm';

export function QuestionInput({
  question,
  answer,
  onChange,
  invalid = false,
}: {
  question: Question;
  answer?: Answer;
  onChange: (answer: Answer) => void;
  invalid?: boolean;
}) {
  const id = useId();
  if (question.type === 'text')
    return (
      <div>
        <label className="sr-only" htmlFor={id}>
          {question.title}
        </label>
        {question.multiline ? (
          <textarea
            id={id}
            className="input min-h-32 resize-y"
            placeholder="Share your thoughts…"
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={invalid}
            maxLength={5000}
          />
        ) : (
          <input
            id={id}
            className="input"
            placeholder="Your answer…"
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={invalid}
            maxLength={5000}
          />
        )}
        <p className="mt-2 text-right text-xs text-muted-foreground">
          {typeof answer === 'string' ? answer.length : 0} / 5,000
        </p>
      </div>
    );
  if (question.type === 'rating')
    return (
      <fieldset aria-invalid={invalid}>
        <legend className="sr-only">{question.title}</legend>
        <div className="grid grid-cols-5 gap-2.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className={cn('rating-choice', answer === value && 'selected')}>
              <input
                type="radio"
                name={id}
                value={value}
                checked={answer === value}
                onChange={() => onChange(value)}
                className="rating-input"
              />
              <span>{value}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <span>Low</span>
          <span>High</span>
        </div>
      </fieldset>
    );
  return (
    <fieldset className="space-y-2.5" aria-invalid={invalid}>
      <legend className="sr-only">{question.title}</legend>
      {question.options.map((option, index) => {
        const checked =
          question.type === 'multiple_choice'
            ? Array.isArray(answer) && answer.includes(option)
            : answer === option;
        return (
          <label key={index} className={cn('answer-choice', checked && 'selected')}>
            <input
              type={question.type === 'multiple_choice' ? 'checkbox' : 'radio'}
              name={id}
              checked={checked}
              onChange={() =>
                question.type === 'single_choice'
                  ? onChange(option)
                  : onChange(
                      checked
                        ? (Array.isArray(answer) ? answer : []).filter((a) => a !== option)
                        : [...(Array.isArray(answer) ? answer : []), option],
                    )
              }
            />
            <span className="flex-1">{option}</span>
            {checked && <Check className="size-4 text-primary" />}
          </label>
        );
      })}
    </fieldset>
  );
}

export function SurveyRunner({
  survey,
  preview = false,
  onSubmit,
}: {
  survey: Survey;
  preview?: boolean;
  onSubmit?: (response: SurveyResponse) => void;
}) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const attempt = useRef(uid());
  const submitted = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const confirm = useConfirm();
  const question = survey.questions[index];
  function focusHeading() {
    requestAnimationFrame(() => heading.current?.focus());
  }
  if (done)
    return (
      <div className="runner-complete py-10 text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={30} strokeWidth={1.6} />
        </div>
        <h1 className="mt-3 text-3xl">{preview ? 'Preview complete' : 'Thank you.'}</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
          {preview ? 'No response was saved.' : 'Your response has been saved.'}
        </p>
      </div>
    );
  if (!question)
    return (
      <p className="text-sm text-muted-foreground">
        This survey has no questions yet. Add a question in the builder to preview it.
      </p>
    );
  if (!started)
    return (
      <div className="py-4 sm:py-7">
        <h1 className="text-3xl leading-tight sm:text-4xl">{survey.title}</h1>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">
          {survey.description || 'Share your thoughts in this short research study.'}
        </p>
        <div className="my-7 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock3 size={14} /> About {Math.max(1, Math.ceil(survey.questions.length / 3))} minutes
          </span>
          <span>{survey.questions.length} questions</span>
        </div>
        <Button
          size="lg"
          onClick={() => {
            setStarted(true);
            focusHeading();
          }}
        >
          Start survey <ArrowRight />
        </Button>
        <p className="mt-5 text-[11px] leading-5 text-muted-foreground">
          {preview
            ? 'Preview mode · Answers will not be saved.'
            : 'Answers are stored in this browser.'}
        </p>
      </div>
    );
  const next = async () => {
    if (!validateAnswer(question, answers[question.id])) {
      setError(true);
      return;
    }
    if (index < survey.questions.length - 1) {
      setIndex(index + 1);
      setError(false);
      focusHeading();
      return;
    }
    if (
      !(await confirm({
        title: preview ? 'Finish this preview?' : 'Submit your response?',
        description: preview
          ? 'You can return to the builder after finishing. No answers will be saved.'
          : 'Your answers will be saved locally in this browser. You can go back to review them before submitting.',
        action: preview ? 'Finish preview' : 'Submit response',
      }))
    )
      return;
    if (submitted.current) return;
    submitted.current = true;
    if (!preview)
      onSubmit?.({
        id: attempt.current,
        surveyId: survey.id,
        answers,
        submittedAt: new Date().toISOString(),
      });
    setDone(true);
  };
  return (
    <div className="py-2">
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Question {index + 1} of {survey.questions.length}
        </span>
        <span>{Math.round((index / survey.questions.length) * 100)}% completed</span>
      </div>
      <div
        className="mb-9 h-1.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="Survey progress"
        aria-valuemin={0}
        aria-valuemax={survey.questions.length}
        aria-valuenow={index}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(index / survey.questions.length) * 100}%` }}
        />
      </div>
      <h2
        ref={heading}
        tabIndex={-1}
        className="mb-3 text-xl font-semibold leading-8 tracking-tight outline-none sm:text-2xl"
      >
        {question.title}{' '}
        {question.required && (
          <span className="text-primary" aria-label="required">
            *
          </span>
        )}
      </h2>
      <p className="mb-6 text-sm leading-6 text-muted-foreground">
        {question.description ||
          (question.type === 'multiple_choice'
            ? 'Select all that apply.'
            : question.required
              ? 'Please select or enter an answer to continue.'
              : 'Optional · You can skip this question.')}
      </p>
      <QuestionInput
        question={question}
        answer={answers[question.id]}
        invalid={error}
        onChange={(answer) => {
          setAnswers({ ...answers, [question.id]: answer });
          setError(false);
        }}
      />
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          Please answer this question before continuing.
        </p>
      )}
      <div className="mt-9 flex items-center justify-between border-t border-border pt-5">
        <Button
          variant="ghost"
          onClick={() => {
            if (index === 0) setStarted(false);
            else setIndex(index - 1);
            setError(false);
            focusHeading();
          }}
        >
          <ArrowLeft /> Back
        </Button>
        <Button onClick={() => void next()}>
          {index === survey.questions.length - 1
            ? preview
              ? 'Finish preview'
              : 'Submit response'
            : 'Next question'}
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

export function PreviewDialog({
  survey,
  open,
  onOpenChange,
}: {
  survey: Survey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Survey preview"
        description="Explore the respondent experience. Preview answers are never saved."
        className="max-w-2xl"
      >
        <div className="border-t border-border pt-4">
          <SurveyRunner key={`${survey.id}-${open}`} survey={survey} preview />
        </div>
      </DialogContent>
    </Dialog>
  );
}
