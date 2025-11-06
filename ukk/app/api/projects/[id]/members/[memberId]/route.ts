import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectRole } from "@prisma/client";

// PATCH /api/projects/[id]/members/[memberId] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, memberId } = await params;
    const projectId = parseInt(id);
    const memberIdInt = parseInt(memberId);
    const userId = parseInt(session.user.id);

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has permission
    const userMember = project.members.find((m) => m.userId === userId);
    const isCreator = project.createdBy === userId;
    const isAdmin = session.user.role === "ADMIN";
    const isProjectLeader = userMember?.projectRole === ProjectRole.LEADER;

    if (!isCreator && !isAdmin && !isProjectLeader) {
      return NextResponse.json(
        {
          error:
            "Only project creator, admin, or project leader can update member roles",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { projectRole } = body;

    if (!projectRole) {
      return NextResponse.json(
        { error: "projectRole is required" },
        { status: 400 }
      );
    }

    // Find the member
    const member = project.members.find((m) => m.id === memberIdInt);
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // If changing to LEADER, validate
    if (projectRole === "LEADER") {
      // Check if user has LEADER globalRole
      if (member.user.globalRole !== "LEADER") {
        return NextResponse.json(
          {
            error: `${member.user.name} cannot be assigned as project LEADER. Only users with LEADER global role can be assigned as project LEADER.`,
          },
          { status: 400 }
        );
      }

      // Check if project already has a different LEADER
      const existingLeader = project.members.find(
        (m) => m.projectRole === ProjectRole.LEADER && m.id !== memberIdInt
      );
      if (existingLeader) {
        return NextResponse.json(
          { error: "Project already has a LEADER. Remove them first." },
          { status: 400 }
        );
      }

      // Check if user is already a LEADER in another project
      const existingLeadership = await prisma.projectMember.findFirst({
        where: {
          userId: member.userId,
          projectRole: ProjectRole.LEADER,
          NOT: {
            id: memberIdInt,
          },
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
            error: `${member.user.name} is already a LEADER in project "${existingLeadership.project.name}". A user can only be a LEADER in one project at a time.`,
          },
          { status: 400 }
        );
      }
    }

    // Update member role
    const updatedMember = await prisma.projectMember.update({
      where: { id: memberIdInt },
      data: {
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

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/members/[memberId] - Remove member from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, memberId } = await params;
    const projectId = parseInt(id);
    const memberIdInt = parseInt(memberId);
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

    // Check if user has permission
    const isCreator = project.createdBy === userId;
    const isAdmin = session.user.role === "ADMIN";

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "Only project creator or admin can remove members" },
        { status: 403 }
      );
    }

    // Find the member
    const member = project.members.find((m) => m.id === memberIdInt);
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent removing yourself
    if (member.userId === userId) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the project" },
        { status: 400 }
      );
    }

    // Prevent removing the last LEADER
    if (member.projectRole === ProjectRole.LEADER) {
      const leaderCount = project.members.filter(
        (m) => m.projectRole === ProjectRole.LEADER
      ).length;
      if (leaderCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last LEADER from the project" },
          { status: 400 }
        );
      }
    }

    // Remove member
    await prisma.projectMember.delete({
      where: { id: memberIdInt },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
