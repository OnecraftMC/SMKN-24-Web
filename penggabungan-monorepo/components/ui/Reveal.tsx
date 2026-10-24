import { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal({ children, className = "" }: RevealProps) {
  return (
    <div className={className}>{children}</div>
  );
}
