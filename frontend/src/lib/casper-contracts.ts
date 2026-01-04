// casper-contracts.ts - SDK v2.15.x compatible
// Using the Contracts.Contract approach for calling stored contracts

import {
  CasperClient,
  Contracts,
  RuntimeArgs,
  CLValueBuilder,
  CLPublicKey,
  DeployUtil,
} from 'casper-js-sdk';

// Your deployed contract hashes on testnet
export const CONTRACTS = {
  CASPER_STAKE: "hash-ca2e26646326c0157f95196b625bce0f69cf94c1b38c2a15d7f3ec51e8c82d45",
  CS_CSPR_TOKEN: "hash-572eccbaa63dccac06d3f5efd4ede01b63bb73389f0ef3d282965e9f92b12049",
  PRIVACY_MODULE: "hash-9e449a0b3deef35500f842f30873bb3569e093a3956c54f4ab556faed0f50761",
  THRESHOLD_MODULE: "hash-1ee0ec63136085bb65e4c0cd6c0f07705c1dbaae54180af869f012d67c77b142",
};

const RPC_URL = "https://rpc.testnet.casperlabs.io/rpc";

/**
 * Create a Deploy to call the "stake" entry point on CasperStake contract
 * Returns the deploy as JSON for wallet signing
 */
export function createStakeDeployJson(
  publicKeyHex: string,
  amountMotes: string
): object {
  const casperClient = new CasperClient(RPC_URL);
  const contract = new Contracts.Contract(casperClient);
  
  // Set the contract hash
  contract.setContractHash(CONTRACTS.CASPER_STAKE);
  
  // Create runtime arguments
  const runtimeArgs = RuntimeArgs.fromMap({
    "amount": CLValueBuilder.u512(amountMotes)
  });
  
  const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
  const paymentAmount = "10000000000"; // 10 CSPR for gas
  
  // Create the deploy (without signing - wallet will sign)
  const deploy = contract.callEntrypoint(
    "stake",
    runtimeArgs,
    senderPublicKey,
    "casper-test",
    paymentAmount,
    [] // No signers - wallet will sign
  );
  
  // Convert to JSON for wallet
  return DeployUtil.deployToJson(deploy);
}

/**
 * Create a Deploy to call the "request_unstake" entry point
 * Returns the deploy as JSON for wallet signing
 */
export function createUnstakeDeployJson(
  publicKeyHex: string,
  amountMotes: string
): object {
  const casperClient = new CasperClient(RPC_URL);
  const contract = new Contracts.Contract(casperClient);
  
  contract.setContractHash(CONTRACTS.CASPER_STAKE);
  
  const runtimeArgs = RuntimeArgs.fromMap({
    "amount": CLValueBuilder.u512(amountMotes)
  });
  
  const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
  const paymentAmount = "10000000000"; // 10 CSPR for gas
  
  const deploy = contract.callEntrypoint(
    "request_unstake",
    runtimeArgs,
    senderPublicKey,
    "casper-test",
    paymentAmount,
    []
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