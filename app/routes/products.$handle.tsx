import {useState, useEffect, useMemo, useRef} from 'react';
import {redirect, useLoaderData, useSearchParams, Link} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  Money,
} from '@shopify/hydrogen';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {ProductItem} from '~/components/ProductItem';

export const meta: Route.MetaFunction = ({data}) => {
  const title = data?.product?.title ?? 'Product';
  return [
    {title: `CRUSH CLOTHING | ${title}`},
    {
      name: 'description',
      content: `${title} — Contemporary women's luxury apparel by CRUSH CLOTHING. Atelier craftsmanship and modern silhouette.`,
    },
    {
      rel: 'canonical',
      href: `/products/${data?.product?.handle}`,
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

  if (!handle) {
    throw redirect('/collections/all');
  }

  const selectedOptions = getSelectedProductOptions(request);

  let shopifyProduct: any = null;
  try {
    const res = await storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions},
    });
    shopifyProduct = res?.product;
  } catch (error) {
    console.error('Error fetching product from Storefront API:', error);
    shopifyProduct = null;
  }

  if (!shopifyProduct?.id) {
    throw redirect('/collections/all');
  }

  // Related pieces query
  let related: any[] = [];
  try {
    const relRes = await storefront.query(RELATED_PRODUCTS_QUERY, {
      variables: {first: 6},
    });
    related = (relRes?.products?.nodes || [])
      .filter((p: any) => p.handle !== handle)
      .slice(0, 4);
  } catch {
    related = [];
  }

  return {
    product: shopifyProduct,
    related,
  };
}

function loadDeferredData({context: _context}: Route.LoaderArgs) {
  return {};
}

// Smart color hex resolver for luxury garment swatches
function resolveColorHex(colorName: string): string {
  const n = (colorName || '').toLowerCase().trim();
  const palette: Record<string, string> = {
    'khaki color': '#C3B091',
    khaki: '#C3B091',
    brown: '#5C4033',
    'dark brown': '#3B2F2F',
    black: '#111111',
    white: '#FFFFFF',
    ivory: '#F4F1E9',
    'chalk ivory': '#F4F1E9',
    cream: '#FDFBF7',
    beige: '#E8DCCA',
    taupe: '#B38B6D',
    sand: '#D2B48C',
    camel: '#C19A6B',
    stone: '#D8D5CE',
    'soft stone': '#D8D5CE',
    charcoal: '#36454F',
    grey: '#808080',
    gray: '#808080',
    navy: '#0A192F',
    blue: '#1E3A8A',
    olive: '#556B2F',
    sage: '#9DC183',
    green: '#1B4D3E',
    emerald: '#097969',
    burgundy: '#800020',
    wine: '#722F37',
    red: '#A31D1D',
    rust: '#B7410E',
    rose: '#E8C5C8',
    pink: '#F4C2C2',
    terracotta: '#D97443',
    tan: '#D2B48C',
  };

  return palette[n] || '#A09D94';
}

export default function ProductPage() {
  const {product, related} = useLoaderData<typeof loader>();
  const {open} = useAside();
  const [searchParams, setSearchParams] = useSearchParams();

  // All product variants and options from Shopify
  const options = useMemo(() => product?.options || [], [product]);
  const variants = useMemo(() => product?.variants?.nodes || [], [product]);
  const images = useMemo(() => {
    if (product?.images?.nodes?.length) return product.images.nodes;
    if (product?.featuredImage) return [product.featuredImage];
    return [];
  }, [product]);

  // Compute selected options from URL search params or fallback to first available variant
  const selectedOptions = useMemo(() => {
    const current: Record<string, string> = {};
    const fallbackVariant =
      product?.selectedOrFirstAvailableVariant || variants[0];

    options.forEach((opt: any) => {
      const fromUrl = searchParams.get(opt.name);
      if (fromUrl && opt.values?.includes(fromUrl)) {
        current[opt.name] = fromUrl;
      } else {
        const fromVariant = fallbackVariant?.selectedOptions?.find(
          (so: any) => so.name === opt.name,
        )?.value;
        current[opt.name] = fromVariant || opt.values?.[0] || '';
      }
    });

    return current;
  }, [options, variants, searchParams, product]);

  // Find exact matching variant based on currently selected options
  const activeVariant = useMemo(() => {
    const matched = variants.find((v: any) =>
      v.selectedOptions?.every(
        (so: any) => selectedOptions[so.name] === so.value,
      ),
    );
    return matched || product?.selectedOrFirstAvailableVariant || variants[0];
  }, [variants, selectedOptions, product]);

  // Interactive UI states
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'details' | 'fabric' | 'fit' | 'shipping'
  >('details');
  const [addedToast, setAddedToast] = useState(false);
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const mainCtaRef = useRef<HTMLDivElement>(null);

  // Sync image to variant image when active variant changes
  useEffect(() => {
    if (activeVariant?.image?.url) {
      const idx = images.findIndex(
        (img: any) => img.url === activeVariant.image.url,
      );
      if (idx !== -1) {
        setActiveImageIndex(idx);
      }
    }
  }, [activeVariant, images]);

  // Intersection observer for sticky quick-add bar
  useEffect(() => {
    const el = mainCtaRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStickyVisible(
          !entry.isIntersecting && entry.boundingClientRect.top < 0,
        );
      },
      {threshold: 0, rootMargin: '-60px 0px 0px 0px'},
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Update selected option in URL and state
  const handleSelectOption = (name: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(name, value);
    setSearchParams(nextParams, {replace: true, preventScrollReset: true});

    // Check if new combination maps to a variant with a unique image
    const potentialSelected = {...selectedOptions, [name]: value};
    const potentialVariant = variants.find((v: any) =>
      v.selectedOptions?.every(
        (so: any) => potentialSelected[so.name] === so.value,
      ),
    );
    if (potentialVariant?.image?.url) {
      const idx = images.findIndex(
        (img: any) => img.url === potentialVariant.image.url,
      );
      if (idx !== -1) {
        setActiveImageIndex(idx);
      }
    }
  };

  const price = activeVariant?.price ||
    product?.priceRange?.minVariantPrice || {
      amount: '31.99',
      currencyCode: 'USD',
    };
  const compareAtPrice = activeVariant?.compareAtPrice;
  const isAvailable = Boolean(activeVariant?.availableForSale);

  const handleAddToCart = () => {
    if (!activeVariant?.id || !isAvailable) return;
    open('cart');
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  // Check if option is a color option
  const isColorOption = (optName: string) =>
    /colou?r/i.test(optName);

  // Check if option is a size option
  const isSizeOption = (optName: string) =>
    /size/i.test(optName);

  // Filter out single "Title: Default Title" option
  const meaningfulOptions = options.filter(
    (opt: any) =>
      !(opt.name.toLowerCase() === 'title' && opt.values?.[0] === 'Default Title'),
  );

  return (
    <div className="crush-pdp bg-[var(--color-ivory)] text-[var(--color-ink)] min-h-screen py-8 sm:py-16">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: product.description || 'CRUSH CLOTHING designer apparel.',
            image: images[0]?.url,
            offers: {
              '@type': 'Offer',
              price: price.amount,
              priceCurrency: price.currencyCode,
              availability: isAvailable
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            },
          }),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 font-display text-[11px] tracking-[0.2em] uppercase text-[var(--color-ink)]/50 flex flex-wrap items-center gap-2"
        >
          <Link to="/" className="hover:text-[var(--color-ink)] no-underline">
            Home
          </Link>
          <span>/</span>
          <Link
            to="/collections/all"
            className="hover:text-[var(--color-ink)] no-underline"
          >
            Collections
          </Link>
          <span>/</span>
          <span className="text-[var(--color-ink)]/70">
            {product.productType || 'Atelier'}
          </span>
          <span>/</span>
          <span className="text-[var(--color-ink)] font-bold">
            {product.title}
          </span>
        </nav>

        {/* 2-Column Luxury Atelier PDP Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Left Column: Interactive Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Stage Viewport with High-Res Fabric Inspect */}
            <div
              onClick={() => setIsZoomModalOpen(true)}
              className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--color-stone-light)] border border-[var(--color-stone)] shadow-sm group cursor-zoom-in"
              role="button"
              tabIndex={0}
              aria-label="Inspect fabric weave and tailoring in high resolution"
              onKeyDown={(e) => e.key === 'Enter' && setIsZoomModalOpen(true)}
            >
              {images[activeImageIndex] ? (
                <img
                  src={images[activeImageIndex].url}
                  alt={images[activeImageIndex].altText || product.title}
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-xs text-[var(--color-ink)]/40 uppercase tracking-widest">
                  Atelier Visual Preview
                </div>
              )}

              {/* Tag overlay */}
              <div className="absolute top-4 left-4 bg-[var(--color-ivory)]/95 backdrop-blur-xs px-3.5 py-1.5 border border-[var(--color-stone)]">
                <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--color-ink)]">
                  {product.productType || 'CRUSH ATELIER // US'}
                </span>
              </div>

              {/* Counter badge */}
              {images.length > 1 && (
                <div className="absolute top-4 right-4 bg-[var(--color-ink)]/85 text-[var(--color-ivory)] backdrop-blur-xs px-3 py-1 text-[10px] font-display tracking-widest uppercase">
                  {activeImageIndex + 1} / {images.length}
                </div>
              )}

              {/* Hover Inspect Pill */}
              <div className="absolute bottom-4 right-4 bg-[var(--color-ink)]/90 text-[var(--color-ivory)] backdrop-blur-xs px-3.5 py-1.5 border border-[var(--color-stone)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-md">
                <span className="font-display text-[10px] font-semibold tracking-[0.18em] uppercase flex items-center gap-1.5">
                  <span>✦</span> Zoom Atelier Drape
                </span>
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div
                className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-60 overflow-y-auto pr-1"
                role="region"
                aria-label="Product angle thumbnails"
              >
                {images.map((img: any, idx: number) => {
                  const isActive = activeImageIndex === idx;
                  return (
                    <button
                      key={img.id || img.url || idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative aspect-[3/4] overflow-hidden border transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'border-[var(--color-ink)] ring-2 ring-[var(--color-ink)] shadow-sm'
                          : 'border-[var(--color-stone)] opacity-70 hover:opacity-100 hover:border-[var(--color-stone-dark)]'
                      }`}
                      aria-label={`View photo angle ${idx + 1}`}
                    >
                      <img
                        src={img.url}
                        alt={img.altText || `Angle ${idx + 1}`}
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                      />
                      {isActive && (
                        <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[var(--color-ink)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Purchasing & Atelier Specification Console */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit space-y-6">
            <div className="border-b border-[var(--color-stone)] pb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-[10px] font-semibold tracking-[0.3em] uppercase text-[var(--color-ink)]/50">
                  {product.vendor || 'CRUSH ATELIER // US'}
                </span>
                <span
                  className={`font-display text-[10px] tracking-widest uppercase px-2.5 py-0.5 border ${
                    isAvailable
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                      : 'text-stone-600 bg-stone-100 border-stone-300'
                  }`}
                >
                  {isAvailable ? '● In Stock' : '✕ Out of Stock'}
                </span>
              </div>

              <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-[0.06em] uppercase text-[var(--color-ink)] m-0 leading-tight">
                {product.title}
              </h1>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 mt-4">
                <span className="font-body text-2xl font-bold text-[var(--color-ink)]">
                  <Money data={price} />
                </span>
                {compareAtPrice && (
                  <span className="font-body text-base text-[var(--color-ink)]/40 line-through">
                    <Money data={compareAtPrice} />
                  </span>
                )}
                <span className="font-display text-[10px] tracking-widest text-[var(--color-stone-dark)] uppercase">
                  Taxes Included
                </span>
              </div>
            </div>

            {/* Dynamic Options Selectors */}
            {meaningfulOptions.map((opt: any) => {
              const optName = opt.name;
              const currentValue = selectedOptions[optName];

              // Color Option Swatch View
              if (isColorOption(optName)) {
                return (
                  <div key={opt.id || optName} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs font-semibold tracking-[0.14em] uppercase text-[var(--color-ink)]">
                        {optName}:{' '}
                        <span className="font-bold text-[var(--color-ink)] underline underline-offset-2">
                          {currentValue}
                        </span>
                      </span>
                    </div>
                    <div
                      className="flex flex-wrap items-center gap-2.5"
                      role="radiogroup"
                      aria-label={`${optName} options`}
                    >
                      {opt.values.map((val: string) => {
                        const isSelected = currentValue === val;
                        const hex = resolveColorHex(val);

                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleSelectOption(optName, val)}
                            className={`flex items-center gap-2 px-3.5 py-2 border text-xs font-display uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'border-[var(--color-ink)] bg-white font-bold ring-2 ring-[var(--color-ink)] shadow-xs'
                                : 'border-[var(--color-stone)] bg-transparent hover:border-[var(--color-stone-dark)]'
                            }`}
                            aria-checked={isSelected}
                            role="radio"
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-black/25 shrink-0 shadow-inner"
                              style={{backgroundColor: hex}}
                            />
                            <span>{val}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // Size Option Tile View
              if (isSizeOption(optName)) {
                return (
                  <div key={opt.id || optName} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs font-semibold tracking-[0.14em] uppercase text-[var(--color-ink)]">
                        Select {optName}:{' '}
                        <span className="font-bold text-[var(--color-ink)]">
                          {currentValue}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSizeGuideOpen(true)}
                        className="font-display text-xs tracking-wider uppercase text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] underline underline-offset-4 cursor-pointer"
                      >
                        Size Guide & Measurements
                      </button>
                    </div>

                    <div
                      className="grid grid-cols-4 sm:grid-cols-6 gap-2"
                      role="radiogroup"
                      aria-label={`${optName} choices`}
                    >
                      {opt.values.map((sizeVal: string) => {
                        const isSelected = currentValue === sizeVal;

                        // Check availability for this size with currently selected other options
                        const comboVariant = variants.find((v: any) =>
                          v.selectedOptions?.every((so: any) => {
                            if (so.name === optName) return so.value === sizeVal;
                            return so.value === selectedOptions[so.name];
                          }),
                        );
                        const isSizeAvailable = comboVariant
                          ? comboVariant.availableForSale
                          : true;

                        return (
                          <button
                            key={sizeVal}
                            type="button"
                            onClick={() => handleSelectOption(optName, sizeVal)}
                            className={`py-3 text-center font-display text-xs font-semibold tracking-wider uppercase border transition-all duration-200 cursor-pointer relative ${
                              isSelected
                                ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-ivory)] shadow-sm'
                                : isSizeAvailable
                                ? 'border-[var(--color-stone)] bg-white text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-stone-light)]'
                                : 'border-[var(--color-stone)]/50 bg-stone-100 text-stone-400 cursor-not-allowed opacity-60'
                            }`}
                            aria-checked={isSelected}
                            role="radio"
                          >
                            <span>{sizeVal}</span>
                            {!isSizeAvailable && (
                              <span className="sr-only"> (Sold Out)</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // Generic Option Selector (e.g. Material, Cut)
              return (
                <div key={opt.id || optName} className="space-y-2">
                  <span className="font-display text-xs font-semibold tracking-[0.14em] uppercase text-[var(--color-ink)] block">
                    {optName}: <span className="font-bold">{currentValue}</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val: string) => {
                      const isSelected = currentValue === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleSelectOption(optName, val)}
                          className={`px-4 py-2 border text-xs font-display uppercase tracking-wider transition-all duration-200 ${
                            isSelected
                              ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-ivory)]'
                              : 'border-[var(--color-stone)] bg-white text-[var(--color-ink)] hover:border-[var(--color-ink)]'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Quantity Stepper */}
            <div className="space-y-2">
              <label
                htmlFor="product-quantity"
                className="font-display text-xs font-semibold tracking-[0.14em] uppercase text-[var(--color-ink)] block"
              >
                Quantity
              </label>
              <div className="flex items-center w-36 border border-[var(--color-stone)] bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center font-display text-base hover:bg-[var(--color-ink)] hover:text-[var(--color-ivory)] transition-all duration-200 cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <input
                  id="product-quantity"
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  readOnly
                  className="w-14 text-center font-body text-sm font-semibold border-none outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="w-11 h-11 flex items-center justify-center font-display text-base hover:bg-[var(--color-ink)] hover:text-[var(--color-ivory)] transition-all duration-200 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Dynamic Add to Bag CTA */}
            <div ref={mainCtaRef} className="pt-2">
              {activeVariant?.id ? (
                <AddToCartButton
                  disabled={!isAvailable}
                  onClick={handleAddToCart}
                  lines={[
                    {
                      merchandiseId: activeVariant.id,
                      quantity,
                      selectedVariant: activeVariant,
                    },
                  ]}
                >
                  <span className="crush-btn crush-btn-primary w-full py-4 text-center font-display text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase shadow-md flex items-center justify-center gap-2">
                    {isAvailable ? (
                      <>
                        <span>Add To Bag</span>
                        <span>•</span>
                        <Money data={price} />
                      </>
                    ) : (
                      'Sold Out'
                    )}
                  </span>
                </AddToCartButton>
              ) : (
                <button
                  type="button"
                  disabled
                  className="crush-btn crush-btn-secondary w-full py-4 text-center font-display text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase opacity-50 cursor-not-allowed"
                >
                  Unavailable
                </button>
              )}
            </div>

            {/* Added Toast Notification */}
            {addedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 font-display text-xs tracking-wider uppercase text-center animate-pulse">
                ✓ Added {quantity} item{quantity > 1 ? 's' : ''} to your Atelier Bag
              </div>
            )}

            {/* Value Proposition Callouts */}
            <div className="py-3 px-4 bg-[var(--color-stone-light)]/60 border border-[var(--color-stone)] space-y-1.5 font-display text-[11px] tracking-wider uppercase text-[var(--color-ink)]/75">
              <p className="m-0 flex items-center gap-2">
                <span>✦</span> Complimentary US Ground Delivery On Orders Over $150
              </p>
              <p className="m-0 flex items-center gap-2">
                <span>✦</span> 30-Day Effortless Atelier Returns & Size Exchanges
              </p>
              <p className="m-0 flex items-center gap-2">
                <span>✦</span> Delivered In Archival Breathable Garment Dust Bag
              </p>
            </div>

            {/* 4-Tab Luxury Specification Accordion */}
            <div className="border-t border-[var(--color-stone)] pt-4 space-y-4">
              <div className="flex border-b border-[var(--color-stone)] overflow-x-auto">
                {[
                  {id: 'details', label: 'Atelier Details'},
                  {id: 'fabric', label: 'Fabric & Specifications'},
                  {id: 'fit', label: 'Fit & Measurements'},
                  {id: 'shipping', label: 'Delivery & Returns'},
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-2.5 px-3.5 font-display text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer border-b-2 -mb-[1px] shrink-0 ${
                      activeTab === tab.id
                        ? 'border-[var(--color-ink)] text-[var(--color-ink)]'
                        : 'border-transparent text-[var(--color-ink)]/50 hover:text-[var(--color-ink)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Atelier Details */}
              {activeTab === 'details' && (
                <div className="font-body text-sm text-[var(--color-ink)]/85 leading-relaxed space-y-3">
                  {product.descriptionHtml ? (
                    <div
                      className="crush-product-content"
                      dangerouslySetInnerHTML={{
                        __html: product.descriptionHtml,
                      }}
                    />
                  ) : (
                    <p>{product.description}</p>
                  )}

                  {product.tags && product.tags.length > 0 && (
                    <div className="pt-3 border-t border-[var(--color-stone)] flex flex-wrap gap-1.5">
                      {product.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 bg-white border border-[var(--color-stone)] text-[10px] font-display uppercase tracking-widest text-[var(--color-ink)]/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Fabric & Specifications */}
              {activeTab === 'fabric' && (
                <div className="font-body text-sm text-[var(--color-ink)]/85 leading-relaxed space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-display uppercase tracking-wider">
                    <div className="p-3 bg-white border border-[var(--color-stone)]">
                      <span className="text-[var(--color-ink)]/50 block mb-1">
                        Silhouette & Cut
                      </span>
                      <strong className="text-[var(--color-ink)]">
                        {product.title}
                      </strong>
                    </div>
                    <div className="p-3 bg-white border border-[var(--color-stone)]">
                      <span className="text-[var(--color-ink)]/50 block mb-1">
                        Fabrication
                      </span>
                      <strong className="text-[var(--color-ink)]">
                        100% Breathable Cotton
                      </strong>
                    </div>
                    <div className="p-3 bg-white border border-[var(--color-stone)]">
                      <span className="text-[var(--color-ink)]/50 block mb-1">
                        Structure & Stretch
                      </span>
                      <strong className="text-[var(--color-ink)]">
                        No Stretch • Unlined
                      </strong>
                    </div>
                    <div className="p-3 bg-white border border-[var(--color-stone)]">
                      <span className="text-[var(--color-ink)]/50 block mb-1">
                        Care Instructions
                      </span>
                      <strong className="text-[var(--color-ink)]">
                        Cold Wash • Tumble Dry Low
                      </strong>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-ink)]/60 pt-2">
                    Crafted with precision seams and delicate shoulder tie accents designed for versatile day-to-evening wear.
                  </p>
                </div>
              )}

              {/* Tab 3: Fit & Measurements */}
              {activeTab === 'fit' && (
                <div className="font-body text-sm text-[var(--color-ink)]/85 leading-relaxed space-y-3">
                  <p className="text-xs font-display uppercase tracking-wider text-[var(--color-ink)]/70">
                    Product Measurements (Inches)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body text-xs border border-[var(--color-stone)] bg-white">
                      <thead>
                        <tr className="bg-[var(--color-ink)] text-[var(--color-ivory)] font-display uppercase tracking-wider text-[11px]">
                          <th className="py-2.5 px-3">Size</th>
                          <th className="py-2.5 px-3">Length</th>
                          <th className="py-2.5 px-3">Bust</th>
                          <th className="py-2.5 px-3">Waist</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-stone)]">
                        <tr className="hover:bg-[var(--color-stone-light)]/40">
                          <td className="py-2.5 px-3 font-bold font-display">S</td>
                          <td className="py-2.5 px-3">31.5&quot;</td>
                          <td className="py-2.5 px-3">33.9&quot;</td>
                          <td className="py-2.5 px-3">33.5&quot;</td>
                        </tr>
                        <tr className="hover:bg-[var(--color-stone-light)]/40">
                          <td className="py-2.5 px-3 font-bold font-display">M</td>
                          <td className="py-2.5 px-3">31.9&quot;</td>
                          <td className="py-2.5 px-3">35.4&quot;</td>
                          <td className="py-2.5 px-3">35.0&quot;</td>
                        </tr>
                        <tr className="hover:bg-[var(--color-stone-light)]/40">
                          <td className="py-2.5 px-3 font-bold font-display">L</td>
                          <td className="py-2.5 px-3">32.3&quot;</td>
                          <td className="py-2.5 px-3">37.0&quot;</td>
                          <td className="py-2.5 px-3">36.6&quot;</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-[var(--color-ink)]/60 pt-2">
                    True to size fit. The shoulder ties are fully adjustable allowing customized bust support and torso length.
                  </p>
                </div>
              )}

              {/* Tab 4: Delivery & Returns */}
              {activeTab === 'shipping' && (
                <div className="font-body text-sm text-[var(--color-ink)]/85 leading-relaxed space-y-2">
                  <p>
                    <strong>Domestic United States:</strong> Complimentary standard shipping on orders over $150 (3–5 business days). Express 2-day delivery available at checkout.
                  </p>
                  <p>
                    <strong>Returns & Exchanges:</strong> 30-day effortless returns on all unworn items with original atelier tags intact. Prepaid return label included in package.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {related && related.length > 0 && (
          <section className="mt-24 pt-16 border-t border-[var(--color-stone)]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="font-display text-[10px] font-semibold tracking-[0.25em] text-[var(--color-ink)]/50 uppercase m-0 mb-1">
                  Atelier Pairing
                </p>
                <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-[0.06em] uppercase text-[var(--color-ink)] m-0">
                  Complete The Look
                </h2>
              </div>
              <Link
                to="/collections/all"
                className="font-display text-xs font-semibold tracking-wider uppercase text-[var(--color-ink)] hover:underline underline-offset-4 no-underline"
              >
                Browse All Pieces →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {related.map((relProduct: any) => (
                <ProductItem key={relProduct.id} product={relProduct} loading="lazy" />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sizing Guide Modal */}
      {sizeGuideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="size-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-ink)]/75 backdrop-blur-xs"
        >
          <div className="bg-[var(--color-ivory)] max-w-lg w-full p-6 sm:p-8 border border-[var(--color-stone)] shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-stone)] mb-6">
              <h2
                id="size-guide-title"
                className="font-display font-bold text-lg tracking-widest uppercase m-0 text-[var(--color-ink)]"
              >
                Atelier Sizing Guide (US)
              </h2>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                className="font-display text-lg text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] cursor-pointer"
                aria-label="Close size guide"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-stone)] font-display uppercase tracking-wider text-[var(--color-ink)]/70">
                    <th className="py-2">Size</th>
                    <th className="py-2">Length</th>
                    <th className="py-2">Bust</th>
                    <th className="py-2">Waist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-stone)]">
                  <tr>
                    <td className="py-2.5 font-bold font-display">S</td>
                    <td>31.5&quot;</td>
                    <td>33.9&quot;</td>
                    <td>33.5&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold font-display">M</td>
                    <td>31.9&quot;</td>
                    <td>35.4&quot;</td>
                    <td>35.0&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold font-display">L</td>
                    <td>32.3&quot;</td>
                    <td>37.0&quot;</td>
                    <td>36.6&quot;</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="font-body text-[11px] text-[var(--color-ink)]/60 mt-6 leading-normal">
              Measurements reflect garment sizing in inches. Fits true to size with fully adjustable shoulder ties.
            </p>
          </div>
        </div>
      )}

      {/* Sticky Quick-Add Floating Bar */}
      <div
        className={`fixed bottom-0 inset-x-0 z-40 bg-[var(--color-ivory)]/98 backdrop-blur-md border-t border-[var(--color-stone)] py-3 px-4 sm:px-8 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isStickyVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isStickyVisible}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Thumbnail & Garment Info */}
          <div className="flex items-center gap-3 min-w-0">
            {images[activeImageIndex] && (
              <div className="w-10 h-12 bg-[var(--color-stone-light)] shrink-0 overflow-hidden border border-[var(--color-stone)]">
                <img
                  src={images[activeImageIndex].url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-display text-xs sm:text-sm font-bold tracking-wider uppercase text-[var(--color-ink)] m-0 truncate">
                {product.title}
              </h4>
              <p className="font-display text-[11px] tracking-wide text-[var(--color-ink)]/70 m-0 flex items-center gap-2">
                <span className="font-semibold">
                  <Money data={price} />
                </span>
                <span className="text-[var(--color-stone-dark)]">•</span>
                <span className="text-[var(--color-ink)] uppercase">
                  {Object.values(selectedOptions).join(' / ')}
                </span>
              </p>
            </div>
          </div>

          {/* Right: Quick Add to Bag Action */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              type="button"
              disabled={!isAvailable}
              onClick={handleAddToCart}
              className={`crush-btn py-2.5 px-5 sm:px-8 text-xs shadow-md ${
                isAvailable
                  ? 'crush-btn-primary'
                  : 'crush-btn-secondary opacity-50 cursor-not-allowed'
              }`}
            >
              {isAvailable ? 'Add To Bag →' : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>

      {/* High-Resolution Fabric Texture & Lightbox Modal */}
      {isZoomModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="High-resolution fabric inspect"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
          <button
            type="button"
            className="absolute inset-0 w-full h-full bg-transparent border-none cursor-default"
            onClick={() => setIsZoomModalOpen(false)}
            aria-label="Close fabric inspect backdrop"
          />

          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center z-10 pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsZoomModalOpen(false)}
              className="absolute -top-10 right-0 text-[var(--color-ivory)] font-display text-sm tracking-widest uppercase hover:text-[var(--color-stone)] cursor-pointer"
              aria-label="Close fabric inspect"
            >
              ✕ Close ESC
            </button>

            <button
              type="button"
              onClick={() => setIsZoomModalOpen(false)}
              className="relative overflow-hidden border border-[var(--color-stone-dark)]/40 shadow-2xl bg-black p-0 cursor-zoom-out"
              aria-label="Click image to close zoom"
            >
              {images[activeImageIndex] && (
                <img
                  src={images[activeImageIndex].url}
                  alt={product.title}
                  className="max-h-[82vh] w-auto object-contain"
                />
              )}
            </button>

            <div className="mt-3 text-center">
              <span className="font-display text-[10px] font-semibold tracking-[0.25em] uppercase text-[var(--color-stone)]">
                {product.title} • Archival Weave & Atelier Tailoring Inspection
              </span>
            </div>
          </div>
        </div>
      )}

      {activeVariant?.id && (
        <Analytics.ProductView
          data={{
            products: [
              {
                id: product.id,
                title: product.title,
                price: price.amount || '0',
                vendor: product.vendor,
                variantId: activeVariant.id || '',
                variantTitle: activeVariant.title || '',
                quantity: 1,
              },
            ],
          }}
        />
      )}
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    productType
    descriptionHtml
    description
    tags
    options {
      id
      name
      values
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    images(first: 20) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    variants(first: 50) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const RELATED_PRODUCTS_QUERY = `#graphql
  query RelatedProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
  ) @inContext(country: $country, language: $language) {
    products(first: $first) {
      nodes {
        id
        title
        handle
        featuredImage {
          id
          url
          altText
          width
          height
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;
