import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Google OAuth callback handler
http.route({
  path: "/google/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return new Response(
        `<html><body><script>window.close();</script><h1>Authorization failed: ${error}</h1></body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    if (!code || !state) {
      return new Response(
        `<html><body><script>window.close();</script><h1>Missing authorization code or state</h1></body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    try {
      // Parse state to get session token
      const { sessionToken } = JSON.parse(decodeURIComponent(state));

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: "authorization_code",
          redirect_uri: `${process.env.CONVEX_SITE_URL}/google/callback`,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code for tokens");
      }

      const tokens = await tokenResponse.json();

      // Store tokens in database
      await ctx.runMutation(api.dashboard.storeGoogleTokens, {
        sessionToken,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
      });

      // Schedule initial data fetch
      await ctx.runAction(api.googleApi.fetchGoogleData, { sessionToken });

      return new Response(
        `<html><body><script>window.close();</script><h1>Successfully connected to Google! You can close this window.</h1></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    } catch (error) {
      console.error("OAuth callback error:", error);
      return new Response(
        `<html><body><script>window.close();</script><h1>Failed to connect to Google</h1></body></html>`,
        { status: 500, headers: { "Content-Type": "text/html" } }
      );
    }
  }),
});

export default http;
