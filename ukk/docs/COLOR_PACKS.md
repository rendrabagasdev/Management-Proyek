# Color Packs / Paket Warna

## Overview

Sistem Color Packs memungkinkan admin untuk memilih tema warna siap pakai atau customize sendiri.

## Available Color Packs

### 1. Ocean Blue (Default)

- **Primary:** #3b82f6 (Blue)
- **Secondary:** #8b5cf6 (Purple)
- **Accent:** #f59e0b (Amber)
- **Style:** Professional, trustworthy, modern

### 2. Forest Green

- **Primary:** #10b981 (Emerald)
- **Secondary:** #14b8a6 (Teal)
- **Accent:** #f59e0b (Amber)
- **Style:** Natural, calming, eco-friendly

### 3. Sunset Orange

- **Primary:** #f97316 (Orange)
- **Secondary:** #ef4444 (Red)
- **Accent:** #eab308 (Yellow)
- **Style:** Energetic, warm, creative

### 4. Royal Purple

- **Primary:** #9333ea (Purple)
- **Secondary:** #ec4899 (Pink)
- **Accent:** #06b6d4 (Cyan)
- **Style:** Elegant, luxurious, creative

### 5. Crimson Red

- **Primary:** #dc2626 (Red)
- **Secondary:** #f97316 (Orange)
- **Accent:** #eab308 (Yellow)
- **Style:** Bold, passionate, attention-grabbing

### 6. Midnight Blue

- **Primary:** #1e40af (Deep Blue)
- **Secondary:** #7c3aed (Violet)
- **Accent:** #06b6d4 (Cyan)
- **Style:** Professional, sophisticated, corporate

### 7. Mint Fresh

- **Primary:** #14b8a6 (Teal)
- **Secondary:** #10b981 (Emerald)
- **Accent:** #22c55e (Green)
- **Style:** Fresh, modern, health-focused

### 8. Rose Gold

- **Primary:** #ec4899 (Pink)
- **Secondary:** #f43f5e (Rose)
- **Accent:** #fb923c (Orange)
- **Style:** Elegant, feminine, trendy

## How to Use

1. **Go to Admin Settings:** Navigate to `/admin/settings`
2. **Select Appearance Tab:** Click on the "Appearance" tab
3. **Choose a Color Pack:** Click on any of the 8 preset color packs
4. **Or Customize Manually:** Use the color pickers below to create your own theme
5. **Save Changes:** Click "Save Changes" button

## Technical Implementation

### Color Pack Structure

```typescript
{
  id: string; // Unique identifier
  name: string; // Display name
  description: string; // Short description
  primary: string; // Primary color (hex)
  secondary: string; // Secondary color (hex)
  accent: string; // Accent color (hex)
  preview: string; // Tailwind gradient class for preview
}
```

### Applying a Color Pack

When a color pack is selected:

1. The three colors are applied to the settings state
2. A toast notification confirms the application
3. The selected pack is highlighted with a blue border
4. User must click "Save Changes" to persist

### CSS Variables Applied

- `--theme-primary` - Main brand color
- `--theme-primary-light` - Lighter shade for backgrounds
- `--theme-primary-dark` - Darker shade for hover states
- `--theme-secondary` - Secondary brand color
- `--theme-accent` - Accent color for highlights

## Adding New Color Packs

To add a new color pack, edit `/app/admin/settings/page.tsx`:

```typescript
const COLOR_PACKS = [
  // ... existing packs
  {
    id: "your-pack-id",
    name: "Your Pack Name",
    description: "Short description",
    primary: "#hexcode",
    secondary: "#hexcode",
    accent: "#hexcode",
    preview: "bg-gradient-to-r from-color-500 via-color-500 to-color-500",
  },
];
```

## UI Components

- **Color Pack Card:** Shows preview gradient, name, description, and color swatches
- **Manual Color Pickers:** Allow custom color selection
- **Live Preview:** Color blocks show selected colors in real-time
- **Responsive Design:** Grid adapts from 1 to 4 columns based on screen size

## Best Practices

1. **Contrast:** Ensure sufficient contrast between colors for accessibility
2. **Branding:** Choose colors that align with your brand identity
3. **Testing:** Test the theme in both light and dark modes
4. **Consistency:** Stick to one color pack across the application
5. **User Feedback:** Gather feedback before finalizing a color scheme

## Related Files

- `/app/admin/settings/page.tsx` - Admin settings with color packs
- `/components/SettingsProvider.tsx` - Applies theme colors
- `/app/globals.css` - CSS variable definitions
- `/docs/THEME_COLORS_IMPLEMENTATION.md` - Technical implementation details
