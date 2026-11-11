import type { Survey, SurveyResponse } from '@/types/research';
import { responseComments } from './response-comments';

export function hash(value: string) {
  return [...value].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17);
}
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
function randomSource(seed: number) {
  let value = seed;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
function weightedIndex(weights: number[], random: () => number) {
  let value = random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let i = 0; i < weights.length; i++) {
    value -= weights[i];
    if (value < 0) return i;
  }
  return weights.length - 1;
}

export function createFixtureResponses(survey: Survey, count: number): SurveyResponse[] {
  const seed = hash(`${survey.topic}:${survey.title}`);
  const random = randomSource(seed);
  return Array.from({ length: count }, (_, index) => {
    const day = weightedIndex(
      [24, 39, 31, 57, 45, 72, 62, 88, 74, 95, 79, 112, 101, 128, 116],
      random,
    );
    const submittedAt = new Date(
      Date.UTC(2026, 9, 13 + day * 2, 9 + (index % 9), (index * 13) % 60),
    ).toISOString();
    const seconds = 45 + survey.questions.length * 11 + ((seed + index * 47) % 150);
    return {
      id: `${survey.id}-response-${index + 1}`,
      surveyId: survey.id,
      startedAt: new Date(Date.parse(submittedAt) - seconds * 1000).toISOString(),
      submittedAt,
      answers: Object.fromEntries(
        survey.questions.map((question, questionIndex) => {
          let answer: string | string[] | number;
          if (question.type === 'rating')
            answer =
              1 + weightedIndex(ratingProfiles[survey.topic][questionIndex === 0 ? 0 : 1], random);
          else if (question.type === 'nps')
            answer = weightedIndex([2, 2, 3, 3, 4, 6, 9, 13, 18, 23, 17], random);
          else if (question.type === 'text')
            answer = responseComments[survey.topic][index % responseComments[survey.topic].length];
          else if (question.type === 'multiple_choice') {
            const choices = question.options.filter(
              (_, optionIndex) => random() < 0.35 + (optionIndex % 3) * 0.1,
            );
            answer =
              choices.length || !question.required
                ? choices
                : [question.options[index % question.options.length]];
          } else {
            const local = hash(question.title);
            answer =
              question.options[
                weightedIndex(
                  question.options.map((_, i) => 15 + ((local + i * 29) % 65)),
                  random,
                )
              ];
          }
          return [question.id, answer];
        }),
      ),
    };
  });
}
