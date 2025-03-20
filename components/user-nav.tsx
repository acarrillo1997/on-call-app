"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export function UserNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const isLoading = status === "loading"

  // Don't show user nav on login/register pages
  if (pathname === "/login" || pathname === "/register") {
    return null
  }

  const isLoggedIn = status === "authenticated"

  if (!isLoggedIn && pathname === "/") {
    return (
      <div className="flex items-center gap-4">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Login
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">Register</Button>
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return <Avatar className="h-8 w-8"><AvatarFallback>...</AvatarFallback></Avatar>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {session?.user?.image ? (
              <AvatarImage src={session.user.image} alt={session.user.name || "@user"} />
            ) : (
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="@user" />
            )}
            <AvatarFallback>
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session?.user?.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{session?.user?.email || "user@example.com"}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Notification Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

