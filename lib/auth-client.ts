// Client-side authentication utilities that can be used in client components

// Client-side function to get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  try {
    // Get hanko cookie from browser
    const cookies = document.cookie.split(';');
    const hankoCookie = cookies.find(cookie => cookie.trim().startsWith('hanko='));
    
    if (!hankoCookie) {
      console.log("No hanko cookie found");
      
      // Try to get from localStorage (for development/debug)
      const localId = localStorage.getItem('debug_user_id');
      if (localId) {
        console.log("Using debug user ID from localStorage:", localId);
        return localId;
      }
      
      // Extract user ID from the URL if possible
      const path = window.location.pathname;
      const match = path.match(/\/users\/([^\/]+)/);
      if (match && match[1]) {
        console.log("Extracted user ID from URL:", match[1]);
        return match[1];
      }
      
      return null;
    }
    
    // Extract the token value
    const token = hankoCookie.split('=')[1].trim();
    
    // Parse the JWT payload (the middle part of the token)
    const payload = JSON.parse(
      atob(token.split('.')[1])
    );
    
    const userId = payload.sub || null;
    console.log("Got user ID from token:", userId);
    
    // Store for development/debug purposes
    if (userId) {
      localStorage.setItem('debug_user_id', userId);
    }
    
    return userId;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    
    // For development/debug purposes, use a fallback ID if saved
    const fallbackId = localStorage.getItem('debug_user_id');
    if (fallbackId) {
      console.log("Using fallback user ID:", fallbackId);
      return fallbackId;
    }
    
    return null;
  }
} 