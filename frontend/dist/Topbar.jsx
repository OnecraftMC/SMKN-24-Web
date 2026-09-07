function MaterialIcon({ children }) {
  return <span className="material-symbols-outlined text-[15px]">{children}</span>;
}

const contactItems = [
  { icon: "call", label: "(021) 844-1976", className: "flex" },
  {
    icon: "mail",
    label: "humassmkn24jakarta@gmail.com",
    className: "hidden sm:flex",
  },
  {
    icon: "schedule",
    label: "Senin - Jumat: 07.00 - 15.00 WIB",
    className: "hidden md:flex",
  },
];

export default function Topbar() {
  return (
    <div className="bg-primary-container text-surface px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-xs">
      <div className="max-w-container-max mx-auto flex flex-wrap items-center justify-between gap-space-xs font-label-sm text-label-sm">
        <div className="flex items-center flex-wrap gap-space-md text-surface-container-high">
          {contactItems.map((item) => (
            <span className={`${item.className} items-center gap-1`} key={item.label}>
              <MaterialIcon>{item.icon}</MaterialIcon>
              {item.label}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-space-sm">
          <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold text-[11px] tracking-wide uppercase">
            Terakreditasi A
          </span>
          <span className="hidden sm:inline text-surface-container-high">BAN-S/M</span>
        </div>
      </div>
    </div>
  );
}
