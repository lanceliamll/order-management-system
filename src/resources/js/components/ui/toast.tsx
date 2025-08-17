import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Toast variants
const toastVariants = cva(
  "fixed flex items-center w-full max-w-sm rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out z-50",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border",
        success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      },
      position: {
        topLeft: "top-4 left-4",
        topRight: "top-4 right-4", 
        bottomLeft: "bottom-4 left-4",
        bottomRight: "bottom-4 right-4",
      },
    },
    defaultVariants: {
      variant: "default",
      position: "topRight",
    },
  }
);

// Toast props including variants
export interface ToastProps extends VariantProps<typeof toastVariants> {
  id: string;
  message: string;
  title?: string;
  duration?: number;
  onClose: (id: string) => void;
  className?: string;
}

// Toast component
function Toast({
  id,
  message,
  title,
  variant = "default",
  position = "topRight",
  duration = 5000,
  onClose,
  className,
}: ToastProps) {
  // Auto-dismiss toast after duration
  useState(() => {
    if (duration !== Infinity) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  });

  // Get icon based on variant
  const getIcon = useCallback(() => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "error":
        return <AlertCircle className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
      default:
        return null;
    }
  }, [variant]);

  return (
    <div
      className={cn(toastVariants({ variant, position }), className)}
      role="alert"
    >
      {getIcon() && (
        <div className="mr-3">{getIcon()}</div>
      )}
      <div className="flex-1">
        {title && <h4 className="font-semibold">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>
      <button
        type="button"
        className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-sm"
        onClick={() => onClose(id)}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Toast context type
interface ToastContextType {
  toasts: ToastProps[];
  showToast: (toast: Omit<ToastProps, "id" | "onClose">) => void;
  hideToast: (id: string) => void;
}

// Create context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast provider props
interface ToastProviderProps {
  children: ReactNode;
  defaultPosition?: ToastProps["position"];
}

// Generate unique ID for toasts
const generateId = () => Math.random().toString(36).substring(2, 9);

// Toast provider component
export function ToastProvider({
  children,
  defaultPosition = "topRight",
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  // Show a new toast
  const showToast = useCallback(
    (toast: Omit<ToastProps, "id" | "onClose">) => {
      const id = generateId();
      setToasts((prev) => [
        ...prev,
        { ...toast, id, position: toast.position || defaultPosition, onClose: hideToast },
      ]);
    },
    [defaultPosition]
  );

  // Hide a toast by ID
  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      {/* Render all active toasts */}
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return {
    // Show a success toast
    success: (message: string, options?: Partial<Omit<ToastProps, "id" | "message" | "variant" | "onClose">>) => {
      context.showToast({ message, variant: "success", ...options });
    },
    
    // Show an error toast
    error: (message: string, options?: Partial<Omit<ToastProps, "id" | "message" | "variant" | "onClose">>) => {
      context.showToast({ message, variant: "error", ...options });
    },
    
    // Show an info toast
    info: (message: string, options?: Partial<Omit<ToastProps, "id" | "message" | "variant" | "onClose">>) => {
      context.showToast({ message, variant: "info", ...options });
    },
    
    // Show a custom toast
    custom: (options: Omit<ToastProps, "id" | "onClose">) => {
      context.showToast(options);
    },
    
    // Dismiss all toasts
    dismiss: (id?: string) => {
      if (id) {
        context.hideToast(id);
      } else {
        context.toasts.forEach((toast) => {
          context.hideToast(toast.id);
        });
      }
    },
  };
}
