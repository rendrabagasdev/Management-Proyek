"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FaArrowLeft, FaSave, FaTimes } from "react-icons/fa";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
  globalRole: string;
  isLeaderElsewhere?: boolean;
  leaderProjectName?: string;
}

interface TeamMember {
  userId: number;
  projectRole: "LEADER" | "DEVELOPER" | "DESIGNER" | "OBSERVER";
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<
    "LEADER" | "DEVELOPER" | "DESIGNER" | "OBSERVER"
  >("DEVELOPER");

  // Fetch current user role and all users
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user session to get role
        const sessionResponse = await fetch("/api/auth/session");
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setCurrentUserRole(sessionData?.user?.role || "");
        }

        const response = await fetch("/api/users");
        if (response.ok) {
          const data = await response.json();

          // Check leader status for each user
          const usersWithLeaderStatus = await Promise.all(
            data.map(async (user: User) => {
              try {
                const statusResponse = await fetch(
                  `/api/users/${user.id}/leader-status`
                );
                if (statusResponse.ok) {
                  const statusData = await statusResponse.json();
                  return {
                    ...user,
                    isLeaderElsewhere: statusData.isLeader,
                    leaderProjectName: statusData.projectName,
                  };
                }
              } catch (error) {
                console.error(
                  `Failed to check leader status for user ${user.id}:`,
                  error
                );
              }
              return user;
            })
          );

          setUsers(usersWithLeaderStatus);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  const addTeamMember = async () => {
    if (!selectedUserId) return;

    const userId = parseInt(selectedUserId);
    const selectedUser = users.find((u) => u.id === userId);

    // Check if user already added
    if (teamMembers.some((m) => m.userId === userId)) {
      return;
    }

    // For LEADER role - only allow if current user is ADMIN
    if (selectedRole === "LEADER") {
      if (currentUserRole !== "ADMIN") {
        setError(
          "Only ADMIN can assign a LEADER. When you create a project as LEADER, you are automatically the project leader."
        );
        return;
      }

      // Check if user has LEADER globalRole
      if (selectedUser?.globalRole !== "LEADER") {
        setError(
          "Only users with LEADER global role can be assigned as project LEADER"
        );
        return;
      }

      // Check if trying to add LEADER when one already exists
      if (teamMembers.some((m) => m.projectRole === "LEADER")) {
        setError("Only 1 LEADER allowed per project");
        return;
      }

      // Check if user is already a LEADER in another project
      try {
        const response = await fetch(`/api/users/${userId}/leader-status`);
        if (response.ok) {
          const data = await response.json();
          if (data.isLeader) {
            setError(
              `${data.userName} is already a LEADER in project "${data.projectName}". A user can only be a LEADER in one project at a time.`
            );
            return;
          }
        }
      } catch (error) {
        console.error("Failed to check leader status:", error);
      }
    }

    setError(""); // Clear any previous errors
    setTeamMembers([...teamMembers, { userId, projectRole: selectedRole }]);
    setSelectedUserId("");
    setSelectedRole("DEVELOPER");
  };

  const removeTeamMember = (userId: number) => {
    setTeamMembers(teamMembers.filter((m) => m.userId !== userId));
  };

  const updateTeamMemberRole = async (
    userId: number,
    role: "LEADER" | "DEVELOPER" | "DESIGNER" | "OBSERVER"
  ) => {
    const selectedUser = users.find((u) => u.id === userId);

    // For LEADER role - only allow if current user is ADMIN
    if (role === "LEADER") {
      if (currentUserRole !== "ADMIN") {
        setError(
          "Only ADMIN can assign a LEADER. When you create a project as LEADER, you are automatically the project leader."
        );
        return;
      }

      // Check if user has LEADER globalRole
      if (selectedUser?.globalRole !== "LEADER") {
        setError(
          "Only users with LEADER global role can be assigned as project LEADER"
        );
        return;
      }

      // Check if trying to change to LEADER when one already exists
      const currentLeader = teamMembers.find((m) => m.projectRole === "LEADER");
      if (currentLeader && currentLeader.userId !== userId) {
        setError(
          "Only 1 LEADER allowed per project. Remove the current leader first."
        );
        return;
      }

      // Check if user is already a LEADER in another project
      try {
        const response = await fetch(`/api/users/${userId}/leader-status`);
        if (response.ok) {
          const data = await response.json();
          if (data.isLeader) {
            setError(
              `${data.userName} is already a LEADER in project "${data.projectName}". A user can only be a LEADER in one project at a time.`
            );
            return;
          }
        }
      } catch (error) {
        console.error("Failed to check leader status:", error);
      }
    }

    setError(""); // Clear any previous errors
    setTeamMembers(
      teamMembers.map((m) =>
        m.userId === userId ? { ...m, projectRole: role } : m
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation based on user role
    if (currentUserRole === "ADMIN") {
      // ADMIN must assign exactly one LEADER
      const leaderCount = teamMembers.filter(
        (m) => m.projectRole === "LEADER"
      ).length;
      if (leaderCount === 0) {
        setError("Project must have exactly 1 LEADER");
        setLoading(false);
        return;
      }
      if (leaderCount > 1) {
        setError("Project can only have 1 LEADER");
        setLoading(false);
        return;
      }
    } else if (currentUserRole === "LEADER") {
      // LEADER cannot assign another LEADER (they are the leader automatically)
      const leaderCount = teamMembers.filter(
        (m) => m.projectRole === "LEADER"
      ).length;
      if (leaderCount > 0) {
        setError(
          "You are automatically the project leader. You cannot assign another LEADER."
        );
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          members: teamMembers,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create project");
      }

      const project = await response.json();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const getUserById = (userId: number) => {
    return users.find((u) => u.id === userId);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "LEADER":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "DEVELOPER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "DESIGNER":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/projects">
            <FaArrowLeft className="mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            Start a new project for your team to collaborate on tasks and track
            progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Project Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., UKK Mobile App"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Describe your project goals and scope..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={5}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Optional: Add a brief description of the project
              </p>
            </div>

            {/* Team Members Section */}
            <div className="space-y-4 border-t pt-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Team Members</h3>
                {currentUserRole === "LEADER" ? (
                  <p className="text-sm text-muted-foreground mb-4">
                    As a LEADER, you will automatically become the project
                    leader. Add other team members (DEVELOPER, DESIGNER,
                    OBSERVER) to collaborate. You don&apos;t need to add a
                    LEADER.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    Add team members and assign their roles. Exactly 1 LEADER is
                    required per project. Only users with LEADER global role can
                    be assigned as project LEADER.
                  </p>
                )}
                {selectedUserId && selectedRole === "LEADER" && (
                  <>
                    {users.find((u) => u.id === parseInt(selectedUserId))
                      ?.globalRole !== "LEADER" && (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm flex items-center gap-2">
                        <span>❌</span>
                        <span>
                          This user does not have LEADER global role. Only users
                          with LEADER global role can be assigned as project
                          LEADER.
                        </span>
                      </div>
                    )}
                    {users.find((u) => u.id === parseInt(selectedUserId))
                      ?.isLeaderElsewhere && (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm flex items-center gap-2">
                        <span>⚠️</span>
                        <span>
                          This user is already a LEADER in another project. They
                          cannot be assigned as LEADER here.
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Add Member Form */}
              <div className="flex gap-2">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={loading}
                >
                  <option value="">Select a user...</option>
                  {users
                    .filter((u) => !teamMembers.some((m) => m.userId === u.id))
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email}) - {user.globalRole}
                        {user.isLeaderElsewhere
                          ? ` - Already LEADER in "${user.leaderProjectName}"`
                          : ""}
                      </option>
                    ))}
                </select>

                <select
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(
                      e.target.value as
                        | "LEADER"
                        | "DEVELOPER"
                        | "DESIGNER"
                        | "OBSERVER"
                    )
                  }
                  className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={loading}
                >
                  <option
                    value="LEADER"
                    disabled={
                      currentUserRole === "LEADER" ||
                      teamMembers.some((m) => m.projectRole === "LEADER") ||
                      (!!selectedUserId &&
                        users.find((u) => u.id === parseInt(selectedUserId))
                          ?.globalRole !== "LEADER")
                    }
                  >
                    Leader
                  </option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="DESIGNER">Designer</option>
                  <option value="OBSERVER">Observer</option>
                </select>

                <Button
                  type="button"
                  onClick={addTeamMember}
                  disabled={!selectedUserId || loading}
                  variant="outline"
                >
                  Add
                </Button>
              </div>

              {/* Team Members List */}
              {teamMembers.length > 0 && (
                <div className="space-y-2">
                  {teamMembers.map((member) => {
                    const user = getUserById(member.userId);
                    if (!user) return null;

                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-3 border rounded-lg bg-card"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.email} • Global Role: {user.globalRole}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={member.projectRole}
                            onChange={(e) =>
                              updateTeamMemberRole(
                                member.userId,
                                e.target.value as
                                  | "LEADER"
                                  | "DEVELOPER"
                                  | "DESIGNER"
                                  | "OBSERVER"
                              )
                            }
                            className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                            disabled={loading}
                          >
                            <option
                              value="LEADER"
                              disabled={
                                currentUserRole === "LEADER" ||
                                (member.projectRole !== "LEADER" &&
                                  teamMembers.some(
                                    (m) => m.projectRole === "LEADER"
                                  )) ||
                                user.globalRole !== "LEADER"
                              }
                            >
                              Leader
                            </option>
                            <option value="DEVELOPER">Developer</option>
                            <option value="DESIGNER">Designer</option>
                            <option value="OBSERVER">Observer</option>
                          </select>

                          <Badge className={getRoleColor(member.projectRole)}>
                            {member.projectRole}
                          </Badge>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTeamMember(member.userId)}
                            disabled={loading}
                          >
                            <FaTimes className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {teamMembers.length === 0 && (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  {currentUserRole === "LEADER" ? (
                    <p className="text-sm text-muted-foreground">
                      No team members added yet. You can start with an empty
                      team or add members now.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No team members added yet. Add exactly 1 LEADER to start.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
              <h4 className="font-medium text-blue-900 mb-2">
                What happens next?
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Selected team members will be added to the project</li>
                <li>
                  4 default boards will be created (To Do, In Progress, Review,
                  Done)
                </li>
                <li>Team members can start creating and working on tasks</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                <FaSave className="mr-2" />
                {loading ? "Creating..." : "Create Project"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
