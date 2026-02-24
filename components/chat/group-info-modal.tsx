"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { X, UserPlus, Edit2, LogOut, UserMinus, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

interface GroupInfoModalProps {
  conversationId: Id<"conversations">;
  currentUserId: Id<"users">;
  groupName: string;
  isAdmin: boolean;
  onClose: () => void;
}

export function GroupInfoModal({
  conversationId,
  currentUserId,
  groupName,
  isAdmin,
  onClose,
}: GroupInfoModalProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(groupName);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const members = useQuery(api.conversations.getGroupMembers, { conversationId });
  const allUsers = useQuery(api.users.getAllUsers, { searchQuery });
  const updateGroupName = useMutation(api.conversations.updateGroupName);
  const addMember = useMutation(api.conversations.addMemberToGroup);
  const removeMember = useMutation(api.conversations.removeMemberFromGroup);
  const leaveGroup = useMutation(api.conversations.leaveGroup);

  const availableUsers = allUsers?.filter(
    (user) => !members?.some((member) => member._id === user._id)
  );

  const handleUpdateName = async () => {
    if (!newGroupName.trim()) return;
    try {
      await updateGroupName({
        conversationId,
        userId: currentUserId,
        newName: newGroupName.trim(),
      });
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update group name:", error);
    }
  };

  const handleAddMember = async (userId: Id<"users">) => {
    try {
      await addMember({
        conversationId,
        userId: currentUserId,
        newMemberId: userId,
      });
      setShowAddMember(false);
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to add member:", error);
    }
  };

  const handleRemoveMember = async (memberId: Id<"users">) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await removeMember({
        conversationId,
        userId: currentUserId,
        memberToRemove: memberId,
      });
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      await leaveGroup({
        conversationId,
        userId: currentUserId,
      });
      onClose();
    } catch (error) {
      console.error("Failed to leave group:", error);
      alert(error instanceof Error ? error.message : "Failed to leave group");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Group Info</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Group Name */}
          <div>
            <label className="text-sm font-medium mb-2 block">Group Name</label>
            {isEditingName && isAdmin ? (
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleUpdateName} size="sm">
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setIsEditingName(false);
                    setNewGroupName(groupName);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="font-medium">{groupName}</span>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                Members ({members?.length || 0})
              </label>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <UserPlus className="w-5 h-5 text-violet-600" />
                </button>
              )}
            </div>

            {showAddMember && isAdmin && (
              <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users to add..."
                  className="mb-2"
                />
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {availableUsers?.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleAddMember(user._id)}
                      className="w-full p-2 rounded-lg flex items-center gap-2 hover:bg-white transition-colors"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.imageUrl} alt={user.name} />
                        <AvatarFallback className="bg-violet-100 text-violet-600 text-xs">
                          {user.name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.name}</span>
                    </button>
                  ))}
                  {availableUsers?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No users found
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {members?.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.imageUrl} alt={member.name} />
                      <AvatarFallback className="bg-violet-100 text-violet-600">
                        {member.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      {member.isAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isAdmin && !member.isAdmin && (
                    <button
                      onClick={() => handleRemoveMember(member._id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <UserMinus className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          {!isAdmin && (
            <Button
              onClick={handleLeaveGroup}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave Group
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
