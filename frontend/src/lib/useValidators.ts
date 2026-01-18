// lib/useValidators.ts
"use client";

import { useState, useEffect } from "react";

export interface Validator {
  id: string;
  name: string;
  publicKey: string;
  apy: number;
  fee: number;
  delegators: number;
  totalStake: string;
  status: "active" | "inactive";
  recommended: boolean;
  icon: string;
  description?: string;
}

// Fallback validators to show if RPC fails
const FALLBACK_VALIDATORS: Validator[] = [
  {
    id: "01d9bf21",
    name: "01d9bf21...900c",
    publicKey: "01d9bf2148748a85c89da5aad8ee0b0fc2d105fd39d41a4c796536354f0ae2900c",
    apy: 12.0,
    fee: 5,
    delegators: 245,
    totalStake: "52.3M",
    status: "active",
    recommended: true,
    icon: "🏆",
  },
  {
    id: "01aa17f7",
    name: "01aa17f7...c7a0",
    publicKey: "01aa17f7b9889480b1bd34c3f94f263b229c7a9b01dd4dda19c2dd1d38d176c7a0",
    apy: 11.8,
    fee: 8,
    delegators: 189,
    totalStake: "38.1M",
    status: "active",
    recommended: false,
    icon: "🥈",
  },
  {
    id: "01e3d339",
    name: "01e3d339...8d51",
    publicKey: "01e3d3392c2e0b943abe709b25de5c353e5e1e9d95c7a76e3dd343d8aa1aa08d51",
    apy: 11.5,
    fee: 10,
    delegators: 156,
    totalStake: "29.7M",
    status: "active",
    recommended: false,
    icon: "🥉",
  },
  {
    id: "0197f6b2",
    name: "0197f6b2...8d61",
    publicKey: "01197f6b23e16c8532c6abc838facd5ea789be0c76b2920334039bfa8b3d368d61",
    apy: 11.2,
    fee: 10,
    delegators: 123,
    totalStake: "21.4M",
    status: "active",
    recommended: false,
    icon: "⭐",
  },
  {
    id: "012a1732",
    name: "012a1732...0876",
    publicKey: "012a1732addc639ea43a89e25d3ad912e40232156dcaa4b9edfc709f43d2fb0876",
    apy: 11.0,
    fee: 12,
    delegators: 98,
    totalStake: "15.8M",
    status: "active",
    recommended: false,
    icon: "⭐",
  },
  {
    id: "auto",
    name: "Auto-Distribute",
    publicKey: "",
    apy: 11.8,
    fee: 5,
    delegators: 0,
    totalStake: "",
    status: "active",
    recommended: false,
    icon: "🔀",
    description: "Distribute across top validators",
  },
];

function formatStake(motes: bigint): string {
  const cspr = Number(motes) / 1_000_000_000;
  if (cspr >= 1_000_000_000) return `${(cspr / 1_000_000_000).toFixed(2)}B`;
  if (cspr >= 1_000_000) return `${(cspr / 1_000_000).toFixed(2)}M`;
  if (cspr >= 1_000) return `${(cspr / 1_000).toFixed(2)}K`;
  return cspr.toFixed(2);
}

function truncateKey(key: string): string {
  if (!key || key.length < 14) return key;
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

function calculateAPY(delegationRate: number): number {
  const baseAPY = 12;
  const commission = delegationRate;
  return Math.round((baseAPY * (100 - commission)) / 100 * 10) / 10;
}

function getIcon(rank: number): string {
  if (rank === 0) return "🏆";
  if (rank === 1) return "🥈";
  if (rank === 2) return "🥉";
  if (rank < 10) return "⭐";
  return "🔷";
}

export function useValidators() {
  const [validators, setValidators] = useState<Validator[]>(FALLBACK_VALIDATORS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchValidators() {
      try {
        setLoading(true);
        setError(null);

        // Use the API proxy
        const response = await fetch("/api/casper", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "state_get_auction_info",
            params: [],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        
        // Debug logging
        console.log("Auction info response:", data);
        
        if (data.error) {
          throw new Error(data.error.message || "RPC Error");
        }

        // Handle both old and new API response formats
        const auctionState = data.result?.auction_state || data.result?.value?.auction_state;
        const bids = auctionState?.bids || [];
        
        console.log("Found bids:", bids.length);

        if (bids.length === 0) {
          console.log("No bids found, using fallback validators");
          setValidators(FALLBACK_VALIDATORS);
          return;
        }

        const parsedValidators: Validator[] = bids
          .filter((bid: any) => {
            const bidData = bid.bid || bid;
            return !bidData.inactive;
          })
          .map((bid: any) => {
            const publicKey = bid.public_key;
            const bidData = bid.bid || bid;
            const delegationRate = bidData.delegation_rate || 0;
            const stakedAmount = BigInt(bidData.staked_amount || "0");
            const delegators = bidData.delegators?.length || 0;

            return {
              id: publicKey?.slice(0, 8) || "unknown",
              name: truncateKey(publicKey || "Unknown"),
              publicKey: publicKey || "",
              apy: calculateAPY(delegationRate),
              fee: delegationRate,
              delegators: delegators,
              totalStake: formatStake(stakedAmount),
              totalStakeRaw: stakedAmount,
              status: "active" as const,
              recommended: false,
              icon: "🔷",
            };
          })
          .sort((a: any, b: any) => {
            const aStake = a.totalStakeRaw || BigInt(0);
            const bStake = b.totalStakeRaw || BigInt(0);
            return Number(bStake - aStake);
          });

        // Add icons and recommended flag
        parsedValidators.forEach((v: Validator, i: number) => {
          v.icon = getIcon(i);
          if (i === 0) v.recommended = true;
        });

        // Add auto-distribute option at the end
        const autoDistribute: Validator = {
          id: "auto",
          name: "Auto-Distribute",
          publicKey: "",
          apy: 11.8,
          fee: 5,
          delegators: 0,
          totalStake: "",
          status: "active",
          recommended: false,
          icon: "🔀",
          description: "Distribute across top validators",
        };

        const finalValidators = parsedValidators.length > 0 
          ? [...parsedValidators.slice(0, 19), autoDistribute]
          : FALLBACK_VALIDATORS;
        
        console.log("Setting validators:", finalValidators.length);
        setValidators(finalValidators);
        
      } catch (err: any) {
        console.error("Failed to fetch validators:", err);
        setError(err.message || "Failed to fetch validators");
        // Keep fallback validators on error
        setValidators(FALLBACK_VALIDATORS);
      } finally {
        setLoading(false);
      }
    }

    fetchValidators();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchValidators, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { validators, loading, error };
}