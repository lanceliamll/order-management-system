import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Props for the ErrorState component
 */
export interface ErrorStateProps {
  /**
   * The error message to display
   */
  error: string | Error;
  
  /**
   * Optional title for the error alert
   * @default "Error"
   */
  title?: string;
  
  /**
   * Optional handler for retry action
   * If provided, a retry button will be shown
   */
  onRetry?: () => void;
  
  /**
   * Whether a retry operation is in progress
   * @default false
   */
  isRetrying?: boolean;
  
  /**
   * Optional additional CSS class name
   */
  className?: string;
  
  /**
   * Optional variant for the error style
   * @default "destructive"
   */
  variant?: "default" | "destructive";
}

/**
 * A reusable component for displaying error states with optional retry functionality
 */
export function ErrorState({
  error,
  title = "Error",
  onRetry,
  isRetrying = false,
  className = "",
  variant = "destructive"
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return (
    <Alert variant={variant} className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <div className="flex flex-col space-y-2">
        <AlertDescription>{errorMessage}</AlertDescription>
        
        {onRetry && (
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              disabled={isRetrying}
              className="flex items-center"
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Button>
          </div>
        )}
      </div>
    </Alert>
  );
}
