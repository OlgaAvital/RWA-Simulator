import React, { useEffect, useState } from "react";
import { clampNumber, formatInputNumber, formatK, formatYearsFromMonths, parseFormattedNumber } from "../../domain/simulatorEngine.js";

export function DefinitionCard({ title, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-base font-bold text-slate-800">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function DefinitionItem({ term, text }) {
  return (
    <div className="border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
      <div className="text-sm font-bold text-slate-700">{term}</div>
      <div className="mt-1 text-sm leading-6 text-slate-600">{text}</div>
    </div>
  );
}

export function FormulaLine({ label, formula }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-800">{formula}</div>
    </div>
  );
}

export function CompactProductsTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="p-3 text-right">מוצר</th>
            <th className="p-3 text-right">מסגרת</th>
            <th className="p-3 text-right">ניצול</th>
            <th className="p-3 text-right">לא מנוצל</th>
            <th className="p-3 text-right">EAD</th>
            <th className="p-3 text-right">מרווח</th>
            <th className="p-3 text-right">הכנסה</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-t" key={row.id}>
              <td className="p-3 font-medium">{row.ruleLabel}</td>
              <td className="p-3">{formatK(row.limit)}</td>
              <td className="p-3">{formatK(row.utilizedAmount)}</td>
              <td className="p-3">{formatK(row.undrawnAmount)}</td>
              <td className="p-3 font-bold text-orange-700">{formatK(row.ead)}</td>
              <td className="p-3">{row.isInterestBearing ? row.margin.toFixed(2) : row.feeRate.toFixed(2)}%</td>
              <td className="p-3 font-bold text-emerald-700">{formatK(row.annualIncome)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FieldBox({ title, children }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="mb-1 text-xs font-medium text-slate-500">{title}</div>
      {children}
    </div>
  );
}

export function ReadOnlyBox({ title, value, tone = "slate" }) {
  const colors = {
    slate: "text-slate-900",
    orange: "text-orange-700",
    green: "text-emerald-700",
    sky: "text-sky-700",
  };

  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-xs font-medium text-slate-500">{title}</div>
      <div className={`mt-1 text-base font-bold ${colors[tone] || colors.slate}`}>{value}</div>
    </div>
  );
}

export function Checkbox({ checked, onChange }) {
  return (
    <input
      type="checkbox"
      checked={Boolean(checked)}
      onChange={(event) => onChange(event.target.checked)}
      className="h-5 w-5 accent-emerald-600"
    />
  );
}

export function FormattedNumberInput({
  value,
  onValueChange,
  onValueBlur,
  disabled = false,
  className = "",
  inputMode = "decimal",
  min,
  max,
  step,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState(formatInputNumber(value));

  useEffect(() => {
    if (!isFocused) setDraft(formatInputNumber(value));
  }, [isFocused, value]);

  const handleChange = (event) => {
    const nextDraft = event.target.value;
    setDraft(nextDraft);
    const parsed = parseFormattedNumber(nextDraft);
    if (Number.isFinite(parsed)) onValueChange(parsed);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFormattedNumber(draft);
    if (Number.isFinite(parsed)) {
      onValueBlur?.(parsed);
      setDraft(formatInputNumber(parsed));
    } else {
      setDraft(formatInputNumber(value));
    }
  };

  return (
    <input
      type="text"
      inputMode={inputMode}
      min={min}
      max={max}
      step={step}
      value={isFocused ? draft : formatInputNumber(value)}
      onFocus={() => {
        setIsFocused(true);
        setDraft(formatInputNumber(value));
      }}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      className={className}
    />
  );
}

export function NumberCell({ value, onChange, onBlur, disabled = false, wide = false, min = 0, step = "0.1" }) {
  return (
    <FormattedNumberInput
      min={min}
      step={step}
      value={formatInputNumber(value)}
      onValueChange={onChange}
      onValueBlur={onBlur}
      disabled={disabled}
      className={`${wide ? "w-full" : "w-24"} rounded-xl border px-2 py-1 text-center outline-none focus:ring-2 focus:ring-orange-200 ${disabled ? "cursor-not-allowed bg-slate-100 text-slate-400" : ""}`}
    />
  );
}

export function MonthsCell({ value, onChange, onBlur, disabled = false, wide = true, min = 0, max = 420 }) {
  const months = clampNumber(value, min, max);

  return (
    <div>
      <NumberCell
        wide={wide}
        value={value}
        min={min}
        step="1"
        disabled={disabled}
        onChange={onChange}
        onBlur={(nextValue) => onBlur?.(clampNumber(nextValue || min, min, max))}
      />
      <div className="mt-1 text-[11px] text-slate-500">{formatYearsFromMonths(months)}</div>
    </div>
  );
}

export function Panel({ children, className = "" }) {
  return <section className={`print-panel min-w-0 rounded-3xl bg-white p-4 shadow-sm ${className}`}>{children}</section>;
}

export function MetricInput({ label, value, setValue, min, max, step = 1, help = "" }) {
  const handleChange = (nextValue) => setValue(clampNumber(nextValue, min, max));
  const parsedValue = clampNumber(value, min, max);

  return (
    <div className="mb-5 space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">
          {label}
          {help && <span className="mr-1 cursor-help text-xs text-slate-400" title={help}>ⓘ</span>}
        </span>
        <FormattedNumberInput
          className="h-8 w-24 rounded-xl border border-slate-200 bg-white text-center outline-none ring-orange-200 transition focus:ring-4"
          inputMode="decimal"
          value={formatInputNumber(value)}
          min={min}
          max={max}
          step={step}
          onValueChange={handleChange}
        />
      </div>
      <input
        type="range"
        value={parsedValue}
        min={min}
        max={max}
        step={step}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full accent-orange-500"
      />
    </div>
  );
}

export function MonthsMetricInput({ label, valueYears, setValueYears, minMonths, maxMonths, help = "" }) {
  const valueMonths = Math.round((parseFormattedNumber(valueYears) || 0) * 12);
  const handleChange = (nextValue) => {
    const months = clampNumber(nextValue, minMonths, maxMonths);
    setValueYears(months / 12);
  };

  return (
    <div className="mb-5 space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">
          {label}
          {help && <span className="mr-1 cursor-help text-xs text-slate-400" title={help}>ⓘ</span>}
        </span>
        <div className="text-left">
          <input
            className="h-8 w-24 rounded-xl border border-slate-200 bg-white text-center outline-none ring-orange-200 transition focus:ring-4"
            type="text"
            inputMode="numeric"
            value={formatInputNumber(valueMonths)}
            onChange={(event) => handleChange(event.target.value)}
          />
          <div className="mt-1 text-[11px] text-slate-500">{formatYearsFromMonths(valueMonths)}</div>
        </div>
      </div>
      <input
        type="range"
        value={clampNumber(valueMonths, minMonths, maxMonths)}
        min={minMonths}
        max={maxMonths}
        step={1}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full accent-orange-500"
      />
    </div>
  );
}

export function SummaryBox({ title, value, positive = false, warning = false }) {
  const color = positive ? "text-emerald-700" : warning ? "text-amber-700" : "text-slate-900";
  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="text-xs text-slate-500">{title}</div>
      <div className={`font-bold ${color}`}>{value}</div>
    </div>
  );
}

export function Badge({ children, tone }) {
  const styles = {
    green: "bg-emerald-100 text-emerald-700",
    orange: "bg-orange-100 text-orange-700",
    blue: "bg-sky-100 text-sky-700",
    purple: "bg-violet-100 text-violet-700",
  };

  return (
    <span className={`inline-block rounded-2xl px-3 py-2 text-center text-sm font-medium ${styles[tone] || styles.blue}`}>
      {children}
    </span>
  );
}

export function ResultSection({ title, children }) {
  return (
    <section className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0">
      <div className="mb-3 text-sm font-bold text-slate-500">{title}</div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Kpi({ title, value, positive = false, muted = false, help = "" }) {
  const background = positive ? "bg-emerald-50" : muted ? "bg-slate-100" : "bg-orange-50";
  const valueColor = positive ? "text-emerald-700" : "text-slate-900";

  return (
    <div className={`flex items-center justify-between rounded-2xl p-4 ${background}`}>
      <span className="text-sm text-slate-600">
        {title}
        {help && <span className="mr-1 cursor-help text-xs text-slate-400" title={help}>ⓘ</span>}
      </span>
      <span className={`text-xl font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}

export function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active ? "bg-slate-900 text-white" : "bg-transparent text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}
