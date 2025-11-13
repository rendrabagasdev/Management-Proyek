# Work Hours Display in Card Detail

## Overview

Added real-time work hours status display to the card detail page, showing users how many hours they've worked today and their progress towards minimum/maximum limits.

## Implementation Date

Added to `/ukk/components/cards/CardDetail.tsx`

## Features

### 1. Real-Time Status Display

- **Auto-refresh**: Updates every 5 minutes automatically
- **Manual refresh**: Updates immediately after stopping a timer
- **Visual progress bar**: Color-coded based on status
- **Status indicators**: Warning, OK, Exceeded, Error states

### 2. Status Types

#### 🟡 Warning (Below Minimum)

- Shown when: `hoursWorked < minHours`
- Color: Amber/Yellow
- Message: Shows how many hours needed to reach minimum
- Example: "Need 3.5h more to reach minimum (4h)"

#### 🟢 OK (On Track)

- Shown when: `minHours <= hoursWorked < maxHours`
- Color: Green
- Message: Shows remaining hours before limit
- Example: "4.5h remaining before reaching limit"

#### 🔴 Exceeded (At Limit)

- Shown when: `hoursWorked >= maxHours`
- Color: Red
- Message: Cannot start timer, limit reached
- Example: "Cannot start new timer today. Maximum 12h limit reached."

#### ⛔ Error (Over Limit)

- Shown when: `hoursWorked > maxHours` (edge case)
- Color: Red
- Message: Shows how much over the limit
- Example: "Exceeded maximum by 0.5h"

### 3. Timer Integration

- **Start Timer**: Checks `workHoursStatus.canStartTimer` before allowing start
- **Stop Timer**: Automatically refreshes work hours status
- **Error Handling**: Shows modal dialog if timer cannot be started due to limit

## UI Components

### Progress Bar

```tsx
<div className="w-full bg-secondary rounded-full h-2">
  <div className="h-full bg-green-500" style={{ width: "75%" }} />
</div>
```

- Width: Percentage of hours worked vs maximum
- Colors: Green (ok), Amber (warning), Red (exceeded)
- Smooth transition animation

### Hours Badge

```tsx
<Badge variant="default" className="bg-green-500">
  8.5h / 12h
</Badge>
```

- Shows: Current hours / Maximum hours
- Variant changes based on status
- Rounded to 1 decimal place

### Status Alert

```tsx
<div className="p-3 bg-green-50 border border-green-200">
  <span>✓</span>
  <p>On Track</p>
  <p>4.5h remaining before reaching limit</p>
</div>
```

- Icon: Emoji indicator (⚠️, ✓, 🚫, ⛔)
- Title: Status name
- Description: Detailed message
- Colors: Match status type

### Limits Summary

```tsx
<div className="border-t pt-3">
  <div>Minimum Required: 4h</div>
  <div>Maximum Allowed: 12h</div>
</div>
```

- Shows current configuration
- Always visible when limit is enabled
- Small text, muted color

## API Integration

### Endpoint: `/api/time-logs/work-hours-status`

**Response:**

```json
{
  "hoursWorked": 8.5,
  "minHours": 4,
  "maxHours": 12,
  "enableLimit": true,
  "status": "ok",
  "message": "4.5 hours remaining before reaching maximum limit",
  "canStartTimer": true,
  "remainingHours": 4.5,
  "neededHours": 0
}
```

**Fields:**

- `hoursWorked`: Total hours logged today (float)
- `minHours`: Minimum required hours (from settings)
- `maxHours`: Maximum allowed hours (from settings)
- `enableLimit`: Whether work hours limit is enabled
- `status`: "ok" | "warning" | "exceeded" | "error"
- `message`: Human-readable status message
- `canStartTimer`: Boolean - whether user can start new timer
- `remainingHours`: Hours until maximum (if ok/warning)
- `neededHours`: Hours needed to reach minimum (if warning)

## Code Changes

### State Management

```typescript
const [workHoursStatus, setWorkHoursStatus] = useState<{
  hoursWorked: number;
  minHours: number;
  maxHours: number;
  enableLimit: boolean;
  status: "ok" | "warning" | "exceeded" | "error";
  message: string;
  canStartTimer: boolean;
  remainingHours: number;
  neededHours: number;
} | null>(null);
```

### Fetch Logic

```typescript
useEffect(() => {
  const fetchWorkHoursStatus = async () => {
    try {
      const response = await fetch("/api/time-logs/work-hours-status");
      if (response.ok) {
        const data = await response.json();
        setWorkHoursStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch work hours status:", error);
    }
  };

  fetchWorkHoursStatus();
  const interval = setInterval(fetchWorkHoursStatus, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

### Timer Validation

```typescript
const handleToggleTimer = async () => {
  if (!activeTimer) {
    // Check work hours limit before starting
    if (workHoursStatus && !workHoursStatus.canStartTimer) {
      setModalState({
        isOpen: true,
        type: "error",
        message: workHoursStatus.message || "Cannot start timer",
      });
      return;
    }
  } else {
    // Refresh status after stopping
    const response = await fetch("/api/time-logs/work-hours-status");
    if (response.ok) {
      const data = await response.json();
      setWorkHoursStatus(data);
    }
  }
};
```

## Responsive Design

- **Mobile**: Full width card, stacked layout
- **Desktop**: Sidebar card, matches Time Tracker width
- **Dark Mode**: Full support with appropriate color adjustments
- **Spacing**: Consistent with existing cards (space-y-4)

## User Experience

### Visibility

- Only shown when work hours limit is enabled in settings
- Appears in sidebar below Time Tracker card
- Always visible (no collapse/expand)

### Interactions

- No direct user interaction required
- Updates automatically in background
- Provides immediate feedback when timer is toggled

### Error States

- Failed fetch: Silent error (logged to console)
- API down: Card not shown, timer still works
- Invalid data: Gracefully handles with default values

## Testing Scenarios

### Test 1: New Day (0 hours)

- Expected: Warning status, amber badge
- Message: "Need 4h more to reach minimum (4h)"
- Timer: Can start

### Test 2: Mid-Day (8 hours)

- Expected: OK status, green badge
- Message: "4h remaining before reaching limit"
- Timer: Can start

### Test 3: At Limit (12 hours)

- Expected: Exceeded status, red badge
- Message: "Cannot start new timer today"
- Timer: Cannot start (shows error modal)

### Test 4: Over Limit (12.5 hours)

- Expected: Error status, red badge
- Message: "Exceeded maximum by 0.5h"
- Timer: Cannot start

### Test 5: Limit Disabled

- Expected: Card not shown
- Timer: Works normally without restrictions

## Related Documentation

- [Work Hours Limit Feature](WORK_HOURS_LIMIT.md)
- [API Documentation](../app/api/time-logs/work-hours-status/route.ts)
- [Settings Configuration](../app/admin/settings/page.tsx)

## Future Enhancements

- [ ] Weekly/monthly hours summary
- [ ] Hours trend chart
- [ ] Team comparison
- [ ] Customizable status thresholds
- [ ] Email notifications at 80% limit
- [ ] Manager override option
