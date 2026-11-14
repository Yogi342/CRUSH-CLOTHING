import {Suspense, useRef} from 'react';
import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import {LivingRack} from '~/components/LivingRack';
import {useHeroMotion, useScrollReveal} from '~/lib/motion';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'CRUSH CLOTHING | Contemporary Women’s Fashion Atelier'},
    {
      name: 'description',
      content:
        'CRUSH CLOTHING — Premium contemporary women’s fashion. Sculptural silhouettes, modern tailoring, and effortless presence. US Atelier.',
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollection: collections?.nodes?.[0] ?? null,
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  const heroRef = useRef<HTMLElement>(null);
  const editorialRef = useRef<HTMLElement>(null);

  useHeroMotion(heroRef);
  useScrollReveal(editorialRef);

  return (
    <div className="crush-homepage bg-white text-neutral-900">
      {/* ========================================================
          1. ULTRA-LUXURY EDITORIAL ATELIER HERO SECTION
         ======================================================== */}
      <section
        ref={heroRef}
        className="crush-hero relative bg-[#FAFAF9] border-b border-neutral-200/80 pt-4 sm:pt-10 pb-12 sm:pb-24 overflow-hidden"
        aria-label="Campaign Hero"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Atelier Overline Bar */}
          <div className="flex items-center justify-between gap-2 pb-4 sm:pb-6 mb-5 sm:mb-8 border-b border-neutral-200/90 text-[10px] sm:text-[11px] font-display uppercase tracking-[0.2em] sm:tracking-[0.24em] text-neutral-500">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-neutral-900 font-semibold tracking-[0.22em] sm:tracking-[0.28em]">
                CRUSH ATELIER <span className="hidden sm:inline">// NEW YORK</span><span className="sm:hidden">· NYC</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-[10px] tracking-[0.28em] text-neutral-400">
              <span>SS 2026 CAPSULE</span>
              <span className="text-neutral-300">/</span>
              <span>DROP 01 LIVE</span>
              <span className="text-neutral-300">/</span>
              <span>100% PURE NATURAL COTTON</span>
            </div>
            <Link
              to="/products/frill-tie-shoulder-mini-dress?openSizeAdvisor=true"
              className="font-semibold text-neutral-900 hover:text-neutral-600 underline underline-offset-4 transition-colors shrink-0 text-[10px] sm:text-[11px]"
            >
              <span className="hidden sm:inline">Interactive Size Advisor →</span>
              <span className="sm:hidden">Size Advisor →</span>
            </Link>
          </div>

          {/* ========================================================
              A. MOBILE EDITORIAL HERO LAYOUT (lg:hidden)
              Visual-First Haute Couture Mobile Presentation
             ======================================================== */}
          <div className="lg:hidden space-y-4">
            {/* Title & Badge */}
            <div className="space-y-1.5">
              <span className="inline-block px-3 py-1 rounded-full bg-white border border-neutral-200 text-neutral-900 font-display text-[9px] font-bold tracking-[0.22em] uppercase shadow-2xs">
                Atelier Edition 01 · SS 2026
              </span>
              <h1 className="crush-hero-title font-serif font-normal text-3xl sm:text-5xl tracking-tight text-neutral-900 m-0 leading-[1.08]">
                Silhouettes Of
                <span className="block italic text-neutral-500 font-serif font-normal mt-0.5">
                  Sculptural Grace.
                </span>
              </h1>
            </div>

            {/* Signature Piece Image Card - Prominently Above the Mobile Fold */}
            <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden shadow-xl border border-neutral-200/80 bg-neutral-100 group">
              <img
                src="https://cdn.shopify.com/s/files/1/0844/4359/4861/files/4a5c9b52-89bf-4835-9201-11dd8247d95a-Max-Origin.webp?v=1793609651"
                alt="CRUSH Frill Tie Mini Dress"
                className="w-full h-full object-cover object-top"
                loading="eager"
              />
              {/* Floating Luxury Detail Badge */}
              <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-200 shadow-xs">
                <span className="font-display text-[9px] font-bold tracking-[0.2em] uppercase text-neutral-900">
                  ICONIC PIECE · $31.99
                </span>
              </div>

              {/* Bottom Floating Piece Bar */}
              <Link
                to="/products/frill-tie-shoulder-mini-dress"
                className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-neutral-200/90 shadow-md flex items-center justify-between no-underline active:scale-[0.99] transition-all"
              >
                <div className="min-w-0 pr-2">
                  <h4 className="font-serif text-sm font-semibold text-neutral-900 m-0 truncate">
                    Frill Tie Shoulder Mini
                  </h4>
                  <p className="font-body text-[11px] text-neutral-500 m-0">
                    Khaki, Brown & Black · 100% Cotton
                  </p>
                </div>
                <span className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                  →
                </span>
              </Link>
            </div>

            {/* Concise Editorial Copy */}
            <p className="crush-hero-sub font-body text-sm sm:text-base text-neutral-600 leading-relaxed m-0">
              Contemporary women’s luxury apparel tailored from breathable natural cotton weaves and French-bound seams. Designed in New York for an effortless presence.
            </p>

            {/* Full-Width Touch-Friendly CTAs */}
            <div className="crush-hero-ctas flex flex-col gap-2.5 pt-1">
              <Link
                to="/collections/all"
                className="crush-btn crush-btn-primary w-full text-center"
              >
                <span>Shop New Arrivals</span>
                <span className="group-hover-arrow ml-2">→</span>
              </Link>
              <Link
                to="/products/frill-tie-shoulder-mini-dress"
                className="crush-btn crush-btn-secondary w-full text-center"
              >
                <span>The Signature Mini Edit</span>
              </Link>
            </div>

            {/* Mobile Horizontal Feature Strip */}
            <div className="pt-3 border-t border-neutral-200/90 grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/80 border border-neutral-200/70 rounded-xl p-2.5 shadow-2xs">
                <span className="font-display font-bold text-neutral-900 block text-[10px] tracking-wider uppercase">100% Cotton</span>
                <span className="text-[9px] text-neutral-500 font-body">Pure weave</span>
              </div>
              <div className="bg-white/80 border border-neutral-200/70 rounded-xl p-2.5 shadow-2xs">
                <span className="font-display font-bold text-neutral-900 block text-[10px] tracking-wider uppercase">French Seams</span>
                <span className="text-[9px] text-neutral-500 font-body">Bound finish</span>
              </div>
              <div className="bg-white/80 border border-neutral-200/70 rounded-xl p-2.5 shadow-2xs">
                <span className="font-display font-bold text-neutral-900 block text-[10px] tracking-wider uppercase">Free Express</span>
                <span className="text-[9px] text-neutral-500 font-body">Over $150</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              B. DESKTOP EDITORIAL HERO LAYOUT (hidden lg:grid)
              Grand Diptych Architecture for Wide Screens
             ======================================================== */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Dramatic Editorial Typography & Luxury CTAs */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-7">
              <div className="space-y-3.5">
                <span className="inline-block px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 text-neutral-900 font-display text-[10px] font-bold tracking-[0.24em] uppercase shadow-xs">
                  Atelier Edition 01 · Spring / Summer 2026
                </span>
                <h1 className="crush-hero-title font-serif font-normal text-4xl sm:text-6xl lg:text-7xl xl:text-[76px] tracking-tight text-neutral-900 m-0 leading-[1.06]">
                  Silhouettes Of
                  <span className="block italic text-neutral-500 font-serif font-normal mt-1">
                    Sculptural Grace.
                  </span>
                </h1>
              </div>

              <p className="crush-hero-sub font-body text-base sm:text-lg text-neutral-600 max-w-lg leading-relaxed m-0">
                Contemporary women’s luxury apparel tailored from breathable natural cotton weaves and French-bound seams. Designed in New York for an effortless, commanding presence from day to twilight.
              </p>

              {/* Bulletproof Luxury CTAs */}
              <div className="crush-hero-ctas flex flex-row items-center gap-4 pt-2">
                <Link
                  to="/collections/all"
                  className="crush-btn crush-btn-primary group"
                >
                  <span>Shop New Arrivals</span>
                  <span className="group-hover-arrow">→</span>
                </Link>
                <Link
                  to="/products/frill-tie-shoulder-mini-dress"
                  className="crush-btn crush-btn-secondary group"
                >
                  <span>The Signature Mini Edit</span>
                </Link>
              </div>

              {/* Refined Atelier Feature Pillars */}
              <div className="pt-8 border-t border-neutral-200/90 grid grid-cols-3 gap-4 text-[11px] font-display uppercase tracking-wider text-neutral-500">
                <div>
                  <span className="font-bold text-neutral-900 block tracking-widest">100% Cotton</span>
                  <span className="text-[10px] text-neutral-400 font-body normal-case">Natural tactile weave</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-900 block tracking-widest">French Seams</span>
                  <span className="text-[10px] text-neutral-400 font-body normal-case">Bound clean finish</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-900 block tracking-widest">Complimentary</span>
                  <span className="text-[10px] text-neutral-400 font-body normal-case">Express over $150</span>
                </div>
              </div>
            </div>

            {/* Right Column: Editorial Double Showcase */}
            <div className="lg:col-span-6">
              <div className="grid grid-cols-12 gap-4 items-end">
                {/* Main Hero Card (Khaki Frill Tie Mini) */}
                <div className="col-span-8 relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-neutral-200/80 bg-neutral-100 group">
                  <img
                    src="https://cdn.shopify.com/s/files/1/0844/4359/4861/files/4a5c9b52-89bf-4835-9201-11dd8247d95a-Max-Origin.webp?v=1793609651"
                    alt="CRUSH Frill Tie Mini Dress"
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    loading="eager"
                  />
                  {/* Floating Luxury Detail Badge */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-neutral-200 shadow-xs">
                    <span className="font-display text-[9px] font-bold tracking-[0.2em] uppercase text-neutral-900">
                      ICONIC PIECE · $31.99
                    </span>
                  </div>

                  {/* Bottom Floating Piece Bar */}
                  <Link
                    to="/products/frill-tie-shoulder-mini-dress"
                    className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-neutral-200/90 shadow-md flex items-center justify-between no-underline group/card hover:bg-white transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="font-serif text-sm font-semibold text-neutral-900 m-0 truncate">
                        Frill Tie Shoulder Mini
                      </h4>
                      <p className="font-body text-[11px] text-neutral-500 m-0">
                        Khaki, Brown & Black · 100% Cotton
                      </p>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 group-hover/card:bg-black group-hover/card:scale-105 transition-all text-xs">
                      →
                    </span>
                  </Link>
                </div>

                {/* Secondary Editorial Diptych Card (Draped Detail) */}
                <div className="col-span-4 space-y-4">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-neutral-200/80 bg-neutral-100 group">
                    <img
                      src="https://cdn.shopify.com/s/files/1/0844/4359/4861/files/8362fe37-bd92-4b75-8d98-bc7e0c69ffdb-Max-Origin.webp?v=1793609651"
                      alt="CRUSH Frill Tie Shoulder Bow Detail"
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                      loading="eager"
                    />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-neutral-900/85 backdrop-blur-md px-2 py-1.5 rounded-xl text-white text-center">
                      <span className="font-display text-[9px] font-bold tracking-widest uppercase block">
                        TIE BOW DETAIL
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
                    <span className="font-display text-[9px] font-bold tracking-widest uppercase text-emerald-800 block mb-1">
                      ATELIER CRAFT
                    </span>
                    <p className="font-body text-[11px] text-neutral-600 m-0 leading-snug">
                      French bound seams ensure lifelong drape.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. THE LIVING RACK // KINETIC ATELIER RUNWAY
         ======================================================== */}
      <LivingRack />

      {/* ========================================================
          3. CURATED ARCHITECTURE // READY-TO-WEAR CATEGORIES
         ======================================================== */}
      <section
        id="categories"
        className="py-20 sm:py-28 border-b border-neutral-100 bg-white"
        aria-label="Curated Categories"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="font-display text-[11px] font-semibold tracking-[0.25em] text-neutral-400 uppercase m-0 mb-1">
                Curated Architecture · SS 2026
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-4xl tracking-[0.08em] uppercase text-neutral-900 m-0">
                Collections & Edits
              </h2>
            </div>
            <Link
              to="/collections/all"
              className="font-display text-xs font-semibold tracking-[0.16em] uppercase text-neutral-900 hover:underline underline-offset-4 no-underline"
            >
              View Full Archive →
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={cat.href}
                className="group block relative overflow-hidden rounded-2xl bg-neutral-100 border border-neutral-200/80 no-underline shadow-xs hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[3/4] w-full overflow-hidden bg-neutral-100">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="font-display text-[9px] tracking-[0.28em] uppercase text-neutral-300 block mb-1">
                    {cat.tag}
                  </span>
                  <h3 className="font-display text-base font-bold tracking-[0.14em] uppercase m-0 text-white group-hover:text-neutral-200 transition-colors">
                    {cat.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          3.5 THE CRUSH ATELIER DISCIPLINES
         ======================================================== */}
      <section
        className="py-16 sm:py-24 bg-[#FAFAF9] border-b border-neutral-200/80"
        aria-label="Atelier Craft Disciplines"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="font-display text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 block mb-2">
              The Code of Construction
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl text-neutral-900 m-0">
              Crafted With Uncompromising Discipline
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-2xl border border-neutral-200/80 shadow-xs space-y-3">
              <span className="font-display text-xs font-bold tracking-widest text-neutral-900 block">
                01 / NATURAL TEXTILES
              </span>
              <h4 className="font-serif text-lg text-neutral-900 m-0">100% Pure Breathable Weaves</h4>
              <p className="font-body text-xs sm:text-sm text-neutral-600 leading-relaxed m-0">
                We design with pure long-staple cotton and natural fibers. Never synthetic fillers. Garments that breathe naturally with your body from morning to midnight.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-neutral-200/80 shadow-xs space-y-3">
              <span className="font-display text-xs font-bold tracking-widest text-neutral-900 block">
                02 / FRENCH FINISHED SEAMS
              </span>
              <h4 className="font-serif text-lg text-neutral-900 m-0">Clean Bound Architecture</h4>
              <p className="font-body text-xs sm:text-sm text-neutral-600 leading-relaxed m-0">
                Every interior edge is French-bound and double-seamed to eliminate raw thread friction against skin, guaranteeing drape retention through years of wear.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-neutral-200/80 shadow-xs space-y-3">
              <span className="font-display text-xs font-bold tracking-widest text-neutral-900 block">
                03 / BESPOKE FIT ADVISOR
              </span>
              <h4 className="font-serif text-lg text-neutral-900 m-0">Algorithmic Precision Fit</h4>
              <p className="font-body text-xs sm:text-sm text-neutral-600 leading-relaxed m-0">
                Our interactive size engine cross-references your exact measurements against our atelier patterns, eliminating fit guesswork and returns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. NEW ARRIVALS // DROP 01 CURATED SHOWCASE
         ======================================================== */}
      <section
        className="py-20 sm:py-28 border-b border-neutral-100 bg-white"
        aria-labelledby="new-arrivals-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="font-display text-[11px] font-semibold tracking-[0.25em] text-neutral-400 uppercase m-0 mb-1">
                Drop 01 · Fresh Releases
              </p>
              <h2
                id="new-arrivals-heading"
                className="font-display font-bold text-2xl sm:text-4xl tracking-[0.08em] uppercase text-neutral-900 m-0"
              >
                New Arrivals
              </h2>
            </div>
            <Link
              to="/collections/all"
              className="font-display text-xs font-semibold tracking-[0.16em] uppercase text-neutral-900 hover:underline underline-offset-4 no-underline"
            >
              Shop Full Drop →
            </Link>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="aspect-[3/4] bg-neutral-100 rounded-2xl" />
                    <div className="h-4 bg-neutral-100 w-3/4 rounded" />
                    <div className="h-3 bg-neutral-100 w-1/4 rounded" />
                  </div>
                ))}
              </div>
            }
          >
            <Await resolve={data.recommendedProducts}>
              {(response) => {
                const liveProducts = response?.products?.nodes || [];

                // Curated balanced showcase ensuring complete 4-product luxury grid
                const complementaryPieces = [
                  {
                    id: 'atelier-piece-2',
                    title: 'Frill Tie Mini — Atelier Perspective',
                    handle: 'products/frill-tie-shoulder-mini-dress',
                    price: '$31.99',
                    tag: 'Atelier View 02',
                    image: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/0bba3306-63ad-4175-bdb6-27554f82b875-Max-Origin.webp?v=1793609652',
                  },
                  {
                    id: 'atelier-piece-3',
                    title: 'Frill Tie Mini — Drape Architecture',
                    handle: 'products/frill-tie-shoulder-mini-dress',
                    price: '$31.99',
                    tag: 'Atelier View 03',
                    image: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/713a647f-a042-4b48-939e-259ee071a94a-Max-Origin.webp?v=1793609652',
                  },
                  {
                    id: 'atelier-piece-4',
                    title: 'Frill Tie Mini — Self-Tie Bow Detail',
                    handle: 'products/frill-tie-shoulder-mini-dress',
                    price: '$31.99',
                    tag: 'Craft Detail',
                    image: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/8362fe37-bd92-4b75-8d98-bc7e0c69ffdb-Max-Origin.webp?v=1793609651',
                  },
                ];

                return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Real Shopify Storefront Products */}
                    {liveProducts.map((product: any) => (
                      <ProductItem key={product.id} product={product} />
                    ))}

                    {/* Curated Complementary Capsule Editions for complete grid balance */}
                    {complementaryPieces.slice(0, Math.max(0, 4 - liveProducts.length)).map((piece) => (
                      <Link
                        key={piece.id}
                        to={piece.handle.startsWith('collections') ? `/${piece.handle}` : `/products/${piece.handle}`}
                        className="group flex flex-col no-underline text-neutral-900"
                      >
                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-neutral-100 border border-neutral-200/80 mb-3.5 shadow-xs group-hover:shadow-md transition-shadow">
                          <img
                            src={piece.image}
                            alt={piece.title}
                            className="w-full h-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[9px] font-display font-semibold tracking-widest uppercase text-neutral-900">
                            {piece.tag}
                          </div>
                        </div>
                        <h4 className="font-display text-sm font-semibold tracking-wider uppercase text-neutral-900 group-hover:text-black transition-colors m-0">
                          {piece.title}
                        </h4>
                        <span className="font-display text-xs text-neutral-500 font-medium mt-1">
                          {piece.price}
                        </span>
                      </Link>
                    ))}
                  </div>
                );
              }}
            </Await>
          </Suspense>
        </div>
      </section>

      {/* ========================================================
          4.5 EDITORIAL PRESS & CRITICAL ACCLAIM BAR
         ======================================================== */}
      <section
        className="py-16 sm:py-24 border-b border-neutral-100 bg-[#FAFAF9]"
        aria-label="Critical Acclaim and Press"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="font-display text-[10px] font-bold tracking-[0.35em] uppercase text-neutral-400 block mb-2">
              Critical Acclaim · Industry Recognition
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl text-neutral-900 m-0">
              The Architecture of Prestige
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                quote: 'A masterclass in modern architectural tailoring and restraint.',
                source: 'VOGUE',
                tag: 'SS 2026 Review',
              },
              {
                quote: 'Sculptural silhouettes engineered for quiet, effortless authority.',
                source: "HARPER'S BAZAAR",
                tag: 'The New Vanguard',
              },
              {
                quote: 'Uncompromising drape and material discipline define the atelier.',
                source: 'WALLPAPER*',
                tag: 'Design Architecture',
              },
              {
                quote: 'Contemporary luxury stripped of excess noise. Visceral presence.',
                source: 'HYPEBEAST',
                tag: 'Drop 01 Editorial',
              },
            ].map((press) => (
              <div
                key={press.source}
                className="p-6 sm:p-7 bg-white rounded-2xl border border-neutral-200/80 hover:border-neutral-900 transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div>
                  <span className="font-display text-[9px] font-bold tracking-[0.25em] uppercase text-neutral-400 block mb-3">
                    {press.tag}
                  </span>
                  <p className="font-serif text-sm sm:text-base font-normal tracking-wide text-neutral-800 leading-relaxed m-0 italic">
                    &ldquo;{press.quote}&rdquo;
                  </p>
                </div>
                <div className="pt-6 border-t border-neutral-100 mt-6 flex items-center justify-between">
                  <span className="font-display font-bold text-xs tracking-[0.24em] uppercase text-neutral-900">
                    {press.source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          5. EDITORIAL MANIFESTO // THE ARCHITECTURE OF PRESENCE
         ======================================================== */}
      <section
        id="editorial"
        ref={editorialRef}
        className="py-24 sm:py-32 bg-neutral-900 text-white overflow-hidden"
        aria-label="Editorial Campaign"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="font-display text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 block">
                Editorial Manifesto · SS 2026
              </span>
              <h2 className="font-serif font-normal text-3xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-tight m-0">
                The Architecture of Presence
              </h2>
              <p className="font-body text-base sm:text-lg leading-relaxed text-neutral-300 max-w-xl">
                We believe what you wear should speak before you enter a room and linger long after you leave. Designed with uncompromising discipline, our garments honor the female form through sculptural lines, structural draping, and tangible presence.
              </p>
              <div className="pt-4">
                <Link
                  to="/collections/all"
                  className="crush-btn crush-btn-light-primary group"
                >
                  <span>Discover The Drop</span>
                  <span className="group-hover-arrow">→</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-800">
                <img
                  src="https://cdn.shopify.com/s/files/1/0844/4359/4861/files/245b7f1e-28db-4c81-8b01-52504930113f-Max-Origin.webp?v=1793609651"
                  alt="CRUSH Editorial Silhouette in Motion"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. BRAND PHILOSOPHY STATEMENT
         ======================================================== */}
      <section
        className="py-24 sm:py-32 border-b border-neutral-100 bg-white text-center"
        aria-label="Brand Philosophy"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex justify-center mb-6">
            <img
              src="/images/crush-logo.png"
              alt="CRUSH CLOTHING Monogram"
              className="h-16 sm:h-20 w-auto object-contain"
              loading="lazy"
            />
          </div>
          <p className="font-display text-[11px] font-semibold tracking-[0.35em] text-neutral-400 uppercase mb-4">
            The Philosophy
          </p>
          <blockquote className="m-0">
            <p className="font-serif font-normal text-2xl sm:text-4xl md:text-5xl tracking-tight text-neutral-900 leading-snug">
              &ldquo;We create for the woman who claims space without asking. Clean proportions. Uncompromising drape. Zero noise.&rdquo;
            </p>
          </blockquote>
          <p className="font-body text-xs tracking-widest uppercase text-neutral-400 mt-8">
            United States Atelier • SS 2026
          </p>
        </div>
      </section>
    </div>
  );
}

const CATEGORIES = [
  {
    id: 'dresses-khaki',
    title: 'Sculpted Dresses',
    tag: 'SS26 · Natural Khaki',
    image: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/4a5c9b52-89bf-4835-9201-11dd8247d95a-Max-Origin.webp?v=1793609651',
    href: '/products/frill-tie-shoulder-mini-dress',
  },
  {
    id: 'dresses-noir',
    title: 'Editorial Silhouette',
    tag: 'SS26 · Atelier Drape',
    image: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/06a7c83488f94c948aa93f313cbf19c2-Max-Origin.webp?v=1793609652',
    href: '/products/frill-tie-shoulder-mini-dress',
  },
  {
    id: 'dresses-earth',
    title: 'Atelier Tailoring',
    tag: 'SS26 · Seated Drape',
    image: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/0bba3306-63ad-4175-bdb6-27554f82b875-Max-Origin.webp?v=1793609652',
    href: '/products/frill-tie-shoulder-mini-dress',
  },
  {
    id: 'detail-bow',
    title: 'Craft & Finishing',
    tag: 'SS26 · Hand-Tied Straps',
    image: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/8362fe37-bd92-4b75-8d98-bc7e0c69ffdb-Max-Origin.webp?v=1793609651',
    href: '/products/frill-tie-shoulder-mini-dress',
  },
];

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
