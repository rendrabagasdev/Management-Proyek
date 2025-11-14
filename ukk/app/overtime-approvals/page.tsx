"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FaCheck, FaTimes, FaClock, FaExternalLinkAlt } from "react-icons/fa";

interface OvertimeApproval {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string;
  daysOverdue: number;
  requestedAt: string;
  card: {
    id: number;
    title: string;
    board: {
      project: {
        id: number;
        name: string;
      };
    };
  };
  requester: {
    id: number;
    name: string;
    email: string;
  };
}

export default function OvertimeApprovalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [approvals, setApprovals] = useState<OvertimeApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedApproval, setSelectedApproval] =
    useState<OvertimeApproval | null>(null);
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (
      session &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "LEADER"
    ) {
      router.push("/dashboard");
      return;
    }

    fetchApprovals();
  }, [status, session, router]);

  const fetchApprovals = async () => {
    try {
      const response = await fetch(
        "/api/overtime-approval?type=pending-approvals"
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

  const handleProcess = async () => {
    if (!selectedApproval) return;

    setProcessingId(selectedApproval.id);
    try {
      const response = await fetch("/api/overtime-approval", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalId: selectedApproval.id,
          action,
          approverNotes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process request");
      }

      // Refresh list
      await fetchApprovals();
      setSelectedApproval(null);
      setNotes("");
    } catch (error) {
      console.error("Process approval error:", error);
      alert("Failed to process request");
    } finally {
      setProcessingId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Overtime Approval Requests</h1>
        <p className="text-muted-foreground">
          Review and approve/reject overtime requests from team members
        </p>
      </div>

      {approvals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FaClock className="mx-auto text-4xl text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
            <p className="text-muted-foreground">
              All overtime requests have been processed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {approvals.map((approval) => (
            <Card key={approval.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {approval.card.title}
                      <Link
                        href={`/cards/${approval.card.id}`}
                        target="_blank"
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        <FaExternalLinkAlt className="w-4 h-4" />
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {approval.card.board.project.name}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-yellow-500">
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Requested by:</span>
                    <p className="font-medium">{approval.requester.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days Overdue:</span>
                    <p className="font-medium text-red-600">
                      {approval.daysOverdue} days
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Requested:</span>
                    <p className="font-medium">
                      {format(new Date(approval.requestedAt), "PPp")}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">
                    Reason for Delay:
                  </span>
                  <p className="mt-1 p-3 bg-muted rounded-md text-sm">
                    {approval.reason}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedApproval(approval);
                      setAction("approve");
                      setNotes("");
                    }}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={processingId !== null}
                  >
                    <FaCheck className="mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedApproval(approval);
                      setAction("reject");
                      setNotes("");
                    }}
                    variant="destructive"
                    disabled={processingId !== null}
                  >
                    <FaTimes className="mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={selectedApproval !== null}
        onOpenChange={(open) => !open && setSelectedApproval(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve" : "Reject"} Overtime Request
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "Allow the team member to continue working on this overdue task."
                : "Decline the overtime request. The member should coordinate with the team."}
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  {selectedApproval.card.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Requested by {selectedApproval.requester.name} •{" "}
                  {selectedApproval.daysOverdue} days overdue
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    action === "approve"
                      ? "Add any guidelines or notes for the team member..."
                      : "Explain why this request is being rejected..."
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedApproval(null)}
              disabled={processingId !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              disabled={processingId !== null}
              className={
                action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : undefined
              }
              variant={action === "reject" ? "destructive" : "default"}
            >
              {processingId !== null
                ? "Processing..."
                : action === "approve"
                ? "Approve Request"
                : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
