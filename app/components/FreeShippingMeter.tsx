interface FreeShippingMeterProps {
  subtotalAmount?: string;
  threshold?: number;
}

export function FreeShippingMeter({
  subtotalAmount,
  threshold = 150.0,
}: FreeShippingMeterProps) {
  const current = subtotalAmount ? parseFloat(subtotalAmount) : 0;
  const progressPct = Math.min(100, Math.max(0, (current / threshold) * 100));
  const remaining = Math.max(0, threshold - current);
  const isUnlocked = current >= threshold;

  return (
    <div className="crush-shipping-meter py-3 px-3.5 bg-[var(--color-stone-light)]/70 border border-[var(--color-stone)] mb-4">
      <div className="flex items-center justify-between gap-2 mb-2 font-display text-[10px] sm:text-[11px] tracking-wider uppercase text-[var(--color-ink)]">
        <span className="font-semibold flex items-center gap-1.5">
          <span className="text-xs">{isUnlocked ? '✦' : '○'}</span>
          {isUnlocked ? (
            <span className="text-emerald-800 font-bold">
              Complimentary US Ground Delivery Unlocked
            </span>
          ) : (
            <span>
              Add <strong className="font-bold text-[var(--color-ink)]">${remaining.toFixed(2)}</strong> for Free US Delivery
            </span>
          )}
        </span>
        <span className="text-[10px] text-[var(--color-ink)]/50 shrink-0 font-body font-semibold">
          {progressPct.toFixed(0)}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="h-1.5 w-full bg-[var(--color-stone)] rounded-none overflow-hidden relative">
        <div
          className={`h-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isUnlocked ? 'bg-emerald-700' : 'bg-[var(--color-ink)]'
          }`}
          style={{width: `${progressPct}%`}}
        />
      </div>
    </div>
  );
}

