"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
const cn = (...inputs: (string | false | undefined)[]) => twMerge(clsx(inputs));

interface PillNavItem {
  href: string;
  label: string;
}

interface PillNavIndicatorProps {
  items: PillNavItem[];
  className?: string;
}

export default function PillNavIndicator({ items, className }: PillNavIndicatorProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className={cn("relative flex items-center gap-1 p-1 rounded-full", className)}>
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative z-10 px-4 py-2 rounded-full font-label-md text-label-md transition-all font-bold select-none",
              active
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            )}
          >
            {active && (
              <motion.span
                layoutId="active-navbar-pill"
                className="absolute inset-0 rounded-full bg-surface-container shadow-sm -z-10"
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 35,
                  mass: 0.8,
                }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
