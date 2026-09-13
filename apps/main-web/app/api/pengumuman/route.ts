import { NextResponse } from 'next/server';
import { pengumumanData } from '@/lib/data';
import { corsHeaders } from '../_lib/cors';

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(pengumumanData, { headers: corsHeaders });
}