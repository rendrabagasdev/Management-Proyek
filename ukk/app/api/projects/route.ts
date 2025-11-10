import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ProjectRole } from "@prisma/client";

// GET /api/projects - Get all projects for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Admin can see all projects
    if (session.user.role === "ADMIN") {
      const projects = await prisma.project.findMany({
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, globalRole: true },
              },
            },
          },
          boards: {
            select: { id: true, name: true, position: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(projects);
    }

    // Regular users see only their projects
    const projects = await prisma.project.findMany({
      where: {
        OR: [{ createdBy: userId }, { members: { some: { userId } } }],
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, globalRole: true },
            },
          },
        },
        boards: {
          select: { id: true, name: true, position: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and LEADER can create projects
    if (!["ADMIN", "LEADER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Only Admin or Leader can create projects" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, deadline, members } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Validate members array
    if (!members || !Array.isArray(members)) {
      return NextResponse.json(
        { error: "Members array is required" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // If user is a LEADER creating the project, they become the project owner
    // and don't need to be in the members list (unless explicitly added)
    // If user is ADMIN, they must assign exactly 1 LEADER in the members

    if (session.user.role === "LEADER") {
      // LEADER creating project - they become the owner automatically
      // They can add other team members (DEVELOPER, DESIGNER, OBSERVER) but not required
      // No need to have a LEADER in members since creator is the project leader

      // Check if LEADER is already leading another project
      const existingLeadership = await prisma.projectMember.findFirst({
        where: {
          userId: userId,
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
            error: `You are already a LEADER in project "${existingLeadership.project.name}". A user can only be a LEADER in one project at a time.`,
          },
          { status: 400 }
        );
      }

      // Check that they're not trying to assign another LEADER
      const leaderCount = members.filter(
        (m) => m.projectRole === "LEADER"
      ).length;
      if (leaderCount > 0) {
        return NextResponse.json(
          {
            error:
              "When you create a project as LEADER, you are automatically the project leader. You cannot assign another LEADER.",
          },
          { status: 400 }
        );
      }
    } else if (session.user.role === "ADMIN") {
      // ADMIN creating project - must assign exactly 1 LEADER
      const leaderCount = members.filter(
        (m) => m.projectRole === "LEADER"
      ).length;
      if (leaderCount === 0) {
        return NextResponse.json(
          { error: "Project must have exactly 1 LEADER" },
          { status: 400 }
        );
      }
      if (leaderCount > 1) {
        return NextResponse.json(
          { error: "Project can only have 1 LEADER" },
          { status: 400 }
        );
      }

      // Validate the LEADER member
      const leaderMember = members.find((m) => m.projectRole === "LEADER");
      if (leaderMember) {
        // Check if user has LEADER globalRole
        const user = await prisma.user.findUnique({
          where: { id: leaderMember.userId },
          select: { name: true, globalRole: true },
        });

        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        if (user.globalRole !== "LEADER") {
          return NextResponse.json(
            {
              error: `${user.name} cannot be assigned as project LEADER. Only users with LEADER global role can be assigned as project LEADER.`,
            },
            { status: 400 }
          );
        }

        // Check if already leading another project
        const existingLeadership = await prisma.projectMember.findFirst({
          where: {
            userId: leaderMember.userId,
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
    }

    // Create project with specified team members
    const project = await prisma.project.create({
      data: {
        name,
        description,
        deadline: deadline ? new Date(deadline) : null,
        createdBy: userId,
        members: {
          create: [
            // If LEADER is creating, add them as LEADER member
            ...(session.user.role === "LEADER"
              ? [
                  {
                    userId: userId,
                    projectRole: ProjectRole.LEADER,
                  },
                ]
              : []),
            // Add other members
            ...members.map(
              (member: { userId: number; projectRole: string }) => ({
                userId: member.userId,
                projectRole: member.projectRole as ProjectRole,
              })
            ),
          ],
        },
        boards: {
          create: [
            { name: "To Do", position: 0 },
            { name: "In Progress", position: 1 },
            { name: "Review", position: 2 },
            { name: "Done", position: 3 },
          ],
        },
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, globalRole: true },
            },
          },
        },
        boards: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
