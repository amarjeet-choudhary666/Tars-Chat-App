import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      ...args,
      isOnline: false,
      lastSeen: Date.now(),
    });
  },
});

export const getAllUsers = query({
  args: { searchQuery: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let users = await ctx.db.query("users").collect();

    // Check if users are truly online (active in last 60 seconds)
    const now = Date.now();
    users = users.map(user => ({
      ...user,
      isOnline: user.isOnline && (now - user.lastSeen < 60000),
    }));

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      users = users.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    return users;
  },
});

export const updatePresence = mutation({
  args: {
    clerkId: v.string(),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        isOnline: args.isOnline,
        lastSeen: Date.now(),
      });
    }
  },
});

export const checkUserOnlineStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return false;
    
    // Consider user online if they were active in the last 60 seconds
    const isRecentlyActive = Date.now() - user.lastSeen < 60000;
    return user.isOnline && isRecentlyActive;
  },
});

export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});


// Internal mutation to check for stale users and mark them offline
export const checkStaleUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    const staleThreshold = 60000; // 60 seconds

    for (const user of users) {
      // If user is marked online but hasn't been seen in 60 seconds, mark them offline
      if (user.isOnline && (now - user.lastSeen > staleThreshold)) {
        await ctx.db.patch(user._id, {
          isOnline: false,
        });
      }
    }
  },
});
