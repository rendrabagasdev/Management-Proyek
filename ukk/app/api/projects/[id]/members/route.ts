import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ProjectRole } from "@prisma/client";
import { notifyProjectInvite } from "@/lib/notifications";

// POST /api/projects/[id]/members - Add member to project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);
    const userId = parseInt(session.user.id);

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has permission (creator, admin, or project leader)
    const userMember = project.members.find((m) => m.userId === userId);
    const isCreator = project.createdBy === userId;
    const isAdmin = session.user.role === "ADMIN";
    const isProjectLeader = userMember?.projectRole === ProjectRole.LEADER;

    if (!isCreator && !isAdmin && !isProjectLeader) {
      return NextResponse.json(
        {
          error:
            "Only project creator, admin, or project leader can add members",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId: newUserId, projectRole } = body;

    if (!newUserId || !projectRole) {
      return NextResponse.json(
        { error: "userId and projectRole are required" },
        { status: 400 }
      );
    }

    // Check if user already in project
    const existingMember = project.members.find((m) => m.userId === newUserId);
    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 400 }
      );
    }

    // If adding LEADER, validate
    if (projectRole === "LEADER") {
      // Check if user has LEADER globalRole
      const user = await prisma.user.findUnique({
        where: { id: newUserId },
        select: { name: true, globalRole: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (user.globalRole !== "LEADER") {
        return NextResponse.json(
          {
            error: `${user.name} cannot be assigned as project LEADER. Only users with LEADER global role can be assigned as project LEADER.`,
          },
          { status: 400 }
        );
      }

      // Check if project already has a LEADER
      const existingLeader = project.members.find(
        (m) => m.projectRole === ProjectRole.LEADER
      );
      if (existingLeader) {
        return NextResponse.json(
          { error: "Project already has a LEADER" },
          { status: 400 }
        );
      }

      // Check if user is already a LEADER in another project
      const existingLeadership = await prisma.projectMember.findFirst({
        where: {
          userId: newUserId,
          projectRole: ProjectRole.LEADER,
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
        },
      });

      if (existingLeadership) {
        return NextResponse.json(
          {
            error: `${user.name} is already a LEADER in project "${existingLeadership.project.name}". A user can only be a LEADER in one project at a time.`,
          },
          { status: 400 }
        );
      }
    }

    // Add member
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: newUserId,
        projectRole: projectRole as ProjectRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            globalRole: true,
          },
        },
      },
    });

    // 🔔 Notify new member about project invitation
    const projectDetails = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    if (projectDetails) {
      const inviterName = session.user.name || "Someone";
      await notifyProjectInvite(
        newUserId,
        projectId,
        projectDetails.name,
        inviterName
      );
    }

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}
