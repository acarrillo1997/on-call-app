import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// This function verifies the Hanko token in the middleware
export async function verifyHankoToken(token: string): Promise<boolean> {
  try {
    if (!token) return false;
    
    // DEVELOPMENT BYPASS - Skip actual verification
    // REMOVE THIS IN PRODUCTION!
    if (process.env.NODE_ENV !== 'production') {
      console.log("DEVELOPMENT MODE: Bypassing token verification");
      // Just check if it looks like a JWT (has two dots)
      if (token.split('.').length === 3) {
        return true;
      }
    }
    
    const hankoApi = process.env.NEXT_PUBLIC_HANKO_API_URL;
    if (!hankoApi) throw new Error('Hanko API URL not defined');
    
    const res = await fetch(`${hankoApi}/token/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    return res.ok;
  } catch (error) {
    console.error('Error verifying Hanko token:', error);
    return false;
  }
}

// Get the Hanko JWT token from cookies
export async function getHankoToken() {
  const cookieStore = await cookies();
  return cookieStore.get('hanko')?.value;
}

// Handle server-side authentication (for protected routes)
export async function requireAuth() {
  const token = await getHankoToken();
  
  if (!token) {
    redirect('/login');
  }
  
  const isValid = await verifyHankoToken(token);
  
  if (!isValid) {
    redirect('/login');
  }
}

// Note: Client-side getCurrentUserId has been moved to auth-client.ts

// Get the current user ID from the Hanko JWT on the server
export async function getUserIdFromToken() {
  const token = await getHankoToken();
  if (!token) return null;

  try {
    // Using a simple JWT parsing approach 
    // In a production app, you should use a proper JWT library
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    
    return payload.sub;
  } catch (error) {
    console.error('Error parsing Hanko token:', error);
    return null;
  }
}

// Verify auth for API routes
export async function verifyAuth(request: Request) {
  console.log("Verifying auth for request:", request.url);
  
  // Try to get token from authorization header
  const authHeader = request.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : null;
  
  // If no token in header, try cookie (for server components/API routes)
  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    console.log("Cookie header:", cookieHeader);
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key) acc[key.trim()] = value;
        return acc;
      }, {} as Record<string, string>);
      
      token = cookies['hanko'];
      
      // Also try with encodeURIComponent (some browsers encode the cookie name)
      if (!token) {
        const encodedCookieName = encodeURIComponent('hanko');
        token = cookies[encodedCookieName];
      }
      
      console.log("Extracted token from cookies:", !!token);
    }
  }
  
  if (!token) {
    console.log("No token found in request");
    
    // TEMPORARY DEBUG MEASURE: Accept any ID parameter from the request URL
    // REMOVE THIS IN PRODUCTION!
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const idIndex = pathParts.indexOf('users') + 1;
    
    if (idIndex > 0 && idIndex < pathParts.length) {
      const userId = pathParts[idIndex];
      console.log("DEVELOPMENT MODE: Allowing access with ID from URL:", userId);
      return { success: true, userId, email: null };
    }
    
    return { success: false, userId: null };
  }
  
  try {
    // Verify the token
    const isValid = await verifyHankoToken(token);
    if (!isValid) {
      console.log("Token verification failed");
      return { success: false, userId: null };
    }
    
    // Parse the token to get the user ID
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    
    console.log("Authentication successful for user:", payload.sub);
    
    return { 
      success: true, 
      userId: payload.sub,
      email: payload.email
    };
  } catch (error) {
    console.error('Error verifying auth:', error);
    return { success: false, userId: null };
  }
}

// NextAuth configuration options
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Hanko",
      credentials: {
        token: { label: "Hanko Token", type: "text" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.token) return null;
          
          const token = credentials.token as string;
          const isValid = await verifyHankoToken(token);
          
          if (isValid) {
            // Parse the JWT payload to get user information
            const payload = JSON.parse(
              Buffer.from(token.split('.')[1], 'base64').toString('utf-8')
            );
            
            return {
              id: payload.sub,
              email: payload.email || "",
              name: payload.preferred_username || "",
            };
          }
          
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  }
}; 