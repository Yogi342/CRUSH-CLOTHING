import {useMemo} from 'react';
import {redirect, useLoaderData, Link, useSearchParams} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';

export const meta: Route.MetaFunction = ({data}) => {
  const title = data?.collection?.title ?? 'Collection';
  return [
    {title: `CRUSH CLOTHING | ${title}`},
    {
      name: 'description',
      content: `Explore the ${title} collection by CRUSH CLOTHING. Sculptural silhouettes and modern tailoring for the contemporary woman.`,
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 16,
  });

  if (!handle) {
    throw redirect('/collections/all');
  }

  // Attempt to query the specified collection from Shopify
  let collection = null;
  let shopifyProducts: any[] = [];

  try {
    const response = await storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables},
    });
    collection = response?.collection;
    shopifyProducts = collection?.products?.nodes || [];
  } catch {
    collection = null;
    shopifyProducts = [];
  }

  // Fallback to synthetic collection if Shopify collection is absent
  if (!collection) {
    const formattedTitle = formatHandle(handle);
    collection = {
      id: `gid://shopify/Collection/${handle}`,
      handle,
      title: formattedTitle,
      description: `Curated ${formattedTitle} collection designed for the modern silhouette. Crafted with sculptural tailoring and architectural drape.`,
      products: {nodes: []},
    };
  }

  return {
    collection,
    handle,
    shopifyProducts,
  };
}

function loadDeferredData({context: _context}: Route.LoaderArgs) {
  return {};
}

function formatHandle(handle: string) {
  return handle
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function CollectionHandle() {
  const {collection, handle, shopifyProducts} = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get('sort') || 'featured';

  const productsList = useMemo(() => {
    let list = [...(shopifyProducts || [])];

    // Apply sorting
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
  }, [shopifyProducts, sort]);

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams);
    if (newSort === 'featured') {
      params.delete('sort');
    } else {
      params.set('sort', newSort);
    }
    setSearchParams(params);
  };

  const productCount = productsList.length;

  return (
    <div className="crush-collection-page bg-[var(--color-ivory)] text-[var(--color-ink)] min-h-screen">
      {/* Editorial Collection Header */}
      <div className="border-b border-[var(--color-stone)] py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="font-display text-[10px] font-semibold tracking-[0.25em] text-[var(--color-ink)]/50 uppercase block">
                Collection Archive // {handle.toUpperCase()}
              </span>
              <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl tracking-[0.06em] uppercase text-[var(--color-ink)] m-0 leading-tight">
                {collection.title}
              </h1>
              {collection.description && (
                <p className="font-body text-sm sm:text-base text-[var(--color-ink)]/75 max-w-2xl leading-relaxed m-0 pt-1">
                  {collection.description}
                </p>
              )}
            </div>

            <div className="font-display text-xs tracking-widest uppercase text-[var(--color-ink)]/70">
              {productCount} {productCount === 1 ? 'Piece' : 'Pieces'} Available
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="border-b border-[var(--color-stone)] bg-[var(--color-stone-light)]/40 sticky top-18 z-30 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {[
              {handle: 'all', label: 'All'},
              {handle: 'dresses', label: 'Dresses'},
              {handle: 'tops', label: 'Tops'},
              {handle: 'outerwear', label: 'Outerwear'},
              {handle: 'sets', label: 'Sets'},
            ].map((cat) => (
              <Link
                key={cat.handle}
                to={`/collections/${cat.handle}`}
                className={`px-3.5 py-1 font-display text-xs tracking-wider uppercase no-underline transition-colors ${
                  handle === cat.handle
                    ? 'bg-[var(--color-ink)] text-[var(--color-ivory)] font-semibold'
                    : 'bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-stone)]/50'
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="collection-sort"
              className="font-display text-xs tracking-widest uppercase text-[var(--color-ink)]/60"
            >
              Sort:
            </label>
            <select
              id="collection-sort"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-transparent border border-[var(--color-stone)] text-[var(--color-ink)] font-display text-xs uppercase px-2.5 py-1 outline-none cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Product Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {productsList.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-[var(--color-stone)]">
            <h2 className="font-display text-lg tracking-widest uppercase text-[var(--color-ink)] mb-2">
              No Pieces Found
            </h2>
            <p className="font-body text-sm text-[var(--color-ink)]/60 mb-6">
              There are currently no items matching this category filter.
            </p>
            <Link
              to="/collections/all"
              className="inline-flex px-6 py-3 bg-[var(--color-ink)] text-[var(--color-ivory)] font-display text-xs tracking-widest uppercase no-underline cursor-pointer"
            >
              Browse Complete Catalog
            </Link>
          </div>
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

      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
  }
` as const;

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
