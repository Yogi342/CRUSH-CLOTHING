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
    <div className="crush-homepage bg-[var(--color-ivory)] text-[var(--color-ink)]">
      {/* 1. HERO CAMPAIGN SECTION */}
      <section
        ref={heroRef}
        className="crush-hero relative min-h-[82vh] lg:min-h-[88vh] flex items-center justify-center border-b border-[var(--color-stone)] overflow-hidden"
        aria-label="Campaign Hero"
      >
        {/* Background Editorial Image */}
        <div className="crush-hero-bg absolute inset-0 z-0">
          <img
            src="/images/hero-banner.jpg"
            alt="CRUSH SS 2026 Editorial Campaign"
            className="w-full h-full object-cover object-center filter brightness-[0.92]"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)]/75 via-[var(--color-ink)]/25 to-transparent" />
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full text-center flex flex-col items-center">
          <div className="crush-hero-tag inline-block px-3.5 py-1 mb-6 border border-[var(--color-ivory)]/40 bg-[var(--color-ink)]/40 backdrop-blur-xs text-[var(--color-ivory)] font-display text-[10px] sm:text-xs tracking-[0.25em] uppercase">
            Spring / Summer 2026 // US Atelier Drop 01
          </div>

          <h1 className="crush-hero-title font-display font-bold text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-[0.12em] uppercase text-[var(--color-ivory)] m-0 leading-none drop-shadow-sm select-none">
            CRUSH
          </h1>

          <p className="crush-hero-sub font-display text-sm sm:text-lg tracking-[0.2em] uppercase text-[var(--color-stone-light)] mt-4 mb-8 max-w-xl text-center">
            Sculptural Silhouettes for the Unapologetic Woman
          </p>

          <div className="crush-hero-ctas flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              to="/collections/all"
              className="crush-btn crush-btn-light-primary w-full sm:w-auto shadow-md"
            >
              Shop New Arrivals →
            </Link>
            <a
              href="#categories"
              className="crush-btn crush-btn-light-secondary w-full sm:w-auto backdrop-blur-xs"
            >
              Explore Collections
            </a>
          </div>
        </div>
      </section>

      {/* 2. THE LIVING RACK // TRY-ON MOTION CENTERPIECE */}
      <LivingRack />

      {/* 3. CATEGORY DISCOVERY SECTION */}
      <section
        id="categories"
        className="py-20 sm:py-28 border-b border-[var(--color-stone)] bg-[var(--color-ivory)]"
        aria-label="Curated Categories"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="font-display text-[11px] font-semibold tracking-[0.25em] text-[var(--color-ink)]/60 uppercase m-0 mb-1">
                Curated Architecture
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-4xl tracking-[0.08em] uppercase text-[var(--color-ink)] m-0">
                Collections
              </h2>
            </div>
            <Link
              to="/collections/all"
              className="font-display text-xs font-semibold tracking-[0.16em] uppercase text-[var(--color-ink)] hover:underline underline-offset-4 no-underline"
            >
              View All Categories →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={cat.href}
                className="group block relative overflow-hidden bg-[var(--color-stone-light)] border border-[var(--color-stone)] no-underline focus-visible:outline-2 focus-visible:outline-[var(--color-ink)]"
              >
                <div className="aspect-[3/4] w-full overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)]/80 via-transparent to-transparent" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 text-[var(--color-ivory)]">
                  <span className="font-display text-[10px] tracking-[0.25em] uppercase text-[var(--color-stone)] block mb-1">
                    {cat.tag}
                  </span>
                  <h3 className="font-display text-base font-bold tracking-[0.12em] uppercase m-0">
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
        className="py-20 sm:py-28 border-b border-[var(--color-stone)] bg-[var(--color-ivory)]"
        aria-labelledby="new-arrivals-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="font-display text-[11px] font-semibold tracking-[0.25em] text-[var(--color-ink)]/60 uppercase m-0 mb-1">
                Drop 01 // Fresh Releases
              </p>
              <h2
                id="new-arrivals-heading"
                className="font-display font-bold text-2xl sm:text-4xl tracking-[0.08em] uppercase text-[var(--color-ink)] m-0"
              >
                New Arrivals
              </h2>
            </div>
            <Link
              to="/collections/all"
              className="font-display text-xs font-semibold tracking-[0.16em] uppercase text-[var(--color-ink)] hover:underline underline-offset-4 no-underline"
            >
              Shop Full Drop →
            </Link>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="aspect-[3/4] bg-[var(--color-stone)]" />
                    <div className="h-4 bg-[var(--color-stone)] w-3/4" />
                    <div className="h-3 bg-[var(--color-stone)] w-1/4" />
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
                    <div className="py-16 text-center border border-[var(--color-stone)] bg-white/40 max-w-lg mx-auto p-8">
                      <span className="font-display text-[10px] font-semibold tracking-[0.25em] uppercase text-[var(--color-ink)]/50 block mb-2">
                        Atelier SS 2026 Arrivals
                      </span>
                      <h4 className="font-display font-semibold text-xl uppercase tracking-wider text-[var(--color-ink)] mb-2">
                        Collection Updating
                      </h4>
                      <p className="font-body text-xs sm:text-sm text-[var(--color-ink)]/70 mb-6 leading-relaxed">
                        Pieces published to the Headless sales channel in Shopify Admin will appear here dynamically.
                      </p>
                      <Link
                        to="/collections/all"
                        className="crush-btn crush-btn-primary"
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
        className="py-14 sm:py-20 border-b border-[var(--color-stone)] bg-[var(--color-stone-light)]/40"
        aria-label="Critical Acclaim and Press"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="font-display text-[10px] font-semibold tracking-[0.35em] uppercase text-[var(--color-ink)]/50 block mb-1">
              Critical Acclaim // Industry Recognition
            </span>
            <h3 className="font-display font-bold text-xl sm:text-2xl tracking-[0.12em] uppercase text-[var(--color-ink)] m-0">
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
                className="p-6 bg-white border border-[var(--color-stone)] hover:border-[var(--color-ink)] transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-1"
              >
                <div>
                  <span className="font-display text-[9px] font-semibold tracking-[0.25em] uppercase text-[var(--color-ink)]/40 block mb-3">
                    {press.tag}
                  </span>
                  <p className="font-display text-xs sm:text-sm font-medium tracking-wide uppercase text-[var(--color-ink)] leading-relaxed m-0 italic">
                    &ldquo;{press.quote}&rdquo;
                  </p>
                </div>
                <div className="pt-6 border-t border-[var(--color-stone)]/60 mt-6 flex items-center justify-between">
                  <span className="font-display font-bold text-xs tracking-[0.2em] uppercase text-[var(--color-ink)]">
                    {press.source}
                  </span>
                  <span className="text-xs text-[var(--color-stone-dark)]">✦</span>
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
        className="py-24 sm:py-32 bg-[var(--color-ink)] text-[var(--color-ivory)] overflow-hidden"
        aria-label="Editorial Campaign"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="font-display text-[10px] font-semibold tracking-[0.3em] uppercase text-[var(--color-stone)] block">
                Editorial Manifesto // SS 2026
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl tracking-[0.06em] uppercase text-[var(--color-ivory)] leading-tight m-0">
                The Architecture of Presence
              </h2>
              <p className="font-body text-base sm:text-lg leading-relaxed text-[var(--color-stone-light)] max-w-xl">
                We believe what you wear should speak before you enter a room and linger long after you leave. Designed with uncompromising discipline, our garments honor the female form through sculptural lines, structural draping, and tangible presence.
              </p>
              <div className="pt-4">
                <Link
                  to="/collections/all"
                  className="crush-btn crush-btn-light-primary"
                >
                  Discover The Drop →
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative aspect-[4/5] overflow-hidden border border-[var(--color-ivory)]/20 shadow-2xl">
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
        className="py-24 sm:py-32 border-b border-[var(--color-stone)] bg-[var(--color-ivory)] text-center"
        aria-label="Brand Philosophy"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="font-display text-xs font-semibold tracking-[0.3em] text-[var(--color-ink)]/50 uppercase mb-4">
            CRUSH CLOTHING
          </p>
          <blockquote className="m-0">
            <p className="font-display font-bold text-2xl sm:text-4xl md:text-5xl tracking-[0.05em] uppercase text-[var(--color-ink)] leading-snug">
              “We create for the woman who claims space without asking. Clean proportions. Uncompromising drape. Zero noise.”
            </p>
          </blockquote>
          <p className="font-body text-xs tracking-widest uppercase text-[var(--color-stone-dark)] mt-8">
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
    href: '/collections/dresses',
  },
  {
    id: 'tops',
    title: 'Tops & Shirting',
    tag: 'Category 02',
    image: '/images/look-studio-3.jpg',
    href: '/collections/tops',
  },
  {
    id: 'outerwear',
    title: 'Tailored Outerwear',
    tag: 'Category 03',
    image: '/images/look-studio-4.jpg',
    href: '/collections/outerwear',
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
