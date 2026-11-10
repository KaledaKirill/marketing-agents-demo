import type { AIReview, DemoState, Question, ReviewIssue, Survey } from '@/types/research';
import { uid } from './utils';

export const examplePrompts = [
  {
    topic: 'ev',
    label: 'Electric vehicle experience',
    objective:
      'Understand which parts of EV ownership most influence satisfaction, including driving range and access to charging.',
  },
  {
    topic: 'smartphone',
    label: 'Smartphone purchase drivers',
    objective:
      'Understand how people choose a smartphone, what they spend, and what would make them switch brands.',
  },
  {
    topic: 'brand',
    label: 'Brand awareness & perception',
    objective:
      'Measure awareness of Northline, an outdoor clothing brand, and understand where people encounter it.',
  },
];

export function detectTopic(objective: string): Survey['topic'] {
  if (/\b(ev|evs|electric vehicle|electric car|charging)\b/i.test(objective)) return 'ev';
  if (/\b(smartphone|smartphones|phone|phones|mobile|iphone|android)\b/i.test(objective))
    return 'smartphone';
  if (/\b(brand|awareness|perception|recognition)\b/i.test(objective)) return 'brand';
  return 'general';
}

const templates = {
  ev: {
    title: 'EV Customer Satisfaction',
    description:
      'Tell us about your experience owning and using an electric vehicle. This short survey covers driving range, charging, and everyday use.',
    initial: 'How satisfied are you with your EV’s driving range and charging experience?',
    initialFix: 'How satisfied are you with the driving range of your electric vehicle?',
    initialExplanation:
      'Driving range and charging are separate experiences. An owner may be satisfied with one and dissatisfied with the other, so a single rating is difficult to interpret.',
    initialSuggestion:
      'Ask about driving range here. The later charging question captures that experience separately.',
    frequency: 'How many days do you typically drive your electric vehicle?',
    frequencyFix: 'In a typical week, how many days do you drive your EV?',
    frequencyExplanation:
      'The answer choices refer to days per week, but the question does not name that period. Making it explicit gives respondents the same reference point.',
    frequencySuggestion: 'Specify a typical week to match the answer options.',
    frequencyType: 'ambiguity' as const,
    frequencyOptions: [
      'Less than once a week',
      '1–2 days a week',
      '3–4 days a week',
      '5–7 days a week',
    ],
    factorsTitle: 'Which aspects of EV ownership have the greatest impact on your satisfaction?',
    factors: [
      'Driving range',
      'Charging experience',
      'Purchase price',
      'Technology & features',
      'Environmental impact',
    ],
    fourth: 'Where do you usually charge your electric vehicle?',
    fourthOptions: ['At home', 'At work', 'Public charging station', 'A mix of locations'],
    fifth: 'How satisfied are you with your day-to-day charging experience?',
    last: 'What is one thing that would improve your EV ownership experience?',
  },
  smartphone: {
    title: 'Smartphone Purchasing Behavior',
    description:
      'Think about your current smartphone and your most recent purchase. We’ll ask what influenced your choice and what you would consider next time.',
    initial: 'How satisfied are you with your smartphone’s battery life and performance?',
    initialFix: 'How satisfied are you with your smartphone’s battery life?',
    initialExplanation:
      'Battery life and performance can receive different ratings. Combining them makes it unclear which part of the experience a response describes.',
    initialSuggestion:
      'Focus this question on battery life. Ask about day-to-day performance separately later in the survey.',
    frequency: 'How often do you upgrade your smartphone?',
    frequencyFix: 'How often do you replace your smartphone?',
    frequencyExplanation:
      '“Upgrade” frames every purchase as a move to a better device. Some people replace a damaged or lost phone, or buy a similar model.',
    frequencySuggestion: 'Use “replace” to include purchases that are not upgrades.',
    frequencyType: 'leading wording' as const,
    frequencyOptions: ['Every year', 'Every 2 years', 'Every 3 years', 'Every 4 years or longer'],
    factorsTitle: 'Which factors influenced your most recent smartphone purchase?',
    factors: ['Camera quality', 'Battery life', 'Price', 'Brand reputation', 'Operating system'],
    fourth: 'What budget would you consider for your next smartphone?',
    fourthOptions: ['Under $300', '$300–$599', '$600–$999', '$1,000 or more'],
    fifth: 'How satisfied are you with your smartphone’s day-to-day performance?',
    last: 'What would make you consider a different brand for your next smartphone?',
  },
  brand: {
    title: 'Brand Awareness Study',
    description:
      'This short study is about Northline, an outdoor clothing brand. Tell us whether you have come across it and what you associate with the name.',
    initial: 'How would you rate the quality and value for money of Northline’s products?',
    initialFix: 'How would you rate the value for money of Northline’s products?',
    initialExplanation:
      'Quality and value for money are different judgments. Someone can consider a product well made but overpriced, so one rating cannot distinguish the two.',
    initialSuggestion:
      'Focus on value for money here. Product quality can be explored in a separate study.',
    frequency: 'How often have you come across Northline recently?',
    frequencyFix: 'In the past 30 days, how many times have you come across Northline?',
    frequencyExplanation:
      '“Recently” could mean a few days or several months. A defined recall period makes exposure counts comparable.',
    frequencySuggestion: 'Use a 30-day recall period for all respondents.',
    frequencyType: 'ambiguity' as const,
    frequencyOptions: ['Never', '1–2 times', '3–5 times', 'More than 5 times'],
    factorsTitle: 'Where have you come across Northline in the past 30 days?',
    factors: [
      'Social media',
      'Recommendations',
      'Online search',
      'In-store displays',
      'Advertising',
    ],
    fourth: 'Before today, how familiar were you with Northline?',
    fourthOptions: [
      'I have never heard of it',
      'I recognize the name',
      'I know a little about it',
      'I know it well',
    ],
    fifth: 'How likely are you to consider Northline next time you buy outdoor clothing?',
    last: 'What comes to mind when you think of Northline?',
  },
  general: {
    title: 'Customer Experience Study',
    description:
      'Think about the product you currently use. We’ll ask about your experience, the features that matter to you, and what could work better.',
    initial: 'How satisfied are you with the product’s ease of use and reliability?',
    initialFix: 'How satisfied are you with the product’s ease of use?',
    initialExplanation:
      'Ease of use and reliability describe different things. A product can be easy to navigate but unreliable, making a combined rating hard to act on.',
    initialSuggestion:
      'Ask about ease of use here and capture reliability in the later rating question.',
    frequency: 'How often do you use this product?',
    frequencyFix: 'In a typical week, how often do you use this product?',
    frequencyExplanation:
      'The question leaves the reference period open. People may answer based on their last few days or their longer-term habits.',
    frequencySuggestion: 'Specify a typical week so responses describe the same period.',
    frequencyType: 'ambiguity' as const,
    frequencyOptions: ['Daily', 'A few times a week', 'About once a week', 'Less often'],
    factorsTitle: 'Which factors influence your decision to keep using this product?',
    factors: [
      'Ease of use',
      'Value for money',
      'Quality',
      'Customer support',
      'Available features',
    ],
    fourth: 'How long have you been using this product?',
    fourthOptions: ['Less than a month', '1–6 months', '6–12 months', 'More than a year'],
    fifth: 'How would you rate the product’s reliability?',
    last: 'What is one change that would make this product more useful to you?',
  },
};

export function newQuestion(
  type: Question['type'],
  order = 0,
  title = 'Untitled question',
): Question {
  const base = { id: uid(), title, description: '', required: true, order };
  if (type === 'rating') return { ...base, type, min: 1, max: 5 };
  if (type === 'text') return { ...base, type, multiline: true };
  return { ...base, type, options: ['Option 1', 'Option 2'] };
}

export function generateSurvey(objective: string): Survey {
  const topic = detectTopic(objective);
  const content = templates[topic];
  const questions: Question[] = [
    {
      ...newQuestion('rating', 0, content.initial),
      description:
        topic === 'brand'
          ? 'Skip this question if you do not know the products well enough to rate them.'
          : '1 = Very dissatisfied; 5 = Very satisfied.',
      required: topic !== 'brand',
    },
    {
      ...newQuestion('single_choice', 1, content.frequency),
      type: 'single_choice',
      options: [...content.frequencyOptions],
    },
    {
      ...newQuestion('multiple_choice', 2, content.factorsTitle),
      type: 'multiple_choice',
      options: [...content.factors],
      description:
        topic === 'brand'
          ? 'Select all that apply, or skip if you have not come across Northline.'
          : 'Select all that apply.',
      required: topic !== 'brand',
    },
    {
      ...newQuestion('single_choice', 3, content.fourth),
      type: 'single_choice',
      options: [...content.fourthOptions],
    },
    {
      ...newQuestion('rating', 4, content.fifth),
      description:
        topic === 'brand'
          ? '1 = Very unlikely; 5 = Very likely.'
          : topic === 'general'
            ? '1 = Very unreliable; 5 = Very reliable.'
            : '1 = Very dissatisfied; 5 = Very satisfied.',
    },
    { ...newQuestion('text', 5, content.last), type: 'text', multiline: true, required: false },
  ];
  const now = new Date().toISOString();
  return {
    id: uid(),
    slug: '',
    title: content.title,
    description: content.description,
    objective: objective.trim(),
    topic,
    status: 'draft',
    questions,
    createdAt: now,
    updatedAt: now,
  };
}

export function reviewSurvey(survey: Survey): AIReview {
  const content = templates[survey.topic];
  const issues: ReviewIssue[] = [];
  for (const question of survey.questions) {
    if (question.title === content.initial)
      issues.push({
        id: uid(),
        questionId: question.id,
        type: 'clarity',
        severity: 'moderate',
        status: 'open',
        explanation: content.initialExplanation,
        suggestion: content.initialSuggestion,
        patch: { title: content.initialFix },
      });
    if (question.title === content.frequency)
      issues.push({
        id: uid(),
        questionId: question.id,
        type: content.frequencyType,
        severity: 'minor',
        status: 'open',
        explanation: content.frequencyExplanation,
        suggestion: content.frequencySuggestion,
        patch: { title: content.frequencyFix },
      });
  }
  return {
    surveyId: survey.id,
    score: Math.max(60, 96 - issues.length * 9),
    issues,
    reviewedAt: new Date().toISOString(),
  };
}

export function applyReviewSuggestion(survey: Survey, issue: ReviewIssue): Survey {
  if (survey.status === 'published' || issue.status !== 'open') return survey;
  return {
    ...survey,
    updatedAt: new Date().toISOString(),
    questions: survey.questions.map((q) =>
      q.id === issue.questionId ? { ...q, ...issue.patch } : q,
    ),
  };
}

// Refresh only untouched wording from earlier generated drafts. Never alter published surveys,
// respondent answers, question IDs, options, or wording that a researcher edited.
export function refreshLegacyDrafts(state: DemoState): DemoState {
  const changed = new Set<string>();
  const surveys = state.surveys.map((survey) => {
    if (survey.status !== 'draft') return survey;
    const template = templates[survey.topic];
    const questions = survey.questions.map((q) => {
      if (
        /^How satisfied are you with your excellent (electric vehicle|smartphone|brand experience|product experience)\?$/.test(
          q.title,
        )
      ) {
        changed.add(survey.id);
        return { ...q, title: template.initial };
      }
      if (
        /^How often do you (use your EV|replace your smartphone|notice this brand|use this product) regularly\?$/.test(
          q.title,
        )
      ) {
        changed.add(survey.id);
        return { ...q, title: template.frequency };
      }
      return q;
    });
    return changed.has(survey.id) ? { ...survey, questions } : survey;
  });
  if (!changed.size) return state;
  return {
    ...state,
    surveys,
    reviews: [
      ...state.reviews.filter((r) => !changed.has(r.surveyId)),
      ...surveys.filter((s) => changed.has(s.id)).map(reviewSurvey),
    ],
  };
}
