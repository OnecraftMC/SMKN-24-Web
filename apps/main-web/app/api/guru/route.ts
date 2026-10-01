import { NextResponse } from "next/server";

// Jalur data publik ada di lib/api.ts (getGuru -> backend PHP). Route lama
// mengembalikan `200 []` yang terbaca "sekolah tidak punya guru" — diganti
// jawaban jujur sesuai issue 06 (report F05/F27).
export async function GET() {
	return NextResponse.json(
		{
			error:
				"Belum diimplementasikan di route ini. Konten guru diambil dari backend lewat lib/api (getGuru).",
		},
		{ status: 501 },
	);
}
