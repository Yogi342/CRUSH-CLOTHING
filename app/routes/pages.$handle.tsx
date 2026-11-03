import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/pages.$handle';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `CRUSH CLOTHING | ${data?.page.title ?? 'Atelier'}`},
    {
      name: 'description',
      content:
        'The House of CRUSH CLOTHING. Sculptural silhouettes, modern tailoring, and unapologetic presence designed for the contemporary woman.',
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  let page = null;
  try {
    const res = await context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    });
    page = res?.page;
  } catch {
    page = null;
  }

  if (!page) {
    // Graceful fallback for About and editorial pages
    if (params.handle === 'about') {
      page = {
        title: 'The House of CRUSH',
        body: `
          <div class="space-y-8 font-body text-base text-[var(--color-ink)]/80 leading-relaxed">
            <p class="font-display text-xl sm:text-2xl font-medium text-[var(--color-ink)] leading-snug">
              CRUSH CLOTHING was founded on a singular conviction: what a woman wears should speak before she enters a room, and linger long after she leaves.
            </p>
            <p>
              Born in New York and crafted across the United States, we design with uncompromising discipline. Our silhouettes reject disposable trends in favor of sculptural architecture, structural draping, and tangible confidence.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[var(--color-stone)]">
              <div>
                <h3 class="font-display text-xs font-semibold tracking-widest uppercase text-[var(--color-ink)] mb-2">Unapologetic Form</h3>
                <p class="text-xs text-[var(--color-ink)]/70">Sharp shoulders, bias-cut cascades, and calculated proportions that command presence without saying a word.</p>
              </div>
              <div>
                <h3 class="font-display text-xs font-semibold tracking-widest uppercase text-[var(--color-ink)] mb-2">Enduring Textiles</h3>
                <p class="text-xs text-[var(--color-ink)]/70">22-momme pure mulberry silks, double-faced cashmere, heavyweight organic twills, and custom-milled loopback terry.</p>
              </div>
              <div>
                <h3 class="font-display text-xs font-semibold tracking-widest uppercase text-[var(--color-ink)] mb-2">Disciplined Craft</h3>
                <p class="text-xs text-[var(--color-ink)]/70">Constructed in limited seasonal drops with blind seams, canvas chests, and bespoke finishing touches.</p>
              </div>
            </div>
          </div>
        `,
      };
    } else {
      const formattedTitle = params.handle
        .split('-')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      page = {
        title: formattedTitle,
        body: `<p class="font-body text-base text-[var(--color-ink)]/80 leading-relaxed">Information regarding ${formattedTitle} at CRUSH CLOTHING. For bespoke inquiries or personal styling consultations, please connect with our client care team.</p>`,
      };
    }
  } else {
    redirectIfHandleIsLocalized(request, {
      handle: params.handle,
      data: page as any,
    });
  }

  return {page};
}

function loadDeferredData({context: _context}: Route.LoaderArgs) {
  return {};
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();

  return (
    <div className="crush-page bg-[var(--color-ivory)] text-[var(--color-ink)] min-h-[75vh] py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <Link
          to="/"
          className="font-display text-xs tracking-widest uppercase text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] no-underline mb-8 inline-block"
        >
          ← Return to Atelier
        </Link>

        <header className="mb-12 pb-6 border-b border-[var(--color-stone)]">
          <span className="font-display text-[10px] font-semibold tracking-[0.3em] uppercase text-[var(--color-ink)]/50 block mb-2">
            CRUSH CLOTHING · Editorial Archive
          </span>
          <h1 className="font-display font-bold text-4xl sm:text-6xl tracking-[0.06em] uppercase text-[var(--color-ink)] m-0 leading-tight">
            {page.title}
          </h1>
        </header>

        <main
          className="prose prose-neutral max-w-none space-y-6"
          dangerouslySetInnerHTML={{__html: page.body}}
        />

        {/* Brand Contact Box */}
        <div className="mt-16 p-8 bg-[var(--color-stone-light)]/60 border border-[var(--color-stone)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-xs font-semibold tracking-widest uppercase text-[var(--color-ink)] mb-1">
              Client Care & Private Consultations
            </h3>
            <p className="font-body text-xs text-[var(--color-ink)]/70 m-0">
              Our New York atelier concierge is available Monday through Friday.
            </p>
          </div>
          <a
            href="mailto:concierge@crushclothing.com"
            className="px-6 py-3 bg-[var(--color-ink)] text-[var(--color-ivory)] font-display text-xs font-semibold tracking-widest uppercase no-underline hover:bg-neutral-800 hover:shadow-md active:scale-95 transition-all shrink-0"
          >
            Contact Atelier →
          </a>
        </div>
      </div>
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      id
      title
      handle
      body
      seo {
        description
        title
      }
    }
  }
` as const;
