"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Search, User } from "lucide-react";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";

interface UserListProps {
  onSelectUser: (userId: Id<"users">) => void;
  currentUserId?: Id<"users">;
}

export function UserList({ onSelectUser, currentUserId }: UserListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const users = useQuery(api.users.getAllUsers, { searchQuery });

  const filteredUsers = users?.filter((user) => user._id !== currentUserId);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {!filteredUsers || filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
            <User className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => onSelectUser(user._id)}
                className="w-full p-4 hover:bg-accent transition-colors flex items-center gap-3 text-left"
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={user.imageUrl} alt={user.name} />
                    <AvatarFallback className="bg-violet-100 text-violet-600">
                      {user.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {user.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
