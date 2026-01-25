// "use client";
// import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

// type ToastType = "success" | "error" | "info" | "warning";

// interface Toast {
//   id: string;
//   type: ToastType;
//   title: string;
//   message?: string;
//   txHash?: string;
//   duration: number;
//   createdAt: number;
// }

// interface ToastContextType {
//   toasts: Toast[];
//   showToast: (type: ToastType, title: string, message?: string, txHash?: string, duration?: number) => void;
//   dismissToast: (id: string) => void;
// }

// const ToastContext = createContext<ToastContextType | undefined>(undefined);

// export function useToast() {
//   const context = useContext(ToastContext);
//   if (!context) {
//     throw new Error("useToast must be used within a ToastProvider");
//   }
//   return context;
// }

// function ToastContainer({ toasts, dismissToast }: { toasts: Toast[]; dismissToast: (id: string) => void }) {
//   return (
//     <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
//       {toasts.map((toast) => (
//         <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
//       ))}
//     </div>
//   );
// }

// function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
//   const [progress, setProgress] = useState(100);
//   const [isVisible, setIsVisible] = useState(false);

//   useEffect(() => {
//     // Trigger entrance animation
//     setTimeout(() => setIsVisible(true), 10);

//     // Progress bar countdown
//     if (toast.duration > 0) {
//       const interval = setInterval(() => {
//         const elapsed = Date.now() - toast.createdAt;
//         const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
//         setProgress(remaining);
        
//         if (remaining <= 0) {
//           clearInterval(interval);
//         }
//       }, 50);
//       return () => clearInterval(interval);
//     }
//   }, [toast.duration, toast.createdAt]);

//   const bgColors = {
//     success: "bg-[#0D0D0D] border-[#BFFF00]/30",
//     error: "bg-[#0D0D0D] border-[#FF0032]/30",
//     info: "bg-[#0D0D0D] border-blue-500/30",
//     warning: "bg-[#0D0D0D] border-yellow-500/30",
//   };

//   const progressColors = {
//     success: "bg-[#BFFF00]",
//     error: "bg-[#FF0032]",
//     info: "bg-blue-500",
//     warning: "bg-yellow-500",
//   };

//   const icons = {
//     success: (
//       <div className="w-10 h-10 rounded-full bg-[#BFFF00]/20 flex items-center justify-center flex-shrink-0">
//         <svg className="w-5 h-5 text-[#BFFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//         </svg>
//       </div>
//     ),
//     error: (
//       <div className="w-10 h-10 rounded-full bg-[#FF0032]/20 flex items-center justify-center flex-shrink-0">
//         <svg className="w-5 h-5 text-[#FF0032]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//         </svg>
//       </div>
//     ),
//     info: (
//       <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
//         <svg className="w-5 h-5 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//         </svg>
//       </div>
//     ),
//     warning: (
//       <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
//         <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//         </svg>
//       </div>
//     ),
//   };

//   return (
//     <div 
//       className={`
//         ${bgColors[toast.type]} 
//         border rounded-2xl p-4 shadow-2xl pointer-events-auto 
//         transform transition-all duration-300 ease-out
//         ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
//       `}
//     >
//       <div className="flex items-start gap-3">
//         {icons[toast.type]}
        
//         <div className="flex-1 min-w-0">
//           <p className="font-bold text-white text-sm">{toast.title}</p>
//           {toast.message && (
//             <p className="text-gray-400 text-xs mt-1">{toast.message}</p>
//           )}
//           {toast.txHash && (
//             <a 
//               href={`https://testnet.cspr.live/deploy/${toast.txHash}`}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="inline-flex items-center gap-1 text-[#FF0032] text-xs mt-2 hover:underline"
//             >
//               <span className="font-mono">{toast.txHash.slice(0, 8)}...{toast.txHash.slice(-6)}</span>
//               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
//               </svg>
//             </a>
//           )}
//         </div>

//         <button 
//           onClick={onDismiss}
//           className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
//         >
//           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//           </svg>
//         </button>
//       </div>

//       {toast.duration && toast.duration > 0 && (
//         <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
//           <div 
//             className={`h-full ${progressColors[toast.type]} transition-all duration-100 ease-linear`}
//             style={{ width: `${progress}%` }}
//           />
//         </div>
//       )}
//     </div>
//   );
// }

// export default function ToastProvider({ children }: { children: ReactNode }) {
//   const [toasts, setToasts] = useState<Toast[]>([]);

//   const showToast = useCallback((
//     type: ToastType, 
//     title: string, 
//     message?: string, 
//     txHash?: string,
//     duration: number = 5000
//   ) => {
//     const id = Math.random().toString(36).substring(2, 9);
//     const newToast: Toast = { id, type, title, message, txHash, duration, createdAt: Date.now() };
    
//     setToasts(prev => {
//       // FIXED: When showing success or error, clear all info/warning toasts
//       if (type === "success" || type === "error") {
//         const filtered = prev.filter(t => t.type !== "info" && t.type !== "warning");
//         return [...filtered, newToast];
//       }
      
//       // FIXED: When showing a new info toast, replace any existing info toast
//       // This ensures only one "step" shows at a time (e.g., "Awaiting Signature" → "Broadcasting")
//       if (type === "info") {
//         const filtered = prev.filter(t => t.type !== "info");
//         return [...filtered, newToast];
//       }
      
//       // Default: just add the toast
//       return [...prev, newToast];
//     });

//     // Auto dismiss after duration (0 = no auto dismiss)
//     if (duration > 0) {
//       setTimeout(() => {
//         setToasts(prev => prev.filter(t => t.id !== id));
//       }, duration);
//     }
//   }, []);

//   const dismissToast = useCallback((id: string) => {
//     setToasts(prev => prev.filter(t => t.id !== id));
//   }, []);

//   return (
//     <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
//       {children}
//       <ToastContainer toasts={toasts} dismissToast={dismissToast} />
//     </ToastContext.Provider>
//   );
// }

"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  deployHash?: string;
  duration: number;
}

interface ToastContextType {
  showToast: (
    type: ToastType,
    title: string,
    message: string,
    deployHash?: string,
    duration?: number
  ) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      type: ToastType,
      title: string,
      message: string,
      deployHash?: string,
      duration = 5000
    ): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newToast: Toast = {
        id,
        type,
        title,
        message,
        deployHash,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss after duration (if duration > 0)
      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-green-900/90 border-green-500/50 text-green-100";
      case "error":
        return "bg-red-900/90 border-red-500/50 text-red-100";
      case "info":
        return "bg-blue-900/90 border-blue-500/50 text-blue-100";
      case "warning":
        return "bg-yellow-900/90 border-yellow-500/50 text-yellow-100";
      default:
        return "bg-gray-900/90 border-gray-500/50 text-gray-100";
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "info":
        return "ℹ";
      case "warning":
        return "⚠";
      default:
        return "•";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${getToastStyles(toast.type)} border rounded-xl p-4 shadow-lg backdrop-blur-sm animate-slide-in`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{getIcon(toast.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{toast.title}</p>
                <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
                {toast.deployHash && (
                  <a
                    href={`https://testnet.cspr.live/deploy/${toast.deployHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-300 hover:text-blue-200 underline mt-1 inline-block"
                  >
                    View on Explorer →
                  </a>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-white/60 hover:text-white transition-colors flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}