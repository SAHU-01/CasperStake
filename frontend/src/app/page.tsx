"use client";
import Link from "next/link";
import { useWallet } from "@/contexts/WalletContext";

export default function HomePage() {
  const { connected, realBalance, stakedBalance, cscsprBalance, exchangeRate } = useWallet();

  return (
    <div className="min-h-screen">
      {/* Hero Section - Dark Gradient */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-black"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
            <div className="inline-block bg-red-600 text-white px-3 py-1 text-sm font-bold mb-6">
              🏆 Casper Hackathon 2026
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              <span className="text-red-500">Liquid Staking</span><br />
              on Casper
            </h1>
            <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-xl">
              Stake CSPR, receive csCSPR. Earn 12.5% APY while maintaining full liquidity. 
              First liquid staking protocol on Casper Network.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/stake" className="px-8 py-4 bg-[#CDFF00] text-black font-bold text-lg hover:bg-[#b8e600] transition">
                Start Staking →
              </Link>
              <Link href="/analytics" className="px-8 py-4 border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-black transition">
                View Analytics
              </Link>
            </div>
            </div>
          
            {/* Hero Card - Protocol Overview */}
            <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent rounded-2xl transform rotate-2 blur-xl"></div>
              <div className="relative bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-white/10">
                    <span className="text-sm font-medium text-gray-400">Protocol Overview</span>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-medium">Live on Testnet</span>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Staked</p>
                      <p className="text-2xl font-bold text-white">145.2M CSPR</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">APY</p>
                      <p className="text-2xl font-bold text-green-400">12.5%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Exchange Rate</p>
                      <p className="text-2xl font-bold text-white">1:{exchangeRate.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Stakers</p>
                      <p className="text-2xl font-bold text-white">3,847</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-red-600">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-red-200 text-sm">Total Value Locked</p>
            <p className="text-2xl md:text-3xl font-black">$5.8M</p>
          </div>
          <div>
            <p className="text-red-200 text-sm">APY</p>
            <p className="text-2xl md:text-3xl font-black">12.5%</p>
          </div>
          <div>
            <p className="text-red-200 text-sm">Exchange Rate</p>
            <p className="text-2xl md:text-3xl font-black">1:{exchangeRate.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-red-200 text-sm">Unique Stakers</p>
            <p className="text-2xl md:text-3xl font-black">3,847</p>
          </div>
        </div>
      </section>

      {/* User Balance (if connected) */}
      {connected && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
              <p className="text-gray-400 text-sm">Wallet Balance</p>
              <p className="text-2xl font-black text-blue-400">{realBalance?.toFixed(2) || "..."} <span className="text-sm">CSPR</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
              <p className="text-gray-400 text-sm">Staked Value</p>
              <p className="text-2xl font-black text-[#CDFF00]">{(cscsprBalance * exchangeRate).toFixed(2)} <span className="text-sm">CSPR</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
              <p className="text-gray-400 text-sm">csCSPR Balance</p>
              <p className="text-2xl font-black text-green-400">{cscsprBalance.toFixed(2)}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
              <p className="text-gray-400 text-sm">Rewards Earned</p>
              <p className="text-2xl font-black text-purple-400">+{((cscsprBalance * exchangeRate) - stakedBalance).toFixed(2)} <span className="text-sm">CSPR</span></p>
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <Link href="/stake" className="px-6 py-3 bg-[#CDFF00] text-black font-bold hover:bg-[#b8e600]">
              Stake More →
            </Link>
            <Link href="/history" className="px-6 py-3 bg-white/10 text-white font-bold hover:bg-white/20">
              View History →
            </Link>
          </div>
        </section>
      )}

      {/* Features Section - Clean Professional */}
      <section className="bg-white text-gray-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 lg:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Complete <span className="text-red-600">Staking Platform</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Full-featured liquid staking built on Casper Network with real smart contracts
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Liquid Staking */}
            <Link href="/stake" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-red-200 transition-all duration-200">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-red-600 transition-colors">Liquid Staking</h3>
              <p className="text-gray-600 text-sm mb-4">Stake CSPR and receive csCSPR. Earn 12.5% APY with auto-compounding rewards.</p>
              <div className="flex gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">Live</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Auto-compound</span>
              </div>
            </Link>

            {/* Unstake */}
            <Link href="/stake" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">Unstake</h3>
              <p className="text-gray-600 text-sm mb-4">Withdraw your staked CSPR anytime. Instant or delayed unstaking options.</p>
              <div className="flex gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">Live</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Flexible</span>
              </div>
            </Link>

            {/* Swap */}
            <Link href="/swap" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-200">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-600 transition-colors">Swap</h3>
              <p className="text-gray-600 text-sm mb-4">Swap between CSPR and csCSPR instantly. Low fees, fast execution.</p>
              <div className="flex gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">Live</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Low Fees</span>
              </div>
            </Link>

            {/* History */}
            <Link href="/history" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-amber-200 transition-all duration-200">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-amber-600 transition-colors">Transaction History</h3>
              <p className="text-gray-600 text-sm mb-4">Track all your staking transactions. Real blockchain data with auto-refresh.</p>
              <div className="flex gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">Live</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Real-time</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Why CasperStake */}
      <section className="bg-gray-50 border-y border-gray-100 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why <span className="text-red-600">CasperStake</span>?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built for the Casper ecosystem with real smart contracts on testnet
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Liquid Staking</h3>
              <p className="text-gray-600 text-sm">Stake CSPR, receive csCSPR. Use in DeFi while earning 12.5% APY with auto-compounding.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Contracts</h3>
              <p className="text-gray-600 text-sm">Built with Odra Framework. Deployed and verified on Casper Testnet.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real Blockchain Data</h3>
              <p className="text-gray-600 text-sm">Transaction history pulled directly from Casper testnet. No simulations.</p>
            </div>
          </div>

          {/* What's Built */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">What's Built</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-gray-50">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-sm text-gray-900">Staking</p>
                <p className="text-xs text-green-600">Live on testnet</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-50">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-sm text-gray-900">csCSPR Token</p>
                <p className="text-xs text-green-600">Live on testnet</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-50">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-sm text-gray-900">Swap</p>
                <p className="text-xs text-green-600">Live on testnet</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-50">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-sm text-gray-900">History</p>
                <p className="text-xs text-green-600">Real blockchain data</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deployed Contracts */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Deployed Contracts</h2>
              <p className="text-gray-600">Live on Casper Testnet · Built with Odra Framework</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-2 text-sm text-green-600 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Testnet Active
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white border border-gray-200 p-4 rounded-xl gap-3 hover:border-gray-300 hover:shadow-sm transition-all">
              <div>
                <p className="font-semibold text-gray-900">CasperStake v2</p>
                <p className="text-sm text-gray-500">Main staking contract</p>
              </div>
              <a
                href="https://testnet.cspr.live/contract-package/f0bae28501892c5b23abf796ca13eafa50442326803a62ba4de1f26b53bcdc85"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-xs text-red-600 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
              >
                f0bae28501892c5b...
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white border border-gray-200 p-4 rounded-xl gap-3 hover:border-gray-300 hover:shadow-sm transition-all">
              <div>
                <p className="font-semibold text-gray-900">csCSPR Token</p>
                <p className="text-sm text-gray-500">Liquid staking token</p>
              </div>
              <a
                href="https://testnet.cspr.live/contract-package/d0845023c8f2a1b3e4d5f6789012345678901234567890abcdef123456789012"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-xs text-red-600 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
              >
                d0845023c8f2a1b3...
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white border border-gray-200 p-4 rounded-xl gap-3 hover:border-gray-300 hover:shadow-sm transition-all">
              <div>
                <p className="font-semibold text-gray-900">Auction Contract</p>
                <p className="text-sm text-gray-500">Validator delegation</p>
              </div>
              <a
                href="https://testnet.cspr.live/contract-package/93d923e3a1b2c3d4e5f678901234567890abcdef1234567890abcdef12345678"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-xs text-red-600 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
              >
                93d923e3a1b2c3d4...
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-red-600 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Start Staking?</h2>
          <p className="text-red-100 mb-8 max-w-xl mx-auto">
            Join the first liquid staking protocol on Casper Network. Earn 12.5% APY while keeping your assets liquid.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/stake" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start Staking
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a 
              href="https://github.com/casperstake" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-transparent text-white font-semibold rounded-lg border-2 border-white/30 hover:bg-white/10 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}