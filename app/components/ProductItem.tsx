import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

export function ProductItem({
  product,
  loading,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment
    | any;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const isLocalImage = image?.url?.startsWith('/');

  return (
    <Link
      className="crush-product-card group block text-left no-underline text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
      aria-label={`${product.title} - View piece details`}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-neutral-100 mb-3 border border-neutral-100 shadow-xs group-hover:shadow-md transition-shadow duration-300">
        {image ? (
          isLocalImage ? (
            <img
              src={image.url}
              alt={image.altText || product.title}
              loading={loading || 'lazy'}
              className="w-full h-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            />
          ) : (
            <Image
              alt={image.altText || product.title}
              aspectRatio="3/4"
              data={image}
              loading={loading}
              className="w-full h-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
              sizes="(min-width: 64em) 25vw, (min-width: 48em) 33vw, 50vw"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center font-display text-xs text-neutral-400 tracking-widest uppercase">
            Atelier Visual
          </div>
        )}

        {/* Hover Quick View Pill */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
          <span className="block w-full py-2.5 rounded-full bg-neutral-900/95 backdrop-blur-md text-white text-center font-display text-[11px] font-semibold tracking-widest uppercase shadow-md">
            View Piece →
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-xs sm:text-sm font-semibold tracking-wide uppercase text-neutral-900 m-0 line-clamp-1 group-hover:underline underline-offset-4">
            {product.title}
          </h3>
          <span className="font-body text-xs sm:text-sm font-bold text-neutral-900 shrink-0">
            <Money data={product.priceRange.minVariantPrice} />
          </span>
        </div>
        <p className="font-display text-[10px] tracking-widest text-neutral-400 uppercase m-0">
          Atelier Series • US
        </p>
      </div>
    </Link>
  );
}
