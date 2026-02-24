"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MessageCircle, UsersRound } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Id } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";

interface ConversationSidebarProps {
  userId: Id<"users">;
  selectedConversationId?: Id<"conversations">;
  onSelectConversation: (conversationId: Id<"conversations">) => void;
}

export function ConversationSidebar({
  userId,
  selectedConversationId,
  onSelectConversation,
}: ConversationSidebarProps) {
  const conversations = useQuery(api.conversations.getUserConversations, {
    userId,
  });

  if (conversations === undefined) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm text-center">No conversations yet</p>
        <p className="text-xs text-center mt-1">
          Select a user to start chatting
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      {conversations.map((conv) => (
        <button
          key={conv._id}
          onClick={() => onSelectConversation(conv._id)}
          className={`w-full p-4 border-b hover:bg-accent transition-colors text-left ${
            selectedConversationId === conv._id ? "bg-accent" : ""
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              {conv.isGroup ? (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <UsersRound className="w-6 h-6 text-white" />
                </div>
              ) : (
                <>
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={conv.displayImage}
                      alt={conv.displayName || "User"}
                    />
                    <AvatarFallback className="bg-violet-100 text-violet-600 text-lg">
                      {conv.displayName?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {conv.otherUser?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold truncate">
                  {conv.displayName || "Unknown"}
                </p>
                {conv.lastMessage && (
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {formatDistanceToNow(conv.lastMessage.createdAt, {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground truncate">
                  {conv.isGroup && `${conv.memberCount} members • `}
                  {conv.lastMessage?.content || "No messages yet"}
                </p>
                {conv.unreadCount > 0 && (
                  <Badge className="ml-2 bg-violet-600 hover:bg-violet-700">
                    {conv.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </ScrollArea>
  );
}
