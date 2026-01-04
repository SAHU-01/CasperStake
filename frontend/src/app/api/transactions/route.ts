// import { NextRequest, NextResponse } from 'next/server';

// export async function GET(request: NextRequest) {
//   const { searchParams } = new URL(request.url);
//   const publicKey = searchParams.get('publicKey');
  
//   if (!publicKey) {
//     return NextResponse.json({ error: 'Missing publicKey' }, { status: 400 });
//   }

//   // Try multiple API endpoints
//   const apis = [
//     // CSPR.live APIs
//     `https://api.testnet.cspr.live/accounts/${publicKey}/deploys?page=1&limit=50`,
//     `https://testnet-api.cspr.live/accounts/${publicKey}/deploys?page=1&limit=50`,
//     // Event store APIs (various formats)
//     `https://event-store-api-clarity-testnet.make.services/deploys?caller_public_key=${publicKey}&page=1&limit=50`,
//     `https://event-store-api-clarity-testnet.make.services/extended-deploys?caller_public_key=${publicKey}&page=1&limit=50`,
//   ];

//   for (const apiUrl of apis) {
//     try {
//       console.log(`Trying API: ${apiUrl}`);
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
//       const response = await fetch(apiUrl, {
//         headers: {
//           'Accept': 'application/json',
//           'User-Agent': 'CasperStake/1.0',
//         },
//         signal: controller.signal,
//       });
      
//       clearTimeout(timeoutId);

//       if (response.ok) {
//         const data = await response.json();
//         console.log(`Success from: ${apiUrl}`);
//         return NextResponse.json(data);
//       }
//     } catch (error: any) {
//       console.log(`API ${apiUrl} failed: ${error.message}`);
//     }
//   }

//   // Final fallback: Query RPC directly for account deploys
//   try {
//     // Get recent block info to query deploys
//     const rpcResponse = await fetch('https://rpc.testnet.casperlabs.io/rpc', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         jsonrpc: '2.0',
//         id: 1,
//         method: 'info_get_deploy',
//         params: { deploy_hash: publicKey } // This won't work but shows we tried
//       }),
//     });
    
//     if (rpcResponse.ok) {
//       const rpcData = await rpcResponse.json();
//       return NextResponse.json({ data: [], rpc_attempted: true, message: 'RPC fallback - limited data' });
//     }
//   } catch (e) {
//     console.log('RPC fallback failed');
//   }

//   // Return empty but valid response
//   return NextResponse.json({ 
//     data: [], 
//     message: 'Unable to fetch from external APIs. View transactions on testnet.cspr.live directly.',
//     explorer_url: `https://testnet.cspr.live/account/${publicKey}`
//   });
// }

import { NextResponse } from 'next/server';

const CASPER_API_BASE = 'https://api.testnet.cspr.live/deploys';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicKey = searchParams.get('publicKey');

  if (!publicKey) {
    return NextResponse.json({ error: 'publicKey required' }, { status: 400 });
  }

  try {
    // Fetch deploys for this account with extended data
    const response = await fetch(
      `${CASPER_API_BASE}?caller_public_key=${publicKey}&page=1&limit=50&with_amounts=true&with_entry_point=true`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 30 } // Cache for 30 seconds
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();

    // Process and normalize the data
    if (data.data && Array.isArray(data.data)) {
      const processedData = await Promise.all(
        data.data.map(async (deploy: any) => {
          // Try to get entry point name from various sources
          let entryPointName = null;
          
          // 1. Check if contract_entrypoint has the name
          if (deploy.contract_entrypoint?.name) {
            entryPointName = deploy.contract_entrypoint.name;
          }
          // 2. Check entry_point field directly
          else if (deploy.entry_point) {
            entryPointName = deploy.entry_point;
          }
          // 3. Check entry_point_name field
          else if (deploy.entry_point_name) {
            entryPointName = deploy.entry_point_name;
          }
          // 4. If we have entry_point_id but no name, try to fetch it
          else if (deploy.entry_point_id && !entryPointName) {
            // The entry point ID exists, try to resolve it
            // For CasperStake contracts, we can infer from the contract package
            const contractHash = deploy.contract_package_hash || deploy.contract_hash || '';
            
            // Known CasperStake entry points (from contract deployment)
            // These are based on the contract's actual entry point definitions
            if (contractHash.includes('f0bae28501892c5b23abf796ca13eafa50442326803a62ba4de1f26b53bcdc85') ||
                contractHash.includes('d08450237b5a4b6db97fb26b4dae6ae4e26262ad39a88e2079c5a9ad01783a83')) {
              // Try to fetch entry point details from the API
              try {
                const entryPointResponse = await fetch(
                  `https://api.testnet.cspr.live/contract-entry-points/${deploy.entry_point_id}`,
                  { next: { revalidate: 3600 } } // Cache entry points for 1 hour
                );
                if (entryPointResponse.ok) {
                  const entryPointData = await entryPointResponse.json();
                  entryPointName = entryPointData.name || entryPointData.entry_point_name;
                }
              } catch (e) {
                // Ignore errors fetching entry point details
                console.log('Could not fetch entry point details:', deploy.entry_point_id);
              }
            }
          }

          // Return normalized deploy data
          return {
            ...deploy,
            // Add the resolved entry point name
            entry_point: entryPointName || deploy.entry_point || null,
            entry_point_name: entryPointName || deploy.entry_point_name || null,
          };
        })
      );

      return NextResponse.json({
        ...data,
        data: processedData
      });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Transaction fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}