import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { Dialog, DialogContent } from './dialog';
import { Button } from './button';
type Request = { title: string; description: string; action?: string; destructive?: boolean };
const ConfirmContext = createContext<(request: Request) => Promise<boolean>>(async () => false);
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  function finish(value: boolean) {
    resolver.current?.(value);
    resolver.current = null;
    setRequest(null);
  }
  const confirm = (next: Request) =>
    new Promise<boolean>((resolve) => {
      resolver.current?.(false);
      resolver.current = resolve;
      setRequest(next);
    });
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={!!request}
        onOpenChange={(open) => {
          if (!open) finish(false);
        }}
      >
        <DialogContent
          title={request?.title ?? 'Confirm action'}
          description={request?.description ?? ''}
        >
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => finish(false)}>
              Cancel
            </Button>
            <Button
              variant={request?.destructive ? 'destructive' : 'default'}
              onClick={() => finish(true)}
            >
              {request?.action ?? 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
export const useConfirm = () => useContext(ConfirmContext);
