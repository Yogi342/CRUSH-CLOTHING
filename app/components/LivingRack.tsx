import {useState, useEffect, useRef} from 'react';
import {Link} from 'react-router';

interface LookItem {
  id: string;
  number: string;
  title: string;
  price: string;
  emotion: string;
  garmentImg: string;
  modelImg: string;
  tag: string;
  handle: string;
}

const LOOKS: LookItem[] = [
  {
    id: 'look-1',
    number: '01',
    title: 'Sculpted Frill Tie Mini',
    price: '$31.99',
    emotion: 'A sculptural silhouette crafted from pure breathable cotton for commanding quiet presence.',
    garmentImg: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/06a7c83488f94c948aa93f313cbf19c2-Max-Origin.webp?v=1793609652',
    modelImg: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/4a5c9b52-89bf-4835-9201-11dd8247d95a-Max-Origin.webp?v=1793609651',
    tag: 'Drop 01 · Signature Mini Dress',
    handle: 'frill-tie-shoulder-mini-dress',
  },
  {
    id: 'look-2',
    number: '02',
    title: 'Atelier Seated Silhouette',
    price: '$31.99',
    emotion: 'Fluid folds sculpted to drape effortlessly with every subtle movement and posture.',
    garmentImg: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/8362fe37-bd92-4b75-8d98-bc7e0c69ffdb-Max-Origin.webp?v=1793609651',
    modelImg: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/b4ad1bb5-2d18-4927-aa44-24584285ee31-Max-Origin.webp?v=1793609651',
    tag: 'Drop 01 · Studio Drape',
    handle: 'frill-tie-shoulder-mini-dress',
  },
  {
    id: 'look-3',
    number: '03',
    title: 'Tie-Bow Shoulder Architecture',
    price: '$31.99',
    emotion: 'Hand-finished self-tie ribbons creating structural contrast against delicate cotton.',
    garmentImg: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/713a647f-a042-4b48-939e-259ee071a94a-Max-Origin.webp?v=1793609652',
    modelImg: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/0bba3306-63ad-4175-bdb6-27554f82b875-Max-Origin.webp?v=1793609652',
    tag: 'Drop 01 · Atelier Craft',
    handle: 'frill-tie-shoulder-mini-dress',
  },
  {
    id: 'look-4',
    number: '04',
    title: 'Kinetic Runway Movement',
    price: '$31.99',
    emotion: 'Weightless natural cotton engineered to float with rhythm and effortless authority.',
    garmentImg: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/4a5c9b52-89bf-4835-9201-11dd8247d95a-Max-Origin.webp?v=1793609651',
    modelImg: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/245b7f1e-28db-4c81-8b01-52504930113f-Max-Origin.webp?v=1793609651',
    tag: 'Drop 01 · Editorial Motion',
    handle: 'frill-tie-shoulder-mini-dress',
  },
  {
    id: 'look-5',
    number: '05',
    title: 'Pure Atelier Tailoring',
    price: '$31.99',
    emotion: 'Clean French-bound seams and bespoke proportions that define modern luxury.',
    garmentImg: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/cd2c7eadd05d4fddb476ea02bce75cd4-Max-Origin.webp?v=1793609652',
    modelImg: 'https://cdn.shopify.com/s/files/1/0844/4359/4861/files/06a7c83488f94c948aa93f313cbf19c2-Max-Origin.webp?v=1793609652',
    tag: 'Drop 01 · Form & Silhouette',
    handle: 'frill-tie-shoulder-mini-dress',
  },
];

export function LivingRack() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const activeLook = LOOKS[activeIndex];
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const DURATION_PER_LOOK = 4200; // ms

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setProgress(0);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const delta = currentTime - lastTimeRef.current;
      const currentPct = Math.min(100, (delta / DURATION_PER_LOOK) * 100);
      setProgress(currentPct);

      if (delta >= DURATION_PER_LOOK) {
        lastTimeRef.current = currentTime;
        setProgress(0);
        setActiveIndex((prev) => (prev + 1) % LOOKS.length);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, activeIndex]);

  const selectLook = (index: number) => {
    setActiveIndex(index);
    setProgress(0);
    lastTimeRef.current = performance.now();
  };

  return (
    <section
      className="crush-living-rack py-16 sm:py-24 border-b border-[var(--color-stone)] bg-[var(--color-ivory)] overflow-hidden"
      aria-label="Interactive Living Rack Runway"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Runway Top Bar with Story Progress Bars */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
            <div>
              <p className="font-display text-[11px] font-semibold tracking-[0.25em] text-[var(--color-ink)]/60 uppercase m-0 mb-1">
                Kinetic Atelier Runway · SS 2026
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-4xl tracking-[0.08em] uppercase text-[var(--color-ink)] m-0">
                The Living Rack
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--color-stone-dark)] bg-white/70 text-[var(--color-ink)] font-display text-[11px] tracking-widest uppercase hover:bg-[var(--color-ink)] hover:text-[var(--color-ivory)] hover:border-[var(--color-ink)] transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
                aria-label={isPlaying ? 'Pause Runway' : 'Auto Play Runway'}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPlaying ? 'bg-green-600 animate-pulse' : 'bg-[var(--color-stone-dark)]'
                  }`}
                />
                {isPlaying ? 'Runway Active' : 'Runway Paused'}
              </button>

              <div className="flex items-center gap-1 font-display text-xs font-semibold tracking-widest text-[var(--color-ink)] bg-[var(--color-stone-light)] px-3 py-1.5 border border-[var(--color-stone)]">
                <span>LOOK {activeLook.number}</span>
                <span className="text-[var(--color-stone-dark)]">/</span>
                <span className="text-[var(--color-stone-dark)]">05</span>
              </div>
            </div>
          </div>

          {/* Runway 5-segment Story Bar */}
          <div className="grid grid-cols-5 gap-2 w-full pt-2" role="tablist" aria-label="Runway looks">
            {LOOKS.map((look, i) => {
              const isPast = i < activeIndex;
              const isCurrent = i === activeIndex;
              return (
                <button
                  key={look.id}
                  type="button"
                  onClick={() => selectLook(i)}
                  className="h-1.5 w-full bg-[var(--color-stone)] rounded-none relative overflow-hidden cursor-pointer hover:h-2 transition-all duration-200 focus:outline-none"
                  aria-label={`Jump to Look ${look.number}: ${look.title}`}
                >
                  <div
                    className={`absolute inset-y-0 left-0 bg-[var(--color-ink)] transition-all ${
                      isPast
                        ? 'w-full duration-0'
                        : isCurrent
                        ? 'duration-75'
                        : 'w-0 duration-0'
                    }`}
                    style={{
                      width: isCurrent ? `${progress}%` : isPast ? '100%' : '0%',
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Stage: Split Screen Experience */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Realistic Physical Kinetic Clothing Rack */}
          <div className="lg:col-span-6 order-2 lg:order-1 space-y-6">
            {/* The Architectural Metal Hanging Rail */}
            <div className="relative pt-4 pb-2">
              <div className="flex items-center justify-between text-[10px] font-display tracking-[0.25em] uppercase text-[var(--color-ink)]/50 mb-3">
                <span>Brushed Atelier Rail</span>
                <span>Touch Garment to Wear</span>
              </div>

              {/* Steel Rail Tube */}
              <div className="relative h-[6px] w-full bg-gradient-to-r from-neutral-400 via-neutral-100 to-neutral-400 border border-neutral-400/60 shadow-sm flex items-center">
                {/* Brass End Caps */}
                <div className="absolute -left-1 w-2.5 h-4 bg-neutral-700 border border-neutral-900 rounded-none" />
                <div className="absolute -right-1 w-2.5 h-4 bg-neutral-700 border border-neutral-900 rounded-none" />

                {/* Kinetic Laser Tracker */}
                <div
                  className="absolute h-[10px] w-8 -top-[2px] bg-[var(--color-ink)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm"
                  style={{
                    left: `calc(${(activeIndex / (LOOKS.length - 1)) * 100}% - ${(activeIndex / (LOOKS.length - 1)) * 32}px)`,
                  }}
                />
              </div>
            </div>

            {/* Mobile Kinetic Rack Selector: Compact horizontal swipe tray */}
            <div className="lg:hidden flex gap-3 overflow-x-auto py-2 scrollbar-none snap-x snap-mandatory" role="tablist" aria-label="Mobile clothing rack garments">
              {LOOKS.map((look, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={look.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => selectLook(index)}
                    className={`snap-center shrink-0 w-44 p-3 rounded-2xl border text-left transition-all cursor-pointer bg-white ${
                      isActive
                        ? 'border-neutral-900 shadow-md ring-2 ring-black/5'
                        : 'border-neutral-200/80 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-12 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200/60">
                        <img src={look.garmentImg} alt={look.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-display text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">
                          LOOK {look.number}
                        </span>
                        <h4 className="font-display text-xs font-bold text-neutral-900 truncate m-0">
                          {look.title}
                        </h4>
                        <span className="font-display text-xs font-semibold text-neutral-900 block mt-0.5">
                          {look.price}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Desktop Suspended Garment Cards on Atelier Hangers */}
            <div className="hidden lg:block space-y-2.5" role="tablist" aria-label="Clothing rack garments">
              {LOOKS.map((look, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={look.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => selectLook(index)}
                    className={`w-full flex items-center justify-between p-3.5 border text-left transition-all duration-300 cursor-pointer relative group ${
                      isActive
                        ? 'border-[var(--color-ink)] bg-white shadow-md translate-x-2'
                        : 'border-[var(--color-stone)] bg-transparent hover:border-[var(--color-ink)] hover:bg-white/60'
                    }`}
                  >
                    {/* Visual Hanger Hook suspended from rail */}
                    <div
                      className={`absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-8 transition-colors duration-200 ${
                        isActive ? 'bg-[var(--color-ink)]' : 'bg-transparent group-hover:bg-[var(--color-stone-dark)]'
                      }`}
                    />

                    <div className="flex items-center gap-4">
                      {/* Garment Image Tile */}
                      <div className="w-14 h-16 bg-[var(--color-stone-light)] shrink-0 overflow-hidden border border-[var(--color-stone)] relative">
                        <img
                          src={look.garmentImg}
                          alt={look.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        {isActive && (
                          <div className="absolute inset-0 border-2 border-[var(--color-ink)] pointer-events-none" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display text-[9px] font-semibold tracking-[0.2em] uppercase px-1.5 py-0.5 bg-[var(--color-stone-light)] text-[var(--color-ink)]">
                            LOOK {look.number}
                          </span>
                          <span className="font-display text-[10px] tracking-wider uppercase text-[var(--color-ink)]/50">
                            {look.tag.split('·')[1]?.trim() || 'Atelier'}
                          </span>
                        </div>
                        <h3 className="font-display text-sm font-bold tracking-wider uppercase text-[var(--color-ink)] m-0">
                          {look.title}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-display text-sm font-bold text-[var(--color-ink)] block">
                        {look.price}
                      </span>
                      <span
                        className={`font-display text-[9px] tracking-widest uppercase transition-colors duration-200 ${
                          isActive
                            ? 'text-green-700 font-semibold'
                            : 'text-[var(--color-ink)]/40 group-hover:text-[var(--color-ink)]'
                        }`}
                      >
                        {isActive ? '● Worn on Runway' : 'Try On →'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Emotional Mood Line & Bulletproof CTA Buttons */}
            <div className="pt-4 border-t border-[var(--color-stone)] space-y-4">
              <p className="font-display text-xs tracking-wider uppercase text-[var(--color-ink)]/70 italic m-0">
                &ldquo;{activeLook.emotion}&rdquo;
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  to={`/products/${activeLook.handle}`}
                  className="crush-btn crush-btn-primary flex-1 text-center"
                >
                  Explore Look {activeLook.number} in Catalog →
                </Link>
                <Link
                  to="/collections/all"
                  className="crush-btn crush-btn-secondary text-center"
                >
                  All Looks
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Full-Bleed Runway Canvas with Smooth Motion */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--color-stone-light)] border border-[var(--color-stone)] shadow-xl">
              {/* Models with Smooth Crossfade & Scale Reveal */}
              {LOOKS.map((look, index) => {
                const isActive = index === activeIndex;
                return (
                  <div
                    key={look.id}
                    className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isActive
                        ? 'opacity-100 scale-100 z-10'
                        : 'opacity-0 scale-105 z-0 pointer-events-none'
                    }`}
                  >
                    <img
                      src={look.modelImg}
                      alt={`Model wearing ${look.title}`}
                      className="w-full h-full object-cover object-top"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)]/60 via-transparent to-transparent" />
                  </div>
                );
              })}

              {/* Floating Top Editorial Badge */}
              <div className="absolute top-4 left-4 z-20 bg-[var(--color-ivory)]/95 backdrop-blur-xs px-4 py-1.5 rounded-full border border-[var(--color-stone)] shadow-xs">
                <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--color-ink)]">
                  Live Try-On · {activeLook.title}
                </span>
              </div>

              {/* Bottom Runway Card Info */}
              <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between text-[var(--color-ivory)]">
                <div>
                  <span className="font-display text-[10px] tracking-[0.25em] uppercase text-[var(--color-stone)] block mb-1">
                    Spring / Summer 2026 · Look {activeLook.number}
                  </span>
                  <h4 className="font-display text-lg font-bold tracking-wider uppercase m-0 text-white">
                    {activeLook.title}
                  </h4>
                </div>

                {/* Arrow Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      selectLook((activeIndex - 1 + LOOKS.length) % LOOKS.length)
                    }
                    aria-label="Previous look"
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[var(--color-ivory)] text-[var(--color-ink)] border border-[var(--color-stone)] flex items-center justify-center font-display text-base hover:bg-[var(--color-ink)] hover:text-[var(--color-ivory)] transition-colors duration-200 active:scale-95 cursor-pointer shadow-md"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => selectLook((activeIndex + 1) % LOOKS.length)}
                    aria-label="Next look"
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[var(--color-ivory)] text-[var(--color-ink)] border border-[var(--color-stone)] flex items-center justify-center font-display text-base hover:bg-[var(--color-ink)] hover:text-[var(--color-ivory)] transition-colors duration-200 active:scale-95 cursor-pointer shadow-md"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
