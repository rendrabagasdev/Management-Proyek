# Pusher Realtime Implementation

## Overview

This document describes the implementation of realtime functionality using Pusher in the UKK project.

## Setup

### Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_PUSHER_KEY=c3a163cfc028456c9ef8
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
PUSHER_APP_ID=2073537
PUSHER_SECRET=9f5cdcda52fbb57abc1e
```

### Dependencies

```bash
npm install pusher pusher-js
```

## Architecture

### Server-Side (lib/pusher.ts)

Helper functions to trigger events:

- `triggerPusherEvent(channel, event, data)` - Generic trigger
- `triggerProjectEvent(projectId, event, data)` - Trigger on project channel
- `triggerCardEvent(cardId, event, data)` - Trigger on card channel

### Client-Side (lib/pusher-client.ts)

React hooks for subscribing to channels:

- `usePusherChannel(channelName)` - Subscribe to a channel
- `usePusherEvent(channel, event, callback)` - Listen to specific events

## Channel Structure

### Project Channels

- **Pattern**: `project-{projectId}`
- **Purpose**: Board-level updates (kanban view)
- **Events**:
  - `card:created` - New card added
  - `card:updated` - Card status/priority changed
  - `card:deleted` - Card removed
  - `card:assigned` - Card assigned to user

### Card Channels

- **Pattern**: `card-{cardId}`
- **Purpose**: Card detail updates
- **Events**:
  - `card:updated` - Card details changed
  - `card:assigned` - Card assigned
  - `comment:created` - New comment added
  - `subtask:created` - New subtask added
  - `subtask:updated` - Subtask status changed
  - `subtask:deleted` - Subtask removed
  - `timelog:started` - Timer started
  - `timelog:stopped` - Timer stopped

## API Integration Status

### ✅ Completed

1. **Comments API** (`app/api/cards/[id]/comments/route.ts`)

   - POST: `comment:created` event

2. **Card Update API** (`app/api/cards/[id]/route.ts`)

   - PATCH: `card:updated` events (both card and project channels)
   - DELETE: `card:deleted` event

3. **Card Creation API** (`app/api/cards/route.ts`)

   - POST: `card:created` event

4. **Subtasks API** (`app/api/cards/[id]/subtasks/route.ts`)

   - POST: `subtask:created` event

5. **Subtask Update/Delete API** (`app/api/cards/[id]/subtasks/[subtaskId]/route.ts`)

   - PATCH: `subtask:updated` event
   - DELETE: `subtask:deleted` event

6. **Time Tracking API** (`app/api/cards/[id]/time/route.ts`)

   - POST: `timelog:started` event
   - PATCH: `timelog:stopped` event

7. **Card Assignment API** (`app/api/cards/[id]/assign/route.ts`)
   - PATCH: `card:assigned` event (both card and project channels)

## Event Data Format

All events include:

```typescript
{
  // Entity data (card, comment, subtask, etc.)
  card?: Card,
  comment?: Comment,
  subtask?: Subtask,
  timeLog?: TimeLog,

  // Metadata
  userId: number,        // User who triggered the action
  timestamp: string,     // ISO 8601 timestamp
  boardId?: number,      // For project-level events
}
```

## Next Steps

### UI Integration

1. **KanbanBoard Component**

   - Subscribe to `project-{projectId}`
   - Listen: `card:created`, `card:updated`, `card:deleted`, `card:assigned`
   - Update board state when events received
   - Show toast notifications

2. **CardDetail Component**
   - Subscribe to `card-{cardId}`
   - Listen: all card-level events
   - Refresh card data or update specific sections
   - Show who made the change

### Example Usage

#### In KanbanBoard:

```typescript
const channel = usePusherChannel(`project-${projectId}`);

usePusherEvent(channel, "card:created", (data) => {
  // Add card to board
  setCards((prev) => [...prev, data.card]);
  toast.success(`New card created by ${data.user.name}`);
});

usePusherEvent(channel, "card:updated", (data) => {
  // Update card in board
  setCards((prev) => prev.map((c) => (c.id === data.card.id ? data.card : c)));
});
```

#### In CardDetail:

```typescript
const channel = usePusherChannel(`card-${cardId}`);

usePusherEvent(channel, "comment:created", (data) => {
  // Add comment to list
  setComments((prev) => [...prev, data.comment]);
  if (data.userId !== currentUserId) {
    toast.info(`${data.comment.user.name} added a comment`);
  }
});

usePusherEvent(channel, "subtask:updated", (data) => {
  // Update subtask
  setSubtasks((prev) =>
    prev.map((s) => (s.id === data.subtask.id ? data.subtask : s))
  );
});
```

## Testing

### Manual Testing

1. Open same project in two browser windows
2. Perform action in window 1
3. Verify update appears in window 2 without refresh

### Test Cases

- [ ] Create card → appears in other user's board
- [ ] Update card status → reflects immediately
- [ ] Add comment → shows in other user's view
- [ ] Start timer → other users see "In Progress"
- [ ] Complete subtask → checkbox updates for all
- [ ] Assign card → assignee sees notification

### Pusher Dashboard

- Monitor event delivery at https://dashboard.pusher.com/
- Check connection count
- View debug console for event logs

## Performance Considerations

1. **Connection Management**

   - Single Pusher instance per client (singleton pattern)
   - Automatic reconnection on disconnect
   - Unsubscribe when component unmounts

2. **Event Throttling**

   - Debounce rapid updates (e.g., typing in description)
   - Batch multiple changes into single event when possible

3. **Data Size**
   - Only send necessary data in events
   - Use IDs instead of full nested objects when possible
   - Current events are optimized with includes

## Security

1. **Private Channels** (Future Enhancement)

   - Use `private-project-{id}` channels
   - Implement authentication endpoint
   - Verify user access before allowing subscription

2. **Event Authorization**
   - All events triggered by authenticated API endpoints
   - User permissions checked before triggering events
   - No direct client-side event triggering

## Troubleshooting

### Events Not Received

1. Check Pusher credentials in `.env.local`
2. Verify channel subscription in browser console
3. Check Pusher dashboard for event delivery
4. Ensure `NEXT_PUBLIC_` prefix for client-side vars

### Multiple Events

1. Check for duplicate `usePusherEvent` hooks
2. Verify cleanup in useEffect return
3. Monitor connection count in Pusher dashboard

### Stale Data

1. Ensure event data includes latest state
2. Check includes in Prisma queries
3. Verify event triggered AFTER database update

## Resources

- Pusher Docs: https://pusher.com/docs/
- Pusher Channels: https://pusher.com/docs/channels/
- React Integration: https://pusher.com/docs/channels/using_channels/react/
