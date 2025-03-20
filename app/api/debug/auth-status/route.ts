// This route is for development only, remove in production
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Block access in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is not available in production" },
      { status: 403 }
    );
  }

  try {
    // Get the cookie header for debugging
    const cookieHeader = request.headers.get("cookie");
    
    // Try to parse the hanko cookie if present
    let hankoCookie = null;
    let tokenInfo = null;
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const encodedHankoCookie = cookies.find(c => c.startsWith('hanko='));
      
      if (encodedHankoCookie) {
        hankoCookie = decodeURIComponent(encodedHankoCookie.substring('hanko='.length));
        
        // Try to parse token info
        try {
          const parts = hankoCookie.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            tokenInfo = {
              subject: payload.sub,
              expiration: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
              issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
              isExpired: payload.exp ? (payload.exp * 1000 < Date.now()) : null
            };
          }
        } catch (err) {
          console.error("Error parsing token:", err);
          tokenInfo = { error: "Failed to parse token" };
        }
      }
    }

    // Verify auth with the actual function
    let authResult;
    try {
      authResult = await verifyAuth(request);
    } catch (error) {
      console.error("Error in verifyAuth:", error);
      authResult = { 
        success: false, 
        userId: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    // Return all debug information
    return NextResponse.json({
      authResult,
      hasCookieHeader: !!cookieHeader,
      hankoCookiePresent: !!hankoCookie,
      tokenInfo,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      message: "This information is for debugging purposes only"
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 