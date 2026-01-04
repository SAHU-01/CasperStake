import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const publicKey = request.nextUrl.searchParams.get('public_key');
  
  if (!publicKey) {
    return NextResponse.json({ error: 'Missing public_key' }, { status: 400 });
  }
  
  try {
    const response = await fetch(
      `https://event-store-api-clarity-testnet.make.services/deploys?caller_public_key=${publicKey}&page=1&limit=20`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      return NextResponse.json({ data: [] });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Deploys API error:', error);
    return NextResponse.json({ data: [] });
  }
}
