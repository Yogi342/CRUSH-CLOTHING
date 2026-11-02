import {Suspense, useState} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const {shop, menu} = header;
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  return (
    <div className="crush-header-wrapper sticky top-0 z-40 bg-[var(--color-ivory)] border-b border-[var(--color-stone)]">
      {/* Announcement Bar */}
      {!announcementDismissed && (
        <div
          role="region"
          aria-label="Promotion"
          className="bg-[var(--color-ink)] text-[var(--color-ivory)] px-4 py-2 text-center text-xs font-medium tracking-widest uppercase flex items-center justify-between border-b border-[var(--color-ink)]"
        >
          <div className="w-6" aria-hidden="true" />
          <p className="m-0 font-display text-[11px] tracking-[0.14em]">
            Complimentary US Shipping on Orders Over $150 • SS 2026 Collection Live
          </p>
          <button
            type="button"
            onClick={() => setAnnouncementDismissed(true)}
            aria-label="Dismiss announcement"
            className="text-[var(--color-ivory)] opacity-60 hover:opacity-100 transition-opacity text-xs w-6 text-right cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header Bar */}
      <header className="crush-header max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Left: Desktop Navigation & Mobile Toggle */}
        <div className="flex items-center gap-6">
          <HeaderMenuMobileToggle />
          <HeaderMenu
            menu={menu}
            viewport="desktop"
            primaryDomainUrl={header.shop.primaryDomain?.url || ''}
            publicStoreDomain={publicStoreDomain}
          />
        </div>

        {/* Center: Brand Wordmark */}
        <div className="crush-brand-logo text-center">
          <NavLink
            prefetch="intent"
            to="/"
            end
            className="group inline-flex flex-col items-center no-underline text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-ink)] rounded-xs"
          >
            <span className="font-display font-bold text-xl sm:text-2xl tracking-[0.18em] uppercase transition-transform duration-300 group-hover:scale-[1.01]">
              CRUSH
            </span>
            <span className="font-display text-[9px] tracking-[0.35em] text-[var(--color-ink)]/70 uppercase -mt-0.5">
              CLOTHING
            </span>
          </NavLink>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-5">
          <CurrencySelector />
          <SearchToggle />
          <NavLink
            prefetch="intent"
            to="/account"
            className="hidden sm:inline-block font-display text-xs tracking-wider uppercase text-[var(--color-ink)] opacity-80 hover:opacity-100 transition-opacity no-underline focus-visible:outline-2 focus-visible:outline-[var(--color-ink)]"
          >
            <Suspense fallback="Account">
              <Await resolve={isLoggedIn} errorElement="Sign In">
                {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Sign In')}
              </Await>
            </Suspense>
          </NavLink>
          <CartToggle cart={cart} />
        </div>
      </header>
    </div>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: string;
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const {close} = useAside();
  const items = (menu?.items && menu.items.length > 0) ? menu.items : FALLBACK_HEADER_MENU.items;

  if (viewport === 'desktop') {
    return (
      <nav
        className="hidden lg:flex items-center gap-7"
        role="navigation"
        aria-label="Main Navigation"
      >
        {items.map((item) => {
          if (!item.url) return null;
          const url = cleanMenuUrl(item.url, publicStoreDomain, primaryDomainUrl);
          return (
            <NavLink
              className={({isActive}) =>
                `font-display text-xs font-medium tracking-[0.12em] uppercase no-underline transition-colors py-1 relative ${
                  isActive
                    ? 'text-[var(--color-ink)] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[var(--color-ink)]'
                    : 'text-[var(--color-ink)]/80 hover:text-[var(--color-ink)]'
                }`
              }
              end
              key={item.id}
              prefetch="intent"
              to={url}
            >
              {item.title}
            </NavLink>
          );
        })}
      </nav>
    );
  }

  // Mobile drawer navigation
  return (
    <nav
      className="crush-mobile-nav flex flex-col divide-y divide-[var(--color-stone)]"
      role="navigation"
      aria-label="Mobile Navigation"
    >
      <div className="py-4">
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          to="/"
          className="block py-2.5 font-display text-base font-medium tracking-widest uppercase text-[var(--color-ink)] no-underline"
        >
          Home
        </NavLink>
        {items.map((item) => {
          if (!item.url) return null;
          const url = cleanMenuUrl(item.url, publicStoreDomain, primaryDomainUrl);
          return (
            <NavLink
              className="block py-2.5 font-display text-base font-medium tracking-widest uppercase text-[var(--color-ink)] no-underline hover:translate-x-1 transition-transform"
              end
              key={item.id}
              onClick={close}
              prefetch="intent"
              to={url}
            >
              {item.title}
            </NavLink>
          );
        })}
      </div>

      <div className="pt-6 pb-4 space-y-3">
        <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-ink)]/50">
          Client Care
        </p>
        <NavLink
          to="/policies/shipping-policy"
          onClick={close}
          className="block text-xs uppercase tracking-wider text-[var(--color-ink)]/80 no-underline"
        >
          Shipping & Orders
        </NavLink>
        <NavLink
          to="/policies/refund-policy"
          onClick={close}
          className="block text-xs uppercase tracking-wider text-[var(--color-ink)]/80 no-underline"
        >
          Returns & Exchanges
        </NavLink>
        <NavLink
          to="/policies/terms-of-service"
          onClick={close}
          className="block text-xs uppercase tracking-wider text-[var(--color-ink)]/80 no-underline"
        >
          Terms of Service
        </NavLink>
      </div>
    </nav>
  );
}

function cleanMenuUrl(
  url: string,
  publicStoreDomain: string,
  primaryDomainUrl: string,
) {
  if (
    url.includes('myshopify.com') ||
    (publicStoreDomain && url.includes(publicStoreDomain)) ||
    (primaryDomainUrl && url.includes(primaryDomainUrl))
  ) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
  return url;
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      type="button"
      className="lg:hidden p-2 -ml-2 text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-ink)] rounded-xs cursor-pointer"
      onClick={() => open('mobile')}
      aria-label="Open mobile menu"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <line x1="3" y1="7" x2="21" y2="7" />
        <line x1="3" y1="17" x2="21" y2="17" />
      </svg>
    </button>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button
      type="button"
      className="p-2 text-[var(--color-ink)] opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-ink)] rounded-xs cursor-pointer flex items-center gap-1.5"
      onClick={() => open('search')}
      aria-label="Open search drawer"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="16" y1="16" x2="21" y2="21" />
      </svg>
      <span className="hidden sm:inline font-display text-xs tracking-wider uppercase">
        Search
      </span>
    </button>
  );
}

function CartBadge({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[var(--color-ink)] text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-ivory)] transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-[var(--color-ink)] rounded-xs cursor-pointer shadow-xs"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
      aria-label={`Shopping Bag with ${count} items`}
    >
      <span className="font-display text-xs font-semibold tracking-widest uppercase">
        Bag
      </span>
      <span className="font-display text-xs font-bold min-w-4 text-center">
        {count}
      </span>
    </button>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

export const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/crush-primary-nav',
  items: [
    {
      id: 'gid://shopify/MenuItem/crush-new-arrivals',
      resourceId: null,
      tags: [],
      title: 'New Arrivals',
      type: 'HTTP',
      url: '/collections/all',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/crush-dresses',
      resourceId: null,
      tags: [],
      title: 'Dresses',
      type: 'HTTP',
      url: '/collections/dresses',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/crush-tops',
      resourceId: null,
      tags: [],
      title: 'Tops & Sets',
      type: 'HTTP',
      url: '/collections/tops',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/crush-outerwear',
      resourceId: null,
      tags: [],
      title: 'Outerwear',
      type: 'HTTP',
      url: '/collections/outerwear',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/crush-editorial',
      resourceId: null,
      tags: [],
      title: 'Editorial',
      type: 'HTTP',
      url: '/#editorial',
      items: [],
    },
  ],
};

function CurrencySelector() {
  const [currency, setCurrency] = useState('USD');
  const [isOpen, setIsOpen] = useState(false);

  const currencies = [
    {code: 'USD', symbol: '$', label: 'US Dollar'},
    {code: 'EUR', symbol: '€', label: 'Euro'},
    {code: 'GBP', symbol: '£', label: 'British Pound'},
    {code: 'CAD', symbol: '$', label: 'Canadian Dollar'},
  ];

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="font-display text-[11px] font-semibold tracking-widest uppercase text-[var(--color-ink)]/75 hover:text-[var(--color-ink)] transition-colors flex items-center gap-1 cursor-pointer py-1"
        aria-label="Change currency"
      >
        <span>{currency}</span>
        <span className="text-[9px] text-[var(--color-stone-dark)]">▾</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-[var(--color-stone)] shadow-xl z-50 py-1">
          <div className="px-3 py-1.5 border-b border-[var(--color-stone)]/50 text-[9px] font-display uppercase tracking-widest text-[var(--color-ink)]/50">
            Select Currency
          </div>
          {currencies.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCurrency(c.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 font-display text-xs flex items-center justify-between transition-colors cursor-pointer ${
                currency === c.code
                  ? 'bg-[var(--color-ink)] text-[var(--color-ivory)]'
                  : 'text-[var(--color-ink)] hover:bg-[var(--color-stone-light)]'
              }`}
            >
              <span>{c.code} ({c.symbol})</span>
              <span className="text-[10px] opacity-60">{c.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
