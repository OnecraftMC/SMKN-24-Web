interface SectionHeadingProps {
  label: string;
  title: string;
  description?: string;
}

export default function SectionHeading({ label, title, description }: SectionHeadingProps) {
  return (
    <div className="space-y-2">
      <span className="font-label-md uppercase tracking-wider text-secondary font-bold">{label}</span>
      <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">{title}</h2>
      {description && <p className="font-body-md text-on-surface-variant max-w-2xl">{description}</p>}
    </div>
  );
}
