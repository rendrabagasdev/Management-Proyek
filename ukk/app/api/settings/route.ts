import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all settings or specific setting
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const category = searchParams.get("category");

    if (key) {
      const setting = await prisma.appSettings.findUnique({
        where: { key },
      });
      return NextResponse.json(setting || null);
    }

    const where = category ? { category } : {};
    const settings = await prisma.appSettings.findMany({ where });

    // Convert to key-value object for easier use
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT - Update settings (Admin only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
    });

    if (user?.globalRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body; // { key: value, ... }

    // Update or create settings
    const updates = await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.appSettings.upsert({
          where: { key },
          create: {
            key,
            value: String(value),
            category: getCategoryFromKey(key),
            updatedBy: Number(session.user.id),
          },
          update: {
            value: String(value),
            updatedBy: Number(session.user.id),
          },
        })
      )
    );

    return NextResponse.json({ success: true, updated: updates.length });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

// Helper function to determine category from key
function getCategoryFromKey(key: string): string {
  if (key.startsWith("app_")) return "branding";
  if (key.startsWith("theme_")) return "appearance";
  if (key.startsWith("feature_")) return "features";
  return "general";
}
