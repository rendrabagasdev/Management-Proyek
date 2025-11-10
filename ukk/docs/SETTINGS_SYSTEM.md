# Settings System Documentation

## Overview

Sistem settings global yang memungkinkan admin untuk mengkonfigurasi aplikasi melalui UI tanpa perlu mengubah kode.

## Features

### 1. **Branding Settings**

- Application Name
- Application Description
- Logo URL
- Favicon URL

### 2. **Appearance Settings**

- Primary Color
- Secondary Color
- Accent Color
- Default Theme Mode (light/dark/system)

### 3. **Feature Toggles**

- Notifications (Pusher)
- Time Tracking
- Comments
- Subtasks

### 4. **General Settings**

- Max Upload Size (MB)
- Session Timeout (Minutes)
- Items Per Page

## Database

Settings disimpan di tabel `app_settings`:

```prisma
model AppSettings {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       String   @db.Text
  category    String   @default("general")
  description String?  @db.Text
  updatedAt   DateTime @updatedAt
  updatedBy   Int?
}
```

## API Endpoints

### GET /api/settings

Mengambil semua settings (membutuhkan autentikasi)

**Response:**

```json
{
  "app_name": "UKK Project Management",
  "theme_primary_color": "#3b82f6",
  "feature_notifications": "true",
  ...
}
```

### PUT /api/settings

Update settings (hanya ADMIN)

**Request:**

```json
{
  "settings": {
    "app_name": "New Name",
    "theme_primary_color": "#ff0000"
  }
}
```

## Usage

### 1. Using Hooks

```tsx
import { useSettings, useFeature, useSetting } from "@/hooks/use-settings";

function MyComponent() {
  // Get all settings
  const { settings, loading, refetch } = useSettings();

  // Check if feature is enabled
  const notificationsEnabled = useFeature("notifications");

  // Get specific setting with default
  const appName = useSetting("app_name", "Default App");

  return (
    <div>
      <h1>{appName}</h1>
      {notificationsEnabled && <NotificationBell />}
    </div>
  );
}
```

### 2. Using Context Directly

```tsx
"use client";

import { useSettings } from "@/components/SettingsProvider";

function MyComponent() {
  const { settings, loading, isFeatureEnabled } = useSettings();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{settings.app_name}</h1>
      {isFeatureEnabled("comments") && <CommentSection />}
    </div>
  );
}
```

### 3. Admin Settings Page

Admin dapat mengakses settings di: `/admin/settings`

Features:

- ✅ Tab-based interface (Branding, Appearance, Features, General)
- ✅ Real-time color picker untuk theme colors
- ✅ Toggle switches untuk features
- ✅ Input validation
- ✅ Auto-save dengan toast notification

## Setup

### 1. Seed Default Settings

```bash
npx tsx scripts/seed-settings.ts
```

### 2. Verify Settings in Database

```sql
SELECT * FROM app_settings;
```

## Implementation Details

### SettingsProvider

Provider yang wrap seluruh aplikasi dan menyediakan settings context:

```tsx
<SettingsProvider>
  <YourApp />
</SettingsProvider>
```

Features:

- Auto-fetch settings on mount
- Apply theme colors to CSS variables
- Update favicon and page title
- Expose `refetch()` untuk reload settings

### Auto-Applied Settings

Settings berikut di-apply otomatis:

1. **Theme Colors** → CSS variables

   - `theme_primary_color` → `--color-primary-custom`
   - `theme_secondary_color` → `--color-secondary-custom`
   - `theme_accent_color` → `--color-accent-custom`

2. **Favicon** → `<link rel="icon">`

3. **Page Title** → `document.title`

## Feature Flags

Gunakan feature flags untuk enable/disable fitur:

```tsx
const { isFeatureEnabled } = useSettings();

// Conditional rendering
{
  isFeatureEnabled("notifications") && <NotificationBell />;
}

// Conditional logic
if (isFeatureEnabled("time_tracking")) {
  startTimeTracking();
}
```

## Best Practices

1. **Always provide defaults:**

   ```tsx
   const appName = useSetting("app_name", "My App");
   ```

2. **Handle loading state:**

   ```tsx
   const { settings, loading } = useSettings();
   if (loading) return <Spinner />;
   ```

3. **Refetch after updates:**

   ```tsx
   const { refetch } = useSettings();

   async function updateSettings() {
     await fetch("/api/settings", { method: "PUT", ... });
     await refetch(); // Reload settings
   }
   ```

4. **Use feature flags consistently:**

   ```tsx
   // ✅ Good
   const enabled = useFeature("notifications");

   // ❌ Bad (direct access)
   const enabled = settings.feature_notifications === "true";
   ```

## Security

- ✅ GET endpoint requires authentication
- ✅ PUT endpoint requires ADMIN role
- ✅ Settings tracked with `updatedBy` field
- ✅ Input validation on API level

## Testing

```bash
# Test GET endpoint
curl http://localhost:3000/api/settings \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# Test PUT endpoint (as admin)
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=ADMIN_TOKEN" \
  -d '{"settings":{"app_name":"Test App"}}'
```

## Troubleshooting

### Settings not loading?

1. Check if seed script ran successfully
2. Verify database connection
3. Check browser console for errors
4. Ensure user is authenticated

### Changes not applying?

1. Check if user is ADMIN
2. Verify API response (200 OK)
3. Call `refetch()` after update
4. Clear browser cache

### Theme colors not working?

1. Check CSS variable names
2. Verify color format (hex)
3. Inspect element to see applied styles

## Future Enhancements

- [ ] Settings history/audit log
- [ ] Revert to default button
- [ ] Import/Export settings
- [ ] Settings validation schema
- [ ] Multi-language support
- [ ] Settings search/filter
