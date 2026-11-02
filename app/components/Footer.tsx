import {useState, useEffect, type FormEvent} from 'react';
import {NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer({
  footer: _footerPromise,
  header: _header,
  publicStoreDomain: _publicStoreDomain,
}: FooterProps) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [studioTime, setStudioTime] = useState('');

  // Live Atelier Time Indicator (US Eastern Time)
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        setStudioTime(timeStr);
      } catch {
        setStudioTime('12:00:00 PM EST');
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!consent) {
      setStatus('error');
      setErrorMessage('Please consent to receiving brand communications.');
      return;
    }

    setStatus('success');
    setErrorMessage('');
    setEmail('');
  };

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  return (
    <footer
      className="crush-footer bg-[var(--color-ink)] text-[var(--color-ivory)] border-t border-[var(--color-ink)] mt-24 relative overflow-hidden"
      role="contentinfo"
      aria-label="Site Footer"
    >
      {/* 1. Atelier Top Status Bar with Live Clock & Back-to-Top */}
      <div className="border-b border-[var(--color-ivory)]/15 py-4 bg-[var(--color-ink)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <p className="font-display text-[10px] sm:text-xs tracking-[0.2em] uppercase text-[var(--color-stone)] m-0">
              NYC Atelier · {studioTime ? `${studioTime} EST` : 'Live Online'} • Global Concierge
            </p>
          </div>

          <div className="flex items-center gap-6">
            <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-stone-dark)]">
              Currency: USD ($)
            </span>
            <button
              type="button"
              onClick={scrollToTop}
              className="group inline-flex items-center gap-1.5 font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-ivory)] hover:text-[var(--color-stone)] transition-colors cursor-pointer border-none bg-transparent p-0"
              aria-label="Back to top of page"
            >
              <span>Back to Top</span>
              <span className="inline-block transform transition-transform duration-300 group-hover:-translate-y-1">
                ↑
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Massive Architectural Brand Masthead */}
      <div className="border-b border-[var(--color-ivory)]/15 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <span className="font-display text-[11px] font-semibold tracking-[0.35em] text-[var(--color-stone)] uppercase block mb-2">
                Haute Contemporaine · United States
              </span>
              <h2 className="font-display font-bold text-5xl sm:text-7xl lg:text-9xl tracking-[0.14em] uppercase text-[var(--color-ivory)] m-0 leading-none select-none">
                CRUSH
              </h2>
            </div>
            <div className="max-w-md lg:text-right">
              <p className="font-body text-sm sm:text-base text-[var(--color-stone-light)] leading-relaxed m-0">
                Sculptural silhouettes and uncompromised tailoring for the woman who moves through the world with intent.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main 4-Column Directory Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Column 1: Collections */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-display text-xs font-semibold tracking-[0.25em] uppercase text-[var(--color-stone)] m-0 pb-2 border-b border-[var(--color-ivory)]/10">
              Collections
            </h3>
            <ul className="list-none p-0 m-0 space-y-3">
              {[
                {label: 'New Arrivals · SS 2026', url: '/collections/all'},
                {label: 'Dresses & Gowns', url: '/collections/dresses'},
                {label: 'Tops & Shirting', url: '/collections/tops'},
                {label: 'Tailored Outerwear', url: '/collections/outerwear'},
                {label: 'Minimalist Sets', url: '/collections/all'},
                {label: 'Complete Archive', url: '/collections/all'},
              ].map((item) => (
                <li key={item.label}>
                  <NavLink
                    to={item.url}
                    className="group inline-flex items-center gap-2 font-body text-sm text-[var(--color-ivory)]/80 hover:text-[var(--color-ivory)] transition-colors no-underline"
                  >
                    <span className="text-[10px] text-[var(--color-stone-dark)] group-hover:text-[var(--color-ivory)] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                      →
                    </span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      {item.label}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Client Care */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-display text-xs font-semibold tracking-[0.25em] uppercase text-[var(--color-stone)] m-0 pb-2 border-b border-[var(--color-ivory)]/10">
              Client Care
            </h3>
            <ul className="list-none p-0 m-0 space-y-3">
              {[
                {label: 'Complimentary Shipping Over $150', url: '/policies/shipping-policy'},
                {label: '30-Day Returns & Exchanges', url: '/policies/refund-policy'},
                {label: 'Atelier Sizing Consultation', url: '/collections/all'},
                {label: 'Terms & Conditions', url: '/policies/terms-of-service'},
                {label: 'Privacy Policy', url: '/policies/privacy-policy'},
              ].map((item) => (
                <li key={item.label}>
                  <NavLink
                    to={item.url}
                    className="group inline-flex items-center gap-2 font-body text-sm text-[var(--color-ivory)]/80 hover:text-[var(--color-ivory)] transition-colors no-underline"
                  >
                    <span className="text-[10px] text-[var(--color-stone-dark)] group-hover:text-[var(--color-ivory)] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                      →
                    </span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      {item.label}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Atelier Identity */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-display text-xs font-semibold tracking-[0.25em] uppercase text-[var(--color-stone)] m-0 pb-2 border-b border-[var(--color-ivory)]/10">
              The House
            </h3>
            <p className="font-body text-xs text-[var(--color-ivory)]/75 leading-relaxed m-0">
              Every garment is developed through rigorous pattern making, premium European and domestic textiles, and sculpted proportions.
            </p>
            <div className="pt-2 space-y-1">
              <span className="font-display text-[10px] tracking-widest uppercase text-[var(--color-stone-dark)] block">
                Direct Atelier Inquiries:
              </span>
              <a
                href="mailto:atelier@crushclothing.com"
                className="font-body text-xs text-[var(--color-ivory)] hover:text-[var(--color-stone)] underline underline-offset-4 transition-colors"
              >
                atelier@crushclothing.com
              </a>
            </div>
          </div>

          {/* Column 4: Newsletter / Inner Circle */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-display text-xs font-semibold tracking-[0.25em] uppercase text-[var(--color-stone)] m-0 pb-2 border-b border-[var(--color-ivory)]/10">
              The Inner Circle
            </h3>
            <p className="font-body text-xs text-[var(--color-ivory)]/80 leading-relaxed m-0">
              Receive private drop notifications, seasonal lookbooks, and invitation-only previews directly to your inbox.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-4 pt-2" noValidate>
              <div className="flex items-center border border-[var(--color-ivory)]/30 focus-within:border-[var(--color-ivory)] transition-colors p-1 bg-[var(--color-ivory)]/5">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="bg-transparent text-[var(--color-ivory)] placeholder:text-[var(--color-ivory)]/40 font-body text-xs sm:text-sm w-full outline-none px-3 py-2 border-none"
                />
                <button
                  type="submit"
                  className="crush-btn crush-btn-light-primary px-5 py-2.5 shrink-0"
                >
                  Join
                </button>
              </div>

              <div className="flex items-start gap-2.5">
                <input
                  id="newsletter-consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-[var(--color-ivory)] cursor-pointer"
                />
                <label
                  htmlFor="newsletter-consent"
                  className="font-body text-[11px] text-[var(--color-ivory)]/65 leading-tight cursor-pointer"
                >
                  I consent to receive seasonal CRUSH announcements and agree to the Terms & Privacy Policy.
                </label>
              </div>

              {status === 'error' && (
                <p role="alert" className="text-xs text-[#E8736B] m-0 font-body">
                  {errorMessage}
                </p>
              )}

              {status === 'success' && (
                <div role="status" className="p-3 bg-[var(--color-ivory)]/10 border border-[var(--color-stone)]/30 text-xs text-[var(--color-stone)] m-0 font-body">
                  ✓ Welcome to the CRUSH Inner Circle. (Demo mode: Storefront subscription noted)
                </div>
              )}
            </form>
          </div>
        </div>

        {/* 4. Payment Badges & Trust Symbols */}
        <div className="border-t border-[var(--color-ivory)]/15 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-[var(--color-stone-dark)]">
            <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-stone-dark)]">
              Secure Checkout Methods:
            </span>
            <div className="flex items-center gap-2">
              {['VISA', 'MASTERCARD', 'AMEX', 'APPLE PAY', 'SHOP PAY'].map((method) => (
                <span
                  key={method}
                  className="px-2 py-0.5 border border-[var(--color-ivory)]/15 text-[9px] font-display tracking-widest uppercase text-[var(--color-ivory)]/60 bg-[var(--color-ivory)]/5"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

          <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[var(--color-stone-dark)] m-0">
            Designed for the Unapologetic Silhouette
          </p>
        </div>

        {/* 5. Bottom Copyright & Compliance */}
        <div className="border-t border-[var(--color-ivory)]/10 mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="font-body text-xs text-[var(--color-ivory)]/50 m-0">
            © {new Date().getFullYear()} CRUSH CLOTHING LLC. All rights reserved. Registered US Trademark.
          </p>
          <div className="flex items-center gap-6">
            <NavLink
              to="/policies/privacy-policy"
              className="font-body text-xs text-[var(--color-ivory)]/50 hover:text-[var(--color-ivory)] transition-colors no-underline"
            >
              Privacy Policy
            </NavLink>
            <NavLink
              to="/policies/terms-of-service"
              className="font-body text-xs text-[var(--color-ivory)]/50 hover:text-[var(--color-ivory)] transition-colors no-underline"
            >
              Terms of Service
            </NavLink>
            <NavLink
              to="/policies/refund-policy"
              className="font-body text-xs text-[var(--color-ivory)]/50 hover:text-[var(--color-ivory)] transition-colors no-underline"
            >
              Refund Policy
            </NavLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
