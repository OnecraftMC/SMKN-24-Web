import { NextResponse } from "next/server";

// Jalur data publik ada di lib/api.ts (getGaleri -> backend PHP). Route lama
// mengembalikan `200 []` yang terbaca "tidak ada dokumentasi sama sekali" —
// diganti jawaban jujur sesuai issue 06 (report F05/F27).
export async function GET() {
	return NextResponse.json(
		{
			error:
				"Belum diimplementasikan di route ini. Konten galeri diambil dari backend lewat lib/api (getGaleri).",
		},
		{ status: 501 },
	);
}
