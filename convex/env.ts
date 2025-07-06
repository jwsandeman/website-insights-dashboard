/**
 * Environment variable validation utility
 * Helps provide clear error messages when required env vars are missing
 */

export function validateGoogleOAuthEnv(): {
  isConfigured: boolean;
  missingVars: string[];
  errorMessage?: string;
} {
  const requiredVars = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET", 
    "SITE_URL"
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    return {
      isConfigured: false,
      missingVars,
      errorMessage: `Google OAuth not configured. Missing environment variables: ${missingVars.join(", ")}. 

To set up Google OAuth:
1. Go to Google Cloud Console (https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add these to your .env.local file:
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   CONVEX_SITE_URL=your_convex_url

For development, the app works with demo data without Google OAuth.`
    };
  }

  return {
    isConfigured: true,
    missingVars: []
  };
}

export function getGoogleOAuthConfig() {
  const validation = validateGoogleOAuthEnv();
  
  if (!validation.isConfigured) {
    throw new Error(validation.errorMessage);
  }

  return {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    siteUrl: process.env.SITE_URL!
  };
}
