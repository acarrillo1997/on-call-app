import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// This function verifies the Hanko token in the middleware
export async function verifyHankoToken(token: string): Promise<boolean> {
  try {
    if (!token) return false;
    
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

// Get the current user ID from the Hanko JWT
export async function getCurrentUserId(): Promise<string | null> {
  const token = await getHankoToken();
  
  if (!token) return null;
  
  try {
    // Parse the JWT payload (the middle part of the token)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString('utf-8')
    );
    
    return payload.sub || null;
  } catch (error) {
    console.error('Error parsing Hanko token:', error);
    return null;
  }
} 