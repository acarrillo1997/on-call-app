// Client-side authentication utilities

// Get the current user ID from the Hanko JWT
export async function getCurrentUserId() {
  try {
    // Try to get the token from the cookie
    const cookies = parseCookies();
    const token = cookies['hanko'];
    
    if (!token) {
      return null;
    }

    // Parse the token to get the user ID
    const payload = parseJwt(token);
    return payload?.sub || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

// Check if the user is authenticated
export async function isAuthenticated() {
  const userId = await getCurrentUserId();
  return userId !== null;
}

// Require authentication - can be used in client components
export async function requireAuth() {
  const isAuthed = await isAuthenticated();
  if (!isAuthed) {
    throw new Error('Authentication required');
  }
}

// Parse cookies from the document
function parseCookies() {
  const cookies: Record<string, string> = {};
  if (typeof document === 'undefined') return cookies;
  
  const cookieStr = document.cookie;
  if (!cookieStr) return cookies;
  
  cookieStr.split(';').forEach(cookie => {
    const [key, value] = cookie.trim().split('=');
    if (key) cookies[key.trim()] = value;
  });
  
  return cookies;
}

// Parse a JWT token
function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
} 