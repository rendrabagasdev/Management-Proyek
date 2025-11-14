"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FaClock, FaExclamationTriangle } from "react-icons/fa";

interface OvertimeRequestDialogProps {
  cardId: number;
  cardTitle: string;
  daysOverdue: number;
  onSuccess: () => void;
}

export function OvertimeRequestDialog({
  cardId,
  cardTitle,
  daysOverdue,
  onSuccess,
}: OvertimeRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for the overtime request");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/overtime-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId,
          reason: reason.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit request");
      }

      setOpen(false);
      setReason("");
      onSuccess();
    } catch (error) {
      console.error("Submit overtime request error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to submit overtime request"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
      >
        <FaClock className="mr-2" />
        Request Overtime Approval
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaExclamationTriangle className="text-yellow-500" />
              Request Overtime Approval
            </DialogTitle>
            <DialogDescription>
              This task is <strong>{daysOverdue} day(s)</strong> overdue. You
              need leader approval to continue working on it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Task</Label>
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                {cardTitle}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason for Delay <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you need more time to complete this task..."
                className="w-full min-h-[120px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Be specific about the challenges you faced and what you need to
                complete the task.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Your request will be sent to project
                leaders for approval. You can continue working once approved.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
