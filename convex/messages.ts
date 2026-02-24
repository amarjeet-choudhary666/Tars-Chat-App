import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      ...args,
      createdAt: Date.now(),
      isRead: false,
      isDeleted: false,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== args.userId) {
      throw new Error("You can only delete your own messages");
    }

    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      deletedAt: Date.now(),
    });
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    // Get sender info for each message
    const messagesWithSender = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          senderName: sender?.name || "Unknown",
          senderImage: sender?.imageUrl || "",
        };
      })
    );

    return messagesWithSender;
  },
});

export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("isRead"), false),
          q.neq(q.field("senderId"), args.userId)
        )
      )
      .collect();

    await Promise.all(
      messages.map((msg) => ctx.db.patch(msg._id, { isRead: true }))
    );
  },
});

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("typing", {
        ...args,
        updatedAt: Date.now(),
      });
    }
  },
});

export const getTypingUsers = query({
  args: { conversationId: v.id("conversations"), currentUserId: v.id("users") },
  handler: async (ctx, args) => {
    const typing = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("isTyping"), true),
          q.neq(q.field("userId"), args.currentUserId)
        )
      )
      .collect();

    const recentTyping = typing.filter((t) => Date.now() - t.updatedAt < 3000);

    // Get user details for each typing user
    const typingWithUsers = await Promise.all(
      recentTyping.map(async (t) => {
        const user = await ctx.db.get(t.userId);
        return {
          ...t,
          userName: user?.name || "Someone",
        };
      })
    );

    return typingWithUsers;
  },
});
