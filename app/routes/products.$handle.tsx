import {useState, useEffect, useRef} from 'react';
import {redirect, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
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
      content: `${title} — Contemporary women's apparel by CRUSH CLOTHING. Sculptural tailoring and premium fabrications.`,
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

  let shopifyProduct: any = null;
  try {
    const res = await storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    });
    shopifyProduct = res?.product;
  } catch {
    shopifyProduct = null;
  }

  if (!shopifyProduct?.id) {
    throw redirect('/collections/all');
  }

  // Get related products from Shopify
  let related: any[] = [];
  try {
    const relRes = await storefront.query(RELATED_PRODUCTS_QUERY, {
      variables: {first: 5},
    });
    related = (relRes?.products?.nodes || []).filter(
      (p: any) => p.handle !== handle,
    ).slice(0, 4);
  } catch {
    related = [];
  }

  const product = {
    ...shopifyProduct,
    categoryTitle: shopifyProduct.productType || 'Atelier Collection',
    tag: 'SS 2026 Collection',
    specs: {
      fabric: 'High-performance luxury apparel fabrication',
      silhouette: 'Architectural contemporary silhouette',
      craft: 'Crafted with premium construction standards',
      details: 'Custom branded hardware, signature lining',
      care: 'Specialist dry clean only. Store on shaped wooden hanger.',
    },
    modelInfo: "Model is 5'10\" / 178 cm wearing size Small.",
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      {name: 'Ink Black', hex: '#111111'},
      {name: 'Chalk Ivory', hex: '#F4F1E9'},
      {name: 'Soft Stone', hex: '#D8D5CE'},
    ],
  };

  return {product, related};
}

function loadDeferredData({context: _context}: Route.LoaderArgs) {
  return {};
}

export default function ProductPage() {
  const {product, related} = useLoaderData<typeof loader>();
  const {open} = useAside();
  const [selectedSize, setSelectedSize] = useState('S');
  const [selectedColor, setSelectedColor] = useState(
    product.colors?.[0]?.name || 'Chalk Ivory',
  );
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'details' | 'fabric' | 'fit' | 'shipping'
  >('details');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedToast, setAddedToast] = useState(false);
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const mainCtaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mainCtaRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when the main CTA is scrolled above the viewport
        setIsStickyVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      {threshold: 0, rootMargin: '-60px 0px 0px 0px'},
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const images = product?.images?.nodes?.length
    ? product.images.nodes
    : product?.featuredImage
    ? [product.featuredImage]
    : [];

  const price = product?.selectedOrFirstAvailableVariant?.price || {
    amount: '380.00',
    currencyCode: 'USD',
  };
  const compareAtPrice =
    product?.selectedOrFirstAvailableVariant?.compareAtPrice;

  const handleAddToCart = () => {
    open('cart');
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

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
              availability: 'https://schema.org/InStock',
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
            {product.categoryTitle || 'Atelier'}
          </span>
          <span>/</span>
          <span className="text-[var(--color-ink)] font-bold">
            {product.title}
          </span>
        </nav>

        {/* 2-Column Luxury PDP Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Left Column: Interactive Photo Gallery */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Stage Image with High-Res Fabric Inspect */}
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

              {/* Tag pill overlay */}
              <div className="absolute top-4 left-4 bg-[var(--color-ivory)]/95 backdrop-blur-xs px-3.5 py-1.5 border border-[var(--color-stone)]">
                <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--color-ink)]">
                  {product.tag || 'Atelier SS 2026'}
                </span>
              </div>

              {/* Fabric Texture Inspect Pill */}
              <div className="absolute bottom-4 right-4 bg-[var(--color-ink)]/90 text-[var(--color-ivory)] backdrop-blur-xs px-3 py-1.5 border border-[var(--color-stone)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-md">
                <span className="font-display text-[10px] font-semibold tracking-[0.18em] uppercase flex items-center gap-1.5">
                  <span>✦</span> Inspect Drape & Weave
                </span>
              </div>
            </div>

            {/* Thumbnail Row */}
            {images.length > 1 && (
              <div
                className="grid grid-cols-4 sm:grid-cols-4 gap-3"
                role="region"
                aria-label="Product thumbnails"
              >
                {images.map((img: any, idx: number) => {
                  const isActive = activeImageIndex === idx;
                  return (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative aspect-[3/4] overflow-hidden border transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'border-[var(--color-ink)] ring-1 ring-[var(--color-ink)] shadow-sm'
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
                  {product.categoryTitle || 'CRUSH ATELIER // US'}
                </span>
                <span className="font-display text-[10px] tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2.5 py-0.5 border border-emerald-200">
                  ● In Stock
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

            {/* Color Swatch Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-semibold tracking-[0.14em] uppercase text-[var(--color-ink)]">
                    Color: <span className="font-normal text-[var(--color-ink)]/70">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3" role="radiogroup" aria-label="Color options">
                  {product.colors.map((color: any) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      className={`flex items-center gap-2 px-3 py-1.5 border text-xs font-display uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        selectedColor === color.name
                          ? 'border-[var(--color-ink)] bg-[var(--color-stone-light)]/80 font-bold ring-1 ring-[var(--color-ink)]'
                          : 'border-[var(--color-stone)] bg-transparent hover:border-[var(--color-stone-dark)]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{backgroundColor: color.hex}}
                      />
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector with Modal Trigger */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-semibold tracking-[0.14em] uppercase text-[var(--color-ink)]">
                  Select Size
                </span>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="font-display text-xs tracking-wider uppercase text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] underline underline-offset-4 cursor-pointer"
                >
                  Size Guide & Measurements
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Sizes">
                {(product.availableSizes || ['XS', 'S', 'M', 'L', 'XL']).map((size: string) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`py-3.5 text-center font-display text-xs font-semibold tracking-wider uppercase border transition-all duration-200 cursor-pointer ${
                      selectedSize === size
                        ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-ivory)] shadow-sm'
                        : 'border-[var(--color-stone)] bg-transparent text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-stone-light)]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

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

            {/* Add to Bag CTA */}
            <div ref={mainCtaRef} className="pt-2">
              {product.selectedOrFirstAvailableVariant?.id ? (
                <AddToCartButton
                  disabled={!product.selectedOrFirstAvailableVariant.availableForSale}
                  onClick={handleAddToCart}
                  lines={[
                    {
                      merchandiseId: product.selectedOrFirstAvailableVariant.id,
                      quantity,
                      selectedVariant: product.selectedOrFirstAvailableVariant,
                    },
                  ]}
                >
                  <span className="crush-btn crush-btn-primary w-full py-4 text-center font-display text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase shadow-md">
                    Add To Bag • <Money data={price} />
                  </span>
                </AddToCartButton>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="crush-btn crush-btn-primary w-full py-4 text-center font-display text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase shadow-md"
                >
                  Claim Piece • <Money data={price} />
                </button>
              )}
            </div>

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

            {/* 4-Tab Specification Accordion */}
            <div className="border-t border-[var(--color-stone)] pt-4 space-y-4">
              <div className="flex border-b border-[var(--color-stone)] overflow-x-auto">
                {[
                  {id: 'details', label: 'Atelier Details'},
                  {id: 'fabric', label: 'Fabric & Craft'},
                  {id: 'fit', label: 'Fit & Model'},
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
                <div className="font-body text-sm text-[var(--color-ink)]/80 leading-relaxed space-y-3">
                  {product.descriptionHtml ? (
                    <div dangerouslySetInnerHTML={{__html: product.descriptionHtml}} />
                  ) : (
                    <p>{product.description}</p>
                  )}
                  {product.specs?.details && (
                    <p className="font-display text-xs tracking-wider uppercase text-[var(--color-ink)] pt-2 border-t border-[var(--color-stone)]/50">
                      <strong>Design Accents:</strong> {product.specs.details}
                    </p>
                  )}
                </div>
              )}

              {/* Tab 2: Fabric & Craft */}
              {activeTab === 'fabric' && (
                <div className="font-body text-sm text-[var(--color-ink)]/80 leading-relaxed space-y-3">
                  <p>
                    <strong>Material:</strong> {product.specs?.fabric || 'Premium virgin textile'}
                  </p>
                  <p>
                    <strong>Craftsmanship:</strong> {product.specs?.craft || 'Tailored with blind interior seams in the United States.'}
                  </p>
                  <p>
                    <strong>Care Guidelines:</strong> {product.specs?.care || 'Specialist dry clean only.'}
                  </p>
                </div>
              )}

              {/* Tab 3: Fit & Model */}
              {activeTab === 'fit' && (
                <div className="font-body text-sm text-[var(--color-ink)]/80 leading-relaxed space-y-3">
                  <p>
                    <strong>Silhouette:</strong> {product.specs?.silhouette || 'Structural tailored profile.'}
                  </p>
                  <p>
                    <strong>Model Dimensions:</strong> {product.modelInfo || "Model is 5'10\" wearing size Small."}
                  </p>
                  <p className="text-xs text-[var(--color-ink)]/60">
                    If between sizes, we recommend selecting your regular size for tailored pieces or sizing down for fluid knit and bias-cut silk silhouettes.
                  </p>
                </div>
              )}

              {/* Tab 4: Delivery & Returns */}
              {activeTab === 'shipping' && (
                <div className="font-body text-sm text-[var(--color-ink)]/80 leading-relaxed space-y-2">
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

        {/* Related Products: Complete The Look */}
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
      </div>

      {/* Sizing Guide Modal */}
      {sizeGuideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="size-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-ink)]/70 backdrop-blur-xs"
        >
          <div className="bg-[var(--color-ivory)] max-w-lg w-full p-6 sm:p-8 border border-[var(--color-stone)] shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-stone)] mb-6">
              <h2
                id="size-guide-title"
                className="font-display font-bold text-lg tracking-widest uppercase m-0"
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
                    <th className="py-2">US</th>
                    <th className="py-2">Bust</th>
                    <th className="py-2">Waist</th>
                    <th className="py-2">Hips</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-stone)]">
                  <tr>
                    <td className="py-2.5 font-bold">XS</td>
                    <td>0–2</td>
                    <td>32–33&quot;</td>
                    <td>24–25&quot;</td>
                    <td>34–35&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">S</td>
                    <td>4–6</td>
                    <td>34–35&quot;</td>
                    <td>26–27&quot;</td>
                    <td>36–37&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">M</td>
                    <td>8–10</td>
                    <td>36–37&quot;</td>
                    <td>28–29&quot;</td>
                    <td>38–39&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">L</td>
                    <td>12–14</td>
                    <td>38–40&quot;</td>
                    <td>30–32&quot;</td>
                    <td>40–42&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">XL</td>
                    <td>16</td>
                    <td>41–43&quot;</td>
                    <td>33–35&quot;</td>
                    <td>43–45&quot;</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="font-body text-[11px] text-[var(--color-ink)]/60 mt-6 leading-normal">
              Measurements reflect garment sizing. If between sizes, we recommend sizing up for structured outer layers or down for bias-cut silk pieces.
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
            {images[0] && (
              <div className="w-10 h-12 bg-[var(--color-stone-light)] shrink-0 overflow-hidden border border-[var(--color-stone)]">
                <img
                  src={images[0].url}
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
                <span className="font-semibold"><Money data={price} /></span>
                <span className="text-[var(--color-stone-dark)]">•</span>
                <span className="text-[var(--color-ink)] uppercase">Size {selectedSize}</span>
              </p>
            </div>
          </div>

          {/* Right: Quick Size Stepper & Add to Bag Action */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-1 border border-[var(--color-stone)] bg-white p-0.5">
              {(product.availableSizes || ['XS', 'S', 'M', 'L', 'XL']).map((size: string) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`px-2.5 py-1 font-display text-[10px] font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
                    selectedSize === size
                      ? 'bg-[var(--color-ink)] text-[var(--color-ivory)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-stone-light)]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="crush-btn crush-btn-primary py-2.5 px-5 sm:px-8 text-xs shadow-md"
            >
              Add To Bag →
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
          {/* Backdrop button to close */}
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

      {product.selectedOrFirstAvailableVariant?.id && (
        <Analytics.ProductView
          data={{
            products: [
              {
                id: product.id,
                title: product.title,
                price: price.amount || '0',
                vendor: product.vendor,
                variantId: product.selectedOrFirstAvailableVariant.id || '',
                variantTitle:
                  product.selectedOrFirstAvailableVariant.title || '',
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
    descriptionHtml
    description
    options {
      name
      optionValues {
        name
      }
    }
    featuredImage {
      id
      url
      altText
    }
    images(first: 6) {
      nodes {
        id
        url
        altText
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
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
