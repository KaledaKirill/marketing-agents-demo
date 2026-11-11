import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Check,
  ChevronDown,
  CircleDot,
  CopyPlus,
  Eye,
  FileText,
  GripVertical,
  Link2,
  ListChecks,
  LockKeyhole,
  Plus,
  Rocket,
  Save,
  Star,
  Trash2,
  Type,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AIReview, Question, QuestionType, Survey } from '@/types/research';
import { useStore } from '@/app/store';
import { SafeLink, useAppNavigation } from '@/app/navigation';
import { Button } from '@/components/ui/button';
import { Badge, Breadcrumb, EmptyState, MissingState, StatusBadge } from '@/components/ui/shared';
import { useConfirm } from '@/components/ui/confirm';
import { ReviewPanel } from '@/components/agents/ReviewPanel';
import { PreviewDialog } from '@/components/surveys/SurveyRunner';
import { ShareDialog } from '@/components/surveys/ShareDialog';
import { applyReviewSuggestion, newQuestion } from '@/lib/mock-agents';
import {
  changeQuestionType,
  copyToDraft,
  publishSurvey,
  reorderQuestions,
  supersedeIssues,
  supersedeFlowIssues,
  typeLabels,
  validateSurvey,
} from '@/lib/survey-utils';
import { cn } from '@/lib/utils';

const questionIcons = {
  single_choice: CircleDot,
  multiple_choice: ListChecks,
  text: Type,
  rating: Star,
  nps: BarChart3,
};
const questionTypes = Object.keys(typeLabels) as QuestionType[];
export default function BuilderPage() {
  const { id } = useParams();
  const { state } = useStore();
  const survey = state.surveys.find((s) => s.id === id);
  if (!survey) return <MissingState />;
  return (
    <BuilderEditor
      key={survey.id}
      source={survey}
      initialReview={state.reviews.find((r) => r.surveyId === id)}
    />
  );
}
function BuilderEditor({ source, initialReview }: { source: Survey; initialReview?: AIReview }) {
  const { state, saveSurvey } = useStore();
  const { navigate, setDirty } = useAppNavigation();
  const confirm = useConfirm();
  const [buffer, setBuffer] = useState(() => structuredClone(source));
  const [review, setReview] = useState(() => structuredClone(initialReview));
  const [baseline, setBaseline] = useState(() => JSON.stringify([source, initialReview]));
  const [selectedId, setSelectedId] = useState(source.questions[0]?.id ?? '');
  const [preview, setPreview] = useState(false);
  const [share, setShare] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const readOnly = buffer.status === 'published';
  const dirty = !readOnly && JSON.stringify([buffer, review]) !== baseline;
  const selected = buffer.questions.find((q) => q.id === selectedId);
  const selectedIndex = buffer.questions.findIndex((q) => q.id === selectedId);
  useEffect(() => {
    setDirty(dirty);
  }, [dirty, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);
  function updateQuestion(next: Question) {
    if (readOnly) return;
    setBuffer((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === next.id ? next : q)),
    }));
    setReview((prev) => supersedeIssues(prev, next.id));
    setErrors([]);
  }
  function add(type: QuestionType) {
    const question = newQuestion(type, buffer.questions.length, '');
    setBuffer({ ...buffer, questions: [...buffer.questions, question] });
    setSelectedId(question.id);
    setErrors([]);
  }
  function moveQuestion(index: number, direction: -1 | 1) {
    setBuffer({ ...buffer, questions: reorderQuestions(buffer.questions, index, direction) });
    setReview(supersedeFlowIssues(review));
  }
  async function remove(question: Question) {
    if (
      !(await confirm({
        title: 'Delete this question?',
        description: `“${question.title || 'Untitled question'}” and its answer options will be removed from this draft.`,
        action: 'Delete question',
        destructive: true,
      }))
    )
      return;
    const remaining = buffer.questions
      .filter((q) => q.id !== question.id)
      .map((q, order) => ({ ...q, order }));
    setBuffer({ ...buffer, questions: remaining });
    setReview(supersedeIssues(review, question.id));
    setSelectedId(remaining[Math.min(selectedIndex, remaining.length - 1)]?.id ?? '');
    toast.success('Question removed');
  }
  function save() {
    const validation = validateSurvey(buffer);
    setErrors(validation);
    if (validation.length) {
      toast.error(validation[0]);
      return;
    }
    const next = { ...buffer, updatedAt: new Date().toISOString() };
    saveSurvey(next, review);
    setBuffer(next);
    setBaseline(JSON.stringify([next, review]));
    setDirty(false);
    toast.success('Draft saved in this browser');
  }
  async function publish() {
    const validation = validateSurvey(buffer);
    setErrors(validation);
    if (validation.length) {
      toast.error(validation[0]);
      return;
    }
    const remaining = review?.issues.filter((i) => i.status === 'open').length ?? 0;
    if (
      !(await confirm({
        title: 'Ready to publish?',
        description: `Published surveys are locked; future edits create a draft copy.${remaining ? ` ${remaining} critic suggestion${remaining === 1 ? '' : 's'} remain open.` : ''} This survey link only works in this browser.`,
        action: 'Publish survey',
      }))
    )
      return;
    const next = publishSurvey(buffer, state.surveys);
    saveSurvey(next, review);
    setBuffer(next);
    setBaseline(JSON.stringify([next, review]));
    setDirty(false);
    setShare(true);
    toast.success('Your survey is published');
  }
  function copy() {
    const next = copyToDraft(buffer);
    saveSurvey(next.survey, next.review);
    navigate(`/builder/${next.survey.id}`, true);
    toast.success('Your draft copy is ready');
  }
  function resolveIssue(id: string, apply: boolean) {
    if (!review || readOnly) return;
    const issue = review.issues.find((i) => i.id === id && i.status === 'open');
    if (!issue) return;
    if (apply) setBuffer(applyReviewSuggestion(buffer, issue));
    setReview({
      ...review,
      issues: review.issues.map((i) =>
        i.id === id ? { ...i, status: apply ? 'applied' : 'dismissed' } : i,
      ),
    });
    toast.success(apply ? 'Suggestion applied to your draft' : 'Suggestion dismissed');
  }
  const addMenu = (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <Button variant="outline" className="w-full border-dashed text-primary">
          <Plus /> Add question <ChevronDown className="ml-auto" />
        </Button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content className="dropdown-content w-56" align="start" sideOffset={6}>
          {questionTypes.map((type) => {
            const Icon = questionIcons[type];
            return (
              <Dropdown.Item key={type} className="dropdown-item" onSelect={() => add(type)}>
                <Icon size={15} />
                {typeLabels[type]}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
  return (
    <div className="space-y-6">
      <Breadcrumb>{buffer.title || 'Untitled survey'}</Breadcrumb>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge status={buffer.status} />
          </div>
          <h1 className="max-w-2xl text-2xl">{buffer.title || 'Untitled survey'}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            {dirty ? (
              <>
                <span className="size-1.5 rounded-full bg-amber-400" /> Unsaved changes
              </>
            ) : (
              <>
                <Check size={12} className="text-emerald-500" /> Saved in this browser
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPreview(true)}>
            <Eye /> Preview
          </Button>
          {readOnly ? (
            <>
              <Button variant="outline" onClick={() => setShare(true)}>
                <Link2 /> View link
              </Button>
              <Button onClick={copy}>
                <CopyPlus /> Edit a copy
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={save}>
                <Save /> Save Draft
              </Button>
              <Button onClick={() => void publish()}>
                <Rocket /> Publish
              </Button>
            </>
          )}
        </div>
      </header>
      {readOnly && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <LockKeyhole className="size-4 text-indigo-500" />
          <p className="flex-1 text-xs leading-6 text-indigo-900">
            Published survey. Create a draft copy to make changes.
          </p>
          <Button asChild size="sm" variant="ghost">
            <SafeLink to={`/analytics/${buffer.id}`}>
              <BarChart3 /> View analytics
            </SafeLink>
          </Button>
        </div>
      )}
      {errors.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs leading-6 text-red-700"
        >
          <p className="mb-1 font-semibold">Check these fields</p>
          <ul className="list-inside list-disc">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <section className="panel">
        <div className="mb-5 flex items-center gap-2">
          <FileText size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold">Study details</h2>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <div>
            <label htmlFor="survey-title" className="field-label">
              Survey title <span className="text-primary">*</span>
            </label>
            <input
              id="survey-title"
              className="input"
              value={buffer.title}
              disabled={readOnly}
              maxLength={200}
              onChange={(e) => {
                setBuffer({ ...buffer, title: e.target.value });
                setErrors([]);
              }}
            />
          </div>
          <div>
            <label htmlFor="survey-description" className="field-label">
              Introduction
            </label>
            <textarea
              id="survey-description"
              className="input min-h-10 resize-y"
              rows={2}
              value={buffer.description}
              disabled={readOnly}
              maxLength={2000}
              onChange={(e) => setBuffer({ ...buffer, description: e.target.value })}
            />
          </div>
        </div>
      </section>
      <div className="grid items-start gap-5 xl:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="panel p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold">Questions</h2>
            <Badge>{buffer.questions.length}</Badge>
          </div>
          <div className="space-y-2">
            {buffer.questions.map((q, index) => {
              const Icon = questionIcons[q.type];
              return (
                <div
                  key={q.id}
                  className={cn('question-list-item', selectedId === q.id && 'selected')}
                >
                  <button
                    className="flex min-w-0 flex-1 items-start gap-2.5 p-3 text-left"
                    onClick={() => setSelectedId(q.id)}
                    aria-pressed={selectedId === q.id}
                  >
                    <span className="mt-0.5 text-[10px] text-slate-400">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-xs font-medium leading-5">
                        {q.title || 'Untitled question'}
                      </span>
                      <span className="mt-1.5 flex items-center gap-1 text-[9px] text-slate-400">
                        <Icon size={10} />
                        {typeLabels[q.type]}
                      </span>
                    </span>
                  </button>
                  {!readOnly && selectedId === q.id && (
                    <div className="flex flex-col justify-center border-l border-indigo-100 px-1">
                      <button
                        className="reorder-button"
                        aria-label={`Move question ${index + 1} up`}
                        disabled={index === 0}
                        onClick={() => moveQuestion(index, -1)}
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        className="reorder-button"
                        aria-label={`Move question ${index + 1} down`}
                        disabled={index === buffer.questions.length - 1}
                        onClick={() => moveQuestion(index, 1)}
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!readOnly && <div className="mt-4">{addMenu}</div>}
          <p className="mt-4 text-[10px] leading-5 text-slate-400">
            {readOnly
              ? 'Published questions are locked.'
              : 'Select a question to edit. Use the arrows to adjust the flow.'}
          </p>
        </aside>
        {selected ? (
          <section className="panel p-5 sm:p-6">
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="question-number">
                  {String(selectedIndex + 1).padStart(2, '0')}
                </span>
                <h2 className="text-sm font-semibold">
                  {readOnly ? 'Question details' : 'Edit question'}
                </h2>
              </div>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete selected question"
                  onClick={() => void remove(selected)}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
            <div className="space-y-5">
              <div>
                <label className="field-label" htmlFor="question-title">
                  Question wording <span className="text-primary">*</span>
                </label>
                <textarea
                  id="question-title"
                  className="input min-h-24 resize-y text-sm leading-6"
                  value={selected.title}
                  disabled={readOnly}
                  maxLength={1000}
                  onChange={(e) => updateQuestion({ ...selected, title: e.target.value })}
                  placeholder="What would you like to ask?"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="question-description">
                  Helper text <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="question-description"
                  className="input"
                  placeholder="Add context or instructions for your respondent"
                  value={selected.description}
                  disabled={readOnly}
                  maxLength={1000}
                  onChange={(e) => updateQuestion({ ...selected, description: e.target.value })}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="question-type">
                    Answer type
                  </label>
                  <select
                    id="question-type"
                    className="input"
                    value={selected.type}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateQuestion(changeQuestionType(selected, e.target.value as QuestionType))
                    }
                  >
                    {questionTypes.map((type) => (
                      <option key={type} value={type}>
                        {typeLabels[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2.5 text-xs">
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={selected.required}
                      disabled={readOnly}
                      onChange={(e) => updateQuestion({ ...selected, required: e.target.checked })}
                    />
                    <span>Required question</span>
                  </label>
                </div>
              </div>
              {'options' in selected && (
                <div>
                  <p className="field-label">Answer options</p>
                  <p className="mb-3 text-[10px] text-muted-foreground">
                    At least two distinct options. Keep each answer clear and specific.
                  </p>
                  <div className="space-y-2">
                    {selected.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <GripVertical size={14} className="shrink-0 text-slate-300" />
                        <span
                          className={cn(
                            'size-3.5 shrink-0 border border-slate-300',
                            selected.type === 'single_choice' ? 'rounded-full' : 'rounded',
                          )}
                        />
                        <input
                          className="input"
                          aria-label={`Option ${index + 1}`}
                          value={option}
                          disabled={readOnly}
                          maxLength={300}
                          onChange={(e) =>
                            updateQuestion({
                              ...selected,
                              options: selected.options.map((item, i) =>
                                i === index ? e.target.value : item,
                              ),
                            })
                          }
                        />
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-slate-400"
                            aria-label={`Remove option ${index + 1}`}
                            disabled={selected.options.length <= 2}
                            onClick={() =>
                              updateQuestion({
                                ...selected,
                                options: selected.options.filter((_, i) => i !== index),
                              })
                            }
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-primary"
                      onClick={() =>
                        updateQuestion({
                          ...selected,
                          options: [...selected.options, `Option ${selected.options.length + 1}`],
                        })
                      }
                    >
                      <Plus size={12} /> Add option
                    </Button>
                  )}
                </div>
              )}
              {(selected.type === 'rating' || selected.type === 'nps') && (
                <div className="rounded-xl border border-dashed border-border bg-slate-50/50 p-5">
                  <p className="mb-4 text-xs text-muted-foreground">
                    {selected.type === 'nps'
                      ? 'Recommendation score from 0 (not at all likely) to 10 (extremely likely).'
                      : 'Respondents choose a rating from 1 to 5.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(
                      { length: selected.max - selected.min + 1 },
                      (_, i) => selected.min + i,
                    ).map((n) => (
                      <span
                        key={n}
                        className="flex size-10 items-center justify-center rounded-lg border border-border bg-white text-sm text-slate-500"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selected.type === 'text' && (
                <div>
                  <label className="mb-3 flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      className="accent-indigo-600"
                      checked={selected.multiline}
                      disabled={readOnly}
                      onChange={(e) => updateQuestion({ ...selected, multiline: e.target.checked })}
                    />
                    Allow a longer answer
                  </label>
                  <div
                    className={cn(
                      'rounded-lg border border-dashed border-border bg-slate-50 p-3 text-xs text-slate-400',
                      selected.multiline && 'min-h-24',
                    )}
                  >
                    Your respondent’s answer will go here…
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <span className="text-[10px] text-muted-foreground">
                Question {selectedIndex + 1} of {buffer.questions.length}
              </span>
              {selectedIndex < buffer.questions.length - 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedId(buffer.questions[selectedIndex + 1].id)}
                >
                  Next question <ArrowDown size={12} />
                </Button>
              )}
            </div>
          </section>
        ) : (
          <EmptyState
            title="Your next question starts here"
            description="Add a question to give your study its first direction."
            action={
              !readOnly && (
                <Button onClick={() => add('single_choice')}>
                  <Plus /> Add your first question
                </Button>
              )
            }
          />
        )}
      </div>
      {review && (
        <ReviewPanel
          survey={buffer}
          review={review}
          onApply={(id) => resolveIssue(id, true)}
          onDismiss={(id) => resolveIssue(id, false)}
          readOnly={readOnly}
        />
      )}
      <div className="flex justify-between">
        <Button asChild variant="ghost">
          <SafeLink to="/surveys">
            <ArrowLeft /> Back to surveys
          </SafeLink>
        </Button>
        {!readOnly && (
          <Button variant="outline" onClick={save}>
            <Save /> Save Draft
          </Button>
        )}
      </div>
      <PreviewDialog survey={buffer} open={preview} onOpenChange={setPreview} />
      {readOnly && <ShareDialog survey={buffer} open={share} onOpenChange={setShare} />}
    </div>
  );
}
