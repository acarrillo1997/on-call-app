import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { jwtVerify, createRemoteJWKSet } from "jose"

// Paths that require authentication
const protectedPaths = [
  "/dashboard",
  "/schedule",
  "/incidents",
  "/teams",
  "/settings",
]

// Paths that are public (no authentication required)
const publicPaths = ["/", "/login", "/register"]

const hankoApiUrl = process.env.NEXT_PUBLIC_HANKO_API_URL

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the pathname is a protected path
  const isProtectedPath = protectedPaths.some((path) => 
    pathname === path || pathname.startsWith(`${path}/`)
  )
  
  // Check if the pathname is a public path
  const isPublicPath = publicPaths.some((path) => 
    pathname === path || pathname.startsWith(`${path}/`)
  )

  // For protected paths, verify the Hanko JWT token
  if (isProtectedPath) {
    const hankoToken = request.cookies.get("hanko")?.value
    
    // If no token exists, redirect to login
    if (!hankoToken) {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }

    try {
      // Create JWKS for token verification
      const JWKS = createRemoteJWKSet(
        new URL(`${hankoApiUrl}/.well-known/jwks.json`)
      )
      
      // Verify the JWT
      await jwtVerify(hankoToken, JWKS)
      
      // If verification succeeds, continue to the protected route
      return NextResponse.next()
    } catch (error) {
      // If verification fails, redirect to login
      console.error("JWT verification failed:", error)
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users trying to access login/register to dashboard
  if (isPublicPath && (pathname === "/login" || pathname === "/register")) {
    const hankoToken = request.cookies.get("hanko")?.value
    
    if (hankoToken) {
      try {
        // Create JWKS for token verification
        const JWKS = createRemoteJWKSet(
          new URL(`${hankoApiUrl}/.well-known/jwks.json`)
        )
        
        // Verify the JWT
        await jwtVerify(hankoToken, JWKS)
        
        // If verification succeeds, redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url))
      } catch (error) {
        // If verification fails, continue to login/register
        console.error("JWT verification failed:", error)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
} 