import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
  Link,
  useSearchParams,
} from 'react-router';
import type {Route} from './+types/account';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

export function shouldRevalidate() {
  return true;
}

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;

  try {
    const isLoggedIn = await customerAccount.isLoggedIn().catch(() => false);
    if (!isLoggedIn) {
      return remixData({customer: null});
    }

    const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
      variables: {
        language: customerAccount.i18n.language,
      },
    });

    if (errors?.length || !data?.customer) {
      return remixData({customer: null});
    }

    return remixData(
      {customer: data.customer},
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch {
    return remixData({customer: null});
  }
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const notice = searchParams.get('notice');

  if (!customer) {
    return (
      <div className="min-h-[70vh] bg-[var(--color-ivory)] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full text-center border border-[var(--color-stone)] bg-white/70 p-8 sm:p-10 shadow-xs">
          <p className="font-display text-[10px] sm:text-xs tracking-[0.25em] uppercase text-[var(--color-stone-light)] mb-3">
            Atelier Client Portal // SS 2026
          </p>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl tracking-wider uppercase text-[var(--color-ink)] mb-4">
            Sign In to CRUSH
          </h1>
          <p className="font-body text-xs sm:text-sm text-[var(--color-ink)]/70 mb-8 leading-relaxed">
            Access your curated orders, atelier appointments, and saved delivery preferences.
          </p>

          {notice === 'tunnel_needed' && (
            <div className="mb-6 p-4 bg-[var(--color-ivory)] border border-[var(--color-stone)] text-left">
              <p className="font-display text-xs font-semibold uppercase text-[var(--color-ink)] mb-1">
                Local Development Notice
              </p>
              <p className="font-body text-xs text-[var(--color-ink)]/80 leading-normal">
                Shopify Customer Account OAuth requires a secure tunnel in development. Run:
                <code className="block mt-1.5 p-1.5 bg-black/5 font-mono text-[11px] text-[var(--color-ink)] select-all">
                  npx shopify hydrogen dev --customer-account-push
                </code>
              </p>
            </div>
          )}

          <div className="space-y-3">
            <a
              href="/account/login"
              className="crush-btn crush-btn-primary w-full text-center block no-underline"
            >
              Sign In via Shopify →
            </a>
            <Link
              to="/collections/all"
              className="crush-btn crush-btn-secondary w-full text-center block no-underline"
            >
              Continue Exploring Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const heading = customer.firstName
    ? `Welcome, ${customer.firstName}`
    : 'Atelier Client Account';

  return (
    <div className="min-h-[70vh] bg-[var(--color-ivory)] py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="border-b border-[var(--color-stone)] pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-display text-[10px] tracking-[0.25em] uppercase text-[var(--color-stone-light)] mb-1">
            CRUSH Atelier Client
          </p>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl tracking-wide uppercase text-[var(--color-ink)] m-0">
            {heading}
          </h1>
        </div>
        <AccountMenu />
      </div>

      <div className="bg-white/60 border border-[var(--color-stone)] p-6 sm:p-8">
        <Outlet context={{customer}} />
      </div>
    </div>
  );
}

function AccountMenu() {
  function isActiveStyle({isActive}: {isActive: boolean}) {
    return {
      fontWeight: isActive ? 600 : 400,
      opacity: isActive ? 1 : 0.65,
    };
  }

  return (
    <nav className="flex items-center gap-4 text-xs font-display tracking-widest uppercase">
      <NavLink to="/account/orders" style={isActiveStyle} className="text-[var(--color-ink)] no-underline hover:opacity-100 transition-opacity">
        Orders
      </NavLink>
      <span className="text-[var(--color-stone)]">/</span>
      <NavLink to="/account/profile" style={isActiveStyle} className="text-[var(--color-ink)] no-underline hover:opacity-100 transition-opacity">
        Profile
      </NavLink>
      <span className="text-[var(--color-stone)]">/</span>
      <NavLink to="/account/addresses" style={isActiveStyle} className="text-[var(--color-ink)] no-underline hover:opacity-100 transition-opacity">
        Addresses
      </NavLink>
      <span className="text-[var(--color-stone)]">/</span>
      <Logout />
    </nav>
  );
}

function Logout() {
  return (
    <Form className="inline-block m-0 p-0" method="POST" action="/account/logout">
      <button
        type="submit"
        className="font-display text-xs tracking-widest uppercase text-[var(--color-ink)] opacity-65 hover:opacity-100 transition-opacity bg-transparent border-0 cursor-pointer p-0"
      >
        Sign out
      </button>
    </Form>
  );
}
