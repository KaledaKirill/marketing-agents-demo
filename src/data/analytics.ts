import type { Survey } from '@/types/research';
import { responseComments } from './response-comments';

const ratingProfiles: Record<Survey['topic'], [number[], number[]]> = {
  ev: [
    [6, 12, 22, 36, 24],
    [13, 21, 25, 28, 13],
  ],
  smartphone: [
    [9, 18, 27, 30, 16],
    [4, 9, 18, 42, 27],
  ],
  brand: [
    [9, 18, 37, 25, 11],
    [16, 23, 31, 22, 8],
  ],
  general: [
    [7, 14, 26, 34, 19],
    [11, 15, 23, 31, 20],
  ],
};

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
function hash(value: string) {
  return [...value].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17);
}
export function analyticsFixture(survey: Survey) {
  const seed = hash(`${survey.topic}:${survey.title}`);
  const total =
    survey.id === 'ev-satisfaction'
      ? 648
      : survey.id === 'smartphone-purchasing'
        ? 424
        : 120 + (seed % 180);
  return {
    total,
    completionRate: 84 + (seed % 60) / 10,
    activity: activityFixture.map((p) => ({
      ...p,
      responses: Math.round((p.responses * total) / 1248),
    })),
    questions: survey.questions.map((q, index) => {
      const local = hash(q.title);
      const options =
        q.type === 'rating' ? ['1', '2', '3', '4', '5'] : 'options' in q ? q.options : [];
      const weights = options.map((_, i) =>
        q.type === 'rating'
          ? ratingProfiles[survey.topic][q.order === 0 ? 0 : 1][i]
          : 15 + ((local + i * 29) % 65),
      );
      const sum = weights.reduce((a, b) => a + b, 0);
      const distribution = options.map((name, i) => ({
        name,
        value: Math.round((total * weights[i]) / sum),
      }));
      if (distribution.length && q.type !== 'multiple_choice')
        distribution[distribution.length - 1].value +=
          total - distribution.reduce((a, b) => a + b.value, 0);
      if (q.type === 'multiple_choice')
        distribution.forEach((item) => {
          item.value = Math.min(total, Math.round(item.value * 2.1));
        });
      return {
        questionId: q.id,
        distribution,
        average:
          q.type === 'rating'
            ? distribution.reduce((a, b, i) => a + b.value * (i + 1), 0) / total
            : null,
        texts:
          q.type === 'text'
            ? responseComments[survey.topic].slice(0, 3).map((text, i) => ({
                text,
                respondent: `Participant ${String(index * 10 + i + 1).padStart(3, '0')}`,
              }))
            : [],
      };
    }),
  };
}
