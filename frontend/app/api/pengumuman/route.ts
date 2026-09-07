import { NextResponse } from 'next/server';
import { pengumumanData } from '@/lib/data';

export async function GET() {
  return NextResponse.json(pengumumanData);
}