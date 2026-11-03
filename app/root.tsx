import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/root';
import favicon from '~/assets/favicon.svg';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';
import tailwindCss from './styles/tailwind.css?url';
import {PageLayout} from './components/PageLayout';

export type RootLoader = typeof loader;

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  const isDev = process.env.NODE_ENV !== 'production';
  const tailwindUrl = isDev ? `${tailwindCss}?direct` : tailwindCss;
  const resetUrl = isDev ? `${resetStyles}?direct` : resetStyles;
  const appUrl = isDev ? `${appStyles}?direct` : appStyles;

  return [
    {rel: 'stylesheet', href: tailwindUrl},
    {rel: 'stylesheet', href: resetUrl},
    {rel: 'stylesheet', href: appUrl},
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Space+Grotesk:wght@400;500;600;700&display=swap',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;

  return {
    ...deferredData,
    ...criticalData,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const {storefront} = context;

  const [header] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        headerMenuHandle: 'main-menu', // Adjust to your header menu handle
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {header};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const {storefront, customerAccount, cart} = context;

  // defer the footer query (below the fold)
  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        footerMenuHandle: 'footer', // Adjust to your footer menu handle
      },
    })
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });
  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer,
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();

  // In Vite dev mode, CSS urls without `?direct` are served with Content-Type: text/javascript
  // which causes browsers to reject the stylesheet until JS loads (causing FOUC).
  // Appending `?direct` forces Vite to serve raw CSS with Content-Type: text/css.
  const isDev = process.env.NODE_ENV !== 'production';
  const tailwindUrl = isDev ? `${tailwindCss}?direct` : tailwindCss;
  const resetUrl = isDev ? `${resetStyles}?direct` : resetStyles;
  const appUrl = isDev ? `${appStyles}?direct` : appStyles;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
        <link rel="preload" href={tailwindUrl} as="style" />
        <link rel="preload" href={appUrl} as="style" />
        <Meta />
        <Links />
        <style
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              /* ========================================================
                 CRITICAL ZERO-FOUC & ARCHITECTURAL GATING
                 Ensures no raw HTML, unstyled text, or unconstrained
                 SVGs can EVER flash before stylesheets are fully parsed.
                 ======================================================== */
              *, *::before, *::after {
                box-sizing: border-box;
              }
              html {
                background-color: #ffffff;
                color: #111827;
                margin: 0;
                padding: 0;
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                -webkit-font-smoothing: antialiased;
                -webkit-text-size-adjust: 100%;
              }
              /* Strictly gate body visibility until stylesheets are parsed */
              html:not(.crush-ready) body {
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
              }
              html.crush-ready body {
                visibility: visible !important;
                opacity: 1 !important;
                transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
              }
              body {
                background-color: #ffffff;
                color: #111827;
                margin: 0;
                padding: 0;
                overflow-x: hidden;
                width: 100%;
              }
              a {
                color: inherit !important;
                text-decoration: none !important;
              }
              ul, ol, menu {
                list-style: none !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              /* Strictly hide all unexpanded drawers and hidden utility classes on frame 1 */
              .hidden {
                display: none !important;
              }
              .overlay:not(.expanded) {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
              }
              .crush-mega-menu {
                display: none !important;
              }
              /* Strict containment for icons: SVGs can NEVER blow up beyond icon size */
              svg:not(.crush-svg-allow-large) {
                display: inline-block;
                vertical-align: middle;
                max-width: 24px !important;
                max-height: 24px !important;
                width: auto;
                height: auto;
              }
              header svg,
              button svg,
              nav svg,
              a svg {
                width: 1.125rem !important;
                height: 1.125rem !important;
                max-width: 20px !important;
                max-height: 20px !important;
              }
              svg circle, svg path, svg line {
                vector-effect: non-scaling-stroke;
              }
              /* Critical Navbar Baseline Layout */
              .crush-header-wrapper {
                background-color: #ffffff;
                border-bottom: 1px solid #f3f4f6;
                width: 100%;
              }
              .crush-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                max-width: 80rem;
                margin: 0 auto;
                padding: 0 0.75rem;
                height: 5rem;
              }
              .crush-brand-logo {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
              }
            `,
          }}
        />
        {/* Synchronous CSS-readiness observer: reveals page the millisecond stylesheets parse */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var docEl = document.documentElement;
                var revealed = false;
                function reveal() {
                  if (revealed) return;
                  revealed = true;
                  docEl.classList.add('crush-ready');
                }

                if (document.readyState === 'complete') {
                  reveal();
                  return;
                }

                var links = document.querySelectorAll('link[rel="stylesheet"]');
                var count = links.length;
                if (!count) {
                  reveal();
                  return;
                }

                var done = 0;
                function onSheetLoaded() {
                  done++;
                  if (done >= count) {
                    reveal();
                  }
                }

                for (var i = 0; i < links.length; i++) {
                  var link = links[i];
                  try {
                    if (link.sheet) {
                      onSheetLoaded();
                      continue;
                    }
                  } catch (e) {}
                  link.addEventListener('load', onSheetLoaded, {once: true});
                  link.addEventListener('error', onSheetLoaded, {once: true});
                }

                // High-frequency animation-frame poll for sheet readiness
                var rafCount = 0;
                function checkSheets() {
                  var allReady = true;
                  for (var j = 0; j < links.length; j++) {
                    try {
                      if (!links[j].sheet) {
                        allReady = false;
                        break;
                      }
                    } catch (e) {}
                  }
                  if (allReady) {
                    reveal();
                  } else if (rafCount++ < 60) {
                    requestAnimationFrame(checkSheets);
                  } else {
                    reveal();
                  }
                }
                requestAnimationFrame(checkSheets);

                // Watchdog fallback (1000ms max) guarantees page is never stuck
                setTimeout(reveal, 1000);
              })();
            `,
          }}
        />
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html: `
                html:not(.crush-ready) body,
                body {
                  visibility: visible !important;
                  opacity: 1 !important;
                }
              `,
            }}
          />
        </noscript>
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <PageLayout {...data}>
        <Outlet />
      </PageLayout>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="route-error">
      <h1>Oops</h1>
      <h2>{errorStatus}</h2>
      {errorMessage && (
        <fieldset>
          <pre>{errorMessage}</pre>
        </fieldset>
      )}
    </div>
  );
}
