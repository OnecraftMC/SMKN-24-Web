"use client";

import * as React from "react";
import { useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const BULAN_NAMA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const BULAN_PENDEK = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export interface MonthPickerProps {
  /** Nilai bulan dalam format ISO: YYYY-MM */
  value?: string;
  /** Callback perubahan nilai bulan (YYYY-MM) */
  onChange?: (val: string) => void;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export function MonthPicker({
  value,
  onChange,
  className,
  triggerClassName,
  disabled = false,
}: MonthPickerProps) {
  const [open, setOpen] = useState(false);

  const initialDate = React.useMemo(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      if (y && m) return new Date(y, m - 1, 1);
    }
    return new Date();
  }, [value]);

  const [activeYear, setActiveYear] = useState<number>(initialDate.getFullYear());

  // Sinkronisasi tahun saat value berubah
  React.useEffect(() => {
    if (value) {
      const [y] = value.split("-").map(Number);
      if (y) setActiveYear(y);
    }
  }, [value]);

  const selectedYear = initialDate.getFullYear();
  const selectedMonth = initialDate.getMonth();

  const currentMonthDisplay = `${BULAN_NAMA[selectedMonth]} ${selectedYear}`;

  function handleSelectMonth(mIndex: number) {
    const mm = String(mIndex + 1).padStart(2, "0");
    const nextVal = `${activeYear}-${mm}`;
    onChange?.(nextVal);
    setOpen(false);
  }

  function handleToday() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const nextVal = `${now.getFullYear()}-${mm}`;
    setActiveYear(now.getFullYear());
    onChange?.(nextVal);
    setOpen(false);
  }

  return (
    <div className={cn("inline-block", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-9 px-3 gap-2 rounded-lg border border-outline-variant bg-surface text-on-surface font-medium text-xs sm:text-sm",
              "hover:border-primary hover:bg-surface-container-low transition-colors",
              triggerClassName
            )}
          >
            <span>{currentMonthDisplay}</span>
            <CalendarIcon size={15} className="text-on-surface-variant" aria-hidden="true" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-64 p-3 rounded-2xl border-outline-variant/50 bg-surface-container-lowest shadow-xl"
          align="start"
        >
          {/* Header tahun navigasi */}
          <div className="flex items-center justify-between mb-3 px-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setActiveYear((y) => y - 1)}
              aria-label="Tahun sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-bold text-sm text-on-surface">{activeYear}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setActiveYear((y) => y + 1)}
              aria-label="Tahun berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Grid 12 bulan */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {BULAN_PENDEK.map((nama, idx) => {
              const isSelected = activeYear === selectedYear && idx === selectedMonth;
              const isCurrentMonth =
                activeYear === new Date().getFullYear() && idx === new Date().getMonth();

              return (
                <Button
                  key={nama}
                  type="button"
                  variant={isSelected ? "default" : "ghost"}
                  className={cn(
                    "h-9 text-xs font-medium rounded-lg",
                    isSelected
                      ? "bg-primary text-on-primary hover:bg-primary/90 font-bold"
                      : isCurrentMonth
                      ? "border border-primary/50 text-primary hover:bg-surface-container"
                      : "text-on-surface hover:bg-surface-container"
                  )}
                  onClick={() => handleSelectMonth(idx)}
                >
                  {nama}
                </Button>
              );
            })}
          </div>

          {/* Tombol footer */}
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30 text-xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-on-surface-variant hover:text-on-surface"
              onClick={() => setOpen(false)}
            >
              Tutup
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary font-semibold hover:bg-primary/10"
              onClick={handleToday}
            >
              Bulan ini
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

