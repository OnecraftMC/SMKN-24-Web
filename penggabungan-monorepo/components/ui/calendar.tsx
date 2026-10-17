"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import type { DayPickerProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = DayPickerProps;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        root: `${defaultClassNames.root} shadow-none`,
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-3",
        month_caption: "flex justify-center pt-1 relative items-center mb-1",
        caption_label: "text-sm font-semibold text-on-surface",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex justify-between",
        weekday:
          "text-on-surface-variant rounded-md w-9 text-center font-medium text-[0.8rem]",
        week: "flex w-full mt-1.5 justify-between",
        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal rounded-md text-on-surface hover:bg-surface-container"
        ),
        range_end: "rounded-r-md",
        range_start: "rounded-l-md",
        selected:
          "!bg-primary !text-on-primary hover:!bg-primary/90 focus:!bg-primary",
        today: "font-bold text-primary underline decoration-2 underline-offset-4",
        outside: "opacity-40 text-on-surface-variant",
        disabled: "opacity-25 pointer-events-none",
        range_middle:
          "!bg-surface-container !text-on-surface rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
