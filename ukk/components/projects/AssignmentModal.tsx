"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface AssignmentError {
  message: string;
  unfinishedCards?: Array<{
    cardId: number;
    title: string;
    status: string;
  }>;
}

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error";
  title?: string;
  message: string;
  error?: AssignmentError;
}

export default function AssignmentModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  error,
}: AssignmentModalProps) {
  const Icon =
    type === "success"
      ? CheckCircle2
      : type === "error"
      ? XCircle
      : AlertCircle;
  const iconColor =
    type === "success"
      ? "text-(--theme-success)"
      : "text-(--theme-danger)";
  const defaultTitle = type === "success" ? "Success" : "Assignment Failed";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-800";
      case "IN_PROGRESS":
        return "bg-(--theme-primary-light) text-(--theme-primary-dark)";
      case "REVIEW":
        return "bg-(--theme-secondary-light)/10 text-(--theme-secondary-dark)";
      case "DONE":
        return "bg-(--theme-success-light) text-(--theme-success-dark)";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full p-2 ${
                type === "success"
                  ? "bg-(--theme-success-light)"
                  : "bg-(--theme-danger-light)"
              }`}
            >
              <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
            </div>
            <DialogTitle className="text-lg sm:text-xl">
              {title || defaultTitle}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-3 sm:pt-4 text-sm sm:text-base">
            {message}
          </DialogDescription>

          {/* Show unfinished cards if available */}
          {error?.unfinishedCards && error.unfinishedCards.length > 0 && (
            <div className="mt-3 sm:mt-4 rounded-lg border bg-(--theme-warning-light)/10 p-3 sm:p-4">
              <p className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-(--theme-warning-dark)">
                User currently has {error.unfinishedCards.length} unfinished
                task(s):
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {error.unfinishedCards.map((card) => (
                  <div
                    key={card.cardId}
                    className="flex items-center justify-between gap-2 rounded-md bg-white p-2 sm:p-3 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {card.title}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        Card #{card.cardId}
                      </p>
                    </div>
                    <Badge
                      className={`${getStatusColor(
                        card.status
                      )} text-[10px] sm:text-xs whitespace-nowrap`}
                      variant="secondary"
                    >
                      {card.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-(--theme-warning-dark)">
                💡 Please wait for the user to complete their current tasks
                before assigning new ones.
              </p>
            </div>
          )}
        </DialogHeader>
        <DialogFooter className="mt-4 sm:mt-6">
          <Button
            onClick={onClose}
            className={`w-full sm:w-auto ${
              type === "success"
                ? "bg-(--theme-success) hover:bg-(--theme-success-dark)"
                : "bg-(--theme-danger) hover:bg-(--theme-danger-dark)"
            }`}
          >
            {type === "success" ? "Great!" : "Got it"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
