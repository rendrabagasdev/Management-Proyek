"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  ListTodo,
  Calendar,
  Loader2,
  Trophy,
} from "lucide-react";
import { ProjectWithStats } from "@/types/project";

interface ProjectCompletionApprovalProps {
  initialPending?: ProjectWithStats[];
  initialCompleted?: ProjectWithStats[];
}

export default function ProjectCompletionApproval({
  initialPending = [],
  initialCompleted = [],
}: ProjectCompletionApprovalProps) {
  const [pendingProjects, setPendingProjects] = useState<ProjectWithStats[]>(
    initialPending
  );
  const [completedProjects, setCompletedProjects] = useState<ProjectWithStats[]>(
    initialCompleted
  );
  const [selectedProject, setSelectedProject] = useState<ProjectWithStats | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setInitialLoading(true);
      const response = await fetch("/api/projects/approval-status");

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      setPendingProjects(data.pending || []);
      setCompletedProjects(data.approved || []);
      setError("");
    } catch (err) {
      setError("Failed to load projects");
      console.error("Error fetching projects:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleOpenDialog = (
    project: ProjectWithStats,
    type: "approve" | "reject"
  ) => {
    setSelectedProject(project);
    setActionType(type);
    setDialogOpen(true);
    setNotes("");
    setError("");
  };

  const handleApprove = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${selectedProject.id}/approve`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve project");
      }

      // Remove from pending and add to completed
      setPendingProjects(
        pendingProjects.filter((p) => p.id !== selectedProject.id)
      );
      const approvedProject = {
        ...selectedProject,
        status: "COMPLETED" as const,
        approvedAt: new Date(),
      };
      setCompletedProjects([approvedProject, ...completedProjects]);

      setDialogOpen(false);
      setError("");
    } catch (err) {
      setError("Failed to approve project");
      console.error("Error approving project:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProject) return;

    if (!notes.trim()) {
      setError("Please provide notes for rejection");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${selectedProject.id}/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject project");
      }

      // Remove from pending
      setPendingProjects(
        pendingProjects.filter((p) => p.id !== selectedProject.id)
      );

      setDialogOpen(false);
      setError("");
    } catch (err) {
      setError("Failed to reject project");
      console.error("Error rejecting project:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading projects...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-6 max-w-7xl">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Approval
                </CardTitle>
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {pendingProjects.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting your review
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Approved Projects
                </CardTitle>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {completedProjects.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tasks
                </CardTitle>
                <ListTodo className="w-5 h-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {[...pendingProjects, ...completedProjects].reduce(
                  (sum, p) => sum + (p.totalTasks || 0),
                  0
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed across all projects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="pending" className="text-base">
              <Clock className="mr-2" />
              Pending Approval ({pendingProjects.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-base">
              <CheckCircle className="mr-2" />
              Approved ({completedProjects.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Projects Tab */}
          <TabsContent value="pending" className="space-y-4">
            {pendingProjects.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    There are no projects pending approval at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingProjects.map((project) => (
                <Card
                  key={project.id}
                  className="border-2 hover:shadow-xl transition-all duration-200"
                >
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">
                            {project.name}
                          </CardTitle>
                          <Badge className="bg-yellow-500 hover:bg-yellow-600">
                            <Clock className="mr-1" />
                            Pending
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {project.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Project Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="text-blue-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Team</p>
                          <p className="font-semibold">
                            {project.members?.length || 0} members
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ListTodo className="text-green-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tasks</p>
                          <p className="font-semibold">
                            {project.completedTasks || 0}/{project.totalTasks || 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="text-purple-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Deadline
                          </p>
                          <p className="font-semibold text-xs">
                            {formatDate(project.deadline)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-green-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Completed
                          </p>
                          <p className="font-semibold text-xs">
                            {formatDate(project.completedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Creator Info */}
                    <div className="flex items-center gap-2 text-sm border-t pt-4">
                      <span className="text-muted-foreground">Created by:</span>
                      <span>
                        {project.creator.name}
                      </span>
                      <span>({project.creator.email})</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => handleOpenDialog(project, "approve")}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2" />
                        Approve Completion
                      </Button>
                      <Button
                        onClick={() => handleOpenDialog(project, "reject")}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="mr-2" />
                        Reject & Reopen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Completed Projects Tab */}
          <TabsContent value="completed" className="space-y-4">
            {completedProjects.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Trophy className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    No Approved Projects Yet
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Approved projects will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedProjects.map((project) => (
                <Card
                  key={project.id}
                  className="border-2 border-green-200 dark:border-green-900"
                >
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">
                            {project.name}
                          </CardTitle>
                          <Badge className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="mr-1" />
                            Approved
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {project.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Project Info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Team Size
                        </p>
                        <p className="font-semibold">
                          {project.members?.length || 0} members
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Tasks
                        </p>
                        <p className="font-semibold">
                          {project.totalTasks || 0} tasks
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Completed On
                        </p>
                        <p className="font-semibold text-xs">
                          {formatDate(project.completedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Approval Info */}
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Approved by:
                        </span>
                        <span className="font-medium">
                          {project.approvedBy || "System Admin"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Approved on:
                        </span>
                        <span className="font-medium">
                          {formatDate(project.approvedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Created by:
                        </span>
                        <span className="font-medium">
                          {project.creator.name}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Action Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionType === "approve" ? (
                  <>
                    <CheckCircle className="text-green-600" />
                    Approve Project Completion
                  </>
                ) : (
                  <>
                    <XCircle className="text-red-600" />
                    Reject & Reopen Project
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve"
                  ? "Confirm that this project has been completed successfully."
                  : "Reject the completion and reopen this project for further work."}
              </DialogDescription>
            </DialogHeader>

            {selectedProject && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">{selectedProject.name}</h3>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">
                      {selectedProject.totalTasks || 0} tasks completed
                    </p>
                    <p className="text-muted-foreground">
                      {selectedProject.members?.length || 0} team members
                    </p>
                    <p className="text-muted-foreground">
                      Completed: {formatDate(selectedProject.completedAt)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">
                    Notes {actionType === "reject" && "(Required)"}
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder={
                      actionType === "approve"
                        ? "Add any notes or feedback (optional)..."
                        : "Explain why this project needs more work..."
                    }
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {actionType === "approve" ? (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      ✓ This will mark the project as officially completed and
                      move it to the completed projects list.
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      ⚠ This will reopen the project and notify the team to
                      continue working on it.
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={
                  actionType === "approve" ? handleApprove : handleReject
                }
                disabled={loading || (actionType === "reject" && !notes.trim())}
                className={
                  actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : actionType === "approve" ? (
                  <>
                    <CheckCircle className="mr-2" />
                    Approve
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2" />
                    Reject & Reopen
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
