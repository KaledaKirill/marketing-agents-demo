import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '@/app/store';
import { SafeLink } from '@/app/navigation';
import { Logo } from '@/components/layout/AppShell';
import { MissingState } from '@/components/ui/shared';
import { SurveyRunner } from '@/components/surveys/SurveyRunner';

export default function PublicSurveyPage() {
  const { slug } = useParams();
  const { state, submitResponse } = useStore();
  const survey = state.surveys.find((s) => s.slug === slug && s.status === 'published');
  return (
    <div className="public-page">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-7">
        <SafeLink to="/" aria-label="Intergam overview">
          <Logo />
        </SafeLink>
      </header>
      <main id="main-content" className="public-main">
        {survey ? (
          <div className="respondent-card">
            <SurveyRunner key={survey.id} survey={survey} onSubmit={submitResponse} />
          </div>
        ) : (
          <MissingState publicView />
        )}
      </main>
      <footer className="mx-auto w-full max-w-5xl px-5 py-7 text-center">
        <SafeLink
          to="/surveys"
          className="mt-4 inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-primary"
        >
          <ArrowLeft size={11} /> Return to workspace
        </SafeLink>
      </footer>
    </div>
  );
}
