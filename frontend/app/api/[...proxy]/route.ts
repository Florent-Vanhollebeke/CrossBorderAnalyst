import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'API proxy not configured' }, { status: 501 });
}
