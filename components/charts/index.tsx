"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNaira, formatNairaCompact, formatNumber } from "@/lib/utils";

export const CHART_COLORS = {
  navy: "#142C45",
  emerald: "#16A477",
  amber: "#F2B84B",
  danger: "#DC5555",
  info: "#2F6FB0",
  grid: "#E7EDF2",
  muted: "#718096",
};

type Datum = Record<string, string | number>;
type ValueKind = "currency" | "number" | "percent";

const fmt = (v: number, kind: ValueKind) => (kind === "currency" ? formatNaira(v) : kind === "percent" ? `${v}%` : formatNumber(v));
const fmtAxis = (v: number, kind: ValueKind) => (kind === "currency" ? formatNairaCompact(v) : kind === "percent" ? `${v}%` : formatNumber(v));

function ChartTooltip({ active, payload, label, kind }: { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string; kind: ValueKind }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-raised">
      {label && <p className="mb-1 font-semibold text-ink">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-muted">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-ink tabular">{fmt(Number(p.value ?? 0), kind)}</span>
        </p>
      ))}
    </div>
  );
}

const axisProps = { tickLine: false, axisLine: false, tick: { fill: CHART_COLORS.muted, fontSize: 12 } } as const;

export interface Series {
  key: string;
  name: string;
  color?: string;
}

export function TrendChart({ data, series, xKey = "label", kind = "number", height = 260, type = "area" }: { data: Datum[]; series: Series[]; xKey?: string; kind?: ValueKind; height?: number; type?: "area" | "line" }) {
  const id = React.useId().replace(/:/g, "");
  const Chart = type === "area" ? AreaChart : LineChart;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`${id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color ?? CHART_COLORS.emerald} stopOpacity={0.18} />
                <stop offset="100%" stopColor={s.color ?? CHART_COLORS.emerald} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} dy={6} minTickGap={12} />
          <YAxis {...axisProps} width={kind === "currency" ? 56 : 36} tickFormatter={(v: number) => fmtAxis(v, kind)} allowDecimals={false} />
          <Tooltip content={<ChartTooltip kind={kind} />} cursor={{ stroke: CHART_COLORS.grid }} />
          {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: CHART_COLORS.muted }} />}
          {series.map((s) =>
            type === "area" ? (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color ?? CHART_COLORS.emerald} strokeWidth={2} fill={`url(#${id}-${s.key})`} dot={false} activeDot={{ r: 4 }} />
            ) : (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color ?? CHART_COLORS.emerald} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            ),
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({ data, series, xKey = "label", kind = "number", height = 260, stacked, layout = "horizontal" }: { data: Datum[]; series: Series[]; xKey?: string; kind?: ValueKind; height?: number; stacked?: boolean; layout?: "horizontal" | "vertical" }) {
  const vertical = layout === "vertical";
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={layout} margin={{ top: 8, right: 8, left: vertical ? 8 : 0, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={vertical} horizontal={!vertical} />
          {vertical ? (
            <>
              <XAxis type="number" {...axisProps} tickFormatter={(v: number) => fmtAxis(v, kind)} />
              <YAxis type="category" dataKey={xKey} {...axisProps} width={110} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} {...axisProps} dy={6} />
              <YAxis {...axisProps} width={kind === "currency" ? 56 : 36} tickFormatter={(v: number) => fmtAxis(v, kind)} allowDecimals={false} />
            </>
          )}
          <Tooltip content={<ChartTooltip kind={kind} />} cursor={{ fill: "rgba(20,44,69,0.04)" }} />
          {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              stackId={stacked ? "a" : undefined}
              fill={s.color ?? CHART_COLORS.navy}
              radius={stacked ? (i === series.length - 1 ? (vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]) : 0) : vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              maxBarSize={vertical ? 18 : 36}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({ data, height = 220, centerLabel, centerValue }: { data: { label: string; value: number; color: string }[]; height?: number; centerLabel?: string; centerValue?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="@container">
    <div className="flex flex-col items-center gap-5 @md:flex-row">
      <div className="relative w-full max-w-[200px] shrink-0" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius="64%" outerRadius="92%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
              {data.map((d) => (
                <Cell key={d.label} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip kind="number" />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-ink tabular">{centerValue ?? formatNumber(total)}</span>
          <span className="text-xs text-muted">{centerLabel ?? "Total"}</span>
        </div>
      </div>
      <ul className="w-full flex-1 space-y-2.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 whitespace-nowrap text-ink-soft">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
              {d.label}
            </span>
            <span className="font-semibold whitespace-nowrap text-ink tabular">
              {formatNumber(d.value)} <span className="font-normal text-muted">({total ? Math.round((d.value / total) * 100) : 0}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
}
