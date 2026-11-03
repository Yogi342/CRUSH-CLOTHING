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
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');

  // Raw values stored in metric for precise calculation
  const [heightCm, setHeightCm] = useState(175); // ~ 5'9"
  const [weightKg, setWeightKg] = useState(72);  // ~ 158 lb

  // Body shape selections (Narrower / Average / Fuller)
  const [chestShape, setChestShape] = useState<'narrower' | 'average' | 'fuller'>('average');
  const [stomachShape, setStomachShape] = useState<'narrower' | 'average' | 'fuller'>('average');
  const [hipsShape, setHipsShape] = useState<'narrower' | 'average' | 'fuller'>('average');

  // Fit preference (close / as-cut / relaxed)
  const [fitPreference, setFitPreference] = useState<'close' | 'as-cut' | 'relaxed'>('as-cut');

  // Selected recommended size override by user on Step 4
  const [selectedResultSize, setSelectedResultSize] = useState<string>('');

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
    setHeightCm((prev) => Math.max(145, Math.min(205, prev + deltaCm)));
  };

  const adjustWeight = (deltaKg: number) => {
    setWeightKg((prev) => Math.max(40, Math.min(130, prev + deltaKg)));
  };

  // Sizing calculation tailored to CRUSH atelier criteria & Frill Tie Mini Dress measurements:
  // S: Bust 33.9", Waist 33.5", Length 31.5" (US 4 - 6)
  // M: Bust 35.4", Waist 35.0", Length 31.9" (US 8)
  // L: Bust 37.0", Waist 36.6", Length 32.3" (US 10)
  const calculatedRecommendation = useMemo(() => {
    let score = 2.0; // Default to M

    if (weightKg < 56) {
      score = 1.0; // Leans S
    } else if (weightKg <= 68) {
      score = 2.0; // Leans M
    } else {
      score = 3.0; // Leans L
    }

    // Height modifier: taller with lighter weight remains streamlined
    if (heightCm >= 172 && weightKg < 60) {
      score -= 0.3;
    } else if (heightCm < 160 && weightKg > 62) {
      score += 0.3;
    }

    // Body shape modifiers (dress is woven 100% cotton without stretch through torso)
    if (chestShape === 'fuller') score += 0.45;
    if (chestShape === 'narrower') score -= 0.35;

    if (stomachShape === 'fuller') score += 0.45;
    if (stomachShape === 'narrower') score -= 0.35;

    if (hipsShape === 'fuller') score += 0.25;
    if (hipsShape === 'narrower') score -= 0.2;

    // Fit preference modifier
    if (fitPreference === 'relaxed') score += 0.55;
    if (fitPreference === 'close') score -= 0.5;

    const validSizes = availableSizes?.length ? availableSizes : ['S', 'M', 'L'];
    if (score <= 1.45 && validSizes.includes('S')) {
      return 'S';
    }
    if (score >= 2.5 && validSizes.includes('L')) {
      return 'L';
    }
    return validSizes.includes('M') ? 'M' : validSizes[0] || 'S';
  }, [heightCm, weightKg, chestShape, stomachShape, hipsShape, fitPreference, availableSizes]);

  // Active chosen size in Step 4
  const activeRecommendedSize = selectedResultSize || calculatedRecommendation;

  // Live estimate for Step 1
  const liveEstimate = useMemo(() => {
    if (weightKg < 56) return 'S';
    if (weightKg > 68) return 'L';
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
    setChestShape('average');
    setStomachShape('average');
    setHipsShape('average');
    setFitPreference('as-cut');
    setSelectedResultSize('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-advisor-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-transparent border-0 cursor-default"
        aria-label="Close size advisor"
      />

      <div className="relative w-full max-w-[440px] bg-white rounded-3xl border border-neutral-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90dvh]">
        
        {/* Top Mini Header Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <span
            id="size-advisor-title"
            className="font-display text-[11px] font-bold tracking-[0.22em] uppercase text-neutral-400"
          >
            SIZE ADVISOR
          </span>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer text-sm font-bold"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Product Card Row */}
        <div className="flex items-center gap-3.5 px-6 py-2.5 border-b border-neutral-100">
          {productImg && (
            <div className="w-12 h-14 rounded-xl bg-neutral-100 shrink-0 overflow-hidden border border-neutral-200/60 shadow-xs">
              <img
                src={productImg}
                alt={product?.title || 'Product'}
                className="w-full h-full object-cover object-top"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-sm font-bold tracking-tight text-neutral-900 truncate m-0">
              {product?.title || 'Frill Tie Shoulder Mini Dress'}
            </h3>
            <p className="font-body text-xs font-semibold text-neutral-500 m-0 mt-0.5">
              <Money data={productPrice} />
            </p>
          </div>

          {/* Mode Switcher: Fit vs Measurements Chart */}
          <div className="flex rounded-full bg-neutral-100 p-1 shrink-0 border border-neutral-200/50">
            <button
              type="button"
              onClick={() => setActiveTab('advisor')}
              className={`px-3 py-1 rounded-full text-[10px] font-display uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'advisor'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Fit
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1 rounded-full text-[10px] font-display uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'chart'
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Chart
            </button>
          </div>
        </div>

        {/* TAB 1: SMART SIZE ADVISOR (4 Steps) */}
        {activeTab === 'advisor' && (
          <div className="overflow-y-auto p-6 flex-1 flex flex-col justify-between">
            {/* 3-Segment Progress Bar (Steps 1-3) */}
            {step < 4 && (
              <div className="mb-5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-display text-neutral-500">
                  <span className="font-medium">
                    Step {step} of 3 ·{' '}
                    <span className="text-neutral-800 font-semibold">
                      {step === 1
                        ? 'Measurements'
                        : step === 2
                        ? 'Body shape'
                        : 'Fit preference'}
                    </span>
                  </span>
                  <span className="text-[10px] tracking-wider uppercase font-bold text-neutral-400">
                    Smart Guider
                  </span>
                </div>
                {/* Visual segmented lines */}
                <div className="grid grid-cols-3 gap-2 h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      step >= 1 ? 'bg-neutral-900' : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      step >= 2 ? 'bg-neutral-900' : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      step >= 3 ? 'bg-neutral-900' : 'bg-transparent'
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
                  <h2 className="font-display font-bold text-2xl text-neutral-900 m-0 tracking-tight">
                    Let&apos;s find your fit
                  </h2>
                  <p className="font-body text-xs text-neutral-500 mt-1 m-0">
                    Two measurements, about ten seconds.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
                  {/* Left Column: Human Silhouette SVG Icon */}
                  <div className="hidden sm:flex sm:col-span-3 flex-col items-center justify-center p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <svg
                      className="w-12 h-28 text-neutral-800"
                      viewBox="0 0 50 120"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {/* Head */}
                      <circle cx="25" cy="14" r="8" />
                      {/* Torso & Arms */}
                      <path d="M12 32 C12 28, 38 28, 38 32 L36 65 L32 65 L32 112 M18 112 L18 65 L14 65 Z" />
                      {/* Arms line */}
                      <path d="M12 32 L6 65" />
                      <path d="M38 32 L44 65" />
                    </svg>
                    <span className="text-[9px] font-display uppercase tracking-wider text-neutral-400 mt-1">
                      Body Form
                    </span>
                  </div>

                  {/* Right Column: Height & Weight Sliders */}
                  <div className="col-span-1 sm:col-span-9 w-full space-y-3 sm:space-y-4">
                    {/* Height Row */}
                    <div className="space-y-1.5 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-[10px] font-bold tracking-widest uppercase text-neutral-400">
                          HEIGHT
                        </span>
                        <div className="flex rounded-lg bg-neutral-200/70 p-0.5 text-[10px] font-display">
                          <button
                            type="button"
                            onClick={() => setHeightUnit('cm')}
                            className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                              heightUnit === 'cm'
                                ? 'bg-white text-neutral-900 font-bold shadow-xs'
                                : 'text-neutral-500'
                            }`}
                          >
                            CM
                          </button>
                          <button
                            type="button"
                            onClick={() => setHeightUnit('ft')}
                            className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                              heightUnit === 'ft'
                                ? 'bg-white text-neutral-900 font-bold shadow-xs'
                                : 'text-neutral-500'
                            }`}
                          >
                            FT/IN
                          </button>
                        </div>
                      </div>

                      <div className="font-display text-2xl font-bold tracking-tight text-neutral-900">
                        {heightUnit === 'ft' ? feetInches : `${heightCm} cm`}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => adjustHeight(-2.54)}
                          className="w-7 h-7 rounded-full flex items-center justify-center border border-neutral-200 bg-white hover:border-black text-sm font-bold cursor-pointer transition-colors"
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
                          className="flex-1 accent-neutral-900 cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => adjustHeight(2.54)}
                          className="w-7 h-7 rounded-full flex items-center justify-center border border-neutral-200 bg-white hover:border-black text-sm font-bold cursor-pointer transition-colors"
                          aria-label="Increase height"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Weight Row */}
                    <div className="space-y-1.5 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-[10px] font-bold tracking-widest uppercase text-neutral-400">
                          WEIGHT
                        </span>
                        <div className="flex rounded-lg bg-neutral-200/70 p-0.5 text-[10px] font-display">
                          <button
                            type="button"
                            onClick={() => setWeightUnit('kg')}
                            className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                              weightUnit === 'kg'
                                ? 'bg-white text-neutral-900 font-bold shadow-xs'
                                : 'text-neutral-500'
                            }`}
                          >
                            KG
                          </button>
                          <button
                            type="button"
                            onClick={() => setWeightUnit('lb')}
                            className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                              weightUnit === 'lb'
                                ? 'bg-white text-neutral-900 font-bold shadow-xs'
                                : 'text-neutral-500'
                            }`}
                          >
                            LB
                          </button>
                        </div>
                      </div>

                      <div className="font-display text-2xl font-bold tracking-tight text-neutral-900">
                        {weightUnit === 'lb' ? `${weightLb} lb` : `${weightKg} kg`}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => adjustWeight(-1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center border border-neutral-200 bg-white hover:border-black text-sm font-bold cursor-pointer transition-colors"
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
                          className="flex-1 accent-neutral-900 cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => adjustWeight(1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center border border-neutral-200 bg-white hover:border-black text-sm font-bold cursor-pointer transition-colors"
                          aria-label="Increase weight"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Estimate Badge */}
                <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div>
                    <span className="font-display text-[10px] font-bold tracking-widest uppercase text-neutral-400 block">
                      LIVE ESTIMATE
                    </span>
                    <span className="font-body text-xs text-neutral-500">
                      Refines in the next steps
                    </span>
                  </div>
                  <span className="font-display text-xl font-bold uppercase text-neutral-900 bg-white px-4 py-1 rounded-xl border border-neutral-200 shadow-xs">
                    {liveEstimate}
                  </span>
                </div>

                {/* Action CTA */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-4 rounded-full bg-neutral-900 hover:bg-neutral-800 hover:shadow-xl active:scale-[0.98] text-white font-display text-xs font-bold tracking-widest uppercase shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99]"
                  >
                    <span>Continue</span> <span className="group-hover-arrow">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* =========================================
                STEP 2: BODY SHAPE (Chest, Stomach, Hips)
               ========================================= */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display font-bold text-2xl text-neutral-900 m-0 tracking-tight">
                    Your shape
                  </h2>
                  <p className="font-body text-xs text-neutral-500 mt-1 m-0">
                    Compared with most people your height and weight.
                  </p>
                </div>

                {/* 1. Chest */}
                <div className="space-y-1.5">
                  <span className="font-display text-xs font-semibold text-neutral-800 block">
                    Chest
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['narrower', 'average', 'fuller'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setChestShape(opt)}
                        className={`py-3 rounded-xl text-center font-display text-xs capitalize tracking-wide transition-all cursor-pointer ${
                          chestShape === opt
                            ? 'border-2 border-neutral-900 bg-white font-bold shadow-xs text-neutral-900'
                            : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Stomach */}
                <div className="space-y-1.5">
                  <span className="font-display text-xs font-semibold text-neutral-800 block">
                    Stomach
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['narrower', 'average', 'fuller'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setStomachShape(opt)}
                        className={`py-3 rounded-xl text-center font-display text-xs capitalize tracking-wide transition-all cursor-pointer ${
                          stomachShape === opt
                            ? 'border-2 border-neutral-900 bg-white font-bold shadow-xs text-neutral-900'
                            : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Hips */}
                <div className="space-y-1.5">
                  <span className="font-display text-xs font-semibold text-neutral-800 block">
                    Hips
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['narrower', 'average', 'fuller'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setHipsShape(opt)}
                        className={`py-3 rounded-xl text-center font-display text-xs capitalize tracking-wide transition-all cursor-pointer ${
                          hipsShape === opt
                            ? 'border-2 border-neutral-900 bg-white font-bold shadow-xs text-neutral-900'
                            : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
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
                    className="w-full py-4 rounded-full bg-neutral-900 hover:bg-neutral-800 hover:shadow-xl active:scale-[0.98] text-white font-display text-xs font-bold tracking-widest uppercase shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99]"
                  >
                    Continue →
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-2 text-center font-display text-xs tracking-wider uppercase text-neutral-400 hover:text-neutral-900 cursor-pointer"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* =========================================
                STEP 3: FIT PREFERENCE (Close / As cut / Relaxed)
               ========================================= */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-2xl text-neutral-900 m-0 tracking-tight">
                    How do you like it to fit?
                  </h2>
                  <p className="font-body text-xs text-neutral-500 mt-1 m-0">
                    We&apos;ll aim for this feel.
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="font-display text-xs font-semibold text-neutral-800 block">
                    Fit
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {id: 'close', label: 'Close'},
                      {id: 'as-cut', label: 'As cut'},
                      {id: 'relaxed', label: 'Relaxed'},
                    ].map((pref) => (
                      <button
                        key={pref.id}
                        type="button"
                        onClick={() => setFitPreference(pref.id as any)}
                        className={`py-3.5 rounded-xl text-center font-display text-xs font-medium tracking-wide transition-all cursor-pointer ${
                          fitPreference === pref.id
                            ? 'border-2 border-neutral-900 bg-white font-bold shadow-xs text-neutral-900'
                            : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
                        }`}
                      >
                        {pref.label}
                      </button>
                    ))}
                  </div>

                  <p className="font-body text-xs text-neutral-500 pt-2 m-0 leading-relaxed">
                    {fitPreference === 'close' &&
                      'A tailored closer feel through the bodice and bust.'}
                    {fitPreference === 'as-cut' &&
                      'The fit the garment was made for.'}
                    {fitPreference === 'relaxed' &&
                      'More room through the chest and waist for an easy fluid drape.'}
                  </p>
                </div>

                {/* Navigation CTAs */}
                <div className="space-y-2 pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="w-full py-4 rounded-full bg-neutral-900 hover:bg-neutral-800 hover:shadow-xl active:scale-[0.98] text-white font-display text-xs font-bold tracking-widest uppercase shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99]"
                  >
                    <span>Show my size</span> <span className="group-hover-arrow">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-2 text-center font-display text-xs tracking-wider uppercase text-neutral-400 hover:text-neutral-900 cursor-pointer"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* =========================================
                STEP 4: FINAL RECOMMENDATION (Circle badge, breakdown, slider, CTA)
               ========================================= */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="text-center pt-1">
                  <span className="font-display text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400 block mb-1">
                    Your recommendation
                  </span>
                  <h2 className="font-display font-bold text-3xl tracking-tight text-neutral-900 m-0">
                    Your size
                  </h2>
                </div>

                {/* Big Circular Green Ring Recommendation Badge */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-[5px] border-[#2D6A4F] bg-white flex flex-col items-center justify-center shadow-lg">
                    <span className="font-display text-5xl font-extrabold uppercase text-neutral-900 leading-none">
                      {activeRecommendedSize}
                    </span>
                    <span className="font-display text-[11px] font-medium tracking-wider text-neutral-500 mt-1">
                      Best fit
                    </span>
                  </div>
                  <p className="font-body text-xs text-center text-neutral-600 mt-3 max-w-xs leading-relaxed">
                    {activeRecommendedSize} lines up best for the fit it was cut for through the body.
                  </p>
                </div>

                {/* Body Area Precision Breakdown (matching reference screenshot) */}
                <div className="space-y-1.5 text-xs font-body">
                  <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl">
                    <span className="font-display font-bold text-neutral-900">
                      Chest
                    </span>
                    <span className="text-neutral-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                      <span>Right for the fit it was cut for</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl">
                    <span className="font-display font-bold text-neutral-900">
                      Waist
                    </span>
                    <span className="text-neutral-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                      <span>Right for the fit it was cut for</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl">
                    <span className="font-display font-bold text-neutral-900">
                      Hips
                    </span>
                    <span className="text-neutral-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                      <span>Right for the fit it was cut for</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl">
                    <span className="font-display font-bold text-neutral-900">
                      Length
                    </span>
                    <span className="text-neutral-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                      <span>Right for the fit it was cut for</span>
                    </span>
                  </div>
                </div>

                {/* Sizing Strip with 'YOU' Pointer */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-center text-[10px] font-display uppercase tracking-widest text-neutral-400">
                    YOU
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {['XS', 'S', 'M', 'L', 'XL'].map((sz) => {
                      const isActive = sz === activeRecommendedSize;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedResultSize(sz)}
                          className={`py-2 rounded-xl font-display text-xs font-bold uppercase transition-all cursor-pointer ${
                            isActive
                              ? 'bg-neutral-900 text-white shadow-md'
                              : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>

                  {/* Horizontal Chest Fit Indicator Bar */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 mb-1">
                      <span>Chest</span>
                      <span className="font-medium text-neutral-700">Just right</span>
                    </div>
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-200 via-emerald-400 to-amber-200 rounded-full relative">
                      <div className="w-3 h-3 rounded-full bg-neutral-900 border-2 border-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-xs" />
                    </div>
                  </div>
                </div>

                {/* CTAs: Add size to bag */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleApplySize(activeRecommendedSize, true)}
                    className="w-full py-4 rounded-full bg-neutral-900 hover:bg-neutral-800 hover:shadow-xl active:scale-[0.98] text-white font-display text-xs font-bold tracking-widest uppercase shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99]"
                  >
                    Add size {activeRecommendedSize} to bag
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleApplySize(activeRecommendedSize, false)}
                      className="font-display text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-4 cursor-pointer"
                    >
                      Just Select Size {activeRecommendedSize}
                    </button>
                    <button
                      type="button"
                      onClick={resetAdvisor}
                      className="font-display text-xs text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      Restart Advisor
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MEASUREMENTS CHART */}
        {activeTab === 'chart' && (
          <div className="overflow-y-auto p-6 flex-1 space-y-4">
            <div>
              <h2 className="font-display font-bold text-xl text-neutral-900 m-0">
                Garment Dimensions
              </h2>
              <p className="font-body text-xs text-neutral-500 mt-1 m-0">
                Exact measurements for Frill Tie Shoulder Mini Dress in inches and centimeters.
              </p>
            </div>

            <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left font-body text-xs">
                <thead>
                  <tr className="bg-neutral-900 text-white font-display uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Length</th>
                    <th className="py-2.5 px-3">Bust</th>
                    <th className="py-2.5 px-3">Waist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  <tr className="hover:bg-neutral-50">
                    <td className="py-3 px-3 font-bold font-display text-neutral-900">S (US 4 - 6)</td>
                    <td className="py-3 px-3">31.5&quot; (80 cm)</td>
                    <td className="py-3 px-3">33.9&quot; (86 cm)</td>
                    <td className="py-3 px-3">33.5&quot; (85 cm)</td>
                  </tr>
                  <tr className="hover:bg-neutral-50 bg-neutral-50/50">
                    <td className="py-3 px-3 font-bold font-display text-neutral-900">M (US 8)</td>
                    <td className="py-3 px-3">31.9&quot; (81 cm)</td>
                    <td className="py-3 px-3">35.4&quot; (90 cm)</td>
                    <td className="py-3 px-3">35.0&quot; (89 cm)</td>
                  </tr>
                  <tr className="hover:bg-neutral-50">
                    <td className="py-3 px-3 font-bold font-display text-neutral-900">L (US 10)</td>
                    <td className="py-3 px-3">32.3&quot; (82 cm)</td>
                    <td className="py-3 px-3">37.0&quot; (94 cm)</td>
                    <td className="py-3 px-3">36.6&quot; (93 cm)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl text-xs space-y-1 text-neutral-600">
              <span className="font-display font-bold text-neutral-900 block">
                ✦ Fit Guidance:
              </span>
              <p className="m-0 leading-relaxed">
                The self-tie shoulder bows give 2-3 inches of adjustable vertical drop, letting you customize the bodice neckline and bust line.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('advisor')}
              className="w-full py-3.5 rounded-full bg-neutral-900 hover:bg-neutral-800 hover:shadow-xl active:scale-[0.98] text-white font-display text-xs font-bold tracking-widest uppercase shadow-md transition-all duration-200 cursor-pointer"
            >
              ← Back To Smart Fit Advisor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
