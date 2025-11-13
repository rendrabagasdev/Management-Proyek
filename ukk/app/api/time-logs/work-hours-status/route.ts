import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get work hours settings
    const [minHoursSetting, maxHoursSetting, enableLimitSetting] =
      await Promise.all([
        prisma.appSettings.findUnique({
          where: { key: "min_work_hours_per_day" },
        }),
        prisma.appSettings.findUnique({
          where: { key: "max_work_hours_per_day" },
        }),
        prisma.appSettings.findUnique({
          where: { key: "enable_work_hours_limit" },
        }),
      ]);

    const minHoursPerDay = minHoursSetting
      ? parseFloat(minHoursSetting.value)
      : 4;
    const maxHoursPerDay = maxHoursSetting
      ? parseFloat(maxHoursSetting.value)
      : 12;
    const enableLimit =
      enableLimitSetting?.value === "true" || enableLimitSetting?.value === "1";

    // Get today's time logs
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayTimeLogs = await prisma.timeLog.findMany({
      where: {
        userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Calculate total minutes worked today (including active timer)
    let totalMinutesWorked = 0;
    let hasActiveTimer = false;
    let activeTimerStartTime = null;

    for (const log of todayTimeLogs) {
      if (log.endTime === null) {
        // Active timer
        hasActiveTimer = true;
        activeTimerStartTime = log.startTime;
        const currentMinutes =
          (new Date().getTime() - log.startTime.getTime()) / 60000;
        totalMinutesWorked += currentMinutes;
      } else {
        // Completed time log
        totalMinutesWorked += log.durationMinutes || 0;
      }
    }

    const hoursWorked = totalMinutesWorked / 60;

    // Determine status
    let status: "ok" | "warning" | "error" | "exceeded";
    let message = "";

    if (hoursWorked >= maxHoursPerDay) {
      status = "exceeded";
      message = `Maximum work hours reached (${maxHoursPerDay}h). Please rest.`;
    } else if (hoursWorked < minHoursPerDay && !hasActiveTimer) {
      status = "warning";
      message = `You need ${(minHoursPerDay - hoursWorked).toFixed(
        1
      )} more hours to reach minimum (${minHoursPerDay}h).`;
    } else if (hoursWorked >= minHoursPerDay && hoursWorked < maxHoursPerDay) {
      status = "ok";
      message = `Good progress! ${(maxHoursPerDay - hoursWorked).toFixed(
        1
      )}h remaining before limit.`;
    } else {
      status = "ok";
      message = "Keep up the good work!";
    }

    return NextResponse.json({
      hoursWorked: parseFloat(hoursWorked.toFixed(2)),
      minHours: minHoursPerDay,
      maxHours: maxHoursPerDay,
      enableLimit,
      status,
      message,
      hasActiveTimer,
      activeTimerStartTime,
      canStartTimer: enableLimit ? hoursWorked < maxHoursPerDay : true,
      remainingHours: parseFloat((maxHoursPerDay - hoursWorked).toFixed(2)),
      neededHours: parseFloat(
        Math.max(0, minHoursPerDay - hoursWorked).toFixed(2)
      ),
    });
  } catch (error) {
    console.error("Work hours status error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
