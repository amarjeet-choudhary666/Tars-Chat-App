import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    // Find any existing reaction from this user on this message
    const existingReactions = await ctx.db
      .query("reactions")
      .withIndex("by_message_user", (q) =>
        q.eq("messageId", args.messageId).eq("userId", args.userId)
      )
      .collect();

    // If user clicked the same emoji they already reacted with, remove it
    const sameEmojiReaction = existingReactions.find(
      (r) => r.emoji === args.emoji
    );

    if (sameEmojiReaction) {
      await ctx.db.delete(sameEmojiReaction._id);
      return;
    }

    // Remove all other reactions from this user on this message
    for (const reaction of existingReactions) {
      await ctx.db.delete(reaction._id);
    }

    // Add the new reaction
    await ctx.db.insert("reactions", {
      messageId: args.messageId,
      userId: args.userId,
      emoji: args.emoji,
    });
  },
});

export const getMessageReactions = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect();

    const reactionMap = new Map<string, { count: number; userIds: string[] }>();

    reactions.forEach((reaction) => {
      const existing = reactionMap.get(reaction.emoji);
      if (existing) {
        existing.count++;
        existing.userIds.push(reaction.userId);
      } else {
        reactionMap.set(reaction.emoji, {
          count: 1,
          userIds: [reaction.userId],
        });
      }
    });

    return Array.from(reactionMap.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      userIds: data.userIds,
    }));
  },
});
