import {Suspense, useState, useEffect, useRef} from 'react';
import {Await, NavLink, useAsyncValue, Link} from 'react-router';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth scroll listener for shrinking floating header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    window.addEventListener('scroll', handleScroll, {passive: true});
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnterMega = (menuId: string) => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
    setActiveMegaMenu(menuId);
  };

  const handleMouseLeaveMega = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 200);
  };

  return (
    <div
      className={`crush-header-wrapper sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[var(--color-ivory)]/95 backdrop-blur-md shadow-xs border-b border-[var(--color-stone)]'
          : 'bg-[var(--color-ivory)] border-b border-[var(--color-stone)]/60'
      }`}
      onMouseLeave={handleMouseLeaveMega}
    >
      {/* ========================================================
          ANIMATED LUXURY MARQUEE ANNOUNCEMENT BAR
         ======================================================== */}
      {!announcementDismissed && (
        <div
          role="region"
          aria-label="Atelier Promotion"
          className="bg-[var(--color-ink)] text-[var(--color-ivory)] py-1.5 px-4 text-center text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase relative overflow-hidden flex items-center justify-between z-50 border-b border-black"
        >
          {/* Subtle Accent Tag */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0 opacity-80 pl-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-display tracking-widest uppercase">Atelier Edition</span>
          </div>

          {/* Smooth Animated Gliding Marquee */}
          <div className="overflow-hidden flex-1 mx-4">
            <div className="animate-marquee-smooth flex items-center gap-12 font-display text-[10px] tracking-[0.22em] uppercase text-[var(--color-ivory)]/90 whitespace-nowrap">
              <span className="flex items-center gap-3">
                <span className="text-amber-300">✦</span>
                <span>Complimentary Express Shipping On US Orders Over $150</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-amber-300">✦</span>
                <span>Effortless 30-Day Atelier Returns & Exchanges</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-amber-300">✦</span>
                <span>SS 2026 Collection Live • Handcrafted Pure Cotton Pieces</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-amber-300">✦</span>
                <span>Complimentary Express Shipping On US Orders Over $150</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-amber-300">✦</span>
                <span>Effortless 30-Day Atelier Returns & Exchanges</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-amber-300">✦</span>
                <span>SS 2026 Collection Live • Handcrafted Pure Cotton Pieces</span>
              </span>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => setAnnouncementDismissed(true)}
            aria-label="Dismiss announcement"
            className="text-[var(--color-ivory)] opacity-60 hover:opacity-100 transition-opacity text-xs pr-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================
          MAIN EDITORIAL NAVBAR
         ======================================================== */}
      <header
        className={`crush-header max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300 ${
          isScrolled ? 'h-16' : 'h-19'
        }`}
      >
        {/* Left: Classic Curated Navigation */}
        <div className="flex items-center gap-4 lg:gap-8">
          <HeaderMenuMobileToggle />
          <HeaderMenu
            menu={menu}
            viewport="desktop"
            primaryDomainUrl={header.shop.primaryDomain?.url || ''}
            publicStoreDomain={publicStoreDomain}
            onHoverMega={handleMouseEnterMega}
            activeMega={activeMegaMenu}
          />
        </div>

        {/* Center: Unique Luxury Brand Wordmark */}
        <div className="crush-brand-logo text-center">
          <NavLink
            prefetch="intent"
            to="/"
            end
            className="group inline-flex flex-col items-center no-underline text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-ink)]"
          >
            <div className="flex items-center gap-2">
              <span
                className={`font-display font-bold tracking-[0.34em] uppercase transition-all duration-400 group-hover:tracking-[0.42em] text-[var(--color-ink)] ${
                  isScrolled ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-[28px]'
                }`}
              >
                CRUSH
              </span>
              <span className="text-[10px] text-amber-900 group-hover:rotate-45 transition-transform duration-500">
                ✦
              </span>
            </div>
            <span className="font-display text-[9px] tracking-[0.45em] text-[var(--color-ink)]/75 uppercase -mt-0.5 group-hover:text-[var(--color-ink)] transition-colors">
              ATELIER // US
            </span>
          </NavLink>
        </div>

        {/* Right: Actions (Currency, Search, VIP Account, Bag) */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
          <CurrencySelector />
          <SearchToggle />
          
          <NavLink
            prefetch="intent"
            to="/account"
            className="hidden sm:inline-flex items-center gap-1.5 font-display text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--color-ink)] opacity-75 hover:opacity-100 transition-opacity no-underline nav-link-classic py-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <Suspense fallback="Account">
              <Await resolve={isLoggedIn} errorElement="Sign In">
                {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Sign In')}
              </Await>
            </Suspense>
          </NavLink>

          <CartToggle cart={cart} />
        </div>
      </header>

      {/* ========================================================
          INTERACTIVE MEGA-MENU PANELS (Collections & The Atelier)
         ======================================================== */}
      {activeMegaMenu === 'collections' && (
        <div
          className="absolute top-full inset-x-0 bg-[var(--color-ivory)]/98 backdrop-blur-xl border-b border-[var(--color-stone)] shadow-2xl py-8 px-6 animate-mega-menu z-50"
          onMouseEnter={() => handleMouseEnterMega('collections')}
          onMouseLeave={handleMouseLeaveMega}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
            {/* Column 1: Ready-To-Wear Categories */}
            <div className="col-span-3 space-y-3">
              <span className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-[var(--color-ink)]/50 block">
                Atelier Catalog
              </span>
              <ul className="space-y-2.5 font-display text-xs uppercase tracking-wider list-none p-0 m-0">
                <li>
                  <Link
                    to="/collections/all"
                    className="text-[var(--color-ink)] hover:text-black font-semibold flex items-center gap-1.5 no-underline transition-transform hover:translate-x-1"
                  >
                    <span>View All Ready-To-Wear</span>
                    <span className="text-[10px] text-amber-800">→</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collections/all"
                    className="text-[var(--color-ink)]/75 hover:text-black no-underline transition-transform hover:translate-x-1 block"
                  >
                    Mini & Maxi Dresses
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collections/all"
                    className="text-[var(--color-ink)]/75 hover:text-black no-underline transition-transform hover:translate-x-1 block"
                  >
                    Woven Cotton Sets
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collections/all"
                    className="text-[var(--color-ink)]/75 hover:text-black no-underline transition-transform hover:translate-x-1 block"
                  >
                    Tailored Bodices & Tops
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collections/all"
                    className="text-[var(--color-ink)]/75 hover:text-black no-underline transition-transform hover:translate-x-1 block"
                  >
                    Signature Outerwear
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Curated Edits */}
            <div className="col-span-4 space-y-3 border-l border-[var(--color-stone)]/60 pl-8">
              <span className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-[var(--color-ink)]/50 block">
                Seasonal Capsules
              </span>
              <ul className="space-y-2.5 font-display text-xs uppercase tracking-wider list-none p-0 m-0">
                <li>
                  <Link
                    to="/products/frill-tie-shoulder-mini-dress"
                    className="text-[var(--color-ink)] hover:text-black font-bold flex items-center gap-1.5 no-underline transition-transform hover:translate-x-1"
                  >
                    <span className="text-amber-800">✦</span>
                    <span>The Frill Tie Mini Edit</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collections/all"
                    className="text-[var(--color-ink)]/75 hover:text-black no-underline transition-transform hover:translate-x-1 block"
                  >
                    Sunlit Coastal Resort
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collections/all"
                    className="text-[var(--color-ink)]/75 hover:text-black no-underline transition-transform hover:translate-x-1 block"
                  >
                    Twilight Cocktail Silhouettes
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collections/all"
                    className="text-[var(--color-ink)]/75 hover:text-black no-underline transition-transform hover:translate-x-1 block"
                  >
                    Minimalist Earth Tones
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Featured Atelier Spotlight Card */}
            <div className="col-span-5 bg-white border border-[var(--color-stone)] p-4 shadow-sm flex gap-4 items-center">
              <div className="w-24 aspect-[3/4] overflow-hidden bg-[var(--color-stone-light)] shrink-0 border border-[var(--color-stone)]">
                <img
                  src="https://cdn.shopify.com/s/files/1/0844/4359/4861/files/4a5c9b52-89bf-4835-9201-11dd8247d95a-Max-Origin.webp?v=1793609651"
                  alt="Frill Tie Mini Dress"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="space-y-1.5">
                <span className="font-display text-[9px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                  Iconic Piece
                </span>
                <h4 className="font-serif text-base text-[var(--color-ink)] m-0">
                  Frill Tie Shoulder Mini Dress
                </h4>
                <p className="font-body text-xs text-[var(--color-ink)]/70 m-0 line-clamp-2">
                  100% natural cotton weave with romantic self-tie bows. Available in Khaki, Brown & Black.
                </p>
                <Link
                  to="/products/frill-tie-shoulder-mini-dress"
                  className="inline-block font-display text-[10px] font-bold tracking-widest uppercase text-[var(--color-ink)] underline underline-offset-4 pt-1"
                >
                  Discover Piece • $31.99 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMegaMenu === 'atelier' && (
        <div
          className="absolute top-full inset-x-0 bg-[var(--color-ivory)]/98 backdrop-blur-xl border-b border-[var(--color-stone)] shadow-2xl py-8 px-6 animate-mega-menu z-50"
          onMouseEnter={() => handleMouseEnterMega('atelier')}
          onMouseLeave={handleMouseLeaveMega}
        >
          <div className="max-w-5xl mx-auto grid grid-cols-12 gap-8 items-center">
            <div className="col-span-7 space-y-3">
              <span className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-[var(--color-ink)]/50 block">
                The CRUSH Philosophy
              </span>
              <h3 className="font-serif text-3xl text-[var(--color-ink)] m-0 leading-tight">
                Contemporary Women&apos;s Luxury Founded On Artisanal Craftsmanship
              </h3>
              <p className="font-body text-xs sm:text-sm text-[var(--color-ink)]/80 leading-relaxed m-0">
                We design timeless pieces sculpted from natural cotton weaves and French tailored seams. Each garment is crafted to balance effortless comfort with sculptural elegance.
              </p>
            </div>

            <div className="col-span-5 space-y-2 border-l border-[var(--color-stone)] pl-8 font-display text-xs uppercase tracking-wider">
              <Link
                to="/products/frill-tie-shoulder-mini-dress#atelier-specifications"
                className="block p-3 bg-white border border-[var(--color-stone)] hover:border-[var(--color-ink)] no-underline text-[var(--color-ink)] transition-colors shadow-xs"
              >
                <span className="font-bold block">✦ Interactive Size Advisor</span>
                <span className="text-[10px] text-[var(--color-ink)]/60 normal-case font-body">Find your bespoke tailored fit</span>
              </Link>
              <Link
                to="/policies/shipping-policy"
                className="block p-3 bg-white border border-[var(--color-stone)] hover:border-[var(--color-ink)] no-underline text-[var(--color-ink)] transition-colors shadow-xs"
              >
                <span className="font-bold block">✦ Complimentary US Delivery</span>
                <span className="text-[10px] text-[var(--color-ink)]/60 normal-case font-body">Orders over $150 dispatched in 24h</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
  onHoverMega,
  activeMega,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: string;
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
  onHoverMega?: (menuId: string) => void;
  activeMega?: string | null;
}) {
  const {close} = useAside();

  // Curated Luxury Atelier Navigation Hierarchy
  const curatedLinks = [
    {
      id: 'nav-new-in',
      title: 'New Arrivals',
      url: '/collections/all',
      badge: '✦',
    },
    {
      id: 'nav-collections',
      title: 'Collections',
      url: '/collections/all',
      hasMega: 'collections',
    },
    {
      id: 'nav-dresses',
      title: 'Dresses',
      url: '/products/frill-tie-shoulder-mini-dress',
      badge: 'Bestseller',
    },
    {
      id: 'nav-atelier',
      title: 'The Atelier',
      url: '/#atelier',
      hasMega: 'atelier',
    },
    {
      id: 'nav-editorial',
      title: 'Editorial',
      url: '/products/frill-tie-shoulder-mini-dress#atelier-specifications',
    },
  ];

  if (viewport === 'desktop') {
    return (
      <nav
        className="hidden lg:flex items-center gap-7 xl:gap-8"
        role="navigation"
        aria-label="Main Navigation"
      >
        {curatedLinks.map((item) => {
          return (
            <div
              key={item.id}
              className="relative py-2"
              onMouseEnter={() => item.hasMega && onHoverMega && onHoverMega(item.hasMega)}
            >
              <NavLink
                to={item.url}
                className={({isActive}) =>
                  `group inline-flex items-center gap-1.5 font-display text-xs font-semibold tracking-[0.16em] uppercase no-underline transition-all nav-link-classic py-0.5 ${
                    isActive
                      ? 'text-[var(--color-ink)] active font-bold'
                      : 'text-[var(--color-ink)]/80 hover:text-[var(--color-ink)]'
                  }`
                }
              >
                <span>{item.title}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold text-amber-900 group-hover:scale-110 transition-transform">
                    {item.badge}
                  </span>
                )}
                {item.hasMega && (
                  <span
                    className={`text-[8px] text-[var(--color-stone-dark)] transition-transform duration-300 ${
                      activeMega === item.hasMega ? 'rotate-180 text-[var(--color-ink)]' : ''
                    }`}
                  >
                    ▾
                  </span>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>
    );
  }

  // Mobile Drawer Navigation
  return (
    <nav
      className="crush-mobile-nav flex flex-col divide-y divide-[var(--color-stone)]"
      role="navigation"
      aria-label="Mobile Navigation"
    >
      <div className="py-4 space-y-1">
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          to="/"
          className="block py-2.5 font-display text-base font-semibold tracking-widest uppercase text-[var(--color-ink)] no-underline hover:translate-x-1.5 transition-transform"
        >
          Atelier Home
        </NavLink>
        {curatedLinks.map((item) => (
          <NavLink
            className="flex items-center justify-between py-2.5 font-display text-base font-semibold tracking-widest uppercase text-[var(--color-ink)] no-underline hover:translate-x-1.5 transition-transform"
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            to={item.url}
          >
            <span>{item.title}</span>
            {item.badge && (
              <span className="text-[10px] tracking-wider text-amber-900 bg-amber-50 px-2 py-0.5 border border-amber-200">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      <div className="pt-6 pb-4 space-y-3">
        <p className="font-display text-[10px] tracking-[0.25em] uppercase text-[var(--color-ink)]/50 m-0">
          Atelier Client Services
        </p>
        <NavLink
          to="/products/frill-tie-shoulder-mini-dress"
          onClick={close}
          className="block text-xs uppercase tracking-wider text-[var(--color-ink)]/80 no-underline hover:text-black"
        >
          ✦ Interactive Size Advisor
        </NavLink>
        <NavLink
          to="/policies/shipping-policy"
          onClick={close}
          className="block text-xs uppercase tracking-wider text-[var(--color-ink)]/80 no-underline hover:text-black"
        >
          Shipping & Global Delivery
        </NavLink>
        <NavLink
          to="/policies/refund-policy"
          onClick={close}
          className="block text-xs uppercase tracking-wider text-[var(--color-ink)]/80 no-underline hover:text-black"
        >
          30-Day Returns & Exchanges
        </NavLink>
        <NavLink
          to="/policies/terms-of-service"
          onClick={close}
          className="block text-xs uppercase tracking-wider text-[var(--color-ink)]/80 no-underline hover:text-black"
        >
          Terms of Service
        </NavLink>
      </div>
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      type="button"
      className="lg:hidden p-2 -ml-2 text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-ink)] rounded-xs cursor-pointer group"
      onClick={() => open('mobile')}
      aria-label="Open mobile menu"
    >
      <div className="w-5 h-4 flex flex-col justify-between">
        <span className="w-5 h-0.5 bg-[var(--color-ink)] group-hover:w-4 transition-all duration-300" />
        <span className="w-3.5 h-0.5 bg-[var(--color-ink)] group-hover:w-5 transition-all duration-300" />
        <span className="w-5 h-0.5 bg-[var(--color-ink)] transition-all duration-300" />
      </div>
    </button>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button
      type="button"
      className="p-1.5 sm:px-2.5 sm:py-1.5 text-[var(--color-ink)] opacity-75 hover:opacity-100 hover:scale-105 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-ink)] rounded-xs cursor-pointer flex items-center gap-1.5"
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
      <span className="hidden md:inline font-display text-[11px] font-semibold tracking-widest uppercase">
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
      className="cart-pill-classic inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 border border-[var(--color-ink)] text-[var(--color-ink)] bg-white/60 hover:bg-[var(--color-ink)] active:scale-95 focus-visible:outline-2 focus-visible:outline-[var(--color-ink)] rounded-none cursor-pointer shadow-xs"
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
      {/* Artisanal Luxury Shopping Tote Icon */}
      <svg
        className="w-3.5 h-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
      <span className="font-display text-[11px] font-bold tracking-[0.16em] uppercase">
        Bag
      </span>
      <span className="w-4.5 h-4.5 rounded-full bg-[var(--color-ink)] text-[var(--color-ivory)] group-hover:bg-[var(--color-ivory)] group-hover:text-[var(--color-ink)] font-display text-[10px] font-bold flex items-center justify-center shrink-0">
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
        className="font-display text-[10px] font-semibold tracking-widest uppercase text-[var(--color-ink)]/75 hover:text-[var(--color-ink)] transition-colors flex items-center gap-1 cursor-pointer py-1 px-1.5 border border-transparent hover:border-[var(--color-stone)]"
        aria-label="Change currency"
      >
        <span>{currency} ({currencies.find(c => c.code === currency)?.symbol})</span>
        <span className="text-[8px] text-[var(--color-stone-dark)]">▾</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-[var(--color-stone)] shadow-xl z-50 py-1 animate-fadeIn">
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
                  ? 'bg-[var(--color-ink)] text-[var(--color-ivory)] font-bold'
                  : 'text-[var(--color-ink)] hover:bg-[var(--color-stone-light)]/60'
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
