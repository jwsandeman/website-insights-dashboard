import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Client authentication for dashboard
export const authenticateClient = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    tenantDomain: v.string(),
  },
  handler: async (ctx, args) => {
    // Find tenant by domain
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_domain", q => q.eq("domain", args.tenantDomain))
      .unique();

    if (!tenant || !tenant.isActive) {
      throw new Error("Invalid tenant domain");
    }

    // Find client
    const client = await ctx.db
      .query("clients")
      .withIndex("by_tenant_email", q =>
        q.eq("tenantId", tenant._id).eq("email", args.email)
      )
      .unique();

    if (!client || !client.isActive) {
      throw new Error("Invalid credentials");
    }

    // In a real app, you'd hash and compare passwords properly
    // For demo purposes, we'll use a simple comparison
    if (client.hashedPassword !== args.password) {
      throw new Error("Invalid credentials");
    }

    // Create session
    const sessionToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await ctx.db.insert("dashboardSessions", {
      clientId: client._id,
      tenantId: tenant._id,
      sessionToken,
      expiresAt,
      createdAt: Date.now(),
    });

    // Update last login
    await ctx.db.patch(client._id, {
      lastLoginAt: Date.now(),
    });

    return {
      sessionToken,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        role: client.role,
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        domain: tenant.domain,
        isGoogleConnected: tenant.isGoogleConnected || false,
      },
    };
  },
});

export const validateSession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("dashboardSessions")
      .withIndex("by_token", q => q.eq("sessionToken", args.sessionToken))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const client = await ctx.db.get(session.clientId);
    const tenant = await ctx.db.get(session.tenantId);

    if (!client || !tenant || !client.isActive || !tenant.isActive) {
      return null;
    }

    return {
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        role: client.role,
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        domain: tenant.domain,
        isGoogleConnected: tenant.isGoogleConnected || false,
      },
    };
  },
});

export const getTenantWithTokens = query({
  args: {
    tenantId: v.string(),
  },
  handler: async (ctx, args) => {
    const tenant = await ctx.db.get(args.tenantId as any);
    if (!tenant) {
      return null;
    }
    // Ensure we return the tenant from the tenants table
    if (tenant._id.toString().startsWith("tenants|")) {
      return tenant;
    }
    return null;
  },
});

export const generateGoogleAuthUrl = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("dashboardSessions")
      .withIndex("by_token", q => q.eq("sessionToken", args.sessionToken))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid session");
    }

    const client = await ctx.db.get(session.clientId);
    if (!client || client.role !== "admin") {
      throw new Error("Only admins can connect Google services");
    }

    const state = encodeURIComponent(
      JSON.stringify({ sessionToken: args.sessionToken })
    );
    const scopes = [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
    ].join(" ");

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(`${process.env.CONVEX_SITE_URL}/google/callback`)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;

    return { authUrl };
  },
});

export const storeGoogleTokens = mutation({
  args: {
    sessionToken: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresIn: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("dashboardSessions")
      .withIndex("by_token", q => q.eq("sessionToken", args.sessionToken))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid session");
    }

    // Update tenant with Google tokens
    await ctx.db.patch(session.tenantId, {
      googleAccessToken: args.accessToken,
      googleRefreshToken: args.refreshToken,
      googleTokenExpiresAt: Date.now() + args.expiresIn * 1000,
      isGoogleConnected: true,
    });

    return { success: true };
  },
});

export const updateGoogleTokens = mutation({
  args: {
    tenantId: v.string(),
    accessToken: v.string(),
    expiresIn: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tenantId as any, {
      googleAccessToken: args.accessToken,
      googleTokenExpiresAt: Date.now() + args.expiresIn * 1000,
    });

    return { success: true };
  },
});

export const upsertMetric = mutation({
  args: {
    tenantId: v.string(),
    date: v.string(),
    source: v.union(v.literal("analytics"), v.literal("search_console")),
    data: v.object({
      sessions: v.optional(v.number()),
      users: v.optional(v.number()),
      pageviews: v.optional(v.number()),
      bounceRate: v.optional(v.number()),
      avgSessionDuration: v.optional(v.number()),
      clicks: v.optional(v.number()),
      impressions: v.optional(v.number()),
      ctr: v.optional(v.number()),
      position: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    // Check if metric already exists
    const existing = await ctx.db
      .query("metrics")
      .withIndex("by_tenant_date", q =>
        q.eq("tenantId", args.tenantId as any).eq("date", args.date)
      )
      .filter(q => q.eq(q.field("source"), args.source))
      .unique();

    if (existing) {
      // Update existing metric
      await ctx.db.patch(existing._id, {
        data: args.data,
        updatedAt: Date.now(),
      });
    } else {
      // Insert new metric
      await ctx.db.insert("metrics", {
        tenantId: args.tenantId as any,
        date: args.date,
        source: args.source,
        data: args.data,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const disconnectGoogle = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("dashboardSessions")
      .withIndex("by_token", q => q.eq("sessionToken", args.sessionToken))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid session");
    }

    const client = await ctx.db.get(session.clientId);
    if (!client || client.role !== "admin") {
      throw new Error("Only admins can disconnect Google services");
    }

    // Remove Google tokens
    await ctx.db.patch(session.tenantId, {
      googleAccessToken: undefined,
      googleRefreshToken: undefined,
      googleTokenExpiresAt: undefined,
      isGoogleConnected: false,
    });

    return { success: true };
  },
});

export const getDashboardMetrics = query({
  args: {
    sessionToken: v.string(),
    dateRange: v.optional(v.number()), // days back
  },
  handler: async (ctx, args) => {
    // Validate session inline to avoid circular dependency
    const session = await ctx.db
      .query("dashboardSessions")
      .withIndex("by_token", q => q.eq("sessionToken", args.sessionToken))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid session");
    }

    const client = await ctx.db.get(session.clientId);
    const tenant = await ctx.db.get(session.tenantId);

    if (!client || !tenant || !client.isActive || !tenant.isActive) {
      throw new Error("Invalid session");
    }

    const daysBack = args.dateRange || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split("T")[0];

    const metrics = await ctx.db
      .query("metrics")
      .withIndex("by_tenant_date", q =>
        q.eq("tenantId", tenant._id).gte("date", startDateStr)
      )
      .collect();

    // Aggregate metrics with explicit typing
    const analytics = metrics.filter((m: any) => m.source === "analytics");
    const searchConsole = metrics.filter(
      (m: any) => m.source === "search_console"
    );

    const totalSessions = analytics.reduce(
      (sum: number, m: any) => sum + (m.data.sessions || 0),
      0
    );
    const totalUsers = analytics.reduce(
      (sum: number, m: any) => sum + (m.data.users || 0),
      0
    );
    const totalPageviews = analytics.reduce(
      (sum: number, m: any) => sum + (m.data.pageviews || 0),
      0
    );
    const avgBounceRate =
      analytics.length > 0
        ? analytics.reduce(
            (sum: number, m: any) => sum + (m.data.bounceRate || 0),
            0
          ) / analytics.length
        : 0;

    const totalClicks = searchConsole.reduce(
      (sum: number, m: any) => sum + (m.data.clicks || 0),
      0
    );
    const totalImpressions = searchConsole.reduce(
      (sum: number, m: any) => sum + (m.data.impressions || 0),
      0
    );
    const avgCTR =
      searchConsole.length > 0
        ? searchConsole.reduce(
            (sum: number, m: any) => sum + (m.data.ctr || 0),
            0
          ) / searchConsole.length
        : 0;
    const avgPosition =
      searchConsole.length > 0
        ? searchConsole.reduce(
            (sum: number, m: any) => sum + (m.data.position || 0),
            0
          ) / searchConsole.length
        : 0;

    return {
      analytics: {
        sessions: totalSessions,
        users: totalUsers,
        pageviews: totalPageviews,
        bounceRate: Math.round(avgBounceRate * 100) / 100,
      },
      searchConsole: {
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: Math.round(avgCTR * 100) / 100,
        position: Math.round(avgPosition * 100) / 100,
      },
      chartData: metrics.map((m: any) => ({
        date: m.date,
        source: m.source,
        ...m.data,
      })),
      isGoogleConnected: tenant.isGoogleConnected || false,
      googleAnalyticsPropertyId: tenant.googleAnalyticsPropertyId,
      searchConsoleUrl: tenant.searchConsoleUrl,
    };
  },
});

export const logoutClient = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("dashboardSessions")
      .withIndex("by_token", q => q.eq("sessionToken", args.sessionToken))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Demo data seeding
export const seedDemoData = mutation({
  args: {},
  handler: async ctx => {
    // Check if demo data already exists
    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("by_domain", q => q.eq("domain", "demo.example.com"))
      .unique();

    if (existingTenant) {
      return {
        success: true,
        message: "Demo data already exists",
        tenantId: existingTenant._id,
      };
    }

    // Create demo tenant
    const tenantId = await ctx.db.insert("tenants", {
      name: "Demo Company",
      domain: "demo.example.com",
      googleAnalyticsPropertyId: "GA_DEMO_123",
      searchConsoleUrl: "https://demo.example.com",
      createdAt: Date.now(),
      isActive: true,
      isGoogleConnected: false,
    });

    // Create demo client
    await ctx.db.insert("clients", {
      tenantId,
      email: "demo@example.com",
      name: "Demo User",
      hashedPassword: "demo123", // In real app, this would be properly hashed
      role: "admin",
      isActive: true,
    });

    // Create demo metrics for the last 30 days
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Analytics metrics
      await ctx.db.insert("metrics", {
        tenantId,
        date: dateStr,
        source: "analytics",
        data: {
          sessions: Math.floor(Math.random() * 1000) + 500,
          users: Math.floor(Math.random() * 800) + 400,
          pageviews: Math.floor(Math.random() * 2000) + 1000,
          bounceRate: Math.random() * 0.3 + 0.4, // 40-70%
          avgSessionDuration: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
        },
        updatedAt: Date.now(),
      });

      // Search Console metrics
      await ctx.db.insert("metrics", {
        tenantId,
        date: dateStr,
        source: "search_console",
        data: {
          clicks: Math.floor(Math.random() * 200) + 50,
          impressions: Math.floor(Math.random() * 5000) + 2000,
          ctr: Math.random() * 0.05 + 0.02, // 2-7%
          position: Math.random() * 20 + 10, // 10-30
        },
        updatedAt: Date.now(),
      });
    }

    return { success: true, tenantId };
  },
});
