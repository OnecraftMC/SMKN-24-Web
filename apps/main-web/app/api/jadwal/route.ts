import { NextResponse } from 'next/server';
import { JADWAL_DATA } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jurusan = searchParams.get('jurusan') || 'perhotelan';
  const data = JADWAL_DATA[jurusan as keyof typeof JADWAL_DATA] || JADWAL_DATA.perhotelan;
  return NextResponse.json(data);
}