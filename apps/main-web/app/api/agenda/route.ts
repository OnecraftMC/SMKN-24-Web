import { NextResponse } from 'next/server';
import { agendaData } from '@/lib/data';
import { corsHeaders } from '../_lib/cors';

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(agendaData, { headers: corsHeaders });
}