import { NextResponse } from "next/server";

export async function POST() {
	return NextResponse.json(
		{ error: "BK API belum terhubung ke database." },
		{ status: 501 }
	);
}
