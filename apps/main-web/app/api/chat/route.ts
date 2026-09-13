import { NextResponse } from "next/server";

export async function POST() {
	return NextResponse.json(
		{ error: "Chat API belum terhubung ke layanan chatbot." },
		{ status: 501 }
	);
}
