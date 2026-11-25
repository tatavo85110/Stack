"use client";
import clsx from "clsx";

/** Vertical bar chart. Bars use the brand blue; the highlighted bar (usually the current period) is night blue. */
export function Bars({ data, height = 160, highlight, format = (v: number) => String(v) }: { data: { label: string; value: number }[]; height?: number; highlight?: number; format?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={clsx("flex items-end", data.length > 8 ? "gap-1 sm:gap-2" : "gap-2")} style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[10px] font-semibold text-ink-2 opacity-0 transition-opacity group-hover:opacity-100">{format(d.value)}</span>
          <div
            className={clsx("w-full rounded-t-md transition-[height,background] duration-500", i === highlight ? "bg-night dark:bg-sky" : "bg-mid/70 group-hover:bg-bright")}
            style={{ height: `${(d.value / max) * (height - 34)}px`, minHeight: d.value ? 3 : 0 }}
            title={`${d.label} : ${format(d.value)}`}
          />
          <span className="max-w-full truncate text-[10px] font-medium text-ink-2">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Line chart with area fill, for response times. */
export function Line({ values, height = 120 }: { values: number[]; height?: number }) {
  const w = 600;
  const max = Math.max(1, ...values) * 1.15;
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * w, height - (v / max) * height]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none" role="img" aria-label="Courbe">
      <defs>
        <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--bright)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--bright)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${height} L0,${height} Z`} fill="url(#lg)" />
      <path d={d} fill="none" stroke="var(--bright)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** 30 small cells, one per day: green when the site was fully up. */
export function UptimeStrip({ values }: { values: number[] }) {
  return (
    <div className="flex gap-[3px]">
      {values.map((v, i) => (
        <span key={i} title={`${v} %`} className={clsx("h-7 flex-1 rounded-[3px]", v >= 99.5 ? "bg-ok/80" : v > 0 ? "bg-warn/80" : "bg-down/80")} />
      ))}
    </div>
  );
}

/** Horizontal bars with labels, for rankings. */
export function HBars({ data, format = (v: number) => String(v) }: { data: { label: string; value: number }[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium">{d.label}</span>
            <span className="font-semibold text-ink-2">{format(d.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-full rounded-full bg-bright transition-[width] duration-500" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Donut chart for shares (e.g. acquisition sources). */
export function Donut({ data, size = 140 }: { data: { label: string; value: number }[]; size?: number }) {
  const colors = ["var(--night)", "var(--bright)", "var(--mid)", "var(--sky)", "var(--line-strong)"];
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = 52;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox="0 0 140 140" role="img" aria-label="Répartition">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--muted)" strokeWidth="20" />
        {data.map((d, i) => {
          const len = (d.value / total) * c;
          const el = (
            <circle key={d.label} cx="70" cy="70" r={r} fill="none" stroke={colors[i % colors.length]} strokeWidth="20" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)" />
          );
          acc += len;
          return el;
        })}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: colors[i % colors.length] }} />
            <span className="font-medium">{d.label}</span>
            <span className="text-ink-2">{Math.round((d.value / total) * 100)} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
