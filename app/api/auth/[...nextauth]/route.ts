import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Create and export the auth handlers
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 