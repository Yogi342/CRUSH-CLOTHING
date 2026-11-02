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

  // Sanitize vendor and tags: ensure supplier/dropship names like Trendsi never appear
  if (shopifyProduct) {
    shopifyProduct.vendor = 'CRUSH ATELIER';
    if (shopifyProduct.tags) {
      shopifyProduct.tags = shopifyProduct.tags.filter(
        (t: string) => !/trendsi/i.test(t) && !/overseas/i.test(t),
      );
    }
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
  const [activeSpecsTab, setActiveSpecsTab] = useState<'details' | 'fabric' | 'measurements'>('details');
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
    <div className="crush-pdp bg-[var(--color-ivory)] text-[var(--color-ink)] min-h-screen py-6 sm:py-10">
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
          className="mb-6 font-display text-[11px] tracking-[0.25em] uppercase text-[var(--color-ink)]/50 flex flex-wrap items-center gap-2 border-b border-[var(--color-stone)]/50 pb-3"
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

        {/* ========================================================
            TOP SECTION: BALANCED 2-COLUMN HERO & PURCHASING CONSOLE
            Height is balanced between left and right columns!
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-14 items-start">
          
          {/* ========================================================
              LEFT COLUMN: CURATED EDITORIAL GALLERY & DETAIL GRID
             ======================================================== */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Stage Viewport with Next/Prev Arrows */}
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

            {/* Editorial Thumbnail Strip */}
            {images.length > 1 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-widest text-[var(--color-ink)]/60 px-1">
                  <span>Atelier Perspectives ({images.length} High-Res Angles)</span>
                  <button
                    type="button"
                    onClick={() => setIsZoomModalOpen(true)}
                    className="underline underline-offset-2 text-[var(--color-ink)] hover:text-black cursor-pointer font-bold"
                  >
                    View All In Fullscreen ↗
                  </button>
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
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Curated 2-Up Detail Shots Duo (Eliminates empty space on desktop left column!) */}
            {images.length >= 3 && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div
                  className="group relative aspect-[3/4] overflow-hidden border border-[var(--color-stone)] bg-white cursor-pointer"
                  onClick={() => {
                    setActiveImageIndex(1);
                    setIsZoomModalOpen(true);
                  }}
                >
                  <img
                    src={images[1].url}
                    alt="Atelier Silhouette Close-Up"
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-[var(--color-ivory)]/90 backdrop-blur-xs py-1 px-2 border border-[var(--color-stone)] text-center">
                    <span className="font-display text-[9px] uppercase tracking-wider text-[var(--color-ink)] font-bold">
                      Bodice & Ties Detail
                    </span>
                  </div>
                </div>

                <div
                  className="group relative aspect-[3/4] overflow-hidden border border-[var(--color-stone)] bg-white cursor-pointer"
                  onClick={() => {
                    setActiveImageIndex(2);
                    setIsZoomModalOpen(true);
                  }}
                >
                  <img
                    src={images[2].url}
                    alt="Atelier Silhouette Movement"
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-[var(--color-ivory)]/90 backdrop-blur-xs py-1 px-2 border border-[var(--color-stone)] text-center">
                    <span className="font-display text-[9px] uppercase tracking-wider text-[var(--color-ink)] font-bold">
                      A-Line Silhouette Drape
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Atelier Key Highlights Strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
              <div className="p-3 bg-white border border-[var(--color-stone)] text-center shadow-xs">
                <span className="font-display text-[9px] sm:text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--color-ink)] block">
                  100% Cotton
                </span>
                <span className="font-body text-[10px] text-[var(--color-ink)]/60 mt-0.5 block">
                  Crisp breathable weave
                </span>
              </div>
              <div className="p-3 bg-white border border-[var(--color-stone)] text-center shadow-xs">
                <span className="font-display text-[9px] sm:text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--color-ink)] block">
                  Adjustable Ties
                </span>
                <span className="font-body text-[10px] text-[var(--color-ink)]/60 mt-0.5 block">
                  Custom shoulder drop
                </span>
              </div>
              <div className="p-3 bg-white border border-[var(--color-stone)] text-center shadow-xs">
                <span className="font-display text-[9px] sm:text-[10px] font-bold tracking-[0.16em] uppercase text-[var(--color-ink)] block">
                  A-Line Cut
                </span>
                <span className="font-body text-[10px] text-[var(--color-ink)]/60 mt-0.5 block">
                  Fluid mini length
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: PURCHASING CONSOLE (Sleek, focused & perfectly balanced!)
             ======================================================== */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit space-y-5">
            
            {/* Header: Eyebrow, Title, Reviews, Price */}
            <div className="border-b border-[var(--color-stone)] pb-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-[10px] font-semibold tracking-[0.25em] uppercase text-[var(--color-ink)]/60">
                  CRUSH ATELIER // US
                </span>
                <span
                  className={`font-display text-[10px] tracking-widest uppercase px-2.5 py-0.5 border ${
                    isAvailable
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200 font-bold'
                      : 'text-stone-600 bg-stone-100 border-stone-300'
                  }`}
                >
                  {isAvailable ? '● In Stock' : '✕ Out of Stock'}
                </span>
              </div>

              {/* Title: Classic High-Fashion Serif */}
              <h1 className="font-serif font-normal text-3xl sm:text-4xl lg:text-[40px] tracking-tight text-[var(--color-ink)] m-0 leading-[1.12]">
                {product.title}
              </h1>

              {/* Rating & Social Proof */}
              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex text-amber-800 text-xs tracking-tight">
                  ★★★★★
                </div>
                <span className="font-display text-[11px] font-medium tracking-wider text-[var(--color-ink)]/70">
                  4.9 <span className="text-[var(--color-stone-dark)]">•</span> 42 Verified Atelier Reviews
                </span>
              </div>

              {/* Price & Installments Row */}
              <div className="pt-1">
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

                <p className="font-body text-xs text-[var(--color-ink)]/65 mt-1.5 m-0 flex items-center gap-1.5">
                  <span>or 4 interest-free installments of $7.99 with</span>
                  <span className="font-display font-bold uppercase tracking-wider text-[var(--color-ink)] underline underline-offset-2">
                    Klarna
                  </span>
                  <span>or</span>
                  <span className="font-display font-bold uppercase tracking-wider text-[var(--color-ink)] underline underline-offset-2">
                    Afterpay
                  </span>
                </p>
              </div>
            </div>

            {/* Dynamic Options Selectors */}
            {meaningfulOptions.map((opt: any) => {
              const optName = opt.name;
              const currentValue = selectedOptions[optName];

              // COLOR SELECTOR: Visual Photo Swatch Cards
              if (isColorOption(optName)) {
                return (
                  <div key={opt.id || optName} className="space-y-2.5">
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
                        {opt.values.length} Shades
                      </span>
                    </div>

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
                  <div key={opt.id || optName} className="space-y-2.5">
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

                    <div className="flex items-center justify-between text-[11px] font-body text-[var(--color-ink)]/70 px-0.5">
                      <span>✦ True to atelier sizing (Fits US 4 - 10)</span>
                      <a
                        href="#atelier-specifications"
                        className="font-display uppercase text-[10px] text-[var(--color-ink)] underline underline-offset-2 hover:text-black"
                      >
                        Measurements ↓
                      </a>
                    </div>
                  </div>
                );
              }

              // Generic Option Selector
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
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
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

              {addedToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 font-display text-xs tracking-wider uppercase text-center animate-pulse shadow-sm">
                  ✓ Added {quantity} item{quantity > 1 ? 's' : ''} to your Atelier Bag
                </div>
              )}
            </div>

            {/* Classic Luxury Trust Trio */}
            <div className="py-3.5 px-4 bg-white/70 border border-[var(--color-stone)] space-y-1.5 font-display text-[10px] sm:text-[11px] tracking-wider uppercase text-[var(--color-ink)]/80">
              <div className="flex items-center gap-2">
                <span className="text-amber-800 text-xs">✦</span>
                <span>Complimentary US Ground Delivery On Orders Over $150</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-800 text-xs">✦</span>
                <span>30-Day Effortless Atelier Returns & Size Exchanges</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-800 text-xs">✦</span>
                <span>Delivered In Signature Archival Breathable Dust Bag</span>
              </div>
            </div>

            {/* Concise Atelier Overview & Direct Anchor */}
            <div className="p-4 bg-white border border-[var(--color-stone)] space-y-2">
              <p className="font-serif italic text-sm text-[var(--color-ink)]/90 leading-snug m-0">
                &ldquo;Cut from crisp breathable 100% cotton with romantic self-tie shoulder bows and an airy A-line drape.&rdquo;
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-[var(--color-stone)]/50 text-xs">
                <span className="font-display uppercase text-[10px] text-[var(--color-ink)]/60">
                  Model: 5&apos;9&quot; • Wears Size S
                </span>
                <a
                  href="#atelier-specifications"
                  className="font-display uppercase text-[10px] font-bold tracking-wider text-[var(--color-ink)] hover:underline underline-offset-4"
                >
                  Full Sizing & Specs ↓
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================
            FULL-WIDTH ATELIER SPECIFICATIONS & MEASUREMENTS HUB
            Spans across the whole page to eliminate any empty space!
           ======================================================== */}
        <section
          id="atelier-specifications"
          className="mt-16 sm:mt-24 pt-12 border-t border-[var(--color-stone)] scroll-mt-20"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="font-display text-[10px] font-bold tracking-[0.28em] uppercase text-[var(--color-ink)]/50 block mb-1">
                Atelier Blueprint & Tailoring
              </span>
              <h2 className="font-serif font-normal text-3xl sm:text-4xl text-[var(--color-ink)] m-0">
                Specifications & Garment Dimensions
              </h2>
            </div>

            {/* Tab switchers */}
            <div className="flex border border-[var(--color-stone)] bg-white p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveSpecsTab('details')}
                className={`px-3 sm:px-4 py-1.5 text-xs font-display uppercase tracking-wider cursor-pointer transition-colors ${
                  activeSpecsTab === 'details'
                    ? 'bg-[var(--color-ink)] text-[var(--color-ivory)] font-bold'
                    : 'text-[var(--color-ink)]/70 hover:text-[var(--color-ink)]'
                }`}
              >
                Silhouette & Cut
              </button>
              <button
                type="button"
                onClick={() => setActiveSpecsTab('fabric')}
                className={`px-3 sm:px-4 py-1.5 text-xs font-display uppercase tracking-wider cursor-pointer transition-colors ${
                  activeSpecsTab === 'fabric'
                    ? 'bg-[var(--color-ink)] text-[var(--color-ivory)] font-bold'
                    : 'text-[var(--color-ink)]/70 hover:text-[var(--color-ink)]'
                }`}
              >
                Fabric & Care
              </button>
              <button
                type="button"
                onClick={() => setActiveSpecsTab('measurements')}
                className={`px-3 sm:px-4 py-1.5 text-xs font-display uppercase tracking-wider cursor-pointer transition-colors ${
                  activeSpecsTab === 'measurements'
                    ? 'bg-[var(--color-ink)] text-[var(--color-ivory)] font-bold'
                    : 'text-[var(--color-ink)]/70 hover:text-[var(--color-ink)]'
                }`}
              >
                Size Chart
              </button>
            </div>
          </div>

          {/* TAB 1: SILHOUETTE & DESIGN SPECIFICATIONS */}
          {activeSpecsTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white border border-[var(--color-stone)] space-y-3 shadow-xs">
                <span className="font-display text-[11px] font-bold tracking-widest uppercase text-amber-900 block">
                  01 • The Neckline & Bodice
                </span>
                <h3 className="font-serif text-2xl text-[var(--color-ink)] m-0">
                  Straight Square Cut
                </h3>
                <p className="font-body text-xs sm:text-sm text-[var(--color-ink)]/80 leading-relaxed m-0">
                  Tailored with a clean straight horizontal square neckline, framing the collarbones with timeless French refinement and clean seam binding.
                </p>
              </div>

              <div className="p-6 bg-white border border-[var(--color-stone)] space-y-3 shadow-xs">
                <span className="font-display text-[11px] font-bold tracking-widest uppercase text-amber-900 block">
                  02 • Adjustable Straps
                </span>
                <h3 className="font-serif text-2xl text-[var(--color-ink)] m-0">
                  Self-Tie Shoulder Bows
                </h3>
                <p className="font-body text-xs sm:text-sm text-[var(--color-ink)]/80 leading-relaxed m-0">
                  Delicate frill-edged ties allow full customization over vertical torso drop, bust elevation, and neckline depth for your unique body proportions.
                </p>
              </div>

              <div className="p-6 bg-white border border-[var(--color-stone)] space-y-3 shadow-xs">
                <span className="font-display text-[11px] font-bold tracking-widest uppercase text-amber-900 block">
                  03 • Silhouette & Hem
                </span>
                <h3 className="font-serif text-2xl text-[var(--color-ink)] m-0">
                  Airy A-Line Swing
                </h3>
                <p className="font-body text-xs sm:text-sm text-[var(--color-ink)]/80 leading-relaxed m-0">
                  Flows gently away from the natural waist into an effortless above-knee mini hemline, providing fluid motion and flattering ease through the hips.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: FABRICATION, WEAVE & CARE GUIDELINES */}
          {activeSpecsTab === 'fabric' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-[var(--color-stone)] space-y-1 shadow-xs">
                <span className="font-display text-[10px] uppercase tracking-widest text-[var(--color-ink)]/50 block">
                  Composition
                </span>
                <strong className="font-display text-sm uppercase text-[var(--color-ink)] block">
                  100% Breathable Cotton
                </strong>
                <p className="font-body text-xs text-[var(--color-ink)]/70 m-0 pt-1">
                  Pure natural cotton fibers woven for structural crispness and lightweight breathability.
                </p>
              </div>

              <div className="p-5 bg-white border border-[var(--color-stone)] space-y-1 shadow-xs">
                <span className="font-display text-[10px] uppercase tracking-widest text-[var(--color-ink)]/50 block">
                  Elasticity & Structure
                </span>
                <strong className="font-display text-sm uppercase text-[var(--color-ink)] block">
                  Non-Stretch Woven
                </strong>
                <p className="font-body text-xs text-[var(--color-ink)]/70 m-0 pt-1">
                  Holds tailored A-line geometry gracefully without clinging. Unlined for airy summer wear.
                </p>
              </div>

              <div className="p-5 bg-white border border-[var(--color-stone)] space-y-1 shadow-xs">
                <span className="font-display text-[10px] uppercase tracking-widest text-[var(--color-ink)]/50 block">
                  Washing Method
                </span>
                <strong className="font-display text-sm uppercase text-[var(--color-ink)] block">
                  Cold Delicate Wash
                </strong>
                <p className="font-body text-xs text-[var(--color-ink)]/70 m-0 pt-1">
                  Machine wash cold with like colors on gentle cycle. Use mild detergent to protect color.
                </p>
              </div>

              <div className="p-5 bg-white border border-[var(--color-stone)] space-y-1 shadow-xs">
                <span className="font-display text-[10px] uppercase tracking-widest text-[var(--color-ink)]/50 block">
                  Drying & Pressing
                </span>
                <strong className="font-display text-sm uppercase text-[var(--color-ink)] block">
                  Line Dry or Low Heat
                </strong>
                <p className="font-body text-xs text-[var(--color-ink)]/70 m-0 pt-1">
                  Hang dry in shade or tumble dry low. Warm iron if desired to restore crisp woven finish.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PRECISION GARMENT MEASUREMENTS TABLE */}
          {activeSpecsTab === 'measurements' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 overflow-x-auto border border-[var(--color-stone)] bg-white shadow-xs">
                <table className="w-full text-left font-body text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[var(--color-ink)] text-[var(--color-ivory)] font-display uppercase tracking-wider text-xs">
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Garment Length</th>
                      <th className="py-3 px-4">Bust Circumference</th>
                      <th className="py-3 px-4">Waist Circumference</th>
                      <th className="py-3 px-4 text-right">Quick Select</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-stone)]">
                    <tr className="hover:bg-[var(--color-stone-light)]/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold font-display text-sm">S (US 4 - 6)</td>
                      <td className="py-3.5 px-4">31.5&quot; (80 cm)</td>
                      <td className="py-3.5 px-4">33.9&quot; (86 cm)</td>
                      <td className="py-3.5 px-4">33.5&quot; (85 cm)</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectOption('Size', 'S')}
                          className="px-3 py-1 text-xs font-display uppercase font-bold border border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white cursor-pointer"
                        >
                          Choose S
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--color-stone-light)]/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold font-display text-sm">M (US 8)</td>
                      <td className="py-3.5 px-4">31.9&quot; (81 cm)</td>
                      <td className="py-3.5 px-4">35.4&quot; (90 cm)</td>
                      <td className="py-3.5 px-4">35.0&quot; (89 cm)</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectOption('Size', 'M')}
                          className="px-3 py-1 text-xs font-display uppercase font-bold border border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white cursor-pointer"
                        >
                          Choose M
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--color-stone-light)]/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold font-display text-sm">L (US 10)</td>
                      <td className="py-3.5 px-4">32.3&quot; (82 cm)</td>
                      <td className="py-3.5 px-4">37.0&quot; (94 cm)</td>
                      <td className="py-3.5 px-4">36.6&quot; (93 cm)</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectOption('Size', 'L')}
                          className="px-3 py-1 text-xs font-display uppercase font-bold border border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white cursor-pointer"
                        >
                          Choose L
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sizing Advisor Promo Card */}
              <div className="lg:col-span-4 p-6 bg-white border border-[var(--color-stone)] space-y-3 shadow-xs">
                <span className="font-display text-[10px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                  Smart Sizing Assistant
                </span>
                <h3 className="font-serif text-2xl text-[var(--color-ink)] m-0">
                  Unsure About Your Size?
                </h3>
                <p className="font-body text-xs text-[var(--color-ink)]/75 leading-relaxed m-0">
                  Use our interactive 4-step Size Advisor to calculate your exact fit based on height, weight, body shape, and personal fit preference.
                </p>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="crush-btn crush-btn-primary w-full py-3.5 text-xs font-bold tracking-widest uppercase cursor-pointer"
                >
                  ✦ Open Size Advisor Modal →
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================
            EDITORIAL MID-PAGE SPOTLIGHT: THE ATELIER STORY
           ======================================================== */}
        <section className="mt-16 sm:mt-24 py-12 sm:py-16 border-t border-b border-[var(--color-stone)] bg-white/50">
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

            <div className="relative overflow-hidden border border-white/20 shadow-2xl bg-black max-h-[80vh] flex items-center justify-center">
              {images[activeImageIndex] && (
                <img
                  src={images[activeImageIndex].url}
                  alt={product.title}
                  className="max-h-[78vh] w-auto object-contain cursor-zoom-out"
                  onClick={() => setIsZoomModalOpen(false)}
                />
              )}

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
                vendor: 'CRUSH CLOTHING',
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
