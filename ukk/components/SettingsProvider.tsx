"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Helper functions for color manipulation
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, x)).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const amount = (255 * percent) / 100;
  return rgbToHex(
    Math.round(rgb.r + amount),
    Math.round(rgb.g + amount),
    Math.round(rgb.b + amount)
  );
}

function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const amount = (255 * percent) / 100;
  return rgbToHex(
    Math.round(rgb.r - amount),
    Math.round(rgb.g - amount),
    Math.round(rgb.b - amount)
  );
}

interface AppSettings {
  // Branding
  app_name?: string;
  app_description?: string;
  app_logo_url?: string;
  app_favicon_url?: string;

  // Appearance
  theme_primary_color?: string;
  theme_secondary_color?: string;
  theme_accent_color?: string;
  theme_default_mode?: "light" | "dark" | "system";

  // Features
  feature_notifications?: string;
  feature_time_tracking?: string;
  feature_comments?: string;
  feature_subtasks?: string;

  // General
  max_upload_size_mb?: string;
  session_timeout_minutes?: string;
  items_per_page?: string;
}

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  refetch: () => Promise<void>;
  isFeatureEnabled: (feature: string) => boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: {},
  loading: true,
  refetch: async () => {},
  isFeatureEnabled: () => true,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);

        // Apply theme colors to CSS variables
        if (data.theme_primary_color) {
          document.documentElement.style.setProperty(
            "--theme-primary",
            data.theme_primary_color
          );
          // Generate lighter and darker variants
          document.documentElement.style.setProperty(
            "--theme-primary-light",
            lightenColor(data.theme_primary_color, 20)
          );
          document.documentElement.style.setProperty(
            "--theme-primary-dark",
            darkenColor(data.theme_primary_color, 20)
          );
        }

        if (data.theme_secondary_color) {
          document.documentElement.style.setProperty(
            "--theme-secondary",
            data.theme_secondary_color
          );
          document.documentElement.style.setProperty(
            "--theme-secondary-light",
            lightenColor(data.theme_secondary_color, 20)
          );
          document.documentElement.style.setProperty(
            "--theme-secondary-dark",
            darkenColor(data.theme_secondary_color, 20)
          );
        }

        if (data.theme_accent_color) {
          document.documentElement.style.setProperty(
            "--theme-accent",
            data.theme_accent_color
          );
          document.documentElement.style.setProperty(
            "--theme-accent-light",
            lightenColor(data.theme_accent_color, 20)
          );
          document.documentElement.style.setProperty(
            "--theme-accent-dark",
            darkenColor(data.theme_accent_color, 20)
          );
        }

        // Update favicon if set
        if (data.app_favicon_url) {
          const link = document.querySelector(
            "link[rel*='icon']"
          ) as HTMLLinkElement;
          if (link) {
            link.href = data.app_favicon_url;
          }
        }

        // Update page title if set
        if (data.app_name) {
          document.title = data.app_name;
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const isFeatureEnabled = (feature: string): boolean => {
    const key = `feature_${feature}` as keyof AppSettings;
    return settings[key] === "true";
  };

  return (
    <SettingsContext.Provider
      value={{ settings, loading, refetch: fetchSettings, isFeatureEnabled }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
