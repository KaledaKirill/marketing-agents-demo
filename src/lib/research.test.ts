import { describe, expect, it } from 'vitest';
import { createSeed } from '@/data/seed';
import { analyticsFixture } from '@/data/analytics';
import { reducer } from '@/app/store';
import {
  applyReviewSuggestion,
  detectTopic,
  generateSurvey,
  newQuestion,
  refreshLegacyDrafts,
  reviewSurvey,
} from './mock-agents';
import {
  changeQuestionType,
  copyToDraft,
  publishSurvey,
  reorderQuestions,
  supersedeIssues,
  supersedeFlowIssues,
  validateAnswer,
  validateSurvey,
} from './survey-utils';
import { isDemoState, loadState, saveState, STORAGE_KEY } from './storage';

describe('topic-based mock agents', () => {
  it.each([
    ['EV charging satisfaction', 'ev'],
    ['Smartphone buying behavior', 'smartphone'],
    ['Brand awareness', 'brand'],
    ['Our onboarding experience', 'general'],
  ])('creates a valid, relevant survey for %s', (objective, topic) => {
    const survey = generateSurvey(objective);
    expect(detectTopic(objective)).toBe(topic);
    expect(survey.topic).toBe(topic);
    expect(survey.objective).toBe(objective);
    expect(survey.questions).toHaveLength(7);
    expect(new Set(survey.questions.map((q) => q.type)).size).toBe(5);
    expect(validateSurvey(survey)).toEqual([]);
    expect(reviewSurvey(survey).issues).toHaveLength(3);
  });
  it('applies concrete fixes only to the intended question', () => {
    const survey = generateSurvey('EV customer satisfaction');
    const issue = reviewSurvey(survey).issues[0];
    if (issue.patch.kind === 'move') throw new Error('Expected wording suggestion');
    const next = applyReviewSuggestion(survey, issue);
    expect(next.questions[0].title).toBe(issue.patch.title);
    expect(issue.type).toBe('clarity');
    expect(survey.questions[0].title).toContain('driving range and charging');
    expect(next.questions[0].title).toContain('driving range');
    expect(next.questions[0].title).not.toContain('charging');
    expect(next.questions.slice(1)).toEqual(survey.questions.slice(1));
    expect(applyReviewSuggestion({ ...survey, status: 'published' }, issue).questions).toEqual(
      survey.questions,
    );
  });
  it('uses realistic wording and resolves each topic-specific criticism', () => {
    for (const objective of [
      'EV ownership',
      'Smartphone battery life',
      'Brand awareness',
      'Customer experience',
    ]) {
      let survey = generateSurvey(objective);
      expect(survey.questions.every((q) => !/excellent|regularly\?/i.test(q.title))).toBe(true);
      for (const issue of reviewSurvey(survey).issues)
        survey = applyReviewSuggestion(survey, issue);
      expect(reviewSurvey(survey).issues).toEqual([]);
    }
    expect(generateSurvey('Smartphone battery life').topic).toBe('smartphone');
  });
  it('refreshes legacy draft examples while preserving published and manually edited content', () => {
    const state = createSeed();
    const draft = generateSurvey('Smartphone purchasing');
    draft.questions[0].title = 'How satisfied are you with your excellent smartphone?';
    draft.questions[1].title = 'How often do you replace your smartphone regularly?';
    draft.questions[2].title = 'A researcher wrote this question';
    state.surveys.push(draft);
    const refreshed = refreshLegacyDrafts(state);
    const next = refreshed.surveys.find((s) => s.id === draft.id)!;
    expect(next.questions[0].title).toContain('battery life and performance');
    expect(next.questions[1].title).toBe('How often do you upgrade your smartphone?');
    expect(next.questions[2].title).toBe('A researcher wrote this question');
    expect(next.questions.map((q) => q.id)).toEqual(draft.questions.map((q) => q.id));
    expect(refreshed.surveys[0]).toEqual(state.surveys[0]);
    expect(refreshed.responses).toBe(state.responses);
    expect(refreshLegacyDrafts(refreshed)).toBe(refreshed);
  });
});

describe('question editing and publication', () => {
  it('preserves compatible data when changing question types', () => {
    const q = {
      ...newQuestion('single_choice'),
      type: 'single_choice' as const,
      options: ['Yes', 'No'],
      required: false,
    };
    const multi = changeQuestionType(q, 'multiple_choice');
    expect(multi).toMatchObject({
      id: q.id,
      title: q.title,
      required: false,
      options: ['Yes', 'No'],
    });
    const text = changeQuestionType(multi, 'text');
    expect(text).toMatchObject({ type: 'text', multiline: true });
    expect('options' in text).toBe(false);
    expect(changeQuestionType(text, 'rating')).toMatchObject({ min: 1, max: 5 });
  });
  it('reorders without losing question identity or creating gaps', () => {
    const questions = generateSurvey('EV customer satisfaction').questions;
    const result = reorderQuestions(questions, 0, 1);
    expect(result[1].id).toBe(questions[0].id);
    expect(result.map((q) => q.order)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(reorderQuestions(questions, 0, -1)).toEqual(questions);
  });
  it('rejects empty studies, empty wording, duplicate and empty options', () => {
    const survey = generateSurvey('EV satisfaction');
    expect(validateSurvey({ ...survey, title: '', questions: [] })).toHaveLength(2);
    const q = {
      ...newQuestion('single_choice'),
      type: 'single_choice' as const,
      title: '',
      options: [' Yes ', 'yes'],
    };
    expect(validateSurvey({ ...survey, questions: [q] })).toHaveLength(2);
    expect(
      validateSurvey({ ...survey, questions: [{ ...q, title: 'Test', options: ['Yes', ''] }] }),
    ).toHaveLength(1);
    expect(() => publishSurvey({ ...survey, title: '' }, [])).toThrow();
  });
  it('assigns unique slugs and creates independent draft copies', () => {
    const source = createSeed().surveys[0];
    const { survey, review } = copyToDraft(source);
    expect(survey.status).toBe('draft');
    expect(survey.id).not.toBe(source.id);
    expect(survey.slug).toBe('');
    expect(survey.questions.every((q) => !source.questions.some((s) => s.id === q.id))).toBe(true);
    expect(review.surveyId).toBe(survey.id);
    const published = publishSurvey({ ...survey, title: source.title }, [
      { ...source, slug: 'ev-customer-satisfaction' },
    ]);
    expect(published.slug).toBe('ev-customer-satisfaction-2');
    expect(source.slug).toBe('demo-ev-satisfaction');
  });
  it('supersedes stale review suggestions when their question changes', () => {
    const survey = generateSurvey('EV customer satisfaction');
    const review = reviewSurvey(survey);
    const next = supersedeIssues(review, survey.questions[0].id)!;
    expect(next.issues[0].status).toBe('superseded');
    expect(next.issues[1].status).toBe('open');
    expect(applyReviewSuggestion(survey, next.issues[0])).toBe(survey);
  });
});

describe('respondent validation', () => {
  it('validates all question types and optional empty answers', () => {
    const survey = generateSurvey('EV customer satisfaction');
    expect(validateAnswer(survey.questions[0], 5)).toBe(true);
    expect(validateAnswer(survey.questions[0], 6)).toBe(false);
    expect(validateAnswer(survey.questions[0], 1.5)).toBe(false);
    expect(
      validateAnswer(
        survey.questions.find((q) => q.type === 'single_choice')!,
        'Unknown',
      ),
    ).toBe(false);
    const multi = survey.questions.find((q) => q.type === 'multiple_choice')!;
    if (multi.type !== 'multiple_choice') throw new Error('Expected multiple choice');
    expect(validateAnswer(multi, [])).toBe(false);
    expect(validateAnswer(multi, [multi.options[0]])).toBe(true);
    expect(validateAnswer(multi, [multi.options[0], multi.options[0]])).toBe(false);
    const text = survey.questions.find((q) => q.type === 'text')!;
    expect(validateAnswer(text, undefined)).toBe(true);
    expect(validateAnswer({ ...text, required: true }, '   ')).toBe(false);
  });
});

describe('local state and fixed analytics', () => {
  function memory() {
    const map = new Map<string, string>();
    return {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => {
        map.set(key, value);
      },
    };
  }
  it('initializes seeds only for missing storage and round-trips saved data', () => {
    const storage = memory();
    const initial = loadState(storage);
    expect(initial.state.surveys).toHaveLength(3);
    expect(initial.state.responses).toHaveLength(80);
    expect(initial.recovery).toBe(false);
    expect(saveState(storage, initial.state)).toBe(true);
    expect(loadState(storage).state).toEqual(initial.state);
  });
  it('offers recovery for invalid JSON, unsupported schemas and malformed nested data', () => {
    const storage = memory();
    for (const raw of [
      '{broken',
      '{"version":2}',
      JSON.stringify({ ...createSeed(), surveys: [{}] }),
    ]) {
      storage.setItem(STORAGE_KEY, raw);
      expect(loadState(storage).recovery).toBe(true);
      expect(storage.getItem(STORAGE_KEY)).toBe(raw);
    }
    expect(isDemoState({ ...createSeed(), responses: [{ answers: null }] })).toBe(false);
  });
  it('falls back to memory when browser storage is inaccessible', () => {
    const storage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };
    expect(loadState(storage).warning).toBe(true);
    expect(saveState(storage, createSeed())).toBe(false);
  });
  it('saves a valid response once while keeping mock dashboard fixtures unchanged', () => {
    const state = createSeed();
    const survey = state.surveys[0];
    const before = analyticsFixture(survey);
    const response = { ...state.responses[0], id: 'new-attempt' };
    const next = reducer(state, { type: 'response', response });
    expect(next.responses).toHaveLength(state.responses.length + 1);
    expect(reducer(next, { type: 'response', response })).toBe(next);
    expect(reducer(state, { type: 'response', response: { ...response, answers: {} } })).toBe(
      state,
    );
    expect(analyticsFixture(next.surveys[0])).toEqual(before);
    expect(reducer(state, { type: 'survey', survey: { ...survey, title: 'Unwanted edit' } })).toBe(
      state,
    );
  });
  it('creates deterministic fixtures that match each published questionnaire', () => {
    const survey = generateSurvey('Smartphone buying behavior');
    const fixture = analyticsFixture(survey);
    expect(fixture).toEqual(analyticsFixture(survey));
    expect(fixture.questions.map((q) => q.questionId)).toEqual(survey.questions.map((q) => q.id));
    expect(fixture.questions[0].distribution.reduce((sum, item) => sum + item.value, 0)).toBe(
      fixture.total,
    );
    const choice = survey.questions.find((q) => q.type === 'single_choice')!;
    expect(
      fixture.questions
        .find((q) => q.questionId === choice.id)!
        .distribution.map((item) => item.name),
    ).toEqual('options' in choice ? choice.options : []);
  });
});

describe('question order suggestions', () => {
  it.each(['EV ownership', 'Smartphone purchasing', 'Brand awareness'])(
    'applies a flow fix for %s without changing questions or IDs',
    (objective) => {
      const survey = generateSurvey(objective);
      const review = reviewSurvey(survey);
      const issue = review.issues.find((i) => i.type === 'flow')!;
      expect(issue.patch.kind).toBe('move');
      const next = applyReviewSuggestion(survey, issue);
      expect(next.questions.map((q) => q.order)).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(new Set(next.questions.map((q) => q.id))).toEqual(
        new Set(survey.questions.map((q) => q.id)),
      );
      expect(next.questions.map((q) => q.title).sort()).toEqual(
        survey.questions.map((q) => q.title).sort(),
      );
      expect(reviewSurvey(next).issues.some((i) => i.type === 'flow')).toBe(false);
      expect(survey.questions.map((q) => q.id)).not.toEqual(next.questions.map((q) => q.id));
      if (issue.patch.kind === 'move')
        expect(
          next.questions[issue.patch.position === 'first' ? 0 : next.questions.length - 1].id,
        ).toBe(issue.questionId);
      expect(applyReviewSuggestion(survey, { ...issue, status: 'dismissed' })).toBe(survey);
      const superseded = supersedeFlowIssues(review)!;
      expect(superseded.issues.find((i) => i.type === 'flow')!.status).toBe('superseded');
      expect(
        superseded.issues.filter((i) => i.type !== 'flow').every((i) => i.status === 'open'),
      ).toBe(true);
    },
  );
});
