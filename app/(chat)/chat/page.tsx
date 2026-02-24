"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { UserList } from "../../../components/users/user-list";
import { ConversationSidebar } from "../../../components/chat/conversation-sidebar";
import { ChatWindow } from "../../../components/chat/chat-window";
import { CreateGroupModal } from "../../../components/chat/create-group-modal";
import { MessageCircle, Users, X, UsersRound } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { useSyncUser } from "../../../hooks/use-sync-user";
import { usePresence } from "../../../hooks/use-presence";

export default function ChatPage() {
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip"
  );
  const createOrGetConversation = useMutation(
    api.conversations.createOrGetConversation
  );

  const [selectedConversationId, setSelectedConversationId] = useState<
    Id<"conversations"> | null
  >(null);
  const [showUserList, setShowUserList] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  useSyncUser();
  usePresence();

  const conversations = useQuery(
    api.conversations.getUserConversations,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const selectedConversation = conversations?.find(
    (c) => c._id === selectedConversationId
  );

  const handleSelectUser = async (userId: Id<"users">) => {
    if (!currentUser) return;

    const conversationId = await createOrGetConversation({
      currentUserId: currentUser._id,
      otherUserId: userId,
    });

    setSelectedConversationId(conversationId);
    setShowUserList(false);
    setShowSidebar(false);
  };

  if (!user || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Mobile overlay */}
      {(showSidebar || showUserList) && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => {
            setShowSidebar(false);
            setShowUserList(false);
          }}
        />
      )}

      {/* Sidebar - Conversations */}
      <div
        className={`${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:relative z-50 w-80 bg-white border-r h-full transition-transform duration-300`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Messages</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGroupModal(true)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Create group"
            >
              <UsersRound className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowUserList(true)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="New chat"
            >
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <ConversationSidebar
          userId={currentUser._id}
          selectedConversationId={selectedConversationId || undefined}
          onSelectConversation={(id) => {
            setSelectedConversationId(id);
            setShowSidebar(false);
          }}
        />
      </div>

      {/* User List Modal */}
      {showUserList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg">Select User</h2>
              <button
                onClick={() => setShowUserList(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <UserList
              onSelectUser={handleSelectUser}
              currentUserId={currentUser._id}
            />
          </div>
        </div>
      )}

      {/* Group Creation Modal */}
      {showGroupModal && (
        <CreateGroupModal
          currentUserId={currentUser._id}
          onClose={() => setShowGroupModal(false)}
          onGroupCreated={(id) => {
            setSelectedConversationId(id);
            setShowSidebar(false);
          }}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden p-4 border-b flex items-center gap-2 hover:bg-slate-50"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Back to conversations</span>
            </button>
            <ChatWindow
              conversationId={selectedConversation._id}
              currentUserId={currentUser._id}
              otherUser={{
                name: selectedConversation.displayName,
                imageUrl: selectedConversation.displayImage,
                isOnline: selectedConversation.otherUser?.isOnline || false,
              }}
              isGroup={selectedConversation.isGroup}
              memberCount={selectedConversation.memberCount}
              groupName={selectedConversation.displayName}
              isAdmin={selectedConversation.createdBy === currentUser._id}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
            <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Welcome to Chat</h3>
            <p className="text-center mb-4">
              Select a conversation or start a new chat
            </p>
            <button
              onClick={() => setShowUserList(true)}
              className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors"
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
