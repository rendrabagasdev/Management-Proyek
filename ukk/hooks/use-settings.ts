"use client";

import { useSettings as useSettingsContext } from "@/components/SettingsProvider";

/**
 * Custom hook to access global application settings
 *
 * @example
 * ```tsx
 * const { settings, loading, isFeatureEnabled } = useSettings();
 *
 * // Check if a feature is enabled
 * if (isFeatureEnabled("notifications")) {
 *   // Show notifications
 * }
 *
 * // Access branding settings
 * const appName = settings.app_name || "Default App Name";
 * ```
 */
export function useSettings() {
  return useSettingsContext();
}

/**
 * Hook to check if a specific feature is enabled
 *
 * @param feature - Feature name (without "feature_" prefix)
 * @returns boolean indicating if feature is enabled
 *
 * @example
 * ```tsx
 * const notificationsEnabled = useFeature("notifications");
 * const timeTrackingEnabled = useFeature("time_tracking");
 * ```
 */
export function useFeature(feature: string): boolean {
  const { isFeatureEnabled } = useSettingsContext();
  return isFeatureEnabled(feature);
}

/**
 * Hook to get a specific setting value
 *
 * @param key - Setting key
 * @param defaultValue - Default value if setting is not found
 * @returns Setting value or default value
 *
 * @example
 * ```tsx
 * const appName = useSetting("app_name", "My App");
 * const maxUploadSize = useSetting("max_upload_size_mb", "10");
 * ```
 */
export function useSetting<T = string>(key: string, defaultValue: T): T {
  const { settings } = useSettingsContext();
  const value = settings[key as keyof typeof settings];
  return (value as T) ?? defaultValue;
}
