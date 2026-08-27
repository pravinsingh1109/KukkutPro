export interface GoogleUserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
  accessToken: string;
  expiresAt: number; // epoch ms
}

const GOOGLE_CLIENT_ID = '26794240205-cguboksnag5fgn3s6jjuitrpb51tqs2o.apps.googleusercontent.com';
const DRIVE_SCOPE = 'openid email profile https://www.googleapis.com/auth/drive.file';
const STORAGE_KEY = 'kukkutpro_google_user';

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Dynamically loads the Google Identity Services (GIS) client script.
 */
export function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      return resolve();
    }

    const existingScript = document.getElementById('google-gis-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google GIS script')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google GIS script'));
    document.head.appendChild(script);
  });
}

/**
 * Retrieves cached Google user profile from localStorage if still valid.
 */
export function getCachedGoogleUser(): GoogleUserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user: GoogleUserProfile = JSON.parse(raw);
    // If token expired, keep profile for UI but mark as needing re-auth when making drive calls
    return user;
  } catch {
    return null;
  }
}

/**
 * Saves Google user profile to localStorage.
 */
export function saveCachedGoogleUser(user: GoogleUserProfile | null) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
}

/**
 * Initiates Google OAuth token flow using Google Identity Services.
 */
export async function requestGoogleToken(promptMode: '' | 'select_account' = ''): Promise<GoogleUserProfile> {
  await loadGisScript();

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        prompt: promptMode,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }

          const accessToken = tokenResponse.access_token;
          const expiresIn = parseInt(tokenResponse.expires_in, 10) || 3600;
          const expiresAt = Date.now() + expiresIn * 1000;

          try {
            // Fetch User info from Google UserInfo endpoint
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!userInfoRes.ok) {
              throw new Error('Failed to fetch user profile from Google');
            }

            const info = await userInfoRes.json();
            const profile: GoogleUserProfile = {
              id: info.sub,
              name: info.name || 'Google User',
              email: info.email,
              picture: info.picture || '',
              accessToken,
              expiresAt,
            };

            saveCachedGoogleUser(profile);
            resolve(profile);
          } catch (err: any) {
            reject(err);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: promptMode });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Disconnects and signs out Google account.
 */
export function signOutGoogle() {
  const cached = getCachedGoogleUser();
  if (cached?.accessToken && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(cached.accessToken, () => {
        // revoked
      });
    } catch {
      // ignore
    }
  }
  saveCachedGoogleUser(null);
}
