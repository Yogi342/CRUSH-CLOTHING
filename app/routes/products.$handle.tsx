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
import {SizeAdvisorModal} from '~/components/SizeAdvisorModal';

export const meta: Route.MetaFunction = ({data}) => {
  const title = data?.product?.title ?? 'Product';
  return [
    {title: `CRUSH CLOTHING | ${title}`},
    {
      name: 'description',
      content: `${title} — Contemporary women's luxury apparel by CRUSH CLOTHING. Atelier craftsmanship, natural cotton weave, and modern silhouette.`,
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
  const [openAccordion, setOpenAccordion] = useState<string>('silhouette');
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

  // Gallery Navigation helpers
  const nextImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? '' : id));
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
    <div className="crush-pdp bg-[var(--color-ivory)] text-[var(--color-ink)] min-h-screen py-6 sm:py-12">
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
        {/* Editorial Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 sm:mb-8 font-display text-[11px] tracking-[0.25em] uppercase text-[var(--color-ink)]/50 flex flex-wrap items-center gap-2 border-b border-[var(--color-stone)]/50 pb-4"
        >
          <Link to="/" className="hover:text-[var(--color-ink)] no-underline transition-colors">
            Atelier Home
          </Link>
          <span className="text-[var(--color-stone-dark)]">/</span>
          <Link
            to="/collections/all"
            className="hover:text-[var(--color-ink)] no-underline transition-colors"
          >
            Collection 01
          </Link>
          <span className="text-[var(--color-stone-dark)]">/</span>
          <span className="text-[var(--color-ink)]/70">
            {product.productType || 'Dresses'}
          </span>
          <span className="text-[var(--color-stone-dark)]">/</span>
          <span className="text-[var(--color-ink)] font-semibold truncate max-w-xs sm:max-w-md">
            {product.title}
          </span>
        </nav>

        {/* 2-Column Luxury Atelier PDP Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-16">
          
          {/* ========================================================
              LEFT COLUMN: EDITORIAL IMAGE SHOWCASE
             ======================================================== */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Stage Viewport with Discreet Floating Arrows */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--color-stone-light)] border border-[var(--color-stone)] shadow-xs group">
              {images[activeImageIndex] ? (
                <img
                  src={images[activeImageIndex].url}
                  alt={images[activeImageIndex].altText || product.title}
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] cursor-zoom-in"
                  loading="eager"
                  onClick={() => setIsZoomModalOpen(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-xs text-[var(--color-ink)]/40 uppercase tracking-widest">
                  Atelier Visual Preview
                </div>
              )}

              {/* Top Left: Atelier Eyebrow Pill */}
              <div className="absolute top-4 left-4 bg-[var(--color-ivory)]/95 backdrop-blur-md px-3.5 py-1.5 border border-[var(--color-stone)] shadow-xs pointer-events-none">
                <span className="font-display text-[9px] sm:text-[10px] font-semibold tracking-[0.25em] uppercase text-[var(--color-ink)]">
                  {product.productType || 'CRUSH ATELIER // US'}
                </span>
              </div>

              {/* Top Right: Image Counter Badge */}
              {images.length > 1 && (
                <div className="absolute top-4 right-4 bg-[var(--color-ink)]/90 text-[var(--color-ivory)] backdrop-blur-md px-3 py-1 text-[10px] font-display font-medium tracking-[0.2em] uppercase shadow-xs pointer-events-none">
                  {String(activeImageIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                </div>
              )}

              {/* Discreet Next / Prev Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 bg-[var(--color-ivory)]/90 hover:bg-[var(--color-ink)] hover:text-white text-[var(--color-ink)] border border-[var(--color-stone)] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm opacity-80 group-hover:opacity-100"
                    aria-label="Previous angle"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 bg-[var(--color-ivory)]/90 hover:bg-[var(--color-ink)] hover:text-white text-[var(--color-ink)] border border-[var(--color-stone)] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm opacity-80 group-hover:opacity-100"
                    aria-label="Next angle"
                  >
                    →
                  </button>
                </>
              )}

              {/* Bottom Right: Zoom Inspect Button */}
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(true)}
                className="absolute bottom-4 right-4 bg-[var(--color-ink)]/90 hover:bg-black text-[var(--color-ivory)] backdrop-blur-md px-3.5 py-1.5 border border-[var(--color-stone)] transition-all duration-200 shadow-md cursor-pointer flex items-center gap-2"
                aria-label="Zoom in high resolution"
              >
                <span className="text-[11px] text-amber-200">✦</span>
                <span className="font-display text-[10px] font-semibold tracking-[0.18em] uppercase">
                  Inspect Fabric
                </span>
              </button>
            </div>

            {/* Editorial Thumbnail Gallery Strip */}
            {images.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-widest text-[var(--color-ink)]/60 px-1">
                  <span>Atelier Perspectives ({images.length} Angles)</span>
                  <span className="hidden sm:inline">Click angle or swipe</span>
                </div>
                <div
                  className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[var(--color-stone)]"
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
                        className={`group relative shrink-0 w-16 sm:w-20 aspect-[3/4] overflow-hidden border transition-all duration-200 cursor-pointer bg-[var(--color-stone-light)] ${
                          isActive
                            ? 'border-2 border-[var(--color-ink)] shadow-md ring-1 ring-black'
                            : 'border border-[var(--color-stone)] opacity-70 hover:opacity-100 hover:border-[var(--color-ink)]'
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
                          <div className="absolute inset-0 border border-white/40 pointer-events-none" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Atelier Key Highlights Strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
              <div className="p-3 bg-white/70 border border-[var(--color-stone)] text-center">
                <span className="font-display text-[9px] sm:text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--color-ink)] block">
                  100% Woven Cotton
                </span>
                <span className="font-body text-[10px] text-[var(--color-ink)]/60 mt-0.5 block">
                  Breathable weave
                </span>
              </div>
              <div className="p-3 bg-white/70 border border-[var(--color-stone)] text-center">
                <span className="font-display text-[9px] sm:text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--color-ink)] block">
                  Adjustable Ties
                </span>
                <span className="font-body text-[10px] text-[var(--color-ink)]/60 mt-0.5 block">
                  Custom shoulder drop
                </span>
              </div>
              <div className="p-3 bg-white/70 border border-[var(--color-stone)] text-center">
                <span className="font-display text-[9px] sm:text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--color-ink)] block">
                  A-Line Swing
                </span>
                <span className="font-body text-[10px] text-[var(--color-ink)]/60 mt-0.5 block">
                  Effortless drape
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: PURCHASING & ATELIER CONSOLE
             ======================================================== */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit space-y-6">
            
            {/* Product Header & Title Area */}
            <div className="border-b border-[var(--color-stone)] pb-6 space-y-3">
              {/* Eyebrow & Status */}
              <div className="flex items-center justify-between">
                <span className="font-display text-[10px] font-semibold tracking-[0.25em] uppercase text-[var(--color-ink)]/60">
                  {product.vendor || 'CRUSH ATELIER // US'}
                </span>
                <div className="flex items-center gap-2">
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
              </div>

              {/* Title: Classic High-Fashion Serif */}
              <h1 className="font-serif font-normal text-3xl sm:text-4xl lg:text-[42px] tracking-tight text-[var(--color-ink)] m-0 leading-[1.12]">
                {product.title}
              </h1>

              {/* Rating & Social Proof Whisper */}
              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex text-amber-800 text-xs tracking-tight">
                  ★★★★★
                </div>
                <span className="font-display text-[11px] font-medium tracking-wider text-[var(--color-ink)]/70">
                  4.9 <span className="text-[var(--color-stone-dark)]">•</span> 42 Verified Atelier Reviews
                </span>
              </div>

              {/* Price & Installments Row */}
              <div className="pt-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-body text-2xl sm:text-3xl font-bold text-[var(--color-ink)]">
                    <Money data={price} />
                  </span>
                  {compareAtPrice && (
                    <span className="font-body text-lg text-[var(--color-ink)]/40 line-through">
                      <Money data={compareAtPrice} />
                    </span>
                  )}
                  <span className="font-display text-[10px] tracking-widest text-emerald-800 font-semibold uppercase bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                    Complimentary US Shipping $150+
                  </span>
                </div>

                {/* Klarna / Afterpay flexible installment note */}
                <p className="font-body text-xs text-[var(--color-ink)]/65 mt-2 m-0 flex items-center gap-1.5">
                  <span>or 4 interest-free installments of $7.99 with</span>
                  <span className="font-display font-bold uppercase tracking-wider text-[var(--color-ink)] underline underline-offset-2 cursor-pointer">
                    Klarna
                  </span>
                  <span>or</span>
                  <span className="font-display font-bold uppercase tracking-wider text-[var(--color-ink)] underline underline-offset-2 cursor-pointer">
                    Afterpay
                  </span>
                </p>
              </div>
            </div>

            {/* ========================================================
                DYNAMIC OPTION SELECTORS
               ======================================================== */}
            {meaningfulOptions.map((opt: any) => {
              const optName = opt.name;
              const currentValue = selectedOptions[optName];

              // COLOR SELECTOR: Visual Photo Swatch Cards
              if (isColorOption(optName)) {
                return (
                  <div key={opt.id || optName} className="space-y-3 pt-1">
                    {/* Header: Selected Color · [Color Name] */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xs tracking-wider uppercase text-[var(--color-ink)]/70">
                          Selected Color
                        </span>
                        <span className="text-[var(--color-stone-dark)] font-bold text-xs">•</span>
                        <span className="font-display text-xs font-bold tracking-wider uppercase text-[var(--color-ink)]">
                          {currentValue}
                        </span>
                      </div>
                      <span className="font-display text-[10px] tracking-widest uppercase text-[var(--color-ink)]/50">
                        {opt.values.length} Shade{opt.values.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Horizontal Photo Swatches */}
                    <div
                      className="flex items-center gap-3 overflow-x-auto pb-1"
                      role="radiogroup"
                      aria-label={`${optName} visual swatches`}
                    >
                      {opt.values.map((val: string) => {
                        const isSelected = currentValue === val;
                        const colorVariant = variants.find((v: any) =>
                          v.selectedOptions?.some(
                            (so: any) => so.name === optName && so.value === val,
                          ),
                        );
                        const swatchImgUrl = colorVariant?.image?.url;
                        const hex = resolveColorHex(val);

                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleSelectOption(optName, val)}
                            className={`group relative shrink-0 w-16 sm:w-[72px] aspect-[3/4] overflow-hidden transition-all duration-200 cursor-pointer p-0.5 bg-white ${
                              isSelected
                                ? 'border-2 border-[var(--color-ink)] shadow-md ring-1 ring-black'
                                : 'border border-[var(--color-stone)] hover:border-[var(--color-ink)] opacity-85 hover:opacity-100'
                            }`}
                            aria-checked={isSelected}
                            aria-label={`Select color ${val}`}
                            role="radio"
                          >
                            {swatchImgUrl ? (
                              <img
                                src={swatchImgUrl}
                                alt={val}
                                className="w-full h-full object-cover object-top"
                                loading="lazy"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center font-display text-[9px] uppercase tracking-wider text-black/70"
                                style={{backgroundColor: hex}}
                              >
                                {val}
                              </div>
                            )}

                            {/* Active Check Indicator */}
                            {isSelected && (
                              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-ink)] border border-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // SIZE SELECTOR: Tiles with Find Your Fit Size Advisor
              if (isSizeOption(optName)) {
                return (
                  <div key={opt.id || optName} className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs font-semibold tracking-[0.14em] uppercase text-[var(--color-ink)]">
                        Select {optName}:{' '}
                        <span className="font-bold text-[var(--color-ink)]">
                          {currentValue}
                        </span>
                      </span>

                      {/* Smart Size Advisor Link */}
                      <button
                        type="button"
                        onClick={() => setSizeGuideOpen(true)}
                        className="flex items-center gap-1.5 font-display text-xs tracking-wider uppercase text-[var(--color-ink)] hover:text-black underline underline-offset-4 cursor-pointer group"
                      >
                        <span className="text-[11px] text-emerald-800">✦</span>
                        <span className="font-bold">Find Your Fit (Size Advisor)</span>
                      </button>
                    </div>

                    <div
                      className="grid grid-cols-3 sm:grid-cols-6 gap-2"
                      role="radiogroup"
                      aria-label={`${optName} choices`}
                    >
                      {opt.values.map((sizeVal: string) => {
                        const isSelected = currentValue === sizeVal;

                        // Check availability for this size with current color
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
                            className={`py-3.5 text-center font-display text-xs font-bold tracking-wider uppercase border transition-all duration-200 cursor-pointer relative ${
                              isSelected
                                ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-ivory)] shadow-md'
                                : isSizeAvailable
                                ? 'border-[var(--color-stone)] bg-white text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-stone-light)]/40'
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

                    {/* Sizing Note */}
                    <div className="flex items-center justify-between text-[11px] font-body text-[var(--color-ink)]/70 px-0.5">
                      <span>✦ True to atelier sizing (Fits US 4 - 10)</span>
                      <span className="font-display uppercase text-[10px] text-emerald-800 font-semibold">
                        Free Size Exchange
                      </span>
                    </div>
                  </div>
                );
              }

              // Generic Option Selector
              return (
                <div key={opt.id || optName} className="space-y-2 pt-1">
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
                          className={`px-4 py-2.5 border text-xs font-display uppercase tracking-wider transition-all duration-200 ${
                            isSelected
                              ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-ivory)] font-bold'
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

            {/* Quantity Stepper & Add to Bag Block */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-[var(--color-stone)] bg-white h-13">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-11 h-full flex items-center justify-center font-display text-base hover:bg-[var(--color-ink)] hover:text-[var(--color-ivory)] transition-all duration-200 cursor-pointer"
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
                    className="w-12 text-center font-body text-sm font-bold border-none outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="w-11 h-full flex items-center justify-center font-display text-base hover:bg-[var(--color-ink)] hover:text-[var(--color-ivory)] transition-all duration-200 cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* Primary Add To Bag CTA Button */}
                <div ref={mainCtaRef} className="flex-1">
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
                      <span className="crush-btn crush-btn-primary w-full h-13 text-center font-display text-xs sm:text-sm font-bold tracking-[0.2em] uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer">
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
                      className="crush-btn crush-btn-secondary w-full h-13 text-center font-display text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase opacity-50 cursor-not-allowed"
                    >
                      Unavailable
                    </button>
                  )}
                </div>
              </div>

              {/* Added Toast Notification */}
              {addedToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 font-display text-xs tracking-wider uppercase text-center animate-pulse shadow-sm">
                  ✓ Added {quantity} item{quantity > 1 ? 's' : ''} to your Atelier Bag
                </div>
              )}
            </div>

            {/* Classic Luxury Trust Trio */}
            <div className="py-4 px-4 bg-white/70 border border-[var(--color-stone)] space-y-2 font-display text-[11px] tracking-wider uppercase text-[var(--color-ink)]/80">
              <div className="flex items-center gap-2.5">
                <span className="text-amber-800 text-xs">✦</span>
                <span>Complimentary US Ground Delivery On Orders Over $150</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-amber-800 text-xs">✦</span>
                <span>30-Day Effortless Atelier Returns & Size Exchanges</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-amber-800 text-xs">✦</span>
                <span>Delivered In Signature Archival Breathable Dust Bag</span>
              </div>
            </div>

            {/* ========================================================
                CLASSIC LUXURY ACCORDIONS (Silhouette, Fabric, Sizing, Delivery)
               ======================================================== */}
            <div className="border-t border-[var(--color-stone)] divide-y divide-[var(--color-stone)] pt-2">
              
              {/* Accordion 1: The Atelier Silhouette & Design Notes */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion('silhouette')}
                  className="w-full flex items-center justify-between py-2 text-left font-display text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-ink)] hover:text-black cursor-pointer"
                >
                  <span>The Atelier Silhouette & Notes</span>
                  <span className="text-base font-light font-display">
                    {openAccordion === 'silhouette' ? '−' : '+'}
                  </span>
                </button>
                {openAccordion === 'silhouette' && (
                  <div className="pt-2 pb-4 font-body text-xs sm:text-sm text-[var(--color-ink)]/85 leading-relaxed space-y-3">
                    <p className="m-0 font-serif italic text-base sm:text-lg text-[var(--color-ink)]/90 leading-snug">
                      &ldquo;A celebration of effortless romance — sculpted from natural woven cotton with delicate self-tie shoulder ribbons and an airy A-line drape.&rdquo;
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <p className="m-0">✦ <strong>Neckline:</strong> Contemporary straight square neckline with clean tailored finish.</p>
                      <p className="m-0">✦ <strong>Straps:</strong> Adjustable self-tie shoulder bows allowing custom bodice elevation and bust support.</p>
                      <p className="m-0">✦ <strong>Hemline:</strong> Above-knee mini length cut for fluid motion.</p>
                    </div>
                    {product.descriptionHtml && (
                      <div
                        className="crush-product-content text-xs pt-2"
                        dangerouslySetInnerHTML={{
                          __html: product.descriptionHtml,
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 2: Fabrication, Weave & Care */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion('fabric')}
                  className="w-full flex items-center justify-between py-2 text-left font-display text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-ink)] hover:text-black cursor-pointer"
                >
                  <span>Fabrication, Weave & Care</span>
                  <span className="text-base font-light font-display">
                    {openAccordion === 'fabric' ? '−' : '+'}
                  </span>
                </button>
                {openAccordion === 'fabric' && (
                  <div className="pt-2 pb-4 font-body text-xs sm:text-sm text-[var(--color-ink)]/85 leading-relaxed space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs font-display uppercase tracking-wider">
                      <div className="p-3 bg-white border border-[var(--color-stone)]">
                        <span className="text-[var(--color-ink)]/50 block text-[10px] mb-0.5">Fabric Composition</span>
                        <strong className="text-[var(--color-ink)]">100% Breathable Cotton</strong>
                      </div>
                      <div className="p-3 bg-white border border-[var(--color-stone)]">
                        <span className="text-[var(--color-ink)]/50 block text-[10px] mb-0.5">Stretch & Structure</span>
                        <strong className="text-[var(--color-ink)]">Non-Stretch Woven</strong>
                      </div>
                      <div className="p-3 bg-white border border-[var(--color-stone)]">
                        <span className="text-[var(--color-ink)]/50 block text-[10px] mb-0.5">Lining</span>
                        <strong className="text-[var(--color-ink)]">Unlined Lightweight</strong>
                      </div>
                      <div className="p-3 bg-white border border-[var(--color-stone)]">
                        <span className="text-[var(--color-ink)]/50 block text-[10px] mb-0.5">Care Instructions</span>
                        <strong className="text-[var(--color-ink)]">Cold Gentle Wash</strong>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--color-ink)]/70 m-0">
                      Machine wash cold on delicate cycle. Hang to dry or tumble dry low. Warm iron if desired to maintain crisp cotton weave.
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 3: Tailoring & Model Dimensions */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion('sizing')}
                  className="w-full flex items-center justify-between py-2 text-left font-display text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-ink)] hover:text-black cursor-pointer"
                >
                  <span>Tailoring & Model Dimensions</span>
                  <span className="text-base font-light font-display">
                    {openAccordion === 'sizing' ? '−' : '+'}
                  </span>
                </button>
                {openAccordion === 'sizing' && (
                  <div className="pt-2 pb-4 font-body text-xs text-[var(--color-ink)]/85 leading-relaxed space-y-3">
                    <p className="m-0">
                      <strong>Model Measurements:</strong> Height 5&apos;9&quot; (175 cm), Bust 34&quot;, Waist 25&quot;, Hips 36&quot;. Model wears size <strong>S</strong>.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-body text-xs border border-[var(--color-stone)] bg-white">
                        <thead>
                          <tr className="bg-[var(--color-ink)] text-[var(--color-ivory)] font-display uppercase tracking-wider text-[10px]">
                            <th className="py-2 px-3">Size</th>
                            <th className="py-2 px-3">Length</th>
                            <th className="py-2 px-3">Bust</th>
                            <th className="py-2 px-3">Waist</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-stone)]">
                          <tr>
                            <td className="py-2 px-3 font-bold font-display">S</td>
                            <td className="py-2 px-3">31.5&quot; (80 cm)</td>
                            <td className="py-2 px-3">33.9&quot; (86 cm)</td>
                            <td className="py-2 px-3">33.5&quot; (85 cm)</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-bold font-display">M</td>
                            <td className="py-2 px-3">31.9&quot; (81 cm)</td>
                            <td className="py-2 px-3">35.4&quot; (90 cm)</td>
                            <td className="py-2 px-3">35.0&quot; (89 cm)</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-bold font-display">L</td>
                            <td className="py-2 px-3">32.3&quot; (82 cm)</td>
                            <td className="py-2 px-3">37.0&quot; (94 cm)</td>
                            <td className="py-2 px-3">36.6&quot; (93 cm)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSizeGuideOpen(true)}
                      className="font-display text-xs font-bold uppercase tracking-wider text-emerald-800 underline underline-offset-4 cursor-pointer block pt-1"
                    >
                      ✦ Open Interactive Size Advisor →
                    </button>
                  </div>
                )}
              </div>

              {/* Accordion 4: Complimentary Delivery & Returns */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full flex items-center justify-between py-2 text-left font-display text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-ink)] hover:text-black cursor-pointer"
                >
                  <span>Complimentary Delivery & Returns</span>
                  <span className="text-base font-light font-display">
                    {openAccordion === 'shipping' ? '−' : '+'}
                  </span>
                </button>
                {openAccordion === 'shipping' && (
                  <div className="pt-2 pb-4 font-body text-xs sm:text-sm text-[var(--color-ink)]/85 leading-relaxed space-y-2">
                    <p className="m-0">
                      <strong>Domestic United States:</strong> Complimentary standard shipping on orders over $150 (3–5 business days). Express 2-day delivery available at checkout.
                    </p>
                    <p className="m-0">
                      <strong>Effortless Returns & Exchanges:</strong> 30-day effortless returns on all unworn items with original tags intact. Prepaid return label included with your order.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================
            EDITORIAL MID-PAGE SPOTLIGHT: THE ATELIER STORY
           ======================================================== */}
        <section className="mt-20 sm:mt-28 py-12 sm:py-16 border-t border-b border-[var(--color-stone)] bg-white/50">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center px-4">
            <div className="md:col-span-5 aspect-[3/4] overflow-hidden border border-[var(--color-stone)] shadow-md">
              {images[1] ? (
                <img
                  src={images[1].url}
                  alt="Atelier Tailoring Detail"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-[var(--color-stone-light)] flex items-center justify-center font-display text-xs uppercase tracking-widest text-black/40">
                  Atelier Silhouette
                </div>
              )}
            </div>
            <div className="md:col-span-7 space-y-4 md:pl-6">
              <span className="font-display text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--color-ink)]/50 block">
                The Atelier Design Philosophy
              </span>
              <h2 className="font-serif font-normal text-3xl sm:text-4xl text-[var(--color-ink)] leading-tight m-0">
                Crafted for Effortless Femininity & Timeless Elegance
              </h2>
              <p className="font-body text-sm sm:text-base text-[var(--color-ink)]/80 leading-relaxed m-0">
                Every line of the {product.title} is calibrated to balance structural cotton tailoring with romantic ease. The self-tie shoulder bows give you total command over your fit, allowing you to raise or lower the neckline to suit your personal style.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-display uppercase tracking-wider text-[var(--color-ink)]">
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-800">✦</span> French Finished Seams
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-800">✦</span> Breathable 100% Cotton
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-800">✦</span> Made For Day-To-Evening
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            HOW TO STYLE IT (ATELIER WARDROBE NOTES)
           ======================================================== */}
        <section className="mt-16 sm:mt-24">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-[var(--color-ink)]/50 block mb-1">
              Atelier Wardrobe Notes
            </span>
            <h2 className="font-serif font-normal text-3xl sm:text-4xl text-[var(--color-ink)] m-0">
              How To Style The Mini Dress
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-white border border-[var(--color-stone)] space-y-2 shadow-xs">
              <span className="font-display text-[11px] font-bold tracking-widest uppercase text-amber-900 block">
                Look 01 • Sunlit Daytime Ease
              </span>
              <h3 className="font-serif text-xl text-[var(--color-ink)] m-0">
                Effortless Coastal Stroll
              </h3>
              <p className="font-body text-xs sm:text-sm text-[var(--color-ink)]/75 leading-relaxed m-0">
                Style with minimalist flat woven leather slides, an oversized raffia market tote, and tortoiseshell sunglasses for sun-drenched afternoons.
              </p>
            </div>

            <div className="p-6 bg-white border border-[var(--color-stone)] space-y-2 shadow-xs">
              <span className="font-display text-[11px] font-bold tracking-widest uppercase text-amber-900 block">
                Look 02 • Twilight Soirée
              </span>
              <h3 className="font-serif text-xl text-[var(--color-ink)] m-0">
                Elevated Evening Cocktail
              </h3>
              <p className="font-body text-xs sm:text-sm text-[var(--color-ink)]/75 leading-relaxed m-0">
                Tie the shoulder bows into crisp structural knots, step into strappy kitten heels, and accent with bold sculptural gold earrings and a satin clutch.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================
            VERIFIED ATELIER CLIENT REVIEWS
           ======================================================== */}
        <section className="mt-16 sm:mt-24 pt-12 border-t border-[var(--color-stone)]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 max-w-5xl mx-auto">
            <div>
              <span className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-[var(--color-ink)]/50 block mb-1">
                Verified Feedback
              </span>
              <h2 className="font-serif font-normal text-3xl sm:text-4xl text-[var(--color-ink)] m-0">
                Atelier Client Impressions
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-800 text-sm">★★★★★</span>
              <span className="font-display text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
                4.9 Overall Fit Rating (42 Reviews)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-5 bg-white border border-[var(--color-stone)] space-y-2 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-800">★★★★★</span>
                <span className="font-display text-[10px] uppercase tracking-widest text-emerald-800 font-semibold">
                  ✓ Verified Buyer
                </span>
              </div>
              <p className="font-body text-xs text-[var(--color-ink)]/85 leading-relaxed italic m-0">
                &ldquo;The fabric has the most gorgeous crisp cotton structure. The adjustable shoulder ties are a dream — they let me fit the bust exactly as I like!&rdquo;
              </p>
              <div className="pt-2 border-t border-[var(--color-stone)]/50 flex justify-between items-center text-[11px] font-display uppercase tracking-wider text-[var(--color-ink)]/60">
                <span>Elena M.</span>
                <span>Size S • Khaki</span>
              </div>
            </div>

            <div className="p-5 bg-white border border-[var(--color-stone)] space-y-2 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-800">★★★★★</span>
                <span className="font-display text-[10px] uppercase tracking-widest text-emerald-800 font-semibold">
                  ✓ Verified Buyer
                </span>
              </div>
              <p className="font-body text-xs text-[var(--color-ink)]/85 leading-relaxed italic m-0">
                &ldquo;Used the Size Advisor before ordering and it recommended size M. Fits like a bespoke piece. Truly classic luxury feel without the insane price tag.&rdquo;
              </p>
              <div className="pt-2 border-t border-[var(--color-stone)]/50 flex justify-between items-center text-[11px] font-display uppercase tracking-wider text-[var(--color-ink)]/60">
                <span>Sophie R.</span>
                <span>Size M • Brown</span>
              </div>
            </div>

            <div className="p-5 bg-white border border-[var(--color-stone)] space-y-2 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-800">★★★★★</span>
                <span className="font-display text-[10px] uppercase tracking-widest text-emerald-800 font-semibold">
                  ✓ Verified Buyer
                </span>
              </div>
              <p className="font-body text-xs text-[var(--color-ink)]/85 leading-relaxed italic m-0">
                &ldquo;Pure perfection in Black. It has an effortlessly chic French silhouette. Have worn it to lunch and dressed it up for dinner.&rdquo;
              </p>
              <div className="pt-2 border-t border-[var(--color-stone)]/50 flex justify-between items-center text-[11px] font-display uppercase tracking-wider text-[var(--color-ink)]/60">
                <span>Camille V.</span>
                <span>Size L • Black</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            RELATED PIECES (COMPLETE THE LOOK)
           ======================================================== */}
        {related && related.length > 0 && (
          <section className="mt-20 sm:mt-28 pt-16 border-t border-[var(--color-stone)]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="font-display text-[10px] font-semibold tracking-[0.25em] text-[var(--color-ink)]/50 uppercase m-0 mb-1">
                  Atelier Pairing
                </p>
                <h2 className="font-serif font-normal text-3xl sm:text-4xl text-[var(--color-ink)] m-0">
                  Complete The Collection
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

      {/* ========================================================
          DYNAMIC SIZING ADVISOR MODAL
         ======================================================== */}
      <SizeAdvisorModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        product={product}
        availableSizes={
          meaningfulOptions.find((o: any) => isSizeOption(o.name))?.values || [
            'S',
            'M',
            'L',
          ]
        }
        currentSize={selectedOptions['Size'] || 'S'}
        onSelectSize={(size: string) => handleSelectOption('Size', size)}
        onAddToCart={(size: string) => {
          handleSelectOption('Size', size);
          setTimeout(() => {
            handleAddToCart();
          }, 100);
        }}
      />

      {/* ========================================================
          STICKY QUICK-ADD FLOATING BAR
         ======================================================== */}
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
              <div className="w-10 h-13 bg-[var(--color-stone-light)] shrink-0 overflow-hidden border border-[var(--color-stone)]">
                <img
                  src={images[activeImageIndex].url}
                  alt={product.title}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-serif text-sm sm:text-base font-normal tracking-normal text-[var(--color-ink)] m-0 truncate">
                {product.title}
              </h4>
              <p className="font-display text-[11px] tracking-wide text-[var(--color-ink)]/70 m-0 flex items-center gap-2">
                <span className="font-bold">
                  <Money data={price} />
                </span>
                <span className="text-[var(--color-stone-dark)]">•</span>
                <span className="text-[var(--color-ink)] uppercase font-semibold">
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
              className={`crush-btn py-3 px-6 sm:px-8 text-xs font-bold tracking-widest shadow-md cursor-pointer ${
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

      {/* ========================================================
          HIGH-RESOLUTION FABRIC TEXTURE & LIGHTBOX MODAL
         ======================================================== */}
      {isZoomModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="High-resolution fabric inspect"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/92 backdrop-blur-md animate-fadeIn"
        >
          <button
            type="button"
            className="absolute inset-0 w-full h-full bg-transparent border-none cursor-default"
            onClick={() => setIsZoomModalOpen(false)}
            aria-label="Close fabric inspect backdrop"
          />

          <div className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center z-10 pointer-events-auto">
            {/* Top Close bar */}
            <div className="w-full flex items-center justify-between pb-3 text-[var(--color-ivory)]">
              <span className="font-display text-xs tracking-widest uppercase">
                {product.title} • High-Resolution Atelier Inspection
              </span>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="font-display text-xs tracking-widest uppercase hover:text-white cursor-pointer bg-white/10 px-3 py-1 border border-white/20"
                aria-label="Close fabric inspect"
              >
                ✕ Close ESC
              </button>
            </div>

            {/* Large Image Viewport */}
            <div className="relative overflow-hidden border border-white/20 shadow-2xl bg-black max-h-[80vh] flex items-center justify-center">
              {images[activeImageIndex] && (
                <img
                  src={images[activeImageIndex].url}
                  alt={product.title}
                  className="max-h-[78vh] w-auto object-contain cursor-zoom-out"
                  onClick={() => setIsZoomModalOpen(false)}
                />
              )}

              {/* Lightbox Next/Prev Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black text-white border border-white/30 flex items-center justify-center cursor-pointer text-base"
                    aria-label="Previous image"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black text-white border border-white/30 flex items-center justify-center cursor-pointer text-base"
                    aria-label="Next image"
                  >
                    →
                  </button>
                </>
              )}
            </div>

            <div className="mt-3 text-center">
              <span className="font-display text-[10px] font-semibold tracking-[0.25em] uppercase text-white/70">
                Angle {activeImageIndex + 1} of {images.length} • Click image or ESC to close
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Shopify Hydrogen Analytics Tracker */}
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
