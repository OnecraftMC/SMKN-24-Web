import AutomaticChatAnalyticsPage from "@/components/admin/chat/AutomaticChatAnalyticsPage";

type SearchParams = {
  dari?: string | string[];
  sampai?: string | string[];
};

function tanggalValid(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function hariIniJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function AutomaticChatAnalyticsRoute({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sampai = hariIniJakarta();
  const dariDefault = new Date(`${sampai}T00:00:00Z`);
  dariDefault.setUTCDate(dariDefault.getUTCDate() - 6);
  const periodeDefault = dariDefault.toISOString().slice(0, 10);
  const dari = tanggalValid(params.dari) ? params.dari : periodeDefault;
  const tanggalSampai = tanggalValid(params.sampai) ? params.sampai : sampai;
  const rentangValid = dari <= tanggalSampai;

  return (
    <AutomaticChatAnalyticsPage
      dari={rentangValid ? dari : periodeDefault}
      sampai={rentangValid ? tanggalSampai : sampai}
    />
  );
}
