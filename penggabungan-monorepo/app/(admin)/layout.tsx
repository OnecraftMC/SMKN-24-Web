import { AuthProvider } from "@/lib/admin/auth";

/**
 * Area admin: `/login` dan seluruh `/admin/*`.
 *
 * AuthProvider menyediakan status sesi (validasi token lewat `/api/auth/me.php`).
 * Route group `(admin)` tidak menambah segmen URL, jadi `/login` tetap `/login`
 * dan `app/(admin)/admin/...` tetap `/admin/...`.
 *
 * Catatan kontrol akses: data dashboard hanya bisa dibaca dengan JWT yang valid
 * karena setiap request ke backend membawa `Authorization: Bearer`. Shell
 * `/admin/*` sendiri tidak berisi data.
 */
export const metadata = {
  title: "Dashboard Admin — SMK Negeri 24 Jakarta",
  description: "Panel pengelolaan konten, akademik, dan inbox SMK Negeri 24 Jakarta.",
  // Panel internal: jangan diindeks mesin pencari.
  robots: { index: false, follow: false },
};

export default function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}