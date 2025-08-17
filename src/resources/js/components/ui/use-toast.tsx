// This file is not needed as the useToast hook is already implemented in toast.tsx
// Keeping this file to avoid breaking existing imports, but it just re-exports the hook from toast.tsx

export { useToast } from '@/components/ui/toast';

// Re-export the toast function for direct use
import { useToast as useToastInternal } from '@/components/ui/toast';

// Create a singleton instance of the toast functions for direct imports
const toastInstance = (() => {
  let instance: ReturnType<typeof useToastInternal> | null = null;
  
  // This will be replaced with the actual instance once the component mounts
  const placeholderFn = () => {
    console.warn('Toast was called before it was initialized. This is a no-op.');
  };
  
  return {
    __setInstance: (toastFns: ReturnType<typeof useToastInternal>) => {
      instance = toastFns;
    },
    success: (...args: Parameters<ReturnType<typeof useToastInternal>['success']>) => {
      if (instance) return instance.success(...args);
      placeholderFn();
    },
    error: (...args: Parameters<ReturnType<typeof useToastInternal>['error']>) => {
      if (instance) return instance.error(...args);
      placeholderFn();
    },
    info: (...args: Parameters<ReturnType<typeof useToastInternal>['info']>) => {
      if (instance) return instance.info(...args);
      placeholderFn();
    },
    custom: (...args: Parameters<ReturnType<typeof useToastInternal>['custom']>) => {
      if (instance) return instance.custom(...args);
      placeholderFn();
    },
    dismiss: (...args: Parameters<ReturnType<typeof useToastInternal>['dismiss']>) => {
      if (instance) return instance.dismiss(...args);
      placeholderFn();
    }
  };
})();

export const toast = toastInstance;
