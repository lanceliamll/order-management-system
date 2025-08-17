import { cn } from "@/lib/utils";
import { Link } from "@inertiajs/react";
import { MenuIcon, XIcon } from "lucide-react";
import { HTMLAttributes, useState } from "react";
import { MobileNav } from "./mobile-nav";
import { NavItem } from "@/types";
import AppLogo from "../app-logo";

interface HeaderProps extends HTMLAttributes<HTMLElement> {
  navItems: NavItem[];
  className?: string;
}

export function Header({ navItems, className, ...props }: HeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      {...props}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center">
            <AppLogo />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
        >
          {mobileNavOpen ? (
            <XIcon className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <MobileNav items={navItems} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </header>
  );
}
