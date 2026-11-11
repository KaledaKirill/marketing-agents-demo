import type { Survey } from '@/types/research';
import { averageCompletionSeconds, calculateNps } from '@/lib/response-utils';
import { createFixtureResponses, hash } from './fixture-responses';

export const overviewFixture = {
  totalSurveys: 3,
  activeSurveys: 2,
  responses: 1248,
  completionRate: 87.2,
};
export const activityFixture = [
  { date: 'Oct 13', responses: 24 },
  { date: 'Oct 15', responses: 39 },
  { date: 'Oct 17', responses: 31 },
  { date: 'Oct 19', responses: 57 },
  { date: 'Oct 21', responses: 45 },
  { date: 'Oct 23', responses: 72 },
  { date: 'Oct 25', responses: 62 },
  { date: 'Oct 27', responses: 88 },
  { date: 'Oct 29', responses: 74 },
  { date: 'Oct 31', responses: 95 },
  { date: 'Nov 2', responses: 79 },
  { date: 'Nov 4', responses: 112 },
  { date: 'Nov 6', responses: 101 },
  { date: 'Nov 8', responses: 128 },
  { date: 'Nov 10', responses: 116 },
];

export function analyticsFixture(survey: Survey) {
  const seed = hash(`${survey.topic}:${survey.title}`);
  const total =
    survey.id === 'ev-satisfaction'
      ? 648
      : survey.id === 'smartphone-purchasing'
        ? 424
        : 120 + (seed % 180);
  const responses = createFixtureResponses(survey, total);
  return {
    total,
    responses,
    completionRate: 84 + (seed % 60) / 10,
    averageCompletionSeconds: averageCompletionSeconds(responses),
    activity: activityFixture.map((point, index) => ({
      ...point,
      responses: responses.filter(
        (r) =>
          r.submittedAt.slice(0, 10) ===
          new Date(Date.UTC(2026, 9, 13 + index * 2)).toISOString().slice(0, 10),
      ).length,
    })),
    questions: survey.questions.map((question) => {
      const answers = responses.map((r) => r.answers[question.id]);
      const options =
        question.type === 'rating'
          ? [1, 2, 3, 4, 5]
          : question.type === 'nps'
            ? Array.from({ length: 11 }, (_, i) => i)
            : 'options' in question
              ? question.options
              : [];
      const numbers = answers.filter((answer): answer is number => typeof answer === 'number');
      return {
        questionId: question.id,
        distribution: options.map((option) => ({
          name: String(option),
          value: answers.filter((answer) =>
            Array.isArray(answer) ? answer.includes(String(option)) : answer === option,
          ).length,
        })),
        average:
          question.type === 'rating' && numbers.length
            ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length
            : null,
        nps: question.type === 'nps' ? calculateNps(numbers) : null,
        texts:
          question.type === 'text'
            ? responses.slice(0, 3).map((r, i) => ({
                text: String(r.answers[question.id] ?? ''),
                respondent: `Participant ${String(i + 1).padStart(3, '0')}`,
              }))
            : [],
      };
    }),
  };
}
