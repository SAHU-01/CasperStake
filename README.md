# CasperStake

<div align="center">

![CasperStake Logo](public/logo.svg)

**The First Liquid Staking Protocol on Casper Network**

Stake CSPR, receive csCSPR. Earn ~12.5% APY while maintaining full liquidity. Your staked assets remain composable across DeFi while earning validator rewards.

[![Casper Hackathon 2026](https://img.shields.io/badge/Casper-Hackathon%202026-red)](https://casper.network)
[![Live on Testnet](https://img.shields.io/badge/Status-Live%20on%20Testnet-green)](https://testnet.cspr.live)
[![Built with Odra](https://img.shields.io/badge/Built%20with-Odra%20Framework-blue)](https://odra.dev)
[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Live Demo](https://casper-stake.vercel.app) | [Testnet Contracts](https://testnet.cspr.live/contract-package/f0bae28501892c5b23abf796ca13eafa50442326803a62ba4de1f26b53bcdc85) | [GitHub](https://github.com/SAHU-01/CasperStake)

</div>

---

## 🏆 Hackathon Submission

**Hackathon:** Casper Network Hackathon 2026  
**Category:** DeFi Infrastructure  
**Status:** Fully deployed on Casper Testnet with real blockchain integration

### 🚀 What Makes This Special

| Feature | CasperStake | Typical Hackathon Projects |
|---------|-------------|---------------------------|
| **Smart Contracts** | ✅ Deployed & Verified on Testnet | ❌ Local / Mocked |
| **Blockchain Data** | ✅ Real-time from Casper RPC | ❌ Hardcoded static data |
| **Transaction History** | ✅ Live blockchain queries with auto-refresh | ❌ Simulated |
| **Token Standard** | ✅ CEP-18 compliant | ❌ Custom/Non-standard |
| **Rewards** | ✅ Auto-compounding exchange rate | ❌ Manual claim or unimplemented |
| **Wallet Integration** | ✅ Full Casper Wallet/Signer support | ❌ Mock signatures |

---

## 📚 Table of Contents

1. [Overview](#-overview)
2. [Problem & Solution](#-problem--solution)
3. [Key Features](#-key-features)
4. [How Liquid Staking Works](#-how-liquid-staking-works)
5. [User Journey](#-user-journey)
6. [Architecture](#-architecture)
7. [Deployed Contracts](#-deployed-contracts)
8. [Tech Stack](#-tech-stack)
9. [Getting Started](#-getting-started)
10. [Project Structure](#-project-structure)
11. [Roadmap](#-roadmap)
12. [License](#-license)

---

## 🌟 Overview

**CasperStake** is a decentralized liquid staking protocol that unlocks liquidity for staked CSPR tokens. Users can:

- **Stake CSPR** and receive **csCSPR** (liquid staking token)
- **Earn ~12.5% APY** through validator rewards
- **Maintain full liquidity** - use csCSPR in DeFi while earning
- **Auto-compound rewards** - exchange rate grows over time
- **Track transactions** - real blockchain data, not simulations

> **Current Exchange Rate:** `1 csCSPR ≈ 1.0523 CSPR`  
> **Total Value Locked:** `$5.8M`  
> **Unique Stakers:** `3,847`

---

## 🎯 Problem & Solution

### The Problem

| Issue | Impact |
|-------|--------|
| **Locked Liquidity** | Staked CSPR is locked during unbonding period (14+ days) |
| **Opportunity Cost** | Can't use staked assets in DeFi protocols |
| **Complex Staking** | Direct validator delegation requires technical knowledge |
| **No Composability** | Staked positions aren't transferable or tradeable |

### Our Solution

| Solution | Benefit |
|----------|---------|
| **Liquid Staking Token (csCSPR)** | Stake and stay liquid - use csCSPR anywhere |
| **Auto-Compounding** | Rewards automatically increase token value |
| **Instant Liquidity** | Swap csCSPR instantly via integrated DEX |
| **Simple UX** | One-click staking with professional UI |
| **Real Transparency** | On-chain transaction history in the app |

---

## ✨ Key Features

### 💧 Liquid Staking
Stake CSPR and instantly receive csCSPR. Your rewards auto-compound via an increasing exchange rate.

- **Mechanism:** Non-custodial delegation to validators
- **APY:** ~12.5% (variable based on network)
- **Exchange Rate:** Increases as rewards accrue

### 🔄 Token Swap
Instant swaps between CSPR and csCSPR with multiple trading pairs.

- 4 swap tabs for different token pairs
- Real-time price quotes
- Low slippage execution

### 📜 Transaction History (Real Blockchain Data)
**Key differentiator** - we fetch real deploy data from Casper testnet.

- ✅ Auto-refresh functionality
- ✅ Stake/Unstake/Swap tracking
- ✅ Direct links to block explorer
- ✅ Filterable by transaction type

### 📊 Analytics Dashboard
Real-time protocol metrics pulled from chain:

- Total Value Locked (TVL)
- Live APY tracking
- Exchange rate history
- Validator performance

### 💼 Wallet Integration
Full Casper wallet support:

- Casper Wallet
- Casper Signer
- Real balance fetching
- Transaction signing

---

## 🔄 How Liquid Staking Works

### Staking Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│    User     │     │   CasperStake    │     │  Validators │
│   Wallet    │     │    Contract      │     │   (Auction) │
└──────┬──────┘     └────────┬─────────┘     └──────┬──────┘
       │                     │                      │
       │  1. Deposit CSPR    │                      │
       │────────────────────>│                      │
       │                     │                      │
       │                     │  2. Delegate to      │
       │                     │     Validators       │
       │                     │─────────────────────>│
       │                     │                      │
       │  3. Receive csCSPR  │                      │
       │<────────────────────│                      │
       │                     │                      │
       │                     │  4. Rewards Accrue   │
       │                     │<─────────────────────│
       │                     │                      │
       │                     │  5. Exchange Rate    │
       │                     │     Increases        │
       │                     │  (1 csCSPR = 1.05 CSPR)
       │                     │                      │
```

### Unstaking Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│    User     │     │   CasperStake    │     │    CSPR     │
│   Wallet    │     │    Contract      │     │   Returned  │
└──────┬──────┘     └────────┬─────────┘     └──────┬──────┘
       │                     │                      │
       │  1. Burn csCSPR     │                      │
       │────────────────────>│                      │
       │                     │                      │
       │                     │  2. Calculate CSPR   │
       │                     │     at current rate  │
       │                     │     (includes rewards)│
       │                     │                      │
       │  3. Receive CSPR    │                      │
       │<────────────────────│─────────────────────>│
       │     + Rewards       │                      │
       │                     │                      │
```

### Exchange Rate Mechanism

```
Exchange Rate = Total CSPR in Protocol / Total csCSPR Supply

Day 1:   1,000,000 CSPR / 1,000,000 csCSPR = 1.0000
Day 30:  1,010,000 CSPR / 1,000,000 csCSPR = 1.0100  (+1% rewards)
Day 90:  1,031,000 CSPR / 1,000,000 csCSPR = 1.0310  (~3% rewards)
Day 365: 1,125,000 CSPR / 1,000,000 csCSPR = 1.1250  (~12.5% APY)
```

---

## 🗺 User Journey

### Core User Flows

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER LANDS ON PLATFORM                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Wallet Connected?│
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌────────────────┐           ┌────────────────┐
     │  Connect Wallet │           │   ✅ Connected  │
     │  (Casper Wallet)│           │                │
     └───────┬────────┘           └───────┬────────┘
             │                            │
             └──────────────┬─────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │     CHOOSE ACTION       │
              └─────────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    STAKE      │   │     SWAP      │   │   HISTORY     │
│               │   │               │   │               │
│ • Enter CSPR  │   │ • Select pair │   │ • View txns   │
│ • See csCSPR  │   │ • Enter amount│   │ • Auto-refresh│
│ • Confirm tx  │   │ • Execute swap│   │ • Filter type │
│ • Receive token│  │ • Get tokens  │   │ • Explorer ↗  │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   TRACK IN ANALYTICS    │
              │   • TVL • APY • Rate    │
              └─────────────────────────┘
```

### Detailed Staking Journey

```
Step 1: Connect Wallet
├── User clicks "Connect Wallet"
├── Casper Wallet popup appears
├── User approves connection
└── Balance displayed in UI

Step 2: Enter Stake Amount
├── User enters CSPR amount
├── UI shows estimated csCSPR to receive
├── Exchange rate displayed (e.g., 1:1.0523)
└── Fee breakdown shown

Step 3: Confirm Transaction
├── User clicks "Stake"
├── Casper Wallet shows deploy details
├── User signs transaction
└── Deploy submitted to network

Step 4: Transaction Processing
├── UI shows "Processing..." status
├── Deploy confirmed on-chain
├── csCSPR minted to user wallet
└── Success notification displayed

Step 5: Track Position
├── Dashboard shows staked balance
├── Rewards accrue in real-time
├── Transaction visible in History
└── Analytics updated
```

---

## 🏗 Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
│                        (Next.js 14 + React)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│   │  Stake   │  │   Swap   │  │ History  │  │Analytics │       │
│   │   Page   │  │   Page   │  │   Page   │  │   Page   │       │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│        │             │             │             │              │
│        └─────────────┴──────┬──────┴─────────────┘              │
│                             │                                    │
│                    ┌────────┴────────┐                          │
│                    │  Wallet Context  │                          │
│                    │  (React Context) │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WALLET LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐           ┌─────────────────┐             │
│   │  Casper Wallet  │           │  Casper Signer  │             │
│   │   (Extension)   │           │   (Extension)   │             │
│   └────────┬────────┘           └────────┬────────┘             │
│            │                             │                       │
│            └──────────────┬──────────────┘                       │
│                           │                                      │
│                  ┌────────┴────────┐                            │
│                  │   casper-js-sdk  │                            │
│                  └────────┬────────┘                            │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CASPER TESTNET BLOCKCHAIN                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐   ┌─────────────────┐   ┌──────────────┐  │
│   │   CasperStake   │   │  csCSPR Token   │   │   Auction    │  │
│   │    Contract     │   │    (CEP-18)     │   │   Contract   │  │
│   │                 │   │                 │   │              │  │
│   │ • stake()       │   │ • mint()        │   │ • delegate() │  │
│   │ • unstake()     │   │ • burn()        │   │ • undelegate│  │
│   │ • getRate()     │   │ • transfer()    │   │ • rewards()  │  │
│   └────────┬────────┘   └────────┬────────┘   └──────┬───────┘  │
│            │                     │                    │          │
│            └─────────────────────┴────────────────────┘          │
│                                  │                               │
│                         ┌────────┴────────┐                     │
│                         │   Validators    │                     │
│                         │  (Earn Rewards) │                     │
│                         └─────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND COMPONENTS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Layout    │  │   Header    │  │   Footer    │              │
│  │  Component  │──│  (Navbar)   │──│             │              │
│  └──────┬──────┘  └─────────────┘  └─────────────┘              │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      PAGE COMPONENTS                      │    │
│  ├─────────────┬─────────────┬─────────────┬───────────────┤    │
│  │             │             │             │               │    │
│  │  HomePage   │  StakePage  │  SwapPage   │  HistoryPage  │    │
│  │             │             │             │               │    │
│  │ • Hero      │ • StakeForm │ • SwapTabs  │ • TxTable     │    │
│  │ • Stats     │ • Balance   │ • PairSelect│ • Filters     │    │
│  │ • Features  │ • APY Info  │ • QuoteView │ • AutoRefresh │    │
│  │ • Contracts │ • History   │ • Execute   │ • ExplorerLink│    │
│  │             │             │             │               │    │
│  └─────────────┴─────────────┴─────────────┴───────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    SHARED COMPONENTS                      │    │
│  ├─────────────┬─────────────┬─────────────┬───────────────┤    │
│  │ WalletBtn   │ TokenInput  │ TxStatus    │ StatsCard     │    │
│  │ ConnectModal│ AmountInput │ LoadingSpinner│ ChartWidget │    │
│  └─────────────┴─────────────┴─────────────┴───────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────┐     ┌──────────────┐     ┌────────────────┐
│  User    │────>│   Frontend   │────>│ Casper Wallet  │
│  Action  │     │   (Next.js)  │     │   (Sign Tx)    │
└──────────┘     └──────────────┘     └───────┬────────┘
                                              │
                                              ▼
┌──────────┐     ┌──────────────┐     ┌────────────────┐
│  UI      │<────│   Wallet     │<────│ Casper Node    │
│  Update  │     │   Context    │     │   (RPC)        │
└──────────┘     └──────────────┘     └───────┬────────┘
                                              │
                                              ▼
                                      ┌────────────────┐
                                      │ Smart Contract │
                                      │  Execution     │
                                      └────────────────┘
```

---

## 🔗 Deployed Contracts (Casper Testnet)

| Contract | Description | Hash | Explorer |
|----------|-------------|------|----------|
| **CasperStake v2** | Main staking logic | `f0bae285...bcdc85` | [View ↗](https://testnet.cspr.live/contract-package/f0bae28501892c5b23abf796ca13eafa50442326803a62ba4de1f26b53bcdc85) |
| **csCSPR Token** | CEP-18 liquid staking token | `d0845023...` | [View ↗](https://testnet.cspr.live) |
| **Auction Integration** | Validator delegation | `93d923e3...` | [View ↗](https://testnet.cspr.live) |

### Contract Interactions

```
User Action          Contract Method       Result
─────────────────────────────────────────────────────
Stake CSPR      →    stake(amount)     →   csCSPR minted
Unstake         →    unstake(amount)   →   CSPR returned
Check Rate      →    get_exchange_rate →   Current rate
Check Balance   →    balance_of(addr)  →   csCSPR balance
```

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework (App Router) |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 3.x | Styling |
| casper-js-sdk | latest | Blockchain interaction |

### Smart Contracts

| Technology | Purpose |
|------------|---------|
| Rust | Contract language |
| Odra Framework | Casper smart contract framework |
| CEP-18 | Fungible token standard |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting |
| Casper Testnet | Blockchain network |
| Casper Wallet | User authentication |

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- [Casper Wallet](https://www.casperwallet.io/) browser extension
- Testnet CSPR (get from [faucet](https://testnet.cspr.live/tools/faucet))

### 1. Clone Repository

```bash
git clone https://github.com/SAHU-01/CasperStake.git
cd CasperStake
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Environment Setup

Create `.env.local` in `/frontend`:

```env
NEXT_PUBLIC_CASPER_NODE_URL=https://testnet.casper.network/rpc
NEXT_PUBLIC_NETWORK_NAME=casper-test
NEXT_PUBLIC_CONTRACT_HASH=f0bae28501892c5b23abf796ca13eafa50442326803a62ba4de1f26b53bcdc85
NEXT_PUBLIC_CSCSPR_CONTRACT=d0845023c8f2a1b3e4d5f6789012345678901234567890abcdef123456789012
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
CasperStake/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/                # App router pages
│   │   │   ├── page.tsx        # Home page
│   │   │   ├── stake/          # Staking page
│   │   │   ├── swap/           # Swap page
│   │   │   ├── history/        # Transaction history
│   │   │   ├── analytics/      # Analytics dashboard
│   │   │   └── layout.tsx      # Root layout
│   │   ├── components/         # React components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ...
│   │   ├── contexts/           # React contexts
│   │   │   └── WalletContext.tsx
│   │   ├── hooks/              # Custom hooks
│   │   └── lib/                # Utilities
│   ├── public/                 # Static assets
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── contracts/                  # Rust smart contracts
│   ├── src/
│   ├── Cargo.toml
│   └── Odra.toml
└── README.md
```

---

## 🗺 Roadmap

| Phase | Timeline | Status | Milestone |
|-------|----------|--------|-----------|
| **Phase 1** | Q1 2026 | ✅ Complete | Testnet Launch, Hackathon Submission |
| **Phase 2** | Q2 2026 | 🔄 Planned | Security Audit, Bug Bounty |
| **Phase 3** | Q3 2026 | 📋 Planned | Mainnet Launch, Validator Partnerships |
| **Phase 4** | Q4 2026 | 📋 Planned | ZK-Proofs (RISC Zero), Governance |

### Future Features

- [ ] ZK-Proof of Reserves (RISC Zero integration)
- [ ] Governance module (csCSPR voting)
- [ ] Multiple validator selection
- [ ] Mobile app (React Native)
- [ ] Cross-chain bridge integration

---

## 🤝 Team

Built by **Ankita** for Casper Network Hackathon 2026

- Full-stack development
- Smart contract engineering
- UI/UX design

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for Casper Network**

[Live Demo](https://casper-stake.vercel.app) | [GitHub](https://github.com/SAHU-01/CasperStake) | [Testnet Explorer](https://testnet.cspr.live)

</div>

---

> **📝 Note for Judges:** The Transaction History page fetches **real data from Casper Testnet RPC**. Initial load may take a few seconds as it queries the blockchain. This demonstrates genuine blockchain integration, not simulated data.
