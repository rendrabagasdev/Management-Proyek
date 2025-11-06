"use client";

import { useEffect, useState } from "react";
import PusherClient, { Channel } from "pusher-js";

// Initialize Pusher client (browser)
let pusherClient: PusherClient | null = null;

export const getPusherClient = () => {
  if (!pusherClient) {
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return pusherClient;
};

// Hook untuk subscribe ke channel
export const usePusherChannel = (channelName: string) => {
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    const pusher = getPusherClient();
    const newChannel = pusher.subscribe(channelName);

    // Use timeout to avoid setState during render
    const timer = setTimeout(() => {
      setChannel(newChannel);
    }, 0);

    return () => {
      clearTimeout(timer);
      pusher.unsubscribe(channelName);
    };
  }, [channelName]);

  return channel;
};

// Hook untuk listen event di channel
export const usePusherEvent = (
  channelName: string,
  eventName: string,
  callback: (data: Record<string, unknown>) => void
) => {
  const channel = usePusherChannel(channelName);

  useEffect(() => {
    if (channel) {
      channel.bind(eventName, callback);

      return () => {
        channel.unbind(eventName, callback);
      };
    }
  }, [channel, eventName, callback]);
};

// Types untuk Pusher events
export type PusherEvent =
  | "card:created"
  | "card:updated"
  | "card:deleted"
  | "card:moved"
  | "card:assigned"
  | "comment:created"
  | "comment:deleted"
  | "subtask:created"
  | "subtask:updated"
  | "subtask:deleted"
  | "timelog:started"
  | "timelog:stopped"
  | "board:created"
  | "board:updated"
  | "board:deleted"
  | "member:added"
  | "member:removed";

export interface PusherEventData {
  type: PusherEvent;
  data: Record<string, unknown>;
  userId: number;
  timestamp: string;
}
