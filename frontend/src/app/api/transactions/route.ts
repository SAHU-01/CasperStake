import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const publicKey = searchParams.get('publicKey');
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '20';

  if (!publicKey) {
    return NextResponse.json({ error: 'Public key required' }, { status: 400 });
  }

  try {
    // Try the extended API first (includes amounts)
    const extendedUrl = `https://event-store-api-clarity-testnet.make.services/extended-deploys?caller_public_key=${publicKey}&page=${page}&limit=${limit}&order_direction=DESC&with_amounts=true`;
    
    console.log('Fetching from:', extendedUrl);
    
    const response = await fetch(extendedUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        data: data.data || data,
        itemCount: data.itemCount || data.total || (data.data?.length || 0),
        page: parseInt(page),
        limit: parseInt(limit)
      });
    }

    // Fallback to basic deploys endpoint
    const basicUrl = `https://event-store-api-clarity-testnet.make.services/deploys?caller_public_key=${publicKey}&page=${page}&limit=${limit}&order_direction=DESC`;
    
    console.log('Falling back to:', basicUrl);
    
    const fallbackResponse = await fetch(basicUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json();
      return NextResponse.json({
        success: true,
        data: data.data || data,
        itemCount: data.itemCount || data.total || (data.data?.length || 0),
        page: parseInt(page),
        limit: parseInt(limit)
      });
    }

    throw new Error(`API returned ${fallbackResponse.status}`);

  } catch (error: any) {
    console.error('Transaction fetch error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to fetch transactions',
      data: [],
      itemCount: 0
    }, { status: 500 });
  }
}
