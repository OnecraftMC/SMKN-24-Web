import { NextResponse } from 'next/server';
import { beritaData } from '@/lib/data';
import { corsHeaders } from '../_lib/cors';

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(beritaData, { headers: corsHeaders });
}