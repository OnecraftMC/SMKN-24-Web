import { NextResponse } from 'next/server';
import { agendaData } from '@/lib/data';

export async function GET() {
  return NextResponse.json(agendaData);
}