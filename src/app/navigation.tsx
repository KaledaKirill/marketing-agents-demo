import { createContext, useContext, type ReactNode } from 'react';
import { Link, useNavigate, type LinkProps, type To } from 'react-router-dom';

type NavigationContext = {
  navigate: (to: To) => void;
};
const Context = createContext<NavigationContext | null>(null);
export function NavigationProvider({ children }: { children: ReactNode }) {
  const rawNavigate = useNavigate();
  return (
    <Context.Provider
      value={{
        navigate: (to) => {
          void rawNavigate(to);
        },
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
export function SafeLink(props: LinkProps) {
  return <Link {...props} />;
}
