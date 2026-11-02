import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/policies.$handle';
import {type Shop} from '@shopify/hydrogen/storefront-api-types';

type SelectedPolicies = keyof Pick<
  Shop,
  'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy'
>;

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Hydrogen | ${data?.policy.title ?? ''}`}];
};

export async function loader({params, context}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response('No handle was passed in', {status: 404});
  }

  const policyName = params.handle.replace(
    /-([a-z])/g,
    (_: unknown, m1: string) => m1.toUpperCase(),
  ) as SelectedPolicies;

  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      privacyPolicy: false,
      shippingPolicy: false,
      termsOfService: false,
      refundPolicy: false,
      [policyName]: true,
      language: context.storefront.i18n?.language,
    },
  });

  const policy = data.shop?.[policyName];

  if (!policy) {
    const formattedTitle = params.handle
      .split('-')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      policy: {
        title: formattedTitle,
        body: `<p>The ${formattedTitle} for CRUSH CLOTHING is configured directly within Shopify Admin. For questions regarding orders, complimentary US shipping on orders over $150, or our 30-day return window, please connect with our client care team.</p>`,
      },
    };
  }

  return {policy};
}

export default function Policy() {
  const {policy} = useLoaderData<typeof loader>();

  return (
    <div className="crush-policy bg-[var(--color-ivory)] text-[var(--color-ink)] min-h-[70vh] py-14 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="font-display text-xs tracking-widest uppercase text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] no-underline mb-8 inline-block"
        >
          ← Return to Atelier
        </Link>
        <span className="font-display text-[10px] font-semibold tracking-[0.25em] text-[var(--color-ink)]/50 uppercase block mb-2">
          CRUSH CLOTHING Legal & Policy
        </span>
        <h1 className="font-display font-bold text-3xl sm:text-5xl tracking-[0.06em] uppercase text-[var(--color-ink)] m-0 mb-8 border-b border-[var(--color-stone)] pb-6">
          {policy.title}
        </h1>
        <div
          className="font-body text-base text-[var(--color-ink)]/80 leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{__html: policy.body}}
        />
      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/Shop
const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
    }
  }
` as const;
