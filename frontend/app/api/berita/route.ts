import { NextResponse } from 'next/server';
import { beritaData } from '@/lib/data';

export async function GET() {
  return NextResponse.json(beritaData);
}