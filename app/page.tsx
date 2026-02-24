"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MessageCircle, Zap, Users, Bell } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <SignedOut>
        <div className="text-center max-w-2xl px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/30 animate-pulse">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome to Chat App
          </h1>
          <p className="text-slate-600 mb-8 text-lg">
            Connect with others in real-time. Experience seamless communication
            with modern features.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Zap className="w-8 h-8 text-violet-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Real-time Messaging</h3>
                <p className="text-sm text-muted-foreground">
                  Instant message delivery powered by Convex
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Users className="w-8 h-8 text-violet-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Online Presence</h3>
                <p className="text-sm text-muted-foreground">
                  See who's online and available to chat
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Bell className="w-8 h-8 text-violet-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Smart Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Never miss a message with unread counts
                </p>
              </CardContent>
            </Card>
          </div>

          <SignInButton mode="modal">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
              Get Started
            </Button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <RedirectToChat />
      </SignedIn>
    </div>
  );
}

function RedirectToChat() {
  const router = useRouter();

  useEffect(() => {
    router.push("/chat");
  }, [router]);

  return (
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
  );
}
