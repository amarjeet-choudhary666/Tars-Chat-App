import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrGetConversation = mutation({
  args: {
    currentUserId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const allConversations = await ctx.db.query("conversations").collect();
    
    const existing = allConversations.find((conv) => {
      const participants = conv.participants;
      const isGroup = conv.isGroup ?? false;
      return (
        !isGroup &&
        participants.length === 2 &&
        ((participants[0] === args.currentUserId && participants[1] === args.otherUserId) ||
        (participants[0] === args.otherUserId && participants[1] === args.currentUserId))
      );
    });

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("conversations", {
      participants: [args.currentUserId, args.otherUserId],
      lastMessageAt: Date.now(),
      isGroup: false,
    });
  },
});

export const createGroupConversation = mutation({
  args: {
    createdBy: v.id("users"),
    participants: v.array(v.id("users")),
    groupName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      participants: args.participants,
      lastMessageAt: Date.now(),
      isGroup: true,
      groupName: args.groupName,
      createdBy: args.createdBy,
    });
  },
});

export const getUserConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allConversations = await ctx.db.query("conversations").collect();
    
    const conversations = allConversations.filter((conv) => 
      conv.participants.includes(args.userId)
    );

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        let displayName = "Unknown User";
        let displayImage = "";
        let otherUser = null;
        const isGroup = conv.isGroup ?? false;
        
        if (isGroup) {
          displayName = conv.groupName || "Group Chat";
          displayImage = "";
        } else {
          const otherUserId = conv.participants.find((id) => id !== args.userId);
          if (otherUserId) {
            otherUser = await ctx.db.get(otherUserId);
            if (otherUser) {
              displayName = otherUser.name || otherUser.email || "Unknown User";
              displayImage = otherUser.imageUrl || "";
            }
          }
        }

        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversation_time", (q) =>
            q.eq("conversationId", conv._id)
          )
          .order("desc")
          .first();

        const unreadCount = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .filter((q) =>
            q.and(
              q.eq(q.field("isRead"), false),
              q.neq(q.field("senderId"), args.userId)
            )
          )
          .collect();

        return {
          ...conv,
          isGroup,
          displayName,
          displayImage,
          lastMessage,
          unreadCount: unreadCount.length,
          memberCount: conv.participants.length,
          otherUser,
        };
      })
    );

    return conversationsWithDetails.sort(
      (a, b) => b.lastMessageAt - a.lastMessageAt
    );
  },
});


export const addMemberToGroup = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    newMemberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    
    if (!conversation || !conversation.isGroup) {
      throw new Error("Conversation not found or not a group");
    }

    if (conversation.createdBy !== args.userId) {
      throw new Error("Only the admin can add members");
    }

    if (conversation.participants.includes(args.newMemberId)) {
      throw new Error("User is already a member");
    }

    await ctx.db.patch(args.conversationId, {
      participants: [...conversation.participants, args.newMemberId],
    });
  },
});

export const removeMemberFromGroup = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    memberToRemove: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    
    if (!conversation || !conversation.isGroup) {
      throw new Error("Conversation not found or not a group");
    }

    if (conversation.createdBy !== args.userId) {
      throw new Error("Only the admin can remove members");
    }

    if (conversation.createdBy === args.memberToRemove) {
      throw new Error("Cannot remove the admin");
    }

    await ctx.db.patch(args.conversationId, {
      participants: conversation.participants.filter(id => id !== args.memberToRemove),
    });
  },
});

export const leaveGroup = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    
    if (!conversation || !conversation.isGroup) {
      throw new Error("Conversation not found or not a group");
    }

    if (conversation.createdBy === args.userId) {
      throw new Error("Admin cannot leave the group. Please transfer admin rights first or delete the group.");
    }

    await ctx.db.patch(args.conversationId, {
      participants: conversation.participants.filter(id => id !== args.userId),
    });
  },
});

export const updateGroupName = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    
    if (!conversation || !conversation.isGroup) {
      throw new Error("Conversation not found or not a group");
    }

    if (conversation.createdBy !== args.userId) {
      throw new Error("Only the admin can change the group name");
    }

    await ctx.db.patch(args.conversationId, {
      groupName: args.newName,
    });
  },
});

export const getGroupMembers = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    
    if (!conversation || !conversation.isGroup) {
      return [];
    }

    const members = await Promise.all(
      conversation.participants.map(async (userId) => {
        const user = await ctx.db.get(userId);
        return user ? {
          ...user,
          isAdmin: userId === conversation.createdBy,
        } : null;
      })
    );

    return members.filter(m => m !== null);
  },
});
