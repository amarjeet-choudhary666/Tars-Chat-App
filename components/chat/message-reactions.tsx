"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Smile } from "lucide-react";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

interface MessageReactionsProps {
  messageId: Id<"messages">;
  currentUserId: Id<"users">;
  isOwnMessage: boolean;
}

export function MessageReactions({
  messageId,
  currentUserId,
  isOwnMessage,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const reactions = useQuery(api.reactions.getMessageReactions, { messageId });
  const toggleReaction = useMutation(api.reactions.toggleReaction);

  const handleReaction = async (emoji: string) => {
    await toggleReaction({
      messageId,
      userId: currentUserId,
      emoji,
    });
    setShowPicker(false);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {reactions && reactions.length > 0 &&
        reactions.map((reaction) => {
          const hasReacted = reaction.userIds.includes(currentUserId);
          return (
            <button
              key={reaction.emoji}
              onClick={() => handleReaction(reaction.emoji)}
              className={`px-2 py-1 rounded-full flex items-center gap-1 transition-all text-sm ${
                hasReacted
                  ? "bg-violet-100 text-violet-600 border-2 border-violet-400"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <span className="text-base">{reaction.emoji}</span>
              {reaction.count > 1 && (
                <span className="font-medium text-xs">{reaction.count}</span>
              )}
            </button>
          );
        })}

      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPicker(!showPicker)}
          className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-500 hover:text-slate-700"
        >
          <Smile className="w-4 h-4" />
        </Button>

        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowPicker(false)}
            />
            <div className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} bottom-full mb-2 bg-white border rounded-xl shadow-xl p-2 flex gap-1 z-20`}>
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-2xl hover:scale-125 transition-transform p-2 hover:bg-slate-100 rounded-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
