import type { DemoState } from '@/types/research';
import { createFixtureResponses } from './fixture-responses';
import {
  applyReviewSuggestion,
  examplePrompts,
  generateSurvey,
  reviewSurvey,
} from '@/lib/mock-agents';

export function createSeed(): DemoState {
  const definitions = [
    {
      id: 'ev-satisfaction',
      slug: 'demo-ev-satisfaction',
      status: 'published' as const,
      date: '2026-11-06T10:00:00Z',
      count: 48,
    },
    {
      id: 'smartphone-purchasing',
      slug: 'demo-smartphone-purchasing',
      status: 'published' as const,
      date: '2026-11-04T10:00:00Z',
      count: 32,
    },
    {
      id: 'brand-awareness',
      slug: '',
      status: 'draft' as const,
      date: '2026-11-02T10:00:00Z',
      count: 0,
    },
  ];
  const surveys = definitions.map((definition, i) => {
    let survey = generateSurvey(examplePrompts[i].objective);
    survey = {
      ...survey,
      ...definition,
      seeded: true,
      createdAt: definition.date,
      updatedAt: definition.date,
      publishedAt: definition.status === 'published' ? definition.date : undefined,
      questions: survey.questions.map((q, index) => ({
        ...q,
        id: `${definition.id}-q${index + 1}`,
      })),
    };
    if (survey.status === 'published') {
      // Published demo questionnaires start with neutral, reviewed wording.
      for (const issue of reviewSurvey(survey).issues)
        survey = {
          ...applyReviewSuggestion({ ...survey, status: 'draft' }, issue),
          status: 'published',
        };
      survey.updatedAt = definition.date;
    }
    return survey;
  });
  const responses = surveys.flatMap((survey, i) =>
    createFixtureResponses(survey, definitions[i].count),
  );
  return {
    version: 1,
    surveys,
    responses,
    reviews: surveys.map(reviewSurvey),
    preferences: { sidebarCollapsed: false },
  };
}
