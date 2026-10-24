export function Brand({ compact = false }: { compact?: boolean }) {
  return (

    <div className="flex items-center gap-3">
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-white shadow-xs transition-transform duration-200 hover:scale-105 overflow-hidden ${compact ? "h-9 w-9" : "h-11 w-11"
          }`}
      >
        <img
          src="/1735266317943.jpg"
          alt="Logo RS Semen Gresik"
          className="h-full w-full object-contain p-1"
        />
      </div>

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
