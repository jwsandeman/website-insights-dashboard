"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { google } from "googleapis";
import { api } from "./_generated/api";

export const fetchGoogleData = action({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Get session and tenant info
    const sessionData = await ctx.runQuery(api.dashboard.validateSession, {
      sessionToken: args.sessionToken,
    });

    if (!sessionData) {
      throw new Error("Invalid session");
    }

    // Get tenant with Google tokens
    const tenant = await ctx.runQuery(api.dashboard.getTenantWithTokens, {
      tenantId: sessionData.tenant.id,
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Type assertion since we know this is a tenant document
    const tenantDoc = tenant as any;

    if (!tenantDoc.googleAccessToken) {
      throw new Error("Google not connected for this tenant");
    }

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.CONVEX_SITE_URL}/google/callback`
    );

    oauth2Client.setCredentials({
      access_token: tenantDoc.googleAccessToken,
      refresh_token: tenantDoc.googleRefreshToken,
    });

    try {
      // Fetch Analytics data
      if (tenantDoc.googleAnalyticsPropertyId) {
        await fetchAnalyticsData(ctx, oauth2Client, tenantDoc);
      }

      // Fetch Search Console data
      if (tenantDoc.searchConsoleUrl) {
        await fetchSearchConsoleData(ctx, oauth2Client, tenantDoc);
      }

      return { success: true };
    } catch (error) {
      console.error("Error fetching Google data:", error);

      // If token expired, try to refresh
      if ((error as any).code === 401) {
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();

          // Update stored tokens
          await ctx.runMutation(api.dashboard.updateGoogleTokens, {
            tenantId: tenantDoc._id,
            accessToken: credentials.access_token!,
            expiresIn: credentials.expiry_date
              ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
              : 3600,
          });

          // Retry data fetch
          oauth2Client.setCredentials(credentials);

          if (tenantDoc.googleAnalyticsPropertyId) {
            await fetchAnalyticsData(ctx, oauth2Client, tenantDoc);
          }

          if (tenantDoc.searchConsoleUrl) {
            await fetchSearchConsoleData(ctx, oauth2Client, tenantDoc);
          }

          return { success: true };
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
          throw new Error("Google authentication expired. Please reconnect.");
        }
      }

      throw error;
    }
  },
});

async function fetchAnalyticsData(ctx: any, oauth2Client: any, tenant: any) {
  const analytics = google.analyticsdata({
    version: "v1beta",
    auth: oauth2Client,
  });

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const response = await analytics.properties.runReport({
    property: `properties/${tenant.googleAnalyticsPropertyId}`,
    requestBody: {
      dateRanges: [
        {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        },
      ],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "screenPageViews" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
    },
  });

  // Process and store the data
  if (response.data.rows) {
    for (const row of response.data.rows) {
      const date = row.dimensionValues?.[0]?.value;
      const sessions = parseInt(row.metricValues?.[0]?.value || "0");
      const users = parseInt(row.metricValues?.[1]?.value || "0");
      const pageviews = parseInt(row.metricValues?.[2]?.value || "0");
      const bounceRate = parseFloat(row.metricValues?.[3]?.value || "0");
      const avgSessionDuration = parseFloat(
        row.metricValues?.[4]?.value || "0"
      );

      if (date) {
        await ctx.runMutation(api.dashboard.upsertMetric, {
          tenantId: tenant._id,
          date: formatDate(date),
          source: "analytics",
          data: {
            sessions,
            users,
            pageviews,
            bounceRate,
            avgSessionDuration,
          },
        });
      }
    }
  }
}

async function fetchSearchConsoleData(
  ctx: any,
  oauth2Client: any,
  tenant: any
) {
  const searchconsole = google.searchconsole({
    version: "v1",
    auth: oauth2Client,
  });

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const response = await searchconsole.searchanalytics.query({
    siteUrl: tenant.searchConsoleUrl,
    requestBody: {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      dimensions: ["date"],
      rowLimit: 1000,
    },
  });

  // Process and store the data
  if (response.data.rows) {
    for (const row of response.data.rows) {
      const date = row.keys?.[0];
      const clicks = row.clicks || 0;
      const impressions = row.impressions || 0;
      const ctr = row.ctr || 0;
      const position = row.position || 0;

      if (date) {
        await ctx.runMutation(api.dashboard.upsertMetric, {
          tenantId: tenant._id,
          date,
          source: "search_console",
          data: {
            clicks,
            impressions,
            ctr: ctr * 100, // Convert to percentage
            position,
          },
        });
      }
    }
  }
}

function formatDate(dateString: string): string {
  // Convert YYYYMMDD to YYYY-MM-DD
  if (dateString.length === 8) {
    return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
  }
  return dateString;
}
