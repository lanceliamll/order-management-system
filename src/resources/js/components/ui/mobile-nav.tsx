import { cn } from "@/lib/utils";
import { NavItem } from "@/types";
import { Link } from "@inertiajs/react";
import { useEffect } from "react";

interface MobileNavProps {
  items: NavItem[];
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ items, open, onClose }: MobileNavProps) {
  // Close the mobile nav when pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent scrolling when mobile nav is open
  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Mobile Nav Panel */}
      <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-background p-6 shadow-lg">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-6">
            <nav className="flex flex-col gap-4">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 py-2 text-base font-medium transition-colors hover:text-primary"
                  onClick={onClose}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="mt-auto border-t pt-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Order Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
