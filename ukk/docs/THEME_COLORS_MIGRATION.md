# Theme Colors Migration Guide

## 🎨 Overview

Panduan untuk migrasi dari hardcoded colors (bg-blue-500, text-red-600, dll) ke dynamic theme colors yang bisa dikonfigurasi melalui settings.

## ✅ Benefits

- 🎨 Colors bisa diubah melalui Admin Settings tanpa code changes
- 🌗 Otomatis menyesuaikan dengan light/dark mode
- 🔄 Konsisten di seluruh aplikasi
- 📱 Mudah maintenance dan customization

## 📋 Available Theme Colors

### Primary Colors (Customizable via Settings)

- `--theme-primary` - Main brand color
- `--theme-primary-light` - Lighter variant
- `--theme-primary-dark` - Darker variant

### Secondary Colors (Customizable via Settings)

- `--theme-secondary` - Secondary brand color
- `--theme-secondary-light`
- `--theme-secondary-dark`

### Accent Colors (Customizable via Settings)

- `--theme-accent` - Accent/highlight color
- `--theme-accent-light`
- `--theme-accent-dark`

### Status Colors (Fixed)

- `--theme-success` (#10b981 - Green)
- `--theme-warning` (#f59e0b - Orange/Yellow)
- `--theme-danger` (#ef4444 - Red)
- `--theme-info` (#3b82f6 - Blue)

## 🔧 Migration Patterns

### Pattern 1: Using Utility Classes

**❌ Before (Hardcoded):**

```tsx
<button className="bg-blue-500 hover:bg-blue-600 text-white">Click Me</button>
```

**✅ After (Theme-aware):**

```tsx
import { themeButton } from "@/lib/theme-utils";

<button className={`${themeButton.primary} px-4 py-2 rounded`}>
  Click Me
</button>;
```

### Pattern 2: Using CSS Variables Directly

**❌ Before:**

```tsx
<div className="bg-blue-100 text-blue-800 border-blue-200">Info message</div>
```

**✅ After:**

```tsx
<div className="bg-[var(--theme-primary)] bg-opacity-10 text-[var(--theme-primary)] border-[var(--theme-primary)] border">
  Info message
</div>
```

### Pattern 3: Using Predefined Components

**❌ Before:**

```tsx
<div className="bg-blue-50 border-l-4 border-blue-500 p-4">
  <h3 className="text-blue-800">Title</h3>
</div>
```

**✅ After:**

```tsx
import { themeCard, themeText } from "@/lib/theme-utils";

<div className={`${themeCard.primary} bg-opacity-5 p-4`}>
  <h3 className={themeText.primary}>Title</h3>
</div>;
```

### Pattern 4: Badge/Pill Components

**❌ Before:**

```tsx
<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Status</span>
```

**✅ After:**

```tsx
import { themeBadge } from "@/lib/theme-utils";

<span className={`${themeBadge.primary} px-2 py-1 rounded`}>Status</span>;
```

### Pattern 5: Inline Styles

**❌ Before:**

```tsx
<div style={{ backgroundColor: "#3b82f6", color: "white" }}>Content</div>
```

**✅ After:**

```tsx
import { themeStyle } from "@/lib/theme-utils";

<div
  style={{
    ...themeStyle("bg", "primary"),
    color: "white",
  }}
>
  Content
</div>;
```

## 🎯 Common Use Cases

### Buttons

```tsx
import { themeButton } from "@/lib/theme-utils";

// Primary button
<button className={`${themeButton.primary} px-4 py-2 rounded`}>
  Save
</button>

// Secondary button
<button className={`${themeButton.secondary} px-4 py-2 rounded`}>
  Cancel
</button>

// Outline button
<button className={`${themeButton.outline} px-4 py-2 rounded`}>
  Edit
</button>

// Success button
<button className={`${themeButton.success} px-4 py-2 rounded`}>
  Confirm
</button>

// Danger button
<button className={`${themeButton.danger} px-4 py-2 rounded`}>
  Delete
</button>
```

### Cards

```tsx
import { themeCard } from "@/lib/theme-utils";

<div className={`${themeCard.primary} bg-card rounded-lg p-6 shadow`}>
  <h2>Card Title</h2>
  <p>Card content</p>
</div>;
```

### Badges

```tsx
import { themeBadge } from "@/lib/theme-utils";

<span className={`${themeBadge.success} px-2 py-1 rounded text-xs`}>
  Active
</span>

<span className={`${themeBadge.warning} px-2 py-1 rounded text-xs`}>
  Pending
</span>

<span className={`${themeBadge.danger} px-2 py-1 rounded text-xs`}>
  Error
</span>
```

### Alerts/Notifications

```tsx
import { themeBg, themeText, themeBorder } from "@/lib/theme-utils";

// Success alert
<div className={`${themeBg.success} bg-opacity-10 ${themeBorder.success} ${themeText.success} border-l-4 p-4`}>
  Operation successful!
</div>

// Warning alert
<div className={`${themeBg.warning} bg-opacity-10 ${themeBorder.warning} ${themeText.warning} border-l-4 p-4`}>
  Please review this.
</div>

// Danger alert
<div className={`${themeBg.danger} bg-opacity-10 ${themeBorder.danger} ${themeText.danger} border-l-4 p-4`}>
  Error occurred!
</div>
```

### Icons with Theme Colors

```tsx
import { themeText } from "@/lib/theme-utils";
import { FaCheck, FaExclamation, FaTimes } from "react-icons/fa";

<FaCheck className={`${themeText.success} text-xl`} />
<FaExclamation className={`${themeText.warning} text-xl`} />
<FaTimes className={`${themeText.danger} text-xl`} />
```

## 📝 Color Mapping Guide

### Blue Colors → Primary

```tsx
// ❌ Before
bg-blue-50    → bg-[var(--theme-primary)] bg-opacity-5
bg-blue-100   → bg-[var(--theme-primary)] bg-opacity-10
bg-blue-500   → bg-[var(--theme-primary)]
bg-blue-600   → bg-[var(--theme-primary-dark)]
text-blue-600 → text-[var(--theme-primary)]
border-blue-500 → border-[var(--theme-primary)]
```

### Purple Colors → Secondary

```tsx
// ❌ Before
bg-purple-50    → bg-[var(--theme-secondary)] bg-opacity-5
bg-purple-100   → bg-[var(--theme-secondary)] bg-opacity-10
bg-purple-500   → bg-[var(--theme-secondary)]
bg-purple-600   → bg-[var(--theme-secondary-dark)]
text-purple-600 → text-[var(--theme-secondary)]
```

### Orange/Yellow Colors → Accent

```tsx
// ❌ Before
bg-orange-50    → bg-[var(--theme-accent)] bg-opacity-5
bg-orange-500   → bg-[var(--theme-accent)]
text-orange-600 → text-[var(--theme-accent)]
```

### Green Colors → Success

```tsx
// ❌ Before
bg-green-50    → bg-[var(--theme-success)] bg-opacity-5
bg-green-100   → bg-[var(--theme-success)] bg-opacity-10
bg-green-500   → bg-[var(--theme-success)]
text-green-600 → text-[var(--theme-success)]
```

### Red Colors → Danger

```tsx
// ❌ Before
bg-red-50    → bg-[var(--theme-danger)] bg-opacity-5
bg-red-100   → bg-[var(--theme-danger)] bg-opacity-10
bg-red-500   → bg-[var(--theme-danger)]
text-red-600 → text-[var(--theme-danger)]
```

## 🔍 Finding Hardcoded Colors

Use regex search to find hardcoded colors:

```bash
# Find Tailwind color classes
grep -r "bg-\(blue\|red\|green\|purple\|orange\|yellow\)-[0-9]" .

# Find text color classes
grep -r "text-\(blue\|red\|green\|purple\|orange\|yellow\)-[0-9]" .

# Find border color classes
grep -r "border-\(blue\|red\|green\|purple\|orange\|yellow\)-[0-9]" .

# Find hex colors in inline styles
grep -r "#[0-9a-fA-F]\{6\}" .
```

## ✨ Advanced Usage

### Custom Theme Hook

```tsx
import { getThemeColor } from "@/lib/theme-utils";

function MyComponent() {
  const primaryColor = getThemeColor("primary");
  const secondaryColor = getThemeColor("secondary");

  return (
    <div>
      <p>Primary: {primaryColor}</p>
      <p>Secondary: {secondaryColor}</p>
    </div>
  );
}
```

### Conditional Theme Colors

```tsx
import { themeBg, themeText } from "@/lib/theme-utils";

function StatusBadge({ status }: { status: string }) {
  const getStatusClass = () => {
    switch (status) {
      case "active":
        return themeBadge.success;
      case "pending":
        return themeBadge.warning;
      case "error":
        return themeBadge.danger;
      default:
        return themeBadge.info;
    }
  };

  return (
    <span className={`${getStatusClass()} px-2 py-1 rounded`}>{status}</span>
  );
}
```

### Chart/Graph Colors

```tsx
import { getThemeColor } from "@/lib/theme-utils";

const chartData = {
  datasets: [
    {
      label: "Dataset",
      backgroundColor: getThemeColor("primary"),
      borderColor: getThemeColor("primary-dark"),
      data: [10, 20, 30],
    },
  ],
};
```

## 🚀 Migration Checklist

- [ ] Install theme utils: `lib/theme-utils.ts`
- [ ] Update CSS with theme variables: `app/globals.css`
- [ ] Update SettingsProvider to apply colors
- [ ] Identify all hardcoded color classes
- [ ] Replace with theme utilities
- [ ] Test with different theme colors in settings
- [ ] Verify light/dark mode compatibility
- [ ] Update component documentation

## 📚 Related Files

- `lib/theme-utils.ts` - Theme utility functions
- `app/globals.css` - CSS variable definitions
- `components/SettingsProvider.tsx` - Theme color application
- `app/admin/settings/page.tsx` - Admin settings UI

## 🎨 Testing Theme Colors

1. Go to `/admin/settings`
2. Change theme colors (Primary, Secondary, Accent)
3. Save changes
4. Verify all components update correctly
5. Toggle dark mode to test contrast
6. Check mobile responsiveness

## 💡 Best Practices

1. **Prefer utility classes over inline styles**

   ```tsx
   // ✅ Good
   <div className={themeBg.primary}>...</div>

   // ❌ Avoid
   <div style={{ backgroundColor: 'var(--theme-primary)' }}>...</div>
   ```

2. **Use semantic color names**

   ```tsx
   // ✅ Good
   <button className={themeButton.primary}>Save</button>

   // ❌ Avoid
   <button className="bg-[#3b82f6]">Save</button>
   ```

3. **Keep status colors consistent**

   - Green = Success/Active
   - Yellow/Orange = Warning/Pending
   - Red = Error/Danger
   - Blue = Info/Default

4. **Test accessibility**
   - Ensure sufficient contrast ratios
   - Check with color blindness simulators
   - Verify WCAG 2.1 AA compliance

## 🐛 Troubleshooting

### Colors not updating?

- Clear browser cache
- Check if SettingsProvider is wrapping app
- Verify settings are saved in database
- Check browser console for errors

### Wrong colors showing?

- Verify CSS variable names
- Check light/dark mode styles
- Ensure settings API is returning correct values

### Colors too dark/light?

- Adjust opacity with `bg-opacity-*` classes
- Use `-light` or `-dark` variants
- Modify lighten/darken percentages in SettingsProvider

## 🎉 Done!

Your app now supports fully customizable theme colors! 🚀
