export interface SwapRoute {
  from: string;
  to: string;
  type: 'stake' | 'unstake' | 'wrap' | 'unwrap' | 'dex_swap' | 'instant';
  status: 'live' | 'coming';
  fee: number; // percentage
  gas: number; // in CSPR
  description: string;
}

export const SWAP_ROUTES: SwapRoute[] = [
  {
    from: 'CSPR',
    to: 'csCSPR',
    type: 'stake',
    status: 'live',
    fee: 0,
    gas: 5,
    description: 'Stake CSPR to receive liquid staking token',
  },
  {
    from: 'csCSPR',
    to: 'CSPR',
    type: 'unstake',
    status: 'live',
    fee: 0,
    gas: 5,
    description: 'Unstake csCSPR (14-hour unbonding)',
  },
  {
    from: 'CSPR',
    to: 'WCSPR',
    type: 'wrap',
    status: 'coming',
    fee: 0,
    gas: 3,
    description: 'Wrap CSPR for DEX compatibility',
  },
  {
    from: 'WCSPR',
    to: 'CSPR',
    type: 'unwrap',
    status: 'coming',
    fee: 0,
    gas: 3,
    description: 'Unwrap WCSPR back to CSPR',
  },
  {
    from: 'csCSPR',
    to: 'stCSPR',
    type: 'dex_swap',
    status: 'coming',
    fee: 0.3,
    gas: 15,
    description: 'Swap between liquid staking tokens via DEX',
  },
  {
    from: 'csCSPR',
    to: 'lCSPR',
    type: 'dex_swap',
    status: 'coming',
    fee: 0.3,
    gas: 15,
    description: 'Swap between liquid staking tokens via DEX',
  },
  {
    from: 'csCSPR',
    to: 'CSPR',
    type: 'instant',
    status: 'coming',
    fee: 0.5,
    gas: 10,
    description: 'Instant unstake via liquidity pool (skip 7-day wait)',
  },
];

export function findRoute(from: string, to: string): SwapRoute | undefined {
  return SWAP_ROUTES.find(r => r.from === from && r.to === to);
}

export function getAvailableOutputs(from: string): string[] {
  return SWAP_ROUTES.filter(r => r.from === from).map(r => r.to);
}

export function isRouteLive(from: string, to: string): boolean {
  const route = findRoute(from, to);
  return route?.status === 'live';
}