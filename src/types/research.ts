export type QuestionType = 'single_choice' | 'multiple_choice' | 'text' | 'rating';
type QuestionBase = {
  id: string;
  title: string;
  description: string;
  required: boolean;
  order: number;
};
export type Question = QuestionBase &
  (
    | { type: 'single_choice' | 'multiple_choice'; options: string[] }
    | { type: 'text'; multiline: boolean }
    | { type: 'rating'; min: 1; max: 5 }
  );
export type Survey = {
  id: string;
  slug: string;
  title: string;
  description: string;
  objective: string;
  status: 'draft' | 'published';
  topic: 'ev' | 'smartphone' | 'brand' | 'general';
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  seeded?: boolean;
};
export type Answer = string | string[] | number;
export type SurveyResponse = {
  id: string;
  surveyId: string;
  answers: Record<string, Answer>;
  submittedAt: string;
};
export type QuestionPatch = { title: string; description?: string };
export type ReviewIssue = {
  id: string;
  questionId: string;
  type: 'leading wording' | 'ambiguity' | 'clarity' | 'flow';
  severity: 'moderate' | 'minor';
  explanation: string;
  suggestion: string;
  patch: QuestionPatch;
  status: 'open' | 'applied' | 'dismissed' | 'superseded';
};
export type AIReview = {
  surveyId: string;
  score: number;
  issues: ReviewIssue[];
  reviewedAt: string;
};
export type DemoState = {
  version: 1;
  surveys: Survey[];
  responses: SurveyResponse[];
  reviews: AIReview[];
  preferences: { sidebarCollapsed: boolean };
};
