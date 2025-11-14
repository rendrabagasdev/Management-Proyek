"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { FaCheck, FaTimes, FaClock } from "react-icons/fa";

interface OvertimeApproval {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string;
  daysOverdue: number;
  requestedAt: string;
  respondedAt: string | null;
  approverNotes: string | null;
  requester: {
    id: number;
    name: string;
    email: string;
  };
  approver: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface OvertimeApprovalStatusProps {
  cardId: number;
  isAssignee: boolean;
  onRefresh?: () => void;
}

export function OvertimeApprovalStatus({
  cardId,
}: OvertimeApprovalStatusProps) {
  const [approvals, setApprovals] = useState<OvertimeApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        const response = await fetch(
          `/api/overtime-approval?type=all&cardId=${cardId}`
        );
        if (response.ok) {
          const data = await response.json();
          setApprovals(data.approvals);
        }
      } catch (error) {
        console.error("Fetch approvals error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovals();
  }, [cardId]);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Loading approvals...</div>
    );
  }

  if (approvals.length === 0) {
    return null;
  }

  const pendingApproval = approvals.find((a) => a.status === "PENDING");
  const latestApproval = approvals[0];

  return (
    <div className="space-y-3">
      {/* Current Status Badge */}
      {pendingApproval && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaClock className="text-yellow-600 dark:text-yellow-400 mt-1" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Overtime Approval Pending
                </h4>
                <Badge variant="outline" className="border-yellow-500">
                  Pending
                </Badge>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Waiting for leader approval to continue working on this overdue
                task.
              </p>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                Requested {format(new Date(pendingApproval.requestedAt), "PPp")}
              </div>
            </div>
          </div>
        </div>
      )}

      {!pendingApproval && latestApproval?.status === "APPROVED" && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaCheck className="text-green-600 dark:text-green-400 mt-1" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-green-800 dark:text-green-200">
                  Overtime Approved
                </h4>
                <Badge
                  variant="outline"
                  className="border-green-500 bg-green-50 dark:bg-green-950"
                >
                  Approved
                </Badge>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Approved by {latestApproval.approver?.name}
              </p>
              {latestApproval.approverNotes && (
                <div className="text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 p-2 rounded">
                  <strong>Note:</strong> {latestApproval.approverNotes}
                </div>
              )}
              <div className="text-xs text-green-600 dark:text-green-400">
                {latestApproval.respondedAt &&
                  format(new Date(latestApproval.respondedAt), "PPp")}
              </div>
            </div>
          </div>
        </div>
      )}

      {!pendingApproval && latestApproval?.status === "REJECTED" && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaTimes className="text-red-600 dark:text-red-400 mt-1" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-red-800 dark:text-red-200">
                  Overtime Request Rejected
                </h4>
                <Badge
                  variant="outline"
                  className="border-red-500 bg-red-50 dark:bg-red-950"
                >
                  Rejected
                </Badge>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                Rejected by {latestApproval.approver?.name}
              </p>
              {latestApproval.approverNotes && (
                <div className="text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                  <strong>Reason:</strong> {latestApproval.approverNotes}
                </div>
              )}
              <div className="text-xs text-red-600 dark:text-red-400">
                {latestApproval.respondedAt &&
                  format(new Date(latestApproval.respondedAt), "PPp")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {approvals.length > 1 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            View Approval History ({approvals.length})
          </summary>
          <div className="mt-3 space-y-2">
            {approvals.map((approval) => (
              <div
                key={approval.id}
                className="text-sm p-3 border rounded-lg bg-muted/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {approval.status === "PENDING" && "Pending"}
                    {approval.status === "APPROVED" && "✓ Approved"}
                    {approval.status === "REJECTED" && "✗ Rejected"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(approval.requestedAt), "PP")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {approval.reason}
                </p>
                {approval.approver && (
                  <p className="text-xs text-muted-foreground mt-1">
                    by {approval.approver.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
