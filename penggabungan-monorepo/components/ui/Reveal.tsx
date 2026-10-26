"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || !("IntersectionObserver" in window)) return;

    element.dataset.reveal = "pending";
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        element.dataset.reveal = "shown";
        observer.disconnect();
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={className} style={{ transitionDelay: `${Math.max(0, delay)}ms` }}>{children}</div>;
}
