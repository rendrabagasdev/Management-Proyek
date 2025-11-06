import Pusher from "pusher";

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "2073537",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "c3a163cfc028456c9ef8",
  secret: process.env.PUSHER_SECRET || "9f5cdcda52fbb57abc1e",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1",
});

// Helper function untuk trigger events
export const triggerPusherEvent = async (
  channel: string,
  event: string,
  data: Record<string, unknown>
) => {
  try {
    await pusher.trigger(channel, event, data);
    console.log(`✅ Pusher event triggered: ${event} on ${channel}`);
  } catch (error) {
    console.error("❌ Failed to trigger Pusher event:", error);
  }
};

// Helper untuk project channel
export const triggerProjectEvent = (
  projectId: number | string,
  event: string,
  data: Record<string, unknown>
) => {
  return triggerPusherEvent(`project-${projectId}`, event, data);
};

// Helper untuk card channel
export const triggerCardEvent = (
  cardId: number | string,
  event: string,
  data: Record<string, unknown>
) => {
  return triggerPusherEvent(`card-${cardId}`, event, data);
};
