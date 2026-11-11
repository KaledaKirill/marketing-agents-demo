import type { AIReview, Answer, Question, QuestionType, Survey } from '@/types/research';
import { newQuestion, reviewSurvey } from './mock-agents';
import { uid } from './utils';

export const typeLabels: Record<QuestionType, string> = {
  single_choice: 'Single choice',
  multiple_choice: 'Multiple choice',
  text: 'Text response',
  rating: 'Rating scale',
  nps: 'NPS (0–10)',
};
export function changeQuestionType(question: Question, type: QuestionType): Question {
  const changed = newQuestion(type, question.order, question.title);
  const base = {
    ...changed,
    id: question.id,
    description:
      !question.description || /^(?:0|1) = .+; (?:5|10) = .+\.$/.test(question.description)
        ? changed.description
        : question.description,
    required: question.required,
  };
  if ((base.type === 'single_choice' || base.type === 'multiple_choice') && 'options' in question)
    return { ...base, options: [...question.options] };
  return base;
}
export function validateSurvey(survey: Survey): string[] {
  const errors: string[] = [];
  if (!survey.title.trim()) errors.push('Give your survey a title.');
  if (!survey.questions.length) errors.push('Add at least one question.');
  survey.questions.forEach((q, i) => {
    if (!q.title.trim()) errors.push(`Question ${i + 1} needs a title.`);
    if (
      'options' in q &&
      (q.options.length < 2 ||
        q.options.some((o) => !o.trim()) ||
        new Set(q.options.map((o) => o.trim().toLowerCase())).size !== q.options.length)
    )
      errors.push(`Question ${i + 1} needs at least two distinct, nonempty options.`);
  });
  return errors;
}
export function validateAnswer(question: Question, answer?: Answer): boolean {
  if (answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0))
    return !question.required;
  if (question.type === 'rating' || question.type === 'nps')
    return (
      typeof answer === 'number' &&
      Number.isInteger(answer) &&
      answer >= question.min &&
      answer <= question.max
    );
  if (question.type === 'text')
    return typeof answer === 'string' && (!!answer.trim() || !question.required);
  if (question.type === 'single_choice')
    return typeof answer === 'string' && question.options.includes(answer);
  return (
    Array.isArray(answer) &&
    new Set(answer).size === answer.length &&
    answer.every((a) => question.options.includes(a))
  );
}
export function reorderQuestions(
  questions: Question[],
  index: number,
  direction: -1 | 1,
): Question[] {
  return moveQuestionToIndex(questions, index, index + direction);
}
export function moveQuestionToIndex(questions: Question[], from: number, to: number): Question[] {
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 0 ||
    from >= questions.length ||
    to < 0 ||
    to >= questions.length ||
    from === to
  )
    return questions;
  const result = [...questions];
  const [question] = result.splice(from, 1);
  result.splice(to, 0, question);
  return result.map((q, order) => ({ ...q, order }));
}
export function copyToDraft(source: Survey): { survey: Survey; review: AIReview } {
  const now = new Date().toISOString();
  const survey: Survey = {
    ...structuredClone(source),
    id: uid(),
    slug: '',
    title: `${source.title} (copy)`,
    status: 'draft',
    seeded: false,
    publishedAt: undefined,
    createdAt: now,
    updatedAt: now,
    questions: source.questions.map((q) => ({ ...structuredClone(q), id: uid() })),
  };
  return { survey, review: reviewSurvey(survey) };
}
export function publishSurvey(survey: Survey, surveys: Survey[]): Survey {
  const errors = validateSurvey(survey);
  if (errors.length) throw new Error(errors.join(' '));
  if (survey.status === 'published') return survey;
  const base =
    survey.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'survey';
  let slug = base;
  let suffix = 2;
  while (surveys.some((s) => s.id !== survey.id && s.slug === slug)) slug = `${base}-${suffix++}`;
  const now = new Date().toISOString();
  return { ...survey, status: 'published', slug, publishedAt: now, updatedAt: now };
}
export function supersedeIssues(
  review: AIReview | undefined,
  questionId: string,
): AIReview | undefined {
  if (!review) return undefined;
  return {
    ...review,
    issues: review.issues.map((issue) =>
      issue.questionId === questionId && issue.status === 'open'
        ? { ...issue, status: 'superseded' }
        : issue,
    ),
  };
}

export function supersedeFlowIssues(review: AIReview | undefined): AIReview | undefined {
  if (!review) return undefined;
  return {
    ...review,
    issues: review.issues.map((issue) =>
      issue.type === 'flow' && issue.status === 'open' ? { ...issue, status: 'superseded' } : issue,
    ),
  };
}
