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
          1. CONTEMPORARY EDITORIAL LUXURY HERO CAMPAIGN SECTION
          (Replaces the outdated dark cyberpunk streetwear banner)
         ======================================================== */}
      <section
        ref={heroRef}
        className="crush-hero relative bg-white border-b border-neutral-100 py-12 sm:py-16 lg:py-24 overflow-hidden"
        aria-label="Campaign Hero"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Refined Editorial Typography & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="crush-hero-tag inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-neutral-100 border border-neutral-200/80 text-neutral-800 font-display text-[11px] font-semibold tracking-[0.2em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Spring / Summer 2026 Collection</span>
              </div>

              <h1 className="crush-hero-title font-serif font-normal text-3xl sm:text-5xl lg:text-7xl tracking-tight text-neutral-900 m-0 leading-[1.12]">
                Effortless Silhouettes.
                <span className="block italic text-neutral-600 font-serif font-normal mt-1">
                  Sculptural Presence.
                </span>
              </h1>

              <p className="crush-hero-sub font-body text-base sm:text-lg text-neutral-600 max-w-xl leading-relaxed m-0">
                Contemporary women’s luxury apparel crafted from breathable natural cotton weaves and French-finished seams. Designed in New York for an effortless day-to-evening presence.
              </p>

              <div className="crush-hero-ctas flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  to="/collections/all"
                  className="rounded-full bg-neutral-900 hover:bg-black text-white px-8 py-3.5 sm:py-4 font-display text-xs font-bold tracking-widest uppercase shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer text-center"
                >
                  Shop New Arrivals →
                </Link>
                <Link
                  to="/products/frill-tie-shoulder-mini-dress"
                  className="rounded-full border border-neutral-300 hover:border-black text-neutral-900 px-8 py-3.5 sm:py-4 font-display text-xs font-bold tracking-widest uppercase transition-all hover:bg-neutral-50 cursor-pointer text-center"
                >
                  The Frill Tie Mini Edit
                </Link>
              </div>

              <div className="pt-8 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 text-[11px] font-display uppercase tracking-wider text-neutral-500">
                <div>
                  <span className="font-bold text-neutral-900 block">100% Cotton</span>
                  <span className="text-[10px] text-neutral-400 font-body normal-case">Natural breathable weave</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-900 block">Atelier Sizing</span>
                  <span className="text-[10px] text-neutral-400 font-body normal-case">Interactive Fit Advisor</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-900 block">Express Delivery</span>
                  <span className="text-[10px] text-neutral-400 font-body normal-case">Complimentary over $150</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Fashion Lookbook Editorial Showcase */}
            <div className="lg:col-span-5">
              <div className="crush-hero-bg relative aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-neutral-100 bg-neutral-100 group">
                <img
                  src="https://cdn.shopify.com/s/files/1/0844/4359/4861/files/4a5c9b52-89bf-4835-9201-11dd8247d95a-Max-Origin.webp?v=1793609651"
                  alt="CRUSH Atelier SS26 Editorial Campaign"
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  loading="eager"
                />

                {/* Floating Eyebrow Pill */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-neutral-200/60 shadow-xs">
                  <span className="font-display text-[10px] font-bold tracking-widest uppercase text-neutral-900">
                    Atelier Edition 01
                  </span>
                </div>

                {/* Floating Bottom Card: Direct Link to the Featured Piece */}
                <Link
                  to="/products/frill-tie-shoulder-mini-dress"
                  className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-xl p-4 rounded-2xl border border-neutral-200/80 shadow-lg flex items-center justify-between no-underline group/card hover:bg-white transition-all"
                >
                  <div className="min-w-0 pr-3">
                    <span className="font-display text-[9px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Iconic Piece
                    </span>
                    <h4 className="font-serif text-sm font-semibold text-neutral-900 mt-1 m-0 truncate">
                      Frill Tie Shoulder Mini Dress
                    </h4>
                    <p className="font-body text-xs text-neutral-500 m-0">
                      $31.99 • Khaki, Brown & Black
                    </p>
                  </div>
                  <span className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 group-hover/card:bg-black group-hover/card:scale-105 transition-all text-xs">
                    →
                  </span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. THE LIVING RACK // TRY-ON MOTION CENTERPIECE */}
      <LivingRack />

      {/* 3. CATEGORY DISCOVERY SECTION */}
      <section
        id="categories"
        className="py-20 sm:py-28 border-b border-neutral-100 bg-white"
        aria-label="Curated Categories"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="font-display text-[11px] font-semibold tracking-[0.25em] text-neutral-400 uppercase m-0 mb-1">
                Curated Architecture
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-4xl tracking-[0.08em] uppercase text-neutral-900 m-0">
                Collections
              </h2>
            </div>
            <Link
              to="/collections/all"
              className="font-display text-xs font-semibold tracking-[0.16em] uppercase text-neutral-900 hover:underline underline-offset-4 no-underline"
            >
              View All Categories →
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={cat.href}
                className="group block relative overflow-hidden rounded-2xl bg-neutral-100 border border-neutral-100 no-underline shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="aspect-[3/4] w-full overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="font-display text-[10px] tracking-[0.25em] uppercase text-neutral-300 block mb-1">
                    {cat.tag}
                  </span>
                  <h3 className="font-display text-base font-bold tracking-[0.12em] uppercase m-0 text-white">
                    {cat.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. NEW ARRIVALS // REAL SHOPIFY STOREFRONT PRODUCTS */}
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
                const products = response?.products?.nodes || [];

                if (products.length === 0) {
                  return (
                    <div className="py-16 text-center border border-neutral-150 rounded-2xl bg-neutral-50 max-w-lg mx-auto p-8 shadow-xs">
                      <span className="font-display text-[10px] font-semibold tracking-[0.25em] uppercase text-neutral-400 block mb-2">
                        Atelier SS 2026 Arrivals
                      </span>
                      <h4 className="font-display font-semibold text-xl uppercase tracking-wider text-neutral-900 mb-2">
                        Collection Updating
                      </h4>
                      <p className="font-body text-xs sm:text-sm text-neutral-500 mb-6 leading-relaxed">
                        Pieces published to the Headless sales channel in Shopify Admin will appear here dynamically.
                      </p>
                      <Link
                        to="/collections/all"
                        className="rounded-full bg-neutral-900 text-white px-6 py-3 font-display text-xs uppercase tracking-wider font-semibold hover:bg-black inline-block"
                      >
                        Explore Collections Catalog →
                      </Link>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {products.map((product: any) => (
                      <ProductItem key={product.id} product={product} />
                    ))}
                  </div>
                );
              }}
            </Await>
          </Suspense>
        </div>
      </section>

      {/* 4.5 EDITORIAL PRESS & CRITICAL ACCLAIM BAR */}
      <section
        className="py-14 sm:py-20 border-b border-neutral-100 bg-neutral-50/50"
        aria-label="Critical Acclaim and Press"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="font-display text-[10px] font-semibold tracking-[0.35em] uppercase text-neutral-400 block mb-1">
              Critical Acclaim · Industry Recognition
            </span>
            <h3 className="font-display font-bold text-xl sm:text-2xl tracking-[0.12em] uppercase text-neutral-900 m-0">
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
                className="p-6 bg-white rounded-2xl border border-neutral-100 hover:border-black transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-1"
              >
                <div>
                  <span className="font-display text-[9px] font-semibold tracking-[0.25em] uppercase text-neutral-400 block mb-3">
                    {press.tag}
                  </span>
                  <p className="font-display text-xs sm:text-sm font-medium tracking-wide uppercase text-neutral-800 leading-relaxed m-0 italic">
                    &ldquo;{press.quote}&rdquo;
                  </p>
                </div>
                <div className="pt-6 border-t border-neutral-100 mt-6 flex items-center justify-between">
                  <span className="font-display font-bold text-xs tracking-[0.2em] uppercase text-neutral-900">
                    {press.source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. EDITORIAL ATTITUDE CHAPTER */}
      <section
        id="editorial"
        ref={editorialRef}
        className="py-24 sm:py-32 bg-neutral-900 text-white overflow-hidden"
        aria-label="Editorial Campaign"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="font-display text-[10px] font-semibold tracking-[0.3em] uppercase text-neutral-400 block">
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
                  className="rounded-full bg-white text-neutral-900 hover:bg-neutral-100 px-8 py-4 font-display text-xs font-bold tracking-widest uppercase inline-block shadow-md transition-all"
                >
                  Discover The Drop →
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src="/images/look-studio-1.jpg"
                  alt="CRUSH Editorial Silhouette"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BRAND STATEMENT */}
      <section
        className="py-24 sm:py-32 border-b border-neutral-100 bg-white text-center"
        aria-label="Brand Philosophy"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="font-display text-xs font-semibold tracking-[0.3em] text-neutral-400 uppercase mb-4">
            CRUSH CLOTHING
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
    id: 'dresses',
    title: 'Dresses & Gowns',
    tag: 'Category 01',
    image: '/images/look-studio-2.jpg',
    href: '/collections/all',
  },
  {
    id: 'tops',
    title: 'Tops & Shirting',
    tag: 'Category 02',
    image: '/images/look-studio-3.jpg',
    href: '/collections/all',
  },
  {
    id: 'outerwear',
    title: 'Tailored Outerwear',
    tag: 'Category 03',
    image: '/images/look-studio-4.jpg',
    href: '/collections/all',
  },
  {
    id: 'sets',
    title: 'Minimal Sets',
    tag: 'Category 04',
    image: '/images/look-studio-5.jpg',
    href: '/collections/all',
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
