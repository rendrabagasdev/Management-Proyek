# Work Hours Limit Feature

## Overview

Fitur Work Hours Limit membantu memastikan work-life balance dengan mengatur batas minimum dan maksimum jam kerja per hari untuk setiap user.

## Fitur Utama

### 1. Minimum Work Hours (Jam Kerja Minimal)

- **Default:** 4 jam/hari
- **Fungsi:** User akan mendapat peringatan jika bekerja kurang dari minimum
- **Warning:** Soft warning - tidak memblokir, hanya memberi tahu user
- **Use Case:** Memastikan produktivitas minimum setiap hari

### 2. Maximum Work Hours (Jam Kerja Maksimal)

- **Default:** 12 jam/hari
- **Fungsi:** User **TIDAK BISA** start timer baru jika sudah mencapai maksimum
- **Blocking:** Hard limit - API akan reject request dengan error 403
- **Use Case:** Mencegah overwork dan burnout

### 3. Enable/Disable Toggle

- **Default:** Enabled
- **Fungsi:** Admin bisa mematikan enforcement tanpa hapus settings
- **Location:** Admin Settings > Time Tracking tab

## Konfigurasi

### Admin Settings UI

Akses melalui: `/admin/settings` → Tab "Time Tracking"

**Settings yang tersedia:**

1. **Enable Work Hours Limit** (Toggle)
   - Enable/disable enforcement
2. **Minimum Work Hours Per Day** (Number Input)

   - Range: 1-12 hours
   - Step: 0.5 hours
   - Recommended: 4-6 hours

3. **Maximum Work Hours Per Day** (Number Input)
   - Range: 8-24 hours
   - Step: 0.5 hours
   - Recommended: 10-12 hours

### Database Settings

Settings disimpan di tabel `app_settings` dengan keys:

```typescript
{
  key: "min_work_hours_per_day",
  value: "4",
  category: "time_tracking"
}

{
  key: "max_work_hours_per_day",
  value: "12",
  category: "time_tracking"
}

{
  key: "enable_work_hours_limit",
  value: "true",
  category: "time_tracking"
}
```

## API Endpoints

### 1. Start Timer (POST `/api/mobile/cards/[id]/time`)

**Validasi yang dilakukan:**

1. Cek apakah user sudah punya active timer
2. **[NEW]** Cek total jam kerja hari ini
3. **[NEW]** Jika >= max hours → reject dengan error

**Response Error (403):**

```json
{
  "message": "You have reached the maximum work hours limit (12 hours per day). You have worked 12.5 hours today. Please rest and continue tomorrow.",
  "code": "MAX_HOURS_EXCEEDED",
  "hoursWorked": "12.50",
  "maxHours": 12
}
```

### 2. Work Hours Status (GET `/api/time-logs/work-hours-status`)

**Fungsi:** Mendapatkan status jam kerja user hari ini

**Response:**

```json
{
  "hoursWorked": 8.5,
  "minHours": 4,
  "maxHours": 12,
  "enableLimit": true,
  "status": "ok" | "warning" | "error" | "exceeded",
  "message": "Good progress! 3.5h remaining before limit.",
  "hasActiveTimer": true,
  "activeTimerStartTime": "2025-11-13T10:00:00.000Z",
  "canStartTimer": true,
  "remainingHours": 3.5,
  "neededHours": 0
}
```

**Status Types:**

- `ok`: Jam kerja normal, di antara min-max
- `warning`: Kurang dari minimum (jika tidak ada active timer)
- `error`: Mendekati maksimum (90%+)
- `exceeded`: Sudah mencapai maksimum

## Implementasi di Mobile App

### 1. Cek Status Sebelum Start Timer

```typescript
// Fetch status
const response = await fetch("/api/time-logs/work-hours-status");
const status = await response.json();

if (!status.canStartTimer) {
  // Show error alert
  Alert.alert("Maximum Hours Reached", status.message, [{ text: "OK" }]);
  return;
}

// Proceed to start timer
```

### 2. Show Warning Widget

```typescript
// Display work hours status widget
<WorkHoursCard>
  <Text>
    Today: {status.hoursWorked}h / {status.maxHours}h
  </Text>

  {status.status === "warning" && (
    <Alert variant="warning">
      You need {status.neededHours}h more to reach minimum
    </Alert>
  )}

  {status.status === "exceeded" && (
    <Alert variant="error">Maximum hours reached! Please rest.</Alert>
  )}
</WorkHoursCard>
```

### 3. Handle Error saat Start Timer

```typescript
try {
  const response = await fetch(`/api/mobile/cards/${cardId}/time`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 403) {
    const error = await response.json();

    if (error.code === "MAX_HOURS_EXCEEDED") {
      Alert.alert("Cannot Start Timer", error.message, [{ text: "OK" }]);
      return;
    }
  }

  // Handle success
} catch (error) {
  // Handle error
}
```

## Calculation Logic

### Menghitung Total Jam Hari Ini

```typescript
// Get today's date range
const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);

// Get all time logs for today
const todayTimeLogs = await prisma.timeLog.findMany({
  where: {
    userId,
    startTime: { gte: startOfDay, lte: endOfDay },
  },
});

// Sum completed logs
let totalMinutes = todayTimeLogs.reduce((sum, log) => {
  if (log.endTime === null) {
    // Active timer: calculate current duration
    return sum + (Date.now() - log.startTime.getTime()) / 60000;
  } else {
    // Completed: use stored duration
    return sum + (log.durationMinutes || 0);
  }
}, 0);

const hoursWorked = totalMinutes / 60;
```

## Best Practices

### Untuk Admin

1. **Set realistic limits:**

   - Min: 4-6 hours (sustainable productivity)
   - Max: 10-12 hours (prevent burnout)

2. **Monitor compliance:**

   - Check dashboard untuk users yang sering hit max
   - Review users yang consistently under min

3. **Communicate clearly:**
   - Inform team tentang limits
   - Explain reasoning (health, productivity, company policy)

### Untuk Developer

1. **Always check canStartTimer:**

   - Jangan langsung start timer tanpa check status
   - Show appropriate error messages

2. **Update UI in real-time:**

   - Poll status endpoint setiap 5-10 menit
   - Update progress bar/indicator

3. **Handle edge cases:**
   - Timer aktif saat midnight (new day)
   - Timezone considerations
   - Timer tidak di-stop dengan benar

## Testing

### Test Cases

1. **Normal Flow:**

   - User work 8 hours → status "ok"
   - Can start and stop timer normally

2. **Under Minimum:**

   - User work 2 hours → status "warning"
   - Show warning message but allow continue

3. **At Maximum:**

   - User work 12 hours → status "exceeded"
   - Cannot start new timer
   - API returns 403 error

4. **Disable Limit:**
   - Admin disable enforcement
   - Users can work unlimited hours
   - No validation, no blocking

## Future Enhancements

Possible improvements:

1. **Weekly Limits:**

   - Max 60 hours per week
   - Track rolling 7-day window

2. **Break Requirements:**

   - Force 15min break every 4 hours
   - 1 hour break after 8 hours

3. **Analytics Dashboard:**

   - Average hours per user
   - Compliance rates
   - Trend analysis

4. **Custom Limits per User:**

   - Different limits for different roles
   - Part-time vs full-time

5. **Grace Period:**
   - Allow 30min over limit for finishing tasks
   - Warning before hard block

## Troubleshooting

### Problem: User sudah 12 jam tapi masih bisa start timer

**Solution:**

- Check `enable_work_hours_limit` setting = "true"
- Verify API validation logic
- Check timezone calculations

### Problem: Warning tidak muncul untuk under minimum

**Solution:**

- Minimum adalah soft warning, bukan blocking
- Check frontend implementation menampilkan status
- Verify status endpoint response

### Problem: Jam kerja tidak akurat

**Solution:**

- Check `durationMinutes` calculation saat stop timer
- Verify timezone setting di database
- Check active timer calculation

## Related Documentation

- [Time Tracking System](./TIME_TRACKING.md)
- [Global Settings](./GLOBAL_SETTINGS.md)
- [Mobile API Documentation](./MOBILE_API.md)
