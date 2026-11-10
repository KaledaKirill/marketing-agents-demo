import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[3px] data-[state=open]:animate-in" />
      <DialogPrimitive.Content
        className={cn(
          'dialog-content fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-xl focus:outline-none',
          className,
        )}
      >
        <div className="mb-5 pr-7">
          <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </DialogPrimitive.Description>
        </div>
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Close dialog"
        >
          <X size={17} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
