import {useMemo} from 'react';
import {useLoaderData, useSearchParams} from 'react-router';
import type {Route} from './+types/collections.all';
import {getPaginationVariables} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'All Collections | CRUSH CLOTHING Atelier'},
    {
      name: 'description',
      content:
        'Explore the full CRUSH CLOTHING collection. Contemporary silhouettes, structural outerwear, bias-cut silk, and minimalist luxury.',
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  getPaginationVariables(request, {
    pageBy: 24,
  });

  let shopifyProducts: any[] = [];
  try {
    const res = await storefront.query(CATALOG_QUERY, {
      variables: {first: 24},
    });
    shopifyProducts = res?.products?.nodes || [];
  } catch {
    shopifyProducts = [];
  }

  return {
    shopifyProducts,
  };
}

function loadDeferredData({context: _context}: Route.LoaderArgs) {
  return {};
}

export default function CollectionAll() {
  const {shopifyProducts} = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const sort = searchParams.get('sort') || 'featured';
  const categoryFilter = searchParams.get('category') || 'all';
  const priceFilter = searchParams.get('price') || 'all';

  const hasActiveFilters =
    categoryFilter !== 'all' ||
    priceFilter !== 'all' ||
    sort !== 'featured';

  const productsList = useMemo(() => {
    let list = [...(shopifyProducts || [])];

    // Filter by category / productType / title / tags
    if (categoryFilter !== 'all') {
      const catLower = categoryFilter.toLowerCase();
      list = list.filter((p: any) => {
        const typeMatch = p.productType?.toLowerCase().includes(catLower);
        const tagMatch = p.tags?.some?.((t: string) => t.toLowerCase().includes(catLower));
        const titleMatch = p.title?.toLowerCase().includes(catLower);
        return typeMatch || tagMatch || titleMatch;
      });
    }

    // Filter by price tier
    if (priceFilter === 'under-300') {
      list = list.filter(
        (p: any) => parseFloat(p.priceRange?.minVariantPrice?.amount || '0') < 300,
      );
    } else if (priceFilter === '300-400') {
      list = list.filter((p: any) => {
        const amt = parseFloat(p.priceRange?.minVariantPrice?.amount || '0');
        return amt >= 300 && amt <= 400;
      });
    } else if (priceFilter === 'over-400') {
      list = list.filter(
        (p: any) => parseFloat(p.priceRange?.minVariantPrice?.amount || '0') > 400,
      );
    }

    // Sort products
    if (sort === 'price-low') {
      list.sort(
        (a: any, b: any) =>
          parseFloat(a.priceRange?.minVariantPrice?.amount || '0') -
          parseFloat(b.priceRange?.minVariantPrice?.amount || '0'),
      );
    } else if (sort === 'price-high') {
      list.sort(
        (a: any, b: any) =>
          parseFloat(b.priceRange?.minVariantPrice?.amount || '0') -
          parseFloat(a.priceRange?.minVariantPrice?.amount || '0'),
      );
    }

    return list;
  }, [shopifyProducts, sort, categoryFilter, priceFilter]);

  const updateParam = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val === 'all' || val === 'featured') {
      params.delete(key);
    } else {
      params.set(key, val);
    }
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const productCount = productsList.length;

  return (
    <div className="crush-catalog-all bg-[var(--color-ivory)] text-[var(--color-ink)] min-h-screen">
      {/* Editorial Header */}
      <div className="border-b border-[var(--color-stone)] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="font-display text-[10px] font-semibold tracking-[0.3em] uppercase text-[var(--color-ink)]/50 block">
                Atelier Catalog · SS 2026
              </span>
              <h1 className="font-display font-bold text-4xl sm:text-6xl tracking-[0.06em] uppercase text-[var(--color-ink)] m-0 leading-tight">
                All Collections
              </h1>
              <p className="font-body text-sm sm:text-base text-[var(--color-ink)]/75 max-w-2xl leading-relaxed m-0 pt-1">
                Explore contemporary silhouettes, structural outerwear, bias-cut silk gowns, and precision tailoring.
              </p>
            </div>

            <div className="font-display text-xs tracking-widest uppercase text-[var(--color-ink)]/70">
              Showing {productCount} {productCount === 1 ? 'Piece' : 'Pieces'}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Facet Filter and Sort Toolbar */}
      <div className="border-b border-[var(--color-stone)] bg-[var(--color-stone-light)]/40 sticky top-18 z-30 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
          {/* Row 1: Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none max-w-full">
              {[
                {id: 'all', label: 'All Pieces'},
                {id: 'dresses', label: 'Dresses'},
                {id: 'outerwear', label: 'Outerwear'},
                {id: 'tops', label: 'Tops'},
                {id: 'sets', label: 'Sets'},
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateParam('category', cat.id)}
                  className={`px-4 py-1.5 rounded-full font-display text-xs tracking-wider uppercase border transition-all cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-[var(--color-ink)] text-[var(--color-ivory)] border-[var(--color-ink)] font-semibold shadow-xs'
                      : 'bg-transparent text-[var(--color-ink)] border-[var(--color-stone)] hover:border-black hover:bg-neutral-900 hover:text-white hover:shadow-xs hover:-translate-y-0.5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor="sort-select"
                className="font-display text-xs tracking-wider uppercase text-[var(--color-ink)]/70"
              >
                Sort:
              </label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="font-display text-xs tracking-wider uppercase bg-[var(--color-ivory)] border border-[var(--color-stone)] px-3 py-1.5 text-[var(--color-ink)] cursor-pointer focus:border-[var(--color-ink)] focus:outline-none"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Row 2: Secondary Filters (Price Range + Reset) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--color-stone)]/50">
            {/* Price Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none max-w-full">
              <span className="font-display text-[11px] tracking-wider uppercase text-[var(--color-ink)]/60 mr-1">
                Price:
              </span>
              {[
                {id: 'all', label: 'All'},
                {id: 'under-300', label: 'Under $300'},
                {id: '300-400', label: '$300 – $400'},
                {id: 'over-400', label: 'Over $400'},
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => updateParam('price', tier.id)}
                  className={`px-3 py-1 rounded-full font-display text-[11px] tracking-wider uppercase border transition-all cursor-pointer ${
                    priceFilter === tier.id
                      ? 'bg-[var(--color-ink)] text-[var(--color-ivory)] border-[var(--color-ink)] font-semibold'
                      : 'bg-white/30 text-[var(--color-ink)]/80 border-[var(--color-stone)] hover:border-black hover:bg-neutral-900 hover:text-white hover:shadow-xs hover:-translate-y-0.5'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>

            {/* Active Filters Reset */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="font-display text-xs tracking-wider uppercase text-[var(--color-ink)] hover:underline cursor-pointer bg-transparent border-0 p-0"
              >
                Reset All Filters ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Product Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {productsList.length === 0 ? (
          hasActiveFilters ? (
            <div className="py-24 text-center border border-dashed border-[var(--color-stone)] bg-white/40">
              <h2 className="font-display text-lg tracking-widest uppercase text-[var(--color-ink)] mb-2">
                No Pieces Found
              </h2>
              <p className="font-body text-sm text-[var(--color-ink)]/60 mb-6">
                No pieces match your active filter combination.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="crush-btn crush-btn-primary"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="py-24 text-center max-w-lg mx-auto bg-white/50 border border-[var(--color-stone)] p-8 sm:p-12">
              <span className="font-display text-[10px] font-semibold tracking-[0.3em] uppercase text-[var(--color-ink)]/50 block mb-2">
                Live Storefront · Shopify Catalog
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-[0.08em] uppercase text-[var(--color-ink)] mb-3">
                No Products Added Yet
              </h2>
              <p className="font-body text-sm text-[var(--color-ink)]/70 mb-8 leading-relaxed">
                Your Shopify store is connected! Add products in your Shopify Admin and publish them to the <strong>Crush Clothing Headless</strong> sales channel to display them here instantly.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="crush-btn crush-btn-primary"
              >
                Refresh Catalog ↻
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {productsList.map((product, index) => (
              <ProductItem
                key={product.id}
                product={product}
                loading={index < 8 ? 'eager' : 'lazy'}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const COLLECTION_ITEM_FRAGMENT = `#graphql
  fragment MoneyCollectionItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment CollectionItem on Product {
    id
    handle
    title
    productType
    tags
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyCollectionItem
      }
      maxVariantPrice {
        ...MoneyCollectionItem
      }
    }
  }
` as const;

const CATALOG_QUERY = `#graphql
  ${COLLECTION_ITEM_FRAGMENT}
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
  ) @inContext(country: $country, language: $language) {
    products(first: $first) {
      nodes {
        ...CollectionItem
      }
    }
  }
` as const;
