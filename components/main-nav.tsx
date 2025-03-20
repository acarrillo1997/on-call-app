"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  // Don't show navigation on login/register pages
  if (pathname === "/login" || pathname === "/register") {
    return null
  }

  const isLoggedIn = pathname !== "/"

  return (
    <div className="mr-4 flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <span className="font-bold">OnCallPro</span>
      </Link>
      {isLoggedIn && (
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/dashboard"
            className={cn(
              "transition-colors hover:text-primary",
              pathname === "/dashboard" ? "text-primary" : "text-muted-foreground",
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/schedule"
            className={cn(
              "transition-colors hover:text-primary",
              pathname === "/schedule" ? "text-primary" : "text-muted-foreground",
            )}
          >
            Schedule
          </Link>
          <Link
            href="/teams"
            className={cn(
              "transition-colors hover:text-primary",
              pathname === "/teams" ? "text-primary" : "text-muted-foreground",
            )}
          >
            Teams
          </Link>
          <Link
            href="/incidents"
            className={cn(
              "transition-colors hover:text-primary",
              pathname === "/incidents" ? "text-primary" : "text-muted-foreground",
            )}
          >
            Incidents
          </Link>
          <Link
            href="/settings"
            className={cn(
              "transition-colors hover:text-primary",
              pathname === "/settings" ? "text-primary" : "text-muted-foreground",
            )}
          >
            Settings
          </Link>
        </nav>
      )}
    </div>
  )
}

