type BadgeVariant = "primary" | "secondary" | "success" | "warning";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export default function Badge({ label, variant = "primary" }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    primary: "bg-primary-fixed text-on-primary-fixed",
    secondary: "bg-secondary-fixed text-on-secondary-fixed",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${variants[variant] || variants.primary}`}>
      {label}
    </span>
  );
}
