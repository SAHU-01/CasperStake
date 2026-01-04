"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";

export default function Navbar() {
  const pathname = usePathname();
  const { connected, walletAddress, realBalance, connect, disconnect, loading } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/stake", label: "Stake" },
    { href: "/swap", label: "Swap", icon: "🔄" },
    { href: "/bridge", label: "Bridge", icon: "🌉" },
    // { href: "/privacy", label: "Privacy", icon: "🔐" },
    { href: "/analytics", label: "Analytics", icon: "📊" },
    { href: "/history", label: "History", icon: "📋" },
  ];

  return (
    <header className="border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-black text-sm">CS</div>
          <span className="font-black text-xl text-white">CasperStake</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-bold transition ${
                pathname === link.href 
                  ? "text-red-500" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {link.icon && <span className="mr-1">{link.icon}</span>}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Wallet Button */}
        <div className="flex items-center gap-3">
          {connected ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-xs text-gray-400">{walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</p>
                <p className="text-xs text-[#CDFF00] font-bold">{realBalance?.toFixed(2) || "..."} CSPR</p>
              </div>
              <button
                onClick={disconnect}
                className="px-4 py-2 bg-red-600/20 border border-red-600 text-red-500 font-bold text-sm hover:bg-red-600 hover:text-white transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={loading}
              className="px-4 py-2 bg-[#CDFF00] text-black font-bold text-sm hover:bg-[#b8e600] disabled:opacity-50"
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 border-t border-white/10 px-4 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-3 font-bold ${
                pathname === link.href 
                  ? "text-red-500" 
                  : "text-gray-400"
              }`}
            >
              {link.icon && <span className="mr-2">{link.icon}</span>}
              {link.label}
            </Link>
          ))}
          {connected && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-400">{walletAddress.slice(0,10)}...{walletAddress.slice(-6)}</p>
              <p className="text-sm text-[#CDFF00] font-bold">{realBalance?.toFixed(2) || "..."} CSPR</p>
            </div>
          )}
        </div>
      )}
    </header>
  );
}