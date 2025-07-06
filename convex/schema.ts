import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTables = {
  tenants: defineTable({
    name: v.string(),
    domain: v.string(),
    googleAnalyticsPropertyId: v.optional(v.string()),
    searchConsoleUrl: v.optional(v.string()),
    createdAt: v.number(),
    isActive: v.boolean(),
    // Google OAuth tokens
    googleAccessToken: v.optional(v.string()),
    googleRefreshToken: v.optional(v.string()),
    googleTokenExpiresAt: v.optional(v.number()),
    isGoogleConnected: v.optional(v.boolean()),
  }).index("by_domain", ["domain"]),

  clients: defineTable({
    tenantId: v.id("tenants"),
    email: v.string(),
    name: v.string(),
    hashedPassword: v.string(),
    role: v.union(v.literal("admin"), v.literal("viewer")),
    lastLoginAt: v.optional(v.number()),
    isActive: v.boolean(),
  }).index("by_tenant_email", ["tenantId", "email"]),

  metrics: defineTable({
    tenantId: v.id("tenants"),
    date: v.string(), // YYYY-MM-DD format
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
    updatedAt: v.number(),
  })
    .index("by_tenant_date", ["tenantId", "date"])
    .index("by_tenant_source", ["tenantId", "source"]),

  dashboardSessions: defineTable({
    clientId: v.id("clients"),
    tenantId: v.id("tenants"),
    sessionToken: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["sessionToken"])
    .index("by_client", ["clientId"]),
};

export default defineSchema({
  ...applicationTables,
});
