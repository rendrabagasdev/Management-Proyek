"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePusherEvent } from "@/lib/pusher-client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FaArrowLeft,
  FaPlay,
  FaStop,
  FaClock,
  FaComment,
  FaCheckCircle,
  FaEdit,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
import { Priority, Status, ProjectRole } from "@prisma/client";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import AssignmentModal from "@/components/projects/AssignmentModal";

interface CardDetailProps {
  card: {
    id: number;
    title: string;
    description: string | null;
    priority: Priority;
    status: Status;
    dueDate: Date | null;
    assigneeId: number | null;
    createdAt: Date;
    updatedAt: Date;
    creator: {
      id: number;
      name: string;
      email: string;
    };
    board: {
      id: number;
      name: string;
      project: {
        id: number;
        name: string;
      };
    };
    subtasks: Array<{
      id: number;
      title: string;
      status: Status;
      assignee: {
        id: number;
        name: string;
      } | null;
    }>;
    comments: Array<{
      id: number;
      text: string;
      createdAt: Date;
      user: {
        id: number;
        name: string;
        email: string;
      };
    }>;
    timeLogs: Array<{
      id: number;
      startTime: Date;
      endTime: Date | null;
      durationMinutes: number | null;
      notes: string | null;
      user: {
        id: number;
        name: string;
      };
    }>;
  };
  project: {
    id: number;
    name: string;
  };
  userId: number;
  userRole: ProjectRole | "LEADER" | null;
  isCreator: boolean;
}

const priorityColors: Record<Priority, string> = {
  LOW: "bg-blue-100 text-blue-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
};

const statusColors: Record<Status, string> = {
  TODO: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  REVIEW: "bg-purple-100 text-purple-800",
  DONE: "bg-green-100 text-green-800",
};

export default function CardDetail({
  card: initialCard,
  project,
  userId,
  userRole,
  isCreator,
}: CardDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [card, setCard] = useState(initialCard);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [currentTime, setCurrentTime] = useState(0);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: card.title,
    description: card.description || "",
    priority: card.priority,
    status: card.status,
    dueDate: card.dueDate
      ? new Date(card.dueDate).toISOString().split("T")[0]
      : "",
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Modal state for feedback
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    message: string;
    error?: {
      message: string;
      unfinishedCards?: Array<{
        cardId: number;
        title: string;
        status: string;
      }>;
    };
  }>({
    isOpen: false,
    type: "success",
    message: "",
  });

  // Check if user has active timer
  const activeTimer = card.timeLogs.find(
    (log) => log.user.id === userId && log.endTime === null
  );

  // Calculate total time (completed only)
  const completedTime = card.timeLogs.reduce(
    (sum, log) => sum + (log.endTime ? log.durationMinutes || 0 : 0),
    0
  );

  // Real-time timer counter
  useEffect(() => {
    if (!activeTimer) {
      setCurrentTime(0);
      return;
    }

    // Calculate elapsed time since timer started
    const updateElapsed = () => {
      const elapsed = Math.floor(
        (Date.now() - new Date(activeTimer.startTime).getTime()) / 1000
      );
      setCurrentTime(elapsed);
    };

    updateElapsed(); // Initial update
    const interval = setInterval(updateElapsed, 1000); // Update every second

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Total time = completed + current running
  const totalTime = completedTime + currentTime;

  // Calculate subtask progress
  const completedSubtasks = card.subtasks.filter(
    (st) => st.status === "DONE"
  ).length;
  const subtaskProgress =
    card.subtasks.length > 0
      ? (completedSubtasks / card.subtasks.length) * 100
      : 0;

  const canEdit = userRole === "LEADER" || isCreator;
  const isAssignedMember = card.assigneeId === userId && !canEdit; // Member yang di-assign (bukan LEADER/creator)
  const canManageSubtasks = canEdit || isAssignedMember;

  // Realtime: Listen to card updated
  usePusherEvent(`card-${card.id}`, "card:updated", (data) => {
    const eventData = data as Record<string, unknown>;
    const { card: updatedCard, userId: eventUserId } = eventData;
    if (eventUserId !== userId) {
      toast({
        title: "Card Updated",
        description: "This card was updated by another user",
      });
    }
    setCard(updatedCard as typeof card);
  });

  // Realtime: Listen to card assigned
  usePusherEvent(`card-${card.id}`, "card:assigned", (data) => {
    const eventData = data as Record<string, unknown>;
    const { card: updatedCard, userId: eventUserId } = eventData;
    if (eventUserId !== userId) {
      toast({
        title: "Card Assigned",
        description: "This card was assigned to someone",
      });
    }
    setCard(updatedCard as typeof card);
  });

  // Realtime: Listen to comment created
  usePusherEvent(`card-${card.id}`, "comment:created", (data) => {
    const eventData = data as Record<string, unknown>;
    const { comment: newComment, userId: eventUserId } = eventData;
    const typedComment = newComment as (typeof card.comments)[0];
    if (eventUserId !== userId) {
      toast({
        title: "New Comment",
        description: `${typedComment.user.name} added a comment`,
      });
    }
    setCard((prev) => ({
      ...prev,
      comments: [typedComment, ...prev.comments],
    }));
  });

  // Realtime: Listen to subtask created
  usePusherEvent(`card-${card.id}`, "subtask:created", (data) => {
    const eventData = data as Record<string, unknown>;
    const { subtask, userId: eventUserId } = eventData;
    const typedSubtask = subtask as (typeof card.subtasks)[0];
    if (eventUserId !== userId) {
      toast({
        title: "Subtask Created",
        description: "A new subtask was added",
      });
    }
    setCard((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, typedSubtask],
    }));
  });

  // Realtime: Listen to subtask updated
  usePusherEvent(`card-${card.id}`, "subtask:updated", (data) => {
    const eventData = data as Record<string, unknown>;
    const { subtask: updatedSubtask, userId: eventUserId } = eventData;
    const typedSubtask = updatedSubtask as (typeof card.subtasks)[0];
    if (eventUserId !== userId) {
      toast({
        title: "Subtask Updated",
        description: "A subtask was updated",
      });
    }
    setCard((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((st) =>
        st.id === typedSubtask.id ? typedSubtask : st
      ),
    }));
  });

  // Realtime: Listen to subtask deleted
  usePusherEvent(`card-${card.id}`, "subtask:deleted", (data) => {
    const eventData = data as Record<string, unknown>;
    const { subtaskId, userId: eventUserId } = eventData;
    if (eventUserId !== userId) {
      toast({
        title: "Subtask Deleted",
        description: "A subtask was removed",
        variant: "destructive",
      });
    }
    setCard((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((st) => st.id !== subtaskId),
    }));
  });

  // Realtime: Listen to time log started
  usePusherEvent(`card-${card.id}`, "timelog:started", (data) => {
    const eventData = data as Record<string, unknown>;
    const { timeLog, userId: eventUserId } = eventData;
    const typedTimeLog = timeLog as (typeof card.timeLogs)[0];
    if (eventUserId !== userId) {
      toast({
        title: "Timer Started",
        description: `${typedTimeLog.user.name} started working on this card`,
      });
    }
    setCard((prev) => ({
      ...prev,
      timeLogs: [typedTimeLog, ...prev.timeLogs],
    }));
  });

  // Realtime: Listen to time log stopped
  usePusherEvent(`card-${card.id}`, "timelog:stopped", (data) => {
    const eventData = data as Record<string, unknown>;
    const { timeLog: updatedLog, userId: eventUserId } = eventData;
    const typedTimeLog = updatedLog as (typeof card.timeLogs)[0];
    if (eventUserId !== userId) {
      toast({
        title: "Timer Stopped",
        description: `${typedTimeLog.user.name} stopped the timer`,
      });
    }
    setCard((prev) => ({
      ...prev,
      timeLogs: prev.timeLogs.map((log) =>
        log.id === typedTimeLog.id ? typedTimeLog : log
      ),
    }));
  });

  // Add comment
  const handleAddComment = async () => {
    if (!comment.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/cards/${card.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: comment }),
      });

      if (response.ok) {
        setComment("");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle timer
  const handleToggleTimer = async () => {
    setLoading(true);
    try {
      if (activeTimer) {
        // Stop timer
        await fetch(`/api/cards/${card.id}/time`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeLogId: activeTimer.id }),
        });
      } else {
        // Start timer: server will atomically assign the card and set status to IN_PROGRESS
        const postResp = await fetch(`/api/cards/${card.id}/time`, {
          method: "POST",
        });

        if (!postResp.ok) {
          const err = await postResp.json().catch(() => ({}));
          setModalState({
            isOpen: true,
            type: "error",
            message: err?.error || "Failed to start timer",
          });
          setLoading(false);
          return;
        }
      }
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle timer:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add subtask
  const handleAddSubtask = async () => {
    if (!subtaskTitle.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/cards/${card.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: subtaskTitle }),
      });

      if (response.ok) {
        setSubtaskTitle("");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to add subtask:", error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle subtask status
  const handleToggleSubtask = async (
    subtaskId: number,
    currentStatus: Status
  ) => {
    setLoading(true);
    try {
      const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
      await fetch(`/api/cards/${card.id}/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle subtask:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete subtask
  const handleDeleteSubtask = async (subtaskId: number) => {
    if (!confirm("Are you sure you want to delete this subtask?")) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/cards/${card.id}/subtasks/${subtaskId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        router.refresh();
      } else {
        setModalState({
          isOpen: true,
          type: "error",
          message: "Failed to delete subtask",
        });
      }
    } catch (error) {
      console.error("Failed to delete subtask:", error);
      setModalState({
        isOpen: true,
        type: "error",
        message: "Failed to delete subtask",
      });
    } finally {
      setLoading(false);
    }
  };

  // Edit card
  const handleEditCard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description || null,
          priority: editForm.priority,
          status: editForm.status,
          dueDate: editForm.dueDate || null,
        }),
      });

      if (response.ok) {
        setEditDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to edit card:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete card
  const handleDeleteCard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push(`/projects/${project.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete card:", error);
    } finally {
      setLoading(false);
    }
  };

  // Complete card (move to REVIEW)
  const handleCompleteCard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVIEW" }),
      });

      if (response.ok) {
        router.refresh();
        toast({
          title: "Card Completed",
          description: "Card moved to Review",
        });
      } else {
        const error = await response.json();
        setModalState({
          isOpen: true,
          type: "error",
          message: error.error || "Failed to complete card",
        });
      }
    } catch (error) {
      console.error("Failed to complete card:", error);
      setModalState({
        isOpen: true,
        type: "error",
        message: "Failed to complete card",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/projects/${project.id}`}>
              <FaArrowLeft className="mr-2" />
              Back to Project
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Info */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {card.title}
                    </CardTitle>
                    <CardDescription>
                      in {card.board.name} • {project.name}
                    </CardDescription>
                  </div>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditDialogOpen(true)}
                    >
                      <FaEdit className="mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Badges */}
                <div className="flex gap-2 flex-wrap">
                  <Badge className={priorityColors[card.priority]}>
                    {card.priority} Priority
                  </Badge>
                  <Badge className={statusColors[card.status]}>
                    {card.status.replace("_", " ")}
                  </Badge>
                  {card.dueDate && (
                    <Badge variant="outline">
                      Due:{" "}
                      {new Date(card.dueDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {card.description || "No description provided"}
                  </p>
                </div>

                {/* Metadata */}
                <div className="text-sm text-gray-500 border-t pt-4">
                  <p>Created by {card.creator.name}</p>
                  <p>Created {formatRelativeTime(card.createdAt)}</p>
                  <p>Updated {formatRelativeTime(card.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Subtasks */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Subtasks</CardTitle>
                  <span className="text-sm text-gray-500">
                    {completedSubtasks}/{card.subtasks.length}
                  </span>
                </div>
                {card.subtasks.length > 0 && (
                  <Progress value={subtaskProgress} className="h-2 mt-2" />
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {card.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <button
                      onClick={() =>
                        handleToggleSubtask(subtask.id, subtask.status)
                      }
                      disabled={loading}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        subtask.status === "DONE"
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300"
                      }`}
                    >
                      {subtask.status === "DONE" && (
                        <FaCheckCircle className="text-white text-xs" />
                      )}
                    </button>
                    <span
                      className={`flex-1 ${
                        subtask.status === "DONE"
                          ? "line-through text-gray-500"
                          : ""
                      }`}
                    >
                      {subtask.title}
                    </span>
                    {subtask.assignee && (
                      <span className="text-xs text-gray-500">
                        {subtask.assignee.name}
                      </span>
                    )}
                    {canManageSubtasks && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash className="text-xs" />
                      </Button>
                    )}
                  </div>
                ))}

                {/* Add Subtask */}
                {canManageSubtasks && (
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Add a subtask..."
                      value={subtaskTitle}
                      onChange={(e) => setSubtaskTitle(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleAddSubtask()
                      }
                      disabled={loading}
                    />
                    <Button
                      onClick={handleAddSubtask}
                      disabled={loading || !subtaskTitle.trim()}
                      size="sm"
                    >
                      <FaPlus />
                    </Button>
                  </div>
                )}

                {card.subtasks.length === 0 && !canManageSubtasks && (
                  <p className="text-center text-gray-500 py-4">
                    No subtasks yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaComment />
                  Comments ({card.comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Comment List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {card.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border-l-2 border-blue-500 pl-4"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm">
                          {comment.user.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {comment.text}
                      </p>
                    </div>
                  ))}
                  {card.comments.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>

                {/* Add Comment */}
                <div className="space-y-2 pt-4 border-t">
                  <Textarea
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    disabled={loading}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={loading || !comment.trim()}
                    size="sm"
                  >
                    Add Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Time Tracker */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FaClock />
                  Time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatDuration(totalTime)}
                  </div>
                  <p className="text-sm text-gray-500">
                    {activeTimer ? "Running..." : "Total Time Logged"}
                  </p>
                  {activeTimer && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-green-600">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      <span className="text-sm font-medium">Timer Active</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleToggleTimer}
                  disabled={loading}
                  className={`w-full ${
                    activeTimer
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {activeTimer ? (
                    <>
                      <FaStop className="mr-2" />
                      Stop Timer
                    </>
                  ) : (
                    <>
                      <FaPlay className="mr-2" />
                      Start Timer
                    </>
                  )}
                </Button>

                {/* Recent Time Logs */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm mb-3">Recent Logs</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {card.timeLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="text-xs p-2 bg-gray-50 rounded"
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{log.user.name}</span>
                          {log.durationMinutes && (
                            <span className="text-blue-600 font-semibold">
                              {formatDuration(log.durationMinutes)}
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500">
                          {new Date(log.startTime).toLocaleString()}
                          {log.endTime === null && (
                            <span className="text-green-600 ml-2">
                              ● Active
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {card.timeLogs.length === 0 && (
                      <p className="text-gray-500 text-center py-2">
                        No time logs yet
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {(canEdit || isAssignedMember) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Complete Card Button (for assigned member) */}
                  {isAssignedMember && card.status === "IN_PROGRESS" && (
                    <Button
                      className="w-full justify-start bg-purple-500 hover:bg-purple-600 text-white"
                      onClick={handleCompleteCard}
                      disabled={loading}
                    >
                      <FaCheckCircle className="mr-2" />
                      Selesaikan Card (Review)
                    </Button>
                  )}

                  {canEdit && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setEditDialogOpen(true)}
                      >
                        <FaEdit className="mr-2" />
                        Edit Card
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <FaTrash className="mr-2" />
                        Delete Card
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Card</DialogTitle>
              <DialogDescription>
                Update card details and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  placeholder="Card title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="Card description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={editForm.priority}
                    onValueChange={(value: Priority) =>
                      setEditForm({ ...editForm, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value: Status) =>
                      setEditForm({ ...editForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="REVIEW">Review</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditCard} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Card</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this card? This action cannot be
                undone. All subtasks, comments, and time logs will be deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCard}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Card"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assignment/Action Modal */}
        <AssignmentModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ ...modalState, isOpen: false })}
          type={modalState.type}
          message={modalState.message}
          error={modalState.error}
        />
      </div>
    </div>
  );
}
