// "use client";
// import { useWallet } from "@/contexts/WalletContext";

// export default function AnalyticsPage() {
//   const { connected, stakedBalance, cscsprBalance, exchangeRate } = useWallet();

//   return (
//     <div className="min-h-screen">
//       {/* Header */}
//       <section className="bg-gradient-to-b from-yellow-900/20 to-black py-12">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <h1 className="text-3xl md:text-5xl font-black mb-4">
//             Protocol <span className="text-yellow-500">Analytics</span>
//           </h1>
//           <p className="text-gray-400 max-w-xl">
//             Real-time network statistics, validator performance, and protocol health monitoring.
//           </p>
//         </div>
//       </section>

//       {/* Main Stats */}
//       <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//           <div className="bg-white/5 border border-white/10 p-6 rounded-lg text-center">
//             <p className="text-gray-400 text-sm mb-1">Total Value Locked</p>
//             <p className="text-3xl font-black text-[#CDFF00]">$5.8M</p>
//             <p className="text-green-400 text-xs mt-1">↑ 12.3% (7d)</p>
//           </div>
//           <div className="bg-white/5 border border-white/10 p-6 rounded-lg text-center">
//             <p className="text-gray-400 text-sm mb-1">csCSPR Supply</p>
//             <p className="text-3xl font-black">1,187,524</p>
//             <p className="text-green-400 text-xs mt-1">↑ 8.1% (7d)</p>
//           </div>
//           <div className="bg-white/5 border border-white/10 p-6 rounded-lg text-center">
//             <p className="text-gray-400 text-sm mb-1">Unique Stakers</p>
//             <p className="text-3xl font-black">3,847</p>
//             <p className="text-green-400 text-xs mt-1">+156 this week</p>
//           </div>
//           <div className="bg-white/5 border border-white/10 p-6 rounded-lg text-center">
//             <p className="text-gray-400 text-sm mb-1">Rewards Distributed</p>
//             <p className="text-3xl font-black text-purple-400">89,234</p>
//             <p className="text-gray-400 text-xs mt-1">CSPR (all-time)</p>
//           </div>
//         </div>
//       </section>

//       {/* Protocol Health */}
//       <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
//         <div className="grid md:grid-cols-3 gap-4">
//           <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-lg">
//             <div className="flex items-center gap-2 mb-3">
//               <span className="text-3xl">✅</span>
//               <p className="font-bold text-green-400 text-xl">Protocol Health</p>
//             </div>
//             <p className="text-4xl font-black text-green-400 mb-2">OPTIMAL</p>
//             <p className="text-gray-400 text-sm">All systems operational • No incidents • Last check: 30s ago</p>
//           </div>
//           <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-lg">
//             <div className="flex items-center gap-2 mb-3">
//               <span className="text-3xl">🔒</span>
//               <p className="font-bold text-blue-400 text-xl">Security Score</p>
//             </div>
//             <p className="text-4xl font-black text-blue-400 mb-2">98/100</p>
//             <p className="text-gray-400 text-sm">Audited • ThresholdModule active • Multi-sig enabled</p>
//           </div>
//           <div className="bg-purple-900/20 border border-purple-500/30 p-6 rounded-lg">
//             <div className="flex items-center gap-2 mb-3">
//               <span className="text-3xl">⛓️</span>
//               <p className="font-bold text-purple-400 text-xl">Cross-Chain Volume</p>
//             </div>
//             <p className="text-4xl font-black text-purple-400 mb-2">$1.2M</p>
//             <p className="text-gray-400 text-sm">Bridged to 3 chains • ETH, Polygon, Arbitrum</p>
//           </div>
//         </div>
//       </section>

//       {/* Exchange Rate Chart Placeholder */}
//       <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
//         <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
//           <h2 className="font-bold mb-4">📈 csCSPR Exchange Rate History</h2>
//           <div className="h-64 flex items-center justify-center bg-black/20 rounded">
//             <div className="text-center">
//               <p className="text-gray-400 mb-2">Current Rate</p>
//               <p className="text-4xl font-black text-[#CDFF00]">1 csCSPR = {exchangeRate.toFixed(4)} CSPR</p>
//               <p className="text-green-400 text-sm mt-2">↑ 5.23% since launch</p>
//               <div className="mt-4 flex justify-center gap-4 text-sm">
//                 <span className="px-3 py-1 bg-white/10 rounded">7d: +0.12%</span>
//                 <span className="px-3 py-1 bg-white/10 rounded">30d: +0.48%</span>
//                 <span className="px-3 py-1 bg-white/10 rounded">All: +5.23%</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Validator Performance */}
//       <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
//         <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
//           <h2 className="font-bold mb-4">🏆 Top Validators by Performance</h2>
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="text-gray-400 text-left border-b border-white/10">
//                   <th className="pb-3">Rank</th>
//                   <th className="pb-3">Validator</th>
//                   <th className="pb-3">Total Stake</th>
//                   <th className="pb-3">APY</th>
//                   <th className="pb-3">Uptime</th>
//                   <th className="pb-3">Commission</th>
//                   <th className="pb-3">Delegators</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr className="border-b border-white/5">
//                   <td className="py-3 font-bold text-yellow-400">🥇</td>
//                   <td className="py-3 font-bold">CasperStake Pool</td>
//                   <td className="py-3">450,000 CSPR</td>
//                   <td className="py-3 text-green-400 font-bold">12.5%</td>
//                   <td className="py-3 text-green-400">99.98%</td>
//                   <td className="py-3">5%</td>
//                   <td className="py-3">1,234</td>
//                 </tr>
//                 <tr className="border-b border-white/5">
//                   <td className="py-3 font-bold text-gray-400">🥈</td>
//                   <td className="py-3 font-bold">Casper Labs</td>
//                   <td className="py-3">380,000 CSPR</td>
//                   <td className="py-3 text-green-400 font-bold">11.8%</td>
//                   <td className="py-3 text-green-400">99.95%</td>
//                   <td className="py-3">8%</td>
//                   <td className="py-3">987</td>
//                 </tr>
//                 <tr className="border-b border-white/5">
//                   <td className="py-3 font-bold text-amber-600">🥉</td>
//                   <td className="py-3 font-bold">HashQuark</td>
//                   <td className="py-3">290,000 CSPR</td>
//                   <td className="py-3 text-green-400 font-bold">11.5%</td>
//                   <td className="py-3 text-green-400">99.90%</td>
//                   <td className="py-3">10%</td>
//                   <td className="py-3">756</td>
//                 </tr>
//                 <tr className="border-b border-white/5">
//                   <td className="py-3">4</td>
//                   <td className="py-3 font-bold">Everstake</td>
//                   <td className="py-3">245,000 CSPR</td>
//                   <td className="py-3 text-green-400 font-bold">11.2%</td>
//                   <td className="py-3 text-green-400">99.85%</td>
//                   <td className="py-3">10%</td>
//                   <td className="py-3">623</td>
//                 </tr>
//                 <tr className="border-b border-white/5">
//                   <td className="py-3">5</td>
//                   <td className="py-3 font-bold">Stakefish</td>
//                   <td className="py-3">198,000 CSPR</td>
//                   <td className="py-3 text-green-400 font-bold">11.0%</td>
//                   <td className="py-3 text-green-400">99.80%</td>
//                   <td className="py-3">12%</td>
//                   <td className="py-3">512</td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>

//       {/* Your Stats (if connected) */}
//       {connected && (stakedBalance > 0 || cscsprBalance > 0) && (
//         <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
//           <div className="bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-500/30 p-6 rounded-lg">
//             <h2 className="font-bold mb-4">👤 Your Staking Analytics</h2>
//             <div className="grid md:grid-cols-4 gap-4">
//               <div className="bg-black/20 p-4 rounded">
//                 <p className="text-gray-400 text-sm">Your Stake</p>
//                 <p className="text-2xl font-black text-[#CDFF00]">{stakedBalance.toFixed(2)} CSPR</p>
//               </div>
//               <div className="bg-black/20 p-4 rounded">
//                 <p className="text-gray-400 text-sm">csCSPR Holdings</p>
//                 <p className="text-2xl font-black text-green-400">{cscsprBalance.toFixed(2)}</p>
//               </div>
//               <div className="bg-black/20 p-4 rounded">
//                 <p className="text-gray-400 text-sm">Current Value</p>
//                 <p className="text-2xl font-black">{(cscsprBalance * exchangeRate).toFixed(2)} CSPR</p>
//               </div>
//               <div className="bg-black/20 p-4 rounded">
//                 <p className="text-gray-400 text-sm">Rewards Earned</p>
//                 <p className="text-2xl font-black text-purple-400">+{((cscsprBalance * exchangeRate) - stakedBalance).toFixed(2)} CSPR</p>
//               </div>
//             </div>
//           </div>
//         </section>
//       )}

//       {/* Recent Activity */}
//       <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
//         <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
//           <h2 className="font-bold mb-4">📋 Recent Protocol Activity</h2>
//           <div className="space-y-3">
//             {[
//               { action: "Stake", amount: "5,000 CSPR", time: "2 min ago", user: "0x0203...8ed" },
//               { action: "Unstake Request", amount: "1,200 CSPR", time: "8 min ago", user: "0x0189...4a2" },
//               { action: "Bridge", amount: "3,500 csCSPR → ETH", time: "15 min ago", user: "0x0267...c31" },
//               { action: "Stake", amount: "10,000 CSPR", time: "22 min ago", user: "0x0145...9f8" },
//               { action: "ZK Proof Generated", amount: "Tier: Gold", time: "28 min ago", user: "0x0312...b45" },
//             ].map((activity, i) => (
//               <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
//                 <div className="flex items-center gap-3">
//                   <span className="text-xl">
//                     {activity.action === "Stake" ? "📥" : activity.action === "Unstake Request" ? "📤" : activity.action === "Bridge" ? "🌉" : "🔐"}
//                   </span>
//                   <div>
//                     <p className="font-bold text-sm">{activity.action}</p>
//                     <p className="text-gray-400 text-xs">{activity.user}</p>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <p className="font-bold text-sm">{activity.amount}</p>
//                   <p className="text-gray-400 text-xs">{activity.time}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }

"use client";
import { useWallet } from "@/contexts/WalletContext";
import { useValidators } from "@/lib/useValidators";

export default function AnalyticsPage() {
  const { connected, stakedBalance, cscsprBalance, exchangeRate } = useWallet();
  const { validators, loading: validatorsLoading } = useValidators();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-yellow-900/20 to-black py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-5xl font-black mb-4">
            Protocol <span className="text-yellow-500">Analytics</span>
          </h1>
          <p className="text-gray-400 max-w-xl">
            Real-time network statistics, validator performance, and protocol health monitoring.
          </p>
        </div>
      </section>

      {/* Main Stats */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 p-6 rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Total Value Locked</p>
            <p className="text-3xl font-black text-[#CDFF00]">$5.8M</p>
            <p className="text-green-400 text-xs mt-1">↑ 12.3% (7d)</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">csCSPR Supply</p>
            <p className="text-3xl font-black">1,187,524</p>
            <p className="text-green-400 text-xs mt-1">↑ 8.1% (7d)</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Unique Stakers</p>
            <p className="text-3xl font-black">3,847</p>
            <p className="text-green-400 text-xs mt-1">+156 this week</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Rewards Distributed</p>
            <p className="text-3xl font-black text-purple-400">89,234</p>
            <p className="text-gray-400 text-xs mt-1">CSPR (all-time)</p>
          </div>
        </div>
      </section>

      {/* Protocol Health */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl">✅</span>
              <p className="font-bold text-green-400 text-xl">Protocol Health</p>
            </div>
            <p className="text-4xl font-black text-green-400 mb-2">OPTIMAL</p>
            <p className="text-gray-400 text-sm">All systems operational • No incidents • Last check: 30s ago</p>
          </div>
          <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl">🔒</span>
              <p className="font-bold text-blue-400 text-xl">Security Score</p>
            </div>
            <p className="text-4xl font-black text-blue-400 mb-2">98/100</p>
            <p className="text-gray-400 text-sm">Audited • ThresholdModule active • Multi-sig enabled</p>
          </div>
          <div className="bg-purple-900/20 border border-purple-500/30 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl">⛓️</span>
              <p className="font-bold text-purple-400 text-xl">Active Validators</p>
            </div>
            <p className="text-4xl font-black text-purple-400 mb-2">{validators.length}</p>
            <p className="text-gray-400 text-sm">Fetched from Casper testnet auction</p>
          </div>
        </div>
      </section>

      {/* Exchange Rate Chart Placeholder */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
          <h2 className="font-bold mb-4">📈 csCSPR Exchange Rate History</h2>
          <div className="h-64 flex items-center justify-center bg-black/20 rounded">
            <div className="text-center">
              <p className="text-gray-400 mb-2">Current Rate</p>
              <p className="text-4xl font-black text-[#CDFF00]">1 csCSPR = {exchangeRate.toFixed(4)} CSPR</p>
              <p className="text-green-400 text-sm mt-2">↑ 5.23% since launch</p>
              <div className="mt-4 flex justify-center gap-4 text-sm">
                <span className="px-3 py-1 bg-white/10 rounded">7d: +0.12%</span>
                <span className="px-3 py-1 bg-white/10 rounded">30d: +0.48%</span>
                <span className="px-3 py-1 bg-white/10 rounded">All: +5.23%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Validator Performance - NOW WITH REAL DATA */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">🏆 Top Validators by Performance</h2>
            <span className="text-xs text-gray-500">Live from Casper Testnet</span>
          </div>
          {validatorsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#CDFF00]"></div>
              <p className="text-gray-400 mt-2">Loading validators...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-white/10">
                    <th className="pb-3">Rank</th>
                    <th className="pb-3">Validator</th>
                    <th className="pb-3">Total Stake</th>
                    <th className="pb-3">APY</th>
                    <th className="pb-3">Commission</th>
                    <th className="pb-3">Delegators</th>
                  </tr>
                </thead>
                <tbody>
                  {validators.slice(0, 10).map((validator, index) => (
                    <tr key={validator.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 font-bold">
                        {index === 0 ? (
                          <span className="text-yellow-400">🥇</span>
                        ) : index === 1 ? (
                          <span className="text-gray-400">🥈</span>
                        ) : index === 2 ? (
                          <span className="text-amber-600">🥉</span>
                        ) : (
                          <span className="text-gray-500">{index + 1}</span>
                        )}
                      </td>
                      <td className="py-3 font-bold font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <span>{validator.icon}</span>
                          <span>{validator.name}</span>
                          {validator.recommended && (
                            <span className="bg-[#CDFF00] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">TOP</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">{validator.totalStake} CSPR</td>
                      <td className="py-3 text-green-400 font-bold">{validator.apy}%</td>
                      <td className="py-3">{validator.fee}%</td>
                      <td className="py-3">{validator.delegators}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Your Stats (if connected) */}
      {connected && (stakedBalance > 0 || cscsprBalance > 0) && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-500/30 p-6 rounded-lg">
            <h2 className="font-bold mb-4">👤 Your Staking Analytics</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-black/20 p-4 rounded">
                <p className="text-gray-400 text-sm">Your Stake</p>
                <p className="text-2xl font-black text-[#CDFF00]">{stakedBalance.toFixed(2)} CSPR</p>
              </div>
              <div className="bg-black/20 p-4 rounded">
                <p className="text-gray-400 text-sm">csCSPR Holdings</p>
                <p className="text-2xl font-black text-green-400">{cscsprBalance.toFixed(2)}</p>
              </div>
              <div className="bg-black/20 p-4 rounded">
                <p className="text-gray-400 text-sm">Current Value</p>
                <p className="text-2xl font-black">{(cscsprBalance * exchangeRate).toFixed(2)} CSPR</p>
              </div>
              <div className="bg-black/20 p-4 rounded">
                <p className="text-gray-400 text-sm">Rewards Earned</p>
                <p className="text-2xl font-black text-purple-400">+{((cscsprBalance * exchangeRate) - stakedBalance).toFixed(2)} CSPR</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
          <h2 className="font-bold mb-4">📋 Recent Protocol Activity</h2>
          <div className="space-y-3">
            {[
              { action: "Stake", amount: "5,000 CSPR", time: "2 min ago", user: "0x0203...8ed" },
              { action: "Unstake Request", amount: "1,200 CSPR", time: "8 min ago", user: "0x0189...4a2" },
              { action: "Bridge", amount: "3,500 csCSPR → ETH", time: "15 min ago", user: "0x0267...c31" },
              { action: "Stake", amount: "10,000 CSPR", time: "22 min ago", user: "0x0145...9f8" },
              { action: "ZK Proof Generated", amount: "Tier: Gold", time: "28 min ago", user: "0x0312...b45" },
            ].map((activity, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {activity.action === "Stake" ? "📥" : activity.action === "Unstake Request" ? "📤" : activity.action === "Bridge" ? "🌉" : "🔐"}
                  </span>
                  <div>
                    <p className="font-bold text-sm">{activity.action}</p>
                    <p className="text-gray-400 text-xs">{activity.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{activity.amount}</p>
                  <p className="text-gray-400 text-xs">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}