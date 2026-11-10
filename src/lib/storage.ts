import type { DemoState } from '@/types/research';
import { createSeed } from '@/data/seed';
import { refreshLegacyDrafts } from './mock-agents';
export const STORAGE_KEY = 'intergam-research-os';
type Store = Pick<Storage, 'getItem' | 'setItem'>;
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === 'string');
const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v));

export function isDemoState(value: unknown): value is DemoState {
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.surveys) ||
    !Array.isArray(value.responses) ||
    !Array.isArray(value.reviews) ||
    !record(value.preferences) ||
    typeof value.preferences.sidebarCollapsed !== 'boolean'
  )
    return false;
  const surveysValid = value.surveys.every(
    (s) =>
      record(s) &&
      typeof s.id === 'string' &&
      typeof s.slug === 'string' &&
      typeof s.title === 'string' &&
      typeof s.description === 'string' &&
      typeof s.objective === 'string' &&
      ['draft', 'published'].includes(s.status as string) &&
      ['ev', 'smartphone', 'brand', 'general'].includes(s.topic as string) &&
      date(s.createdAt) &&
      date(s.updatedAt) &&
      Array.isArray(s.questions) &&
      s.questions.every(
        (q) =>
          record(q) &&
          typeof q.id === 'string' &&
          typeof q.title === 'string' &&
          typeof q.description === 'string' &&
          typeof q.required === 'boolean' &&
          Number.isInteger(q.order) &&
          ((q.type === 'text' && typeof q.multiline === 'boolean') ||
            (q.type === 'rating' && q.min === 1 && q.max === 5) ||
            (['single_choice', 'multiple_choice'].includes(q.type as string) &&
              strings(q.options))),
      ),
  );
  const responsesValid = value.responses.every(
    (r) =>
      record(r) &&
      typeof r.id === 'string' &&
      typeof r.surveyId === 'string' &&
      date(r.submittedAt) &&
      record(r.answers) &&
      Object.values(r.answers).every(
        (a) => typeof a === 'string' || (typeof a === 'number' && Number.isFinite(a)) || strings(a),
      ),
  );
  const reviewsValid = value.reviews.every(
    (r) =>
      record(r) &&
      typeof r.surveyId === 'string' &&
      typeof r.score === 'number' &&
      Number.isFinite(r.score) &&
      date(r.reviewedAt) &&
      Array.isArray(r.issues) &&
      r.issues.every(
        (i) =>
          record(i) &&
          typeof i.id === 'string' &&
          typeof i.questionId === 'string' &&
          ['leading wording', 'ambiguity', 'clarity', 'flow'].includes(i.type as string) &&
          ['moderate', 'minor'].includes(i.severity as string) &&
          ['open', 'applied', 'dismissed', 'superseded'].includes(i.status as string) &&
          typeof i.explanation === 'string' &&
          typeof i.suggestion === 'string' &&
          record(i.patch) &&
          typeof i.patch.title === 'string' &&
          (i.patch.description === undefined || typeof i.patch.description === 'string'),
      ),
  );
  return surveysValid && responsesValid && reviewsValid;
}
export function loadState(storage: Store): {
  state: DemoState;
  recovery: boolean;
  warning: boolean;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { state: createSeed(), recovery: false, warning: false };
    const parsed: unknown = JSON.parse(raw);
    if (!isDemoState(parsed)) return { state: createSeed(), recovery: true, warning: false };
    return { state: refreshLegacyDrafts(parsed), recovery: false, warning: false };
  } catch (error) {
    return {
      state: createSeed(),
      recovery: error instanceof SyntaxError,
      warning: !(error instanceof SyntaxError),
    };
  }
}
export function saveState(storage: Store, state: DemoState): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
