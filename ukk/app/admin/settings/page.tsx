"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FaSave,
  FaPalette,
  FaCog,
  FaImage,
  FaToggleOn,
  FaInfoCircle,
  FaClock,
} from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";

// Color Packs / Paket Warna
const COLOR_PACKS = [
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    description: "Professional blue theme",
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#f59e0b",
    preview: "bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500",
  },
  {
    id: "forest-green",
    name: "Forest Green",
    description: "Natural green theme",
    primary: "#10b981",
    secondary: "#14b8a6",
    accent: "#f59e0b",
    preview: "bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500",
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    description: "Warm orange theme",
    primary: "#f97316",
    secondary: "#ef4444",
    accent: "#eab308",
    preview: "bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    description: "Elegant purple theme",
    primary: "#9333ea",
    secondary: "#ec4899",
    accent: "#06b6d4",
    preview: "bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500",
  },
  {
    id: "crimson-red",
    name: "Crimson Red",
    description: "Bold red theme",
    primary: "#dc2626",
    secondary: "#f97316",
    accent: "#eab308",
    preview: "bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500",
  },
  {
    id: "midnight-blue",
    name: "Midnight Blue",
    description: "Deep blue theme",
    primary: "#1e40af",
    secondary: "#7c3aed",
    accent: "#06b6d4",
    preview: "bg-gradient-to-r from-blue-700 via-violet-600 to-cyan-500",
  },
  {
    id: "mint-fresh",
    name: "Mint Fresh",
    description: "Fresh mint theme",
    primary: "#14b8a6",
    secondary: "#10b981",
    accent: "#22c55e",
    preview: "bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500",
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    description: "Elegant rose theme",
    primary: "#ec4899",
    secondary: "#f43f5e",
    accent: "#fb923c",
    preview: "bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400",
  },
];

interface Settings {
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

  // Time Tracking
  min_work_hours_per_day?: string;
  max_work_hours_per_day?: string;
  enable_work_hours_limit?: string;

  // General
  max_upload_size_mb?: string;
  session_timeout_minutes?: string;
  items_per_page?: string;
}

export default function AdminSettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Apply color pack
  const applyColorPack = (packId: string) => {
    const pack = COLOR_PACKS.find((p) => p.id === packId);
    if (pack) {
      setSettings((prev) => ({
        ...prev,
        theme_primary_color: pack.primary,
        theme_secondary_color: pack.secondary,
        theme_accent_color: pack.accent,
      }));
      setSelectedPack(packId);
      toast({
        title: "Color Pack Applied",
        description: `${pack.name} theme has been applied`,
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--theme-primary)"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Global Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Configure application-wide settings and appearance
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="w-full sm:w-auto"
        >
          <FaSave className="mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="branding" className="text-xs sm:text-sm">
            <FaImage className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Branding</span>
            <span className="sm:hidden">Brand</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs sm:text-sm">
            <FaPalette className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Appearance</span>
            <span className="sm:hidden">Theme</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="text-xs sm:text-sm">
            <FaToggleOn className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Features</span>
            <span className="sm:hidden">Features</span>
          </TabsTrigger>
          <TabsTrigger value="time-tracking" className="text-xs sm:text-sm">
            <FaClock className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Time Tracking</span>
            <span className="sm:hidden">Time</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="text-xs sm:text-sm">
            <FaCog className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">General</span>
            <span className="sm:hidden">General</span>
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding Settings</CardTitle>
              <CardDescription>
                Customize your application&apos;s branding and identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="app_name">Application Name</Label>
                <Input
                  id="app_name"
                  value={settings.app_name || ""}
                  onChange={(e) => updateSetting("app_name", e.target.value)}
                  placeholder="My Project Management App"
                />
                <p className="text-xs text-muted-foreground">
                  This name will appear in the browser tab and header
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="app_description">Application Description</Label>
                <Input
                  id="app_description"
                  value={settings.app_description || ""}
                  onChange={(e) =>
                    updateSetting("app_description", e.target.value)
                  }
                  placeholder="Manage your projects efficiently"
                />
                <p className="text-xs text-muted-foreground">
                  Brief description for SEO and social sharing
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="app_logo_url">Logo URL</Label>
                <Input
                  id="app_logo_url"
                  value={settings.app_logo_url || ""}
                  onChange={(e) =>
                    updateSetting("app_logo_url", e.target.value)
                  }
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  URL to your application logo (recommended: 200x50px)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="app_favicon_url">Favicon URL</Label>
                <Input
                  id="app_favicon_url"
                  value={settings.app_favicon_url || ""}
                  onChange={(e) =>
                    updateSetting("app_favicon_url", e.target.value)
                  }
                  placeholder="https://example.com/favicon.ico"
                />
                <p className="text-xs text-muted-foreground">
                  URL to your favicon (recommended: 32x32px)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Choose a color pack or customize individual colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Packs Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm sm:text-base font-semibold">
                    Color Packs / Paket Warna
                  </Label>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Pilih tema warna siap pakai atau customize sendiri di bawah
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {COLOR_PACKS.map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => applyColorPack(pack.id)}
                      className={`p-3 sm:p-4 border-2 rounded-lg text-left transition-all hover:shadow-lg hover:scale-105 ${
                        selectedPack === pack.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`h-16 sm:h-20 rounded-md mb-2 sm:mb-3 ${pack.preview}`}
                      ></div>
                      <h3 className="font-semibold text-xs sm:text-sm mb-1">
                        {pack.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                        {pack.description}
                      </p>
                      <div className="flex gap-1 mt-2">
                        <div
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded border"
                          style={{ backgroundColor: pack.primary }}
                        />
                        <div
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded border"
                          style={{ backgroundColor: pack.secondary }}
                        />
                        <div
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded border"
                          style={{ backgroundColor: pack.accent }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or customize manually
                  </span>
                </div>
              </div>

              {/* Manual Color Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme_primary_color" className="text-sm">
                    Primary Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="theme_primary_color"
                      type="color"
                      value={settings.theme_primary_color || "#3b82f6"}
                      onChange={(e) =>
                        updateSetting("theme_primary_color", e.target.value)
                      }
                      className="w-16 sm:w-20 h-10"
                    />
                    <Input
                      value={settings.theme_primary_color || "#3b82f6"}
                      onChange={(e) =>
                        updateSetting("theme_primary_color", e.target.value)
                      }
                      placeholder="#3b82f6"
                      className="flex-1 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme_secondary_color" className="text-sm">
                    Secondary Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="theme_secondary_color"
                      type="color"
                      value={settings.theme_secondary_color || "#8b5cf6"}
                      onChange={(e) =>
                        updateSetting("theme_secondary_color", e.target.value)
                      }
                      className="w-16 sm:w-20 h-10"
                    />
                    <Input
                      value={settings.theme_secondary_color || "#8b5cf6"}
                      onChange={(e) =>
                        updateSetting("theme_secondary_color", e.target.value)
                      }
                      placeholder="#8b5cf6"
                      className="flex-1 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme_accent_color" className="text-sm">
                    Accent Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="theme_accent_color"
                      type="color"
                      value={settings.theme_accent_color || "#f59e0b"}
                      onChange={(e) =>
                        updateSetting("theme_accent_color", e.target.value)
                      }
                      className="w-16 sm:w-20 h-10"
                    />
                    <Input
                      value={settings.theme_accent_color || "#f59e0b"}
                      onChange={(e) =>
                        updateSetting("theme_accent_color", e.target.value)
                      }
                      placeholder="#f59e0b"
                      className="flex-1 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme_default_mode">Default Theme Mode</Label>
                <select
                  id="theme_default_mode"
                  value={settings.theme_default_mode || "system"}
                  onChange={(e) =>
                    updateSetting("theme_default_mode", e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System (Auto)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Default theme for new users
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <FaInfoCircle className="text-(--theme-primary) mt-0.5 shrink-0" />
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Color Preview</p>
                    <div className="flex gap-2 mt-2">
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded border"
                        style={{
                          backgroundColor:
                            settings.theme_primary_color || "#3b82f6",
                        }}
                      />
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded border"
                        style={{
                          backgroundColor:
                            settings.theme_secondary_color || "#8b5cf6",
                        }}
                      />
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded border"
                        style={{
                          backgroundColor:
                            settings.theme_accent_color || "#f59e0b",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>
                Enable or disable specific features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm sm:text-base">
                      Real-time Notifications
                    </Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Enable push notifications via Pusher
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.feature_notifications === "true"}
                    onChange={(e) =>
                      updateSetting(
                        "feature_notifications",
                        String(e.target.checked)
                      )
                    }
                    className="w-5 h-5 shrink-0"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm sm:text-base">
                      Time Tracking
                    </Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Allow users to log time on cards
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.feature_time_tracking === "true"}
                    onChange={(e) =>
                      updateSetting(
                        "feature_time_tracking",
                        String(e.target.checked)
                      )
                    }
                    className="w-5 h-5 shrink-0"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm sm:text-base">Comments</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Enable commenting on cards
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.feature_comments === "true"}
                    onChange={(e) =>
                      updateSetting(
                        "feature_comments",
                        String(e.target.checked)
                      )
                    }
                    className="w-5 h-5 shrink-0"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm sm:text-base">Subtasks</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Allow creating subtasks within cards
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.feature_subtasks === "true"}
                    onChange={(e) =>
                      updateSetting(
                        "feature_subtasks",
                        String(e.target.checked)
                      )
                    }
                    className="w-5 h-5 shrink-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Tracking Tab */}
        <TabsContent value="time-tracking">
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking Settings</CardTitle>
              <CardDescription>
                Configure work hours limits and requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <FaInfoCircle className="text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">
                      Work Hours Limit Information
                    </p>
                    <p>
                      Set minimum and maximum work hours per day to ensure
                      healthy work-life balance. Users will receive warnings if
                      they work too little, and will be prevented from starting
                      timer if they reach maximum hours.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm sm:text-base">
                    Enable Work Hours Limit
                  </Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Enforce minimum and maximum work hours per day
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enable_work_hours_limit === "true"}
                  onChange={(e) =>
                    updateSetting(
                      "enable_work_hours_limit",
                      String(e.target.checked)
                    )
                  }
                  className="w-5 h-5 shrink-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_work_hours_per_day">
                  Minimum Work Hours Per Day
                </Label>
                <Input
                  id="min_work_hours_per_day"
                  type="number"
                  min="1"
                  max="12"
                  step="0.5"
                  value={settings.min_work_hours_per_day || "4"}
                  onChange={(e) =>
                    updateSetting("min_work_hours_per_day", e.target.value)
                  }
                  placeholder="4"
                />
                <p className="text-xs text-muted-foreground">
                  Users will receive a warning if they work less than this
                  amount per day. Recommended: 4-6 hours.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_work_hours_per_day">
                  Maximum Work Hours Per Day
                </Label>
                <Input
                  id="max_work_hours_per_day"
                  type="number"
                  min="8"
                  max="24"
                  step="0.5"
                  value={settings.max_work_hours_per_day || "12"}
                  onChange={(e) =>
                    updateSetting("max_work_hours_per_day", e.target.value)
                  }
                  placeholder="12"
                />
                <p className="text-xs text-muted-foreground">
                  Users will be blocked from starting new timer if they reach
                  this limit. Recommended: 10-12 hours.
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-muted rounded-lg space-y-2">
                <p className="text-xs sm:text-sm font-medium">
                  Current Configuration:
                </p>
                <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                  <p>
                    • Minimum:{" "}
                    <span className="font-medium text-foreground">
                      {settings.min_work_hours_per_day || "4"} hours/day
                    </span>
                  </p>
                  <p>
                    • Maximum:{" "}
                    <span className="font-medium text-foreground">
                      {settings.max_work_hours_per_day || "12"} hours/day
                    </span>
                  </p>
                  <p>
                    • Status:{" "}
                    <span
                      className={`font-medium ${
                        settings.enable_work_hours_limit === "true"
                          ? "text-green-600 dark:text-green-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {settings.enable_work_hours_limit === "true"
                        ? "Enabled ✓"
                        : "Disabled"}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="max_upload_size_mb">Max Upload Size (MB)</Label>
                <Input
                  id="max_upload_size_mb"
                  type="number"
                  value={settings.max_upload_size_mb || "10"}
                  onChange={(e) =>
                    updateSetting("max_upload_size_mb", e.target.value)
                  }
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum file upload size in megabytes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_timeout_minutes">
                  Session Timeout (Minutes)
                </Label>
                <Input
                  id="session_timeout_minutes"
                  type="number"
                  value={settings.session_timeout_minutes || "60"}
                  onChange={(e) =>
                    updateSetting("session_timeout_minutes", e.target.value)
                  }
                  placeholder="60"
                />
                <p className="text-xs text-muted-foreground">
                  Automatically log out users after this period of inactivity
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="items_per_page">Items Per Page</Label>
                <Input
                  id="items_per_page"
                  type="number"
                  value={settings.items_per_page || "20"}
                  onChange={(e) =>
                    updateSetting("items_per_page", e.target.value)
                  }
                  placeholder="20"
                />
                <p className="text-xs text-muted-foreground">
                  Default number of items to show per page in lists
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
