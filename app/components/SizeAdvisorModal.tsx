import {useState, useMemo} from 'react';
import {Money} from '@shopify/hydrogen';

interface SizeAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  availableSizes: string[];
  currentSize: string;
  onSelectSize: (size: string) => void;
  onAddToCart?: (size: string) => void;
}

export function SizeAdvisorModal({
  isOpen,
  onClose,
  product,
  availableSizes,
  currentSize,
  onSelectSize,
  onAddToCart,
}: SizeAdvisorModalProps) {
  // Navigation tabs: 'advisor' | 'chart'
  const [activeTab, setActiveTab] = useState<'advisor' | 'chart'>('advisor');

  // Multi-step Advisor state: 1 = Measurements, 2 = Body Shape, 3 = Fit Preference, 4 = Recommendation
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Measurement units: height in cm or ft/in, weight in kg or lb
  const [heightUnit, setHeightUnit] = useState<'ft' | 'cm'>('ft');
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');

  // Raw values stored in metric for easy conversion
  const [heightCm, setHeightCm] = useState(165); // ~ 5'5"
  const [weightKg, setWeightKg] = useState(58); // ~ 128 lb

  // Body shape selections (Narrower / Average / Fuller)
  const [bustShape, setBustShape] = useState<'narrower' | 'average' | 'fuller'>('average');
  const [waistShape, setWaistShape] = useState<'narrower' | 'average' | 'fuller'>('average');
  const [hipsShape, setHipsShape] = useState<'narrower' | 'average' | 'fuller'>('average');

  // Fit preference (close / as-cut / relaxed)
  const [fitPreference, setFitPreference] = useState<'close' | 'as-cut' | 'relaxed'>('as-cut');

  // Helper conversions
  const feetInches = useMemo(() => {
    const totalInches = Math.round(heightCm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
  }, [heightCm]);

  const weightLb = useMemo(() => {
    return Math.round(weightKg * 2.20462);
  }, [weightKg]);

  // Stepper handlers
  const adjustHeight = (deltaCm: number) => {
    setHeightCm((prev) => Math.max(140, Math.min(200, prev + deltaCm)));
  };

  const adjustWeight = (deltaKg: number) => {
    setWeightKg((prev) => Math.max(38, Math.min(120, prev + deltaKg)));
  };

  // Sizing calculation tailored to CRUSH atelier criteria & Frill Tie Mini Dress measurements:
  // S: Bust 33.9", Waist 33.5", Length 31.5" (approx 45-55kg, 150-165cm)
  // M: Bust 35.4", Waist 35.0", Length 31.9" (approx 55-65kg, 158-172cm)
  // L: Bust 37.0", Waist 36.6", Length 32.3" (approx 65-78kg, 162-180cm)
  const calculatedRecommendation = useMemo(() => {
    // Base score calculation from height and weight
    let score = 2.0; // Default to M

    if (weightKg < 53) {
      score = 1.0; // Leans S
    } else if (weightKg <= 63) {
      score = 2.0; // Leans M
    } else {
      score = 3.0; // Leans L
    }

    // Height modifier: taller with lower weight stays leaner
    if (heightCm >= 170 && weightKg < 58) {
      score -= 0.3;
    } else if (heightCm < 158 && weightKg > 56) {
      score += 0.3;
    }

    // Body shape modifiers (dress is woven 100% cotton without stretch through torso)
    if (bustShape === 'fuller') score += 0.45;
    if (bustShape === 'narrower') score -= 0.35;

    if (waistShape === 'fuller') score += 0.45;
    if (waistShape === 'narrower') score -= 0.35;

    if (hipsShape === 'fuller') score += 0.25; // A-line skirt is naturally forgiving
    if (hipsShape === 'narrower') score -= 0.2;

    // Fit preference modifier
    if (fitPreference === 'relaxed') score += 0.6;
    if (fitPreference === 'close') score -= 0.5;

    // Map score to available sizes (S, M, L)
    const validSizes = availableSizes?.length ? availableSizes : ['S', 'M', 'L'];
    if (score <= 1.45 && validSizes.includes('S')) {
      return 'S';
    }
    if (score >= 2.5 && validSizes.includes('L')) {
      return 'L';
    }
    return validSizes.includes('M') ? 'M' : validSizes[0] || 'S';
  }, [heightCm, weightKg, bustShape, waistShape, hipsShape, fitPreference, availableSizes]);

  // Live estimate for Step 1
  const liveEstimate = useMemo(() => {
    if (weightKg < 54) return 'S';
    if (weightKg > 64) return 'L';
    return 'M';
  }, [weightKg]);

  if (!isOpen) return null;

  const productPrice = product?.priceRange?.minVariantPrice ||
    product?.selectedOrFirstAvailableVariant?.price || {
      amount: '31.99',
      currencyCode: 'USD',
    };
  const productImg =
    product?.images?.nodes?.[0]?.url || product?.featuredImage?.url;

  const handleApplySize = (size: string, alsoAddToCart: boolean = false) => {
    onSelectSize(size);
    if (alsoAddToCart && onAddToCart) {
      onAddToCart(size);
    }
    onClose();
  };

  const resetAdvisor = () => {
    setStep(1);
    setBustShape('average');
    setWaistShape('average');
    setHipsShape('average');
    setFitPreference('as-cut');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-advisor-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[var(--color-ink)]/75 backdrop-blur-xs animate-fadeIn"
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-transparent border-0 cursor-default"
        aria-label="Close size advisor"
      />

      <div className="relative w-full max-w-md bg-[var(--color-ivory)] border border-[var(--color-stone)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-stone)] bg-white/60">
          <div className="flex items-center gap-3">
            <span
              id="size-advisor-title"
              className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--color-ink)]"
            >
              Size Advisor
            </span>
            <span className="text-[var(--color-stone-dark)]">•</span>
            <span className="font-display text-[10px] tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
              Atelier Fit
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] hover:bg-[var(--color-stone-light)] transition-colors cursor-pointer text-sm font-bold"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Mini Product Card Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--color-stone)] bg-white">
          {productImg && (
            <div className="w-10 h-12 bg-[var(--color-stone-light)] shrink-0 overflow-hidden border border-[var(--color-stone)]">
              <img
                src={productImg}
                alt={product?.title || 'Product'}
                className="w-full h-full object-cover object-top"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xs font-bold tracking-wider uppercase text-[var(--color-ink)] truncate m-0">
              {product?.title || 'Frill Tie Shoulder Mini Dress'}
            </h3>
            <p className="font-body text-xs font-semibold text-[var(--color-ink)]/80 m-0">
              <Money data={productPrice} />
            </p>
          </div>

          {/* Mode Switcher: Advisor vs Measurement Chart */}
          <div className="flex border border-[var(--color-stone)] bg-[var(--color-ivory)] p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('advisor')}
              className={`px-2.5 py-1 text-[10px] font-display uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'advisor'
                  ? 'bg-[var(--color-ink)] text-[var(--color-ivory)] font-bold'
                  : 'text-[var(--color-ink)]/60 hover:text-[var(--color-ink)]'
              }`}
            >
              Fit
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chart')}
              className={`px-2.5 py-1 text-[10px] font-display uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'chart'
                  ? 'bg-[var(--color-ink)] text-[var(--color-ivory)] font-bold'
                  : 'text-[var(--color-ink)]/60 hover:text-[var(--color-ink)]'
              }`}
            >
              Chart
            </button>
          </div>
        </div>

        {/* TAB 1: SMART SIZE ADVISOR (4 Steps) */}
        {activeTab === 'advisor' && (
          <div className="overflow-y-auto p-5 sm:p-6 flex-1 flex flex-col justify-between">
            {/* 3-Segment Progress Bar (Steps 1-3) */}
            {step < 4 && (
              <div className="mb-6 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-widest text-[var(--color-ink)]/60">
                  <span>
                    Step {step} of 3 ·{' '}
                    {step === 1
                      ? 'Measurements'
                      : step === 2
                      ? 'Body Shape'
                      : 'Fit Preference'}
                  </span>
                  <span className="text-[10px] bg-[var(--color-ink)] text-[var(--color-ivory)] px-2 py-0.5 font-bold">
                    Smart Fit
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full bg-[var(--color-stone)]/40 overflow-hidden">
                  <div
                    className={`h-full transition-colors ${
                      step >= 1 ? 'bg-[var(--color-ink)]' : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-full transition-colors ${
                      step >= 2 ? 'bg-[var(--color-ink)]' : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-full transition-colors ${
                      step >= 3 ? 'bg-[var(--color-ink)]' : 'bg-transparent'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* =========================================
                STEP 1: MEASUREMENTS (Height & Weight)
               ========================================= */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-2xl tracking-[0.04em] uppercase text-[var(--color-ink)] m-0">
                    Let&apos;s find your fit
                  </h2>
                  <p className="font-body text-xs text-[var(--color-ink)]/60 mt-1 m-0">
                    Two simple measurements, about ten seconds.
                  </p>
                </div>

                {/* Height Input */}
                <div className="space-y-2 p-4 bg-white border border-[var(--color-stone)]">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[11px] font-bold tracking-widest uppercase text-[var(--color-ink)]/70">
                      Height
                    </span>
                    <div className="flex border border-[var(--color-stone)] text-[10px] font-display uppercase bg-[var(--color-ivory)]">
                      <button
                        type="button"
                        onClick={() => setHeightUnit('ft')}
                        className={`px-2 py-0.5 cursor-pointer ${
                          heightUnit === 'ft'
                            ? 'bg-[var(--color-ink)] text-[var(--color-ivory)] font-bold'
                            : 'text-[var(--color-ink)]/60'
                        }`}
                      >
                        FT/IN
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeightUnit('cm')}
                        className={`px-2 py-0.5 cursor-pointer ${
                          heightUnit === 'cm'
                            ? 'bg-[var(--color-ink)] text-[var(--color-ivory)] font-bold'
                            : 'text-[var(--color-ink)]/60'
                        }`}
                      >
                        CM
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="font-display text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                      {heightUnit === 'ft' ? feetInches : `${heightCm} cm`}
                    </span>
                  </div>

                  {/* Stepper & Slider */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => adjustHeight(-2.54)}
                      className="w-9 h-9 flex items-center justify-center border border-[var(--color-stone)] hover:border-[var(--color-ink)] text-base font-bold bg-[var(--color-ivory)] cursor-pointer"
                      aria-label="Decrease height"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min="145"
                      max="195"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="flex-1 accent-[var(--color-ink)] cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => adjustHeight(2.54)}
                      className="w-9 h-9 flex items-center justify-center border border-[var(--color-stone)] hover:border-[var(--color-ink)] text-base font-bold bg-[var(--color-ivory)] cursor-pointer"
                      aria-label="Increase height"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Weight Input */}
                <div className="space-y-2 p-4 bg-white border border-[var(--color-stone)]">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[11px] font-bold tracking-widest uppercase text-[var(--color-ink)]/70">
                      Weight
                    </span>
                    <div className="flex border border-[var(--color-stone)] text-[10px] font-display uppercase bg-[var(--color-ivory)]">
                      <button
                        type="button"
                        onClick={() => setWeightUnit('lb')}
                        className={`px-2 py-0.5 cursor-pointer ${
                          weightUnit === 'lb'
                            ? 'bg-[var(--color-ink)] text-[var(--color-ivory)] font-bold'
                            : 'text-[var(--color-ink)]/60'
                        }`}
                      >
                        LB
                      </button>
                      <button
                        type="button"
                        onClick={() => setWeightUnit('kg')}
                        className={`px-2 py-0.5 cursor-pointer ${
                          weightUnit === 'kg'
                            ? 'bg-[var(--color-ink)] text-[var(--color-ivory)] font-bold'
                            : 'text-[var(--color-ink)]/60'
                        }`}
                      >
                        KG
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="font-display text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                      {weightUnit === 'lb' ? `${weightLb} lb` : `${weightKg} kg`}
                    </span>
                  </div>

                  {/* Stepper & Slider */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => adjustWeight(-1)}
                      className="w-9 h-9 flex items-center justify-center border border-[var(--color-stone)] hover:border-[var(--color-ink)] text-base font-bold bg-[var(--color-ivory)] cursor-pointer"
                      aria-label="Decrease weight"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min="42"
                      max="105"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="flex-1 accent-[var(--color-ink)] cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => adjustWeight(1)}
                      className="w-9 h-9 flex items-center justify-center border border-[var(--color-stone)] hover:border-[var(--color-ink)] text-base font-bold bg-[var(--color-ivory)] cursor-pointer"
                      aria-label="Increase weight"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Live Estimate Badge */}
                <div className="flex items-center justify-between p-3.5 bg-[var(--color-stone-light)]/70 border border-[var(--color-stone)]">
                  <div>
                    <span className="font-display text-[10px] font-bold tracking-widest uppercase text-[var(--color-ink)] block">
                      Live Estimate
                    </span>
                    <span className="font-body text-[11px] text-[var(--color-ink)]/60">
                      Refines in the next steps
                    </span>
                  </div>
                  <span className="font-display text-xl font-bold uppercase text-[var(--color-ink)] bg-white px-3.5 py-1 border border-[var(--color-stone)]">
                    {liveEstimate}
                  </span>
                </div>

                {/* Action CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="crush-btn crush-btn-primary w-full py-4 text-xs font-bold tracking-widest uppercase cursor-pointer"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* =========================================
                STEP 2: BODY SHAPE (Bust, Waist, Hips)
               ========================================= */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-2xl tracking-[0.04em] uppercase text-[var(--color-ink)] m-0">
                    Your shape
                  </h2>
                  <p className="font-body text-xs text-[var(--color-ink)]/60 mt-1 m-0">
                    Compared with most people your height and weight.
                  </p>
                </div>

                {/* 1. Bust / Chest */}
                <div className="space-y-2">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] block">
                    Bust / Chest
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['narrower', 'average', 'fuller'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setBustShape(opt)}
                        className={`py-3 text-center font-display text-xs capitalize tracking-wide border transition-all cursor-pointer ${
                          bustShape === opt
                            ? 'border-[var(--color-ink)] bg-white font-bold ring-2 ring-[var(--color-ink)]'
                            : 'border-[var(--color-stone)] bg-white text-[var(--color-ink)]/70 hover:border-[var(--color-ink)]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Waist / Torso */}
                <div className="space-y-2">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] block">
                    Waist
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['narrower', 'average', 'fuller'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setWaistShape(opt)}
                        className={`py-3 text-center font-display text-xs capitalize tracking-wide border transition-all cursor-pointer ${
                          waistShape === opt
                            ? 'border-[var(--color-ink)] bg-white font-bold ring-2 ring-[var(--color-ink)]'
                            : 'border-[var(--color-stone)] bg-white text-[var(--color-ink)]/70 hover:border-[var(--color-ink)]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Hips */}
                <div className="space-y-2">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] block">
                    Hips
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['narrower', 'average', 'fuller'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setHipsShape(opt)}
                        className={`py-3 text-center font-display text-xs capitalize tracking-wide border transition-all cursor-pointer ${
                          hipsShape === opt
                            ? 'border-[var(--color-ink)] bg-white font-bold ring-2 ring-[var(--color-ink)]'
                            : 'border-[var(--color-stone)] bg-white text-[var(--color-ink)]/70 hover:border-[var(--color-ink)]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation CTAs */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="crush-btn crush-btn-primary w-full py-4 text-xs font-bold tracking-widest uppercase cursor-pointer"
                  >
                    Continue →
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-2.5 text-center font-display text-xs tracking-wider uppercase text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] cursor-pointer"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* =========================================
                STEP 3: FIT PREFERENCE (Fitted / As-Cut / Relaxed)
               ========================================= */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-2xl tracking-[0.04em] uppercase text-[var(--color-ink)] m-0">
                    How do you like it to fit?
                  </h2>
                  <p className="font-body text-xs text-[var(--color-ink)]/60 mt-1 m-0">
                    We&apos;ll aim for this tailored feel.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {id: 'close', label: 'Close'},
                      {id: 'as-cut', label: 'As Cut'},
                      {id: 'relaxed', label: 'Relaxed'},
                    ].map((pref) => (
                      <button
                        key={pref.id}
                        type="button"
                        onClick={() => setFitPreference(pref.id as any)}
                        className={`py-3 text-center font-display text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                          fitPreference === pref.id
                            ? 'border-[var(--color-ink)] bg-white font-bold ring-2 ring-[var(--color-ink)]'
                            : 'border-[var(--color-stone)] bg-white text-[var(--color-ink)]/70 hover:border-[var(--color-ink)]'
                        }`}
                      >
                        {pref.label}
                      </button>
                    ))}
                  </div>

                  <p className="font-body text-xs text-[var(--color-ink)]/75 p-3.5 bg-white border border-[var(--color-stone)] leading-relaxed m-0">
                    {fitPreference === 'close' &&
                      '✦ Contoured: Closer fit through the bodice and bust line.'}
                    {fitPreference === 'as-cut' &&
                      '✦ The fit the dress was designed for: Structured bodice with effortless A-line swing.'}
                    {fitPreference === 'relaxed' &&
                      '✦ Relaxed: Easy fluid ease with generous room through the torso.'}
                  </p>
                </div>

                {/* Navigation CTAs */}
                <div className="space-y-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="crush-btn crush-btn-primary w-full py-4 text-xs font-bold tracking-widest uppercase cursor-pointer"
                  >
                    Show My Size →
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-2.5 text-center font-display text-xs tracking-wider uppercase text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] cursor-pointer"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* =========================================
                STEP 4: FINAL RECOMMENDATION RESULT
               ========================================= */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center pt-2">
                  <span className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-[var(--color-ink)]/50 block mb-1">
                    Your Recommendation
                  </span>
                  <h2 className="font-display font-bold text-3xl tracking-[0.04em] uppercase text-[var(--color-ink)] m-0">
                    Your size
                  </h2>
                </div>

                {/* Big Circular Recommendation Badge */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-28 h-28 rounded-full border-4 border-emerald-800 bg-white flex flex-col items-center justify-center shadow-lg">
                    <span className="font-display text-4xl font-extrabold uppercase text-[var(--color-ink)] leading-none">
                      {calculatedRecommendation}
                    </span>
                    <span className="font-display text-[10px] font-bold tracking-widest uppercase text-emerald-800 mt-1">
                      Best Fit
                    </span>
                  </div>
                  <p className="font-body text-xs text-center text-[var(--color-ink)]/80 mt-3 max-w-xs leading-relaxed">
                    Size <strong>{calculatedRecommendation}</strong> lines up best for the fit it was cut for through your measurements.
                  </p>
                </div>

                {/* Body Area Precision Breakdown */}
                <div className="p-4 bg-white border border-[var(--color-stone)] space-y-2 text-xs font-body">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-stone)]/40">
                    <span className="font-display font-bold uppercase tracking-wider text-[var(--color-ink)]">
                      Bust
                    </span>
                    <span className="text-[var(--color-ink)]/80 flex items-center gap-1.5">
                      <span className="text-emerald-700">●</span>
                      <span>Right for the fit it was cut for</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-stone)]/40">
                    <span className="font-display font-bold uppercase tracking-wider text-[var(--color-ink)]">
                      Waist
                    </span>
                    <span className="text-[var(--color-ink)]/80 flex items-center gap-1.5">
                      <span className="text-emerald-700">●</span>
                      <span>Right for the fit it was cut for</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-stone)]/40">
                    <span className="font-display font-bold uppercase tracking-wider text-[var(--color-ink)]">
                      Hips
                    </span>
                    <span className="text-[var(--color-ink)]/80 flex items-center gap-1.5">
                      <span className="text-emerald-700">●</span>
                      <span>Fluid A-line drape over hips</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold uppercase tracking-wider text-[var(--color-ink)]">
                      Length
                    </span>
                    <span className="text-[var(--color-ink)]/80 flex items-center gap-1.5">
                      <span className="text-emerald-700">●</span>
                      <span>Above-knee mini (adjustable tie straps)</span>
                    </span>
                  </div>
                </div>

                {/* Size Strip with 'YOU' Pointer */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="font-display text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)]/60">
                      Available Sizes
                    </span>
                    <span className="font-display text-[10px] font-bold uppercase tracking-widest text-emerald-800">
                      You: Size {calculatedRecommendation}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(availableSizes?.length ? availableSizes : ['S', 'M', 'L']).map((sz) => {
                      const isRecommended = sz === calculatedRecommendation;
                      return (
                        <div key={sz} className="relative text-center">
                          {isRecommended && (
                            <span className="absolute -top-4 inset-x-0 font-display text-[9px] font-bold tracking-widest uppercase text-emerald-800">
                              ▲ You
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleApplySize(sz, false)}
                            className={`w-full py-2.5 font-display text-xs font-bold uppercase tracking-wider border cursor-pointer ${
                              isRecommended
                                ? 'bg-[var(--color-ink)] text-[var(--color-ivory)] border-[var(--color-ink)] shadow-md'
                                : 'bg-white text-[var(--color-ink)] border-[var(--color-stone)] hover:border-[var(--color-ink)]'
                            }`}
                          >
                            {sz}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CTAs: Add Size to Bag & Select Size */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleApplySize(calculatedRecommendation, true)}
                    className="crush-btn crush-btn-primary w-full py-4 text-xs font-bold tracking-widest uppercase cursor-pointer"
                  >
                    Add Size {calculatedRecommendation} To Bag
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleApplySize(calculatedRecommendation, false)}
                      className="font-display text-xs uppercase tracking-wider text-[var(--color-ink)] underline underline-offset-4 cursor-pointer"
                    >
                      Just Select Size {calculatedRecommendation}
                    </button>
                    <button
                      type="button"
                      onClick={resetAdvisor}
                      className="font-display text-xs uppercase tracking-wider text-[var(--color-ink)]/50 hover:text-[var(--color-ink)] cursor-pointer"
                    >
                      Restart Advisor
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DETAILED GARMENT MEASUREMENT CHART */}
        {activeTab === 'chart' && (
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
            <div>
              <h3 className="font-display font-bold text-lg tracking-wider uppercase text-[var(--color-ink)] m-0">
                Atelier Garment Measurements
              </h3>
              <p className="font-body text-xs text-[var(--color-ink)]/60 mt-1 m-0">
                Measurements reflect the garment cut in inches and centimeters.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-xs border border-[var(--color-stone)] bg-white">
                <thead>
                  <tr className="bg-[var(--color-ink)] text-[var(--color-ivory)] font-display uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Length</th>
                    <th className="py-2.5 px-3">Bust</th>
                    <th className="py-2.5 px-3">Waist</th>
                    <th className="py-2.5 px-3 text-right">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-stone)]">
                  <tr className="hover:bg-[var(--color-stone-light)]/40">
                    <td className="py-3 px-3 font-bold font-display text-sm">S</td>
                    <td className="py-3 px-3">31.5&quot; (80 cm)</td>
                    <td className="py-3 px-3">33.9&quot; (86 cm)</td>
                    <td className="py-3 px-3">33.5&quot; (85 cm)</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleApplySize('S', false)}
                        className="px-2.5 py-1 text-[10px] font-display uppercase font-bold border border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white cursor-pointer"
                      >
                        Choose
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--color-stone-light)]/40">
                    <td className="py-3 px-3 font-bold font-display text-sm">M</td>
                    <td className="py-3 px-3">31.9&quot; (81 cm)</td>
                    <td className="py-3 px-3">35.4&quot; (90 cm)</td>
                    <td className="py-3 px-3">35.0&quot; (89 cm)</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleApplySize('M', false)}
                        className="px-2.5 py-1 text-[10px] font-display uppercase font-bold border border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white cursor-pointer"
                      >
                        Choose
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--color-stone-light)]/40">
                    <td className="py-3 px-3 font-bold font-display text-sm">L</td>
                    <td className="py-3 px-3">32.3&quot; (82 cm)</td>
                    <td className="py-3 px-3">37.0&quot; (94 cm)</td>
                    <td className="py-3 px-3">36.6&quot; (93 cm)</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleApplySize('L', false)}
                        className="px-2.5 py-1 text-[10px] font-display uppercase font-bold border border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white cursor-pointer"
                      >
                        Choose
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-white border border-[var(--color-stone)] text-xs text-[var(--color-ink)]/80 space-y-2">
              <p className="font-display font-bold uppercase tracking-wider text-[11px] text-[var(--color-ink)] m-0">
                Fit & Fabric Notes:
              </p>
              <ul className="list-disc pl-4 space-y-1 m-0 text-[11px]">
                <li>100% Cotton non-stretch woven structure.</li>
                <li>Fully adjustable self-tie shoulder straps allow custom torso length and bust support.</li>
                <li>If you prefer a relaxed silhouette, consider sizing up.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

