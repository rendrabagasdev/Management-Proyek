// Example: Using feature flags in components

import { useSettings } from "@/components/SettingsProvider";

export function CardDetailsExample() {
  const { isFeatureEnabled } = useSettings();

  return (
    <div>
      <h1>Card Details</h1>

      {/* Show comments section only if feature is enabled */}
      {isFeatureEnabled("comments") && (
        <div className="comments-section">
          <h2>Comments</h2>
          {/* Comment components */}
        </div>
      )}

      {/* Show time tracking only if feature is enabled */}
      {isFeatureEnabled("time_tracking") && (
        <div className="time-tracking">
          <h2>Time Logs</h2>
          {/* Time log components */}
        </div>
      )}

      {/* Show subtasks only if feature is enabled */}
      {isFeatureEnabled("subtasks") && (
        <div className="subtasks">
          <h2>Subtasks</h2>
          {/* Subtask components */}
        </div>
      )}
    </div>
  );
}

// Example: Using settings for customization
export function CustomHeader() {
  const { settings } = useSettings();

  return (
    <header style={{ backgroundColor: settings.theme_primary_color }}>
      <h1>{settings.app_name || "Default App Name"}</h1>
      <p>{settings.app_description}</p>
    </header>
  );
}

// Example: Using settings in API routes
import { prisma } from "@/lib/prisma";

export async function checkFeatureEnabled(feature: string): Promise<boolean> {
  const setting = await prisma.appSettings.findUnique({
    where: { key: `feature_${feature}` },
  });

  return setting?.value === "true";
}

// Usage in API route
export async function POST(req: Request) {
  const notificationsEnabled = await checkFeatureEnabled("notifications");

  if (notificationsEnabled) {
    // Send notification
  }

  // Rest of the API logic
}
