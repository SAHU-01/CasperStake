// // casper-contracts.ts - SDK v2.15.x compatible
// // Using the Contracts.Contract approach for calling stored contracts

// import {
//   CasperClient,
//   Contracts,
//   RuntimeArgs,
//   CLValueBuilder,
//   CLPublicKey,
//   DeployUtil,
// } from 'casper-js-sdk';

// // Your deployed contract hashes on testnet
// export const CONTRACTS = {
//   CASPER_STAKE: "hash-ca2e26646326c0157f95196b625bce0f69cf94c1b38c2a15d7f3ec51e8c82d45",
//   CS_CSPR_TOKEN: "hash-572eccbaa63dccac06d3f5efd4ede01b63bb73389f0ef3d282965e9f92b12049",
//   PRIVACY_MODULE: "hash-9e449a0b3deef35500f842f30873bb3569e093a3956c54f4ab556faed0f50761",
//   THRESHOLD_MODULE: "hash-1ee0ec63136085bb65e4c0cd6c0f07705c1dbaae54180af869f012d67c77b142",
// };

// const RPC_URL = "https://rpc.testnet.casperlabs.io/rpc";

// /**
//  * Create a Deploy to call the "stake" entry point on CasperStake contract
//  * Returns the deploy as JSON for wallet signing
//  */
// export function createStakeDeployJson(
//   publicKeyHex: string,
//   amountMotes: string
// ): object {
//   const casperClient = new CasperClient(RPC_URL);
//   const contract = new Contracts.Contract(casperClient);
  
//   // Set the contract hash
//   contract.setContractHash(CONTRACTS.CASPER_STAKE);
  
//   // Create runtime arguments
//   const runtimeArgs = RuntimeArgs.fromMap({
//     "amount": CLValueBuilder.u512(amountMotes)
//   });
  
//   const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
//   const paymentAmount = "10000000000"; // 10 CSPR for gas
  
//   // Create the deploy (without signing - wallet will sign)
//   const deploy = contract.callEntrypoint(
//     "stake",
//     runtimeArgs,
//     senderPublicKey,
//     "casper-test",
//     paymentAmount,
//     [] // No signers - wallet will sign
//   );
  
//   // Convert to JSON for wallet
//   return DeployUtil.deployToJson(deploy);
// }

// /**
//  * Create a Deploy to call the "request_unstake" entry point
//  * Returns the deploy as JSON for wallet signing
//  */
// export function createUnstakeDeployJson(
//   publicKeyHex: string,
//   amountMotes: string
// ): object {
//   const casperClient = new CasperClient(RPC_URL);
//   const contract = new Contracts.Contract(casperClient);
  
//   contract.setContractHash(CONTRACTS.CASPER_STAKE);
  
//   const runtimeArgs = RuntimeArgs.fromMap({
//     "amount": CLValueBuilder.u512(amountMotes)
//   });
  
//   const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
//   const paymentAmount = "10000000000"; // 10 CSPR for gas
  
//   const deploy = contract.callEntrypoint(
//     "request_unstake",
//     runtimeArgs,
//     senderPublicKey,
//     "casper-test",
//     paymentAmount,
//     []
//   );
  
//   return DeployUtil.deployToJson(deploy);
// }

// /**
//  * Reconstruct Deploy from signed JSON returned by wallet
//  */
// export function deployFromJson(json: any) {
//   const result = DeployUtil.deployFromJson(json);
//   if (result.err) {
//     throw new Error(`Failed to parse deploy: ${result.err}`);
//   }
//   return result.val;
// }

import {
  CasperClient,
  Contracts,
  RuntimeArgs,
  CLValueBuilder,
  CLPublicKey,
  DeployUtil,
} from 'casper-js-sdk';

// Your deployed contract hashes on testnet - V8!
export const CONTRACTS = {
  CASPER_STAKE: "hash-2280192e5dc6f30dd76774ed006f531481d7adf35cd88bdb36f44cad5e3afa94",
  CS_CSPR_TOKEN: "hash-572eccbaa63dccac06d3f5efd4ede01b63bb73389f0ef3d282965e9f92b12049",
  PRIVACY_MODULE: "hash-9e449a0b3deef35500f842f30873bb3569e093a3956c54f4ab556faed0f50761",
  THRESHOLD_MODULE: "hash-1ee0ec63136085bb65e4c0cd6c0f07705c1dbaae54180af869f012d67c77b142",
};

const RPC_URL = "https://rpc.testnet.casperlabs.io/rpc";
const CHAIN_NAME = "casper-test";
const PAYMENT_AMOUNT = "10000000000"; // 10 CSPR for gas

/**
 * Helper: Convert CSPR to motes
 */
export function csprToMotes(cspr: string | number): string {
  const csprNum = typeof cspr === 'string' ? parseFloat(cspr) : cspr;
  return (BigInt(Math.floor(csprNum * 1_000_000_000))).toString();
}

/**
 * Helper: Convert motes to CSPR
 */
export function motesToCspr(motes: string | bigint): string {
  const motesNum = typeof motes === 'string' ? BigInt(motes) : motes;
  return (Number(motesNum) / 1_000_000_000).toFixed(4);
}

/**
 * Create a Deploy to call the "stake" entry point on CasperStake V8 contract
 * 
 * CRITICAL FIX: Odra payable functions need BOTH "attached_value" and "amount" args
 * Without these, you get error 64658!
 */
export function createStakeDeployJson(
  publicKeyHex: string,
  amountMotes: string,
  validatorPublicKey?: string // Optional - use for validator selection
): object {
  const casperClient = new CasperClient(RPC_URL);
  const contract = new Contracts.Contract(casperClient);
  
  contract.setContractHash(CONTRACTS.CASPER_STAKE);
  
  // CRITICAL: For Odra #[odra(payable)] functions, must include:
  // - attached_value (Odra special arg for CSPR amount being sent)
  // - amount (Odra special arg, same as attached_value)
  // - validator_public_key (if your contract requires it)
  const argsMap: Record<string, any> = {
    "attached_value": CLValueBuilder.u512(amountMotes),
    "amount": CLValueBuilder.u512(amountMotes)
  };
  
  // Add validator if provided
  if (validatorPublicKey) {
    argsMap["validator_public_key"] = CLValueBuilder.string(validatorPublicKey);
  }
  
  const runtimeArgs = RuntimeArgs.fromMap(argsMap);
  
  const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
  
  const deploy = contract.callEntrypoint(
    "stake",
    runtimeArgs,
    senderPublicKey,
    CHAIN_NAME,
    PAYMENT_AMOUNT
  );
  
  return DeployUtil.deployToJson(deploy);
}

/**
 * Create a Deploy to call "request_unstake" - V8 requires cscspr_amount
 * This is NOT a payable function, so no attached_value needed
 */
export function createUnstakeDeployJson(
  publicKeyHex: string,
  cscsprAmountMotes: string,
  validatorPublicKey?: string
): object {
  const casperClient = new CasperClient(RPC_URL);
  const contract = new Contracts.Contract(casperClient);
  
  contract.setContractHash(CONTRACTS.CASPER_STAKE);
  
  const argsMap: Record<string, any> = {
    "cscspr_amount": CLValueBuilder.u256(cscsprAmountMotes)
  };
  
  // Add validator if your contract requires it
  if (validatorPublicKey) {
    argsMap["validator_public_key"] = CLValueBuilder.string(validatorPublicKey);
  }
  
  const runtimeArgs = RuntimeArgs.fromMap(argsMap);
  
  const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
  
  const deploy = contract.callEntrypoint(
    "request_unstake",
    runtimeArgs,
    senderPublicKey,
    CHAIN_NAME,
    PAYMENT_AMOUNT
  );
  
  return DeployUtil.deployToJson(deploy);
}

/**
 * Withdraw after unbonding period (~14 hours)
 */
export function createWithdrawDeployJson(
  publicKeyHex: string,
  requestId: number
): object {
  const casperClient = new CasperClient(RPC_URL);
  const contract = new Contracts.Contract(casperClient);
  
  contract.setContractHash(CONTRACTS.CASPER_STAKE);
  
  const runtimeArgs = RuntimeArgs.fromMap({
    "request_id": CLValueBuilder.u64(requestId)
  });
  
  const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
  
  const deploy = contract.callEntrypoint(
    "withdraw",
    runtimeArgs,
    senderPublicKey,
    CHAIN_NAME,
    PAYMENT_AMOUNT
  );
  
  return DeployUtil.deployToJson(deploy);
}

/**
 * Instant unstake - skip unbonding, pay 0.5% fee
 */
export function createInstantUnstakeDeployJson(
  publicKeyHex: string,
  cscsprAmountMotes: string,
  validatorPublicKey?: string
): object {
  const casperClient = new CasperClient(RPC_URL);
  const contract = new Contracts.Contract(casperClient);
  
  contract.setContractHash(CONTRACTS.CASPER_STAKE);
  
  const argsMap: Record<string, any> = {
    "cscspr_amount": CLValueBuilder.u256(cscsprAmountMotes)
  };
  
  if (validatorPublicKey) {
    argsMap["validator_public_key"] = CLValueBuilder.string(validatorPublicKey);
  }
  
  const runtimeArgs = RuntimeArgs.fromMap(argsMap);
  
  const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
  
  const deploy = contract.callEntrypoint(
    "instant_unstake",
    runtimeArgs,
    senderPublicKey,
    CHAIN_NAME,
    PAYMENT_AMOUNT
  );
  
  return DeployUtil.deployToJson(deploy);
}

/**
 * Add liquidity to instant unstake pool - ALSO PAYABLE
 */
export function createAddLiquidityDeployJson(
  publicKeyHex: string,
  amountMotes: string
): object {
  const casperClient = new CasperClient(RPC_URL);
  const contract = new Contracts.Contract(casperClient);
  
  contract.setContractHash(CONTRACTS.CASPER_STAKE);
  
  // Odra payable function needs attached_value and amount
  const runtimeArgs = RuntimeArgs.fromMap({
    "attached_value": CLValueBuilder.u512(amountMotes),
    "amount": CLValueBuilder.u512(amountMotes)
  });
  
  const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
  
  const deploy = contract.callEntrypoint(
    "add_instant_liquidity",
    runtimeArgs,
    senderPublicKey,
    CHAIN_NAME,
    PAYMENT_AMOUNT
  );
  
  return DeployUtil.deployToJson(deploy);
}

/**
 * Reconstruct Deploy from signed JSON returned by wallet
 */
export function deployFromJson(json: any) {
  const result = DeployUtil.deployFromJson(json);
  if (result.err) {
    throw new Error(`Failed to parse deploy: ${result.err}`);
  }
  return result.val;
}

/**
 * Submit signed deploy to network
 */
export async function submitDeploy(signedDeployJson: any): Promise<string> {
  const casperClient = new CasperClient(RPC_URL);
  const deploy = deployFromJson(signedDeployJson);
  const deployHash = await casperClient.putDeploy(deploy);
  return deployHash;
}

/**
 * Poll for deploy execution result
 * Returns { success: true } if transaction succeeded on-chain
 * Returns { success: false, errorMessage: "..." } if failed
 */
export async function waitForDeployExecution(
  deployHash: string, 
  maxAttempts = 30, 
  intervalMs = 3000
): Promise<{ success: boolean; errorMessage?: string }> {
  const casperClient = new CasperClient(RPC_URL);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const deployResult = await casperClient.getDeploy(deployHash);
      const execResults = deployResult[1]?.execution_results;
      
      if (execResults && execResults.length > 0) {
        const execResult = execResults[0];
        
        // Check for Success
        if (execResult.result.Success) {
          return { success: true };
        }
        
        // Check for Failure
        if (execResult.result.Failure) {
          const errorMsg = execResult.result.Failure.error_message || 
                          `User error: ${execResult.result.Failure || 'Unknown'}`;
          return { success: false, errorMessage: errorMsg };
        }
      }
      
      // Not yet processed, wait and retry
      await new Promise(r => setTimeout(r, intervalMs));
    } catch (err) {
      // Deploy not found yet, continue polling
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }
  
  // Timeout
  return { success: false, errorMessage: "Transaction timeout - check explorer for status" };
}

// Testnet validators list
export const TESTNET_VALIDATORS = [
  {
    name: "Validator 1",
    publicKey: "017d96b9a63abcb61c870a4f55187a0a7ac24096bdb5fc585c12a686a4d892009e",
    commission: 10,
  },
  {
    name: "Validator 2",
    publicKey: "012bac1d0ff9240ff0b7b06d555815640497861619ca12583ddef434885416e69b",
    commission: 5,
  },
  {
    name: "Validator 3",
    publicKey: "0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca",
    commission: 8,
  },
];