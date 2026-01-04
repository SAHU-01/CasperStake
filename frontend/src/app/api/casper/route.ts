import { NextRequest, NextResponse } from 'next/server';

const CASPER_RPC_URL = "https://node.testnet.casper.network/rpc";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(CASPER_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `RPC request failed: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Casper RPC proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy RPC request', details: String(error) },
      { status: 500 }
    );
  }
}