// src/app/api/broadcast/route.ts
// Broadcasts signed deploys to Casper testnet RPC

import { NextRequest, NextResponse } from 'next/server';

const RPC_URL = "https://rpc.testnet.casperlabs.io/rpc";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signedDeploy } = body;

    if (!signedDeploy) {
      return NextResponse.json({ error: "No signed deploy provided" }, { status: 400 });
    }

    // The wallet returns the signed deploy - we need to send it via account_put_deploy RPC method
    const rpcRequest = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "account_put_deploy",
      params: {
        deploy: signedDeploy
      }
    };

    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rpcRequest),
    });

    const result = await response.json();

    if (result.error) {
      console.error("RPC Error:", result.error);
      return NextResponse.json({ 
        error: result.error.message || "RPC error",
        details: result.error 
      }, { status: 400 });
    }

    // Return the deploy hash
    return NextResponse.json({ 
      deploy_hash: result.result?.deploy_hash || result.result,
      success: true 
    });

  } catch (error: any) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to broadcast deploy" 
    }, { status: 500 });
  }
}