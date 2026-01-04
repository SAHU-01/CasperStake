"use client";
import { useWallet } from "@/contexts/WalletContext";

export default function Toast() {
  const { message } = useWallet();

  if (!message) return null;

  const bgColor = message.type === "error" 
    ? "bg-red-600" 
    : message.type === "success" 
    ? "bg-green-600" 
    : "bg-blue-600";

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl z-50 max-w-md animate-pulse`}>
      <p className="font-bold">{message.text}</p>
    </div>
  );
}