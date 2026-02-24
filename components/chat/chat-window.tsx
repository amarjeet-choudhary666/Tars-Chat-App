"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, Send, Trash2, UsersRound, Info } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { formatMessageTime } from "../../lib/format-date";
import { MessageReactions } from "./message-reactions";
import { GroupInfoModal } from "./group-info-modal";

interface ChatWindowProps {
  conversationId: Id<"conversations">;
  currentUserId: Id<"users">;
  otherUser: {
    name: string;
    imageUrl?: string;
    isOnline: boolean;
  };
  isGroup?: boolean;
  memberCount?: number;
  groupName?: string;
  isAdmin?: boolean;
}

export function ChatWindow({
  conversationId,
  currentUserId,
  otherUser,
  isGroup = false,
  memberCount = 0,
  groupName = "",
  isAdmin = false,
}: ChatWindowProps) {
  const messages = useQuery(api.messages.getMessages, { conversationId });
  const typingUsers = useQuery(api.messages.getTypingUsers, {
    conversationId,
    currentUserId,
  });
  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markAsRead);
  const setTyping = useMutation(api.messages.setTyping);
  const deleteMessage = useMutation(api.messages.deleteMessage);

  const [message, setMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<Id<"messages"> | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    if (!showScrollButton) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    markAsRead({ conversationId, userId: currentUserId });
  }, [conversationId, currentUserId, markAsRead]);

  const handleSend = async () => {
    if (!message.trim()) return;

    await sendMessage({
      conversationId,
      senderId: currentUserId,
      content: message.trim(),
    });

    setMessage("");
    setTyping({ conversationId, userId: currentUserId, isTyping: false });
    scrollToBottom();
  };

  const handleTyping = (value: string) => {
    setMessage(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      setTyping({ conversationId, userId: currentUserId, isTyping: true });

      typingTimeoutRef.current = setTimeout(() => {
        setTyping({ conversationId, userId: currentUserId, isTyping: false });
      }, 2000);
    } else {
      setTyping({ conversationId, userId: currentUserId, isTyping: false });
    }
  };

  const handleDelete = async (messageId: Id<"messages">) => {
    try {
      await deleteMessage({ messageId, userId: currentUserId });
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-background flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {isGroup ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <UsersRound className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Avatar>
                <AvatarImage src={otherUser.imageUrl} alt={otherUser.name} />
                <AvatarFallback className="bg-violet-100 text-violet-600">
                  {otherUser.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            )}
            {!isGroup && otherUser.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            )}
          </div>
          <div>
            <p className="font-semibold">{otherUser.name}</p>
            {isGroup ? (
              <p className="text-xs text-muted-foreground">{memberCount} members</p>
            ) : (
              <Badge variant={otherUser.isOnline ? "default" : "secondary"} className="text-xs">
                {otherUser.isOnline ? "Online" : "Offline"}
              </Badge>
            )}
          </div>
        </div>
        {isGroup && (
          <button
            onClick={() => setShowGroupInfo(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        )}
      </div>

      <ScrollArea
        className="flex-1 p-4"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        <div className="space-y-4">
          {messages?.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                onMouseEnter={() => setHoveredMessageId(msg._id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                <div className="flex gap-2 max-w-[70%]">
                  {/* Show avatar for group chats on received messages */}
                  {isGroup && !isOwn && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={msg.senderImage} alt={msg.senderName} />
                      <AvatarFallback className="bg-violet-100 text-violet-600 text-xs">
                        {msg.senderName?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex flex-col relative group">
                    {/* Show sender name in group chats for received messages */}
                    {isGroup && !isOwn && (
                      <span className="text-xs font-medium text-violet-600 mb-1 px-1">
                        {msg.senderName}
                      </span>
                    )}
                    
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isOwn
                          ? "bg-violet-600 text-white"
                          : "bg-muted"
                      }`}
                    >
                      {msg.isDeleted ?? false ? (
                        <p className="italic text-sm opacity-70">This message was deleted</p>
                      ) : (
                        <p className="break-words">{msg.content}</p>
                      )}
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? "text-violet-200" : "text-muted-foreground"
                        }`}
                      >
                        {formatMessageTime(msg.createdAt)}
                      </p>
                    </div>
                    {isOwn && !(msg.isDeleted ?? false) && hoveredMessageId === msg._id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(msg._id)}
                        className="absolute -left-10 top-1/2 -translate-y-1/2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                    {!(msg.isDeleted ?? false) && (
                      <MessageReactions
                        messageId={msg._id}
                        currentUserId={currentUserId}
                        isOwnMessage={isOwn}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {typingUsers && typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {typingUsers[0].userName?.split(' ')[0] || "Someone"} is typing
                </span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          className="absolute bottom-24 right-8 rounded-full shadow-lg"
        >
          <ArrowDown className="w-5 h-5" />
        </Button>
      )}

      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            type="text"
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!message.trim()} size="icon">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {showGroupInfo && isGroup && (
        <GroupInfoModal
          conversationId={conversationId}
          currentUserId={currentUserId}
          groupName={groupName}
          isAdmin={isAdmin}
          onClose={() => setShowGroupInfo(false)}
        />
      )}
    </div>
  );
}
