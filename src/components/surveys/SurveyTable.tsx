import { useState } from 'react';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import {
  ArrowRight,
  BarChart3,
  CarFront,
  CopyPlus,
  Eye,
  FilePenLine,
  Globe2,
  Link2,
  MoreHorizontal,
  RadioTower,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Survey } from '@/types/research';
import { useStore } from '@/app/store';
import { SafeLink, useAppNavigation } from '@/app/navigation';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/shared';
import { useConfirm } from '@/components/ui/confirm';
import { copyToDraft, publishSurvey, validateSurvey } from '@/lib/survey-utils';
import { cn, formatDate, number } from '@/lib/utils';
import { PreviewDialog } from './SurveyRunner';
import { ShareDialog } from './ShareDialog';

export function TopicIcon({ topic, className }: { topic: Survey['topic']; className?: string }) {
  const Icon = { ev: CarFront, smartphone: Smartphone, brand: RadioTower, general: Globe2 }[topic];
  return (
    <span
      className={cn(
        'topic-icon',
        {
          'bg-indigo-50 text-indigo-500': topic === 'ev',
          'bg-sky-50 text-sky-600': topic === 'smartphone',
          'bg-amber-50 text-amber-600': topic === 'brand',
          'bg-violet-50 text-violet-500': topic === 'general',
        },
        className,
      )}
    >
      <Icon size={18} strokeWidth={1.7} />
    </span>
  );
}
export function SurveyTable({
  surveys,
  compact = false,
}: {
  surveys: Survey[];
  compact?: boolean;
}) {
  const { state, saveSurvey } = useStore();
  const { navigate } = useAppNavigation();
  const confirm = useConfirm();
  const [preview, setPreview] = useState<Survey | null>(null);
  const [share, setShare] = useState<Survey | null>(null);
  function editCopy(survey: Survey) {
    const copy = copyToDraft(survey);
    saveSurvey(copy.survey, copy.review);
    toast.success('A separate draft copy is ready to edit');
    navigate(`/builder/${copy.survey.id}`);
  }
  async function publish(survey: Survey) {
    const errors = validateSurvey(survey);
    if (errors.length) {
      toast.error(errors[0]);
      navigate(`/builder/${survey.id}`);
      return;
    }
    if (
      !(await confirm({
        title: 'Publish this survey?',
        description:
          'Published surveys are locked. Future edits create a draft copy. The survey link only works in this browser.',
        action: 'Publish survey',
      }))
    )
      return;
    const published = publishSurvey(survey, state.surveys);
    saveSurvey(published);
    setShare(published);
    toast.success('Survey published');
  }
  return (
    <>
      <div className="survey-table-wrap">
        <table className="survey-table">
          <thead>
            <tr>
              <th>Survey name</th>
              <th>Status</th>
              <th className="hidden sm:table-cell">Responses</th>
              <th className="hidden md:table-cell">Last updated</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {surveys.map((survey) => (
              <tr key={survey.id}>
                <td>
                  <SafeLink to={`/builder/${survey.id}`} className="group flex items-center gap-3">
                    <TopicIcon topic={survey.topic} />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-slate-800 group-hover:text-primary">
                        {survey.title}
                      </span>
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        {survey.questions.length} questions
                        <span className="sm:hidden">
                          {' '}
                          · {state.responses.filter((r) => r.surveyId === survey.id).length}{' '}
                          responses
                        </span>
                      </span>
                    </span>
                  </SafeLink>
                </td>
                <td>
                  <StatusBadge status={survey.status} />
                </td>
                <td className="hidden sm:table-cell">
                  <span className="text-[13px] font-medium text-slate-600">
                    {number(state.responses.filter((r) => r.surveyId === survey.id).length)}
                  </span>
                </td>
                <td className="hidden text-xs text-muted-foreground md:table-cell">
                  {formatDate(survey.updatedAt)}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    {!compact && (
                      <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                        <SafeLink to={`/builder/${survey.id}`}>
                          {survey.status === 'draft' ? 'Edit survey' : 'Open survey'}
                          <ArrowRight size={12} />
                        </SafeLink>
                      </Button>
                    )}
                    <Dropdown.Root>
                      <Dropdown.Trigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${survey.title}`}
                        >
                          <MoreHorizontal size={17} />
                        </Button>
                      </Dropdown.Trigger>
                      <Dropdown.Portal>
                        <Dropdown.Content className="dropdown-content" align="end" sideOffset={5}>
                          <Dropdown.Item
                            className="dropdown-item"
                            onSelect={() => navigate(`/builder/${survey.id}`)}
                          >
                            <FilePenLine size={14} />
                            {survey.status === 'draft' ? 'Open in builder' : 'View questionnaire'}
                          </Dropdown.Item>
                          <Dropdown.Item
                            className="dropdown-item"
                            onSelect={() => setPreview(survey)}
                          >
                            <Eye size={14} />
                            Preview experience
                          </Dropdown.Item>
                          {survey.status === 'published' ? (
                            <>
                              <Dropdown.Item
                                className="dropdown-item"
                                onSelect={() => editCopy(survey)}
                              >
                                <CopyPlus size={14} />
                                Edit a draft copy
                              </Dropdown.Item>
                              <Dropdown.Item
                                className="dropdown-item"
                                onSelect={() => setShare(survey)}
                              >
                                <Link2 size={14} />
                                View & copy link
                              </Dropdown.Item>
                              <Dropdown.Item
                                className="dropdown-item"
                                onSelect={() => navigate(`/analytics/${survey.id}`)}
                              >
                                <BarChart3 size={14} />
                                View analytics
                              </Dropdown.Item>
                            </>
                          ) : (
                            <Dropdown.Item
                              className="dropdown-item"
                              onSelect={() => void publish(survey)}
                            >
                              <Sparkles size={14} />
                              Publish survey
                            </Dropdown.Item>
                          )}
                        </Dropdown.Content>
                      </Dropdown.Portal>
                    </Dropdown.Root>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {preview && (
        <PreviewDialog
          survey={preview}
          open={!!preview}
          onOpenChange={(open) => {
            if (!open) setPreview(null);
          }}
        />
      )}
      {share && (
        <ShareDialog
          survey={share}
          open={!!share}
          onOpenChange={(open) => {
            if (!open) setShare(null);
          }}
        />
      )}
    </>
  );
}
