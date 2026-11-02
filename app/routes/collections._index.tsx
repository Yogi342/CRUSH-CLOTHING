import {Link} from 'react-router';
import type {Route} from './+types/collections._index';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'CRUSH CLOTHING | Collections Directory'},
    {
      name: 'description',
      content:
        'Explore the seasonal collections of CRUSH CLOTHING: Tailored Outerwear, Evening Gowns, Tops & Shirting, and Minimalist Sets.',
    },
  ];
};

export async function loader(_args: Route.LoaderArgs) {
  return {};
}

export default function CollectionsIndex() {
  const categories = [
    {
      id: 'dresses',
      title: 'Dresses & Gowns',
      subtitle: 'Bias Silk • Column Silhouettes • Evening Drapery',
      image: '/images/model-full-2.jpg',
      url: '/collections/dresses',
    },
    {
      id: 'outerwear',
      title: 'Tailored Outerwear',
      subtitle: 'Sculpted Trenches • Cashmere Cocoons • Wool Suiting',
      image: '/images/model-full-1.jpg',
      url: '/collections/outerwear',
    },
    {
      id: 'tops',
      title: 'Tops & Shirting',
      subtitle: 'Extra-Long Poplin • Heavyweight Terries • Sculptural Knits',
      image: '/images/look-studio-1.jpg',
      url: '/collections/tops',
    },
    {
      id: 'sets',
      title: 'Minimalist Sets',
      subtitle: 'Coordinated Two-Piece Knitwear • Architectural Loungewear',
      image: '/images/model-look-5.jpg',
      url: '/collections/sets',
    },
  ];

  return (
    <div className="crush-collections-index bg-[var(--color-ivory)] text-[var(--color-ink)] min-h-screen">
      {/* Editorial Header */}
      <div className="border-b border-[var(--color-stone)] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="font-display text-[10px] font-semibold tracking-[0.3em] uppercase text-[var(--color-ink)]/50 block">
                Atelier Directory // SS 2026
              </span>
              <h1 className="font-display font-bold text-4xl sm:text-6xl lg:text-7xl tracking-[0.06em] uppercase text-[var(--color-ink)] m-0 leading-tight">
                Collections
              </h1>
              <p className="font-body text-base text-[var(--color-ink)]/75 max-w-xl leading-relaxed m-0">
                Explore our curated categories defined by structural precision, uncompromising drapery, and tactile confidence.
              </p>
            </div>

            <Link
              to="/collections/all"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-ink)] text-[var(--color-ivory)] font-display text-xs font-semibold tracking-widest uppercase hover:bg-transparent hover:text-[var(--color-ink)] border border-[var(--color-ink)] transition-all duration-300 no-underline"
            >
              View Complete Catalog →
            </Link>
          </div>
        </div>
      </div>

      {/* Category Discovery Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              to={cat.url}
              className="group block relative overflow-hidden bg-[var(--color-stone)] aspect-[16/10] border border-[var(--color-stone)] no-underline"
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-90 group-hover:brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)]/85 via-[var(--color-ink)]/30 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex flex-col justify-end">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-[10px] font-semibold tracking-[0.25em] text-[var(--color-ivory)]/70 uppercase">
                    Series 0{idx + 1}
                  </span>
                  <span className="font-display text-xs tracking-widest uppercase text-[var(--color-ivory)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Explore →
                  </span>
                </div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-wide uppercase text-[var(--color-ivory)] m-0 mb-1">
                  {cat.title}
                </h2>
                <p className="font-body text-xs sm:text-sm text-[var(--color-stone-light)] m-0 opacity-90">
                  {cat.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
