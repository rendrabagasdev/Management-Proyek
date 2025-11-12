"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaUserPlus,
  FaTrash,
  FaExclamationTriangle,
} from "react-icons/fa";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
  globalRole: string;
}

interface ProjectMember {
  id: number;
  userId: number;
  projectRole: string;
  joinedAt: Date;
  user: User;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  deadline: Date | null;
  createdBy: number;
  isCompleted: boolean;
  completedAt: Date | null;
  creator: User;
  members: ProjectMember[];
  boards: Array<{
    id: number;
    cards: Array<{ id: number }>;
  }>;
}

interface ProjectSettingsProps {
  project: Project;
  currentUserId: number;
  isAdmin: boolean;
  isCreator: boolean;
  allUsers: User[];
}

export default function ProjectSettings({
  project,
  currentUserId,
  isAdmin,
  isCreator,
  allUsers,
}: ProjectSettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Project info state
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(
    project.description || ""
  );
  const [projectDeadline, setProjectDeadline] = useState(
    project.deadline
      ? new Date(project.deadline).toISOString().slice(0, 16)
      : ""
  );

  // Add member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<
    "LEADER" | "DEVELOPER" | "DESIGNER"
  >("DEVELOPER");

  // Delete project state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Complete project state
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "LEADER":
        return "bg-(--theme-secondary)/10 text-(--theme-secondary)";
      case "DEVELOPER":
        return "bg-(--theme-primary)/10 text-(--theme-primary)";
      case "DESIGNER":
        return "bg-(--theme-accent)/10 text-(--theme-accent)";
      case "OBSERVER":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleUpdateProject = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          deadline: projectDeadline || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update project");
      }

      setSuccess("Project updated successfully");
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: parseInt(selectedUserId),
          projectRole: selectedRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add member");
      }

      setSuccess("Member added successfully");
      setShowAddMember(false);
      setSelectedUserId("");
      setSelectedRole("DEVELOPER");
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number, userName: string) => {
    if (!confirm(`Remove ${userName} from this project?`)) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/projects/${project.id}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove member");
      }

      setSuccess("Member removed successfully");
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberRole = async (
    memberId: number,
    newRole: string,
    userName: string
  ) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/projects/${project.id}/members/${memberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectRole: newRole,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update member role");
      }

      setSuccess(`${userName}'s role updated successfully`);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update member role"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProject = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/projects/${project.id}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCompleted: !project.isCompleted,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update project status");
      }

      setSuccess(
        project.isCompleted
          ? "Project reopened successfully"
          : "Project marked as completed"
      );
      setShowCompleteDialog(false);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update project status"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmation !== project.name) {
      setError("Project name doesn't match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete project");
      }

      // Close dialog and show success before navigation
      setShowDeleteDialog(false);
      setLoading(false);

      // Small delay to allow UI to update before navigation
      setTimeout(() => {
        router.push("/projects");
        router.refresh();
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
      setLoading(false);
    }
  };

  const currentLeader = project.members.find((m) => m.projectRole === "LEADER");
  const availableUsers = allUsers.filter(
    (u) => !project.members.some((m) => m.userId === u.id)
  );

  const totalTasks = project.boards.reduce(
    (sum, board) => sum + board.cards.length,
    0
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href={`/projects/${project.id}`}>
            <FaArrowLeft className="mr-2" />
            Back to Project
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Project Settings</h1>
          <p className="text-muted-foreground">
            Manage your project details and team members
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-(--theme-danger)/10 border border-(--theme-danger) border-opacity-30 text-(--theme-danger) px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-(--theme-success)/10 border border-(--theme-success) border-opacity-30 text-(--theme-success) px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>
              Update your project name and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="projectName" className="text-sm font-medium">
                Project Name <span className="text-(--theme-danger)">*</span>
              </label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="projectDescription"
                className="text-sm font-medium"
              >
                Description
              </label>
              <Textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="projectDeadline" className="text-sm font-medium">
                Project Deadline
              </label>
              <Input
                id="projectDeadline"
                type="datetime-local"
                value={projectDeadline}
                onChange={(e) => setProjectDeadline(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Set a deadline to track project completion and get
                notifications
              </p>
            </div>

            <Button
              onClick={handleUpdateProject}
              disabled={loading || !projectName}
            >
              <FaSave className="mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage who has access to this project
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowAddMember(true)}
                size="sm"
                disabled={loading}
              >
                <FaUserPlus className="mr-2" />
                Add Member
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.user.name}</p>
                      {member.userId === project.createdBy && (
                        <Badge variant="default" className="text-xs">
                          Creator
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.user.email} • Global Role:{" "}
                      {member.user.globalRole}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={member.projectRole}
                      onChange={(e) =>
                        handleUpdateMemberRole(
                          member.id,
                          e.target.value,
                          member.user.name
                        )
                      }
                      className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                      disabled={loading || member.userId === currentUserId}
                    >
                      <option
                        value="LEADER"
                        disabled={
                          (member.projectRole !== "LEADER" &&
                            currentLeader !== undefined) ||
                          member.user.globalRole !== "LEADER"
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

                    {member.userId !== currentUserId &&
                      (isCreator || isAdmin) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveMember(member.id, member.user.name)
                          }
                          disabled={loading}
                        >
                          <FaTimes className="h-4 w-4 text-(--theme-danger)" />
                        </Button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Status */}
        {(isCreator || isAdmin) && (
          <Card
            className={
              project.isCompleted
                ? "border-(--theme-primary-light)"
                : "border-(--theme-success-light)"
            }
          >
            <CardHeader>
              <CardTitle
                className={
                  project.isCompleted
                    ? "text-(--theme-primary)"
                    : "text-(--theme-success)"
                }
              >
                Project Status
              </CardTitle>
              <CardDescription>
                Mark this project as completed or reopen it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  project.isCompleted
                    ? "border-(--theme-primary-light) bg-(--theme-primary-light)"
                    : "border-(--theme-success-light) bg-(--theme-success-light)"
                }`}
              >
                <div>
                  <h4
                    className={`font-semibold ${
                      project.isCompleted
                        ? "text-(--theme-primary-dark)"
                        : "text-(--theme-success-dark)"
                    }`}
                  >
                    {project.isCompleted
                      ? "Project Completed"
                      : "Mark Project as Completed"}
                  </h4>
                  <p
                    className={`text-sm ${
                      project.isCompleted
                        ? "text-(--theme-primary-dark)"
                        : "text-(--theme-success-dark)"
                    }`}
                  >
                    {project.isCompleted
                      ? `Completed on ${
                          project.completedAt
                            ? new Date(project.completedAt).toLocaleDateString()
                            : "N/A"
                        }`
                      : "Mark this project as completed when all work is done"}
                  </p>
                </div>
                <Button
                  variant={project.isCompleted ? "outline" : "default"}
                  onClick={() => setShowCompleteDialog(true)}
                  disabled={loading}
                  className={
                    project.isCompleted
                      ? "bg-(--theme-primary-light) hover:bg-(--theme-primary-light)"
                      : "bg-(--theme-success) hover:bg-(--theme-success-dark)"
                  }
                >
                  {project.isCompleted ? "Reopen Project" : "Mark as Completed"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        {(isCreator || isAdmin) && (
          <Card className="border-(--theme-danger-light)">
            <CardHeader>
              <CardTitle className="text-(--theme-danger)">
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that will affect this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-(--theme-danger-light) rounded-lg bg-(--theme-danger-light)">
                <div>
                  <h4 className="font-semibold text-(--theme-danger-dark)">
                    Delete this project
                  </h4>
                  <p className="text-sm text-(--theme-danger-dark)">
                    Once deleted, all data including {totalTasks} tasks will be
                    lost permanently.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={loading}
                >
                  <FaTrash className="mr-2" />
                  Delete Project
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Select a user and assign them a role in this project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="">Select a user...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) - {user.globalRole}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                value={selectedRole}
                onChange={(e) =>
                  setSelectedRole(
                    e.target.value as "LEADER" | "DEVELOPER" | "DESIGNER"
                  )
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              >
                <option
                  value="LEADER"
                  disabled={
                    currentLeader !== undefined ||
                    (!!selectedUserId &&
                      availableUsers.find(
                        (u) => u.id === parseInt(selectedUserId)
                      )?.globalRole !== "LEADER")
                  }
                >
                  Leader
                </option>
                <option value="DEVELOPER">Developer</option>
                <option value="DESIGNER">Designer</option>
                <option value="OBSERVER">Observer</option>
              </select>
            </div>

            {selectedRole === "LEADER" && selectedUserId && (
              <>
                {availableUsers.find((u) => u.id === parseInt(selectedUserId))
                  ?.globalRole !== "LEADER" && (
                  <div className="bg-(--theme-danger-light) border border-(--theme-danger-light) text-(--theme-danger-dark) px-3 py-2 rounded text-sm">
                    ❌ This user does not have LEADER global role
                  </div>
                )}
                {currentLeader && (
                  <div className="bg-(--theme-accent-light) border border-(--theme-accent-light) text-(--theme-accent-dark) px-3 py-2 rounded text-sm">
                    ⚠️ Project already has a LEADER
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddMember(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUserId || loading}
            >
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Project Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle
              className={
                project.isCompleted
                  ? "text-(--theme-primary)"
                  : "text-(--theme-success)"
              }
            >
              {project.isCompleted
                ? "Reopen Project"
                : "Mark Project as Completed"}
            </DialogTitle>
            <DialogDescription>
              {project.isCompleted
                ? "Reopen this project to continue working on it"
                : "Mark this project as completed. You can reopen it later if needed."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className={`border p-4 rounded text-sm ${
                project.isCompleted
                  ? "bg-(--theme-primary-light) border-(--theme-primary-light) text-(--theme-primary-dark)"
                  : "bg-(--theme-success-light) border-(--theme-success-light) text-(--theme-success-dark)"
              }`}
            >
              <p className="font-semibold mb-2">
                {project.isCompleted ? "This will:" : "Project summary:"}
              </p>
              <ul className="list-disc list-inside space-y-1">
                {project.isCompleted ? (
                  <>
                    <li>Reopen the project for new work</li>
                    <li>Remove the completion date</li>
                    <li>Make the project active again</li>
                  </>
                ) : (
                  <>
                    <li>{project.members.length} team members</li>
                    <li>{project.boards.length} boards</li>
                    <li>{totalTasks} total tasks</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteProject}
              disabled={loading}
              className={
                project.isCompleted
                  ? "bg-(--theme-primary) hover:bg-(--theme-primary-dark)"
                  : "bg-(--theme-success) hover:bg-(--theme-success-dark)"
              }
            >
              {loading
                ? "Processing..."
                : project.isCompleted
                ? "Reopen Project"
                : "Mark as Completed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-(--theme-danger) flex items-center gap-2">
              <FaExclamationTriangle />
              Delete Project
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              project and remove all associated data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-(--theme-danger-light) border border-(--theme-danger-light) p-4 rounded text-sm text-(--theme-danger-dark)">
              <p className="font-semibold mb-2">This will delete:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{project.members.length} team member assignments</li>
                <li>{project.boards.length} boards</li>
                <li>{totalTasks} tasks and all their data</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Type <span className="font-bold">{project.name}</span> to
                confirm
              </label>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={project.name}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={deleteConfirmation !== project.name || loading}
            >
              {loading ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
