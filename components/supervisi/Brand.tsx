export function Brand({ compact = false }: { compact?: boolean }) {
  return (

    <div className="flex items-center gap-3">

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p
            className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${compact ? "text-sm" : "text-base"
              }`}
          >
            SMART
            <span className="text-emerald-700 dark:text-emerald-400">
              -SUPERVISI
            </span>
          </p>
        </div>

        <p className="truncate text-[10px] font-semibold tracking-wide text-slate-400 dark:text-slate-400 uppercase">
          Patient Safety &amp; Quality Nursing
        </p>
      </div>
    </div>
  );
}
