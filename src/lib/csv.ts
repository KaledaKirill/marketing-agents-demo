import type { Survey, SurveyResponse } from '@/types/research';
import { completionSeconds } from './response-utils';

export function csvCell(value: string | number): string {
  let text = String(value);
  // Treat respondent text as data when opened in spreadsheet applications.
  if (typeof value === 'string' && /^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function responsesToCsv(survey: Survey, responses: SurveyResponse[]): string {
  const rows: (string | number)[][] = [
    [
      'Response ID',
      'Started at',
      'Submitted at',
      'Completion time (seconds)',
      ...survey.questions.map((q, index) => `Q${index + 1}: ${q.title}`),
    ],
    ...responses
      .filter((r) => r.surveyId === survey.id)
      .map((response) => [
        response.id,
        response.startedAt ?? '',
        response.submittedAt,
        completionSeconds(response) ?? '',
        ...survey.questions.map((q) => {
          const value = response.answers[q.id];
          return Array.isArray(value) ? JSON.stringify(value) : (value ?? '');
        }),
      ]),
  ];
  return '\ufeff' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function downloadResponsesCsv(survey: Survey, responses: SurveyResponse[]) {
  const url = URL.createObjectURL(
    new Blob([responsesToCsv(survey, responses)], { type: 'text/csv;charset=utf-8;' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `${survey.slug || survey.id}-responses.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
