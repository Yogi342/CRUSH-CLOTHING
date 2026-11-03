import {useState, useEffect, useMemo, useRef} from 'react';
import {redirect, useLoaderData, useSearchParams, Link, useFetcher} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  Money,
  CartForm,
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
    ivory: '#F9F9F8',
    'chalk ivory': '#F9F9F8',
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

  useEffect(() => {
    if (searchParams.get('openSizeAdvisor') === 'true') {
      setSizeGuideOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('openSizeAdvisor');
      setSearchParams(nextParams, {replace: true});
    }
  }, [searchParams]);
  const [activeSpecsTab, setActiveSpecsTab] = useState<'details' | 'fabric' | 'measurements'>('details');
  const [addedToast, setAddedToast] = useState(false);
  const cartFetcher = useFetcher({key: 'size-advisor-cart'});
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

  // Mobile Touch Swipe Gesture Support
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const handleGalleryTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleGalleryTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleGalleryTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (diff > 45) {
      nextImage(); // Swiped left -> next photo
    } else if (diff < -45) {
      prevImage(); // Swiped right -> previous photo
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
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
    <div className="crush-pdp bg-white text-neutral-900 min-h-screen py-6 sm:py-10">
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
          className="mb-8 font-display text-[11px] tracking-[0.2em] uppercase text-neutral-400 flex flex-wrap items-center gap-2 border-b border-neutral-100 pb-3"
        >
          <Link to="/" className="hover:text-black no-underline transition-colors">
            Atelier Home
          </Link>
          <span className="text-neutral-300">/</span>
          <Link
            to="/collections/all"
            className="hover:text-black no-underline transition-colors"
          >
            Spring 2026 Collection
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-600">
            {product.productType || 'Dresses'}
          </span>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900 font-semibold truncate max-w-xs sm:max-w-md">
            {product.title}
          </span>
        </nav>

        {/* ========================================================
            TOP SECTION: BALANCED 2-COLUMN HERO & PURCHASING CONSOLE
            Height is balanced between left and right columns!
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
          
          {/* ========================================================
              LEFT COLUMN: CURATED EDITORIAL GALLERY & DETAIL GRID
             ======================================================== */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Stage Viewport with Next/Prev Arrows */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-neutral-100 border border-neutral-100 shadow-sm group select-none touch-pan-y" onTouchStart={handleGalleryTouchStart} onTouchMove={handleGalleryTouchMove} onTouchEnd={handleGalleryTouchEnd}>
              {images[activeImageIndex] ? (
                <img
                  src={images[activeImageIndex].url}
                  alt={images[activeImageIndex].altText || product.title}
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] cursor-zoom-in"
                  loading="eager"
                  onClick={() => setIsZoomModalOpen(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-xs text-neutral-400 uppercase tracking-widest">
                  Atelier Visual Preview
                </div>
              )}

              {/* Top Left: Atelier Eyebrow Pill */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-neutral-200/60 shadow-xs pointer-events-none">
                <span className="font-display text-[9px] sm:text-[10px] font-semibold tracking-[0.22em] uppercase text-neutral-900">
                  {product.productType || 'CRUSH ATELIER · US'}
                </span>
              </div>

              {/* Top Right: Image Counter Badge */}
              {images.length > 1 && (
                <div className="absolute top-4 right-4 bg-neutral-900/90 text-white backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-display font-medium tracking-[0.2em] uppercase shadow-xs pointer-events-none">
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-neutral-900 hover:text-white text-neutral-900 border border-neutral-200/80 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md opacity-85 group-hover:opacity-100"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-neutral-900 hover:text-white text-neutral-900 border border-neutral-200/80 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md opacity-85 group-hover:opacity-100"
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
                className="absolute bottom-4 right-4 bg-white/90 hover:bg-neutral-900 hover:text-white text-neutral-900 backdrop-blur-md px-4 py-2 rounded-full border border-neutral-200 transition-all duration-200 shadow-md cursor-pointer flex items-center gap-2 group/zoom"
                aria-label="Zoom in high resolution"
              >
                <span className="text-[11px] text-amber-600 group-hover/zoom:rotate-45 transition-transform">✦</span>
                <span className="font-display text-[10px] font-semibold tracking-[0.18em] uppercase">
                  Inspect Fabric
                </span>
              </button>
            </div>

            {/* Editorial Thumbnail Strip */}
            {images.length > 1 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-widest text-neutral-400 px-1">
                  <span>Atelier Angles ({images.length} High-Res Perspectives)</span>
                  <button
                    type="button"
                    onClick={() => setIsZoomModalOpen(true)}
                    className="underline underline-offset-2 text-neutral-900 hover:text-black cursor-pointer font-bold"
                  >
                    View Lightbox ↗
                  </button>
                </div>
                <div
                  className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none"
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
                        className={`group relative shrink-0 w-16 sm:w-20 aspect-[3/4] overflow-hidden rounded-xl border transition-all duration-200 cursor-pointer bg-neutral-100 ${
                          isActive
                            ? 'border-2 border-neutral-900 shadow-md ring-2 ring-black/10 scale-[1.02]'
                            : 'border-neutral-200/80 opacity-70 hover:opacity-100 hover:border-neutral-400'
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
              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <div
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 cursor-pointer shadow-xs"
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
                  <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md py-1.5 px-3 rounded-full border border-neutral-200/60 text-center shadow-xs">
                    <span className="font-display text-[9px] uppercase tracking-wider text-neutral-900 font-bold">
                      Bodice & Self-Ties Detail
                    </span>
                  </div>
                </div>

                <div
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 cursor-pointer shadow-xs"
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
                  <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md py-1.5 px-3 rounded-full border border-neutral-200/60 text-center shadow-xs">
                    <span className="font-display text-[9px] uppercase tracking-wider text-neutral-900 font-bold">
                      A-Line Silhouette Drape
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Atelier Key Highlights Strip */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-1">
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                <span className="font-display text-[10px] font-bold tracking-[0.16em] uppercase text-neutral-900 block">
                  100% Cotton
                </span>
                <span className="font-body text-[10px] text-neutral-500 mt-0.5 block">
                  Crisp breathable weave
                </span>
              </div>
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                <span className="font-display text-[10px] font-bold tracking-[0.16em] uppercase text-neutral-900 block">
                  Adjustable Ties
                </span>
                <span className="font-body text-[10px] text-neutral-500 mt-0.5 block">
                  Custom shoulder drop
                </span>
              </div>
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                <span className="font-display text-[10px] font-bold tracking-[0.16em] uppercase text-neutral-900 block">
                  A-Line Cut
                </span>
                <span className="font-body text-[10px] text-neutral-500 mt-0.5 block">
                  Fluid mini length
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: PURCHASING CONSOLE (Sleek, focused & perfectly balanced!)
             ======================================================== */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 h-fit space-y-6">
            
            {/* Header: Eyebrow, Title, Reviews, Price */}
            <div className="border-b border-neutral-100 pb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-[10px] font-semibold tracking-[0.25em] uppercase text-neutral-400">
                  CRUSH ATELIER · US
                </span>
                <span
                  className={`font-display text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border ${
                    isAvailable
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200 font-semibold'
                      : 'text-neutral-500 bg-neutral-100 border-neutral-200'
                  }`}
                >
                  {isAvailable ? '● In Stock · Ships Today' : '✕ Out of Stock'}
                </span>
              </div>

              {/* Title: Classic High-Fashion Serif */}
              <h1 className="font-serif font-normal text-3xl sm:text-4xl lg:text-[42px] tracking-tight text-neutral-900 m-0 leading-[1.12]">
                {product.title}
              </h1>

              {/* Rating & Social Proof */}
              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex text-amber-500 text-xs tracking-tight">
                  ★★★★★
                </div>
                <span className="font-display text-[11px] font-medium tracking-wider text-neutral-600">
                  4.9 <span className="text-neutral-300">•</span> 42 Verified Atelier Reviews
                </span>
              </div>

              {/* Price & Installments Row */}
              <div className="pt-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-body text-3xl font-bold text-neutral-900">
                    <Money data={price} />
                  </span>
                  {compareAtPrice && (
                    <span className="font-body text-lg text-neutral-400 line-through">
                      <Money data={compareAtPrice} />
                    </span>
                  )}
                  <span className="font-display text-[10px] tracking-widest text-emerald-800 font-semibold uppercase bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Free US Shipping $150+
                  </span>
                </div>

                <p className="font-body text-xs text-neutral-500 mt-2 m-0 flex items-center gap-1.5">
                  <span>or 4 interest-free installments of $7.99 with</span>
                  <span className="font-display font-bold uppercase tracking-wider text-neutral-900 underline underline-offset-2">
                    Klarna
                  </span>
                  <span>or</span>
                  <span className="font-display font-bold uppercase tracking-wider text-neutral-900 underline underline-offset-2">
                    Afterpay
                  </span>
                </p>
              </div>
            </div>

            {/* Dynamic Options Selectors */}
            {meaningfulOptions.map((opt: any) => {
              const optName = opt.name;
              const currentValue = selectedOptions[optName];

              // COLOR SELECTOR: Matching User's Screenshot 1 (Selected Color · Brown + portrait cards)
              if (isColorOption(optName)) {
                return (
                  <div key={opt.id || optName} className="space-y-3">
                    <div className="flex items-center justify-between">
                      {/* Exact layout as user image 1: Selected Color · Brown */}
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm tracking-wide text-neutral-600">
                          Selected Color
                        </span>
                        <span className="text-neutral-400 font-bold text-xs">·</span>
                        <span className="font-display text-sm font-bold tracking-wide text-neutral-900 capitalize">
                          {currentValue}
                        </span>
                      </div>
                      <span className="font-display text-[10px] tracking-widest uppercase text-neutral-400">
                        {opt.values.length} Shades
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none"
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
                            className={`group relative shrink-0 w-16 sm:w-20 aspect-[3/4] rounded-lg overflow-hidden transition-all duration-200 cursor-pointer p-0.5 bg-white ${
                              isSelected
                                ? 'border-2 border-black shadow-md ring-1 ring-black'
                                : 'border border-neutral-200 hover:border-neutral-500 opacity-80 hover:opacity-100 hover:scale-[1.02]'
                            }`}
                            aria-checked={isSelected}
                            aria-label={`Select color ${val}`}
                            role="radio"
                          >
                            {swatchImgUrl ? (
                              <img
                                src={swatchImgUrl}
                                alt={val}
                                className="w-full h-full object-cover object-top rounded-md"
                                loading="lazy"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center font-display text-[9px] uppercase tracking-wider text-black/70 rounded-md"
                                style={{backgroundColor: hex}}
                              >
                                {val}
                              </div>
                            )}

                            {isSelected && (
                              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neutral-900 border border-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // SIZE SELECTOR: Modern rounded tiles with Smart Size Advisor trigger
              if (isSizeOption(optName)) {
                return (
                  <div key={opt.id || optName} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs font-semibold tracking-wide uppercase text-neutral-800">
                        Select {optName}:{' '}
                        <span className="font-bold text-neutral-900">
                          {currentValue}
                        </span>
                      </span>

                      {/* Smart Size Advisor button */}
                      <button
                        type="button"
                        onClick={() => setSizeGuideOpen(true)}
                        className="flex items-center gap-1.5 font-display text-xs tracking-wider uppercase text-neutral-900 hover:text-black underline underline-offset-4 cursor-pointer group"
                      >
                        <span className="text-[11px] text-emerald-700">✦</span>
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
                            className={`py-3.5 rounded-xl text-center font-display text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer relative ${
                              isSelected
                                ? 'bg-neutral-900 text-white shadow-md'
                                : isSizeAvailable ? 'border border-neutral-200 bg-white text-neutral-800 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white hover:shadow-sm hover:-translate-y-0.5'
                                : 'border border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-60'
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

                    <div className="flex items-center justify-between text-[11px] font-body text-neutral-500 px-0.5">
                      <span>✦ True to atelier sizing (Fits US 4 - 10)</span>
                      <a
                        href="#atelier-specifications"
                        className="font-display uppercase text-[10px] text-neutral-800 underline underline-offset-2 hover:text-black"
                      >
                        Garment Dimensions ↓
                      </a>
                    </div>
                  </div>
                );
              }

              // Generic Option Selector
              return (
                <div key={opt.id || optName} className="space-y-2">
                  <span className="font-display text-xs font-semibold tracking-wide uppercase text-neutral-800 block">
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
                          className={`px-4 py-2.5 rounded-xl border text-xs font-display uppercase tracking-wider transition-all duration-200 ${
                            isSelected
                              ? 'bg-neutral-900 text-white font-bold'
                              : 'border-neutral-200 bg-white text-neutral-800 hover:border-black'
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
                <div className="flex items-center border border-neutral-200 rounded-full bg-white h-14 px-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full flex items-center justify-center font-display text-lg hover:bg-neutral-900 hover:text-white transition-all duration-200 cursor-pointer text-neutral-700 active:scale-95"
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
                    className="w-10 text-center font-body text-sm font-bold border-none outline-none bg-transparent text-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="w-10 h-10 rounded-full flex items-center justify-center font-display text-lg hover:bg-neutral-900 hover:text-white transition-all duration-200 cursor-pointer text-neutral-700 active:scale-95"
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
                      <span className="w-full h-14 rounded-full bg-neutral-900 group-hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold tracking-widest uppercase shadow-md group-hover:shadow-xl group-hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.99] cursor-pointer">
                        {isAvailable ? (
                          <>
                            <svg
                              width="16"
                              height="16"
                              className="w-4 h-4 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              viewBox="0 0 24 24"
                              style={{width: 16, height: 16}}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
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
                      className="w-full h-14 rounded-full bg-neutral-200 text-neutral-400 text-xs sm:text-sm font-semibold tracking-widest uppercase cursor-not-allowed"
                    >
                      Unavailable
                    </button>
                  )}
                </div>
              </div>

              {addedToast && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-900 font-display text-xs tracking-wider uppercase text-center animate-pulse shadow-sm">
                  ✓ Added {quantity} item{quantity > 1 ? 's' : ''} to your Atelier Bag
                </div>
              )}
            </div>

            {/* Minimalist SVG Luxury Reassurance Trio */}
            <div className="py-4 px-5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2.5 font-display text-[11px] tracking-wide text-neutral-700">
              <div className="flex items-center gap-3">
                <svg width="16" height="16" className="w-4 h-4 text-neutral-900 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{width: 16, height: 16}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75m0 0A1.125 1.125 0 0013.125 2.625h-7.5A1.125 1.125 0 004.5 3.75v10.5m9.75-6.75h3.75" />
                </svg>
                <span>Complimentary US Ground Delivery On Orders Over $150</span>
              </div>
              <div className="flex items-center gap-3">
                <svg width="16" height="16" className="w-4 h-4 text-neutral-900 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{width: 16, height: 16}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <span>30-Day Effortless Atelier Returns & Size Exchanges</span>
              </div>
              <div className="flex items-center gap-3">
                <svg width="16" height="16" className="w-4 h-4 text-neutral-900 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{width: 16, height: 16}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918" />
                </svg>
                <span>Delivered In Signature Archival Breathable Dust Bag</span>
              </div>
            </div>

            {/* Concise Atelier Overview & Direct Anchor */}
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
              <p className="font-serif italic text-sm text-neutral-800 leading-snug m-0">
                &ldquo;Cut from crisp breathable 100% cotton with romantic self-tie shoulder bows and an airy A-line drape.&rdquo;
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/50 text-xs">
                <span className="font-display uppercase text-[10px] text-neutral-500">
                  Model: 5&apos;9&quot; • Wears Size S
                </span>
                <a
                  href="#atelier-specifications"
                  className="font-display uppercase text-[10px] font-bold tracking-wider text-neutral-900 hover:underline underline-offset-4"
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
          className="mt-16 sm:mt-24 pt-12 border-t border-neutral-100 scroll-mt-20"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="font-display text-[10px] font-bold tracking-[0.28em] uppercase text-neutral-400 block mb-1">
                Atelier Blueprint & Tailoring
              </span>
              <h2 className="font-serif font-normal text-3xl sm:text-4xl text-neutral-900 m-0">
                Specifications & Garment Dimensions
              </h2>
            </div>

            {/* Tab switchers */}
            <div className="flex rounded-full border border-neutral-200 bg-neutral-100 p-1 shrink-0 max-w-full overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveSpecsTab('details')}
                className={`px-4 py-1.5 rounded-full text-xs font-display uppercase tracking-wider cursor-pointer transition-all ${
                  activeSpecsTab === 'details'
                    ? 'bg-neutral-900 text-white font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Silhouette & Cut
              </button>
              <button
                type="button"
                onClick={() => setActiveSpecsTab('fabric')}
                className={`px-4 py-1.5 rounded-full text-xs font-display uppercase tracking-wider cursor-pointer transition-all ${
                  activeSpecsTab === 'fabric'
                    ? 'bg-neutral-900 text-white font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Fabric & Care
              </button>
              <button
                type="button"
                onClick={() => setActiveSpecsTab('measurements')}
                className={`px-4 py-1.5 rounded-full text-xs font-display uppercase tracking-wider cursor-pointer transition-all ${
                  activeSpecsTab === 'measurements'
                    ? 'bg-neutral-900 text-white font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Size Chart
              </button>
            </div>
          </div>

          {/* TAB 1: SILHOUETTE & DESIGN SPECIFICATIONS */}
          {activeSpecsTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-3 shadow-xs">
                <span className="font-display text-[11px] font-bold tracking-widest uppercase text-amber-700 block">
                  01 • The Neckline & Bodice
                </span>
                <h3 className="font-serif text-2xl text-neutral-900 m-0">
                  Straight Square Cut
                </h3>
                <p className="font-body text-xs sm:text-sm text-neutral-600 leading-relaxed m-0">
                  Tailored with a clean straight horizontal square neckline, framing the collarbones with timeless French refinement and clean seam binding.
                </p>
              </div>

              <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-3 shadow-xs">
                <span className="font-display text-[11px] font-bold tracking-widest uppercase text-amber-700 block">
                  02 • Adjustable Straps
                </span>
                <h3 className="font-serif text-2xl text-neutral-900 m-0">
                  Self-Tie Shoulder Bows
                </h3>
                <p className="font-body text-xs sm:text-sm text-neutral-600 leading-relaxed m-0">
                  Delicate frill-edged ties allow full customization over vertical torso drop, bust elevation, and neckline depth for your unique body proportions.
                </p>
              </div>

              <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-3 shadow-xs">
                <span className="font-display text-[11px] font-bold tracking-widest uppercase text-amber-700 block">
                  03 • Silhouette & Hem
                </span>
                <h3 className="font-serif text-2xl text-neutral-900 m-0">
                  Airy A-Line Swing
                </h3>
                <p className="font-body text-xs sm:text-sm text-neutral-600 leading-relaxed m-0">
                  Flows gently away from the natural waist into an effortless above-knee mini hemline, providing fluid motion and flattering ease through the hips.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: FABRICATION, WEAVE & CARE GUIDELINES */}
          {activeSpecsTab === 'fabric' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1.5 shadow-xs">
                <span className="font-display text-[10px] uppercase tracking-widest text-neutral-400 block">
                  Composition
                </span>
                <strong className="font-display text-sm uppercase text-neutral-900 block">
                  100% Breathable Cotton
                </strong>
                <p className="font-body text-xs text-neutral-600 m-0 pt-1">
                  Pure natural cotton fibers woven for structural crispness and lightweight breathability.
                </p>
              </div>

              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1.5 shadow-xs">
                <span className="font-display text-[10px] uppercase tracking-widest text-neutral-400 block">
                  Elasticity & Structure
                </span>
                <strong className="font-display text-sm uppercase text-neutral-900 block">
                  Non-Stretch Woven
                </strong>
                <p className="font-body text-xs text-neutral-600 m-0 pt-1">
                  Holds tailored A-line geometry gracefully without clinging. Unlined for airy summer wear.
                </p>
              </div>

              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1.5 shadow-xs">
                <span className="font-display text-[10px] uppercase tracking-widest text-neutral-400 block">
                  Washing Method
                </span>
                <strong className="font-display text-sm uppercase text-neutral-900 block">
                  Cold Delicate Wash
                </strong>
                <p className="font-body text-xs text-neutral-600 m-0 pt-1">
                  Machine wash cold with like colors on gentle cycle. Use mild detergent to protect color.
                </p>
              </div>

              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1.5 shadow-xs">
                <span className="font-display text-[10px] uppercase tracking-widest text-neutral-400 block">
                  Drying & Pressing
                </span>
                <strong className="font-display text-sm uppercase text-neutral-900 block">
                  Line Dry or Low Heat
                </strong>
                <p className="font-body text-xs text-neutral-600 m-0 pt-1">
                  Hang dry in shade or tumble dry low. Warm iron if desired to restore crisp woven finish.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PRECISION GARMENT MEASUREMENTS TABLE */}
          {activeSpecsTab === 'measurements' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-xs">
                <table className="w-full text-left font-body text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-neutral-900 text-white font-display uppercase tracking-wider text-xs whitespace-nowrap">
                      <th className="py-3.5 px-4">Size</th>
                      <th className="py-3.5 px-4">Garment Length</th>
                      <th className="py-3.5 px-4">Bust Circumference</th>
                      <th className="py-3.5 px-4">Waist Circumference</th>
                      <th className="py-3.5 px-4 text-right">Quick Select</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    <tr className="hover:bg-neutral-50 transition-colors">
                      <td className="py-4 px-4 font-bold font-display text-sm text-neutral-900">S (US 4 - 6)</td>
                      <td className="py-4 px-4 text-neutral-700">31.5&quot; (80 cm)</td>
                      <td className="py-4 px-4 text-neutral-700">33.9&quot; (86 cm)</td>
                      <td className="py-4 px-4 text-neutral-700">33.5&quot; (85 cm)</td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectOption('Size', 'S')}
                          className="px-3.5 py-1.5 rounded-full text-xs font-display uppercase font-bold border border-neutral-300 hover:border-black hover:bg-neutral-900 hover:text-white cursor-pointer transition-colors"
                        >
                          Choose S
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-50 transition-colors bg-neutral-50/50">
                      <td className="py-4 px-4 font-bold font-display text-sm text-neutral-900">M (US 8)</td>
                      <td className="py-4 px-4 text-neutral-700">31.9&quot; (81 cm)</td>
                      <td className="py-4 px-4 text-neutral-700">35.4&quot; (90 cm)</td>
                      <td className="py-4 px-4 text-neutral-700">35.0&quot; (89 cm)</td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectOption('Size', 'M')}
                          className="px-3.5 py-1.5 rounded-full text-xs font-display uppercase font-bold border border-neutral-300 hover:border-black hover:bg-neutral-900 hover:text-white cursor-pointer transition-colors"
                        >
                          Choose M
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-50 transition-colors">
                      <td className="py-4 px-4 font-bold font-display text-sm text-neutral-900">L (US 10)</td>
                      <td className="py-4 px-4 text-neutral-700">32.3&quot; (82 cm)</td>
                      <td className="py-4 px-4 text-neutral-700">37.0&quot; (94 cm)</td>
                      <td className="py-4 px-4 text-neutral-700">36.6&quot; (93 cm)</td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectOption('Size', 'L')}
                          className="px-3.5 py-1.5 rounded-full text-xs font-display uppercase font-bold border border-neutral-300 hover:border-black hover:bg-neutral-900 hover:text-white cursor-pointer transition-colors"
                        >
                          Choose L
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sizing Advisor Promo Card */}
              <div className="lg:col-span-4 p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-3.5 shadow-xs">
                <span className="font-display text-[10px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Smart Sizing Assistant
                </span>
                <h3 className="font-serif text-2xl text-neutral-900 m-0">
                  Unsure About Your Size?
                </h3>
                <p className="font-body text-xs text-neutral-600 leading-relaxed m-0">
                  Use our interactive 4-step Size Advisor to calculate your exact fit based on height, weight, body shape, and personal fit preference.
                </p>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="w-full py-3.5 rounded-full bg-neutral-900 hover:bg-neutral-800 hover:shadow-md hover:-translate-y-0.5 text-white text-xs font-bold tracking-widest uppercase cursor-pointer shadow-sm transition-all"
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
        <section className="mt-16 sm:mt-24 py-12 sm:py-16 border-t border-b border-neutral-100 bg-neutral-50/70 rounded-3xl my-8">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center px-6">
            <div className="md:col-span-5 aspect-[3/4] overflow-hidden rounded-2xl border border-neutral-200 shadow-md">
              {images[1] ? (
                <img
                  src={images[1].url}
                  alt="Atelier Tailoring Detail"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-neutral-200 flex items-center justify-center font-display text-xs uppercase tracking-widest text-black/40">
                  Atelier Silhouette
                </div>
              )}
            </div>
            <div className="md:col-span-7 space-y-4 md:pl-6">
              <span className="font-display text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 block">
                The Atelier Design Philosophy
              </span>
              <h2 className="font-serif font-normal text-3xl sm:text-4xl text-neutral-900 leading-tight m-0">
                Crafted for Effortless Femininity & Timeless Elegance
              </h2>
              <p className="font-body text-sm sm:text-base text-neutral-600 leading-relaxed m-0">
                Every line of the {product.title} is calibrated to balance structural cotton tailoring with romantic ease. The self-tie shoulder bows give you total command over your fit, allowing you to raise or lower the neckline to suit your personal style.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-display uppercase tracking-wider text-neutral-800">
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-600">✦</span> French Finished Seams
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-600">✦</span> Breathable 100% Cotton
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-600">✦</span> Made For Day-To-Evening
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
            <span className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400 block mb-1">
              Atelier Wardrobe Notes
            </span>
            <h2 className="font-serif font-normal text-3xl sm:text-4xl text-neutral-900 m-0">
              How To Style The Mini Dress
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2 shadow-xs">
              <span className="font-display text-[11px] font-bold tracking-widest uppercase text-amber-700 block">
                Look 01 • Sunlit Daytime Ease
              </span>
              <h3 className="font-serif text-xl text-neutral-900 m-0">
                Effortless Coastal Stroll
              </h3>
              <p className="font-body text-xs sm:text-sm text-neutral-600 leading-relaxed m-0">
                Style with minimalist flat woven leather slides, an oversized raffia market tote, and tortoiseshell sunglasses for sun-drenched afternoons.
              </p>
            </div>

            <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2 shadow-xs">
              <span className="font-display text-[11px] font-bold tracking-widest uppercase text-amber-700 block">
                Look 02 • Twilight Soirée
              </span>
              <h3 className="font-serif text-xl text-neutral-900 m-0">
                Elevated Evening Cocktail
              </h3>
              <p className="font-body text-xs sm:text-sm text-neutral-600 leading-relaxed m-0">
                Tie the shoulder bows into crisp structural knots, step into strappy kitten heels, and accent with bold sculptural gold earrings and a satin clutch.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================
            VERIFIED ATELIER CLIENT REVIEWS
           ======================================================== */}
        <section className="mt-16 sm:mt-24 pt-12 border-t border-neutral-100">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 max-w-5xl mx-auto">
            <div>
              <span className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400 block mb-1">
                Verified Feedback
              </span>
              <h2 className="font-serif font-normal text-3xl sm:text-4xl text-neutral-900 m-0">
                Atelier Client Impressions
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-sm">★★★★★</span>
              <span className="font-display text-xs font-bold uppercase tracking-wider text-neutral-900">
                4.9 Overall Fit Rating (42 Reviews)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2.5 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-500">★★★★★</span>
                <span className="font-display text-[10px] uppercase tracking-widest text-emerald-800 font-semibold">
                  ✓ Verified Buyer
                </span>
              </div>
              <p className="font-body text-xs text-neutral-700 leading-relaxed italic m-0">
                &ldquo;The fabric has the most gorgeous crisp cotton structure. The adjustable shoulder ties are a dream — they let me fit the bust exactly as I like!&rdquo;
              </p>
              <div className="pt-2 border-t border-neutral-200/50 flex justify-between items-center text-[11px] font-display uppercase tracking-wider text-neutral-500">
                <span>Elena M.</span>
                <span>Size S • Khaki</span>
              </div>
            </div>

            <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2.5 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-500">★★★★★</span>
                <span className="font-display text-[10px] uppercase tracking-widest text-emerald-800 font-semibold">
                  ✓ Verified Buyer
                </span>
              </div>
              <p className="font-body text-xs text-neutral-700 leading-relaxed italic m-0">
                &ldquo;Used the Size Advisor before ordering and it recommended size M. Fits like a bespoke piece. Truly classic luxury feel without the insane price tag.&rdquo;
              </p>
              <div className="pt-2 border-t border-neutral-200/50 flex justify-between items-center text-[11px] font-display uppercase tracking-wider text-neutral-500">
                <span>Sophie R.</span>
                <span>Size M • Brown</span>
              </div>
            </div>

            <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2.5 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-500">★★★★★</span>
                <span className="font-display text-[10px] uppercase tracking-widest text-emerald-800 font-semibold">
                  ✓ Verified Buyer
                </span>
              </div>
              <p className="font-body text-xs text-neutral-700 leading-relaxed italic m-0">
                &ldquo;Pure perfection in Black. It has an effortlessly chic French silhouette. Have worn it to lunch and dressed it up for dinner.&rdquo;
              </p>
              <div className="pt-2 border-t border-neutral-200/50 flex justify-between items-center text-[11px] font-display uppercase tracking-wider text-neutral-500">
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
          <section className="mt-20 sm:mt-28 pt-16 border-t border-neutral-100">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="font-display text-[10px] font-semibold tracking-[0.25em] text-neutral-400 uppercase m-0 mb-1">
                  Atelier Pairing
                </p>
                <h2 className="font-serif font-normal text-3xl sm:text-4xl text-neutral-900 m-0">
                  Complete The Collection
                </h2>
              </div>
              <Link
                to="/collections/all"
                className="font-display text-xs font-semibold tracking-wider uppercase text-neutral-900 hover:underline underline-offset-4 no-underline"
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
          const sizeOptName =
            meaningfulOptions.find((o: any) => isSizeOption(o.name))?.name || 'Size';
          handleSelectOption(sizeOptName, size);

          // Find exact variant matching this recommended size
          const targetVariant =
            variants.find((v: any) =>
              v.selectedOptions?.every((so: any) => {
                if (so.name === sizeOptName) return so.value.toLowerCase() === size.toLowerCase();
                return so.value === selectedOptions[so.name];
              })
            ) ||
            variants.find((v: any) =>
              v.selectedOptions?.some(
                (so: any) => so.name === sizeOptName && so.value.toLowerCase() === size.toLowerCase()
              )
            ) ||
            activeVariant;

          if (targetVariant?.id) {
            cartFetcher.submit(
              {
                [CartForm.INPUT_NAME]: JSON.stringify({
                  action: CartForm.ACTIONS.LinesAdd,
                  inputs: {
                    lines: [
                      {
                        merchandiseId: targetVariant.id,
                        quantity: 1,
                        selectedVariant: targetVariant,
                      },
                    ],
                  },
                }),
              },
              {method: 'POST', action: '/cart'}
            );
          }
          open('cart');
          setAddedToast(true);
          setTimeout(() => setAddedToast(false), 3000);
        }}
      />

      {/* ========================================================
          STICKY QUICK-ADD FLOATING BAR
         ======================================================== */}
      <div
        className={`fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-neutral-200/80 py-2.5 sm:py-3 px-3 sm:px-8 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isStickyVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isStickyVisible}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {images[activeImageIndex] && (
              <div className="w-10 h-13 rounded-lg bg-neutral-100 shrink-0 overflow-hidden border border-neutral-200">
                <img
                  src={images[activeImageIndex].url}
                  alt={product.title}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-serif text-sm sm:text-base font-normal tracking-normal text-neutral-900 m-0 truncate">
                {product.title}
              </h4>
              <p className="font-display text-[11px] tracking-wide text-neutral-500 m-0 flex items-center gap-2">
                <span className="font-bold text-neutral-900">
                  <Money data={price} />
                </span>
                <span className="text-neutral-300">•</span>
                <span className="text-neutral-700 uppercase font-semibold">
                  {Object.values(selectedOptions).join(' / ')}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
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
              <span
                className={`rounded-full py-2.5 px-5 sm:py-3 sm:px-8 text-xs font-bold tracking-widest uppercase shadow-md transition-all flex items-center justify-center ${
                  isAvailable ? 'bg-neutral-900 group-hover:bg-neutral-800 text-white group-hover:shadow-lg group-hover:-translate-y-0.5 cursor-pointer'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {isAvailable ? 'Add To Bag →' : 'Sold Out'}
              </span>
            </AddToCartButton>
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
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="font-display text-xs tracking-widest uppercase">
                {product.title} • High-Resolution Atelier Inspection
              </span>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="font-display text-xs tracking-widest uppercase hover:text-white cursor-pointer bg-white/10 px-3 py-1 rounded-full border border-white/20"
                aria-label="Close fabric inspect"
              >
                ✕ Close ESC
              </button>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/20 shadow-2xl bg-black max-h-[80vh] flex items-center justify-center">
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white border border-white/30 flex items-center justify-center cursor-pointer text-base"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white border border-white/30 flex items-center justify-center cursor-pointer text-base"
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
