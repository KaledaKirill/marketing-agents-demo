import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, type LinkProps, type To } from 'react-router-dom';
type NavigationContext = {
  navigate: (to: To, force?: boolean) => void;
  setDirty: (value: boolean) => void;
  allowed: () => boolean;
};
const Context = createContext<NavigationContext | null>(null);
export function NavigationProvider({ children }: { children: ReactNode }) {
  const rawNavigate = useNavigate();
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  function allowed() {
    return (
      !dirtyRef.current ||
      window.confirm('You have unsaved changes. Leave this page and discard them?')
    );
  }
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);
  return (
    <Context.Provider
      value={{
        navigate: (to, force = false) => {
          if (force || allowed()) {
            dirtyRef.current = false;
            setDirty(false);
            void rawNavigate(to);
          }
        },
        setDirty,
        allowed,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAppNavigation() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('NavigationProvider is required.');
  return ctx;
}
export function SafeLink({ onClick, ...props }: LinkProps) {
  const { allowed, setDirty } = useAppNavigation();
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0 ||
          props.target === '_blank'
        )
          return;
        if (!allowed()) event.preventDefault();
        else setDirty(false);
      }}
    />
  );
}
