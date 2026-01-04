// "use client";
// import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

// type ToastType = "success" | "error" | "info" | "warning";

// interface Toast {
//   id: string;
//   type: ToastType;
//   title: string;
//   message?: string;
//   txHash?: string;
//   duration?: number;
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
//     throw new Error("useToast must be used within ToastProvider");
//   }
//   return context;
// }

// export function ToastProvider({ children }: { children: ReactNode }) {
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
    
//     setToasts(prev => [...prev, newToast]);

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

// function ToastContainer({ toasts, dismissToast }: { toasts: Toast[]; dismissToast: (id: string) => void }) {
//   if (toasts.length === 0) return null;

//   return (
//     <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-md w-full px-4 md:px-0">
//       {toasts.map((toast) => (
//         <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
//       ))}
//     </div>
//   );
// }

// function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
//   const [progress, setProgress] = useState(100);
//   const [isVisible, setIsVisible] = useState(false);

//   // Animate in on mount
//   useEffect(() => {
//     const timer = setTimeout(() => setIsVisible(true), 10);
//     return () => clearTimeout(timer);
//   }, []);

//   // Progress bar animation
//   useEffect(() => {
//     if (!toast.duration || toast.duration === 0) return;

//     const interval = setInterval(() => {
//       const elapsed = Date.now() - toast.createdAt;
//       const remaining = Math.max(0, 100 - (elapsed / toast.duration!) * 100);
//       setProgress(remaining);
      
//       if (remaining <= 0) {
//         clearInterval(interval);
//       }
//     }, 50);

//     return () => clearInterval(interval);
//   }, [toast.duration, toast.createdAt]);

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
//     warning: (
//       <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
//         <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//         </svg>
//       </div>
//     ),
//     info: (
//       <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
//         <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//         </svg>
//       </div>
//     ),
//   };

//   const borderColors = {
//     success: "border-[#BFFF00]/30",
//     error: "border-[#FF0032]/30",
//     warning: "border-orange-500/30",
//     info: "border-blue-500/30",
//   };

//   const progressColors = {
//     success: "bg-[#BFFF00]",
//     error: "bg-[#FF0032]",
//     warning: "bg-orange-400",
//     info: "bg-blue-400",
//   };

//   return (
//     <div 
//       className={`bg-[#0a0a0a] border ${borderColors[toast.type]} rounded-xl p-4 shadow-2xl shadow-black/50 transition-all duration-300 ease-out ${
//         isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
//       }`}
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

//       {/* Progress bar for auto-dismiss */}
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

// export default ToastProvider;

"use client";
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  txHash?: string;
  duration?: number;
  createdAt: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message?: string, txHash?: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    type: ToastType, 
    title: string, 
    message?: string, 
    txHash?: string,
    duration: number = 5000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, title, message, txHash, duration, createdAt: Date.now() };
    
    setToasts(prev => {
      // If showing success or error, clear all info/warning toasts (they're intermediate states)
      if (type === "success" || type === "error") {
        const filtered = prev.filter(t => t.type !== "info" && t.type !== "warning");
        return [...filtered, newToast];
      }
      // If showing a new info toast, replace any existing info toast (only one step at a time)
      if (type === "info") {
        const filtered = prev.filter(t => t.type !== "info");
        return [...filtered, newToast];
      }
      return [...prev, newToast];
    });

    // Auto dismiss after duration (0 = no auto dismiss)
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} dismissToast={dismissToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, dismissToast }: { toasts: Toast[]; dismissToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-md w-full px-4 md:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Progress bar animation
  useEffect(() => {
    if (!toast.duration || toast.duration === 0) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - toast.createdAt;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration!) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration, toast.createdAt]);

  const icons = {
    success: (
      <div className="w-10 h-10 rounded-full bg-[#BFFF00]/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-[#BFFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    error: (
      <div className="w-10 h-10 rounded-full bg-[#FF0032]/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-[#FF0032]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    warning: (
      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
    info: (
      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  };

  const borderColors = {
    success: "border-[#BFFF00]/30",
    error: "border-[#FF0032]/30",
    warning: "border-orange-500/30",
    info: "border-blue-500/30",
  };

  const progressColors = {
    success: "bg-[#BFFF00]",
    error: "bg-[#FF0032]",
    warning: "bg-orange-400",
    info: "bg-blue-400",
  };

  return (
    <div 
      className={`bg-[#0a0a0a] border ${borderColors[toast.type]} rounded-xl p-4 shadow-2xl shadow-black/50 transition-all duration-300 ease-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start gap-3">
        {icons[toast.type]}
        
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">{toast.title}</p>
          {toast.message && (
            <p className="text-gray-400 text-xs mt-1">{toast.message}</p>
          )}
          {toast.txHash && (
            <a 
              href={`https://testnet.cspr.live/deploy/${toast.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#FF0032] text-xs mt-2 hover:underline"
            >
              <span className="font-mono">{toast.txHash.slice(0, 8)}...{toast.txHash.slice(-6)}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        <button 
          onClick={onDismiss}
          className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      {toast.duration && toast.duration > 0 && (
        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full ${progressColors[toast.type]} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default ToastProvider;