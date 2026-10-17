"use client";

import * as React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useId, useState, useEffect } from "react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type PickerMode = "single" | "range";

export interface UniversalDatePickerProps {
  className?: string;
  triggerClassName?: string;
  /** Label teks di atas picker. Kosongkan jika tidak butuh label luar. */
  label?: string;
  placeholder?: string;
  /** Nilai string ISO tunggal (YYYY-MM-DD) */
  value?: string;
  /** Nilai string rentang (YYYY-MM-DD) */
  rangeValue?: { from?: string; to?: string };
  /** Callback perubahan nilai string ISO (YYYY-MM-DD) */
  onChange?: (dateIso: string) => void;
  /** Callback ketika tanggal Date tunggal dipilih */
  onSingleChange?: (date: Date | undefined) => void;
  /** Callback ketika rentang tanggal dipilih */
  onRangeChange?: (range: DateRange | undefined) => void;
  /** Mode awal / paksa mode */
  defaultMode?: PickerMode;
  /** Apakah tombol switch mode (Tanggal / Rentang) diizinkan */
  allowModeSwitch?: boolean;
  /** Tanggal minimum (YYYY-MM-DD atau Date) */
  min?: string | Date;
  /** Tanggal maksimum (YYYY-MM-DD atau Date) */
  max?: string | Date;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

function parseIso(val?: string): Date | undefined {
  if (!val) return undefined;
  const d = new Date(val.includes("T") ? val : `${val}T00:00:00`);
  return isNaN(d.getTime()) ? undefined : d;
}

function toIso(d?: Date): string {
  if (!d || isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function UniversalDatePicker({
  className,
  triggerClassName,
  label,
  placeholder,
  value,
  rangeValue,
  onChange,
  onSingleChange,
  onRangeChange,
  defaultMode = "single",
  allowModeSwitch = false,
  min,
  max,
  disabled = false,
  id: customId,
}: UniversalDatePickerProps) {
  const generatedId = useId();
  const id = customId ?? generatedId;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode>(defaultMode);

  // Sync internal state dengan controlled props
  const [singleDate, setSingleDate] = useState<Date | undefined>(() => parseIso(value));
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (rangeValue) {
      return {
        from: parseIso(rangeValue.from),
        to: parseIso(rangeValue.to),
      };
    }
    return undefined;
  });

  useEffect(() => {
    if (value !== undefined) {
      setSingleDate(parseIso(value));
    }
  }, [value]);

  useEffect(() => {
    if (rangeValue !== undefined) {
      setRange({
        from: parseIso(rangeValue.from),
        to: parseIso(rangeValue.to),
      });
    }
  }, [rangeValue]);

  const today = new Date();

  const presets: Array<{ label: string; from: Date; to: Date }> = [
    { label: "Hari ini", from: today, to: today },
    {
      label: "Kemarin",
      from: subDays(today, 1),
      to: subDays(today, 1),
    },
    { label: "7 hari terakhir", from: subDays(today, 6), to: today },
    { label: "30 hari terakhir", from: subDays(today, 29), to: today },
    {
      label: "Bulan ini",
      from: startOfMonth(today),
      to: endOfMonth(today),
    },
    {
      label: "Bulan lalu",
      from: startOfMonth(subMonths(today, 1)),
      to: endOfMonth(subMonths(today, 1)),
    },
    { label: "Tahun ini", from: startOfYear(today), to: endOfYear(today) },
  ];

  function handleSingleSelect(selected: Date | undefined) {
    setSingleDate(selected);
    onSingleChange?.(selected);
    onChange?.(toIso(selected));
    if (selected) {
      setOpen(false);
    }
  }

  function handleRangeSelect(selected: DateRange | undefined) {
    setRange(selected);
    onRangeChange?.(selected);
    if (selected?.from && selected?.to) {
      // Menutup setelah rentang lengkap terpilih
      setOpen(false);
    }
  }

  function applyPreset(preset: { from: Date; to: Date }) {
    if (mode === "single") {
      handleSingleSelect(preset.to);
    } else {
      handleRangeSelect({ from: preset.from, to: preset.to });
    }
  }

  function applyYear(year: number) {
    const currentBase = singleDate ?? range?.from ?? today;
    const yDate = new Date(year, currentBase.getMonth(), currentBase.getDate());
    if (mode === "single") {
      handleSingleSelect(yDate);
    } else {
      handleRangeSelect({ from: startOfYear(yDate), to: endOfYear(yDate) });
    }
  }

  const displayText = (() => {
    if (mode === "single") {
      return singleDate
        ? format(singleDate, "d MMMM yyyy", { locale: localeId })
        : (placeholder ?? "Pilih tanggal");
    }
    if (range?.from) {
      return range.to
        ? `${format(range.from, "d MMM yyyy", { locale: localeId })} – ${format(range.to, "d MMM yyyy", { locale: localeId })}`
        : format(range.from, "d MMMM yyyy", { locale: localeId });
    }
    return placeholder ?? "Pilih rentang tanggal";
  })();

  const hasValue = mode === "single" ? !!singleDate : !!range;

  const minDate = typeof min === "string" ? parseIso(min) : min;
  const maxDate = typeof max === "string" ? parseIso(max) : max;

  const calendarNode =
    mode === "single" ? (
      <Calendar
        mode="single"
        selected={singleDate}
        onSelect={handleSingleSelect}
        showOutsideDays
        disabled={
          minDate || maxDate
            ? (date) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }
            : undefined
        }
        className="rounded-md border border-outline-variant/30"
      />
    ) : (
      <Calendar
        mode="range"
        selected={range}
        onSelect={handleRangeSelect}
        showOutsideDays
        disabled={
          minDate || maxDate
            ? (date) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }
            : undefined
        }
        className="rounded-md border border-outline-variant/30"
      />
    );

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Header jika ada label atau mode switch */}
      {(label || allowModeSwitch) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <Label htmlFor={id} className="text-sm font-medium text-on-surface">
              {label}
            </Label>
          )}
          {allowModeSwitch && (
            <div className="flex gap-1 ml-auto">
              <Button
                type="button"
                size="sm"
                variant={mode === "single" ? "default" : "outline"}
                className="h-7 px-2.5 text-xs"
                onClick={() => setMode("single")}
                aria-pressed={mode === "single"}
              >
                Tanggal
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "range" ? "default" : "outline"}
                className="h-7 px-2.5 text-xs"
                onClick={() => setMode("range")}
                aria-pressed={mode === "range"}
              >
                Rentang
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Trigger button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "group w-full justify-between px-3.5 py-2.5 text-left font-normal h-auto min-h-[2.75rem] rounded-xl border border-outline-variant bg-surface text-on-surface",
              "hover:border-primary hover:bg-surface-container-low transition-colors",
              "focus-visible:border-primary focus-visible:outline-[3px] focus-visible:outline-primary/20",
              !hasValue && "text-on-surface-variant",
              triggerClassName
            )}
          >
            <span className="truncate">{displayText}</span>
            <CalendarIcon
              size={18}
              strokeWidth={2}
              className="shrink-0 text-on-surface-variant/80 transition-colors group-hover:text-primary"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto max-h-[90vh] overflow-y-auto p-3 space-y-3 rounded-2xl border-outline-variant/50 bg-surface-container-lowest shadow-xl"
          align="start"
        >
          {/* Preset cepat */}
          <Card className="p-2 border-outline-variant/30 bg-surface-container-low/70">
            <p className="text-[11px] text-on-surface-variant mb-1 font-semibold px-1 uppercase tracking-wider">
              Pintasan
            </p>
            <div className="grid grid-cols-2 gap-1">
              {presets.map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs h-7 px-2 text-on-surface hover:bg-surface-container"
                  onClick={() => applyPreset(p)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* Kalender */}
          {calendarNode}

          {/* Pemilih tahun */}
          <Card className="p-2.5 border-outline-variant/30 bg-surface-container-low/70">
            <p className="text-[11px] text-on-surface-variant mb-1.5 font-semibold px-0.5 uppercase tracking-wider">
              Lompat ke tahun
            </p>
            <div className="grid grid-cols-3 gap-1">
              {Array.from(
                { length: 9 },
                (_, i) => today.getFullYear() - 4 + i
              ).map((year) => (
                <Button
                  key={year}
                  type="button"
                  size="sm"
                  variant={
                    (mode === "single" && singleDate?.getFullYear() === year) ||
                    (mode === "range" && range?.from?.getFullYear() === year)
                      ? "default"
                      : "ghost"
                  }
                  className="text-xs h-7 px-1"
                  onClick={() => applyYear(year)}
                >
                  {year}
                </Button>
              ))}
            </div>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}
