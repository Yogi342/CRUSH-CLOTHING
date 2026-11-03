import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {useId} from 'react';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const id = useId();
  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      document.addEventListener(
        'keydown',
        function handler(event: KeyboardEvent) {
          if (event.key === 'Escape') {
            close();
          }
        },
        {signal: abortController.signal},
      );
    }
    return () => abortController.abort();
  }, [close, expanded]);

  return (
    <div
      aria-modal
      className={`overlay ${expanded ? 'expanded' : ''}`}
      style={!expanded ? {display: 'none', visibility: 'hidden', opacity: 0} : {display: 'block', visibility: 'visible', opacity: 1}}
      role="dialog"
      aria-labelledby={id}
    >
      <button className="close-outside" onClick={close} />
      <aside>
        <header className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 bg-white shrink-0">
          {type === 'mobile' ? (
            <div>
              <span className="font-serif text-lg tracking-[0.25em] text-neutral-900 font-normal uppercase block">
                CRUSH
              </span>
              <span className="font-display text-[8px] tracking-[0.35em] text-neutral-400 uppercase font-medium">
                NEW YORK · ATELIER
              </span>
            </div>
          ) : (
            <h3 id={id} className="font-display text-xs font-bold tracking-[0.2em] uppercase text-neutral-900 m-0">
              {heading}
            </h3>
          )}
          <button
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 transition-all cursor-pointer font-light text-xl"
            onClick={close}
            aria-label="Close drawer"
          >
            ✕
          </button>
        </header>
        <main>{children}</main>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close: () => setType('closed'),
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
