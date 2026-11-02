import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/policies._index';
import type {PoliciesQuery, PolicyItemFragment} from 'storefrontapi.generated';

const FALLBACK_POLICIES: Array<{id: string; title: string; handle: string; description: string}> = [
  {
    id: 'policy-shipping',
    title: 'Shipping Policy',
    handle: 'shipping-policy',
    description: 'Complimentary US ground shipping on all orders over $150. Expedited and worldwide atelier options available.',
  },
  {
    id: 'policy-refund',
    title: 'Refund & Return Policy',
    handle: 'refund-policy',
    description: 'Complimentary 30-day domestic returns on all unworn, unaltered pieces in original condition with security tags intact.',
  },
  {
    id: 'policy-terms',
    title: 'Terms of Service',
    handle: 'terms-of-service',
    description: 'Legal terms governing orders, atelier access, intellectual property, and customer interactions with CRUSH CLOTHING.',
  },
  {
    id: 'policy-privacy',
    title: 'Privacy Policy',
    handle: 'privacy-policy',
    description: 'Our commitment to data sovereignty, cookie consent management, and protecting client privacy and payment information.',
  },
];

export async function loader({context}: Route.LoaderArgs) {
  try {
    const data: PoliciesQuery = await context.storefront.query(POLICIES_QUERY);
    const shopPolicies = data.shop;
    const policies: PolicyItemFragment[] = [
      shopPolicies?.privacyPolicy,
      shopPolicies?.shippingPolicy,
      shopPolicies?.termsOfService,
      shopPolicies?.refundPolicy,
      shopPolicies?.subscriptionPolicy,
    ].filter((policy): policy is PolicyItemFragment => policy != null);

    if (policies.length > 0) {
      return {
        policies: policies.map((p) => ({
          id: p.id,
          title: p.title,
          handle: p.handle,
          description: `Official store policy for ${p.title}.`,
        })),
      };
    }
  } catch (e) {
    console.error('Failed to query Shopify policies:', e);
  }

  return {policies: FALLBACK_POLICIES};
}

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();

  return (
    <div className="crush-policies-page bg-[var(--color-ivory)] text-[var(--color-ink)] min-h-[75vh] py-16 sm:py-24 border-b border-[var(--color-stone)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-[var(--color-stone)] pb-6 mb-12">
          <Link
            to="/"
            className="font-display text-xs tracking-widest uppercase text-[var(--color-ink)]/50 hover:text-[var(--color-ink)] no-underline mb-4 inline-block"
          >
            ← Return to Atelier
          </Link>
          <span className="font-display text-[10px] font-semibold tracking-[0.25em] text-[var(--color-ink)]/50 uppercase block mb-1">
            CRUSH CLOTHING
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-5xl tracking-[0.06em] uppercase text-[var(--color-ink)] m-0">
            Store Policies & Legal
          </h1>
          <p className="font-body text-sm sm:text-base text-[var(--color-ink)]/70 mt-3 max-w-2xl">
            Clear, transparent policies for the modern client. For custom atelier inquiries or concierge assistance, reach out directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {policies.map((policy) => (
            <Link
              key={policy.id}
              to={`/policies/${policy.handle}`}
              className="group block p-6 sm:p-8 bg-white border border-[var(--color-stone)] hover:border-[var(--color-ink)] transition-all duration-300 no-underline shadow-xs hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--color-ink)]/50">
                  Legal Document
                </span>
                <span className="font-display text-xs font-semibold uppercase text-[var(--color-ink)] group-hover:translate-x-1 transition-transform duration-200">
                  Read Policy →
                </span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-wider uppercase text-[var(--color-ink)] m-0 mb-3">
                {policy.title}
              </h2>
              <p className="font-body text-xs sm:text-sm text-[var(--color-ink)]/70 leading-relaxed m-0">
                {policy.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const POLICIES_QUERY = `#graphql
  fragment PolicyItem on ShopPolicy {
    id
    title
    handle
  }
  query Policies ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...PolicyItem
      }
      shippingPolicy {
        ...PolicyItem
      }
      termsOfService {
        ...PolicyItem
      }
      refundPolicy {
        ...PolicyItem
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
` as const;
