# Global Settings Feature

## Overview

Fitur Global Settings memungkinkan Admin untuk mengkonfigurasi aplikasi secara keseluruhan, termasuk branding, appearance, features, dan general settings.

## Features

### 1. Branding Settings

- **Application Name**: Nama aplikasi yang ditampilkan di navbar dan browser tab
- **Application Description**: Deskripsi aplikasi untuk SEO
- **Logo URL**: URL logo aplikasi
- **Favicon URL**: URL favicon aplikasi

### 2. Appearance Settings

- **Primary Color**: Warna utama aplikasi
- **Secondary Color**: Warna sekunder aplikasi
- **Accent Color**: Warna aksen aplikasi
- **Default Theme Mode**: Mode tema default (Light/Dark/System)

### 3. Feature Toggles

- **Real-time Notifications**: Enable/disable notifikasi real-time via Pusher
- **Time Tracking**: Enable/disable time tracking pada cards
- **Comments**: Enable/disable comments pada cards
- **Subtasks**: Enable/disable subtasks dalam cards

### 4. General Settings

- **Max Upload Size**: Ukuran maksimal file upload (MB)
- **Session Timeout**: Timeout session otomatis (minutes)
- **Items Per Page**: Jumlah item per halaman di lists

## Database Schema

```prisma
model AppSettings {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       String   @db.Text
  category    String   @default("general")
  description String?  @db.Text
  updatedAt   DateTime @updatedAt
  updatedBy   Int?

  @@map("app_settings")
}
```

## API Endpoints

### GET /api/settings

Mendapatkan semua settings atau setting spesifik.

**Query Parameters:**

- `key` (optional): Mendapatkan setting spesifik berdasarkan key
- `category` (optional): Filter settings berdasarkan category

**Response:**

```json
{
  "app_name": "UKK Project Management",
  "theme_primary_color": "#3b82f6",
  "feature_notifications": "true"
}
```

### PUT /api/settings

Update settings (Admin only).

**Request Body:**

```json
{
  "settings": {
    "app_name": "My Custom App",
    "theme_primary_color": "#ff0000"
  }
}
```

**Response:**

```json
{
  "success": true,
  "updated": 2
}
```

## Usage

### 1. Using Settings in Components

```tsx
import { useSettings } from "@/components/SettingsProvider";

function MyComponent() {
  const { settings, isFeatureEnabled } = useSettings();

  // Access settings
  const appName = settings.app_name;

  // Check if feature is enabled
  if (isFeatureEnabled("notifications")) {
    // Show notifications
  }

  return <div>{appName}</div>;
}
```

### 2. Using Settings Provider

The SettingsProvider is already integrated in `app/layout.tsx`:

```tsx
<SettingsProvider>
  <SessionProvider session={session}>{/* Your app */}</SessionProvider>
</SettingsProvider>
```

## Setup Instructions

### 1. Run Migration

```bash
cd ukk
npx prisma migrate dev --name add_app_settings
```

### 2. Seed Default Settings

```bash
npx tsx prisma/seed-settings.ts
```

### 3. Access Settings Page

Navigate to: `http://localhost:3000/admin/settings`

(Admin role required)

## Setting Keys Reference

### Branding

- `app_name`: Application name
- `app_description`: Application description
- `app_logo_url`: Logo URL
- `app_favicon_url`: Favicon URL

### Appearance

- `theme_primary_color`: Primary color (hex)
- `theme_secondary_color`: Secondary color (hex)
- `theme_accent_color`: Accent color (hex)
- `theme_default_mode`: Default theme (light/dark/system)

### Features

- `feature_notifications`: Enable notifications (true/false)
- `feature_time_tracking`: Enable time tracking (true/false)
- `feature_comments`: Enable comments (true/false)
- `feature_subtasks`: Enable subtasks (true/false)

### General

- `max_upload_size_mb`: Max upload size in MB
- `session_timeout_minutes`: Session timeout in minutes
- `items_per_page`: Items per page in lists

## Examples

### 1. Change App Name

1. Login as Admin
2. Go to `/admin/settings`
3. Navigate to "Branding" tab
4. Update "Application Name"
5. Click "Save Changes"

The new name will appear in:

- Browser tab title
- Navbar logo text
- Any place using `settings.app_name`

### 2. Customize Theme Colors

1. Go to "Appearance" tab
2. Use color pickers to select colors
3. See live preview
4. Save changes

Colors will be applied via CSS variables.

### 3. Disable Feature

1. Go to "Features" tab
2. Toggle off the feature
3. Save changes

Use `isFeatureEnabled("feature_name")` to check in code.

## Security Notes

- Only users with `ADMIN` role can update settings
- Settings are cached on client side and refetched when needed
- All settings are stored as strings in database
- Boolean features use "true"/"false" string values

## Future Enhancements

- [ ] Settings history/audit log
- [ ] Settings export/import
- [ ] Multiple theme presets
- [ ] Custom CSS injection
- [ ] Email template customization
- [ ] Localization settings
- [ ] File upload for logo/favicon
- [ ] Settings validation rules
