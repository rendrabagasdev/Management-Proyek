"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaPlus, FaClock, FaComment, FaCheckCircle } from "react-icons/fa";
import Link from "next/link";
import { Priority, Status, ProjectRole } from "@prisma/client";
import { formatDuration } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AssignmentModal from "@/components/projects/AssignmentModal";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseEvent } from "@/lib/firebase-hooks";

interface KanbanBoardProps {
  project: {
    id: number;
    members: Array<{
      userId: number;
      projectRole: ProjectRole;
      user: {
        id: number;
        name: string;
        email: string;
      };
    }>;
    boards: Array<{
      id: number;
      name: string;
      cards: Array<{
        id: number;
        title: string;
        description: string | null;
        priority: Priority;
        status: Status;
        dueDate: Date | null;
        deadline: Date | null;
        assigneeId: number | null;
        creator: {
          id: number;
          name: string;
        };
        subtasks: Array<{
          id: number;
          status: Status;
        }>;
        comments: Array<{
          id: number;
        }>;
        timeLogs: Array<{
          id: number;
          durationMinutes: number | null;
        }>;
      }>;
    }>;
  };
  userId: number;
  userRole: ProjectRole | "LEADER" | null;
  isCreator: boolean;
}

const priorityColors: Record<Priority, string> = {
  LOW: "border-l-blue-500",
  MEDIUM: "border-l-yellow-500",
  HIGH: "border-l-red-500",
};

const priorityBadgeColors: Record<Priority, string> = {
  LOW: "bg-(--theme-primary-light) text-(--theme-primary-dark)",
  MEDIUM: "bg-(--theme-accent-light) text-(--theme-accent-dark)",
  HIGH: "bg-(--theme-danger-light) text-(--theme-danger-dark)",
};

export default function KanbanBoard({
  project,
  userId,
  userRole,
  isCreator,
}: KanbanBoardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [boards, setBoards] = useState(project.boards);
  const [movingCardId, setMovingCardId] = useState<number | null>(null);
  const [assigningCardId, setAssigningCardId] = useState<number | null>(null);
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
  const canCreateCard = userRole === "LEADER" || isCreator;
  const canMoveCard = userRole === "LEADER" || isCreator;
  const canAssignCard = userRole === "LEADER" || isCreator;

  // Sync state when project.boards changes (e.g., after router.refresh())
  useEffect(() => {
    setBoards(project.boards);
  }, [project.boards]);

  // For members, only show cards assigned to them
  const isMember = userRole !== "LEADER" && !isCreator;

  // Realtime: Listen to card created
  useFirebaseEvent(`projects/${project.id}/events`, "card:created", (data) => {
    const eventData = data as Record<string, unknown>;
    const { userId: eventUserId } = eventData;
    if (eventUserId !== userId) {
      toast({
        title: "New Card Created",
        description: "A new card was created",
      });
    }
    router.refresh(); // Fetch fresh data from database
  });

  // Realtime: Listen to card updated
  useFirebaseEvent(`projects/${project.id}/events`, "card:updated", (data) => {
    const eventData = data as Record<string, unknown>;
    const { userId: eventUserId } = eventData;
    if (eventUserId !== userId) {
      toast({
        title: "Card Updated",
        description: "A card was updated",
      });
    }
    router.refresh(); // Fetch fresh data from database
  });

  // Realtime: Listen to card deleted
  useFirebaseEvent(`projects/${project.id}/events`, "card:deleted", (data) => {
    const eventData = data as Record<string, unknown>;
    const { userId: eventUserId } = eventData;
    if (eventUserId !== userId) {
      toast({
        title: "Card Deleted",
        description: "A card was deleted",
        variant: "destructive",
      });
    }
    router.refresh(); // Fetch fresh data from database
  });

  // Realtime: Listen to card assigned
  useFirebaseEvent(`projects/${project.id}/events`, "card:assigned", (data) => {
    const eventData = data as Record<string, unknown>;
    const { userId: eventUserId } = eventData;
    if (eventUserId !== userId) {
      toast({
        title: "Card Assigned",
        description: "A card was assigned",
      });
    }
    router.refresh(); // Fetch fresh data from database
  });

  const filterCardsByUser = (cards: (typeof project.boards)[0]["cards"]) => {
    if (isMember) {
      return cards.filter((card) => card.assigneeId === userId);
    }
    return cards;
  };

  const handleMoveCard = async (cardId: number, newStatus: Status) => {
    setMovingCardId(cardId);
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show error modal
        setModalState({
          isOpen: true,
          type: "error",
          message: data.error || "Failed to move card",
        });
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Error moving card:", error);
      setModalState({
        isOpen: true,
        type: "error",
        message: "Failed to move card. Please try again.",
      });
    } finally {
      setMovingCardId(null);
    }
  };

  const handleAssignCard = async (cardId: number, assigneeId: string) => {
    setAssigningCardId(cardId);
    try {
      const response = await fetch(`/api/cards/${cardId}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigneeId: assigneeId === "unassigned" ? null : parseInt(assigneeId),
          reason: "Assigned via Kanban board",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show error modal with details
        setModalState({
          isOpen: true,
          type: "error",
          message: data.message || "Failed to assign card",
          error: data.unfinishedCards
            ? {
                message: data.message,
                unfinishedCards: data.unfinishedCards,
              }
            : undefined,
        });
        return;
      }

      // Show success modal
      setModalState({
        isOpen: true,
        type: "success",
        message: "Card assigned successfully!",
      });

      // Refresh after a short delay
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error) {
      console.error("Error assigning card:", error);
      setModalState({
        isOpen: true,
        type: "error",
        message: "Failed to assign card. Please try again.",
      });
    } finally {
      setAssigningCardId(null);
    }
  };

  // Group cards by status for Kanban view
  const allCards = boards.flatMap((board) => board.cards);
  const filteredCards = filterCardsByUser(allCards);

  // Filter available members for assignment (exclude OBSERVER)
  const getAvailableMembersForCard = () => {
    return project.members.filter(
      (member) => member.projectRole !== "OBSERVER"
    );
  };

  const todoCards = filteredCards.filter((card) => card.status === "TODO");
  const inProgressCards = filteredCards.filter(
    (card) => card.status === "IN_PROGRESS"
  );
  const reviewCards = filteredCards.filter((card) => card.status === "REVIEW");
  const doneCards = filteredCards.filter((card) => card.status === "DONE");

  const columns = [
    { title: "To Do", status: "TODO", cards: todoCards, color: "bg-muted/50" },
    {
      title: "In Progress",
      status: "IN_PROGRESS",
      cards: inProgressCards,
      color: "bg-(--theme-primary-light)/20",
    },
    {
      title: "Review",
      status: "REVIEW",
      cards: reviewCards,
      color: "bg-(--theme-secondary-light)/20",
    },
    {
      title: "Done",
      status: "DONE",
      cards: doneCards,
      color: "bg-(--theme-success-light)/20",
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.status} className="flex flex-col">
            <Card className={`${column.color} border-2`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold">
                    {column.title}
                  </CardTitle>
                  <Badge variant="secondary">{column.cards.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {column.cards.map((card) => {
                  const completedSubtasks =
                    card.subtasks?.filter((st) => st.status === "DONE")
                      .length || 0;
                  const totalSubtasks = card.subtasks?.length || 0;
                  const totalTime =
                    card.timeLogs?.reduce(
                      (sum, log) => sum + (log.durationMinutes || 0),
                      0
                    ) || 0;

                  // Deadline calculations
                  let deadlineInfo = null;
                  if (card.deadline) {
                    const deadline = new Date(card.deadline);
                    const now = new Date();
                    const isOverdue = deadline < now && card.status !== "DONE";
                    const daysLeft = Math.ceil(
                      (deadline.getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const isApproaching =
                      daysLeft > 0 && daysLeft <= 3 && card.status !== "DONE";

                    deadlineInfo = {
                      deadline,
                      isOverdue,
                      isApproaching,
                      daysLeft,
                    };
                  }

                  return (
                    <Card
                      key={card.id}
                      className={`border-l-4 ${
                        priorityColors[card.priority]
                      } hover:shadow-md transition-shadow bg-card ${
                        movingCardId === card.id ? "opacity-50" : ""
                      }`}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <Link href={`/cards/${card.id}`} className="flex-1">
                            <h3 className="font-semibold text-sm line-clamp-2 hover:text-(--theme-primary)">
                              {card.title}
                            </h3>
                          </Link>
                          <Badge
                            className={`${
                              priorityBadgeColors[card.priority]
                            } text-xs`}
                          >
                            {card.priority}
                          </Badge>
                        </div>

                        {card.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {card.description}
                          </p>
                        )}

                        {/* Deadline Warning */}
                        {deadlineInfo && (
                          <div
                            className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                              deadlineInfo.isOverdue
                                ? "bg-destructive/10 text-destructive font-semibold"
                                : deadlineInfo.isApproaching
                                ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            {deadlineInfo.isOverdue ? (
                              <>
                                <FaClock className="w-3 h-3" />
                                <span>
                                  Overdue:{" "}
                                  {deadlineInfo.deadline.toLocaleDateString()}
                                </span>
                              </>
                            ) : deadlineInfo.isApproaching ? (
                              <>
                                <FaClock className="w-3 h-3" />
                                <span>
                                  Due in {deadlineInfo.daysLeft} day
                                  {deadlineInfo.daysLeft > 1 ? "s" : ""}:{" "}
                                  {deadlineInfo.deadline.toLocaleDateString()}
                                </span>
                              </>
                            ) : (
                              <>
                                <FaClock className="w-3 h-3" />
                                <span>
                                  Due:{" "}
                                  {deadlineInfo.deadline.toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Move Card Dropdown */}
                        {canMoveCard && (
                          <div
                            className="pt-2 border-t space-y-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Select
                              value={card.status}
                              onValueChange={(value) =>
                                handleMoveCard(card.id, value as Status)
                              }
                              disabled={movingCardId === card.id}
                            >
                              <SelectTrigger className="w-full h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TODO">📋 To Do</SelectItem>
                                <SelectItem value="IN_PROGRESS">
                                  🔥 In Progress
                                </SelectItem>
                                <SelectItem value="REVIEW">
                                  👀 Review
                                </SelectItem>
                                <SelectItem value="DONE">✅ Done</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Assign Card Dropdown */}
                            {canAssignCard && (
                              <Select
                                value={
                                  card.assigneeId?.toString() || "unassigned"
                                }
                                onValueChange={(value) =>
                                  handleAssignCard(card.id, value)
                                }
                                disabled={assigningCardId === card.id}
                              >
                                <SelectTrigger className="w-full h-7 text-xs">
                                  <SelectValue placeholder="👤 Assign to..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">
                                    👤 Unassigned
                                  </SelectItem>
                                  {getAvailableMembersForCard().map(
                                    (member) => (
                                      <SelectItem
                                        key={member.userId}
                                        value={member.userId.toString()}
                                      >
                                        {member.user.name}
                                        {member.userId === card.assigneeId &&
                                          " (current)"}
                                        {member.projectRole === "LEADER" &&
                                          " 👑"}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        )}

                        {/* Card metadata */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2">
                          {totalSubtasks > 0 && (
                            <div className="flex items-center gap-1">
                              <FaCheckCircle className="w-3 h-3" />
                              <span>
                                {completedSubtasks}/{totalSubtasks}
                              </span>
                            </div>
                          )}
                          {(card.comments?.length || 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <FaComment className="w-3 h-3" />
                              <span>{card.comments?.length || 0}</span>
                            </div>
                          )}
                          {totalTime > 0 && (
                            <div className="flex items-center gap-1">
                              <FaClock className="w-3 h-3" />
                              <span>{formatDuration(totalTime)}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground/70 pt-1 border-t flex justify-between items-center">
                          <span>by {card.creator.name}</span>
                          {card.assigneeId && (
                            <span className="text-(--theme-primary) font-medium">
                              →{" "}
                              {project.members.find(
                                (m) => m.userId === card.assigneeId
                              )?.user.name || "Unknown"}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Add Card Button */}
                {canCreateCard && (
                  <Button
                    variant="outline"
                    className="w-full border-dashed"
                    asChild
                  >
                    <Link href={`/projects/${project.id}/cards/new`}>
                      <FaPlus className="mr-2" />
                      Add Card
                    </Link>
                  </Button>
                )}

                {column.cards.length === 0 && !canCreateCard && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    No cards yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        type={modalState.type}
        message={modalState.message}
        error={modalState.error}
      />
    </div>
  );
}
