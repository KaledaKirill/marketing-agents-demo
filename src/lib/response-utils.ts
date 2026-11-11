import type { SurveyResponse } from '@/types/research';

export function completionSeconds(
  response: Pick<SurveyResponse, 'startedAt' | 'submittedAt'>,
): number | null {
  if (!response.startedAt) return null;
  const elapsed = (Date.parse(response.submittedAt) - Date.parse(response.startedAt)) / 1000;
  return Number.isFinite(elapsed) && elapsed >= 0 ? Math.round(elapsed) : null;
}

export function averageCompletionSeconds(responses: SurveyResponse[]): number | null {
  const durations = responses
    .map(completionSeconds)
    .filter((value): value is number => value !== null);
  return durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
    : null;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function calculateNps(values: number[]) {
  const valid = values.filter((value) => Number.isInteger(value) && value >= 0 && value <= 10);
  const promoters = valid.filter((value) => value >= 9).length;
  const passives = valid.filter((value) => value >= 7 && value <= 8).length;
  const detractors = valid.filter((value) => value <= 6).length;
  return {
    score: valid.length ? Math.round(((promoters - detractors) / valid.length) * 100) : null,
    promoters,
    passives,
    detractors,
    total: valid.length,
  };
}
