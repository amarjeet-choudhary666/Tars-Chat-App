# Real-Time Chat App Setup Guide

## Features Implemented ✅

1. ✅ User list + search
2. ✅ Real-time messaging with Convex
3. ✅ Sidebar with conversations
4. ✅ Message timestamps
5. ✅ Empty states
6. ✅ Responsive UI (desktop/mobile)
7. ✅ Online/offline status
8. ✅ Typing indicator
9. ✅ Unread message count
10. ✅ Smart auto-scroll

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Convex

```bash
# Initialize Convex (if not already done)
npx convex dev
```

This will:
- Create a Convex project
- Generate your `NEXT_PUBLIC_CONVEX_URL`
- Start the Convex dev server

### 3. Update Environment Variables

Add the Convex URL to `.env.local`:
```env
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### 4. Run Development Server

In one terminal:
```bash
npx convex dev
```

In another terminal:
```bash
npm run dev
```

### 5. Access the App

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── convex/                    # Convex backend
│   ├── schema.ts             # Database schema
│   ├── users.ts              # User queries/mutations
│   ├── conversations.ts      # Conversation logic
│   └── messages.ts           # Message handling
├── app/
│   ├── (chat)/
│   │   └── chat/
│   │       └── page.tsx      # Main chat page
│   ├── components/
│   │   ├── chat/             # Chat components
│   │   └── users/            # User components
│   └── layout.tsx            # Root layout
├── hooks/                     # Custom React hooks
│   ├── use-presence.ts       # Online/offline tracking
│   └── use-sync-user.ts      # User sync with Convex
└── lib/
    └── convex-provider.tsx   # Convex + Clerk provider
```

## Key Technologies

- **Next.js 15** - React framework
- **Convex** - Real-time database
- **Clerk** - Authentication
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **date-fns** - Date formatting

## Features Breakdown

### Real-time Updates
- Messages appear instantly using Convex subscriptions
- Typing indicators update in real-time
- Online/offline status syncs automatically

### Responsive Design
- Desktop: Sidebar + chat view
- Mobile: Full-screen chat with toggleable sidebar

### Smart Scrolling
- Auto-scrolls to new messages
- Shows scroll-to-bottom button when scrolled up
- Maintains scroll position when loading history

### Presence System
- Heartbeat every 30 seconds
- Updates on visibility change
- Shows green dot for online users

### Unread Counts
- Tracks unread messages per conversation
- Auto-marks as read when viewing
- Shows badge on conversation list

## Troubleshooting

### Convex not connecting
- Make sure `npx convex dev` is running
- Check `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
- Restart the dev server

### Users not syncing
- Verify Clerk credentials are correct
- Check browser console for errors
- Ensure user is signed in

### Messages not sending
- Check Convex dev server logs
- Verify conversation exists
- Check network tab for failed requests
