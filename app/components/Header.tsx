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
      setIsScrolled(window.scrollY > 20);
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
          ? 'bg-white/95 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.05)] border-b border-neutral-100'
          : 'bg-white border-b border-neutral-100'
      }`}
      onMouseLeave={handleMouseLeaveMega}
    >
      {/* ========================================================
          PROFESSIONAL LUXURY ANNOUNCEMENT TICKER
         ======================================================== */}
      {!announcementDismissed && (
        <div
          role="region"
          aria-label="Atelier Promotion"
          className="bg-black text-white py-2 px-4 text-center text-[10px] sm:text-[11px] font-medium tracking-[0.22em] uppercase relative overflow-hidden flex items-center justify-between z-50 border-b border-neutral-900"
          style={{backgroundColor: '#000000', color: '#ffffff'}}
        >
          {/* Subtle Accent Tag */}
          <div className="hidden md:flex items-center gap-2 shrink-0 opacity-80 pl-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[9px] font-display tracking-widest uppercase text-neutral-300">
              SS 2026
            </span>
          </div>

          {/* Smooth Animated Gliding Marquee */}
          <div className="overflow-hidden flex-1 mx-4" style={{overflow: 'hidden'}}>
            <div
              className="animate-marquee-smooth flex items-center gap-14 font-display text-[10px] tracking-[0.22em] uppercase text-neutral-200 whitespace-nowrap"
              style={{whiteSpace: 'nowrap'}}
            >
              <span className="flex items-center gap-3">
                <span className="text-neutral-500">·</span>
                <span>COMPLIMENTARY EXPRESS SHIPPING ON ORDERS OVER $150</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-neutral-500">·</span>
                <span>EFFORTLESS 30-DAY ATELIER RETURNS & EXCHANGES</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-neutral-500">·</span>
                <span>HANDCRAFTED PURE NATURAL WEAVE COTTON</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-neutral-500">·</span>
                <span>SPRING / SUMMER 2026 CAPSULE EDITORIAL LIVE</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-neutral-500">·</span>
                <span>COMPLIMENTARY EXPRESS SHIPPING ON ORDERS OVER $150</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-neutral-500">·</span>
                <span>EFFORTLESS 30-DAY ATELIER RETURNS & EXCHANGES</span>
              </span>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => setAnnouncementDismissed(true)}
            aria-label="Dismiss announcement"
            className="text-neutral-400 hover:text-white transition-opacity text-xs pr-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================
          MAIN CLEAN LUXURY NAVBAR
         ======================================================== */}
      <header
        className={`crush-header max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300 ${
          isScrolled ? 'h-16' : 'h-20'
        }`}
      >
        {/* Left: Hamburger + Desktop Nav */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 flex-1 justify-start min-w-[65px]">
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

        {/* Center: Brand Logo */}
        <div className="crush-brand-logo flex flex-col items-center justify-center text-center px-1 shrink-0">
          <NavLink
            prefetch="intent"
            to="/"
            end
            className="group inline-flex items-center justify-center no-underline text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900 transition-transform active:scale-95"
            aria-label="CRUSH CLOTHING — Atelier Home"
          >
            <img
              src="/images/crush-logo.png"
              alt="CRUSH CLOTHING"
              className={`w-auto object-contain transition-all duration-300 ${
                isScrolled
                  ? 'h-8 sm:h-10'
                  : 'h-10 sm:h-13'
              }`}
              loading="eager"
            />
          </NavLink>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3.5 lg:gap-4 flex-1 justify-end min-w-[65px]">
          <CurrencySelector />
          <SearchToggle />

          <NavLink
            prefetch="intent"
            to="/account"
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full text-neutral-700 hover:text-black hover:bg-neutral-100 transition-all no-underline"
            aria-label="Account profile"
          >
            <svg
              width="16"
              height="16"
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{width: 16, height: 16, maxWidth: 16, maxHeight: 16}}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </NavLink>

          <CartToggle cart={cart} />
        </div>
      </header>

      {/* ========================================================
          INTERACTIVE MEGA-MENU PANELS (Collections & The Atelier)
         ======================================================== */}
      {activeMegaMenu === 'collections' && (
        <div
          className="absolute top-full inset-x-0 bg-white/98 backdrop-blur-2xl border-b border-neutral-200 shadow-2xl py-8 px-6 animate-mega-menu z-50"
          onMouseEnter={() => handleMouseEnterMega('collections')}
          onMouseLeave={handleMouseLeaveMega}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
            {/* Column 1: Ready-To-Wear Categories */}
            <div className="col-span-3 space-y-3">
              <span className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400 block">
                Ready-To-Wear
              </span>
              <ul className="space-y-2.5 font-display text-xs uppercase tracking-wider list-none p-0 m-0">
                <li>
                  <Link
                    to="/collections/all"
                    className="text-neutral-900 hover:text-black font-semibold flex items-center justify-between no-underline transition-transform hover:translate-x-1"
                  >
                    <span>View All Collection</span>
                    <span className="text-[10px] text-neutral-400">→</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collections/all"
                    className="text-neutral-600 hover:text-black no-underline transition-transform hover:translate-x-1 block"
                  >
                    Mini & Maxi Dresses
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collections/all"
                    className="text-neutral-600 hover:text-black no-underline transition-transform hover:translate-x-1 block"
                  >
                    Woven Cotton Sets
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collections/all"
                    className="text-neutral-600 hover:text-black no-underline transition-transform hover:translate-x-1 block"
                  >
                    Tailored Bodices & Tops
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collections/all"
                    className="text-neutral-600 hover:text-black no-underline transition-transform hover:translate-x-1 block"
                  >
                    Signature Outerwear
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Curated Edits */}
            <div className="col-span-4 space-y-3 border-l border-neutral-100 pl-8">
              <span className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400 block">
                Seasonal Capsules
              </span>
              <ul className="space-y-2.5 font-display text-xs uppercase tracking-wider list-none p-0 m-0">
                <li>
                  <Link
                    to="/products/frill-tie-shoulder-mini-dress?openSizeAdvisor=true"
                    className="text-neutral-900 hover:text-black font-medium flex items-center justify-between no-underline transition-transform hover:translate-x-1"
                  >
                    <span>The Frill Tie Mini Edit</span>
                    <span className="text-[10px] text-neutral-400">→</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collections/all"
                    className="text-neutral-600 hover:text-black no-underline transition-transform hover:translate-x-1 block"
                  >
                    Sunlit Coastal Resort
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collections/all"
                    className="text-neutral-600 hover:text-black no-underline transition-transform hover:translate-x-1 block"
                  >
                    Twilight Cocktail Silhouettes
                  </Link>
                </li>
                <li>
                  <Link
                    to="/collections/all"
                    className="text-neutral-600 hover:text-black no-underline transition-transform hover:translate-x-1 block"
                  >
                    Minimalist Earth Tones
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Featured Atelier Spotlight Card */}
            <div className="col-span-5 bg-neutral-50 rounded-xl border border-neutral-200/80 p-4 shadow-sm flex gap-4 items-center">
              <div className="w-24 aspect-[3/4] overflow-hidden rounded-lg bg-neutral-200 shrink-0 border border-neutral-200">
                <img
                  src="https://cdn.shopify.com/s/files/1/0844/4359/4861/files/4a5c9b52-89bf-4835-9201-11dd8247d95a-Max-Origin.webp?v=1793609651"
                  alt="Frill Tie Mini Dress"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="space-y-1.5">
                <span className="font-display text-[9px] font-bold tracking-widest uppercase text-neutral-500 block">
                  Featured Piece
                </span>
                <h4 className="font-serif text-base text-neutral-900 m-0">
                  Frill Tie Shoulder Mini Dress
                </h4>
                <p className="font-body text-xs text-neutral-600 m-0 line-clamp-2">
                  100% natural cotton weave with romantic self-tie bows. Available in Khaki, Brown & Black.
                </p>
                <Link
                  to="/products/frill-tie-shoulder-mini-dress?openSizeAdvisor=true"
                  className="inline-block font-display text-[10px] font-bold tracking-widest uppercase text-neutral-900 underline underline-offset-4 pt-1"
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
          className="absolute top-full inset-x-0 bg-white/98 backdrop-blur-2xl border-b border-neutral-200 shadow-2xl py-8 px-6 animate-mega-menu z-50"
          onMouseEnter={() => handleMouseEnterMega('atelier')}
          onMouseLeave={handleMouseLeaveMega}
        >
          <div className="max-w-5xl mx-auto grid grid-cols-12 gap-8 items-center">
            <div className="col-span-7 space-y-3">
              <span className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400 block">
                The CRUSH Philosophy
              </span>
              <h3 className="font-serif text-3xl text-neutral-900 m-0 leading-tight">
                Contemporary Women&apos;s Luxury Founded On Artisanal Craftsmanship
              </h3>
              <p className="font-body text-xs sm:text-sm text-neutral-600 leading-relaxed m-0">
                We design timeless pieces sculpted from natural cotton weaves and French tailored seams. Each garment is crafted to balance effortless comfort with sculptural elegance.
              </p>
            </div>
            <div className="col-span-5 space-y-2 border-l border-neutral-100 pl-8 font-display text-xs uppercase tracking-wider">
              <Link
                to="/products/frill-tie-shoulder-mini-dress#atelier-specifications"
                className="block p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-black no-underline text-neutral-900 transition-colors shadow-xs"
              >
                <span className="font-bold block">Interactive Size Advisor</span>
                <span className="text-[10px] text-neutral-500 normal-case font-body">Find your bespoke tailored fit</span>
              </Link>
              <Link
                to="/policies/shipping-policy"
                className="block p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-black no-underline text-neutral-900 transition-colors shadow-xs"
              >
                <span className="font-bold block">Complimentary Delivery</span>
                <span className="text-[10px] text-neutral-500 normal-case font-body">Orders over $150 dispatched in 24h</span>
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

  // Curated Clean Professional Navigation Hierarchy (No tacky badges, no clutter)
  const curatedLinks = [
    {
      id: 'nav-new-in',
      title: 'New Arrivals',
      url: '/collections/all',
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
        className="hidden lg:flex items-center gap-7 xl:gap-9"
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
                  `group inline-flex items-center font-display text-[12px] font-medium tracking-[0.18em] uppercase no-underline transition-all nav-link-classic py-0.5 ${
                    isActive
                      ? 'text-neutral-900 active font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`
                }
              >
                <span>{item.title}</span>
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
      className="crush-mobile-nav flex flex-col space-y-5 p-3.5 sm:p-5"
      role="navigation"
      aria-label="Mobile Navigation"
    >
      {/* Editorial Promo Card with High-Res Thumbnail */}
      <Link
        to="/collections/all"
        onClick={close}
        className="block relative rounded-2xl overflow-hidden bg-neutral-950 text-white p-3.5 no-underline shadow-md group border border-neutral-800 hover:border-neutral-700 transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-display uppercase tracking-[0.25em] text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
            SS26 Capsule Live
          </span>
          <span className="text-xs text-neutral-400 group-hover:text-white transition-colors">
            Explore →
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-serif text-base font-normal text-white m-0 tracking-wide truncate">
              The Architecture of Presence
            </h4>
            <p className="font-body text-[11px] text-neutral-400 m-0 mt-0.5 line-clamp-1">
              Sculptural silhouettes in 100% pure cotton.
            </p>
          </div>
          <div className="w-12 h-14 rounded-lg overflow-hidden shrink-0 border border-neutral-800 bg-neutral-900 shadow-xs">
            <img
              src="https://cdn.shopify.com/s/files/1/0844/4359/4861/files/4a5c9b52-89bf-4835-9201-11dd8247d95a-Max-Origin.webp?v=1793609651"
              alt="SS26 Preview"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </Link>

      {/* Primary Collections & Edits */}
      <div className="space-y-1">
        <span className="font-display text-[9px] font-bold tracking-[0.3em] uppercase text-neutral-400 block mb-1.5 px-1">
          Collections & Edits
        </span>

        <NavLink
          end
          onClick={close}
          prefetch="intent"
          to="/"
          className="flex items-center justify-between py-3 px-3.5 rounded-xl font-display text-sm font-semibold tracking-widest uppercase text-neutral-900 no-underline hover:bg-neutral-100 min-h-[46px] transition-colors"
        >
          <span>Atelier Home</span>
          <span className="text-xs text-neutral-400">Overview</span>
        </NavLink>

        {[
          {id: 'nav-new', title: 'New Arrivals', url: '/collections/all', tag: 'Fresh Releases'},
          {id: 'nav-col', title: 'Collections', url: '/collections/all', tag: 'SS26 Edits'},
          {id: 'nav-dr', title: 'Dresses', url: '/products/frill-tie-shoulder-mini-dress', tag: 'Signature Piece'},
          {id: 'nav-at', title: 'The Atelier', url: '/#atelier', tag: 'French Tailoring'},
          {id: 'nav-ed', title: 'Editorial', url: '/products/frill-tie-shoulder-mini-dress#atelier-specifications', tag: 'Lookbook'},
        ].map((item) => (
          <NavLink
            key={item.id}
            end
            onClick={close}
            prefetch="intent"
            to={item.url}
            className="flex items-center justify-between py-3 px-3.5 rounded-xl font-display text-sm font-semibold tracking-widest uppercase text-neutral-900 no-underline hover:bg-neutral-100 min-h-[46px] transition-colors group"
          >
            <span>{item.title}</span>
            <span className="text-[11px] font-body normal-case text-neutral-500 group-hover:text-neutral-900 transition-colors">
              {item.tag} →
            </span>
          </NavLink>
        ))}
      </div>

      {/* Smart Size Advisor Card */}
      <Link
        to="/products/frill-tie-shoulder-mini-dress?openSizeAdvisor=true"
        onClick={close}
        className="block p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-white border border-emerald-200/80 no-underline shadow-xs hover:border-emerald-300 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
              ✦
            </span>
            <div>
              <span className="font-display text-xs font-bold uppercase tracking-wider text-emerald-950 block">
                Smart Size Advisor
              </span>
              <span className="font-body text-[11px] text-emerald-800">
                Calculate your exact fit in 30s
              </span>
            </div>
          </div>
          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-emerald-900 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
            Start →
          </span>
        </div>
      </Link>

      {/* VIP Client Account - High Contrast Crisp Styling */}
      <div>
        <NavLink
          to="/account"
          onClick={close}
          className="flex items-center justify-between py-3.5 px-4 rounded-xl font-display text-xs font-semibold tracking-widest uppercase no-underline shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 min-h-[48px]"
          style={{backgroundColor: '#111827', color: '#ffffff'}}
        >
          <div className="flex items-center gap-2.5" style={{color: '#ffffff'}}>
            <svg
              width="16"
              height="16"
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              style={{width: 16, height: 16, maxWidth: 16, maxHeight: 16, color: '#ffffff'}}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span style={{color: '#ffffff', fontWeight: 600}}>VIP Client Account</span>
          </div>
          <span className="text-[10px] font-semibold" style={{color: '#e5e7eb'}}>Sign In →</span>
        </NavLink>
      </div>

      {/* Atelier Client Services & Guarantees */}
      <div className="pt-2 border-t border-neutral-100 space-y-2 text-xs font-display uppercase tracking-wider text-neutral-500">
        <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-neutral-400 block px-1">
          Client Services
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <Link
            to="/policies/shipping-policy"
            onClick={close}
            className="p-2.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-700 no-underline transition-colors block"
          >
            <span className="font-semibold block">Express Shipping</span>
            <span className="text-[9px] font-body normal-case text-neutral-400">Complimentary &gt; $150</span>
          </Link>
          <Link
            to="/policies/refund-policy"
            onClick={close}
            className="p-2.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-700 no-underline transition-colors block"
          >
            <span className="font-semibold block">30-Day Returns</span>
            <span className="text-[9px] font-body normal-case text-neutral-400">Effortless exchanges</span>
          </Link>
        </div>
      </div>

      {/* Region & Currency */}
      <div className="pt-2 border-t border-neutral-100">
        <span className="font-display text-[9px] font-bold tracking-[0.3em] uppercase text-neutral-400 block mb-2 px-1">
          Currency Preference
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['USD ($)', 'EUR (€)', 'GBP (£)', 'CAD ($)'].map((curr, idx) => (
            <span
              key={curr}
              className={`px-2.5 py-1 rounded-full font-display text-[10px] uppercase font-semibold tracking-wider transition-colors ${
                idx === 0
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {curr}
            </span>
          ))}
        </div>
      </div>
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      type="button"
      className="lg:hidden min-w-[44px] min-h-[44px] p-2.5 -ml-2 text-neutral-900 rounded-full hover:bg-neutral-100 active:bg-neutral-200 transition-colors cursor-pointer group flex items-center justify-center"
      onClick={() => open('mobile')}
      aria-label="Open mobile menu"
    >
      <div className="w-5 h-4 flex flex-col justify-between">
        <span className="w-5 h-0.5 bg-neutral-900 group-hover:w-4 transition-all duration-300" />
        <span className="w-3.5 h-0.5 bg-neutral-900 group-hover:w-5 transition-all duration-300" />
        <span className="w-5 h-0.5 bg-neutral-900 transition-all duration-300" />
      </div>
    </button>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button
      type="button"
      className="min-w-[40px] min-h-[40px] w-10 h-10 rounded-full text-neutral-700 hover:text-black hover:bg-neutral-100 active:bg-neutral-200 transition-all cursor-pointer flex items-center justify-center"
      onClick={() => open('search')}
      aria-label="Open search drawer"
    >
      <svg
        width="16"
        height="16"
        className="w-4 h-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{width: 16, height: 16, maxWidth: 16, maxHeight: 16}}
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="16" y1="16" x2="21" y2="21" />
      </svg>
    </button>
  );
}

function CartBadge({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 sm:gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-900 hover:bg-neutral-800 hover:shadow-md text-white rounded-full cursor-pointer shadow-xs transition-all duration-200 active:scale-95 group"
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
        width="14"
        height="14"
        className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{width: 14, height: 14, maxWidth: 14, maxHeight: 14}}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
      <span className="hidden xs:inline sm:inline font-display text-[11px] font-semibold tracking-[0.18em] uppercase">
        Bag
      </span>
      <span className="w-5 h-5 rounded-full bg-white text-neutral-900 font-display text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
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
        className="font-display text-[10px] font-semibold tracking-widest uppercase text-neutral-700 hover:text-black hover:border-black hover:bg-neutral-50 hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer py-1.5 px-2.5 rounded-full border border-neutral-200"
        aria-label="Change currency"
      >
        <span>{currency} ({currencies.find(c => c.code === currency)?.symbol})</span>
        <span className="text-[8px] text-neutral-400">▾</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-neutral-200 shadow-xl z-50 py-1.5 animate-fadeIn">
          <div className="px-3.5 py-1.5 border-b border-neutral-100 text-[9px] font-display uppercase tracking-widest text-neutral-400">
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
              className={`w-full text-left px-3.5 py-2 font-display text-xs flex items-center justify-between transition-colors cursor-pointer ${
                currency === c.code
                  ? 'bg-neutral-900 text-white font-bold'
                  : 'text-neutral-700 hover:bg-neutral-50'
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
