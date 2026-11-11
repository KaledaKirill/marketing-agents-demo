import { Check, Copy, ExternalLink, Link2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Survey } from '@/types/research';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { copyText, surveyUrl } from '@/lib/utils';

export function ShareDialog({
  survey,
  open,
  onOpenChange,
}: {
  survey: Survey;
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const link = surveyUrl(survey.slug);
  async function copy() {
    if (await copyText(link)) {
      setCopied(true);
      toast.success('Survey link copied');
    } else toast.info('Select and copy the link below. Clipboard access is unavailable.');
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Survey published" description="Open the survey or copy its link.">
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <span className="rounded-full bg-white p-2 text-emerald-600">
            <Check size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-900">Published successfully</p>
            <p className="mt-1 text-[13px] text-emerald-700">{survey.title}</p>
          </div>
        </div>
        <label htmlFor="share-link" className="field-label">
          Survey link
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Link2 className="absolute left-3 top-3 size-4 text-slate-400" />
            <input
              id="share-link"
              className="input pl-9 text-[13px]"
              value={link}
              readOnly
              onFocus={(e) => e.target.select()}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-10 shrink-0"
            onClick={() => void copy()}
            aria-label="Copy survey link"
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
          {survey.seeded
            ? 'This preloaded survey is available to all visitors.'
            : 'This survey link only works in this browser.'}
        </p>
        <Button asChild className="mt-5 w-full">
          <a href={link} target="_blank" rel="noopener noreferrer">
            Open published survey <ExternalLink />
          </a>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
