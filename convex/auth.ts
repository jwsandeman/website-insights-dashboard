// NOTE: This Convex Auth setup is currently unused.
// We use custom session-based authentication in dashboard.ts instead.
// Uncomment and fix imports if you want to use Convex Auth.

/*
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password, Anonymous } from "@convex-dev/auth/providers";
import { query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Anonymous],
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});
*/

// Placeholder export to keep the file valid
export const auth = {
  addHttpRoutes: () => {},
};
