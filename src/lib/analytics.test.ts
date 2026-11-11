import { describe, expect, it } from 'vitest';
import { createSeed } from '@/data/seed';
import { analyticsFixture } from '@/data/analytics';
import { generateSurvey, newQuestion, reviewSurvey } from './mock-agents';
import { changeQuestionType, validateAnswer } from './survey-utils';
import {
  averageCompletionSeconds,
  calculateNps,
  completionSeconds,
  formatDuration,
} from './response-utils';
import { csvCell, responsesToCsv } from './csv';
import { isDemoState } from './storage';

describe('NPS question and calculation', () => {
  it('accepts the entire integer range including zero and rejects invalid values', () => {
    const question = newQuestion('nps');
    expect(question).toMatchObject({ type: 'nps', min: 0, max: 10 });
    for (let value = 0; value <= 10; value++) expect(validateAnswer(question, value)).toBe(true);
    for (const value of [-1, 11, 5.5, '0', undefined])
      expect(validateAnswer(question, value)).toBe(false);
    expect(validateAnswer({ ...question, required: false }, undefined)).toBe(true);
    expect(changeQuestionType(newQuestion('rating'), 'nps')).toMatchObject({
      type: 'nps',
      min: 0,
      max: 10,
    });
    expect(changeQuestionType(question, 'rating')).toMatchObject({
      type: 'rating',
      min: 1,
      max: 5,
    });
  });
  it('uses correct promoter, passive and detractor boundaries', () => {
    expect(calculateNps([0, 6, 7, 8, 9, 10])).toEqual({
      score: 0,
      promoters: 2,
      passives: 2,
      detractors: 2,
      total: 6,
    });
    expect(calculateNps([9, 10]).score).toBe(100);
    expect(calculateNps([0, 6]).score).toBe(-100);
    expect(calculateNps([]).score).toBeNull();
    expect(calculateNps([9, 10, 7, -1, 11, 3.5])).toMatchObject({ score: 67, total: 3 });
  });
});

describe('completion time', () => {
  const submittedAt = '2026-11-11T12:02:30.000Z';
  it('measures start to submission and ignores missing or invalid intervals', () => {
    expect(completionSeconds({ startedAt: '2026-11-11T12:00:00.000Z', submittedAt })).toBe(150);
    expect(completionSeconds({ submittedAt })).toBeNull();
    expect(completionSeconds({ startedAt: 'broken', submittedAt })).toBeNull();
    expect(completionSeconds({ startedAt: '2026-11-11T12:03:00.000Z', submittedAt })).toBeNull();
    const base = { id: '1', surveyId: 'study', answers: {}, submittedAt };
    expect(
      averageCompletionSeconds([
        { ...base, startedAt: '2026-11-11T12:00:00.000Z' },
        { ...base, id: '2', startedAt: '2026-11-11T12:01:00.000Z' },
        { ...base, id: 'old' },
      ]),
    ).toBe(120);
    expect(averageCompletionSeconds([base])).toBeNull();
    expect(formatDuration(150)).toBe('2m 30s');
    expect(formatDuration(12)).toBe('12s');
    expect(formatDuration(null)).toBe('—');
  });
});

describe('CSV export and dashboard consistency', () => {
  it('exports the same response set used for charts, NPS and average duration', () => {
    const survey = generateSurvey('Smartphone purchasing');
    const fixture = analyticsFixture(survey);
    expect(fixture.responses).toHaveLength(fixture.total);
    expect(fixture.activity.reduce((sum, point) => sum + point.responses, 0)).toBe(fixture.total);
    expect(fixture.averageCompletionSeconds).toBe(averageCompletionSeconds(fixture.responses));
    const npsQuestion = survey.questions.find((q) => q.type === 'nps')!;
    const nps = fixture.questions.find((q) => q.questionId === npsQuestion.id)!;
    expect(nps.nps).toEqual(
      calculateNps(fixture.responses.map((r) => r.answers[npsQuestion.id] as number)),
    );
    expect(nps.distribution).toHaveLength(11);
    expect(nps.distribution.reduce((sum, bin) => sum + bin.value, 0)).toBe(fixture.total);
    const csv = responsesToCsv(survey, fixture.responses);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"Completion time (seconds)"');
    expect(csv).toContain(
      csvCell(`Q${survey.questions.indexOf(npsQuestion) + 1}: ${npsQuestion.title}`),
    );
    expect(csv).toContain(csvCell(fixture.responses[0].id));
    expect(csv.split('\r\n').length).toBe(fixture.total + 2);
    expect(analyticsFixture(survey)).toEqual(fixture);
  });
  it('handles quotes, commas, newlines, multiselect answers, zero scores and formula-like text', () => {
    expect(csvCell('A, "B"\nC')).toBe('"A, ""B""\nC"');
    expect(csvCell('=SUM(A1:A2)')).toBe('"\'=SUM(A1:A2)"');
    expect(csvCell('\t+12')).toBe('"\'\t+12"');
    const survey = generateSurvey('EV experience');
    const nps = survey.questions.find((q) => q.type === 'nps')!;
    const multi = survey.questions.find((q) => q.type === 'multiple_choice')!;
    const text = survey.questions.find((q) => q.type === 'text')!;
    const response = {
      id: 'one',
      surveyId: survey.id,
      submittedAt: '2026-11-11T12:00:00Z',
      answers: {
        [nps.id]: 0,
        [multi.id]: ['Driving range', 'Charging experience'],
        [text.id]: '=HYPERLINK("https://example.com")',
      },
    };
    const csv = responsesToCsv(survey, [
      response,
      { ...response, id: 'other', surveyId: 'another-study' },
    ]);
    expect(csv).toContain('"0"');
    expect(csv).toContain('"[""Driving range"",""Charging experience""]"');
    expect(csv).toContain('"\'=HYPERLINK');
    expect(csv).not.toContain('"other"');
  });
  it('persists NPS, flow patches and timing while accepting older responses and wording patches', () => {
    const state = createSeed();
    expect(isDemoState(state)).toBe(true);
    expect(state.responses.every((r) => completionSeconds(r) !== null)).toBe(true);
    const draft = state.surveys.find((s) => s.status === 'draft')!;
    expect(reviewSurvey(draft).issues.some((i) => i.patch.kind === 'move')).toBe(true);
    state.responses.forEach((r) => {
      delete r.startedAt;
    });
    expect(isDemoState(state)).toBe(true);
    const wording = state.reviews.flatMap((r) => r.issues).find((i) => i.patch.kind !== 'move')!;
    if (wording.patch.kind !== 'move') delete wording.patch.kind;
    expect(isDemoState(state)).toBe(true);
    const broken = structuredClone(state);
    const nps = broken.surveys[0].questions.find((q) => q.type === 'nps')!;
    Object.assign(nps, { min: 1 });
    expect(isDemoState(broken)).toBe(false);
  });
});
