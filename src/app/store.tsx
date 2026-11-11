import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react';
import type { AIReview, DemoState, Survey, SurveyResponse } from '@/types/research';
import { createSeed } from '@/data/seed';
import { isDemoState, loadState, saveState, STORAGE_KEY } from '@/lib/storage';
import { validateAnswer } from '@/lib/survey-utils';

type Action =
  | { type: 'survey'; survey: Survey; review?: AIReview }
  | { type: 'response'; response: SurveyResponse }
  | { type: 'replace'; state: DemoState };
export function reducer(state: DemoState, action: Action): DemoState {
  if (action.type === 'replace') return action.state;
  if (action.type === 'response') {
    const survey = state.surveys.find(
      (s) => s.id === action.response.surveyId && s.status === 'published',
    );
    if (
      !survey ||
      state.responses.some((r) => r.id === action.response.id) ||
      !survey.questions.every((q) => validateAnswer(q, action.response.answers[q.id]))
    )
      return state;
    return { ...state, responses: [...state.responses, action.response] };
  }
  const current = state.surveys.find((s) => s.id === action.survey.id);
  if (current?.status === 'published') return state;
  return {
    ...state,
    surveys: current
      ? state.surveys.map((s) => (s.id === action.survey.id ? action.survey : s))
      : [action.survey, ...state.surveys],
    reviews: action.review
      ? [...state.reviews.filter((r) => r.surveyId !== action.survey.id), action.review]
      : state.reviews,
  };
}
function initial() {
  try {
    return loadState(window.localStorage);
  } catch {
    return { state: createSeed(), recovery: false, warning: true };
  }
}
type StoreContext = {
  state: DemoState;
  recovery: boolean;
  warning: boolean;
  saveSurvey: (survey: Survey, review?: AIReview) => void;
  submitResponse: (response: SurveyResponse) => void;
  reset: () => void;
};
const Context = createContext<StoreContext | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(initial);
  const [state, dispatch] = useReducer(reducer, loaded.state);
  const [recovery, setRecovery] = useState(loaded.recovery);
  const [warning, setWarning] = useState(loaded.warning);
  useEffect(() => {
    if (recovery) return;
    try {
      setWarning(!saveState(window.localStorage, state));
    } catch {
      setWarning(true);
    }
  }, [state, recovery]);
  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const value: unknown = JSON.parse(event.newValue);
        if (isDemoState(value)) dispatch({ type: 'replace', state: value });
        else setRecovery(true);
      } catch {
        setRecovery(true);
      }
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const value: StoreContext = {
    state,
    recovery,
    warning,
    saveSurvey: (survey, review) => dispatch({ type: 'survey', survey, review }),
    submitResponse: (response) => dispatch({ type: 'response', response }),
    reset: () => {
      dispatch({ type: 'replace', state: createSeed() });
      setRecovery(false);
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error('StoreProvider is required.');
  return store;
}
