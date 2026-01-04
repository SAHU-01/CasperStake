import { 
  CLPublicKey, 
  DeployUtil, 
  RuntimeArgs, 
  CLValueBuilder,
  CLU256,
} from 'casper-js-sdk';

// CasperSwap Testnet Contract Hashes (get from testnet.casperswap.xyz)
export const CASPERSWAP_CONTRACTS = {
  router: 'hash-ROUTER_HASH_HERE', // Replace with actual
  factory: 'hash-FACTORY_HASH_HERE', // Replace with actual
  wcspr: 'hash-WCSPR_HASH_HERE', // Replace with actual
};

export const TOKEN_HASHES: Record<string, string> = {
  csCSPR: 'hash-d08450237b5a4b6db97fb26b4dae6ae4e26262ad39a88e2079c5a9ad01783a83',
  WCSPR: CASPERSWAP_CONTRACTS.wcspr,
  // Add other LST tokens as deployed
};

interface SwapParams {
  amountIn: string;
  amountOutMin: string;
  path: string[]; // Token hashes
  to: CLPublicKey;
  deadline: number;
}

export function createSwapExactTokensForTokensDeploy(
  sender: CLPublicKey,
  params: SwapParams,
  networkName: string = 'casper-test'
): DeployUtil.Deploy {
  const args = RuntimeArgs.fromMap({
    amount_in: CLValueBuilder.u256(params.amountIn),
    amount_out_min: CLValueBuilder.u256(params.amountOutMin),
    path: CLValueBuilder.list(
      params.path.map(hash => CLValueBuilder.byteArray(
        Uint8Array.from(Buffer.from(hash.replace('hash-', ''), 'hex'))
      ))
    ),
    to: CLValueBuilder.key(params.to),
    deadline: CLValueBuilder.u64(params.deadline),
  });

  const deployParams = new DeployUtil.DeployParams(
    sender,
    networkName,
    1,
    1800000 // 30 min TTL
  );

  const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
    Uint8Array.from(Buffer.from(CASPERSWAP_CONTRACTS.router.replace('hash-', ''), 'hex')),
    'swap_exact_tokens_for_tokens',
    args
  );

  const payment = DeployUtil.standardPayment(15_000_000_000); // 15 CSPR

  return DeployUtil.makeDeploy(deployParams, session, payment);
}

// Slippage calculation helper
export function calculateMinOutput(
  amountOut: string,
  slippageTolerance: number // e.g., 0.5 for 0.5%
): string {
  const amount = BigInt(amountOut);
  const slippageMultiplier = BigInt(Math.floor((100 - slippageTolerance) * 100));
  const minOutput = (amount * slippageMultiplier) / BigInt(10000);
  return minOutput.toString();
}

// Example usage:
// const deploy = createSwapExactTokensForTokensDeploy(
//   senderPublicKey,
//   {
//     amountIn: '1000000000', // 1 csCSPR (9 decimals)
//     amountOutMin: calculateMinOutput('990000000', 0.5), // 0.5% slippage
//     path: [TOKEN_HASHES.csCSPR, TOKEN_HASHES.WCSPR],
//     to: senderPublicKey,
//     deadline: Date.now() + 20 * 60 * 1000, // 20 min deadline
//   },
//   'casper-test'
// );