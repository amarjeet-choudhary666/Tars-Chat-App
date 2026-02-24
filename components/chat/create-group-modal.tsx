"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { X, Users as UsersIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface CreateGroupModalProps {
  currentUserId: Id<"users">;
  onClose: () => void;
  onGroupCreated: (conversationId: Id<"conversations">) => void;
}

export function CreateGroupModal({
  currentUserId,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const users = useQuery(api.users.getAllUsers, { searchQuery });
  const createGroup = useMutation(api.conversations.createGroupConversation);

  const filteredUsers = users?.filter((user) => user._id !== currentUserId);

  const toggleUser = (userId: Id<"users">) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    const conversationId = await createGroup({
      createdBy: currentUserId,
      participants: [currentUserId, ...selectedUsers],
      groupName: groupName.trim(),
    });

    onGroupCreated(conversationId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            Create Group Chat
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="text-sm font-medium mb-2 block">Group Name</label>
            <Input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Add Members ({selectedUsers.length} selected)
            </label>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full mb-3"
            />

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredUsers?.map((user) => (
                <button
                  key={user._id}
                  onClick={() => toggleUser(user._id)}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                    selectedUsers.includes(user._id)
                      ? "bg-violet-100 border-2 border-violet-400"
                      : "hover:bg-slate-100 border-2 border-transparent"
                  }`}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.imageUrl} alt={user.name} />
                    <AvatarFallback className="bg-violet-100 text-violet-600">
                      {user.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  {selectedUsers.includes(user._id) && (
                    <div className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedUsers.length === 0}
            className="flex-1 bg-violet-600 hover:bg-violet-700"
          >
            Create Group
          </Button>
        </div>
      </div>
    </div>
  );
}
