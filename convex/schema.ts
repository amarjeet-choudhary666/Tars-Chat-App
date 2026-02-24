import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  conversations: defineTable({
    participants: v.array(v.id("users")),
    lastMessageAt: v.number(),
    isGroup: v.optional(v.boolean()),
    groupName: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  }).index("by_participants", ["participants"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    isRead: v.boolean(),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_time", ["conversationId", "createdAt"]),

  reactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  })
    .index("by_message", ["messageId"])
    .index("by_message_user", ["messageId", "userId"]),

  typing: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isTyping: v.boolean(),
    updatedAt: v.number(),
  }).index("by_conversation", ["conversationId"]),
});
